'use server';

import { createServerAction } from 'zsa';
import { z } from 'zod';
import { log, logError, logWarn } from '@/lib/logger';
import { getTextModel, getVisionModel, getOpenAIKey } from '@/lib/ai-config';
import { callText, callObject } from '@/lib/ai/llm';
import { extractTaggedBlock } from '@/lib/ai/protocol';
import { buildFallbackGraph } from '@/lib/graph/fallback-graph';
import { safeParseZodJson } from '@/lib/ai/json-extract';
import { processIntentForCreate } from '@/lib/prompts/intent-processor';
import type { FractalNode, EdgeNavMeta } from '@/types/fractal';
import type { Edge } from 'reactflow';

const GenerateGraphInputSchema = z.object({
  prompt: z.string(),
  mediaBase64: z.string().optional(),
  mediaType: z.enum(['image', 'video']).optional(),
  attachmentContent: z.string().optional(),
  attachmentType: z.enum(['media', 'text']).optional(),
  mimeType: z.string().optional(),
  aiConfig: z.object({
    visionModel: z.string().optional(),
    textModel: z.string().optional(),
  }).optional(),
});

// 定义 User Story Schema（用于 AI 返回 - 用户故事模型）
const UserStorySchema = z.object({
  id: z.string().describe('用户故事唯一标识符（如：US-001）'),
  role: z.string().describe('角色（As a...，如：新闻协调部发起人、审批人）'),
  activity: z.string().describe('动作（I want to...，如：发起重要宣传指令并选择总编室）'),
  value: z.string().describe('价值（So that...，如：确保指令能够进入串行审批流）'),
  acceptanceCriteria: z.array(z.string()).describe('验收标准（Acceptance Criteria，包含具体的UI规则、逻辑规则、数据规则）'),
});

// 定义 Business Context Schema（业务背景信息）
const BusinessContextSchema = z.object({
  domain: z.string().optional().describe('业务领域（如：新闻指令业务、电商订单）'),
  role: z.string().optional().describe('用户角色（如：发起人、审批人、记者）'),
  goal: z.string().optional().describe('业务目标（如：发起任务、审批流程）'),
});

// 定义 Process Flow Step Schema（流转步骤）
const ProcessFlowStepSchema = z.object({
  step: z.number().describe('步骤序号'),
  action: z.string().describe('动作名称（如：权限校验、路由计算、状态变更）'),
  desc: z.string().describe('动作描述'),
});

// 定义 Business Event Schema（业务事件）
const BusinessEventSchema = z.object({
  id: z.string().describe('事件唯一标识符（如：EVT-001）'),
  name: z.string().describe('事件名称（如：提交指令事件、自动保存草稿）'),
  trigger: z.string().describe('触发条件（如：点击提交按钮、每30秒、系统定时任务）'),
  type: z.enum(['UserAction', 'SystemTimer', 'ExternalCallback']).describe('事件类型：UserAction（用户动作）、SystemTimer（系统定时）、ExternalCallback（外部回调）'),
  processFlow: z.array(ProcessFlowStepSchema).describe('具体的流转逻辑链（步骤序列）'),
  outcome: z.string().describe('最终结果（如：跳转至列表页、发送通知、更新状态）'),
});

// 定义 Data Query Schema（数据查询需求）
const DataQuerySchema = z.object({
  id: z.string().describe('查询唯一标识符（如：Q-001）'),
  description: z.string().describe('查询描述（如：查询活跃任务按优先级排序）'),
  sorting: z.string().optional().describe('排序规则（如：按优先级降序、按创建时间升序）'),
  filtering: z.string().optional().describe('过滤逻辑（如：只显示状态为"进行中"的任务）'),
  dataSource: z.string().optional().describe('数据源定义（如：从任务表查询、从API获取）'),
});

// 定义 AI 返回的节点结构 Schema（包含用户故事、业务背景和业务事件）
const NodeSchema = z.object({
  id: z.string().describe('节点唯一标识符（简短有意义，如 "home_page", "user_profile"）'),
  label: z.string().describe('节点显示名称（中文）'),
  type: z.enum(['page']).describe('节点类型：page（页面），每个节点代表一个物理页面/屏幕'),
  pageType: z.enum(['Action', 'View']).describe('页面功能类型：Action（表单/编辑器，数据创建/修改）、View（列表/仪表板，数据消费）'),
  description: z.string().optional().describe('页面详细描述，包含状态变化、角色权限等'),
  userStories: z.array(UserStorySchema).optional().describe('用户故事列表（按用户故事保存逻辑，Agile/Scrum 标准格式）'),
  businessContext: BusinessContextSchema.optional().describe('业务背景信息（Domain、Role、Goal）'),
  events: z.array(BusinessEventSchema).optional().describe('业务事件列表（事件驱动模型，包含详细的流转逻辑）- 仅用于Action类型页面'),
  dataQueries: z.array(DataQuerySchema).optional().describe('数据查询需求列表（排序、过滤、数据源定义）- 仅用于View类型页面'),
});

// Edge Navigation Metadata Schema（导航元数据）
const EdgeNavMetaSchema = z.object({
  trigger: z.enum(['ROLE_ENTRY', 'PERMISSION_ENTRY', 'UI_CLICK', 'SYSTEM_REDIRECT']).describe('触发类型：ROLE_ENTRY（按角色进入）、PERMISSION_ENTRY（按权限进入）、UI_CLICK（点击按钮）、SYSTEM_REDIRECT（系统重定向）'),
  conditionType: z.enum(['role', 'permission', 'expression', 'none']).describe('条件类型：role（角色）、permission（权限）、expression（表达式）、none（无条件）'),
  condition: z.object({
    roles: z.array(z.string()).optional().describe('角色列表（conditionType=role 时必需，如：["admin", "editor"]）'),
    permissions: z.array(z.string()).optional().describe('权限列表（conditionType=permission 时必需，如：["read:orders", "write:orders"]）'),
    expr: z.string().optional().describe('表达式（conditionType=expression 时必需，支持 role == "xx" 和 has("perm") 两种模式）'),
  }).describe('条件配置'),
  sourceHint: z.object({
    elementText: z.string().optional().describe('触发元素文本（优先，如按钮文案"提交"、"进入工作台"）'),
    elementId: z.string().optional().describe('触发元素 ID（可推断时）'),
    elementSelector: z.string().optional().describe('触发元素选择器（可推断时）'),
  }).optional().describe('触发来源提示（当 trigger=UI_CLICK 且能从描述中定位按钮/文案时必需）'),
  priority: z.number().optional().describe('优先级（多分支时选择顺序，数字越大优先级越高，默认 0）'),
});

const EdgeSchema = z.object({
  source: z.string().describe('源节点 ID'),
  target: z.string().describe('目标节点 ID'),
  label: z.string().optional().describe('边的标签（连接关系描述）'),
  nav: EdgeNavMetaSchema.optional().describe('导航元数据（动作/跳转逻辑，必须包含）'),
});

// 定义全局用户旅程 Schema（Epics - 跨多个页面的长流程）
const UserJourneySchema = z.object({
  id: z.string().describe('旅程唯一标识符（如：JOURNEY_01）'),
  name: z.string().describe('旅程名称（如：完成材料收集循环）'),
  actor: z.string().describe('执行者角色（如：发起人、审批人）'),
  narrative: z.string().describe('旅程叙述（As a... I want to... So that...）'),
  steps: z.array(z.string()).describe('旅程步骤列表（如：["Initiate", "Approve", "Execute"]）'),
});

// 定义全局业务事件 Schema（领域事件 - 影响整个系统的状态变化）
const GlobalBusinessEventSchema = z.object({
  id: z.string().describe('全局事件唯一标识符（如：EVENT_01）'),
  name: z.string().describe('事件名称（如：OrderConfirmed、InstructionPublished）'),
  trigger: z.string().describe('触发条件（如：Payment Success、用户提交审批）'),
  outcome: z.string().describe('系统级影响（如：通知所有相关用户、更新全局状态）'),
});

// 定义全局架构 Schema
const GlobalArchitectureSchema = z.object({
  userJourneys: z.array(UserJourneySchema).describe('全局用户旅程列表（Epics）'),
  businessEvents: z.array(GlobalBusinessEventSchema).describe('全局业务事件列表（领域事件）'),
});

// 定义可追溯性 Schema（页面与全局架构的映射）
const TraceabilitySchema = z.object({
  implementsJourney: z.string().optional().describe('实现的用户旅程ID（如：JOURNEY_01）'),
  journeyStep: z.string().optional().describe('在旅程中的步骤（如：Initiate、Approve）'),
  triggersEvent: z.array(z.string()).optional().describe('触发的全局事件ID列表（仅用于Action页面）'),
  consumesEvent: z.array(z.string()).optional().describe('消费的全局事件ID列表（仅用于View页面，显示事件结果）'),
});

// 更新 NodeSchema 以包含可追溯性
const NodeSchemaWithTraceability = NodeSchema.extend({
  traceability: TraceabilitySchema.optional().describe('页面与全局架构的可追溯性映射'),
});

// 定义输入模糊度分析 Schema (for single-call response)
const ClaritySchema = z.object({
  confidence: z.number().min(0).max(100).describe('输入明确度（0-100），>=60为明确，<60为模糊'),
  isVague: z.boolean().describe('是否模糊（confidence < 60）'),
  domain: z.string().optional().describe('检测到的业务领域（如：Enterprise Management、Inventory Management）'),
  object: z.string().optional().describe('检测到的业务对象（如：Paint、Reimbursement、Customer）'),
  action: z.string().optional().describe('检测到的核心动作（如：Stocktaking、Approving、Selling）'),
});

// 向后兼容：用于 analyzeInputClarity 函数（已废弃，但保留以避免破坏现有代码）
const InputClarityAnalysisSchema = ClaritySchema.extend({
  detectedDomain: ClaritySchema.shape.domain,
  detectedBusinessObject: ClaritySchema.shape.object,
  detectedAction: ClaritySchema.shape.action,
});

// 定义澄清请求选项 Schema
const ClarificationOptionSchema = z.object({
  id: z.string().describe('场景ID（如：scenario_inventory）'),
  label: z.string().describe('场景标签（如：Inventory & Asset Management）'),
  desc: z.string().describe('场景描述（如：Best for: Managing physical items...）'),
  example: z.string().describe('功能示例（如：Features: Barcode scanning...）'),
});

// 定义澄清请求 Schema
const ClarificationRequestSchema = z.object({
  type: z.literal('clarification_needed'),
  data: z.object({
    message: z.string().describe('澄清消息（如：To build the right "Enterprise Management" app...）'),
    options: z.array(ClarificationOptionSchema).describe('业务场景选项列表（3-4个不同的场景）'),
    question: z.string().describe('引导问题（如：Could you tell me what specific "Business Objects" you manage?）'),
  }),
});

// 定义单次调用返回 Schema（包含 clarity + graph）
const SingleCallResultSchema = z.object({
  clarity: ClaritySchema.describe('输入明确度分析'),
  graph: z.object({
    global: GlobalArchitectureSchema.describe('全局业务架构（用户旅程和领域事件）'),
    nodes: z.array(NodeSchemaWithTraceability).describe('节点列表（包含可追溯性信息）'),
    edges: z.array(EdgeSchema).describe('边列表（节点之间的连接关系）'),
  }),
});

// 定义图生成结果 Schema（保持向后兼容）
const GraphResultSchema = z.object({
  type: z.literal('graph_generated'),
  global: GlobalArchitectureSchema.describe('全局业务架构（用户旅程和领域事件）'),
  nodes: z.array(NodeSchemaWithTraceability).describe('节点列表（包含可追溯性信息）'),
  edges: z.array(EdgeSchema).describe('边列表（节点之间的连接关系）'),
});

// 定义条件结果 Schema（Union类型）
const ConditionalResultSchema = z.discriminatedUnion('type', [
  ClarificationRequestSchema,
  GraphResultSchema,
]);

// 分析输入模糊度的辅助函数
// CRITICAL: This function must NEVER throw. Always returns a valid result.
async function analyzeInputClarity(
  prompt: string,
  textModel: string,
  aiConfig?: { visionModel?: string; textModel?: string },
  attachmentContent?: string,
  mediaBase64?: string,
  mediaType?: 'image' | 'video'
): Promise<z.infer<typeof InputClarityAnalysisSchema>> {
  const requestId = `clarity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // 构建包含文件内容的分析内容
  let analysisContent = prompt.trim() || '用户输入为空';
  let hasFileContent = false;
  
  if (attachmentContent) {
    analysisContent += `\n\n附件内容：\n${attachmentContent}`;
    hasFileContent = true;
  }
  
  if (mediaBase64) {
    const mediaTypeText = mediaType === 'image' ? '图片' : '视频';
    if (mediaType === 'image') {
      analysisContent += `\n\n用户上传了${mediaTypeText}文件（图片内容将作为视觉输入进行分析）。`;
    } else {
      analysisContent += `\n\n用户上传了${mediaTypeText}文件，请结合文件内容进行分析。`;
    }
    hasFileContent = true;
  }
  
  // 如果有图片，需要使用 vision 模型
  const useVisionModel = mediaBase64 && mediaType === 'image';
  const model = useVisionModel 
    ? getVisionModel(aiConfig)
    : textModel;
  
  log('🔍 [analyzeInputClarity] 开始分析输入模糊度', {
    requestId,
    hasText: !!prompt,
    hasAttachment: !!attachmentContent,
    hasMedia: !!mediaBase64,
    mediaType,
    useVisionModel,
    model,
  });
  
  const userPrompt = `# Role
AI Product Consultant & Requirement Analyst.

# Task
Analyze the user input (including any uploaded files) to determine if it contains enough context to generate a specific Product Site Map.

# 🧠 Core Logic: The Ambiguity Filter

## Context Analysis Criteria
Analyze the input depth. Consider BOTH the text description AND any uploaded file content (images, documents, flowcharts, etc.).
Ask yourself: *Do I know the specific **Business Object** (e.g., Paint, Reimbursement, Customer) and the **Core Action** (e.g., Stocktaking, Approving, Selling)?*

**Important**: If the user has uploaded files (images, documents, etc.), analyze the content of those files as well. Files may contain detailed requirements, flowcharts, specifications, or other context that makes the input more specific.

### Vague Input Indicators (Confidence < 60%):
- Generic terms: "enterprise app", "management system", "tool for my team"
- No specific business object mentioned (in text OR files)
- No specific workflow or action described (in text OR files)
- Too high-level or abstract
- Uploaded files don't contain enough detail to clarify the business scenario

### Specific Input Indicators (Confidence >= 60%):
- Specific business objects: "Paint inventory", "Reimbursement approval", "CRM for real estate"
- Clear workflows: "approval process", "order management", "customer tracking"
- Specific domain context: "material collection", "news coordination"
- Uploaded files (images/documents) contain detailed requirements, flowcharts, or specifications that clarify the business scenario

## Output Requirements
You MUST output ONLY one tagged block in this exact format:
<AI_JSON>
{
  "confidence": <integer 0-100>,
  "isVague": <boolean>,
  "detectedDomain": "<string or empty>",
  "detectedBusinessObject": "<string or empty>",
  "detectedAction": "<string or empty>"
}
</AI_JSON>

Rules:
- Output ONLY one <AI_JSON> block
- No second block
- No other JSON outside the block
- JSON must be valid and complete
- All required fields must be present

Analyze the following input: "${analysisContent}"`;

  // Call LLM gateway with callText
  const result = await callText({
    model,
    prompt: userPrompt,
    timeoutMs: 30000, // 30s timeout for clarity analysis
    aiConfig,
  });

  // Handle errors - return fallback instead of throwing
  if (!result.ok) {
    logError('❌ [analyzeInputClarity] 分析失败，使用 fallback', {
      requestId,
      errorType: result.type,
      errorMessage: result.message,
    });
    
    // Return fallback clarity - never throw
    return {
      confidence: 45,
      isVague: true,
      detectedDomain: '',
      detectedBusinessObject: '',
      detectedAction: '',
    };
  }

  // Extract tagged block
  const block = extractTaggedBlock(result.data, 'AI_JSON');
  if (!block) {
    logError('❌ [analyzeInputClarity] Tagged block not found, using fallback', {
      requestId,
      rawPreview: result.data.substring(0, 200),
    });
    return {
      confidence: 45,
      isVague: true,
      detectedDomain: '',
      detectedBusinessObject: '',
      detectedAction: '',
    };
  }

  // 使用 safeParseZodJson 进行可恢复解析
  // 确保 block 是 string 类型
  const blockText = typeof block === 'string' ? block : String(block || '');
  
  if (!blockText || blockText.trim().length === 0) {
    logWarn('⚠️ [analyzeInputClarity] Block is empty, using fallback', {
      requestId,
    });
    return {
      confidence: 45,
      isVague: true,
      detectedDomain: '',
      detectedBusinessObject: '',
      detectedAction: '',
    };
  }
  
  const parseResult = safeParseZodJson(blockText, InputClarityAnalysisSchema);
  
  if (!parseResult.ok) {
    logWarn('⚠️ [analyzeInputClarity] JSON parse failed, using fallback', {
      requestId,
      error: parseResult.error,
      rawPreview: parseResult.raw || blockText.substring(0, 200),
    });
    return {
      confidence: 45,
      isVague: true,
      detectedDomain: '',
      detectedBusinessObject: '',
      detectedAction: '',
    };
  }

  // 解析成功，使用结果
  const analysisResult = parseResult.data;

  log('📊 [analyzeInputClarity] 模糊度分析完成', {
    requestId,
    confidence: analysisResult.confidence,
    isVague: analysisResult.isVague,
    detectedDomain: analysisResult.detectedDomain,
    detectedBusinessObject: analysisResult.detectedBusinessObject,
    detectedAction: analysisResult.detectedAction,
    hasFileContent,
  });

  return analysisResult;
}

// 生成澄清请求的辅助函数
async function generateClarificationRequest(
  analysis: z.infer<typeof InputClarityAnalysisSchema>,
  textModel: string,
  hasMediaOrAttachment: boolean = false
): Promise<z.infer<typeof ClarificationRequestSchema>> {
  const domain = analysis.detectedDomain || 'Enterprise Management';
  
  const mediaContext = hasMediaOrAttachment 
    ? '\n\nNote: The user has uploaded a file (image/document), but the text description is still too vague. The clarification should help them specify what type of business scenario they want to build, even with the uploaded file.'
    : '';
  
  const clarificationPrompt = `# Role
AI Product Consultant.

# Task
Generate a clarification request to help the user specify their business needs.

# Context
The user's input was too vague. Detected domain: "${domain}"${mediaContext}

# Requirements
Generate 3-4 distinct business scenarios (archetypes) that differ significantly for the "${domain}" domain.

Each scenario should:
1. Target different business objects (e.g., physical goods vs. workflows vs. people)
2. Have distinct use cases and features
3. Be clearly differentiated from others

Common archetypes for "${domain}" domain:
- Inventory & Asset Management (physical items, warehousing, stocktaking)
- Office Automation / Workflow (internal processes, approvals, forms)
- Customer Relationship Management (people, sales, relationships)
- Financial Management (money, transactions, accounting)
- Content Management (documents, media, publishing)

Generate appropriate scenarios based on the detected domain.`;

  const ClarificationGenerationSchema = z.object({
    message: z.string().describe('澄清消息，包含检测到的领域'),
    options: z.array(ClarificationOptionSchema).describe('3-4个不同的业务场景选项'),
    question: z.string().describe('引导用户提供更多信息的问题'),
  });

  // Use unified LLM gateway
  const result = await callObject({
    model: textModel,
    schema: ClarificationGenerationSchema,
    messages: [
      {
        role: 'user',
        content: clarificationPrompt,
      },
    ],
    actionName: 'generateClarification',
    mode: 'clarification',
  });

  if (!result.ok) {
    // Return error union instead of throwing
    return {
      ok: false,
      type: result.type,
      message: result.message,
      cooldownSeconds: result.cooldownSeconds,
    } as any;
  }

  const clarificationData = result.data as z.infer<typeof ClarificationGenerationSchema>;

  return {
    type: 'clarification_needed' as const,
    data: clarificationData,
  };
}

export const generateGraph = createServerAction()
  .input(GenerateGraphInputSchema)
  .handler(async ({ input }) => {
    const t0 = Date.now();
    const requestId = `graph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let warnings: string[] = [];
    let fallbackUsed = false;
    let llmMetrics = { queuedMs: 0, dedupHit: false, totalMs: 0 };
    
    log('🚀 [generateGraph] 开始生成图结构（单次调用）', {
      requestId,
        promptLength: input.prompt.length,
        promptPreview: input.prompt.substring(0, 100),
        hasMedia: !!input.mediaBase64,
        mediaType: input.mediaType,
      hasAttachment: !!input.attachmentContent,
      });

      if (!getOpenAIKey()) {
        logError('❌ [generateGraph] OPENAI_API_KEY 未配置', { requestId });
        return {
          ok: false,
          type: 'validation_error',
          message: 'OPENAI_API_KEY 未配置',
        };
      }

    // 获取文本模型
    const textModel = input.aiConfig?.textModel || getTextModel();

    // 意图加工：用户输入 → 增强后的用户 prompt（含领域范围说明）
    const rawPrompt = input.prompt.trim() || '请生成项目结构';
    const { enrichedUserPrompt } = processIntentForCreate(rawPrompt);
    let userPrompt = enrichedUserPrompt;
    if (input.attachmentContent) {
      const attachmentInfo = input.attachmentType === 'text' 
        ? `\n\n附件内容（${input.mimeType || '文本文件'}）：\n${input.attachmentContent}`
        : `\n\n附件已上传（${input.mimeType || '媒体文件'}），请参考附件内容进行分析。`;
      userPrompt += attachmentInfo;
    }
    if (input.mediaBase64) {
      userPrompt += `\n\n注意：用户上传了${input.mediaType === 'image' ? '图片' : '视频'}文件，请结合图片/视频内容进行分析。`;
    }

    // 构建系统提示词 - 单次调用，同时生成 clarity + graph
      const systemPrompt = `# Role
Product Solution Architect (Domain Driven Design Expert).

# Task
Analyze the User Input and generate BOTH:
1. **Clarity Analysis**: Assess input clarity (confidence, isVague, domain, object, action)
2. **Graph Structure**: Generate Global Business Architecture JSON using Top-Down Architecture strategy.

# 📐 Scope Rule (CRITICAL)
- **页面数量与类型由你根据用户描述与业务完整性自行推断**，不要依赖固定数字或模板。
- 根据用户意图推断：需要多少节点、每个节点代表什么页面/功能、节点间如何连接；可能是 3 页、8 页或更多，以**业务完整、逻辑自洽**为准。
- 若用户描述较简略，基于对领域与目标的理解推断完整页面集合，并为每个节点填写足够的 description、userStories，便于后续生成 UI。
- **禁止**替用户做业务决策时使用固定列表（如「必须包含首页+列表+设置」）；只输出你推断出的、与用户意图一致的节点集合。

# 🧠 Processing Strategy: Top-Down Architecture

## Phase 1: Global Context Extraction (The Big Picture)
**BEFORE looking at screens**, extract the **Global Business Logic**.

### Step 1.1: User Journeys (Epics) Extraction
Identify the **long-running stories** that span multiple pages.
- **Format**: "As a [Role], I want to [Achieve Big Goal], So that [Value]."
- **Characteristics**: 
  - Cross-page workflows (e.g., "Complete the Material Collection Loop")
  - Multi-step processes (e.g., "Initiate → Approve → Execute")
  - Business-critical user goals
- **Example**: 
  - Journey: "Complete Order Processing"
  - Steps: ["Create Order", "Payment", "Fulfillment", "Delivery"]
  - Actor: "Customer"

### Step 1.2: Domain Events (The Nervous System) Extraction
Identify **critical business state changes** that affect the whole system.
- **Criteria**: Events that:
  - Trigger notifications across modules
  - Cause state changes across multiple pages
  - Have time-based rules or deadlines
  - Require system-wide coordination
- **Examples**: 
  - "Instruction Published" (affects all subscribers)
  - "Deadline Reached" (triggers automatic actions)
  - "Task Rejected" (notifies multiple stakeholders)
  - "OrderConfirmed" (triggers fulfillment process)

## Phase 2: Page Mapping (The Implementation)
Map the physical screens (URL Routes) to the Global Context.

### Step 2.1: Link Pages to Journeys
For each page, identify:
- **Which User Journey** does this page implement? (implementsJourney)
- **Which step** of the journey does this page fulfill? (journeyStep)
- **Example**: 
  - Page: "Create Order Page" → Journey: "JOURNEY_01" → Step: "Create Order"

### Step 2.2: Link Pages to Global Events
For each page, identify its relationship to Global Events:

**For Action Pages (Producers)**:
- Which Global Event does this page **trigger**? (triggersEvent)
- Example: "Create Order Page" triggers "EVENT_01: OrderConfirmed"

**For View Pages (Consumers)**:
- Which Global Event results does this page **display**? (consumesEvent)
- Example: "Order List Page" consumes "EVENT_01: OrderConfirmed" (shows confirmed orders)

## Phase 3: Page-Level Details (Existing Logic)
After mapping to global context, extract page-level details:

# 🧠 Logic Classification Engine (The "Read/Write" Split)

## Step 1: Physical Page Extraction (The Stage)
Identify the physical screens (URL Routes).
- **Rule**: If the UI changes significantly or the URL changes, it is a Page Node.
- **Output**: \`nodes[].data.artifacts.view\`

## Step 2: Analyze Page Type (CRITICAL)
For each identified Page Node, determine its primary function:

### Type A (Action) Pages:
- **Characteristics**: Forms, Editors, Dialogs where data is **created/modified**
- **Examples**: "创建订单页", "编辑用户信息", "提交审批表单", "配置设置"
- **Key Indicators**: Submit buttons, Save actions, Create/Edit operations, Form inputs

### Type B (View) Pages:
- **Characteristics**: Lists, Dashboards, Details where data is **consumed/displayed**
- **Examples**: "订单列表页", "用户仪表板", "任务详情页", "数据报表"
- **Key Indicators**: Read-only displays, Tables, Charts, Search/Filter UI, No submit buttons

**Classification Rule**: 
- If the page has forms/editors with submit actions → **Type A (Action)**
- If the page only displays/search/filters data → **Type B (View)**

## Step 3: Apply Constraints based on Page Type

### For ALL Pages (Universal Requirements):
- **User Story**: MUST generate at least 1 User Story.
  - *Format*: "As a [Role], I want to [View/Act], So that [Value]."
  - *Example for Action*: "As a 发起人, I want to 创建任务, So that 任务能够进入审批流程."
  - *Example for View*: "As a 管理员, I want to 查看任务列表, So that 我可以监控任务状态."

### For Type A (Action) Pages - REQUIRED:
- **Business Events**: MUST generate at least 1 Business Event.
  - *Content*: State changes, Service calls, Notifications, Data persistence
  - *Example*: "Submit Order Event", "Approve Request Event", "Save Draft Event"
  - *Structure*: Each event must have trigger, processFlow (steps), and outcome
- **Data Queries**: **FORBIDDEN** (Do not generate dataQueries for Action pages)

### For Type B (View) Pages - REQUIRED:
- **Business Events**: **FORBIDDEN** (Do NOT invent fake events like "View Event" or "Load Data Event")
  - View pages do NOT have business events. They only consume data.
- **Data Queries**: MUST generate at least 1 Data Query Requirement.
  - *Content*: Sorting rules, Filter logic, Data source definition, Pagination
  - *Example*: 
    - "Query active tasks sorted by priority"
    - "Filter orders by status='pending' and date range"
    - "Load user dashboard data from user_stats table"

## Step 4: Business Context Extraction
For each page, identify:
- **Domain**: The business domain (e.g., "新闻指令业务", "电商订单")
- **Role**: The user role who operates this page (e.g., "发起人", "审批人", "记者")
- **Goal**: The business goal of this page (e.g., "发起任务", "审批流程", "查看报表")

## Step 5: Structural Storage
Store these findings strictly in:
- \`pageType\`: "Action" or "View" (REQUIRED for each page)
- \`userStories\`: Array of user stories (REQUIRED - at least 1 per page)
- \`businessContext\`: Domain, role, goal
- \`events\`: Array of business events (REQUIRED for Action pages, FORBIDDEN for View pages)
- \`dataQueries\`: Array of data queries (REQUIRED for View pages, FORBIDDEN for Action pages)

# 🚫 Strict Validation Rules

1. **Page Type Classification**: Every page MUST have \`pageType\` set to either "Action" or "View"

2. **User Stories**: Every page MUST have at least 1 user story (regardless of type)

3. **Action Page Validation**:
   - ✅ MUST have \`events\` array with at least 1 event
   - ❌ MUST NOT have \`dataQueries\` array
   - ❌ If \`pageType == 'Action' AND events.length == 0\`: ERROR

4. **View Page Validation**:
   - ❌ MUST NOT have \`events\` array (even if empty, do not include the field)
   - ✅ MUST have \`dataQueries\` array with at least 1 query
   - ❌ If \`pageType == 'View' AND events.length > 0\`: ERROR (Remove the event)
   - ❌ If \`pageType == 'View' AND dataQueries.length == 0\`: ERROR (Add query logic)

5. **No Logic Loss**: Every process mentioned in the input doc (e.g., "Auto-Rename", "Permission Check", "Auto-Confirm after 12h") MUST be mapped to a specific Event on a specific Action Page.

6. **No Service Nodes**: Do not draw services as visual nodes. They are actions inside the processFlow of an event.

7. **Event-Driven Structure** (for Action pages only): 
   - Each event must have: id, name, trigger, type, processFlow (array of steps), outcome
   - ProcessFlow steps must be sequential and specific
   - Event types: UserAction, SystemTimer, ExternalCallback

# Output Schema (Strict JSON)

Return JSON with the following structure:

\`\`\`json
{
  "global": {
    "userJourneys": [
      {
        "id": "JOURNEY_01",
        "name": "Story Name",
        "actor": "Role",
        "narrative": "As a... I want to... So that...",
        "steps": ["Initiate", "Approve", "Execute"]
      }
    ],
    "businessEvents": [
      {
        "id": "EVENT_01",
        "name": "Event Name (e.g. OrderConfirmed)",
        "trigger": "Condition (e.g. Payment Success)",
        "outcome": "System-wide effect"
      }
    ]
  },
  "nodes": [
    {
      "id": "page_id",
      "type": "page",
      "pageType": "Action" or "View",
      "label": "Page Name",
      "description": "Page description",
      "userStories": [...],
      "businessContext": {...},
      "events": [...], // Only for Action pages
      "dataQueries": [...], // Only for View pages
      "traceability": {
        "implementsJourney": "JOURNEY_01",
        "journeyStep": "Initiate",
        "triggersEvent": ["EVENT_01"], // Only for Action pages
        "consumesEvent": ["EVENT_01"] // Only for View pages
      }
    }
  ],
  "edges": [
    {
      "source": "page_id_1",
      "target": "page_id_2",
      "label": "连接关系描述（可选）",
      "nav": {
        "trigger": "UI_CLICK" | "ROLE_ENTRY" | "PERMISSION_ENTRY" | "SYSTEM_REDIRECT",
        "conditionType": "none" | "role" | "permission" | "expression",
        "condition": {
          "roles": ["admin", "editor"], // conditionType=role 时必需
          "permissions": ["read:orders"], // conditionType=permission 时必需
          "expr": "role == 'admin'" // conditionType=expression 时必需（支持 role == "xx" 和 has("perm")）
        },
        "sourceHint": {
          "elementText": "提交" // trigger=UI_CLICK 时优先填写按钮文案
        },
        "priority": 1 // 多分支时选择顺序，数字越大优先级越高
      }
    }
  ]
}
\`\`\`

**Critical Requirements for Edges (Navigation Metadata)**:
1. **Every edge MUST include \`nav\` metadata** - This is REQUIRED, not optional
2. **Trigger Types**:
   - \`ROLE_ENTRY\`: 首页按角色进入不同工作台（如：管理员进入管理台，编辑进入编辑台）
   - \`PERMISSION_ENTRY\`: 按数据权限进入不同页面（如：有"查看订单"权限进入订单列表）
   - \`UI_CLICK\`: 点击按钮进入下一页（如：点击"提交"按钮进入确认页）
   - \`SYSTEM_REDIRECT\`: 系统自动重定向（如：登录后跳转、超时跳转）
3. **Condition Types**:
   - \`none\`: 无条件跳转（默认，用于 UI_CLICK 和 SYSTEM_REDIRECT）
   - \`role\`: 角色条件（condition.roles 必需，如：["admin", "editor"]）
   - \`permission\`: 权限条件（condition.permissions 必需，如：["read:orders", "write:orders"]）
   - \`expression\`: 表达式条件（condition.expr 必需，支持 \`role == "xx"\` 和 \`has("perm")\`）
4. **Source Hint (for UI_CLICK)**:
   - When trigger=UI_CLICK, MUST fill \`sourceHint.elementText\` with button text (优先) or elementId/selector
   - Example: If description says "点击提交按钮", set elementText: "提交"
5. **Priority**: Set priority for multiple outgoing edges from same source (higher number = higher priority)
6. **Examples**:
   - Role-based entry: \`{ trigger: "ROLE_ENTRY", conditionType: "role", condition: { roles: ["admin"] } }\`
   - Button click: \`{ trigger: "UI_CLICK", conditionType: "none", sourceHint: { elementText: "提交" } }\`
   - Permission-based: \`{ trigger: "PERMISSION_ENTRY", conditionType: "permission", condition: { permissions: ["read:orders"] } }\`

**Critical Requirements**:
1. **Global Context First**: Generate \`global\` object BEFORE generating nodes
2. **Journey Mapping**: Every page MUST map to at least one User Journey step
3. **Event Mapping**: 
   - Action pages MUST have \`triggersEvent\` (at least one)
   - View pages SHOULD have \`consumesEvent\` (if they display event results)
4. **Traceability**: Every node MUST have \`traceability\` object with journey and event mappings
5. **Edge Navigation**: Every edge MUST have \`nav\` object with trigger, conditionType, and condition

# Output Format (Single JSON Object)
Return a single JSON object with this structure:
\`\`\`json
{
  "clarity": {
    "confidence": 85,
    "isVague": false,
    "domain": "Enterprise Management",
    "object": "Task",
    "action": "Managing"
  },
  "graph": {
    "global": { ... },
    "nodes": [ ... ],
    "edges": [ ... ]
  }
}
\`\`\`

**Critical**: Output ONLY one JSON object. Do not include markdown code blocks.`;

    const t1 = Date.now();
    log('⏱️ [generateGraph] t1: Prompt ready', {
      requestId,
      elapsedMs: t1 - t0,
    });

    // 单次 LLM 调用 - 通过 callText 和 runQueued
    const t2 = Date.now();
    let singleCallResult: z.infer<typeof SingleCallResultSchema> | null = null;
    let aiCallSuccess = false;
    let aiError: { type: 'RATE_LIMIT' | 'NETWORK' | 'PROVIDER' | 'PARSE'; message: string; cooldownSeconds?: number } | null = null;

    // 合并系统提示和用户提示
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    log('⏱️ [generateGraph] t2: Starting single LLM call via callText', {
      requestId,
      elapsedMs: t2 - t0,
    });

    const llmResult = await callText({
      model: textModel,
      prompt: fullPrompt,
      timeoutMs: 60000, // 60s timeout for graph generation
      aiConfig: input.aiConfig,
      actionName: 'generateGraph',
      attachments: input.attachmentContent || input.mediaBase64 || '',
      mode: 'single-call',
    });

    llmMetrics = llmResult.metrics;

    if (!llmResult.ok) {
      // Handle error from callText
      logError('❌ [generateGraph] LLM call failed', {
        requestId,
        errorType: llmResult.type,
        errorMessage: llmResult.message,
        llmMetrics,
      });
      aiError = {
        type: llmResult.type,
        message: llmResult.message,
        cooldownSeconds: llmResult.type === 'RATE_LIMIT' ? llmResult.cooldownSeconds : undefined,
      };
    } else {
      // Parse JSON from response using safeParseZodJson (可恢复解析)
      // 确保 llmResult.data 是 string 类型
      const responseText = typeof llmResult.data === 'string' ? llmResult.data : String(llmResult.data || '');
      
      if (!responseText || responseText.trim().length === 0) {
        logWarn('⚠️ [generateGraph] LLM 返回数据为空，使用降级图', {
          requestId,
          llmMetrics,
        });
        aiError = {
          type: 'PARSE',
          message: 'LLM 返回数据为空',
        };
      } else {
        const parseResult = safeParseZodJson(responseText, SingleCallResultSchema);
        
        if (parseResult.ok) {
          singleCallResult = parseResult.data;
          aiCallSuccess = true;
          log('✅ [generateGraph] AI 调用成功', {
            requestId,
            clarity: singleCallResult.clarity,
            nodesCount: singleCallResult.graph.nodes.length,
            edgesCount: singleCallResult.graph.edges.length,
            llmMetrics,
          });
        } else {
          // 解析失败，记录警告但不崩溃
          logWarn('⚠️ [generateGraph] JSON 解析失败，使用降级图', {
            requestId,
            error: parseResult.error,
            rawPreview: parseResult.raw || responseText.substring(0, 500),
            llmMetrics,
          });
          aiError = {
            type: 'PARSE',
            message: `JSON 解析失败: ${parseResult.error}`,
          };
        }
      }
    }

    const t2_end = Date.now(); // LLM call end
    log('⏱️ [generateGraph] t2_end: LLM call completed', {
      requestId,
      elapsedMs: t2_end - t2,
      success: aiCallSuccess,
      errorType: aiError?.type,
      llmMetrics,
    });

    // 如果 AI 调用失败（429/网络错误/解析错误）
    if (!aiCallSuccess && aiError) {
      // ✅ Rate Limit 错误：直接返回错误，不使用降级图
      if (aiError.type === 'RATE_LIMIT') {
        const t2_end = Date.now();
        return {
          type: 'rate_limit',
          message: aiError.message,
          cooldownSeconds: aiError.cooldownSeconds,
        };
      }
      
      // 其他错误：使用降级图
      logWarn('⚠️ [generateGraph] AI 调用失败，使用降级图', {
        requestId,
        errorType: aiError.type,
        errorMessage: aiError.message,
        llmMetrics,
      });

      fallbackUsed = true;
      const fallbackResult = buildFallbackGraph(input.prompt);
      
      const t3_fallback = Date.now();
      const totalDuration = t3_fallback - t0;
      log('✅ [generateGraph] 降级图生成完成', {
        requestId,
        totalDurationMs: totalDuration,
        t0,
        t1,
        t2,
        t2_end,
        t3: t3_fallback,
        nodesCount: fallbackResult.nodes.length,
        edgesCount: fallbackResult.edges.length,
        warnings: fallbackResult.warnings,
        llmMetrics,
      });

      // ✅ 返回扁平结构，nodes 和 edges 在顶层
      return {
        type: 'graph_generated',
        global: fallbackResult.global,
        nodes: fallbackResult.nodes,
        edges: fallbackResult.edges,
        warnings: [
          `AI 调用失败（${aiError.type}），已使用降级图生成`,
          ...fallbackResult.warnings,
        ],
        metrics: {
          t0,
          t1,
          t2,
          t3: t3_fallback,
          totalMs: totalDuration,
          queuedMs: llmMetrics.queuedMs,
          dedupHit: llmMetrics.dedupHit,
          fallbackUsed: true,
        },
      };
    }

    // AI 调用成功，验证结果
    if (!singleCallResult) {
      logError('❌ [generateGraph] Single call result is null', { requestId });
      fallbackUsed = true;
      const fallbackResult = buildFallbackGraph(input.prompt);
      const t3_null = Date.now();
      // ✅ 返回扁平结构，nodes 和 edges 在顶层
      return {
        type: 'graph_generated',
        global: fallbackResult.global,
        nodes: fallbackResult.nodes,
        edges: fallbackResult.edges,
        warnings: ['AI 返回结果为空，已使用降级图生成', ...fallbackResult.warnings],
        metrics: {
          t0,
          t1,
          t2,
          t3: t3_null,
          totalMs: t3_null - t0,
          queuedMs: llmMetrics.queuedMs,
          dedupHit: llmMetrics.dedupHit,
          fallbackUsed: true,
        },
      };
    }

    const graphResult = singleCallResult.graph;

    log('✅ [generateGraph] 开始处理 AI 结果', {
      requestId,
      nodesCount: graphResult.nodes.length,
      edgesCount: graphResult.edges.length,
      globalJourneysCount: graphResult.global.userJourneys.length,
      globalEventsCount: graphResult.global.businessEvents.length,
      });

      // 转换为 FractalNode 格式
    const nodes: FractalNode[] = graphResult.nodes
        .filter(node => node.type === 'page') // 只保留 page 类型
        .map((node, index) => {
          // 验证页面类型和逻辑分类规则
          const pageType = node.pageType || 'Action'; // 默认Action以兼容旧数据
          const isAction = pageType === 'Action';
          const isView = pageType === 'View';
          
          // 验证规则
          if (isAction) {
            if (!node.events || node.events.length === 0) {
              logError(`❌ [generateGraph] Action页面缺少业务事件: ${node.label}`, {
                nodeId: node.id,
                pageType,
              });
            }
            if (node.dataQueries && node.dataQueries.length > 0) {
              logWarn(`⚠️ [generateGraph] Action页面不应有数据查询，已移除: ${node.label}`, {
                nodeId: node.id,
                pageType,
                dataQueriesCount: node.dataQueries.length,
              });
            }
          }
          
          if (isView) {
            if (node.events && node.events.length > 0) {
              logWarn(`⚠️ [generateGraph] View页面不应有业务事件，已移除: ${node.label}`, {
                nodeId: node.id,
                pageType,
                eventsCount: node.events.length,
              });
            }
            if (!node.dataQueries || node.dataQueries.length === 0) {
              logError(`❌ [generateGraph] View页面缺少数据查询: ${node.label}`, {
                nodeId: node.id,
                pageType,
              });
            }
          }
          
          // 记录节点数据信息
          log(`📊 [generateGraph] 处理节点 ${index + 1}/${graphResult.nodes.length}: ${node.label}`, {
            nodeId: node.id,
            pageType,
            hasUserStories: !!node.userStories,
            userStoriesCount: node.userStories?.length || 0,
            hasEvents: !!node.events && isAction,
            eventsCount: isAction ? (node.events?.length || 0) : 0,
            hasDataQueries: !!node.dataQueries && isView,
            dataQueriesCount: isView ? (node.dataQueries?.length || 0) : 0,
            hasBusinessContext: !!node.businessContext,
          });
        // 计算节点位置（水平排列，每行最多3个）
        const rowIndex = Math.floor(index / 3);
        const colIndex = index % 3;
        const spacingX = 400;
        const spacingY = 250;
        const startX = 100;
        const startY = 200;

        return {
          id: node.id,
          type: 'page' as const, // 强制设置为 page，确保与 nodeTypes 中的键匹配
          position: {
            x: startX + colIndex * spacingX,
            y: startY + rowIndex * spacingY,
          },
          data: {
            label: node.label,
            artifacts: {
              view: {
                code: `function App() {
  return (
    <div className="p-8 bg-white">
      <h1 className="text-3xl font-bold text-gray-900">${node.label}</h1>
      <p className="mt-4 text-gray-600">这是 ${node.label} 页面</p>
    </div>
  );
}`,
              },
              spec: {
                title: node.label,
                requirements: (() => {
                  const reqs: string[] = [];
                  if (node.description) reqs.push(`页面描述：${node.description}`);
                  if (node.userStories?.length) {
                    const u = node.userStories[0];
                    reqs.push(`作为${u.role}，${u.activity}，以便${u.value}`);
                  }
                  if (reqs.length === 0) reqs.push(`页面：${node.label}`);
                  return reqs;
                })(),
              },
              impl: {
                apiEndpoints: [],
                dbSchema: '-- 将在后续阶段生成',
              },
              test: {
                cases: [],
              },
              // 用户故事模型（新 - 核心）
              userStories: node.userStories ? node.userStories.map(story => ({
                id: story.id,
                role: story.role,
                activity: story.activity,
                value: story.value,
                acceptanceCriteria: story.acceptanceCriteria || [],
              })) : undefined,
              // 业务背景信息
              businessContext: node.businessContext ? {
                domain: node.businessContext.domain,
                role: node.businessContext.role,
                goal: node.businessContext.goal,
              } : undefined,
              // 业务事件列表（事件驱动模型 - 仅用于Action类型页面）
              events: (isAction && node.events) ? node.events.map(event => ({
                id: event.id,
                name: event.name,
                trigger: event.trigger,
                type: event.type,
                processFlow: event.processFlow.map(step => ({
                  step: step.step,
                  action: step.action,
                  desc: step.desc,
                })),
                outcome: event.outcome,
              })) : undefined,
              // 数据查询需求列表（仅用于View类型页面）
              dataQueries: (isView && node.dataQueries) ? node.dataQueries.map(query => ({
                id: query.id,
                description: query.description,
                sorting: query.sorting,
                filtering: query.filtering,
                dataSource: query.dataSource,
              })) : undefined,
              // 可追溯性映射（页面与全局架构的关联）
              traceability: node.traceability ? {
                implementsJourney: node.traceability.implementsJourney,
                journeyStep: node.traceability.journeyStep,
                triggersEvent: node.traceability.triggersEvent || undefined,
                consumesEvent: node.traceability.consumesEvent || undefined,
              } : undefined,
            },
            syncState: {
              isSynced: false,
                lastSource: 'spec',
            },
            source: {
              type: 'ai',
            },
          },
        };
      });

      // 转换为 Edge 格式，保留 nav 元数据
      const edges: Edge[] = (graphResult.edges || []).map((edge, index) => {
        // 为 nav 提供默认值（向后兼容）
        const defaultNav = {
          trigger: 'UI_CLICK' as const,
          conditionType: 'none' as const,
          condition: {},
        };
        const nav = edge.nav || defaultNav;
        
        const edgeObj = {
        id: `edge-${edge.source}-${edge.target}-${index}`,
        source: edge.source,
        target: edge.target,
        label: edge.label || '',
        data: { nav },
          type: 'default' as const,
        markerEnd: {
          type: 'arrowclosed' as const,
        },
        } as Edge;
        return edgeObj;
      });

      // ============================================================================
      // Layer 2: 节点标准化算法 (The Collapse Algorithm)
      // ============================================================================
      /**
       * 识别并合并"伪节点"（逻辑碎片）到宿主页面的事件列表中
       * 
       * 算法逻辑：
       * 1. 识别"伪节点"：包含"点击"、"确认"、"服务"、"API"、"判断"等动词，或没有 view.code
       * 2. 寻找宿主：查看谁连线给了这个碎片（edge.source）
       * 3. 执行吞噬：将碎片转换为事件对象，注入到宿主页面的 events 列表
       * 4. 删除碎片：从 nodes 数组中删除
       * 5. 重连线路：如果碎片后面还有页面，直接连通宿主页面和目标页面
       */
      function normalizeNodes(nodes: FractalNode[], edges: Edge[]): { nodes: FractalNode[]; edges: Edge[] } {
        // 伪节点关键词（用于识别逻辑碎片）
        const fragmentKeywords = [
          '点击', '确认', '服务', 'API', '判断', '校验', '验证', '计算', '处理',
          '发送', '接收', '保存', '删除', '更新', '查询', '审批', '提交', '取消',
          'click', 'confirm', 'service', 'api', 'validate', 'check', 'process',
          'send', 'receive', 'save', 'delete', 'update', 'query', 'approve', 'submit', 'cancel'
        ];

        // 1. 分类：区分页面节点和逻辑碎片
        const pages: FractalNode[] = [];
        const fragments: FractalNode[] = [];
        const nodeMap = new Map<string, FractalNode>();

        nodes.forEach(node => {
          nodeMap.set(node.id, node);
          
          const label = node.data.label.toLowerCase();
          const hasViewCode = node.data.artifacts.view?.code && node.data.artifacts.view.code.trim().length > 0;
          const isFragment = 
            // 检查是否包含碎片关键词
            fragmentKeywords.some(keyword => label.includes(keyword.toLowerCase())) ||
            // 或者没有 UI 代码
            !hasViewCode;

          if (isFragment) {
            fragments.push(node);
            logWarn(`🔍 [normalizeNodes] 识别到逻辑碎片: ${node.data.label}`, {
              nodeId: node.id,
              hasViewCode,
              label,
            });
          } else {
            pages.push(node);
          }
        });

        if (fragments.length === 0) {
          log('✅ [normalizeNodes] 未发现逻辑碎片，跳过标准化');
          return { nodes, edges };
        }

        log(`🔄 [normalizeNodes] 开始标准化: ${fragments.length} 个碎片需要合并到 ${pages.length} 个页面`);

        // 2. 构建边映射：快速查找碎片的来源和目标
        const incomingEdges = new Map<string, Edge[]>(); // fragmentId -> edges[]
        const outgoingEdges = new Map<string, Edge[]>(); // fragmentId -> edges[]
        const allEdges = new Map<string, Edge>(); // edgeId -> edge

        edges.forEach(edge => {
          allEdges.set(edge.id, edge);

          // 记录指向碎片的边（来源）
          if (fragments.some(f => f.id === edge.target)) {
            if (!incomingEdges.has(edge.target)) {
              incomingEdges.set(edge.target, []);
            }
            incomingEdges.get(edge.target)!.push(edge);
          }

          // 记录从碎片出发的边（目标）
          if (fragments.some(f => f.id === edge.source)) {
            if (!outgoingEdges.has(edge.source)) {
              outgoingEdges.set(edge.source, []);
            }
            outgoingEdges.get(edge.source)!.push(edge);
          }
        });

        // 3. 执行吞噬：将碎片合并到宿主页面
        const mergedNodes = new Map<string, FractalNode>(pages.map(p => [p.id, { ...p }]));
        const fragmentsToRemove = new Set<string>();
        const edgesToRemove = new Set<string>();
        const edgesToAdd: Edge[] = [];

        fragments.forEach(fragment => {
          const incoming = incomingEdges.get(fragment.id) || [];
          
          if (incoming.length === 0) {
            logWarn(`⚠️ [normalizeNodes] 碎片 ${fragment.data.label} 没有来源边，无法合并，将删除`, {
              fragmentId: fragment.id,
            });
            fragmentsToRemove.add(fragment.id);
            return;
          }

          // 找到宿主页面（第一个来源边指向的页面）
          const hostEdge = incoming.find(e => pages.some(p => p.id === e.source));
          if (!hostEdge) {
            logWarn(`⚠️ [normalizeNodes] 碎片 ${fragment.data.label} 的来源不是页面节点，将删除`, {
              fragmentId: fragment.id,
              sources: incoming.map(e => e.source),
            });
            fragmentsToRemove.add(fragment.id);
            return;
          }

          const hostPage = mergedNodes.get(hostEdge.source);
          if (!hostPage) {
            logWarn(`⚠️ [normalizeNodes] 找不到宿主页面: ${hostEdge.source}`, {
              fragmentId: fragment.id,
            });
            fragmentsToRemove.add(fragment.id);
            return;
          }

          // 将碎片转换为事件对象
          const eventId = `evt_${fragment.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
          const fragmentLabel = fragment.data.label;
          
          // 提取触发条件（从标签中推断）
          let trigger = fragmentLabel;
          if (fragmentLabel.includes('点击')) {
            trigger = `点击'${fragmentLabel.replace(/点击|按钮|操作/g, '').trim()}'按钮`;
          } else if (fragmentLabel.includes('确认')) {
            trigger = `点击'确认'按钮`;
          } else {
            trigger = `触发${fragmentLabel}`;
          }

          // 提取动作（从 spec 或 impl 中获取）
          const action = fragment.data.artifacts.spec?.requirements?.[0] || 
                        fragment.data.artifacts.impl?.apiEndpoints?.[0] || 
                        `执行${fragmentLabel}逻辑`;

          // 提取结果（从 spec 或描述中获取）
          const outcome = fragment.data.artifacts.spec?.requirements?.find(r => r.includes('结果') || r.includes('跳转')) ||
                          `完成${fragmentLabel}`;

          // 创建业务事件对象
          const businessEvent = {
            id: eventId,
            name: fragmentLabel,
            trigger: trigger,
            type: 'UserAction' as const,
            processFlow: [
              {
                step: 1,
                action: action,
                desc: fragment.data.artifacts.spec?.title || fragmentLabel,
              },
            ],
            outcome: outcome,
          };

          // 注入到宿主页面的事件列表
          if (!hostPage.data.artifacts.events) {
            hostPage.data.artifacts.events = [];
          }
          hostPage.data.artifacts.events.push(businessEvent);

          log(`✅ [normalizeNodes] 碎片 "${fragmentLabel}" 已合并到页面 "${hostPage.data.label}"`, {
            fragmentId: fragment.id,
            hostPageId: hostPage.id,
            eventId: eventId,
          });

          // 4. 重连线路：如果碎片后面还有页面，直接连通宿主页面和目标页面
          const outgoing = outgoingEdges.get(fragment.id) || [];
          outgoing.forEach(outEdge => {
            const targetNode = nodeMap.get(outEdge.target);
            if (targetNode && pages.some(p => p.id === targetNode.id)) {
              // 目标是一个页面节点，创建新边：宿主页面 -> 目标页面
              // 保留原边的 nav 元数据（如果存在）
              const preservedNav = (outEdge.data as any)?.nav || undefined;
              
              const newEdge = {
                id: `edge-${hostPage.id}-${targetNode.id}-merged-${Date.now()}`,
                source: hostPage.id,
                target: targetNode.id,
                label: outEdge.label || fragmentLabel,
                type: 'default' as const,
                markerEnd: {
                  type: 'arrowclosed' as const,
                },
                data: preservedNav ? { nav: preservedNav } : undefined,
              } as Edge;
              edgesToAdd.push(newEdge);
              log(`🔗 [normalizeNodes] 重连: ${hostPage.data.label} -> ${targetNode.data.label}`, {
                oldEdge: outEdge.id,
                newEdge: newEdge.id,
              });
            }
            edgesToRemove.add(outEdge.id);
          });

          // 标记碎片和相关的边为待删除
          fragmentsToRemove.add(fragment.id);
          incoming.forEach(e => edgesToRemove.add(e.id));
        });

        // 5. 构建清理后的节点和边列表
        const cleanedNodes = Array.from(mergedNodes.values());
        const cleanedEdges = edges
          .filter(e => !edgesToRemove.has(e.id))
          .concat(edgesToAdd);

        log(`✅ [normalizeNodes] 标准化完成:`, {
          originalNodes: nodes.length,
          cleanedNodes: cleanedNodes.length,
          removedFragments: fragmentsToRemove.size,
          originalEdges: edges.length,
          cleanedEdges: cleanedEdges.length,
          removedEdges: edgesToRemove.size,
          addedEdges: edgesToAdd.length,
        });

        return {
          nodes: cleanedNodes,
          edges: cleanedEdges,
        };
      }

      // 执行节点标准化
      const normalized = normalizeNodes(nodes, edges);
      const normalizedNodes = normalized.nodes;
      const normalizedEdges = normalized.edges;

    const t3 = Date.now(); // Post-processing end
    const totalDuration = t3 - t0;
      
      // 统计用户故事、业务事件和数据查询（使用标准化后的节点）
      const totalUserStories = normalizedNodes.reduce((sum, n) => sum + (n.data.artifacts.userStories?.length || 0), 0);
      const totalEvents = normalizedNodes.reduce((sum, n) => sum + (n.data.artifacts.events?.length || 0), 0);
      const totalDataQueries = normalizedNodes.reduce((sum, n) => sum + (n.data.artifacts.dataQueries?.length || 0), 0);
      const actionPages = normalizedNodes.filter(n => n.data.artifacts.events && n.data.artifacts.events.length > 0).length;
      const viewPages = normalizedNodes.filter(n => n.data.artifacts.dataQueries && n.data.artifacts.dataQueries.length > 0).length;
      
      log('✅ [generateGraph] 图结构生成完成:', {
      requestId,
      duration: `${totalDuration}ms`,
        nodesCount: normalizedNodes.length,
        edgesCount: normalizedEdges.length,
        totalUserStories,
        totalEvents,
        totalDataQueries,
        actionPages,
        viewPages,
        nodeIds: normalizedNodes.map(n => n.id),
        edgeIds: normalizedEdges.map(e => e.id),
        nodesWithUserStories: normalizedNodes.filter(n => n.data.artifacts.userStories && n.data.artifacts.userStories.length > 0).length,
        nodesWithEvents: actionPages,
        nodesWithDataQueries: viewPages,
      llmMetrics,
      fallbackUsed,
      });

    // ✅ 返回扁平结构，nodes 和 edges 在顶层（unwrap AIResult）
    return {
      type: 'graph_generated',
      global: graphResult.global,
      nodes: normalizedNodes,
      edges: normalizedEdges,
      clarity: singleCallResult.clarity,
      warnings,
      metrics: {
        t0,
        t1,
        t2,
        t3,
        totalMs: totalDuration,
        queuedMs: llmMetrics.queuedMs,
        dedupHit: llmMetrics.dedupHit,
        fallbackUsed,
      },
    };
  });
