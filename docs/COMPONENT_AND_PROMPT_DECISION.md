# 组件库数量与 UI 质量平衡：三轮讨论与执行方案

> 目标：在「一定数量、合理的组件库」前提下，让移动端/PC 端快速生成**顶级 UI**；结合 200 家设计体系调研的归纳，明确**需要哪些组件**、**如何加工用户基本信息与提示词**，最终产出高质量 UI。

---

## 第一轮讨论：组件库范围与数量

### 问题

- 组件太少：模型容易用裸 `div`/`button` 手写样式，导致风格不一、难以达到「顶级」观感。
- 组件太多：模型选择困难、提示词过长、维护成本高，且易与「泛化」目标冲突（不希望为每种页面类型堆砌专用组件）。

### 从 200 家调研归纳的共性

- **导航**：顶栏/底栏/侧栏是标配；多数体系提供 AppBar、BottomNav、Sidebar 或等价物。
- **内容容器**：Card、列表行（ListItem 或 Table 行）几乎全覆盖；数据展示页 = 标题区 + 筛选/搜索 + 列表或表格。
- **表单与输入**：Input、Label、Button、Select/下拉、Switch、Textarea 为通用基础。
- **反馈与状态**：Alert、Badge、Skeleton、Progress、EmptyState 普遍存在。
- **数据/仪表盘**：统计块（StatCard 或 KPI 卡）、PageHeader（标题+描述+主操作）为高频模式。
- **一致性铁律**：Yelp「无特例」、Salesforce「同一问题同一方案」、USWDS「Promote Continuity」——都强调**用同一套组件覆盖场景**，而非按页面类型无限扩展组件。

### 结论（第一轮）

- **当前组件集已覆盖「顶级 UI」所需的大部分能力**：Button、Card、Input、Label、Badge、Avatar、Separator、Textarea、Switch、Alert、Skeleton、Progress、Tabs、NavBar、BottomNav、AppBar、Sidebar、StatCard、ListItem、EmptyState、PageHeader。
- **数量建议**：**不扩大组件库**。理由：(1) 上述 22 个导出已能表达列表、表单、详情、仪表盘、空态、页头；(2) 数据密集表格式页面可用「Card + 多行 ListItem」或「推荐写法」中的列表模式表达，无需单独引入 DataTable（避免组件膨胀与模型选择噪音）；(3) 质量提升应来自**提示词加工与约束**，而非更多组件。
- **可选保留项**：若后续真实生成中反复出现「表格化数据」且 ListItem 无法满足，可单独增加一个最小 **Table**（表头+表体行，样式与 ListItem 对齐）；本轮**暂不新增**，以执行提示词加工为主。

---

## 第二轮讨论：用户基本信息如何加工为高质量提示词

### 输入与现状

- **用户给出的基本信息**：节点名称（nodeLabel）、节点描述（baseDesc）、用户补充（rawUserInput）、视口（移动/桌面）。
- **现状**：`processIntentForGenerateUI` 仅做拼接（如「【节点名】本页说明：… 用户补充：…」），生成侧依赖 system prompt 中的 HIGH_QUALITY_UI_DEFINITION + DESIGN_PHILOSOPHY + UI_BUILDING_BLOCKS；user prompt 中除视口与通用要求外，**没有**把 200 家归纳的「设计意图」显式注入到当页上下文中。

### 问题

- 模型在长 system prompt 下容易忽略部分约束；若在 **user prompt** 中针对「当前页」再次强调设计意图与页面目标，更易被遵守。
- 用户常只给简短描述（如「商品管理页」），若不加工，模型可能产出空白主区或占位文案；需在加工阶段**推断页面目标**并写入一句可执行约束。

### 从 200 家调研归纳的「加工素材」

- **设计意图（通用）**：内容优先、主区有实质、清晰层级、一致组件、留白与节奏、克制用色（不依赖行业词）。
- **页面目标推断**：从 nodeLabel + baseDesc 可推断为「数据展示/列表」「表单/编辑」「详情」「仪表盘/概览」等；对应一句约束即可，如「主内容区须为列表/表格+合理数量模拟数据」。

### 结论（第二轮）

- **新增「提示词加工层」**：在生成 UI 时，在既有 user prompt 之前或之后，**追加 2–3 句**由 200 家归纳得出的设计意图 + **1 句**可选的页面目标约束（由 nodeLabel/baseDesc 推断）。
- **加工原则**：  
  - 全部使用**通用表述**，不出现「商品」「管理」等领域词；  
  - 设计意图句从 DESIGN_PHILOSOPHY 与 HIGH_QUALITY_UI_DEFINITION 中抽取，压缩为短句；  
  - 页面目标句仅当能推断时添加，且用「主内容区须…」形式，避免长文。
- **落点**：在 `node-operations.ts` 构建 `userPrompt` 时调用一个 **enrichUserPromptWithDesignIntent**（可放在 `intent-processor.ts` 或新建 `prompt-enricher.ts`），输入为 (enrichedUserPrompt, { nodeLabel, baseDesc })，输出为追加了设计意图与可选页面目标后的最终 user prompt。

---

## 第三轮讨论：收敛与执行计划

### 共识

1. **组件库**：维持当前 22 个导出，不新增组件；若后续数据证明需要 Table，再单独加一个最小 Table。
2. **提示词加工**：新增「设计意图 + 页面目标」加工层，在 user prompt 中显式追加，与 system 中的 DESIGN_PHILOSOPHY / HIGH_QUALITY_UI_DEFINITION 形成呼应，提高「主区有实质、用统一组件」的遵守率。
3. **不做过拟合**：加工层不根据「管理」「商品」「列表」等词分支，仅做「页面目标」的泛化推断（数据展示 / 表单 / 详情 / 仪表盘）并对应一句约束。

### 执行项

| 序号 | 项 | 说明 |
|------|----|------|
| 1 | 新增 `enrichUserPromptWithDesignIntent` | 输入：已有 userPrompt、nodeLabel、baseDesc。输出：userPrompt + 设计意图块（2–3 句）+ 可选页面目标句（1 句）。 |
| 2 | 设计意图块文案 | 从 DESIGN_PHILOSOPHY / HIGH_QUALITY_UI_DEFINITION 提炼为 2–3 句中文，如：「本页须体现：内容优先、主内容区与页面目标一致、使用提供的组件与推荐写法。禁止主区空白或占位文案。」 |
| 3 | 页面目标推断 | 简单规则：若描述/节点名含「列表」「管理」「数据」「仪表盘」「首页」等泛化关键词，则推断为数据展示或仪表盘，追加「主内容区须含列表或统计块及合理数量模拟数据」；若含「表单」「编辑」「新建」则追加「主内容区须含完整表单项」；若含「详情」则追加「主内容区须含完整信息块」。关键词列表保持短且泛化。 |
| 4 | 接入生成链路 | 在 `generateUIFromText` 中，在构建 `userPrompt` 后、加 viewport 后缀前，调用 enricher，用返回结果作为最终 userPrompt（再拼 viewportSuffix）。 |
| 5 | 文档与原则 | 在 DESIGN_PHILOSOPHY_FROM_LEADING_PRODUCTS 或本文档中注明：高质量 UI 由「固定组件库 + 设计理念 system 块 + 每页设计意图与目标 user 块」共同保证；组件库数量保持当前规模，质量优先通过提示词加工提升。 |

---

## 执行后的预期效果

- **组件侧**：移动端/PC 端仍使用同一套 22 个组件，模型被明确约束「必须使用上述组件」与「优先采用推荐写法」，减少手写 div/button 导致的风格漂移。
- **提示词侧**：用户仅需提供节点名与简短描述；加工层自动追加「设计意图 + 页面目标」短句，使模型在当页上下文中再次收到「主区有实质、用组件、不占位」的指令，与 200 家归纳一致，提高首轮生成即高质量的比例。
- **可迭代**：后续若 200 份报告中某类模式反复出现且当前组件无法表达，再讨论新增 1 个组件（如 Table）；加工层可扩展为「根据页面目标选择更细的推荐结构」而不做领域词分支。

---

## 执行完成说明

- **组件库**：未变更，仍为当前 22 个导出（见 `src/components/preview-ui/index.ts`）。
- **提示词加工**：已实现 `src/lib/prompts/prompt-enricher.ts` 中的 `enrichUserPromptWithDesignIntent`，并在 `generateUIFromText`（`node-operations.ts`）中在构建 user prompt 后、加 viewport 后缀前调用，将「设计意图块」与可选的「页面目标约束」追加到用户提示词末尾。
- **页面目标推断**：依 nodeLabel + baseDesc 的泛化关键词（列表/管理/数据/仪表盘/表单/编辑/详情等）输出一句约束，无领域词分支。
