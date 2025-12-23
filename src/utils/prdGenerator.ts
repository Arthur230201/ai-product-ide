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
  nodes: Array<{
    title: string;
    uiPreview: string; // Base64 图片
    prdTable: string; // Markdown 表格
  }>;
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
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown-light.min.css">
    <style>
        body { font-family: 'Inter', system-ui, sans-serif; background: #f8fafc; }
        .sidebar { width: 280px; height: 100vh; position: fixed; left: 0; top: 0; overflow-y: auto; background: #0f172a; color: #94a3b8; }
        .main-content { margin-left: 280px; min-height: 100vh; background: #fff; }
        
        /* Typography & Tables */
        h1 { color: #0f172a; font-weight: 800; }
        h2 { color: #1e293b; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; border-left: 4px solid #3b82f6; padding-left: 1rem; }
        h3 { color: #334155; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; }
        
        /* Markdown Tables Override */
        .markdown-body table { display: table; width: 100%; }
        .markdown-body th { background-color: #f1f5f9; }

        /* Split View Sticky UI */
        .sticky-ui { position: sticky; top: 2rem; }
        .phone-mockup { border: 10px solid #1e293b; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); background: #fff; }

        /* Lightbox */
        #lightbox { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 9999; justify-content: center; align-items: center; }
        #lightbox img { max-width: 95%; max-height: 95%; object-fit: contain; }

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

                ${data.nodes.map((node, idx) => `
                <div id="node-${idx}" class="mb-24 pt-8 border-t border-slate-200 scroll-mt-20">
                    <h2 class="text-2xl mb-6">5.${idx+1} ${node.title}</h2>
                    
                    <div class="grid grid-cols-12 gap-8 items-start">
                        <div class="col-span-4 sticky-ui">
                            <div class="phone-mockup">
                                <img src="${node.uiPreview}" class="w-full h-auto block" alt="UI Preview" />
                            </div>
                            <p class="text-center text-xs text-slate-400 mt-3 font-mono">图 5.${idx+1} UI 示意</p>
                        </div>

                        <div class="col-span-8">
                            <div class="markdown-body text-sm bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                                ${marked.parse(node.prdTable)}
                            </div>
                        </div>
                    </div>
                </div>
                `).join('')}
            </section>

        </div>
    </main>

    <div id="lightbox" onclick="this.style.display='none'">
        <img src="" alt="Full Screen Image" />
    </div>

    <script>
        // Init Mermaid
        mermaid.initialize({ startOnLoad: true, theme: 'neutral', securityLevel: 'loose' });

        // Lightbox Logic
        function openLightbox(src) {
            if(!src) return;
            const lb = document.getElementById('lightbox');
            lb.querySelector('img').src = src;
            lb.style.display = 'flex';
        }

        // Sidebar Smooth Scroll
        document.querySelectorAll('nav a').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                document.querySelector(targetId).scrollIntoView({
                    behavior: 'smooth'
                });
            });
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

  // 转换节点数据
  const nodeData = nodes.map((node) => {
    const spec = node.data?.artifacts?.spec;
    const view = node.data?.artifacts?.view;
    
    // 获取 PRD 表格（从 spec.requirements 生成）
    let prdTable = '';
    if (spec?.requirements) {
      const requirements = Array.isArray(spec.requirements) 
        ? spec.requirements.join('\n') 
        : spec.requirements;
      
      // 尝试解析为表格格式，如果不是表格则直接使用
      if (requirements.includes('|') && requirements.includes('功能ID')) {
        prdTable = requirements;
      } else {
        // 如果不是表格格式，转换为简单的列表
        prdTable = `## ${spec.title || node.data.label}\n\n${requirements}`;
      }
    } else {
      prdTable = `## ${spec?.title || node.data.label}\n\n（暂无功能需求说明）`;
    }

    return {
      title: spec?.title || node.data.label || '未命名页面',
      uiPreview: view?.previewUrl || view?.code ? 
        (view.previewUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5peg5Zu+54mH5pyN5YqhPC90ZXh0Pjwvc3ZnPg==') :
        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5peg5Zu+54mH5pyN5YqhPC90ZXh0Pjwvc3ZnPg==',
      prdTable,
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
