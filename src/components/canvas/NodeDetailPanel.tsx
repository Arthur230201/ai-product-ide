import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { useCanvasStore } from '@/store/canvas-store';
import { NODE_DETAIL_LEFT_RATIO } from '@/lib/layout-constants';
import { X, ArrowLeft, Download, Wand2, RefreshCw, FileText, Database, Bug, Play, Edit, Eye, FileCheck, Check, ZoomIn, ZoomOut } from 'lucide-react';
import { LivePreview } from './LivePreview'; 
import { SpecViewer } from './SpecViewer';
import { NodeTree } from './NodeTree';
import { MobileDevicePreview } from './MobileDevicePreview';
import { PrdConfigDialog } from './PrdConfigDialog';
import { generateImplementation, generateTestCases, reverseGenerateSpec, addInteractionsToReact, generateAnalysisFromCode } from '@/app/actions/node-operations';
import { useServerAction } from 'zsa-react';
import { generatePageLevelPrd, inferPrdOptions, PrdOptions, extractFunctionTableFromRequirements } from '@/utils/codeToPrdTable';
import { getViewportSize } from '@/lib/viewport-constants';
import { toast } from 'sonner';
import { clsx } from 'clsx';
import { isPlaceholderUiCode } from '@/utils/html-body-extractor';

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
  const { selectedNodeId, nodes, isDetailPanelOpen, closeNodeDetail, updateNodeData, projectMeta, aiConfig, viewportPreset, viewportLocked, conversationPanelOpen, setNodeEditActiveTab } = useCanvasStore();
  const { execute: executeAnalysis, isPending: isGeneratingPrd } = useServerAction(generateAnalysisFromCode);
  const [activeTab, setActiveTab] = useState<'view' | 'spec' | 'impl' | 'test'>('view');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingSpec, setIsEditingSpec] = useState(false);
  // 使用本地状态管理编辑中的文本，避免每次输入都更新 store
  const [localSpecText, setLocalSpecText] = useState<string>('');
  // 使用本地状态管理节点标题，支持直接编辑
  const [title, setTitle] = useState<string>('');
  // PRD 配置对话框状态
  const [showPrdConfig, setShowPrdConfig] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  /** 已锁定时用 viewportLocked，否则用 viewportPreset；提交时优先读 ref */
  const effectiveViewport = viewportLocked ?? viewportPreset;
  /** 与视口按钮同步的 ref，提交时优先读取，避免 store 未刷新的边界情况 */
  const viewportSubmitRef = useRef<'mobile' | 'desktop'>(effectiveViewport);
  useEffect(() => {
    viewportSubmitRef.current = effectiveViewport;
  }, [effectiveViewport]);
  const [previewContainerSize, setPreviewContainerSize] = useState({ w: 0, h: 0 });
  /** UI 预览区缩放，1 = 100%，范围 0.5～2，步进 0.25 */
  const [previewZoom, setPreviewZoom] = useState(1);
  const PREVIEW_ZOOM_MIN = 0.5;
  const PREVIEW_ZOOM_MAX = 2;
  const PREVIEW_ZOOM_STEP = 0.25;

  // 测量预览容器尺寸；切回「UI」Tab 或 AI 面板开关时重新测量，避免预览区被右侧面板遮挡时仍用旧尺寸导致裁切
  useLayoutEffect(() => {
    if (activeTab !== 'view') return;
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
  }, [effectiveViewport, activeTab, conversationPanelOpen]);

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

  // 供 AI 对话框识别当前是「UI/需求/实现/测试」哪一 Tab
  useEffect(() => {
    if (!isDetailPanelOpen || !selectedNodeId) setNodeEditActiveTab(null);
    else setNodeEditActiveTab(activeTab);
  }, [isDetailPanelOpen, selectedNodeId, activeTab, setNodeEditActiveTab]);

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
      const msg = error instanceof Error ? error.message : String(error);
      const desc = msg.includes('Failed to fetch') || msg.includes('fetch')
        ? '网络连接失败，请确保服务器正在运行 (npm run dev) 并检查网络'
        : msg || '未知错误';
      toast.error('生成失败', { description: desc, duration: 8000 });
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

  // 进度步骤：仅前一步有内容才可进入下一步（UI → 需求 → 实现 → 测试用例）
  const viewCode = data.artifacts?.view?.code;
  const hasViewContent = !!viewCode?.trim() && !isPlaceholderUiCode(viewCode);
  const specRequirementsList = Array.isArray(artifacts.spec?.requirements) ? artifacts.spec.requirements : [];
  // 「需求已完成」仅当存在功能表格（含「功能ID」列的表）；无功能表格一律视为未完成
  const hasSpecContent = extractFunctionTableFromRequirements(specRequirementsList) !== null;
  const stepUnlock = {
    view: true,
    spec: hasViewContent,
    impl: hasSpecContent,
    test: !isImplEmpty,
  };
  const stepDone = { view: hasViewContent, spec: hasSpecContent, impl: !isImplEmpty, test: !isTestEmpty };

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

  // 节点列表占左 1/5，UI 预览区占中间剩余宽度（与 AI 面板无关，主内容区已由上层保证）
  const gridCols = `${NODE_DETAIL_LEFT_RATIO * 100}% minmax(0, 1fr)`;
  return (
    <div className="absolute inset-0 bg-zinc-950 z-40 flex flex-col animate-in fade-in duration-200">
      {/* 1. Header（返回画布 + 节点标题 + 关闭） */}
      <div className="h-14 border-b border-zinc-800 flex items-center gap-3 px-4 bg-zinc-900/50 shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            closeNodeDetail();
          }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors shrink-0"
          title="返回画布 (ESC)"
          aria-label="返回画布"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">返回画布</span>
        </button>
        <div className="font-semibold text-zinc-100 flex items-center gap-2 flex-1 min-w-0">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleUpdate}
            onKeyDown={handleTitleKeyDown}
            className="bg-transparent text-zinc-100 font-semibold focus:outline-none focus:bg-zinc-800/50 rounded px-2 w-full max-w-[280px] truncate transition-colors"
            placeholder="未命名节点"
          />
          {isLoading && (
            <span className="text-xs text-blue-400 shrink-0 flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" aria-hidden />
              处理中...
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            closeNodeDetail();
          }}
          title="关闭 (ESC)"
          className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-100 transition-colors shrink-0"
          aria-label="关闭"
        >
          <X size={18} />
        </button>
      </div>

      {/* 2. Main Body：左 1/5 节点列表 | 中间 UI 预览区占剩余宽度 */}
      <div
        className="flex-1 min-h-0 grid overflow-hidden"
        style={{ gridTemplateColumns: gridCols }}
      >
        {/* 左列：节点列表（约 1/5） */}
        <div className="flex flex-col min-h-0 overflow-hidden border-r border-zinc-800 min-w-0">
          <NodeTree />
        </div>

        {/* 中列：进度步骤 + UI 预览区（占除节点列表外的全部中间宽度） */}
        <div className="flex flex-col flex-1 min-h-0 bg-zinc-950 relative overflow-x-auto overflow-y-hidden min-w-0">
          {/* 单行：左侧进度步骤（UI→需求→实现→测试）+ 右侧当前步骤操作，尽量压缩高度 */}
          <div className="shrink-0 h-10 border-b border-zinc-800 flex items-center justify-between gap-3 px-3 bg-zinc-900/40">
            <nav className="flex items-center gap-0 min-w-0" aria-label="节点进度">
              {(() => {
                const steps = [
                  { id: 'view' as const, label: 'UI', icon: Eye },
                  { id: 'spec' as const, label: '需求', icon: FileText },
                  { id: 'impl' as const, label: '实现', icon: Database },
                  { id: 'test' as const, label: '测试', icon: Bug },
                ];
                const lockTips = ['', '请先完成 UI', '请先完成需求', '请先完成实现'];
                return steps.map((step, index) => {
                  const unlocked = stepUnlock[step.id];
                  const done = stepDone[step.id];
                  const current = activeTab === step.id;
                  const prevDone = index > 0 ? stepDone[steps[index - 1].id] : true;
                  return (
                    <React.Fragment key={step.id}>
                      {index > 0 && (
                        <div className={clsx('w-4 h-px shrink-0', prevDone ? 'bg-zinc-500' : 'bg-zinc-700')} aria-hidden />
                      )}
                      <button
                        type="button"
                        disabled={!unlocked && !done}
                        onClick={() => (unlocked || done) && setActiveTab(step.id)}
                        title={!unlocked && !done ? lockTips[index] : undefined}
                        aria-current={current ? 'step' : undefined}
                        className={clsx(
                          'flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors min-w-0',
                          !unlocked && !done && 'cursor-not-allowed opacity-50',
                          current && 'bg-zinc-700 text-white',
                          unlocked && !current && 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                        )}
                      >
                        {done ? (
                          <Check size={10} strokeWidth={2.5} className="text-emerald-400 shrink-0" />
                        ) : (
                          <span className={clsx('flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px]', current ? 'bg-cyan-600 text-white' : 'bg-zinc-700 text-zinc-400')}>
                            {index + 1}
                          </span>
                        )}
                        <span className="truncate">{step.label}</span>
                      </button>
                    </React.Fragment>
                  );
                });
              })()}
            </nav>
            {/* 右侧：当前 Tab 操作（UI=视口+增加交互；需求/实现/测试=对应生成按钮） */}
            <div className="flex items-center gap-2 shrink-0">
              {activeTab === 'view' && (
                <>
                  {/* 预览区放大/缩小 */}
                  <div className="inline-flex items-center gap-0.5 border border-zinc-700 rounded overflow-hidden" role="group" aria-label="预览缩放">
                    <button
                      type="button"
                      onClick={() => setPreviewZoom((z) => Math.max(PREVIEW_ZOOM_MIN, z - PREVIEW_ZOOM_STEP))}
                      disabled={previewZoom <= PREVIEW_ZOOM_MIN}
                      title="缩小"
                      className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                      aria-label="缩小"
                    >
                      <ZoomOut size={14} className="shrink-0" />
                    </button>
                    <span className="px-2 py-1 text-xs text-zinc-400 tabular-nums min-w-[3rem] text-center" title={`当前 ${Math.round(previewZoom * 100)}%`}>
                      {Math.round(previewZoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewZoom((z) => Math.min(PREVIEW_ZOOM_MAX, z + PREVIEW_ZOOM_STEP))}
                      disabled={previewZoom >= PREVIEW_ZOOM_MAX}
                      title="放大"
                      className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                      aria-label="放大"
                    >
                      <ZoomIn size={14} className="shrink-0" />
                    </button>
                  </div>
                  <button
                    onClick={handleAddInteractions}
                    disabled={isLoading}
                    title="增加交互逻辑"
                    className={clsx(
                      'text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors',
                      isLoading ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                    )}
                  >
                    <Wand2 size={10} /> 增加交互
                  </button>
                </>
              )}
              {activeTab === 'spec' && (
                <>
                  <button
                    onClick={handleGeneratePrdFromCode}
                    disabled={isGeneratingPrd || isLoading}
                    title="基于UI代码生成需求文档"
                    className="text-xs flex items-center gap-1 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:cursor-not-allowed px-2 py-1 rounded text-white"
                  >
                    <Wand2 size={10} /> {isGeneratingPrd ? '生成中...' : '生成需求'}
                  </button>
                  <button onClick={handleGenerateFullPrd} title="生成完整 PRD" className="text-xs flex items-center gap-1 bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-white">
                    <FileCheck size={10} /> 完整 PRD
                  </button>
                  <button onClick={() => setIsEditingSpec(!isEditingSpec)} className="text-xs flex items-center gap-1 bg-zinc-700 px-2 py-1 rounded hover:bg-zinc-600 text-zinc-300">
                    {isEditingSpec ? <Eye size={10} /> : <Edit size={10} />} {isEditingSpec ? '预览' : '编辑'}
                  </button>
                  <button onClick={handleSyncSpec} title="从 UI 反推文档" className="text-xs flex items-center gap-1 bg-zinc-700 px-2 py-1 rounded hover:bg-zinc-600 text-zinc-300">
                    <RefreshCw size={10} /> 反推
                  </button>
                </>
              )}
              {activeTab === 'impl' && (
                <button
                  onClick={handleGenerateImpl}
                  disabled={isLoading}
                  className={clsx(
                    'text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors',
                    isLoading ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  )}
                >
                  {isLoading ? <RefreshCw size={10} className="animate-spin" /> : <Database size={10} />}
                  {isLoading ? '生成中...' : '生成技术架构'}
                </button>
              )}
              {activeTab === 'test' && (
                <button
                  onClick={handleGenerateTests}
                  disabled={isLoading}
                  title={isTestEmpty ? '生成测试用例' : '重新生成'}
                  className={clsx(
                    'text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors',
                    isLoading ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500 text-white'
                  )}
                >
                  {isLoading ? <RefreshCw size={10} className="animate-spin" /> : <Bug size={10} />}
                  {isLoading ? '生成中...' : isTestEmpty ? '生成测试' : '重新生成'}
                </button>
              )}
            </div>
          </div>

          {/* UI：预览；以「除节点列表与 AI 外的中间区域」中线为基准定位与缩放，避免左右被裁切 */}
          {activeTab === 'view' && (
            <div
              ref={previewContainerRef}
              className={clsx(
                'flex-1 min-h-[320px] min-w-0 w-full p-8 relative bg-zinc-900/80',
                previewZoom > 1 ? 'overflow-auto' : 'overflow-hidden'
              )}
            >
                {(() => {
                  const presetSize = getViewportSize(effectiveViewport);
                  const { w: cw, h: ch } = previewContainerSize;
                  const measured = cw > 0 && ch > 0;
                  const fitScale = measured ? Math.min(1, cw / presetSize.w, ch / presetSize.h) : 1;
                  const effectiveScale = fitScale * previewZoom;
                  const wrapperW = presetSize.w * effectiveScale;
                  const wrapperH = presetSize.h * effectiveScale;
                  return (
                    <div
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: 32,
                        width: wrapperW,
                        height: wrapperH,
                        maxWidth: '100%',
                        minHeight: measured ? undefined : Math.min(400, presetSize.h),
                        transform: 'translateX(-50%)',
                        boxSizing: 'border-box',
                        transition: 'width 0.2s ease, height 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          width: presetSize.w,
                          height: presetSize.h,
                          marginLeft: -presetSize.w / 2,
                          marginTop: -presetSize.h / 2,
                          transform: `scale(${effectiveScale})`,
                          transformOrigin: 'center center',
                          transition: 'transform 0.2s ease',
                        }}
                      >
                        <MobileDevicePreview
                          imageUrl={data.artifacts.view.previewUrl}
                          zoom={1}
                          width={presetSize.w}
                          height={presetSize.h}
                          viewportPreset={effectiveViewport}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
          )}

          {/* 需求：需求文档（无额外工具栏，全给内容区） */}
          {activeTab === 'spec' && (
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col p-4">
                {isEditingSpec ? (
                  <EditorSection
                    value={specText}
                    onChange={handleSpecChange}
                    onBlur={handleSpecBlur}
                    placeholder="在此输入 PRD 文档，支持 Markdown 表格..."
                  />
                ) : (
                  <div className="flex-1 min-h-0 overflow-y-auto">
                    <SpecViewer markdown={specText || '*暂无内容*'} />
                  </div>
                )}
            </div>
          )}

          {/* 实现：API 与数据规格（无额外工具栏） */}
          {activeTab === 'impl' && (
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
                {isImplEmpty ? (
                  <div className="flex flex-col items-center justify-center gap-4 text-center py-16">
                    <Database className="w-16 h-16 text-zinc-600" />
                    <div>
                      <h3 className="text-zinc-300 font-medium mb-1">实现未生成</h3>
                      <p className="text-zinc-500 text-sm">请先完善需求文档，再点击「生成技术架构」</p>
                    </div>
                    <button
                      onClick={handleGenerateImpl}
                      disabled={isLoading}
                      className={clsx(
                        'px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors',
                        isLoading ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                      )}
                    >
                      {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <Database size={16} />}
                      {isLoading ? '生成中...' : '生成技术架构'}
                    </button>
                  </div>
                ) : (
                  <>
                    {artifacts.impl?.apiEndpoints && artifacts.impl.apiEndpoints.length > 0 && (
                      <section>
                        <h4 className="text-zinc-300 font-medium mb-2">API 接口</h4>
                        <pre className="text-xs text-zinc-400 bg-zinc-900 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap font-mono">
                          {JSON.stringify(artifacts.impl.apiEndpoints, null, 2)}
                        </pre>
                      </section>
                    )}
                    {artifacts.impl?.dbSchema && artifacts.impl.dbSchema.trim() && !['-- 将在后续阶段生成', '-- PLACEHOLDER'].includes(artifacts.impl.dbSchema.trim()) && (
                      <section>
                        <h4 className="text-zinc-300 font-medium mb-2">数据库 / 规格</h4>
                        <pre className="text-xs text-zinc-400 bg-zinc-900 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap font-mono">
                          {artifacts.impl.dbSchema}
                        </pre>
                      </section>
                    )}
                  </>
                )}
            </div>
          )}

          {/* 测试：测试用例（无额外工具栏） */}
          {activeTab === 'test' && (
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
                {isTestEmpty ? (
                  <div className="flex flex-col items-center justify-center gap-4 text-center py-16">
                    <Bug className="w-16 h-16 text-zinc-600" />
                    <div>
                      <h3 className="text-zinc-300 font-medium mb-1">测试用例未生成</h3>
                      <p className="text-zinc-500 text-sm">点击顶部「生成测试」基于需求文档生成测试用例</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex flex-col">
                    <h4 className="text-zinc-300 font-medium mb-4 flex items-center gap-2">
                      <Bug size={16} /> 测试用例列表
                    </h4>
                    <div className="prose prose-invert prose-sm max-w-none">
                      {Array.isArray(data.artifacts.test?.cases) && data.artifacts.test.cases.length > 0 ? (
                        (() => {
                          const cases = data.artifacts.test!.cases;
                          const isTable = cases.length === 1 && cases[0].trim().includes('|');
                          const markdown = isTable
                            ? cases[0]
                            : '| 序号 | 测试场景 / 预期结果 |\n| --- | --- |\n' +
                              cases
                                .map((c, i) => `| ${i + 1} | ${String(c).replace(/\|/g, '｜').replace(/\n/g, ' ')} |`)
                                .join('\n');
                          return <SpecViewer markdown={markdown} />;
                        })()
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
