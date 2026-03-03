'use client';

import { LivePreview } from '@/components/canvas/LivePreview';
import { TEST_UI_CODE } from '@/lib/fixtures/test-ui-code';

const WIDTH = 375;
const HEIGHT = 812;

/**
 * 开发自检页：用固定测试 UI 代码渲染预览，验证 LivePreview / PreviewFrame 是否正常显示。
 * 访问 /dev/test-ui 即可检查主内容区是否填满、底栏是否可见。
 */
export default function DevTestUIPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <p className="text-sm text-gray-500 mb-4">测试 UI · 自检预览（/dev/test-ui）</p>
      <div
        className="relative mx-auto rounded-[45px] border-[12px] border-gray-900 overflow-hidden bg-white"
        style={{
          width: WIDTH,
          height: HEIGHT,
        }}
      >
        <div
          className="w-full overflow-hidden rounded-[32px] flex flex-col bg-white"
          style={{ width: '100%', height: HEIGHT, minHeight: HEIGHT }}
        >
          <div
            className="preview-inner-scroll w-full overflow-y-auto overflow-x-hidden flex flex-col flex-1 min-h-0"
            style={{ height: HEIGHT, minHeight: HEIGHT, scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <LivePreview
              code={TEST_UI_CODE}
              zoom={1}
              viewportPreset="mobile"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
