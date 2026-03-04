# UI 预览框：能正常呈现的 UI 代码形态

本文档基于 `src/components/canvas/LivePreview.tsx` 的渲染逻辑，说明**什么样的 UI 代码会在预览框中正常显示**。

---

## 一、预览框的两种渲染路径

| 类型 | 判定条件 | 渲染方式 |
|------|----------|----------|
| **React 组件** | 见下文「React 路径判定」 | 经 Sucrase 编译 → `new Function` 执行 → 返回 `App`/`Page`/提取的组件名 → `React.createElement(Component)` 放入 `PreviewFrame` |
| **HTML 文档** | 见下文「HTML 路径判定」 | 使用 `HtmlSandbox`（iframe + `srcDoc`），不经过 React 编译 |

只有满足对应路径要求的代码，才会按该路径渲染；否则可能走错路径（例如 HTML 被当 React 编译报错）或报错/白屏。

---

## 二、React 路径：能正常呈现的代码形态

### 2.1 必须满足

1. **入口组件名**
   - 代码里必须提供**一个**可被识别的根组件，且名称在返回逻辑中存在：
   - 优先查找：`App` → 其次 `Page` → 最后「从代码中提取的组件名」（如 `function ProductDetail()` 则提取为 `ProductDetail`）。
   - 因此推荐写法之一：
     - `function App() { ... }` 或 `function Page() { ... }`
     - 或 `const App = () => { ... }` / `const Page = () => { ... }`
   - 若三者都不存在，会抛错：`无法找到 React 组件。代码中应包含 function App() 或 function Page() 声明。`

2. **不写 import/export**
   - 所有 `import ... from '...'` 会在编译前被**整行移除**。
   - `export default function App` 会被替换为 `const App = function App`，其它 `export` 会被去掉。
   - **结论**：不要依赖任何 import；组件、图标、工具函数均依赖 LivePreview 注入的全局变量（见下）。

3. **只使用「已注入」的依赖**
   - **React**：`React`、`useState`、`useEffect`、`useRef`、`useCallback`、`useMemo` 由 LivePreview 注入。
   - **UI 组件**：来自 `PreviewUI`，在沙箱内以**全局变量**形式存在，直接写组件名即可，例如：
     - `Button`, `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`
     - `Input`, `Label`, `Badge`, `Avatar`, `Separator`, `Textarea`, `Switch`, `Alert`, `Skeleton`
     - `TabsList`, `TabsTrigger`, `TabsContent`, `NavBar`, `BottomNav`, `BottomNavItem`
     - `AppBar`, `Sidebar`, `SidebarItem`, `Progress`, `StatCard`, `ListItem`, `EmptyState`, `PageHeader`
     - `cn`（类名合并）
   - **图标**：仅能使用 **lucide-react** 中存在的图标名（如 `Search`, `User`, `Mic`, `FileText` 等）；以大写开头的 JSX 标签若在 Lucide 中不存在，会被替换为备用图标（如 `FileText`），且不得使用保留名 `Icon`。
   - **图表**：`Recharts` 会以 `Recharts` 对象注入（若生成代码用到）。

4. **代码格式**
   - 支持：`function App() { ... }`、`const App = function App() { ... }`、`const App = () => { ... }`。
   - 会被 strip 的 Markdown 标记：\`\`\`tsx / \`\`\`jsx / \`\`\`javascript / \`\`\`typescript / \`\`\` 会在处理前去掉。

### 2.2 推荐写法示例（与自检用例一致）

```tsx
function Page() {
  return (
    <div className={cn("flex flex-col h-full min-h-full bg-white")}>
      <NavBar title="商品详情" left={<span className="text-sm text-gray-600">返回</span>} />
      <main className={cn("flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0")}>
        <ListItem title="Aurora 无线蓝牙耳机" description="¥299 · 销量 1.2万" />
        <ListItem title="规格：颜色" description="深空灰 / 星光白" />
        <Button className="w-full" size="lg">加入购物车</Button>
      </main>
    </div>
  );
}
```

- 根组件名 `Page`（或 `App`）能被正确识别。
- 仅使用 `cn`、`NavBar`、`ListItem`、`Button` 等已注入的 PreviewUI 组件。
- 无 import/export，无未在 Lucide 中声明的图标。

### 2.3 常见导致「不呈现」或报错的原因

- 使用了未注入的组件或第三方库（例如自己写的 `Header`、其他 UI 库）。
- 使用了不存在的 Lucide 图标名，且替换后仍报错（如拼写或保留名 `Icon`）。
- 根组件不是 `App`/`Page` 且未被正确提取（例如匿名导出、奇怪命名）。
- 代码中有语法错误或运行时报错（如对 `undefined` 调用 `.map`），会被 ErrorBoundary 捕获并显示「渲染错误」。

---

## 三、HTML 路径：能正常呈现的代码形态

当代码被判定为 **HTML** 时，不会走 React 编译，而是交给 `HtmlSandbox` 渲染。

### 3.1 判定逻辑（LivePreview 内）

- 若匹配 **React 特征**（任一条即视为 React，不走 HTML）：
  - `export default function (Page|App|\w+)\(`
  - `import ... from`、`export ...`、`className=`、`useState`/`useEffect`、`function \w+\(`、`const \w+ = () =>` 等
- 若匹配 **HTML 特征**（如 `<!DOCTYPE`、`<html`、`<body`、`class="`、`<div ... class=` 等），或代码以 `<` 开头且无 import/export，则视为 HTML。

### 3.2 能正常呈现的形态

- 完整或片段的 **HTML 字符串**（可含 `class=`、内联样式、Tailwind 类等）。
- 在 iframe 沙箱中执行，并可注入行为脚本（如 `data-*` 交互），样式与滚动由 HtmlSandbox 控制。

若希望走 **React 路径**，请勿写成「以裸 HTML 为主且无 React 特征」的字符串，否则会被识别为 HTML 而不会以 React 组件形式呈现。

---

## 四、预览壳与布局注意点

- **PreviewFrame**：内层为滚动容器，根节点**不再**被强制 `height:100%` 压扁；内容自然高度，由内层滚动。
- 若希望整页（含顶栏、主内容、底栏）在预览中完整可见，根布局建议使用 **flex 列 + 主区域 flex-1 + min-h-0**，与 `TEST_UI_CODE` 一致，避免主内容区高度被压成 0 导致「只看到底部一块」。

---

## 五、自检方式

- 使用 **固定测试代码** 验证 React 路径是否正常：
  - 测试代码：`src/lib/fixtures/test-ui-code.ts`（`TEST_UI_CODE`）
  - 自检页：`/dev/test-ui`（使用 `LivePreview` 渲染上述代码）
- 若该用例能完整显示（顶栏、列表、按钮、底栏），则说明当前「能正常呈现的 React 代码形态」与本文档一致；若自检失败，可对照本文档检查代码是否符合「入口组件名、无 import、仅用已注入组件与图标」等约束。

---

## 六、小结

| 要求 | React 路径 | HTML 路径 |
|------|------------|-----------|
| 入口 | 必须有 `App` 或 `Page` 或可提取的组件名 | 无 |
| 依赖 | 仅使用注入的 React、PreviewUI、Lucide、Recharts、cn | 无 |
| import/export | 不要写，会被 strip 或转换 | 不适用 |
| 组件库范围 | 仅 `src/components/preview-ui` 导出项 + Lucide 图标 | 无 |
| 布局建议 | flex 列 + flex-1 + min-h-0，避免只显示底部 | 无 |

**能正常呈现的 UI 代码** = 在 React 路径下满足上述约束的单一根组件代码，或在 HTML 路径下被正确识别的 HTML 字符串；二者在 LivePreview 中互斥，由当前文件的判定逻辑自动选择路径。
