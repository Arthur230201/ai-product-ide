'use client';

import 'reactflow/dist/style.css';

import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  EdgeTypes,
  Panel,
  NodeMouseHandler,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import { useCanvasStore } from '@/store/canvas-store';
import { FractalNode } from './FractalNode';
import { SmartEdge } from './SmartEdge';
import { CommandBar } from './CommandBar';
import { ProjectToolbar } from './ProjectToolbar';
import { RefreshCw } from 'lucide-react';
import { AutoLayoutButton } from './AutoLayoutButton';
import { StyleExtractor } from './StyleExtractor';
import { AIConfigButton } from './AIConfigButton';
import { NodeDetailPanel } from './NodeDetailPanel';
import { PresentationMode } from './PresentationMode';
import { ContextMenu } from './ContextMenu';
import { toast } from 'sonner';
import { Play } from 'lucide-react';
import type { FractalNode as FractalNodeType } from '@/types/fractal';

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
  } = useCanvasStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; flowX: number; flowY: number } | null>(null);

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

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      // 统一交互：单击直接打开节点详情面板
      selectNode(node.id);
      openNodeDetail(node.id);
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

      // Tab 键：在节点间切换（改进的快捷键）
      if (e.key === 'Tab' && selectedNodeId && !isDetailPanelOpen && !e.shiftKey) {
        e.preventDefault();
        // 边界检查：确保有节点可以切换
        if (nodes.length === 0) return;
        
        const currentIndex = nodes.findIndex(n => n.id === selectedNodeId);
        // 如果当前节点不存在，直接返回
        if (currentIndex === -1) return;
        
        const nextIndex = (currentIndex + 1) % nodes.length;
        if (nodes[nextIndex]) {
          selectNode(nodes[nextIndex].id);
          openNodeDetail(nodes[nextIndex].id);
        }
        return;
      }

      // Shift + Tab: 反向切换节点
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

      // Delete 或 Backspace 键删除选中的节点
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId && !isDetailPanelOpen) {
        e.preventDefault();
        deleteNode(selectedNodeId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNodeId, isDetailPanelOpen, deleteNode, nodes, selectNode, openNodeDetail]);

  // 空状态组件 - 极简设计
  const EmptyState = () => (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
      <div className="text-center max-w-lg px-8">
        <p className="text-lg text-zinc-400">
          描述你的产品想法，或上传设计稿
        </p>
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
        nodeTypes={memoizedNodeTypes}
        edgeTypes={memoizedEdgeTypes}
        fitView
        className="react-flow-dark"
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
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

// 风格提取器模态框
function StyleExtractorModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
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
    <>
      <div 
        ref={menuRef}
        className="fixed top-4 right-4 pointer-events-auto" 
        style={{ 
          zIndex: 9999,
          position: 'fixed',
          isolation: 'isolate',
          transform: 'translateZ(0)',
        }}
      >
        <div className="flex items-center gap-2">
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
            >
              <span className="text-xs">⋯</span>
            </button>
            
            {showAdvanced && (
              <div className="absolute top-full right-0 mt-2 p-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl min-w-[180px] z-50">
                <AIConfigButton />
                <div className="h-px bg-zinc-800 my-2" />
                <AutoLayoutButtonWrapper />
                <div className="h-px bg-zinc-800 my-2" />
                <button
                  onClick={() => {
                    handleStyleExtractor();
                    setShowAdvanced(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  title="提取 UI 风格"
                >
                  🎨 风格提取
                </button>
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
    </>
  );
}

export function InfiniteCanvas() {
  const { nodes, selectedNodeId, isDetailPanelOpen } = useCanvasStore();
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  const handlePresentationModeChange = useCallback((isOpen: boolean) => {
    setIsPresentationMode(isOpen);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full bg-zinc-950 overflow-hidden">
      <ReactFlowProvider>
        <CanvasContent />
        {/* TopButtons 必须在 ReactFlowProvider 内部，因为 AutoLayoutButton 使用了 useReactFlow */}
        {/* 演示模式下不显示顶部按钮 */}
        {!isPresentationMode && (
          <TopButtons 
            isDetailPanelOpen={isDetailPanelOpen}
            onPresentationModeChange={handlePresentationModeChange}
          />
        )}
        {/* 刷新按钮位于左下角，演示模式下不显示 */}
        {!isPresentationMode && <RefreshButton isDetailPanelOpen={isDetailPanelOpen} />}
      </ReactFlowProvider>
      {/* 演示模式 */}
      {isPresentationMode && (
        <PresentationMode
          initialNodeId={selectedNodeId || (nodes.length > 0 ? nodes[0].id : null)}
          onClose={() => setIsPresentationMode(false)}
        />
      )}
      {/* CommandBar 只在非编辑模式且非演示模式显示 */}
      {!isDetailPanelOpen && !isPresentationMode && (
        <div 
          className="fixed pointer-events-none"
          style={{ 
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(95vw, 48rem)',
            maxWidth: '48rem',
            maxHeight: 'calc(100vh - 4rem)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9998,
            isolation: 'isolate',
          }}
        >
          <div className="pointer-events-auto w-full" style={{ position: 'relative', zIndex: 9998 }}>
            <CommandBar />
          </div>
        </div>
      )}
      <NodeDetailPanel />
    </div>
  );
}

