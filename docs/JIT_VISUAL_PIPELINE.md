# JIT 视觉重构流水线

## 架构概览

该方案通过三层架构标准化 HTML 输出，不依赖 AI 逐行重写 HTML（这会导致劣化），而是通过"注入配置"和"语义映射"来标准化输出。

### 处理流程图

```
Input: 用户上传 HTML / 图片 / 描述
    ↓
Layer 1 - 结构标准化层 (Guardrails)
    ↓ 强制注入防溢出容器和交互脚本
Layer 2 - 语义配置层 (Semantic Config)
    ↓ AI 只生成 tailwind.config，不改动 HTML
Layer 3 - 组件映射层 (Component Mapping)
    ↓ 针对特定组件的正则替换规则
Output: 100% 运行在 JIT 模式下的标准 HTML
```

## 三层架构详解

### Layer 1: 结构标准化层 (Guardrails)

**目的**：无论用户上传什么代码，保证它在手机壳里不溢出，且具备基础交互能力。

**功能**：
- 强制注入 Viewport 锁定：防止移动端缩放导致的布局错位
- 强制注入"安全壳" CSS：解决"超出外壳"问题
- 添加基础交互反馈

**使用示例**：
```typescript
import { injectGuardrails } from '@/utils/jit-visual-pipeline';

const safeHtml = injectGuardrails(userHtml);
```

### Layer 2: 语义配置层 (Semantic Configuration)

**目的**：解决"颜色劣化"问题。AI 只生成 `tailwind.config`，不改动 HTML 中的 class 名称。

**核心原则**：
- **禁止修改 HTML 标签**：不要去把 `<div class="bg-blue-500">` 改成 `<div class="bg-[#xxxx]">`
- **映射逻辑**：如果用户 HTML 里用的是 `bg-blue-600`，在 Config 里把 `blue: { 600: '#您的深蓝HEX' }` 进行覆盖
- **通过覆盖 Tailwind 默认色板，实现"换肤不换骨"**

**使用示例**：
```typescript
import { generateTailwindConfig } from '@/app/actions/generate-tailwind-config';
import { injectTailwindConfig, wrapConfigInScript } from '@/utils/jit-visual-pipeline';

// 调用 AI 生成配置
const { config } = await generateTailwindConfig({
  designRequirement: '深蓝色主题',
  htmlContext: userHtml, // 可选：用于分析使用的颜色类名
  existingConfig: existingConfig, // 可选：现有配置
});

// 包装成 <script> 标签并注入
const configScript = wrapConfigInScript(config);
const htmlWithConfig = injectTailwindConfig(userHtml, configScript);
```

### Layer 3: 组件映射与修复层 (Surgical Repair)

**目的**：解决特定组件的布局缺陷（如"底部导航栏贴底溢出"）。

**修复规则**：
1. **贴底通栏导航**：`fixed bottom-0 w-full` → 转换为悬浮胶囊样式
2. **全屏高度**：`h-screen` / `min-h-screen` → `min-h-[100dvh]`
3. **固定定位溢出**：为 `fixed` 元素添加左右约束
4. **水平滚动**：为 `overflow-x-auto` 元素添加 `max-width` 约束

**使用示例**：
```typescript
import { applySurgicalFixes } from '@/utils/jit-visual-pipeline';

const fixedHtml = applySurgicalFixes(userHtml);
```

## 完整使用流程

```typescript
import {
  processHtmlThroughJitPipeline,
  detectHighRiskPatterns,
} from '@/utils/jit-visual-pipeline';
import { generateTailwindConfig } from '@/app/actions/generate-tailwind-config';
import { wrapConfigInScript, injectTailwindConfig } from '@/utils/jit-visual-pipeline';

// 1. 检测高风险模式（可选，用于分析）
const riskAnalysis = detectHighRiskPatterns(userHtml);
console.log('检测到的高风险模式:', riskAnalysis.patterns);

// 2. 完整流水线处理（如果只需要基础处理）
let processedHtml = processHtmlThroughJitPipeline(
  userHtml,
  '深蓝色主题' // 可选：设计需求
);

// 3. 或者分步处理（如果需要 AI 生成配置）
// Step 1: 注入安全壳
let html = injectGuardrails(userHtml);

// Step 2: AI 生成语义配置
const { config } = await generateTailwindConfig({
  designRequirement: '深蓝色主题',
  htmlContext: html,
});
const configScript = wrapConfigInScript(config);
html = injectTailwindConfig(html, configScript);

// Step 3: 执行手术式修复
html = applySurgicalFixes(html);

// 最终输出
console.log('处理后的 HTML:', html);
```

## 为什么这个方案能成？

1. **承认 AI 是不稳定的**：禁止 AI 全文重写 HTML，只让 AI 写 Config（只有几十行代码，出错率极低）

2. **利用 JIT 的特性**：通过覆盖 Tailwind 的默认调色板（例如把 blue-500 重新定义为深蓝），不需要修改 HTML 里的 100 个 class，就能瞬间改变全站风格且保持统一

3. **有物理边界**：Layer 1 的 CSS 强制限制了最大宽度和溢出隐藏，物理上杜绝了"UI 超出外壳"的可能性

## API 参考

### `processHtmlThroughJitPipeline(userHtml, designRequirement?)`

完整流水线处理函数，一次性完成所有三层处理。

**参数**：
- `userHtml: string` - 用户上传的原始 HTML
- `designRequirement?: string` - 设计需求描述（可选，用于生成语义配置）

**返回**：处理后的标准化 HTML

### `injectGuardrails(htmlContent)`

Layer 1: 注入安全壳和基础样式。

### `generateTailwindConfig(input)`

Layer 2: AI 生成 tailwind.config（Server Action）。

**输入**：
```typescript
{
  designRequirement: string;
  existingConfig?: string;
  htmlContext?: string;
}
```

**返回**：
```typescript
{
  config: string; // JavaScript 对象代码
  success: boolean;
  error?: string;
}
```

### `applySurgicalFixes(htmlContent)`

Layer 3: 执行手术式修复。

### `detectHighRiskPatterns(htmlContent)`

检测 HTML 中是否存在高风险布局模式。

**返回**：
```typescript
{
  hasBottomNav: boolean;
  hasFullScreen: boolean;
  hasOverflowRisk: boolean;
  patterns: string[];
}
```

## 集成到现有工作流

在 `CommandBar.tsx` 或 `node-operations.ts` 中，可以在处理 HTML 文件时使用：

```typescript
import { processHtmlThroughJitPipeline } from '@/utils/jit-visual-pipeline';

// 在处理 HTML 文件时
const processedHtml = processHtmlThroughJitPipeline(
  htmlContent,
  userPrompt || '保持原有风格'
);
```




