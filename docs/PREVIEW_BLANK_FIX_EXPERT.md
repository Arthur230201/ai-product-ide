# 预览主内容区空白 — 专家结论与修复

## 现象

- 调试条：`branch=preview`、`hasEl=true`、`codeLen=3万+`、`err=-`
- 底部可见：版权、「编辑中: 商品列表」等
- 中间主内容区：大片空白

## 根因（专家定位）

1. **生成 UI 代码**：为典型「顶栏 + 主内容(flex-1) + 底栏」结构，主内容区用 `flex-1` 或 `flex-grow` 占满剩余高度。
2. **预览侧**：包住生成组件的根容器虽给了 `height:100%`、`minHeight:812`，但**生成组件的根节点**往往没有写 `height:100%` 或 `min-h-full`，导致根节点高度由内容撑开；根若为 `flex flex-col`，中间 `flex-1` 在「父高未定」时会被算成 **0**，主内容区不显示。
3. **flex-1 参与分配**：在 flex 布局下，子项 `flex:1` 要正确占满剩余空间，通常需要 **min-height:0**（否则在部分浏览器中不会收缩/分配），否则中间区域仍可能为 0。

结论：**不是生成代码缺内容，而是「根节点高度未定 + flex-1 未设 min-height:0」导致主内容区被压成 0。**

## 已做修复

1. **单一高度链**（LivePreview 重构）
   - 预览只保留一层 `.live-preview-root`（`height:100%`、`minHeight:812`），内层直接渲染生成组件。
   - MobileDevicePreview 包 LivePreview 的 div 使用 `h-full min-h-full`，保证 812px 视口高度传到 LivePreview。

2. **强制布局修复样式**（注入到 `.live-preview-root` 内）
   - `.live-preview-root > *`：强制生成组件**根节点** `height:100%`、`min-height:100%`、`box-sizing:border-box`，使根获得明确 812px 高度。
   - `.live-preview-root [class*="flex-1"], .live-preview-root [class*="flex-grow"]`：为带 `flex-1`/`flex-grow` 的节点加上 `min-height:0`，使中间主内容区能参与 flex 分配并显示/滚动。

3. **未改动的部分**
   - 编译/执行逻辑（sucrase、IIFE、PreviewUI/cn、图标替换）未改；仅渲染容器与注入 CSS。

## 若仍空白

- 打开控制台看是否有运行时报错（如未定义组件）。
- 确认生成代码中主内容区是否使用 **Tailwind 的 `flex-1`/`flex-grow`**（当前 CSS 按 class 匹配）；若主内容仅用 `style={{ flex: 1 }}` 且仍空白，可考虑在提示词中要求主内容区容器使用 `className="flex-1"` 便于注入修复生效。
