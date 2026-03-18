import { marked } from 'marked';
import { saveAs } from 'file-saver';
import { asBlob } from 'html-docx-js-typescript';
import type { ProjectMeta, GlobalRules } from '@/types/fractal';
import type { FractalNode } from '@/types/fractal';
import type { Edge } from 'reactflow';
import { extractBodyContent, extractStylesFromHtml, isHtmlCode, isPlaceholderUiCode } from './html-body-extractor';
import { PREVIEW_UI_PRD_BUNDLE, PREVIEW_UI_PRD_BUNDLE_CALL } from '@/lib/preview-ui-prd-bundle.generated';
import { MOBILE_VIEWPORT_WIDTH, MOBILE_VIEWPORT_HEIGHT, PC_VIEWPORT_WIDTH, PC_VIEWPORT_HEIGHT } from '@/lib/viewport-constants';
import { DesignSystemSnapshotSchema } from '@/types/design-system-snapshot';
import { formatDesignSystemPrdMarkdown } from '@/lib/design-system/format-design-system-prd-appendix';

function buildDesignSystemAppendixForPrd(
  snapshot: unknown,
  locked: boolean
): string | undefined {
  const p = DesignSystemSnapshotSchema.safeParse(snapshot);
  if (!p.success) return undefined;
  return formatDesignSystemPrdMarkdown(p.data, locked);
}

export { isPlaceholderUiCode };

// 1. 定义文档的样式 (打印友好 + 屏幕阅读友好)
const STYLES = `
  @media print { 
    .no-print { display: none !important; } 
    body { padding: 0; background: white; }
    .page-break { page-break-before: always; }
  }
  body { 
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
    background-color: #f3f4f6; 
    color: #1f2937; 
    line-height: 1.6; 
    padding: 40px; 
  }
  .doc-wrapper { 
    max-width: 900px; 
    margin: 0 auto; 
    background: white; 
    padding: 60px 80px; 
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); 
    border-radius: 8px; 
  }
  
  /* 标题体系 */
  h1 { 
    font-size: 2.5em; 
    color: #111827; 
    border-bottom: 4px solid #2563eb; 
    padding-bottom: 16px; 
    margin-bottom: 40px; 
  }
  h2 { 
    font-size: 1.8em; 
    color: #1f2937; 
    border-left: 5px solid #2563eb; 
    padding-left: 16px; 
    margin-top: 60px; 
    margin-bottom: 24px; 
  }
  h3 { 
    font-size: 1.4em; 
    color: #374151; 
    margin-top: 40px; 
  }
  
  /* 表格与代码 */
  table { 
    width: 100%; 
    border-collapse: collapse; 
    margin: 24px 0; 
    font-size: 0.9em; 
  }
  th, td { 
    border: 1px solid #e5e7eb; 
    padding: 12px; 
    text-align: left; 
  }
  th { 
    background-color: #f9fafb; 
    font-weight: 600; 
  }
  code { 
    background-color: #eff6ff; 
    color: #1d4ed8; 
    padding: 2px 6px; 
    border-radius: 4px; 
    font-family: monospace; 
  }
  
  /* 动态图表容器 */
  .diagram-container { 
    background: #f8fafc; 
    border: 1px dashed #cbd5e0; 
    padding: 20px; 
    border-radius: 8px; 
    margin: 20px 0; 
    overflow-x: auto; 
    display: flex; 
    justify-content: center; 
  }
  .cover-page { 
    text-align: center; 
    padding: 100px 0; 
    margin-bottom: 80px; 
    border-bottom: 1px dashed #e5e7eb; 
  }
  pre {
    background: #1f2937;
    color: #f9fafb;
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
  }
  pre code {
    background: transparent;
    padding: 0;
    color: inherit;
  }
`;

// 2. 辅助函数：生成 Mermaid 流程图代码
const generateMermaidCode = (nodes: FractalNode[], edges: Edge[]): string => {
  if (!nodes || nodes.length === 0) return '';
  
  let code = 'graph TD;\n'; // 从上到下布局
  
  // 添加节点
  nodes.forEach(node => {
    // 清理 label 中的特殊字符
    const label = (node.data?.label || '未命名').replace(/"/g, "'").replace(/\n/g, ' ');
    // 根据类型给节点不同形状 (示例：服务节点是圆形，页面是方形)
    const safeId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
    if (node.type === 'service') {
      code += `  ${safeId}(("${label}"));\n`;
    } else {
      code += `  ${safeId}["${label}"];\n`;
    }
  });

  // 添加连线
  edges.forEach(edge => {
    const sourceId = edge.source.replace(/[^a-zA-Z0-9]/g, '_');
    const targetId = edge.target.replace(/[^a-zA-Z0-9]/g, '_');
    const label = edge.label ? `|"${String(edge.label).replace(/"/g, "'")}"|` : '';
    code += `  ${sourceId}-->${label}${targetId};\n`;
  });

  return code;
};

export interface PRDExportOptions {
  projectMeta: ProjectMeta;
  markdownContent: string;
  nodes: FractalNode[];
  edges?: Edge[];
  globalRules?: GlobalRules;
}

/**
 * 导出 PRD 为 HTML 格式（交互式，包含 Mermaid 流程图）
 */
export const exportToHtml = async (options: PRDExportOptions) => {
  const { projectMeta, markdownContent, nodes, edges = [] } = options;

  // 1. 转换 Markdown 为 HTML
  const contentHtml = await marked.parse(markdownContent);
  
  // 2. 生成 Mermaid 流程图代码
  const mermaidCode = generateMermaidCode(nodes, edges);

  // 3. 组装完整 HTML
  const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectMeta.projectName} - PRD</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>${STYLES}</style>
    <script type="module">
      import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
      mermaid.initialize({ startOnLoad: true, theme: 'neutral' });
    </script>
</head>
<body>
    <div class="doc-wrapper">
        <div class="cover-page">
            <div style="color: #6b7280; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px;">
                ${projectMeta.industry || '产品需求文档'}
            </div>
            <h1>${projectMeta.projectName}</h1>
            <p><strong>版本：</strong> ${projectMeta.version || 'V1.0.0'}</p>
            <p><strong>目标用户：</strong> ${projectMeta.targetAudience || '通用用户'}</p>
            <p><strong>生成日期：</strong> ${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            ${projectMeta.description ? `<p style="margin-top: 20px; color: #6b7280;">${projectMeta.description}</p>` : ''}
        </div>

        ${mermaidCode ? `
        <div class="no-print">
            <h2>0. 系统架构蓝图 (自动生成)</h2>
            <p>基于项目蓝图节点自动生成的业务流程拓扑图。</p>
            <div class="diagram-container">
                <div class="mermaid">
${mermaidCode}
                </div>
            </div>
            <div class="page-break"></div>
        </div>
        ` : ''}

        <div id="markdown-content">
            ${contentHtml}
        </div>
        
        <div style="margin-top: 100px; text-align: center; color: #9ca3af; font-size: 0.8em;">
            Generated by AI-Native PRD Builder
        </div>
    </div>
</body>
</html>`;

  // 4. 下载文件
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  saveAs(blob, `${projectMeta.projectName}_PRD.html`);
};

/**
 * 导出 PRD 为 Word 格式（Docx）
 */
export const exportToWord = async (options: PRDExportOptions) => {
  const { projectMeta, markdownContent } = options;

  // 1. 转换 Markdown 为 HTML
  const contentHtml = await marked.parse(markdownContent);

  // 2. 组装 Word 用 HTML（简化版，不包含交互脚本）
  const wordHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <style>${STYLES}</style>
</head>
<body>
    <div class="doc-wrapper">
        <div style="text-align: center; margin-bottom: 60px;">
            <h1>${projectMeta.projectName}</h1>
            <p>版本: ${projectMeta.version || 'V1.0'}</p>
            <p>目标用户: ${projectMeta.targetAudience || '通用用户'}</p>
            <p>生成日期: ${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        ${contentHtml}
    </div>
</body>
</html>`;

  // 3. 转换为 Word 格式并下载
  try {
    const buffer = await asBlob(wordHtml, { orientation: 'portrait' });
    const blob = buffer instanceof Blob 
      ? buffer 
      : new Blob([buffer as unknown as ArrayBuffer], { 
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        });
    saveAs(blob, `${projectMeta.projectName}_PRD.docx`);
  } catch (error) {
    console.error('Export to Word error:', error);
    throw new Error('Word 导出失败，请稍后重试');
  }
};

/**
 * 页面节点中的需求章节
 */
export interface RequirementSection {
  title: string;        // e.g., "功能列表", "核心业务逻辑"
  type: 'table' | 'text'; // 'table' for Markdown table, 'text' for Markdown text
  content: string;      // Markdown string
}

/**
 * 页面节点（Rich Node Model）
 */
export interface PageNode {
  title: string;          // e.g., "订单列表页"
  uiPreview: string;      // Base64 图片
  /** 是否有真实预览图（导出截图或 view.previewUrl），无 UI 代码且无真实预览时显示「暂无 UI 预览」 */
  hasRealPreview?: boolean;
  uiCode?: string;        // React 组件代码或 HTML（含 style+body，用于界面示意）
  isHtml?: boolean;       // 为 true 时用 innerHTML 渲染，避免当 React 导致空白
  nodeId?: string;        // 节点唯一标识符（用于生成挂载点 ID）
  /** 界面视口：mobile=保持手机框/窄视口样式，desktop=以 PC 正常比例、Word 式排版 */
  viewportPreset?: 'mobile' | 'desktop';
  sections: RequirementSection[]; // 动态需求章节列表
  userStories?: Array<{   // 用户故事列表（用户故事模型 - 核心）
    id: string;
    role: string;
    activity: string;
    value: string;
    acceptanceCriteria: string[];
  }>;
  // 兼容旧数据（可选）
  businessContext?: {    // 业务背景信息
    domain?: string;
    role?: string;
    goal?: string;
  };
  events?: Array<{       // 业务事件列表（事件驱动模型）
    id: string;
    name: string;
    trigger: string;
    type: 'UserAction' | 'SystemTimer' | 'ExternalCallback';
    processFlow: Array<{
      step: number;
      action: string;
      desc: string;
    }>;
    outcome: string;
  }>;
}

/**
 * 全屏 PRD 文档数据接口
 */
export interface FullPrdData {
  meta: {
    name: string;
    version: string;
    updateTime: string;
    author?: string;
    industry: string;
    desc: string;
    targetUser: string;
  };
  images: {
    architecture?: string; // Base64 图片
    topology?: string; // Base64 图片或 Mermaid 代码
  };
  charts: {
    swimlane?: string; // Mermaid 代码
  };
  docs: {
    globalRules: string; // Markdown
    dictionary: string; // Markdown Table
    /** 有快照时：PRD 第 2 章 2.3 设计系统附录 */
    designSystemAppendix?: string;
  };
  nodes: PageNode[]; // 升级为 PageNode 数组
}

/**
 * 生成全屏 PRD 文档 HTML（GitBook 风格，固定左侧边栏）
 */
export function generateFullPrdHtml(data: FullPrdData): string {
  // 1. Prepare Markdown Content
  const parsedGlobalRules = marked.parse(data.docs.globalRules || '*(暂无内容)*');
  const parsedDictionary = marked.parse(data.docs.dictionary || '*(暂无内容)*');
  const parsedDesignSystem = data.docs.designSystemAppendix?.trim()
    ? marked.parse(data.docs.designSystemAppendix)
    : '';

  // 2. Logic to handle Topology (Image vs Code)
  const renderTopology = (content: string) => {
    if (!content) return '<p class="text-gray-400 italic">暂无交互拓扑图</p>';
    if (content.trim().startsWith('graph') || content.trim().startsWith('flowchart')) {
      return `<div class="mermaid bg-slate-50 p-4 rounded-lg border">${content}</div>`;
    }
    return `<div class="cursor-zoom-in" onclick="openLightbox('${content}')"><img src="${content}" class="max-h-[500px] border rounded shadow-sm" /></div>`;
  };

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.meta.name} - PRD</title>
    <!-- PRD export mount: v2 = 仅替换顶层组件 + nodeId 带索引，避免重复声明 -->
    <!-- React Runtime -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Lucide React (UMD expects window.react); export PRD 中保留图标等外部依赖 -->
    <script>window.react=window.React;</script>
    <script src="https://cdn.jsdelivr.net/npm/lucide-react@0.484.0/dist/umd/lucide-react.min.js"></script>
    <script type="module">
      import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
      mermaid.initialize({ 
        startOnLoad: true, 
        theme: 'neutral', 
        securityLevel: 'loose',
        fontFamily: 'Inter, system-ui, sans-serif'
      });
    </script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown-light.min.css">
    <style>
        body { font-family: 'Inter', system-ui, sans-serif; background: #f8fafc; }
        .sidebar { 
            width: 280px; 
            height: 100vh; 
            position: fixed; 
            left: 0; 
            top: 0; 
            overflow-y: auto; 
            background: #0f172a; 
            color: #94a3b8;
            scrollbar-width: thin;
            scrollbar-color: #475569 #0f172a;
        }
        /* 确保sidebar中的项目名称显示为白色 */
        .sidebar h1 {
            color: #ffffff !important;
        }
        .sidebar::-webkit-scrollbar {
            width: 6px;
        }
        .sidebar::-webkit-scrollbar-track {
            background: #0f172a;
        }
        .sidebar::-webkit-scrollbar-thumb {
            background: #475569;
            border-radius: 3px;
        }
        .main-content { margin-left: 280px; min-height: 100vh; background: #fff; }
        [id].prd-scroll-target { scroll-margin-top: 1.5rem; }
        /* 与预览模式一致：固定视口宽度，避免导出后因容器宽度不同导致样式差异 */
        .device-sandbox { position: relative; width: 100%; min-height: 400px; height: 100%; overflow: hidden; border-radius: 1rem; border: 2px solid #e2e8f0; background: #fff; box-sizing: border-box; }
        .device-sandbox > div { width: 100%; height: 100%; min-height: 100%; box-sizing: border-box; }
        .prd-ui-viewport { min-height: 100%; box-sizing: border-box; }
        
        /* Typography & Tables - 企业级文档标题层级 */
        /* 使用 !important 确保样式优先级，覆盖 Tailwind 和 markdown-body 的默认样式 */
        .main-content h1,
        section h1,
        h1 { 
            color: #0f172a !important; 
            font-weight: 800 !important; 
            font-size: 2.5rem !important; /* 40px - 章节标题，最大 */
            line-height: 1.2 !important;
            margin-top: 3rem !important; 
            margin-bottom: 1.5rem !important; 
            padding-bottom: 0.75rem !important;
            border-bottom: 3px solid #cbd5e1 !important;
        }
        .main-content h2,
        section h2,
        h2 { 
            color: #1e293b !important; 
            font-weight: 700 !important; 
            font-size: 2rem !important; /* 32px - 页面/模块标题，比 h1 小 */
            line-height: 1.3 !important;
            margin-top: 2.5rem !important; 
            margin-bottom: 1.25rem !important; 
            padding-bottom: 0.5rem !important;
            border-bottom: 2px solid #cbd5e1 !important;
        }
        .main-content h3,
        section h3,
        h3 { 
            color: #475569 !important; 
            font-weight: 600 !important; 
            font-size: 1.5rem !important; /* 24px - 小节标题，比 h2 小 */
            line-height: 1.4 !important;
            margin-top: 2rem !important; 
            margin-bottom: 1rem !important; 
            padding-bottom: 0.5rem !important;
            border-bottom: 1px solid #e2e8f0 !important;
        }
        .main-content h4,
        section h4,
        h4 { 
            color: #64748b !important; 
            font-weight: 600 !important; 
            font-size: 1.25rem !important; /* 20px - 子小节标题，比 h3 小 */
            line-height: 1.5 !important;
            margin-top: 1.5rem !important; 
            margin-bottom: 0.75rem !important; 
        }
        
        /* Logic Block Styling (for business logic, data rules, etc.) */
        .logic-block {
            background-color: #f8fafc;
            border-left: 4px solid #3b82f6;
            padding: 1rem;
            border-radius: 0 0.5rem 0.5rem 0;
            margin-top: 0.5rem;
        }
        .logic-block p {
            margin-bottom: 0.5rem;
        }
        .logic-block ul, .logic-block ol {
            margin-left: 1.5rem;
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
        }
        .logic-block li {
            margin-bottom: 0.25rem;
        }
        
        /* Node Separator */
        .node-separator {
            border-top: 1px solid #cbd5e1;
            margin: 2rem 0;
        }
        
        /* Markdown Tables Override */
        .markdown-body table { display: table; width: 100%; }
        .markdown-body th { background-color: #f1f5f9; }
        
        /* 确保正文文本不会比标题更突出 */
        .markdown-body {
            color: #475569; /* 正文文本颜色，比 h3 更浅 */
            font-size: 0.9375rem; /* 15px，小于 h4 的 20px */
            line-height: 1.6;
        }
        .markdown-body p {
            color: #475569 !important; /* 确保段落文本颜色不会比标题深 */
            font-size: 0.9375rem !important; /* 确保段落字号不会比标题大 */
            margin-bottom: 1rem;
        }
        .markdown-body strong,
        .markdown-body b {
            color: #64748b !important; /* 加粗文本颜色，比 h4 更浅 */
            font-weight: 600 !important;
            font-size: inherit !important; /* 继承父元素字号，不会比标题大 */
        }
        .markdown-body em,
        .markdown-body i {
            color: #64748b !important;
            font-size: inherit !important;
        }
        .markdown-body ul,
        .markdown-body ol {
            color: #475569 !important;
            font-size: 0.9375rem !important;
        }
        .markdown-body li {
            color: #475569 !important;
            font-size: 0.9375rem !important;
        }
        
        /* 确保 markdown-body 内的标题使用我们的样式 */
        .markdown-body h1 {
            color: #0f172a !important;
            font-weight: 800 !important;
            font-size: 2.5rem !important;
            line-height: 1.2 !important;
            margin-top: 3rem !important;
            margin-bottom: 1.5rem !important;
            padding-bottom: 0.75rem !important;
            border-bottom: 3px solid #cbd5e1 !important;
        }
        .markdown-body h2 {
            color: #1e293b !important;
            font-weight: 700 !important;
            font-size: 2rem !important;
            line-height: 1.3 !important;
            margin-top: 2.5rem !important;
            margin-bottom: 1.25rem !important;
            padding-bottom: 0.5rem !important;
            border-bottom: 2px solid #cbd5e1 !important;
        }
        .markdown-body h3 {
            color: #475569 !important;
            font-weight: 600 !important;
            font-size: 1.5rem !important;
            line-height: 1.4 !important;
            margin-top: 2rem !important;
            margin-bottom: 1rem !important;
            padding-bottom: 0.5rem !important;
            border-bottom: 1px solid #e2e8f0 !important;
        }
        .markdown-body h4 {
            color: #64748b !important;
            font-weight: 600 !important;
            font-size: 1.25rem !important;
            line-height: 1.5 !important;
            margin-top: 1.5rem !important;
            margin-bottom: 0.75rem !important;
        }

        /* Split View Sticky UI */
        .sticky-ui { 
            position: sticky; 
            top: 2rem; 
            align-self: flex-start;
            max-height: calc(100vh - 4rem);
            overflow-y: auto;
        }
        .phone-mockup { 
            border: 12px solid #1e293b; 
            border-radius: 32px; 
            overflow: hidden; 
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); 
            background: #fff;
            max-width: 100%;
            margin: 0 auto;
        }
        .phone-mockup img {
            width: 100%;
            height: auto;
            display: block;
            transition: transform 0.2s ease;
        }
        .phone-mockup img:hover {
            transform: scale(1.02);
        }
        /* 移动端界面示意：与编辑/演示预览一致，固定宽度/高度（viewport-constants） */
        .mobile-ui-viewport {
            width: ${MOBILE_VIEWPORT_WIDTH}px;
            max-width: 100%;
            min-height: ${MOBILE_VIEWPORT_HEIGHT}px;
            border-radius: 0.75rem;
            border: 2px solid #e2e8f0;
            overflow: hidden;
            background: #fff;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08);
            margin: 0 auto;
            box-sizing: border-box;
        }
        .mobile-ui-viewport .device-sandbox { min-height: ${MOBILE_VIEWPORT_HEIGHT}px; width: ${MOBILE_VIEWPORT_WIDTH}px; }
        /* PC 端界面示意：与编辑/演示预览一致，固定宽度/高度，窄屏可横向滚动 */
        .pc-ui-doc-flow {
            width: ${PC_VIEWPORT_WIDTH}px;
            max-width: 100%;
            border: 1px solid #e2e8f0;
            border-radius: 0.5rem;
            overflow-x: auto;
            overflow-y: hidden;
            background: #fff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
            box-sizing: border-box;
        }
        .pc-ui-doc-flow .device-sandbox {
            min-height: ${PC_VIEWPORT_HEIGHT}px;
            width: ${PC_VIEWPORT_WIDTH}px;
            flex-shrink: 0;
        }
        /* 兼容旧类名 */
        .desktop-viewport {
            width: ${PC_VIEWPORT_WIDTH}px;
            max-width: 100%;
            min-height: 480px;
            border-radius: 0.75rem;
            border: 2px solid #e2e8f0;
            overflow-x: auto;
            overflow-y: hidden;
            background: #fff;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08);
        }
        .desktop-viewport .device-sandbox { min-height: 480px; width: ${PC_VIEWPORT_WIDTH}px; }
        
        /* PRD Table Styling */
        .markdown-body table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
            font-size: 0.875rem;
        }
        .markdown-body table th {
            background-color: #f1f5f9;
            color: #1e293b;
            font-weight: 600;
            padding: 0.75rem;
            text-align: left;
            border: 1px solid #e2e8f0;
        }
        .markdown-body table td {
            padding: 0.75rem;
            border: 1px solid #e2e8f0;
            color: #334155;
        }
        .markdown-body table tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .markdown-body table tr:hover {
            background-color: #f1f5f9;
        }

        /* Lightbox */
        #lightbox { 
            display: none; 
            position: fixed; 
            inset: 0; 
            background: rgba(0,0,0,0.95); 
            z-index: 9999; 
            justify-content: center; 
            align-items: center; 
            cursor: pointer;
        }
        #lightbox img { 
            max-width: 95%; 
            max-height: 95%; 
            object-fit: contain; 
            border-radius: 8px;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }
        #lightbox::before {
            content: '点击关闭或按 ESC 键';
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            font-size: 14px;
            opacity: 0.7;
        }

        /* Print Optimization */
        @media print {
            .sidebar { display: none; }
            .main-content { margin-left: 0; width: 100%; }
            .sticky-ui { position: static; }
            .page-break { page-break-before: always; }
        }
    </style>
</head>
<body>

    <aside class="sidebar">
        <div class="p-6 border-b border-slate-800">
            <h1 class="text-white text-lg font-bold leading-tight">${data.meta.name}</h1>
            <div class="text-xs mt-2 text-slate-500">版本: ${data.meta.version}</div>
        </div>
        <nav class="p-4 space-y-1 text-sm">
            <a href="#version-control" class="block px-4 py-2 hover:bg-slate-800 rounded text-white font-medium">0. 版本记录</a>
            <a href="#ch1" class="block px-4 py-2 hover:bg-slate-800 rounded">1. 项目综述</a>
            <a href="#ch2" class="block px-4 py-2 hover:bg-slate-800 rounded">2. 全局规范</a>
            ${data.docs.designSystemAppendix?.trim()
              ? '<a href="#ch2-design-system" class="block px-4 py-1 hover:bg-slate-800 rounded truncate pl-8 text-xs text-slate-400">2.3 项目设计系统</a>'
              : ''}
            <a href="#ch3" class="block px-4 py-2 hover:bg-slate-800 rounded">3. 系统架构</a>
            <a href="#ch4" class="block px-4 py-2 hover:bg-slate-800 rounded">4. 业务流程</a>
            <a href="#ch5" class="block px-4 py-2 hover:bg-slate-800 rounded">5. 功能详述</a>
            ${data.nodes.map((n, i) => {
                const nodeNum = `5.${i+1}`;
                const sec3Title = (n.sections && n.sections[0]) ? n.sections[0].title : '功能需求说明';
                let storySubIdx = 1;
                const userStoriesMenu = n.userStories && n.userStories.length > 0
                    ? n.userStories.map((story, storyIdx) => {
                        const storyNum = `${nodeNum}.1.${storySubIdx++}`;
                        return `<a href="#node-${i}-story-${storyIdx}" class="block px-4 py-1 hover:bg-slate-800 rounded truncate pl-10 text-xs text-slate-400 transition-colors">${storyNum} ${story.id || `US-${storyIdx + 1}`}</a>`;
                    }).join('')
                    : '';
                return `
                    <div class="space-y-0.5">
                        <a href="#node-${i}" class="block px-4 py-1.5 hover:bg-slate-800 rounded truncate pl-6 text-xs font-medium text-slate-300 transition-colors">${nodeNum} ${n.title}</a>
                        <a href="#node-${i}-stories" class="block px-4 py-1 hover:bg-slate-800 rounded truncate pl-10 text-xs text-slate-400 transition-colors">${nodeNum}.1 用户故事</a>
                        ${userStoriesMenu}
                        <a href="#node-${i}-ui" class="block px-4 py-1 hover:bg-slate-800 rounded truncate pl-10 text-xs text-slate-400 transition-colors">${nodeNum}.2 界面示意</a>
                        <a href="#node-${i}-section-0" class="block px-4 py-1 hover:bg-slate-800 rounded truncate pl-10 text-xs text-slate-400 transition-colors">${nodeNum}.3 ${sec3Title}</a>
                    </div>
                `;
            }).join('')}
        </nav>
    </aside>

    <main class="main-content">
        <div class="max-w-5xl mx-auto p-12">
            
            <section id="version-control" class="mb-16 prd-scroll-target">
                <div class="bg-slate-50 rounded-xl border p-6">
                    <h2 style="margin-top:0; border:none; padding-bottom:0;">📝 文档版本记录</h2>
                    <table class="w-full text-sm text-left mt-4 border-collapse bg-white">
                        <thead class="bg-slate-100 text-slate-700">
                            <tr>
                                <th class="p-3 border">版本号</th>
                                <th class="p-3 border">修订日期</th>
                                <th class="p-3 border">修改人</th>
                                <th class="p-3 border">修订说明</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="p-3 border font-mono text-blue-600">${data.meta.version}</td>
                                <td class="p-3 border">${data.meta.updateTime}</td>
                                <td class="p-3 border font-medium">${data.meta.author || 'Project Owner'}</td>
                                <td class="p-3 border text-gray-600">初始版本生成 (Auto-generated)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <hr class="my-12 border-slate-200" />

            <section id="ch1" class="mb-20 scroll-mt-10 prd-scroll-target">
                <h1>第 1 章：项目综述</h1>
                
                <h3>1.1 项目背景</h3>
                <div class="bg-white p-4 text-gray-700 leading-relaxed">
                    ${data.meta.desc || '（暂无项目背景描述）'}
                </div>

                <h3>1.2 目标用户</h3>
                <div class="bg-blue-50 text-blue-800 p-4 rounded-lg border border-blue-100">
                    <strong>👥 核心用户群体：</strong> ${data.meta.targetUser || '通用用户'}
                </div>
            </section>

            <section id="ch2" class="mb-20 scroll-mt-10 prd-scroll-target">
                <h1>第 2 章：全局规范</h1>
                
                <h3>2.1 全局交互/数据规则</h3>
                <div class="markdown-body text-sm">
                    ${parsedGlobalRules}
                </div>

                <div class="mt-8"></div>
                <h3>2.2 全局数据字典</h3>
                <div class="markdown-body text-sm bg-slate-50 p-4 rounded border">
                    ${parsedDictionary}
                </div>
                ${parsedDesignSystem
                  ? `
                <div id="ch2-design-system" class="mt-10 scroll-mt-20 prd-scroll-target"></div>
                <h3>2.3 项目设计系统</h3>
                <p class="text-sm text-slate-500 mb-2">由画布「智能推荐」生成的设计意图快照，随 PRD 一并导出供评审对齐。</p>
                <div class="markdown-body text-sm bg-emerald-50/40 p-4 rounded border border-emerald-100">
                    ${parsedDesignSystem}
                </div>`
                  : ''}
            </section>

            <section id="ch3" class="mb-20 scroll-mt-10 prd-scroll-target">
                <h1>第 3 章：系统架构</h1>
                
                <h3>3.1 架构拓扑图</h3>
                ${data.images.architecture ? `
                <div class="border rounded-xl p-2 bg-slate-50 flex justify-center cursor-zoom-in" onclick="openLightbox('${data.images.architecture}')">
                    <img src="${data.images.architecture}" class="max-h-[600px] object-contain bg-white rounded shadow-sm" alt="Architecture" />
                </div>
                <p class="text-center text-xs text-gray-400 mt-2">（点击放大查看）</p>
                ` : '<p class="text-gray-400 italic">暂无架构拓扑图</p>'}

                <h3>3.2 交互拓扑图</h3>
                ${renderTopology(data.images.topology || '')}
            </section>

            <section id="ch4" class="mb-20 scroll-mt-10 prd-scroll-target">
                <h1>第 4 章：业务流程</h1>
                
                <h3>4.1 核心业务泳道图</h3>
                <div class="overflow-x-auto border rounded-xl p-6 bg-white shadow-sm">
                    <div class="mermaid flex justify-center min-w-[800px]">
                        ${data.charts.swimlane || 'graph TD; A[暂无泳道图]'}
                    </div>
                </div>
            </section>

            <section id="ch5" class="mb-32 scroll-mt-10 prd-scroll-target">
                <h1>第 5 章：功能详述</h1>
                <p class="text-gray-500 mb-8">本章节包含各个页面的 UI 原型图及详细的功能需求说明。</p>

                ${data.nodes.map((node, nodeIdx) => {
                  // Automatic Numbering: Chapter 5, Node level (5.1, 5.2, ...)
                  const nodeNum = `5.${nodeIdx + 1}`;
                  
                  const uiPreview = node.uiPreview || '';
                  const hasRealPreview = !!node.hasRealPreview;
                  // 仅在有实际 UI 代码且非占位时显示“由代码渲染”挂载区；无 UI 且无真实预览图时显示「暂无 UI 预览」
                  const hasValidUiCode = !!(node.uiCode && node.uiCode.trim() && !isPlaceholderUiCode(node.uiCode));
                  
                  // 小节顺序：5.x.1 用户故事，5.x.2 界面示意，5.x.3 功能需求说明
                  const sec1Num = `${nodeNum}.1`;
                  const sec2Num = `${nodeNum}.2`;
                  const sec3Num = `${nodeNum}.3`;
                  const sectionsHtml = node.sections && node.sections.length > 0
                    ? (() => {
                        const section = node.sections[0];
                        const parsedContent = marked.parse(section.content || '（暂无内容）') as string;
                        if (section.type === 'table') {
                          return `
                            <div id="node-${nodeIdx}-section-0" class="mb-6 scroll-mt-20 prd-scroll-target">
                              <h3>${sec3Num} ${section.title}</h3>
                              <div class="overflow-x-auto">${parsedContent}</div>
                            </div>`;
                        }
                        return `
                            <div id="node-${nodeIdx}-section-0" class="mb-6 scroll-mt-20 prd-scroll-target">
                              <h3>${sec3Num} ${section.title}</h3>
                              <div class="logic-block bg-slate-50 border-l-4 border-blue-500 p-4 rounded-r-lg">${parsedContent}</div>
                            </div>`;
                      })()
                    : `
                      <div id="node-${nodeIdx}-section-0" class="mb-6 scroll-mt-20 prd-scroll-target">
                        <h3>${sec3Num} 功能需求说明</h3>
                        <div class="logic-block bg-slate-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                          <p class="text-slate-500 italic">（暂无功能需求说明）</p>
                        </div>
                      </div>`;
                  let storySubIdx = 1;
                  const userStoriesHtml = node.userStories && node.userStories.length > 0
                    ? (() => {
                        const storiesHeader = `<div id="node-${nodeIdx}-stories" class="mb-6 scroll-mt-20 prd-scroll-target"><h3>${sec1Num} 用户故事</h3></div>`;
                        const cards = node.userStories!.map((story, storyIdx) => {
                        const storyNum = `${nodeNum}.1.${storySubIdx++}`;
                        return `
                          <div id="node-${nodeIdx}-story-${storyIdx}" class="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500 shadow-sm scroll-mt-20">
                              <div class="flex items-start justify-between mb-4">
                                  <h3>【用户故事卡片 ${story.id || `US-${storyIdx + 1}`}】</h3>
                                  <span class="text-xs text-slate-500 font-mono">${storyNum}</span>
                              </div>
                              
                              <div class="space-y-3">
                                  <div>
                                      <h4 class="text-base font-semibold text-slate-700 mb-1 flex items-center gap-2">
                                          <span class="text-xl">🧑‍💻</span>
                                          <span>角色</span>
                                      </h4>
                                      <p class="text-slate-800 ml-8">${story.role || '（未指定）'}</p>
                                  </div>
                                  
                                  <div>
                                      <h4 class="text-base font-semibold text-slate-700 mb-1 flex items-center gap-2">
                                          <span class="text-xl">🚩</span>
                                          <span>目标</span>
                                      </h4>
                                      <p class="text-slate-800 ml-8">${story.activity || '（未指定）'}</p>
                                  </div>
                                  
                                  <div>
                                      <h4 class="text-base font-semibold text-slate-700 mb-1 flex items-center gap-2">
                                          <span class="text-xl">💎</span>
                                          <span>价值</span>
                                      </h4>
                                      <p class="text-slate-800 ml-8">${story.value || '（未指定）'}</p>
                                  </div>
                                  
                                  <div class="mt-4 pt-4 border-t border-blue-200">
                                      <h4 class="text-base font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                          <span class="text-xl">✅</span>
                                          <span>验收标准 (逻辑细节)</span>
                                      </h4>
                                      <ul class="ml-6 space-y-2">
                                          ${story.acceptanceCriteria && story.acceptanceCriteria.length > 0
                                            ? story.acceptanceCriteria.map((ac, acIdx) => {
                                                const isLogic = ac.includes('[逻辑]');
                                                return `
                                                  <li class="text-sm text-slate-700 ${isLogic ? 'font-medium text-blue-700' : ''}">
                                                      ${ac}
                                                  </li>
                                                `;
                                              }).join('')
                                            : '<li class="text-sm text-slate-400 italic">（暂无验收标准）</li>'
                                          }
                                      </ul>
                                  </div>
                              </div>
                          </div>
                        `;
                        });
                        return storiesHeader + cards.join('');
                      })()
                    : `<div id="node-${nodeIdx}-stories" class="mb-6 scroll-mt-20 prd-scroll-target"><h3>${sec1Num} 用户故事</h3><div class="logic-block bg-slate-50 border-l-4 border-blue-500 p-4 rounded-r-lg"><p class="text-slate-500 italic">（暂无用户故事）</p></div></div>`;
                  
                  const isPcViewport = node.viewportPreset === 'desktop';
                  const uiWrapClass = isPcViewport ? 'pc-ui-doc-flow' : 'mobile-ui-viewport';
                  return `
                <div id="node-${nodeIdx}" class="mb-24 pt-8 border-t border-slate-200 scroll-mt-20 prd-scroll-target">
                    <h2>${nodeNum} ${node.title || `功能模块 ${nodeIdx + 1}`}</h2>
                    <div class="markdown-body text-sm bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div class="p-6">
                            ${userStoriesHtml}
                            <div id="node-${nodeIdx}-ui" class="mb-8 scroll-mt-20 prd-scroll-target">
                                <h3>${sec2Num} 界面示意</h3>
                                ${hasValidUiCode ? `
                                <div class="${uiWrapClass} bg-white">
                                    <div id="root-${node.nodeId || `node-${nodeIdx}`}" class="device-sandbox bg-white" style="${isPcViewport ? `min-height: ${PC_VIEWPORT_HEIGHT}px; width: ${PC_VIEWPORT_WIDTH}px;` : `min-height: ${MOBILE_VIEWPORT_HEIGHT}px; width: ${MOBILE_VIEWPORT_WIDTH}px;`}">
                                        <div class="flex items-center justify-center h-full text-slate-400 text-sm">UI 加载中…</div>
                                    </div>
                                </div>
                                <p class="text-center text-xs text-slate-500 mt-3 font-mono">图 ${sec2Num} 界面示意${isPcViewport ? '（PC 端，文档流）' : '（移动端）'}</p>
                                ` : hasRealPreview ? `
                                <div class="${uiWrapClass} bg-white">
                                    <img src="${uiPreview}" class="w-full h-auto block" alt="UI Preview - ${node.title || `功能模块 ${nodeIdx + 1}`}" onclick="openLightbox('${uiPreview}')" style="cursor: zoom-in;" />
                                </div>
                                <p class="text-center text-xs text-slate-500 mt-3 font-mono">图 ${sec2Num} UI 示意（点击放大）</p>
                                ` : `
                                <div class="${uiWrapClass} bg-slate-50 flex items-center justify-center" style="min-height: ${isPcViewport ? `${PC_VIEWPORT_HEIGHT}px` : `${MOBILE_VIEWPORT_HEIGHT}px`};">
                                    <div class="text-center text-slate-400">
                                        <div class="text-4xl mb-2">📱</div>
                                        <p class="text-sm">暂无 UI 预览</p>
                                    </div>
                                </div>
                                <p class="text-center text-xs text-slate-400 mt-3">图 ${sec2Num} UI 示意（待生成）</p>
                                `}
                            </div>
                            ${sectionsHtml}
                        </div>
                    </div>
                    <hr class="node-separator my-8 border-slate-300" />
                </div>
                `;
                }).join('')}
                
                ${data.nodes.length === 0 ? `
                <div class="text-center py-16 text-slate-400">
                    <div class="text-5xl mb-4">📄</div>
                    <p class="text-lg">暂无功能模块</p>
                    <p class="text-sm mt-2">请在项目蓝图中添加节点并生成需求文档</p>
                </div>
                ` : ''}
            </section>

        </div>
    </main>

    <div id="lightbox" onclick="this.style.display='none'">
        <img src="" alt="Full Screen Image" />
    </div>

    <script>
        // Lightbox Logic
        function openLightbox(src) {
            if(!src) return;
            const lb = document.getElementById('lightbox');
            const img = lb.querySelector('img');
            if (img) {
                img.src = src;
            lb.style.display = 'flex';
        }
        }

        // Close lightbox on click outside image
        document.getElementById('lightbox')?.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });

        // Close lightbox on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const lb = document.getElementById('lightbox');
                if (lb) lb.style.display = 'none';
            }
        });

        // Sidebar 锚点跳转：点击左侧目录滚动到对应内容
        document.querySelectorAll('aside nav a[href^="#"]').forEach(function(anchor) {
            anchor.addEventListener('click', function(e) {
                var href = this.getAttribute('href');
                if (!href || href === '#') return;
                var target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // 滚动高亮：左侧目录高亮当前可见的章节（含 section 与 node 块）
        var scrollTargets = document.querySelectorAll('section[id], [id^="node-"]');
        var navLinks = document.querySelectorAll('aside nav a[href^="#"]');
        function updateActiveNav() {
            var current = '';
            var minTop = 1e9;
            scrollTargets.forEach(function(el) {
                var rect = el.getBoundingClientRect();
                if (rect.top <= 120 && rect.top > -rect.height * 0.5) {
                    if (rect.top < minTop) {
                        minTop = rect.top;
                        current = el.getAttribute('id') || '';
                    }
                }
            });
            navLinks.forEach(function(link) {
                var h = link.getAttribute('href') || '';
                if (h === '#' + current) {
                    link.classList.add('bg-slate-800', 'text-white');
                    link.classList.remove('text-slate-400');
                } else {
                    link.classList.remove('bg-slate-800', 'text-white');
                    link.classList.add('text-slate-400');
                }
            });
        }
        window.addEventListener('scroll', updateActiveNav);
        updateActiveNav();

        // ============================================================================
        // React Component Mounting Logic
        // ============================================================================
        // Lucide 未加载时（如 file:// 或 CDN 失败）提供占位，避免组件报错导致一直「UI 加载中」
        if (typeof window.LucideReact === 'undefined') {
          window.LucideReact = new Proxy({}, { get: function() { return function(props) { return window.React.createElement('span', { className: 'inline-block w-4 h-4 bg-slate-300 rounded', title: 'icon' }); }; }; });
        }
    </script>
    <!-- PRD 内联 preview-ui：与项目内一致的 cn + 组件，离线打开时 UI 一致 -->
    <script>${PREVIEW_UI_PRD_BUNDLE}</script>
    <script>${PREVIEW_UI_PRD_BUNDLE_CALL}</script>
    <script>
        window.__PRD_EXPORT_VERSION__ = '2';
        console.log('[PRD] Export mount v2 (single top-level replace, unique nodeId)');
        // Wait for React and ReactDOM to be loaded
        function waitForReact(callback, maxRetries = 20, delay = 200) {
          const hasReact = typeof window.React !== 'undefined';
          const hasReactDOM = typeof window.ReactDOM !== 'undefined';
          const hasBabel = typeof window.Babel !== 'undefined';
          
          console.log('🔍 [waitForReact] Checking dependencies:', {
            React: hasReact,
            ReactDOM: hasReactDOM,
            Babel: hasBabel,
            retriesLeft: maxRetries
          });
          
          if (hasReact && hasReactDOM && hasBabel) {
            console.log('✅ [waitForReact] All dependencies loaded, calling callback');
            callback();
          } else if (maxRetries > 0) {
            setTimeout(() => waitForReact(callback, maxRetries - 1, delay), delay);
          } else {
            console.error('❌ [waitForReact] React/ReactDOM/Babel failed to load after timeout');
            console.error('💡 [waitForReact] Final status:', {
              React: hasReact,
              ReactDOM: hasReactDOM,
              Babel: hasBabel
            });
          }
        }

        // Mount React components（依赖内联 preview-ui bundle 已执行，__PRD_CN__ 等已挂到 window）
        function mountComponents() {
          if (typeof window.__PRD_CN__ === 'undefined') {
            console.warn('⚠️ [mountComponents] preview-ui 未加载（请使用最新导出重新生成 PRD）');
            document.querySelectorAll('[id^="root-"].device-sandbox').forEach(function(el) {
              if (el.textContent && el.textContent.indexOf('加载中') !== -1) {
                el.innerHTML = '<div style="padding:20px;color:#64748b;text-align:center;font-size:13px;">请使用「导出 PRD」重新生成此文件以正确渲染 UI</div>';
              }
            });
            return;
          }
          console.log('🔧 [mountComponents] Starting component mounting...');
          
          const nodesWithCode = ${JSON.stringify(
            data.nodes
              .map((node, nodeIdx) => ({ node, nodeIdx }))
              .filter(({ node }) => node.uiCode && node.uiCode.trim() && !isPlaceholderUiCode(node.uiCode))
              .map(({ node, nodeIdx }) => ({
                nodeId: node.nodeId || `node-${nodeIdx}`,
                uiCode: node.uiCode || '',
                title: node.title || '未命名页面',
                isHtml: !!node.isHtml,
              }))
          )};

          console.log('📊 [mountComponents] Found ' + nodesWithCode.length + ' nodes with UI code');
          
          if (nodesWithCode.length === 0) {
            console.warn('⚠️ [mountComponents] No nodes with UI code found');
            return;
          }

          // Log available containers
          const allContainers = document.querySelectorAll('[id^="root-"]');
          console.log('🔍 [mountComponents] Available containers:', Array.from(allContainers).map(el => el.id));

          nodesWithCode.forEach((nodeData, index) => {
            const containerId = 'root-' + nodeData.nodeId;
            const container = document.getElementById(containerId);
            
            console.log('🎯 [mountComponents] Processing node:', nodeData.title, 'Container ID:', containerId);
            
            if (!container) {
              console.warn('⚠️ Container ' + containerId + ' not found for node: ' + nodeData.title);
              console.warn('💡 Available containers:', Array.from(document.querySelectorAll('[id^="root-"]')).map(el => el.id));
              return;
            }
            
            if (!nodeData.uiCode || nodeData.uiCode.trim().length === 0) {
              console.warn('⚠️ Node ' + nodeData.title + ' has empty UI code');
              container.innerHTML = '<div style="padding: 20px; color: #9ca3af; text-align: center;">暂无 UI 代码</div>';
              return;
            }

            try {
              if (nodeData.isHtml) {
                var htmlContent = nodeData.uiCode.trim();
                htmlContent = htmlContent.replace(/<style([^>]*)>([\\s\\S]*?)<\\/style>/gi, function(_, attrs, inner) {
                  var r = inner.replace(/\\b(html\\s*,\\s*)?body\\b/g, '.prd-ui-viewport');
                  return '<style' + attrs + '>' + r + '</style>';
                });
                var styleEnd = htmlContent.indexOf('</style>');
                if (styleEnd !== -1) {
                  var after = htmlContent.slice(styleEnd + 8).trim();
                  htmlContent = htmlContent.slice(0, styleEnd + 8) + '<div class="prd-ui-viewport">' + after + '</div>';
                }
                container.innerHTML = '';
                container.className = 'device-sandbox';
                var innerDiv = document.createElement('div');
                innerDiv.className = 'prd-ui-sandbox-inner';
                innerDiv.style.cssText = 'width:100%;height:100%;min-height:100%;box-sizing:border-box;';
                innerDiv.innerHTML = htmlContent;
                container.appendChild(innerDiv);
                return;
              }

              console.log('🔄 [mountComponents] Transforming code for:', nodeData.title);
              
              // Transform component code: ensure it's a valid React component
              let componentCode = nodeData.uiCode;
              
              console.log('📝 [mountComponents] Original code length:', componentCode.length);
              
              // Step 0: 先替换顶层组件为 const App_xxx = () => {，避免后续 function name(params) 误匹配
              const safeId = nodeData.nodeId.replace(/[^a-zA-Z0-9]/g, '_');
              const componentName = 'App_' + safeId;
              const topLevelPattern = /(?:export\\s+(?:default\\s+)?)?(?:async\\s+)?function\\s+\\w+\\s*(?:\\([^)]*\\))?\\s*\\{|const\\s+\\w+\\s*=\\s*\\([^)]*\\)\\s*=>\\s*\\{/;
              componentCode = componentCode.replace(topLevelPattern, 'const ' + componentName + ' = () => {');
              
              // Step 1: Remove TypeScript type definitions and annotations (Babel can't handle TS)
              // Remove type definitions using a more robust approach that handles multi-line and nested braces
              // First, remove simple single-line type definitions: type X = Y;
              componentCode = componentCode.replace(/^\\s*type\\s+\\w+\\s*=\\s*[^;{]+;?\\s*$/gm, '');
              
              // Then, remove multi-line type definitions: type X = { ... } (handles nested braces)
              // This regex matches: type NAME = { ... } where ... can contain nested braces
              let typeRegex = /^\\s*type\\s+\\w+\\s*=\\s*\\{/gm;
              let match;
              while ((match = typeRegex.exec(componentCode)) !== null) {
                let start = match.index;
                let braceCount = 0;
                let i = match.index + match[0].length - 1;
                let foundEnd = false;
                
                while (i < componentCode.length) {
                  if (componentCode[i] === '{') braceCount++;
                  if (componentCode[i] === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                      // Found the end of the type definition
                      let end = i + 1;
                      // Also remove trailing semicolon if present
                      if (componentCode[end] === ';') end++;
                      // Remove the entire type definition
                      componentCode = componentCode.substring(0, start) + componentCode.substring(end);
                      foundEnd = true;
                      break;
                    }
                  }
                  i++;
                }
                
                if (!foundEnd) {
                  // If we didn't find the end, just remove from start to end of line
                  let lineEnd = componentCode.indexOf('\\n', start);
                  if (lineEnd === -1) lineEnd = componentCode.length;
                  componentCode = componentCode.substring(0, start) + componentCode.substring(lineEnd);
                }
                
                // Reset regex lastIndex to avoid infinite loop
                typeRegex.lastIndex = start;
              }
              
              // Remove interface definitions: interface X { ... }
              componentCode = componentCode.replace(/^\\s*interface\\s+\\w+[^{]*\\{[^}]*\\}\\s*;?\\s*$/gm, '');
              // Remove type annotations from variables: const x: Type = ... (含 string, number 等小写类型)
              componentCode = componentCode.replace(/:\\s*[A-Za-z][a-zA-Z0-9<>\\[\\]|&\\s,]*(\\s*=\\s*)/g, '$1');
              // Remove Record<...> and other generic type annotations left as ": Name = " (e.g. const x: Record<string, {...}> =)
              componentCode = componentCode.replace(/:\\s*[A-Za-z][A-Za-z0-9]*\\s*<[\\s\\S]*?>\\s*=\\s*/g, ' = ');
              // 先全局移除解构中的对象类型 }: { key: Type }，避免 ( ) 替换误伤
              componentCode = componentCode.replace(/\\}\\s*:\\s*\\{[^}]*\\}\\s*/g, '} ');
              // Remove type annotations from arrow function parameters: (x: Type) => 含小写类型 (string, number)
              componentCode = componentCode.replace(/\\(([^)]*)\\)\\s*=>/g, function(match, params) {
                var p = params.replace(/:\\s*[A-Za-z][a-zA-Z0-9<>\\[\\]|&\\s,]*/g, '').replace(/,\\s*,/g, ',').replace(/^,\\s*|,\\s*$/g, '');
                return '(' + p + ') =>';
              });
              // 普通函数形参: function name(x: Type) {
              componentCode = componentCode.replace(/function\\s+\\w+\\s*\\(([^)]*)\\)\\s*\\{/g, function(match, params) {
                var p = params.replace(/:\\s*[A-Za-z][a-zA-Z0-9<>\\[\\]|&\\s,]*/g, '').replace(/,\\s*,/g, ',').replace(/^,\\s*|,\\s*$/g, '');
                return match.replace(/\\([^)]*\\)/, '(' + p + ')');
              });
              // 不在此处用泛型正则移除 <T>，以免误删 JSX 标签（如 <Button>）；仅对 Hook 泛型单独处理见下
              // Remove 'as' type assertions: x as Type
              componentCode = componentCode.replace(/\\s+as\\s+[A-Z][a-zA-Z0-9<>\\[\\]|&\\s,]*/g, '');
              // Remove import type statements: import type { ... } from ...
              componentCode = componentCode.replace(/import\\s+type\\s+[^;]+;?\\s*/g, '');
              // 移除 Hook 泛型：useState<"a"|"b">、useState<string> 等，避免 Babel 报错
              componentCode = componentCode.replace(/useState\\s*<[^>]+>/g, 'useState');
              componentCode = componentCode.replace(/useRef\\s*<[^>]+>/g, 'useRef');
              componentCode = componentCode.replace(/useCallback\\s*<[^>]+>/g, 'useCallback');
              componentCode = componentCode.replace(/useMemo\\s*<[^>]+>/g, 'useMemo');
              
              // Step 2: Remove Markdown code blocks if present
              const backtick = String.fromCharCode(96);
              componentCode = componentCode.replace(new RegExp(backtick + backtick + backtick + 'tsx|' + backtick + backtick + backtick + 'jsx|' + backtick + backtick + backtick + 'javascript|' + backtick + backtick + backtick + 'typescript|' + backtick + backtick + backtick, 'g'), '').trim();
              
              // Step 3: Remove export statements
              componentCode = componentCode.replace(/^export\\s+.*?;?\\s*$/gm, '');
              componentCode = componentCode.replace(/export\\s+default\\s+/g, '');
              
              // Step 4: Replace lucide-react imports with window.LucideReact (保留图标等外部依赖)
              componentCode = componentCode.replace(
                /import\\s*\\{\\s*([^}]+)\\s*\\}\\s*from\\s*['"]lucide-react['"]\\s*;?/g,
                'const { $1 } = window.LucideReact || {};'
              );
              componentCode = componentCode.replace(
                /import\\s*\\*\\s*as\\s+(\\w+)\\s*from\\s*['"]lucide-react['"]\\s*;?/g,
                'const $1 = window.LucideReact || {};'
              );
              // Remove other import statements (React etc. are already global)
              componentCode = componentCode.replace(/^import\\s+.*?from\\s+['"].*?['"];?\\s*$/gm, '');
              
              // Step 5: 顶层已在 Step 0 替换，此处仅保留 componentName 供下方使用（safeId/componentName 已在上方定义）

              // Step 5.1: 修复 LLM 常见语法错误——三元或表达式后多余的 "} |" 导致 Babel "Unexpected token, expected ':'"（用 [ \\t\\n]* 代替 \\s* 避免导出时反斜杠丢失）
              componentCode = componentCode.replace(/\\}[ \\t\\n]*\\\|/g, '}');
              // Step 5.2: 修复三元运算符误写为赋值——"? 30 = 199 ?" 应为 "? 30 : 199 ?"（Invalid left-hand side in assignment）
              componentCode = componentCode.replace(/\\?[ \\t\\n]*\\(\\d+\\)[ \\t\\n]*=[ \\t\\n]*\\(\\d+\\)[ \\t\\n]*\\?/g, '? $1 : $2 ?');

              console.log('🔧 [mountComponents] Component name:', componentName);
              console.log('📝 [mountComponents] Cleaned code length:', componentCode.length);
              
              // Wrap in Babel transform
              if (!window.Babel) {
                throw new Error('Babel is not loaded');
              }
              
              console.log('⚙️ [mountComponents] Transforming with Babel...');
              const transformedCode = window.Babel.transform(componentCode, {
                presets: ['react'],
                plugins: []
              }).code;
              
              console.log('✅ [mountComponents] Babel transformation successful');
              console.log('📝 [mountComponents] Transformed code length:', transformedCode.length);

              // 将 React Hooks 替换为 React.xxx，使组件在仅注入 React 时可用（导出 HTML 未注入 useState 等）
              var codeToRun = transformedCode
                .replace(/\\buseState\\b/g, 'React.useState')
                .replace(/\\buseEffect\\b/g, 'React.useEffect')
                .replace(/\\buseCallback\\b/g, 'React.useCallback')
                .replace(/\\buseMemo\\b/g, 'React.useMemo')
                .replace(/\\buseRef\\b/g, 'React.useRef')
                .replace(/\\buseContext\\b/g, 'React.useContext')
                .replace(/\\buseReducer\\b/g, 'React.useReducer');

              // Create component function（注入内联 preview-ui 参数：cn、Button、Card 等）
              console.log('🏭 [mountComponents] Creating component function...');
              var stubNames = ['cn','Button','Card','CardHeader','CardTitle','CardContent','CardFooter','AppBar','ListItem','Badge','Input','Label','TabsList','TabsTrigger','TabsContent','Switch','Progress','Dialog','DialogHeader','DialogContent','DialogFooter','Textarea','Separator','Avatar','Alert','StatCard','NavBar','BottomNav','BottomNavItem','Sidebar','SidebarItem','EmptyState','PageHeader','Skeleton'];
              var stubParams = ['React','ReactDOM'].concat(stubNames);
              var fallbackCn = function() { var t = []; for (var i = 0; i < arguments.length; i++) { var a = arguments[i]; if (a && typeof a === 'string') t.push(a); else if (Array.isArray(a)) t.push(fallbackCn.apply(null, a)); else if (a && typeof a === 'object') { for (var k in a) if (a[k]) t.push(k); } } return t.join(' '); };
              var stubArgs = [window.React, window.ReactDOM].concat(stubNames.map(function(n){ var v = window['__PRD_' + n + '__']; if (n === 'cn') return (v && typeof v === 'function') ? v : fallbackCn; return v; }));
              var componentFn = new (Function.bind.apply(Function, [null].concat(stubParams, [codeToRun + '\\nreturn ' + componentName + ';'])));
              var Component = componentFn.apply(null, stubArgs);
              
              if (!Component) {
                throw new Error('Component function returned undefined');
              }
              
              console.log('✅ [mountComponents] Component created successfully');
              
              // Clear container and mount
              container.innerHTML = '';
              console.log('🎯 [mountComponents] Mounting component to container:', containerId);
              
              const root = window.ReactDOM.createRoot(container);
              root.render(window.React.createElement(Component));
              
              console.log('✅ [mountComponents] Successfully mounted component for ' + nodeData.title + ' in ' + containerId);
            } catch (error) {
              console.error('❌ Failed to mount component for ' + nodeData.title + ':', error);
              container.innerHTML = '<div style="padding: 20px; color: #ef4444; text-align: center;">' +
                '<p>⚠️ UI 组件加载失败</p>' +
                '<p style="font-size: 12px; margin-top: 8px;">' + (error.message || '未知错误') + '</p>' +
              '</div>';
            }
          });
        }

        // Initialize React components after page load
        console.log('🚀 [init] Starting React component initialization...');
        
        // Also try on DOMContentLoaded
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', function() {
            console.log('📄 [init] DOMContentLoaded fired');
            waitForReact(() => {
              mountComponents();
              setTimeout(mountComponents, 500);
              setTimeout(mountComponents, 1500);
              setTimeout(mountComponents, 3000);
            });
          });
        }
        
        // And on window load
        window.addEventListener('load', function() {
          console.log('🌐 [init] Window load fired');
          waitForReact(() => {
            mountComponents();
            setTimeout(mountComponents, 500);
            setTimeout(mountComponents, 1500);
            setTimeout(mountComponents, 3000);
          });
        });
        
        // Also try immediately (in case scripts are already loaded)
        waitForReact(() => {
          console.log('⚡ [init] Immediate mount attempt');
          mountComponents();
          
          // Retry after delays (in case Babel compilation takes time)
          setTimeout(() => {
            console.log('🔄 [init] Retry mount (500ms)');
            mountComponents();
          }, 500);
          setTimeout(() => {
            console.log('🔄 [init] Retry mount (1500ms)');
            mountComponents();
          }, 1500);
          setTimeout(() => {
            console.log('🔄 [init] Retry mount (3000ms)');
            mountComponents();
          }, 3000);
          
          // 超时回退：若仍为「加载中」，提示用户
          setTimeout(function() {
            document.querySelectorAll('[id^="root-"]').forEach(function(el) {
              if (el.textContent && el.textContent.indexOf('加载中') !== -1) {
                el.innerHTML = '<div style="padding: 20px; color: #94a3b8; text-align: center; font-size: 13px;"><p>UI 未能渲染</p><p style="margin-top: 8px;">请用浏览器打开此 HTML 并允许加载脚本（React/Babel CDN）</p></div>';
              }
            });
          }, 8000);
        });
    </script>
</body>
</html>
  `;
}

/**
 * 导出全屏 PRD 文档（GitBook 风格）
 */
export const exportToFullPrdHtml = async (options: {
  projectMeta: ProjectMeta;
  globalRules: GlobalRules;
  nodes: FractalNode[];
  edges?: Edge[];
  /** 导出前为节点生成的预览图（nodeId -> dataUrl），优先于节点已有 previewUrl，保证导出 HTML 中 UI 可见 */
  nodePreviewUrls?: Record<string, string>;
  architectureImage?: string; // Base64 架构拓扑图
  topologyImage?: string; // Base64 或 Mermaid 交互拓扑图
  swimlaneChart?: string; // Mermaid 业务泳道图
  dataDictionary?: string; // Markdown 数据字典
  /** 画布设计系统快照（与 store 一致） */
  designSystemSnapshot?: unknown;
  designSystemLocked?: boolean;
}) => {
  const {
    projectMeta,
    globalRules,
    nodes,
    edges = [],
    nodePreviewUrls,
    architectureImage,
    topologyImage,
    swimlaneChart,
    dataDictionary,
    designSystemSnapshot,
    designSystemLocked,
  } = options;

  // 构建全局规则 Markdown（使用三级标题）
  const globalRulesMarkdown = `
### 性能要求
${globalRules.performance || '（待补充）'}

### 安全要求
${globalRules.security || '（待补充）'}

### 兼容性要求
${globalRules.compatibility || '（待补充）'}

### 错误处理
${globalRules.errorHandling || '（待补充）'}

### 数据追踪
${globalRules.dataTracking || '（待补充）'}
  `.trim();

  // 构建数据字典 Markdown（如果提供）
  const dictionaryMarkdown = dataDictionary || '| 字段名 | 类型 | 说明 |\n|--------|------|------|\n| （暂无数据字典） | - | - |';

  // 转换节点数据为 PageNode 格式（Rich Node Model）
  const nodeData: PageNode[] = nodes.map((node, nodeIdx) => {
    const spec = node.data?.artifacts?.spec;
    const view = node.data?.artifacts?.view;
    let uiCode: string | undefined;
    let rawHtml: string | undefined;
    if (view?.htmlTemplate?.trim()) {
      rawHtml = view.htmlTemplate;
    } else if (view?.code && isHtmlCode(view.code)) {
      rawHtml = view.code;
    } else if (view?.code) {
      uiCode = view.code;
    }
    if (rawHtml) {
      const styles = extractStylesFromHtml(rawHtml);
      const bodyContent = extractBodyContent(rawHtml);
      uiCode = styles ? `${styles}\n${bodyContent}` : bodyContent;
    }
    if (uiCode && isPlaceholderUiCode(uiCode)) uiCode = undefined;
    const placeholderSvg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5peg5Zu+54mH5pyN5YqhPC90ZXh0Pjwvc3ZnPg==';
    const uiPreview = nodePreviewUrls?.[node.id] ?? view?.previewUrl ?? placeholderSvg;
    const hasRealPreview = !!(nodePreviewUrls?.[node.id] || (view?.previewUrl && view.previewUrl.trim().length > 0));
    
    // 构建需求章节数组
    const sections: RequirementSection[] = [];
    
    // 检查是否有新的 sections 结构（Rich Node Model）
    // 注意：sections 不在 spec 中，而是在 PageNode 中，这里只处理 requirements
    if (spec?.requirements) {
      // 兼容旧格式：从 requirements 生成 sections
      const requirements = Array.isArray(spec.requirements) 
        ? spec.requirements.join('\n') 
        : spec.requirements;
      
      // 判断是否为表格格式
      const isTable = requirements.includes('|') && (
        requirements.includes('功能ID') || 
        requirements.includes('UI区域') || 
        requirements.includes('元素名称')
      );
      
      if (isTable) {
        // 作为表格章节
        sections.push({
          title: '功能列表',
          type: 'table',
          content: requirements,
        });
      } else if (requirements.trim().length > 0) {
        // 作为文本章节
        sections.push({
          title: '功能需求说明',
          type: 'text',
          content: requirements,
        });
      }
    }
    
    // 提取用户故事数据（用户故事模型 - 核心）
    const userStories = node.data?.artifacts?.userStories;
    // 兼容旧数据（可选）
    const businessContext = node.data?.artifacts?.businessContext;
    const events = node.data?.artifacts?.events;
    
    // 如果没有章节，添加一个占位章节
    if (sections.length === 0) {
      sections.push({
        title: '功能需求说明',
        type: 'text',
        content: '（暂无功能需求说明）',
      });
    }

    const baseId = (node as any).id ?? (node.data as any).id ?? node.data?.label ?? 'node';
    const safeBase = String(baseId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const viewportPreset = (view as any)?.viewportPreset === 'mobile' ? 'mobile' : 'desktop';
    return {
      title: spec?.title || node.data.label || '未命名页面',
      uiPreview,
      hasRealPreview,
      uiCode,
      isHtml: !!rawHtml,
      viewportPreset,
      nodeId: `${safeBase}_${nodeIdx}`,
      sections,
      // 用户故事模型（新 - 核心）
      userStories: userStories ? userStories.map(story => ({
        id: story.id,
        role: story.role,
        activity: story.activity,
        value: story.value,
        acceptanceCriteria: story.acceptanceCriteria || [],
      })) : undefined,
      // 兼容旧数据（可选）
      businessContext: businessContext ? {
        domain: businessContext.domain,
        role: businessContext.role,
        goal: businessContext.goal,
      } : undefined,
      events: events ? events.map(event => ({
        id: event.id,
        name: event.name,
        trigger: event.trigger,
        type: event.type,
        processFlow: event.processFlow || [],
        outcome: event.outcome,
      })) : undefined,
    };
  });

  // 构建完整数据
  const fullPrdData: FullPrdData = {
    meta: {
      name: projectMeta.projectName,
      version: projectMeta.version || 'V1.0.0',
      updateTime: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
      author: 'Project Owner',
      industry: projectMeta.industry || 'General Internet',
      desc: projectMeta.description || '（暂无项目背景描述）',
      targetUser: projectMeta.targetAudience || '通用用户',
    },
    images: {
      architecture: architectureImage,
      topology: topologyImage,
    },
    charts: {
      swimlane: swimlaneChart,
    },
    docs: {
      globalRules: globalRulesMarkdown,
      dictionary: dictionaryMarkdown,
      ...(() => {
        const ap = buildDesignSystemAppendixForPrd(
          designSystemSnapshot,
          designSystemLocked === true
        );
        return ap ? { designSystemAppendix: ap } : {};
      })(),
    },
    nodes: nodeData,
  };

  // 生成 HTML
  const html = generateFullPrdHtml(fullPrdData);

  // 下载文件
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  saveAs(blob, `${projectMeta.projectName}_Full_PRD.html`);
}

/**
 * 仅生成 PRD HTML 字符串（不触发下载），供 API / 脚本使用。
 */
export async function buildFullPrdHtmlString(options: {
  projectMeta: ProjectMeta;
  globalRules: GlobalRules;
  nodes: FractalNode[];
  edges?: Edge[];
  architectureImage?: string;
  topologyImage?: string;
  swimlaneChart?: string;
  dataDictionary?: string;
  designSystemSnapshot?: unknown;
  designSystemLocked?: boolean;
}): Promise<string> {
  const {
    projectMeta,
    globalRules,
    nodes,
    edges = [],
    architectureImage,
    topologyImage,
    swimlaneChart,
    dataDictionary,
    designSystemSnapshot,
    designSystemLocked,
  } = options;
  const globalRulesMarkdown = `
### 性能要求
${globalRules.performance || '（待补充）'}

### 安全要求
${globalRules.security || '（待补充）'}

### 兼容性要求
${globalRules.compatibility || '（待补充）'}

### 错误处理
${globalRules.errorHandling || '（待补充）'}

### 数据追踪
${globalRules.dataTracking || '（待补充）'}
  `.trim();
  const dictionaryMarkdown = dataDictionary || '| 字段名 | 类型 | 说明 |\n|--------|------|------|\n| （暂无数据字典） | - | - |';

  const nodeData: PageNode[] = nodes.map((node, nodeIdx) => {
    const spec = node.data?.artifacts?.spec;
    const view = node.data?.artifacts?.view;
    let uiCode: string | undefined;
    let rawHtml: string | undefined;
    if (view?.htmlTemplate?.trim()) rawHtml = view.htmlTemplate;
    else if (view?.code && isHtmlCode(view.code)) rawHtml = view.code;
    else if (view?.code) uiCode = view.code;
    if (rawHtml) {
      const styles = extractStylesFromHtml(rawHtml);
      const bodyContent = extractBodyContent(rawHtml);
      uiCode = styles ? `${styles}\n${bodyContent}` : bodyContent;
    }
    if (uiCode && isPlaceholderUiCode(uiCode)) uiCode = undefined;
    const uiPreview = view?.previewUrl || (uiCode ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5peg5Zu+54mH5pyN5YqhPC90ZXh0Pjwvc3ZnPg==' : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5peg5Zu+54mH5pyN5YqhPC90ZXh0Pjwvc3ZnPg==');
    const hasRealPreview = !!(view?.previewUrl && view.previewUrl.trim().length > 0);
    const sections: RequirementSection[] = [];
    if (spec?.requirements) {
      const requirements = Array.isArray(spec.requirements) ? spec.requirements.join('\n') : spec.requirements;
      const isTable = requirements.includes('|') && (requirements.includes('功能ID') || requirements.includes('UI区域') || requirements.includes('元素名称'));
      if (isTable) sections.push({ title: '功能列表', type: 'table', content: requirements });
      else if (requirements.trim().length > 0) sections.push({ title: '功能需求说明', type: 'text', content: requirements });
    }
    if (sections.length === 0) sections.push({ title: '功能需求说明', type: 'text', content: '（暂无功能需求说明）' });
    const userStories = node.data?.artifacts?.userStories;
    const businessContext = node.data?.artifacts?.businessContext;
    const events = node.data?.artifacts?.events;
    const baseId = (node as any).id ?? (node.data as any).id ?? node.data?.label ?? 'node';
    const safeBase = String(baseId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const viewportPreset = (view as any)?.viewportPreset === 'mobile' ? 'mobile' : 'desktop';
    return {
      title: spec?.title || node.data?.label || '未命名页面',
      uiPreview,
      hasRealPreview,
      uiCode,
      isHtml: !!rawHtml,
      viewportPreset,
      nodeId: `${safeBase}_${nodeIdx}`,
      sections,
      userStories: userStories?.map((s) => ({ id: s.id, role: s.role, activity: s.activity, value: s.value, acceptanceCriteria: s.acceptanceCriteria || [] })),
      businessContext: businessContext ? { domain: businessContext.domain, role: businessContext.role, goal: businessContext.goal } : undefined,
      events: events?.map((e) => ({ id: e.id, name: e.name, trigger: e.trigger, type: e.type, processFlow: e.processFlow || [], outcome: e.outcome })),
    };
  });

  const fullPrdData: FullPrdData = {
    meta: {
      name: projectMeta.projectName,
      version: projectMeta.version || 'V1.0.0',
      updateTime: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
      author: 'Project Owner',
      industry: projectMeta.industry || 'General Internet',
      desc: projectMeta.description || '（暂无项目背景描述）',
      targetUser: projectMeta.targetAudience || '通用用户',
    },
    images: { architecture: architectureImage, topology: topologyImage },
    charts: { swimlane: swimlaneChart },
    docs: {
      globalRules: globalRulesMarkdown,
      dictionary: dictionaryMarkdown,
      ...(() => {
        const ap = buildDesignSystemAppendixForPrd(
          designSystemSnapshot,
          designSystemLocked === true
        );
        return ap ? { designSystemAppendix: ap } : {};
      })(),
    },
    nodes: nodeData,
  };
  return generateFullPrdHtml(fullPrdData);
}

/** 节点最小结构：用于测试报告 / 系统设计说明 / 使用说明书导出 */
type NodeForExport = {
  id: string;
  data: {
    label?: string;
    artifacts?: {
      spec?: { title?: string; requirements?: string | string[] };
      test?: { cases?: string[] };
      impl?: { apiEndpoints?: string[]; dbSchema?: string };
    };
  };
};

/** 测试报告可选元数据（后续可在项目/导出配置中维护，用于预填章节） */
export interface TestReportMeta {
  /** 编写人、评审人、批准人及日期（文档控制） */
  author?: string;
  reviewer?: string;
  approver?: string;
  revisionHistory?: Array<{ version: string; date: string; author: string; description: string }>;
  distribution?: string;
  confidentiality?: string;
  /** 报告摘要 */
  conclusion?: '通过' | '有条件通过' | '不通过';
  topRisks?: string;
  releaseSuggestion?: string;
  /** 背景与目标 */
  testBackground?: string;
  testObjectives?: string;
  references?: string;
  /** 范围与对象 */
  outOfScope?: string;
  buildInfo?: string;
  /** 策略与方法 */
  testTypes?: string;
  entryExitCriteria?: string;
  /** 环境与配置 */
  environmentTopology?: string;
  testDataStrategy?: string;
  /** 执行概况（可自动汇总后覆盖） */
  testCycle?: string;
  /** 缺陷与风险（可粘贴或链接） */
  keyDefectsSummary?: string;
  knownIssues?: string;
  risksAndWaivers?: string;
  /** 结论与发布建议 */
  goLiveSuggestion?: string;
  releaseConditions?: string;
}

/**
 * 导出测试报告（标准 12 章结构，含测试用例列表，执行结果列为空）
 * 从各节点聚合 artifacts.test.cases；其余章节使用 meta 预填或占位。
 */
export async function exportTestReport(options: {
  projectMeta: { projectName: string; version?: string };
  nodes: NodeForExport[];
  meta?: TestReportMeta;
}): Promise<void> {
  const { projectMeta, nodes, meta = {} } = options;
  const dateStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  const version = projectMeta.version || 'V1.0';

  const rows: Array<{ page: string; case: string }> = [];
  const moduleNames: string[] = [];
  for (const node of nodes) {
    const cases = node.data?.artifacts?.test?.cases;
    const pageName = node.data?.artifacts?.spec?.title || node.data?.label || node.id || '未命名';
    if (!moduleNames.includes(pageName)) moduleNames.push(pageName);
    if (Array.isArray(cases) && cases.length > 0) {
      for (const c of cases) {
        rows.push({ page: pageName, case: c });
      }
    }
  }
  const totalCases = rows.length;
  const caseTableHeader = '| 序号 | 所属页面/模块 | 测试场景/步骤 | 预期结果 | 执行结果 | 备注 |';
  const caseTableSep = '|------|----------------|--------------|----------|----------|------|';
  const caseTableRows = rows.map((r, i) =>
    `| ${i + 1} | ${r.page} | ${(r.case || '').replace(/\|/g, '\\|').replace(/\n/g, ' ').slice(0, 200)} | （见用例） |  |  |`
  );
  const caseTable = [caseTableHeader, caseTableSep, ...caseTableRows].join('\n');
  const testObjectList = moduleNames.length > 0 ? moduleNames.map((m, i) => `${i + 1}. ${m}`).join('\n') : '（暂无，请在各节点维护测试用例后自动生成）';

  const revHistory = meta.revisionHistory?.length
    ? meta.revisionHistory.map(r => `| ${r.version} | ${r.date} | ${r.author} | ${r.description} |`).join('\n')
    : `| ${version} | ${dateStr} | （待填写） | 初稿 |`;
  const revTable = '| 版本 | 日期 | 修订人 | 修订说明 |\n|------|------|--------|----------|\n' + revHistory;

  const s1 = `## 1. 文档控制信息

| 项 | 内容 |
|----|------|
| 标题 | ${projectMeta.projectName} - 测试报告 |
| 项目/系统名称 | ${projectMeta.projectName} |
| 版本号 | ${version} |
| 编写人/日期 | ${meta.author ?? '（待填写）'} / ${dateStr} |
| 评审人/日期 | ${meta.reviewer ?? '（待填写）'} |
| 批准人/日期 | ${meta.approver ?? '（待填写）'} |
| 分发范围 | ${meta.distribution ?? '（待填写）'} |
| 保密级别 | ${meta.confidentiality ?? '（待填写）'} |

**文档修订记录**

${revTable}
`;

  const s2 = `## 2. 报告摘要（Executive Summary）

| 项 | 内容 |
|----|------|
| 测试结论 | ${meta.conclusion ?? '（待填写：通过/有条件通过/不通过）'} |
| 当前质量风险概览 | ${meta.topRisks ?? '（待填写：TOP 风险、影响范围）'} |
| 发布/上线建议与前置条件 | ${meta.releaseSuggestion ?? '（待填写：如必须修复的问题清单）'} |

**关键数据一页化**（可补充表格或要点）

- 测试用例总数：${totalCases}
- 覆盖模块/页面数：${moduleNames.length}
`;

  const s3 = `## 3. 背景与目标

- **测试背景**：${meta.testBackground ?? '（待填写：为何测、对应里程碑/发布）'}
- **测试目标**：${meta.testObjectives ?? '（待填写：验证什么、不验证什么）'}
- **参考依据**：${meta.references ?? '（待填写：需求文档、设计文档、标准、合同条款等）'}
`;

  const s4 = `## 4. 测试范围与对象

- **测试对象（模块/页面）**：
${testObjectList}

- **版本与构建信息**：${meta.buildInfo ?? '（待填写：Commit/Tag/Build ID）'}
- **覆盖范围**：功能点、业务流程、平台/终端等（待根据实际上报补充）
- **不在范围（Out of Scope）及原因**：${meta.outOfScope ?? '（待填写）'}
`;

  const s5 = `## 5. 测试策略与方法

- **测试类型**：${meta.testTypes ?? '（待填写：功能/回归/接口/兼容/性能/安全/可用性/可靠性等）'}
- **测试方法**：黑盒/白盒/探索式/风险驱动（待选定）
- **优先级与准入/准出标准（Entry/Exit Criteria）**：${meta.entryExitCriteria ?? '（待填写）'}
- **风险评估与测试重点**：（待按业务/技术风险排序）
`;

  const s6 = `## 6. 测试环境与配置

- **环境拓扑**：${meta.environmentTopology ?? '（待填写：DEV/UAT/Pre/Prod-like）'}
- **软硬件配置**：OS、DB、中间件、浏览器/机型（待填写）
- **依赖系统与外部接口**：模拟/真实、桩/Mock（待填写）
- **测试数据策略**：${meta.testDataStrategy ?? '（待填写：数据准备、脱敏、回收/清理）'}
- **环境问题与对测试的影响**：（待填写）
`;

  const s7 = `## 7. 测试执行概况

- **测试周期、人员投入、执行日历**：${meta.testCycle ?? '（待填写）'}
- **测试轮次**：第1轮/回归轮/补测轮（待填写）
- **测试用例执行统计**：

| 统计项 | 数量 |
|--------|------|
| 计划用例总数 | ${totalCases} |
| 已执行 | （待填写） |
| 通过 | （待填写） |
| 失败 | （待填写） |
| 阻塞 | （待填写） |
| 跳过 | （待填写） |

- **需求/用户故事覆盖率**：（若有，待填写）
`;

  const s8 = `## 8. 缺陷与问题分析

- **缺陷统计**：按严重级别、模块、原因、发现阶段（待填写或从缺陷系统导出）
- **缺陷趋势**：随时间的新增/关闭（待填写）
- **关键缺陷清单（Blocking/Critical）**：${meta.keyDefectsSummary ?? '（待填写：描述、影响、复现率、状态、责任人、计划修复版本）'}
- **根因分析（RCA）与过程改进建议**：（可选）
`;

  const s9 = `## 9. 质量度量与覆盖度（可选但推荐）

- **功能覆盖**：需求覆盖率、用例覆盖率（待填写）
- **代码质量**：单测覆盖率、静态扫描、圈复杂度（如纳入）（待填写）
- **性能指标**：响应时间、吞吐、资源利用率、容量边界（待填写）
- **稳定性指标**：Crash率、可用性、长稳运行结果（待填写）
- **安全结果**：漏洞扫描/渗透测试结论（如适用）（待填写）
`;

  const s10 = `## 10. 风险、遗留问题与豁免项

- **已知问题（Known Issues）与影响评估**：${meta.knownIssues ?? '（待填写）'}
- **风险清单**：风险等级、概率×影响、缓解措施（待填写）
- **豁免/延期项**：${meta.risksAndWaivers ?? '（待填写：谁批准、为何批准、补救计划）'}
`;

  const s11 = `## 11. 结论与发布建议

- **是否满足准出标准**：（逐条对照，待填写）
- **上线建议**：${meta.goLiveSuggestion ?? '（待填写：允许上线/需修复后上线/建议延期）'}
- **上线/发布门槛**：${meta.releaseConditions ?? '（待填写：必须满足条件）'}
- **回滚策略验证情况**：（若有，待填写）
`;

  const s12 = `## 12. 附录（证据与可追溯）

**测试用例清单**（执行结果列留空，供执行时填写）

${totalCases === 0 ? '（暂无测试用例，请在各节点「测试」中维护）' : caseTable}

**其他附录**（可后续追加）：
- 缺陷列表导出（ID、标题、严重级别、状态）
- 测试日志、截图、抓包、监控图、性能报告原始数据
- 需求-用例-缺陷追踪矩阵（RTM）
- 术语表与缩略语
`;

  const markdown = `# ${projectMeta.projectName} - 测试报告

**版本**：${version}  
**生成日期**：${dateStr}

---

${s1}

---

${s2}

---

${s3}

---

${s4}

---

${s5}

---

${s6}

---

${s7}

---

${s8}

---

${s9}

---

${s10}

---

${s11}

---

${s12}
`;

  const contentHtml = await marked.parse(markdown);
  const wordHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><style>${STYLES}</style></head>
<body>
<div class="doc-wrapper">
  <div style="text-align: center; margin-bottom: 48px;">
    <h1>${projectMeta.projectName} - 测试报告</h1>
    <p>版本：${version}</p>
    <p>生成日期：${dateStr}</p>
  </div>
  ${contentHtml}
</div>
</body>
</html>`;

  const buffer = await asBlob(wordHtml, { orientation: 'portrait' });
  const blob = buffer instanceof Blob
    ? buffer
    : new Blob([buffer as unknown as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  saveAs(blob, `${projectMeta.projectName}_测试报告.docx`);
}

/** 系统设计说明书可选元数据（用于预填各章，后续可在项目蓝图/导出配置中维护） */
export interface SystemDesignMeta {
  /** 1. 文档总览 */
  documentPurpose?: string;
  scopeAndBoundary?: string;
  targetReaders?: string;
  glossary?: string;
  references?: string;
  revisionHistory?: Array<{ version: string; date: string; author: string; description: string }>;
  /** 2. 背景与目标 */
  businessBackground?: string;
  buildGoals?: string;
  successMetrics?: string;
  constraints?: string;
  /** 3. 总体架构 */
  systemPositionAndBoundary?: string;
  architectureStyle?: string;
  keyTechChoices?: string;
  adrList?: string;
  /** 4. 业务与领域 */
  businessProcess?: string;
  domainModel?: string;
  rulesAndPolicies?: string;
  /** 5. 功能架构（不做清单可填） */
  outOfScopeFeatures?: string;
  /** 6. 数据架构 */
  dataClassification?: string;
  dataConsistency?: string;
  dataLifecycle?: string;
  dataMigration?: string;
  /** 7. 接口与集成 */
  apiOverview?: string;
  apiSpec?: string;
  callbackEventProtocol?: string;
  thirdPartyIntegration?: string;
  compatibilityStrategy?: string;
  /** 8. 关键非功能 */
  performanceCapacity?: string;
  highAvailability?: string;
  scalability?: string;
  reliability?: string;
  securityDesign?: string;
  compliancePrivacy?: string;
  observability?: string;
  costDesign?: string;
  /** 10. 缓存/搜索/异步 */
  cacheDesign?: string;
  messageQueueDesign?: string;
  /** 11. 部署与运维 */
  environmentPlan?: string;
  cicd?: string;
  configManagement?: string;
  monitoringAlert?: string;
  /** 12. 测试与验收 */
  testStrategy?: string;
  acceptanceCriteria?: string;
  /** 13. 风险与开放项 */
  riskList?: string;
  knownIssues?: string;
  openItems?: string;
}

const EMPTY_IMPL_MARKERS = ['-- 将在后续阶段生成', '-- PLACEHOLDER', '-- 暂无数据库需求', '-- 待生成', ''];

function isMeaningfulDbSchema(db: string | undefined): boolean {
  const t = (db ?? '').trim();
  return t.length > 0 && !EMPTY_IMPL_MARKERS.includes(t);
}

/**
 * 导出系统设计说明书（标准 14 章 + 附录）
 * 从各节点聚合 artifacts.impl（apiEndpoints、dbSchema）填入第 5/6/7/9 章及附录 D；其余章节使用 meta 预填或占位。
 */
export async function exportSystemDesignDoc(options: {
  projectMeta: { projectName: string; version?: string };
  nodes: NodeForExport[];
  meta?: SystemDesignMeta;
}): Promise<void> {
  const { projectMeta, nodes, meta = {} } = options;
  const dateStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  const version = projectMeta.version || 'V1.0';

  const modules: Array<{ name: string; apis: string[]; dbSchema: string }> = [];
  const allApis: string[] = [];
  for (const node of nodes) {
    const impl = node.data?.artifacts?.impl;
    const name = (node.data?.artifacts?.spec as { title?: string } | undefined)?.title || node.data?.label || node.id || '未命名';
    const apis = impl?.apiEndpoints?.filter(Boolean) ?? [];
    const db = (impl?.dbSchema ?? '').trim();
    const dbSchema = isMeaningfulDbSchema(db) ? db : '';
    modules.push({ name, apis, dbSchema });
    allApis.push(...apis);
  }
  const moduleList = modules.map((m, i) => `${i + 1}. ${m.name}`).join('\n');
  const revRows = meta.revisionHistory?.length
    ? meta.revisionHistory.map(r => `| ${r.version} | ${r.date} | ${r.author} | ${r.description} |`).join('\n')
    : `| ${version} | ${dateStr} | （待填写） | 初稿 |`;
  const revTable = '| 版本 | 日期 | 修订人 | 修订说明 |\n|------|------|--------|----------|\n' + revRows;

  const s1 = `## 1. 文档总览

### 1.1 文档目的
${meta.documentPurpose ?? '（待填写：本说明书用于描述系统架构、接口、数据与关键非功能设计，供研发/测试/运维及评审使用。）'}

### 1.2 适用范围（系统边界/业务范围）
${meta.scopeAndBoundary ?? '（待填写）'}

### 1.3 读者对象（业务/研发/测试/运维/安全/审计）
${meta.targetReaders ?? '（待填写）'}

### 1.4 术语与缩写（Glossary）
${meta.glossary ?? '（待填写）'}

### 1.5 参考资料（需求文档、架构规范、接口规范、法规标准）
${meta.references ?? '（待填写）'}

### 1.6 文档版本记录（变更历史、评审记录）
${revTable}
`;

  const s2 = `## 2. 背景与目标

### 2.1 业务背景与痛点
${meta.businessBackground ?? projectMeta.projectName + ' 相关业务背景与痛点（待补充）'}

### 2.2 建设目标（业务目标、技术目标、合规目标）
${meta.buildGoals ?? '（待填写）'}

### 2.3 成功指标（SLA/SLO、吞吐、延迟、成本、交付周期等）
${meta.successMetrics ?? '（待填写）'}

### 2.4 约束条件（时间、预算、资源、技术栈、合规、数据出境等）
${meta.constraints ?? '（待填写）'}
`;

  const s3 = `## 3. 总体架构设计

### 3.1 系统定位与边界（上下游系统、外部依赖）
${meta.systemPositionAndBoundary ?? '（待填写）'}

### 3.2 架构风格与原则（分层、DDD、微服务、事件驱动等）
${meta.architectureStyle ?? '（待填写）'}

### 3.3 总体架构图（逻辑架构/物理架构/部署架构）
（待补充：可插入架构图或引用附录 A）

### 3.4 关键技术选型与理由（语言、框架、中间件、云服务）
${meta.keyTechChoices ?? '（待填写）'}

### 3.5 核心设计决策与权衡（ADR 列表）
${meta.adrList ?? '（待填写，可引用附录 E）'}
`;

  const s4 = `## 4. 业务与领域设计

### 4.1 业务流程（主流程/异常流程）
${meta.businessProcess ?? '（待填写）'}

### 4.2 领域模型（领域对象、聚合、实体、值对象）
${meta.domainModel ?? '（待填写）'}

### 4.3 用例/场景（用户旅程、权限角色）
（可参考 PRD/需求规格说明书中的用例与角色）

### 4.4 规则与策略（计费、风控、审批、状态机等）
${meta.rulesAndPolicies ?? '（待填写）'}
`;

  const s5 = `## 5. 功能架构与模块设计

### 5.1 功能清单与范围（含不做清单）
- **在范围（模块/页面）**：
${moduleList.length > 0 ? moduleList : '（暂无，请在各节点维护后自动生成）'}
- **不做清单**：${meta.outOfScopeFeatures ?? '（待填写）'}

### 5.2 模块划分与职责边界
当前按页面/功能模块划分，见下表（由画布节点自动汇总）：

| 序号 | 模块/页面 | 主要接口数 | 是否有数据模型 |
|------|-----------|------------|----------------|
${modules.map((m, i) => `| ${i + 1} | ${m.name} | ${m.apis.length} | ${m.dbSchema ? '是' : '否'} |`).join('\n')}

### 5.3 模块交互关系（调用链/事件流）
（待补充：可结合架构图与第 7 章接口说明）

### 5.4 关键页面/关键接口的业务逻辑说明（如适用）
（见第 9 章按模块详细设计及第 7 章接口明细）
`;

  const dataSections: string[] = [];
  for (const m of modules) {
    if (!m.dbSchema) continue;
    dataSections.push(`#### ${m.name}\n\`\`\`\n${m.dbSchema}\n\`\`\``);
  }
  const s6 = `## 6. 数据架构设计

### 6.1 数据分类分级（敏感数据、PII、密级）
${meta.dataClassification ?? '（待填写）'}

### 6.2 概念模型/逻辑模型/物理模型
（待填写或引用下图/附录）

### 6.3 核心表结构说明（字段、索引、分区、约束）
以下按模块/页面汇总自各节点「实现」中的数据库设计（dbSchema），可后续细化字段与索引。

${dataSections.length > 0 ? dataSections.join('\n\n') : '（暂无，请在各节点「实现」中维护 dbSchema）'}

### 6.4 数据一致性策略（强一致/最终一致、幂等）
${meta.dataConsistency ?? '（待填写）'}

### 6.5 数据生命周期（采集/存储/归档/删除）
${meta.dataLifecycle ?? '（待填写）'}

### 6.6 数据迁移与初始化方案
${meta.dataMigration ?? '（待填写）'}

### 6.7 主数据/字典/编码规范（如适用）
（待填写）
`;
  const s7 = `## 7. 接口与集成设计

### 7.1 接口总览（内部/外部、同步/异步）
${meta.apiOverview ?? '（待填写）'}  
以下接口清单由各节点「实现」中的 apiEndpoints 自动汇总，共 ${allApis.length} 个。

### 7.2 API 规范（REST/gRPC、命名、版本、错误码）
${meta.apiSpec ?? '（待填写）'}

### 7.3 关键接口明细（入参/出参/示例/校验/权限）
| 序号 | 所属模块 | 接口 |
|------|----------|------|
${((): string => { let idx = 0; const rows = modules.flatMap(m => m.apis.map(a => `| ${++idx} | ${m.name} | \`${a}\` |`)); return rows.length === 0 ? '| - | - | （暂无，请在各节点「实现」中维护 apiEndpoints） |' : rows.join('\n'); })()}

（入参/出参/示例/校验/权限待在附录 D 或接口文档中补充）

### 7.4 回调/事件/消息协议（Topic、Schema、顺序、重试）
${meta.callbackEventProtocol ?? '（待填写）'}

### 7.5 第三方系统集成（认证、限流、容灾、对账）
${meta.thirdPartyIntegration ?? '（待填写）'}

### 7.6 兼容性与演进策略（向后兼容、灰度）
${meta.compatibilityStrategy ?? '（待填写）'}
`;
  const s8 = `## 8. 关键非功能设计

### 8.1 性能与容量规划（QPS、并发、峰值、压测目标）
${meta.performanceCapacity ?? '（待填写）'}

### 8.2 高可用与容灾（多活/主备、RTO/RPO、故障切换）
${meta.highAvailability ?? '（待填写）'}

### 8.3 可扩展性（水平扩展、分片、无状态化）
${meta.scalability ?? '（待填写）'}

### 8.4 可靠性（重试、超时、熔断、降级、限流、幂等）
${meta.reliability ?? '（待填写）'}

### 8.5 安全设计（认证鉴权、密钥、加密、审计、零信任）
${meta.securityDesign ?? '（待填写）'}

### 8.6 合规与隐私（等保、ISO、GDPR/个保法、数据出境）
${meta.compliancePrivacy ?? '（待填写）'}

### 8.7 可维护性（代码规范、模块化、配置化）
（待填写）

### 8.8 可观测性（日志/指标/链路追踪、告警）
${meta.observability ?? '（待填写）'}

### 8.9 成本设计（资源规格、存储/带宽、成本估算）
${meta.costDesign ?? '（待填写）'}
`;
  const s9Parts: string[] = [];
  modules.forEach((m, i) => {
    if (m.apis.length === 0 && !m.dbSchema) return;
    s9Parts.push(`### 9.${i + 1} ${m.name}

#### 9.${i + 1}.1 职责与边界
（待填写）

#### 9.${i + 1}.2 主要接口（API/事件）
${m.apis.length > 0 ? m.apis.map((a, j) => `${j + 1}. \`${a}\``).join('\n') : '（无）'}

#### 9.${i + 1}.3 核心流程与时序图
（待填写）

#### 9.${i + 1}.4 数据模型与存储访问
${m.dbSchema ? '```\n' + m.dbSchema + '\n```' : '（无）'}

#### 9.${i + 1}.5 关键算法/规则/状态机
（待填写）

#### 9.${i + 1}.6 异常处理与错误码
（待填写）

#### 9.${i + 1}.7 安全与权限点
（待填写）

#### 9.${i + 1}.8 性能要点与缓存策略
（待填写）

#### 9.${i + 1}.9 配置项与开关（Feature Flag）
（待填写）

#### 9.${i + 1}.10 依赖项与风险点
（待填写）
`);
  });
  const s9 = `## 9. 应用与服务详细设计（按服务/模块展开）

${s9Parts.length > 0 ? s9Parts.join('\n') : '（暂无模块级设计，请在各节点「实现」中维护 API 与 dbSchema 后自动生成本章节骨架）'}
`;
  const s10 = `## 10. 缓存、搜索与异步化设计（如适用）

### 10.1 缓存模型（读写策略、TTL、淘汰、一致性）
${meta.cacheDesign ?? '（待填写）'}

### 10.2 分布式锁/并发控制
（待填写）

### 10.3 搜索索引（mapping、增量/全量、延迟）
（待填写）

### 10.4 消息队列/事件总线（消费组、顺序、死信、补偿）
${meta.messageQueueDesign ?? '（待填写）'}
`;
  const s11 = `## 11. 部署与运维设计

### 11.1 环境规划（DEV/UAT/PROD，网络、域名）
${meta.environmentPlan ?? '（待填写）'}

### 11.2 CI/CD（构建、发布、回滚、灰度、蓝绿）
${meta.cicd ?? '（待填写）'}

### 11.3 配置管理（配置中心、密钥管理、参数化）
${meta.configManagement ?? '（待填写）'}

### 11.4 运行时依赖（中间件、云资源清单）
（待填写）

### 11.5 监控与告警策略（阈值、分级、值班）
${meta.monitoringAlert ?? '（待填写）'}

### 11.6 运维手册要点（常见故障、排障路径、SOP）
（待填写）
`;
  const s12 = `## 12. 测试与验收设计

### 12.1 测试范围与策略（单测/集成/回归/性能/安全）
${meta.testStrategy ?? '（待填写）'}

### 12.2 测试数据与Mock策略
（待填写）

### 12.3 性能压测方案（场景、指标、工具、报告模板）
（待填写）

### 12.4 安全测试（渗透、基线、漏洞修复流程）
（待填写）

### 12.5 验收标准与交付物清单
${meta.acceptanceCriteria ?? '（待填写）'}
`;
  const s13 = `## 13. 风险、问题与开放项

### 13.1 风险清单（技术/进度/依赖/合规）
${meta.riskList ?? '（待填写）'}

### 13.2 缓解措施与Owner
（待填写）

### 13.3 已知问题与限制（Known Issues）
${meta.knownIssues ?? '（待填写）'}

### 13.4 开放项与后续规划（Roadmap）
${meta.openItems ?? '（待填写）'}
`;
  const s14 = `## 14. 附录

**A. 架构图/时序图/ER图清单**  
（待补充）

**B. 错误码总表**  
（待补充）

**C. 配置项总表**  
（待补充）

**D. 接口样例与字段字典**  
以下为各模块 API 列表（来自画布节点 impl.apiEndpoints），明细入参/出参可后续在接口文档中补充。

${allApis.length === 0 ? '（暂无）' : allApis.map((a, i) => `${i + 1}. \`${a}\``).join('\n')}

**E. 关键决策记录（ADR）**  
（待补充）
`;

  const markdown = `# ${projectMeta.projectName} - 系统设计说明书

**版本**：${version}  
**生成日期**：${dateStr}

---

${s1}

---

${s2}

---

${s3}

---

${s4}

---

${s5}

---

${s6}

---

${s7}

---

${s8}

---

${s9}

---

${s10}

---

${s11}

---

${s12}

---

${s13}

---

${s14}
`;

  const contentHtml = await marked.parse(markdown);
  const wordHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><style>${STYLES}</style></head>
<body>
<div class="doc-wrapper">
  <div style="text-align: center; margin-bottom: 48px;">
    <h1>${projectMeta.projectName} - 系统设计说明书</h1>
    <p>版本：${version}</p>
    <p>生成日期：${dateStr}</p>
  </div>
  ${contentHtml}
</div>
</body>
</html>`;

  const buffer = await asBlob(wordHtml, { orientation: 'portrait' });
  const blob = buffer instanceof Blob
    ? buffer
    : new Blob([buffer as unknown as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  saveAs(blob, `${projectMeta.projectName}_系统设计说明书.docx`);
}

/** 使用说明书可选元数据（用于预填章节，后续可在项目蓝图/导出配置中维护） */
export interface UserManualMeta {
  /** 文档总览 */
  documentPurpose?: string;
  scopeAndReaders?: string;
  revisionHistory?: Array<{ version: string; date: string; description: string }>;
  /** 快速入门 */
  gettingStarted?: string;
  accessAndLogin?: string;
  /** 常见问题 */
  faq?: string;
  /** 附录（术语表、快捷操作等） */
  appendix?: string;
}

/**
 * 导出使用说明书（标准结构：总览、快速入门、按页面功能说明、常见问题、附录）
 * 从各节点聚合 spec（title、requirements）作为功能概述；其余章节使用 meta 预填或占位。
 */
export async function exportUserManual(options: {
  projectMeta: { projectName: string; version?: string };
  nodes: NodeForExport[];
  meta?: UserManualMeta;
}): Promise<void> {
  const { projectMeta, nodes, meta = {} } = options;
  const dateStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  const version = projectMeta.version || 'V1.0';

  const revRows = meta.revisionHistory?.length
    ? meta.revisionHistory.map(r => `| ${r.version} | ${r.date} | ${r.description} |`).join('\n')
    : `| ${version} | ${dateStr} | 初稿 |`;
  const revTable = '| 版本 | 日期 | 修订说明 |\n|------|------|----------|\n' + revRows;

  const s1 = `## 1. 文档总览

### 1.1 文档目的
${meta.documentPurpose ?? `本文档为「${projectMeta.projectName}」的使用说明书，面向最终用户，说明系统功能与操作步骤。`}

### 1.2 适用范围与读者
${meta.scopeAndReaders ?? '（待填写：适用系统/模块、目标读者）'}

### 1.3 文档版本记录
${revTable}
`;

  const s2 = `## 2. 快速入门 / 使用前准备

### 2.1 访问与登录
${meta.accessAndLogin ?? '（待填写：系统访问地址、登录方式、账号权限说明）'}

### 2.2 使用前准备
${meta.gettingStarted ?? '（待填写：浏览器要求、前置条件、首次使用指引等）'}
`;

  const featureSections: string[] = [];
  nodes.forEach((node, i) => {
    const title = node.data?.artifacts?.spec?.title || node.data?.label || node.id || '未命名';
    const req = node.data?.artifacts?.spec?.requirements;
    const overview = req != null
      ? (Array.isArray(req) ? req.join('\n') : req)
      : '（请在各节点「需求」中补充本页功能说明，导出时将自动带入此处）';
    featureSections.push(`### 3.${i + 1} ${title}

**功能概述**

${overview}

**操作说明**

（待补充：操作步骤、截图与注意事项，或从 PRD/需求文档整理后粘贴）
`);
  });

  const s3 = `## 3. 功能说明（按页面/模块）

${featureSections.length > 0 ? featureSections.join('\n') : '（暂无页面/模块，请先在画布中创建节点并维护「需求」后重新导出）'}
`;

  const s4 = `## 4. 常见问题（FAQ）

${meta.faq ?? '（待填写：常见问题与解答，如登录失败、权限不足、操作异常等）'}
`;

  const s5 = `## 5. 附录

${meta.appendix ?? '（待填写：术语表、快捷操作、联系支持等）'}
`;

  const markdown = `# ${projectMeta.projectName} - 使用说明书

**版本**：${version}  
**生成日期**：${dateStr}

---

${s1}

---

${s2}

---

${s3}

---

${s4}

---

${s5}
`;

  const contentHtml = await marked.parse(markdown);
  const wordHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><style>${STYLES}</style></head>
<body>
<div class="doc-wrapper">
  <div style="text-align: center; margin-bottom: 48px;">
    <h1>${projectMeta.projectName} - 使用说明书</h1>
    <p>版本：${version}</p>
    <p>生成日期：${dateStr}</p>
  </div>
  ${contentHtml}
</div>
</body>
</html>`;

  const buffer = await asBlob(wordHtml, { orientation: 'portrait' });
  const blob = buffer instanceof Blob
    ? buffer
    : new Blob([buffer as unknown as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  saveAs(blob, `${projectMeta.projectName}_使用说明书.docx`);
}
