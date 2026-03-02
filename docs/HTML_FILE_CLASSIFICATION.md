# HTML文件分类方案

## 设计理念：乔布斯式简洁与智能

> "简单是最终的复杂。" —— 列奥纳多·达·芬奇（乔布斯也经常引用这句话）

### 核心原则

1. **用户无需思考** - 系统自动判断，用户只需上传文件
2. **上下文优先** - 用户当前在做什么，比文件内容更重要
3. **意图优先** - 用户的提示词是用户意图的最直接表达
4. **智能推断** - 综合多个信号，给出最合理的判断

## 问题背景

HTML文件可能有两种用途：
- **UI示意文件** - 用户希望基于HTML生成或优化React组件代码
- **项目信息文件** - 用户希望系统理解业务流程、需求文档、流程图等

## 解决方案：多维度智能推断

系统通过以下四个维度综合判断（按优先级排序）：

### 1. 上下文信号（最高优先级，权重：10）

**用户当前的操作场景，是最强的信号**

- **编辑模式（选中节点）** → 更可能是UI示意
  - 用户正在编辑某个页面节点
  - 上传HTML文件，更可能是希望参考或优化UI
  
- **创建模式（未选中节点）** → 更可能是项目信息
  - 用户正在创建新项目
  - 上传HTML文件，更可能是提供需求文档或流程图

### 2. 用户意图分析（权重：5）

**用户的提示词是用户意图的直接表达**

#### UI示意相关关键词：
- `ui`, `界面`, `页面`, `设计`, `mockup`, `prototype`
- `生成ui`, `生成界面`, `生成页面`
- `基于这个`, `参考这个`
- `改成`, `修改`, `优化`, `美化`, `改进`
- `交互`, `组件`, `样式`, `布局`

#### 项目信息相关关键词：
- `流程`, `业务`, `需求`, `文档`, `说明`
- `process`, `flow`, `requirement`, `spec`
- `分析`, `解析`, `理解`, `了解`
- `架构`, `系统`, `模块`

### 3. 文件内容分析（权重：3）

**分析HTML文件的实际内容特征**

#### UI示意特征：
- 交互元素：`button`, `input`, `form`, `onclick`, `onchange`
- 样式系统：`flex`, `grid`, `tailwind`, `class=`, `className`
- 交互状态：`hover:`, `active:`, `focus:`, `transition`
- UI组件：`nav`, `header`, `footer`, `sidebar`, `menu`, `card`, `modal`

#### 项目信息特征：
- 流程图：`mermaid`, `flowchart`, `diagram`, `graph`
- 业务词汇：`业务`, `流程`, `步骤`, `节点`
- 文档结构：`table`, `thead`, `tbody`, `th`, `td`

### 4. 文件名分析（权重：2，辅助判断）

**文件名往往包含文件用途的线索**

- UI相关：`ui`, `design`, `page`, `mockup`, `prototype`, `component`
- 流程相关：`flow`, `process`, `diagram`, `requirement`, `spec`, `prd`

## 判断逻辑

```typescript
// 计算各维度分数
scores = {
  ui: 0,      // UI示意分数
  info: 0,    // 项目信息分数
}

// 1. 上下文信号（权重10）
if (isEditMode) scores.ui += 10
else scores.info += 10

// 2. 用户意图（权重5）
scores.ui += intentScore * 5
scores.info += infoIntentScore * 5

// 3. 文件内容（权重3）
scores.ui += contentScore * 3
scores.info += infoContentScore * 3

// 4. 文件名（权重2）
scores.ui += filenameScore * 2
scores.info += infoFilenameScore * 2

// 判断结果
if (scores.ui - scores.info > threshold) → 'ui-mockup'
else if (scores.info - scores.ui > threshold) → 'project-info'
else → 使用默认策略（编辑模式→UI示意，创建模式→项目信息）
```

## 使用示例

### 示例1：编辑模式下上传UI HTML
```typescript
const context = {
  userPrompt: "基于这个HTML生成React组件",
  isEditMode: true,  // 用户选中了节点
  htmlContent: "<div class='flex'><button onclick='...'>提交</button></div>",
  fileName: "login-page.html"
};

const purpose = classifyHTMLFile(context);
// 结果：'ui-mockup'
// 原因：编辑模式(10) + UI意图关键词(15) + UI内容特征(9) + UI文件名(4) = 38分
```

### 示例2：创建模式下上传流程图HTML
```typescript
const context = {
  userPrompt: "这是业务流程的流程图，请理解并生成页面",
  isEditMode: false,  // 用户未选中节点，正在创建项目
  htmlContent: "<div class='mermaid'>graph TD...</div>",
  fileName: "business-flow.html"
};

const purpose = classifyHTMLFile(context);
// 结果：'project-info'
// 原因：创建模式(10) + 流程关键词(15) + mermaid特征(9) + flow文件名(4) = 38分
```

### 示例3：边界情况（分数接近）
```typescript
const context = {
  userPrompt: "看看这个文件",
  isEditMode: true,
  htmlContent: "<div>一些内容</div>",
  fileName: "file.html"
};

const purpose = classifyHTMLFile(context);
// 结果：'ui-mockup'（默认策略：编辑模式 → UI示意）
// 原因：分数差异小于阈值，使用上下文默认策略
```

## 优势

1. **用户友好** - 用户无需手动选择文件类型，系统自动判断
2. **准确性高** - 多维度综合分析，减少误判
3. **适应性强** - 即使某个维度信息缺失，也能通过其他维度判断
4. **可扩展** - 可以轻松添加新的判断维度和关键词
5. **符合直觉** - 判断逻辑符合用户的使用习惯

## 后续优化方向

1. **机器学习增强** - 收集用户反馈，训练分类模型
2. **用户反馈循环** - 允许用户纠正分类结果，系统学习改进
3. **更细粒度分析** - 对HTML内容进行更深入的结构分析
4. **上下文记忆** - 记住用户的习惯，提供个性化判断



