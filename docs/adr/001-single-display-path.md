# ADR-001：单一展示路径（Single Display Path）

**状态**：已采纳（待落地）  
**日期**：2025-03

## 决策

- **唯一展示组件**：所有 HTML 预览统一使用 `HtmlSandboxRenderer`（iframe + BehaviorInjector 直接初始化），不再使用 HtmlSandbox 的 postMessage 脚本注入路径。
- **唯一注入实现**：注入逻辑只保留一份（BehaviorInjector / RuntimeInjector 合并或统一入口）；LivePreview、PresentationMode、HtmlFirstPreview 均通过同一组件展示，保证同一份 HTML 在各入口交互一致。
- **展示前 Guard**：新增 `prepareHtmlForDisplay({ html, plan?, nodeId? }) → { html, diagnostics }`；有 plan 时走 validatePlan（必要时 renderHtml），仅 html 时跑 HtmlGuard（禁 inline style/script、禁 hex/px、检查 data-* 钩子），所有展示只接收 preparedHtml。
- **NAV 闭环**：iframe 内 data-edge-ref/data-nav 点击 → injector 回调宿主 onNav(edgeRef) → 宿主解析 target node 并选中/渲染；所有模式（LivePreview、PresentationMode）点击导航均能切到目标节点。

## 完成标准

- LivePreview / UniversalHtmlRenderer / PresentationMode 均走 HtmlSandboxRenderer，注入逻辑仅一份。
- 所有展示入口在渲染前调用 prepareHtmlForDisplay（validate 或 HtmlGuard），只接收 preparedHtml。
- 所有模式下点击 data-nav/data-edge-ref 均可切到目标节点（NAV 闭环）。
