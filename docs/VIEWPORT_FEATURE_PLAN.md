# 视口功能（移动/平板/桌面）— 专家评估与执行计划

## 一、专家评估结论

### 1.1 问题定义
用户选择「桌面(PC)」后，期望生成并预览桌面端布局（宽屏、多列/侧边栏），实际仍出现：  
- 生成代码为移动端根布局（max-w-md、375px 等）；  
- 预览区内画布被限制为移动端尺寸，与当前选择的视口不一致。

### 1.2 根因归纳
| 层级 | 根因 | 说明 |
|------|------|------|
| 预览 | LivePreview 按**代码特征**强制 375px 容器 | 检测到 `max-w-md`、`w-[375px]` 等即设 `isMobile=true`，用 375×812 包裹内容，覆盖父级已按 viewport 设置的 1280/768 尺寸。 |
| 数据流 | 提交时 viewport 可能未与 UI 选择一致 | 已通过 ref + store 双读兜底，需保持。 |
| 生成 | 模型有时忽略 prompt 输出移动布局 | 已做 prompt 强化 + 服务端桌面后处理，需保持并统一。 |

### 1.3 设计原则
- **单一数据源**：视口以 store 的 `viewportPreset` 为准；预览尺寸、生成入参、后处理均据此派生。  
- **预览与选择一致**：用户选「桌面」则预览区画布为 1280px 宽，选「移动」则为 375px；**不得**由生成代码内容反推画布尺寸。  
- **生成链路闭环**：输入 viewport → 服务端规范化 → 写 prompt → 模型生成 → 桌面时后处理 → 返回 viewportUsed。

---

## 二、执行计划

### Phase 1：预览画布与视口一致（消除 LivePreview 反推）
- **1.1** LivePreview 增加可选 `viewportPreset` 入参；当为 `desktop` 或 `tablet` 时，**禁止**使用 `isMobile` 触发的 375px 包裹，仅用 `w-full h-full`，由父级决定尺寸。  
- **1.2** MobileDevicePreview 将 `viewportPreset` 传入 LivePreview。  
- **1.3** 保留：移动端或未传 viewport 时，仍可按现有逻辑使用 375 设备框（仅当 viewportPreset === 'mobile' 且需要设备框时）。

### Phase 2：生成链路全路径强制 viewport
- **2.1** 保持 node-operations 中：input 规范化、system/user 按 viewport 分支、桌面后缀、桌面后处理、viewportUsed 回写。  
- **2.2** 保持 CommandBar 两处：提交前用 viewportSubmitRef ?? store 读 viewport，并传给 executeUIText。  
- **2.3** 不新增可选路径；任何 UI 生成入口均带 viewport。

### Phase 3：文档与自检
- **3.1** 本文档作为视口功能说明与实现记录。  
- **3.2** 保留 `npm run viewport:read` 与 `scripts/viewport-debug-last.json` 便于排查。

---

## 三、验收标准
- 用户选择「桌面」后，预览区画布为宽屏（1280×800 逻辑尺寸），不再出现内部 375px 窄画布。  
- 用户选择「桌面」并生成 UI 后，生成代码根布局为桌面（max-w-7xl 或等效），且 Toast 显示「服务端已按桌面视口」。  
- 选择「移动」时行为与现有一致；选择「平板」时预览与生成均为 768 逻辑宽度。

---

## 四、实施记录

### 4.1 计划与 Phase 1（预览画布）
- 计划撰写：`docs/VIEWPORT_FEATURE_PLAN.md`。  
- **LivePreview**：新增 `viewportPreset` 入参；`useMobileFrame` 仅在 `viewportPreset === 'mobile'` 时根据代码特征为 true；正常模式中层容器在 desktop/tablet 时用 `w-full min-h-full rounded-xl`，移动端保留 375px 设备框。  
- **MobileDevicePreview**：将 `viewportPreset` 传入 `LivePreview`。

### 4.2 Phase 2（生成链路）
- 已存在：`node-operations` 入参规范化、system/user 按 viewport 分支、桌面 CRITICAL 后缀、桌面后处理（max-w-md→max-w-7xl 等）、`viewportUsed` 与 `viewport-debug-last.json` 回写。  
- 已存在：CommandBar 两处 `viewportSubmitRef ?? store`、NodeDetailPanel 的 ref 与按钮同步。

### 4.3 Phase 3（文档与自检）
- 本文档即视口功能说明；保留 `npm run viewport:read`、`scripts/viewport-debug-last.json`。

### 4.4 自检步骤
1. 打开节点详情，在预览区上方点选「桌面」。  
2. 确认预览画布为宽屏（无内嵌 375px 窄条）。  
3. 输入「生成UI」并发送；确认 Toast 为「正在按【桌面】视口生成…」与「服务端已按桌面视口」。  
4. 可选：运行 `npm run viewport:read` 查看最近一次服务端收到的 viewport。
