# HTML 模板注入功能

## 概述

HTML 模板注入功能允许用户提供原始 HTML 字符串，系统会自动将其转换为 React 组件代码并在 PRD 生成时使用。这提供了高保真度的 UI 实现，特别适用于从设计工具（如 Stitch、Figma 导出）或现有 HTML 文件直接生成 PRD。

## 功能特性

1. **自动 HTML 到 React 转换**：将原始 HTML 转换为 React 兼容的 JSX 代码
2. **智能检测**：自动检测代码是 HTML 还是 React，并相应处理
3. **Material Icons 支持**：自动保留 Material Icons 格式，无需替换为 Lucide
4. **完整语法转换**：处理 class → className、自闭合标签、SVG 属性等

## 使用方法

### 方法 1：通过节点数据直接设置 HTML 模板

在节点的 `artifacts.view` 中添加 `htmlTemplate` 字段：

```typescript
{
  id: "node-1",
  data: {
    label: "上层角色工作台",
    artifacts: {
      view: {
        code: "...", // 现有的 React 代码（可选）
        htmlTemplate: `
          <div class="min-h-screen bg-gray-50 flex">
            <div class="flex-1 p-6">
              <h1 class="text-2xl font-bold">工作台</h1>
              <span class="material-icons-round">smart_toy</span>
            </div>
          </div>
        `
      }
    }
  }
}
```

### 方法 2：自动检测 HTML 代码

如果 `view.code` 中包含 HTML（而不是 React 代码），系统会自动检测并转换：

```typescript
{
  artifacts: {
    view: {
      code: `
        <div class="container">
          <span class="material-icons-round">home</span>
        </div>
      `
    }
  }
}
```

系统会自动检测这是 HTML 并转换为 React 代码。

## 转换规则

### 1. 类名转换
- `class="..."` → `className="..."`
- `class='...'` → `className='...'`

### 2. 自闭合标签
自动将以下标签转换为自闭合格式：
- `<input>` → `<input />`
- `<img>` → `<img />`
- `<br>` → `<br />`
- `<hr>` → `<hr />`
- 等等

### 3. HTML 注释移除
- `<!-- ... -->` 会被自动移除

### 4. SVG 属性转换
SVG 属性从 kebab-case 转换为 camelCase：
- `stroke-width` → `strokeWidth`
- `fill-rule` → `fillRule`
- `text-anchor` → `textAnchor`
- 等等

### 5. 文档结构处理
- 如果提供完整的 HTML 文档（包含 `<html>`, `<head>`, `<body>`），会自动提取 `<body>` 内容
- `<script>` 和 `<style>` 标签会被移除（样式应使用 Tailwind CSS）

### 6. Material Icons 保留
- Material Icons 格式会被保留：`<span className="material-icons-round">icon_name</span>`
- 不会替换为 Lucide 图标

## 组件命名

转换后的 React 组件会自动命名为 `App_${nodeId}`，其中 `nodeId` 是节点的唯一标识符。

例如，如果节点 ID 是 `liaison_workspace`，生成的组件将是：

```javascript
const App_liaison_workspace = () => {
  return (
    <>
      {/* 转换后的 HTML 内容 */}
    </>
  );
};

return App_liaison_workspace;
```

## 优先级

在 PRD 生成时，系统按以下优先级选择 UI 代码：

1. **HTML 模板** (`view.htmlTemplate`) - 最高优先级
2. **自动检测的 HTML** (`view.code` 如果是 HTML) - 次优先级
3. **现有 React 代码** (`view.code` 如果是 React) - 默认

## 示例

### 示例 1：完整的 HTML 模板

```typescript
const node = {
  id: "workspace",
  data: {
    label: "工作台",
    artifacts: {
      view: {
        htmlTemplate: `
          <div class="min-h-screen bg-gray-50 flex">
            <aside class="w-64 bg-white shadow-lg">
              <div class="p-4">
                <h2 class="text-xl font-bold">导航</h2>
                <ul class="mt-4 space-y-2">
                  <li class="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
                    <span class="material-icons-round">dashboard</span>
                    <span>仪表盘</span>
                  </li>
                  <li class="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
                    <span class="material-icons-round">assignment</span>
                    <span>任务</span>
                  </li>
                </ul>
              </div>
            </aside>
            <main class="flex-1 p-6">
              <h1 class="text-3xl font-bold mb-4">工作台</h1>
              <div class="grid grid-cols-3 gap-4">
                <div class="bg-white p-4 rounded-lg shadow">
                  <span class="material-icons-round text-blue-500">smart_toy</span>
                  <p class="mt-2">AI 助手</p>
                </div>
              </div>
            </main>
          </div>
        `
      }
    }
  }
};
```

### 示例 2：自动检测 HTML

```typescript
const node = {
  data: {
    artifacts: {
      view: {
        // 系统会自动检测这是 HTML 并转换
        code: `
          <div class="container mx-auto p-4">
            <button class="bg-blue-500 text-white px-4 py-2 rounded">
              <span class="material-icons-round">save</span>
              保存
            </button>
          </div>
        `
      }
    }
  }
};
```

## 注意事项

1. **样式依赖**：确保 HTML 中使用的样式类在 Tailwind CSS 中可用，或使用任意值（如 `bg-[#F3F4F6]`）
2. **Material Icons CDN**：Material Icons 的 CDN 链接已自动包含在生成的 PRD HTML 中
3. **交互逻辑**：转换后的代码是静态的，如需交互逻辑，需要手动添加 React Hooks（useState, useEffect 等）
4. **性能**：大型 HTML 模板的转换可能需要一些时间，建议保持模板大小在合理范围内

## 技术实现

- **转换函数**：`src/utils/html-to-react-adapter.ts`
- **类型定义**：`src/types/fractal.ts` (ViewArtifact)
- **PRD 生成器**：`src/utils/prdGenerator.ts`

## 相关功能

- [Material Icons 支持](./MATERIAL_ICONS_SUPPORT.md)
- [PRD 生成器](./PRD_GENERATOR.md)



