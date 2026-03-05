import { z } from 'zod';
import { Node, Edge, XYPosition } from 'reactflow';

/**
 * Node Artifacts - 4个全息维度
 */

// View Artifact: 可运行的 React/Tailwind 代码
export const ViewArtifactSchema = z.object({
  code: z.string().describe('可运行的 React/Tailwind 代码'),
  previewUrl: z.string().url().optional().describe('预览 URL（如果已生成）'),
  htmlTemplate: z.string().optional().describe('原始 HTML 模板（如果提供，将自动转换为 React 代码）'),
  viewportPreset: z.enum(['mobile', 'desktop']).optional().describe('生成 UI 时的视口：mobile=移动端，desktop=PC 端（导出 PRD 时用于排版）'),
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

// Data Query: 数据查询需求（用于View类型页面）
export const DataQuerySchema = z.object({
  id: z.string().describe('查询唯一标识符（如：Q-001）'),
  description: z.string().describe('查询描述（如：查询活跃任务按优先级排序）'),
  sorting: z.string().optional().describe('排序规则（如：按优先级降序、按创建时间升序）'),
  filtering: z.string().optional().describe('过滤逻辑（如：只显示状态为"进行中"的任务）'),
  dataSource: z.string().optional().describe('数据源定义（如：从任务表查询、从API获取）'),
});

export type DataQuery = z.infer<typeof DataQuerySchema>;

// Traceability: 页面与全局架构的可追溯性映射
export const TraceabilitySchema = z.object({
  implementsJourney: z.string().optional().describe('实现的用户旅程ID（如：JOURNEY_01）'),
  journeyStep: z.string().optional().describe('在旅程中的步骤（如：Initiate、Approve）'),
  triggersEvent: z.array(z.string()).optional().describe('触发的全局事件ID列表（仅用于Action页面）'),
  consumesEvent: z.array(z.string()).optional().describe('消费的全局事件ID列表（仅用于View页面，显示事件结果）'),
});

export type Traceability = z.infer<typeof TraceabilitySchema>;

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
 * Node Artifacts - 所有维度的集合（支持用户故事模型和逻辑分类）
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
  events: z.array(BusinessEventSchema).optional().describe('业务事件列表（仅用于Action类型页面，View类型页面禁止）'),
  dataQueries: z.array(DataQuerySchema).optional().describe('数据查询需求列表（仅用于View类型页面，Action类型页面禁止）'),
  traceability: TraceabilitySchema.optional().describe('页面与全局架构的可追溯性映射'),
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
  visionModel: string; // 视觉模型（用于 UI 生成、拓扑解析等），默认: "gpt-5.2-2025-12-11"
  textModel: string; // 文本模型（用于 PRD 生成、代码分析等），默认: "gpt-5.2-2025-12-11"
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
  // 扩展字段 - 用于信息补充
  applicationScope?: string; // 所属行业与应用范围（如城市应急、园区运维、快运、家电维保等）
  coreObjectScale?: string; // 核心对象规模（每日事件/工单量、车辆/技师数量、站点/设备数量、覆盖城市/区域）
  keyRequiredFunctions?: string; // 关键必需功能（如GIS定位、路线优化、跨部门联动、移动端表单、SLA/KPI、语音/对讲、IoT/车载终端接入）
  integratedSystems?: string; // 需要对接的系统与数据源（如地图服务、CRM/ERP、车载OBD/北斗、消息/视频平台）
  complianceConstraints?: string; // 合规与约束（数据安全等级、值班制度、留痕审计、报表与监管口径）
  rolesAndPermissions?: string; // 角色与权限（调度员、值班长、现场人员、第三方协作单位）
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
 * Edge Navigation Metadata - 边导航元数据（动作/跳转逻辑）
 */
export const EdgeNavMetaSchema = z.object({
  trigger: z.enum(['ROLE_ENTRY', 'PERMISSION_ENTRY', 'UI_CLICK', 'SYSTEM_REDIRECT']).describe('触发类型'),
  conditionType: z.enum(['role', 'permission', 'expression', 'none']).describe('条件类型'),
  condition: z.object({
    roles: z.array(z.string()).optional().describe('角色列表（conditionType=role 时必需）'),
    permissions: z.array(z.string()).optional().describe('权限列表（conditionType=permission 时必需）'),
    expr: z.string().optional().describe('表达式（conditionType=expression 时必需）'),
  }).optional().describe('条件配置（conditionType=none 时可省略）'),
  sourceHint: z.object({
    elementText: z.string().optional().describe('触发元素文本（如按钮文案）'),
    elementId: z.string().optional().describe('触发元素 ID'),
    elementSelector: z.string().optional().describe('触发元素选择器'),
  }).optional().describe('触发来源提示（用于 UI_CLICK 类型）'),
  priority: z.number().optional().describe('优先级（多分支时选择顺序，数字越大优先级越高）'),
});

export type EdgeNavMeta = z.infer<typeof EdgeNavMetaSchema>;

/**
 * Edge Data - 扩展 Edge 的 data 字段
 */
export const EdgeDataSchema = z.object({
  label: z.string().optional().describe('边标签'),
  nav: EdgeNavMetaSchema.optional().describe('导航元数据（动作/跳转逻辑）'),
});

export type EdgeData = z.infer<typeof EdgeDataSchema>;

/**
 * Fractal Edge - 扩展的 Edge 类型
 */
export type FractalEdge = Edge<EdgeData>;

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
 * 用于 updateNodeData 的载荷：允许深层部分更新（artifacts 及其子字段均可部分提供）
 */
export type UpdateNodeDataPayload = Partial<Omit<FractalNodeData, 'artifacts'>> & {
  artifacts?: Partial<NodeArtifacts>;
};

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

