'use server';

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createServerAction } from 'zsa';
import { z } from 'zod';
import { log, logError, logWarn } from '@/lib/logger';
import { getTextModel, getVisionModel, getModelForTier, getOpenAIKey, ensureOpenAIKey } from '@/lib/ai-config';
import type { GenerationTier } from '@/lib/ai-config';
import {
  buildUIGenerationSystemPrompt,
  buildUIGenerationUserPrompt,
  shouldUseEditMode,
  buildUIEditUserPrompt,
} from '@/lib/prompts/ui-generation-prompt';
import { UI_UX_PRO_MAX_GUIDANCE } from '@/lib/prompts/ui-ux-pro-max-guidance';
import { recommendDesignSystemMarkdown } from '@/lib/design-system/recommend-design-system';
import { STYLE_PRESET_IDS } from '@/types/theme';
import { callText, callObject } from '@/lib/ai/llm';
import type { AIResult } from '@/lib/ai/llm';

/** refineUI 默认说明（仅视觉优化，不改变结构） */
const DEFAULT_REFINE_PROMPT = '仅做视觉优化：改善层次、间距与圆角阴影，不改变布局与功能。';

/** UI 生成接口返回类型（generateUIFromText / generateUIFromImage） */
export type UIGenerationResponse =
  | { type: 'success'; code: string; requestId?: string; stages?: unknown; viewportUsed?: 'mobile' | 'desktop' }
  | { type: 'skeleton'; code: string; requestId?: string; stages?: unknown }
  | { type: 'rate_limit'; cooldownSeconds: number; requestId?: string; message?: string }
  | { type: 'network_error'; requestId?: string; message?: string; retryable?: boolean }
  | { type: 'api_error'; requestId?: string; message?: string }
  | { type: 'validation_error'; requestId?: string; message?: string }
  | { type: 'timeout'; requestId?: string; message?: string };

/** 节点编辑·需求 Tab：多轮对话更新需求或发起澄清 */
const NodeEditSpecChatSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('clarify'),
    question: z.string(),
    options: z
      .array(z.object({ id: z.string(), label: z.string(), desc: z.string().optional() }))
      .min(1)
      .max(6),
  }),
  z.object({
    kind: z.literal('updated'),
    title: z.string().optional(),
    requirements: z.array(z.string()).min(1).max(80),
  }),
]);

export type NodeEditSpecChatResult = z.infer<typeof NodeEditSpecChatSchema>;

/** 节点编辑需求/实现/测试：图片或 HTML 附件（非 UI 生成路径） */
export type NodeEditPanelMedia =
  | { kind: 'image'; base64: string; mimeType: string }
  | { kind: 'html'; snippet: string };

type NodeEditUserContentPart =
  | { type: 'text'; text: string }
  | { type: 'image'; image: string };

function buildNodeEditUserContent(
  primaryText: string,
  media?: NodeEditPanelMedia[]
): string | NodeEditUserContentPart[] {
  if (!media?.length) return primaryText;
  const parts: NodeEditUserContentPart[] = [{ type: 'text', text: primaryText }];
  for (const m of media) {
    if (m.kind === 'image') {
      parts.push({ type: 'image', image: `data:${m.mimeType};base64,${m.base64}` });
    } else {
      parts.push({
        type: 'text',
        text: `\n【用户提供的 HTML 片段】\n${m.snippet.slice(0, 60000)}`,
      });
    }
  }
  return parts;
}

export async function nodeEditSpecUserChat(input: {
  nodeLabel: string;
  currentRequirements: string[];
  userRounds: string[];
  media?: NodeEditPanelMedia[];
  aiConfig?: { visionModel?: string; textModel?: string };
}): Promise<{ ok: true; data: NodeEditSpecChatResult } | { ok: false; message: string }> {
  try {
    ensureOpenAIKey();
    const reqLines = input.currentRequirements.length
      ? input.currentRequirements.map((r, i) => `${i + 1}. ${r}`).join('\n')
      : '（暂无）';
    const roundsText = input.userRounds
      .map((r, i) => (i === 0 ? `【用户说明】${r}` : `【对追问的回复 ${i}】${r}`))
      .join('\n');
    const system = `你是产品经理。用户在「节点编辑-需求」Tab 下通过 AI 对话框修改「${input.nodeLabel}」的需求。
当前需求条目：
${reqLines}

用户可能附上产品截图、流程图、界面稿或 HTML 原型；请从中提炼业务与交互需求，与已有条目合并。
规则：
- 若用户意图明确，输出 kind=updated，给出合并后的完整需求列表（中文，每条一行语义完整）。
- 若信息不足需确认，输出 kind=clarify，给出 question 与 2–6 个选项（id 用简短英文）。`;
    const userText = `${roundsText}\n\n请严格按 schema 输出 JSON。`;
    const hasImage = input.media?.some((m) => m.kind === 'image');
    const model = hasImage ? getVisionModel(input.aiConfig) : getTextModel(input.aiConfig);
    const userContent = buildNodeEditUserContent(userText, input.media);
    const result = await callObject({
      schema: NodeEditSpecChatSchema,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userContent },
      ],
      model,
      actionName: 'nodeEditSpecUserChat',
      aiConfig: input.aiConfig,
      attachments: input.media?.some((m) => m.kind === 'image') ? 'vision' : '',
    });
    if (!result.ok) return { ok: false, message: result.message || '需求对话失败' };
    return { ok: true, data: result.data };
  } catch (e) {
    logError('nodeEditSpecUserChat', e);
    return { ok: false, message: e instanceof Error ? e.message : '需求对话失败' };
  }
}

/** 节点编辑·实现 Tab：技术/架构问答 */
export async function nodeEditImplChat(input: {
  nodeLabel: string;
  userMessage: string;
  requirements: string[];
  media?: NodeEditPanelMedia[];
  aiConfig?: { visionModel?: string; textModel?: string };
}): Promise<{ ok: true; reply: string } | { ok: false; message: string }> {
  try {
    ensureOpenAIKey();
    const reqText =
      input.requirements.length > 0
        ? input.requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')
        : '（暂无需求条目，请结合节点名称推断）';
    const q = input.userMessage.trim() || '（用户主要提供附件，请结合附件从实现角度解读与建议。）';
    const systemImpl = `你是系统架构师。用户在「节点编辑-实现」Tab 下就页面「${input.nodeLabel}」提出实现相关问题。用户可能附上截图或 HTML，请一并纳入分析。请用中文回答：可涉及 API 设计、数据表思路、模块边界等，条理清晰。`;
    const userBlock = `【当前需求摘要】\n${reqText}\n\n【用户问题】\n${q}`;
    const hasImage = input.media?.some((m) => m.kind === 'image');
    const model = hasImage ? getVisionModel(input.aiConfig) : getTextModel(input.aiConfig);
    const result =
      input.media?.length ?
        await callText({
          model,
          messages: [
            { role: 'system', content: systemImpl },
            { role: 'user', content: buildNodeEditUserContent(userBlock, input.media) },
          ],
          actionName: 'nodeEditImplChat',
          aiConfig: input.aiConfig,
          attachments: hasImage ? 'vision' : '',
        })
      : await callText({
          model,
          prompt: `${systemImpl}\n\n${userBlock}`,
          actionName: 'nodeEditImplChat',
          aiConfig: input.aiConfig,
        });
    if (!result.ok) return { ok: false, message: result.message || '回答失败' };
    return { ok: true, reply: result.data.trim() };
  } catch (e) {
    logError('nodeEditImplChat', e);
    return { ok: false, message: e instanceof Error ? e.message : '回答失败' };
  }
}

// ==================== 直接调用的函数（用于 NodeDetailPanel）====================

/**
 * 为当前页面 React 代码增加交互逻辑（日期选择、下拉、弹窗、页面跳转等）。
 * 不修改视觉样式，仅增加 useState 与事件处理。
 */
export async function addInteractionsToReact(
  code: string,
  nodeList: Array<{ id: string; label: string }>
): Promise<AIResult<{ code: string }>> {
  try {
    if (!getOpenAIKey()) {
      return {
        ok: false,
        type: 'PROVIDER',
        message: 'OPENAI_API_KEY 未配置',
        metrics: { queuedMs: 0, dedupHit: false, totalMs: 0 },
      };
    }
    const textModel = getModelForTier('quality' as GenerationTier, 'text', {});
    const pageNames = nodeList.map((n) => n.label).filter(Boolean);
    const navList =
      pageNames.length > 0
        ? `可跳转的页面节点（用于按钮点击跳转）：${pageNames.join('、')}。跳转时调用 window.__NAV_TO_NODE__('页面名称')，例如 window.__NAV_TO_NODE__('商品详情')。`
        : '';

    const systemPrompt = `You are a senior React engineer. Your ONLY job is to ADD real interaction logic to the existing React/TSX code. Do NOT change visual styles, layout, or remove any content.

STRICT RULES:
1. PRESERVE: Keep the exact same JSX structure and all className. Only ADD state and event handlers.
2. ADD INTERACTIONS:
   - Date inputs: Use <input type="date" /> or type="datetime-local" with value and onChange bound to useState (e.g. const [date, setDate] = useState(''); <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />).
   - Select/dropdown: Use useState for selected value, onChange to setState.
   - Tabs: Use useState for active tab, TabsTrigger onClick to set active, TabsContent to show only when active.
   - Modals/dialogs (MUST fully cover background): Use the \`Dialog\` component only. Pattern: \`const [open, setOpen] = useState(false); <Dialog open={open} onClose={() => setOpen(false)}><DialogHeader>标题</DialogHeader><DialogContent>...</DialogContent><DialogFooter><Button onClick={() => setOpen(false)}>确定</Button></DialogFooter></Dialog>\`. NEVER use a raw \`<div className="fixed ...">\` for modals—that causes the background to show through; Dialog provides the required overlay (遮罩) that fully covers the page.
   - Buttons that should navigate to another page: Add onClick that calls window.__NAV_TO_NODE__?.('TargetPageLabel'). Map button text or intent to the given page list. Example: "查看商品详情" or "商品详情" button -> window.__NAV_TO_NODE__?.('商品详情'); "返回" -> window.__NAV_TO_NODE__?.('首页') or the previous page name.
3. Use only React (useState). No import. All components (Button, Input, etc.) are already in scope. Use the same component names (Page or App as root).
4. OUTPUT: Return ONLY the complete .tsx code. No markdown fences, no explanations. Root must remain export default function Page() or export default function App().`;

    const userPrompt = `Add real click/input interactions to the following code.

${navList}

Current code (add interactions only, return full code):
\`\`\`tsx
${code}
\`\`\`

Return ONLY the full .tsx code with added useState and event handlers.`;

    const result = await callText({
      model: textModel,
      prompt: `${systemPrompt}\n\n${userPrompt}`,
      temperature: 0.3,
      maxOutputTokens: 16000,
      actionName: 'addInteractionsToReact',
      aiConfig: {},
    });

    if (!result.ok) return result;

    const cleanedCode = result.data
      .trim()
      .replace(/^```(?:tsx|jsx|ts|js)?\n?/gm, '')
      .replace(/\n?```$/gm, '')
      .trim();

    return {
      ok: true,
      data: { code: cleanedCode },
      metrics: result.metrics,
    };
  } catch (error) {
    logError('❌ [addInteractionsToReact] Error:', error);
    return {
      ok: false,
      type: 'PROVIDER',
      message: error instanceof Error ? error.message : '增加交互失败',
      metrics: { queuedMs: 0, dedupHit: false, totalMs: 0 },
    };
  }
}

export async function refineUI(
  htmlCode: string,
  refinementPrompt: string = DEFAULT_REFINE_PROMPT
): Promise<AIResult<{ code: string }>> {
  try {
    if (!getOpenAIKey()) {
      return {
        ok: false,
        type: 'PROVIDER',
        message: 'OPENAI_API_KEY 未配置',
        metrics: { queuedMs: 0, dedupHit: false, totalMs: 0 },
      };
    }

    // 美化使用 quality 模型，保证效果
    const textModel = getModelForTier('quality' as GenerationTier, 'text', {});
    
    const systemPrompt = `You are a senior UI/visual polish expert. Your ONLY job is to make the existing React/TSX code look better visually, without breaking anything.

STRICT RULES (must follow):
1. PRESERVE: Keep the exact same component structure, JSX tree, and all functionality. Do NOT remove or merge elements.
2. PRESERVE: Keep all existing className values that are already good; only add or refine (e.g. add shadow, rounded, spacing).
3. ENHANCE ONLY: Improve typography hierarchy (titles bolder/larger, body text gray-600), spacing (p-4/p-6, gap-4), rounded corners (rounded-lg/xl), subtle shadows (shadow-md/shadow-lg), and color contrast. Use Tailwind only.
4. CONSISTENCY: Buttons: prefer bg-cyan-500 or bg-teal-500; cards: rounded-lg/xl + shadow + padding; text on white: text-gray-900 for titles, text-gray-600 for body.
5. PREMIUM: One clear focal point per section; generous whitespace (p-4/p-6, gap-4/gap-6); single accent color only; restrained shadows (shadow-md/lg), no multi-color clutter.
6. OUTPUT: Return ONLY the complete refined .tsx code. No markdown fences, no explanations, no comments. The code must be runnable as-is.`;

    const userPrompt = `Apply visual polish only. User instruction: ${refinementPrompt}

Current code (refine in place, return full code):
\`\`\`tsx
${htmlCode}
\`\`\`

Return ONLY the full refined .tsx code, no markdown or explanations.`;

    const result = await callText({
      model: textModel,
      prompt: `${systemPrompt}\n\n${userPrompt}`,
      temperature: 0.25,
      maxOutputTokens: 16000,
      actionName: 'refineUI',
      aiConfig: {},
    });

    if (!result.ok) {
      return result;
    }

    const refinedCode = result.data.trim();
    
    // Remove markdown code blocks if present
    const cleanedCode = refinedCode
      .replace(/^```(?:tsx|jsx|ts|js)?\n?/gm, '')
      .replace(/```$/gm, '')
      .trim();

    return {
      ok: true,
      data: { code: cleanedCode },
      metrics: result.metrics,
    };
  } catch (error) {
    logError('❌ [refineUI] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'UI优化失败';
    return {
      ok: false,
      type: 'PROVIDER',
      message: errorMessage,
      metrics: { queuedMs: 0, dedupHit: false, totalMs: 0 },
    };
  }
}

export type ReverseGenerateSpecResult = 
  | { ok: true; title: string; requirements: string[] }
  | { ok: false; type: 'RATE_LIMIT' | 'NETWORK' | 'PROVIDER' | 'PARSE'; message: string; cooldownSeconds?: number };

export async function reverseGenerateSpec(input: {
  code: string;
  nodeLabel: string;
  projectMeta?: {
    projectName: string;
    industry: string;
    targetAudience: string;
    description: string;
    version: string;
  };
  aiConfig?: {
    visionModel?: string;
    textModel?: string;
  };
}): Promise<{ title: string; requirements: string[] }> {
  try {
    ensureOpenAIKey();
    // 获取项目画像配置
    const projectMeta = input.projectMeta || {
      projectName: '未命名项目',
      industry: '通用互联网',
      targetAudience: '通用用户',
      description: '',
      version: '1.0.0',
    };

    const { industry, targetAudience, nodeLabel } = { ...projectMeta, nodeLabel: input.nodeLabel };

    // 根据行业动态调整术语和功能重点
    let industrySpecificInstructions = '';
    const industryLower = industry.toLowerCase();
    
    if (industryLower.includes('gaming') || industryLower.includes('游戏')) {
      industrySpecificInstructions = '使用游戏行业的术语（如：Inventory/库存、Buff/增益、Quest/任务、Character/角色、Level/等级等）。';
    } else if (industryLower.includes('logistics') || industryLower.includes('物流')) {
      industrySpecificInstructions = '使用物流行业的术语（如：Waybill/运单、Dispatch/调度、Tracking/追踪、Warehouse/仓库、Delivery/配送等）。';
    } else if (industryLower.includes('finance') || industryLower.includes('fintech') || industryLower.includes('金融')) {
      industrySpecificInstructions = '使用金融行业的术语（如：Account/账户、Transaction/交易、Balance/余额、Payment/支付、Security/安全等）。注意：如果是登录相关模块，需要假设2FA（双因素认证）功能。';
    } else if (industryLower.includes('healthcare') || industryLower.includes('医疗')) {
      industrySpecificInstructions = '使用医疗行业的术语（如：Patient/患者、Record/病历、Prescription/处方、Appointment/预约、Diagnosis/诊断等）。注意数据隐私和合规性要求。';
    } else if (industryLower.includes('e-commerce') || industryLower.includes('电商')) {
      industrySpecificInstructions = '使用电商行业的术语（如：Product/商品、Cart/购物车、Order/订单、Payment/支付、Review/评价等）。';
    } else {
      industrySpecificInstructions = '使用清晰、通用的术语描述功能。';
    }

    // 构建动态系统提示词（基于项目画像）
    const systemPrompt = `你是一位专注于 **${industry}** 行业的产品经理。
你的目标用户是 **${targetAudience}**。

# 任务
根据提供的 React 组件代码，描述 '${nodeLabel}' 模块的功能。

# 风格要求
${industrySpecificInstructions}
- 关注与 ${targetAudience} 相关的功能特性。
- 使用 ${industry} 行业的专业术语。
- 如果用户提供的信息不完整，根据行业上下文合理推断功能细节。

# 输出要求
- 生成一个清晰的模块标题（使用中文）
- 生成功能需求列表（使用中文）
- 使用简洁的中文描述
- 确保需求可执行且符合 ${industry} 行业特点
- **所有输出内容必须使用中文**，禁止使用英文`;

    const userPrompt = `请分析以下React组件代码，生成'${nodeLabel}'模块的需求描述：

\`\`\`tsx
${input.code}
\`\`\`

要求：
1. 生成一个简洁的模块标题
2. 生成功能需求列表（每个需求一行，使用中文）
3. 使用${industry}行业的术语和概念
4. 关注${targetAudience}用户的需求
5. 如果代码信息不完整，根据${industry}行业的常见做法进行合理推断`;

    // 获取模型配置
    const textModel = getTextModel(input.aiConfig);
    
    // ✅ 使用 callText 统一 gateway
    const result = await callText({
      model: textModel,
      prompt: `${systemPrompt}\n\n${userPrompt}`,
      temperature: 0.5,
      actionName: 'reverseGenerateSpec',
      aiConfig: input.aiConfig,
    });

    if (!result.ok) {
      throw new Error(result.message || '需求生成失败');
    }

    // 解析生成的文本，提取标题和需求列表
    const generatedText = result.data.trim();
    
    // 尝试提取标题（通常在文本开头，可能是 "标题：xxx" 或 "# xxx" 或直接是标题）
    let title = nodeLabel;
    let requirementsText = generatedText;

    // 查找标题模式
    const titlePatterns = [
      /标题[：:]\s*(.+?)(?:\n|$)/i,
      /#\s*(.+?)(?:\n|$)/,
      /^(.+?)(?:\n\n|\n\d+[\.、]|\n[-*])/m,
    ];

    for (const pattern of titlePatterns) {
      const match = generatedText.match(pattern);
      if (match && match[1]) {
        title = match[1].trim();
        requirementsText = generatedText.replace(pattern, '').trim();
        break;
      }
    }

    // 解析需求列表（按行分割，过滤空行）
    const requirements = requirementsText
      .split('\n')
      .map(line => {
        // 移除列表标记（-、*、1.、1、等）
        return line.replace(/^[-*\d.\s、]+/, '').trim();
      })
      .filter(line => line.length > 0)
      .slice(0, 50); // 限制最多50条需求

    if (requirements.length === 0) {
      // 如果没有解析到需求，将整个文本作为单个需求
      requirements.push(generatedText.substring(0, 200));
    }

    return {
      title: title || nodeLabel,
      requirements: requirements,
    };
  } catch (error) {
    logError('❌ [reverseGenerateSpec] Error:', error);
    const errorMessage = error instanceof Error ? error.message : '需求文档生成失败';
    throw new Error(`需求文档生成失败: ${errorMessage}`);
  }
}

export async function generateImplementation(input: {
  title: string;
  requirements: string[];
}): Promise<{ apiEndpoints: string[]; dbSchema: string }> {
  // TODO: 实现生成实现逻辑
      return {
    apiEndpoints: [],
    dbSchema: '-- 待生成',
  };
}

export async function generateTestCases(input: {
  title: string;
  requirements: string[];
  media?: NodeEditPanelMedia[];
  aiConfig?: { visionModel?: string; textModel?: string };
}): Promise<AIResult<{ cases: string[] }>> {
  try {
    ensureOpenAIKey();
    const reqBase = [...(input.requirements || [])].filter((x) => String(x).trim());
    if (reqBase.length === 0 && !input.media?.length) {
      throw new Error('需求列表为空且无附件，无法生成测试用例');
    }

    // 构建系统提示词
    const systemPrompt = `你是一位专业的QA测试工程师，擅长编写全面的测试用例。

# 任务
根据提供的功能需求，生成详细的测试用例列表。

# 输出要求
1. 每个测试用例应包含：测试场景/步骤、预期结果。
2. 覆盖：正常流程、边界条件、异常情况、数据验证、UI 交互（如适用）。
3. 使用中文描述，清晰易懂。
4. 测试用例数量：根据需求复杂度，生成 5–15 条。

# 输出格式（必须）
请**仅输出**一张 Markdown 表格，表头为三列：序号 | 测试场景 | 预期结果。示例：

| 序号 | 测试场景 | 预期结果 |
| --- | --- | --- |
| 1 | 进入资产概览页，检查顶部导航标题 | 标题为「资产概览」，加粗且文字颜色 #1F2937，无错位或截断 |
| 2 | 在搜索框输入资产名/ID/IP/负责人进行模糊搜索 | 列表/卡片/告警等资产相关结果实时更新，搜索图标在左、颜色 #9CA3AF |

不要输出表格以外的说明、标题或列表。单元格内若有换行可用空格代替，不要使用 | 符号以免破坏表格。`;

    const requirementsText =
      reqBase.length > 0
        ? reqBase.map((req, index) => `${index + 1}. ${req}`).join('\n')
        : '（暂无结构化需求，请主要依据用户附件与说明生成测试要点）';

    const userPrompt = `请为以下功能模块生成测试用例：

**模块标题：** ${input.title}

**功能需求：**
${requirementsText}

请生成全面的测试用例，覆盖正常流程、边界条件、异常情况和数据验证。用户可能附上界面截图或 HTML，请把可见交互与文案纳入测试场景。`;

    const hasImage = input.media?.some((m) => m.kind === 'image');
    const model = hasImage ? getVisionModel(input.aiConfig) : getTextModel(input.aiConfig);

    const result =
      input.media?.length ?
        await callText({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: buildNodeEditUserContent(userPrompt, input.media) },
          ],
          temperature: 0.7,
          actionName: 'generateTestCases',
          aiConfig: input.aiConfig ?? {},
          attachments: hasImage ? 'vision' : '',
        })
      : await callText({
          model,
          prompt: `${systemPrompt}\n\n${userPrompt}`,
          temperature: 0.7,
          actionName: 'generateTestCases',
          aiConfig: input.aiConfig ?? {},
        });

    if (!result.ok) {
      return {
        ok: false,
        type: result.type,
        message: result.message || '测试用例生成失败',
        metrics: result.metrics,
      };
    }

    // 解析生成的测试用例
    const generatedText = result.data.trim();
    let cases: string[] = [];

    // 检测是否为 Markdown 表格（首行含 | 且为表头/分隔行）
    const lines = generatedText.split('\n');
    const tableStart = lines.findIndex((l) => /^\s*\|.+\|/.test(l));
    if (tableStart !== -1) {
      const tableLines: string[] = [];
      for (let i = tableStart; i < lines.length; i++) {
        if (/^\s*\|.+\|/.test(lines[i])) tableLines.push(lines[i].trim());
        else if (tableLines.length > 0) break; // 表格结束
      }
      if (tableLines.length >= 2) {
        cases = [tableLines.join('\n')];
        log(`✅ [generateTestCases] 解析为 Markdown 表格，共 ${tableLines.length} 行`);
      }
    }

    if (cases.length === 0) {
      // 回退：按行解析为列表
      const listCases = generatedText
        .split('\n')
        .map((line) =>
          line
            .replace(/^[-*\d.\s、）)]+/, '')
            .replace(/^测试用例\d+[：:]\s*/, '')
            .trim()
        )
        .filter(
          (line) =>
            line.length > 0 &&
            !line.match(/^(测试用例|用例|Case)/i) &&
            line.length > 5
        )
        .slice(0, 20);
      if (listCases.length > 0) {
        cases = listCases;
      } else {
        const fallback = generatedText.substring(0, 500);
        cases.push(
          fallback.length > 0
            ? fallback
            : '| 序号 | 测试场景 | 预期结果 |\n| --- | --- | --- |\n| 1 | 功能正常流程测试 | 通过 |\n| 2 | 数据验证测试 | 通过 |\n| 3 | 异常情况处理测试 | 通过 |'
        );
      }
    }

    log(`✅ [generateTestCases] 成功生成 ${cases.length} 条（表格或列表）`);
    return {
      ok: true,
      data: { cases },
      metrics: { queuedMs: 0, dedupHit: false, totalMs: 0 },
    };
  } catch (error) {
    logError('❌ [generateTestCases] Error:', error);
    const errorMessage = error instanceof Error ? error.message : '测试用例生成失败';
    return {
      ok: false,
      type: 'PROVIDER',
      message: `测试用例生成失败: ${errorMessage}`,
      metrics: { queuedMs: 0, dedupHit: false, totalMs: 0 },
    };
  }
}

// ==================== 主题 → 设计系统约束（供图/文生成共用）====================

/** 根据 UIThemeConfig 生成 [DESIGN SYSTEM ENFORCEMENT] 提示词片段 */
function buildDesignSystemEnforcement(theme: {
  colors?: { primary?: string; secondary?: string; background?: { dark?: string }; surface?: string; text?: { primary?: string; secondary?: string }; border?: string };
  shape?: { borderRadius?: { md?: string } };
  shadows?: { buttonShadow?: string; cardShadow?: string };
  typography?: { density?: string };
  vibe?: string;
}): string {
  const hasExplicitDarkTheme = theme.colors?.background?.dark &&
    (theme.colors.background.dark.includes('slate-9') || theme.colors.background.dark.includes('zinc-9') ||
     theme.colors.background.dark.includes('gray-9') || theme.colors.background.dark.includes('slate-8') ||
     theme.colors.background.dark.includes('zinc-8') || theme.colors.background.dark.includes('gray-8'));
  const backgroundColor = hasExplicitDarkTheme ? `bg-${theme.colors!.background!.dark}` : 'bg-white';
  const surfaceColor = hasExplicitDarkTheme ? `bg-${theme.colors?.surface || 'slate-800'}` : 'bg-white';
  const primaryTextColor = hasExplicitDarkTheme ? `text-${theme.colors?.text?.primary || 'slate-50'}` : 'text-gray-900';
  const secondaryTextColor = hasExplicitDarkTheme ? `text-${theme.colors?.text?.secondary || 'slate-400'}` : 'text-gray-600';
  const borderColor = hasExplicitDarkTheme ? `border-${theme.colors?.border || 'slate-700'}` : 'border-gray-200';
  return `

[DESIGN SYSTEM ENFORCEMENT]
你必须严格遵循以下设计配置（优先级高于默认 Tailwind 选择）：
- 主色调：使用 bg-${theme.colors?.primary || 'blue-500'} 和 text-${theme.colors?.primary || 'blue-500'}（用于主要操作按钮、链接、强调元素）
- 次要色调：使用 bg-${theme.colors?.secondary || 'purple-500'} 和 text-${theme.colors?.secondary || 'purple-500'}（用于次要操作）
- 背景色：${hasExplicitDarkTheme ? `使用 ${backgroundColor}（用户明确要求深色主题）` : '**必须使用 bg-white（白色背景，默认要求）**'}
- 表面色：使用 ${surfaceColor}
- 主要文本：使用 ${primaryTextColor}
- 次要文本：使用 ${secondaryTextColor}
- 边框色：使用 ${borderColor}
- 圆角：所有按钮、卡片、输入框必须使用 ${theme.shape?.borderRadius?.md || 'rounded-md'}
- 按钮阴影：使用 ${theme.shadows?.buttonShadow || 'shadow-md'}
- 卡片阴影：使用 ${theme.shadows?.cardShadow || 'shadow-lg'}
- 密度：${theme.typography?.density === 'compact' ? '使用紧凑间距（p-2, gap-2）' : theme.typography?.density === 'spacious' ? '使用宽松间距（p-6, gap-6）' : '使用正常间距（p-4, gap-4）'}
${hasExplicitDarkTheme ? '- 注意：背景是深色，确保所有文本使用浅色类（text-white, text-gray-200, text-slate-50等）' : '- **重要：背景是白色，确保所有文本使用深色类（text-gray-900, text-gray-600等），禁止使用浅色文本（text-white, text-gray-100等）**'}
- 风格描述：${theme.vibe || 'Modern Professional'}

重要：这些设计令牌必须严格应用，不要使用其他颜色或样式。`;
}

/** 玻璃拟态风格：强制渐变底色 + 毛玻璃卡片，与预览一致（强约束，避免生成深灰不透明） */
const GLASS_STYLE_ENFORCEMENT = `

⚠️ 【重要】用户选择的是「玻璃拟态」，生成结果必须与风格预览一致。以下要求优先于任何其他背景/卡片描述。

❌ 错误示例（禁止）：深色纯色底 \`bg-slate-900\`、\`bg-gray-800\`、\`bg-zinc-900\`；不透明深灰卡片 \`bg-slate-800\`、\`bg-gray-700\`；无渐变、无毛玻璃。
✅ 正确示例（必须）：
  - 页面根节点（最外层 div）：\`className="min-h-screen bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700"\`（或 \`from-indigo-500 to-purple-700\`），必须是渐变，禁止任何 \`bg-slate-xxx\`、\`bg-gray-xxx\`、\`bg-zinc-xxx\` 作为页面背景。
  - 所有卡片、顶栏 NavBar、弹层：\`className="... bg-white/20 backdrop-blur-xl rounded-2xl border border-white/20"\`（或 \`bg-white/10 backdrop-blur-md\`），必须半透明+模糊，禁止 \`bg-slate-800\`、\`bg-gray-800\` 等不透明深色。
  - 主按钮：\`bg-white/90 text-gray-900\` 或 \`bg-violet-500 text-white\`。
  - 文字：\`text-white\`、\`text-white/90\`、\`text-white/70\`（因背景是深色渐变）。

请检查：根元素是否为 \`bg-gradient-to-br from-violet-500 ...\`？卡片是否为 \`bg-white/20 backdrop-blur-xl\`？若仍为深灰不透明则不符合要求。
`;

/** 极简中性：白/浅灰底，禁止渐变与毛玻璃，与预览一致 */
const NEUTRAL_STYLE_ENFORCEMENT = `

[极简中性 - 必须严格遵循，优先于前述背景/表面色]
当前为「极简中性」：页面根背景必须为 \`bg-white\` 或 \`bg-gray-50\`，禁止渐变、禁止毛玻璃、禁止深色底。主色克制：\`text-gray-700\`、\`bg-gray-700\` 或低饱和蓝；卡片 \`bg-white\` \`shadow-sm\` \`rounded-lg\`；文字 \`text-gray-900\`、\`text-gray-600\`。
`;

/** 赛博朋克：深黑底 + 霓虹粉/青发光（与预览一致，有辨识度） */
const CYBERPUNK_STYLE_ENFORCEMENT = `

[赛博朋克 - 必须严格遵循，优先于前述背景/表面色]
当前为「赛博朋克」，生成结果必须与风格预览一致（深黑底 + 霓虹粉/青发光、科幻感）：
1. **页面根背景（必须）**：\`bg-black\` 或 \`bg-[#0a0a0f]\`，禁止灰底或白底。
2. **卡片/表面**：\`bg-gray-900/90\` 或 \`bg-[#14141f]\`，加 \`border border-pink-500/30\` 或 \`border-cyan-400/30\` 发光边；圆角 \`rounded\` 或 \`rounded-sm\`（小圆角）；可用 \`shadow-[0_0_20px_rgba(236,72,153,0.2)]\` 霓虹光晕。
3. **主色/强调**：霓虹粉 \`text-pink-500\`、\`bg-pink-500\` 或霓虹青 \`text-cyan-400\`、\`bg-cyan-400\`；按钮/标签带发光感。
4. **文字**：\`text-gray-100\`、\`text-purple-300\`；可用等宽字体 \`font-mono\`。
`;

/** 温暖极简：奶油/米色底、单一暖色（2025 流行） */
const WARM_STYLE_ENFORCEMENT = `

[温暖极简 - 必须严格遵循，优先于前述背景/表面色]
当前为「温暖极简」，生成结果必须与风格预览一致（奶油底 + 暖色点缀）：
1. **页面根背景**：\`bg-amber-50\`、\`bg-stone-50\` 或 \`bg-[#faf8f5]\`，禁止纯白、禁止冷灰、禁止深色。
2. **卡片**：\`bg-white\` 或 \`bg-[#fffefb]\`，\`rounded-xl\` 或 \`rounded-2xl\`，\`shadow-sm\`。
3. **主色**：暖色 \`bg-amber-600\`、\`text-amber-700\` 或 \`bg-orange-600\`；单一强调色、克制使用。
4. **文字**：\`text-stone-800\`、\`text-stone-600\`。整体温暖、留白充足。
`;

/** 新粗野主义：粗黑描边、厚阴影、高对比（反精致） */
const BRUTAL_STYLE_ENFORCEMENT = `

[新粗野主义 - 必须严格遵循，优先于前述背景/表面色]
当前为「新粗野主义」，生成结果必须与风格预览一致（粗描边 + 厚实阴影 + 直角）：
1. **页面根背景**：\`bg-yellow-50\`、\`bg-amber-50\` 或 \`bg-white\`。
2. **卡片/按钮**：\`border-2\` 或 \`border-4\` \`border-stone-900\`，\`shadow-[4px_4px_0_0_#1c1917]\` 或 \`shadow-[6px_6px_0_0_#000]\` 厚实偏移阴影；\`rounded-none\` 直角，禁止大圆角。
3. **主色**：高对比 \`bg-red-600\`、\`bg-blue-600\`、\`text-stone-900\`；色块鲜明、无渐变。
4. **文字**：\`text-stone-900\`、\`text-stone-600\`，字重可偏粗。
`;

/** 扁平鲜明：高饱和色块、少阴影（与预览一致） */
const FLAT_STYLE_ENFORCEMENT = `

[扁平鲜明 - 必须严格遵循，优先于前述背景/表面色]
当前为「扁平鲜明」，生成结果必须与风格预览一致（高饱和色块、无渐变无毛玻璃）：
1. **页面根背景**：\`bg-white\` 或 \`bg-rose-50\`，禁止深色、禁止渐变、禁止毛玻璃。
2. **主色**：高饱和 \`bg-rose-600\`、\`text-rose-600\` 或 \`bg-orange-500\`；按钮与标签用纯色块。
3. **卡片**：\`bg-white\` \`rounded-xl\`，少用阴影（\`shadow-sm\` 或无），禁止 \`backdrop-blur\`。
4. **文字**：\`text-gray-900\`、\`text-gray-600\`。
`;

/** 企业稳重：深蓝灰、小圆角（与预览一致） */
const CORPORATE_STYLE_ENFORCEMENT = `

[企业稳重 - 必须严格遵循，优先于前述背景/表面色]
当前为「企业稳重」，生成结果必须与风格预览一致（B 端、专业）：
1. **页面根背景**：\`bg-slate-50\` 或 \`bg-white\`。
2. **主色**：深蓝 \`bg-blue-800\`、\`text-blue-800\`；卡片 \`bg-white\` \`shadow\` \`rounded-md\`（小圆角）。
3. **文字**：\`text-slate-900\`、\`text-slate-600\`。整体克制、无高饱和点缀。
`;

/** 柔和拟态：同色系、双阴影浮雕（与预览一致） */
const NEO_STYLE_ENFORCEMENT = `

[柔和拟态 - 必须严格遵循，优先于前述背景/表面色]
当前为「柔和拟态」，生成结果必须与风格预览一致（同色系 + 浮雕阴影）：
1. **页面根背景**：\`bg-indigo-100\` 或 \`bg-slate-200\`，与卡片同色系，禁止白底、禁止渐变。
2. **卡片/表面**：与背景同色系或略深，使用双阴影浮雕：\`shadow-[6px_6px_12px_#c4b8e0,-6px_-6px_12px_#fff]\` 或 \`shadow-[8px_8px_16px_rgba(0,0,0,0.08),-8px_-8px_16px_rgba(255,255,255,0.8)]\`；大圆角 \`rounded-2xl\`。
3. **主色**：\`bg-violet-600\`、\`text-violet-700\`。
4. **文字**：\`text-indigo-900\`、\`text-indigo-700\`。
`;

/** Bento 网格：规则/不规则网格分区、卡片块、清晰留白 */
const BENTO_STYLE_ENFORCEMENT = `
[Bento 网格 - 必须严格遵循]
当前为「Bento 网格」：主内容区使用网格布局（\`grid grid-cols-2 md:grid-cols-3\` 或不等分），每个信息块为独立卡片；卡片 \`rounded-xl\` \`shadow-sm\`，背景 \`bg-white\` 或 \`bg-slate-50\`；主色 \`text-indigo-600\`、\`bg-indigo-600\`；文字 \`text-slate-900\`、\`text-slate-600\`。禁止整页单列或无网格。
`;

/** 极光 UI：深色渐变、半透明卡片、青/紫光晕 */
const AURORA_STYLE_ENFORCEMENT = `
[极光 UI - 必须严格遵循]
当前为「极光 UI」：页面根背景 \`bg-gradient-to-br from-slate-900 via-indigo-950 to-sky-950\` 或类似深色渐变；卡片 \`bg-white/10 backdrop-blur-xl rounded-2xl border border-cyan-500/20\`；主色 \`text-cyan-400\`、\`bg-cyan-400\`；文字 \`text-slate-50\`、\`text-cyan-100\`。
`;

/** 深色模式：纯黑/深灰底、高对比 */
const DARK_STYLE_ENFORCEMENT = `
[深色模式 - 必须严格遵循]
当前为「深色模式」：页面根背景 \`bg-black\` 或 \`bg-neutral-950\`；卡片 \`bg-neutral-900\` \`rounded-lg\`；主色 \`text-sky-400\`、\`bg-sky-400\`；文字 \`text-neutral-50\`、\`text-neutral-400\`。整体深色、高对比、护眼。
`;

/** 可访问优先：高对比、焦点环、语义化 */
const ACCESSIBLE_STYLE_ENFORCEMENT = `
[可访问优先 - 必须严格遵循]
当前为「可访问优先」：背景 \`bg-white\`，文字 \`text-slate-900\`、\`text-slate-600\`（对比度 ≥4.5:1）；所有可点击元素须有 \`focus:ring-2 focus:ring-blue-500 focus:ring-offset-2\`；主色 \`bg-blue-600\`、\`text-blue-600\`；圆角 \`rounded-md\`，阴影适度。禁止低对比、禁止仅靠颜色传达信息。
`;

/** 黏土拟态：大圆角、暖色、柔和立体 */
const CLAY_STYLE_ENFORCEMENT = `
[黏土拟态 - 必须严格遵循]
当前为「黏土拟态」：页面根背景 \`bg-amber-50\` 或 \`bg-orange-50\`；卡片 \`bg-orange-50\` 或 \`bg-amber-50\` \`rounded-3xl\` \`shadow-md\`；主色 \`bg-orange-600\`、\`text-orange-600\`；文字 \`text-amber-900\`、\`text-amber-700\`。大圆角、暖色、柔和立体感。
`;

/** 液态玻璃：深色渐变、半透明、backdrop-blur */
const LIQUID_STYLE_ENFORCEMENT = `
[液态玻璃 - 必须严格遵循]
当前为「液态玻璃」：页面根背景 \`bg-gradient-to-br from-sky-950 to-slate-900\`；卡片 \`bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20\`；主色 \`text-sky-400\`、\`bg-sky-400\`；文字 \`text-white\`、\`text-sky-200\`。高端半透明、深色底。
`;

/** 柔和进化：轻阴影、紫/青主色 */
const SOFT_STYLE_ENFORCEMENT = `
[柔和进化 - 必须严格遵循]
当前为「柔和进化」：页面根背景 \`bg-violet-50\` 或 \`bg-slate-50\`；卡片 \`bg-white\` \`rounded-xl\` \`shadow-md\`；主色 \`bg-violet-600\`、\`text-violet-600\` 或 \`bg-cyan-500\`；文字 \`text-violet-950\`、\`text-violet-700\`。轻阴影、现代企业感。
`;

/** 复古未来：深色底、琥珀/红强调、等宽字体 */
const RETRO_STYLE_ENFORCEMENT = `
[复古未来 - 必须严格遵循]
当前为「复古未来」：页面根背景 \`bg-stone-900\` 或 \`bg-stone-950\`；卡片 \`bg-stone-800\` \`rounded\` \`border border-amber-500/50\`；主色 \`text-amber-500\`、\`bg-amber-500\` 或 \`text-red-500\`；文字 \`text-amber-50\`、\`text-amber-200\`；可用 \`font-mono\`。复古科技感。
`;

/** Y2K 美学：高饱和粉/青、直角 */
const Y2K_STYLE_ENFORCEMENT = `
[Y2K 美学 - 必须严格遵循]
当前为「Y2K 美学」：页面根背景 \`bg-pink-50\` 或 \`bg-white\`；卡片 \`bg-white\` \`rounded-none\` 或小圆角，少阴影；主色 \`bg-pink-500\`、\`text-pink-500\` 或 \`bg-teal-400\`；文字 \`text-pink-900\`、\`text-pink-700\`。高饱和、直角或几何、千禧年潮流。
`;

// ==================== Server Actions（用于 CommandBar）====================

const GenerateUIFromImageInputSchema = z.object({
  prompt: z.string(),
  imageBase64: z.string(),
  themeConfig: z.any().optional().describe('UI主题配置，用于应用设计系统'),
  /** Stitch 方案：draft=快速模型，quality=重量模型，默认 quality */
  tier: z.enum(['draft', 'quality']).optional().describe('生成档位'),
  aiConfig: z.object({
    visionModel: z.string().optional(),
    textModel: z.string().optional(),
  }).optional().describe('AI模型配置，如果未提供则使用环境变量或默认值'),
});

export const generateUIFromImage = createServerAction()
  .input(GenerateUIFromImageInputSchema)
  .handler(async ({ input }) => {
    const startTime = Date.now();
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    log('='.repeat(80));
    log(`🚀 [generateUIFromImage] 开始处理图片生成UI请求 [${requestId}]`);
    log(`📋 [generateUIFromImage] 输入参数 [${requestId}]:`, {
      promptLength: input.prompt?.length || 0,
      imageBase64Length: input.imageBase64?.length || 0,
      hasPrompt: !!input.prompt,
      hasImage: !!input.imageBase64,
      timestamp: new Date().toISOString(),
    });
      log('='.repeat(80));

    try {
      ensureOpenAIKey();
      log('✅ [generateUIFromImage] OPENAI_API_KEY 已配置');

      // 处理 base64 图片数据
      // 输入可能是：
      // 1. 完整的 data URL: "data:image/png;base64,iVBORw0KGgo..."
      // 2. 纯 base64 字符串: "iVBORw0KGgo..."
      let base64Data: string;
      if (input.imageBase64.includes(',')) {
        // 包含逗号，说明是完整的 data URL，提取 base64 部分
        base64Data = input.imageBase64.split(',')[1];
        log('📝 [generateUIFromImage] 检测到 data URL 格式，已提取 base64 部分');
      } else {
        // 不包含逗号，说明已经是纯 base64 数据
        base64Data = input.imageBase64;
        log('📝 [generateUIFromImage] 检测到纯 base64 格式');
      }
      
      // 验证 base64 数据格式
      if (!base64Data || base64Data.length < 100) {
        logError('❌ [generateUIFromImage] 图片数据格式无效:', {
          base64Length: base64Data?.length || 0,
          isValid: !!base64Data && base64Data.length >= 100,
        });
        throw new Error('图片数据格式无效或数据过短');
      }
      
      log('📸 [generateUIFromImage] 图片数据验证通过:', {
        inputLength: input.imageBase64.length,
        base64Length: base64Data.length,
        base64Prefix: base64Data.substring(0, 30),
      });

      // 构建设计系统约束（如果提供了主题配置）
      const designSystemEnforcement = input.themeConfig
        ? buildDesignSystemEnforcement(input.themeConfig)
        : '';

      // 获取项目画像配置
      const projectMeta = input.projectMeta || {
        projectName: '未命名项目',
        industry: 'General',
        targetAudience: 'General Users',
        coreValue: '提供优质的用户体验',
      };

      // 根据行业动态调整语调和风格
      let toneInstruction = '';
      const industry = projectMeta.industry.toLowerCase();
      if (industry.includes('finance') || industry.includes('fintech') || industry.includes('healthcare') || industry.includes('医疗')) {
        toneInstruction = '采用严谨、正式的设计风格，注重数据准确性和安全性。';
      } else if (industry.includes('gaming') || industry.includes('游戏') || industry.includes('social') || industry.includes('社交')) {
        toneInstruction = '采用生动、富有创意的设计风格，注重用户体验和视觉吸引力。';
      } else if (industry.includes('logistics') || industry.includes('物流') || industry.includes('enterprise') || industry.includes('企业')) {
        toneInstruction = '采用专业、高效的设计风格，注重信息清晰度和操作效率。';
      } else {
        toneInstruction = '采用清晰、专业、用户友好的设计风格。';
      }

      // 构建动态系统提示词（新版本：结构化提示词）
      const systemPrompt = `# Role
Senior Frontend Architect & UI/UX Expert.

你是一个专业的 React 前端开发专家，专注于 ${projectMeta.industry} 行业。

项目背景：
- 项目名称: "${projectMeta.projectName}"
- 目标用户: ${projectMeta.targetAudience}
${projectMeta.description ? `- 项目简介: ${projectMeta.description}` : ''}

# Task
Generate production-ready **React + Tailwind CSS** code based on the uploaded image. **质量优先**：生成完整、可直接使用的页面，不要为求快而省略区块或使用占位内容。

# 核心要求

## 1. 像素级精确复刻
- **精确还原**图片中的所有UI元素，包括：
  - 布局结构：精确匹配容器层次、排列方式（Flex/Grid）
  - 颜色：**背景色规则（必须忠实还原设计图）**：
    - **核心原则**：**忠实还原设计图的背景色**，不能改变或反转
    - **如果设计图背景是白色或浅色**：**必须使用**白色或浅色背景（如 \`bg-white\`、\`bg-gray-50\` 等），**禁止使用深色背景**
    - **如果设计图背景是深色**（如黑色、深灰色等）：使用对应的深色背景（如 \`bg-gray-900\`、\`bg-slate-900\` 等）
    - **严格禁止**：如果设计图是白色/浅色背景，**绝对不能生成深色背景**（如 \`bg-gray-900\`、\`bg-slate-900\`、\`bg-zinc-900\` 等）
    - **判断方法**：仔细观察设计图的整体背景色，如果背景是白色或浅色，必须使用浅色背景；如果背景是深色，才使用深色背景
  - 文本色、按钮色、状态标签颜色：精确匹配图片中的颜色
  - 字体：精确匹配字体大小、粗细、行高
  - 间距：精确匹配 padding、margin、gap 等间距
  - 圆角：精确匹配 rounded 类名
  - 图标和状态指示器：完整还原所有图标、状态图标
- **背景色判断规则（强制要求）**：
  - **忠实还原原则**：**必须忠实还原设计图的背景色**，不能改变或反转
  - **如果设计图背景是白色/浅色**：**必须使用**白色/浅色背景（\`bg-white\`、\`bg-gray-50\` 等），**严格禁止使用深色背景**
  - **如果设计图背景是深色**：使用对应的深色背景（\`bg-gray-900\`、\`bg-slate-900\` 等）
  - **关键禁止项**：如果设计图是白色/浅色背景，**绝对不能生成深色背景**，这是严重错误
  - **注意**：不要因为图片中有深色元素（如深色卡片、按钮）就认为背景是深色，背景是指整个页面的底色
- **严格按照图片还原**：不要修改、不要规范化，完全按照图片中的样子复刻，背景色必须忠实还原设计图

## 2. 忽略系统UI元素
- **完全忽略**手机系统状态栏（时间、信号图标、Wi-Fi图标、电池图标等）
- **只关注应用内容**：从应用自己的导航栏、搜索栏等应用UI元素开始还原

## 3. 文本颜色（强制要求 - 必须为所有文本元素添加颜色类名）
⚠️ **关键要求：所有文本元素必须明确设置Tailwind的text-*颜色类名，不能省略！**

**错误示例（禁止）：**
- \`<div>标题</div>\` ❌ 缺少颜色类名
- \`<p className="text-sm">描述</p>\` ❌ 只有字体大小，缺少颜色
- \`<span>文本</span>\` ❌ 完全没有样式类名

**正确示例（必须）：**
- \`<div className="text-gray-900">标题</div>\` ✅ 明确指定颜色
- \`<p className="text-sm text-gray-500">描述</p>\` ✅ 同时有字体大小和颜色
- \`<span className="text-blue-600">状态</span>\` ✅ 明确指定颜色

**颜色规则（根据背景色选择）：**
- **浅色背景**（bg-white, bg-gray-50等）：
  - 主要文本（标题、重要内容）：**必须使用** \`text-gray-900\` 或 \`text-black\`
  - 次要文本（描述、元信息、日期）：**必须使用至少** \`text-gray-500\`（**严格禁止 text-gray-400 或更浅**）
  - 状态文本（蓝色/紫色/绿色）：**必须使用至少 600 级别**（如 \`text-blue-600\`, \`text-purple-600\`, \`text-green-600\`，**严格禁止 400 或更浅**）
- **深色背景**（bg-gray-900等）：
  - 主要文本：**必须使用** \`text-white\` 或 \`text-gray-50\`
  - 次要文本：**必须使用至少** \`text-gray-300\`

**检查清单：**
- [ ] 每个文本元素（div, p, span, h1-h6, label等）都必须有text-*颜色类名
- [ ] 不能依赖默认颜色，必须明确指定
- [ ] 如果图片中文本颜色较浅但可读，保持原色；如果不可读，调整为上述规则中的颜色

## 4. 文字换行控制
- 按钮/标签内的单行文字：使用 \`whitespace-nowrap\`
- 标题单行显示：使用 \`truncate\` 或调整容器宽度
- 禁止因容器宽度导致文字换行

## 5. 交互功能
- 所有按钮可点击，使用 onClick 和 useState
- 搜索框可输入，使用 useState 管理状态
- 标签可切换，使用 useState 管理激活状态
- 添加 hover 和 active 状态反馈

## 5.1 视觉样式（必须应用）
- **主按钮/CTA**：使用 \`bg-cyan-500 hover:bg-cyan-600 text-white\` 或 \`bg-teal-500\` 等统一强调色，禁止泛用 \`bg-blue-500\` 无品牌感。
- **卡片/列表项**：必须带 \`rounded-lg\`/\`rounded-xl\`、\`shadow-md\`/\`shadow-lg\`、内边距 \`p-4\`，禁止无圆角无阴影的白块。
- **字体层级**：标题 \`font-semibold\`/\`font-bold\` + \`text-lg\`/\`text-xl\`，正文 \`text-gray-600\`/\`text-gray-500\`，形成清晰层次。
- 页面整体需有明确「有设计」的视觉风格，不能无样式。

## 6. 语言要求（强制）
⚠️ **关键要求：所有文本内容必须使用中文**
- **所有UI文本必须使用中文**：包括按钮文字、标签、提示信息、标题、描述等
- **禁止使用英文**：除非图片中明确显示英文内容，否则所有文本必须使用中文
- **示例**：
  - ✅ 按钮文字："提交"、"取消"、"搜索"
  - ✅ 标签文字："进行中"、"已完成"、"待处理"
  - ❌ 禁止："Submit"、"Cancel"、"Search"、"In Progress"、"Completed"

## 7. 技术要求（必须满足才能在预览中正常显示）
- 使用 React Hooks（useState, useEffect），由预览环境注入，不要写 import。
- 使用 Tailwind CSS 实现所有样式，禁止内联样式。
- **根组件命名（必须）**：必须且仅能使用 \`export default function Page() { ... }\` 或 \`export default function App() { ... }\`，不要使用其他名称（如 ProductDetail、RoleManagement），否则预览无法识别根组件。
- **禁止写任何 import 语句**：所有 import 在预览中会被移除，会导致白屏。图标直接写组件名如 \`<Search />\`、\`<User />\`、\`<Mic />\`（Lucide 已注入），或使用内联 SVG/Emoji，禁止使用 \`Icon\` 或未在 lucide-react 中存在的名称。
- **根布局（必须）**：根节点使用 \`className={cn("flex flex-col h-full min-h-full ...")}\`，主内容区必须含 \`flex-1 min-h-0 overflow-y-auto\`，否则预览中主内容区会被压扁仅显示底部。
- 代码可直接运行，包含完整交互逻辑。
${designSystemEnforcement}
${UI_UX_PRO_MAX_GUIDANCE}

# Output
- 只返回完整的 .tsx 代码
- 不要包含 markdown 标记、注释或说明文字
- **所有文本内容必须使用中文**`;

      // 构建用户提示词（新版本：结构化提示词）
      const defaultUserPrompt = `Analyze the uploaded image and generate production-ready React + Tailwind CSS code.

**Step 1: Classify the Image**
- Is this a high-fidelity design mockup? -> Use "Pixel-Perfect Clone" strategy.
- Is this a wireframe/sketch? -> Use "Professional Interpretation" strategy.

**Step 2: Apply Universal Rules - Background Color (CRITICAL)**
- **核心原则**：**忠实还原设计图的背景色**，不能改变或反转
- **背景色判断（必须忠实还原）**：
  - **如果设计图背景是白色或浅色**：**必须使用**白色或浅色背景（如 \`bg-white\`、\`bg-gray-50\` 等），**严格禁止使用深色背景**
  - **如果设计图背景是深色**（如深灰、黑色等）：使用对应的深色背景（如 \`bg-gray-900\`、\`bg-slate-900\` 等）
  - **严格禁止**：如果设计图是白色/浅色背景，**绝对不能生成深色背景**（如 \`bg-gray-900\`、\`bg-slate-900\`、\`bg-zinc-900\` 等），这是严重错误
  - **判断方法**：仔细观察设计图的整体背景色，如果背景是白色或浅色，必须使用浅色背景；如果背景是深色，才使用深色背景
  - **注意**：不要因为图片中有深色元素（如深色卡片、按钮）就认为背景是深色，背景是指整个页面的底色
- **文本颜色规则**：
  - Every text element MUST have an explicit \`text-*\` color class (e.g., \`text-gray-900\`, \`text-slate-600\`).
  - **白色背景时**：Headings use dark colors (\`text-gray-900\` / \`text-slate-800\`), body text use medium-dark colors (\`text-gray-600\` / \`text-slate-500\`).
  - **深色背景时**：Headings use light colors (\`text-white\` / \`text-gray-50\`), body text use light-medium colors (\`text-gray-300\` / \`text-gray-400\`).
  - NEVER use light gray text (\`text-gray-300\` or lighter) on white backgrounds.
- Look for indicator bars (colored side strips) and implement them with \`absolute\` positioning.

**Step 3: Generate Code**
- Use React Hooks (useState, useEffect) for interactivity. Do NOT write any \`import\` statements (React and icons are injected in preview).
- Use Tailwind CSS for all styling (NO inline styles).
- Icons: use Lucide component names directly in JSX (e.g. \`<Search />\`, \`<User />\`, \`<Mic />\`) or inline SVG/Emoji; do NOT \`import from 'lucide-react'\`.
- Root component: output only \`export default function Page() { ... }\` or \`export default function App() { ... }\`.
- Root layout: \`flex flex-col h-full min-h-full\`, main content area must include \`flex-1 min-h-0 overflow-y-auto\`.
- Ignore phone system status bar elements.
- Ensure all buttons, inputs, and tabs are interactive.

Generate the complete .tsx code now.`;

      const userPrompt = input.prompt.trim() || defaultUserPrompt;
      log('💬 [generateUIFromImage] 用户提示词:', {
        promptLength: userPrompt.length,
        promptPreview: userPrompt.substring(0, 100),
      });

      // Stitch 双模型分轨：draft=快速模型，quality=重量模型
      const tier: GenerationTier = input.tier === 'draft' ? 'draft' : 'quality';
      const visionModel = getModelForTier(tier, 'vision', input.aiConfig);
      log(`🤖 [generateUIFromImage] 开始调用 OpenAI API (${visionModel}, tier=${tier})...`);
      log('⏱️ [generateUIFromImage] 超时设置: 600秒 (10分钟)');
      const apiStartTime = Date.now();
      
      // Use unified LLM gateway with messages (including image parts)
      const result = await callText({
        model: visionModel,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt,
              },
              {
                type: 'image',
                image: base64Data,
              },
            ],
          },
        ],
        temperature: 0.1, // 极低温度确保严格遵循指令，实现像素级精确复刻
        timeoutMs: 600000, // 10 minutes for vision API
        actionName: 'generateUIFromImage',
        mode: 'vision',
        aiConfig: input.aiConfig,
      });
      
      // Handle error result (return union, don't throw)
      if (!result.ok) {
        const apiDuration = Date.now() - apiStartTime;
        log('❌ [generateUIFromImage] LLM call failed', {
              requestId,
              model: visionModel,
          errorType: result.type,
          elapsedMs: apiDuration,
            });
        
        // Map AIResult error types to return format
        if (result.type === 'RATE_LIMIT') {
            return {
              type: 'rate_limit' as const,
            cooldownSeconds: result.cooldownSeconds || 10,
              requestId,
            message: result.message,
          };
        }
        if (result.type === 'NETWORK') {
            return {
              type: 'network_error' as const,
              requestId,
            message: result.message,
            retryable: true,
          };
        }
        // Other errors map to api_error
        return {
          type: 'api_error' as const,
          requestId,
          message: result.message,
        };
      }
      
      const apiDuration = Date.now() - apiStartTime;
      log(`✅ [generateUIFromImage] OpenAI API 调用完成，耗时: ${apiDuration}ms`);

      // 提取生成的代码
      let generatedCode = result.data.trim();
      log('📝 [generateUIFromImage] 原始生成结果:', {
        textLength: result.data.length,
        trimmedLength: generatedCode.length,
        preview: generatedCode.substring(0, 200),
      });

      // 清理代码：移除可能的 markdown 代码块标记
      generatedCode = generatedCode
        .replace(/^```(?:tsx|jsx|typescript|javascript)?\n?/gm, '')
        .replace(/\n?```$/gm, '')
        .trim();
      log('🧹 [generateUIFromImage] 代码清理后:', {
        cleanedLength: generatedCode.length,
        preview: generatedCode.substring(0, 200),
      });

      // 验证代码是否有效（不是空字符串）
      if (!generatedCode || generatedCode.length < 50) {
        logError('❌ [generateUIFromImage] 生成的代码太短:', {
          codeLength: generatedCode?.length || 0,
        });
        throw new Error('生成的代码太短或不完整，请重试');
      }

      // 确保代码包含 React 组件（简单验证）
      if (!generatedCode.includes('function') && !generatedCode.includes('const') && !generatedCode.includes('=>')) {
        logError('❌ [generateUIFromImage] 生成的代码不包含有效的React组件');
        throw new Error('生成的代码不包含有效的React组件');
      }

      const totalDuration = Date.now() - startTime;
      log(`🎉 [generateUIFromImage] UI代码生成成功！总耗时: ${totalDuration}ms`);
      log('📊 [generateUIFromImage] 最终代码统计:', {
        codeLength: generatedCode.length,
        hasFunction: generatedCode.includes('function'),
        hasConst: generatedCode.includes('const'),
        hasArrow: generatedCode.includes('=>'),
      });

      return {
        type: 'success' as const,
        code: generatedCode,
        requestId,
      };
    } catch (error) {
      const errorDuration = Date.now() - startTime;
      logError(`❌ [generateUIFromImage] 发生错误！耗时: ${errorDuration}ms`);
      logError('❌ [generateUIFromImage] 错误详情:', error);
      
      // 改进错误消息提取
      let errorMessage = '';
      if (error instanceof Error) {
        errorMessage = error.message;
        logError('❌ [generateUIFromImage] 错误类型: Error, 消息:', errorMessage);
        if (error.stack) {
          logError('❌ [generateUIFromImage] 错误堆栈:', error.stack);
        }
      } else if (error && typeof error === 'object') {
        errorMessage = (error as any).message || (error as any).error || (error as any).msg || JSON.stringify(error);
        logError('❌ [generateUIFromImage] 错误类型: Object, 内容:', error);
      } else {
        errorMessage = String(error);
        logError('❌ [generateUIFromImage] 错误类型: Other, 值:', errorMessage);
      }
      
      // 如果是 OpenAI API 相关错误，提供更友好的提示
      if (errorMessage.includes('API key') || errorMessage.includes('OPENAI')) {
        logError('❌ [generateUIFromImage] OpenAI API 配置错误');
        throw new Error(`UI代码生成失败: OpenAI API 配置错误。请检查 .env.local 文件中的 OPENAI_API_KEY 是否正确配置`);
      }
      
      logError('❌ [generateUIFromImage] 抛出最终错误:', errorMessage);
      throw new Error(`UI代码生成失败: ${errorMessage}`);
    }
  });

const GenerateAnalysisFromCodeInputSchema = z.object({
  codeContext: z.string(),
  pageTitle: z.string().optional().describe('页面标题，用于生成功能ID前缀'),
  existingRequirements: z.array(z.string()).optional().describe('现有的需求列表，用于在原有基础上增加新内容'),
  projectMeta: z.object({
    projectName: z.string(),
    industry: z.string(),
    targetAudience: z.string(),
    description: z.string(),
    version: z.string(),
  }).optional().describe('项目画像配置，用于动态生成角色提示词'),
  aiConfig: z.object({
    visionModel: z.string().optional(),
    textModel: z.string().optional(),
  }).optional().describe('AI模型配置，如果未提供则使用环境变量或默认值'),
});

const GenerateUIFromTextInputSchema = z.object({
  prompt: z.string().describe('用户输入，用于补充或覆盖页面描述'),
  nodeLabel: z.string().describe('节点名称（页面名）'),
  /** 由 getNodePageDescription(selectedNode) 得到的完整页面需求描述，优先于 prompt 用于「Context: Page Requirements」 */
  pageDescription: z.string().optional().describe('页面需求描述（如 spec.requirements + userStories 拼接）'),
  projectMeta: z.object({
    projectName: z.string(),
    industry: z.string(),
    targetAudience: z.string(),
    description: z.string(),
    version: z.string(),
  }).optional().describe('项目画像配置'),
  themeConfig: z.any().optional().describe('UI主题配置'),
  /** 视觉风格预设（与风格选择器一致）：glass 等会注入强约束如渐变底、毛玻璃 */
  stylePreset: z.enum(STYLE_PRESET_IDS).optional().describe('风格预设'),
  /** 目标视口：与编辑区当前选择一致，生成对应布局 */
  viewportPreset: z.enum(['mobile', 'desktop']).optional().default('mobile').describe('目标视口'),
  /** Stitch 方案：draft=快速模型，quality=重量模型，默认 quality */
  tier: z.enum(['draft', 'quality']).optional().describe('生成档位'),
  aiConfig: z.object({
    visionModel: z.string().optional(),
    textModel: z.string().optional(),
  }).optional().describe('AI模型配置'),
  /** 意图加工层产出的可选系统提示词后缀（按领域注入布局/组件约定） */
  systemPromptSuffix: z.string().optional().describe('领域系统提示词片段'),
  /** 当前节点已有 UI 代码；若提供且有效，则按「在现有基础上修改」生成，避免整页重写 */
  existingCode: z.string().optional().describe('当前页面的 view.code，用于增量编辑'),
});

export const generateUIFromText = createServerAction()
  .input(GenerateUIFromTextInputSchema)
  .handler(async ({ input }) => {
    const startTime = Date.now();
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    log('='.repeat(80));
    log(`🚀 [generateUIFromText] 开始处理文本生成UI请求 [${requestId}]`);
    const viewportPreset = (input.viewportPreset === 'desktop' || input.viewportPreset === 'mobile')
      ? input.viewportPreset
      : 'mobile';
    if (input.viewportPreset !== viewportPreset) {
      logWarn(`[generateUIFromText] viewportPreset 已纠正: 收到 "${String(input.viewportPreset)}" → 使用 "${viewportPreset}"`);
    }
    log(`📋 [generateUIFromText] 输入参数 [${requestId}]:`, {
      promptLength: input.prompt?.length || 0,
      nodeLabel: input.nodeLabel,
      viewportPreset,
      hasPrompt: !!input.prompt,
      hasExistingCode: !!(input.existingCode && input.existingCode.trim().length >= 200),
      timestamp: new Date().toISOString(),
    });
    try {
      const debugPath = join(process.cwd(), 'scripts', 'viewport-debug-last.json');
      writeFileSync(debugPath, JSON.stringify({
        viewportUsed: viewportPreset,
        received: input.viewportPreset,
        requestId,
        timestamp: new Date().toISOString(),
      }, null, 2), 'utf8');
    } catch (_) { /* ignore */ }
    log('='.repeat(80));

    try {
      ensureOpenAIKey();

      let systemPrompt = buildUIGenerationSystemPrompt(viewportPreset, input.projectMeta ?? undefined);
      // 玻璃拟态时优先注入风格约束并置于最前，且不注入 theme 背景（避免 theme 的 bg-slate-800 覆盖渐变要求）
      if (input.stylePreset === 'glass') {
        systemPrompt = systemPrompt.replace('# Design Philosophy', `${GLASS_STYLE_ENFORCEMENT}\n\n# Design Philosophy`);
        log('📐 [generateUIFromText] 已注入玻璃拟态风格约束（置顶，渐变底+毛玻璃）');
      } else {
        if (input.themeConfig) {
          systemPrompt += buildDesignSystemEnforcement(input.themeConfig);
          log(`📐 [generateUIFromText] 已注入主题约束，vibe: ${input.themeConfig.vibe || '—'}`);
        }
        const preset = input.stylePreset;
        if (preset && preset !== 'auto') {
          if (preset === 'neutral') systemPrompt += NEUTRAL_STYLE_ENFORCEMENT;
          if (preset === 'cyberpunk') systemPrompt += CYBERPUNK_STYLE_ENFORCEMENT;
          if (preset === 'warm') systemPrompt += WARM_STYLE_ENFORCEMENT;
          if (preset === 'brutal') systemPrompt += BRUTAL_STYLE_ENFORCEMENT;
          if (preset === 'flat') systemPrompt += FLAT_STYLE_ENFORCEMENT;
          if (preset === 'corporate') systemPrompt += CORPORATE_STYLE_ENFORCEMENT;
          if (preset === 'neo') systemPrompt += NEO_STYLE_ENFORCEMENT;
          if (preset === 'bento') systemPrompt += BENTO_STYLE_ENFORCEMENT;
          if (preset === 'aurora') systemPrompt += AURORA_STYLE_ENFORCEMENT;
          if (preset === 'dark') systemPrompt += DARK_STYLE_ENFORCEMENT;
          if (preset === 'accessible') systemPrompt += ACCESSIBLE_STYLE_ENFORCEMENT;
          if (preset === 'clay') systemPrompt += CLAY_STYLE_ENFORCEMENT;
          if (preset === 'liquid') systemPrompt += LIQUID_STYLE_ENFORCEMENT;
          if (preset === 'soft') systemPrompt += SOFT_STYLE_ENFORCEMENT;
          if (preset === 'retro') systemPrompt += RETRO_STYLE_ENFORCEMENT;
          if (preset === 'y2k') systemPrompt += Y2K_STYLE_ENFORCEMENT;
        } else if (preset === 'auto') {
          log('📐 [generateUIFromText] 智能推荐模式：不注入固定风格 enforcement');
        }
      }
      if (input.stylePreset === 'auto') {
        const recommendMd = await recommendDesignSystemMarkdown({
          projectMeta: input.projectMeta,
          nodeLabel: input.nodeLabel,
          pageDescription: input.pageDescription,
          prompt: input.prompt,
          aiConfig: input.aiConfig,
          tier: 'draft',
        });
        if (recommendMd) {
          systemPrompt += `\n\n${recommendMd}`;
          log('📐 [generateUIFromText] 已注入「本次推荐设计系统」Markdown');
        }
      }
      systemPrompt += UI_UX_PRO_MAX_GUIDANCE;
      const useEdit = shouldUseEditMode(input.existingCode, input.prompt ?? '');
      let userPromptFinal = useEdit && input.existingCode
        ? buildUIEditUserPrompt(
            input.nodeLabel || '页面',
            input.prompt ?? '',
            viewportPreset,
            input.existingCode
          )
        : buildUIGenerationUserPrompt(
            input.nodeLabel || '页面',
            input.prompt ?? '',
            viewportPreset,
            input.pageDescription
          );
      // 在用户提示中显式强调当前选中的 UI 风格，提高模型遵守率
      if (input.stylePreset === 'auto') {
        let autoLine =
          '【智能推荐模式】请严格遵循 System 中的「本次推荐设计系统」（若存在）与通用 UI 设计基准，形成统一视觉语言；未锁定单一命名风格预设。';
        if (input.themeConfig?.vibe) {
          autoLine += ` 已与主题氛围「${input.themeConfig.vibe}」协调。`;
        }
        userPromptFinal += `\n\n${autoLine}`;
        log('📐 [generateUIFromText] 已向 user 注入智能推荐说明');
      } else if (input.stylePreset || input.themeConfig?.vibe) {
        const styleLine = [
          input.stylePreset && input.stylePreset !== 'auto'
            ? `风格预设：${input.stylePreset}（必须严格采用该预设的视觉与组件风格）`
            : '',
          input.themeConfig?.vibe ? `主题氛围：${input.themeConfig.vibe}` : '',
          input.themeConfig?.colors?.primary ? `主色：${input.themeConfig.colors.primary}` : '',
        ].filter(Boolean).join('；');
        if (styleLine) {
          userPromptFinal += `\n\n【重要】当前选中的 UI 风格必须严格体现：${styleLine}。`;
          log(`📐 [generateUIFromText] 已向 user 提示注入风格强调: ${styleLine}`);
        }
      }
      if (useEdit) {
        log(`📝 [generateUIFromText] 使用「在现有代码基础上修改」模式，existingCode 长度: ${input.existingCode?.length ?? 0}`);
      }

      // 调试：确认实际发给大模型的内容，便于排查空白/短输出
      log(`📤 [generateUIFromText] 实际发给模型的 system 长度: ${systemPrompt.length} 字符`, {
        systemPreview: systemPrompt.slice(0, 380),
      });
      log(`📤 [generateUIFromText] 实际发给模型的 user 长度: ${userPromptFinal.length} 字符`, {
        userPreview: userPromptFinal.slice(0, 380),
      });

      // 文本生成 UI 固定使用「高质量」模型（默认 gpt-5.2），忽略用户轻量配置
      const tier: GenerationTier = 'quality';
      const textModel = getModelForTier(tier, 'text', {});
      log(`🤖 [generateUIFromText] 使用模型: ${textModel} (固定 quality)`);
      
      const apiStartTime = Date.now();
      
      // 使用 messages 分离 system/user，避免单 prompt 被模型当普通对话导致忽略约束
      const result = await callText({
        model: textModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPromptFinal },
        ],
        temperature: 0.5,
        maxOutputTokens: 16000,
        actionName: 'generateUIFromText',
        aiConfig: input.aiConfig,
      });
      
      if (!result.ok) {
        // Handle error result (return union, don't throw)
        const apiDuration = Date.now() - apiStartTime;
        log('❌ [generateUIFromText] LLM call failed', {
          requestId,
          model: textModel,
          errorType: result.type,
          elapsedMs: apiDuration,
        });
        
        // Map AIResult error types to return format
        if (result.type === 'RATE_LIMIT') {
          return {
            type: 'rate_limit' as const,
            cooldownSeconds: result.cooldownSeconds || 10,
            requestId,
            message: result.message,
          };
        }
        if (result.type === 'NETWORK') {
          return {
            type: 'network_error' as const,
            requestId,
            message: result.message,
            retryable: true,
          };
        }
        // Other errors map to api_error
        return {
          type: 'api_error' as const,
          requestId,
          message: result.message,
        };
      }
      
      const apiDuration = Date.now() - apiStartTime;
      const rawLength = result.data.length;
      log(`✅ [generateUIFromText] OpenAI API 调用完成`, {
        model: textModel,
        elapsedMs: apiDuration,
        responseChars: rawLength,
        hint: rawLength < 4500 ? '⚠️ 响应过短，可能为骨架或截断' : undefined,
      });

      // 提取生成的代码
      let generatedCode = result.data.trim();
      log('📝 [generateUIFromText] 原始生成结果:', {
        textLength: result.data.length,
        trimmedLength: generatedCode.length,
        preview: generatedCode.substring(0, 200),
      });

      // 清理代码：移除可能的 markdown 代码块标记
      generatedCode = generatedCode
        .replace(/^```(?:tsx|jsx|typescript|javascript)?\n?/gm, '')
        .replace(/\n?```$/gm, '')
        .trim();

      // 桌面视口时强制把模型输出的移动端根布局改为桌面：避免「选 PC 仍是一窄条」的画布
      if (viewportPreset === 'desktop') {
        const before = generatedCode;
        generatedCode = generatedCode
          .replace(/\bmax-w-md\b/g, 'max-w-7xl')
          .replace(/\bmax-w-sm\b/g, 'max-w-6xl')
          .replace(/\bw-\[375px\]\b/g, 'w-full')
          .replace(/\bmax-w-\[375px\]\b/g, 'max-w-7xl')
          .replace(/\bmin-w-\[375px\]\b/g, 'min-w-0');
        // 确保根容器有桌面居中：若根 div 有 w-full + overflow-x-hidden 且无 max-w，补上 max-w-7xl mx-auto
        if ((generatedCode.includes('w-full') && generatedCode.includes('overflow-x-hidden')) && !generatedCode.includes('max-w-7xl') && !generatedCode.includes('max-w-6xl')) {
          generatedCode = generatedCode.replace(
            /(<div[^>]*className=")([^"]*)(w-full\s+overflow-x-hidden)([^"]*)(")/,
            '$1$2max-w-7xl mx-auto $3$4$5'
          );
          if (!generatedCode.includes('max-w-7xl')) {
            generatedCode = generatedCode.replace(
              /(<div[^>]*className=")([^"]*)(overflow-x-hidden\s+w-full)([^"]*)(")/,
              '$1$2max-w-7xl mx-auto $3$4$5'
            );
          }
        }
        if (before !== generatedCode) {
          log('🖥️ [generateUIFromText] 已对生成代码做桌面布局后处理（替换移动端根宽度为桌面）');
        }
      }

      log('🧹 [generateUIFromText] 代码清理后:', {
        cleanedLength: generatedCode.length,
        preview: generatedCode.substring(0, 200),
      });

      // 结构自检：便于与图中预期对比，确认主内容区是否有实质内容
      const hasFlex1 = /\bflex-1\b/.test(generatedCode);
      const hasMain = /<main\b/.test(generatedCode);
      const listItemCount = (generatedCode.match(/<ListItem\b/g) || []).length;
      const cardCount = (generatedCode.match(/<Card\b/g) || []).length;
      const hasNavBar = /<NavBar\b/.test(generatedCode);
      const hasAppBar = /<AppBar\b/.test(generatedCode);
      const rootFlexCol = /(?:className|class)=["'][^"']*\bflex\s+flex-col\b/.test(generatedCode) || /flex-col\s+flex\b/.test(generatedCode);
      log('📐 [generateUIFromText] 生成代码结构自检（与图中预期对比）:', {
        nodeLabel: input.nodeLabel,
        pageDescriptionPreview: (input.pageDescription || '').slice(0, 120),
        hasFlex1,
        hasMain,
        listItemCount,
        cardCount,
        hasNavBar,
        hasAppBar,
        rootFlexCol,
        expectMainContent: listItemCount >= 5 || cardCount >= 2 ? 'ok' : '可能主区不足',
      });

      // 写入 MD 文档：AI 返回的 UI 代码 + 上下文，便于复制到本地/CodeSandbox 自行渲染对比预期
      try {
        const debugDir = join(process.cwd(), 'scripts', 'iteration-reports');
        mkdirSync(debugDir, { recursive: true });
        const mdPath = join(debugDir, 'last-generated-ui-code.md');
        const pageDesc = (input.pageDescription || '').trim();
        const mdContent = [
          '# 上次 AI 返回的 UI 代码',
          '',
          '每次在画布上点击「生成本页 UI」成功后，会覆盖此文件。可复制下方代码块到本地或 [CodeSandbox](https://codesandbox.io) 等环境渲染，与图中预期对比。',
          '',
          '## 本次生成上下文',
          '',
          '| 项 | 值 |',
          '| --- | --- |',
          `| 生成时间 | ${new Date().toISOString()} |`,
          `| 节点名称 | ${input.nodeLabel} |`,
          `| 视口 | ${viewportPreset} |`,
          `| flex-1 | ${hasFlex1} |`,
          `| <main> | ${hasMain} |`,
          `| ListItem 数量 | ${listItemCount} |`,
          `| Card 数量 | ${cardCount} |`,
          `| NavBar | ${hasNavBar} |`,
          `| AppBar | ${hasAppBar} |`,
          `| 根 flex-col | ${rootFlexCol} |`,
          '',
          '### 发给模型的页面描述（pageDescription）',
          '',
          pageDesc ? `\n${pageDesc}\n` : '_（未提供，使用了节点名 + 兜底要求）_',
          '',
          '---',
          '',
          '## 代码（复制下方整块到可运行 React+Tailwind 环境对比）',
          '',
          '```tsx',
          generatedCode,
          '```',
          '',
        ].join('\n');
        writeFileSync(mdPath, mdContent, 'utf8');
        log('📁 [generateUIFromText] 已写入 MD 文档:', { path: mdPath });
      } catch (e) {
        logWarn('⚠️ [generateUIFromText] 写入 MD 文档失败', e);
      }

      // 拒绝「向用户索要描述」的模型回复（模型有时会输出说明文字而非代码）
      const refusalPatterns = [
        /我需要你提供[\s\S]{0,80}(描述|信息|内容)/i,
        /请告诉我[\s\S]{0,80}(页面|功能|内容)/i,
        /才能为你(重新)?生成/i,
        /只要你给我[\s\S]{0,40}描述/i,
      ];
      const isRefusal = refusalPatterns.some((re) => re.test(generatedCode));
      if (isRefusal) {
        logError('❌ [generateUIFromText] 模型返回了说明/提问文字而非代码', {
          preview: generatedCode.substring(0, 300),
        });
        throw new Error(
          '模型返回了说明文字而非 UI 代码。请在下拉或节点中补充页面描述（如：商品详情页、列表页、包含的模块），再点击「生成本页 UI」重试。'
        );
      }

      // 一页完整 UI 代码通常 5000–15000 字符，过短多为骨架/截断，直接拒绝
      const MIN_FULL_PAGE_CHARS = 4500;
      if (!generatedCode || generatedCode.length < 400) {
        logError('❌ [generateUIFromText] 生成的代码太短:', { codeLength: generatedCode?.length || 0 });
        throw new Error('生成的代码太短或不完整，请补充页面描述后重试');
      }
      if (generatedCode.length < MIN_FULL_PAGE_CHARS) {
        logError('❌ [generateUIFromText] 生成内容过短，无法视为完整一页 UI:', {
          codeLength: generatedCode.length,
          requiredMin: MIN_FULL_PAGE_CHARS,
          model: textModel,
        });
        throw new Error(
          `当前生成仅 ${generatedCode.length} 字符，不足一页完整 UI（需至少约 ${MIN_FULL_PAGE_CHARS} 字符）。请重试或补充更详细的页面描述；若仍过短，请检查是否使用了轻量模型（如 gpt-4o-mini），建议使用 gpt-4o 等模型。`
        );
      }

      // 确保代码包含 React 组件
      if (!generatedCode.includes('function') && !generatedCode.includes('const') && !generatedCode.includes('=>')) {
        logError('❌ [generateUIFromText] 生成的代码不包含有效的React组件');
        throw new Error('生成的代码不包含有效的React组件，请补充页面描述后重试');
      }

      const totalDuration = Date.now() - startTime;
      log(`🎉 [generateUIFromText] UI代码生成成功！总耗时: ${totalDuration}ms`);
      log('📊 [generateUIFromText] 最终代码统计:', {
        codeLength: generatedCode.length,
        hasFunction: generatedCode.includes('function'),
        hasConst: generatedCode.includes('const'),
        hasArrow: generatedCode.includes('=>'),
      });

      return {
        type: 'success' as const,
        code: generatedCode,
        requestId,
        viewportUsed: viewportPreset,
      };
    } catch (error) {
      const errorDuration = Date.now() - startTime;
      logError(`❌ [generateUIFromText] 发生错误！耗时: ${errorDuration}ms`);
      logError('❌ [generateUIFromText] 错误详情:', error);
      
      let errorMessage = '';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        errorMessage = (error as any).message || (error as any).error || (error as any).msg || JSON.stringify(error);
      } else {
        errorMessage = String(error);
      }
      
      if (errorMessage.includes('API key') || errorMessage.includes('OPENAI')) {
        throw new Error(`UI代码生成失败: OpenAI API 配置错误。请检查 .env.local 文件中的 OPENAI_API_KEY 是否正确配置`);
      }
      
      throw new Error(`UI代码生成失败: ${errorMessage}`);
    }
});

export const generateAnalysisFromCode = createServerAction()
  .input(GenerateAnalysisFromCodeInputSchema)
  .handler(async ({ input }) => {
    try {
      ensureOpenAIKey();
      // 获取页面标题，用于生成功能ID前缀
      const pageTitle = input.pageTitle || '';
      
      // 构建功能ID前缀说明
      let functionIdPrefixInstruction = '';
      let functionIdExample = '';
      if (pageTitle) {
        functionIdPrefixInstruction = `功能ID前缀规则：根据页面标题"${pageTitle}"的所有首字母生成前缀。
- 如果是中文标题，提取每个字的拼音首字母（例如："指令流" -> "ZLL"，"用户中心" -> "YZZX"，"首页" -> "SY"）
- 如果是英文标题，提取每个单词的首字母（例如："User Center" -> "UC"，"Home Page" -> "HP"）
- 如果是中英文混合，优先使用中文拼音首字母，然后加上英文首字母
- 功能ID格式：{前缀}{三位数字序号}，例如：ZLL001, ZLL002, ZLL003...`;
        functionIdExample = `页面标题"${pageTitle}"的所有首字母001开始递增（例如："指令流" -> ZLL001, ZLL002, ZLL003...）`;
      } else {
        functionIdPrefixInstruction = `功能ID格式：F001, F002, F003...（默认使用F作为前缀）`;
        functionIdExample = 'F001开始递增（F001, F002, F003...）';
      }

      // 构建系统提示词（精简版，目标 <= 8k chars）
      const systemPrompt = `# Role
Product Manager (Client-Facing)

你是一个专业的产品经理，面向客户和业务团队。根据React/HTML代码生成结构化的业务需求规格表（PRD）。

# Task
生成Markdown表格格式的业务需求规格表。

# Output Format
| 功能ID | UI区域 | 元素名称 | 功能说明 | 展示规范 |
| :--- | :--- | :--- | :--- | :--- |

# Content Rules

## 功能说明 (Column 4)
- **交互元素**：描述用户操作和系统响应（如"点击后跳转至详情页"）
- **只读元素**：描述业务目的（如"用于展示当前指令的流转状态"）
- **禁止**写"无交互"、"None"，必须定义其目的

## 展示规范 (Column 5)
- **禁止**使用无意义的纯色块（如单独写 🔵🟢🔴 等），色块本身不提供信息。
- **颜色与样式**：用「语义 + 色号」描述。例如：
  - 按钮：主按钮背景色 #3B82F6（蓝色）；次要按钮描边 #6B7280。
  - 状态/标签：任务执行中显示「执行中」，文字蓝色，色号 #2563EB；执行完毕显示「执行完毕」，文字绿色，色号 #16A34A。
  - 带颜色的字体：写明文案与对应色号（如：链接 #2563EB、成功 #16A34A、警示 #DC2626）。
- **数据格式**：时间"YYYY-MM-DD HH:mm"，货币"¥0.00"，日期"YYYY年MM月DD日"。
- **默认状态**：说明默认值、占位文本、空状态等。

# Extraction Rules
- **UI区域**：根据DOM结构识别（Header->顶部导航，.map()->列表区）
- **元素名称**：将组件名转为业务术语（Input->搜索框）

# Examples
| ZLL001 | 顶部导航 | 返回按钮 | 点击后返回上一级页面。 | 黑色图标 #1F2937；位于左上角。 |
| ZLL002 | 列表区 | 状态标签 | 用于标识指令处理进度。 | 执行中：文案「执行中」，蓝色 #2563EB；执行完毕：文案「执行完毕」，绿色 #16A34A。 |

# Feature ID
${functionIdPrefixInstruction}

# Requirements
- 所有内容使用中文，避免技术术语
- 功能描述清晰具体，说明用户操作和系统响应
- 展示规范说明视觉样式、默认状态、占位文本
- 分析所有UI元素、交互逻辑、状态管理
- 识别可交互组件（按钮、输入框、卡片、菜单）和只读元素（标题、标签、状态指示器）
- 如果提供了现有需求表格，必须保留原有内容并补充新增需求

# Critical: Direct Output Only
- **禁止**向用户提问、让用户选择输出方式（如「请选择1-4」「一次性输出还是按模块」「按区域逐步生成」等）。**禁止**输出任何说明、选项列表或澄清文字。
- 必须**直接输出**且**仅输出** Markdown 表格（表头 + 数据行）。若功能点很多，可归纳为各 UI 区域/模块的代表性功能点，总行数建议 40–80 行，确保能完整输出；仍须直接给出表格，不要前置任何解释或让用户选择的内容。`;

      // 仅当「现有内容」为真实的功能表格时才走「保留并更新」；仅有页面描述/无表格时按「全新生成」避免模型返回澄清弹窗
      const existingRaw = (input.existingRequirements || []).filter((s: unknown): s is string => typeof s === 'string').join('\n').trim();
      const hasTable = existingRaw.length > 0 && /功能ID\s*\|/i.test(existingRaw) && /\|[^\n]+\|/.test(existingRaw);
      const hasExistingRequirements = hasTable;
      const existingRequirementsText = hasExistingRequirements
        ? `\n\n**现有需求文档（必须完全保留，不要修改或删除）：**\n${existingRaw}\n\n**更新要求：**\n1. 必须完全保留上述现有需求表格的所有行和内容\n2. 在此基础上，分析代码并补充新增的功能点到表格中\n3. 如果现有需求使用表格格式，新增需求也必须使用相同的表格格式和列结构\n4. 新增行的功能ID要延续现有编号规则：${pageTitle ? `如果现有表格中最后一行功能ID是某个前缀（如ZLL005），新增的从该前缀的下一号开始（如ZLL006）` : '如果现有表格中最后一行功能ID是F005，新增的从F006开始'}\n5. 如果现有需求是表格格式，保持表格格式；如果是列表格式，也保持列表格式\n6. 只返回完整的需求文档（包含原有内容和新增内容），不要包含其他说明文字`
        : '';

      const userPrompt = `请分析以下React组件代码，${hasExistingRequirements ? '更新（保留原有内容并补充新内容）' : '生成'}产品需求文档：

\`\`\`tsx
${input.codeContext}
\`\`\`
${existingRequirementsText}

${!hasExistingRequirements ? `**输出要求：**
1. 必须使用Markdown表格格式，表格结构如下（严格遵循）：

| 功能ID | UI区域 | 元素名称 | 功能说明 | 展示规范 |
|--------|--------|----------|----------|----------|

2. 分析代码中的所有功能点和UI元素，为每个功能点创建一行表格
3. 功能ID从${functionIdExample}
4. 所有描述使用中文，确保易读易懂，使用业务语言而非技术术语

5. **功能说明列（Column 4）**要详细说明：
   - **交互元素（按钮、输入框、链接等）**：描述用户操作和系统响应
     - 示例："点击后跳转至详情页。"、"支持输入关键词进行模糊搜索。"
   - **只读元素（标题、标签、状态指示器等）**：描述业务目的（传达什么信息）
     - 示例："用于展示当前指令的流转状态。"、"标识该指令的来源渠道。"
     - **禁止**说"无交互"、"No interaction"、"None"

6. **展示规范列（Column 5）**要说明（禁止无意义的纯色块，必须写清语义+色号）：
   - **按钮**：主按钮背景色号（如 #3B82F6）、次要按钮描边/文字色号。
   - **状态/标签**：每种状态的文案与对应颜色、色号。例如：执行中显示「执行中」，蓝色 #2563EB；执行完毕显示「执行完毕」，绿色 #16A34A；已取消显示灰色 #6B7280。
   - **带颜色的文字**：写明用途与色号（如：链接 #2563EB、成功 #16A34A、警示 #DC2626）。
   - **数据格式**：时间 "YYYY-MM-DD HH:mm"，货币 "¥0.00"，日期 "YYYY年MM月DD日"。
   - **默认状态和规则**：默认为空、占位文本、空数据提示、省略号规则等。
   - **注意**：不要单独使用 🟢🔴🔵 等色块；不要写技术术语如 "API"、"useState"。

7. **示例行格式**：
| ZLL001 | 顶部导航 | 返回按钮 | 点击后返回上一级页面。 | 黑色图标 #1F2937；位于左上角。 |
| ZLL002 | 列表区 | 状态标签 | 用于标识指令处理进度。 | 执行中：文案「执行中」，蓝色 #2563EB；执行完毕：文案「执行完毕」，绿色 #16A34A。 |
| ZLL003 | 列表卡片 | 发布时间 | 展示指令的创建或发布时间。 | 格式：YYYY-MM-DD HH:mm:ss；文字色 #6B7280。 |

8. 只返回Markdown表格，不要包含标题、说明文字或其他内容
9. **禁止**输出「请选择1-4」「按模块拆分」「一次性输出」等让用户选择的文字；禁止输出任何澄清、选项或解释。必须直接输出表格。若元素很多，可归纳为每区域 5–15 条代表性行（总行数约 40–80），直接输出表格即可。` : ''}`;

      // 获取模型配置
      const textModel = getTextModel(input.aiConfig);
      
      // ✅ 使用 callText 统一 gateway
      const result = await callText({
        model: textModel,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        temperature: 0.5,
        actionName: 'generateAnalysisFromCode',
        aiConfig: input.aiConfig,
      });

      if (!result.ok) {
        const errorMessage = result.type === 'RATE_LIMIT' 
          ? `请求过多，请在 ${result.cooldownSeconds || 10} 秒后重试`
          : result.message || 'PRD生成失败';
        throw new Error(errorMessage);
      }

      // 提取生成的 Markdown
      let markdown = result.data.trim();

      // 清理 Markdown（移除可能的代码块标记）
      markdown = markdown
        .replace(/^```(?:markdown)?\n?/gm, '')
        .replace(/\n?```$/gm, '')
        .trim();

      // 拒绝「让用户选择输出方式」等澄清类回复，要求直接输出表格
      const clarificationPatterns = [
        /请选择\s*[1-4一二三四]/,
        /一次性输出|按模块拆分|按.*区域.*逐步|结构树/,
        /由于代码量巨大|超出.*上下文.*限制/,
      ];
      if (clarificationPatterns.some((p) => p.test(markdown)) && !/^\s*\|?\s*功能ID\s*\|/m.test(markdown)) {
        logError('❌ [generateAnalysisFromCode] 模型返回了澄清/选项而非表格', { preview: markdown.substring(0, 300) });
        throw new Error('本次返回了说明文字而非需求表格，请直接再次点击「生成需求文档」重试；若仍出现，请稍后重试。');
      }

      // 验证生成的文档是否有效
      if (!markdown || markdown.length < 20) {
        throw new Error('生成的PRD文档太短或不完整');
      }

      return {
        markdown,
      };
    } catch (error) {
      logError('❌ [generateAnalysisFromCode] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'PRD生成失败，请检查API配置和网络连接';
      throw new Error(`PRD文档生成失败: ${errorMessage}`);
    }
  });

const UpdateNodeArtifactsInputSchema = z.object({
  nodeId: z.string(),
  nodeTitle: z.string().optional(),
  userPrompt: z.string().optional(),
  currentArtifacts: z.any().optional(),
  attachments: z.array(z.any()).optional(),
  });

export const updateNodeArtifacts = createServerAction()
  .input(UpdateNodeArtifactsInputSchema)
  .handler(async ({ input }) => {
    // TODO: 实现更新节点逻辑
    return {
      view: { code: '' },
      spec: { title: '', requirements: [] },
      impl: { apiEndpoints: [], dbSchema: '' },
      test: { cases: [] },
    };
  });