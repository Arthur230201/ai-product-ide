# 设计系统 — 下一冲刺计划（可执行）

> **最近一次自动化测试**：`tsc` ✅ · `eslint` ✅ · 单元测试 **26** 条（含 `canvas-project-v3` 5 条）✅ · `next build` ✅。

---

## 冲刺目标（按推荐顺序）

### P0 — 导出 v3（项目 JSON 完整度）✅ **已完成**

| 项 | 说明 |
|----|------|
| **实现** | `exportProject` / `loadProject`（`canvas-store.ts`），`canvasExportVersion: 3` |
| **单测** | `src/store/__tests__/canvas-project-v3.test.ts`（导出形状、corporate 清 DS、auto 恢复快照、v2 不覆盖 meta、round-trip 项目名） |
| **待补** | 浏览器内「清空 localStorage → 导入」**手工或 E2E**（P2） |

### P1 — 只读面板增强 ✅ **已完成**

| 项 | 说明 |
|----|------|
| **Markdown 折叠** | `markdownBlock` 超过 ~480 字：预览 +「查看完整注入块」/「收起」 |
| **跳转风格** | 「打开风格设置」→ 关面板 + 事件打开 StyleExtractor（`canvas-ui-events.ts`） |

### P2 — E2E（Playwright）

| 状态 | 说明 |
|------|------|
| **已加** | `e2e/design-system-toolbar.spec.ts`（Sparkles、无/有快照、打开风格设置）；**默认跳过**，需 `E2E_DESIGN_SYSTEM=1` + 可水合的 dev |
| **文档** | [DESIGN_SYSTEM_E2E.md](./DESIGN_SYSTEM_E2E.md) |
| **待补** | 保存 v3 下载断言（需 `page.on('download')`）；或 CI 用 `next build && start` 稳定 chunk |

### P3 — UUPM 校验脚本 ✅

| 项 | 说明 |
|----|------|
| **脚本** | `npm run verify:uupm` → `scripts/verify-uupm-design-system.mjs` |
| **Golden 落盘** | 仍可将 stdout 写入 `__fixtures__/uupm/*.md`（手工或 CI 后续接） |

---

## 非本冲刺（ backlog ）

- TS 引擎主路径（MASTER_PLAN Phase 3）
- `contextHash` + Redis 缓存
- 设计系统历史栈 `designSystemHistory[]`

---

## 与仓库文档关系

| 文档 | 角色 |
|------|------|
| [DESIGN_SYSTEM_ROADMAP_NEXT.md](./DESIGN_SYSTEM_ROADMAP_NEXT.md) | 里程碑总览 |
| 本文 | **下一迭代任务分解与验收** |
| [DESIGN_SYSTEM_DEV_CONSTRAINTS.md](./DESIGN_SYSTEM_DEV_CONSTRAINTS.md) | 实现约束 |
