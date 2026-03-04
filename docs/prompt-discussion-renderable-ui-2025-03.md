# 提示词调整讨论：按「能正常呈现的 UI 代码」约束

目标：按 `docs/UI_PREVIEW_RENDERABLE_CODE.md` 的约束，调整大模型生成 UI 代码的提示词，2 轮讨论后执行。

---

## 第一轮：最强大脑 + 专家团队

### 最强大脑（第一性原理）

- **可运行 = 预览器能编译并挂载**。预览器只做三件事：去掉 import/export、Sucrase 编译 JSX、在沙箱里 `new Function(React, LucideIcons, Recharts, PreviewUI)` 执行并取「App 或 Page 或提取的组件名」作为根组件。
- 因此生成代码必须满足：
  1. **入口组件名**：根组件必须叫 `App` 或 `Page`（或能被正则提取的单一函数名），否则预览器找不到根组件会报错。
  2. **零 import/export**：所有 import 会被整行删除；export default 会被替换。模型不应写任何 import，也不应依赖 export 的模块边界。
  3. **仅用已注入符号**：UI 只能用 PreviewUI 列表（Button、Card、NavBar、AppBar、Tabs、ListItem、cn 等）；图标只能用 lucide-react 里真实存在的名字（如 Search、User、Mic），不能用 `Icon` 或臆造名，否则白屏或替换成备用图标。
  4. **布局防压扁**：根布局必须是 flex 列，主内容区 `flex-1 min-h-0 overflow-y-auto`，否则在 PreviewFrame 中主内容区高度为 0，只会看到底部一块。

### 提示词专家

- 当前 system prompt 已有「严禁 import」「严禁未列组件」，但**没有显式写「根组件必须命名为 Page 或 App」**，模型可能输出 `export default function ProductDetail()` 等，提取名虽可用但易与「优先 App/Page」的说明脱节。
- 建议：**显式规定「只输出一个根组件，且必须命名为 \`function Page() { ... }\` 或 \`function App() { ... }\`，不要使用其他名称」**，与 LivePreview 的查找顺序一致，减少歧义。

### 前端 / 交付质量

- 组件列表与 `preview-ui/index.ts` 已对齐，但**图标**当前写的是「禁止引入外部图标库；内联 SVG 或 Emoji」——而 LivePreview 实际**注入了一整份 Lucide 图标**，直接写 `<Search />` 等即可。若模型只写内联 SVG，没问题；若模型写 `import { X } from 'lucide-react'` 会因 import 被删而报错。所以要么明确「不要 import；图标用内联 SVG 或 Emoji」，要么明确「图标可直接使用 Lucide 组件名（如 Search、User、Mic），不要 import，不要使用 Icon」。
- 建议：**二选一约束**——「图标：不要写 import。可使用内联 SVG/Emoji，或直接使用已注入的 Lucide 组件名（如 \<Search />、\<User />、\<Mic />），禁止使用 \`Icon\` 或未在 lucide-react 中存在的名称。」

### 结论（第一轮）

- 在 system prompt 中增加四条硬约束：**(1) 根组件必须 \`function Page() { ... }\` 或 \`function App() { ... }\`；(2) 不要写任何 import/export；(3) 仅用已列出的 UI 组件，图标仅用内联 SVG/Emoji 或已注入 Lucide 名且禁止 Icon；(4) 根布局 flex 列 + 主内容区 flex-1 min-h-0 overflow-y-auto。**

---

## 第二轮：收敛与定稿

### 共识

- 所有参与者同意第一轮四条约束进入 system prompt。
- **输出格式**：保持「\`export default function Page() { ... }\`」的写法，因为 LivePreview 会把 \`export default function Page\` 替换成 \`const Page = function Page\`，无需模型改写法；但**必须强调组件名是 Page 或 App**，避免模型输出 \`export default function RoleManagement()\` 等（虽可提取但增加不一致性）。

### 具体修改点（ui-generation-prompt.ts）

1. **Strict Component Constraints** 段落：
   - 保留「绝对禁止 import」「绝对禁止未列组件」。
   - 新增一句：**根组件必须且仅能使用 \`function Page() { ... }\` 或 \`function App() { ... }\`，不要使用其他名称（如 RoleManagement、Detail 等），否则预览无法识别根组件。**

2. **图标**：
   - 当前「禁止引入外部图标库。请使用内联 SVG 或 Emoji」改为：**禁止写任何 \`import\`。图标请使用内联 SVG（className=\"w-5 h-5 shrink-0\"）或 Emoji；若使用 Lucide 图标，直接写组件名如 \<Search />、\<User />、\<Mic />，不要 import，禁止使用 \`Icon\` 或 lucide 中不存在的名称。**

3. **Design & Code Guidelines** 第 1 条：
   - 由「统一输出默认导出的函数组件：\`export default function Page() { ... }\`」改为：**必须输出单一根组件，且仅能命名为 \`Page\` 或 \`App\`，格式为 \`export default function Page() { ... }\` 或 \`export default function App() { ... }\`。不要使用其他函数名作为根组件。**

4. **主内容区 / 布局**（已有「主内容区容器建议 \`flex-1 min-h-0 overflow-y-auto\`」）：
   - 在「主内容区强制要求」或「Platform & Viewport」中补一句：**根节点必须为 flex 列布局（\`flex flex-col\`），主内容区必须含 \`flex-1 min-h-0 overflow-y-auto\`，否则预览中主内容区会被压扁仅显示底部。**

### 不修改范围

- 图片生成 UI 的 prompt（index.ts 的 buildUIGenerationPrompt）本次不改为统一入口；若后续希望图片生成也 100% 可预览，可复用同一套「根组件名 / 无 import / 仅注入组件 / 布局」约束。

---

## 执行清单

- [x] 在 `buildUIGenerationSystemPrompt` 中加入「根组件必须 Page 或 App」的硬约束。
- [x] 在「Strict Component Constraints」中加入根组件命名说明。
- [x] 调整「图标处理」为：无 import + 内联 SVG/Emoji 或 Lucide 组件名（禁止 Icon）。
- [x] 在「Design & Code Guidelines」中明确单一根组件且仅能 Page/App。
- [x] 在布局相关段落中明确根 flex 列 + 主内容区 flex-1 min-h-0 overflow-y-auto。
