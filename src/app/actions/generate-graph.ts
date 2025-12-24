'use server';

import { createServerAction } from 'zsa';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { log, logError } from '@/lib/logger';
import { getTextModel } from '@/lib/ai-config';
import type { FractalNode } from '@/types/fractal';
import type { Edge } from 'reactflow';
import { MarkerType } from 'reactflow';

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

// 定义 Logic Rule Schema（用于 AI 返回）
const LogicRuleSchema = z.object({
  trigger: z.string().describe('用户触发动作（如：点击提交按钮、选择下拉选项）'),
  process: z.string().describe('后端处理逻辑（如：调用API、校验权限、计算数据）'),
  outcome: z.string().describe('处理结果（如：跳转页面、显示Toast、更新状态）'),
});

const LogicArtifactSchema = z.object({
  description: z.string().describe('逻辑的自然语言摘要描述'),
  rules: z.array(LogicRuleSchema).describe('结构化逻辑规则列表'),
});

// 定义 AI 返回的节点结构 Schema
const NodeSchema = z.object({
  id: z.string().describe('节点唯一标识符（简短有意义，如 "home_page", "user_profile"）'),
  label: z.string().describe('节点显示名称（中文）'),
  type: z.enum(['page']).describe('节点类型：page（页面），每个节点代表一个物理页面/屏幕'),
  description: z.string().optional().describe('页面详细描述，包含状态变化、角色权限等'),
  logic: LogicArtifactSchema.optional().describe('该页面触发的业务逻辑规则（Flow Logic）'),
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

      // 构建系统提示词 - 双流抽取机制
      const systemPrompt = `# Role
AI Application Core Engine (Business Analyst & UI Architect).

# Task
Process the User Input (Text/Image/Doc) and generate a **Structured Product JSON**.
You must guarantee the extraction of two distinct layers: **Visual (Page)** and **Logical (Flow)**.

# 🧠 Core Strategy: Dual-Stream Extraction

## Stream 1: Page Logic Extraction (The Container)
**Goal**: Identify "Where" the user is operating.

1. **Identify Screens**: Extract distinct physical screens (URL routes).
   - Apply the "URL Test": Does this step trigger a page navigation?
   - **YES** → Create a new Page Node
   - **NO** → Merge into current Page Node's description

2. **State & Role Variations**: 
   - If the same URL shows different UI based on state/role, merge into ONE page node
   - Describe variations in the \`description\` field

3. **Infrastructure Pages**: 
   - Identify missing entry points (Workbench, Dashboard, List Pages)
   - Create these as separate Page Nodes

4. **Storage**: Save page information in node structure

## Stream 2: Flow Logic Extraction (The Rules)
**Goal**: Identify "What" happens behind the scenes.

1. **Extract Triggers**: 
   - What does the user do? (e.g., "Click Submit", "Select Dropdown", "Open Modal")
   - Identify ALL user interactions on this page

2. **Extract Services**: 
   - What invisible backend logic is triggered? 
   - Examples: "Routing Algorithm", "Auto-Rename", "Permission Check", "API Call", "Database Save", "Notification Send", "Auto-Confirm after 12h"

3. **Associate**: 
   - Do **NOT** create separate nodes for these services
   - Bind them to the Page Node identified in Stream 1
   - Each logic rule must be associated with a specific user action

4. **Structure Logic Rules**:
   - For each trigger → process → outcome chain, create a LogicRule object
   - Format: { trigger: "User Action", process: "Backend Logic", outcome: "Result" }

5. **Storage**: Save this in \`logic\` field (Structured JSON)

# 🚫 Strict Constraints

1. **No Ghost Nodes**: 
   - The \`nodes\` array must **ONLY** contain Pages (type: "page")
   - **NO** "Service Nodes", "Action Nodes", or "Logic Nodes"
   - All logic must be stored in the \`logic\` field of the triggering Page Node

2. **Completeness**: 
   - If the user input mentions "Auto-Confirm after 12h", this logic **MUST** be found in the \`logic\` object of the "Confirm Page", not lost
   - If the user mentions "Routing Algorithm", it must be in the \`logic\` of the page that triggers routing
   - Every backend service mentioned must be captured in a LogicRule

3. **Generalization**: 
   - This logic applies to **ANY domain** (E-commerce, SaaS, IoT, Logistics, etc.)
   - Do not make domain-specific assumptions unless explicitly stated

4. **Dual-Stream Guarantee**:
   - **Every Page Node** must have BOTH:
     - \`description\`: Visual representation and page description
     - \`logic\`: Flow rules (if any interactions exist)
   - If a page has no user interactions, \`logic\` can be empty or omitted

# Output Format
Return JSON with nodes (pages only) and edges (navigation only). Each node must include \`description\` and \`logic\` fields.`;

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
                // 添加 logic artifact（双流抽取的核心）
                logic: node.logic ? {
                  description: node.logic.description,
                  rules: node.logic.rules || [],
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
        const edgeObj: Edge = {
          id: `edge-${edge.source}-${edge.target}-${index}`,
          source: edge.source,
          target: edge.target,
          label: edge.label || '',
          type: 'default',
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        };
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
