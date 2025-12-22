'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { useCanvasStore } from '@/store/canvas-store';
import type { FractalNode } from '@/types/fractal';
import { LivePreview } from './LivePreview';
import { SpecViewer } from './SpecViewer';

interface PresentationModeProps {
  initialNodeId: string | null;
  onClose: () => void;
}

export function PresentationMode({ initialNodeId, onClose }: PresentationModeProps) {
  const { nodes, edges } = useCanvasStore();
  
  // 计算初始节点：优先使用 initialNodeId，如果为 null 或无效则使用第一个节点
  const computeInitialNodeId = useMemo((): string | null => {
    if (initialNodeId) {
      // 验证节点是否存在
      const node = nodes.find(n => n.id === initialNodeId);
      if (node) return initialNodeId;
    }
    // 如果没有有效的 initialNodeId，使用第一个节点
    return nodes.length > 0 ? nodes[0].id : null;
  }, [initialNodeId, nodes]);
  
  const [currentSlideNodeId, setCurrentSlideNodeId] = useState<string | null>(
    computeInitialNodeId
  );
  const [zoom, setZoom] = useState(0.8); // 缩放比例，默认0.8（80%）
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const navigationHistoryRef = useRef<string[]>([]); // 导航历史记录

  // 如果 initialNodeId 变化或节点列表变化，更新当前节点
  useEffect(() => {
    const newInitialNodeId = computeInitialNodeId;
    if (newInitialNodeId && newInitialNodeId !== currentSlideNodeId) {
      // 只有当当前没有节点或当前节点不存在时才更新
      if (!currentSlideNodeId || !nodes.find(n => n.id === currentSlideNodeId)) {
        setCurrentSlideNodeId(newInitialNodeId);
      }
    } else if (!newInitialNodeId && currentSlideNodeId) {
      // 如果没有可用节点，清空当前节点
      setCurrentSlideNodeId(null);
    }
  }, [computeInitialNodeId, currentSlideNodeId, nodes]);

  // 查找当前节点
  const currentNode = useMemo(() => {
    if (!currentSlideNodeId) return null;
    return nodes.find((node) => node.id === currentSlideNodeId) || null;
  }, [currentSlideNodeId, nodes]);

  // 查找下一个节点（第一个出边的目标节点）
  const getNextNode = (): string | null => {
    if (!currentSlideNodeId) return null;
    
    const outgoingEdges = edges.filter((edge) => edge.source === currentSlideNodeId);
    if (outgoingEdges.length === 0) return null;
    
    // 返回第一个出边的目标节点
    return outgoingEdges[0].target;
  };

  // 查找上一个节点（第一个入边的源节点）
  const getPrevNode = useCallback((): string | null => {
    if (!currentSlideNodeId) return null;
    
    const incomingEdges = edges.filter((edge) => edge.target === currentSlideNodeId);
    if (incomingEdges.length === 0) return null;
    
    // 返回第一个入边的源节点
    return incomingEdges[0].source;
  }, [currentSlideNodeId, edges]);

  const handleNext = () => {
    const nextId = getNextNode();
    if (nextId) {
      // 将当前节点添加到历史记录
      if (currentSlideNodeId) {
        navigationHistoryRef.current.push(currentSlideNodeId);
      }
      setCurrentSlideNodeId(nextId);
    }
  };

  const handlePrev = () => {
    // 优先从历史记录中恢复
    if (navigationHistoryRef.current.length > 0) {
      const previousNodeId = navigationHistoryRef.current.pop();
      if (previousNodeId) {
        setCurrentSlideNodeId(previousNodeId);
        return;
      }
    }
    // 如果没有历史记录，使用 getPrevNode
    const prevId = getPrevNode();
    if (prevId) {
      setCurrentSlideNodeId(prevId);
    }
  };

  // 模糊匹配节点标题
  const findNodeByTitle = useCallback((targetTitle: string): FractalNode | null => {
    // 精确匹配
    let node = nodes.find(
      (n) => n.data.artifacts.spec.title === targetTitle
    );
    if (node) return node;

    // 模糊匹配（不区分大小写，包含匹配）
    const lowerTarget = targetTitle.toLowerCase().trim();
    node = nodes.find((n) => {
      const nodeTitle = n.data.artifacts.spec.title?.toLowerCase().trim() || '';
      return nodeTitle.includes(lowerTarget) || lowerTarget.includes(nodeTitle);
    });
    if (node) return node;

    // 尝试匹配 label
    node = nodes.find((n) => {
      const nodeLabel = n.data.label?.toLowerCase().trim() || '';
      return nodeLabel.includes(lowerTarget) || lowerTarget.includes(nodeLabel);
    });
    if (node) return node;

    return null;
  }, [nodes]);

  // 处理导航事件
  useEffect(() => {
    const handleNavigation = (event: CustomEvent<{ target: string }>) => {
      const { target } = event.detail;

      if (!target) return;

      // 处理 "BACK" 导航
      if (target.toUpperCase() === 'BACK') {
        // 从历史记录中弹出上一个节点
        if (navigationHistoryRef.current.length > 0) {
          const previousNodeId = navigationHistoryRef.current.pop();
          if (previousNodeId) {
            setCurrentSlideNodeId(previousNodeId);
            return;
          }
        }
        // 如果没有历史记录，尝试使用 getPrevNode
        const prevId = getPrevNode();
        if (prevId) {
          setCurrentSlideNodeId(prevId);
        }
        return;
      }

      // 尝试通过标题找到目标节点
      const targetNode = findNodeByTitle(target);
      if (targetNode) {
        // 将当前节点添加到历史记录
        if (currentSlideNodeId) {
          navigationHistoryRef.current.push(currentSlideNodeId);
        }
        setCurrentSlideNodeId(targetNode.id);
        return;
      }

      // 如果找不到匹配的节点，尝试通过出边跳转（Fallback）
      if (currentSlideNodeId) {
        const outgoingEdges = edges.filter(
          (edge) => edge.source === currentSlideNodeId
        );
        if (outgoingEdges.length > 0) {
          // 将当前节点添加到历史记录
          navigationHistoryRef.current.push(currentSlideNodeId);
          // 跳转到第一个出边的目标节点
          setCurrentSlideNodeId(outgoingEdges[0].target);
        }
      }
    };

    // 监听自定义导航事件
    window.addEventListener(
      'fractal-navigate-event',
      handleNavigation as EventListener
    );

    // 清理事件监听器
    return () => {
      window.removeEventListener(
        'fractal-navigate-event',
        handleNavigation as EventListener
      );
    };
  }, [currentSlideNodeId, nodes, edges, findNodeByTitle, getPrevNode]);

  // 如果没有当前节点，显示空状态
  if (!currentNode) {
    return (
      <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-zinc-100 mb-4">演示模式</h2>
          <p className="text-zinc-400 mb-6">当前没有可显示的节点</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-all"
          >
            退出演示模式
          </button>
        </div>
      </div>
    );
  }

  const { data } = currentNode;
  const { artifacts } = data;
  const nextNodeId = getNextNode();
  const prevNodeId = getPrevNode();

  return (
    <div 
      className="fixed inset-0 bg-zinc-950 flex flex-col"
      style={{ zIndex: 10000 }}
      data-presentation-mode="true"
    >
      {/* 退出按钮 - 右上角 */}
      <div className="absolute top-4 right-4 z-[10001]">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-all shadow-lg hover:shadow-xl active:scale-95"
          title="退出演示模式"
        >
          退出演示模式
        </button>
      </div>

      {/* Main Content - Two Columns (1:2 比例) */}
      <div className="flex-1 grid grid-cols-[1fr_2fr] overflow-hidden h-full">
        {/* Left Column - Mobile Preview (33.3%) - Professional Device Simulator */}
        <div 
          ref={leftPanelRef}
          className="border-r border-gray-200 bg-gray-100 flex flex-col overflow-hidden relative"
          style={{ 
            height: '100%',
            maxHeight: '100%',
            minHeight: 0,
          }}
        >
          {/* 导航栏 - 包含页面名称和缩放控制 */}
          <div className="absolute top-0 left-0 right-0 z-[10001] flex items-center justify-between bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 shadow-sm">
            {/* 页面名称 */}
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                {currentNode?.data?.label || currentNode?.data?.artifacts?.spec?.title || '未命名页面'}
              </h2>
            </div>
            
            {/* 缩放控制按钮 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="缩小"
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="w-4 h-4 text-gray-700" />
              </button>
              <span className="text-sm text-gray-700 font-medium min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="放大"
                disabled={zoom >= 2}
              >
                <ZoomIn className="w-4 h-4 text-gray-700" />
              </button>
              <button
                onClick={() => setZoom(0.8)}
                className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="重置到80%"
              >
                重置
              </button>
            </div>
          </div>

          {/* 预览内容容器 - Studio Background with subtle texture - 不允许滚动 */}
          <div 
            className="flex-1 flex flex-col items-center justify-start overflow-hidden relative"
            style={{ 
              minHeight: 0,
              background: 'radial-gradient(circle, rgba(0,0,0,0.02) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              backgroundColor: '#f3f4f6', // bg-gray-100
              paddingTop: '56px', // 上边距，确保设备框架上沿在导航栏下方（导航栏高度约48px + 8px间距）
              paddingBottom: '80px', // 下边距，为导航按钮留出空间
              paddingLeft: '20px',
              paddingRight: '20px',
            }}
          >
            {/* 设备模拟器容器 - iPhone 标准尺寸 375x812 - 应用缩放 */}
            <div 
              ref={previewContainerRef}
              className="flex items-start justify-center"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                width: '100%',
                height: 'auto',
                marginTop: '8px', // 确保设备框架上沿在导航栏下方
              }}
            >
              {/* iPhone 风格设备框架 - 标准尺寸 375x812 (iPhone X/11/12/13/14/15) */}
              <div 
                className="relative flex-shrink-0"
                style={{
                  width: '375px',
                  height: '812px',
                }}
              >
                {/* 设备边框 - iPhone 风格 */}
                <div 
                  className="relative border-[12px] border-gray-900 rounded-[45px] shadow-2xl overflow-hidden bg-gray-900"
                  style={{
                    width: '100%',
                    height: '100%',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  {/* 内屏包装器 - 防止圆角裁剪，强制移动视口约束 */}
                  <div 
                    className="bg-white w-full h-full rounded-[32px] overflow-hidden relative flex flex-col"
                    style={{
                      margin: '3px', // 12px border - 9px inner margin = 3px visible bezel
                      width: 'calc(100% - 6px)',
                      height: 'calc(100% - 6px)',
                    }}
                  >
                    {/* Status Bar Spacer - 可见的状态栏区域 */}
                    <div className="h-12 w-full bg-white shrink-0 flex items-center justify-center text-[10px] text-gray-400 font-mono">
                      iOS 17
                    </div>
                    
                    {/* Content Area - 修复右侧裁剪问题，添加左右padding防止内容被圆角遮挡 */}
                    <div 
                      className="flex-1 w-full relative overflow-y-auto overflow-x-hidden bg-gray-50"
                      style={{ 
                        minHeight: 0,
                        paddingLeft: '6px', // 左侧padding防止内容被遮挡
                        paddingRight: '6px', // 右侧padding防止内容被遮挡
                        paddingBottom: '20px', // 底部padding，确保内容不被底部按钮遮挡
                      }}
                    >
                      <style>{`
                        /* 隐藏滚动条或使用细滚动条 */
                        div::-webkit-scrollbar {
                          width: 6px;
                        }
                        div::-webkit-scrollbar-track {
                          background: transparent;
                        }
                        div::-webkit-scrollbar-thumb {
                          background-color: #d1d5db;
                          border-radius: 3px;
                        }
                        div::-webkit-scrollbar-thumb:hover {
                          background-color: #9ca3af;
                        }
                        /* 确保所有子元素不超出边界 */
                        * {
                          max-width: 100%;
                          box-sizing: border-box;
                        }
                      `}</style>
                      
                      {/* Force centering and max-width - 确保内容不超出边界且居中 */}
                      <div className="w-full min-h-full flex flex-col" style={{ padding: '0', margin: '0' }}>
                        <div className="flex-1">
                          {artifacts.view.previewUrl ? (
                            <div className="w-full">
                              <img
                                src={artifacts.view.previewUrl}
                                alt="UI Preview"
                                className="w-full h-auto block"
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  height: 'auto',
                                  boxSizing: 'border-box',
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-full h-full">
                              <LivePreview code={artifacts.view.code} zoom={1} isPresentationMode={true} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 导航按钮 - 绝对定位在左侧列的下沿上方一点点 */}
          <div 
            className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-3 z-[10001]" 
            style={{ 
              pointerEvents: 'auto',
              bottom: '8px', // 在页面下沿上方一点点（8px）
            }}
          >
            <button
              onClick={handlePrev}
              disabled={!prevNodeId && navigationHistoryRef.current.length === 0}
              className={`
                flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg
                ${
                  prevNodeId || navigationHistoryRef.current.length > 0
                    ? 'bg-white/95 hover:bg-white text-gray-700 cursor-pointer active:scale-95 backdrop-blur-sm border border-gray-200'
                    : 'bg-gray-50/95 text-gray-400 cursor-not-allowed backdrop-blur-sm border border-gray-200'
                }
              `}
              title={prevNodeId || navigationHistoryRef.current.length > 0 ? "上一页" : "没有上一页"}
            >
              <ChevronLeft className="w-4 h-4" />
              上一页
            </button>
            <button
              onClick={handleNext}
              disabled={!nextNodeId}
              className={`
                flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg
                ${
                  nextNodeId
                    ? 'bg-white/95 hover:bg-white text-gray-700 cursor-pointer active:scale-95 backdrop-blur-sm border border-gray-200'
                    : 'bg-gray-50/95 text-gray-400 cursor-not-allowed backdrop-blur-sm border border-gray-200'
                }
              `}
              title={nextNodeId ? "下一页" : "没有下一页"}
            >
              下一页
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
        </div>

        {/* Right Column - Content Panel (66.6%) - 使用与编辑模式相同的渲染方式 */}
        <div className="overflow-hidden bg-zinc-900 border-l border-gray-200 flex flex-col h-full">
          <div className="flex-1 overflow-y-auto min-h-0 bg-zinc-900 p-6">
            {/* 使用 SpecViewer 组件，与编辑模式一致 */}
            {(() => {
              // 将 requirements 数组转换为 Markdown 字符串
              // 注意：表格行之间必须只用一个换行符，否则会破坏表格格式
              let requirementsMarkdown = '';
              if (Array.isArray(artifacts.spec.requirements)) {
                const lines: string[] = [];
                for (let i = 0; i < artifacts.spec.requirements.length; i++) {
                  const line = artifacts.spec.requirements[i];
                  if (typeof line === 'string') {
                    const trimmed = line.trim();
                    // 判断是否是表格行（以 | 开头，通常也以 | 结尾，或者包含 |---| 这样的分隔符）
                    const isTableRow = trimmed.startsWith('|');
                    const isTableSeparator = trimmed.match(/^\|[\s\-:]+\|$/); // 匹配 |---|---| 这样的分隔符
                    
                    if (i > 0) {
                      const prevLine = artifacts.spec.requirements[i - 1];
                      const prevTrimmed = typeof prevLine === 'string' ? prevLine.trim() : '';
                      const prevIsTableRow = prevTrimmed.startsWith('|');
                      
                      // 如果当前行和上一行都是表格行（包括分隔符），用单换行符
                      if ((isTableRow || isTableSeparator) && prevIsTableRow) {
                        lines.push('\n');
                      } else if (!isTableRow && !prevIsTableRow && trimmed) {
                        // 非表格行之间用双换行符
                        lines.push('\n\n');
                      } else {
                        // 其他情况用单换行符
                        lines.push('\n');
                      }
                    }
                    lines.push(line);
                  }
                }
                requirementsMarkdown = lines.join('');
              } else if (typeof artifacts.spec.requirements === 'string') {
                requirementsMarkdown = artifacts.spec.requirements;
              }
              
              return requirementsMarkdown ? (
                <SpecViewer 
                  markdown={requirementsMarkdown || '*暂无内容*'}
                  variant="presentation"
                />
              ) : (
                <div className="p-8">
                  <div className="text-zinc-500 text-sm font-sans">暂无需求文档</div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

    </div>
  );
}
