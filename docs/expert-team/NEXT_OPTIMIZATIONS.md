# Build 之后：后续还需哪些优化

Build 已通过的前提下，按**联合审查报告**与**第三方 UX 审核报告**整理的待办清单，便于排期与迭代。按优先级与投入大致划分。

---

## 一、高优先级（体验与质量门）

| 项 | 说明 | 参考 |
|----|------|------|
| **错误文案与 requestId 收尾** | 确认所有 AI 失败入口（CommandBar 生成 UI、NodeDetailPanel 美化/交互、拓扑生成等）均使用 `getUserFacingErrorDescription` 展示 description；若支持排查，可在 toast/错误区附带 requestId（或仅开发环境） | `src/lib/user-facing-messages.ts`；UX_THIRD_PARTY_REVIEW 方案 A |
| **长耗时阶段/进度文案** | 生成拓扑、三段式 UI、生成 PRD 等长耗时操作：toast 或 UI 上分阶段提示（如「正在生成静态结构…」「正在美化样式…」），超时后给出可操作建议 | UX_THIRD_PARTY_REVIEW 方案 B |
| **合并前门禁** | 将 Build、Lint、TSC 纳入 CI 或合并前检查，不通过不合并 | `docs/self-check/README.md` |

---

## 二、中优先级（产品与一致性）

| 项 | 说明 | 参考 |
|----|------|------|
| **空状态与 Tab 口径对齐** | 画布空状态、无选中节点、NodeDetailPanel 各 Tab 的文案与 tooltip 已用 `user-facing-messages` 常量；若与 `UX_THIRD_PARTY_REVIEW.md`「最终执行版口径」有出入，做一次对齐即可 | `src/lib/user-facing-messages.ts`；UX_THIRD_PARTY_REVIEW 最终修改意见表 |
| **边 nav 的 UI 编辑** | 新建边后，在 UI 上支持编辑 nav（trigger、condition、sourceHint 等），便于权限/角色与可追溯 | JOINT_REVIEW 后续优化清单 |
| **PRD 与 Spec 双向** | 从 View 反推 Spec、从 Spec 生成 PRD 已有；若产品需要「编辑 Spec 后回写/同步 PRD 文档」，需单独设计 | JOINT_REVIEW 后续优化清单 |

---

## 三、后续迭代（路线图 / Backlog）

| 项 | 说明 | 参考 |
|----|------|------|
| **traceability 产品化** | 在 UI 中暴露并编辑 implementsJourney、journeyStep、triggersEvent、consumesEvent | JOINT_REVIEW |
| **成功指标与埋点** | 成文定义（如首次成功生成率、各阶段完成率），再排期埋点与看板 | JOINT_REVIEW；UX_THIRD_PARTY_REVIEW 方案 D |
| **可访问性自检** | 错误页、ErrorBoundary、toast 的键盘焦点与读屏；与全局 a11y 一起做 | UX_THIRD_PARTY_REVIEW 方案 D |
| **完整 Onboarding** | 在空状态与入口说明之后，再做「首次使用/新用户」的完整引导流程 | UX_THIRD_PARTY_REVIEW |
| **反向调和实现** | View/Spec/Impl 中某一维变更时，自动更新其他维（当前仅文档化「未实现」） | ARCHITECTURE；DOMAIN_EXPERT_MENTAL_MODEL |

---

## 四、日常/运维

| 项 | 说明 |
|----|------|
| **自检报告刷新** | 定期运行 `node scripts/self-check.mjs`（或项目内自检脚本），更新 `docs/self-check/` 下 REPORT、LLM_CALLMAP、HOTSPOTS、ERRORS 等快照。 |
| **发布前质量门** | 发布前按 `docs/DELIVERABLE_QUALITY_GATE.md` 做一次交付物检查（拓扑、UI 产出、四维一致性、导出等）。 |
| **新增项目级字段** | 新增 projectMeta / globalRules 等字段时，对照 `docs/PROJECT_CONTEXT_INJECTION.md` 检查各 AI/生成入口是否注入。 |

---

## 五、当前可认为「已闭环」的项

- 架构与领域文档与实现一致（ARCHITECTURE、DOMAIN_EXPERT_MENTAL_MODEL）
- 生产环境 canvas-store 调试日志收敛
- 自检说明与 Build/Lint/TSC 门禁建议、项目级上下文注入清单、交付物质量门文档
- FractalNode 同步状态 tooltip（已同步/未同步说明）
- Build 通过（含 mammoth、docx、llm-mock 类型、Lint 警告收敛）
- 用户可见错误文案统一（user-facing-messages.ts）及 CommandBar/NodeDetailPanel 等接入
- 首屏「已就绪」、空状态与 Tab tooltip 常量接入（InfiniteCanvas、NodeDetailPanel）

---

*本文档随审查报告与落地情况更新；排期以产品与实现为准。*
