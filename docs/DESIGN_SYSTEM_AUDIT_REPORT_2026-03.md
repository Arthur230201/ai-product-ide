# 设计系统文档与实现 — 一致性审计报告

**审计日期**：2026-03（以仓库当前状态为准）  
**范围**：`stylePreset=auto`、推荐 LLM、设计系统相关 docs、`canvas-store` 导出、与 [DESIGN_SYSTEM_DEV_CONSTRAINTS.md](./DESIGN_SYSTEM_DEV_CONSTRAINTS.md) 对照。

---

## 结论摘要

| 级别 | 数量 | 说明 |
|------|------|------|
| **P1 高** | 2 | 锁定注入未实现；截断已修复 |
| **P2 中** | 4 | 规划文件缺失、静态轨未注释、导出 JSON、文档债（P2-5 已修） |
| **P3 低** | 3 | 文档易读性、长期项未排期 |

**总体**：Phase 1（auto + LLM 推荐）**已实现**；DEV_CONSTRAINTS / 审计终稿中的 **M1+（快照、锁定、截断、缓存）尚未落地**，部分流程图易让读者误以为「已支持锁定注入」。

---

## P1 — 需在文档或代码侧尽快对齐

### P1-1 锁定快照注入：**文档有、代码无**

- **现象**：[DESIGN_SYSTEM_DEV_CONSTRAINTS.md](./DESIGN_SYSTEM_DEV_CONSTRAINTS.md) §4、§5 描述「`designSystemLocked && snapshot.markdownBlock` → 注入」。
- **代码**：`generateUIFromText` 的 input schema **无** `designSystemSnapshot` / `designSystemLocked`；全库 **无** `designSystemSnapshot` 字符串匹配。
- **风险**：每页生成在 `auto` 下 **重复调用** `recommendDesignSystemMarkdown`，费 token、且同一项目不同页可能风格漂移。
- **建议**：  
  - **短期**：在 DEV_CONSTRAINTS §4 标题旁增加 **「（M1 后实现；当前仅 §1 现状）」**；或  
  - **实现**：按 M1 增加 store 字段 + action 传参 + 注入分支。

### P1-2 推荐 Markdown **8192 字节截断**：**已修复**

- **原问题**：规范有、代码曾无截断。
- **现状**：`truncate-design-system-markdown.ts` + `generateUIFromText` 注入前调用；`.env.example` 已补充 `DESIGN_SYSTEM_MARKDOWN_MAX_BYTES`。

### P1-3 DEV_CONSTRAINTS **§4 调用图**易误导

- **现象**：同一图内混写「现状」与「IF locked」分支，未标明后者为 **未实现**。
- **建议**：拆成 **「当前实现」** 与 **「目标实现（M1+）」** 两幅图，或在图下加脚注。

---

## P2 — 中优先级

### P2-1 规划文件 **不存在**

以下路径在 DEV_CONSTRAINTS 中为约定，**仓库中未创建**：

- `src/types/design-system-snapshot.ts`
- `src/lib/design-system/parse-snapshot.ts`
- `src/lib/design-system/migrate-snapshot.ts`
- `src/lib/design-system/resolve-design-system.ts`

**建议**：在 DEV_CONSTRAINTS §3 首行注明 **「以下文件待 M1 创建」**，避免新人按路径 import 失败。

### P2-2 **快照字段** vs **推荐 LLM 输出** 结构名不一致

- 推荐 zod 使用 `patternSummary`（扁平）。
- DEV_CONSTRAINTS 快照最小集写 `pattern.summary`（嵌套）。
- **建议**：在 DEV_CONSTRAINTS 增加 **映射表**：`patternSummary → pattern.summary`；或统一为一种形状再持久化。

### P2-3 **主轨 vs 静态 HTML 轨**

- `generateUIFromText`：`auto` → 有推荐 LLM（若未关 env）。
- `generateStaticUIFromText`：`auto` → 无风格 fragment，**也无推荐 LLM**。
- **结论**：符合 DEV_CONSTRAINTS §13 **方案 A** 倾向，但 **未在 ui-pipeline-new 内显式注释**「故意不调 recommend」。
- **建议**：在 `ui-pipeline-new.ts` 顶部或 `auto` 分支处 **一行注释** 指向 DEV_CONSTRAINTS §13。

### P2-4 **项目 JSON 导出仍仅 nodes/edges**

- 与 DEV_CONSTRAINTS §1、§6 一致；**非回归**，但 **换机/协作** 会丢 `stylePreset` / `projectMeta` / 未来 snapshot。
- **建议**：在 Toolbar「保存项目」说明或 tooltip 中提示 **「当前 JSON 不含项目画像与风格」**（产品文案）。

### P2-5 **`recommendDesignSystem` 失败日志**：**已修复**

- **现状**：LLM 失败 / JSON 不可解析 / zod 失败均 `logWarn('[design_system_resolve_fail]', …)`。

---

## P3 — 低优先级 / 文档债

### P3-1 **EXPERT_AUDIT_FINAL** 与 **MASTER_PLAN** 部分重复

- 维护成本：改注入顺序需同步多处。
- **建议**：注入顺序以 **DEV_CONSTRAINTS §5** 为唯一 SSOT，其它文档只写「见 DEV_CONSTRAINTS §5」。

### P3-2 **黄金用例 UC-21～30** 仍占位

- 审计文档要求 ≥30 条，表中仅到 UC-20。
- **建议**：建 `DESIGN_SYSTEM_UC_CATALOG.md` 或标为 **Backlog**。

### P3-3 **FR-11 PII / 脱敏**

- 审计终稿提及，代码与 env 未实现。
- **建议**：DEV_CONSTRAINTS 增 **「未实现」** 条目，避免误以为已上线。

---

## 已对齐项（审计通过）

- `STYLE_PRESET_IDS` 含 `auto`，与文档一致。
- `generateUIFromText`：`auto` 时不注入各 `*_STYLE_ENFORCEMENT`（glass 仍为特例）。
- `recommend-design-system.ts` 存在；`AI_DESIGN_SYSTEM_RECOMMEND=0` 可关闭推荐 LLM。
- `partialize` 与 DEV_CONSTRAINTS §1 描述一致（无 snapshot 字段）。

---

## 建议的下一步动作（优先级排序）

1. ~~**代码**：P1-2 截断~~ **已完成**。  
2. **文档**：**P1-1 / P1-3** 已在 DEV_CONSTRAINTS 标明 M1+；或开工 M1。  
3. **代码或文档**：**P2-5** 失败日志。  
4. **M1 排期**：快照 + 传参 + 锁定注入，关闭 **P1-1**。

---

**审计人**：仓库静态分析 + 文档交叉阅读（自动化可后续接 `grep` + CI 检查「文档声明的文件是否存在」）。
