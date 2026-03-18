'use client';

import 'reactflow/dist/style.css';

import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  EdgeTypes,
  NodeMouseHandler,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import { useCanvasStore } from '@/store/canvas-store';
import { EMPTY_CANVAS_PRIMARY, EMPTY_CANVAS_SECONDARY, NO_NODE_SELECTED_MESSAGE } from '@/lib/user-facing-messages';
import { FractalNode } from './FractalNode';
import { SmartEdge } from './SmartEdge';
import { ProjectToolbar } from './ProjectToolbar';
import { RefreshCw } from 'lucide-react';
import { AutoLayoutButton } from './AutoLayoutButton';
import { StyleExtractor } from './StyleExtractor';
import { OPEN_STYLE_EXTRACTOR_EVENT } from '@/lib/canvas-ui-events';
import { AIConfigButton } from './AIConfigButton';
import { NodeDetailPanel } from './NodeDetailPanel';
import { PresentationMode } from './PresentationMode';
import { ConversationPanel } from './ConversationPanel';
import { CONVERSATION_PANEL_WIDTH_PX, AI_PANEL_WIDTH_RATIO } from '@/lib/layout-constants';
import { clsx } from 'clsx';
import { MessageCircle } from 'lucide-react';
import { StitchHomepage } from './StitchHomepage';
import { ContextMenu } from './ContextMenu';
import { Play, Palette } from 'lucide-react';

// 注册自定义节点类型（必须在组件外部定义，避免每次渲染重新创建）
const nodeTypes: NodeTypes = {
  page: FractalNode,
  service: FractalNode,
  // 添加默认节点类型，防止节点类型不匹配时使用 React Flow 的默认菱形节点
  default: FractalNode,
};

// 注册自定义边类型（必须在组件外部定义，避免每次渲染重新创建）
const edgeTypes: EdgeTypes = {
  smart: SmartEdge,
};

// 内部组件，用于访问 React Flow 实例
function CanvasContent() {
  const { screenToFlowPosition, fitView } = useReactFlow();
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectNode,
    openNodeDetail,
    closeNodeDetail,
    selectedNodeId,
    isDetailPanelOpen,
    deleteNode,
    addChildNode,
    addSiblingNode,
    addBlankNode,
    setConversationPanelOpen,
  } = useCanvasStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; flowX: number; flowY: number } | null>(null);
  // 用于区分单击和双击的定时器和标志
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDoubleClickRef = useRef<boolean>(false);
  const lastClickNodeIdRef = useRef<string | null>(null);

  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  const handleConnect = useCallback(
    (connection: Parameters<typeof onConnect>[0]) => {
      onConnect(connection);
    },
    [onConnect]
  );

  // 彻底重写：单击只选中，双击才打开详情面板
  const handleNodeClick: NodeMouseHandler = useCallback(
    (event, node) => {
      event.preventDefault();
      event.stopPropagation();
      
      console.log('🔍 [InfiniteCanvas] handleNodeClick 被调用', { nodeId: node.id });
      
      // 如果这是双击后的单击事件，直接忽略
      if (isDoubleClickRef.current && lastClickNodeIdRef.current === node.id) {
        console.log('✅ [InfiniteCanvas] 检测到双击后的单击，忽略', { nodeId: node.id });
        isDoubleClickRef.current = false;
        lastClickNodeIdRef.current = null;
        return;
      }

      // 如果已有定时器，说明这是第二次点击（可能是双击）
      if (clickTimeoutRef.current) {
        console.log('✅ [InfiniteCanvas] 检测到第二次点击，可能是双击，清除定时器', { nodeId: node.id });
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
        // 设置双击标志，等待双击事件
        isDoubleClickRef.current = true;
        lastClickNodeIdRef.current = node.id;
        return;
      }

      // 第一次点击，设置定时器
      lastClickNodeIdRef.current = node.id;
      clickTimeoutRef.current = setTimeout(() => {
        // 检查是否是双击
        if (isDoubleClickRef.current && lastClickNodeIdRef.current === node.id) {
          console.log('✅ [InfiniteCanvas] 定时器执行时检测到双击，取消单击', { nodeId: node.id });
          isDoubleClickRef.current = false;
          lastClickNodeIdRef.current = null;
          clickTimeoutRef.current = null;
          return;
        }

        // 单击：只选中节点，不打开详情面板
        console.log('✅ [InfiniteCanvas] 执行单击：只选中节点', { nodeId: node.id });
        selectNode(node.id);
        clickTimeoutRef.current = null;
        lastClickNodeIdRef.current = null;
      }, 250); // 250ms 延迟
    },
    [selectNode]
  );

  const handleNodeDoubleClick: NodeMouseHandler = useCallback(
    (event, node) => {
      event.preventDefault();
      event.stopPropagation();
      
      console.log('✅ [InfiniteCanvas] handleNodeDoubleClick 被调用', { nodeId: node.id });
      
      // 清除单击定时器
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      
      // 设置双击标志
      isDoubleClickRef.current = true;
      lastClickNodeIdRef.current = node.id;

      // 双击：选中节点并打开详情面板
      console.log('✅ [InfiniteCanvas] 执行双击：选中并打开详情面板', { nodeId: node.id });
      selectNode(node.id);
      openNodeDetail(node.id);

      // 延迟重置标志
      setTimeout(() => {
        isDoubleClickRef.current = false;
        lastClickNodeIdRef.current = null;
      }, 300);
    },
    [selectNode, openNodeDetail]
  );

  const handlePaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      // 将屏幕坐标转换为 React Flow 坐标
      const flowPosition = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        flowX: flowPosition.x,
        flowY: flowPosition.y,
      });
    },
    [screenToFlowPosition]
  );

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // 处理画布点击事件（使用 useCallback 避免每次渲染创建新函数）
  const handlePaneClick = useCallback(
    (e: React.MouseEvent) => {
      // 如果点击的是底部区域（CommandBar 位置），不阻止事件
      const clickY = e.clientY;
      const viewportHeight = window.innerHeight;
      // 如果点击在底部 200px 内，可能是点击 CommandBar，不处理
      if (clickY > viewportHeight - 200) {
        // 不阻止事件，让 CommandBar 处理
        return;
      }
      // 点击画布背景时：清除选择并关闭详情面板
      selectNode(null);
      closeNodeDetail();
      // 点击画布时关闭上下文菜单
      handleCloseContextMenu();
    },
    [selectNode, closeNodeDetail, handleCloseContextMenu]
  );


  // 使用 useMemo 确保 nodeTypes 和 edgeTypes 不会在每次渲染时重新创建
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);
  const memoizedEdgeTypes = useMemo(() => edgeTypes, []);

  // 处理键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果焦点在输入框或文本框中，不处理快捷键
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement instanceof HTMLElement && activeElement.isContentEditable))
      ) {
        return;
      }

      // Cmd/Ctrl + K: 打开命令面板（未来实现）
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // TODO: 实现命令面板
        return;
      }

      // Cmd/Ctrl + N: 创建新节点
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        // TODO: 实现快速创建节点
        return;
      }

      // Tab 键：添加子节点（使用选中节点作为父节点）
      if (e.key === 'Tab' && !e.shiftKey && !isDetailPanelOpen) {
        e.preventDefault();
        e.stopPropagation(); // 防止事件冒泡，避免重复触发
        
        // 使用最新的状态，避免状态更新延迟问题（getState 在 store 未就绪时可能不可用）
        const currentState = typeof useCanvasStore?.getState === 'function' ? useCanvasStore.getState() : null;
        if (!currentState) return;
        const currentSelectedNodeId = currentState.selectedNodeId;
        const currentNodes = currentState.nodes;
        
        console.log('✅ [InfiniteCanvas] Tab 键被按下', {
          selectedNodeId: currentSelectedNodeId,
          nodesCount: currentNodes.length,
          isDetailPanelOpen,
        });
        
        if (currentSelectedNodeId) {
          // 如果有选中节点，创建子节点
          console.log('✅ [InfiniteCanvas] 调用 addChildNode');
          currentState.addChildNode();
        } else {
          // 如果没有选中节点，创建新的根节点
          console.log('✅ [InfiniteCanvas] 调用 addBlankNode（新根节点）');
          // 计算新节点的位置（放在现有节点的右侧）
          const maxX = currentNodes.length > 0 
            ? Math.max(...currentNodes.map(n => n.position.x)) 
            : 0;
          const newX = maxX + 400;
          const newY = currentNodes.length > 0 
            ? currentNodes[0].position.y 
            : 250;
          currentState.addBlankNode({ x: newX, y: newY });
        }
        return;
      }

      // Shift + Tab: 反向切换节点（保留原有功能）
      if (e.key === 'Tab' && selectedNodeId && !isDetailPanelOpen && e.shiftKey) {
        e.preventDefault();
        // 边界检查：确保有节点可以切换
        if (nodes.length === 0) return;
        
        const currentIndex = nodes.findIndex(n => n.id === selectedNodeId);
        // 如果当前节点不存在，直接返回
        if (currentIndex === -1) return;
        
        const prevIndex = currentIndex === 0 ? nodes.length - 1 : currentIndex - 1;
        if (nodes[prevIndex]) {
          selectNode(nodes[prevIndex].id);
          openNodeDetail(nodes[prevIndex].id);
        }
        return;
      }

      // Enter 键：添加同级节点（与选中节点同级）
      if (e.key === 'Enter' && selectedNodeId && !isDetailPanelOpen && !e.shiftKey) {
        e.preventDefault();
        addSiblingNode();
        return;
      }

      // Delete 或 Backspace 键删除选中的节点
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId && !isDetailPanelOpen) {
        e.preventDefault();
        deleteNode(selectedNodeId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // 清理定时器和标志
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      isDoubleClickRef.current = false;
      lastClickNodeIdRef.current = null;
    };
  }, [selectedNodeId, isDetailPanelOpen, deleteNode, nodes, selectNode, openNodeDetail, addChildNode, addSiblingNode, addBlankNode]);

  // 创建模式空状态：主行动引导 + 打开对话 CTA（P2 设计方案）
  const EmptyState = () => (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
      <div
        className="text-center max-w-md px-8 py-10 rounded-2xl pointer-events-auto bg-zinc-900/80 border border-zinc-800 shadow-xl"
        role="region"
        aria-label="开始创建"
      >
        <div className="flex justify-center mb-4">
          <MessageCircle className="w-12 h-12 text-cyan-500/70" aria-hidden />
        </div>
        <p className="text-xl font-medium text-zinc-200">{EMPTY_CANVAS_PRIMARY}</p>
        <p className="text-sm text-zinc-500 mt-2">{EMPTY_CANVAS_SECONDARY}</p>
        <button
          type="button"
          onClick={() => setConversationPanelOpen(true)}
          className="mt-6 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-medium text-sm transition-colors shadow-lg hover:shadow-cyan-500/25"
          aria-label="打开 AI 对话"
        >
          打开 AI 对话
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-full" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        nodeTypes={memoizedNodeTypes}
        edgeTypes={memoizedEdgeTypes}
        fitView
        className="react-flow-dark"
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={false}
        selectNodesOnDrag={false}
        onPaneClick={handlePaneClick}
        onPaneContextMenu={handlePaneContextMenu}
        style={{ width: '100%', height: '100%' }}
        deleteKeyCode={null}
        multiSelectionKeyCode={null}
      >
        <Background color="#3b82f6" gap={20} />
        <Controls className="react-flow__controls-dark" />
        <MiniMap className="react-flow__minimap-dark" />
      </ReactFlow>
      {nodes.length === 0 && <EmptyState />}
      {nodes.length > 0 && !selectedNodeId && (
        <div className="fixed right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none" style={{ zIndex: 2 }}>
          {NO_NODE_SELECTED_MESSAGE}
        </div>
      )}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          flowX={contextMenu.flowX}
          flowY={contextMenu.flowY}
          onClose={handleCloseContextMenu}
        />
      )}
    </div>
  );
}

// AutoLayoutButton 包装器，用于在 ReactFlowProvider 内部访问 useReactFlow
function AutoLayoutButtonWrapper() {
  return <AutoLayoutButton />;
}

// UI 风格选择模态框（z-index 高于 CommandBar 9998，确保盖住 AI 对话框）
function StyleExtractorModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      style={{ zIndex: 10002 }}
      data-no-ai-trigger
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="relative w-full max-w-4xl h-[85vh] bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
        <StyleExtractor onClose={onClose} />
      </div>
    </div>
  );
}

// 刷新按钮组件，位于左下角
function RefreshButton({ isDetailPanelOpen }: { isDetailPanelOpen: boolean }) {
  const handleClearCache = useCallback(() => {
    // 清空缓存：清除 localStorage 和 sessionStorage 并刷新页面
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  }, []);

  if (isDetailPanelOpen) return null;

  return (
    <div 
      className="fixed bottom-4 left-12 pointer-events-auto" 
      style={{ 
        zIndex: 9999,
        position: 'fixed',
        isolation: 'isolate',
        transform: 'translateZ(0)',
      }}
    >
      <button
        onClick={handleClearCache}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all bg-zinc-700 hover:bg-zinc-600 text-white cursor-pointer shadow-lg hover:shadow-xl active:scale-95"
        title="清空缓存并刷新页面"
        aria-label="清空缓存并刷新"
      >
        <RefreshCw className="w-4 h-4" />
        刷新
      </button>
    </div>
  );
}

// 按钮容器组件 - 简化设计，隐藏次要功能
function TopButtons({ 
  isDetailPanelOpen,
  onPresentationModeChange
}: { 
  isDetailPanelOpen: boolean;
  onPresentationModeChange: (isOpen: boolean) => void;
}) {
  const { nodes } = useCanvasStore();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isStyleExtractorOpen, setIsStyleExtractorOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handlePresentationMode = useCallback(() => {
    onPresentationModeChange(true);
  }, [onPresentationModeChange]);

  const handleStyleExtractor = useCallback(() => {
    setIsStyleExtractorOpen(true);
  }, []);

  useEffect(() => {
    const onOpen = () => setIsStyleExtractorOpen(true);
    window.addEventListener(OPEN_STYLE_EXTRACTOR_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_STYLE_EXTRACTOR_EVENT, onOpen);
  }, []);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAdvanced(false);
      }
    };

    if (showAdvanced) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showAdvanced]);

  if (isDetailPanelOpen) return null;

  return (
    <React.Fragment>
      <div 
        ref={menuRef}
        className="fixed top-4 left-4 pointer-events-auto ml-[30rem]" 
        style={{ 
          zIndex: 9999,
          position: 'fixed',
          isolation: 'isolate',
          transform: 'translateZ(0)',
        }}
      >
        <div className="flex items-center gap-2">
          {/* 画布上：UI 风格选择 */}
          <button
            onClick={handleStyleExtractor}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all bg-violet-600 hover:bg-violet-500 text-white shadow-lg hover:shadow-xl active:scale-95"
            title="选择或提取 UI 风格"
            aria-label="UI 风格选择"
            data-testid="open-style-extractor"
          >
            <Palette className="w-4 h-4" />
            UI风格选择
          </button>
          {/* 主要功能：演示模式 */}
          {nodes.length > 0 && (
            <button
              onClick={handlePresentationMode}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg hover:shadow-xl active:scale-95"
              title="进入演示模式"
              aria-label="进入演示模式"
            >
              <Play className="w-4 h-4" />
              演示
            </button>
          )}
          {/* 高级功能：折叠菜单 */}
          <div className="relative">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
              title="更多选项"
              aria-label="更多选项"
              data-testid="canvas-more-options"
            >
              <span className="text-xs">⋯</span>
            </button>
            {showAdvanced && (
              <div className="absolute top-full right-0 mt-2 p-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl min-w-[180px] z-50">
                <AIConfigButton />
                <div className="h-px bg-zinc-800 my-2" />
                <AutoLayoutButtonWrapper />
              </div>
            )}
          </div>
        </div>
      </div>
      {isStyleExtractorOpen && (
        <StyleExtractorModal
          onClose={() => setIsStyleExtractorOpen(false)}
        />
      )}
    </React.Fragment>
  );
}

export function InfiniteCanvas() {
  const {
    nodes,
    selectedNodeId,
    isDetailPanelOpen,
    isAiCreatePending,
    conversationPanelOpen,
    setConversationPanelOpen,
    pendingClarificationContext,
  } = useCanvasStore();
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  const handlePresentationModeChange = useCallback((isOpen: boolean) => {
    setIsPresentationMode(isOpen);
  }, []);

  /** 与 Stitch 一致的首页：无节点或仅默认「首页」节点时展示 */
  const showStitchHome =
    nodes.length === 0 ||
    (nodes.length === 1 && nodes[0].data?.label === '首页' && nodes[0].id === 'page-1');

  // 只有在进入创建模式的画布后（非首页）才显示右侧 AI 对话框；首页不显示
  const showConversationPanel = !isPresentationMode && !showStitchHome && conversationPanelOpen;

  // 文档流分栏：主内容区 flex:1 + AI 面板固定宽，从根上杜绝预览区被遮盖（见 docs/NODE_EDIT_LAYOUT_EXPERT_DISCUSSION.md）
  return (
    <div className="fixed inset-0 w-full h-full bg-zinc-950 overflow-hidden flex flex-col">
      <div className="flex-1 min-h-0 flex flex-row min-w-0">
        {/* 主内容区：占满剩余宽度，节点详情在此区内绝对定位；overflow-hidden 保证不溢出到右侧 AI 区 */}
        <div className="flex-1 min-w-0 min-h-0 relative flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 relative">
            {showStitchHome ? (
              <StitchHomepage />
            ) : (
              <ReactFlowProvider>
                <CanvasContent />
                {!isPresentationMode && (
                  <TopButtons
                    isDetailPanelOpen={isDetailPanelOpen}
                    onPresentationModeChange={handlePresentationModeChange}
                  />
                )}
                {!isPresentationMode && <RefreshButton isDetailPanelOpen={isDetailPanelOpen} />}
              </ReactFlowProvider>
            )}
          </div>
          {isPresentationMode && (
            <PresentationMode
              initialNodeId={selectedNodeId || (nodes.length > 0 ? nodes[0].id : null)}
              onClose={() => setIsPresentationMode(false)}
            />
          )}
          <NodeDetailPanel />
        </div>
        {/* 右侧 AI 对话：占右侧约 1/5，最小 280px，主内容区占剩余宽度 */}
        <aside
          className={clsx(
            'flex flex-col bg-zinc-900 border-l border-zinc-800 transition-[width] duration-200 overflow-hidden shrink-0',
            !showConversationPanel && 'border-0 overflow-hidden'
          )}
          style={{
            width: showConversationPanel ? `${AI_PANEL_WIDTH_RATIO * 100}%` : 0,
            minWidth: showConversationPanel ? CONVERSATION_PANEL_WIDTH_PX : 0,
          }}
          aria-label="AI 对话"
          aria-hidden={!showConversationPanel}
        >
          <ConversationPanel isSubmitting={isAiCreatePending} />
        </aside>
      </div>
    </div>
  );
}

