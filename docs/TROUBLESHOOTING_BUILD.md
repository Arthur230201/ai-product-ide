# 构建问题（Next / Node）

## `localstorage-file was provided without a valid path`

- **已做**：根路由 `/` 使用 `export const dynamic = 'force-dynamic'`（见 `app/page.tsx`），避免对画布页做静态预渲染。
- **已做**：`npm run build` 经 `scripts/next-build.cjs` 净化环境变量里无效的 `--localstorage-file`。
- **若仍出现**：优先使用 **Node 20 LTS**；或检查本机 `NODE_OPTIONS` 是否含孤立 `--localstorage-file`。

## 项目 JSON v3（当前）

保存的画布文件为 **`canvasExportVersion: 3`**，另含 `projectMeta`、`globalRules`、`stylePreset`、`viewportPreset`、`aiConfig`、`currentTheme` 与设计系统字段。**v2**（仅设计系统扩展）或 **仅 nodes/edges** 仍可导入：后者不覆盖画像/主题等；v3 导入会按文件恢复全套状态。
