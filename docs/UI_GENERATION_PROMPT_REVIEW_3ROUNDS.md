# UI 生成提示词验证讨论（3 轮）

**参与角色**  
- **最强大脑**：逻辑与一致性审查，挑错与边界情况  
- **奥特曼**：产品目标与可执行性验证，确认提示词合理正确  

**范围**：`buildUIGenerationSystemPrompt`、`buildUIGenerationUserPrompt`、风格注入（themeConfig/stylePreset）、`UI_UX_PRO_MAX_GUIDANCE`、编辑模式提示词。

---

## 第一轮：结构与优先级

**最强大脑**：  
当前 system 的组装顺序是：基础系统提示 →（若 glass）玻璃拟态替换 Design Philosophy → 否则 themeConfig + stylePreset 片段 → `UI_UX_PRO_MAX_GUIDANCE`。  
基础里的 Design Philosophy 第 4 条写的是「克制用色、中性色为主」，而用户选了赛博朋克/玻璃拟态时，后面会追加完全不同的用色要求。两处没有明确谁优先，模型可能以先看到的「克制用色」为主，导致风格预设被弱化。

**奥特曼**：  
同意。风格预设和主题是用户显式选择，应优先于通用设计理念。建议在 Design Philosophy 末尾加一句：「若下方出现 [xxx 风格 - 必须严格遵循] 或 [DESIGN SYSTEM ENFORCEMENT]，则**以该段为准**，覆盖本条中的默认用色与背景要求。」这样既保留默认行为，又明确优先级。

**结论**：在基础系统提示中增加「风格/主题优先于默认设计理念」的说明。

---

## 第二轮：组件与图标约束一致性

**最强大脑**：  
基础提示里写「星级/评分请用内联 SVG 或 Emoji 实现」，而 `UI_UX_PRO_MAX_GUIDANCE` 里写「禁止用 Emoji 充当图标」。两处对 Emoji 的定位不一致：一个允许评分用 Emoji，一个禁止 Emoji 当图标。若模型严格遵循后者，可能连评分星都用 SVG，导致实现成本变高；若遵循前者，又可能把 Emoji 当通用图标用。

**奥特曼**：  
UX Pro 的意图是：不要把 Emoji 当作**功能性图标**（如搜索、设置、返回），避免不专业和可访问性问题。评分、占位、装饰性符号用 Emoji 是可接受的。建议把基础提示里的表述改成：「星级/评分可用内联 SVG 或 Emoji 表示（仅限装饰/评分等非功能性图标）。」并与 UX Pro 的「禁止用 Emoji **充当图标**」对齐，在 UX Pro 中可加半句：「装饰性元素（如评分星、占位）可用 Emoji。」

**结论**：统一为「功能性图标不用 Emoji，装饰/评分可用 Emoji」；两处提示词做小改以一致。

---

## 第三轮：页面类型兜底与用户提示

**最强大脑**：  
`getPageRequirement` 里用「列表|管理|数据|仪表盘|首页|概览|统计」等 pattern 兜底列表页/概览页；「新闻列表」会命中「列表」得到「至少 3 条 ListItem 或 2 个 StatCard」。  
但「新闻」类没有单独条目，若后续要区分「新闻卡片+摘要+时间」和普通列表，当前会混在一起。另外，user 提示里若 `pageDescription` 为空，只靠节点名 + 这条通用 requirement，信息偏少，生成结果容易泛化。

**奥特曼**：  
当前设计是：有 spec/userStories 时用 `getNodePageDescription` 填 `pageDescription`，没有时才用节点名 + `getPageRequirement`。产品上可以接受「新闻列表」走通用列表要求；若希望更贴新闻场景，可在 `PAGE_TYPE_REQUIREMENTS` 里加一条「新闻|资讯」的 pattern，要求带标题、摘要、时间、来源等。  
用户提示末尾已加「【重要】当前选中的 UI 风格必须严格体现：…」，对风格遵守有帮助；无需再改 user 结构，除非发现某类页面长期缺信息。

**结论**：  
- 可选优化：为「新闻|资讯」增加一条 `PAGE_TYPE_REQUIREMENTS`，便于新闻/资讯类页面更贴场景。  
- 保持现有 user 提示结构；风格强调已足够。

---

## 修改清单（按讨论结论落地）

1. **基础系统提示**（`ui-generation-prompt.ts`）  
   - 在 Design Philosophy 末尾增加：风格/主题约束优先于本条默认用色与背景。  
   - 将「星级/评分请用内联 SVG 或 Emoji 实现」改为「星级/评分可用内联 SVG 或 Emoji 表示（仅限装饰/评分等非功能性图标）」。

2. **UI_UX_PRO_MAX_GUIDANCE**（`ui-ux-pro-max-guidance.ts`）  
   - 图标条款中补充：装饰性元素（如评分星、占位）可用 Emoji，与基础提示一致。

3. **PAGE_TYPE_REQUIREMENTS**（`ui-generation-prompt.ts`）  
   - 新增「新闻|资讯」类 pattern，要求包含标题、摘要、时间等，使新闻列表/资讯页生成更贴场景。

以上修改保证：提示词优先级清晰、图标与 Emoji 规则一致、新闻类页面有更明确需求描述。
