/**
 * Tailwind recipes — 单一真源：仅从 theme.tokens.json 读取，不再手写常量。
 * BehaviorInjector: tabs use role=tab + data-tab + panel id; buttons data-action submit/open-modal.
 */
import themeTokens from '../registry/theme.tokens.json';

type ThemeTokens = {
  density: Record<string, { container: string; gap: string; card: string; title: string; body: string }>;
  recipes: Record<string, string>;
};
const tokens = themeTokens as ThemeTokens;

export type DensityKey = 'comfortable' | 'compact' | 'airy';

export function getDensityClasses(density: DensityKey) {
  const d = tokens.density[density] || tokens.density.comfortable;
  return {
    container: d.container,
    gap: d.gap,
    card: d.card,
    title: d.title,
    body: d.body,
  };
}

/** 所有 class 字符串来自 theme.tokens.json recipes，单一真源 */
export const recipes = tokens.recipes;

export function buttonClasses(variant: string | undefined, size: string | undefined): string {
  const base = 'rounded-md font-medium';
  const v = variant || 'default';
  const s = size || 'md';
  const sizeCls = s === 'lg' ? 'px-4 py-2.5 text-base' : s === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  const r = recipes as Record<string, string>;
  if (v === 'outline') return `${r.buttonOutline ?? ''} ${sizeCls} ${base}`;
  if (v === 'secondary') return `${r.buttonSecondary ?? ''} ${sizeCls} ${base}`;
  return `${r.buttonPrimary ?? ''} ${sizeCls} ${base}`;
}
