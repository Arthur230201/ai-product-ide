# 无法生成画布 / LLM 是否被调用 — 诊断说明

## 0.1 View 页缺少 dataQueries？

建图时若模型未给 View 节点写 `dataQueries`，服务端会 **自动注入一条占位查询**（终端见 `已注入占位`），画布仍可保存；请在节点详情里补全排序/过滤/数据源。建图提示词已要求每个 View 必带 `dataQueries`，可减少此情况。

## 0. 日志在哪里看？

**建图 / LLM 的日志在「运行 `npm run dev` 的终端」里，不在浏览器里。**

- 打开你执行 `npm run dev` 的那个终端窗口。
- 在页面上点击「开始设计」后，应**立刻**在该终端看到一行：`========== [generateGraph] 服务端被调用 ==========`
- 若这一行都没有，说明请求没到服务端（前端未触发或网络问题）。
- 浏览器 F12 控制台里只有**前端**日志；服务端日志不会出现在浏览器。

## 1. 看终端日志（运行 `npm run dev` 的那一个）

按顺序看是否出现下面几行，即可判断 LLM 是否被调用、卡在哪一步：

| 日志内容 | 含义 |
|----------|------|
| `========== [generateGraph] 服务端被调用 ==========` | 请求已到达服务端，建图入口执行了 |
| `OPENAI_API_KEY 未配置，LLM 无法调用` | **未配置 API Key**，LLM 不会调用；需在 `.env.local` 中设置 `OPENAI_API_KEY` |
| `OPENAI_API_KEY 已配置，即将调用 LLM` | Key 已读取，即将发起 LLM 请求 |
| `[generateGraph] LLM call failed` | **LLM 调用失败**（网络/超时/429 等），会走降级图或错误返回 |
| `[generateGraph] AI 调用成功` | LLM 已返回并解析成功 |
| `LLM 返回了空图，改用降级图` | LLM 返回了空节点，已自动用降级图替代 |

**结论：**

- 若**没有**「服务端被调用」→ 请求没到服务端（前端未触发或网络问题）。
- 若有「OPENAI_API_KEY 未配置」→ **是「LLM 无法调用」**，配置 Key 即可。
- 若有「LLM call failed」→ LLM 被调用了但失败（看后面的 `errorType`/`errorMessage`）。
- 若有「AI 调用成功」或「改用降级图」→ LLM 已参与，画布应有内容（或降级图）。

## 2. 配置 OPENAI_API_KEY（解决「LLM 无法调用」）

在项目根目录创建或编辑 `.env.local`：

```bash
OPENAI_API_KEY=sk-your-openai-api-key
```

保存后**重启** `npm run dev`，再试一次「开始设计」。

## 3. 前端提示

- 若出现 **「无法生成画布」+ 描述里提示「请在 .env.local 中设置 OPENAI_API_KEY」** → 同上，配置 Key 并重启 dev。
- 若出现 **「暂时无法生成画布，请在项目画像页面补充…」** → 之前多为服务端返回了空图；现已改为自动用降级图，一般会看到画布。若仍出现，请结合终端日志看是否还有解析错误或其它返回格式问题。

## 4. 智能推荐模式多一次 LLM

选 UI 风格「智能推荐」时，生成单页 UI 会先调用一次 `recommendDesignSystem`（draft 档位），再生成 TSX。若需关闭该次调用以省 token：在 `.env.local` 设置 `AI_DESIGN_SYSTEM_RECOMMEND=0`（仍保留「不锁固定预设」行为）。详见 [DESIGN_SYSTEM_AUTO_ROADMAP.md](./DESIGN_SYSTEM_AUTO_ROADMAP.md)。

## 5. 小结

**「依然无法生成内容」时，是不是 LLM 无法调用？**

- **没有配置 `OPENAI_API_KEY`** → **是**，LLM 不会调用；按上面配置并重启即可。
- **已配置 Key 但终端有「LLM call failed」** → LLM 被调用了但失败，需根据 `errorType`/`errorMessage` 排查网络、超时或配额。
- **终端有「AI 调用成功」或「改用降级图」但界面仍无内容** → LLM 已参与，问题更可能在前端展示或数据解析，可查浏览器控制台与 CommandBar 的 onSuccess 日志。
