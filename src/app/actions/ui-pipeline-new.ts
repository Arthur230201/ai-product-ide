'use server';

import { createServerAction } from 'zsa';
import { z } from 'zod';
import { log, logError, logWarn } from '@/lib/logger';
import { getOpenAIKey, getModelForTier, getTextModel } from '@/lib/ai-config';
import { callText } from '@/lib/ai/llm';
import type { AIResult } from '@/lib/ai/llm';
import type { UIPipelineResponse } from './ui-pipeline-response';
import { cleanHTML, validateHTML, getStageMarker } from '@/lib/ui/html-validator';
import { mapAIResultToUIPipelineResponse } from './ui-pipeline-response';
import { STYLE_PRESET_IDS } from '@/types/theme';
import { DesignSystemSnapshotSchema } from '@/types/design-system-snapshot';
import { truncateDesignSystemMarkdown } from '@/lib/design-system/truncate-design-system-markdown';
import { resolveDesignSystemAuto } from '@/lib/design-system/resolve-design-system';
import { UI_UX_PRO_MAX_GUIDANCE } from '@/lib/prompts/ui-ux-pro-max-guidance';

/**
 * 三段式 UI 生成 Pipeline
 * 
 * Stage 1: generateStaticUIFromText - 只生成静态 HTML（无交互、无 hooks、无状态）
 * Stage 2: beautifyUI - 只改样式（不改变 DOM 结构语义）
 * Stage 3: addInteractions - 只新增交互逻辑（保持结构稳定）
 */

// Stage markers (appended to output)
const STAGE_MARKER_STATIC = '<!-- UI_PIPELINE:STAGE=STATIC;FORMAT=HTML_SINGLE_FILE;NO_SCRIPT=TRUE -->';
const STAGE_MARKER_BEAUTIFY = '<!-- UI_PIPELINE:STAGE=BEAUTIFY;FORMAT=HTML_SINGLE_FILE;NO_SCRIPT=TRUE -->';
const STAGE_MARKER_INTERACT = '<!-- UI_PIPELINE:STAGE=INTERACT;FORMAT=HTML_SINGLE_FILE;SCRIPT=TRUE;DATA_ACTION=TRUE;EVENT_DELEGATION=TRUE -->';

// Output format footer with stage marker
const getOutputFooter = (stage: 'STATIC' | 'BEAUTIFY' | 'INTERACT') => {
  const marker = stage === 'STATIC' ? STAGE_MARKER_STATIC : stage === 'BEAUTIFY' ? STAGE_MARKER_BEAUTIFY : STAGE_MARKER_INTERACT;
  return `\n\nOUTPUT REQUIREMENTS:
- Return a complete HTML document.
- No Markdown, no code fences, no explanations.
- Output the actual HTML code.
- Append this marker at the end: ${marker}`;
};

/** 风格预设：与 theme 保持一致，pipeline 接受全部预设 */
const STYLE_PRESETS = STYLE_PRESET_IDS;

/** 极简中性：留白、灰阶、无强烈色 */
const NEUTRAL_STYLE_FRAGMENT = `
## 视觉风格：极简中性

- **整体气质**：黑白灰为主、留白充足、无高饱和色块；适合内容与通用产品。
- **色彩**：背景白/浅灰（#fff, #f9fafb）；主文字深灰（#111827, #374151）；主色可用单一灰或低饱和蓝，克制使用。
- **圆角与阴影**：圆角 6–8px；阴影轻（0 1px 2px rgba(0,0,0,0.05)）。
- **字体**：系统无衬线；层级清晰。
`.trim();

/** 赛博朋克：深黑、霓虹粉/青发光 */
const CYBERPUNK_STYLE_FRAGMENT = `
## 视觉风格：赛博朋克（Cyberpunk）

- **整体气质**：深黑背景、霓虹粉/青发光、科幻感；锐利边角、等宽字体。
- **色彩**：背景 #0a0a0f 或 black；主文字浅色；强调色霓虹粉 #ec4899、霓虹青 #22d3ee；卡片可带发光边框。
- **圆角**：小或直角；box-shadow 可带霓虹光晕。
`.trim();

/** 温暖极简：奶油/米色、单一暖色 */
const WARM_STYLE_FRAGMENT = `
## 视觉风格：温暖极简（Warm Minimalism）

- **整体气质**：奶油/米色底、单一暖色点缀、大圆角、留白充足；2025 流行。
- **色彩**：背景 #faf8f5、#fffefb 或 amber-50；主色 amber/orange；文字 stone-800/600。
- **圆角**：12–16px；阴影轻。
`.trim();

/** 新粗野主义：粗描边、厚阴影、直角 */
const BRUTAL_STYLE_FRAGMENT = `
## 视觉风格：新粗野主义（Neo-Brutalism）

- **整体气质**：粗黑描边、厚实偏移阴影、直角、高对比色块；反精致、有冲击力。
- **色彩**：背景浅黄/白；边框与阴影用黑色；主色红/蓝等高饱和。
- **圆角**：直角 rounded-none；shadow 如 4px 4px 0 0 #1c1917。
`.trim();

/** 玻璃拟态：半透明、模糊、大圆角 */
const GLASS_STYLE_FRAGMENT = `
## 视觉风格：玻璃拟态（Glassmorphism）

- **整体气质**：半透明毛玻璃、背景模糊、大圆角；现代 C 端感。
- **色彩**：卡片/面板使用 rgba 半透明（如 rgba(255,255,255,0.2)）、backdrop-filter: blur(12px)；可配渐变或彩色背景衬托。
- **圆角**：12–16px 或更大；轻边框（如 1px solid rgba(255,255,255,0.2)）。
- **阴影**：柔和、偏大范围。
`.trim();

/** 扁平鲜明：高饱和、少阴影 */
const FLAT_STYLE_FRAGMENT = `
## 视觉风格：扁平鲜明（Flat Bold）

- **整体气质**：高饱和色块、无渐变、少阴影或扁平阴影；清晰边界、年轻活力。
- **色彩**：主色鲜明（如红/橙/玫红 #e11d48、#f97316）；背景可浅色衬托；对比强。
- **圆角**：8–12px；阴影可有可无，若有则轻。
- **组件**：按钮与卡片用纯色块，少立体感。
`.trim();

/** 企业稳重：深蓝灰、专业 */
const CORPORATE_STYLE_FRAGMENT = `
## 视觉风格：企业稳重（B 端/专业）

- **整体气质**：深蓝/灰主色、小圆角、适度阴影；专业、可信、偏后台与 ToB。
- **色彩**：主色深蓝（#1e40af、#1e3a8a）；背景浅灰（#f1f5f9）；文字深灰/黑。
- **圆角**：4–6px；阴影适度（0 1px 3px rgba(0,0,0,0.08)）。
- **组件**：表格、表单、卡片结构清晰；避免花哨。
`.trim();

/** 柔和拟态：双阴影浮雕 */
const NEO_STYLE_FRAGMENT = `
## 视觉风格：柔和拟态（Neumorphism）

- **整体气质**：同色系深浅、内外双阴影形成浮雕感；柔和、舒适。
- **色彩**：背景与卡片同色系（如浅紫灰 #e0e7ff）；凸起用浅色阴影、凹陷用深色阴影（如 6px 6px 12px #c4b8e0, -6px -6px 12px #fff）。
- **圆角**：大圆角（12–16px）；无边框或极淡边框。
- **组件**：按钮/输入框用凸起或凹陷的 box-shadow 表现。
`.trim();

/** Bento 网格 / 极光 / 深色 / 可访问 / 黏土 / 液态玻璃 / 柔和进化 / 复古未来 / Y2K（扩展风格） */
const BENTO_STYLE_FRAGMENT = `## 视觉风格：Bento 网格\n- 网格分区、信息块卡片、留白清晰；背景白/浅灰；主色 indigo/violet；圆角 12–16px。`.trim();
const AURORA_STYLE_FRAGMENT = `## 视觉风格：极光 UI\n- 深色渐变背景、半透明卡片、青/紫光晕；主色 cyan/violet；大圆角、backdrop-blur。`.trim();
const DARK_STYLE_FRAGMENT = `## 视觉风格：深色模式\n- 纯黑/深灰底、高对比；主色 sky/violet；卡片 bg-neutral-900；护眼。`.trim();
const ACCESSIBLE_STYLE_FRAGMENT = `## 视觉风格：可访问优先\n- 高对比、焦点环可见、语义化；背景白、主色 blue/emerald；WCAG 适用。`.trim();
const CLAY_STYLE_FRAGMENT = `## 视觉风格：黏土拟态\n- 大圆角、暖色、柔和立体；背景 amber/orange-50；主色 orange/yellow；圆角 24px+。`.trim();
const LIQUID_STYLE_FRAGMENT = `## 视觉风格：液态玻璃\n- 深色渐变、半透明卡片、backdrop-blur；主色 sky/indigo；高端精致。`.trim();
const SOFT_STYLE_FRAGMENT = `## 视觉风格：柔和进化\n- 轻阴影、紫/青主色；背景 violet-50；主色 violet/cyan；现代企业。`.trim();
const RETRO_STYLE_FRAGMENT = `## 视觉风格：复古未来\n- 深色底、琥珀/红强调、等宽字体；主色 amber/red；复古科技。`.trim();
const Y2K_STYLE_FRAGMENT = `## 视觉风格：Y2K 美学\n- 高饱和粉/青、直角；主色 pink/teal；千禧年潮流。`.trim();

// ==================== Stage 1: 静态 HTML 生成 ====================

const VIEWPORT_PRESETS = ['mobile', 'desktop'] as const;

const GenerateStaticUIInputSchema = z.object({
  prompt: z.string().optional().default('').describe('页面描述'),
  nodeLabel: z.string().optional().describe('节点标签'),
  pageDescription: z.string().optional().describe('页面需求摘要'),
  projectMeta: z
    .object({
      projectName: z.string(),
      industry: z.string(),
      targetAudience: z.string(),
      description: z.string(),
    })
    .optional(),
  stylePreset: z.enum(STYLE_PRESETS).optional().default('neutral').describe('视觉风格预设；auto=与主轨一致的设计系统解析'),
  viewportPreset: z.enum(VIEWPORT_PRESETS).optional().default('mobile').describe('目标视口：mobile/tablet/desktop，决定生成布局宽度与结构'),
  designSystemLocked: z.boolean().optional(),
  designSystemSnapshot: z.unknown().optional(),
  aiConfig: z.object({
    textModel: z.string().optional(),
  }).optional(),
});

export const generateStaticUIFromText = createServerAction()
  .input(GenerateStaticUIInputSchema)
  .handler(async ({ input }): Promise<UIPipelineResponse> => {
    const stage = 'STATIC' as const;
    
    try {
      log('🚀 [generateStaticUIFromText] 开始生成静态 HTML', { stage });

      if (!getOpenAIKey()) {
        return {
          ok: false,
          type: 'PROVIDER',
          message: 'OPENAI_API_KEY 未配置',
          retryable: false,
        };
      }

      // Stitch 分轨：Stage 1 用 draft 模型，TTFT 优先，适合多页连续生成
      const textModel = getModelForTier('draft', 'text', input.aiConfig);

      let systemPrompt = `You are a product UI designer and senior frontend engineer.

TASK:
Create a single-file, runnable STATIC HTML first draft based on the user request.
This is an initial usable draft: it must have a coherent layout, believable UI components, and a consistent color system.
Do not overbuild. Prioritize clarity and structure stability for later beautify/interaction stages.

HARD CONSTRAINTS:
1) Single-file policy:
   - Inline CSS only: exactly one <style> block.
   - NO external assets of any kind: NO CDNs, NO external fonts, NO remote images, NO external JS.
   - NO <script> in Stage 1.
2) Static only:
   - No event handlers, no dynamic behavior, no state.
3) Structure stability:
   - Use semantic HTML and meaningful class names or IDs for key elements.
   - Add data-component-id attributes to major sections (header, nav, main, footer, etc.) for component counting.
   - Maintain consistent naming for similar components.
4) Usability baseline:
   - Include header/nav, a main area with key modules, and a footer.
   - Use modern UI patterns: cards, buttons, inputs, badges, chips, list/detail patterns as appropriate.
5) Visual system:
   - Use CSS variables in :root for a consistent color palette and spacing system.
6) Images rule:
   - Use inline SVG placeholders or gradient/shape placeholders with short labels (e.g. "Product image").
   - Limit images to <= 6 total.
7) Example item limits:
   - If you include lists/grids (products/cards/rows), include ONLY 6–10 sample items.
   - Avoid large repeated content.
8) Responsive strategy:
   - Follow the TARGET VIEWPORT below; do not default to mobile when user requested desktop.
9) Semantic HTML:
   - Use header/nav/main/section/footer and meaningful headings.

QUALITY TARGET:
- Output should look "usable" and coherent, not a wireframe.
- Keep total output reasonably compact (< ~40KB if possible, ~800 lines max).
- All text content must be in Chinese (中文).`;

      if (input.stylePreset === 'neutral') systemPrompt += `\n\n${NEUTRAL_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'cyberpunk') systemPrompt += `\n\n${CYBERPUNK_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'warm') systemPrompt += `\n\n${WARM_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'brutal') systemPrompt += `\n\n${BRUTAL_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'glass') systemPrompt += `\n\n${GLASS_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'flat') systemPrompt += `\n\n${FLAT_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'corporate') systemPrompt += `\n\n${CORPORATE_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'neo') systemPrompt += `\n\n${NEO_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'bento') systemPrompt += `\n\n${BENTO_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'aurora') systemPrompt += `\n\n${AURORA_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'dark') systemPrompt += `\n\n${DARK_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'accessible') systemPrompt += `\n\n${ACCESSIBLE_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'clay') systemPrompt += `\n\n${CLAY_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'liquid') systemPrompt += `\n\n${LIQUID_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'soft') systemPrompt += `\n\n${SOFT_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'retro') systemPrompt += `\n\n${RETRO_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'y2k') systemPrompt += `\n\n${Y2K_STYLE_FRAGMENT}`;

      if (input.stylePreset === 'auto') {
        let injectedFromLock = false;
        const locked = input.designSystemLocked === true;
        const snapParsed = DesignSystemSnapshotSchema.safeParse(input.designSystemSnapshot);
        if (locked && snapParsed.success && snapParsed.data.markdownBlock?.trim()) {
          systemPrompt += `\n\n${truncateDesignSystemMarkdown(snapParsed.data.markdownBlock)}`;
          injectedFromLock = true;
          log('📐 [generateStaticUIFromText] 已注入锁定设计系统快照');
        } else if (locked && !snapParsed.success) {
          logWarn('[generateStaticUIFromText] designSystemLocked 但快照无效，将重新推荐');
        }
        if (!injectedFromLock) {
          const { markdown: recMd } = await resolveDesignSystemAuto({
            projectMeta: input.projectMeta,
            nodeLabel: input.nodeLabel || '页面',
            pageDescription: input.pageDescription,
            prompt: input.prompt,
            aiConfig: input.aiConfig,
            tier: 'draft',
          });
          if (recMd) {
            systemPrompt += `\n\n${truncateDesignSystemMarkdown(recMd)}`;
            log('📐 [generateStaticUIFromText] 已注入智能推荐设计系统（静态轨）');
          }
        }
        systemPrompt += `\n\n【智能推荐模式·静态 HTML】请严格遵循上方设计系统说明，保持单文件静态约束与中文文案。`;
        systemPrompt += UI_UX_PRO_MAX_GUIDANCE;
      }

      const viewportInstruction =
        input.viewportPreset === 'desktop'
          ? `\n\n## TARGET VIEWPORT: DESKTOP (PC)\n- Generate a **desktop/PC layout**: multi-column where appropriate, max-width ~1280px or 100%, optional sidebar, larger typography and spacing. Use \`max-width: 1280px\` or similar for main content. Do NOT use a single narrow column or mobile-first layout.\n- Body/main should look like a desktop page (e.g. side nav, wide content area), not a 375px mobile screen.`
          : `\n\n## TARGET VIEWPORT: MOBILE\n- Generate a **mobile layout**: single column, width ~375px, touch targets, \`max-width: 100%\` with mobile-first styles.`;
      systemPrompt += viewportInstruction;

      const viewportLabel = input.viewportPreset === 'desktop' ? '桌面(PC)' : '移动端';
      const viewportFirstLine =
        input.viewportPreset === 'desktop'
          ? '【重要】目标设备：桌面(PC)。必须生成桌面端布局：宽屏（max-width 1280px）、多列或侧边栏+主内容区、大字号；禁止单列 375px 移动端布局。\n\n'
          : '';
      const userPrompt =
        viewportFirstLine +
        (input.prompt.trim() || `请为"${input.nodeLabel || '页面'}"生成静态 HTML 页面。

要求：
1. 根据描述设计合理的 UI 布局
2. **目标设备**：当前为「${viewportLabel}」，请按该视口生成对应布局（桌面=宽屏多列，移动=单列窄屏）
3. 使用现代化的设计风格
4. 确保代码可以直接在浏览器中打开查看
5. 所有文本内容使用中文`);

      const result = await callText({
        model: textModel,
        prompt: `${systemPrompt}\n\n[USER REQUEST]\n${userPrompt}${getOutputFooter(stage)}`,
        timeoutMs: 600000, // 10 min - 代理/远程模型首 token 与长输出较慢，避免静态生成超时
        maxOutputTokens: 8000, // Limit output size
        aiConfig: input.aiConfig,
        actionName: 'generateStaticUI',
        mode: 'static',
      });

      if (!result.ok) {
        return mapAIResultToUIPipelineResponse(result, stage);
      }

      // Clean HTML and ensure stage marker
      let html = cleanHTML(result.data, stage);

      // Ensure it's a complete HTML document
      if (!html.includes('<!DOCTYPE html>') && !html.includes('<html')) {
        html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${input.nodeLabel || '页面'}</title>
  <style>
    :root {
      --color-bg: #ffffff;
      --color-surface: #f9fafb;
      --color-text: #111827;
      --color-muted: #6b7280;
      --color-primary: #3b82f6;
      --color-accent: #8b5cf6;
      --radius: 0.5rem;
      --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }
    body {
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--color-bg);
      color: var(--color-text);
    }
  </style>
</head>
<body>
${html}
${STAGE_MARKER_STATIC}
</body>
</html>`;
      } else {
        // Ensure stage marker is present
        if (!html.includes(STAGE_MARKER_STATIC)) {
          html = `${html}\n${STAGE_MARKER_STATIC}`;
        }
      }

      // Validate HTML
      const validation = validateHTML(html, stage);
      if (!validation.valid) {
        logError('❌ [generateStaticUIFromText] HTML validation failed', {
          errors: validation.errors,
          meta: validation.meta,
        });
        return {
          ok: false,
          type: 'VALIDATION',
          message: `HTML validation failed: ${validation.errors.join('; ')}`,
          retryable: false,
        };
      }

      // Output size check
      const htmlLines = html.split('\n').length;
      const htmlSizeKB = html.length / 1024;
      if (htmlLines > 1000 || htmlSizeKB > 50) {
        logError('❌ [generateStaticUIFromText] 输出超出长度限制', {
          lines: htmlLines,
          sizeKB: htmlSizeKB.toFixed(2),
        });
        return {
          ok: false,
          type: 'VALIDATION',
          message: `生成的 HTML 超出长度限制（${htmlLines} 行，${htmlSizeKB.toFixed(2)}KB）。请简化页面内容。`,
          retryable: false,
        };
      }

      log('✅ [generateStaticUIFromText] 静态 HTML 生成完成', {
        htmlLength: html.length,
        htmlLines,
        meta: validation.meta,
      });

      return {
        ok: true,
        type: 'UI_HTML',
        stage,
        html,
        meta: validation.meta,
      };
    } catch (error) {
      logError('❌ [generateStaticUIFromText] Unexpected error', {
        error: error instanceof Error ? error.message : String(error),
      });
      
      return {
        ok: false,
        type: 'PROVIDER',
        message: `生成失败: ${error instanceof Error ? error.message : String(error)}`,
        retryable: false,
      };
    }
  });

// ==================== Stage 2: 美化 UI ====================

const BeautifyUIInputSchema = z.object({
  html: z.string().describe('当前 HTML 代码'),
  prompt: z.string().optional().describe('美化要求（可选）'),
  stylePreset: z.enum(STYLE_PRESETS).optional().default('neutral').describe('视觉风格预设，默认极简中性'),
  aiConfig: z.object({
    textModel: z.string().optional(),
  }).optional(),
});

export const beautifyUI = createServerAction()
  .input(BeautifyUIInputSchema)
  .handler(async ({ input }): Promise<UIPipelineResponse> => {
    const stage = 'BEAUTIFY' as const;
    
    try {
      log('🎨 [beautifyUI] 开始美化 UI', { stage });

      if (!getOpenAIKey()) {
        return {
          ok: false,
          type: 'PROVIDER',
          message: 'OPENAI_API_KEY 未配置',
          retryable: false,
        };
      }

      // Stitch 分轨：Stage 2 用 quality 模型，保证美化效果
      const textModel = getModelForTier('quality', 'text', input.aiConfig);

      let systemPrompt = `You are a senior UI visual designer and CSS expert.

TASK:
Beautify the provided HTML to look more production-ready.
You MUST keep the DOM structure stable and only improve the styling: spacing, typography, color harmony, alignment, component consistency, and responsive polish.

ALLOWED CHANGES (STRICT):
- You MAY edit/replace the contents of the existing <style> block.
- You MAY add new CSS variables and CSS rules.
- You MAY add CSS classes to existing elements ONLY if absolutely necessary for styling consistency.

FORBIDDEN CHANGES (CRITICAL):
- Do NOT add any <script>.
- Do NOT add, remove, reorder, or move DOM elements.
- Do NOT change existing element IDs or key attributes.
- Do NOT change the meaning of text content. Keep wording the same (minor punctuation is acceptable, but avoid content rewriting).

PRODUCTION-READY STANDARD:
- Consistent typography scale and readable line heights.
- Improved contrast and hierarchy.
- Harmonized color palette (primary + neutrals + accent), using CSS variables.
- Cleaner spacing system (8px-based or similar) and aligned grid.
- Buttons/inputs/cards look consistent across the page.
- Mobile polish at <= 768px (font sizes, spacing, stacking).

CSS CONCISENESS:
- Prefer variables and reusable selectors.
- Avoid long repetitive per-element styles.`;

      if (input.stylePreset === 'neutral') systemPrompt += `\n\n${NEUTRAL_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'cyberpunk') systemPrompt += `\n\n${CYBERPUNK_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'warm') systemPrompt += `\n\n${WARM_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'brutal') systemPrompt += `\n\n${BRUTAL_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'glass') systemPrompt += `\n\n${GLASS_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'flat') systemPrompt += `\n\n${FLAT_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'corporate') systemPrompt += `\n\n${CORPORATE_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'neo') systemPrompt += `\n\n${NEO_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'bento') systemPrompt += `\n\n${BENTO_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'aurora') systemPrompt += `\n\n${AURORA_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'dark') systemPrompt += `\n\n${DARK_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'accessible') systemPrompt += `\n\n${ACCESSIBLE_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'clay') systemPrompt += `\n\n${CLAY_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'liquid') systemPrompt += `\n\n${LIQUID_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'soft') systemPrompt += `\n\n${SOFT_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'retro') systemPrompt += `\n\n${RETRO_STYLE_FRAGMENT}`;
      if (input.stylePreset === 'y2k') systemPrompt += `\n\n${Y2K_STYLE_FRAGMENT}`;

      const userPrompt = input.prompt 
        ? `美化要求：${input.prompt}\n\n[CURRENT HTML]\n${input.html}`
        : `[CURRENT HTML]\n${input.html}`;

      const result = await callText({
        model: textModel,
        prompt: `${systemPrompt}\n\n${userPrompt}${getOutputFooter(stage)}`,
        timeoutMs: 180000, // 3 min - 美化阶段输入含整页 HTML，代理下易超时
        maxOutputTokens: 12000, // Limit output size
        aiConfig: input.aiConfig,
        actionName: 'beautifyUI',
        mode: 'beautify',
      });

      if (!result.ok) {
        return mapAIResultToUIPipelineResponse(result, stage);
      }

      // Clean HTML and ensure stage marker
      let html = cleanHTML(result.data, stage);

      // Validate HTML
      const validation = validateHTML(html, stage);
      if (!validation.valid) {
        logError('❌ [beautifyUI] HTML validation failed', {
          errors: validation.errors,
          meta: validation.meta,
        });
        return {
          ok: false,
          type: 'VALIDATION',
          message: `HTML validation failed: ${validation.errors.join('; ')}`,
          retryable: false,
        };
      }

      // Structure preservation check
      const inputMainElements = (input.html.match(/<(header|nav|main|section|footer|article|aside)[\s>]/gi) || []).length;
      const outputMainElements = (html.match(/<(header|nav|main|section|footer|article|aside)[\s>]/gi) || []).length;
      
      if (inputMainElements > 0 && outputMainElements < inputMainElements * 0.8) {
        logError('❌ [beautifyUI] 结构验证失败：主要元素数量显著减少', {
          inputMainElements,
          outputMainElements,
        });
        return {
          ok: false,
          type: 'VALIDATION',
          message: `美化失败：页面结构发生了重大变化。请重试。`,
          retryable: false,
        };
      }

      log('✅ [beautifyUI] UI 美化完成', {
        htmlLength: html.length,
        meta: validation.meta,
      });

      return {
        ok: true,
        type: 'UI_HTML',
        stage,
        html,
        meta: validation.meta,
      };
    } catch (error) {
      logError('❌ [beautifyUI] Unexpected error', {
        error: error instanceof Error ? error.message : String(error),
      });
      
      return {
        ok: false,
        type: 'PROVIDER',
        message: `美化失败: ${error instanceof Error ? error.message : String(error)}`,
        retryable: false,
      };
    }
  });

// ==================== Stage 3: 添加交互 ====================

const AddInteractionsInputSchema = z.object({
  html: z.string().describe('当前 HTML 代码'),
  prompt: z.string().optional().describe('交互要求（可选）'),
  aiConfig: z.object({
    textModel: z.string().optional(),
  }).optional(),
});

export const addInteractions = createServerAction()
  .input(AddInteractionsInputSchema)
  .handler(async ({ input }): Promise<UIPipelineResponse> => {
    const stage = 'INTERACT' as const;
    
    try {
      log('⚡ [addInteractions] 开始添加交互逻辑', { stage });

      if (!getOpenAIKey()) {
        return {
          ok: false,
          type: 'PROVIDER',
          message: 'OPENAI_API_KEY 未配置',
          retryable: false,
        };
      }

      // Stitch 分轨：Stage 3 用 quality 模型，保证交互逻辑质量
      const textModel = getModelForTier('quality', 'text', input.aiConfig);

      const systemPrompt = `You are a senior frontend engineer.

TASK:
Add lightweight, reliable interactions to the provided HTML to turn it into a clickable prototype.
Keep structure stable. Use vanilla JavaScript only. Do not use external libraries.

INTERACTION GOALS (choose 3–6 that best match the UI):
- Tabs / segmented control switching
- Modal open/close: MUST use a full-page overlay (backdrop) that fully covers the page (z-index above all content; opaque or semi-opaque). ESC and backdrop click close. No modal may allow background content to show through (遮罩必须完全遮盖下层).
- Collapsible sections / FAQ expand-collapse
- Search/filter over existing sample items (front-end only)
- Simple form validation with inline errors
- Toast / inline feedback message
- Counter (+/-) e.g. cart quantity
- Optional: theme toggle (light/dark) using CSS variables

STRICT RULES:
1) Output is still one single HTML file. No external assets, no CDNs.
2) DOM stability:
   - Do NOT delete any existing nodes.
   - Do NOT reorder existing sections.
   - Minimize any new DOM additions. If you must add, add at most 1–2 small containers (e.g., toast root, modal root).
3) JavaScript policy:
   - You MAY add exactly ONE <script> block, placed before </body>.
   - Use event delegation: attach 1–2 listeners at document level (e.g., document.addEventListener('click', ...)).
   - Use a data-action pattern:
     - Add data-action="..." on clickable elements (e.g. open-modal, close-modal, toggle-collapse, switch-tab, inc, dec).
     - Use data-target or aria-controls to link triggers to panels when needed.
   - State management:
     - Prefer data-state attributes + ARIA (aria-expanded, aria-hidden, aria-selected).
     - Keep state minimal; avoid complex global state objects.
   - Must never throw runtime errors even if elements are missing (defensive checks required).
4) Output length constraint: <script> tag content should not exceed 250 lines.

ACCESSIBILITY (REQUIRED):
- Modal (弹窗/浮窗):
  - Backdrop MUST fully cover the entire page (position:fixed; inset:0; high z-index; background that blocks view of content below). No background elements may show through (必须遮盖).
  - ESC closes; backdrop click closes (when clicking outside content).
  - On open, focus moves into the modal (first focusable element or modal container).
  - On close, restore focus to the trigger when possible.
  - Use role="dialog" and aria-modal="true".
- Collapsibles:
  - Use aria-expanded and aria-controls.
- Tabs (if implemented):
  - Use aria-selected, role="tablist"/"tab"/"tabpanel" where feasible.

STYLE CHANGES:
- Only add minimal CSS needed for interaction states (e.g. .is-hidden, .is-active, modal backdrop).
- Do NOT redesign the page visually in this stage.
- All text content must be in Chinese (中文).`;

      const userPrompt = input.prompt 
        ? `交互要求：${input.prompt}\n\n[CURRENT HTML]\n${input.html}`
        : `[CURRENT HTML]\n${input.html}`;

      const result = await callText({
        model: textModel,
        prompt: `${systemPrompt}\n\n${userPrompt}${getOutputFooter(stage)}`,
        timeoutMs: 180000, // 3 min - 交互阶段输入含整页 HTML，代理下预留余量
        maxOutputTokens: 10000, // Limit output size
        aiConfig: input.aiConfig,
        actionName: 'addInteractions',
        mode: 'interactions',
      });

      if (!result.ok) {
        return mapAIResultToUIPipelineResponse(result, stage);
      }

      // Clean HTML and ensure stage marker
      let html = cleanHTML(result.data, stage);

      // Validate HTML
      const validation = validateHTML(html, stage);
      if (!validation.valid) {
        // For INTERACT stage, script is required
        if (validation.errors.some(e => e.includes('script') && !e.includes('must not contain'))) {
          // This is OK for INTERACT stage
        } else {
          logError('❌ [addInteractions] HTML validation failed', {
            errors: validation.errors,
            meta: validation.meta,
          });
          return {
            ok: false,
            type: 'VALIDATION',
            message: `HTML validation failed: ${validation.errors.join('; ')}`,
            retryable: false,
          };
        }
      }

      // Check script length
      const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
      if (scriptMatches) {
        for (const scriptTag of scriptMatches) {
          const scriptContent = scriptTag.replace(/<script[^>]*>|<\/script>/gi, '');
          const scriptLines = scriptContent.split('\n').filter(l => l.trim().length > 0).length;
          if (scriptLines > 250) {
            logError('❌ [addInteractions] 脚本代码超出长度限制', {
              scriptLines,
              limit: 250,
            });
            return {
              ok: false,
              type: 'VALIDATION',
              message: `交互代码超出长度限制（${scriptLines} 行，上限 250 行）。请简化交互逻辑。`,
              retryable: false,
            };
          }
        }
      }

      log('✅ [addInteractions] 交互逻辑添加完成', {
        htmlLength: html.length,
        meta: validation.meta,
        scriptTags: scriptMatches?.length || 0,
      });

      return {
        ok: true,
        type: 'UI_HTML',
        stage,
        html,
        meta: validation.meta,
      };
    } catch (error) {
      logError('❌ [addInteractions] Unexpected error', {
        error: error instanceof Error ? error.message : String(error),
      });
      
      return {
        ok: false,
        type: 'PROVIDER',
        message: `添加交互失败: ${error instanceof Error ? error.message : String(error)}`,
        retryable: false,
      };
    }
  });

// Export legacy types for backward compatibility (will be removed later)
export type GenerateStaticUIResponse = UIPipelineResponse;
export type BeautifyUIResponse = UIPipelineResponse;
export type AddInteractionsResponse = UIPipelineResponse;


