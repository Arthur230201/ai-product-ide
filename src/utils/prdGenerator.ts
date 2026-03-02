import { marked } from 'marked';
import { saveAs } from 'file-saver';
import { asBlob } from 'html-docx-js-typescript';
import type { ProjectMeta, GlobalRules } from '@/types/fractal';
import type { FractalNode } from '@/types/fractal';
import type { Edge } from 'reactflow';
import { extractBodyContent, extractStylesFromHtml, isHtmlCode } from './html-body-extractor';

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
  uiCode?: string;        // React 组件代码或 HTML（含 style+body，用于界面示意）
  isHtml?: boolean;       // 为 true 时用 innerHTML 渲染，避免当 React 导致空白
  nodeId?: string;        // 节点唯一标识符（用于生成挂载点 ID）
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
    <!-- React Runtime -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
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
        .device-sandbox { position: relative; width: 100%; min-height: 400px; height: 100%; overflow: hidden; border-radius: 1rem; border: 2px solid #e2e8f0; background: #fff; }
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
            <a href="#ch3" class="block px-4 py-2 hover:bg-slate-800 rounded">3. 系统架构</a>
            <a href="#ch4" class="block px-4 py-2 hover:bg-slate-800 rounded">4. 业务流程</a>
            <a href="#ch5" class="block px-4 py-2 hover:bg-slate-800 rounded">5. 功能详述</a>
            ${data.nodes.map((n, i) => {
                const nodeNum = `5.${i+1}`;
                let sectionIdx = 1;
                // 构建三级菜单项（sections）
                let tempSectionIdx = 1;
                const sectionsMenu = n.sections && n.sections.length > 0
                    ? n.sections.map((section, secIdx) => {
                        const secNum = `${nodeNum}.${tempSectionIdx++}`;
                        return `<a href="#node-${i}-section-${tempSectionIdx - 1}" class="block px-4 py-1 hover:bg-slate-800 rounded truncate pl-10 text-xs text-slate-400 transition-colors">${secNum} ${section.title}</a>`;
                    }).join('')
                    : '';
                // 更新 sectionIdx 以便用户故事使用正确的编号
                sectionIdx = tempSectionIdx;
                // 构建用户故事菜单项（如果有）
                const userStoriesMenu = n.userStories && n.userStories.length > 0
                    ? n.userStories.map((story, storyIdx) => {
                        const storyNum = `${nodeNum}.${sectionIdx++}`;
                        return `<a href="#node-${i}-story-${storyIdx}" class="block px-4 py-1 hover:bg-slate-800 rounded truncate pl-10 text-xs text-slate-400 transition-colors">${storyNum} ${story.id || `US-${storyIdx + 1}`}</a>`;
                    }).join('')
                    : '';
                return `
                    <div class="space-y-0.5">
                        <a href="#node-${i}" class="block px-4 py-1.5 hover:bg-slate-800 rounded truncate pl-6 text-xs font-medium text-slate-300 transition-colors">${nodeNum} ${n.title}</a>
                        ${sectionsMenu}
                        ${userStoriesMenu}
                    </div>
                `;
            }).join('')}
        </nav>
    </aside>

    <main class="main-content">
        <div class="max-w-5xl mx-auto p-12">
            
            <section id="version-control" class="mb-16">
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

            <section id="ch1" class="mb-20 scroll-mt-10">
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

            <section id="ch2" class="mb-20 scroll-mt-10">
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
            </section>

            <section id="ch3" class="mb-20 scroll-mt-10">
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

            <section id="ch4" class="mb-20 scroll-mt-10">
                <h1>第 4 章：业务流程</h1>
                
                <h3>4.1 核心业务泳道图</h3>
                <div class="overflow-x-auto border rounded-xl p-6 bg-white shadow-sm">
                    <div class="mermaid flex justify-center min-w-[800px]">
                        ${data.charts.swimlane || 'graph TD; A[暂无泳道图]'}
                    </div>
                </div>
            </section>

            <section id="ch5" class="mb-32 scroll-mt-10">
                <h1>第 5 章：功能详述</h1>
                <p class="text-gray-500 mb-8">本章节包含各个页面的 UI 原型图及详细的功能需求说明。</p>

                ${data.nodes.map((node, nodeIdx) => {
                  // Automatic Numbering: Chapter 5, Node level (5.1, 5.2, ...)
                  const nodeNum = `5.${nodeIdx + 1}`;
                  
                  // Ensure UI preview exists
                  const uiPreview = node.uiPreview || '';
                  const hasUIPreview = uiPreview && uiPreview.length > 0;
                  
                  // Section counter for this page (starts at 1 for UI preview)
                  let sectionIdx = 1;
                  
                  // Build sections HTML
                  const sectionsHtml = node.sections && node.sections.length > 0
                    ? node.sections.map((section, secIdx) => {
                        const currentSectionIdx = sectionIdx;
                        const secNum = `${nodeNum}.${sectionIdx++}`;
                        const parsedContent = marked.parse(section.content || '（暂无内容）') as string;
                        
                        if (section.type === 'table') {
                          return `
                            <div id="node-${nodeIdx}-section-${secIdx - 1}" class="mb-6 scroll-mt-20">
                                <h3>${secNum} ${section.title}</h3>
                                <div class="overflow-x-auto">
                                    ${parsedContent}
                                </div>
                            </div>
                          `;
                        } else {
                          // Text/Markdown content with logic-block styling
                          // 尝试解析内容中的三级标题
                          let contentWithH4 = parsedContent;
                          // 如果内容包含列表项，可以将其转换为三级标题
                          if (typeof parsedContent === 'string' && (parsedContent.includes('<li>') || parsedContent.includes('<ul>'))) {
                            // 保持原样，但添加 id 用于锚点
                          }
                          return `
                            <div id="node-${nodeIdx}-section-${secIdx - 1}" class="mb-6 scroll-mt-20">
                                <h3>${secNum} ${section.title}</h3>
                                <div class="logic-block bg-slate-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                                    ${contentWithH4}
                                </div>
                            </div>
                          `;
                        }
                      }).join('')
                    : `
                      <div class="mb-6">
                          <h3>${nodeNum}.${sectionIdx++} 功能需求说明</h3>
                          <div class="logic-block bg-slate-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                              <p class="text-slate-500 italic">（暂无功能需求说明）</p>
                          </div>
                      </div>
                    `;
                  
                  // Build User Story Cards - 用户故事模型（核心）
                  const userStoriesHtml = node.userStories && node.userStories.length > 0
                    ? node.userStories.map((story, storyIdx) => {
                        const storyNum = `${nodeNum}.${sectionIdx++}`;
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
                      }).join('')
                    : '';
                  
                  return `
                <div id="node-${nodeIdx}" class="mb-24 pt-8 border-t border-slate-200 scroll-mt-20">
                    <!-- Page Title (H2) -->
                    <h2>${nodeNum} ${node.title || `功能模块 ${nodeIdx + 1}`}</h2>
                    
                    <div class="grid grid-cols-12 gap-8 items-start">
                        <!-- Left Column: UI Preview (Sticky) -->
                        <div class="col-span-4">
                            <div class="sticky-ui">
                                <h3>${nodeNum}.${sectionIdx++} 界面示意</h3>
                                ${node.uiCode ? `
                                <!-- React 交互式 UI 容器 -->
                                <div class="phone-mockup bg-white" style="min-height: 400px;">
                                    <div id="root-${node.nodeId || `node-${nodeIdx}`}" style="width: 100%; min-height: 400px;"></div>
                                </div>
                                <p class="text-center text-xs text-slate-500 mt-3 font-mono">图 ${nodeNum}.${sectionIdx - 1} 交互式 UI 原型</p>
                                ` : hasUIPreview ? `
                                <div class="phone-mockup bg-white">
                                    <img 
                                        src="${uiPreview}" 
                                        class="w-full h-auto block" 
                                        alt="UI Preview - ${node.title || `功能模块 ${nodeIdx + 1}`}"
                                        onclick="openLightbox('${uiPreview}')"
                                        style="cursor: zoom-in;"
                                    />
                                </div>
                                <p class="text-center text-xs text-slate-500 mt-3 font-mono">图 ${nodeNum}.${sectionIdx - 1} UI 示意（点击放大）</p>
                                ` : `
                                <div class="phone-mockup bg-slate-50 flex items-center justify-center" style="min-height: 400px;">
                                    <div class="text-center text-slate-400">
                                        <div class="text-4xl mb-2">📱</div>
                                        <p class="text-sm">暂无 UI 预览</p>
                                    </div>
                                </div>
                                <p class="text-center text-xs text-slate-400 mt-3">图 ${nodeNum}.${sectionIdx - 1} UI 示意（待生成）</p>
                                `}
                            </div>
                        </div>

                        <!-- Right Column: Requirement Sections -->
                        <div class="col-span-8">
                            <div class="markdown-body text-sm bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                                <div class="p-6">
                                    ${sectionsHtml}
                                    ${userStoriesHtml}
                                </div>
                            </div>
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

        // Sidebar Smooth Scroll
        document.querySelectorAll('nav a').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const target = document.querySelector(targetId);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                });
                }
            });
        });

        // Highlight active section in sidebar on scroll
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('nav a[href^="#"]');
        
        function updateActiveNav() {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.getBoundingClientRect().top;
                if (sectionTop <= 100) {
                    current = section.getAttribute('id') || '';
                }
            });
            
            navLinks.forEach(link => {
                link.classList.remove('bg-slate-800', 'text-white');
                link.classList.add('text-slate-400');
                if (link.getAttribute('href') === '#' + current) {
                    link.classList.add('bg-slate-800', 'text-white');
                    link.classList.remove('text-slate-400');
                }
            });
        }
        
        window.addEventListener('scroll', updateActiveNav);
        updateActiveNav(); // Initial call

        // ============================================================================
        // React Component Mounting Logic
        // ============================================================================
        
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

        // Mount React components
        function mountComponents() {
          console.log('🔧 [mountComponents] Starting component mounting...');
          
          const nodesWithCode = ${JSON.stringify(
            data.nodes
              .filter((node) => node.uiCode)
              .map((node, idx) => ({
                nodeId: node.nodeId || `node-${idx}`,
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
              
              // Step 1: Remove TypeScript type definitions and annotations (Babel can't handle TS)
              // Remove type definitions using a more robust approach that handles multi-line and nested braces
              // First, remove simple single-line type definitions: type X = Y;
              componentCode = componentCode.replace(/^\s*type\s+\w+\s*=\s*[^;{]+;?\s*$/gm, '');
              
              // Then, remove multi-line type definitions: type X = { ... } (handles nested braces)
              // This regex matches: type NAME = { ... } where ... can contain nested braces
              let typeRegex = /^\s*type\s+\w+\s*=\s*\{/gm;
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
                  let lineEnd = componentCode.indexOf('\n', start);
                  if (lineEnd === -1) lineEnd = componentCode.length;
                  componentCode = componentCode.substring(0, start) + componentCode.substring(lineEnd);
                }
                
                // Reset regex lastIndex to avoid infinite loop
                typeRegex.lastIndex = start;
              }
              
              // Remove interface definitions: interface X { ... }
              componentCode = componentCode.replace(/^\s*interface\s+\w+[^{]*\{[^}]*\}\s*;?\s*$/gm, '');
              // Remove type annotations from variables: const x: Type = ...
              componentCode = componentCode.replace(/:\s*[A-Z][a-zA-Z0-9<>\[\]|&\s,]*(\s*=\s*)/g, '$1');
              // Remove type annotations from function parameters: (x: Type) => ...
              componentCode = componentCode.replace(/\(([^)]*)\)/g, function(match, params) {
                return '(' + params.replace(/:\s*[A-Z][a-zA-Z0-9<>\[\]|&\s,]*/g, '').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '') + ')';
              });
              // Remove generic type parameters: <T> or <T extends ...>
              componentCode = componentCode.replace(/<[A-Z][a-zA-Z0-9<>\[\]|&\s,=.]*>/g, '');
              // Remove 'as' type assertions: x as Type
              componentCode = componentCode.replace(/\s+as\s+[A-Z][a-zA-Z0-9<>\[\]|&\s,]*/g, '');
              // Remove import type statements: import type { ... } from ...
              componentCode = componentCode.replace(/import\s+type\s+[^;]+;?\s*/g, '');
              
              // Step 2: Remove Markdown code blocks if present
              const backtick = String.fromCharCode(96);
              componentCode = componentCode.replace(new RegExp(backtick + backtick + backtick + 'tsx|' + backtick + backtick + backtick + 'jsx|' + backtick + backtick + backtick + 'javascript|' + backtick + backtick + backtick + 'typescript|' + backtick + backtick + backtick, 'g'), '').trim();
              
              // Step 3: Remove export statements
              componentCode = componentCode.replace(/^export\s+.*?;?\s*$/gm, '');
              componentCode = componentCode.replace(/export\s+default\s+/g, '');
              
              // Step 4: Remove import statements (we'll handle dependencies separately if needed)
              componentCode = componentCode.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
              
              // Step 5: Replace function App with const App_[safeId] = () => {
              const safeId = nodeData.nodeId.replace(/[^a-zA-Z0-9]/g, '_');
              const componentName = 'App_' + safeId;
              
              // Handle different component definition patterns
              componentCode = componentCode.replace(
                /(?:export\s+(?:default\s+)?)?(?:async\s+)?(?:function\s+App|const\s+App\s*=\s*\(.*?\)\s*=>|export\s+default\s+function\s+App)\s*(?:\(\))?\s*\{/g,
                'const ' + componentName + ' = () => {'
              );

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

              // Create component function
              console.log('🏭 [mountComponents] Creating component function...');
              const componentFn = new Function('React', 'ReactDOM', 
                transformedCode + '\\nreturn ' + componentName + ';'
              );

              console.log('🎨 [mountComponents] Executing component function...');
              const Component = componentFn(window.React, window.ReactDOM);
              
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
  architectureImage?: string; // Base64 架构拓扑图
  topologyImage?: string; // Base64 或 Mermaid 交互拓扑图
  swimlaneChart?: string; // Mermaid 业务泳道图
  dataDictionary?: string; // Markdown 数据字典
}) => {
  const { projectMeta, globalRules, nodes, edges = [], architectureImage, topologyImage, swimlaneChart, dataDictionary } = options;

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
  const nodeData: PageNode[] = nodes.map((node) => {
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
    const uiPreview = view?.previewUrl || (uiCode ?
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5peg5Zu+54mH5pyN5YqhPC90ZXh0Pjwvc3ZnPg==' :
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5peg5Zu+54mH5pyN5YqhPC90ZXh0Pjwvc3ZnPg==');
    
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

    return {
      title: spec?.title || node.data.label || '未命名页面',
      uiPreview,
      uiCode,
      isHtml: !!rawHtml,
      nodeId: (node as any).id || (node.data as any).id || node.data.label || 'node',
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
}): Promise<string> {
  const { projectMeta, globalRules, nodes, edges = [], architectureImage, topologyImage, swimlaneChart, dataDictionary } = options;
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

  const nodeData: PageNode[] = nodes.map((node) => {
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
    const uiPreview = view?.previewUrl || (uiCode ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5peg5Zu+54mH5pyN5YqhPC90ZXh0Pjwvc3ZnPg==' : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5peg5Zu+54mH5pyN5YqhPC90ZXh0Pjwvc3ZnPg==');
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
    return {
      title: spec?.title || node.data?.label || '未命名页面',
      uiPreview,
      uiCode,
      isHtml: !!rawHtml,
      nodeId: (node as any).id || (node.data as any).id || node.data?.label || 'node',
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
    docs: { globalRules: globalRulesMarkdown, dictionary: dictionaryMarkdown },
    nodes: nodeData,
  };
  return generateFullPrdHtml(fullPrdData);
}
