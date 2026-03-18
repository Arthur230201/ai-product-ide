# 设计系统 — 后续路线图（执行中）

## M4（已完成）

| 任务 | 状态 |
|------|------|
| **重新解析 CTA** | StyleExtractor |
| **静态轨对齐主轨** | `generateStaticUIFromText` + `/api/generate-static-ui` |

## M5（本迭代）

| 任务 | 状态 |
|------|------|
| **设计系统只读面板** | ✅ 工具栏 Sparkles → `DesignSystemReadOnlyPanel`（锁定态、来源、风格/色板/反模式、文档路径） |
| **E2E** | 待办：v2 JSON / 锁定 / 静态 auto |
| **Golden** | 待办：UUPM CLI 快照（CI 可选） |

## M5 测试（最近一次）

`tsc` · `lint` · **26** 条单测（含 v3 导出/导入）· `next build` — **全部通过**。

## M6（进行中）

| 优先级 | 任务 |
|--------|------|
| P0 | **导出 v3** ✅ 已实现 + 单测 |
| P1 | **只读面板** ✅ markdown 折叠 +「打开风格设置」 |
| P2 | **E2E**：`e2e/design-system-toolbar.spec.ts`（`E2E_DESIGN_SYSTEM=1` 可选跑） |
| P3 | **`npm run verify:uupm`**；Golden 落盘待接 CI |
| P4 | **TS 引擎** ✅ 生产默认（`resolveDesignSystemAuto`），数据版本 `uupm-ts-engine-data@0.0.1`（见 `DESIGN_SYSTEM_TS_ENGINE.md`） |

详案与验收：**[DESIGN_SYSTEM_SPRINT_NEXT.md](./DESIGN_SYSTEM_SPRINT_NEXT.md)**

## 依赖与约束

- 静态轨与主轨共用 `resolveDesignSystemAuto`、`truncateDesignSystemMarkdown`、`DesignSystemSnapshotSchema`。
- 见 [DESIGN_SYSTEM_DEV_CONSTRAINTS.md](./DESIGN_SYSTEM_DEV_CONSTRAINTS.md)。
