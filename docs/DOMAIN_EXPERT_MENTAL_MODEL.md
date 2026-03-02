# 领域最强大脑：应用全貌与所需能力

本文档从「领域内最强大脑」的视角，系统梳理 AI-Native Product IDE 的**全部细节**、**思考方式**与**必备能力**，供架构决策、招聘与自检使用。

---

## 一、应用本质（一句话）

**一个基于分形节点 + 无限画布的 IDE，把「界面 → 需求 → 技术实现 → 测试」四维合一为单一真相源，通过 Triple-Engine 输入（文本/文档/视觉）生成拓扑，通过三段式 UI 流水线生成可运行界面，并预留反向调和与上下文链式 Prompt 的扩展。**

---

## 二、核心领域概念（必须内化）

### 2.1 分形节点 (Fractal Node)

- **定义**：画布上的每个「页面/屏幕」是一个节点，节点不是单一文档，而是 **4 个全息维度（Tabs）** 的容器。
- **四维**：
  - **View**：可运行的 UI（React/Tailwind 或 **单文件 HTML**）。沙箱执行，支持 `htmlTemplate` 与 `code` 双轨。
  - **Spec**：PRD（标题 + 结构化需求列表 + 可选 `prdConfig`）。
  - **Impl**：技术实现（API 端点列表 + 数据库 schema）。
  - **Test**：测试用例列表（从 Logic 派生）。
- **扩展维度**（与业务建模强相关）：
  - **userStories**：用户故事（Agile 格式：id, role, activity, value, acceptanceCriteria）。
  - **events**：业务事件（仅 Action 页：trigger, processFlow, outcome）。
  - **dataQueries**：数据查询需求（仅 View 页：排序、过滤、数据源）。
  - **traceability**：与全局用户旅程/事件的映射（implementsJourney, journeyStep, triggersEvent, consumesEvent）。
- **同步状态**：`syncState: { isSynced, lastSource: 'view'|'spec'|'impl' }`，用于漂移检测与反向调和。当前仅 view.code 的合并策略完善（有效则采用、无效则保留）；Spec/Impl 由 View 或 Impl 变更触发的**反向更新未实现**，完整 Drift Detection 仍在演进。

### 2.2 边与导航 (Edge / Navigation)

- **边** 不仅表示「连接」，还携带 **EdgeNavMeta**：
  - **trigger**：ROLE_ENTRY | PERMISSION_ENTRY | UI_CLICK | SYSTEM_REDIRECT。
  - **conditionType**：role | permission | expression | none。
  - **condition**：roles / permissions / expr。
  - **sourceHint**：elementText、elementId、elementSelector（用于 UI_CLICK 时定位按钮/链接）。
  - **priority**：多分支时的选择顺序。
- 领域最强大脑会自然想到：**边 = 页面跳转 + 权限/角色/表达式条件 + 触发元素**，而不是「一条线」。

### 2.3 页面类型 (Page Type)

- **Action**：表单/编辑器，数据创建与修改；可挂 **events**（业务事件），不可挂 dataQueries。
- **View**：列表/仪表板，数据消费；可挂 **dataQueries**，不可挂 events。
- 拓扑生成（generate-graph）时，AI 必须为每个节点标注 `pageType: 'Action' | 'View'`，并据此填充 events 或 dataQueries。

### 2.4 项目级上下文 (Project Meta & Global Rules)

- **ProjectMeta**：项目名、行业、目标用户、描述、版本；扩展字段包括应用范围、核心对象规模、关键功能、集成系统、合规约束、角色权限等（「项目画像」）。
- **GlobalRules**：性能、安全、兼容性、错误处理、数据追踪等 NFR。
- **AIConfig**：visionModel / textModel（可被用户覆盖）。
- 这些会注入到 **PRD 生成、UI 生成、拓扑生成** 的 prompt 中，领域专家必须清楚「哪里用到了 projectMeta / globalRules」。

### 2.5 UI 生成哲学：HTML-First + 三段式 Pipeline

- **HTML-First**：用户/AI 提供的 HTML **不强制转 React**，在 iframe 沙箱中原样渲染，通过 **BehaviorInjector** 注入交互（下拉、Tab、筛选、按钮等），宿主只负责布局、路由与 AI 编排。
- **三段式 UI Pipeline**（ui-pipeline.ts）：
  - **Stage 1 - STATIC**：只生成静态单文件 HTML（内联 CSS、无 script、语义化、data-component-id、占位图/占位 SVG、6–10 条示例、桌面优先 + 768px 媒体查询）。
  - **Stage 2 - BEAUTIFY**：只改样式，不改 DOM 结构语义。
  - **Stage 3 - INTERACT**：只新增交互（data-action、事件委托），保持结构稳定。
- 每阶段输出带 **Stage Marker**（如 `<!-- UI_PIPELINE:STAGE=INTERACT;... -->`），便于校验与降级。
- **JIT 视觉流水线**（jit-visual-pipeline）：结构标准化（Guardrails）→ 语义配置层（Tailwind config 覆盖，不改 HTML class）→ 组件映射/修复层（贴底导航、h-screen → min-h-[100dvh] 等）。

### 2.6 拓扑输入三引擎 (Triple-Engine)

- **Idea-to-Graph**：文本 prompt → `generateGraph`（callObject/callText + safeParseZodJson，失败时 fallback 图）。
- **Doc-to-Graph**：上传 PRD/文档 → 解析后作为 prompt 或结构化输入进入同一套 `generateGraph` 逻辑（含 UserJourney、GlobalBusinessEvent 等）。
- **Vision-to-Graph**：图片（截图/Figma）→ **parseTopology**（视觉模型）得到节点与边，再映射为 Fractal 节点；或 **generateGraph** 的 `mediaBase64` 多模态输入。
- 领域专家会统一理解为：**所有输入最终都收敛为 nodes + edges + 可选 userStories/events/dataQueries/traceability**。

### 2.7 AI 调用统一网关 (LLM Gateway)

- **入口**：`callText` / `callObject`（lib/ai/llm.ts），经 **gateway-queue** 排队、去重、超时与 429 冷却。
- **返回**：`AIResult<T>` 判别联合类型（ok: true + data + metrics | ok: false + type + message + cooldownSeconds）。
- **AIErrorType**：RATE_LIMIT | NETWORK | PROVIDER | PARSE。
- **约束**：No Fluff（Agent 输出严格 JSON/Code）；设计系统通过 themeConfig / 提示词约束（如 PrimaryButton）注入，而非硬编码组件库。

### 2.8 画布与状态 (Canvas Store)

- **Zustand + persist**：nodes, edges, selectedNodeId, currentTheme, projectMeta, globalRules, aiConfig；以及 isDetailPanelOpen、isBlueprintOpen、blueprintInitialTab 等 UI 状态。
- **updateNodeData**：深层合并 artifacts（view/spec/impl/test 等），对 **view.code** 有「有效则采用、无效则保留原样」的合并策略，避免 AI 一次失败清空已有代码。
- **关键操作**：addNode, addNodes, addEdges, layoutNodes, loadProject, exportProject, updateProjectMeta, updateGlobalRules, updateAIConfig, openBlueprint。

### 2.9 预览与沙箱

- **LivePreview**：根据内容检测 HTML vs React，HTML 走 **HtmlSandboxRenderer**（iframe + Tailwind CDN + BehaviorInjector），React 走现有 JIT 编译（BabelExecutor/ReactJitRenderer 等）。
- **UniversalHtmlRenderer / HtmlFirstPreview**：统一入口，保证外层容器无视觉修饰、不破坏 HTML 原有行为。

### 2.10 其他关键模块（名称与职责）

- **parse-topology**：图片 → 拓扑节点/边（类型含 page/service/database/middleware 等），再转为 Fractal 节点。
- **generate-graph**：文本/多模态 → 单次或多次 LLM 调用 → SingleCallResult（graph + clarity + userJourneys + globalEvents 等）→ 解析失败则 **buildFallbackGraph**。
- **node-operations**：refineUI、generateCode 等，与 themeConfig/设计系统约束集成。
- **PRD 生成**：API route `generate-prd`，基于 nodes + projectMeta + globalRules，按行业调整语调，输出 PRD 文档。
- **StyleExtractor / generate-tailwind-config**：从设计需求或现有 HTML 提取/生成 Tailwind 配置，通过 JIT 层注入而非改 HTML。
- **FractalNode / NodeDetailPanel / CommandBar / ProjectToolbar / ProjectBlueprint**：画布 UI 与节点详情、命令栏、蓝图弹窗的入口，需与 store 的选中、面板、蓝图状态一致。

---

## 三、领域最强大脑的思考方式

### 3.1 从「单点功能」到「四维一致性」

- 看到任意一个功能（例如「生成 UI」），会立刻追问：
  - 它改的是哪个维度？View / Spec / Impl / Test？
  - 会不会导致其他维度漂移？syncState 要不要更新？lastSource 设谁？
  - 若是 View 更新，Spec/Impl 的「反向调和」当前是否实现？若未实现，产品上如何规避用户困惑？

### 3.2 从「一条边」到「整图导航与权限」

- 看到一条边，会想到：
  - 这条边在哪个用户旅程（UserJourney）的哪一步？
  - 触发类型与 condition 是否与实现一致（例如 ROLE_ENTRY + roles: ['admin']）？
  - sourceHint 是否足以在 UI 上定位到按钮/链接（用于后续自动化或可追溯性）？

### 3.3 从「一次 AI 调用」到「全链路可观测与降级」

- 看到一次 LLM 调用，会想到：
  - 超时、429、解析失败时的降级路径（fallback 图、保留原 code、友好错误类型）。
  - 请求去重、排队、冷却对体验的影响。
  - Stage Marker 与 HTML 校验（cleanHTML、validateHTML）在 pipeline 的哪一步执行。

### 3.4 从「一段 HTML」到「渲染路径与安全」

- 看到一段 HTML，会想到：
  - 走的是 iframe 沙箱还是 React JIT？若为 HTML，是否经过 Guardrails 与 JIT 修复层？
  - 是否有内联 script、外部资源？Stage 1 明确禁止 script，后续 Stage 如何安全注入行为？
  - 设计系统/主题是通过 Tailwind config 覆盖还是直接改 class？（应为前者，避免劣化。）

### 3.5 从「产品需求」到「类型与 Schema」

- 任何新增业务概念（例如新的「页面属性」、新的「边类型」），会先落到：
  - **fractal.ts** 的 Zod Schema 与类型是否要扩展？
  - **generate-graph** 的 NodeSchema/EdgeSchema 与 AI 提示词是否要同步？
  - **canvas-store** 的 updateNodeData 合并逻辑是否覆盖新字段？

---

## 四、必备能力清单

### 4.1 领域建模能力

- 熟练使用 **用户故事、业务事件、数据查询、用户旅程、全局事件** 的区分与建模。
- 能设计并演进 **View/Spec/Impl/Test 与 syncState** 的契约，并区分「已实现」与「规划中」的反向调和。

### 4.2 前端与可视化

- **React / Next.js App Router**：页面、服务端 Action、API Route 的职责划分。
- **React Flow**：节点/边类型、布局、事件（onNodesChange, onEdgesChange, onConnect）。
- **Zustand**：单一 store 设计、persist、深层合并策略（尤其 view.code）。
- **Tailwind CSS**：与 JIT 层、Tailwind config 注入、主题变量的关系。

### 4.3 安全与沙箱

- **iframe 沙箱**：HTML 隔离、postMessage、行为注入 API（getSandboxAPI）。
- **无外部依赖的 Stage 1**：无 CDN、无外部字体/图片，仅内联与占位。

### 4.4 AI 与提示工程

- **结构化输出**：callObject + Zod Schema、safeParseZodJson、Stage Marker 与 cleanHTML。
- **上下文链**：UI Agent 输出 → Spec Agent 输入 → Tech Agent 输入（文档中明确，实现上可部分存在）。
- **降级与错误**：AIResult、AIErrorType、fallback 图、429 冷却与重试策略。

### 4.5 工程与可维护性

- **类型安全**：Zod 全量 Schema、TypeScript 与 fractal/ui-spec 类型一致。
- **日志与可观测**：logger、actionName、requestId、llmMetrics 在关键路径上的使用。
- **测试**：E2E（Playwright）、单测（如 ui-pipeline-response.test.ts、json-extract.test.ts）与自检脚本（scripts/）的覆盖范围。

### 4.6 产品与约束

- **设计系统**：themeConfig、提示词中的组件约束（如 PrimaryButton），以及「不随意改 HTML class」的 JIT 原则。
- **多语言与可访问性**：当前明确要求中文文案；可访问性在文档中有提及，实现程度需按模块核查。

---

## 五、自检问题（最强大脑会常问）

1. **拓扑**：generate-graph 失败时，fallback 图的结构是什么？是否总能让用户继续编辑？
2. **UI Pipeline**：三阶段中任一阶段失败，上一阶段结果是否保留？Marker 是否被正确 append？
3. **合并**：updateNodeData 时，若 spec.requirements 与 view.code 来自不同来源，当前策略是否明确且可解释？
4. **边**：新建边时，nav 元数据是否可由用户编辑？是否参与 PRD/导出？
5. **PRD**：generate-prd 的输入是否包含 edges 与 nav？输出是否与 Spec Tab 双向同步？
6. **主题**：currentTheme 在 UI 生成时如何注入？是否所有生成入口都读取了 projectMeta + globalRules + currentTheme？
7. **性能**：大图（100+ 节点）下的 layout、persist 与 hydrate 策略？
8. **多模型**：visionModel 与 textModel 的切换点（parseTopology / generateGraph / ui-pipeline / generate-prd）是否一致且可配置？

---

## 六、文档与代码入口速查

| 关注点           | 文档/入口 |
|------------------|-----------|
| 整体架构         | ARCHITECTURE.md |
| 分形节点与类型   | src/types/fractal.ts |
| UI 规范类型      | src/types/ui-spec.ts |
| 画布状态         | src/store/canvas-store.ts |
| HTML-First       | HTML_FIRST_ARCHITECTURE.md |
| JIT 视觉流水线   | docs/JIT_VISUAL_PIPELINE.md, src/utils/jit-visual-pipeline.ts |
| 三段式 UI        | src/app/actions/ui-pipeline.ts, docs/UI_* |
| 拓扑生成         | src/app/actions/generate-graph.ts |
| 拓扑解析         | src/app/actions/parse-topology.ts |
| LLM 网关         | src/lib/ai/llm.ts, gateway-queue.ts |
| 预览与沙箱       | LivePreview, HtmlSandboxRenderer, UniversalHtmlRenderer |
| 项目蓝图与元数据 | ProjectBlueprint, projectMeta, globalRules |

---

*本文档随代码与产品演进更新，目标是让任何「领域最强大脑」能在最短时间内掌握应用全貌并做出正确决策。*
