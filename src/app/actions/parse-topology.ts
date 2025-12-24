'use server';

import { createServerAction } from 'zsa';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { log, logError } from '@/lib/logger';
import { getVisionModel } from '@/lib/ai-config';
import type { FractalNode } from '@/types/fractal';
import { Edge, MarkerType } from 'reactflow';

/**
 * 拓扑图节点 Schema
 */
const TopologyNodeSchema = z.object({
  id: z.string().describe('节点唯一标识符'),
  label: z.string().describe('节点标签/名称'),
  type: z.enum(['page', 'service', 'database', 'middleware', 'firewall', 'internet', 'user']).describe('节点类型：page（页面）、service（应用服务）、database（数据库）、middleware（中间件）、firewall（防火墙）、internet（互联网）、user（用户）'),
  position: z.object({
    x: z.number().describe('节点 X 坐标（相对位置，0-1000）'),
    y: z.number().describe('节点 Y 坐标（相对位置，0-1000）'),
  }).describe('节点在拓扑图中的相对位置'),
  description: z.string().optional().describe('节点描述'),
  // 企业级信息
  ipAddress: z.string().optional().describe('IP地址（公网IP或私网IP）'),
  services: z.array(z.string()).optional().describe('部署的服务列表（如：nginx、前端、后端、MongoDB等）'),
  group: z.string().optional().describe('所属分组（如：AWS、用户、数据库集群等）'),
});

/**
 * 拓扑图连接 Schema
 */
const TopologyEdgeSchema = z.object({
  source: z.string().describe('源节点 ID'),
  target: z.string().describe('目标节点 ID'),
  label: z.string().optional().describe('连接标签/关系描述'),
});

/**
 * 拓扑图解析结果 Schema
 */
const TopologyResultSchema = z.object({
  nodes: z.array(TopologyNodeSchema).describe('节点列表'),
  edges: z.array(TopologyEdgeSchema).describe('连接列表'),
  description: z.string().optional().describe('拓扑图整体描述'),
});

const ParseTopologyInputSchema = z.object({
  imageBase64: z.string().describe('拓扑图图片的 base64 编码'),
  prompt: z.string().optional().describe('可选的用户提示词，用于指导解析'),
  aiConfig: z.object({
    visionModel: z.string().optional(),
    textModel: z.string().optional(),
  }).optional().describe('AI模型配置，如果未提供则使用环境变量或默认值'),
});

/**
 * 解析拓扑图，识别节点和连接关系
 */
export const parseTopology = createServerAction()
  .input(ParseTopologyInputSchema)
  .handler(async ({ input }) => {
    const startTime = Date.now();
    const requestId = `topo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    log('='.repeat(80));
    log(`🗺️ [parseTopology] 开始解析拓扑图 [${requestId}]`);
    log(`📋 [parseTopology] 输入参数 [${requestId}]:`, {
      imageBase64Length: input.imageBase64?.length || 0,
      hasPrompt: !!input.prompt,
      promptLength: input.prompt?.length || 0,
    });
    log('='.repeat(80));

    try {
      // 检查环境变量
      if (!process.env.OPENAI_API_KEY) {
        logError('❌ [parseTopology] OPENAI_API_KEY 未配置');
        throw new Error('OPENAI_API_KEY 未配置。请在 .env.local 文件中添加 OPENAI_API_KEY=your_api_key');
      }

      // 处理 base64 数据
      let base64Data = input.imageBase64;
      if (base64Data.includes(',')) {
        base64Data = base64Data.split(',')[1];
        log('📝 [parseTopology] 检测到 data URL 格式，已提取 base64 部分');
      }

      // 验证 base64 数据
      if (!base64Data || base64Data.length < 100) {
        logError('❌ [parseTopology] 图片数据格式无效');
        throw new Error('图片数据格式无效或数据过短');
      }

      // 获取模型配置
      const visionModel = getVisionModel(input.aiConfig);
      log(`📸 [parseTopology] 图片数据验证通过，开始调用 ${visionModel} Vision`);

      // 构建用户提示词
      const userPrompt = input.prompt?.trim() || '请分析这张拓扑图，识别所有节点和它们之间的连接关系。';

      // 使用 generateObject 强制返回结构化 JSON
      const result = await generateObject({
        model: openai(visionModel),
        schema: TopologyResultSchema,
        messages: [
          {
            role: 'system',
            content: `你是一个专业的系统架构分析师。你的任务是分析用户上传的拓扑图（系统架构图、流程图、网络图等），识别图中的所有节点和它们之间的连接关系，并提取企业级架构图的详细信息。

要求：
1. **节点识别**：
   - 仔细识别图中的所有节点（框、圆圈、图标、服务器图标等元素）
   - 为每个节点分配唯一 ID（使用简短有意义的标识，如 "web_app", "api_server", "mongodb" 等）
   - 提取节点的完整标签（包括所有文字信息）

2. **节点类型判断**：
   - page：用户界面、页面、前端组件
   - service：应用服务器、API服务、微服务、Web应用
   - database：数据库服务器（MySQL、MongoDB、Clickhouse、Redis等）
   - middleware：中间件服务器（Flink、Doris、RocketMQ、MinIO等）
   - firewall：防火墙
   - internet：互联网、网络
   - user：用户、客户端

3. **企业级信息提取**：
   - **IP地址**：识别并提取所有IP地址（公网IP、私网IP），格式如 "34.233.155.155" 或 "10.117.3.20"
   - **部署服务**：识别节点上部署的所有服务（如：nginx、前端、后端、MongoDB、MySQL、Redis、Flink等），提取为服务列表
   - **分组信息**：识别节点的分组（如：AWS、用户区域、数据库集群等）

4. **连接关系**：
   - 识别节点之间的所有连接（箭头、线条等）
   - 提取连接标签（如 "访问", "推送数据", "实时同步", "互相调用" 等）
   - 识别连接方向（单向或双向）

5. **位置估算**：
   - 估算节点在图片中的相对位置（X: 0-1000, Y: 0-1000，基于图片尺寸）
   - 保持节点之间的相对位置关系

6. **详细信息**：
   - 提取节点的所有可见文字信息作为 label
   - 提取节点的描述性信息作为 description

输出格式必须严格匹配提供的 Schema 结构。确保提取所有可见的企业级信息（IP地址、服务列表、分组等）。`,
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
        temperature: 0.3, // 较低温度以确保输出稳定
      });

      const duration = Date.now() - startTime;
      log(`✅ [parseTopology] 拓扑图解析成功，耗时: ${duration}ms`);
      log(`📊 [parseTopology] 解析结果: ${result.object.nodes.length} 个节点, ${result.object.edges.length} 条连接`);

      return {
        nodes: result.object.nodes,
        edges: result.object.edges,
        description: result.object.description,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logError(`❌ [parseTopology] 解析失败，耗时: ${duration}ms`);
      logError('❌ [parseTopology] 错误详情:', error);

      const errorMessage = error instanceof Error 
        ? error.message 
        : '拓扑图解析失败';
      
      throw new Error(`拓扑图解析失败: ${errorMessage}`);
    }
  });

