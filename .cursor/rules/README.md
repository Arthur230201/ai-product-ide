# Cursor 项目规则 (Project Rules)

本目录下的 `.mdc` 规则来自开源仓库，用于在 Cursor 中统一 AI 行为、记忆与工作流。

## 来源

- **[DVC2/cursor_prompts](https://github.com/DVC2/cursor_prompts)**（已引入）
  - 高级 `.mdc` 规则：内存管理、会话协调、调试、效率、TypeScript/JavaScript、ADR、审计等。
  - 当前已放入本目录的 **11 个规则**：`ADR.mdc`、`audit.mdc`、`commonsense.mdc`、`debugging.mdc`、`development-journal.mdc`、`efficiency.mdc`、`javascript.mdc`、`memory-management.mdc`、`session-coordinator.mdc`、`terminal.mdc`、`typescript.mdc`。（`development-journal.mdc`、`audit.mdc` 为精简版，完整版见仓库。）

- **前端专项规则**（已引入）
  - **tailwind-css-v4.mdc**：来自 [danhollick/tailwind-css-v4.mdc](https://gist.github.com/danhollick/d902cf60e37950de36cf8e7c43fa0943)，Tailwind CSS v4 的 @theme、@import、容器查询、新 variant、Breaking Changes 等。
  - **frontend-react-next.mdc**：基于 [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) 的 Next.js + React + TypeScript 规则，约定组件风格、Shadcn/Radix、Tailwind、RSC、Server Actions、错误边界等。

## 规则说明（与项目相关）

| 规则 | 用途 | 建议 |
|------|------|------|
| **commonsense.mdc** | 通用开发常识、错误处理、命名、单一职责 | `alwaysApply: true`，全项目生效 |
| **efficiency.mdc** | 减少工具调用、批量操作、缓存 | `alwaysApply: true` |
| **typescript.mdc** | TS 类型、严格模式、React/TS 模式 | 适用于 `**/*.ts`、`**/*.tsx` |
| **javascript.mdc** | ES2022+、异步、模块 | 适用于 `**/*.js` |
| **debugging.mdc** | 系统化调试、最小工具调用 | 适用于 `**/*.ts`、`**/*.js` 等 |
| **memory-management.mdc** | 上下文优先级与裁剪 | 按需 |
| **session-coordinator.mdc** | 跨会话 continuity、checkpoint | 按需 |
| **ADR.mdc** | 架构决策记录 | 适用于 `**/*.md`、`**/*.ts` 等 |
| **development-journal.mdc** | 进度、Todo、自动化记录 | 按需 |
| **audit.mdc** | 递归审计、模式学习、修复策略 | 按需 |
| **terminal.mdc** | 终端命令模式：结构化输出、幂等、安全读写、Git/包管理、缓存与重试 | 按需 |
| **tailwind-css-v4.mdc** | Tailwind v4：CSS-first 配置、@theme、容器查询、新 utility/variant、Breaking 对照 | 适用于 `**/*.{tsx,ts,jsx,js,css}` |
| **frontend-react-next.mdc** | React/Next/TS：函数组件、Shadcn/Radix、Tailwind、RSC、Server Actions、错误与表单 | 适用于 `**/*.tsx`、`**/components/**`、`**/app/**` |

## 与本项目 Skills 的关系

- **`.cursor/skills/`**：项目自有的 Agent Skills（如 ai-pipeline-engineer、prompt-engineer），定义「谁在什么场景下做什么」。
- **`.cursor/rules/`**：全局/项目级规则（.mdc），定义「写代码/调试/会话时 AI 应遵循的通用约定」。
- 二者互补：rules 偏通用与工作流，skills 偏领域与角色。

## 其他可参考仓库

- **[araguaci/cursor-skills](https://github.com/araguaci/cursor-skills)**（CURSOR-SKILLS 社区）
  - 按领域（Node、API、Testing、Webdesign、DevOps 等）的规则与模板，可作为补充参考，未直接拷贝到本仓库。
- **[cursor-skills.vercel.app](https://cursor-skills.vercel.app/)**：上述社区的前端与文档入口。
- **[PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules)**：多种技术栈的 .cursorrules 模板（Next.js、React、TypeScript、Tailwind 等），本仓库已抽取并转为 `frontend-react-next.mdc`。
- **[blefnk/awllm-awesome-cursor-rules](https://github.com/blefnk/awllm-awesome-cursor-rules)**：Next.js 15、React 19、Tailwind 4、shadcn/ui 等现代前端规则集，可按需参考或通过 reliverse CLI 安装。
- **[cursor.directory](https://cursor.directory/rules/popular)**：流行 Cursor 规则列表，可浏览并选择安装。
