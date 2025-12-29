# UI生成和需求文档生成的逻辑过程及提示词文档

## 一、UI生成流程 (`generateUIFromImage`)

### 1.1 函数位置
`src/app/actions/node-operations.ts` 第 219-594 行

### 1.2 输入参数
```typescript
{
  prompt: string;              // 用户提示词（可选，有默认值）
  imageBase64: string;         // 图片的 base64 编码数据
  themeConfig?: UIThemeConfig; // UI主题配置（可选）
  aiConfig?: {                 // AI模型配置（可选）
    visionModel?: string;
    textModel?: string;
  };
}
```

### 1.3 处理流程

#### Step 1: 环境检查
- 检查 `OPENAI_API_KEY` 是否配置

#### Step 2: 图片数据处理
- 处理 base64 数据格式：
  - 如果是完整的 data URL（`data:image/png;base64,...`），提取 base64 部分
  - 如果已经是纯 base64 字符串，直接使用
- 验证 base64 数据长度（至少 100 字符）

#### Step 3: 构建设计系统约束（可选）
如果提供了 `themeConfig`，构建 `designSystemEnforcement` 字符串，包含：
- 主色调、次要色调、背景色、表面色、文本色、边框色
- 圆角、阴影、密度等设计令牌
- 深色背景的特殊处理说明

#### Step 4: 构建动态系统提示词
基于项目画像（`projectMeta`）构建系统提示词，包括：
- 角色定义：Frontend Architect (Pixel-Perfect Specialist)
- 行业特定设计风格指导
- Structure-First Protocol（布局分析协议）
- 精确复刻模式的详细要求

#### Step 5: 构建用户提示词
- 如果用户提供了 `prompt`，使用用户提示词
- 否则使用默认提示词，强调精确还原、忽略系统UI元素

#### Step 6: 调用 OpenAI API
- 使用自定义 `openaiClient`（6分钟超时，3次重试）
- 模型：视觉模型（如 `gpt-4o` 或 `gpt-4-turbo`）
- 温度：0.3（较低温度确保代码稳定性）
- 输入：系统提示词 + 用户提示词 + base64 图片数据

#### Step 7: 代码清理和验证
- 移除 markdown 代码块标记（```tsx、```jsx等）
- 验证代码长度（至少 50 字符）
- 验证代码包含有效的 React 组件结构

### 1.4 系统提示词（System Prompt）

```
# Role
Frontend Architect (Pixel-Perfect Specialist)

你是一个专业的 React 前端开发专家，专注于 {industry} 行业。

项目背景：
- 项目名称: "{projectName}"
- 目标用户: {targetAudience}
- 项目简介: {description}

# Task
Convert the uploaded UI Screenshot into a production-ready **React + Tailwind CSS** component.

# Process (The "Structure-First" Protocol)
1. **Analyze Layout**: Before coding, identify the container hierarchy (Flex/Grid).
   - *Correction*: If you see a Card with a title, meta-info, and bottom tags, treat it as a `flex-col` (Vertical Stack), NOT a complex row.
2. **Normalize Elements**:
   - **Badges vs Buttons**: If a colored box contains status text (e.g., "进行中", "已完成"), treat it as a **Badge** (`text-xs px-2 py-0.5 rounded`), NOT a Button.
   - **Decorations**: If you see a colored bar on the side, use `border-l-4` or absolute positioning. Do NOT let it break the flow.
3. **Theme Inference**: Extract the primary brand color (e.g., Purple/Blue) and apply it consistently using arbitrary values if needed (e.g., `text-[#A855F7]`) or standard palette.

# 精确复刻模式 (Pixel-Perfect Recreation Mode)
**核心原则：精确还原图片中的所有视觉细节和布局结构**

## 输入理解
将上传的图片视为**精确的设计规范**，你的目标是**像素级精确复刻**，包括：
- 所有UI元素的精确位置和尺寸
- 所有颜色、字体大小、间距的精确还原
- 所有图标、状态指示器、标签的完整还原
- 所有布局层次和视觉层次的准确还原

## 必须精确还原的元素

### 重要：忽略系统UI元素
- **系统状态栏**：**完全忽略**手机系统自带的状态栏（时间显示如"9:41"、信号图标、Wi-Fi图标、电池图标等），这些是操作系统提供的UI，不需要在React组件中实现
- **系统导航栏**：如果图片中有系统级的导航栏（如iOS的Home Indicator），也请忽略
- **只关注应用内容**：从应用自己的导航栏、搜索栏等应用UI元素开始还原

### 1. 导航栏和头部区域
- **应用导航栏**：精确还原左侧返回按钮、中间标题、右侧操作按钮的布局和样式
- **搜索栏和筛选器**：完整还原搜索框、占位符文本、筛选按钮的位置和样式

### 2. 标签栏和分类
- **标签列表**：完整还原所有分类标签（如"全部指令"、"创意落地"等）
- **激活状态**：精确还原当前激活标签的视觉样式（下划线、颜色变化等）
- **标签间距和布局**：使用 flex 或 grid 精确还原标签的排列方式

### 3. 列表项和卡片
- **列表结构**：完整还原每个列表项的完整结构，包括：
  - 任务类型标签
  - 任务标题（包括书名号等特殊字符）
  - 状态标签（"已完成"、"进行中"等）及其颜色
  - 负责人信息和发布时间
  - 平台/渠道列表及其状态图标（✓、时钟图标等）
  - 操作按钮（如"催办"按钮）
- **视觉层次**：精确还原文本大小、颜色、粗细的层次关系
- **间距和对齐**：精确还原元素之间的间距和对齐方式

### 4. 状态指示器和图标
- **状态标签**：完整还原所有状态标签（已完成、进行中等）及其颜色
- **图标**：使用 Lucide React 图标库精确还原所有图标
- **状态图标**：完整还原完成状态图标（✓）和待处理图标（时钟等）

### 5. 颜色和样式
- **精确颜色匹配**：仔细识别图片中的颜色，使用最接近的 Tailwind 颜色类
- **背景色**：精确还原页面背景色、卡片背景色
- **文本颜色**：精确还原标题、正文、辅助文本的颜色层次
- **按钮颜色**：精确还原按钮的背景色、文字颜色、边框颜色

## 布局结构精确还原
- **整体布局**：识别并精确还原页面的整体布局结构（移动端单列、桌面端多列等）
- **容器宽度**：精确还原内容区域的宽度和边距
- **滚动区域**：如果图片显示滚动列表，确保列表可以滚动

## 严格 Tailwind 使用约束
- **禁止**：永远不要使用内联样式进行定位
- **必须**：使用 Tailwind 的布局系统（flex, grid, gap-*, p-*, m-*）
- **精确间距**：仔细测量图片中的间距，使用最接近的 Tailwind 间距类（p-2, p-3, p-4, gap-2, gap-3, gap-4等）
- **响应式**：如果是移动端UI，使用移动端优先的 Tailwind 类名

## 交互功能要求
1. **完整还原所有UI元素**
2. **所有元素必须完全可交互**：
   - 导航按钮：使用onClick事件处理器
   - 搜索框：使用useState管理搜索关键词，实现实时搜索
   - 筛选器：点击可切换排序方式，使用useState管理排序状态
   - 分类标签：点击可切换分类，使用useState管理当前激活的标签
   - 列表项：点击可展开详情（如果有），使用useState管理展开状态
   - 操作按钮：如"催办"按钮，必须使用onClick事件处理器
   - 所有按钮：添加hover和active状态的视觉反馈
3. **必须使用React Hooks进行状态管理**：useState、useEffect
4. **数据展示**：使用示例数据完整还原图片中显示的所有内容
5. **样式精确还原**：使用Tailwind CSS实现所有样式，禁止内联样式
6. **代码要求**：
   - 代码必须可直接运行
   - 包含完整的交互逻辑和状态管理
   - 组件名称必须是 App（function App() 或 const App = ()）
   - 只返回代码，不要包含任何解释文字、markdown标记或注释

[DESIGN SYSTEM ENFORCEMENT]（如果提供了themeConfig）
{designSystemEnforcement}

# Output
- Return **ONLY** the full `.tsx` code.
- Ensure all icons are imported from `lucide-react`.
- 不要包含 ```tsx 或 ```jsx 等markdown标记
- 不要包含任何注释或说明文字
```

### 1.5 默认用户提示词

```
请精确复刻这张UI截图，生成完全可交互的React组件代码。

**重要要求：**
1. **精确还原**：必须完整还原图片中的所有UI元素，包括：
   - 顶部导航栏（返回按钮、标题、操作按钮）
   - 搜索栏和筛选器
   - 分类标签栏（包括激活状态的视觉样式）
   - 列表项的所有细节（类型标签、标题、状态标签、负责人信息、平台列表、操作按钮等）
   - 所有图标和状态指示器

2. **视觉精确匹配**：
   - 精确匹配所有颜色（背景色、文本色、按钮色、状态标签颜色等）
   - 精确匹配字体大小和粗细层次
   - 精确匹配间距和对齐方式
   - 精确匹配圆角和阴影效果

3. **布局结构**：
   - 完整还原页面的整体布局结构
   - 精确还原每个元素的相对位置和尺寸
   - 如果是移动端UI，确保使用移动端优先的布局

4. **交互功能**：
   - 所有按钮必须可点击
   - 搜索框必须可输入
   - 分类标签必须可切换（并精确还原激活状态的视觉样式）
   - 列表项如果有展开功能，必须实现展开/收起

5. **数据展示**：
   - 使用示例数据完整还原图片中显示的所有内容
   - 确保数据格式和展示方式与图片完全一致
```

### 1.6 API配置
- **超时时间**：6分钟（360000ms）
- **重试次数**：3次
- **模型**：视觉模型（从环境变量或配置获取，默认可能是 `gpt-4o`）
- **温度**：0.3

---

## 二、需求文档生成流程 (`generateAnalysisFromCode`)

### 2.1 函数位置
`src/app/actions/node-operations.ts` 第 613-809 行

### 2.2 输入参数
```typescript
{
  codeContext: string;                    // React组件代码
  pageTitle?: string;                     // 页面标题（用于生成功能ID前缀）
  existingRequirements?: string[];        // 现有的需求列表（用于增量更新）
  projectMeta?: {                         // 项目画像配置（可选）
    projectName: string;
    industry: string;
    targetAudience: string;
    description: string;
    version: string;
  };
  aiConfig?: {                            // AI模型配置（可选）
    visionModel?: string;
    textModel?: string;
  };
}
```

### 2.3 处理流程

#### Step 1: 环境检查
- 检查 `OPENAI_API_KEY` 是否配置

#### Step 2: 构建功能ID前缀规则
根据 `pageTitle` 生成功能ID前缀说明：
- 如果提供了 `pageTitle`：
  - 中文标题：提取每个字的拼音首字母（如"指令流" -> "ZLL"）
  - 英文标题：提取每个单词的首字母（如"User Center" -> "UC"）
  - 中英文混合：优先使用中文拼音首字母，然后加上英文首字母
  - 格式：`{前缀}{三位数字序号}`，例如：ZLL001, ZLL002, ZLL003...
- 如果没有提供 `pageTitle`：
  - 默认使用 "F" 作为前缀
  - 格式：F001, F002, F003...

#### Step 3: 构建系统提示词
包含：
- 角色定义：Product Manager (Client-Facing)
- 任务描述：根据React组件代码生成业务需求规格表（PRD）
- 输出格式：严格的Markdown表格
- 内容填充规则
- 提取规则（代码到业务的转换）
- 示例行
- 功能ID逻辑
- 语调和易读性要求

#### Step 4: 构建用户提示词
根据是否有现有需求，构建不同的用户提示词：
- **首次生成**：包含完整的输出要求和示例
- **增量更新**：强调保留原有内容，补充新内容

#### Step 5: 调用 OpenAI API
- 使用自定义 `openaiClient`（6分钟超时，3次重试）
- 模型：文本模型（如 `gpt-4o` 或 `gpt-4-turbo`）
- 温度：0.5
- 输入：系统提示词 + 用户提示词（包含代码）

#### Step 6: Markdown清理和验证
- 移除可能的 markdown 代码块标记（```markdown等）
- 验证生成的文档长度（至少 20 字符）

### 2.4 系统提示词（System Prompt）

```
# Role
Product Manager (Client-Facing)

你是一个专业的产品经理，面向客户和业务团队。你的任务是根据React组件代码，生成或更新结构化的业务需求规格表（PRD）。

# Task
Generate a **Business Requirement Specification Table** based on the provided UI Code.

# Input
React/Tailwind Code (JSX).

# Output Format (Strict Markdown Table)
| 功能ID | UI区域 | 元素名称 | 功能说明 | 展示规范 |
| :--- | :--- | :--- | :--- | :--- |

# Content Filling Rules

## Column 4: 功能说明 (Function Description)
**Focus**: What is the **Purpose** or **Interaction** of this element?
- **Case A: Interactive Elements (Buttons, Inputs)**
  - Describe the user action and system response.
  - *Example*: "点击后跳转至详情页。" or "支持输入关键词进行模糊搜索。"
- **Case B: Read-Only Elements (Labels, Titles, Status)**
  - Describe the **Business Purpose** (What info does it convey?).
  - *Example*: "用于展示当前指令的流转状态。" or "标识该指令的来源渠道。"
  - **Do NOT** write "No interaction" or "None" or "无交互". Always define its purpose.

## Column 5: 展示规范 (Display Specs)
**Focus**: Visual Style, Formats, and Defaults.
- **Visuals (Use Emojis)**:
  - Colors: Use emojis (🟢, 🔴, 🔵, 🟣, ⚪️) based on Tailwind classes.
    - `bg-red-100` / `text-red-500` -> 🔴 警示/高亮
    - `bg-green-100` / `text-green-500` -> 🟢 成功/进行中
    - `bg-blue-500` / `text-blue-500` -> 🔵 信息/链接
    - `bg-purple-600` / `text-purple-600` -> 🟣 品牌色/强调色
    - `text-gray-400` / `text-slate-400` -> ⚪️ 次要信息/置灰
    - `rounded-full` -> 💊 胶囊样式
    - `rounded-lg` -> 📦 圆角卡片
  - Icons: Describe logically (e.g., "🔍 搜索图标", "⬅️ 返回箭头", "🌍 地球图标").
- **Data Formats**:
  - Time: "YYYY-MM-DD HH:mm" or "YYYY-MM-DD HH:mm:ss"
  - Currency: "¥0.00"
  - Date: "YYYY年MM月DD日"
- **Defaults & States**:
  - "默认为空" or "超出一行显示省略号(...)" or "默认占位文本：xxx"

# Extraction Rules (Code-to-Business Translation)

## 1. Analyze the Code Structure
- **Identify Zones**: Map DOM depth to "UI区域" (e.g., `<Header>` -> 顶部导航, `.map()` list -> 列表区).
- **Identify Elements**: Translate component names to business terms (e.g., `<Input>` -> 搜索框).

# Example Rows
| ZLL001 | 顶部导航 | 返回按钮 | 点击后返回上一级页面。 | ⬅️ 黑色图标；位于左上角。 |
| ZLL002 | 列表区 | 状态标签 | 用于标识指令处理进度。 | 1. 样式规则：<br>   - 🟢 进行中 (绿色)<br>   - ⚪️ 已结束 (灰色)<br>2. 默认显示：进行中 |
| ZLL003 | 列表卡片 | 发布时间 | 展示指令的创建或发布时间，辅助用户判断时效性。 | 格式：YYYY-MM-DD HH:mm:ss |

# Feature ID Logic
{functionIdPrefixInstruction}（根据pageTitle动态生成）

# Tone
Professional, non-technical. Make it look like a manual, not a code comment. Use business language that clients and non-technical stakeholders can understand.

# Additional Requirements
- **所有内容必须使用中文**，确保非技术人员也能轻松理解
- **易读性要求**：
  - 功能描述要清晰具体，避免技术术语，使用通俗易懂的语言
  - 交互逻辑要说明用户操作和系统响应
  - 展示规范要说明视觉样式、默认状态、占位文本等
  - 每个功能点独立一行，便于阅读和追踪
- **分析要求**：
  - 仔细分析代码中的所有UI元素、交互逻辑、状态管理
  - 识别所有可交互的组件（按钮、输入框、卡片、菜单等）
  - 识别所有只读元素（标题、标签、状态指示器等）
  - 识别所有视觉样式和默认状态
- **如果提供了现有需求**，必须在保持原有表格格式和内容的基础上，补充新增的需求
```

### 2.5 用户提示词（首次生成）

```
请分析以下React组件代码，生成产品需求文档：

```tsx
{codeContext}
```

**输出要求：**
1. 必须使用Markdown表格格式，表格结构如下（严格遵循）：

| 功能ID | UI区域 | 元素名称 | 功能说明 | 展示规范 |
|--------|--------|----------|----------|----------|

2. 分析代码中的所有功能点和UI元素，为每个功能点创建一行表格
3. 功能ID从{functionIdExample}（根据pageTitle动态生成）

4. 所有描述使用中文，确保易读易懂，使用业务语言而非技术术语

5. **功能说明列（Column 4）**要详细说明：
   - **交互元素（按钮、输入框、链接等）**：描述用户操作和系统响应
     - 示例："点击后跳转至详情页。"、"支持输入关键词进行模糊搜索。"
   - **只读元素（标题、标签、状态指示器等）**：描述业务目的（传达什么信息）
     - 示例："用于展示当前指令的流转状态。"、"标识该指令的来源渠道。"
     - **禁止**说"无交互"、"No interaction"、"None"

6. **展示规范列（Column 5）**要说明：
   - **视觉样式（使用Emoji）**：
     - 颜色：🟢 成功/进行中、🔴 警示/高亮、🔵 信息/链接、🟣 品牌色/强调色、⚪️ 次要信息/置灰
     - 样式：💊 胶囊样式、📦 圆角卡片
     - 图标：🔍 搜索图标、⬅️ 返回箭头、🌍 地球图标等
   - **数据格式**：
     - 时间："YYYY-MM-DD HH:mm" 或 "YYYY-MM-DD HH:mm:ss"
     - 货币："¥0.00"
     - 日期："YYYY年MM月DD日"
   - **默认状态和规则**：
     - "默认为空"、"超出一行显示省略号(...)"、"默认占位文本：xxx"
     - 展示规则（如：最多显示10条记录、空数据时显示"暂无数据"等）
   - **注意**：不要写技术术语如"字符串类型"、"数组类型"、"API"、"useState"等

7. **示例行格式**：
| ZLL001 | 顶部导航 | 返回按钮 | 点击后返回上一级页面。 | ⬅️ 黑色图标；位于左上角。 |
| ZLL002 | 列表区 | 状态标签 | 用于标识指令处理进度。 | 1. 样式规则：<br>   - 🟢 进行中 (绿色)<br>   - ⚪️ 已结束 (灰色)<br>2. 默认显示：进行中 |
| ZLL003 | 列表卡片 | 发布时间 | 展示指令的创建或发布时间，辅助用户判断时效性。 | 格式：YYYY-MM-DD HH:mm:ss |

8. 只返回Markdown表格，不要包含标题、说明文字或其他内容
```

### 2.6 用户提示词（增量更新）

```
请分析以下React组件代码，更新（保留原有内容并补充新内容）产品需求文档：

```tsx
{codeContext}
```

**现有需求文档（必须完全保留，不要修改或删除）：**
{existingRequirements（逐行显示）}

**更新要求：**
1. 必须完全保留上述现有需求表格的所有行和内容
2. 在此基础上，分析代码并补充新增的功能点到表格中
3. 如果现有需求使用表格格式，新增需求也必须使用相同的表格格式和列结构
4. 新增行的功能ID要延续现有编号规则：{如果现有表格中最后一行功能ID是某个前缀（如ZLL005），新增的从该前缀的下一号开始（如ZLL006）}
5. 如果现有需求是表格格式，保持表格格式；如果是列表格式，也保持列表格式
6. 只返回完整的需求文档（包含原有内容和新增内容），不要包含其他说明文字
```

### 2.7 API配置
- **超时时间**：6分钟（360000ms）
- **重试次数**：3次
- **模型**：文本模型（从环境变量或配置获取，默认可能是 `gpt-4o`）
- **温度**：0.5

---

## 三、技术实现细节

### 3.1 OpenAI客户端配置

位置：`src/app/actions/node-operations.ts` 第 11-29 行

```typescript
const openaiClient = createOpenAI({
  fetch: async (url, options) => {
    // 创建带超时的 fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 360000); // 6 分钟超时
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  },
});
```

### 3.2 代码清理逻辑

#### UI代码清理
```typescript
generatedCode = generatedCode
  .replace(/^```(?:tsx|jsx|typescript|javascript)?\n?/gm, '')
  .replace(/\n?```$/gm, '')
  .trim();
```

#### PRD Markdown清理
```typescript
markdown = markdown
  .replace(/^```(?:markdown)?\n?/gm, '')
  .replace(/\n?```$/gm, '')
  .trim();
```

### 3.3 验证逻辑

#### UI代码验证
- 长度检查：至少 50 字符
- 结构检查：必须包含 `function`、`const` 或 `=>` 之一

#### PRD文档验证
- 长度检查：至少 20 字符

---

## 四、调用链

### 4.1 UI生成的调用链
1. `CommandBar.tsx` 的 `handleSubmit` 函数
2. 调用 `executeUI`（即 `generateUIFromImage` server action）
3. 生成 UI 代码后，更新节点状态

### 4.2 PRD生成的调用链
1. `NodeDetailPanel.tsx` 或其他组件
2. 调用 `executePRD`（即 `generateAnalysisFromCode` server action）
3. 生成 PRD Markdown 后，更新节点的需求文档

---

## 五、行业特定配置

### 5.1 UI生成中的行业特定设计风格

根据 `projectMeta.industry` 动态调整设计风格：

- **金融/医疗**：严谨、正式的设计风格，注重数据准确性和安全性
- **游戏/社交**：生动、富有创意的设计风格，注重用户体验和视觉吸引力
- **物流/企业**：专业、高效的设计风格，注重信息清晰度和操作效率
- **其他**：清晰、专业、用户友好的设计风格

### 5.2 PRD生成中的行业特定术语

（目前主要在 `reverseGenerateSpec` 中使用，`generateAnalysisFromCode` 中暂未使用）

- **游戏**：Inventory/库存、Buff/增益、Quest/任务等
- **物流**：Waybill/运单、Dispatch/调度、Tracking/追踪等
- **金融**：Account/账户、Transaction/交易、Balance/余额等（注意2FA）
- **医疗**：Patient/患者、Record/病历、Prescription/处方等
- **电商**：Product/商品、Cart/购物车、Order/订单等

---

## 六、注意事项

1. **图片格式**：支持完整的 data URL 或纯 base64 字符串
2. **超时处理**：UI生成和PRD生成都设置了6分钟超时，3次重试
3. **错误处理**：所有API调用都有完善的错误处理和日志记录
4. **代码验证**：生成后会对代码进行清理和验证
5. **增量更新**：PRD生成支持在现有需求基础上增量更新
6. **功能ID规则**：根据页面标题自动生成功能ID前缀，便于追踪




