# ADR（Architecture Decision Records）

与 PagePlan / 展示 / 设计系统收敛相关的架构决策，供执行与评审对齐。

| ADR | 标题 | 状态 |
|-----|------|------|
| [001](001-single-display-path.md) | 单一展示路径（HtmlSandboxRenderer + 统一 injector + Guard + NAV） | 已采纳，待落地 |
| [002](002-registry-injection-by-template.md) | 按模板子集注入 Registry（components JSON 按需注入） | 已采纳，待落地 |
| [003](003-tokens-single-source.md) | Tokens 单一真源（recipes 迁入 theme.tokens.json） | 已采纳，待落地 |

**建议落地顺序**：001 → 002（Sprint 1）；003（Sprint 2）。扩展模板库前需先收敛 002、001，避免展示差异与 prompt 漂移。
