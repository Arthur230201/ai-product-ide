# E2E 测试框架文档

## 概述

本项目实现了完整的端到端（E2E）测试框架，用于验证3阶段UI pipeline的完整工作流。

## 特性

- **Mock模式**：默认使用 `AI_RUNTIME=mock`，提供确定性的、快速的测试（无需真实LLM调用）
- **真实模式**：可选的 `e2e:real-smoke` 脚本用于真实LLM的冒烟测试
- **完整工作流**：测试从生成到导出的完整用户流程
- **自检脚本**：`ui:selfcheck` 直接验证server actions的契约和约束

## 安装

```bash
# 安装 Playwright 浏览器
npm run e2e:install

# 或手动安装
npx playwright install chromium
```

## 运行测试

### E2E 测试（Mock模式，推荐）

```bash
npm run e2e
```

这会：
1. 启动开发服务器（`npm run dev`）
2. 设置 `AI_RUNTIME=mock` 环境变量
3. 运行所有 Playwright 测试
4. 自动停止服务器

### 真实LLM冒烟测试（可选）

```bash
npm run e2e:real-smoke
```

这会使用真实的 OpenAI API，只运行基本的生成测试。**注意**：需要配置 `OPENAI_API_KEY`，且可能受到速率限制。

### 自检脚本（直接验证server actions）

```bash
npm run ui:selfcheck
```

这会：
1. 直接调用server actions（不通过HTTP）
2. 验证响应契约（对象格式，非数组/元组）
3. 验证每个阶段的HTML约束
4. 验证结构稳定性（Stage 2保留component IDs）

## 测试选择器

所有关键UI元素都添加了 `data-testid` 属性：

### CommandBar
- `command-prompt-input`: 提示词输入框
- `command-generate-button`: 生成按钮

### HtmlFirstPreview / ViewWorkbench
- `html-preview-container` / `view-preview-container`: 预览容器
- `html-sandbox-iframe`: iframe元素
- `html-preview-button` / `view-preview-button`: 预览按钮
- `html-edit-button` / `view-edit-button`: 编辑按钮
- `html-beautify-button` / `view-beautify-button`: 美化按钮
- `html-export-button` / `view-export-button`: 导出按钮
- `html-export-html` / `view-export-html`: 导出HTML按钮
- `html-export-png` / `view-export-png`: 导出PNG按钮

## Mock HTML 输出

Mock模式下的HTML输出满足以下约束：

### Stage 1 (Static)
- ✅ 单文件HTML，内联`<style>`
- ✅ 无`<script>`标签
- ✅ 6-10个`data-component-id`属性
- ✅ CSS变量在`:root`中定义
- ✅ 至少一个图片占位符（inline SVG）
- ✅ 无外部网络请求

### Stage 2 (Beautify)
- ✅ 只改变CSS（颜色、间距、字体）
- ✅ 保留所有`data-component-id`属性
- ✅ 不改变DOM结构

### Stage 3 (Interact)
- ✅ 添加`data-action`属性
- ✅ 使用事件委托
- ✅ 添加a11y属性（`aria-label`、键盘支持）
- ✅ 保持结构稳定

## 测试流程

E2E测试覆盖以下步骤：

1. **生成静态UI**：输入提示词，点击生成，验证HTML包含6-10个组件
2. **预览**：验证iframe显示HTML，CSS变量存在
3. **编辑**：切换到编辑模式，验证模式切换
4. **美化**：点击美化，验证CSS改变但component IDs保留
5. **交互**：添加交互，验证`data-action`存在且点击有效
6. **导出HTML**：验证下载`.html`文件
7. **导出PNG**：验证PNG导出功能

## 故障排除

### Playwright未安装
```bash
npm run e2e:install
```

### 端口3000被占用
```bash
# 停止占用端口的进程，或修改 playwright.config.ts 中的端口
```

### Mock模式不工作
确保 `AI_RUNTIME=mock` 环境变量已设置（playwright.config.ts中已配置）

### 测试超时
增加 `playwright.config.ts` 中的 `timeout` 值

## 持续集成

在CI环境中，确保：
1. 安装Playwright浏览器：`npm run e2e:install`
2. 设置 `CI=true` 环境变量（Playwright会自动检测）
3. 使用 `npm run e2e` 运行测试

