# 设计系统 M2 计划（紧随 M1）

## M2 已完成（本次迭代）

| 项 | 说明 |
|----|------|
| **单测** | `src/lib/design-system/__tests__/design-system-m1.test.ts`：截断、解析、PRD 附录格式化；`truncate` 用 `TextDecoder(fatal)` 保证不切半 UTF-8 |
| **PRD 导出 2.3** | Full PRD HTML 在存在合法快照时增加「2.3 项目设计系统」；工具栏导出传入 `designSystemSnapshot` / `designSystemLocked` |
| **API** | `POST /api/export-prd-html` 可传 `designSystemSnapshot`、`designSystemLocked` |
| **Hydration 提示** | `StoreHydration`：持久化恢复后若已锁定且有快照，toast 一次 |

## M3（进行中 / 已实现基线）

| 项 | 说明 |
|----|------|
| `run-uupm-python.ts` | `DESIGN_SYSTEM_UUPM_ENABLED=1` 时 spawn `search.py --design-system`，512KB / 30s 限制 |
| `resolve-design-system.ts` | `resolveDesignSystemAuto`：Python 成功 → `source: python_uupm` 快照；否则 LLM |
| `generateUIFromText` | 已改为走 `resolveDesignSystemAuto` |
| 文档 | [DESIGN_SYSTEM_UUPM.md](./DESIGN_SYSTEM_UUPM.md) |

**待办**：固定 query 与上游 CLI  golden 对比（CI 可选）；Docker 内一键镜像。

## M4（已实现）

- **重新解析**：StyleExtractor「重新解析设计系统」→ 清空快照 + 解锁。
- **静态轨**：`generateStaticUIFromText` 在 `stylePreset===auto` 时锁定注入 / `resolveDesignSystemAuto`；`/api/generate-static-ui` 透传 `projectMeta`、`designSystemSnapshot` 等。
- 路线图：[DESIGN_SYSTEM_ROADMAP_NEXT.md](./DESIGN_SYSTEM_ROADMAP_NEXT.md)

## M5 建议

- **设计系统面板**：只读展示快照 + 文档链接。
