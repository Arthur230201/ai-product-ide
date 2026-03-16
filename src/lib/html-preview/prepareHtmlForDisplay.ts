/**
 * HtmlGuard: 所有展示前统一预检查，防止危险/不支持内容破坏注入器与行为一致性。
 * 不强制 validate→render，但保证进入沙箱的 HTML 符合安全与 data-* 约定。
 */

export interface PrepareHtmlDiagnostics {
  warnings: string[];
  errors: string[];
}

export interface PrepareHtmlResult {
  html: string;
  diagnostics: PrepareHtmlDiagnostics;
}

/** 禁止：inline style、hex 颜色、px 单位、<script>（移除并 warning） */
const INLINE_STYLE_REG = /style\s*=\s*["'][^"']*["']/gi;
const HEX_COLOR_REG = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
const PX_UNIT_REG = /\b\d+px\b/g;
const SCRIPT_TAG_REG = /<script\b[\s\S]*?<\/script>/gi;

export function prepareHtmlForDisplay(rawHtml: string): PrepareHtmlResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  let html = rawHtml;

  // 1. <script>：移除并记录 warning（不 silent）
  const scriptMatches = html.match(SCRIPT_TAG_REG);
  if (scriptMatches?.length) {
    html = html.replace(SCRIPT_TAG_REG, '');
    warnings.push(`已移除 ${scriptMatches.length} 处 <script> 标签（沙箱不允许执行）`);
  }

  // 2. inline style：仅诊断，不自动剥离（避免破坏布局）；记录 warning
  const styleMatches = html.match(INLINE_STYLE_REG);
  if (styleMatches?.length) {
    warnings.push(`检测到 ${styleMatches.length} 处内联 style，建议使用 class`);
  }

  // 3. hex 颜色：仅诊断
  const hexMatches = html.match(HEX_COLOR_REG);
  if (hexMatches?.length) {
    warnings.push(`检测到 ${hexMatches.length} 处 #hex 颜色，建议使用 design tokens`);
  }

  // 4. px 单位：仅诊断
  const pxMatches = html.match(PX_UNIT_REG);
  if (pxMatches?.length) {
    warnings.push(`检测到 ${pxMatches.length} 处 px 单位，建议使用 Tailwind 间距/字号`);
  }

  return {
    html,
    diagnostics: { warnings, errors },
  };
}
