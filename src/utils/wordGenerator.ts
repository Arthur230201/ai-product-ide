/**
 * Role: Senior Backend Developer.
 * Task: Implement `generateEnterpriseWord` to export a Professional PRD in .docx format.
 * Library: Use `docx` (https://docx.js.org).
 *
 * # Requirements (Enterprise Grade)
 * 1. **Styles**: Define a "Corporate Theme" (Heading 1 = Blue/Bold/Underline, Normal = 11pt/Calibri).
 * 2. **Structure**:
 * - **Cover Page**: Large Title, Metadata Table, Logo (if avail).
 * - **Header/Footer**: "Confidential", Page Numbers (Page X of Y).
 * - **TOC**: Automatic Table of Contents.
 * - **Chapters**: Match the 7-chapter structure defined previously.
 * 3. **Content Handling**:
 * - **Images**: Convert Base64 to `ImageRun`. Fit to page width (max 600px).
 * - **Tables**: Render the PRD tables with proper borders, shading, and header repetition.
 * - **Layout**: Unlike HTML (Split View), use **Vertical Layout** for Word (UI Image Top, Table Bottom) to fit A4 paper.
 * 4. **Markdown Parsing**: Since inputs are Markdown strings, implement a simple `markdownToDocx` helper to convert Bold (**text**) and plain text into `TextRun`.
 *
 * # Input Data Model (Same as HTML)
 * - data: ProjectData (meta, images, nodes...)
 *
 * # Output
 * - Return a `Blob` object ready for `saveAs`.
 */

import { 
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
  WidthType, BorderStyle, HeadingLevel, ImageRun, Header, Footer, 
  AlignmentType, PageNumber, PageBreak, VerticalAlign, ShadingType,
  TableOfContents, ExternalHyperlink, InternalHyperlink, TabStopType, TabStopPosition
} from "docx";
import { marked } from "marked";
import type { FullPrdData, PageNode, RequirementSection } from "./prdGenerator";

// Helper: Convert Base64 to ImageRun
// Width/Height are in EMU (English Metric Units): 1 inch = 914400 EMU, 1 cm = 360000 EMU
// For A4 paper (21cm width, margins ~2.5cm each side): usable width ~16cm = ~5760000 EMU
// Recommended image width: ~12cm = ~4320000 EMU (approx 450px at 96 DPI)
const createImage = (base64Data: string, widthEmu = 4320000, heightEmu?: number): Paragraph => {
  if (!base64Data || base64Data.trim() === '') {
    return new Paragraph({
      children: [new TextRun({ text: "*[图片缺失]*", italics: true, color: "999999" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    });
  }

  try {
    // Strip prefix if present (data:image/png;base64,)
    let cleanData = base64Data.trim();
    if (cleanData.includes(',')) {
      cleanData = cleanData.split(',')[1];
    }
    
    // Decode base64 to buffer
    const imageBuffer = Uint8Array.from(atob(cleanData), c => c.charCodeAt(0));
    
    // If height not specified, maintain aspect ratio (assuming mobile UI ~9:16 ratio)
    // For mobile UI previews, use a reasonable height
    const finalHeight = heightEmu || Math.round(widthEmu * 1.8); // ~9:16 ratio for mobile
    
    return new Paragraph({
      children: [
        new ImageRun({
          data: imageBuffer,
          transformation: {
            width: widthEmu,
            height: finalHeight,
          },
        } as any), // Type assertion to handle docx library type mismatch
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    });
  } catch (error) {
    console.error('Image conversion error:', error);
    return new Paragraph({
      children: [new TextRun({ text: "*[图片加载失败]*", italics: true, color: "FF0000" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    });
  }
};

// Helper: Simple Markdown Parser (Bold + Text + Line Breaks)
const parseText = (text: string): Paragraph[] => {
  if (!text) return [new Paragraph({ children: [new TextRun({ text: "（暂无内容）", italics: true, color: "999999" })] })];
  
  // Split by line breaks first
  const lines = text.split(/\n/);
  const result: Paragraph[] = [];
  
  lines.forEach((line, lineIndex) => {
    if (line.trim() === '') {
      // Empty line - add spacing paragraph
      if (lineIndex < lines.length - 1) {
        result.push(new Paragraph({ spacing: { after: 120 } }));
      }
      return;
    }

    // Split by ** to find bold parts
    const parts = line.split(/\*\*(.*?)\*\*/g);
    const textRuns: TextRun[] = [];
    
    parts.forEach((part, index) => {
      // Even indices are normal, Odd indices are bold (captured group)
      if (part) {
        textRuns.push(new TextRun({
          text: part,
          bold: index % 2 !== 0,
          size: 22, // 11pt
        }));
      }
    });

    if (textRuns.length > 0) {
      result.push(new Paragraph({
        children: textRuns,
        spacing: { after: 120 },
      }));
    }
  });

  return result.length > 0 ? result : [new Paragraph({ children: [new TextRun({ text: "（暂无内容）", italics: true })] })];
};

// Helper: Parse Markdown Table to Docx Table
const parseMarkdownTable = (markdownTable: string): Table | null => {
  if (!markdownTable || typeof markdownTable !== 'string') {
    return null;
  }

  // Filter lines that look like table rows (contain |)
  const lines = markdownTable
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('|') && line.endsWith('|'));
  
  if (lines.length < 2) {
    return null; // Need at least header and separator
  }

  // Find separator line (|---|---| or |:---|:---:|)
  let separatorIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Match separator patterns: |---|---| or |:---|:---:|---|
    if (line.match(/^\|[\s\-:]+(\|[\s\-:]+)*\|$/)) {
      separatorIndex = i;
      break;
    }
  }

  if (separatorIndex === -1) {
    // No separator found, treat first line as header and second as first data row
    separatorIndex = 1;
  }

  // Parse header (first line)
  const headerLine = lines[0];
  const headers = headerLine
    .split('|')
    .slice(1, -1)
    .map(h => h.trim())
    .filter(h => h.length > 0);

  if (headers.length === 0) {
    return null; // No valid headers
  }

  // Parse data rows (after separator)
  const dataLines = lines.slice(separatorIndex + 1).filter(line => {
    // Skip empty lines or lines that look like separators
    const cells = line.split('|').slice(1, -1).map(c => c.trim());
    return cells.some(c => c.length > 0 && !c.match(/^[\s\-:]+$/));
  });

  if (dataLines.length === 0) {
    return null; // No data rows
  }

  const rows: TableRow[] = [
    // Header row with proper styling
    new TableRow({
      tableHeader: true,
      children: headers.map(h => new TableCell({
        children: [new Paragraph({ 
          children: [new TextRun({ 
            text: h, 
            bold: true,
            size: 22, // 11pt
          })],
          alignment: AlignmentType.CENTER 
        })],
        shading: { 
          type: ShadingType.SOLID,
          color: "F3F4F6" // Light Gray background
        },
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
      })),
    }),
  ];

  // Data rows
  dataLines.forEach(line => {
    const cells = line
      .split('|')
      .slice(1, -1)
      .map(c => c.trim());
    
    // Ensure cell count matches header count
    while (cells.length < headers.length) {
      cells.push('');
    }
    // Remove extra cells if any
    cells.splice(headers.length);

    rows.push(new TableRow({
      children: cells.map((cell) => {
        // Parse cell content (support markdown bold, etc.)
        const cellContent = parseText(cell);
        return new TableCell({
          children: cellContent.length > 0 
            ? (cellContent as Paragraph[])
            : [new Paragraph({ children: [new TextRun({ text: cell || '-' })] })],
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 100, bottom: 100, left: 100, right: 100 },
        });
      }),
    }));
  });

  if (rows.length === 1) {
    // Only header row, no data
    return null;
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    },
  });
};

// Helper: Create Standard Table Header
const createTableHeader = (headers: string[]): TableRow => {
  return new TableRow({
    tableHeader: true,
    children: headers.map(h => new TableCell({
      children: [new Paragraph({ 
        text: h, 
        style: "TableHeader",
        alignment: AlignmentType.CENTER 
      })],
      shading: { 
        type: ShadingType.SOLID,
        color: "F3F4F6" 
      },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 100, bottom: 100, left: 100, right: 100 },
    })),
  });
};

/**
 * 生成企业级 Word 文档
 */
export const generateEnterpriseWord = async (data: FullPrdData): Promise<Blob> => {
  const children: (Paragraph | Table)[] = [];

  // --- COVER PAGE ---
  children.push(
    new Paragraph({ text: "", spacing: { before: 2000 } }), // Spacer
    new Paragraph({ 
      text: data.meta.name, 
      heading: HeadingLevel.TITLE, 
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({ 
      text: "软件需求规格说明书 (SRS)", 
      heading: HeadingLevel.HEADING_2, 
      alignment: AlignmentType.CENTER,
      spacing: { after: 1000 },
    }),
  );

  // Version Table
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        createTableHeader(["版本号", "修订日期", "修改人", "修订说明"]),
        new TableRow({
          children: [
            new TableCell({ 
              children: [new Paragraph({ text: data.meta.version, style: "Normal" })] 
            }),
            new TableCell({ 
              children: [new Paragraph({ text: data.meta.updateTime, style: "Normal" })] 
            }),
            new TableCell({ 
              children: [new Paragraph({ text: data.meta.author || "Project Owner", style: "Normal" })] 
            }),
            new TableCell({ 
              children: [new Paragraph({ text: "初始版本生成 (Auto-generated)", style: "Normal" })] 
            }),
          ]
        })
      ],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
        left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
        right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      },
    }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // --- TOC ---
  children.push(
    new Paragraph({ children: [new TextRun({ text: "目录" })], heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ 
      children: [
        new TextRun({ 
          text: "（请在 Word 中右键点击此区域，选择\"更新域\"以生成目录）", 
          italics: true,
          color: "999999",
        })
      ],
      style: "Normal",
      spacing: { after: 400 },
    }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // --- CHAPTER 1: OVERVIEW ---
  children.push(
    new Paragraph({ children: [new TextRun({ text: "第 1 章：项目综述" })], heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ children: [new TextRun({ text: "1.1 项目背景" })], heading: HeadingLevel.HEADING_2 }),
    ...parseText(data.meta.desc || "（暂无项目背景描述）"),
    new Paragraph({ text: "1.2 目标用户", heading: HeadingLevel.HEADING_2 }),
    ...parseText(`核心用户群体：${data.meta.targetUser || "通用用户"}`),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // --- CHAPTER 2: GLOBAL RULES ---
  children.push(
    new Paragraph({ text: "第 2 章：全局规范", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: "2.1 全局交互/数据规则", heading: HeadingLevel.HEADING_2 }),
    ...parseText(data.docs.globalRules || "（暂无内容）"),
    new Paragraph({ text: "2.2 全局数据字典", heading: HeadingLevel.HEADING_2 }),
  );

  // Parse data dictionary table
  const dictionaryTable = parseMarkdownTable(data.docs.dictionary);
  if (dictionaryTable) {
    children.push(dictionaryTable);
  } else {
    children.push(...parseText(data.docs.dictionary || "（暂无数据字典）"));
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // --- CHAPTER 3: ARCHITECTURE ---
  children.push(
    new Paragraph({ text: "第 3 章：系统架构", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: "3.1 架构拓扑图", heading: HeadingLevel.HEADING_2 }),
  );

  if (data.images.architecture) {
    children.push(createImage(data.images.architecture, 500, 400));
    children.push(new Paragraph({
      children: [
        new TextRun({ 
          text: "（点击放大查看）", 
          italics: true,
          color: "666666",
        })
      ],
      alignment: AlignmentType.CENTER,
      style: "Normal",
      spacing: { after: 400 },
    }));
  } else {
    children.push(new Paragraph({
      children: [new TextRun({ text: "（暂无架构拓扑图）", italics: true, color: "999999" })],
      spacing: { after: 400 },
    }));
  }

  children.push(
    new Paragraph({ text: "3.2 交互拓扑图", heading: HeadingLevel.HEADING_2 }),
  );

  // Handle topology (could be image or Mermaid code)
  if (data.images.topology) {
    if (data.images.topology.trim().startsWith('graph') || data.images.topology.trim().startsWith('flowchart')) {
      // Mermaid code - convert to text description
      children.push(new Paragraph({
        children: [new TextRun({ 
          text: "（交互拓扑图以 Mermaid 格式存储，请在 HTML 版本中查看）", 
          italics: true,
          color: "999999" 
        })],
        spacing: { after: 400 },
      }));
    } else {
      // Base64 image
      children.push(createImage(data.images.topology, 500, 400));
    }
  } else {
    children.push(new Paragraph({
      children: [new TextRun({ text: "（暂无交互拓扑图）", italics: true, color: "999999" })],
      spacing: { after: 400 },
    }));
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // --- CHAPTER 4: BUSINESS PROCESS ---
  children.push(
    new Paragraph({ text: "第 4 章：业务流程", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: "4.1 核心业务泳道图", heading: HeadingLevel.HEADING_2 }),
  );

  if (data.charts.swimlane) {
    children.push(new Paragraph({
      children: [new TextRun({ 
        text: "（业务泳道图以 Mermaid 格式存储，请在 HTML 版本中查看）", 
        italics: true,
        color: "999999" 
      })],
      spacing: { after: 400 },
    }));
  } else {
    children.push(new Paragraph({
      children: [new TextRun({ text: "（暂无业务泳道图）", italics: true, color: "999999" })],
      spacing: { after: 400 },
    }));
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // --- CHAPTER 5: FUNCTIONAL SPECS ---
  children.push(
    new Paragraph({ text: "第 5 章：功能详述", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({
      children: [new TextRun({ 
        text: "本章节包含各个页面的 UI 原型图及详细的功能需求说明。", 
        italics: true,
        color: "666666" 
      })],
      spacing: { after: 400 },
    }),
  );

  // Process each node - Functional Specs Section (Rich Node Model)
  data.nodes.forEach((node, nodeIdx) => {
    // Automatic Numbering: Chapter 5, Node level (5.1, 5.2, ...)
    const nodeNum = `5.${nodeIdx + 1}`;
    
    // Step 1: Add Heading 2 with node title
    children.push(
      new Paragraph({ 
        text: `${nodeNum} ${node.title || `功能模块 ${nodeIdx + 1}`}`, 
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 } 
      }),
    );

    // Step 2: UI Preview Section (Always 5.x.1)
    let sectionIdx = 1;
    const uiSectionNum = `${nodeNum}.${sectionIdx++}`;
    
    children.push(new Paragraph({ 
      text: `${uiSectionNum} 界面示意`, 
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 200, after: 200 } 
    }));

    // Embed UI Preview Image (Top)
    const uiPreview = node.uiPreview || '';
    if (uiPreview && uiPreview.length > 0) {
      // Create image paragraph (width ~12cm = 4320000 EMU)
      children.push(createImage(uiPreview, 4320000)); // ~12cm width, auto height
      
      // Add caption paragraph below image
      children.push(new Paragraph({ 
        children: [
          new TextRun({ 
            text: `图 ${uiSectionNum} ${node.title || `功能模块 ${nodeIdx + 1}`} UI 示意`, 
            italics: true,
            color: "666666",
            size: 20, // 10pt
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }));
    } else {
      // No UI preview available
      children.push(new Paragraph({
        children: [
          new TextRun({ 
            text: "*[暂无 UI 预览图]*", 
            italics: true, 
            color: "999999" 
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }));
    }

    // Step 3: Dynamic Requirement Sections (5.x.2, 5.x.3, ...)
    if (node.sections && node.sections.length > 0) {
      node.sections.forEach((section) => {
        const secNum = `${nodeNum}.${sectionIdx++}`;
        
        // Section Title (H3)
        children.push(new Paragraph({ 
          text: `${secNum} ${section.title}`, 
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 400, after: 200 } 
        }));

        // Section Content
        if (section.type === 'table') {
          // Parse and render as table
          const table = parseMarkdownTable(section.content);
          if (table) {
            children.push(table);
            children.push(new Paragraph({ spacing: { after: 400 } }));
          } else {
            // Fallback to text if table parsing fails
            children.push(...parseText(section.content));
            children.push(new Paragraph({ spacing: { after: 400 } }));
          }
        } else {
          // Text/Markdown content
          const parsedText = parseText(section.content);
          if (parsedText.length > 0) {
            children.push(...parsedText);
            children.push(new Paragraph({ spacing: { after: 400 } }));
          } else {
            children.push(new Paragraph({
              children: [
                new TextRun({ 
                  text: "（暂无内容）", 
                  italics: true, 
                  color: "999999" 
                })
              ],
              spacing: { after: 400 },
            }));
          }
        }
      });
    } else {
      // No sections provided, add placeholder
      const secNum = `${nodeNum}.${sectionIdx++}`;
      children.push(new Paragraph({ 
        text: `${secNum} 功能需求说明`, 
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 400, after: 200 } 
      }));
      children.push(new Paragraph({
        children: [
          new TextRun({ 
            text: "（暂无功能需求说明）", 
            italics: true, 
            color: "999999" 
          })
        ],
        spacing: { after: 400 },
      }));
    }

    // Step 4: User Stories Section (用户故事模型 - 核心)
    const userStories = node.userStories;
    if (userStories && userStories.length > 0) {
      const userStoriesSectionNum = `${nodeNum}.${sectionIdx++}`;
      children.push(new Paragraph({ 
        children: [new TextRun({ text: `${userStoriesSectionNum} 用户故事` })],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 400, after: 200 } 
      }));

      userStories.forEach((story, storyIdx) => {
        // User Story Card
        children.push(new Paragraph({
          children: [
            new TextRun({ 
              text: `【用户故事卡片 ${story.id || `US-${storyIdx + 1}`}】`, 
              bold: true,
              size: 24, // 12pt
            })
          ],
          spacing: { before: 200, after: 100 },
        }));

        // Role
        children.push(new Paragraph({
          children: [
            new TextRun({ text: "🧑‍💻 角色：", bold: true, size: 22 }),
            new TextRun({ text: story.role || '（未指定）', size: 22 }),
          ],
          spacing: { after: 100 },
        }));

        // Activity
        children.push(new Paragraph({
          children: [
            new TextRun({ text: "🚩 目标：", bold: true, size: 22 }),
            new TextRun({ text: story.activity || '（未指定）', size: 22 }),
          ],
          spacing: { after: 100 },
        }));

        // Value
        children.push(new Paragraph({
          children: [
            new TextRun({ text: "💎 价值：", bold: true, size: 22 }),
            new TextRun({ text: story.value || '（未指定）', size: 22 }),
          ],
          spacing: { after: 200 },
        }));

        // Acceptance Criteria
        children.push(new Paragraph({
          children: [
            new TextRun({ text: "✅ 验收标准 (逻辑细节)：", bold: true, size: 22 }),
          ],
          spacing: { after: 100 },
        }));

        if (story.acceptanceCriteria && story.acceptanceCriteria.length > 0) {
          story.acceptanceCriteria.forEach((ac) => {
            const isLogic = ac.includes('[逻辑]');
            children.push(new Paragraph({
              children: [
                new TextRun({ 
                  text: `  • ${ac}`, 
                  size: 22,
                  color: isLogic ? "0066CC" : "000000", // Blue for logic rules
                  bold: isLogic,
                }),
              ],
              spacing: { after: 80 },
              indent: { left: 400 }, // Indent for list items
            }));
          });
        } else {
          children.push(new Paragraph({
            children: [
              new TextRun({ 
                text: "  （暂无验收标准）", 
                italics: true,
                color: "999999",
                size: 22,
              }),
            ],
            spacing: { after: 200 },
            indent: { left: 400 },
          }));
        }

        // Spacing between stories
        if (storyIdx < userStories.length - 1) {
          children.push(new Paragraph({ spacing: { after: 300 } }));
        }
      });
    }

    // Step 5: Page break between nodes (except last one) for better readability
    if (nodeIdx < data.nodes.length - 1) {
      children.push(new Paragraph({ 
        children: [new PageBreak()],
        spacing: { after: 0 }
      }));
    }
  });

  // Create document
  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { 
            size: 32, // 16pt
            bold: true, 
            color: "2E75B6" // Blue
          },
          paragraph: { 
            spacing: { before: 240, after: 120 },
            border: {
              bottom: {
                color: "2E75B6",
                size: 4,
                style: BorderStyle.SINGLE,
              },
            },
          },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { 
            size: 28, // 14pt
            bold: true, 
            color: "1F4E79" // Dark Blue
          },
          paragraph: { 
            spacing: { before: 240, after: 120 },
            border: {
              left: {
                color: "3B82F6",
                size: 12,
                style: BorderStyle.SINGLE,
              },
            },
            indent: { left: 200 },
          },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { 
            size: 24, // 12pt
            bold: true, 
            color: "334155" // Dark Gray
          },
          paragraph: { 
            spacing: { before: 200, after: 100 },
          },
        },
        {
          id: "TableHeader",
          name: "Table Header",
          basedOn: "Normal",
          run: { 
            bold: true, 
            size: 22, // 11pt
            color: "1F2937"
          },
          paragraph: { 
            alignment: AlignmentType.CENTER,
            spacing: { after: 0 },
          },
        },
        {
          id: "Normal",
          name: "Normal",
          run: { 
            size: 22, // 11pt
            font: "Calibri"
          },
          paragraph: { 
            spacing: { after: 120 },
            alignment: AlignmentType.JUSTIFIED,
          },
        },
        {
          id: "Caption",
          name: "Caption",
          basedOn: "Normal",
          run: { 
            size: 20, // 10pt
            italics: true,
            color: "666666"
          },
          paragraph: { 
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          },
        },
      ]
    },
    sections: [{
      properties: {
        page: {
          size: {
            orientation: "portrait",
            width: 11906, // A4 width in TWIPs (1 inch = 1440 TWIPs)
            height: 16838, // A4 height in TWIPs
          },
          margin: {
            top: 1440, // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1800, // 1.25 inch for binding
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: `${data.meta.name} - PRD`, bold: true, size: 20 }),
                new TextRun({ text: "\t\t\t" }), // Tabs
                new TextRun({ text: "INTERNAL USE ONLY", color: "FF0000", size: 18, bold: true }),
              ],
              style: "Normal",
              tabStops: [
                {
                  type: TabStopType.RIGHT,
                  position: TabStopPosition.MAX,
                },
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Page " }),
                PageNumber.CURRENT as any,
                new TextRun({ text: " of " }),
                PageNumber.TOTAL_PAGES as any,
              ],
              style: "Normal",
            }),
          ],
        }),
      },
      children,
    }],
  });

  return await Packer.toBlob(doc);
};

/**
 * 导出企业级 Word 文档
 */
export const exportToEnterpriseWord = async (options: {
  projectMeta: {
    projectName: string;
    version: string;
    industry: string;
    targetAudience: string;
    description: string;
  };
  globalRules: {
    performance: string;
    security: string;
    compatibility: string;
    errorHandling: string;
    dataTracking: string;
  };
  nodes: Array<{
    data: {
      label: string;
      artifacts?: {
        spec?: {
          title?: string;
          requirements?: string | string[];
        };
        view?: {
          previewUrl?: string;
        };
      };
    };
  }>;
  architectureImage?: string;
  topologyImage?: string;
  swimlaneChart?: string;
  dataDictionary?: string;
}) => {
  const { projectMeta, globalRules, nodes, architectureImage, topologyImage, swimlaneChart, dataDictionary } = options;

  // Build global rules Markdown
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

  // Build data dictionary Markdown
  const dictionaryMarkdown = dataDictionary || '| 字段名 | 类型 | 说明 |\n|--------|------|------|\n| （暂无数据字典） | - | - |';

  // Convert node data (使用与 exportToFullPrdHtml 相同的逻辑)
  const nodeData: PageNode[] = nodes.map((node) => {
    const spec = node.data?.artifacts?.spec;
    const view = node.data?.artifacts?.view;
    
    // 获取 UI 预览图
    const viewWithCode = view as { previewUrl?: string; code?: string } | undefined;
    const uiPreview = viewWithCode?.previewUrl || (viewWithCode?.code ? 
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5peg5Zu+54mH5pyN5YqhPC90ZXh0Pjwvc3ZnPg==' :
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5peg5Zu+54mH5pyN5YqhPC90ZXh0Pjwvc3ZnPg==');
    
    // 构建需求章节数组
    const sections: RequirementSection[] = [];
    
    // 检查是否有新的 sections 结构（Rich Node Model）
    const specWithSections = spec as { sections?: RequirementSection[]; title?: string; requirements?: string | string[] } | undefined;
    if (specWithSections?.sections && Array.isArray(specWithSections.sections)) {
      // 使用新的 sections 结构
      sections.push(...specWithSections.sections.map((sec: any) => ({
        title: sec.title || '未命名章节',
        type: (sec.type === 'table' ? 'table' : 'text') as 'text' | 'table',
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
    
    // 如果没有章节，添加一个占位章节
    if (sections.length === 0) {
      sections.push({
        title: '功能需求说明',
        type: 'text',
        content: '（暂无功能需求说明）',
      });
    }

    // 提取用户故事数据（用户故事模型 - 核心）
    const artifacts = node.data?.artifacts as any;
    const userStories = artifacts?.userStories;
    // 兼容旧数据（可选）
    const businessContext = artifacts?.businessContext;
    const events = artifacts?.events;

    return {
      title: spec?.title || node.data.label || '未命名页面',
      uiPreview,
      sections,
      // 用户故事模型（新 - 核心）
      userStories: userStories ? userStories.map((story: any) => ({
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
      events: events ? events.map((event: any) => ({
        id: event.id,
        name: event.name,
        trigger: event.trigger,
        type: event.type,
        processFlow: event.processFlow || [],
        outcome: event.outcome,
      })) : undefined,
    };
  });

  // Build full data
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

  // Generate Word document
  const blob = await generateEnterpriseWord(fullPrdData);

  // Download file
  const { saveAs } = await import('file-saver');
  saveAs(blob, `${projectMeta.projectName}_Enterprise_PRD.docx`);
};

