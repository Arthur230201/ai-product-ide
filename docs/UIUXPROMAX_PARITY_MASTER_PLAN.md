# UIUXProMax 等价能力总计划（完成即视为对齐）

## 0. 目标（Definition of Done）

当且仅当同时满足以下 **G1–G6**，才宣称与 UIUXProMax “能力与效果等价”。

### G1 多域知识覆盖（Coverage）
- TS 引擎数据域至少包含：
  - 行业/场景（industry）
  - 产品形态（productType）
  - Pattern（信息架构/区块组合）
  - 色板（语义色 + 行业禁忌）
  - 排版策略（密度、层级、数字对齐）
  - 动效/反馈策略（hover/focus/pressed）
  - 反模式库（按行业/形态/端类型）
  - 可访问性规则库（WCAG + 键盘/触控）
- 数据必须：**版本化**（engineVersion）、**schema 校验**（zod）、**可生成**（build 脚本）。

### G2 检索质量可量化（Quality）
在 Golden 用例集（≥100）上，按允许的同义映射评估：
- style 命中率 ≥ 90%
- antiPatterns 命中率 ≥ 85%（至少 2 条与行业相关）
- pattern 匹配 ≥ 85%（要点/标签匹配）
- colors 合规 ≥ 95%（对比度与禁忌规则）

### G3 可复现与可追溯（Deterministic + Trace）
- 同输入（画像+上下文+engineVersion）→ 同输出
- 每次输出必须携带：
  - `contextHash`
  - `retrievalTrace`（top-k 命中证据与分数）
  - `ruleTrace`（应用了哪些规则）

### G4 生产可用（No Python in Prod）
- 生产默认走 TS 引擎；Python 仅用于本地对齐与数据生成工具链。

### G5 全链路消费一致（End-to-End Consistency）
- 同一份 snapshot 驱动：UI 生成/静态轨/导出 PRD&HTML/导入导出/锁定复用。

### G6 UX 可决策、可恢复（UX）
- 设计系统中心：来源/版本/证据/动作（锁定、重算、切引擎、复制注入块、导出规范）
- 统一状态机与可操作错误：429/无 key/解析失败/超时都有下一步动作

---

## 1. 里程碑与交付物（执行顺序）

### M1 数据规模化（本阶段）
- 扩展 TS 引擎数据规模到：
  - styles ≥ 60（当前）
  - patterns ≥ 50（当前）
  - palettes ≥ 80（当前）
  - antiPatterns ≥ 200（当前）
  - a11yRules ≥ 20（目标：继续扩）
- 提供 `npm run build:uupm-data` 生成 `public/uupm-data/<engineVersion>.json`

### M2 多域融合检索 + trace（必须）
- TS 引擎不再“命中单条 style”，而是：
  - style/pattern/palette/typography/effects/avoid/a11y 分域检索 top-k
  - 按规则融合成 snapshot
  - 输出 retrievalTrace/ruleTrace

### M3 Golden 扩到 30 → 100（必须）
- `verify:ts-engine` 固化到 30 条
- `verify:parity` 对 30/100 计算分数与报告（阈值门禁）

### M4 设计系统中心 + 状态机（必须）
- 面向用户的“可决策、可恢复”体验闭环

---

## 2. 命令与门禁（必须可跑）
- `npm run build:uupm-data`
- `npm run verify:ts-engine`
- `npm run verify:parity`（新增）
- `npm run full-parity:verify`（一键门禁：typecheck+lint+test+build+Golden100+parity阈值）
- `npm run typecheck && npm run lint && npm test && npm run build`

---

## 3. 当前审计状态（可宣称等价的证据链）

以下为最近一次本地审计门禁结果（以 `reports/parity-report.*` 为证据源）：

- **样本量**：Golden **100**
- **质量阈值门禁**：已启用（cases>=100 自动检查阈值）
- **指标**（来自 `reports/parity-report.md`）：
  - styleHitRate：**100%**
  - antiOkRate：**100%**
  - patternOkRate：**96%**
  - colorsOkRate：**100%**
  - avgTotal：**99.6 / 100**

运行命令：

- `npm run full-parity:verify`
- 产物：`reports/parity-report.json`、`reports/parity-report.md`

