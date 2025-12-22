'use client';

import 'reactflow/dist/style.css';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
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
import { NodeDetailPanel } from './NodeDetailPanel';
import { PresentationMode } from './PresentationMode';
import { ContextMenu } from './ContextMenu';
import { toast } from 'sonner';
import { Sparkles, FileText, Image as ImageIcon, Wand2 } from 'lucide-react';
import type { FractalNode as FractalNodeType } from '@/types/fractal';

// 注册自定义节点类型（必须在组件外部定义，避免每次渲染重新创建）
const nodeTypes: NodeTypes = {
  page: FractalNode,
  service: FractalNode,
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
      // 单击：只选择节点（用于连接/移动），不打开面板
      selectNode(node.id);
    },
    [selectNode]
  );

  const handleNodeDoubleClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      // 双击：选择节点 + 打开详情面板（不再聚焦和调整画布）
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
    const { addChildNode, addSiblingNode } = useCanvasStore.getState();
    
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

      // Tab 键：添加子节点（使用选中节点作为父节点）
      if (e.key === 'Tab' && selectedNodeId && !isDetailPanelOpen) {
        e.preventDefault();
        addChildNode();
      }

      // Enter 键：添加同级节点（与选中节点同级）
      if (e.key === 'Enter' && selectedNodeId && !isDetailPanelOpen && !e.shiftKey) {
        e.preventDefault();
        addSiblingNode();
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
  }, [selectedNodeId, isDetailPanelOpen, deleteNode]);

  // 空状态组件
  const EmptyState = () => (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
      <div className="text-center max-w-md px-8 animate-fade-in">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <Sparkles className="w-16 h-16 text-purple-500/50 animate-pulse" />
            <Wand2 className="w-8 h-8 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-zinc-100 mb-2">开始你的产品设计之旅</h2>
        <p className="text-zinc-400 mb-6 leading-relaxed">
          在下方输入你的想法，或上传图片/文档，AI 将为你生成完整的产品原型
        </p>
        <div className="flex flex-col gap-3 items-center mb-6">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <FileText className="w-4 h-4" />
            <span>支持上传 PRD 文档、设计稿</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <ImageIcon className="w-4 h-4" />
            <span>支持截图、Figma 导出图片</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 text-xs text-zinc-600 border-t border-zinc-800 pt-4">
          <div className="flex items-center justify-center gap-4">
            <span>💡 <strong>提示：</strong></span>
            <span>双击节点查看详情</span>
            <span>•</span>
            <span>拖拽节点移动位置</span>
            <span>•</span>
            <span>右键空白处添加节点</span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <span>⌨️ <strong>快捷键：</strong></span>
            <span>ESC 关闭面板</span>
            <span>•</span>
            <span>Delete 删除节点</span>
            <span>•</span>
            <span>Enter 提交</span>
          </div>
        </div>
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

// 按钮容器组件，需要在 ReactFlowProvider 内部
function TopButtons({ isDetailPanelOpen }: { isDetailPanelOpen: boolean }) {
  const { nodes, selectedNodeId } = useCanvasStore();
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isStyleExtractorOpen, setIsStyleExtractorOpen] = useState(false);

  const handlePresentationMode = useCallback(() => {
    setIsPresentationMode(true);
  }, []);

  const handleStyleExtractor = useCallback(() => {
    setIsStyleExtractorOpen(true);
  }, []);

  if (isDetailPanelOpen) return null;

  return (
    <>
      <div 
        className="fixed top-4 right-4 pointer-events-auto" 
        style={{ 
          zIndex: 9999,
          maxWidth: 'calc(50vw - 2rem)',
          position: 'fixed',
          isolation: 'isolate',
          transform: 'translateZ(0)',
        }}
      >
        <div className="p-2 flex gap-2 flex-wrap">
          <AutoLayoutButtonWrapper />
          <button
            onClick={handleStyleExtractor}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all bg-cyan-600 hover:bg-cyan-700 text-white cursor-pointer shadow-lg hover:shadow-xl active:scale-95"
            title="提取 UI 风格，应用到后续生成的界面"
            aria-label="UI 风格提取"
          >
            🎨 风格提取
          </button>
          <button
            onClick={handlePresentationMode}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all bg-purple-600 hover:bg-purple-700 text-white cursor-pointer shadow-lg hover:shadow-xl active:scale-95"
            title={nodes.length > 0 ? "进入演示模式，全屏展示节点" : "进入演示模式（当前无节点）"}
            aria-label="进入演示模式"
          >
            🎥 演示
          </button>
        </div>
      </div>
      {isPresentationMode && (
        <PresentationMode
          initialNodeId={selectedNodeId || (nodes.length > 0 ? nodes[0].id : null)}
          onClose={() => setIsPresentationMode(false)}
        />
      )}
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

  const handlePresentationMode = useCallback(() => {
    // 总是允许进入演示模式，即使没有节点（会显示空状态）
    // 优先使用选中的节点，否则使用第一个节点
    setIsPresentationMode(true);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full bg-zinc-950 overflow-hidden">
      <ReactFlowProvider>
        <CanvasContent />
        {/* TopButtons 必须在 ReactFlowProvider 内部，因为 AutoLayoutButton 使用了 useReactFlow */}
        <TopButtons isDetailPanelOpen={isDetailPanelOpen} />
        {/* 刷新按钮位于左下角 */}
        <RefreshButton isDetailPanelOpen={isDetailPanelOpen} />
      </ReactFlowProvider>
      {/* CommandBar 只在非编辑模式显示（编辑模式下在 NodeDetailPanel 中间栏显示） */}
      {!isDetailPanelOpen && (
        <div 
          className="fixed pointer-events-none"
          style={{ 
            position: 'fixed',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(95vw, 48rem)',
            maxWidth: '48rem',
            maxHeight: 'calc(100vh - 2rem)',
            display: 'flex',
            alignItems: 'flex-end',
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

