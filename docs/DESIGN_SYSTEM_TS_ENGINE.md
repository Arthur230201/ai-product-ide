# UIUXProMax TS 引擎路径（生产默认）

目标：在生产环境（无 Python / 无本地 skill 数据）提供 **可复现、可版本化** 的 UIUXProMax 子集能力：**检索 + 规则 → DesignSystemSnapshot**。

## 开关与优先级

解析入口：`src/lib/design-system/resolve-design-system.ts`

优先级（当前实现）：

1. **TS 引擎**：当满足以下任意条件时启用
   - `DESIGN_SYSTEM_TS_ENGINE_ENABLED=1`
   - 或未显式关闭且 `NODE_ENV=production`（即：`DESIGN_SYSTEM_TS_ENGINE_ENABLED != '0'`）
2. **Python UUPM（可选）**：`DESIGN_SYSTEM_UUPM_ENABLED=1` 且 `search.py` 可用
3. **LLM 推荐**：最终兜底（`recommendDesignSystemWithSnapshot`）

> 说明：Python 路径用于本地对齐/验证与数据扩充；生产默认走 TS 引擎，避免依赖 Python 与外部文件系统。

## 数据版本

当前 TS 引擎内置数据：

- `src/lib/design-system/ts-engine/uupm-data.ts`
- `engineVersion`: `uupm-ts-engine-data@0.0.1`

后续可替换为：

- 由脚本生成的 JSON（如 `uupm-data@x.y.z`）
- 或独立 npm 包（保持 `engineVersion` 可追溯）

## 校验建议（Golden）

- 固定 2～3 条 query，期望命中 style/antiPatterns 的子集
- 与 Python `search.py --design-system` 输出对齐（当本地可用时）

当前仓库已内置：

- fixture：`__fixtures__/ts-engine/golden.json`
- 命令：`npm run verify:ts-engine`

