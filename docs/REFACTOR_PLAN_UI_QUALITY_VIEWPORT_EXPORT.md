# 最强大脑联合专家团队：五轮讨论与重构方案

> 参考 OpenUI（wandb）思路，面向三大目标：**高质量 UI 生成**、**导出 PRD/HTML 中 UI 可见**、**编辑/演示支持 PC 端与可调视口**。  
> 本文档为五轮专家讨论结论与可执行重构方案。

## 执行摘要（TL;DR）

| 目标 | 根因 | 方案 |
|------|------|------|
| **导出 PRD 中 UI 不可见** | 依赖 Babel/React 内联脚本易失败；previewUrl 常为空 | 导出前自动截图→用图片展示；纯 HTML 可内联片段 |
| **仅 1/3 空间、仅移动端** | 预览区固定 375px、右侧列 33% | viewportPreset（mobile/tablet/desktop）+ 可拖拽分栏 + 演示全屏 |
| **高质量 UI** | 生成默认移动端、无视口感知 | Prompt 带视口；可选输出校验；默认 desktop 美化 |

**优先级**：P0 导出可见 → P1 视口/布局 → P2 生成质量。

---

## 一、OpenUI 参考摘要

| 维度 | OpenUI | 本项目现状 |
|------|--------|------------|
| 输入 | 自然语言 / 截图 → 生成 UI | 文本 + 蓝图节点 → 静态 HTML → 美化/交互 |
| 预览 | 实时渲染、可迭代修改 | 实时预览（iframe），但仅移动端 375px 固定 |
| 输出 | React / Svelte / Web Components 等 | HTML 为主，PRD 导出含 UI 但存在不可见问题 |
| 部署 | Docker / Ollama 自托管 或 OpenAI API | Next.js + AI SDK，可配置多种模型 |

**可借鉴点**：  
- 描述即出 UI + 实时预览 + 多框架输出的产品形态。  
- 本项目的 HTML-First + 三段式（静态→美化→交互）已对齐「快速出稿 + 迭代」；需在**质量约束**、**导出可见性**、**视口与布局**上补强。

---

## 二、当前问题根因（专家共识）

### 2.1 导出 PRD/HTML 中 UI 不可见

- **根因 1**：全屏 PRD 导出（`generateFullPrdHtml`）中，有 `uiCode` 时渲染的是「占位 div + 内联脚本在 DOMContentLoaded 后挂载」。  
  - 脚本依赖 Babel/React CDN、且对 **HTML 片段** 与 **React 代码** 分支处理不一致；  
  - 若节点存的是 **纯 HTML**（`isHtml`），会走 `innerHTML` 注入；若为 React，需 Babel 转译。导出文件在离线或严格 CSP 下易导致脚本不执行 → **界面示意区域为空**。
- **根因 2**：`uiPreview`（截图/图）依赖 `view.previewUrl`。若从未在编辑态触发「导出图片」或截图，`previewUrl` 为空，导出时回退为「暂无预览」占位图，**用户感知为 UI 不可见**。
- **根因 3**：PRD 模板里 `.device-sandbox` / `.prd-ui-viewport` 的尺寸与 overflow 未与移动端/PC 端统一，部分环境下内容被裁切或未撑满，**视觉上像「没东西」**。

### 2.2 编辑/演示仅三分之一空间、仅移动端

- **根因 1**：详情面板右侧「实时预览」列写死为约 1/3 宽度，且预览容器固定 **375×812**（手机竖屏），无响应式与视口切换。  
  - 见 `NodeDetailPanel.tsx`：`width: '375px', height: '812px'`，外层为 `flex` 约 33.3%。
- **根因 2**：演示模式（`PresentationMode`）同样固定 375px 宽度 iframe，无「平板/桌面」选项。
- **根因 3**：未提供「预览区与说明区比例可调」或「全屏仅预览」的布局，导致编辑/演示时展示空间受限。

### 2.3 高质量 UI 生成

- **现状**：已有 UI Constitution、三段式 pipeline（静态→美化→交互）、HTML-First 渲染。  
- **缺口**：  
  - 移动端优先的 prompt/视口假设导致桌面端布局与字体偏小；  
  - 无显式「视口预设」（mobile/tablet/desktop）传入生成阶段；  
  - 设计约束（颜色、圆角、阴影）在 prompt 中有，但缺少「输出前校验」或轻量规则检查，质量依赖模型一次生成。

---

## 三、五轮专家讨论

### 第一轮：产品与目标对齐（Product Lead）

- **结论**：  
  - 三个目标等价于「**可用性**（导出能看）、**可调性**（看大屏/小屏）、**品质**（好看、好用）」；  
  - 优先级建议：**P0** 导出可见 → **P1** 视口/布局可调 → **P2** 持续提升生成质量（含视口感知）。
- **约束**：  
  - 不改变「HTML 为主、可选 React」的技术路线；  
  - 与 OpenUI 的差异保留（我们强 PRD/蓝图/多 Tab），不追求框架种类对等，只借鉴「描述→预览→导出」体验。

---

### 第二轮：UX 与信息架构（UX Expert）

- **结论**：  
  - **编辑页**：右侧预览应支持「移动 / 平板 / 桌面」三种视口预设，并允许**拖拽分栏**改变「说明 vs 预览」比例（例如 50:50、40:60、全屏预览）；  
  - **演示页**：同样提供视口切换 + 可选「全屏 iframe」以充分利用大屏；  
  - **导出 PRD**：每个页面/节点的「界面示意」必须**默认可见**：优先「可离线、无脚本」的静态方案（如内嵌图片或完整 HTML 片段），其次再考虑「需脚本的交互式」作为增强。
- **原则**：  
  - 同一节点在「编辑预览」与「导出 PRD」中的呈现应一致（同一视口预设可影响导出时的截图或嵌入尺寸）。

---

### 第三轮：前端与预览实现（Frontend / Canvas Engineer）

- **结论**：  
  - **视口与布局**：  
    - 在 canvas store 或节点级增加 **viewportPreset**：`'mobile' | 'tablet' | 'desktop'`，默认 `mobile`。  
    - 编辑面板右侧：不再写死 375px；根据 preset 使用 **375 / 768 / 1280**（或 100%）宽度，高度可 `min-height: 70vh` 或按比例。  
    - 增加**可拖拽分栏**（如 `react-resizable-panels` 或自实现）：左（Spec/Impl/Test）+ 右（Preview），比例持久化到 localStorage。  
  - **演示模式**：  
    - iframe 宽度随 preset 变化；提供「全屏预览」按钮，隐藏侧边/顶部栏，仅保留 iframe。  
  - **导出可见**：  
    - **方案 A（推荐）**：导出 PRD 前，对每个有 `view.code` 的节点**自动生成一次预览图**（用现有 html-to-image 或 iframe 截图），写入 `previewUrl`，导出 HTML 时**仅用图片**展示「界面示意」，不依赖内联脚本。这样离线打开 PRD 必见 UI。  
    - **方案 B（增强）**：在导出 HTML 中，对「纯 HTML」节点内联完整 HTML 片段（含 style），用 `<div class="prd-ui-viewport">` 包裹，不依赖 React/Babel；仅当用户明确选择「交互式 PRD」时再注入 React 挂载脚本（并注明需联网）。

---

### 第四轮：架构与数据流（System Architect）

- **结论**：  
  - **单一事实源**：节点 `artifacts.view` 保留 `code`、`htmlTemplate`（若有）、`previewUrl`；新增可选 `viewportPreset`（可放在节点或项目级）。  
  - **导出流水线**：  
    - 导出全屏 PRD 时：先 **prepareExport**（为每个节点确保有 previewUrl：无则用当前 code 生成截图），再生成 HTML。  
    - 模板中「界面示意」块：**始终渲染一张图**（`previewUrl`）；若未来要做「交互式 PRD」，再在下方加可选「交互预览」区域（需脚本）。  
  - **生成质量**：  
    - UI pipeline 的 prompt 增加 **视口参数**（如 "viewport: desktop 1280px"），让模型输出适配大屏的布局与字号；  
    - 可选：在返回 HTML 上做轻量校验（必含 `bg-white`、禁止 `text-white` 于白底等），与 UI Constitution 一致。

---

### 第五轮：交付与优先级（Delivery / QA）

- **结论**：  
  - **Phase 1（导出可见）**：  
    - 实现「导出前自动生成 previewUrl」；  
    - PRD HTML 模板中界面示意**仅用 img + previewUrl**，移除或延后「依赖 Babel/React 的挂载脚本」；  
    - 对纯 HTML 节点，导出时可选「内联 HTML 片段」到该区块（无脚本），保证打开即见。  
  - **Phase 2（视口与布局）**：  
    - 引入 viewportPreset（mobile/tablet/desktop）；  
    - 编辑面板、演示模式按 preset 调整预览宽度；  
    - 可拖拽分栏 + 比例持久化。  
  - **Phase 3（生成质量）**：  
    - Prompt 增加视口维度；  
    - 可选：输出校验或「美化」默认使用 desktop 预设。  

---

## 四、重构方案总览

| 目标 | 方案要点 |
|------|----------|
| **1. 高质量 UI** | 生成阶段传入 viewport 预设；Constitution 约束保持；可选输出校验或二次美化默认 desktop。 |
| **2. 导出 PRD/HTML 中 UI 可见** | 导出前为每个节点补齐 `previewUrl`（截图）；模板以**图片**为主展示界面示意；纯 HTML 可内联片段（无脚本）作为增强。 |
| **3. 编辑/演示支持 PC 与可调空间** | 新增 viewportPreset；编辑/演示按 preset 设预览宽度；可拖拽分栏 + 全屏预览。 |

---

## 五、可执行任务清单与优先级

### P0：导出 PRD 时 UI 必见（Phase 1）

1. **导出前生成预览图**  
   - 在 `exportToFullPrdHtml` 调用前，对 `nodes` 中每个有 `artifacts.view.code` 的节点：若缺少 `previewUrl`，则调用现有「导出图片」逻辑（或封装为 `captureNodePreview(node)`），将结果写入节点或临时结构，并传入导出函数。  
   - 文件：`src/utils/prdGenerator.ts`、调用处（如 `ProjectToolbar` 或导出入口）。

2. **PRD 模板以图片为主**  
   - 修改 `generateFullPrdHtml` 内「界面示意」块：**始终使用 `uiPreview`（图片）** 展示，移除「有 uiCode 即渲染 root div + 脚本挂载」的路径；或保留为「可选交互式」且注明需联网。  
   - 确保 `uiPreview` 在 prepare 阶段一定来自截图或已有 previewUrl，不再回退到「暂无预览」占位图（除非节点真的没有 view 内容）。  
   - 文件：`src/utils/prdGenerator.ts`（模板与 nodeData 的 uiPreview 来源）。

3. **纯 HTML 导出可选内联**  
   - 若节点为纯 HTML（无 React），在导出 HTML 的该节点区块内，可选「内联 HTML 片段」（已做 style 作用域或 class 限定），使离线打开也能看到静态 UI，不依赖脚本。  
   - 文件：`src/utils/prdGenerator.ts`。

### P1：视口与布局可调（Phase 2）

4. **viewportPreset 状态**  
   - 在 `canvas-store` 或节点数据中增加 `viewportPreset: 'mobile' | 'tablet' | 'desktop'`（建议先放 store 全局）。  
   - 提供 UI 切换（下拉或 Tab）：移动 / 平板 / 桌面。  
   - 文件：`src/store/canvas-store.ts`、`NodeDetailPanel.tsx`、`PresentationMode.tsx`。

5. **编辑面板预览区随 preset 变化**  
   - 根据 viewportPreset 设置预览宽度：mobile 375，tablet 768，desktop 1280 或 100%。  
   - 高度统一用 `min-height`（如 70vh）或比例，避免固定 812。  
   - 文件：`NodeDetailPanel.tsx`、`MobileDevicePreview.tsx`（或重命名为通用 Preview 组件）。

6. **可拖拽分栏**  
   - 详情面板：左（Spec/Impl/Test）与右（Preview）之间可拖拽调整比例，比例持久化到 localStorage。  
   - 库：`react-resizable-panels` 或自实现。  
   - 文件：`NodeDetailPanel.tsx`。

7. **演示模式视口与全屏**  
   - 演示模式 iframe 宽度随 viewportPreset 变化；增加「全屏预览」按钮，隐藏其他 UI，仅保留 iframe。  
   - 文件：`PresentationMode.tsx`。

### P2：生成质量与视口感知（Phase 3）

8. **生成时传入视口**  
   - 在 `generateStaticUIFromText` / 美化 / 交互 的 prompt 中增加「当前视口：mobile/tablet/desktop」及建议宽度，使生成布局与字号适配。  
   - 文件：`src/app/actions/ui-pipeline.ts`、相关 prompt 构造处。

9. **可选：输出校验**  
   - 对返回 HTML 做轻量规则检查（如白底、禁止白底白字等），与 UI Constitution 一致；失败时可自动走一次「美化」或提示用户。  
   - 文件：`src/lib/ui/html-validator.ts` 或新建、在 pipeline 中调用。

---

## 六、与 OpenUI 的对照与取舍

- **对齐**：描述→实时预览→可迭代修改→导出；多模型/自托管能力。  
- **保留差异**：我们以 PRD+多 Tab（View/Spec/Impl/Test）为核心，导出为「可读 PRD 文档」为主；不强制多框架导出，优先「导出必见 UI」与「视口可调」。  
- **后续可做**：若需要「导出为 React/Svelte」可单独做一阶段，与当前重构解耦。

---

## 七、总结

- **五轮讨论**明确了：先解决**导出可见**（P0），再**视口与布局**（P1），再**生成质量与视口感知**（P2）。  
- **导出可见**：依赖「导出前截图 + 模板用图」与「纯 HTML 内联」两招，不依赖复杂脚本。  
- **视口与空间**：viewportPreset + 可拖拽分栏 + 演示全屏，让编辑与演示都能用满 PC 端空间。  
- **高质量 UI**：prompt 带视口、保持 Constitution、可选校验与默认 desktop 美化。  

按上述任务清单分 Phase 实施，即可在不大改架构的前提下达成三项重构目标。

---

## 八、实施检查表（跟踪用）

| # | 任务 | Phase | 状态 |
|---|------|-------|------|
| 1 | 导出前为节点生成 previewUrl（截图） | P0 | ✅ |
| 2 | PRD 模板界面示意仅用图片，移除脚本挂载依赖 | P0 | ✅ |
| 3 | 纯 HTML 节点导出可选内联片段 | P0 | ⬜ 延后 |
| 4 | viewportPreset 状态（store + UI 切换） | P1 | ✅ |
| 5 | 编辑面板预览宽度随 preset（375/768/1280 或 100%） | P1 | ✅ |
| 6 | 可拖拽分栏 + 比例持久化 | P1 | ⬜ 待做 |
| 7 | 演示模式视口 + 全屏预览按钮 | P1 | ✅ |
| 8 | UI 生成 prompt 增加视口参数 | P2 | ⬜ |
| 9 | 可选：输出校验 / 默认 desktop 美化 | P2 | ⬜ |
