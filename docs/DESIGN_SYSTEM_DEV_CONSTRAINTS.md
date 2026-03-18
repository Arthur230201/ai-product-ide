# 设计系统 — 开发约束补篇（详设级）

> **定位**：在 [DESIGN_SYSTEM_MASTER_PLAN.md](./DESIGN_SYSTEM_MASTER_PLAN.md)、[DESIGN_SYSTEM_EXPERT_AUDIT_FINAL.md](./DESIGN_SYSTEM_EXPERT_AUDIT_FINAL.md) 之外的 **实现约束 SSOT**。  
> **读者**：负责改 `canvas-store`、`node-operations`、面板的工程师与 Code Review。  
> **原则**：未在本篇列出的数字/行为，实现阶段不得私自收窄（更严可，更松需 RFC）。

---

## 1. 与当前代码库对齐的事实（As-Is）

| 事实 | 说明 |
|------|------|
| 持久化 | `fractal-canvas-storage`（localStorage），`partialize` 含 `nodes, edges, currentTheme, stylePreset, projectMeta, globalRules, aiConfig, viewportPreset` |
| 文件导出 | `exportProject()` 返回 **v3**：`canvasExportVersion: 3`，含 `nodes, edges, designSystemSnapshot, designSystemLocked, projectMeta, globalRules, stylePreset, viewportPreset, aiConfig, currentTheme` |
| 加载 | `canvasExportVersion === 3` 时 **整包恢复**上述字段；v2 / 仅 `nodes+edges` **不覆盖** projectMeta/theme/stylePreset，设计系统仍按「文件是否带 `designSystemSnapshot`」规则合并 |
| UI 生成入口 | `generateUIFromText`（[node-operations.ts](../src/app/actions/node-operations.ts)）；`stylePreset===auto` 时通过 `resolveDesignSystemAuto` 解析设计系统（**TS 引擎→可选 Python→LLM**），并在 `auto` 下不注入固定 STYLE_ENFORCEMENT |
| 静态 HTML 轨 | [ui-pipeline-new.ts](../src/app/actions/ui-pipeline-new.ts) `generateStaticUIFromText`，风格 fragment **无 auto 特判**（auto 时不匹配任何 fragment = 无额外风格段） |

**约束 C-001**：新增 `designSystemSnapshot` 等字段时，**必须**同时更新：`partialize`、`migrate`、类型 `CanvasStore`；若需随 **下载的 JSON 项目文件** 带走快照，须 **扩展导出契约**（见 §6）。

---

## 2. Zustand 状态字段（规划字段，实现时以此为准）

| 字段名 | 类型 | 持久化 | 说明 |
|--------|------|--------|------|
| `designSystemSnapshot` | `DesignSystemSnapshot \| null` | **是** | 当前生效快照；`null` 表示从未解析或已清除 |
| `designSystemLocked` | `boolean` | **是** | `true` 时生成 UI **优先**注入快照 `markdownBlock`，**跳过** fresh LLM 推荐（除非产品改为「锁定仍允许刷新推荐预览」） |
| `designSystemHistory` | `DesignSystemSnapshot[]` | **可选** | 长度上限 **20**，仅内存或轻量持久化；首版可 **不持久化** 仅会话内 |

**约束 C-002**：`designSystemLocked === true` 且 `snapshot === null` 为 **非法状态**；UI 应在解锁时或将锁定设为 false；`migrate` 中若检测到则纠正为 `locked: false`。

**约束 C-003**：`STYLE_PRESET_IDS` 已含 `auto`；锁定快照与 `auto` 可同时存在：语义为「在 auto 模式下使用已锁定快照，不再每次推荐」。

---

## 3. `DesignSystemSnapshot` 与 zod（实现文件路径约定）

| 项 | 约定 |
|----|------|
| Schema 文件 | `src/types/design-system-snapshot.ts`（导出 `DesignSystemSnapshotSchema`、`DesignSystemSnapshot` 类型） |
| 解析入口 | `src/lib/design-system/parse-snapshot.ts`：`safeParseSnapshot(json: unknown) => { ok, data \| error }` |
| 迁移 | `src/lib/design-system/migrate-snapshot.ts`：`migrateSnapshot(raw: unknown) => DesignSystemSnapshot \| null` |

**约束 C-004**：任何写入 store 的快照 **必须先** 经 `safeParseSnapshot` 或 `migrateSnapshot`；禁止 `as any` 直写。

**字段最小集**（与审计终稿一致，实现时一字不差枚举 source）：

- `schemaVersion: 1`
- `engineVersion: string`
- `source: 'llm_draft' | 'python_uupm' | 'ts_engine' | 'manual_override'`
- `createdAt: string`（ISO8601）
- `contextHash?: string`
- `pattern.summary`, `style.name`, `style.keywords[]`
- `colors.{primary,secondary,cta,background,text}` + `notes?`
- `typography`, `keyEffects`, `antiPatterns[]`
- `markdownBlock?: string`（注入主生成用；锁定场景必备）

---

## 4. Server Action / 内部模块调用图

**当前已实现（2026-03）**：

```
[CommandBar] → generateUIFromText
    → stylePreset===auto → recommendDesignSystemMarkdown → truncateDesignSystemMarkdown → system
    → callText 主生成
```

**目标（M1+，尚未编码）**：

```
IF designSystemLocked && snapshot.markdownBlock → 注入截断后的快照（跳过 recommend LLM）
ELIF stylePreset===auto → recommendDesignSystemMarkdown → 截断
```

| 模块 | 路径 | 职责 |
|------|------|------|
| `recommendDesignSystemMarkdown` | `recommend-design-system.ts` | LLM → JSON → Markdown |
| `truncateDesignSystemMarkdown` | `truncate-design-system-markdown.ts` | **已实现**：注入前 UTF-8 安全截断 |
| `resolveDesignSystem` | 待建 | M1+：locked / cache / python / ts / llm 统一入口 |

**约束 C-005**：**禁止**在 `CommandBar.tsx` 内拼接设计系统 Markdown；**禁止**第二处调用 `recommendDesignSystem` 绕过 `node-operations` 注入顺序（审计终稿 10.6）。

---

## 5. Prompt 注入顺序（冻结，与审计终稿一致）

1. `GLASS_STYLE_ENFORCEMENT`（若 `stylePreset === 'glass'`）
2. `buildDesignSystemEnforcement(themeConfig)`（若 `themeConfig` 存在）
3. **若** `designSystemLocked && snapshot?.markdownBlock` → 注入截断后的 `markdownBlock`
4. **否则若** `stylePreset === 'auto'` 且未锁定 → `recommendDesignSystemMarkdown` 或 `resolve` 的 fresh 块（截断）
5. **若** `stylePreset` 为固定预设且非 auto/glass → 对应 `*_STYLE_ENFORCEMENT`
6. `UI_UX_PRO_MAX_GUIDANCE`
7. `systemPromptSuffix`

**冲突句（固定中文，写入 system）**：  
「当主题提取（themeConfig）与锁定设计系统在色值上冲突时，以锁定设计系统为准；未锁定时以 themeConfig 为准。」

**约束 C-006**：`existingCode`（edit 模式）在 user 尾追加：「在不大改信息架构前提下，使样式逐步贴近上述设计系统。」

---

## 6. 项目 JSON 文件导出/导入契约（扩展）

**现状**：Toolbar 保存的 `.json` 仅 `nodes` + `edges`。

**目标契约（Phase 4）**：

```json
{
  "version": 2,
  "nodes": [],
  "edges": [],
  "stylePreset": "auto",
  "projectMeta": { },
  "designSystemSnapshot": null,
  "designSystemLocked": false
}
```

**约束 C-007**：`version === 1` 或缺省字段 → 读入时等同今日行为；`version >= 2` 时恢复 `snapshot/locked/preset/meta`（若实现「完整项目包」）。

**约束 C-008**：`loadProject` 若扩展为 `loadProjectFull`，须 **向后兼容** 仅传 `{nodes,edges}` 的调用方。

---

## 7. 环境变量（数值与默认）

| 变量 | 默认 | 单位 | 约束 |
|------|------|------|------|
| `AI_DESIGN_SYSTEM_RECOMMEND` | 未设=开启 | — | `0` 关闭推荐 LLM |
| `DESIGN_SYSTEM_MARKDOWN_MAX_BYTES` | 8192 | bytes | 注入 system 前截断 |
| `DESIGN_SYSTEM_CACHE_TTL_SEC` | 86400 | s | 仅当实现 KV 缓存时生效 |
| `UIUXPROMAX_ENABLED` | 0 | — | `1` 允许 Python 路径 |
| `UIUXPROMAX_ROOT` | — | path | Python cwd 白名单根 |
| `FEATURE_DESIGN_SYSTEM_SNAPSHOT` | 0→1 发布时 | — | 关闭则忽略 snapshot 读写 |

**约束 C-009**：所有新 env 必须写入 [.env.example](../.env.example) 与 DEPLOYMENT 相关 doc。

---

## 8. 非功能数字（超时 / 重试 / 限流）

| 操作 | 超时 | 重试 | 说明 |
|------|------|------|------|
| `recommendDesignSystem`（LLM） | 与 `callText` 默认一致（如 360s） | **0**（网关内不重试避免双倍扣费） | 失败 → 空块 |
| Python `search.py` | **30s** | 0 | stdout 最大 **512KB** |
| 主 `generateUIFromText` | 不变 | 不变 | — |

**约束 C-010**：首版 **不做** 每用户 QPS 限流；若公网滥用，在 API Route 层加 **10 req/min/IP**（另 ADR）。

---

## 9. 缓存键与失效

**项目级 contextHash 建议**（字符串拼接后 SHA256 前 16 位）：

```text
v1|{projectName}|{industry}|{description 前500字符}|{targetAudience}
```

**约束 C-011**：**不包含** `nodeLabel` 于项目级缓存（降费）；节点级细化用 **第二次调用** 或 **user 点刷新** 时传 `nodeLabel` 追加 hash（可选 `v1|...|node:{label}`）。

**失效**：`updateProjectMeta` 核心字段变更 → 前端清除 `contextHash` 缓存键或置 `designSystemLocked` 提示「描述已变，是否重新解析」。

---

## 10. 协作与多标签页

**约束 C-012**：首版 **Last-Write-Wins**（LWW）。`localStorage` 以最后写入为准；不实现 OT。产品提示：「多设备编辑请以导出 JSON 合并为准。」

---

## 11. 静态 HTML 轨（`generateStaticUIFromText`）

**约束 C-013**：与主轨对齐方式二选一（实现时 PR 中必须勾选）：

- **A**：静态轨 **不调** `recommendDesignSystem`，仅注入缩短版 `UI_UX_PRO_MAX` + 若有则 `snapshot.markdownBlock` 前 2KB；或  
- **B**：静态轨调用同一 `resolveDesignSystem`，与主轨完全一致（成本更高）。

默认建议 **A**，直至产品要求视觉强一致。

---

## 12. 可访问性（面板 DoD）

| 项 | 要求 |
|----|------|
| 锁定开关 | `role="switch"` + `aria-checked` |
| 重新解析 | 加载中 `aria-busy="true"` |
| 色板 | 每项含可见文本 HEX 或 Tailwind 名，不仅色块 |
| 焦点 | 面板内 Tab 顺序可环回关闭按钮 |

---

## 13. 国际化

**约束 C-014**：`projectMeta` 全英文时，推荐 LLM 可输出英文 `markdownBlock`；**主 UI 生成**仍强制中文 UI 文案（与现网 node-operations 一致）。快照可增加 `locale: 'zh' | 'en'` 供导出用。

---

## 14. 监控与日志（实现时字段名）

| 日志 key | 级别 | 含义 |
|----------|------|------|
| `design_system_inject_source` | info | `locked` \| `llm_fresh` \| `empty` |
| `design_system_markdown_bytes` | info | 注入前字节数 |
| `design_system_resolve_fail` | warn | 附 `code` |

指标名建议与审计终稿一致：`design_system_resolve_total{source,status}`。

---

## 15. 里程碑 Definition of Done（DoD）

### M1 — Snapshot + Store

- [ ] zod schema + migrate + partialize  
- [ ] 刷新后快照仍在  
- [ ] 非法 locked+null 被 migrate 纠正  

### M2 — 面板只读 + 锁定

- [ ] 展示 markdown 渲染或纯文本  
- [ ] 锁定后二次生成终端日志 `inject_source=locked`  
- [ ] a11y 抽检通过 §12  

### M3 — JSON v2 导出（若做）

- [ ] 旧 JSON 仍可导入  
- [ ] 新 JSON 含 snapshot  

### M4 — resolve 统一入口

- [ ] 单测覆盖 §8 超时行为  
- [ ] 无 CommandBar 重复注入  

---

## 16. Code Review 检查清单（复制到 PR 模板）

- [ ] 是否改动注入顺序？→ 对照 §5  
- [ ] 新增状态是否进 `partialize` / `migrate`？  
- [ ] 快照写入是否经 zod？  
- [ ] `.env.example` 是否更新？  
- [ ] 是否引入第二处 LLM 推荐？→ 禁止  

---

## 17. 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0 | 2026-03 | 首版：对齐当前 store 导出事实 + 规划字段与契约 |

---

## 相关文档

- [DESIGN_SYSTEM_EXPERT_AUDIT_FINAL.md](./DESIGN_SYSTEM_EXPERT_AUDIT_FINAL.md) — 第十部分总规格  
- [DESIGN_SYSTEM_MASTER_PLAN.md](./DESIGN_SYSTEM_MASTER_PLAN.md) — 阶段路线图  
- [DESIGN_SYSTEM_AUTO_ROADMAP.md](./DESIGN_SYSTEM_AUTO_ROADMAP.md) — Phase 1 已实现说明  
