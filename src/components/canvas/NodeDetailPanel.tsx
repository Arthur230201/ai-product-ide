import React, { useState, useEffect, useMemo } from 'react';
import { useCanvasStore } from '@/store/canvas-store';
import { X, Maximize2, Minimize2, Download, Wand2, RefreshCw, FileText, Database, Bug, Play, ZoomIn, ZoomOut, Edit, Eye, FileCheck } from 'lucide-react';
import { LivePreview } from './LivePreview'; 
import { SpecViewer } from './SpecViewer';
import { CommandBar } from './CommandBar';
import { NodeTree } from './NodeTree';
import { MobileDevicePreview } from './MobileDevicePreview';
import { PrdConfigDialog } from './PrdConfigDialog';
import { generateImplementation, generateTestCases, reverseGenerateSpec, refineUI, generateAnalysisFromCode } from '@/app/actions/node-operations';
import { useServerAction } from 'zsa-react';
import { generatePageLevelPrd, inferPrdOptions, PrdOptions } from '@/utils/codeToPrdTable';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const { selectedNodeId, nodes, isDetailPanelOpen, closeNodeDetail, updateNodeData, projectMeta, aiConfig } = useCanvasStore();
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
  }, [requirementsKey]);

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
  }, [selectedNodeId, nodeTitleValue]);

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

  // 如果面板未打开或没有选中节点，不渲染（必须在所有 hooks 之后）
  if (!isDetailPanelOpen || !selectedNodeId || !selectedNode) return null;

  const { data } = selectedNode;

  // --- Actions ---

  const handleRefineUI = async () => {
    setIsLoading(true);
    try {
      const currentCode = data.artifacts.view.code;
      const result = await refineUI(currentCode, "Please refine styling and consistency.");
      
      updateNodeData(selectedNode.id, {
        artifacts: { ...data.artifacts, view: { ...data.artifacts.view, code: result.code } }
      });
      
      toast.success('界面优化完成');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '未知错误';
      toast.error(`优化失败: ${errorMessage}`);
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
        aiConfig: aiConfig, // 传递 AI 模型配置
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

  // 检查 impl 是否为空
  const isImplEmpty = !data.artifacts.impl || 
    ((!data.artifacts.impl.apiEndpoints || data.artifacts.impl.apiEndpoints.length === 0) &&
     (!data.artifacts.impl.dbSchema || 
      data.artifacts.impl.dbSchema.trim() === '' || 
      data.artifacts.impl.dbSchema === '-- 将在后续阶段生成' || 
      data.artifacts.impl.dbSchema === '-- PLACEHOLDER'));

  // 检查 test 是否为空
  const isTestEmpty = !data.artifacts.test || 
    (!data.artifacts.test.cases || data.artifacts.test.cases.length === 0);

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

      updateNodeData(selectedNode.id, {
        artifacts: { 
          ...data.artifacts, 
          test: {
            cases: result.cases || [],
          }
        }
      });
      toast.success(`测试用例生成完成，共生成 ${result.cases.length} 个测试用例`);
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

      {/* 2. Main Body (Three-Column Grid Layout) - 优化空间分配：压缩左右两侧，扩大中间文档区域 */}
      <div className="flex-1 grid grid-cols-[minmax(200px,15%)_1fr_minmax(200px,25%)] overflow-hidden h-full">
        
        {/* LEFT COLUMN: Node Tree (15%) */}
        <div className="flex flex-col h-full overflow-hidden">
          <NodeTree />
        </div>

        {/* MIDDLE COLUMN: Editor / Docs (1fr) */}
        <div className="flex flex-col border-r border-zinc-800 relative overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-zinc-800 bg-zinc-900/30">
            {[
              { id: 'spec', label: '📄 需求文档', icon: FileText, isEmpty: false },
              { id: 'impl', label: '⚙️ 数据结构', icon: Database, isEmpty: isImplEmpty },
              { id: 'test', label: '🐞 测试用例', icon: Bug, isEmpty: isTestEmpty },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={clsx(
                  "flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 border-b-2 transition-colors relative",
                  activeTab === tab.id 
                    ? "border-blue-500 text-blue-400 bg-blue-500/5" 
                    : "border-transparent text-zinc-500 hover:text-zinc-300",
                  tab.isEmpty && "opacity-60"
                )}
              >
                <tab.icon size={14} className={clsx(tab.isEmpty && "opacity-50")} />
                {tab.label}
                {tab.isEmpty && (
                  <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-zinc-500 rounded-full" title="未生成" />
                )}
              </button>
            ))}
          </div>

          {/* Editor Content */}
          <div className="flex-1 p-4 pb-40 overflow-y-auto bg-zinc-900 scroll-smooth">
            {activeTab === 'spec' && (
              <div className="h-full flex flex-col gap-2">
                <div className="flex justify-between items-center mb-2 shrink-0">
                   <span className="text-xs text-zinc-500">支持 Markdown 编辑</span>
                   <div className="flex items-center gap-2">
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
                       {isEditingSpec ? (
                         <>
                           <Eye size={12} /> 预览
                         </>
                       ) : (
                         <>
                           <Edit size={12} /> 编辑
                         </>
                       )}
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
                <div className="flex-1 h-full overflow-y-auto">
                  {isEditingSpec ? (
                    <EditorSection 
                      value={specText} 
                      onChange={handleSpecChange}
                      onBlur={handleSpecBlur}
                      placeholder="在此输入 PRD 文档，支持 Markdown 表格..." 
                    />
                  ) : (
                    <SpecViewer 
                      markdown={specText || '*暂无内容*'}
                    />
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'impl' && (
              <div className="h-full flex flex-col overflow-y-auto bg-zinc-900">
                {isImplEmpty ? (
                  <div className="flex flex-col items-center justify-center gap-4 text-center p-8 h-full">
                    <Database className="w-16 h-16 text-zinc-600" />
                    <div>
                      <h3 className="text-zinc-300 font-medium mb-1">技术架构未生成</h3>
                      <p className="text-zinc-500 text-sm">点击下方按钮生成数据库 Schema 和 API 端点</p>
                    </div>
                    <button
                      onClick={handleGenerateImpl}
                      disabled={isLoading}
                      title="基于需求文档生成数据库 Schema 和 API 端点"
                      className={clsx(
                        "px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2",
                        isLoading
                          ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      )}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Database size={16} />
                          ⚙️ 生成技术架构 (Generate Architecture)
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="w-full flex flex-col gap-4 p-4">
                    {/* 重新生成按钮 */}
                    <div className="flex justify-end mb-2">
                      <button
                        onClick={handleGenerateImpl}
                        disabled={isLoading}
                        title="重新生成技术架构"
                        className={clsx(
                          "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                          isLoading
                            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        )}
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            生成中...
                          </>
                        ) : (
                          <>
                            <RefreshCw size={14} />
                            重新生成
                          </>
                        )}
                      </button>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-zinc-300 font-medium mb-2 flex items-center gap-2">
                        <Database size={16} />
                        API 端点
                      </h4>
                      <div className="bg-zinc-800 rounded p-3 font-mono text-xs text-zinc-300">
                        {Array.isArray(data.artifacts.impl?.apiEndpoints) && data.artifacts.impl.apiEndpoints.length > 0 ? (
                          <ul className="list-disc list-inside space-y-1">
                            {data.artifacts.impl.apiEndpoints.map((endpoint: string, index: number) => (
                              <li key={index}>{endpoint}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-zinc-500">暂无 API 端点</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-zinc-300 font-medium mb-2 flex items-center gap-2">
                        <Database size={16} />
                        数据库 Schema
                      </h4>
                      <div className="bg-zinc-800 rounded p-3 font-mono text-xs text-zinc-300 overflow-x-auto">
                        <pre className="whitespace-pre-wrap">
                          {data.artifacts.impl?.dbSchema || '-- 暂无数据库 Schema'}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'test' && (
              <div className="h-full flex flex-col overflow-y-auto bg-zinc-900">
                {isTestEmpty ? (
                  <div className="flex flex-col items-center justify-center gap-4 text-center p-8 h-full">
                    <Bug className="w-16 h-16 text-zinc-600" />
                    <div>
                      <h3 className="text-zinc-300 font-medium mb-1">测试用例未生成</h3>
                      <p className="text-zinc-500 text-sm">点击下方按钮基于需求文档生成测试用例</p>
                    </div>
                    <button
                      onClick={handleGenerateTests}
                      disabled={isLoading}
                      className={clsx(
                        "px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2",
                        isLoading
                          ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                          : "bg-purple-600 hover:bg-purple-700 text-white"
                      )}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Bug size={16} />
                          🐞 生成测试用例 (Generate Tests)
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="w-full flex flex-col p-4">
                    {/* 重新生成按钮 */}
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={handleGenerateTests}
                        disabled={isLoading}
                        title="重新生成测试用例"
                        className={clsx(
                          "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                          isLoading
                            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                            : "bg-purple-600 hover:bg-purple-700 text-white"
                        )}
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            生成中...
                          </>
                        ) : (
                          <>
                            <RefreshCw size={14} />
                            重新生成
                          </>
                        )}
                      </button>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-zinc-300 font-medium mb-2 flex items-center gap-2">
                        <Bug size={16} />
                        测试用例列表
                      </h4>
                    </div>
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

          {/* AI Input Box - Floating at bottom of middle column */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[95%] sm:w-[90%] max-w-2xl z-50 pointer-events-none" style={{ maxWidth: 'min(90vw, 42rem)' }}>
            <div className="pointer-events-auto">
              <CommandBar />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Preview (33.3%) */}
        <div className="flex flex-col bg-black/20 relative overflow-hidden">
          {/* Toolbar */}
          <div className="h-10 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/30">
            <span className="text-xs text-zinc-400 font-mono">Real-time Preview</span>
            <div className="flex items-center gap-2">
               <button 
                 onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} 
                 title="缩小预览 (最小 50%)"
                 className="p-1 hover:bg-zinc-800 rounded text-zinc-400 transition-colors"
               >
                 <ZoomOut size={14}/>
               </button>
               <span className="text-xs text-zinc-500 w-8 text-center" title="当前缩放比例">{Math.round(zoom * 100)}%</span>
               <button 
                 onClick={() => setZoom(Math.min(1.5, zoom + 0.1))} 
                 title="放大预览 (最大 150%)"
                 className="p-1 hover:bg-zinc-800 rounded text-zinc-400 transition-colors"
               >
                 <ZoomIn size={14}/>
               </button>
               <button 
                 onClick={handleRefineUI} 
                 disabled={isLoading}
                 title="使用 AI 优化 UI 样式和一致性"
                 className={clsx(
                   "ml-2 text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors",
                   isLoading
                     ? "bg-indigo-800 text-indigo-300 cursor-not-allowed"
                     : "bg-indigo-600 text-white hover:bg-indigo-500"
                 )}
               >
                  <Wand2 size={10} /> 美化
               </button>
            </div>
          </div>

          {/* Preview Canvas - 紧凑布局 */}
          <div 
            className="flex-1 overflow-hidden flex justify-center items-start pt-2 pb-2 px-2 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] relative"
          >
              <div style={{ 
                width: '375px', 
                height: '812px', 
                maxWidth: '100%', 
                maxHeight: '100%',
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s ease',
              }}>
                <MobileDevicePreview 
                  imageUrl={data.artifacts.view.previewUrl} 
                  zoom={1}
                  width={375}
                  height={812}
                />
              </div>
          </div>
        </div>

      </div>

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
