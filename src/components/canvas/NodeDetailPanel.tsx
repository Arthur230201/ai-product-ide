import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { useCanvasStore } from '@/store/canvas-store';
import { X, Download, Wand2, RefreshCw, FileText, Database, Bug, Play, ZoomIn, ZoomOut, Edit, Eye, FileCheck, Smartphone, Monitor } from 'lucide-react';
import { LivePreview } from './LivePreview'; 
import { SpecViewer } from './SpecViewer';
import { CommandBar } from './CommandBar';
import { NodeTree } from './NodeTree';
import { MobileDevicePreview } from './MobileDevicePreview';
import { PrdConfigDialog } from './PrdConfigDialog';
import { generateImplementation, generateTestCases, reverseGenerateSpec, addInteractionsToReact, generateAnalysisFromCode } from '@/app/actions/node-operations';
import { useServerAction } from 'zsa-react';
import { generatePageLevelPrd, inferPrdOptions, PrdOptions } from '@/utils/codeToPrdTable';
import { getViewportSize } from '@/lib/viewport-constants';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import { isPlaceholderUiCode } from '@/utils/prdGenerator';

// 简单的编辑器组件
const EditorSection = ({ value, onChange, onBlur, placeholder }: { value: string, onChange: (v: string) => void, onBlur?: () => void, placeholder: string }) => {
  return (
    <textarea
      className="w-full h-full bg-zinc-900 text-zinc-300 font-mono text-sm p-4 resize-none focus:outline-none border border-zinc-800 rounded-md leading-relaxed placeholder:text-zinc-700"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
    />
  );
};

export function NodeDetailPanel() {
  const { selectedNodeId, nodes, isDetailPanelOpen, closeNodeDetail, updateNodeData, projectMeta, aiConfig, viewportPreset, setViewportPreset } = useCanvasStore();
  const { execute: executeAnalysis, isPending: isGeneratingPrd } = useServerAction(generateAnalysisFromCode);
  const [activeTab, setActiveTab] = useState<'spec' | 'impl' | 'test'>('spec');
  const [zoom, setZoom] = useState(0.7); // 默认缩放为70%，适应更窄的预览区域
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingSpec, setIsEditingSpec] = useState(false);
  // 使用本地状态管理编辑中的文本，避免每次输入都更新 store
  const [localSpecText, setLocalSpecText] = useState<string>('');
  // 使用本地状态管理节点标题，支持直接编辑
  const [title, setTitle] = useState<string>('');
  // PRD 配置对话框状态
  const [showPrdConfig, setShowPrdConfig] = useState(false);
  const [docDrawerOpen, setDocDrawerOpen] = useState(false);
  const [docDrawerTab, setDocDrawerTab] = useState<'spec' | 'test'>('spec');
  const previewContainerRef = useRef<HTMLDivElement>(null);
  /** 与视口按钮同步的 ref，提交时优先读取，避免 store 未刷新的边界情况 */
  const viewportSubmitRef = useRef<'mobile' | 'desktop'>(viewportPreset);
  useEffect(() => {
    viewportSubmitRef.current = viewportPreset;
  }, [viewportPreset]);
  const [previewContainerSize, setPreviewContainerSize] = useState({ w: 0, h: 0 });

  // 测量预览容器尺寸，用于计算「适应容器」缩放，保证桌面时 UI 完整呈现
  useLayoutEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setPreviewContainerSize({ w: rect.width, h: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewportPreset, zoom]);

  // 获取选中的节点（使用 useMemo 稳定引用，避免无限循环）
  const selectedNode = useMemo(() => {
    return selectedNodeId 
      ? nodes.find((node) => node.id === selectedNodeId) 
      : null;
  }, [selectedNodeId, nodes]);

  // 从 store 获取 specText，用于初始化和同步（在条件返回之前计算）
  // 使用 useMemo 稳定字符串引用，避免 useEffect 无限循环
  // 使用 JSON.stringify 来比较数组内容，而不是引用
  const requirements = selectedNode?.data?.artifacts?.spec?.requirements;
  const requirementsKey = useMemo(() => {
    if (!requirements) return '';
    return JSON.stringify(requirements);
  }, [requirements]);
  
  const storeSpecText = useMemo(() => {
    if (!requirements) return '';
    return Array.isArray(requirements) 
      ? requirements.join('\n') 
      : (requirements || '');
  }, [requirements]);

  // 当节点改变或 store 数据改变时，同步本地状态（必须在条件返回之前）
  useEffect(() => {
    if (selectedNodeId && storeSpecText !== undefined) {
      setLocalSpecText(storeSpecText);
    }
  }, [selectedNodeId, storeSpecText]);

  // 同步节点标题到本地状态（必须在条件返回之前）
  // 使用 useMemo 稳定标题值，避免无限循环
  const nodeTitleValue = useMemo(() => {
    return selectedNode?.data?.artifacts?.spec?.title || selectedNode?.data?.label || '未命名节点';
  }, [selectedNode?.data?.artifacts?.spec?.title, selectedNode?.data?.label]);
  
  useEffect(() => {
    if (selectedNodeId && selectedNode) {
      setTitle(nodeTitleValue);
    } else {
      setTitle('');
    }
  }, [selectedNodeId, selectedNode, nodeTitleValue]);

  // 处理全局ESC键关闭面板（必须在条件返回之前）
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDetailPanelOpen) {
        // 如果焦点在输入框或文本框中，不关闭面板
        const activeElement = document.activeElement;
        if (activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.closest('[data-command-bar]')
        )) {
          return;
        }
        closeNodeDetail();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isDetailPanelOpen, closeNodeDetail]);

  // 隐藏「数据结构」时若当前在 impl 则切回需求文档
  useEffect(() => {
    if (activeTab === 'impl') setActiveTab('spec');
  }, [activeTab]);

  // 如果面板未打开或没有选中节点，不渲染（必须在所有 hooks 之后）
  if (!isDetailPanelOpen || !selectedNodeId || !selectedNode || !selectedNode.data) return null;

  const { data } = selectedNode;
  
  // 确保 artifacts 存在，提供默认值（使用可选链避免错误）
  const artifacts = data.artifacts || {
    view: { code: '', previewUrl: undefined },
    spec: { title: data.label || '未命名节点', requirements: [] },
    impl: { apiEndpoints: [], dbSchema: '' },
    test: { cases: [] },
  };

  // --- Actions ---

  const handleAddInteractions = async () => {
    setIsLoading(true);
    try {
      const currentCode = data.artifacts.view.code;
      if (!currentCode?.trim()) {
        toast.error('请先生成 UI 代码');
        setIsLoading(false);
        return;
      }
      const nodeList = nodes.map((n) => ({
        id: n.id,
        label: (n.data?.label as string) || (n.data?.artifacts?.spec?.title as string) || '',
      }));
      const result = await addInteractionsToReact(currentCode, nodeList);
      if (!result.ok) {
        toast.error(`增加交互失败: ${result.message}`);
        return;
      }
      updateNodeData(selectedNode.id, {
        artifacts: { ...data.artifacts, view: { ...data.artifacts.view, code: result.data.code } },
      });
      toast.success('已为当前页增加交互逻辑（日期选择、跳转等）');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '未知错误';
      toast.error(`增加交互失败: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncSpec = async () => {
    setIsLoading(true);
    try {
      const result = await reverseGenerateSpec({
        code: data.artifacts.view.code,
        nodeLabel: data.label || selectedNode.data.label,
        projectMeta: projectMeta,
        aiConfig: aiConfig,
      });
      updateNodeData(selectedNode.id, {
        artifacts: { ...data.artifacts, spec: { title: result.title, requirements: result.requirements } }
      });
      toast.success('文档已反向同步');
    } catch (e) {
      toast.error('同步失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 手动生成 PRD（基于UI代码分析）
  const handleGeneratePrdFromCode = async () => {
    const code = data.artifacts.view.code;
    if (!code || code.trim().length === 0) {
      toast.error('请先生成 UI 代码');
      return;
    }

    try {
      setIsLoading(true);
      
      // 获取现有的需求文档
      const existingRequirements: unknown = data.artifacts.spec?.requirements;
      let existingRequirementsArray: string[] = [];
      if (existingRequirements) {
        if (Array.isArray(existingRequirements)) {
          existingRequirementsArray = existingRequirements.filter((item): item is string => typeof item === 'string');
        } else if (typeof existingRequirements === 'string') {
          existingRequirementsArray = existingRequirements.split('\n').filter((l: string) => l.trim());
        }
      }
      
      // 获取页面标题
      const pageTitle = data.artifacts.spec?.title || selectedNode.data.label || undefined;
      
      // 调用分析函数生成PRD
      const analysisResult = await executeAnalysis({
        codeContext: code,
        pageTitle: pageTitle,
        existingRequirements: existingRequirementsArray.length > 0 ? existingRequirementsArray : undefined,
        aiConfig: aiConfig,
      });

      // 处理返回格式
      let analysisData: { markdown?: string } | null = null;
      if (Array.isArray(analysisResult)) {
        analysisData = analysisResult[0] || null;
      } else if (analysisResult && typeof analysisResult === 'object') {
        analysisData = analysisResult.data || analysisResult;
      }

      if (analysisData?.markdown) {
        const prdMarkdown = analysisData.markdown;
        const requirementsArray = prdMarkdown
          .split('\n')
          .filter((line: string) => line.trim() !== '');

        // 更新 PRD 到节点（只更新spec，不传递view，确保UI不会被覆盖）
        // 从store获取最新节点数据，确保使用最新的view
        const latestNode = nodes.find(n => n.id === selectedNode.id);
        if (latestNode) {
          updateNodeData(selectedNode.id, {
            artifacts: {
              // 只更新spec，不传递view，让store保留原有的view
              spec: {
                title: latestNode.data.artifacts?.spec?.title || latestNode.data.label || '未命名节点',
                requirements: requirementsArray,
              },
            },
          });
          
          // 验证更新后UI代码是否仍然存在
          setTimeout(() => {
            const updatedNode = nodes.find(n => n.id === selectedNode.id);
            if (updatedNode) {
              const hasValidView = updatedNode.data.artifacts?.view?.code && 
                                  updatedNode.data.artifacts.view.code.length > 0 && 
                                  updatedNode.data.artifacts.view.code !== '// PLACEHOLDER';
              if (!hasValidView && code && code.length > 0) {
                console.error('❌ [NodeDetailPanel] PRD更新后UI代码丢失，尝试恢复');
                // 如果UI代码丢失，尝试恢复
                updateNodeData(selectedNode.id, {
                  artifacts: {
                    view: {
                      code: code,
                      previewUrl: latestNode.data.artifacts?.view?.previewUrl,
                    },
                  },
                });
              }
            }
          }, 100);
        }

        toast.success('PRD 文档已生成');
      } else {
        toast.error('PRD 生成失败：未返回有效数据');
      }
    } catch (error) {
      console.error('Generate PRD error:', error);
      toast.error(`生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 生成完整页面级 PRD（使用配置对话框）
  const handleGenerateFullPrd = () => {
    const code = data.artifacts.view.code;
    if (!code || code.trim().length === 0) {
      toast.error('请先生成 UI 代码');
      return;
    }
    
    // 获取 AI 推断的默认值
    const aiInferred = inferPrdOptions(code, data.artifacts.spec?.title);
    
    // 获取已保存的配置
    const savedConfig = data.artifacts.spec?.prdConfig as PrdOptions | undefined;
    
    // 显示配置对话框
    setShowPrdConfig(true);
  };

  // 确认生成 PRD
  const handleConfirmPrdGeneration = (options: PrdOptions) => {
    try {
      const code = data.artifacts.view.code;
      const fileName = `${data.label || 'Component'}.tsx`;
      const componentName = data.label;
      
      // 获取已有的需求文档，用于提取功能表格
      const existingRequirements = data.artifacts.spec?.requirements;
      
      // 生成完整 PRD，传入已有需求文档以便提取功能表格
      const fullPrd = generatePageLevelPrd(
        code, 
        fileName, 
        componentName, 
        options,
        existingRequirements // 传入已有需求文档
      );
      
      // 保存 PRD 和配置到节点数据
      // 将完整 PRD 保存为数组的单个元素（保持 Markdown 格式完整）
      updateNodeData(selectedNode.id, {
        artifacts: {
          ...data.artifacts,
          spec: {
            ...data.artifacts.spec,
            requirements: [fullPrd], // 将完整 PRD 保存为 requirements 数组的单个元素
            prdConfig: options, // 保存用户配置，下次自动填充
          }
        }
      });
      
      setShowPrdConfig(false);
      toast.success('完整 PRD 已生成');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '未知错误';
      toast.error(`生成失败: ${errorMessage}`);
    }
  };

  // 检查 impl 是否为空（使用安全的 artifacts 访问）
  const isImplEmpty = !artifacts.impl || 
    ((!artifacts.impl.apiEndpoints || artifacts.impl.apiEndpoints.length === 0) &&
     (!artifacts.impl.dbSchema || 
      artifacts.impl.dbSchema.trim() === '' || 
      artifacts.impl.dbSchema === '-- 将在后续阶段生成' || 
      artifacts.impl.dbSchema === '-- PLACEHOLDER'));

  // 检查 test 是否为空（使用安全的 artifacts 访问）
  const isTestEmpty = !artifacts.test || 
    (!artifacts.test.cases || artifacts.test.cases.length === 0);

  // 生成技术架构
  const handleGenerateImpl = async () => {
    setIsLoading(true);
    try {
      const requirements = Array.isArray(data.artifacts.spec.requirements) 
        ? data.artifacts.spec.requirements 
        : [];
      
      if (requirements.length === 0) {
        toast.error('请先完善需求文档');
        return;
      }

      const result = await generateImplementation({
        title: data.artifacts.spec.title || selectedNode.data.label,
        requirements: requirements,
      });

      updateNodeData(selectedNode.id, {
        artifacts: { 
          ...data.artifacts, 
          impl: {
            apiEndpoints: result.apiEndpoints || [],
            dbSchema: result.dbSchema || '-- 将在后续阶段生成',
          }
        }
      });
      toast.success('技术架构生成完成');
    } catch (e) {
      console.error('Generate implementation error:', e);
      toast.error('生成失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 生成测试用例
  const handleGenerateTests = async () => {
    if (!selectedNode || !selectedNodeId) {
      toast.error('请先选择一个节点');
      return;
    }

    setIsLoading(true);
    try {
      const requirements = Array.isArray(data.artifacts.spec.requirements) 
        ? data.artifacts.spec.requirements 
        : [];
      
      if (requirements.length === 0) {
        toast.error('请先完善需求文档');
        setIsLoading(false);
        return;
      }

      const result = await generateTestCases({
        title: data.artifacts.spec.title || selectedNode.data.label,
        requirements: requirements,
      });
      if (!result.ok) {
        toast.error(result.message ?? '测试用例生成失败');
        return;
      }
      const cases = result.data.cases || [];
      updateNodeData(selectedNode.id, {
        artifacts: { 
          ...data.artifacts, 
          test: { cases }
        }
      });
      toast.success(`测试用例生成完成，共生成 ${cases.length} 个测试用例`);
    } catch (e) {
      console.error('Generate test cases error:', e);
      const errorMessage = e instanceof Error ? e.message : '生成失败，请稍后重试';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 数据变更处理 (支持手动编辑) - 使用本地状态，避免循环更新
  const handleSpecChange = (text: string) => {
    // 只更新本地状态，不立即更新 store
    setLocalSpecText(text);
  };

  // 当失去焦点或切换模式时，保存到 store
  const handleSpecBlur = () => {
    if (!selectedNode || !selectedNodeId) return;
    
    // 简单地把文本存回数组 (按换行符分割，或者直接改存 Store 结构为 string 更好，这里做兼容处理)
    const reqs = localSpecText.split('\n').filter(line => line.trim() !== '');
    // 只有当值真正改变时才更新 store
    const currentReqs = Array.isArray(selectedNode.data.artifacts.spec.requirements) 
      ? selectedNode.data.artifacts.spec.requirements 
      : (selectedNode.data.artifacts.spec.requirements ? [selectedNode.data.artifacts.spec.requirements] : []);
    
    // 比较数组内容是否相同
    const isChanged = JSON.stringify(reqs) !== JSON.stringify(currentReqs);
    if (isChanged) {
      updateNodeData(selectedNodeId, {
        artifacts: { ...selectedNode.data.artifacts, spec: { ...selectedNode.data.artifacts.spec, requirements: reqs } }
      });
    }
  };

  // 使用本地状态作为显示值
  const specText = localSpecText;

  // 处理标题更新
  const handleTitleUpdate = () => {
    if (!selectedNode || !selectedNodeId) return;
    
    const newTitle = title.trim();
    if (!newTitle) {
      // 如果标题为空，恢复原值
      const originalTitle = data.artifacts?.spec?.title || data.label || '未命名节点';
      setTitle(originalTitle);
      return;
    }

    // 同时更新 label 和 artifacts.spec.title 以确保一致性
    updateNodeData(selectedNodeId, {
      label: newTitle,
      artifacts: {
        ...data.artifacts,
        spec: {
          ...data.artifacts.spec,
          title: newTitle,
        },
      },
    });
  };

  // 处理标题输入框的键盘事件
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // 触发 onBlur，从而保存
    } else if (e.key === 'Escape') {
      // 取消编辑，恢复原值
      const originalTitle = selectedNode?.data.artifacts?.spec?.title || selectedNode?.data.label || '未命名节点';
      setTitle(originalTitle);
      e.currentTarget.blur();
    }
  };

  return (
    <div className="fixed inset-0 h-screen w-screen bg-zinc-950 z-40 flex flex-col animate-in fade-in duration-200">
      
      {/* 1. Header (Top Bar) */}
      <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/50 shrink-0">
        <div className="font-semibold text-zinc-100 flex items-center gap-2 flex-1 min-w-0">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleUpdate}
            onKeyDown={handleTitleKeyDown}
            className="bg-transparent text-zinc-100 font-semibold focus:outline-none focus:bg-zinc-800/50 rounded px-2 -ml-2 w-full max-w-[300px] truncate transition-colors"
            placeholder="未命名节点"
          />
          {isLoading && (
            <span className="text-xs text-blue-400 shrink-0 flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
              处理中...
            </span>
          )}
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation(); // Stop bubbling
            closeNodeDetail();
          }} 
          title="关闭详情面板 (ESC)"
          className="p-2 hover:bg-red-500/20 rounded text-zinc-400 hover:text-red-400 z-50 transition-colors"
          style={{ zIndex: 50 }}
          aria-label="关闭详情面板"
        >
          <X size={18} />
        </button>
      </div>

      {/* 2. Main Body (两栏) - 左侧节点树 + 文档入口，右侧全部为 UI 预览 */}
      <div className="flex-1 grid grid-cols-[minmax(200px,18%)_1fr] overflow-hidden h-full">
        {/* LEFT COLUMN: Node Tree + 需求文档/测试用例入口 */}
        <div className="flex flex-col h-full overflow-hidden border-r border-zinc-800">
          <NodeTree />
          <div className="p-2 border-t border-zinc-800 flex flex-col gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => { setActiveTab('spec'); setDocDrawerTab('spec'); setDocDrawerOpen(true); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <FileText size={14} /> 需求文档
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('test'); setDocDrawerTab('test'); setDocDrawerOpen(true); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Bug size={14} /> 测试用例
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: 全区域 UI 预览 + 底部 CommandBar */}
        <div className="flex flex-col bg-black/20 relative overflow-hidden min-w-0">
          <div className="h-10 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/30">
            <span className="text-xs text-zinc-400 font-mono">实时预览</span>
            <div className="flex items-center gap-2">
              {(() => {
                const viewCode = selectedNode?.data?.artifacts?.view?.code;
                const hasGeneratedUi = !!viewCode?.trim() && !isPlaceholderUiCode(viewCode);
                return (
                  <div className="flex rounded-lg border border-zinc-700 overflow-hidden" role="group" aria-label="视口预设">
                    {[
                      { id: 'mobile', label: '移动', icon: Smartphone, title: '移动端 375px' },
                      { id: 'desktop', label: '桌面', icon: Monitor, title: '桌面 1280px' },
                    ].map(({ id, label, icon: Icon, title }) => (
                      <button
                        key={id}
                        type="button"
                        data-testid={id === 'desktop' ? 'viewport-desktop' : 'viewport-mobile'}
                        aria-label={hasGeneratedUi ? `视口已锁定: ${label}` : `视口: ${label}${id === 'desktop' ? ' (PC)' : ''}`}
                        disabled={hasGeneratedUi}
                        onClick={() => {
                          if (hasGeneratedUi) return;
                          const preset = id as 'mobile' | 'desktop';
                          setViewportPreset(preset);
                          viewportSubmitRef.current = preset;
                        }}
                        title={hasGeneratedUi ? '已生成 UI，不可再切换移动端/PC 端' : title}
                        className={clsx(
                          'px-2.5 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors',
                          hasGeneratedUi && 'cursor-not-allowed opacity-70',
                          viewportPreset === id
                            ? 'bg-cyan-600 text-white'
                            : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800'
                        )}
                      >
                        <Icon size={14} />
                        {label}
                      </button>
                    ))}
                  </div>
                );
              })()}
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                title="缩小预览"
                className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-300 transition-colors"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-xs text-zinc-500 w-8 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
                title="放大预览"
                className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-300 transition-colors"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={handleAddInteractions}
                disabled={isLoading}
                title="为当前页增加交互逻辑（日期选择、下拉、按钮跳转等）"
                className={clsx(
                  'ml-2 text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors',
                  isLoading ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-400 text-white'
                )}
              >
                <Wand2 size={10} /> 增加交互
              </button>
            </div>
          </div>

          {/* Preview Canvas - 根据容器尺寸自动缩放，保证移动/桌面时 UI 完整呈现在框内 */}
          <div
            ref={previewContainerRef}
            className="flex-1 min-w-0 w-full overflow-hidden flex justify-center items-start pt-2 pb-2 px-2 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] relative"
          >
            {(() => {
              const presetSize = getViewportSize(viewportPreset);
              const { w: cw, h: ch } = previewContainerSize;
              const fitScale = cw > 0 && ch > 0
                ? Math.min(1, cw / presetSize.w, ch / presetSize.h)
                : 1;
              const totalScale = fitScale * zoom;
              return (
                <div
                  style={{
                    width: presetSize.w,
                    height: presetSize.h,
                    transform: `scale(${totalScale})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <MobileDevicePreview
                    imageUrl={data.artifacts.view.previewUrl}
                    zoom={1}
                    width={presetSize.w}
                    height={presetSize.h}
                    viewportPreset={viewportPreset}
                  />
                </div>
              );
            })()}
          </div>

          {/* CommandBar 固定在预览区底部；传入 viewportSubmitRef 保证提交时使用当前视口 */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[95%] sm:w-[90%] max-w-2xl z-50 pointer-events-none" style={{ maxWidth: 'min(90vw, 42rem)' }}>
            <div className="pointer-events-auto">
              <CommandBar viewportSubmitRef={viewportSubmitRef} />
            </div>
          </div>
        </div>
      </div>

      {/* 需求文档/测试用例抽屉：从右侧滑出，遮盖层需高于底部 CommandBar(z-50) */}
      {docDrawerOpen && (
        <>
          <div
            className="fixed inset-0 top-0 left-0 right-0 bottom-0 bg-black/70 z-[9998] pointer-events-auto"
            style={{ zIndex: 9998 }}
            aria-hidden
            onClick={() => setDocDrawerOpen(false)}
          />
          <div
            className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-zinc-900 border-l border-zinc-800 shadow-xl z-[9999] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200 pointer-events-auto"
            style={{ zIndex: 9999 }}
            role="dialog"
            aria-label={docDrawerTab === 'spec' ? '需求文档' : '测试用例'}
          >
            <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setDocDrawerTab('spec'); setActiveTab('spec'); }}
                  className={clsx(
                    'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                    docDrawerTab === 'spec' ? 'bg-cyan-600 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  )}
                >
                  需求文档
                </button>
                <button
                  type="button"
                  onClick={() => { setDocDrawerTab('test'); setActiveTab('test'); }}
                  className={clsx(
                    'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                    docDrawerTab === 'test' ? 'bg-cyan-600 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  )}
                >
                  测试用例
                </button>
              </div>
              <button
                type="button"
                onClick={() => setDocDrawerOpen(false)}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                aria-label="关闭"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 pb-24">
              {docDrawerTab === 'spec' && (
                <div className="h-full flex flex-col gap-2">
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-2 shrink-0">
                    <span className="text-xs text-zinc-500">支持 Markdown 编辑</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={handleGeneratePrdFromCode}
                        disabled={isGeneratingPrd || isLoading}
                        title="基于UI代码生成需求文档"
                        className="text-xs flex items-center gap-1 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:cursor-not-allowed px-2 py-1 rounded text-white transition-colors"
                      >
                        <Wand2 size={12} /> {isGeneratingPrd ? '生成中...' : '生成需求文档'}
                      </button>
                      <button
                        onClick={handleGenerateFullPrd}
                        title="生成完整的页面级 PRD 文档（包含5个部分）"
                        className="text-xs flex items-center gap-1 bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-white transition-colors"
                      >
                        <FileCheck size={12} /> 生成完整 PRD
                      </button>
                      <button
                        onClick={() => setIsEditingSpec(!isEditingSpec)}
                        className="text-xs flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded hover:bg-zinc-700 text-zinc-300"
                      >
                        {isEditingSpec ? <><Eye size={12} /> 预览</> : <><Edit size={12} /> 编辑</>}
                      </button>
                      <button
                        onClick={handleSyncSpec}
                        title="从 UI 代码反向生成需求文档"
                        className="text-xs flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded hover:bg-zinc-700 transition-colors"
                      >
                        <RefreshCw size={10} /> 反推文档
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
                    {isEditingSpec ? (
                      <EditorSection
                        value={specText}
                        onChange={handleSpecChange}
                        onBlur={handleSpecBlur}
                        placeholder="在此输入 PRD 文档，支持 Markdown 表格..."
                      />
                    ) : (
                      <SpecViewer markdown={specText || '*暂无内容*'} />
                    )}
                  </div>
                </div>
              )}
              {docDrawerTab === 'test' && (
                <div className="h-full flex flex-col overflow-y-auto bg-zinc-900 rounded-lg">
                  {isTestEmpty ? (
                    <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
                      <Bug className="w-16 h-16 text-zinc-600" />
                      <div>
                        <h3 className="text-zinc-300 font-medium mb-1">测试用例未生成</h3>
                        <p className="text-zinc-500 text-sm">点击下方按钮基于需求文档生成测试用例</p>
                      </div>
                      <button
                        onClick={handleGenerateTests}
                        disabled={isLoading}
                        className={clsx(
                          'px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2',
                          isLoading ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white'
                        )}
                      >
                        {isLoading ? <><RefreshCw size={16} className="animate-spin" /> 生成中...</> : <><Bug size={16} /> 🐞 生成测试用例</>}
                      </button>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col p-4">
                      <div className="flex justify-end mb-4">
                        <button
                          onClick={handleGenerateTests}
                          disabled={isLoading}
                          title="重新生成测试用例"
                          className={clsx(
                            'px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2',
                            isLoading ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white'
                          )}
                        >
                          {isLoading ? <><RefreshCw size={14} className="animate-spin" /> 生成中...</> : <><RefreshCw size={14} /> 重新生成</>}
                        </button>
                      </div>
                      <h4 className="text-zinc-300 font-medium mb-2 flex items-center gap-2">
                        <Bug size={16} /> 测试用例列表
                      </h4>
                      <div className="prose prose-invert prose-sm max-w-none">
                        {Array.isArray(data.artifacts.test?.cases) && data.artifacts.test.cases.length > 0 ? (
                          <ul className="list-disc list-inside space-y-2 text-zinc-300">
                            {data.artifacts.test.cases.map((testCase: string, index: number) => (
                              <li key={index} className="text-sm">{testCase}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-zinc-500">暂无测试用例</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* PRD 配置对话框 */}
      {selectedNode && (
        <PrdConfigDialog
          isOpen={showPrdConfig}
          onClose={() => setShowPrdConfig(false)}
          onConfirm={handleConfirmPrdGeneration}
          initialValues={selectedNode.data.artifacts?.spec?.prdConfig as PrdOptions | undefined}
          aiInferred={inferPrdOptions(
            selectedNode.data.artifacts?.view?.code || '',
            selectedNode.data.artifacts?.spec?.title
          )}
        />
      )}
    </div>
  );
}
