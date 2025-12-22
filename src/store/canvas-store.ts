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
  CanvasState,
  NodeArtifacts,
  ProjectMeta,
  GlobalRules,
  AIConfig,
} from '@/types/fractal';
import { getLayoutedElements } from '@/lib/layout';
import type { UIThemeConfig } from '@/types/theme';
import { defaultTheme } from '@/types/theme';

interface CanvasStore extends CanvasState {
  // Detail Panel State
  isDetailPanelOpen: boolean;
  // Actions
  addNode: (node: FractalNode) => void;
  addNodes: (nodes: FractalNode[]) => void;
  addEdges: (edges: Edge[]) => void;
  // 支持部分更新，包括深层 artifacts 更新
  updateNodeData: (id: string, data: any) => void;
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
}

/**
 * 创建初始 mock 数据 - 一个 'page' 节点
 */
const createMockNode = (): FractalNode => {
  const mockArtifacts: NodeArtifacts = {
    view: {
      code: `export default function HomePage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">欢迎使用 AI-Native IDE</h1>
      <p className="mt-4 text-gray-600">这是一个示例页面节点</p>
    </div>
  );
}`,
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

  return {
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
  };
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
          currentTheme: defaultTheme,
          projectMeta: {
            projectName: '未命名项目',
            industry: 'General Internet',
            targetAudience: 'General Users',
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
            visionModel: 'gpt-5-2025-08-07',
            textModel: 'gpt-5-2025-08-07',
          },
        };
      }

      // 初始化项目画像和全局规则（在函数开始处定义，以便在错误处理中使用）
      const initialProjectMeta: ProjectMeta = {
        projectName: '未命名项目',
        industry: 'General Internet',
        targetAudience: 'General Users',
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
        visionModel: process.env.NEXT_PUBLIC_AI_VISION_MODEL || 'gpt-5-2025-08-07',
        textModel: process.env.NEXT_PUBLIC_AI_TEXT_MODEL || 'gpt-5-2025-08-07',
      };

      return {
        // Initial state with mock data
        nodes: [createMockNode()],
        edges: [],
        selectedNodeId: null,
        isDetailPanelOpen: false,
        currentTheme: defaultTheme,
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

      // 2. Adjust node position if parent exists
      let newNode = { ...node };
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
                type: MarkerType.ArrowClosed,
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
      
      newNodes.forEach((node, index) => {
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
        
        positionedNodes.push({
          ...node,
          position: {
            x: finalX,
            y: finalY,
          },
        });
      });
      
      // Nodes positioned successfully
      
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

  updateNodeData: (id: string, data: Partial<FractalNodeData>) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== id) return node;
        
        // 支持深层合并 artifacts
        const updatedData = { ...node.data };
        if (data.artifacts) {
          updatedData.artifacts = {
            ...node.data.artifacts,
            ...data.artifacts,
            // 深层合并 view, spec, impl, test
            view: data.artifacts.view
              ? { ...node.data.artifacts.view, ...data.artifacts.view }
              : node.data.artifacts.view,
            spec: data.artifacts.spec
              ? { ...node.data.artifacts.spec, ...data.artifacts.spec }
              : node.data.artifacts.spec,
            impl: data.artifacts.impl
              ? { ...node.data.artifacts.impl, ...data.artifacts.impl }
              : node.data.artifacts.impl,
            test: data.artifacts.test
              ? { ...node.data.artifacts.test, ...data.artifacts.test }
              : node.data.artifacts.test,
          };
        }
        
        return {
          ...node,
          data: {
            ...updatedData,
            ...data,
            artifacts: updatedData.artifacts,
          },
        };
      }),
    }));
  },

  onNodesChange: (changes: NodeChange[]) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes) as FractalNode[],
    }));
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
      
      const blankNode: FractalNode = {
        id: `manual-${timestamp}`,
        type: 'page',
        position: nodePosition,
        selected: false,
        data: {
          label: '新节点',
          artifacts: {
            view: {
              code: `function App() {
  const { useState } = React;
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">新节点</h1>
      <p className="text-gray-600">这是一个空白节点，你可以编辑它</p>
    </div>
  );
}`,
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
      };

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
                type: MarkerType.ArrowClosed,
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
      const blankNode: FractalNode = {
        id: `manual-${timestamp}`,
        type: 'page',
        position: {
          x: selectedNode.position.x + 400,
          y: selectedNode.position.y,
        },
        selected: false,
        data: {
          label: '新节点',
          artifacts: {
            view: {
              code: `function App() {
  const { useState } = React;
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">新节点</h1>
      <p className="text-gray-600">这是一个空白节点，你可以编辑它</p>
    </div>
  );
}`,
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
      };

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
        const { addChildNode } = get();
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
      const blankNode: FractalNode = {
        id: `manual-${timestamp}`,
        type: 'page',
        position: {
          x: selectedNode.position.x,
          y: selectedNode.position.y + 300,
        },
        selected: false,
        data: {
          label: '新节点',
          artifacts: {
            view: {
              code: `function App() {
  const { useState } = React;
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">新节点</h1>
      <p className="text-gray-600">这是一个空白节点，你可以编辑它</p>
    </div>
  );
}`,
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
      };

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
      nodes: data.nodes || [],
      edges: data.edges || [],
      selectedNodeId: null,
      isDetailPanelOpen: false,
    });
  },

  exportProject: () => {
    if (!get) {
      console.error('get function is not available in exportProject');
      return { nodes: [], edges: [] };
    }
    try {
      const state = get();
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
      }
    },
    {
      name: 'fractal-canvas-storage',
      // 确保所有数据都是可序列化的
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        projectMeta: state.projectMeta,
        globalRules: state.globalRules,
        aiConfig: state.aiConfig,
        // 不持久化 selectedNodeId，每次刷新时重置
      }) as any,
      // 跳过 SSR 时的 hydration
      skipHydration: true, // 手动控制 hydration，避免阻塞
      // 添加存储检查，防止在服务器端或 localStorage 不可用时出错
      storage: typeof window !== 'undefined' ? {
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
            
            // 验证数据结构
            if (parsed && typeof parsed === 'object' && 'state' in parsed) {
              return parsed;
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
      } as any : undefined,
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
        };
      }
    },
  }
  )
);
