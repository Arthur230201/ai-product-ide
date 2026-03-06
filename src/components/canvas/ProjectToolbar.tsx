'use client';

import { useState, useRef, useEffect } from 'react';
import { FilePlus, Save, FolderOpen, PlusSquare, BookOpen, Download, ChevronDown, Globe, FileText, FileCode, ClipboardList, TestTube2, Cpu, BookMarked } from 'lucide-react';
import { useCanvasStore } from '@/store/canvas-store';
import { ProjectBlueprint } from './ProjectBlueprint';
import { toast } from 'sonner';
import { exportToFullPrdHtml, exportToWord, exportTestReport, exportSystemDesignDoc, exportUserManual } from '@/utils/prdGenerator';
import { exportToEnterpriseWord } from '@/utils/wordGenerator';
import { captureNodePreviews } from '@/utils/capture-node-preview';
import { isHtmlCode } from '@/utils/html-body-extractor';

export function ProjectToolbar() {
  const { clearCanvas, exportProject, loadProject, addBlankNode, isDetailPanelOpen, nodes, edges, projectMeta, globalRules } = useCanvasStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isBlueprintOpen, setIsBlueprintOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const handleNewProject = () => {
    // 使用更现代的方式提示用户，而不是原生confirm
    const confirmed = window.confirm('未保存的更改将丢失，确定要创建新项目吗？');
    if (confirmed) {
      clearCanvas();
      toast.success('已创建新项目');
    }
  };

  const handleSaveProject = () => {
    try {
      const projectData = exportProject();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `project-${timestamp}.json`;
      
      const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('项目已保存', {
        description: `已保存为 ${filename}`,
      });
    } catch (error) {
      toast.error('保存项目失败', {
        description: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  const handleOpenProject = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('文件格式错误', {
        description: '请选择 JSON 格式的项目文件',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const projectData = JSON.parse(content);
        
        // 验证数据结构
        if (!projectData || typeof projectData !== 'object') {
          throw new Error('无效的项目文件格式');
        }
        
        if (!Array.isArray(projectData.nodes) || !Array.isArray(projectData.edges)) {
          throw new Error('项目文件必须包含 nodes 和 edges 数组');
        }

        loadProject({
          nodes: projectData.nodes,
          edges: projectData.edges,
        });
        
        toast.success('项目已加载', {
          description: `已加载 ${projectData.nodes.length} 个节点`,
        });
      } catch (error) {
        toast.error('加载项目失败', {
          description: error instanceof Error
            ? error.message
            : '请检查文件格式是否正确',
        });
      }
    };
    reader.onerror = () => {
      toast.error('读取文件失败', {
        description: '请重试或检查文件是否损坏',
      });
    };
    reader.readAsText(file);
    
    // 重置文件输入，以便可以再次选择同一个文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddNode = (e?: React.MouseEvent) => {
    // 防止点击按钮导致画布失去焦点
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // 检查是否有选中的节点
    const { selectedNodeId } = useCanvasStore.getState();
    if (!selectedNodeId) {
      toast.warning('请先选择一个节点作为父节点');
      return;
    }

    // 不传 position，让 store 处理子节点创建和自动布局
    addBlankNode();
  };

  // 生成 PRD Markdown 内容
  const generatePRDMarkdown = async (): Promise<string> => {
    if (nodes.length === 0) {
      throw new Error('没有可导出的节点，请先创建一些节点');
    }
    toast.loading('正在生成 PRD 文档...', { id: 'generate-prd' });
    const response = await fetch('/api/generate-prd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodes: nodes.map(node => ({
          id: node.id,
          label: node.data.label,
          type: node.type,
          spec: node.data.artifacts?.spec,
        })),
        projectMeta: projectMeta,
        globalRules: globalRules,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: '生成 PRD 失败' }));
      throw new Error(errorData.message || '生成 PRD 失败');
    }
    const data = await response.json();
    const markdown = data.markdown || data.content || '';
    if (!markdown) {
      throw new Error('生成的 PRD 文档为空');
    }
    toast.dismiss('generate-prd');
    return markdown;
  };

  const handleExportToHtml = async () => {
    setIsExportMenuOpen(false);
    const toastId = toast.loading('正在准备导出…', { description: '为各页面生成预览图' });
    try {
      // 仅对 HTML 代码做截图；React/JSX 在导出 PRD 中通过挂载点由脚本渲染，不当作 HTML 写入 iframe
      const nodePreviewInputs = nodes
        .filter((n) => n.data?.artifacts?.view?.code?.trim())
        .filter((n) => isHtmlCode((n.data!.artifacts!.view as { code?: string }).code!))
        .map((n) => ({ id: n.id, html: (n.data!.artifacts!.view as { code?: string }).code! }));
      const nodePreviewUrls = nodePreviewInputs.length > 0
        ? await captureNodePreviews(nodePreviewInputs, { timeoutPerNode: 10000, concurrency: 1 })
        : undefined;
      toast.dismiss(toastId);
      await exportToFullPrdHtml({
        projectMeta,
        globalRules,
        nodes,
        edges,
        nodePreviewUrls,
        architectureImage: undefined,
        topologyImage: undefined,
        swimlaneChart: undefined,
        dataDictionary: undefined,
      });
      toast.success('Full PRD HTML 导出成功！');
    } catch (error) {
      toast.dismiss(toastId);
      console.error('Export to Full PRD HTML error:', error);
      toast.error('导出 Full PRD HTML 失败', {
        description: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  const handleExportToWord = async () => {
    setIsExportMenuOpen(false);
    try {
      const markdown = await generatePRDMarkdown();
      await exportToWord({
        projectMeta,
        markdownContent: markdown,
        nodes,
        globalRules,
      });
      toast.success('Word 导出成功！');
    } catch (error) {
      console.error('Export to Word error:', error);
      toast.error('导出 Word 失败', {
        description: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  const handleExportSRS = async () => {
    setIsExportMenuOpen(false);
    try {
      await exportToEnterpriseWord({
        projectMeta: {
          projectName: projectMeta.projectName,
          version: projectMeta.version ?? 'V1.0.0',
          industry: projectMeta.industry ?? '通用互联网',
          targetAudience: projectMeta.targetAudience ?? '通用用户',
          description: projectMeta.description ?? '',
        },
        globalRules: {
          performance: globalRules.performance ?? '',
          security: globalRules.security ?? '',
          compatibility: globalRules.compatibility ?? '',
          errorHandling: globalRules.errorHandling ?? '',
          dataTracking: globalRules.dataTracking ?? '',
        },
        nodes,
      });
      toast.success('需求规格说明书导出成功！');
    } catch (error) {
      console.error('Export SRS error:', error);
      toast.error('导出需求规格说明书失败', {
        description: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  const handleExportTestReport = async () => {
    setIsExportMenuOpen(false);
    try {
      await exportTestReport({ projectMeta, nodes });
      toast.success('测试报告导出成功！');
    } catch (error) {
      console.error('Export test report error:', error);
      toast.error('导出测试报告失败', {
        description: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  const handleExportSystemDesign = async () => {
    setIsExportMenuOpen(false);
    try {
      await exportSystemDesignDoc({ projectMeta, nodes });
      toast.success('系统设计说明导出成功！');
    } catch (error) {
      console.error('Export system design error:', error);
      toast.error('导出系统设计说明失败', {
        description: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  const handleExportUserManual = async () => {
    setIsExportMenuOpen(false);
    try {
      await exportUserManual({ projectMeta, nodes });
      toast.success('使用说明书导出成功！');
    } catch (error) {
      console.error('Export user manual error:', error);
      toast.error('导出使用说明书失败', {
        description: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  const handleExportToMarkdown = async () => {
    setIsExportMenuOpen(false);
    try {
      const markdown = await generatePRDMarkdown();
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectMeta.projectName || 'project'}_PRD.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Markdown 导出成功！');
    } catch (error) {
      console.error('Export to Markdown error:', error);
      toast.error('导出 Markdown 失败', {
        description: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    if (isExportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExportMenuOpen]);

  // 检测演示模式：通过检查是否有演示模式的遮罩层
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  
  useEffect(() => {
    const checkPresentationMode = () => {
      // 检查是否有演示模式的遮罩层（通过 data 属性或 z-index）
      const presentationOverlay = document.querySelector('[data-presentation-mode="true"]') || 
                                  document.querySelector('[style*="z-index: 10000"], [style*="z-[10000"], [style*="zIndex: 10000"]');
      const isActive = !!presentationOverlay;
      setIsPresentationMode(isActive);
      
      // 如果检测到演示模式，也通过CSS隐藏工具栏
      const toolbar = document.querySelector('[data-project-toolbar]') as HTMLElement;
      if (toolbar) {
        if (isActive) {
          toolbar.style.display = 'none';
        } else {
          toolbar.style.display = '';
        }
      }
    };
    
    // 初始检查
    checkPresentationMode();
    
    // 使用 MutationObserver 监听 DOM 变化
    const observer = new MutationObserver(checkPresentationMode);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      attributes: true, 
      attributeFilter: ['style', 'class'] 
    });
    
    // 定期检查（作为备用方案）
    const interval = setInterval(checkPresentationMode, 500);
    
    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  // 当编辑面板打开时或演示模式时，隐藏工具栏
  if (isDetailPanelOpen || isPresentationMode) {
    return null;
  }

  return (
    <div 
      data-project-toolbar 
      className="fixed top-4 left-4 pointer-events-auto" 
      style={{ zIndex: 9999, position: 'fixed' }}
    >
      <div className="flex items-center gap-2 bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-lg px-3 py-2 shadow-xl">
        {/* New Project */}
        <button
          type="button"
          onClick={handleNewProject}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors duration-150 focus-ring"
          title="新建项目"
          aria-label="新建项目"
        >
          <FilePlus className="w-4 h-4" />
        </button>

        {/* Save Project */}
        <button
          type="button"
          onClick={handleSaveProject}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors duration-150 focus-ring"
          title="保存项目"
          aria-label="保存项目"
        >
          <Save className="w-4 h-4" />
        </button>

        {/* Open Project */}
        <button
          type="button"
          onClick={handleOpenProject}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors duration-150 focus-ring"
          title="打开项目"
          aria-label="打开项目"
        >
          <FolderOpen className="w-4 h-4" />
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="选择项目文件"
        />

        {/* Separator */}
        <div className="w-px h-6 bg-zinc-700 mx-1" />

        {/* Add Node */}
        <button
          type="button"
          onClick={handleAddNode}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors duration-150 focus-ring"
          title="添加节点"
          aria-label="添加节点"
        >
          <PlusSquare className="w-4 h-4" />
        </button>

        {/* Separator */}
        <div className="w-px h-6 bg-zinc-700 mx-1" />

        {/* Project Blueprint */}
        <button
          type="button"
          onClick={() => setIsBlueprintOpen(true)}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors duration-150 focus-ring"
          title="项目蓝图"
          aria-label="项目蓝图"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        {/* Separator */}
        <div className="w-px h-6 bg-zinc-700 mx-1" />

        {/* Export PRD Dropdown */}
        <div ref={exportMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors duration-150 focus-ring flex items-center gap-1"
            title="导出 PRD 文档"
            aria-label="导出 PRD 文档"
            aria-expanded={isExportMenuOpen}
          >
            <Download className="w-4 h-4" />
            <ChevronDown className="w-3 h-3" />
          </button>
          {isExportMenuOpen && (
            <div className="absolute top-full left-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 min-w-[200px]">
              <button
                type="button"
                onClick={handleExportToHtml}
                className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center gap-2 transition-colors duration-150 focus-ring first:rounded-t-lg"
              >
                <Globe className="w-4 h-4 shrink-0" />
                <span>导出 HTML</span>
              </button>
              <button
                type="button"
                onClick={handleExportToWord}
                className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center gap-2 transition-colors duration-150 focus-ring"
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>导出 Word</span>
              </button>
              <button
                type="button"
                onClick={handleExportToMarkdown}
                className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center gap-2 transition-colors duration-150 focus-ring"
              >
                <FileCode className="w-4 h-4 shrink-0" />
                <span>导出 Markdown</span>
              </button>
              <div className="border-t border-zinc-700 my-1" aria-hidden />
              <button
                type="button"
                onClick={handleExportSRS}
                className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center gap-2 transition-colors duration-150 focus-ring"
              >
                <ClipboardList className="w-4 h-4 shrink-0" />
                <span>导出需求规格说明书</span>
              </button>
              <button
                type="button"
                onClick={handleExportTestReport}
                className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center gap-2 transition-colors duration-150 focus-ring"
              >
                <TestTube2 className="w-4 h-4 shrink-0" />
                <span>导出测试报告</span>
              </button>
              <button
                type="button"
                onClick={handleExportSystemDesign}
                className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center gap-2 transition-colors duration-150 focus-ring"
              >
                <Cpu className="w-4 h-4 shrink-0" />
                <span>导出系统设计说明</span>
              </button>
              <button
                type="button"
                onClick={handleExportUserManual}
                className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center gap-2 transition-colors duration-150 focus-ring last:rounded-b-lg"
              >
                <BookMarked className="w-4 h-4 shrink-0" />
                <span>导出使用说明书</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Project Blueprint Modal - 渲染在 ProjectToolbar 外部，避免被容器限制 */}
      {isBlueprintOpen && (
        <ProjectBlueprint
          isOpen={isBlueprintOpen}
          onClose={() => setIsBlueprintOpen(false)}
        />
      )}
    </div>
  );
}