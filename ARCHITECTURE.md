# AI-Native Product IDE - System Architecture

## 1. Core Philosophy
A fractal, infinite-canvas based IDE that unifies UI design, PRD documentation, and Code implementation into a single "Source of Truth".
Key Logic: UI-Driven Development (Map -> UI -> Doc -> Code).

## 2. Data Structure: Fractal Node
Every node on the canvas contains 4 holographic dimensions (Tabs):
1. **View (View)**: Runnable React/Tailwind or single-file HTML code (sandboxed). See HTML_FIRST_ARCHITECTURE for HTML rendering.
2. **Spec (PRD)**: Structured requirements reverse-engineered from View.
3. **Impl (Tech)**: Database schema & API definitions derived from Spec.
4. **Test (QA)**: Test cases derived from Logic.

## 3. Core Features
- **Triple-Engine Input**: 
  - Idea-to-Graph (Text input)
  - Doc-to-Graph (PRD upload)
  - Vision-to-Graph (Figma/Screenshot upload)
- **Reverse Reconciliation** (planned): When Impl (Tab 3) changes, Spec (Tab 2) and View (Tab 1) should auto-update. Drift Detection and full reverse reconciliation are **planned**; current implementation focuses on View merge strategy (e.g. preserving valid code on AI failure).
- **Context-Chained Prompting**: 
  - UI Agent Output -> Spec Agent Input -> Tech Agent Input.

## 4. Tech Stack Constraints
- **Frontend**: Next.js 14 (App Router), React Flow (Canvas), Zustand (State), Tailwind CSS, Shadcn UI.
- **Sandboxing**: iframe + HtmlSandboxRenderer for HTML (see HTML_FIRST_ARCHITECTURE); React/code runs in existing JIT pipeline.
- **AI Orchestration**: Vercel AI SDK.
- **Data Store**: Client-side first (Local/IndexedDB) for MVP, ready for PGVector.

## 5. Critical Implementation Rules
- **No Fluff**: Agents must produce strict JSON/Code, no conversational filler.
- **Design System Enforced**: AI is constrained via themeConfig and prompt rules (e.g. semantic components); no hardcoded component library.
- **AST Parsing**: Use AST to merge user edits with AI generation (prevent overwriting).

## 6. View 生成：PagePlan HTML-first
- **位置**：`src/lib/page-plan/`（IR、模板/组件 registry、校验、渲染、prompts）。
- **流水线**：Stage1 规则选模板 → Stage2 LLM 合成 PagePlan JSON（可选）→ validatePlan → 失败时 repair（最多 2 次）→ renderHtml → single-file HTML 写入 `artifacts.view.code` → LivePreview 用 HtmlSandboxRenderer 渲染。
- **约束**：禁止 Tailwind 任意值 `[]`，仅 classMap + theme.tokens；bindings 用复合引用 `nodeId::queryId`；DOM 约定与 BehaviorInjector（data-action、data-data-query-ref、data-view-state-container）一致。
- **入口**：工具栏「规则生成」= buildFallbackPlan → validate → render；「AI 生成」= 调用 `/api/page-plan/synthesize` → renderHtml → view.code。
- **详见**：`src/lib/page-plan/README.md`、[PAGE_PLAN_AUDIT_GAPS.md](docs/page-plan/PAGE_PLAN_AUDIT_GAPS.md)。