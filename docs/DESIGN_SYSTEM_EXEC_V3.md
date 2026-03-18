# 执行计划：项目 JSON v3（已完成实现）

## 目标

| 项 | 说明 |
|----|------|
| **版本** | `canvasExportVersion: 3` |
| **新增字段** | `projectMeta`、`globalRules`、`stylePreset`、`viewportPreset`、`aiConfig`、`currentTheme` |
| **加载规则** | 仅当 `canvasExportVersion === 3` 时写入上述字段；v2 / 仅 nodes+edges 行为不变 |
| **安全** | `aiConfig` 仅含模型 id 字符串，不含 API Key |

## 验收

1. 保存 JSON → 含 `canvasExportVersion: 3` 与全部字段。  
2. 另一浏览器/清空 localStorage 后导入 → 项目名、风格、主题、设计系统与保存时一致。  

## 相关代码

- `src/store/canvas-store.ts`：`CanvasProjectFileExport`、`loadProject`、`exportProject`
