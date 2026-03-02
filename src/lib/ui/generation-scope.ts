/**
 * Generation Scope
 * 定义生成作用域，控制UI生成流程的复杂度
 */

export type GenerationScope = 'UI_ONLY' | 'UI_AND_DOCS';

/**
 * 默认作用域：只生成UI，不生成文档
 * 文档生成（PRD/需求表/测试用例）应通过独立action按需触发
 */
export const DEFAULT_SCOPE: GenerationScope = 'UI_ONLY';

/**
 * 检查是否为UI_ONLY模式
 */
export function isUIOnly(scope?: GenerationScope): boolean {
  return !scope || scope === 'UI_ONLY';
}


