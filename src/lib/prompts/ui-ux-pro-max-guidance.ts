/**
 * UIUXProMax 设计智能 — 唯一设计基准
 * 本段为 UI 生成的设计智能基准，一切向此看齐。可访问性、对比度、触控、布局、动效、交付自检均由此段定义，不再在其它提示中重复打补丁。
 * 参考：https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
 */

export const UI_UX_PRO_MAX_GUIDANCE = `

# [UIUXProMax 设计智能 - 设计基准，必须遵守]

**本段为设计基准**：可访问性、对比度、触控、布局、动效与交付自检均以本段为准。若与前述 Design Philosophy 或其它描述冲突，以本段为准。

## 可访问性与对比度
- 正文与背景对比度至少 4.5:1（浅色背景用 text-gray-900 / text-slate-800 主文、text-gray-600 以上次要文）。
- 所有可点击元素须有可见 focus 状态（如 ring-2 ring-offset-2 或 outline）。
- 图标按钮须带 aria-label 或内联说明，不单独依赖颜色传达信息。

## 触控与交互
- 可点击元素最小触控区域约 44×44px（min-h-[44px] 或 py-3），间距至少 8px。
- 所有可点击元素加 \`cursor-pointer\`，hover 状态使用 150–300ms 过渡（transition）。
- 异步操作时按钮禁用并显示加载态，错误信息靠近表单项展示。

## 图标与风格一致
- 图标使用 Lucide 组件名（如 <Search />、<User />）或内联 SVG；禁止用 Emoji 充当功能性图标（导航、操作、状态等）。装饰性元素（如评分星、占位）可用 Emoji。
- 全页保持同一套阴影/圆角体系（如统一 rounded-lg、shadow-md），不混用多种风格。

## 动效与可访问
- 微交互时长 150–300ms，避免动画超过 500ms；优先使用 transform/opacity，避免动画 width/height 导致布局抖动。
- 尊重 prefers-reduced-motion：若需支持，可对动画使用 \`@media (prefers-reduced-motion: reduce)\` 降级。

## 响应式与布局
- 移动端：375px 起、关键断点 768 / 1024 / 1440；禁止横向滚动，正文区使用 flex-1 min-h-0 overflow-y-auto。
- 桌面端：容器使用 max-w-6xl 或 max-w-7xl，侧栏 min-w-[200px] 以上，正文横向排版。

## 交付前自检（生成时即满足）
- 无 Emoji 作图标；可点击元素有 cursor-pointer 与 hover 过渡。
- 浅色背景下无过浅文字（禁止 text-gray-300/400 在白色背景）；focus 状态可见。
- 主内容区用真实业务数据填满，非空数组/占位骨架。
`;
