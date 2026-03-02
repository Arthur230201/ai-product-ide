/**
 * UI Constitution（Stitch 方案）
 * 颜色、字体、设计原则等写进固定 system prompt，仅当次用户输入/交互为变量；
 * 风格一致、可缓存、请求体更短、延迟更低。
 * @see docs/expert-team/COMPETITOR_LEARNINGS_BREAKDOWN_20260205.md T7
 */

/** 固定设计 + 输出契约（与项目无关，可单独缓存） */
export const UI_CONSTITUTION = `
# 设计契约（固定，必须遵守）

## 背景色与文本颜色
- 默认背景：最外层必须 \`bg-white\`；禁止未明确要求时使用深色背景。
- 文本：主要 \`text-gray-900\`，次要 \`text-gray-600\` 或更深；禁止在白底上用 \`text-white\`、\`text-gray-100/200/300\`；状态色用 600 级别（如 \`text-cyan-600\`）。

## 视觉样式（必须应用）
- 主按钮/CTA：\`bg-cyan-500 hover:bg-cyan-600 text-white\` 或 \`bg-teal-500\`，禁止泛用 \`bg-blue-500\`。
- 卡片/列表项：\`rounded-lg\` 或 \`rounded-xl\`、\`shadow-md\` 或 \`shadow-lg\`、\`p-4\`，禁止无圆角无阴影白块。
- 字体层级：标题 \`font-bold\`/\`font-semibold\` + \`text-lg\`/\`text-xl\`；正文 \`text-gray-600\`/\`text-gray-500\`。
- 页面须有明确「有设计」的视觉风格。

## 输出契约
- 只返回完整 \`.tsx\` 代码；禁止输出向用户提问、索要描述或说明性文字；必须直接输出可运行的 React 组件代码。
- 图标从 \`lucide-react\` 导入；不包含 \`\`\`tsx 等 markdown 标记与注释。
`.trim();
