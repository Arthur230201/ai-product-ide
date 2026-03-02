# UI 生成流程调试指南

## 问题诊断

### 问题1: 终端看不到 callAi 日志

**可能原因**：
1. 日志输出到浏览器控制台而不是终端
2. Server Action 没有正确执行
3. 请求被队列阻塞

**检查步骤**：
1. 查看浏览器控制台（F12）是否有日志
2. 查看终端是否有 `[LLM Gateway]` 日志
3. 检查 `callText` 函数是否被调用

**修复**：
- ✅ 已在 `ui-pipeline.ts` 中添加详细日志
- ✅ 已在 `llm.ts` 中确保日志输出

### 问题2: 看到UI返回但页面没有显示

**可能原因**：
1. 节点更新失败
2. UI组件没有响应节点更新
3. `htmlSource` prop 没有更新

**检查步骤**：
1. 查看控制台是否有 `[canvas-store] 节点更新完成` 日志
2. 检查 `NodeDetailPanel` 中的 `data.artifacts.view.code` 是否有值
3. 检查 `HtmlFirstPreview` 的 `htmlSource` prop 是否更新

**修复**：
- ✅ 已修复 `HtmlFirstPreview` 使用 `htmlSource` prop 而不是 ref
- ✅ 已添加 `key` 属性强制重新渲染
- ✅ 已在 `canvas-store.ts` 中添加更新验证日志

## 完整流程验证

### 1. 检查日志输出位置

**浏览器控制台应该看到**：
```
[时间戳] 🚀 [CommandBar] handleSubmit 开始处理请求
[时间戳] 🎨 [CommandBar] 检测到用户要求生成UI，使用 generateStaticUIFromText
[时间戳] 🚀 [CommandBar] 准备调用 executeStaticUI
[时间戳] 📥 [CommandBar] executeStaticUI 返回结果
[时间戳] 📦 [CommandBar] 解析数组格式返回
[时间戳] ✅ [CommandBar] 解析后的响应
[时间戳] 💾 [CommandBar] 开始更新节点数据
[时间戳] ✅ [CommandBar] updateNodeData 调用完成
```

**终端应该看到**：
```
[时间戳] 🚀 [generateStaticUIFromText] 开始生成静态 HTML
[时间戳] 📞 [generateStaticUIFromText] 准备调用 callText
[时间戳] 🚀 [LLM Gateway] Starting LLM call
[时间戳] ✅ [LLM Gateway] LLM call completed
[时间戳] 📥 [generateStaticUIFromText] callText 返回结果
[时间戳] ✅ [generateStaticUIFromText] 静态 HTML 生成完成
```

**Store 更新日志（终端）**：
```
🔍 [canvas-store] updateNodeData view merge: {...}
✅ [canvas-store] 节点更新完成: {...}
```

### 2. 验证节点更新

**检查点**：
1. `updateNodeData` 被调用
2. Store 中的节点数据被更新
3. `NodeDetailPanel` 中的 `data` 响应更新
4. `HtmlFirstPreview` 的 `htmlSource` prop 更新
5. iframe 重新渲染

### 3. 常见问题排查

**问题：返回格式错误**
- 症状：`isArray: true, hasOk: false`
- 原因：`executeStaticUI` 返回 `[data, error]` 数组格式
- 修复：✅ 已添加数组格式解析

**问题：节点更新但UI不刷新**
- 症状：控制台显示更新成功，但页面没有变化
- 原因：`HtmlFirstPreview` 使用 ref 而不是 prop
- 修复：✅ 已改为使用 `htmlSource` prop 和 `key` 属性

**问题：没有日志输出**
- 症状：终端和控制台都没有日志
- 原因：请求没有到达 Server Action
- 检查：验证 `executeStaticUI` 是否被调用

## 手动测试步骤

1. **打开浏览器控制台和终端**
2. **选中一个节点**
3. **在 CommandBar 输入"生成UI"**
4. **点击发送**
5. **观察日志输出**：
   - 浏览器控制台应该有 CommandBar 日志
   - 终端应该有 Server Action 和 Store 日志
6. **验证结果**：
   - 按钮应该禁用
   - 进度条应该显示
   - 节点更新后，右侧预览应该显示新HTML

## 如果仍然有问题

1. **检查环境变量**：确保 `OPENAI_API_KEY` 已配置
2. **检查网络**：确保能访问 OpenAI API
3. **查看完整日志**：检查所有日志输出，找出断点
4. **验证数据流**：从 Server Action → Store → Component → UI


