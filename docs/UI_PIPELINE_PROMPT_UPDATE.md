# UI Pipeline Prompt 更新报告

## 更新概述

根据参考提示词，全面更新了三段式 UI 生成 pipeline 的 prompt，使其更加严格、清晰和可维护。

## 主要改进

### 1. ✅ 添加统一的输出格式前缀

**新增常量**：`OUTPUT_FORMAT_FOOTER`

```typescript
const OUTPUT_FORMAT_FOOTER = `\n\nOUTPUT FORMAT (NON-NEGOTIABLE):
- Return ONLY one complete HTML document from <!doctype html> to </html>.
- No Markdown, no code fences, no explanations, no extra text.
- Do not include placeholders like "[HTML HERE]". Output the actual HTML.`;
```

**应用**：所有三个阶段的 prompt 末尾都添加了 `OUTPUT_FORMAT_FOOTER`

### 2. ✅ Stage 1 — Static Draft HTML 全面升级

#### 改进点：

1. **目标定位更明确**
   - 从"静态 HTML 页面"改为"usable FIRST DRAFT（可用的初稿）"
   - 强调"coherent layout, believable UI components, and a consistent color system"

2. **单文件约束更严格**
   - 明确：Inline CSS only（一个 <style> 块）
   - 禁止：NO CDNs, NO external fonts, NO remote images, NO external JS
   - **修复**：移除了自动添加 Tailwind CDN 的逻辑，改为添加内联 CSS 基础样式

3. **结构稳定性标记更完整**
   - 添加 `data-component-id` 要求（之前只有 `data-section`）
   - 提供示例：`data-component-id="nav-main", "btn-primary", "card-item"` 等

4. **新增约束**
   - CSS 变量要求（`:root` 中定义颜色、间距、字体等）
   - 图片处理规则（内联 SVG placeholder 或渐变块）
   - 示例项限制（列表/网格最多 6-10 个）
   - 响应式策略（Desktop-first + 简单移动端适配）
   - 语义化 HTML 要求

5. **质量目标**
   - 明确"usable and coherent, not a wireframe"
   - 保持紧凑（< 60KB）

### 3. ✅ Stage 2 — Beautify Styles Only 全面升级

#### 改进点：

1. **允许/禁止列表更详细**
   - **允许**：编辑 `<style>`、添加 CSS 变量、必要时添加 CSS 类
   - **禁止**：添加 `<script>`、添加/删除/移动 DOM 元素、改变 data-section/data-component-id、改变文本内容

2. **Production-ready 标准**
   - 一致的排版和行高
   - 改进的对比度和层次
   - 协调的配色方案（使用 CSS 变量）
   - 清晰的间距系统（8px 基础）
   - 一致的组件样式（按钮/输入框/卡片）
   - 移动端优化（<= 768px）

3. **CSS 简洁性要求**
   - 优先使用变量和可复用选择器
   - 避免冗长重复的样式

### 4. ✅ Stage 3 — Add Interactions Only 全面升级

#### 改进点：

1. **交互目标列表**
   - 提供 8 个可选交互类型（选择 3-6 个最合适的）
   - Tabs、Modal、Collapsible、Search/filter、Form validation、Toast、Counter、Theme toggle

2. **事件委托要求**
   - 明确：在 document 级别附加 1-2 个监听器
   - 使用事件委托模式

3. **data-action 模式**
   - 明确：使用 `data-action="..."` 定义行为
   - 示例：`open-modal`, `close-modal`, `toggle-collapse`, `switch-tab`

4. **状态管理方式**
   - 使用 `data-state` + ARIA（`aria-expanded`, `aria-hidden`, `aria-selected`）
   - 避免复杂全局状态对象

5. **可访问性要求（必需）**
   - Modal：ESC 关闭、backdrop 点击关闭、focus 管理、role="dialog"
   - Collapsibles：`aria-expanded` 和 `aria-controls`
   - Tabs：`aria-selected`, `role="tablist"/"tab"/"tabpanel"`

6. **样式变更最小化**
   - 只添加交互状态所需的 CSS（`.is-hidden`, `.is-active`, modal backdrop）
   - 不要重新设计页面

## 代码变更

### 文件：`src/app/actions/ui-pipeline.ts`

1. **新增常量**（第 19-22 行）：
   ```typescript
   const OUTPUT_FORMAT_FOOTER = `\n\nOUTPUT FORMAT (NON-NEGOTIABLE):...`;
   ```

2. **Stage 1 prompt 更新**（第 57-99 行）：
   - 完全重写为英文版本（更符合 LLM 理解）
   - 添加所有新约束
   - 修复 Tailwind CDN 问题（改为内联 CSS）

3. **Stage 2 prompt 更新**（第 255-280 行）：
   - 完全重写为英文版本
   - 添加详细的允许/禁止列表
   - 添加 Production-ready 标准

4. **Stage 3 prompt 更新**（第 401-454 行）：
   - 完全重写为英文版本
   - 添加交互目标列表
   - 添加事件委托、data-action 模式、可访问性要求

5. **所有阶段 prompt 拼接**：
   - Stage 1: `${systemPrompt}\n\n[USER REQUEST]\n${userPrompt}${OUTPUT_FORMAT_FOOTER}`
   - Stage 2: `${systemPrompt}\n\n${userPrompt}${OUTPUT_FORMAT_FOOTER}`
   - Stage 3: `${systemPrompt}\n\n${userPrompt}${OUTPUT_FORMAT_FOOTER}`

## 验证结果

- ✅ `npx tsc --noEmit`：通过
- ✅ `npm run lint`：通过（只有警告，无错误）
- ✅ 所有三个阶段都正确使用了 `OUTPUT_FORMAT_FOOTER`

## 关键改进对比

| 方面 | 旧版本 | 新版本 |
|------|--------|--------|
| **输出格式强调** | 在 Output Format 部分说明 | 统一前缀常量，所有阶段强制添加 |
| **Stage 1 单文件** | 允许 Tailwind CDN | 禁止所有外部资源，内联 CSS only |
| **结构标记** | 只有 data-section | data-section + data-component-id |
| **Stage 2 标准** | 只说"优化样式" | 明确的 Production-ready 标准 |
| **Stage 3 交互** | 只说"添加交互" | 交互目标列表 + 事件委托 + 可访问性 |
| **语言** | 中文 | 英文（更符合 LLM 理解） |

## 注意事项

1. **Stage 1 不再使用 Tailwind CDN**：
   - 如果 AI 生成的 HTML 不完整，会自动添加基础内联 CSS
   - 这符合单文件约束，但可能不如 Tailwind 方便
   - 建议：让 AI 生成完整的 HTML（包含完整的内联 CSS）

2. **所有 prompt 改为英文**：
   - 更符合 LLM 的理解习惯
   - 但用户输入（userPrompt）仍然是中文
   - 输出内容要求使用中文

3. **结构验证**：
   - Stage 2 仍然会验证 `data-section` 是否保留
   - 建议后续也验证 `data-component-id` 是否保留

## 后续建议

1. **添加 data-component-id 验证**：
   - 在 Stage 2 的验证逻辑中也检查 `data-component-id` 是否保留

2. **考虑添加更多示例**：
   - 在 prompt 中提供更多 `data-section` 和 `data-component-id` 的示例

3. **监控输出质量**：
   - 观察新 prompt 是否真的能生成更符合要求的 HTML
   - 根据实际效果调整约束


