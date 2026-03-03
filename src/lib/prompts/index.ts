/**
 * Prompt Module System
 * 模块化 prompt 片段，避免重复和超长拼接
 */

import type { ProjectMeta } from '@/types/fractal';

/**
 * 压缩项目元数据，只保留关键字段
 */
export function compactProjectMeta(projectMeta: Partial<ProjectMeta>): string {
  const parts: string[] = [];
  
  if (projectMeta.industry) {
    parts.push(`行业: ${projectMeta.industry}`);
  }
  if (projectMeta.targetAudience) {
    parts.push(`用户: ${projectMeta.targetAudience}`);
  }
  if (projectMeta.projectName) {
    parts.push(`项目: ${projectMeta.projectName}`);
  }
  
  // 注意：ProjectMeta 类型中没有 constraints 和 styleTags 字段
  // 这些字段可能在未来扩展，目前先移除相关代码
  // 如果需要，可以在 ProjectMeta 类型中添加这些字段
  
  return parts.length > 0 ? parts.join(' | ') : '通用项目';
}

/**
 * 核心角色定义（短）
 */
export const CORE_ROLE = {
  UI_ENGINEER: `# Role
Senior UI Engineer & Pixel-Perfect Implementation Specialist.

你是一个专业的 UI 工程师和 UI Rationalization（UI合理化）专家。`,

  FRONTEND_ARCHITECT: `# Role
Senior Frontend Architect & UI/UX Expert

你是一个专业的 React 前端开发专家。`,
};

/**
 * UI Rationalization 核心要求（短且硬）
 */
export const CORE_REQUIREMENTS = `# System: UI Rationalization Engine
**GLOBAL GOAL:** Given ANY UI input, output a MORE RATIONAL, COMPLETE, and USABLE UI.
**This is NOT UI beautification. This is product-level rationalization.**

**CORE REQUIREMENTS:**
- Output UI must be at least as usable as input UI
- No interaction may exist without real behavior
- No filter/tab/state may exist without data support
- The result must feel like a real, shippable product`;

/**
 * 输出契约（短且硬）
 */
export const OUTPUT_CONTRACT = {
  REACT: `# Output
- Return ONLY the full .tsx code
- Icon Rules: Material Icons use <span className="material-icons-round">name</span>; Others use lucide-react
- No markdown, no comments, no explanations
- All text must be in Chinese`,

  HTML: `# Output
- Return ONLY HTML (self-contained document)
- Include data-action/data-filter/data-nav attributes for injector
- No markdown, no code blocks
- All text must be in Chinese`,
};

/**
 * 交互闭合规则（精简版）
 */
export const INTERACTION_CLOSURE_RULES = `**Interaction Closure Rules (MANDATORY):**
- Any dropdown must open and change state
- Any tab must visibly change content
- Any filter must affect data
- Any status badge must correspond to a data state
- Any action button must trigger a logical action
- If an interaction is visible, it must be functional`;

/**
 * 数据规则（精简版）
 */
export const DATA_RULES = `**Data Rules (MANDATORY):**
- Generate realistic, production-like data (no "示例1", "测试数据")
- Data must support all UI states/filters (each state: 2-3 items minimum)
- Time/status/priority must be logically consistent
- Generate 6-10 items minimum for lists
- Never minimize data to simplify UI`;

/**
 * 产品推断策略（精简版）
 */
export const PRODUCT_INFERENCE = `**Product Inference Policy:**
- Use industry-standard patterns (search, filter, list, form, navigation)
- Prefer widely accepted UX conventions (Material Design, iOS HIG)
- Choose single reasonable behavior and implement fully
- Do not ask user for confirmation - make decisions autonomously
- UI should feel like real product, not prototype`;

/**
 * 视觉复刻协议（精简版）
 */
export const VISUAL_REPRODUCTION = {
  ANALYSIS: `**Visual Analysis (MANDATORY - Do FIRST):**
1. Layout: Identify type (Sidebar/Card/Modal/List/Dashboard) and hierarchy
2. Colors: Extract exact hex codes (use arbitrary values if Tailwind defaults don't match)
3. Typography: Font weights, sizes, colors (use hex if needed)
4. Spacing: Match padding/margins exactly (compact vs airy)
5. Details: Border radius, shadows, borders, opacity
6. Icons: Material Icons (keep format) or Lucide React`,

  CODING: `**Coding Phase:**
- Framework: React Functional Component
- Icons: Material Icons (keep <span className="material-icons-round">name</span>) or Lucide React
- Layout: Strict Flexbox/Grid, match exact structure
- Colors: Use exact hex codes with arbitrary values (bg-[#F3F4F6], text-[#1F2937])
- Interactive States: Add :hover, :active, :focus states
- All text MUST have explicit color classes (text-*)`,

  TEXT_COLOR: `**Text Color Rules (CRITICAL):**
- Light bg: Main text text-gray-900, Secondary text-gray-600+, Status text-blue-600+
- Dark bg: Main text text-white, Secondary text-gray-300+
- NEVER: text-white on light bg, text-black on dark bg
- Every text element MUST have explicit text-* class`,
};

/**
 * 模式特定指令（按需注入）
 */
export const MODE_INSTRUCTIONS = {
  SKELETON: `# SKELETON MODE:
- Output: Single self-contained HTML document
- Include: search bar, filter controls, product list cards, detail navigation hooks
- Limits: Product list <= 8 items, HTML <= 18,000 chars
- Data attributes: data-action, data-filter, data-nav, data-list
- Return ONLY HTML, no markdown`,

  DIRECT: `# DIRECT MODE:
- Fast generation without extensive rationality analysis
- Preserve visual accuracy from image
- Ensure basic interactions work
- Keep structure simple and efficient`,

  PRESERVE: `# PRESERVE MODE:
- Preserve existing UI structure as much as possible
- Make only subtle improvements to interaction logic
- Do NOT restructure unless absolutely necessary
- Focus on completing missing interactions and adding data support
- Maintain original visual style and layout`,

  COMPLETE: `# COMPLETE MODE:
- Complete missing interaction logic for all visible UI elements
- Add data support for all filters, tabs, and states
- Preserve overall structure but enhance with complete functionality
- Ensure every button has real behavior
- Ensure every filter/tab actually filters/switches content
- Generate sufficient realistic data
- Complete missing interactions, states, filters, flows
- Add sample data to support all interactions
- Ensure all interactions are complete and functional
- Output should feel like finished product`,

  RATIONALIZE: `# RATIONALIZE MODE:
- Restructure UI layout if it improves logical flow
- Change interaction logic to ensure completeness
- Add missing sections, states, filters, flows
- Fix irrational patterns while preserving product intent
- Output should feel like real, shippable product`,
};

/**
 * 构建 UI 生成 prompt（用于图片输入）- 精简版
 */
export function buildUIGenerationPrompt(options: {
  projectMeta: Partial<ProjectMeta>;
  mode: 'skeleton' | 'direct' | 'complete' | 'rationalize' | 'preserve';
  modeReasoning?: string;
  includeVisualAnalysis?: boolean;
  includeDataRules?: boolean;
  includeInference?: boolean;
  designSystemEnforcement?: string;
}): string {
  const { 
    projectMeta, 
    mode, 
    modeReasoning,
    includeVisualAnalysis = true, 
    includeDataRules = true, 
    includeInference = true,
    designSystemEnforcement = '',
  } = options;
  
  const compactMeta = compactProjectMeta(projectMeta);
  const modeKey = mode.toUpperCase() as keyof typeof MODE_INSTRUCTIONS;
  const modeInst = MODE_INSTRUCTIONS[modeKey] || '';
  
  // 构建模式特定指令（如果有 reasoning）
  let modeInstructions = modeInst;
  if (modeReasoning && (mode === 'preserve' || mode === 'complete' || mode === 'rationalize')) {
    modeInstructions = `# 🎯 Generation Mode: ${mode.toUpperCase()}\n**Rationale:** ${modeReasoning}\n\n${modeInst}`;
  }
  
  const parts: string[] = [
    CORE_ROLE.UI_ENGINEER,
    compactMeta ? `专注于 ${compactMeta}` : '',
    CORE_REQUIREMENTS,
    modeInstructions,
    '# Task\nRe-implement UI based on Reference Image. Create MORE RATIONAL and COMPLETE UI.',
  ];
  
  if (includeVisualAnalysis) {
    parts.push(VISUAL_REPRODUCTION.ANALYSIS);
    parts.push(VISUAL_REPRODUCTION.CODING);
    parts.push(VISUAL_REPRODUCTION.TEXT_COLOR);
    parts.push('**Ignore system UI:** Ignore phone status bar (time, signal, battery icons). Focus on app content only.');
  }
  
  parts.push(INTERACTION_CLOSURE_RULES);
  parts.push('**YOU ARE ALLOWED TO:**\n- Add/remove/restructure UI sections for better UX\n- Add missing states, tabs, filters, flows\n- Adjust interaction logic to match conventions\n- Generate realistic data\n- Fix incomplete/irrational patterns');
  parts.push('**YOU MUST:**\n- Preserve product intent and domain\n- Preserve visual style (unless broken)\n- Produce fully working UI\n- Ensure all interactions complete and functional');
  parts.push('**YOU MUST NOT:**\n- Ask user for confirmation\n- Leave interactions incomplete\n- Mark as "example" or "demo"\n- Create placeholder "TODO" text');
  
  if (includeDataRules) {
    parts.push(DATA_RULES);
  }
  
  if (includeInference) {
    parts.push(PRODUCT_INFERENCE);
  }
  
  parts.push('**Language:** All text content must be in Chinese');
  parts.push('**Tech:** React Hooks (useState, useEffect), Tailwind CSS, Material Icons (keep format) or Lucide React');
  
  if (designSystemEnforcement) {
    parts.push(designSystemEnforcement);
  }
  
  parts.push(OUTPUT_CONTRACT.REACT);
  
  return parts.filter(p => p.trim()).join('\n\n');
}

/**
 * 构建文本生成 prompt（用于文本描述输入）
 */
export function buildTextGenerationPrompt(options: {
  projectMeta: Partial<ProjectMeta>;
  mode: 'direct' | 'complete' | 'rationalize';
  includeDataRules?: boolean;
  includeInference?: boolean;
}): string {
  const { projectMeta, mode, includeDataRules = true, includeInference = true } = options;
  
  const compactMeta = compactProjectMeta(projectMeta);
  const modeInst = MODE_INSTRUCTIONS[mode.toUpperCase() as keyof typeof MODE_INSTRUCTIONS] || '';
  
  const parts: string[] = [
    CORE_ROLE.FRONTEND_ARCHITECT,
    compactMeta ? `专注于 ${compactMeta}` : '',
    CORE_REQUIREMENTS,
    modeInst,
    '# Task\nGenerate production-ready React + Tailwind CSS code. Create MORE RATIONAL and COMPLETE UI.',
    '**YOU ARE ALLOWED TO:**\n- Add/remove/restructure UI sections for better UX\n- Add missing states, tabs, filters, flows\n- Adjust interaction logic to match conventions\n- Generate realistic data\n- Fix incomplete/irrational patterns',
    '**YOU MUST:**\n- Preserve product intent and domain\n- Preserve visual style (unless broken)\n- Produce fully working UI\n- Ensure all interactions complete and functional',
    '**YOU MUST NOT:**\n- Ask user for confirmation\n- Leave interactions incomplete\n- Mark as "example" or "demo"\n- Create placeholder "TODO" text',
  ];
  
  parts.push(INTERACTION_CLOSURE_RULES);
  
  if (includeDataRules) {
    parts.push(DATA_RULES);
  }
  
  if (includeInference) {
    parts.push(PRODUCT_INFERENCE);
  }
  
  parts.push('**Background & Text Color Rules:**\n- Default bg-white if not specified\n- Light bg: text-gray-900 (main), text-gray-600+ (secondary), text-blue-600+ (status)\n- Dark bg: text-white (main), text-gray-300+ (secondary)\n- Every text element MUST have explicit text-* class');
  parts.push('**Responsive Design:**\n- Mobile-first: w-full, overflow-x-hidden\n- No fixed widths, use break-words/truncate\n- Touch targets: min-h-[44px]');
  parts.push('**Language:** All text content must be in Chinese');
  
  parts.push(OUTPUT_CONTRACT.REACT);
  
  return parts.filter(p => p.trim()).join('\n\n');
}

// 意图加工与领域提示词（用户输入 → 加工后再传 LLM）
export {
  processIntentForCreate,
  processIntentForGenerateUI,
  type CreateModeResult,
  type GenerateUIModeResult,
} from './intent-processor';
export {
  detectDomain,
  getDomainById,
  getDomainUISystemSuffix,
  type DomainModule,
  type DomainId,
} from './domains';
export { DESIGN_PHILOSOPHY_PRINCIPLES } from './design-philosophy';
