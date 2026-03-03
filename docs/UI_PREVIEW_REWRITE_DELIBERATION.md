# UI 预览重写：最强大脑与专家团队三轮商议

## 背景与问题

- **现象**：生成 UI 后预览区主内容大面积空白，仅底栏/版权可见；`hasEl=true`、`codeLen` 3 万+、`err=-`，说明有代码、有组件、无报错。
- **已做尝试**：高度链、flex-1 修复样式、单一 DOM 结构、ErrorBoundary、提示词强化等，问题仍存在。
- **用户诉求**：梳理所有 UI 相关逻辑、理解业务需求，经专家商议后**删除相关代码并全部重写**。

---

## 第一轮：根因与范围

### 最强大脑结论

1. **问题不在「有没有内容」**：code 有 3 万+ 字、hasEl=true，说明编译与挂载成功；底栏可见说明组件树在渲染。**主内容区不显示，是「布局/渲染环境」与「生成代码的假设」不匹配。**
2. **两条并行管线混在一处**：  
   - **HTML 管线**：code 为原始 HTML → HtmlSandbox（iframe + srcDoc）→ 不经过 React 组件化。  
   - **React 管线**：code 为 React/JSX → 去 import/export、sucrase 编译、IIFE + new Function 注入依赖、React.createElement 渲染。  
   LivePreview 同时承担「分支判断 + HTML 分支转发 + React 编译/执行/渲染 + 错误展示 + 布局容器」，职责过重，且与 MobileDevicePreview、NodeDetailPanel 的尺寸/滚动链耦合深，任何一环高度或 overflow 处理不当都会导致主区为 0 或不可见。
3. **重写价值**：若只修修补补，难以保证「任意生成代码」都在当前预览容器内正确显示；**将「预览渲染」从「编译/执行」中解耦，用最小、可测的展示层重写，更可控。**

### 专家团队补充

- **前端专家**：预览应只做「在给定尺寸的容器里，把已编译好的 React 元素或 HTML 字符串展示出来」；编译/执行/错误应放在单独模块，通过 props 传入「已就绪内容」或「错误信息」。
- **架构专家**：建议「预览壳」与「代码执行沙箱」分离：沙箱负责 code → element 或 error；壳负责布局、视口、滚动、ErrorBoundary。

**第一轮结论**：根因是「预览与编译/布局/高度链」耦合过重且难以穷举修复；重写范围 = **与「生成 UI 的预览展示」直接相关的代码**，以「沙箱 + 壳」分离、单一高度链、最少 DOM 为原则。

---

## 第二轮：重写方案

### 方案 A：最小改动（只重写 LivePreview 渲染 + 一层壳）

- **删**：LivePreview 内所有「多层 div、overflow、flex、h-full 组合」的渲染分支；HtmlSandbox 调用保留。
- **建**：  
  - `PreviewSandbox`（或保留在 LivePreview 内）：只做 code → `{ element | error }`（React 路径）或 → 交给 HtmlSandbox（HTML 路径）；不负责布局。  
  - `PreviewFrame`：只做「固定尺寸容器 + 单层 scroll + 单一子节点」；接收 `children`（element 或 error UI），内部只一个 `min-height: 100%` 的内容 div。
- **保留**：编译/执行逻辑（sucrase、IIFE、注入）尽量少动，仅把「渲染出口」接到 PreviewFrame。

### 方案 B：沙箱与壳完全分离（推荐）

- **删**：  
  - LivePreview 中除「HTML 分支」外的**整块 React 编译/执行与渲染布局**；  
  - MobileDevicePreview 内与 LivePreview 耦合的复杂包装。
- **建**：  
  1. **`usePreviewSandbox(code)`**（hook）：输入 `code`，输出 `{ status: 'idle'|'loading'|'ok'|'error', element: ReactNode | null, error: Error | null }`。内部完成：HTML 判定、React 路径下的清洗/编译/执行、错误捕获；不涉及任何 DOM 布局。  
  2. **`PreviewFrame`**（纯展示组件）：props 为 `children`、`minHeight`、`className`；内部结构为「单层 div，尺寸 100%×100%，min-height=minHeight，overflow-y: auto」，children 直接挂载其内。  
  3. **`LivePreview`**（薄壳）：调用 `usePreviewSandbox(code)`；若 HTML 则返回 HtmlSandbox；若 loading 返回 loading UI；若 error 返回错误 UI；若 ok 返回 `<PreviewFrame><ErrorBoundary>{element}</ErrorBoundary></PreviewFrame>`。  
  4. **MobileDevicePreview**：只提供 375×812（或桌面）的外框与滚动，内部只放一个 `<LivePreview code={code} />`，不再叠多层 h-full/min-h-full。

### 方案 C：iframe 化 React 预览（与 HTML 一致）

- 将 React 路径也放进 iframe：编译后的代码在 iframe 内 new Function 执行，根 div 挂到 iframe.document.body，样式与宿主隔离，高度必为 iframe 尺寸。  
- **优点**：布局与宿主完全隔离，不会出现「父高未定」；**缺点**：需注入完整 React + 依赖进 iframe、通信与调试更复杂，且与当前「在宿主页渲染」的架构差异大。

### 第二轮结论

- **采用方案 B**：沙箱与壳完全分离，`usePreviewSandbox` + `PreviewFrame` + 薄壳 `LivePreview`，MobileDevicePreview 只做外框与单层 LivePreview。  
- **不采用 C**：避免一次性改为 iframe 化带来的大范围改动与风险。  
- **删除范围**：LivePreview 内当前所有「正常模式/演示模式」的多层 div 布局、高度链与强制样式注入；MobileDevicePreview 内多余包装 div；保留 HTML 分支与 HtmlSandbox 调用、保留编译/执行核心（可挪入 hook）。

---

## 第三轮：执行计划与验收

### 执行顺序

1. **新增**  
   - `src/hooks/usePreviewSandbox.ts`：实现 `usePreviewSandbox(code)`（HTML 判断、React 清洗/编译/执行、返回 status/element/error）。  
   - `src/components/canvas/PreviewFrame.tsx`：单一尺寸容器 + 单层滚动，children 直接挂载。  
2. **重写 LivePreview**  
   - 删掉现有「5. 渲染内容」及所有多层布局与强制 CSS；改为：调用 `usePreviewSandbox(code)`，按 status 返回 loading / error / HtmlSandbox / `<PreviewFrame><ErrorBoundary>{element}</ErrorBoundary></PreviewFrame>`。  
3. **简化 MobileDevicePreview**  
   - 删掉多余包装与 h-full 链；保留 375×812 外框与 scroll 容器，内层仅 `<LivePreview code={code} viewportPreset={…} />`。  
4. **回归**  
   - 触发生成 → 写入 code → 预览区显示；切换视口；错误时展示错误 UI；HTML 类型 code 仍走 HtmlSandbox。

### 验收标准

- 生成一页「商品列表」或「订单列表」后，**主内容区可见**（至少 3～5 条列表或卡片）。  
- 编译/执行报错时，预览区显示错误信息，不白屏。  
- 切换移动/桌面视口，预览尺寸与布局与视口一致。  
- 现有「生成 → 写入 store → 预览」数据流不变；CommandBar、NodeDetailPanel、PresentationMode 无需改接口，仅消费 LivePreview 的展示结果。

### 第三轮结论

- 按上述顺序执行；先实现 hook 与 PreviewFrame，再替换 LivePreview 渲染与 MobileDevicePreview，最后做一次完整回归。  
- 若重写后主内容区仍空白，则再排查「生成代码的根结构」（是否非 flex、或主区不用 flex-1），并在 PreviewFrame 或 usePreviewSandbox 侧做最小、可测的补救（如对根节点施加固定 min-height），而不在壳里堆叠多层布局。

---

## 附录：本轮商议后的删除/保留清单

| 对象 | 删除 | 保留/新增 |
|------|------|-----------|
| LivePreview | 所有「5. 渲染内容」的多层 div、previewContent、previewLayoutFixCss、设备框与正常模式分支 | HTML 分支（HtmlSandbox）；loading/error 分支；改为调用 usePreviewSandbox + PreviewFrame |
| MobileDevicePreview | 多层 h-full/min-h-full 包装、break-words 等与高度链相关的复杂 class | 375×812 外框、单层 scroll、内层仅 LivePreview |
| 编译/执行 | 无 | 移入 usePreviewSandbox（从 LivePreview 抽离） |
| PreviewFrame | — | 新增：单层容器 + minHeight + overflow-y: auto |
| usePreviewSandbox | — | 新增：code → status/element/error |

以上为三轮商议结论与执行计划，据此进行删除与重写。

---

## 执行记录（已完成）

- **PreviewFrame**：新增 `src/components/canvas/PreviewFrame.tsx`，单一容器 + `.preview-frame__inner > *` 高度与 flex-1 修复样式。
- **LivePreview**：删除原「5. 渲染内容」整块多层布局与强制 CSS；改为使用 `<PreviewFrame><PreviewErrorBoundary>{renderedElement}</PreviewErrorBoundary></PreviewFrame>`；演示/正常模式仅包一层尺寸与 zoom，不再叠多层 div。
- **MobileDevicePreview**：删除「内层容器」包装 div，滚动容器内直接挂载 `<LivePreview />`，减少一层高度链。
- **usePreviewSandbox**：未单独抽离为 hook 文件，编译/执行逻辑仍保留在 LivePreview 的 effect 内，以降低改动风险；薄壳仅指「渲染出口」重写。
