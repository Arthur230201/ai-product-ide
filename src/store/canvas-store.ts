import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Node,
  Edge,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  MarkerType,
} from 'reactflow';
import type {
  FractalNode,
  FractalNodeData,
  UpdateNodeDataPayload,
  CanvasState,
  NodeArtifacts,
  ProjectMeta,
  GlobalRules,
  AIConfig,
} from '@/types/fractal';
import { getLayoutedElements, DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT } from '@/lib/layout';
import type { UIThemeConfig, StylePresetId } from '@/types/theme';
import { defaultTheme, STYLE_PRESET_IDS } from '@/types/theme';
import { preview } from '@/lib/safe/preview';
import { log, logError, logWarn } from '@/lib/logger';

type BlueprintTabType = 'profile' | 'business' | 'interaction' | 'data' | 'topology' | 'rules' | 'events' | 'userStories';

/** 澄清选项（AI 追问时的可选项） */
export interface ClarificationOption {
  id: string;
  label: string;
  desc: string;
  example: string;
}

/** 对话消息（含可选澄清载荷，用于 Stitch 风格对话窗口） */
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status?: 'sending' | 'done' | 'error';
  attachmentSummary?: string;
  /** 仅 role=assistant 时：澄清请求（追问 + 选项） */
  clarification?: {
    message: string;
    question: string;
    options: ClarificationOption[];
    /** 视口澄清（首次建图必选）：移动端 / 桌面端 */
    viewportQuestion?: string;
    viewportOptions?: { id: string; label: string; desc?: string; example?: string }[];
  };
}

/** 等待用户回复澄清时的上下文，用于再次调用 generateGraph */
export interface PendingClarificationContext {
  initialPrompt: string;
  attachmentContent?: string;
  attachmentType?: string;
  mimeType?: string;
  mediaBase64?: string;
  mediaType?: 'image' | 'video';
}

interface CanvasStore extends CanvasState {
  // Detail Panel State
  isDetailPanelOpen: boolean;
  /** 预览视口预设：移动端 / 桌面，用于编辑与演示 */
  viewportPreset: 'mobile' | 'desktop';
  /** 全局锁定：用户选择移动端/Web端后不再显示切换按钮，仅用此值 */
  viewportLocked: 'mobile' | 'desktop' | null;
  // Project Blueprint State
  isBlueprintOpen: boolean;
  blueprintInitialTab?: BlueprintTabType;
  blueprintInitialData?: Partial<ProjectMeta>;
  // Actions
  addNode: (node: FractalNode) => void;
  addNodes: (nodes: FractalNode[]) => void;
  addEdges: (edges: Edge[]) => void;
  // 支持部分更新，包括深层 artifacts 更新
  updateNodeData: (id: string, data: UpdateNodeDataPayload) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  selectNode: (id: string | null) => void;
  openNodeDetail: (nodeId: string) => void;
  closeNodeDetail: () => void;
  layoutNodes: () => void;
  // Manual Edge Management
  updateEdgeLabel: (edgeId: string, newLabel: string) => void;
  deleteEdge: (edgeId: string) => void;
  // Manual Node Management
  deleteNode: (nodeId: string) => void;
  // Manual Editing & Project Management
  addBlankNode: (position?: { x: number; y: number }) => void;
  addChildNode: () => void; // 添加子节点（Tab 快捷键）
  addSiblingNode: () => void; // 添加同级节点（Enter 快捷键）
  clearCanvas: () => void;
  loadProject: (data: { nodes: FractalNode[]; edges: Edge[] }) => void;
  exportProject: () => { nodes: FractalNode[]; edges: Edge[] };
  // Theme Management
  setTheme: (theme: UIThemeConfig) => void;
  // Global Rules Management
  updateGlobalRules: (rules: Partial<GlobalRules>) => void;
  // Project Meta Management
  updateProjectMeta: (meta: Partial<ProjectMeta>) => void;
  // AI Config Management
  updateAIConfig: (config: Partial<AIConfig>) => void;
  // Project Blueprint Management
  openBlueprint: (initialTab?: BlueprintTabType, initialData?: Partial<ProjectMeta>) => void;
  closeBlueprint: () => void;
  setViewportPreset: (preset: 'mobile' | 'desktop') => void;
  /** 选择平台并锁定：之后全局不再显示移动/桌面切换 */
  lockViewport: (preset: 'mobile' | 'desktop') => void;
  setStylePreset: (preset: StylePresetId) => void;
  // 对话窗口（Stitch 风格）与澄清
  conversationPanelOpen: boolean;
  conversationMessages: ConversationMessage[];
  pendingClarificationContext: PendingClarificationContext | null;
  pendingClarificationReply: string | null;
  setConversationPanelOpen: (open: boolean) => void;
  appendConversationMessage: (msg: ConversationMessage) => void;
  setConversationMessages: (messages: ConversationMessage[]) => void;
  updateLastAssistantMessage: (content: string, status: 'done' | 'error', clarification?: ConversationMessage['clarification']) => void;
  setPendingClarificationContext: (ctx: PendingClarificationContext | null) => void;
  setPendingClarificationReply: (reply: string | null) => void;
  clearConversation: () => void;
  /** 建图/澄清提交进行中，供常驻对话面板禁用发送与选项 */
  isAiCreatePending: boolean;
  setAiCreatePending: (v: boolean) => void;
  /** 首页/Stitch 入口触发生成：设置后 CommandBar 会执行建图并清空 */
  pendingCreatePrompt: string | null;
  setPendingCreatePrompt: (prompt: string | null) => void;
  /** 首页触发生成时的附件（与 pendingCreatePrompt 同时使用） */
  pendingCreateMedia: { mediaBase64: string; mediaType: 'image' | 'video' } | null;
  setPendingCreateMedia: (v: { mediaBase64: string; mediaType: 'image' | 'video' } | null) => void;
}

/** 为节点补全 width/height，避免生产环境首帧 ResizeObserver 未就绪时边连接点错位（连线与节点视觉脱节） */
function ensureNodeDimensions(node: FractalNode): FractalNode {
  if (node.width != null && node.height != null) return node;
  return {
    ...node,
    width: node.width ?? DEFAULT_NODE_WIDTH,
    height: node.height ?? DEFAULT_NODE_HEIGHT,
  };
}

/**
 * 生成空白节点UI代码模板
 */
const generateBlankNodeCode = (nodeLabel: string): string => {
  return `export default function BlankPage() {
  return (
    <div className="w-full h-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
      <div className="p-8">
        <h1 className="text-2xl font-semibold text-gray-900">${nodeLabel}</h1>
      </div>
    </div>
  );
}`;
};

/**
 * 创建初始 mock 数据 - 一个 'page' 节点
 */
const createMockNode = (): FractalNode => {
  const mockArtifacts: NodeArtifacts = {
    view: {
      code: generateBlankNodeCode('首页'),
    },
    spec: {
      title: '首页',
      requirements: [
        '显示欢迎信息',
        '提供清晰的视觉层次',
        '响应式设计',
      ],
    },
    impl: {
      apiEndpoints: ['GET /api/home'],
      dbSchema: '-- 暂无数据库需求',
    },
    test: {
      cases: [
        '验证页面正确渲染',
        '验证响应式布局',
      ],
    },
  };

  return ensureNodeDimensions({
    id: 'page-1',
    type: 'page',
    position: { x: 250, y: 250 },
    data: {
      label: '首页',
      artifacts: mockArtifacts,
      syncState: {
        isSynced: true,
        lastSource: 'view',
      },
      source: {
        type: 'ai',
      },
    },
  });
};

export const useCanvasStore = create<CanvasStore>()(
  persist(
    (set, get) => {
      // 确保 get 函数存在
      if (!get) {
        console.error('Zustand store get function is not available');
        // 如果 get 不存在，返回一个安全的默认实现
        return {
          nodes: [createMockNode()],
          edges: [],
          selectedNodeId: null,
        isDetailPanelOpen: false,
        viewportPreset: 'mobile',
        viewportLocked: null,
        isBlueprintOpen: false,
        blueprintInitialTab: undefined,
        blueprintInitialData: undefined,
        addNode: () => {},
          addNodes: () => {},
          addEdges: () => {},
          updateNodeData: () => {},
          onNodesChange: () => {},
          onEdgesChange: () => {},
          onConnect: () => {},
          selectNode: () => {},
          openNodeDetail: () => {},
          closeNodeDetail: () => {},
          layoutNodes: () => {},
          updateEdgeLabel: () => {},
          deleteEdge: () => {},
          deleteNode: () => {},
          addBlankNode: () => {},
          addChildNode: () => {},
          addSiblingNode: () => {},
          clearCanvas: () => {},
          loadProject: () => {},
          exportProject: () => ({ nodes: [], edges: [] }),
          setTheme: () => {},
          updateGlobalRules: () => {},
          updateProjectMeta: () => {},
          updateAIConfig: () => {},
          openBlueprint: () => {},
          closeBlueprint: () => {},
          setViewportPreset: () => {},
          lockViewport: () => {},
          setStylePreset: () => {},
          conversationPanelOpen: true,
          conversationMessages: [],
          pendingClarificationContext: null,
          pendingClarificationReply: null,
          setConversationPanelOpen: () => {},
          appendConversationMessage: () => {},
          setConversationMessages: () => {},
          updateLastAssistantMessage: () => {},
          setPendingClarificationContext: () => {},
          setPendingClarificationReply: () => {},
          clearConversation: () => {},
          isAiCreatePending: false,
          pendingCreatePrompt: null,
          setPendingCreatePrompt: () => {},
          pendingCreateMedia: null,
          setPendingCreateMedia: () => {},
          setAiCreatePending: () => {},
          currentTheme: defaultTheme,
          stylePreset: 'neutral',
          projectMeta: {
            projectName: '未命名项目',
            industry: '通用互联网',
            targetAudience: '通用用户',
            description: '',
            version: '1.0.0',
          },
          globalRules: {
            performance: '',
            security: '',
            compatibility: '',
            errorHandling: '',
            dataTracking: '',
          },
          aiConfig: {
            visionModel: 'gpt-5.1-chat-2025-11-13',
            textModel: 'gpt-5.1-chat-2025-11-13',
          },
        } as unknown as CanvasStore;
      }

      // 初始化项目画像和全局规则（在函数开始处定义，以便在错误处理中使用）
      const initialProjectMeta: ProjectMeta = {
        projectName: '未命名项目',
        industry: '通用互联网',
        targetAudience: '通用用户',
        description: '',
        version: '1.0.0',
      };

      const initialGlobalRules: GlobalRules = {
        performance: '首屏加载 < 1.5s，支持 5000 并发',
        security: '所有敏感数据需要加密存储，API 需要身份验证',
        compatibility: '支持 Chrome 90+、Safari 14+、移动端 iOS 14+、Android 10+',
        errorHandling: '使用全局 Toast 提示，错误信息需要用户友好',
        dataTracking: '集成 Google Analytics，追踪用户行为数据',
      };

      // 初始化 AI 配置（优先使用环境变量，否则使用默认值）
      const initialAIConfig: AIConfig = {
        visionModel: process.env.NEXT_PUBLIC_AI_VISION_MODEL || 'gpt-5.1-chat-2025-11-13',
        textModel: process.env.NEXT_PUBLIC_AI_TEXT_MODEL || 'gpt-5.1-chat-2025-11-13',
      };

      // 从 localStorage 恢复状态（仅在客户端）
      let stored: string | null = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          stored = localStorage.getItem('canvas-store');
        } catch (e) {
          // localStorage 可能被安全策略阻止
          stored = null;
        }
      }
      
      let initialState: CanvasState;
      
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          
          // 自动迁移旧模型配置到新模型
          let migratedAIConfig = parsed.aiConfig || initialAIConfig;
          const oldModel = 'gpt-5-2025-08-07';
          const oldModel2 = 'gpt-5.2-2025-12-11';
          const newModel = 'gpt-5.1-chat-2025-11-13';
          
          // 如果使用的是旧模型，自动更新为新模型
          if (migratedAIConfig.visionModel === oldModel || migratedAIConfig.visionModel === oldModel2) {
            migratedAIConfig = { ...migratedAIConfig, visionModel: newModel };
          }
          if (migratedAIConfig.textModel === oldModel || migratedAIConfig.textModel === oldModel2) {
            migratedAIConfig = { ...migratedAIConfig, textModel: newModel };
          }
          
          initialState = {
            nodes: (parsed.nodes || []).map(ensureNodeDimensions),
            edges: parsed.edges || [],
            selectedNodeId: parsed.selectedNodeId || null,
            currentTheme: parsed.currentTheme || defaultTheme,
            stylePreset: (() => {
            const p = parsed.stylePreset;
            if (p === 'tech') return 'cyberpunk';
            return p && ['neutral', 'glass', 'flat', 'corporate', 'neo', 'cyberpunk', 'warm', 'brutal', 'custom'].includes(p) ? p : 'neutral';
          })(),
            projectMeta: parsed.projectMeta || initialProjectMeta,
            globalRules: parsed.globalRules || initialGlobalRules,
            aiConfig: migratedAIConfig,
          };
        } catch (e) {
          console.error('Failed to parse stored state:', e);
          initialState = {
            nodes: [],
            edges: [],
            selectedNodeId: null,
        currentTheme: defaultTheme,
        stylePreset: 'neutral',
        projectMeta: initialProjectMeta,
        globalRules: initialGlobalRules,
        aiConfig: initialAIConfig,
      };
    }
  } else {
    initialState = {
      nodes: [],
      edges: [],
      selectedNodeId: null,
      currentTheme: defaultTheme,
      stylePreset: 'neutral',
      projectMeta: initialProjectMeta,
      globalRules: initialGlobalRules,
      aiConfig: initialAIConfig,
    };
  }

      return {
        // Initial state with mock data
        nodes: [createMockNode()],
        edges: [],
        selectedNodeId: null,
        isDetailPanelOpen: false,
        viewportPreset: 'mobile',
        viewportLocked: null,
        isBlueprintOpen: false,
        blueprintInitialTab: undefined,
        blueprintInitialData: undefined,
        conversationPanelOpen: true,
        conversationMessages: [],
        pendingClarificationContext: null,
        pendingClarificationReply: null,
        isAiCreatePending: false,
        pendingCreatePrompt: null,
        pendingCreateMedia: null,
        currentTheme: defaultTheme,
        stylePreset: 'neutral',
        projectMeta: initialProjectMeta,
        globalRules: initialGlobalRules,
        aiConfig: initialAIConfig,

        // Actions
  addNode: (node: FractalNode) => {
    set((state) => {
      // 1. Check if there's a selected node
      const selectedNodeId = state.selectedNodeId;
      const selectedNode = selectedNodeId 
        ? state.nodes.find((n) => n.id === selectedNodeId)
        : null;

      // 2. Adjust node position if parent exists，并确保有 width/height 供边连接点计算
      let newNode = ensureNodeDimensions({ ...node });
      if (selectedNode) {
        // Place new node to the right of the parent
        newNode = {
          ...newNode,
          position: {
            x: selectedNode.position.x + 400,
            y: selectedNode.position.y,
          },
        };
      }

      // 3. Create edge if parent exists
      const newEdges = selectedNode
        ? [
            ...state.edges,
            {
              id: `e-${selectedNode.id}-${newNode.id}`,
              source: selectedNode.id,
              target: newNode.id,
              type: 'smart',
              animated: true,
              markerEnd: {
                type: 'arrowclosed' as const,
              },
              label: 'Action',
              labelStyle: {
                fill: '#64748B',
                fontWeight: 500,
              },
            } as Edge,
          ]
        : state.edges;

      return {
        nodes: [...state.nodes, newNode],
        edges: newEdges,
      };
    });
  },

  addNodes: (newNodes: FractalNode[]) => {
    set((state) => {
      // 验证 newNodes 是否为有效数组
      if (!newNodes || !Array.isArray(newNodes)) {
        console.error('❌ [canvas-store] addNodes: newNodes is not a valid array', {
          newNodes,
          type: typeof newNodes,
          isArray: Array.isArray(newNodes),
        });
        return state; // 如果 newNodes 无效，直接返回当前状态，不做任何修改
      }
      
      // 如果数组为空，直接返回
      if (newNodes.length === 0) {
        return state;
      }
      
      // 验证并规范化节点数据
      const validatedNodes = newNodes.map((node) => {
        // 确保节点有 type 字段，默认为 'page'
        let nodeType = node.type;
        if (!nodeType || (nodeType !== 'page' && nodeType !== 'service')) {
          console.warn(`⚠️ [canvas-store] 节点 ${node.id} 的类型无效: ${nodeType}，设置为 'page'`);
          nodeType = 'page';
        }
        
        // 确保节点有必需的 data 字段
        if (!node.data) {
          console.error(`❌ [canvas-store] 节点 ${node.id} 缺少 data 字段，创建默认 data`);
          return {
            ...node,
            type: nodeType as 'page' | 'service',
            data: {
              label: node.id,
              artifacts: {
                view: { code: '' },
                spec: { title: node.id, requirements: [] },
                impl: { apiEndpoints: [], dbSchema: '' },
                test: { cases: [] },
              },
              syncState: { isSynced: false, lastSource: 'view' as const },
              source: { type: 'ai' as const },
            },
          };
        }
        
        // 创建新的 data 对象，确保所有必需字段都存在
        const validatedData = {
          ...node.data,
          label: node.data.label || node.id,
          source: node.data.source || { type: 'ai' as const },
          syncState: node.data.syncState || { isSynced: false, lastSource: 'view' as const },
          artifacts: node.data.artifacts || {
            view: { code: '' },
            spec: { title: node.data.label || node.id, requirements: [] },
            impl: { apiEndpoints: [], dbSchema: '' },
            test: { cases: [] },
          },
        };
        
        return ensureNodeDimensions({
          ...node,
          type: nodeType as 'page' | 'service',
          data: validatedData,
        });
      });

      // 计算新节点的位置，避免与现有节点重叠
      const existingNodes = state.nodes;
      const nodeWidth = 300; // 节点宽度
      const nodeHeight = 200; // 节点高度
      const spacingX = 400; // 水平间距
      const spacingY = 250; // 垂直间距
      
      // 找到现有节点的边界
      let minX = 0;
      let maxX = 0;
      let minY = 0;
      let maxY = 0;
      
      if (existingNodes.length > 0) {
        const xPositions = existingNodes.map(n => n.position.x);
        const yPositions = existingNodes.map(n => n.position.y);
        minX = Math.min(...xPositions);
        maxX = Math.max(...xPositions);
        minY = Math.min(...yPositions);
        maxY = Math.max(...yPositions);
      }
      
      // 计算新节点的起始位置
      // 如果已有节点，从右侧开始；否则从默认位置开始
      const startX = existingNodes.length > 0 ? maxX + spacingX : 100;
      const startY = existingNodes.length > 0 ? minY : 200;
      
      // 检查位置是否与现有节点重叠的辅助函数
      const isPositionOverlapping = (x: number, y: number, excludeNodes: FractalNode[] = []): boolean => {
        return existingNodes.some((existingNode) => {
          // 跳过排除的节点（已处理的新节点）
          if (excludeNodes.some(n => n.id === existingNode.id)) {
            return false;
          }
          const dx = Math.abs(existingNode.position.x - x);
          const dy = Math.abs(existingNode.position.y - y);
          return dx < nodeWidth && dy < nodeHeight;
        });
      };
      
      // 为每个新节点分配位置，避免重叠
      const positionedNodes: FractalNode[] = [];
      
      validatedNodes.forEach((node, index) => {
        let finalX: number;
        let finalY: number;
        
        // 检查节点是否已有有效位置（不是 0,0）
        if (node.position && node.position.x !== 0 && node.position.y !== 0) {
          // 检查是否与现有节点或已处理的新节点重叠
          const overlaps = isPositionOverlapping(node.position.x, node.position.y, positionedNodes);
          
          // 如果不重叠，保持原位置
          if (!overlaps) {
            finalX = node.position.x;
            finalY = node.position.y;
          } else {
            // 如果重叠，计算新位置
            // 水平排列，每行最多3个节点
            const rowIndex = Math.floor(index / 3);
            const colIndex = index % 3;
            finalX = startX + colIndex * spacingX;
            finalY = startY + rowIndex * spacingY;
            
            // 如果计算出的位置仍然重叠，继续寻找下一个可用位置
            let attempts = 0;
            while (isPositionOverlapping(finalX, finalY, positionedNodes) && attempts < 10) {
              attempts++;
              // 尝试向右移动
              finalX += spacingX;
              // 如果超出一定范围，换行
              if (finalX > startX + spacingX * 5) {
                finalX = startX;
                finalY += spacingY;
              }
            }
          }
        } else {
          // 节点没有有效位置，计算新位置
          // 水平排列，每行最多3个节点
          const rowIndex = Math.floor(index / 3);
          const colIndex = index % 3;
          finalX = startX + colIndex * spacingX;
          finalY = startY + rowIndex * spacingY;
          
          // 如果计算出的位置仍然重叠，继续寻找下一个可用位置
          let attempts = 0;
          while (isPositionOverlapping(finalX, finalY, positionedNodes) && attempts < 10) {
            attempts++;
            // 尝试向右移动
            finalX += spacingX;
            // 如果超出一定范围，换行
            if (finalX > startX + spacingX * 5) {
              finalX = startX;
              finalY += spacingY;
            }
          }
        }
        
        const positionedNode = {
          ...node,
          position: {
            x: finalX,
            y: finalY,
          },
        };
        
        // 验证节点结构
        if (!positionedNode.type) {
          console.error(`❌ [canvas-store] 节点 ${positionedNode.id} 在定位后仍然缺少 type 字段`);
        }
        if (!positionedNode.data) {
          console.error(`❌ [canvas-store] 节点 ${positionedNode.id} 在定位后仍然缺少 data 字段`);
        }
        
        positionedNodes.push(positionedNode);
      });
      
      // Nodes positioned successfully
      console.log(`✅ [canvas-store] addNodes: 成功处理 ${positionedNodes.length} 个节点`, {
        nodeTypes: positionedNodes.map(n => ({ id: n.id, type: n.type, label: n.data?.label })),
      });
      
      return {
        nodes: [...existingNodes, ...positionedNodes],
      };
    });
  },

  addEdges: (newEdges: Edge[]) => {
    set((state) => ({
      edges: [...state.edges, ...newEdges],
    }));
  },

  updateNodeData: (id: string, data: UpdateNodeDataPayload) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== id) return node;
        
        // 支持深层合并 artifacts
        const updatedData = { ...node.data };
        if (data.artifacts) {
          // 关键修复：明确地只合并需要更新的部分，确保未传入的属性不会被意外覆盖
          updatedData.artifacts = {
            ...node.data.artifacts,
            // 深层合并 view（需要特殊处理，如果传入的view.code为空或无效，保留原有的view）
            view: (() => {
              const incomingView = data.artifacts.view;
              const existingView = node.data.artifacts.view;
              
              // 调试日志（仅开发环境，避免生产噪音）
              if (incomingView && process.env.NODE_ENV === 'development') {
                log('🔍 [canvas-store] updateNodeData view merge:', {
                  nodeId: id,
                  incomingCodeLength: incomingView.code?.length || 0,
                  incomingCodePreview: incomingView.code ? preview(incomingView.code, 50) : 'N/A',
                  existingCodeLength: existingView?.code?.length || 0,
                  existingCodePreview: existingView?.code ? preview(existingView.code, 50) : 'N/A',
                  incomingIsValid: incomingView.code && incomingView.code.length > 0 && incomingView.code !== '// PLACEHOLDER',
                  existingIsValid: existingView?.code && existingView.code.length > 0 && existingView.code !== '// PLACEHOLDER',
                });
              }
              
              // 如果传入的view存在
              if (incomingView) {
                // 检查传入的view.code是否有效（非空、非占位符）
                const incomingCodeIsValid = incomingView.code && 
                                          incomingView.code.length > 0 && 
                                          incomingView.code !== '// PLACEHOLDER' &&
                                          incomingView.code.trim() !== '';
                
                // 检查原有view.code是否有效
                const existingCodeIsValid = existingView && 
                                           existingView.code && 
                                           existingView.code.length > 0 && 
                                           existingView.code !== '// PLACEHOLDER' &&
                                           existingView.code.trim() !== '';
                
                // 如果传入的view.code有效，合并（保留existingView的其他属性，如previewUrl）
                if (incomingCodeIsValid) {
                  // 直接使用传入的code，确保不会丢失
                  const merged = { 
                    ...existingView, 
                    ...incomingView,
                    // 强制使用传入的有效code，不进行任何fallback
                    code: incomingView.code,
                  };
                  if (process.env.NODE_ENV === 'development') {
                    log('✅ [canvas-store] 使用传入的有效 view.code，合并结果:', {
                      mergedCodeLength: merged.code?.length || 0,
                      mergedCodePreview: merged.code ? preview(merged.code, 50) : 'N/A',
                      hasPreviewUrl: !!merged.previewUrl,
                      incomingCodeLength: incomingView.code?.length || 0,
                      existingCodeLength: existingView?.code?.length || 0,
                    });
                  }
                  // 最终验证：确保合并后的code有效
                  if (!merged.code || merged.code.length === 0 || merged.code === '// PLACEHOLDER') {
                    logError('❌ [canvas-store] 合并后code仍然无效，这不应该发生！', {
                      incomingCode: incomingView.code ? preview(incomingView.code, 50) : 'N/A',
                      existingCode: existingView?.code ? preview(existingView.code, 50) : 'N/A',
                    });
                  }
                  return merged;
                }
                // 如果传入的view.code为空或无效，保留原有view（不覆盖）
                if (existingCodeIsValid) {
                  if (process.env.NODE_ENV === 'development') logWarn('⚠️ [canvas-store] 传入的 view.code 无效，保留原有 view');
                  return existingView; // 保留原有有效view
                }
                if (process.env.NODE_ENV === 'development') logWarn('⚠️ [canvas-store] 原有 view 也无效，使用传入的 view');
                // 如果传入的view.code虽然无效，但至少尝试保留previewUrl等其他属性
                const mergedInvalid = { ...existingView, ...incomingView };
                // 即使传入的code无效，也不要用空字符串覆盖，至少保留原有的code
                if (existingView?.code && existingView.code.length > 0) {
                  mergedInvalid.code = existingView.code;
                }
                return mergedInvalid;
              }
              // 如果没有传入view，保留原有view
              if (process.env.NODE_ENV === 'development') logWarn('⚠️ [canvas-store] 没有传入 view，保留原有 view');
              return existingView;
            })(),
            spec: data.artifacts.spec
              ? { ...node.data.artifacts.spec, ...data.artifacts.spec }
              : node.data.artifacts.spec,
            impl: data.artifacts.impl
              ? { ...node.data.artifacts.impl, ...data.artifacts.impl }
              : node.data.artifacts.impl,
            test: data.artifacts.test
              ? { ...node.data.artifacts.test, ...data.artifacts.test }
              : node.data.artifacts.test,
            // 用户故事模型（新 - 核心）
            userStories: data.artifacts.userStories !== undefined
              ? data.artifacts.userStories
              : node.data.artifacts.userStories,
            // 兼容旧数据（可选）
            businessContext: data.artifacts.businessContext !== undefined
              ? (node.data.artifacts.businessContext
                  ? { ...node.data.artifacts.businessContext, ...data.artifacts.businessContext }
                  : data.artifacts.businessContext)
              : node.data.artifacts.businessContext,
            events: data.artifacts.events !== undefined
              ? data.artifacts.events
              : node.data.artifacts.events,
            // 兼容旧数据（可选）
            logic: data.artifacts.logic !== undefined
              ? (node.data.artifacts.logic 
                  ? { ...node.data.artifacts.logic, ...data.artifacts.logic }
                  : data.artifacts.logic)
              : node.data.artifacts.logic,
          };
        }
        
        const updatedNode = {
          ...node,
          data: {
            ...updatedData,
            ...data,
            artifacts: updatedData.artifacts,
          },
        };
        
        // 验证更新后的节点数据（始终输出日志，便于调试）
        if (data.artifacts?.view?.code) {
          const savedCode = updatedNode.data.artifacts?.view?.code || '';
          if (process.env.NODE_ENV === 'development') log('✅ [canvas-store] 节点更新完成:', {
            nodeId: id,
            savedCodeLength: savedCode.length,
            savedCodePreview: savedCode ? preview(savedCode, 50) : 'N/A',
            hasView: !!updatedNode.data.artifacts?.view,
            hasCode: !!updatedNode.data.artifacts?.view?.code,
          });
        }
        
        return updatedNode;
      }),
    }));
  },

  onNodesChange: (changes: NodeChange[]) => {
    set((state) => {
      // 完全禁用 React Flow 的默认选择行为
      // 节点选择完全由我们的 handleNodeClick 和 handleNodeDoubleClick 控制
      // 这里只处理节点位置、尺寸等变化，不处理选择变化
      const filteredChanges = changes.filter(change => change.type !== 'select');
      
      // 如果有选择变化，忽略它（不更新 selectedNodeId）
      // 选择状态完全由 selectNode 和 openNodeDetail 控制
      const updatedNodes = filteredChanges.length > 0 
        ? applyNodeChanges(filteredChanges, state.nodes) as FractalNode[]
        : state.nodes;
      
      return {
        nodes: updatedNodes,
        // 不更新 selectedNodeId，保持当前选择状态
        // 选择完全由 handleNodeClick/handleNodeDoubleClick 控制
      };
    });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
  },

  onConnect: (connection: Connection) => {
    set((state) => {
      // 使用 addEdge 创建新边数组
      const newEdges = addEdge(connection, state.edges);
      
      // 获取新添加的边（数组中的最后一个）
      const lastEdge = newEdges[newEdges.length - 1];
      
      // 为新边添加默认属性
      const enhancedEdge: Edge = {
        ...lastEdge,
        type: 'smart',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        label: 'Action',
        labelStyle: {
          fill: '#64748B',
          fontWeight: 500,
        },
      };
      
      // 替换最后一个边为增强后的边
      return {
        edges: [...newEdges.slice(0, -1), enhancedEdge],
      };
    });
  },

  // Manual Edge Management
  updateEdgeLabel: (edgeId: string, newLabel: string) => {
    set((state) => ({
      edges: state.edges.map((edge) => {
        if (edge.id !== edgeId) return edge;
        
        return {
          ...edge,
          label: newLabel,
          data: {
            ...edge.data,
            label: newLabel,
          },
        };
      }),
    }));
  },

  deleteEdge: (edgeId: string) => {
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeId),
    }));
  },

  deleteNode: (nodeId: string) => {
    set((state) => {
      // 删除节点
      const updatedNodes = state.nodes.filter((node) => node.id !== nodeId);
      
      // 删除与该节点相关的所有边
      const updatedEdges = state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      );
      
      // 如果删除的是当前选中的节点，清除选择
      const newSelectedNodeId = state.selectedNodeId === nodeId ? null : state.selectedNodeId;
      const shouldClosePanel = state.selectedNodeId === nodeId;
      
      return {
        nodes: updatedNodes,
        edges: updatedEdges,
        selectedNodeId: newSelectedNodeId,
        isDetailPanelOpen: shouldClosePanel ? false : state.isDetailPanelOpen,
      };
    });
  },

  selectNode: (id: string | null) => {
    set((state) => {
      // 更新节点的 selected 状态
      const updatedNodes = state.nodes.map((node) => ({
        ...node,
        selected: node.id === id,
      }));

      return {
        nodes: updatedNodes,
        selectedNodeId: id,
        // 选择节点时不自动打开面板（只有双击才打开）
      };
    });
  },

  openNodeDetail: (nodeId: string) => {
    set((state) => {
      // 更新节点的 selected 状态
      const updatedNodes = state.nodes.map((node) => ({
        ...node,
        selected: node.id === nodeId,
      }));

      return {
        nodes: updatedNodes,
        selectedNodeId: nodeId,
        isDetailPanelOpen: true,
      };
    });
  },

  closeNodeDetail: () => {
    set({
      isDetailPanelOpen: false,
      selectedNodeId: null, // Clear selection when closing panel
    });
  },

  layoutNodes: () => {
    set((state) => {
      if (state.nodes.length === 0) return state;

      const layoutedNodes = getLayoutedElements(
        state.nodes,
        state.edges,
        'LR'
      );

      return {
        nodes: layoutedNodes,
      };
    });
  },

  // Manual Editing & Project Management
  addBlankNode: (position?: { x: number; y: number }) => {
    set((state) => {
      const timestamp = Date.now();
      
      // 1. Check if there's a selected node
      const selectedNodeId = state.selectedNodeId;
      const selectedNode = selectedNodeId 
        ? state.nodes.find((n) => n.id === selectedNodeId)
        : null;

      // 2. Determine node position
      let nodePosition: { x: number; y: number };
      if (position) {
        // Use provided position (e.g., from context menu)
        nodePosition = position;
      } else if (selectedNode) {
        // Place new node to the right of the selected node
        nodePosition = {
          x: selectedNode.position.x + 400,
          y: selectedNode.position.y,
        };
      } else {
        // Default position
        nodePosition = { x: 250, y: 250 };
      }
      
      const nodeLabel = '新节点';
      const blankNode: FractalNode = ensureNodeDimensions({
        id: `manual-${timestamp}`,
        type: 'page',
        position: nodePosition,
        selected: false,
        data: {
          label: nodeLabel,
          artifacts: {
            view: {
              code: generateBlankNodeCode(nodeLabel),
            },
            spec: {
              title: '新节点',
              requirements: [
                '待完善的功能需求',
              ],
            },
            impl: {
              apiEndpoints: [],
              dbSchema: '-- 暂无数据库需求',
            },
            test: {
              cases: [
                '待添加测试用例',
              ],
            },
          },
          syncState: {
            isSynced: true,
            lastSource: 'view',
          },
          source: {
            type: 'human',
          },
        },
      });

      // 3. Create edge if parent exists
      const newEdges = selectedNode
        ? [
            ...state.edges,
            {
              id: `e-${selectedNode.id}-${blankNode.id}`,
              source: selectedNode.id,
              target: blankNode.id,
              type: 'smart',
              animated: true,
              markerEnd: {
                type: 'arrowclosed' as const,
              },
              label: 'Action',
              labelStyle: {
                fill: '#64748B',
                fontWeight: 500,
              },
            } as Edge,
          ]
        : state.edges;

      // 4. Apply auto-layout if no explicit position provided and we have edges
      // 如果提供了 position（如右键菜单），则不进行自动布局
      // 如果没有提供 position 且有选中节点（创建子节点），则进行自动布局
      if (!position && selectedNode) {
        const allNodes = [...state.nodes, blankNode];
        const allEdges = newEdges;
        const layoutedNodes = getLayoutedElements(allNodes, allEdges, 'LR');
        
        return {
          nodes: layoutedNodes,
          edges: allEdges,
          selectedNodeId: blankNode.id,
        };
      }

      return {
        nodes: [...state.nodes, blankNode],
        edges: newEdges,
        selectedNodeId: blankNode.id,
      };
    });
  },

  // Tab 键：添加子节点（使用选中节点作为父节点）
  addChildNode: () => {
    set((state) => {
      const selectedNodeId = state.selectedNodeId;
      if (!selectedNodeId) {
        // 如果没有选中节点，不执行任何操作
        return state;
      }

      const selectedNode = state.nodes.find((n) => n.id === selectedNodeId);
      if (!selectedNode) {
        return state;
      }

      // 使用 addBlankNode 的逻辑，但不传 position，让自动布局处理
      const timestamp = Date.now();
      const nodeLabel = '新节点';
      const blankNode: FractalNode = ensureNodeDimensions({
        id: `manual-${timestamp}`,
        type: 'page',
        position: {
          x: selectedNode.position.x + 400,
          y: selectedNode.position.y,
        },
        selected: false,
        data: {
          label: nodeLabel,
          artifacts: {
            view: {
              code: generateBlankNodeCode(nodeLabel),
            },
            spec: {
              title: '新节点',
              requirements: ['待完善的功能需求'],
            },
            impl: {
              apiEndpoints: [],
              dbSchema: '-- 暂无数据库需求',
            },
            test: {
              cases: ['待添加测试用例'],
            },
          },
          syncState: {
            isSynced: true,
            lastSource: 'view',
          },
          source: {
            type: 'human',
          },
        },
      });

      const newEdge: Edge = {
        id: `e-${selectedNode.id}-${blankNode.id}`,
        source: selectedNode.id,
        target: blankNode.id,
        type: 'smart',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        label: 'Action',
        labelStyle: {
          fill: '#64748B',
          fontWeight: 500,
        },
      };

      const allNodes = [...state.nodes, blankNode];
      const allEdges = [...state.edges, newEdge];
      const layoutedNodes = getLayoutedElements(allNodes, allEdges, 'LR');

      return {
        nodes: layoutedNodes,
        edges: allEdges,
        selectedNodeId: blankNode.id,
      };
    });
  },

  // Enter 键：添加同级节点（与选中节点同级）
  addSiblingNode: () => {
    set((state) => {
      const selectedNodeId = state.selectedNodeId;
      if (!selectedNodeId) {
        // 如果没有选中节点，不执行任何操作
        return state;
      }

      const selectedNode = state.nodes.find((n) => n.id === selectedNodeId);
      if (!selectedNode) {
        return state;
      }

      // 找到选中节点的父边（edge.target === selectedNodeId）
      const parentEdge = state.edges.find((e) => e.target === selectedNodeId);
      
      // 如果没有父边（是根节点），调用 addChildNode 逻辑
      if (!parentEdge) {
        // 根节点没有同级，调用 addChildNode 添加子节点
        const storeState = get?.();
        const addChildNode = storeState?.addChildNode;
        if (addChildNode) {
          addChildNode();
        }
        return state;
      }

      // 获取父节点ID
      const parentId = parentEdge.source;
      const parentNode = state.nodes.find((n) => n.id === parentId);
      
      if (!parentNode) {
        // 父节点不存在，不执行操作
        return state;
      }

      const timestamp = Date.now();
      const nodeLabel = '新节点';
      const blankNode: FractalNode = ensureNodeDimensions({
        id: `manual-${timestamp}`,
        type: 'page',
        position: {
          x: selectedNode.position.x,
          y: selectedNode.position.y + 300,
        },
        selected: false,
        data: {
          label: nodeLabel,
          artifacts: {
            view: {
              code: generateBlankNodeCode(nodeLabel),
            },
            spec: {
              title: '新节点',
              requirements: ['待完善的功能需求'],
            },
            impl: {
              apiEndpoints: [],
              dbSchema: '-- 暂无数据库需求',
            },
            test: {
              cases: ['待添加测试用例'],
            },
          },
          syncState: {
            isSynced: true,
            lastSource: 'view',
          },
          source: {
            type: 'human',
          },
        },
      });

      // 创建从父节点到新节点的边（同级节点共享同一个父节点）
      const newEdge: Edge = {
        id: `e-${parentId}-${blankNode.id}`,
        source: parentId,
        target: blankNode.id,
        type: 'smart',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        label: 'Action',
        labelStyle: {
          fill: '#64748B',
          fontWeight: 500,
        },
      };

      // 应用自动布局
      const allNodes = [...state.nodes, blankNode];
      const allEdges = [...state.edges, newEdge];
      const layoutedNodes = getLayoutedElements(allNodes, allEdges, 'LR');

      return {
        nodes: layoutedNodes,
        edges: allEdges,
        selectedNodeId: blankNode.id, // 自动选中新节点
      };
    });
  },

  clearCanvas: () => {
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      isDetailPanelOpen: false,
    });
  },

  loadProject: (data: { nodes: FractalNode[]; edges: Edge[] }) => {
    set({
      nodes: (data.nodes || []).map(ensureNodeDimensions),
      edges: data.edges || [],
      selectedNodeId: null,
      isDetailPanelOpen: false,
    });
  },

  exportProject: () => {
    try {
      const state = get?.();
      if (state == null) {
        console.warn('Canvas store getState not available in exportProject');
        return { nodes: [], edges: [] };
      }
      return {
        nodes: state?.nodes || [],
        edges: state?.edges || [],
      };
    } catch (error) {
      console.error('Error in exportProject:', error);
      return { nodes: [], edges: [] };
    }
  },

  // Theme Management
  setTheme: (theme: UIThemeConfig) => {
    set({ currentTheme: theme });
  },

  setStylePreset: (preset: StylePresetId) => {
    set({ stylePreset: preset });
  },

  // Project Meta Management
  updateProjectMeta: (meta: Partial<ProjectMeta>) => {
    set((state) => ({
      projectMeta: {
        ...state.projectMeta,
        ...meta,
      },
    }));
  },

  // Global Rules Management
  updateGlobalRules: (rules: Partial<GlobalRules>) => {
    set((state) => ({
      globalRules: {
        ...state.globalRules,
        ...rules,
      },
    }));
  },

  // AI Config Management
  updateAIConfig: (config: Partial<AIConfig>) => {
    set((state) => ({
      aiConfig: {
        ...state.aiConfig,
        ...config,
      },
    }));
  },

  // Project Blueprint Management
  openBlueprint: (initialTab?: BlueprintTabType, initialData?: Partial<ProjectMeta>) => {
    set({
      isBlueprintOpen: true,
      blueprintInitialTab: initialTab,
      blueprintInitialData: initialData,
    });
  },

  closeBlueprint: () => {
    set({
      isBlueprintOpen: false,
      blueprintInitialTab: undefined,
      blueprintInitialData: undefined,
    });
  },

  setViewportPreset: (preset: 'mobile' | 'desktop') => {
    set({ viewportPreset: preset });
  },
  lockViewport: (preset: 'mobile' | 'desktop') => {
    set({ viewportPreset: preset, viewportLocked: preset });
  },

  setConversationPanelOpen: (open: boolean) => {
    set({ conversationPanelOpen: open });
  },
  appendConversationMessage: (msg: ConversationMessage) => {
    set((state) => ({
      conversationMessages: [...state.conversationMessages.slice(-99), msg],
    }));
  },
  setConversationMessages: (messages: ConversationMessage[]) => {
    set({ conversationMessages: messages });
  },
  updateLastAssistantMessage: (content: string, status: 'done' | 'error', clarification?: ConversationMessage['clarification']) => {
    set((state) => {
      const prev = state.conversationMessages;
      const last = prev[prev.length - 1];
      if (last?.role !== 'assistant') return state;
      return {
        conversationMessages: [
          ...prev.slice(0, -1),
          { ...last, content, status, ...(clarification ? { clarification } : {}) },
        ],
      };
    });
  },
  setPendingClarificationContext: (ctx: PendingClarificationContext | null) => {
    set({ pendingClarificationContext: ctx });
  },
  setPendingClarificationReply: (reply: string | null) => {
    set({ pendingClarificationReply: reply });
  },
  clearConversation: () => {
    set({
      conversationMessages: [],
      pendingClarificationContext: null,
      pendingClarificationReply: null,
    });
  },
  setAiCreatePending: (v: boolean) => {
    set({ isAiCreatePending: v });
  },
  setPendingCreatePrompt: (prompt: string | null) => {
    set({ pendingCreatePrompt: prompt });
  },
  setPendingCreateMedia: (v: { mediaBase64: string; mediaType: 'image' | 'video' } | null) => {
    set({ pendingCreateMedia: v });
  },
      }
    },
    {
      name: 'fractal-canvas-storage',
      // 确保所有数据都是可序列化的
      partialize: (state: CanvasStore) => ({
        nodes: state.nodes,
        edges: state.edges,
        currentTheme: state.currentTheme,
        stylePreset: state.stylePreset,
        projectMeta: state.projectMeta,
        globalRules: state.globalRules,
        aiConfig: state.aiConfig,
        viewportPreset: state.viewportPreset,
        viewportLocked: state.viewportLocked,
        // 不持久化 selectedNodeId，每次刷新时重置
      }) as any,
      // 跳过 SSR 时的 hydration
      skipHydration: true, // 手动控制 hydration，避免阻塞
      // 添加存储检查，防止在服务器端或 localStorage 不可用时出错
      // 必须始终提供 storage 对象，否则 persist 会调用 undefined.get/getItem 报错
      storage: (typeof window !== 'undefined' && window.localStorage)
        ? {
        getItem: (name: string) => {
          try {
            if (typeof window === 'undefined' || !window.localStorage) return null;
            
            // 先测试 localStorage 是否可用（可能被安全策略阻止）
            try {
              const testKey = '__localStorage_test__';
              window.localStorage.setItem(testKey, 'test');
              window.localStorage.removeItem(testKey);
            } catch (securityError) {
              // localStorage 被安全策略阻止，返回 null 使用默认状态
              console.warn('localStorage access denied, using default state');
              return null;
            }
            
            const value = window.localStorage.getItem(name);
            if (!value) return null;
            
            // 尝试解析 JSON
            const parsed = JSON.parse(value);
            
            // 验证数据结构，并为节点补全 width/height（避免部署环境连线脱节）
            if (parsed && typeof parsed === 'object' && 'state' in parsed) {
              const state = parsed.state as CanvasState;
              const nodes = Array.isArray(state?.nodes)
                ? (state.nodes as FractalNode[]).map(ensureNodeDimensions)
                : state?.nodes ?? [];
              return { ...parsed, state: { ...state, nodes } };
            }
            
            // 如果格式不正确，返回 null 以使用默认值
            console.warn('Invalid localStorage data format, using defaults');
            return null;
          } catch (error) {
            console.warn('Failed to parse localStorage data:', error);
            // 清除损坏的数据（如果可能）
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.removeItem(name);
              }
            } catch (e) {
              // 忽略清除错误（可能是安全限制）
            }
            return null;
          }
        },
        setItem: (name: string, value: any) => {
          try {
            if (typeof window === 'undefined' || !window.localStorage) return;
            // Zustand persist 会传递 { state: {...}, version: 0 } 格式
            const serialized = JSON.stringify(value);
            window.localStorage.setItem(name, serialized);
          } catch (error) {
            console.warn('Failed to set item to localStorage:', error);
            // 如果存储失败（可能是存储空间不足），尝试清除旧数据
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.removeItem(name);
                window.localStorage.setItem(name, JSON.stringify(value));
              }
            } catch (e) {
              console.error('Failed to recover localStorage:', e);
            }
          }
        },
        removeItem: (name: string) => {
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              window.localStorage.removeItem(name);
            }
          } catch (error) {
            console.warn('Failed to remove item from localStorage:', error);
          }
        },
      } as any
        : {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          },
      // 添加版本控制，如果数据结构改变，清除旧数据
      version: 1,
      migrate: (persistedState: any, version: number) => {
        try {
          // 如果版本不匹配，返回空状态
          if (version !== 1) {
            console.warn('Storage version mismatch, clearing old data');
            return {
            nodes: [createMockNode()],
            edges: [],
            selectedNodeId: null,
            isDetailPanelOpen: false,
          };
        }
        
        // 验证迁移后的状态结构
        if (persistedState && typeof persistedState === 'object') {
          // 确保有必要的字段
          if (!Array.isArray(persistedState.nodes)) {
            persistedState.nodes = [createMockNode()];
          }
          if (!Array.isArray(persistedState.edges)) {
            persistedState.edges = [];
          }
          if (persistedState.selectedNodeId === undefined) {
            persistedState.selectedNodeId = null;
          }
          if (persistedState.isDetailPanelOpen === undefined) {
            persistedState.isDetailPanelOpen = false;
          }
          if (persistedState.currentTheme === undefined) {
            persistedState.currentTheme = defaultTheme;
          }
          if (persistedState.stylePreset === 'tech') persistedState.stylePreset = 'cyberpunk';
          if (persistedState.stylePreset === undefined || !STYLE_PRESET_IDS.includes(persistedState.stylePreset as StylePresetId)) {
            persistedState.stylePreset = 'neutral';
          }
          if (persistedState.viewportPreset === 'tablet') {
            persistedState.viewportPreset = 'desktop';
          }
          if (persistedState.viewportPreset === undefined || !['mobile', 'desktop'].includes(persistedState.viewportPreset)) {
            persistedState.viewportPreset = 'mobile';
          }
          if (persistedState.viewportLocked !== undefined && persistedState.viewportLocked !== null && !['mobile', 'desktop'].includes(persistedState.viewportLocked)) {
            persistedState.viewportLocked = null;
          }
        }

        return persistedState;
      } catch (error) {
        console.error('Migration error, using defaults:', error);
        return {
          nodes: [createMockNode()],
          edges: [],
          selectedNodeId: null,
          isDetailPanelOpen: false,
          currentTheme: defaultTheme,
          stylePreset: 'neutral',
        };
      }
    },
  }
  )
);
