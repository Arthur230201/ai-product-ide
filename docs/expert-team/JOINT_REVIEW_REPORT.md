# 联合专家团队审查报告与优化方案

**审查方式**：最强大脑牵头，生命周期专家 + 三方专家联合；两轮讨论后形成报告与优化方案，最强大脑裁决后交三方专家审核，再决定是否执行。

**审查范围**：全项目（架构、实现、文档、自检与可观测）。

---

## 第一轮讨论：各专家视角发现

### 1. 产品经理视角

- **项目画像与 NFR 注入**：projectMeta、globalRules 在 generate-prd、generateGraph、ui-pipeline 中有注入，但 **注入点分散**，新增字段时易遗漏；建议在文档中维护「项目级上下文注入清单」。
- **三引擎产品化**：Idea/Doc/Vision 入口存在，但 **用户可见的错误与降级** 不统一：拓扑失败有 fallback 图，UI 阶段失败有 UIPipelineResponse，但前端展示的文案与「下一步建议」是否一致需 UX 与前端确认。
- **PRD 与 Spec 对齐**：generate-prd 基于 nodes + projectMeta 生成文档，与节点 Spec Tab 的 **双向同步未实现**；产品上若以「导出 PRD」为主，需明确「编辑 Spec 是否回写 PRD 文件」。

### 2. 领域建模师视角

- **Action/View 与 events/dataQueries**：generate-graph 的 NodeSchema 含 pageType，且约定 events 仅 Action、dataQueries 仅 View；实现上 **TopologyUploader/parseTopology 映射为 Fractal 节点时** 是否强制校验 pageType 与 events/dataQueries 一致性需核查。
- **边 nav 完整性**：新建边时 nav（trigger、condition、sourceHint）若由用户后续填写，当前 UI 是否支持编辑；若仅 AI 生成，**空 nav 的边** 在导出与 PRD 中的处理需统一。
- **traceability**：implementsJourney、triggersEvent、consumesEvent 在生成与编辑中的暴露程度不足，可追溯性能力未完全产品化。

### 3. 系统架构师视角

- **syncState 与反向调和**：syncState 在 createMockNode、fallback、generate-graph、updateNodeData 多处写入，但 **仅 lastSource='view' 或 'spec'**；Impl 变更触发的反向更新（Reverse Reconciliation）未实现，与 ARCHITECTURE 描述存在差距。
- **updateNodeData 合并**：view 的「有效则采用、无效则保留」逻辑完善；**spec/impl/test** 为浅层合并（存在则 spread），若调用方传入 `spec: {}` 会清空原有 spec，建议在文档或类型上约束「部分更新请只传有变化的字段」。
- **持久化与规模**：Zustand persist 未配置 size 限制；大图（如 100+ 节点）下的序列化/反序列化与 hydrate 超时（当前 500ms）可能不足，建议在文档中标注「已知限制」并预留配置项。

### 4. 设计负责人视角

- **设计系统约束**：ARCHITECTURE 写「PrimaryButton」等预定义组件，实际实现以 **themeConfig + 提示词约束** 为主，无硬编码组件库；文档与实现一致化，避免读者误以为有组件库。
- **Stage Marker 与校验**：ui-pipeline 各阶段输出带 Marker，cleanHTML/validateHTML 存在；**Stage 2/3 的输入** 是否强制带上上一阶段 Marker、失败时是否保留上一阶段结果，需在交付物质量门中明确。
- **JIT 与 HTML 不改 class**：JIT 文档明确「换肤不换骨」；实现上 generate-tailwind-config 与 injectTailwindConfig 存在，需确认 **所有 UI 生成入口**（含 node-operations 的 generateCode）是否统一走 JIT 而非直接改 class。

### 5. 前端/画布工程师视角

- **控制台日志**：canvas-store 的 updateNodeData 内 **大量 console.log**（含生产）；建议改为 logger 且生产环境关闭或降级为 debug。
- **Hydration 超时**：StoreHydration 与 500ms 超时兜底；若 persist 数据量大，500ms 可能不足，建议可配置或适当提高并配合「加载中」提示。
- **FractalNode 同步状态展示**：节点上展示「已同步/未同步」依赖 syncState.isSynced；与「反向调和未实现」一致，但用户可能误以为「未同步」即有问题，建议在 UI 或文档中简短说明含义。

### 6. AI 流水线工程师视角

- **统一网关**：callText/callObject 与 gateway-queue 已统一；**node-operations** 内是否存在直连或未走网关的 LLM 调用需核查（自检 LLM_CALLMAP 可佐证）。
- **错误类型与前端**：AIResult 与 UIPipelineResponse 的 type（RATE_LIMIT/NETWORK/PROVIDER/PARSE）是否在前端 **全部映射为可操作文案与重试建议**（如 429 显示冷却秒数）需确认。
- **拓扑解析**：parseTopology 返回拓扑结构，**转为 Fractal 节点** 的逻辑（含 syncState、artifacts 初始值）是否与 generate-graph 产出对齐，避免两路产出的节点结构不一致。

### 7. 提示词工程师视角

- **Schema 与解析**：generate-graph 使用 SingleCallResultSchema，safeParseZodJson 可恢复解析；**解析失败时的 raw 与错误信息** 是否足够定位 prompt 问题（如缺字段、多字段）可加强。
- **项目/规则注入**：projectMeta、globalRules 在 prompt 中的 **占位方式**（如「{projectName}」「{industry}」）若未填写是否有默认值，避免空字符串导致 prompt 质量下降。

### 8. 质量/测试工程师视角

- **自检报告**：docs/self-check/REPORT 显示 Build/Lint/TSC **fail**；需在本次优化中纳入「修复至通过」或「明确排除项与原因」。
- **E2E 覆盖**：e2e 存在；关键路径（生成拓扑、生成 UI、导出）是否全覆盖、是否稳定（如依赖真实 API 时的 mock）需在质量门中明确。
- **可观测**：requestId、actionName、llmMetrics 在关键路径存在；**前端** 是否在用户可见错误时带上 requestId（便于支持排查）可增强。

### 9. 安全/沙箱工程师视角

- **沙箱实现**：HtmlSandboxRenderer + iframe，行为通过 BehaviorInjector 注入；**ARCHITECTURE 写 Sandpack**，与实际 iframe 方案不符，属文档错误，应更正。
- **Stage 1 无外链**：ui-pipeline Stage 1 明确禁止 CDN/外部资源；**node-operations** 中其他 UI 生成路径是否同样约束需核查。

### 10. 技术文档工程师视角

- **ARCHITECTURE.md**：Sandboxing 写 Sandpack，应为「iframe + HtmlSandboxRenderer」；View 描述可补充「或单文件 HTML」；Reverse Reconciliation 标注为「规划中/部分实现」更准确。
- **DOMAIN_EXPERT_MENTAL_MODEL**：与当前实现基本一致；syncState 与反向调和处可加一句「当前仅 view 合并策略完善，Spec/Impl 反向更新未实现」。
- **自检与错误热点**：error-hotspots、llm-callmap 等为历史快照；建议在 README 或 self-check 中说明「需定期重新生成」及命令。

### 11. 用户研究/支持视角

- **用户路径**：进入 → 输入方式 → 生成 → 编辑 → 预览/导出；**失败恢复**：各环节失败时是否有统一「重试/简化/检查网络」等入口需与前端/产品对齐。
- **成功指标**：首次成功生成率、各阶段完成率等未在代码或配置中固化；建议在文档或产品需求中定义，便于后续埋点与迭代。

---

## 第二轮讨论：收敛与优先级

- **一致认同**：ARCHITECTURE 中 Sandpack 与 Reverse Reconciliation 描述需修正；syncState/反向调和现状需在文档中明确；updateNodeData 中生产环境日志应收敛。
- **一致认同**：自检 Build/Lint/TSC 失败需处理（修复或明确排除原因）；项目级上下文注入清单、交付物质量门（Stage Marker、四维一致性）建议成文。
- **分歧与取舍**：
  - **反向调和**：架构师与产品认为应文档化「当前未实现」并预留扩展；不在此次执行大规模实现。
  - **边 nav 编辑**：领域建模师希望 UI 支持；产品与前端建议先保证 AI 生成边带 nav，编辑作为后续迭代。
  - **前端错误文案与 requestId**：UX 与质量建议做；前端建议单列小需求，与本次优化方案一起排期。

**优先级排序**：P0 文档与事实一致（ARCHITECTURE、syncState/反向调和说明）、P0 生产日志收敛、P1 自检通过或排除说明、P1 项目上下文注入清单、P2 交付物质量门文档与 Stage/四维检查建议、P2 用户可见错误与 requestId。

---

## 完整报告摘要

| 类别 | 发现数 | 已收敛结论 |
|------|--------|------------|
| 文档与实现不一致 | 3 | 修正 ARCHITECTURE；补充 DOMAIN_EXPERT 中反向调和现状 |
| 实现与架构契约 | 2 | 文档化 syncState/合并策略与反向调和「未实现」；合并时避免传空对象覆盖 |
| 可观测与日志 | 2 | 生产环境收敛 store 内 console.log；建议前端错误带 requestId |
| 自检与质量门 | 2 | 修复 Build/Lint/TSC 或写明排除原因；成文质量门与注入清单 |
| 产品与 UX | 3 | 错误文案与下一步建议统一、成功指标定义，后续迭代 |
| 安全与沙箱 | 1 | 文档更正 Sandpack→iframe；其他路径无外链核查 |

---

## 优化方案（供裁决与三方审核）

### 方案 A：文档与事实一致（P0，建议执行）

1. **ARCHITECTURE.md**  
   - Sandboxing：将「Sandpack」改为「iframe + HtmlSandboxRenderer（见 HTML_FIRST_ARCHITECTURE）」。  
   - Reverse Reconciliation：改为「若 Impl（Tab 3）变更，Spec（Tab 2）与 View（Tab 1）须自动更新；Drift Detection 与反向调和机制当前为规划中，实现上以 View 合并策略为主。」  
   - View：补充「可运行 React/Tailwind 或单文件 HTML（沙箱执行）」。
2. **DOMAIN_EXPERT_MENTAL_MODEL.md**  
   - syncState 小节：增加「当前仅 view.code 的合并策略完善；Spec/Impl 由 View 或 Impl 变更触发的反向更新未实现。」
3. **docs/expert-team/README 或 docs/self-check**  
   - 自检说明：自检报告为某时间点快照；重新生成方式（如 `scripts/self-check.mjs` 或文档中写明）及 Build/Lint/TSC 失败时的处理建议（修复优先或排除原因）。

### 方案 B：生产环境日志收敛（P0，建议执行）

4. **src/store/canvas-store.ts**  
   - updateNodeData 内所有 `console.log` / `console.error` / `console.warn` 改为通过 `@/lib/logger` 的 log/logError/logWarn；或在开发环境才输出，生产不输出（如 `if (process.env.NODE_ENV === 'development')` 包裹现有 console）。

### 方案 C：自检与质量门文档（P1，建议执行）

5. **自检**  
   - 在 docs/self-check/REPORT.md 或 README 中注明：当前 Build/Lint/TSC 状态及「修复计划」或「已知排除原因」（如某目录/依赖暂不参与 lint）。  
   - 若有可运行的 self-check 脚本，在 docs 中写明命令与预期。
6. **项目级上下文注入清单**  
   - 新建或更新 `docs/PROJECT_CONTEXT_INJECTION.md`：列出 projectMeta、globalRules、currentTheme、aiConfig 在哪些入口（generate-prd、generateGraph、ui-pipeline、node-operations 等）被使用及字段列表，便于新增字段时检查。

### 方案 D：交付物质量门与 Stage 检查（P2，建议执行）

7. **交付物质量门**  
   - 在 `docs/` 或 `docs/expert-team/` 下新增「交付物质量门」短文：发布前对拓扑（Schema、pageType、边 nav）、UI 产出（Stage Marker、无外链、cleanHTML）、单节点四维一致性（view 有效、spec 非空等）的检查清单；与 deliverable-quality-auditor Skill 对齐。

### 方案 E：暂不纳入本次执行（记录为后续迭代）

8. 边 nav 的 UI 编辑、traceability 产品化、PRD 与 Spec 双向同步、前端错误文案与 requestId 统一、成功指标埋点与定义。——记入「后续优化清单」，不在此次代码/文档变更中实现。

---

## 最强大脑裁决

**结论**：方案 A、B、C、D 均为 **文档或轻量实现**，不改变产品行为与架构契约，仅使文档与实现一致、降低生产噪音、明确自检与质量门，**风险低、收益明确**。  
**裁决**：**批准方案 A、B、C、D 提交三方专家审核**；方案 E 仅记录，不进入本次执行范围。若三方专家无反对意见或仅提出可接受的修订，则 **按 A→B→C→D 顺序执行**。

---

## 三方专家审核意见

### 用户体验专家

- **意见**：方案 A/B/C/D 不直接改用户界面，但 **文档中明确「反向调和未实现」** 可避免内部或用户误以为「未同步」即缺陷；建议在 **NodeDetailPanel 或帮助提示** 中增加一句「同步状态表示上次更新来源，非实时四维一致」，可作为方案 A 的补充或后续小优化。
- **结论**：同意执行；建议将「未同步」说明纳入后续 UI 文案迭代。

### 交付物质量审核专家

- **意见**：方案 C（自检说明）与方案 D（质量门文档）直接有利于 **发布前审核** 与 AI 产出一致性检查；方案 A 确保审核时依据的架构描述正确。无异议。
- **结论**：同意执行。

### 技术路线方案审核专家

- **意见**：ARCHITECTURE 与领域文档的修正 **保持路线与实现一致**，避免后续技术讨论基于错误前提；方案 B 减少生产日志有利于长期可维护性。建议在 **方案 C 的自检说明** 中注明「TSC/Build 通过是合并前推荐门禁」，以强化质量门。
- **结论**：同意执行；建议方案 C 中增加「推荐将 Build/Lint/TSC 作为合并前门禁」的表述。

---

## 最终决定：是否执行优化

**综合最强大脑裁决与三方专家意见**：  
- 三方专家 **均同意** 执行方案 A、B、C、D；仅提出 **可接受的补充**（未同步说明、合并前门禁建议）。  
**最终决定**：**执行优化方案 A、B、C、D**；方案 E 仅写入「后续优化清单」文档，不在此次执行。  
执行顺序：A → B → C → D（文档与代码变更按上列条目逐项落实）。

---

## 后续优化清单（方案 E，不本次执行）

- 边 nav 的 UI 编辑能力  
- traceability 在产品与 UI 中的暴露与编辑  
- PRD 与 Spec Tab 双向同步  
- 前端用户可见错误文案与 requestId 统一  
- 成功指标定义与埋点（首次成功生成率、阶段完成率等）  
- NodeDetailPanel「未同步」的简短说明文案  

（以上可放入 backlog 或产品路线图，由产品与实现排期。）

---

## 执行记录（方案 A/B/C/D 已落实）

| 方案 | 执行内容 | 文件/位置 |
|------|----------|-----------|
| A1 | 架构文档：View 描述、Reverse Reconciliation 现状、Sandboxing 更正、Design System 表述 | `ARCHITECTURE.md` |
| A2 | 领域文档：syncState 与反向调和现状说明 | `docs/DOMAIN_EXPERT_MENTAL_MODEL.md` |
| A3 | 自检说明：快照、重新生成、Build/Lint/TSC 门禁建议 | `docs/self-check/README.md` |
| B4 | 生产环境日志收敛：updateNodeData 内调试日志仅 development 输出 | `src/store/canvas-store.ts` |
| C5 | 自检说明与门禁建议 | 见 A3，`docs/self-check/README.md` |
| C6 | 项目级上下文注入清单 | `docs/PROJECT_CONTEXT_INJECTION.md` |
| D7 | 交付物质量门清单 | `docs/DELIVERABLE_QUALITY_GATE.md` |

---

## 继续优化（第二轮执行记录）

| 项 | 内容 | 文件/位置 |
|----|------|-----------|
| 后续清单·未同步说明 | FractalNode 同步状态 tooltip：已同步显示「上次更新来源」；未同步显示「表示四维可能未完全一致，仅表示上次更新来源」 | `src/components/canvas/FractalNode.tsx` |
| Build 通过 | 补依赖 mammoth、docx；修复 callObject/mockCallObject 返回类型（z.infer\<T\>）与 schema.shape 类型检查 | `package.json`、`src/lib/ai/llm-mock.ts` |
| Lint 警告收敛 | HtmlFirstPreview：handleBeautify 补 htmlSource 依赖、useEffect 加 eslint-disable 说明；ViewWorkbench：message 回调加 eslint-disable（handleExportPNG 定义在后） | `HtmlFirstPreview.tsx`、`ViewWorkbench.tsx` |
