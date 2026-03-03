# 组件库与页面基本描述说明

## 一、我们有哪些组件库

项目里**只有一套**预览用 UI 组件库，位于 `src/components/preview-ui/`，由 **LivePreview** 在运行时注入到生成代码的沙箱中（无需 import，直接使用组件名）。

### 完整组件列表（与 preview-ui/index.ts 一致）

| 组件名 | 文件 | 说明 |
|--------|------|------|
| Button | button.tsx | 按钮，支持 variant（default/outline/secondary/ghost/link）、size |
| Card, CardHeader, CardTitle, CardContent, CardFooter | card.tsx | 卡片容器与子区域 |
| Input | input.tsx | 输入框 |
| Label | label.tsx | 表单标签 |
| Badge | badge.tsx | 徽标 |
| Avatar | avatar.tsx | 头像 |
| Separator | separator.tsx | 分隔线 |
| Textarea | textarea.tsx | 多行文本 |
| Switch | switch.tsx | 开关 |
| Alert | alert.tsx | 提示框 |
| Skeleton | skeleton.tsx | 骨架屏 |
| TabsList, TabsTrigger, TabsContent | tabs.tsx | 标签页 |
| Progress | progress.tsx | 进度条 |
| StatCard | stat-card.tsx | 数据/统计卡片 |
| ListItem | list-item.tsx | 列表行（title, description, left, right） |
| EmptyState | empty-state.tsx | 空状态 |
| PageHeader | page-header.tsx | 页面标题区（title, description, actions） |
| NavBar | nav-bar.tsx | **移动端** 顶部导航（标题居中，left/right） |
| BottomNav, BottomNavItem | bottom-nav.tsx | **移动端** 底部 Tab 导航 |
| AppBar | app-bar.tsx | **PC 端** 顶部栏 |
| Sidebar, SidebarItem | sidebar.tsx | **PC 端** 侧边栏 |
| cn | cn.ts | 工具函数，类名合并 |

---

## 二、哪些是移动端、哪些是 PC 端

- **仅移动端常用**  
  - **NavBar**：移动端顶部导航栏，标题居中，可选左侧返回、右侧操作。  
  - **BottomNav + BottomNavItem**：移动端底部导航，图标+文字，用于 3–5 个 Tab。

- **仅 PC 端常用**  
  - **AppBar**：PC 端顶部栏，左侧 logo/标题，右侧操作区。  
  - **Sidebar + SidebarItem**：PC 端侧边栏容器与菜单项。

- **通用（移动/PC 都可使用）**  
  Button, Card（及子组件）, Input, Label, Badge, Avatar, Separator, Textarea, Switch, Alert, Skeleton, TabsList/TabsTrigger/TabsContent, Progress, StatCard, ListItem, EmptyState, PageHeader。

说明：代码上并未强制「移动端只能用 NavBar/BottomNav、PC 端只能用 AppBar/Sidebar」；按交互习惯区分即可。

---

## 三、创建模式下「生图」后，每个页面的基本描述放在哪里

「生图」指通过 **生成画布 / generateGraph** 得到节点和边。此时每个**页面节点**的基本描述来自 LLM 返回的 `graph.nodes[]` 里每个节点的 `label`、`description`、`userStories` 等，写入到 **Fractal 节点数据** 的以下位置：

1. **`node.data.label`**  
   - 页面的**显示名称**（如「商品详情」「订单列表」）。  
   - 创建时来自 graph 里该节点的 `label`。

2. **`node.data.artifacts.spec`**  
   - **`spec.title`**：与 `node.data.label` 一致（页面名称）。  
   - **`spec.requirements`**：**字符串数组**，即「本页面的基本描述」的**主要存放处**。  
   - 生成逻辑在 `src/app/actions/generate-graph.ts` 中（约 1062–1071 行）：  
     - 若有 `node.description`，会 push `页面描述：${node.description}`；  
     - 若有 `node.userStories`，会 push 用户故事摘要（作为…想要…以便…）；  
     - 若上述都没有，则 push `页面：${node.label}`。  
   - 因此：**每个页面的基本描述 = spec.requirements 数组里的内容**（可能多条，拼接成一段即可）。

3. **`node.data.artifacts.userStories`**  
   - 用户故事列表（id, role, activity, value, acceptanceCriteria）。  
   - 也是「页面在做什么」的另一种描述，可与 spec.requirements 一起用于生成 UI 或 PRD。

4. **没有单独字段**  
   - 没有 `node.data.description` 这类字段；graph 返回的 `node.description` 只在**写入时**被合并进 `spec.requirements`，之后若要读「页面基本描述」应读 **`artifacts.spec.requirements`**（以及可选的 userStories）。

### 在代码里如何取「当前页面的基本描述」

- **CommandBar** 中已有 `getNodePageDescription(selectedNode)`（约 29–49 行）：  
  - 用 `spec.title`、`spec.requirements`、`userStories` 拼成一段字符串。  
- 因此：**创建模式下生图后，每个页面的基本描述 = 该节点 `data.artifacts.spec.requirements`（+ 可选 userStories）**，通过 `getNodePageDescription` 即可拿到用于生成 UI 的文案。

---

## 四、小结

- **组件库**：仅 `src/components/preview-ui` 一套；移动端侧重 NavBar/BottomNav，PC 端侧重 AppBar/Sidebar，其余通用。  
- **页面基本描述**：在 **`node.data.artifacts.spec.requirements`**（及 `spec.title`、`node.data.artifacts.userStories`），生成画布时由 generateGraph 从 LLM 返回的 node.label/description/userStories 写入；读取时用 `getNodePageDescription(node)` 即可。
