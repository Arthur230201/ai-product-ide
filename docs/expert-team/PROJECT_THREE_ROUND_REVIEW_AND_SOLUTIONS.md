# 项目三轮审视与专家团队三轮方案讨论

**文档类型**：最强大脑联合专家团队 · 三轮审视 + 三轮方案  
**生成日期**：2026-03-04  
**项目**：AI-Native Product IDE（Fractal 画布 · UI-Driven Development）

---

## 一、参与角色

| 角色 | 职责 |
|------|------|
| **最强大脑 (Super Brain)** | 统筹审视、归纳问题/优化点、分配任务、综合三轮方案并产出可执行清单 |
| **系统架构师 (system-architect)** | 架构一致性、扩展性、数据流与边界 |
| **领域建模师 (domain-modeler)** | 用户故事/事件/可追溯性、拓扑与节点语义 |
| **AI 流水线工程师 (ai-pipeline-engineer)** | LLM 网关、排队、拓扑/UI 流水线、降级与错误分类 |
| **交付物质量审核 (deliverable-quality-auditor)** | PRD/拓扑/UI 交付物质量门、四维一致性、业务可完成性 |
| **设计负责人 (design-lead)** | 设计系统、HTML-First、三段式 UI、JIT 视觉、可访问性 |
| **前端画布工程师 (frontend-canvas-engineer)** | 画布交互、节点/边、状态与性能 |
| **产品经理 (product-manager)** | 用户目标、最小旅程、优先级与范围 |
| **Prompt 工程师 (prompt-engineer)** | 提示词结构、长度、可维护性与效果 |
| **QA/测试工程师 (qa-test-engineer)** | 自动化测试、回归、质量门落地 |
| **安全沙箱工程师 (security-sandbox-engineer)** | 沙箱、依赖与运行时安全 |
| **技术写作 (technical-writer)** | 文档与可维护性 |
| **UX 专家 (ux-expert)** | 体验一致性、可发现性、反馈与错误态 |

---

## 二、第一轮审视：问题点与优化点（专家团队初提）

### 2.1 系统架构师

**问题点**
- 画布状态与 PRD/导出强耦合于单一大 store（canvas-store），反向调和（Impl→Spec→View）仅「规划」，实际未落地，存在长期架构漂移风险。
- 多入口（文本/文档/视觉）生成图后与现有节点合并策略分散在 generate-graph、node-operations、store 多处，缺少单一「图合并契约」。

**优化点**
- 明确「图合并」为独立领域服务，输入为「新图 + 现有图 + 策略」，输出为合并后 nodes/edges，便于测试与替换。
- 为 Reverse Reconciliation 预留接口（如 DriftDetector、ReconcileOrchestrator），避免日后大改。

---

### 2.2 领域建模师

**问题点**
- 用户旅程（userJourneys）与单节点 traceability（implementsJourney, journeyStep）在生成时写入，但导出 PRD/项目蓝图时依赖 viewportPreset 等来自「画布侧」的字段，若生成链路未写入则导出表现不一致。
- 边上的 nav 元数据（trigger、condition、sourceHint）在部分路径可能缺失，影响「最小旅程可达性」审核。

**优化点**
- 在 ViewArtifact 与节点数据中显式持久化 viewportPreset，并在「生成本页 UI」时从画布/请求写入，保证导出与画布一致。
- 为边定义「最小必填 nav 字段」清单，在 generate-graph 与 fallback-graph 中统一填充，便于领域与质量审核。

---

### 2.3 AI 流水线工程师

**问题点**
- HOTSPOTS 显示 CommandBar、generate-graph、node-operations、prdGenerator、llm 等文件 prompt 膨胀严重；单次操作可能触发多轮 LLM 调用，易遇 429/超时且难以定位。
- ui-pipeline 与 ui-pipeline-new 并存，职责边界不清，易导致「修一处漏一处」。
- 拓扑解析失败时 fallback 图与主流程的 Schema 一致性（如 userJourneys、globalEvents）需在 fallback-graph 中显式保证。

**优化点**
- 建立「单次用户操作 → 最大 LLM 调用次数」的契约（如 1 次点击 ≤ 2 次 callObject/callText），并在 gateway-queue 与 action 层落地与监控。
- 收敛 UI 生成入口：保留一条主 pipeline（含阶段 Marker、cleanHTML、降级），废弃或收口 ui-pipeline-new。
- fallback-graph 输出与 generateGraph 的 Zod Schema 对齐，并单测覆盖。

---

### 2.4 交付物质量审核

**问题点**
- 导出 PRD 中 UI 依赖内联挂载脚本（Babel、hooks 替换等），曾出现 useState/useEffect 未注入、cn 未定义等问题；质量门未覆盖「导出 HTML 在无头环境可渲染、无运行时报错」。
- 四维一致性（View/Spec/Impl/Test）无自动化检查，交付物审核依赖人工或临时脚本。

**优化点**
- 将「导出 HTML 可渲染、无 Failed to mount / 组件加载失败」纳入质量门（如 scripts/verify-prd-html-render.mjs 在 CI 或发布前必过）。
- 定义「四维一致性」可执行规则（如 view.code 变更后 spec.requirements 是否需重新生成），并在 node-operations 或独立 job 中落地检查与报告。

---

### 2.5 设计负责人

**问题点**
- 项目蓝图中「用户故事」tab 曾多次出现不可纵向滚动，根因在弹层内容区高度与 overflow 未统一约束，多次打补丁（maxHeight、外层 wrapper、固定 vh）仍存在环境差异。
- 设计系统与 themeConfig 在 prompt 中的约束分散，AI 输出仍可能出现硬编码组件名或不符合语义组件约定。

**优化点**
- 弹层采用统一壳层：固定 Header + Tabs + 唯一可滚动内容区（flex-1 min-h-0 overflow-y-auto），所有 tab 内容仅作为该区的子节点，不再为单个 tab 单独设高度/overflow。
- 将「语义组件列表 + 禁止列表」收敛到单一 prompt 片段或配置（如 themeConfig.semanticComponents），便于 design-lead 与 prompt-engineer 共同维护。

---

### 2.6 前端画布工程师

**问题点**
- canvas-store 体量过大（1400+ 行），updateNodeData 内 view 合并逻辑复杂，易在边界情况（如 code 空、占位符）下出现保留/覆盖判断错误。
- 项目蓝图等弹层使用 createPortal 挂载到 body，与主应用样式/全局 overflow（如 html/body overflow:hidden）的交互需在多种视口下验证。

**优化点**
- 将 view 合并逻辑抽成纯函数（mergeViewPayload），单测覆盖「传入有效/无效/空」「原有有效/无效」等组合，再在 store 中调用。
- 弹层壳层与内容区结构标准化后，在 E2E 或脚本中增加「打开项目蓝图 → 用户故事 tab → 滚动到底」的回归用例。

---

### 2.7 产品经理

**问题点**
- 「最小用户旅程」与「最小 UI 集合」由用户目标推导，但当前质量门与交付物审核仍偏重「节点/边存在」而非「目标可达」；不同业务类型（购物/打车/点餐等）的验收标准未抽象为可配置。
- 多 section 的 Spec（如 5.x.1.1、5.x.1.2）在导出 PRD 时仅渲染第一个 section，其余未展示，产品侧需明确是合并进 5.x.1 还是子编号展示。

**优化点**
- 与领域建模师、交付物质量审核协作：定义「由用户目标 → 最小步骤 → 拓扑/边可达性」的输入输出与验收接口，并在文档中写明，避免按应用名写死清单。
- PRD 导出策略（多 section 展示方式）由产品拍板后，在 prdGenerator 中一次性实现，避免后续再改结构。

---

### 2.8 Prompt 工程师

**问题点**
- HOTSPOTS 显示 generate-graph、node-operations、prdGenerator、ui-pipeline 等处大量内联 prompt 与模板字符串，可维护性差；长 prompt 易导致超时与 429。
- 部分 prompt 含动态拼接（如 htmlContext/codeContext/attachmentContent），若未做长度截断或摘要，单次请求 token 可能过大。

**优化点**
- 将「图生成」「澄清」「PRD 生成」「UI 阶段」等拆成独立 prompt 模块（如 lib/prompts/），统一导出并在 action 中引用；禁止在 action 内写超过 10 行的内联 prompt。
- 对 htmlContext/codeContext 等做「最大字符数 + 摘要」策略，并在调用前打点记录 token 估算或实际用量，便于优化与限流。

---

### 2.9 QA / 测试工程师

**问题点**
- 自检报告指出：需先通过 LLM_CALLMAP 与 ERRORS 确认 429/超时与单次点击调用次数，再动代码；当前自动化覆盖多集中在 build/lint/tsc，E2E 与导出验证脚本未纳入必跑流水线。
- uiCode.substring 等对 response 形状的假设未做防御性校验，易在异常返回时崩溃。

**优化点**
- 在 CI 中增加：导出 PRD HTML + verify-prd-html-render 脚本；可选：关键画布操作 E2E（如添加节点、切换 tab）。
- 所有消费 AI 返回的代码路径：先校验 response 形状（如 zod 或 type guard），再取子段；禁止直接 .substring/.code 无校验。

---

### 2.10 安全沙箱工程师

**问题点**
- 依赖审计显示：glob（经 eslint-config-next）、next、lodash/lodash-es（经 mermaid）、undici 等存在 high/moderate 漏洞；公网部署前需升级或缓解。
- 导出 HTML 中内联执行用户/AI 生成的代码（Babel 转译后挂载），若将来支持「用户上传任意 HTML」则需严格沙箱与 CSP。

**优化点**
- 按 SECURITY_AUDIT_DEPENDENCIES 建议，在公网发布前制定 next、eslint-config-next 等升级计划并回归；对 mermaid/lodash 跟踪上游修复。
- 导出 PRD 的 iframe 或挂载容器明确 CSP（如 script-src 仅允许 inline 与受控来源），避免未来扩展时引入 XSS。

---

### 2.11 技术写作

**问题点**
- ARCHITECTURE 与 DOMAIN_EXPERT_MENTAL_MODEL 等核心文档与当前实现存在时差（如 Reverse Reconciliation 仍为 planned）；新人上手易被文档误导。
- 专家 Skills 与 docs/expert-team 下的流程文档（如竞品可借鉴点）分散，缺少「从零到交付」的单一入口索引。

**优化点**
- 在 ARCHITECTURE 或 CHANGELOG 中标注「已实现 / 规划中 / 已废弃」，并定期与主分支对齐。
- 建立 docs/expert-team/INDEX.md：列出所有评审/讨论/裁决文档与专家 Skill 路径，便于检索与 onboarding。

---

### 2.12 UX 专家

**问题点**
- 项目蓝图「用户故事」tab 不可滚动曾反复出现，用户心智为「长内容应可滚动」，当前依赖技术侧修壳层；错误态（如 UI 加载失败、429）在界面上的提示与重试入口不够统一。
- 画布与详情面板的「当前选中的节点」反馈在复杂操作（如多 tab、生成中）下可能不够清晰。

**优化点**
- 所有「长列表/长内容」的弹层或面板统一采用「唯一可滚动区域 + flex-1 min-h-0 overflow-y-auto」模式，并在设计规范中写明，避免再出现「仅某 tab 不可滚动」。
- 定义「AI 错误态」组件或模式：错误类型（网络/限流/解析失败）+ 简短说明 + 重试/跳过，并在 CommandBar、导出、拓扑生成等入口复用。

---

### 2.13 最强大脑 · 第一轮综合

**问题归纳（按优先级）**
1. **P0 - 体验与交付**：项目蓝图用户故事 tab 滚动、导出 PRD 中 UI 可渲染与无运行时报错。
2. **P1 - 架构与可维护性**：prompt 膨胀与调用次数、UI 双 pipeline 收敛、view 合并逻辑可测化、图合并契约。
3. **P1 - 质量与安全**：四维一致性自动化、导出验证入 CI、依赖漏洞与 CSP。
4. **P2 - 产品与领域**：viewportPreset 持久化、多 section 展示策略、最小旅程可达性验收抽象。
5. **P2 - 文档与治理**：ARCHITECTURE 与实现对齐、专家文档索引。

**优化归纳**
- 弹层/长内容区统一壳层；AI 错误态统一组件；prompt 模块化与长度控制；fallback-graph 与 Schema 对齐；mergeViewPayload 单测；质量门与 CI 扩展。

---

## 三、第二轮审视：深化与交叉

### 3.1 交叉质疑（最强大脑发起）

- **架构 vs 流水线**：若「图合并」抽成独立服务，是否由 ai-pipeline-engineer 提供「生成图」接口，由 system-architect 定义「合并策略」接口？
- **领域 vs 产品**：viewportPreset 写入节点后，导出 PRD 的「PC/移动端排版」是否完全由数据驱动，不再依赖前端环境？
- **设计 vs 前端**：统一壳层（flex-1 min-h-0 overflow-y-auto）是否纳入前端画布工程师的「组件规范」，设计负责人只提「所有长内容可滚动」原则？
- **质量 vs QA**：四维一致性检查是放在「每次 updateNodeData 后」还是「导出/发布前」批量跑？交付物质量审核与 qa-test-engineer 的自动化边界如何划分？

### 3.2 专家团队第二轮回应（摘要）

- **系统架构师**：同意「图合并」为独立领域服务；合并策略接口由架构定义，实现可由 generate-graph 或新模块提供。
- **领域建模师**：viewportPreset 持久化后，导出可完全由数据驱动；边 nav 最小必填字段清单可在一个迭代内与 generate-graph 对齐。
- **设计负责人 + 前端画布工程师**：统一壳层由前端实现并文档化，设计只保留原则；项目蓝图已按此重写，可作为标准参考。
- **交付物质量审核 + QA**：四维一致性建议「导出/发布前」批量 + 可选「关键节点更新后」增量；质量审核定义规则与通过标准，QA 落地自动化脚本与 CI。

### 3.3 最强大脑 · 第二轮综合

- 问题清单维持，优先级微调：P0 不变；「图合并契约」与「单次操作 LLM 调用上限」提升为 P1 必做。
- 责任划分明确：图合并（架构+流水线）；viewportPreset（领域+前端）；壳层与滚动（前端+设计原则）；四维一致性（质量审核定义 + QA 落地）；prompt 模块化（Prompt 工程师主导，流水线配合）。

---

## 四、第三轮审视：收敛与任务分配

### 4.1 最强大脑最终问题清单（可分配）

| ID | 问题简述 | 负责专家 | 优先级 |
|----|----------|----------|--------|
| Q1 | 项目蓝图等弹层「长内容可滚动」统一壳层（flex-1 min-h-0 overflow-y-auto） | 前端画布工程师 + 设计负责人 | P0 |
| Q2 | 导出 PRD 中 UI 可渲染、无 Failed to mount；验证脚本入 CI | 交付物质量审核 + QA | P0 |
| Q3 | 单次用户操作 LLM 调用次数上限契约 + 监控 | AI 流水线工程师 | P1 |
| Q4 | UI 生成 pipeline 收敛（主 pipeline + 废弃/收口 ui-pipeline-new） | AI 流水线工程师 | P1 |
| Q5 | view 合并逻辑抽成 mergeViewPayload + 单测 | 前端画布工程师 | P1 |
| Q6 | 图合并独立服务/契约（输入输出 + 策略） | 系统架构师 + AI 流水线工程师 | P1 |
| Q7 | viewportPreset 持久化（ViewArtifact + 生成本页 UI 时写入） | 领域建模师 + 前端画布工程师 | P1 |
| Q8 | Prompt 模块化（lib/prompts）+ html/code 上下文长度与摘要 | Prompt 工程师 | P1 |
| Q9 | 四维一致性规则定义 + 导出/发布前检查（质量审核定义，QA 落地） | 交付物质量审核 + QA | P1 |
| Q10 | fallback-graph 与 generateGraph Schema 对齐 + 单测 | AI 流水线工程师 | P2 |
| Q11 | 依赖漏洞升级计划（next、eslint、mermaid）与 CSP 明确 | 安全沙箱工程师 | P2 |
| Q12 | ARCHITECTURE 标注已实现/规划 + 专家文档 INDEX | 技术写作 | P2 |
| Q13 | 边 nav 最小必填字段 + generate-graph/fallback 统一填充 | 领域建模师 | P2 |
| Q14 | AI 错误态统一组件（类型 + 说明 + 重试） | UX 专家 + 前端画布工程师 | P2 |
| Q15 | 多 section 在 PRD 导出中的展示策略（产品拍板后实现） | 产品经理 + 前端/PRD | P2 |

### 4.2 最强大脑任务分配说明

- **P0**：Q1、Q2 在本迭代或下一迭代必须关闭；Q1 已通过重写项目蓝图弹层落实，需回归验证；Q2 需将 verify-prd-html-render 纳入 CI 并定义「通过」标准。
- **P1**：Q3–Q9 由对应专家在 2 个迭代内出方案并落地；最强大脑在方案讨论三轮后验收。
- **P2**：Q10–Q15 排入 backlog，按依赖与资源在后续迭代安排。

---

## 五、第一轮方案讨论：专家出方案

### 5.1 Q1（弹层统一壳层）— 前端画布工程师 + 设计负责人

**方案要点**
- 已实施：项目蓝图弹层改为 JSX 壳层，内容区唯一可滚动 div 使用 `flex-1 min-h-0 overflow-y-auto p-6`。
- 规范：所有新建「带 tab 的长内容弹层」必须采用同一结构（Header + Tabs 均为 flex-shrink-0；内容区唯一且 flex-1 min-h-0 overflow-y-auto）；设计原则写入「设计规范」或 README。

**争议点**
- 无；建议增加 E2E 或脚本：打开项目蓝图 → 用户故事 → 滚动到底，防回归。

---

### 5.2 Q2（导出 PRD 可渲染 + 验证入 CI）— 交付物质量审核 + QA

**方案要点**
- 质量门：导出的 HTML 在无头环境中打开后，不包含「UI 加载中」长期未消失、不包含「组件加载失败」等文案；可选：对关键节点 UI 做截图比对或 DOM 存在性断言。
- CI：在 `scripts/verify-prd-html-render.mjs` 基础上，增加「导出 → 验证」流水线步骤（可仅在 main 或 release 分支跑）；失败即阻断或标记为必查。

**争议点**
- 是否对「每个有 view.code 的节点」都断言挂载成功：交付物质量希望全覆盖，QA 建议先覆盖「至少 1 个节点成功 + 无全局报错」，再逐步扩展。

**最强大脑裁决**：首轮采用「无全局报错 + 至少 1 个节点挂载成功」；后续由质量审核提供「全节点检查」清单，QA 按清单加断言。

---

### 5.3 Q3（LLM 调用次数上限）— AI 流水线工程师

**方案要点**
- 定义契约：单次用户触发的 action（如「生成图」「生成本页 UI」）内部，callObject/callText 总次数不超过 N（建议 N=2，澄清+主流程各 1；特殊情况可配置）。
- 实现：在 gateway-queue 或 action 入口打点计数；超过 N 时拒绝或降级并打日志；在 LLM_CALLMAP 或监控中展示「单次操作调用次数」。

**争议点**
- 多阶段 UI（如 beautify + addInteractions）若拆成两次调用，是否算 2；一致认为算 2，且需在 pipeline 设计上尽量合并为 1 次或明确「阶段可配置」。

---

### 5.4 Q4（UI pipeline 收敛）— AI 流水线工程师

**方案要点**
- 明确主 pipeline：以 ui-pipeline.ts（或经评估后选定的一个）为主入口，包含阶段 Marker、cleanHTML、降级与错误分类。
- ui-pipeline-new：若功能已合并则删除；若为实验分支则重命名为 ui-pipeline-experimental 并仅在 feature 或配置下启用，主路径不引用。

**争议点**
- 无；需与 node-operations 中调用处对齐，确保所有「生成本页 UI」都走主 pipeline。

---

### 5.5 Q5（mergeViewPayload 抽成 + 单测）— 前端画布工程师

**方案要点**
- 从 canvas-store 中抽出 `mergeViewPayload(existingView, incomingView): NodeArtifacts['view']`，纯函数，无 store 依赖。
- 单测：覆盖 (有效, 有效)、(有效, 无效)、(无效, 有效)、(无效, 无效)、(空, 有效) 等组合；再在 store 的 updateNodeData 中调用该函数。

**争议点**
- 无。

---

### 5.6 Q6（图合并契约）— 系统架构师 + AI 流水线工程师

**方案要点**
- 定义接口：`mergeGraph(params: { newNodes, newEdges, existingNodes, existingEdges, strategy: 'replace' | 'merge' | 'append' }) => { nodes, edges, conflicts? }`。
- 策略由架构定义（如 replace=全量替换；merge=按 id 合并并保留未冲突字段）；generate-graph 或新模块实现该接口，现有「添加节点/应用图」等调用此接口而非内联逻辑。

**争议点**
- 是否在本迭代就抽成独立包/目录：架构建议先同 repo 内独立模块，待稳定后再考虑包化；采纳。

---

### 5.7 Q8（Prompt 模块化）— Prompt 工程师

**方案要点**
- 在 `src/lib/prompts/` 下按领域拆文件：graph-generation、clarification、prd-generation、ui-stage-1/2/3 等；每个文件导出 `getSystemPrompt()` / `getUserPrompt(args)` 等，禁止在 action 内写超长内联 prompt。
- 对 htmlContext、codeContext 等设 maxChars（如 8k/16k），超出部分用摘要或截断并在调用前打点记录长度。

**争议点**
- 是否统一用「模板引擎」：首轮采用函数返回字符串即可；若后续 prompt 数量继续增长再引入轻量模板。

---

### 5.8 其他问题（Q7、Q9、Q10–Q15）方案摘要

- **Q7 viewportPreset**：已在 ViewArtifact 中增加字段；CommandBar 两处「生成本页 UI」成功后写入 viewportPreset；prdGenerator 从 node 读取。需补充：从 API 返回的 viewportUsed 到 viewportPreset 的映射在文档中写明。
- **Q9 四维一致性**：交付物质量审核输出「规则表」（如 view 变更后 spec 需重新生成的条件）；QA 在 CI 或发布前脚本中执行检查并输出报告。
- **Q10 fallback-graph**：在 fallback-graph 中导出与 generateGraph 相同的 Zod 类型或保证字段一致；为 fallback 写单测：解析失败时返回的结构可被下游消费。
- **Q11 依赖与 CSP**：安全沙箱输出「升级计划表」与「CSP 建议」；实施排入 backlog。
- **Q12 文档**：技术写作在 ARCHITECTURE 顶部增加「实现状态」表；新增 docs/expert-team/INDEX.md。
- **Q13 边 nav**：领域建模师在 generate-graph 的 Schema 与 fallback 中明确最小必填；在文档中列出。
- **Q14 AI 错误态**：UX 与前端定义共用组件（类型、文案、重试按钮），在 CommandBar、导出错误、图生成错误等处复用。
- **Q15 多 section**：产品拍板「合并进 5.x.1」或「5.x.1.1、5.x.1.2 子编号」后，prdGenerator 一次实现。

---

## 六、第二轮方案讨论：细化与依赖

### 6.1 依赖关系（最强大脑整理）

- Q2 依赖 Q1 的壳层稳定（导出验证时若弹层仍有问题会干扰测试心智，但技术上前端壳层与导出 HTML 独立）。
- Q4 与 Q3 可并行；Q4 完成后更易在 Q3 中统计「单次操作」对应的实际调用次数。
- Q6 与 generate-graph 重构可同迭代：先定义 mergeGraph 接口并在 generate-graph 内实现一版，再逐步把「添加节点」等改为调用 mergeGraph。
- Q9 依赖交付物质量审核先给出规则表，QA 再实现脚本。

### 6.2 争议收敛

- Q2 全节点断言：按第一轮裁决，先「无全局报错 + 至少 1 节点成功」，后续按清单扩展。
- Q8 模板引擎：暂不引入，以函数 + 字符串为主；若单文件超过 500 行再考虑拆分或轻量模板。

### 6.3 迭代建议（最强大脑）

- **迭代 A（当前/下一）**：Q1 回归 + Q2 CI 接入；Q5 mergeViewPayload 抽成与单测；Q7 文档补充；Q12 INDEX 与 ARCHITECTURE 状态表。
- **迭代 B**：Q3 调用次数契约与打点；Q4 pipeline 收敛；Q6 图合并接口与 generate-graph 改造；Q8 prompt 模块化（先 graph + node-operations）。
- **迭代 C**：Q9 四维一致性规则与脚本；Q10 fallback 对齐与单测；Q13 边 nav 最小必填；Q14 错误态组件；Q15 产品拍板后 PRD 多 section。

---

## 七、第三轮方案讨论：可执行清单与验收

### 7.1 最强大脑最终可执行清单

| 序号 | 行动项 | 负责人 | 验收标准 | 迭代 |
|------|--------|--------|----------|------|
| 1 | 项目蓝图弹层保持 JSX 壳层，内容区 flex-1 min-h-0 overflow-y-auto | 前端画布 | 用户故事 tab 可纵向滚动到底 + 无回归 | A |
| 2 | 导出 PRD 验证脚本入 CI；通过标准：无全局报错 + 至少 1 节点 UI 挂载成功 | QA + 质量审核 | CI 步骤可配置、失败可阻断或必查 | A |
| 3 | mergeViewPayload 抽成纯函数 + 单测 ≥5 用例 | 前端画布 | 单测通过；store 仅调用该函数 | A |
| 4 | viewportPreset 持久化与导出逻辑文档化（含 API→viewportPreset 映射） | 领域 + 技术写作 | 文档在 docs 或代码注释中可查 | A |
| 5 | docs/expert-team/INDEX.md 与 ARCHITECTURE 实现状态表 | 技术写作 | 索引可访问；状态表与当前实现一致 | A |
| 6 | 单次操作 LLM 调用次数契约（N=2）+ 打点与监控 | AI 流水线 | 契约文档 + 某 action 已接入打点 | B |
| 7 | UI 主 pipeline 唯一入口；ui-pipeline-new 删除或收口为 experimental | AI 流水线 | 主路径仅引用主 pipeline；无重复逻辑 | B |
| 8 | mergeGraph 接口定义 + generate-graph 内实现并替换内联合并 | 架构 + AI 流水线 | 接口文档 + 单测或集成测试 | B |
| 9 | graph / node-operations 相关 prompt 迁入 lib/prompts + 长度/摘要策略 | Prompt 工程师 | 无超长内联 prompt；长度打点存在 | B |
| 10 | 四维一致性规则表 + 导出/发布前检查脚本 | 质量审核 + QA | 规则表文档 + 脚本可运行并输出报告 | C |
| 11 | fallback-graph 与 Schema 对齐 + 单测 | AI 流水线 | 单测通过；下游消费无类型错误 | C |
| 12 | 边 nav 最小必填字段 + generate-graph/fallback 统一填充 | 领域建模师 | Schema 与文档更新；生成结果含该字段 | C |
| 13 | AI 错误态统一组件 + CommandBar/导出/图生成接入 | UX + 前端画布 | 组件存在；至少 2 处接入 | C |
| 14 | 多 section PRD 展示策略（产品拍板后） | 产品 + 前端 | prdGenerator 按策略输出 | C |
| 15 | 依赖漏洞升级计划与 CSP 建议文档 | 安全沙箱 | 计划表 + CSP 建议可执行 | Backlog |

### 7.2 验收与复盘

- 每迭代结束前，最强大脑根据「可执行清单」逐项验收；未通过项进入下一迭代或升级风险。
- 三轮审视与三轮方案讨论的结论以本文档为准；后续若新增问题或方案变更，可在本目录下增补「附录：变更记录」或新文档并更新 INDEX。

---

## 八、附录：文档与参考

- 架构：`ARCHITECTURE.md`
- 领域心智模型：`docs/DOMAIN_EXPERT_MENTAL_MODEL.md`
- 专家能力与治理：`docs/expert-team/EXPERT_COMPETENCY_AND_GOVERNANCE.md`
- 自检与热点：`docs/self-check/REPORT.md`、`docs/self-check/HOTSPOTS.md`
- 依赖安全审计：`docs/audit/SECURITY_AUDIT_DEPENDENCIES.md`
- 专家 Skills：`.cursor/skills/` 下各 SKILL.md；汇总见 `docs/expert-team/ALL_SKILLS_FULL_TEXT_FOR_AI.md`
