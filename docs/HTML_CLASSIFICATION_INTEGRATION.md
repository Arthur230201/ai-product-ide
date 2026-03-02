# HTML文件分类功能集成说明

## 功能概述

已成功集成HTML文件分类器到 `CommandBar.tsx`，系统现在可以智能判断HTML文件的用途，并自动选择正确的处理流程。

## 集成内容

### 1. 导入分类器
在 `CommandBar.tsx` 中导入了分类器相关函数：
```typescript
import { classifyHTMLFile, getClassificationDescription, type HTMLFileClassificationContext } from '@/utils/html-file-classifier';
```

### 2. 扩展 FileAttachment 接口
添加了 `rawTextContent` 字段用于存储HTML文件的原始文本内容：
```typescript
interface FileAttachment {
  // ... 其他字段
  rawTextContent?: string; // 原始文本内容（用于HTML文件分类分析）
}
```

### 3. 文件处理逻辑
在 `processSingleFile` 函数中，对于HTML文件，保存原始文本内容到 `rawTextContent` 字段。

### 4. 分类判断逻辑
在 `handleSubmit` 的编辑模式部分，添加了HTML文件检测和分类逻辑：

1. **检测HTML文件**：查找所有类型为 `text` 且文件名以 `.html` 或 `.htm` 结尾的文件
2. **使用分类器判断**：调用 `classifyHTMLFile` 函数，传入：
   - 用户提示词
   - 是否为编辑模式
   - HTML文件内容
   - 文件名
3. **根据分类结果处理**：
   - **`ui-mockup`（UI示意文件）**：
     - 使用 `generateUIFromText` 生成React组件代码
     - 将HTML内容作为参考，包含在提示词中
     - 生成成功后更新节点的 `view.code`
   - **`project-info`（项目信息文件）**：
     - 继续走 `updateNodeArtifacts` 流程
     - 用于处理需求文档、流程图等

## 处理流程

```
用户上传HTML文件
    ↓
processSingleFile: 保存原始文本内容到 rawTextContent
    ↓
handleSubmit (编辑模式)
    ↓
检测HTML文件
    ↓
使用分类器判断用途
    ↓
┌─────────────────┴─────────────────┐
│                                   │
ui-mockup                    project-info
│                                   │
使用 generateUIFromText     使用 updateNodeArtifacts
生成React组件代码            更新需求文档等
```

## 使用示例

### 示例1：编辑模式下上传UI HTML文件
```
场景：用户选中了节点，上传了一个HTML文件，提示词："基于这个HTML生成React组件"

分类结果：ui-mockup
处理方式：使用 generateUIFromText，将HTML内容作为参考生成React组件
```

### 示例2：编辑模式下上传流程图HTML文件
```
场景：用户选中了节点，上传了一个包含mermaid流程图的HTML文件，提示词："这是业务流程的流程图"

分类结果：project-info
处理方式：使用 updateNodeArtifacts，更新节点的需求文档
```

### 示例3：创建模式下上传HTML文件
```
场景：用户未选中节点（创建模式），上传了一个HTML文件

默认分类：project-info（创建模式下默认认为是项目信息）
处理方式：使用 updateNodeArtifacts
```

## 分类器判断逻辑

分类器基于四个维度综合判断（按优先级排序）：

1. **上下文信号**（权重10）：
   - 编辑模式 → 默认UI示意
   - 创建模式 → 默认项目信息

2. **用户意图**（权重5）：
   - UI相关关键词（ui、界面、设计等）→ UI示意
   - 项目信息相关关键词（流程、业务、需求等）→ 项目信息

3. **文件内容分析**（权重3）：
   - 交互元素（button、input、form等）→ UI示意
   - 流程图元素（mermaid、flowchart等）→ 项目信息

4. **文件名分析**（权重2）：
   - UI相关文件名（ui、design、page等）→ UI示意
   - 流程相关文件名（flow、process、diagram等）→ 项目信息

## 技术细节

- HTML文件内容限制：在传递给 `generateUIFromText` 时，HTML内容限制为前10000个字符（避免提示词过长）
- 超时处理：UI生成设置10分钟超时
- 错误处理：包含完整的错误处理和用户提示

## 注意事项

1. 如果用户同时上传了图片和HTML文件，图片的优先级更高，会先处理图片生成UI
2. 分类器的判断基于多维度综合评分，即使某个维度信息缺失，也能通过其他维度判断
3. HTML文件的内容分析基于关键词匹配，对于非常规格式的HTML文件，可能会影响判断准确性

## 后续优化方向

1. 收集用户反馈，优化分类器的关键词和权重
2. 增加对HTML结构的深度分析（DOM解析）
3. 支持用户手动纠正分类结果，并学习用户的偏好



