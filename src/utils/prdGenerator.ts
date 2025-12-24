import { marked } from 'marked';
import { saveAs } from 'file-saver';
import { asBlob } from 'html-docx-js-typescript';
import type { ProjectMeta, GlobalRules } from '@/types/fractal';
import type { FractalNode } from '@/types/fractal';
import type { Edge } from 'reactflow';

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
        
        /* Typography & Tables */
        h1 { color: #0f172a; font-weight: 800; }
        h2 { 
            color: #1e293b; 
            font-weight: 700; 
            font-size: 1.75rem;
            margin-top: 2rem; 
            margin-bottom: 1rem; 
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #cbd5e1;
        }
        h3 { 
            color: #475569; 
            font-weight: 600; 
            font-size: 1.125rem;
            margin-top: 1.5rem; 
            margin-bottom: 0.75rem; 
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
            <div class="px-4 pt-4 pb-2 text-xs font-bold uppercase tracking-wider text-slate-600">5. 功能详述</div>
            ${data.nodes.map((n, i) => 
                `<a href="#node-${i}" class="block px-4 py-1.5 hover:bg-slate-800 rounded truncate pl-6 text-xs">5.${i+1} ${n.title}</a>`
            ).join('')}
        </nav>
    </aside>

    <main class="main-content">
        <div class="max-w-5xl mx-auto p-12">
            
            <section id="version-control" class="mb-16">
                <div class="bg-slate-50 rounded-xl border p-6">
                    <h2 style="margin-top:0; border:none; padding:0;">📝 文档版本记录</h2>
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
                    ? node.sections.map((section) => {
                        const secNum = `${nodeNum}.${sectionIdx++}`;
                        const parsedContent = marked.parse(section.content || '（暂无内容）');
                        
                        if (section.type === 'table') {
                          return `
                            <div class="mb-6">
                                <h3 class="text-lg font-semibold text-slate-800 mb-3 pb-2 border-b border-slate-200">${secNum} ${section.title}</h3>
                                <div class="overflow-x-auto">
                                    ${parsedContent}
                                </div>
                            </div>
                          `;
                        } else {
                          // Text/Markdown content with logic-block styling
                          return `
                            <div class="mb-6">
                                <h3 class="text-lg font-semibold text-slate-800 mb-3 pb-2 border-b border-slate-200">${secNum} ${section.title}</h3>
                                <div class="logic-block bg-slate-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                                    ${parsedContent}
                                </div>
                            </div>
                          `;
                        }
                      }).join('')
                    : `
                      <div class="mb-6">
                          <h3 class="text-lg font-semibold text-slate-800 mb-3 pb-2 border-b border-slate-200">${nodeNum}.${sectionIdx++} 功能需求说明</h3>
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
                          <div class="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500 shadow-sm">
                              <div class="flex items-start justify-between mb-4">
                                  <h3 class="text-lg font-semibold text-slate-800">【用户故事卡片 ${story.id || `US-${storyIdx + 1}`}】</h3>
                                  <span class="text-xs text-slate-500 font-mono">${storyNum}</span>
                              </div>
                              
                              <div class="space-y-3">
                                  <div class="flex items-start">
                                      <span class="text-2xl mr-2">🧑‍💻</span>
                                      <div>
                                          <span class="text-sm font-medium text-slate-600">角色：</span>
                                          <span class="text-slate-800">${story.role || '（未指定）'}</span>
                                      </div>
                                  </div>
                                  
                                  <div class="flex items-start">
                                      <span class="text-2xl mr-2">🚩</span>
                                      <div>
                                          <span class="text-sm font-medium text-slate-600">目标：</span>
                                          <span class="text-slate-800">${story.activity || '（未指定）'}</span>
                                      </div>
                                  </div>
                                  
                                  <div class="flex items-start">
                                      <span class="text-2xl mr-2">💎</span>
                                      <div>
                                          <span class="text-sm font-medium text-slate-600">价值：</span>
                                          <span class="text-slate-800">${story.value || '（未指定）'}</span>
                                      </div>
                                  </div>
                                  
                                  <div class="mt-4 pt-4 border-t border-blue-200">
                                      <div class="flex items-start mb-2">
                                          <span class="text-xl mr-2">✅</span>
                                          <span class="text-sm font-semibold text-slate-700">验收标准 (逻辑细节)：</span>
                                      </div>
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
                    <h2 class="text-2xl mb-6 font-bold text-slate-900 pb-2 border-b-2 border-slate-300">${nodeNum} ${node.title || `功能模块 ${nodeIdx + 1}`}</h2>
                    
                    <div class="grid grid-cols-12 gap-8 items-start">
                        <!-- Left Column: UI Preview (Sticky) -->
                        <div class="col-span-4">
                            <div class="sticky-ui">
                                <h3 class="text-lg font-semibold text-slate-700 mb-3">${nodeNum}.${sectionIdx++} 界面示意</h3>
                                ${hasUIPreview ? `
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

  // 构建全局规则 Markdown
  const globalRulesMarkdown = `
## 性能要求
${globalRules.performance || '（待补充）'}

## 安全要求
${globalRules.security || '（待补充）'}

## 兼容性要求
${globalRules.compatibility || '（待补充）'}

## 错误处理
${globalRules.errorHandling || '（待补充）'}

## 数据追踪
${globalRules.dataTracking || '（待补充）'}
  `.trim();

  // 构建数据字典 Markdown（如果提供）
  const dictionaryMarkdown = dataDictionary || '| 字段名 | 类型 | 说明 |\n|--------|------|------|\n| （暂无数据字典） | - | - |';

  // 转换节点数据为 PageNode 格式（Rich Node Model）
  const nodeData: PageNode[] = nodes.map((node) => {
    const spec = node.data?.artifacts?.spec;
    const view = node.data?.artifacts?.view;
    
    // 获取 UI 预览图
    const uiPreview = view?.previewUrl || (view?.code ? 
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5peg5Zu+54mH5pyN5YqhPC90ZXh0Pjwvc3ZnPg==' :
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5peg5Zu+54mH5pyN5YqhPC90ZXh0Pjwvc3ZnPg==');
    
    // 构建需求章节数组
    const sections: RequirementSection[] = [];
    
    // 检查是否有新的 sections 结构（Rich Node Model）
    if (spec?.sections && Array.isArray(spec.sections)) {
      // 使用新的 sections 结构
      sections.push(...spec.sections.map((sec: any) => ({
        title: sec.title || '未命名章节',
        type: sec.type === 'table' ? 'table' : 'text',
        content: sec.content || '（暂无内容）',
      })));
    } else if (spec?.requirements) {
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
};
