# 部署服务器性能要求

本文档说明将 AI-Native IDE 部署到自有机房/云服务器时，对硬件与运行环境的大致要求。实际以压测和业务并发为准。

## 1. 技术栈与负载特点

- **运行时**：Node.js 20–22（见 `package.json` engines）
- **框架**：Next.js 14（App Router、Server Actions、API Routes）
- **主要负载**：
  - 调用外部 AI 接口（OpenAI / Google），请求可能较长（数十秒）
  - 服务端代码转换（Babel/Sucrase）与 UI 生成逻辑，偏 CPU
  - 前端为 SPA + 画布，首屏与静态资源由 Next 提供
- **数据**：MVP 阶段以客户端/本地存储为主，无必须的持久化数据库

## 2. 推荐配置（单实例）

| 场景         | CPU    | 内存   | 说明 |
|--------------|--------|--------|------|
| **开发/体验** | 1 vCPU | 1–2 GB | 仅跑 `next dev` 或低并发 `next start` |
| **小团队/内测** | 2 vCPU | 2–4 GB | 推荐起步配置，可承受少量并发生成 |
| **正式/多用户** | 4 vCPU | 4–8 GB | 多用户同时生成 UI/PRD 时更稳 |

- **磁盘**：应用本身约几百 MB（含 `node_modules`），预留 2–5 GB 即可；无内置数据库时无需大存储。
- **网络**：需能访问 OpenAI / Google AI 等外网 API（或你配置的代理）。

## 3. 环境与进程

- **Node 内存**：若遇 OOM，可设 `NODE_OPTIONS=--max-old-space-size=3072`（3GB，按实际内存调整）。
- **并发**：Next 单进程处理请求；若需更高并发，可用多实例 + 反向代理（见下）。
- **构建**：`next build` 在 2 vCPU / 2 GB 机器上通常 1–3 分钟可完成；构建阶段内存占用会明显升高，建议 ≥2 GB。

## 4. 部署方式建议

- **单机**：`npm run build && npm run start`，用 systemd/supervisor 等保活，反向代理（Nginx/Caddy）做 HTTPS 与静态缓存。
- **多实例**：同一 `next start` 多进程或容器 + 负载均衡，注意当前限流为单实例内存实现（见 `src/lib/ai/llm.ts`），多实例下如需统一限流需自行改造（如 Redis）。

## 5. 环境变量（与性能相关）

- `OPENAI_API_KEY` 或 Google AI 等：必配，否则 AI 能力不可用。
- 其他见项目根目录 `.env.example`（若有）或 README；无数据库时一般无需额外连接池/缓存配置。

## 6. 简要结论

- **最低可用**：1 vCPU、1–2 GB 内存，适合自用或演示。
- **推荐生产**：2 vCPU、2–4 GB 内存起步；多用户或频繁生成时建议 4 vCPU、4–8 GB，并视情况增加实例与限流策略。
