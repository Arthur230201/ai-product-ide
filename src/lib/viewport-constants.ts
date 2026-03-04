/**
 * 标准视口尺寸（编辑/演示模式统一）
 * 保证预览与生成时使用同一比例，避免「一句话竖向排列」等布局错乱。
 */
export const PC_VIEWPORT_WIDTH = 1280;
export const PC_VIEWPORT_HEIGHT = 800;

export const MOBILE_VIEWPORT_WIDTH = 375;
export const MOBILE_VIEWPORT_HEIGHT = 812;

export type ViewportPreset = 'mobile' | 'desktop';

export function getViewportSize(preset: ViewportPreset): { w: number; h: number } {
  return preset === 'desktop'
    ? { w: PC_VIEWPORT_WIDTH, h: PC_VIEWPORT_HEIGHT }
    : { w: MOBILE_VIEWPORT_WIDTH, h: MOBILE_VIEWPORT_HEIGHT };
}
