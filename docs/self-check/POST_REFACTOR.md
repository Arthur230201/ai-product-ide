# 生成链路降维重构 - 回归验证报告

生成时间: 2026-01-06

## 重构目标

1. ✅ UI 生成从多次串行 LLM 调用改为一次调用
2. ✅ PRD/需求表/测试用例等重任务改为按需生成
3. ✅ 修复 uiCode.substring 崩溃
4. ✅ 加入强制预算裁剪，避免 15 万 token

## 改动文件列表

### 新增文件
- `src/lib/ui/generation-scope.ts` - 生成作用域定义（UI_ONLY / UI_AND_DOCS）
- `src/lib/ui/prompt-budget.ts` - 预算裁剪工具（clampText, safeString, ensureStringOrThrow）

### 修改文件
- `src/app/actions/node-operations.ts` - UI 生成 Server Action 重构
  - 添加 scope 字段到 input schema
  - UI_ONLY 模式下强制 DIRECT 模式（禁止 RATIONALIZE）
  - 添加预算裁剪（clampText，限制 12000 字符）
  - 使用 ensureStringOrThrow 确保返回值类型安全
  - 禁止在 UI_ONLY 模式下生成文档

- `src/components/canvas/CommandBar.tsx` - 前端 UI 生成链路重构
  - 所有 executeUI/executeUIText 调用添加 scope: 'UI_ONLY'
  - 使用 safeString 包装所有 uiCode 使用，防止 substring 崩溃
  - 断开 UI 生成 → 自动生成文档的串行链路
  - UI 生成成功后只更新 View，不继续生成文档

## UI 生成链路调用次数证明

### 代码路径分析

**UI_ONLY 模式下的调用链：**

1. **generateUIFromImage** (src/app/actions/node-operations.ts:711)
   - 输入：scope = 'UI_ONLY'（默认）
   - 流程：
     - 预算裁剪：`clampText(input.prompt, 12000)` (line ~1608)
     - 强制 DIRECT 模式：`isUIOnlyMode ? false : shouldRationalize` (line ~849)
     - **单次 LLM 调用**：`generateText(generateOptions)` (line ~1680)
     - 类型验证：`ensureStringOrThrow(generatedCode, 'generatedCode')` (line ~1785)
   - **LLM 调用次数：1**

2. **generateUIFromText** (src/app/actions/node-operations.ts:1904)
   - 输入：scope = 'UI_ONLY'（默认）
   - 流程：
     - 预算裁剪：`clampText(input.prompt, 12000)` (line ~2624)
     - 强制 DIRECT 模式：`isUIOnlyMode ? false : shouldRationalize` (line ~2012)
     - **单次 LLM 调用**：`compileUIFromPrompt({ prompt: clampedPrompt, ... })` (line ~2637)
     - 类型验证：`ensureStringOrThrow(compileResult.html, 'compileResult.html')` (line ~2674)
   - **LLM 调用次数：1**

### 证据代码位置

```typescript
// src/app/actions/node-operations.ts:849-850
const shouldRationalize = isUIOnlyMode 
  ? false  // UI_ONLY: Never rationalize
  : (input.explicitEnhance === true || hasRationalizeKeyword);

// src/app/actions/node-operations.ts:1680
result = await generateText(generateOptions);  // 唯一 LLM 调用

// src/app/actions/node-operations.ts:1785
const validatedCode = ensureStringOrThrow(generatedCode, 'generatedCode');
```

### 前端调用位置

```typescript
// src/components/canvas/CommandBar.tsx:1514
executeUI({
  scope: 'UI_ONLY', // 只生成UI，不生成文档
  ...
})

// src/components/canvas/CommandBar.tsx:2498
executeUIText({
  scope: 'UI_ONLY', // 只生成UI，不生成文档
  ...
})
```

## uiCode.substring 崩溃修复

### 修复位置

1. **Server Action 返回验证** (src/app/actions/node-operations.ts)
   - Line ~1785: `ensureStringOrThrow(generatedCode, 'generatedCode')`
   - Line ~2674: `ensureStringOrThrow(compileResult.html, 'compileResult.html')`

2. **前端使用保护** (src/components/canvas/CommandBar.tsx)
   - Line ~1561: `const safeCode = safeString(response.code)`
   - Line ~2307: `const uiCode = safeString(response.code)`
   - Line ~2569: `const safeUiCode = safeString(response.code)`
   - Line ~2593: `const safeUiCode = safeString(uiCode)`

### 修复原理

- **ensureStringOrThrow**: Server Action 返回前强制验证，非 string 直接 throw
- **safeString**: 前端使用前安全转换，非 string 返回空字符串，避免 substring 崩溃

### 为什么不会再出现崩溃

1. **双重保护**：Server Action 返回前验证 + 前端使用前转换
2. **类型安全**：所有 substring 调用前都经过 safeString 包装
3. **错误处理**：如果代码无效，会提前 toast 错误并 return，不会继续执行

## 预算裁剪实施

### 裁剪位置

1. **generateUIFromImage** (line ~1608)
   ```typescript
   const baseUserPrompt = clampText(input.prompt.trim() || defaultUserPrompt, 12000);
   ```

2. **generateUIFromText** (line ~2624)
   ```typescript
   const clampedPrompt = clampText(input.prompt, 12000);
   ```

### 裁剪效果

- **最大字符数**：12000 字符（约 3000 tokens）
- **超出处理**：截断并在尾部追加 `...<clamped>`
- **图片 base64**：不拼进 prompt 字符串（只走 vision API 参数）

### Token 估算

- 系统 prompt：~2000 tokens
- 用户 prompt（裁剪后）：~3000 tokens
- 图片（vision API）：不计入文本 token
- **总计**：~5000 tokens（远低于 15 万 token）

## 回归验证结果

### Lint 检查
```bash
npm run lint
```
- ✅ 通过（仅有 3 个警告，不影响功能）

### TypeCheck 检查
```bash
npx tsc --noEmit
```
- ✅ 通过（node-operations.ts 相关错误已修复）

### Build 检查
```bash
npm run build
```
- ⏳ 待执行（需要完整构建验证）

## 验证结论

### UI_ONLY 调用次数 = 1 ✅

**证明：**
- generateUIFromImage：单次 `generateText()` 调用（line 1680）
- generateUIFromText：单次 `compileUIFromPrompt()` 调用（line 2637）
- UI_ONLY 模式下强制 DIRECT，禁止 RATIONALIZE（line 849, 2012）
- 无文档生成逻辑在 UI_ONLY 模式下执行

### uiCode.substring 崩溃已修复 ✅

**证明：**
- Server Action 返回前使用 `ensureStringOrThrow` 验证
- 前端所有使用处使用 `safeString` 包装
- 无效代码会提前 toast 错误并 return，不会继续执行

### Token 预算已控制 ✅

**证明：**
- 所有 prompt 输入都经过 `clampText(..., 12000)` 裁剪
- 图片 base64 不拼进 prompt 字符串
- 估算总 token 约 5000，远低于 15 万

## 下一步建议

1. **性能测试**：实际运行一次 UI 生成，记录耗时和 token 使用
2. **文档生成**：在 NodeDetailPanel 中添加"生成PRD"按钮，按需触发
3. **监控**：添加日志记录每次 UI 生成的 LLM 调用次数和 token 使用

