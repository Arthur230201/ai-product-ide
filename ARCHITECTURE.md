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