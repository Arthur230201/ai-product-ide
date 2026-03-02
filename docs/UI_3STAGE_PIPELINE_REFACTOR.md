# 三段式 UI 生成 Pipeline 重构报告

## 概述

本次重构实现了三段式 UI 生成 pipeline，将 UI 生成过程分为三个阶段：静态 HTML 生成 → 美化 → 添加交互，提升生成速度和用户体验。

## 目标流程

1. **对话框生成静态 HTML** → 预览框立刻展示
2. **点"编辑"** → 在预览上方直接改代码（实时刷新预览）
3. **点"美化"** → 只改样式（不改结构/不加交互）
4. **点"交互"** → 只加交互逻辑（hooks/事件/状态）
5. **右上"导出"** → 导出 HTML + 导出图片

## 实施步骤

### A. 终端命令执行

✅ **已完成**：
- 创建新分支 `feat/ui-3stage-pipeline`
- 安装依赖：`html-to-image`, `@uiw/react-codemirror`, `@codemirror/lang-html`
- 基础检查：`npm run lint` 和 `npx tsc --noEmit` 通过

### B. 代码改造

#### B1. 修复 openai-client.ts 的 AbortSignal 覆盖问题 ✅

**问题**：
- `getCustomFetch()` 创建了自己的 `AbortController` 并覆盖了 `options.signal`
- 导致上层 `callText` 的 `timeoutMs` 无法正确中断请求

**修复**：
- 尊重 `options.signal`（来自 `llm.ts` 的 `abortSignal`）
- 只在没有外部 signal 时创建 fallback controller
- 保留 undici Agent 的 `headersTimeout`/`bodyTimeout`
- transport 层仅做：网络重试最多 1 次、429 透传 statusCode+cooldownSeconds

**文件**：`src/lib/openai-client.ts`

#### B2. 清理 llm.ts 中对 runQueued 的错误假设 ✅

**问题**：
- `runQueued` 成功返回 `{ result, metrics }`，失败会 reject（进入 catch）
- 代码中有错误的假设：`result` 可能是 error object

**修复**：
- 移除 "result 是 error object" 的分支
- 成功时直接注入 metrics 到 `AIResult`
- catch 时：如果 error 有 type，映射到 `AIErrorType`；queuedMs 用保守估计或 0

**文件**：`src/lib/ai/llm.ts`

#### B3. 实现三段式 UI 生成 pipeline ✅

**新增三个 server action**：

1. **`generateStaticUIFromText`** (`src/app/actions/ui-pipeline.ts`)
   - 只生成静态 HTML（无复杂交互、无 hooks、无状态、无请求）
   - 保证快速生成
   - 返回：`{ ok: true, html: string }` 或 `{ ok: false, type, message }`

2. **`beautifyUI`** (`src/app/actions/ui-pipeline.ts`)
   - 输入当前 HTML，只允许改样式（排版、配色、间距、字体）
   - 不改变 DOM 结构语义，不新增交互逻辑
   - 返回：`{ ok: true, html: string }` 或 `{ ok: false, type, message }`

3. **`addInteractions`** (`src/app/actions/ui-pipeline.ts`)
   - 输入当前 HTML，只新增交互（点击、切换、简单状态、表单校验等）
   - 尽量保持结构稳定
   - 返回：`{ ok: true, html: string }` 或 `{ ok: false, type, message }`

**约束**：
- 三个 action 全部必须走 `callText`（actionName/mode 需要不同，便于 dedup key）
- prompt 必须按阶段收敛：静态阶段严禁生成交互；美化阶段严禁改结构；交互阶段只增逻辑
- 返回统一：`{ ok, type, data, message? }`（discriminated union 风格）

**文件**：`src/app/actions/ui-pipeline.ts`（新建）

#### B4. 前端 CommandBar 加编辑/美化/交互/导出 ✅

**修改**：
- `CommandBar.tsx`：在生成 UI 时优先使用 `generateStaticUIFromText`
- `ViewWorkbench.tsx`：添加"美化"和"交互"按钮，调用对应的 action

**UI 交互逻辑**：
- 对话框"生成"触发 `generateStaticUIFromText` → 预览框显示静态页面（HTML srcDoc）
- 预览框上方有"编辑"按钮：点击后显示 HTML 代码编辑器，修改即时刷新预览
- "编辑"旁边新增"美化""交互"按钮：
  - 美化：把当前 HTML 发给 `beautifyUI`，返回后替换预览 HTML
  - 交互：把当前 HTML 发给 `addInteractions`，返回后替换预览 HTML
- 预览框右上方新增"导出"按钮：弹出菜单/二选一：导出 HTML、导出图片

**文件**：
- `src/components/canvas/CommandBar.tsx`
- `src/components/canvas/ViewWorkbench.tsx`

#### B5. 导出：前端导出图片 + HTML ✅

**实现**：
- HTML 导出：把当前 iframe srcDoc 的 HTML 以 Blob 下载（.html）
- **PNG 导出实现**：使用 iframe 内截图 + postMessage 方案
  - 在 iframe 内注入 capture script（`buildCaptureScript`）
  - iframe 内使用 SVG foreignObject 渲染 HTML 到 Canvas
  - 通过 postMessage 将 dataURL 传回主窗口
  - **不使用** html-to-image（依赖已安装但未使用，可考虑移除）
  - **原因**：html-to-image 直接对外层容器截图通常只会截到 iframe 外壳，截不到 iframe 内文（浏览器安全限制）

**文件**：
- `src/components/canvas/ViewWorkbench.tsx`（导出逻辑）
- `src/lib/ui/capture-injector.ts`（capture script 实现）

**注意**：当前实现为前端方案，如需更高质量/跨浏览器一致性，可考虑后端 Playwright 截图

## 文件变更列表

### 新增文件
- `src/app/actions/ui-pipeline.ts`：三段式 UI 生成 pipeline

### 修改文件
- `src/lib/openai-client.ts`：修复 AbortSignal 覆盖问题
- `src/lib/ai/llm.ts`：清理 runQueued 错误假设
- `src/components/canvas/CommandBar.tsx`：集成 `generateStaticUIFromText`
- `src/components/canvas/ViewWorkbench.tsx`：添加"美化"和"交互"按钮

## 行为变化总结

1. **生成速度提升**：使用 `generateStaticUIFromText` 生成静态 HTML，输出更小（<= 1200 行/60KB），降低触发 429 的概率
   - **注意**：拆段本身不保证避免 429，根因通常是并发、速率、账户配额
   - **确保措施**：统一入口（callText/callObject）、队列控制（DEFAULT_CONCURRENCY=1）、无 SDK 重试（maxRetries=0）
2. **三段式流程**：静态 HTML → 美化 → 交互，用户可以按需选择阶段
3. **错误处理改进**：AbortSignal 正确传递，timeout 可以正确中断请求
4. **导出功能完善**：支持导出 HTML 和 PNG（长图）
   - **PNG 导出实现**：使用 iframe 内截图 + postMessage 方案（capture script），不是直接使用 html-to-image
   - **说明**：html-to-image 依赖已安装但未使用，可考虑移除

## 硬约束验收条款

### 1. 输出长度硬约束 ✅

- **阶段1（静态 HTML）**：<= 1200 行 或 <= 60KB（代码中已实现验证）
- **阶段2（美化）**：只输出完整 HTML，不要解释；若超长则压缩样式/复用 class
- **阶段3（交互）**：<script> 标签内代码 <= 250 行（代码中已实现验证）

### 2. 结构不变硬约束 ✅

- **阶段2（美化）必须保留所有 data-section、data-component-id 属性**
- 代码中已实现验证：如果丢失 data-section，拒绝应用结果并提示重试
- **阶段1（静态 HTML）要求为每个主要区块添加 data-section 属性**

### 3. 交互阶段约束 ✅

- **只允许**：增加 <script>（Vanilla JS）、data-* 属性、少量容器节点（如 <div id="modal-root">）
- **禁止**：React/Vue 项目结构、构建工具、import/export、React Hooks
- **已修正 prompt**：从 "React Hooks" 改为 "Vanilla JavaScript"

### 4. 统一返回 Schema ✅

- 所有 pipeline action 返回：`{ ok: boolean, html?: string, type?: string, message?: string, cooldownSeconds?: number, requestId: string }`
- 前端不猜测结构，直接按 schema 解析
- 使用 TypeScript discriminated union 类型

### 5. 全仓库 AI 入口统一 ⚠️

- **当前状态**：`node-operations.ts` 中仍有 `generateText` 直接调用（`generateTestCases`、`refineUI` 等）
- **建议**：逐步迁移到 `callText`，或明确 whitelist 这些特殊用法
- **验收命令**：`rg -n "generateText\(|generateObject\(" src`（除 llm.ts 或明确 whitelist）

### 6. 导出 PNG 统一实现 ✅

- **当前实现**：iframe 内截图 + postMessage（capture script）
- **不使用**：html-to-image（依赖已安装但未使用）
- **代码位置**：`src/lib/ui/capture-injector.ts`、`src/components/canvas/ViewWorkbench.tsx`

### 7. Cooldown Gate 限制说明 ⚠️

- **当前实现**：in-memory cooldown gate（模块级变量 `rateLimitUntilMs`）
- **限制**：在以下情况会失效：
  - Serverless 多实例
  - Edge runtime
  - 多进程（cluster）
  - 开发热更新 reload
- **说明**：cooldown gate 是 best-effort，仅对单实例生效
- **建议（中期）**：迁移到 Redis/Upstash 或使用 provider 自带的限流

## QA Checklist

1. ✅ **单次调用**：`generateStaticUIFromText` 只调用一次 LLM
2. ✅ **429 降级**：如果返回 429，使用 fallback 或提示用户
3. ✅ **无二次调用**：生成静态 HTML 后，不会自动触发美化或交互
4. ✅ **去重工作**：相同 prompt 会命中 dedup
5. ✅ **队列工作**：并发请求会排队等待（DEFAULT_CONCURRENCY=1）
6. ✅ **UI 继续**：生成失败时 UI 不会卡死，显示错误提示
7. ✅ **日志显示**：日志中包含 dedup/queuedMs 信息
8. ✅ **编辑功能**：点击"编辑"可以修改 HTML 代码
9. ✅ **美化功能**：点击"美化"可以优化样式（含结构验证）
10. ✅ **交互功能**：点击"交互"可以添加交互逻辑（Vanilla JS）
11. ✅ **导出功能**：可以导出 HTML 和 PNG（iframe 内截图）
12. ✅ **输出长度验证**：阶段1/3 有硬约束检查
13. ✅ **结构验证**：阶段2 有 data-section 保留检查
14. ✅ **类型检查**：`tsc --noEmit` 通过
15. ✅ **Lint 检查**：`npm run lint` 通过（只有警告，无错误）

## 验证命令

```bash
# 1. 全局扫一遍：确保不存在旧 generateText/generateObject 直连（除了明确保留的特殊用法）
rg -n "generateText\(|generateObject\(" src/app/actions

# 2. 全局扫 runQueued：确保只有新签名用法
rg -n "runQueued\(" src

# 3. 检查 AI 入口统一性（除 llm.ts 和明确 whitelist）
rg -n "generateText\(|generateObject\(" src --exclude "**/llm.ts" --exclude "**/node_modules/**"

# 4. 质量检查
npm run lint
npx tsc --noEmit

# 5. 本地启动验证交互链路
npm run dev
```

## 已知限制和待改进

### 1. Cooldown Gate 多实例限制

- **当前**：in-memory cooldown gate（单实例有效）
- **影响**：Serverless/Edge/多进程环境会失效
- **建议**：中期迁移到 Redis/Upstash

### 2. AI 入口未完全统一

- **当前**：`node-operations.ts` 中仍有 `generateText` 直接调用
- **影响**：绕过 cooldown gate/队列/metrics
- **建议**：逐步迁移或明确 whitelist

### 3. 导出 PNG 方案

- **当前**：iframe 内截图 + postMessage（前端方案）
- **限制**：跨浏览器一致性可能不如后端方案
- **建议**：如需更高质量，可考虑后端 Playwright 截图

## 注意事项

1. **保留的 generateText 调用**：
   - `src/app/actions/node-operations.ts` 中的 `generateTestCases`、`refineUI` 等函数仍使用 `generateText`（这些是特殊用法，需要保留）

2. **导出功能**：
   - PNG 导出使用 capture script（通过 iframe postMessage），不是直接使用 `html-to-image`
   - HTML 导出直接下载 Blob

3. **三段式 pipeline**：
   - 用户可以选择只生成静态 HTML，然后手动点击"美化"和"交互"
   - 也可以一次性完成所有阶段

## 结论

✅ 所有任务已完成：
- B1: 修复 AbortSignal 覆盖问题
- B2: 清理 runQueued 错误假设
- B3: 实现三段式 UI 生成 pipeline
- B4: 前端 CommandBar 加编辑/美化/交互/导出
- B5: 实现导出 HTML 和图片功能

✅ 所有检查通过：
- `npm run lint`：通过（只有警告）
- `npx tsc --noEmit`：通过

重构完成，可以投入使用。
