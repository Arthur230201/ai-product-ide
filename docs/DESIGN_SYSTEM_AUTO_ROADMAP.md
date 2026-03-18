# 设计系统「智能推荐」— 方案与路线图

> **长期完整总方案**见 [DESIGN_SYSTEM_MASTER_PLAN.md](./DESIGN_SYSTEM_MASTER_PLAN.md)（Phase 1～5、数据模型、全链路）。

分支：`feature/design-system-auto`（Phase 1 实现可在此分支或已合并主线）

## 本分支已交付（Phase 1）

| 项 | 说明 |
|----|------|
| **风格预设 `auto`** | 在 [src/types/theme.ts](../src/types/theme.ts) 中新增；**不注入**任何 `*_STYLE_ENFORCEMENT`，释放模型按项目语义发挥。 |
| **UI** | [StyleExtractor](../src/components/canvas/StyleExtractor.tsx) 首项「智能推荐」，与固定预设并列。 |
| **推荐设计系统块** | [src/lib/design-system/recommend-design-system.ts](../src/lib/design-system/recommend-design-system.ts)：在 `generateUIFromText` 中 **先于** `UI_UX_PRO_MAX_GUIDANCE` 注入 Markdown（Pattern / Style / Colors / Typography / Avoid）。 |
| **环境变量** | `AI_DESIGN_SYSTEM_RECOMMEND=0` 可关闭推荐 LLM（仍保留 auto 的「不锁预设」行为）。 |
| **模型** | 推荐使用 `draft` 档位文本模型，降低成本；失败时静默降级，仅依赖通用设计基准。 |

## 调用链

```
用户选「智能推荐」→ stylePreset=auto
  → generateUIFromText
      → recommendDesignSystemMarkdown() [可选]
      → system += 推荐块 + UI_UX_PRO_MAX_GUIDANCE
      → user 补充「智能推荐模式」说明
```

## 后续阶段（本分支不实现，仅规划）

### Phase 2：官方 Python `search.py`

- Vendor [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) 的 `scripts/search.py` + 数据。
- 环境变量 `UIUXPROMAX_ROOT` + `spawn('python3', ...)`；输出 Markdown 与当前推荐块 **二选一或合并**。
- 部署：需 Node+Python 或独立微服务（Vercel Serverless 需替代方案）。

### Phase 3：TypeScript 推理引擎

- 将 BM25 + 多域数据移植为 TS，去掉 Python 依赖；数据版本与上游 tag 对齐。

### Phase 4：产品化

- 项目级持久化 `DesignSystemSnapshot`（zod）；画布内面板展示/覆盖/历史；导出 PRD 附带当前设计系统。

## 验收（Phase 1）

1. 选「智能推荐」生成 UI，与选「企业稳重」同描述对比，视觉气质应可区分。  
2. `AI_DESIGN_SYSTEM_RECOMMEND=0` 时仍能生成，且无额外 LLM 调用。  
3. 持久化项目加载后 `auto` 仍有效。

## 相关文件

- [node-operations.ts](../src/app/actions/node-operations.ts) — `generateUIFromText` 注入逻辑  
- [ui-pipeline-new.ts](../src/app/actions/ui-pipeline-new.ts) — 静态 HTML 轨：`auto` 不追加风格 fragment（与主轨一致）  
- [STYLE_PRESET_VS_UIUXPROMAX.md](./STYLE_PRESET_VS_UIUXPROMAX.md) — 背景对比
