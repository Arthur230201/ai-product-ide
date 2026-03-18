/** 画布工具栏与模态之间解耦通信（避免深层 props  drilling） */
export const OPEN_STYLE_EXTRACTOR_EVENT = 'fractal-canvas-open-style-extractor';

export function dispatchOpenStyleExtractor(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_STYLE_EXTRACTOR_EVENT));
}
