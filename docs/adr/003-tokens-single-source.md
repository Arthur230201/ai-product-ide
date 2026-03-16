# ADR-003：Tokens 单一真源（Tokens Single Source）

**状态**：已采纳（待落地）  
**日期**：2025-03

## 决策

- **tokens 文件两段**：`theme.tokens.json` 扩展为 `primitives`（density、radius、shadow、色阶、字体、边框）与 `recipes`（Button/Card/Input/Table/… 的 class 组合）；recipes 不再手写于 classMap，全部进入 tokens 文件。
- **Renderer 只读 tokens**：`classMap.ts` 仅保留 `getDensityClasses()` 等 helper；所有 class 字符串从 `themeTokens.recipes.xxx` 读取；改 tokens 即全站一致变更。
- **可选后续**：tokens.schema + allowlist，将 renderer 允许输出的 Tailwind class 收口为 allowlist 或按 recipe key 生成，进一步杜绝误写与风格漂移。

## 完成标准

- classMap 无大段 hardcode recipes；仅改 theme.tokens.json 即可驱动所有页面样式一致变化。
