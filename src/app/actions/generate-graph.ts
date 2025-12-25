'use server';

import { createServerAction } from 'zsa';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { log, logError, logWarn } from '@/lib/logger';
import { getTextModel } from '@/lib/ai-config';
import type { FractalNode } from '@/types/fractal';
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

const EdgeSchema = z.object({
  source: z.string().describe('源节点 ID'),
  target: z.string().describe('目标节点 ID'),
  label: z.string().optional().describe('边的标签（连接关系描述）'),
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

// 定义输入模糊度分析 Schema
const InputClarityAnalysisSchema = z.object({
  confidence: z.number().min(0).max(100).describe('输入明确度（0-100），>=60为明确，<60为模糊'),
  isVague: z.boolean().describe('是否模糊（confidence < 60）'),
  detectedDomain: z.string().optional().describe('检测到的业务领域（如：Enterprise Management、Inventory Management）'),
  detectedBusinessObject: z.string().optional().describe('检测到的业务对象（如：Paint、Reimbursement、Customer）'),
  detectedAction: z.string().optional().describe('检测到的核心动作（如：Stocktaking、Approving、Selling）'),
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

// 定义图生成结果 Schema
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
async function analyzeInputClarity(
  prompt: string,
  textModel: string
): Promise<z.infer<typeof InputClarityAnalysisSchema>> {
  const clarityAnalysisPrompt = `# Role
AI Product Consultant & Requirement Analyst.

# Task
Analyze the user input to determine if it contains enough context to generate a specific Product Site Map.

# 🧠 Core Logic: The Ambiguity Filter

## Context Analysis Criteria
Analyze the input depth. Ask yourself: *Do I know the specific **Business Object** (e.g., Paint, Reimbursement, Customer) and the **Core Action** (e.g., Stocktaking, Approving, Selling)?*

### Vague Input Indicators (Confidence < 60%):
- Generic terms: "enterprise app", "management system", "tool for my team"
- No specific business object mentioned
- No specific workflow or action described
- Too high-level or abstract

### Specific Input Indicators (Confidence >= 60%):
- Specific business objects: "Paint inventory", "Reimbursement approval", "CRM for real estate"
- Clear workflows: "approval process", "order management", "customer tracking"
- Specific domain context: "material collection", "news coordination"

## Output Requirements
- **confidence**: A number between 0-100 representing how specific the input is
- **isVague**: true if confidence < 60, false otherwise
- **detectedDomain**: Extract the high-level domain if detectable
- **detectedBusinessObject**: Extract the specific business object if mentioned
- **detectedAction**: Extract the core action/workflow if mentioned

Analyze the following input: "${prompt}"`;

  const result = await generateObject({
    model: openai(textModel),
    schema: InputClarityAnalysisSchema,
    messages: [
      {
        role: 'user',
        content: clarityAnalysisPrompt,
      },
    ],
    temperature: 0.3,
  });

  return result.object;
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

  const result = await generateObject({
    model: openai(textModel),
    schema: ClarificationGenerationSchema,
    messages: [
      {
        role: 'user',
        content: clarificationPrompt,
      },
    ],
    temperature: 0.7, // 稍高的温度以生成更多样化的场景
  });

  return {
    type: 'clarification_needed' as const,
    data: result.object,
  };
}

export const generateGraph = createServerAction()
  .input(GenerateGraphInputSchema)
  .handler(async ({ input }) => {
    const startTime = Date.now();
    
    try {
      log('🚀 [generateGraph] 开始生成图结构');
      log('📋 [generateGraph] 输入参数:', {
        promptLength: input.prompt.length,
        promptPreview: input.prompt.substring(0, 100),
        hasMedia: !!input.mediaBase64,
        mediaType: input.mediaType,
        hasAiConfig: !!input.aiConfig,
        textModel: input.aiConfig?.textModel,
      });

      // 检查环境变量
      if (!process.env.OPENAI_API_KEY) {
        logError('❌ [generateGraph] OPENAI_API_KEY 未配置');
        throw new Error('OPENAI_API_KEY 未配置');
      }

      // 获取文本模型（优先使用传入的配置）
      const textModel = input.aiConfig?.textModel || getTextModel();
      log(`🤖 [generateGraph] 使用模型: ${textModel}`);

      // Step 1: 分析输入模糊度
      // 优化：即使有媒体/附件，也分析文本提示词的明确度
      // 如果文本提示词模糊，仍然需要澄清（媒体可能也不够具体）
      const shouldAnalyzeClarity = input.prompt.trim().length > 0;
      
      if (shouldAnalyzeClarity) {
        log('🔍 [generateGraph] 开始分析输入模糊度...');
        const clarityAnalysis = await analyzeInputClarity(input.prompt.trim(), textModel);
        
        log('📊 [generateGraph] 模糊度分析结果:', {
          confidence: clarityAnalysis.confidence,
          isVague: clarityAnalysis.isVague,
          detectedDomain: clarityAnalysis.detectedDomain,
          detectedBusinessObject: clarityAnalysis.detectedBusinessObject,
          detectedAction: clarityAnalysis.detectedAction,
          hasMedia: !!input.mediaBase64,
          hasAttachment: !!input.attachmentContent,
        });

        if (clarityAnalysis.isVague) {
          log('⚠️ [generateGraph] 输入过于模糊，生成澄清请求');
          
          // 如果有媒体/附件，传递给生成函数以便生成更合适的提示
          const hasMediaOrAttachment = !!input.mediaBase64 || !!input.attachmentContent;
          const clarificationRequest = await generateClarificationRequest(
            clarityAnalysis, 
            textModel,
            hasMediaOrAttachment
          );
          
          return {
            data: clarificationRequest,
          };
        }
        
        log('✅ [generateGraph] 输入足够具体，继续生成图结构');
      } else {
        log('⏭️ [generateGraph] 没有文本输入，直接生成图结构');
      }

      // 构建系统提示词 - 包含Top-Down Architecture策略
      const systemPrompt = `# Role
Product Solution Architect (Domain Driven Design Expert).

# Task
Analyze the User Input and generate a **Global Business Architecture JSON** using Top-Down Architecture strategy.

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
  "edges": [...]
}
\`\`\`

**Critical Requirements**:
1. **Global Context First**: Generate \`global\` object BEFORE generating nodes
2. **Journey Mapping**: Every page MUST map to at least one User Journey step
3. **Event Mapping**: 
   - Action pages MUST have \`triggersEvent\` (at least one)
   - View pages SHOULD have \`consumesEvent\` (if they display event results)
4. **Traceability**: Every node MUST have \`traceability\` object with journey and event mappings`;

      // 构建用户提示词
      const userPrompt = input.prompt.trim() || '请生成项目结构';

      // 调用 AI 生成图结构
      const result = await generateObject({
        model: openai(textModel),
        schema: GraphResultSchema,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.3,
      });

      log('✅ [generateGraph] AI 生成完成:', {
        globalJourneysCount: result.object.global.userJourneys.length,
        globalEventsCount: result.object.global.businessEvents.length,
        nodesCount: result.object.nodes.length,
        edgesCount: result.object.edges.length,
        nodes: result.object.nodes.map(n => ({ 
          id: n.id, 
          label: n.label, 
          type: n.type,
          pageType: n.pageType,
          userStoriesCount: n.userStories?.length || 0,
          eventsCount: n.events?.length || 0,
          dataQueriesCount: n.dataQueries?.length || 0,
          hasTraceability: !!n.traceability,
          implementsJourney: n.traceability?.implementsJourney,
          triggersEvent: n.traceability?.triggersEvent,
        })),
      });

      // 转换为 FractalNode 格式
      const nodes: FractalNode[] = result.object.nodes
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
          log(`📊 [generateGraph] 处理节点 ${index + 1}/${result.object.nodes.length}: ${node.label}`, {
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
                  requirements: node.description 
                    ? [`页面描述：${node.description}`]
                    : [],
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

      // 转换为 Edge 格式
      const edges: Edge[] = (result.object.edges || []).map((edge, index) => {
        const edgeObj = {
        id: `edge-${edge.source}-${edge.target}-${index}`,
        source: edge.source,
        target: edge.target,
        label: edge.label || '',
          type: 'default' as const,
        markerEnd: {
          type: 'arrowclosed' as const,
        },
        } as Edge;
        return edgeObj;
      });

      const duration = Date.now() - startTime;
      
      // 统计用户故事、业务事件和数据查询
      const totalUserStories = nodes.reduce((sum, n) => sum + (n.data.artifacts.userStories?.length || 0), 0);
      const totalEvents = nodes.reduce((sum, n) => sum + (n.data.artifacts.events?.length || 0), 0);
      const totalDataQueries = nodes.reduce((sum, n) => sum + (n.data.artifacts.dataQueries?.length || 0), 0);
      const actionPages = nodes.filter(n => n.data.artifacts.events && n.data.artifacts.events.length > 0).length;
      const viewPages = nodes.filter(n => n.data.artifacts.dataQueries && n.data.artifacts.dataQueries.length > 0).length;
      
      log('✅ [generateGraph] 图结构生成完成:', {
        duration: `${duration}ms`,
        nodesCount: nodes.length,
        edgesCount: edges.length,
        totalUserStories,
        totalEvents,
        totalDataQueries,
        actionPages,
        viewPages,
        nodeIds: nodes.map(n => n.id),
        edgeIds: edges.map(e => e.id),
        nodesWithUserStories: nodes.filter(n => n.data.artifacts.userStories && n.data.artifacts.userStories.length > 0).length,
        nodesWithEvents: actionPages,
        nodesWithDataQueries: viewPages,
      });

      const returnValue = {
        data: {
          type: 'graph_generated' as const,
          global: {
            userJourneys: result.object.global.userJourneys,
            businessEvents: result.object.global.businessEvents,
          },
          nodes,
          edges,
        },
      };

      log('📤 [generateGraph] 准备返回数据:', {
        returnValueType: returnValue.data.type,
        hasGlobal: !!returnValue.data.global,
        globalJourneysCount: returnValue.data.global.userJourneys.length,
        globalEventsCount: returnValue.data.global.businessEvents.length,
        hasNodes: !!returnValue.data.nodes,
        nodesLength: returnValue.data.nodes.length,
        hasEdges: !!returnValue.data.edges,
        edgesLength: returnValue.data.edges.length,
      });

      return returnValue;
    } catch (error) {
      const duration = Date.now() - startTime;
      logError('❌ [generateGraph] 生成失败:', {
        error,
        duration: `${duration}ms`,
        prompt: input.prompt.substring(0, 100),
      });
      throw error;
    }
  });
