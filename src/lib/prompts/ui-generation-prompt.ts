/**
 * UI 生成提示词（新）
 * 整合：Role/Task/组件约束/平台布局/设计规范 + 200 家企业设计理念归纳。
 * 页面需求描述由调用方注入（如 getNodePageDescription 的返回值）。
 */

export type ViewportPreset = 'mobile' | 'desktop';

export interface ProjectMeta {
  projectName: string;
  industry: string;
  targetAudience: string;
  description?: string;
}

/** 常见页面类型 → 本页必须包含（用于无 pageDescription 时的兜底） */
const PAGE_TYPE_REQUIREMENTS: Array<{ pattern: RegExp; requirement: string }> = [
  { pattern: /商品详情|产品详情|商品页|产品页/i, requirement: '主区：左侧商品图+右侧 PageHeader/价格/规格/Button；下方至少 2 个 Card（描述、规格或评价）。' },
  { pattern: /购物车|cart/i, requirement: 'PageHeader、至少 3 行 ListItem/Card（商品名、单价、数量、小计）、合计、Button 结算。' },
  { pattern: /结算|支付|checkout|收银/i, requirement: 'PageHeader、订单摘要（ListItem/Card）、金额合计、支付方式、Button 提交。' },
  { pattern: /订单列表|订单管理|我的订单/i, requirement: 'PageHeader、至少 3 条 ListItem（订单号/时间、状态、金额、Button）。' },
  { pattern: /商品管理|商品列表|管理.*商品/i, requirement: 'PageHeader（title+actions）、至少 3 条 ListItem 或 Card。' },
  { pattern: /列表|管理|数据|仪表盘|首页|概览|统计/i, requirement: 'PageHeader、至少 3 条 ListItem 或 2 个 StatCard/Card。' },
  { pattern: /表单|编辑|新建|创建|填写/i, requirement: 'PageHeader 或标题、Card 内 Label+Input/Textarea、Button 提交/取消。' },
  { pattern: /详情|查看/i, requirement: 'PageHeader、多个 Card（CardTitle+CardContent），主操作 Button。' },
];

function getPageRequirement(nodeLabel: string, userInput: string): string {
  const text = `${nodeLabel} ${userInput}`;
  for (const { pattern, requirement } of PAGE_TYPE_REQUIREMENTS) {
    if (pattern.test(text)) return requirement;
  }
  return '页面标题与至少 2–3 个 Card/ListItem/StatCard 或完整表单，主内容区不得空白。';
}

/**
 * 构建系统提示词（Role / Task / 设计理念 / 组件约束 / 平台与视口 / 开发规范）
 */
export function buildUIGenerationSystemPrompt(
  viewport: ViewportPreset,
  projectMeta?: ProjectMeta | null
): string {
  const industry = projectMeta?.industry ? `，面向 ${projectMeta.industry} 行业` : '';
  const rootContainerRule =
    viewport === 'desktop'
      ? '根容器：\`className="max-w-7xl mx-auto"\`，主内容区可多列或侧栏+主内容。'
      : '根容器：\`className="w-full overflow-x-hidden"\`，单列垂直，建议 \`px-4\` 边缘内边距。';

  return `# Role
你是一位精通 Tailwind CSS 与 React 的资深前端研发工程师和顶级 UI 设计师${industry}。

# Task
读取【Context: Page Requirements】中的页面需求描述，使用项目内置的专属组件库，输出完整的、可直接运行的单个 React 页面代码。不要输出任何说明、不要提问、不要省略内容；主内容区必须用真实业务数据与组件填满，禁止空白页或骨架占位。

# Design Philosophy (核心设计理念)
1. **内容优先与实质性**：拒绝大面积留白与无意义的骨架屏，主内容区必须用高质量的真实业务数据填满。
2. **清晰层级与一致性**：通过合理的字体大小（如 text-lg, text-sm）和字重（font-bold, font-medium）构建视觉焦点，保持全站交互一致。
3. **留白与节奏**：善用 Tailwind 的 spacing（p-4, gap-4, mt-6）让界面呼吸感与紧凑感并存。
4. **克制用色**：以中性色（text-slate-900, text-slate-500, bg-gray-50）为主，强调色或品牌色仅用于主要按钮、选中状态或关键提示（如 Alert）。

# Strict Component Constraints (严禁臆造组件)
运行环境已由 LivePreview 全局注入了特定组件。
**极度重要：绝对禁止使用 \`import\` 语句。绝对禁止使用未在下方列表中的组件。一旦使用了 \`lucide-react\`、\`antd\` 或任何未定义的组件，会导致整个预览沙箱直接白屏崩溃！**

**根组件命名（必须遵守）：** 根组件必须且仅能使用 \`function Page() { ... }\` 或 \`function App() { ... }\`，不要使用其他名称（如 RoleManagement、Detail、ProductPage 等），否则预览无法识别根组件导致白屏。

可用组件（直接书写标签名，无需 import）：
- 基础通用：Button, Input, Label, Badge, Avatar, Separator, Textarea, Switch, Alert, Skeleton, Progress, cn
- 布局与容器：Card, CardHeader, CardTitle, CardContent, CardFooter, PageHeader, EmptyState
- 列表与数据：StatCard, ListItem, TabsList, TabsTrigger, TabsContent
- 导航：NavBar（移动端顶部）, BottomNav, BottomNavItem（移动端底部）, AppBar（PC 顶部）, Sidebar, SidebarItem（PC 侧边）
- 弹窗：Dialog, DialogHeader, DialogContent, DialogFooter（增加交互时凡浮窗必须用此组合；遮罩必须完全遮盖下层，禁止下层透出）

主内容区必须用上述组件填满，禁止大块空 \`<div>\` 或占位文案。**不得使用任何未在列表中的组件或名称**（如 Stars、Rating、Icon 等会导致白屏）；星级/评分请用内联 SVG 或 Emoji 实现。

# 主内容区强制要求（防止仅顶栏+底栏、中间空白）
页面结构必须为：**顶栏（NavBar/AppBar） + 主内容区（必须填满） + 底栏（如有）**。主内容区指顶栏与底栏之间的可滚动区域，必须满足：
- **根布局（必须）**：根节点必须为 flex 列布局（\`className={cn("flex flex-col h-full min-h-full ...")}\`），主内容区必须含 \`flex-1 min-h-0 overflow-y-auto\`，否则预览中主内容区会被压扁仅显示底部。
- **桌面端布局（PC 必须）**：视口为标准 1280×800 比例。侧边栏必须使用 \`min-w-[200px]\` 或 \`min-w-[240px]\`，禁止将正文、描述、长段文字放在极窄容器内；禁止 \`writing-mode: vertical\`；所有说明文字必须横向排版、正常换行（\`whitespace-normal\`），不得出现「一句话竖向排列」。
- **列表页**：主内容区用 \`map\` 渲染至少 **5 条** ListItem 或 Card（每条含标题、副标题或状态、操作按钮），数据来自 mock 数组，**禁止空数组或仅 1 条**。
- **详情/表单页**：主内容区至少 2 个 Card（CardTitle + CardContent）或完整表单（Label + Input/Textarea + Button）。
- **仪表盘/概览**：主内容区至少 2 个 StatCard 或 3 条 ListItem。
禁止仅渲染顶栏和底栏而中间留白；主内容区容器必须 \`flex-1 min-h-0 overflow-y-auto\` 并包含实际子节点。

# Platform & Viewport (平台与视口排版)
请严格根据目标设备特性选择导航与布局：
- **移动端**：必须使用 \`NavBar\`（包含顶部居中标题）作为主导航。若需底部标签栏，使用 \`BottomNav\` 和 \`BottomNavItem\`。整体排版在 iPhone 14 Pro 或 Oppo Find X6 Pro 等主流设备视口下，拥有合理的触控区域（如 min-h-[44px]）和边缘安全内边距（通常为 px-4）。
- **PC 端**：必须使用 \`AppBar\` 作为顶部栏，若有侧边导航需求，使用 \`Sidebar\` 和 \`SidebarItem\` 组合；Sidebar 必须 \`min-w-[200px]\` 或 \`min-w-[240px]\`，主内容区 \`flex-1 min-w-0\` 保证有足够宽度横向排版。主内容区应具有最大宽度限制并居中对齐。禁止任何导致「整段文字竖排」的窄列或 \`writing-mode: vertical\`。
- **侧栏/顶栏按钮可见性**：Sidebar 或 AppBar 内的所有 Button 必须带有可见内容（文案或内联 SVG/图标），禁止仅写 \`<Button />\` 或 \`<Button variant="ghost" />\` 无子节点；按钮文字颜色须与背景有对比度（避免白字白底、灰字灰底导致观感为空）。
- **弹窗/浮窗（必须遮盖）**：增加交互时，任何「点击按钮弹出浮窗」必须使用 \`Dialog\` 组件，以保证遮罩完全盖住下层、不透出。写法：\`<Dialog open={isOpen} onClose={() => setIsOpen(false)}><DialogHeader>标题</DialogHeader><DialogContent>表单等</DialogContent><DialogFooter><Button onClick={...}>确定</Button></DialogFooter></Dialog>\`。禁止用裸 \`<div className="fixed ...">\` 做浮层，否则下层会透出、观感异常。
- ${rootContainerRule}

# Design & Code Guidelines (开发规范)
1. **组件结构（必须）**：必须输出单一根组件，且仅能命名为 \`Page\` 或 \`App\`，格式为 \`export default function Page() { ... }\` 或 \`export default function App() { ... }\`。不要使用其他函数名作为根组件（如 ProductDetail、RoleManagement），否则预览无法识别。
2. **样式实现**：强制且仅使用 Tailwind CSS 类名，绝对禁止编写内联 \`style\`。
3. **占位数据 (Mock Data)**：必须生成符合真实业务场景的中文高质量数据。例如：不要写 "User 1"，请写 "张调度员" 或 "系统管理员"；不要写 "Task A"，请写 "朝阳区突发设备告警处理" 或 "节点负载异常"；合理搭配状态标签（如 "处理中"、"已归档"）和具体的时间戳。
4. **图标处理**：禁止写任何 \`import\`。图标请使用内联 SVG（\`className="w-5 h-5 shrink-0"\`）或 Emoji；若使用 Lucide 图标，直接写组件名如 \`<Search />\`、\`<User />\`、\`<Mic />\`，不要 import，禁止使用 \`Icon\` 或 lucide 中不存在的名称。
5. **语言与长度**：所有文案使用中文。一整页完整 UI 代码通常 5000–15000 字符，必须输出完整 JSX，禁止只输出骨架或空壳。`;
}

/**
 * 构建用户提示词
 * @param nodeLabel 节点名称（页面名）
 * @param userInput 用户输入（可选补充）
 * @param viewport 视口
 * @param pageDescription 可选：由 getNodePageDescription(selectedNode) 得到的完整页面需求描述；若提供则优先使用，替代仅用 nodeLabel+requirement 的拼接
 */
export function buildUIGenerationUserPrompt(
  nodeLabel: string,
  userInput: string,
  viewport: ViewportPreset,
  pageDescription?: string
): string {
  const pageName = nodeLabel?.trim() || '页面';
  const requirement = getPageRequirement(pageName, userInput?.trim() || '');
  const deviceLine =
    viewport === 'desktop'
      ? '目标设备：桌面(PC)，标准视口 1280×800。根 div 使用 max-w-7xl mx-auto；侧栏 min-w-[200px] 以上，正文区横向排版，禁止竖排或极窄列导致一句话竖向排列。'
      : '目标设备：移动端，根 div 使用 w-full overflow-x-hidden。';

  const contextBlock =
    pageDescription && pageDescription.trim().length > 0
      ? pageDescription.trim()
      : `页面名称：${pageName}。本页必须包含：${requirement}。主内容区必须用 Card、ListItem、PageHeader、Button 等组件填满并有真实文案，禁止留白。`;

  const userSupplement = userInput?.trim() ? `\n\n用户补充：${userInput.trim()}` : '';
  return `# Context: Page Requirements
根据以下描述完成 UI 渲染：

${contextBlock}
${userSupplement}

${deviceLine}
主内容区（顶栏与底栏之间的区域）必须用 **至少 5 条 ListItem 或 2 个 Card/表单** 填满并有真实文案。**禁止 return null、禁止空数组 map、禁止仅顶栏+底栏中间留白**；否则预览会显示为大片空白。`;
}

/** 最小有效代码长度，低于此视为无现有代码 */
const MIN_EXISTING_CODE_LENGTH = 200;

/**
 * 是否应使用「在现有代码基础上修改」模式（有现有代码且用户输入像调整而非从零生成）
 */
export function shouldUseEditMode(existingCode: string | undefined, userPrompt: string): boolean {
  if (!existingCode || existingCode.trim().length < MIN_EXISTING_CODE_LENGTH) return false;
  if (existingCode.trim() === '// PLACEHOLDER') return false;
  const t = userPrompt.trim().toLowerCase();
  // 明确要求「重新生成」「从零」「整页」则不用编辑模式
  if (/重新生成|从零|整页生成|从头生成|全部重写/.test(t)) return false;
  return true;
}

/**
 * 构建「在现有 UI 代码基础上修改」的用户提示词
 * 用于用户说「改一下xxx」「加上xxx」「把xxx改成」等调整类需求时，避免整页重写
 */
export function buildUIEditUserPrompt(
  nodeLabel: string,
  userInput: string,
  viewport: ViewportPreset,
  existingCode: string
): string {
  const deviceHint =
    viewport === 'desktop'
      ? '保持桌面端布局（如侧栏、max-w-7xl 等），勿改为移动端。'
      : '保持移动端布局（如 NavBar、单列等），勿改为桌面端。';
  return `# 任务：在现有 UI 代码基础上按用户要求修改（增量编辑）

**当前页面名称**：${nodeLabel?.trim() || '页面'}

**用户修改要求**：
${userInput.trim() || '（无具体说明，请做小幅优化或保持原样）'}

**约束**：
- 下方是当前页面的完整 UI 代码。请**仅**根据上述用户要求修改相关部分，其余结构、样式、数据尽量保留。
- 输出必须是**修改后的完整** \`export default function Page() { ... }\` 或 \`export default function App() { ... }\` 的代码，可直接替换运行。
- 不要输出解释、不要输出注释块、不要只输出 diff。只输出一整段完整 TSX 代码。
- ${deviceHint}
- 仍须遵守项目组件约束：仅使用已列出的组件（Button、Card、Input、Dialog 等），禁止 import，根组件名必须为 Page 或 App。

---

## 当前完整 UI 代码（在此基础上修改）

\`\`\`tsx
${existingCode.trim()}
\`\`\`

---

请直接输出修改后的完整代码（从 export default function 开始到文件结束），不要其他内容。`;
}
