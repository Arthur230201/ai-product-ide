'use server';

import { createServerAction } from 'zsa';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { log, logError } from '@/lib/logger';
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

// 定义 AI 返回的节点结构 Schema（用户故事模型）
const NodeSchema = z.object({
  id: z.string().describe('节点唯一标识符（简短有意义，如 "home_page", "user_profile"）'),
  label: z.string().describe('节点显示名称（中文）'),
  type: z.enum(['page']).describe('节点类型：page（页面），每个节点代表一个物理页面/屏幕'),
  description: z.string().optional().describe('页面详细描述，包含状态变化、角色权限等'),
  userStories: z.array(UserStorySchema).optional().describe('用户故事列表（按用户故事保存逻辑，Agile/Scrum 标准格式）'),
});

const EdgeSchema = z.object({
  source: z.string().describe('源节点 ID'),
  target: z.string().describe('目标节点 ID'),
  label: z.string().optional().describe('边的标签（连接关系描述）'),
});

const GraphResultSchema = z.object({
  nodes: z.array(NodeSchema).describe('节点列表'),
  edges: z.array(EdgeSchema).describe('边列表（节点之间的连接关系）'),
});

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

      // 构建系统提示词 - 事件驱动模型（Event-Driven Model）
      const systemPrompt = `# Role
AI Business Architect & Event Storming Specialist.

# Task
Analyze the User Input and generate a **Event-Driven Product Site Map JSON**.

# 🧠 Core Processing Engine: "Page-Event Model"

## Step 1: Physical Page Extraction (The Stage)
Identify the physical screens (URL Routes).
- **Rule**: If the UI changes significantly or the URL changes, it is a Page Node.
- **Output**: \`nodes[].data.artifacts.view\`

## Step 2: Business Event Extraction (The Script)
For each identified page, extract the **Business Processes** driven by specific **Events**.
Do NOT write generic text descriptions. You must break logic down into "Events".

**Extraction Rules:**
1. **Identify the Event**: Look for specific triggers (e.g., "Click Submit", "Timeout 12h", "Review Rejected").
2. **Trace the Logic Chain**: Specify what happens *after* the trigger (Service calls, Database updates, Notifications).
3. **Preserve Business Context**: Keep specific business terms (e.g., "Dispatch to Editorial Dept", not just "Routing").
4. **Structure Process Flow**: Break down each event into sequential steps with clear actions and descriptions.

## Step 3: Business Context Extraction
For each page, identify:
- **Domain**: The business domain (e.g., "新闻指令业务", "电商订单")
- **Role**: The user role who operates this page (e.g., "发起人", "审批人", "记者")
- **Goal**: The business goal of this page (e.g., "发起任务", "审批流程")

## Step 4: Structural Storage
Store these findings strictly in:
- \`businessContext\`: Domain, role, goal
- \`events\`: Array of business events with processFlow

# 🚫 Strict Constraints

1. **No Logic Loss**: Every process mentioned in the input doc (e.g., "Auto-Rename", "Permission Check", "Auto-Confirm after 12h") MUST be mapped to a specific Event on a specific Page.

2. **No Service Nodes**: Do not draw services as visual nodes. They are actions inside the processFlow of an event.

3. **Event-Driven Structure**: 
   - Each event must have: id, name, trigger, type, processFlow (array of steps), outcome
   - ProcessFlow steps must be sequential and specific
   - Event types: UserAction, SystemTimer, ExternalCallback

4. **Visual Presentation**: The JSON output must support generating an "Event-Response Table" (ECA Table) in the final documentation.

# Output Schema (Strict JSON)

Return JSON with nodes (pages only) and edges (navigation only). Each node must include:
- \`description\`: Page description
- \`businessContext\`: Domain, role, goal
- \`events\`: Array of business events with detailed processFlow`;

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
        nodesCount: result.object.nodes.length,
        edgesCount: result.object.edges.length,
        nodes: result.object.nodes.map(n => ({ id: n.id, label: n.label, type: n.type })),
      });

      // 转换为 FractalNode 格式
      const nodes: FractalNode[] = result.object.nodes
        .filter(node => node.type === 'page') // 只保留 page 类型
        .map((node, index) => {
          // 计算节点位置（水平排列，每行最多3个）
          const rowIndex = Math.floor(index / 3);
          const colIndex = index % 3;
          const spacingX = 400;
          const spacingY = 250;
          const startX = 100;
          const startY = 200;

          return {
            id: node.id,
            type: 'page' as const, // 强制设置为 page
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
      log('✅ [generateGraph] 图结构生成完成:', {
        duration: `${duration}ms`,
        nodesCount: nodes.length,
        edgesCount: edges.length,
        nodeIds: nodes.map(n => n.id),
        edgeIds: edges.map(e => e.id),
      });

      const returnValue = {
        data: {
          nodes,
          edges,
        },
      };

      log('📤 [generateGraph] 准备返回数据:', {
        returnValue,
        hasData: !!returnValue.data,
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
