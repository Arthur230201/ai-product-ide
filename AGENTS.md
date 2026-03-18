# AI-Native Product IDE — Agent 入口（Harness Engineering）

> 本文档为**目录表**（约 100 行内），详细内容见 `docs/` 与根目录规范。智能体请优先阅读本文件与 ARCHITECTURE.md，再按需打开链接文档。

## 项目目标

- **产品**：Fractal 无限画布 IDE，统一 UI 设计、PRD 文档与代码实现为单一事实来源。
- **核心逻辑**：UI-Driven Development（Map → UI → Doc → Code）。
- **技术栈**：Next.js 14、React Flow、Zustand、Tailwind、Shadcn UI、Vercel AI SDK；类型与 schema 用 zod。

## 必读规范

| 文档 | 用途 |
|------|------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 架构、Fractal Node、四维 Tabs、技术约束、实现规则 |
| [.cursorrules](./.cursorrules) | 全栈约定、Tailwind、zod、ARCHITECTURE 对齐 |

## 文档索引（docs/）

- **架构与设计**：[SYSTEM_DESIGN_STANDARD_AND_PREREQUISITES.md](docs/SYSTEM_DESIGN_STANDARD_AND_PREREQUISITES.md)、[EXPORT_PRD_SPEC_TEST_SYSTEM_DESIGN.md](docs/EXPORT_PRD_SPEC_TEST_SYSTEM_DESIGN.md)
- **导出与部署**：[EXPORT_AND_FEATURES_ROADMAP.md](docs/EXPORT_AND_FEATURES_ROADMAP.md)、[DEPLOYMENT_REQUIREMENTS.md](docs/DEPLOYMENT_REQUIREMENTS.md)、[E2E_TESTING.md](docs/E2E_TESTING.md)
- **设计系统智能推荐**：[DESIGN_SYSTEM_AUTO_ROADMAP.md](docs/DESIGN_SYSTEM_AUTO_ROADMAP.md)（`stylePreset=auto`、后续 UIUXProMax 对齐）
- **AI 对话与流程**：[AI_DIALOG_EXPERT_WORKSHOP.md](docs/AI_DIALOG_EXPERT_WORKSHOP.md)、[AI_DIALOG_STITCH_PERSISTENT_PLAN.md](docs/AI_DIALOG_STITCH_PERSISTENT_PLAN.md)
- **UI/UX**：[UI_UX_FULL_REDESIGN_10_ROUNDS.md](docs/UI_UX_FULL_REDESIGN_10_ROUNDS.md)、[COMPONENT_LIBRARY_AND_PAGE_DESCRIPTION.md](docs/COMPONENT_LIBRARY_AND_PAGE_DESCRIPTION.md)
- **View 生成（PagePlan）**：[src/lib/page-plan/README.md](src/lib/page-plan/README.md)、[PAGE_PLAN_AUDIT_GAPS.md](docs/page-plan/PAGE_PLAN_AUDIT_GAPS.md)
- **展示/Tokens/Registry 收敛**：[docs/adr/README.md](docs/adr/README.md)（ADR-001 单一展示路径、ADR-002 按模板注入、ADR-003 Tokens 单一真源）
- **专家与自检**：[docs/expert-team/README.md](docs/expert-team/README.md)、[docs/self-check/](docs/self-check/)

## 架构边界（与智能体约定）

- **依赖方向**：Types → Config → Repo → Service → Runtime → UI；禁止逆向跨层依赖。
- **设计系统**：通过 themeConfig 与 prompt 约束组件与样式，不写死组件库。
- **输出**：严格 JSON/代码，无闲聊；合并用户编辑时优先用 AST 避免覆盖。

## 工作流提示

1. 接到任务先确认是否与 ARCHITECTURE.md 及现有 docs 一致。
2. 新功能或大改请先查 docs 中是否有设计/规范，再落代码。
3. 提交前自检：类型、Lint、架构层级；涉及导出/部署时参考对应 docs。
