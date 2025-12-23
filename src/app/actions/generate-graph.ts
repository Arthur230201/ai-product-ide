'use server';

import { createServerAction } from 'zsa';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { log, logError } from '@/lib/logger';
import { getTextModel } from '@/lib/ai-config';
import type { FractalNode, Edge } from '@/types/fractal';

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

// 定义 AI 返回的节点结构 Schema
const NodeSchema = z.object({
  id: z.string().describe('节点唯一标识符（简短有意义，如 "home_page", "user_profile"）'),
  label: z.string().describe('节点显示名称（中文）'),
  type: z.enum(['page', 'service']).describe('节点类型：page（页面）或 service（服务）'),
  description: z.string().optional().describe('节点描述'),
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

      // 构建系统提示词
      const systemPrompt = `你是一个专业的产品架构师。你的任务是根据用户的描述，分析并生成项目结构（节点和边）。

**任务**：
1. 分析用户描述，识别需要创建的页面/服务节点
2. 识别节点之间的关系（页面跳转、服务调用等）
3. 为每个节点生成合适的 ID、名称和类型

**节点类型**：
- \`page\`: 用户界面页面（如首页、登录页、个人中心等）
- \`service\`: 后端服务（如 API 服务、数据服务等）

**输出要求**：
- 节点 ID 使用英文，简短有意义（如 "home_page", "user_profile", "api_service"）
- 节点名称使用中文，清晰描述页面/服务功能
- 如果用户明确要求创建多个页面（如"生成三个页面"），必须生成对应数量的节点
- 如果用户描述中包含页面间的关系（如"首页跳转到登录页"），需要生成对应的边

**示例**：
用户输入："生成三个页面：首页、登录页、个人中心"
输出：
- nodes: [
    { id: "home_page", label: "首页", type: "page" },
    { id: "login_page", label: "登录页", type: "page" },
    { id: "profile_page", label: "个人中心", type: "page" }
  ]
- edges: [
    { source: "home_page", target: "login_page", label: "跳转" },
    { source: "login_page", target: "profile_page", label: "登录后跳转" }
  ]`;

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
      const nodes: FractalNode[] = result.object.nodes.map((node, index) => {
        // 计算节点位置（水平排列，每行最多3个）
        const rowIndex = Math.floor(index / 3);
        const colIndex = index % 3;
        const spacingX = 400;
        const spacingY = 250;
        const startX = 100;
        const startY = 200;

        return {
          id: node.id,
          type: node.type,
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
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900">${node.label}</h1>
      <p className="mt-4 text-gray-600">这是 ${node.label} 页面</p>
    </div>
  );
}`,
              },
              spec: {
                title: node.label,
                requirements: [],
              },
              impl: {
                apiEndpoints: [],
                dbSchema: '-- 将在后续阶段生成',
              },
              test: {
                cases: [],
              },
            },
            syncState: {
              isSynced: false,
              lastSource: 'view',
            },
            source: {
              type: 'ai',
            },
          },
        };
      });

      // 转换为 Edge 格式
      const edges: Edge[] = result.object.edges.map((edge, index) => ({
        id: `edge-${edge.source}-${edge.target}-${index}`,
        source: edge.source,
        target: edge.target,
        label: edge.label || '',
        type: 'default',
        markerEnd: {
          type: 'arrowclosed' as const,
        },
      }));

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
