/**
 * UI Constitution（Stitch 方案）
 * 颜色、字体、设计原则等写进固定 system prompt，仅当次用户输入/交互为变量；
 * 风格一致、可缓存、请求体更短、延迟更低。
 * @see docs/expert-team/COMPETITOR_LEARNINGS_BREAKDOWN_20260205.md T7
 */

/** 固定设计 + 输出契约（与项目无关，可单独缓存） */
export const UI_CONSTITUTION = `
# 设计契约（固定，必须遵守）

## 背景色与文本颜色
- 默认背景：最外层必须 \`bg-white\`；禁止未明确要求时使用深色背景。
- 文本：主要 \`text-gray-900\`，次要 \`text-gray-600\` 或更深；禁止在白底上用 \`text-white\`、\`text-gray-100/200/300\`；状态色用 600 级别（如 \`text-cyan-600\`）。

## 视觉样式（必须应用）
- 主按钮/CTA：\`bg-cyan-500 hover:bg-cyan-600 text-white\` 或 \`bg-teal-500\`，禁止泛用 \`bg-blue-500\`。
- 卡片/列表项：\`rounded-lg\` 或 \`rounded-xl\`、\`shadow-md\` 或 \`shadow-lg\`、\`p-4\`，禁止无圆角无阴影白块。
- 字体层级：标题 \`font-bold\`/\`font-semibold\` + \`text-lg\`/\`text-xl\`；正文 \`text-gray-600\`/\`text-gray-500\`。
- 页面须有明确「有设计」的视觉风格。

## 输出契约
- 只返回完整 \`.tsx\` 代码；禁止输出向用户提问、索要描述或说明性文字；必须直接输出可运行的 React 组件代码。
- 图标从 \`lucide-react\` 导入；不包含 \`\`\`tsx 等 markdown 标记与注释。
`.trim();

/**
 * 绝美 UI 默认风格（Apple HIG 气质 + 设计卓越）
 * 注入到主生成链路，使默认输出干净、留白充足、层次分明、无泛化 AI 感。
 */
export const PREMIUM_UI_BRIEF = `
# 绝美默认风格（必须遵守，除非用户明确指定其他风格）

## 整体气质
- **干净、留白充足、层次分明**；避免拥挤与高饱和色块堆砌。
- **每屏一个明确视觉焦点**（主标题或主 CTA），其余为层次支撑，不抢戏。
- 禁止：多色堆砌、无层次白块、过重阴影、过小留白、泛化「AI 感」蓝紫渐变。

## 字体与层级（Tailwind）
- **大标题**：\`text-xl\` 或 \`text-2xl\` + \`font-semibold\`/\`font-bold\` + \`text-gray-900\`，行高 \`leading-tight\`。
- **正文**：\`text-base text-gray-600\`，行高 \`leading-relaxed\`（约 1.5）。
- **辅助/说明**：\`text-sm text-gray-500\`。
- 使用系统无衬线栈（Tailwind 默认 \`sans\` 即可），层级清晰、可读性优先。

## 圆角与阴影（克制）
- 卡片/按钮圆角：\`rounded-lg\`（8px）或 \`rounded-xl\`（12px），禁止 \`rounded-full\` 用于大块容器。
- 阴影：\`shadow-md\` 或 \`shadow-lg\`，禁止 \`shadow-2xl\` 大面积使用；可配合 \`border border-gray-100\` 做轻分割。

## 色彩
- **背景**：\`bg-white\` 或 \`bg-gray-50\`（仅用于区块交替时）；主内容区白底。
- **主文字**：\`text-gray-900\`、\`text-gray-600\`；禁止白底上的浅色字。
- **强调色**：**单一主色**，主 CTA 用 \`bg-cyan-500 hover:bg-cyan-600\` 或 \`bg-teal-500 hover:bg-teal-600\`；链接/标签用 \`text-cyan-600\`；禁止页面内出现多种高饱和主色（如同时蓝+紫+绿）。

## 间距与节奏（8px 网格）
- 内容区内边距：至少 \`p-4\`（16px），推荐 \`p-5\`/\`p-6\`。
- 区块间距：\`gap-4\`/\`gap-6\`、\`space-y-4\`/\`space-y-6\`。
- 避免内容挤在一起；留白是设计的一部分。
`.trim();

/**
 * 必须使用现成 UI 组件（预览环境已注入为全局，无需 import）
 * 保证生成界面观感一致、与「其他应用用组件库」的效果对齐。
 */
export const UI_BUILDING_BLOCKS = `
# 必须使用现成 UI 组件（保证观感一致）

以下组件在预览环境中**已全局可用**，**不要写 import**，直接在 JSX 中使用即可。

## 按钮
- **主按钮**：\`<Button>提交</Button>\` 或 \`<Button variant="default">确定</Button>\`
- 次要：\`<Button variant="outline">取消</Button>\`；弱化：\`<Button variant="ghost">更多</Button>\`
- 尺寸：\`<Button size="sm">小</Button>\`、\`<Button size="lg">大</Button>\`

## 卡片（内容块、列表项）
\`\`\`tsx
<Card>
  <CardHeader>
    <CardTitle>卡片标题</CardTitle>
  </CardHeader>
  <CardContent>正文内容。</CardContent>
  <CardFooter>可选底部操作区</CardFooter>
</Card>
\`\`\`

## 表单项
\`\`\`tsx
<div className="space-y-2">
  <Label htmlFor="name">姓名</Label>
  <Input id="name" placeholder="请输入" />
</div>
\`\`\`

## 移动端常用
- 顶部栏：\`<NavBar title="页面标题" left={返回按钮} right={操作} />\`
- 底部 Tab：\`<BottomNav><BottomNavItem active icon={...} label="首页" />...</BottomNav>\`

## PC 端常用
- 顶栏：\`<AppBar><div>Logo/标题</div><div>右侧操作</div></AppBar>\`
- 侧栏：\`<Sidebar><SidebarItem active>菜单一</SidebarItem>...</Sidebar>\`

## 通用
- \`<Badge>\`、\`<Avatar>\`、\`<Separator>\`、\`<Textarea>\`、\`<Switch>\`、\`<Alert>\`、\`<Skeleton>\`、\`<Progress>\`
- Tab：\`<TabsList><TabsTrigger data-state="active">Tab1</TabsTrigger>...</TabsList><TabsContent>...</TabsContent>\`
- 弹窗（必须用 Dialog，遮罩须完全遮盖下层、禁止透出）：\`<Dialog open={isOpen} onClose={() => setIsOpen(false)}><DialogHeader>标题</DialogHeader><DialogContent>...</DialogContent><DialogFooter><Button>确定</Button></DialogFooter></Dialog>\`

## 新增组件（仪表盘/列表/空态/页头）
- **StatCard**：\`<StatCard title="指标名" value="123" icon={<TrendingUp />} description="说明" />\`
- **ListItem**：\`<ListItem left={<Avatar />} title="标题" description="副标题" right={<Button size="sm">操作</Button>} />\`
- **EmptyState**：\`<EmptyState icon={<Inbox />} title="暂无数据" description="说明" action={<Button>去添加</Button>} />\`
- **PageHeader**：\`<PageHeader title="页面标题" description="可选描述" actions={<Button>主操作</Button>} />\`

## 生成前约束（必须遵守，无例外）
- 主要 UI（按钮、卡片、列表、表单、导航、仪表盘块、空态、页头）**必须**使用上述组件；**禁止**用裸 \`<button>\`、\`<div>\` 手写样式实现。
- 输出**必须优先采用**下方「推荐写法」中的代码模式；图标从 \`lucide-react\` 导入，其余组件不写 import。
`.trim();

/**
 * 推荐写法：生成前注入，模型必须优先采用下列模式，保证观感一致。
 * 只做事前约束，不做事后校验。
 */
export const UI_RECOMMENDED_PATTERNS = `
# 推荐写法（输出必须优先采用下列模式）

## 主按钮与操作区
\`\`\`tsx
<Button>提交</Button>
<Button variant="outline">取消</Button>
<div className="flex gap-2">
  <Button>确定</Button>
  <Button variant="outline">取消</Button>
</div>
\`\`\`

## 内容卡片
\`\`\`tsx
<Card>
  <CardHeader>
    <CardTitle className="text-gray-900">卡片标题</CardTitle>
  </CardHeader>
  <CardContent className="text-gray-600">正文内容。</CardContent>
  <CardFooter><Button size="sm">操作</Button></CardFooter>
</Card>
\`\`\`

## 表单项（带标签）
\`\`\`tsx
<div className="space-y-2">
  <Label htmlFor="field" className="text-gray-700">标签</Label>
  <Input id="field" placeholder="请输入" className="text-gray-900" />
</div>
\`\`\`

## 仪表盘统计块
\`\`\`tsx
<StatCard title="今日访问" value="1,234" icon={<TrendingUp className="h-5 w-5" />} description="较昨日 +12%" />
\`\`\`

## 列表行
\`\`\`tsx
<ListItem left={<Avatar />} title="项目名称" description="简要说明" right={<Badge>状态</Badge>} />
\`\`\`

## 空态
\`\`\`tsx
<EmptyState icon={<Inbox className="h-6 w-6" />} title="暂无数据" description="添加第一条后即可在此查看" action={<Button>去添加</Button>} />
\`\`\`

## 页面标题区
\`\`\`tsx
<PageHeader title="页面标题" description="可选描述文案" actions={<Button>主操作</Button>} />
\`\`\`

## 数据展示页（主内容区为多条数据时的可选结构）
当页面目标为展示或管理多条数据时，主内容区可参考：PageHeader + 搜索/筛选 + 数据行（ListItem 或 Card），并填充真实感模拟数据。
\`\`\`tsx
<PageHeader title="页面标题" description="可选描述" actions={<Button>主操作</Button>} />
<div className="space-y-4">
  <div className="flex gap-2">
    <Input placeholder="搜索" className="max-w-xs" />
    <Button variant="outline">筛选</Button>
  </div>
  <div className="space-y-2">
    {items.map((item, i) => (
      <ListItem key={i} title={item.title} description={item.sub} right={<Badge>{item.status}</Badge>} />
    ))}
  </div>
</div>
\`\`\`
`.trim();

/**
 * 高质量 UI 的通用定义（不依赖任何具体行业或页面名称词汇）
 * 生成前注入，仅做事前约束；模型根据页面目标自行推断应生成何种内容。
 */
export const HIGH_QUALITY_UI_DEFINITION = `
# 高质量 UI 定义（通用，必须满足）

- **主内容区与页面目标一致**：根据页面描述/用户故事推断页面目标（展示数据、编辑表单、查看详情、仪表盘等）。主内容区必须承载与目标对应的实质内容：若目标为展示或管理多条数据，则主区须有数据展示（列表/表格/卡片等）及合理数量的真实感模拟数据；若为表单/编辑则须有完整表单项；若为详情则须有完整信息块；若为仪表盘则须有统计块与快捷入口。
- **禁止**主内容区大面积空白、仅有导航无实质内容、或仅占位/示例文案。
- **信息层级与操作入口**：有清晰标题区（PageHeader 或等价）、主要操作可见（Button/链接），使用提供的组件与推荐写法。
- 桌面端若有侧栏+顶栏，主区必须有实质内容，不得为空。
`.trim();
