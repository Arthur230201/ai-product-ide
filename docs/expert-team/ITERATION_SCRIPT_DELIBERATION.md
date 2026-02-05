# 脚本测试专家与迭代逻辑联合审核：三轮商议报告

**审核方式**：最强大脑牵头，全生命周期专家 + 三方专家联合；三轮讨论决定「通用迭代逻辑」在本项目的采用范围与落地方式。

**审核范围**：通用迭代逻辑规范（行业无关）在本 AI-Native IDE 项目中的适配；脚本测试专家角色定位；迭代框架的实现优先级。

---

## 第一轮：各专家视角与采纳建议

### 1. 产品经理视角

- **产出物映射**：本项目的产出物应为：拓扑（nodes/edges）、PRD/Spec、View/UI 代码、单节点四维数据；与 KG 的「实体/边」不同，需明确「每次迭代的粒度」（单节点 / 单项目 / 单次生成）。
- **建议**：采用「单次生成 + 单节点」双粒度；迭代脚本优先支持「单次 UI 生成」和「单次拓扑生成」的质量闭环，全项目级迭代作为后续扩展。
- **风险**：过度自动化可能掩盖产品决策（如「是否允许 Spec 与 View 暂时不一致」）；修复策略需产品可解释。

### 2. 领域建模师视角

- **问题类型映射**：通用逻辑的 ProblemType 应映射为本项目：`pageType_mismatch`、`nav_incomplete`、`events_dataQueries_inconsistent`、`traceability_missing` 等。
- **建议**：采用问题收集与归一化结构；修复策略需与 Action/View 语义、events/dataQueries 规则对齐；避免「自动修复」破坏领域约束。
- **风险**：自动修复可能引入不符合 pageType 的 events/dataQueries；需在修复执行器中加入领域校验。

### 3. 系统架构师视角

- **数据流与状态**：`previousMetrics`、`failedStrategies` 跨轮传递合理；需与 Zustand persist、项目导出/导入兼容，避免迭代中间态污染持久化。
- **建议**：迭代框架与主应用解耦，迭代报告落盘到 `tests/reports/` 或 `scripts/iteration-reports/`，不写入 canvas-store；采用 `runIteration(config)` 注入各阶段实现，保持可插拔。
- **风险**：若迭代内调用 produce（如重新生成 UI），需确保不覆盖用户未保存的编辑；建议迭代仅在「受控上下文」（如 CI、自检）运行。

### 4. 设计负责人视角

- **评估标准**：audit 需包含 Stage Marker、cleanHTML、无外链、四维一致性等；与 deliverable-quality-auditor 的审核清单对齐。
- **建议**：采用多路评估（domainExpert + thirdParty），但本项目可先实现「单路」：deliverable-quality-auditor 风格的自动化检查 + 现有自检脚本（self-check、ui-pipeline-selfcheck）作为 audit 实现。
- **风险**：Stage 2/3 的「是否保留上一阶段」逻辑若在迭代中反复触发，需与 ui-pipeline 的合并策略一致。

### 5. 前端/画布工程师视角

- **produce 实现**：本项目的 produce 可能是「调用 generate-graph / ui-pipeline」或「从现有 store 采样」；前者需 mock 或可选真实 LLM，后者需能访问 store 快照。
- **建议**：迭代框架支持「无 produce」模式：仅对已有产出物（如导出的 JSON）做 audit → collect → decide → fix → verify，便于 CI 和离线检查；有 produce 的模式作为可选增强。
- **风险**：迭代脚本若直接操作 DOM 或 React 状态，需与 E2E 隔离；建议迭代框架纯逻辑，UI 交互由 Playwright 覆盖。

### 6. AI 流水线工程师视角

- **produce 与 LLM**：若 produce 调用 generate-graph/ui-pipeline，必须走统一网关、mock 模式；迭代不应在无 mock 时频繁调真实 API。
- **建议**：produce 默认使用 `AI_RUNTIME=mock`；audit 可复用 ui-pipeline-selfcheck 的校验逻辑；修复策略如 `fix_stage_marker`、`fix_parse_fallback` 需与 llm-mock、gateway-queue 兼容。
- **风险**：迭代轮次过多会放大 mock 与真实行为的差异；MAX_ROUNDS 建议 5–10，非 100。

### 7. 提示词工程师视角

- **问题与 fixActions**：audit 返回的 fixActions 可按 problem.type 匹配；本项目修复策略可能为：`fix_prompt_placeholder`、`fix_schema_default`、`fix_stage_marker_retry` 等。
- **建议**：采用决策与修复接口；修复策略表与 prompt/Schema 变更联动维护；无效策略（fix_no_effect）禁用机制有价值，避免重复无效修复。
- **风险**：自动修复 prompt 或 Schema 可能引入新问题；修复执行器应有「只读检查」与「可写修复」两种模式，可写修复需人工审批或仅在明确场景启用。

### 8. 质量/测试工程师视角

- **与现有测试关系**：qa-test-engineer 已拥有 E2E、单测、自检；迭代框架是「在自检/E2E 之上的自动化循环」，不应重复实现自检逻辑。
- **建议**：新增**脚本测试专家**角色，负责迭代脚本与框架；qa-test-engineer 提供 audit/verify 的实现（如调用 self-check、运行 E2E 子集）；两者协作：脚本测试专家写「迭代主循环」，qa-test-engineer 写「单次评估与验证」。
- **风险**：两角色边界不清会重复劳动；建议脚本测试专家侧重「迭代编排、报告、failedStrategies」，qa-test-engineer 侧重「单次测试与门禁」。

### 9. 安全/沙箱工程师视角

- **修复执行器安全**：executeFix 可能修改文件、执行命令；需限制为项目内路径、禁止任意命令执行。
- **建议**：修复执行器白名单：仅允许修改 `src/`、`scripts/`、`docs/` 等；禁止 `eval`、`child_process.exec` 传入用户输入；迭代报告不包含敏感信息（API Key、用户数据）。
- **风险**：若修复策略来自 LLM 输出，需严格校验，避免注入攻击。

### 10. 技术文档工程师视角

- **文档与模板**：通用逻辑的「替换清单」与「代码模板」需在本项目文档中明确；README 或 docs 中说明「如何接入迭代框架」。
- **建议**：采用迭代框架后，在 `docs/self-check/` 或 `docs/expert-team/` 下增加「迭代逻辑在本项目的映射」短文；与 DELIVERABLE_QUALITY_GATE、E2E_TESTING 交叉引用。

### 11. 用户体验专家视角

- **用户可见性**：迭代框架主要面向开发/CI，用户不可见；但若迭代用于「生成后自动修复」，用户可能感知到「多次重试」或「等待变长」。
- **建议**：迭代框架默认不接入用户路径；仅作为 CI、自检、发布前质量门的工具；用户路径保持「单次生成 + 明确错误反馈」。

### 12. 交付物质量审核专家视角

- **audit 实现**：audit 应直接复用 DELIVERABLE_QUALITY_GATE 的检查清单；输出 overallScore、issues、fixActions。
- **建议**：将质量门清单抽成可编程检查（如 `runDeliverableAudit(artifact)`），供迭代框架的 audit 阶段调用；问题结构与通用逻辑的 Problem 对齐。

### 13. 技术路线方案审核专家视角

- **架构一致性**：迭代框架应与 ARCHITECTURE 的「降级可运行」「类型先行」一致；迭代失败不应破坏主应用。
- **建议**：迭代框架作为独立模块（`scripts/iteration/` 或 `tests/framework/`），通过 config 注入；不修改主应用代码结构；MAX_ROUNDS、TARGET_SCORE 等可配置。

### 14. 马斯克专家视角（第一性原理）

- **本质问题**：迭代逻辑要解决的是「产出物不达标时，如何自动改进」；本项目当前痛点是「自检失败后需人工分析、人工修复」。
- **建议**：先做「最小可行」：1）产出物 = 单次 UI/拓扑生成的输出；2）评估 = 现有自检 + 质量门清单；3）修复 = 人工执行，脚本仅输出「问题 + 建议修复策略」；4）验证 = 重跑自检。**自动化修复**作为第二阶段，避免首轮范围过大。
- **质疑**：7 步单轮、failedStrategies、多路评估等是否全部必要？可先实现 3 步：audit → collect → report；fix/verify 由人工完成，脚本只产出「可操作的修复清单」。

---

## 第二轮：收敛与优先级

- **一致认同**：
  1. 新增**脚本测试专家**角色，与 qa-test-engineer 分工：脚本测试专家负责迭代编排、报告、框架；qa-test-engineer 负责单次测试与门禁实现。
  2. 迭代框架与主应用解耦，报告落盘 `scripts/iteration-reports/` 或 `tests/reports/iteration/`。
  3. produce 默认 mock，MAX_ROUNDS 控制在 5–10；修复执行器白名单与安全约束。
  4. 问题结构与通用逻辑对齐；audit 复用 DELIVERABLE_QUALITY_GATE 与现有自检。

- **分歧与取舍**：
  - **自动化修复**：马斯克专家建议首轮仅「audit → collect → report」，不做自动 fix；多数专家认为可支持 fix 接口但默认不启用，由 config 决定。
  - **粒度**：产品经理建议「单次生成 + 单节点」；领域建模师建议先「单次生成」；取「单次生成」为 MVP，单节点与全项目后续扩展。
  - **7 步完整性**：马斯克建议简化为 3 步；技术路线审核专家认为保留 7 步接口有利于扩展，实现上可先做简化版（produce 可选、fix 可选）。

**优先级排序**：
- **P0**：脚本测试专家 Skill、迭代框架骨架（runOneRound、runIteration 主循环）、config 注入接口。
- **P1**：audit 接入（复用 self-check + 质量门清单）、问题收集与 report 输出、round report 落盘。
- **P2**：produce 接入（可选，mock 模式）、fix 接口与 1–2 个示例策略（如 fix_no_effect 占位）、failedStrategies 逻辑。
- **P3**：多轮验证、最终报告、与 CI 集成。

---

## 第三轮：最终决定与采用清单

### 最强大脑裁决

**结论**：通用迭代逻辑在本项目中**部分采用**，按「最小可行、分阶段落地」原则执行。

**采用项**（本阶段实现）：

| 项 | 内容 | 实现方式 |
|----|------|----------|
| A1 | 脚本测试专家 Skill | 新建 `.cursor/skills/script-testing-expert/SKILL.md`，与 qa-test-engineer 分工明确 |
| A2 | 迭代框架骨架 | `scripts/iteration/iteration-runner.mjs`，导出 `runIteration(config)`、`runOneRound(...)`，支持 config 注入 |
| A3 | 配置与报告 | `scripts/iteration/iteration-config.example.mjs`，报告落盘 `scripts/iteration-reports/` |
| B4 | audit 接入 | audit 阶段调用 `scripts/self-check.mjs` 或封装的质量门检查，输出 scores、issues |
| B5 | 问题收集与 round report | 将 audit.issues 归一化为 Problem 结构，输出 `iteration-report.json` |
| C6 | produce 可选 | produce 可为 no-op，仅对「已有产出物」做 audit；支持传入 mock 的 generate 函数 |
| C7 | fix 接口与 failedStrategies | 提供 `executeFix(fixAction)` 接口，默认 no-op；`fix_no_effect` 时加入 failedStrategies，下一轮禁用 |

**不采用项**（本阶段不实现，记入后续）：

| 项 | 内容 | 原因 |
|----|------|------|
| D1 | 自动化修复策略实现 | 首轮仅接口占位，不做真实文件/代码修改 |
| D2 | 多路评估（domainExpert + thirdParty） | 先单路（自检 + 质量门），后续扩展 |
| D3 | 全项目级、单节点级迭代 | MVP 仅「单次生成」粒度 |
| D4 | 与 CI 深度集成 | 先本地可运行，CI 后续 |

### 三方专家审核意见

- **交付物质量审核专家**：同意 B4/B5，audit 与质量门对齐；建议 round report 中包含「未通过项与修复建议」，便于人工跟进。
- **技术路线审核专家**：同意 A2/A3 解耦设计；建议在 README 中注明「迭代框架为实验性模块，主应用不依赖」。
- **乔布斯专家**：无直接 UX 影响，同意执行。

### 最终决定

**执行方案 A1–C7**；D1–D4 记入「迭代框架后续优化清单」。执行顺序：A1 → A2 → A3 → B4 → B5 → C6 → C7。

---

## 本项目与通用迭代逻辑的映射表

| 通用逻辑抽象 | 本项目实现 |
|--------------|------------|
| 产出物 | 拓扑（nodes/edges）、UI 产出（view.code）、单次 generate-graph/ui-pipeline 输出 |
| produce() | 可选；可调用 generate-graph/ui-pipeline（mock）或从导出 JSON 采样 |
| audit() | 调用 self-check + 质量门清单（DELIVERABLE_QUALITY_GATE）；输出 scores、issues |
| 问题类型 | pageType_mismatch、nav_incomplete、stage_marker_missing、schema_validation_fail 等 |
| collectProblems() | 将 audit.issues 转为 Problem 结构，关联 fixActions |
| decideAndFix() | 可选；支持 executeFix 接口，默认 no-op；failedStrategies 禁用无效策略 |
| verify() | 重跑 self-check 或 E2E 子集，对比前后分数 |
| 报告 | round report → `iteration-report.json`；final report → `iteration-final-<ts>.json` |
| MAX_ROUNDS | 5–10（可配置） |
| TARGET_SCORE | 可配置；如 Build/Lint/TSC 全通过 + 质量门通过 |

---

## 后续优化清单（已实现项已迁移至「已实现」）

### 已实现（本轮优化）

- **自动化修复策略**：`scripts/iteration/fix-executors.mjs` 实现 fix_stage_marker、fix_schema_retry；修复结果写入 `scripts/iteration-reports/fixed-artifacts/`。
- **多路评估**：`scripts/iteration/audit-multi-path.mjs` 实现 runSystemAudit、runDomainExpertAudit、runThirdPartyAudit 及 mergeMultiPathAudit；完整配置见 `iteration-config-full.mjs`。
- **全项目级、单节点级迭代粒度**：config 支持 `granularity: 'single-generation' | 'single-node' | 'project'`，及 `nodeId`、`artifactSource`；runner 将粒度与数据源传入 produce/audit。

### 未执行（仍为后续）

- 与 CI（GitHub Actions 等）集成
- produce 接入真实 generate-graph/ui-pipeline（受控环境）

---

*本文档随三轮商议结论更新；执行以最强大脑裁决与三方专家意见为准。*
