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
