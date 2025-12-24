import { z } from 'zod';
import { Node, Edge, XYPosition } from 'reactflow';

/**
 * Node Artifacts - 4个全息维度
 */

// View Artifact: 可运行的 React/Tailwind 代码
export const ViewArtifactSchema = z.object({
  code: z.string().describe('可运行的 React/Tailwind 代码'),
  previewUrl: z.string().url().optional().describe('预览 URL（如果已生成）'),
});

export type ViewArtifact = z.infer<typeof ViewArtifactSchema>;

// Spec Artifact: PRD 文档（从 View 反向工程生成）
export const SpecArtifactSchema = z.object({
  title: z.string().describe('需求标题'),
  requirements: z.array(z.string()).describe('结构化需求列表'),
  prdConfig: z.any().optional().describe('PRD生成配置（PrdOptions）'),
});

export type SpecArtifact = z.infer<typeof SpecArtifactSchema>;

// Impl Artifact: 技术实现（从 Spec 派生）
export const ImplArtifactSchema = z.object({
  apiEndpoints: z.array(z.string()).describe('API 端点定义列表'),
  dbSchema: z.string().describe('数据库 schema 定义'),
});

export type ImplArtifact = z.infer<typeof ImplArtifactSchema>;

// Test Artifact: 测试用例（从 Logic 派生）
export const TestArtifactSchema = z.object({
  cases: z.array(z.string()).describe('测试用例列表'),
});

export type TestArtifact = z.infer<typeof TestArtifactSchema>;

// User Story: 用户故事（Agile/Scrum 标准格式）
export const UserStorySchema = z.object({
  id: z.string().describe('用户故事唯一标识符（如：US-001）'),
  role: z.string().describe('角色（As a...，如：新闻协调部发起人、审批人）'),
  activity: z.string().describe('动作（I want to...，如：发起重要宣传指令并选择总编室）'),
  value: z.string().describe('价值（So that...，如：确保指令能够进入串行审批流）'),
  acceptanceCriteria: z.array(z.string()).describe('验收标准（Acceptance Criteria，包含具体的UI规则、逻辑规则、数据规则）'),
});

export type UserStory = z.infer<typeof UserStorySchema>;

// Business Context: 业务背景信息（保留以兼容）
export const BusinessContextSchema = z.object({
  domain: z.string().optional().describe('业务领域（如：新闻指令业务、电商订单）'),
  role: z.string().optional().describe('用户角色（如：发起人、审批人、记者）'),
  goal: z.string().optional().describe('业务目标（如：发起任务、审批流程）'),
});

export type BusinessContext = z.infer<typeof BusinessContextSchema>;

// Business Event: 业务事件（基于事件驱动设计）
export const ProcessFlowStepSchema = z.object({
  step: z.number().describe('步骤序号'),
  action: z.string().describe('动作名称（如：权限校验、路由计算、状态变更）'),
  desc: z.string().describe('动作描述'),
});

export type ProcessFlowStep = z.infer<typeof ProcessFlowStepSchema>;

export const BusinessEventSchema = z.object({
  id: z.string().describe('事件唯一标识符（如：EVT-001）'),
  name: z.string().describe('事件名称（如：提交指令事件、自动保存草稿）'),
  trigger: z.string().describe('触发条件（如：点击提交按钮、每30秒、系统定时任务）'),
  type: z.enum(['UserAction', 'SystemTimer', 'ExternalCallback']).describe('事件类型：UserAction（用户动作）、SystemTimer（系统定时）、ExternalCallback（外部回调）'),
  processFlow: z.array(ProcessFlowStepSchema).describe('具体的流转逻辑链（步骤序列）'),
  outcome: z.string().describe('最终结果（如：跳转至列表页、发送通知、更新状态）'),
});

export type BusinessEvent = z.infer<typeof BusinessEventSchema>;

// 保留 Logic Artifact 以兼容旧数据（可选）
export const LogicRuleSchema = z.object({
  trigger: z.string().describe('用户触发动作（如：点击提交按钮、选择下拉选项）'),
  process: z.string().describe('后端处理逻辑（如：调用API、校验权限、计算数据）'),
  outcome: z.string().describe('处理结果（如：跳转页面、显示Toast、更新状态）'),
});

export type LogicRule = z.infer<typeof LogicRuleSchema>;

export const LogicArtifactSchema = z.object({
  description: z.string().describe('逻辑的自然语言摘要描述'),
  rules: z.array(LogicRuleSchema).describe('结构化逻辑规则列表'),
});

export type LogicArtifact = z.infer<typeof LogicArtifactSchema>;

/**
 * Node Artifacts - 所有维度的集合（支持用户故事模型）
 */
export const NodeArtifactsSchema = z.object({
  view: ViewArtifactSchema,
  spec: SpecArtifactSchema,
  impl: ImplArtifactSchema,
  test: TestArtifactSchema,
  // 用户故事模型（新 - 核心）
  userStories: z.array(UserStorySchema).optional().describe('用户故事列表（按用户故事保存逻辑，Agile/Scrum 标准格式）'),
  // 兼容旧数据（可选）
  businessContext: BusinessContextSchema.optional().describe('业务背景信息（兼容）'),
  events: z.array(BusinessEventSchema).optional().describe('业务事件列表（兼容旧格式）'),
  logic: LogicArtifactSchema.optional().describe('业务逻辑规则（Flow Logic，兼容旧格式）'),
});

export type NodeArtifacts = z.infer<typeof NodeArtifactsSchema>;

/**
 * Sync State - 用于漂移检测
 */
export const SyncStateSchema = z.object({
  isSynced: z.boolean().describe('所有 artifacts 是否已同步'),
  lastSource: z.enum(['view', 'spec', 'impl']).describe('最后一次更新的来源维度'),
});

export type SyncState = z.infer<typeof SyncStateSchema>;

/**
 * Source - 节点来源信息
 */
export const NodeSourceSchema = z.object({
  type: z.enum(['figma', 'human', 'ai']).describe('节点来源类型'),
  externalId: z.string().optional().describe('外部 ID（如 Figma 文件 ID）'),
});

export type NodeSource = z.infer<typeof NodeSourceSchema>;

/**
 * Fractal Node - 核心节点结构
 */
export const FractalNodeTypeSchema = z.enum(['page']);

export type FractalNodeType = z.infer<typeof FractalNodeTypeSchema>;

export const FractalNodeDataSchema = z.object({
  label: z.string().describe('节点显示标签'),
  artifacts: NodeArtifactsSchema,
  syncState: SyncStateSchema,
  source: NodeSourceSchema,
});

// 用于手动创建节点的部分数据 Schema（允许部分字段）
export const PartialFractalNodeDataSchema = z.object({
  label: z.string().optional(),
  artifacts: NodeArtifactsSchema.partial().optional(),
  syncState: SyncStateSchema.partial().optional(),
  source: NodeSourceSchema.partial().optional(),
});

export type FractalNodeData = z.infer<typeof FractalNodeDataSchema>;

export const FractalNodeSchema = z.object({
  id: z.string(),
  type: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: FractalNodeDataSchema,
  // ReactFlow Node 的其他可选属性
  width: z.number().optional(),
  height: z.number().optional(),
  selected: z.boolean().optional(),
  dragging: z.boolean().optional(),
  positionAbsolute: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
}) as z.ZodType<Node<FractalNodeData>>;

export interface FractalNode extends Node<FractalNodeData> {
  type?: 'page' | 'service';
  data: FractalNodeData;
}

/**
 * AI Config - AI 模型配置
 */
export interface AIConfig {
  visionModel: string; // 视觉模型（用于 UI 生成、拓扑解析等），默认: "gpt-5-2025-08-07"
  textModel: string; // 文本模型（用于 PRD 生成、代码分析等），默认: "gpt-5-2025-08-07"
}

/**
 * Project Meta - 项目画像配置（The Identity）
 */
export interface ProjectMeta {
  projectName: string; // e.g., "UniUni Cockpit"
  industry: string; // e.g., "Logistics", "Fintech", "Social Media", "Healthcare", "Gaming"
  targetAudience: string; // e.g., "B2B Enterprise", "Gen Z Gamers", "Healthcare Professionals"
  description: string; // 项目简介
  version: string; // 版本号
}

/**
 * Global Rules - 全局项目规则和 NFR（非功能性需求）
 */
export interface GlobalRules {
  performance: string; // e.g., Response time limits
  security: string;    // e.g., Data masking
  compatibility: string; // e.g., PDA, Mobile
  errorHandling: string; // e.g., Global toast standards
  dataTracking: string;  // e.g., Analytics requirements
}

/**
 * Canvas State - Zustand Store 接口
 */
export interface CanvasState {
  nodes: FractalNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  currentTheme: import('@/types/theme').UIThemeConfig;
  projectMeta: ProjectMeta;
  globalRules: GlobalRules;
  aiConfig: AIConfig; // AI 模型配置
}

/**
 * 辅助类型：用于创建新节点
 */
export interface CreateFractalNodeParams {
  id: string;
  type: FractalNodeType;
  position: XYPosition;
  label: string;
  source: NodeSource;
  artifacts?: Partial<NodeArtifacts>;
}

