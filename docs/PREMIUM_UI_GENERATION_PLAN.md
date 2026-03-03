# 绝美 UI 生成方案 — 专家评估与执行计划

> 最强大脑联合设计/UX/前端专家，目标：**默认生成一套视觉卓越、可复现的「绝美」UI**，不追求速度，优先观感与品质。

---

## 一、专家共识：「绝美」的可执行定义

| 维度 | 定义 | 落地方式 |
|------|------|----------|
| **气质** | 干净、留白充足、层次分明；无拥挤感与高饱和色块堆砌 | 默认注入 Apple HIG 风格片段 + 8px 网格、最小 16px 内容区内边距 |
| **字体** | 系统无衬线、层级清晰；大标题 1.25–1.5rem/粗体，正文 0.9375–1rem，辅助 0.8125–0.875rem | Tailwind：\`text-xl\`/\`text-2xl\` + \`font-semibold\`，正文 \`text-base text-gray-600\`，行高 \`leading-relaxed\` |
| **圆角与阴影** | 克制：卡片/按钮 8–12px 圆角；阴影轻量（0 1px 3px rgba(0,0,0,0.08)） | \`rounded-xl\`、\`shadow-md\`/\`shadow-lg\`，禁止大块重阴影 |
| **色彩** | 背景白/浅灰；主文字深灰/黑；强调色单点使用、克制 | \`bg-white\`/\`bg-gray-50\`，\`text-gray-900\`/\`text-gray-600\`，主 CTA 单一 \`bg-cyan-500\` 或 \`bg-teal-500\` |
| **节奏** | 8px 基准网格；区块间距 16–24px；内容区 padding ≥ 16px | \`p-4\`/\`p-6\`、\`gap-4\`/\`gap-6\`、\`space-y-4\` |
| **焦点** | 每屏一个明确视觉焦点（主 CTA 或主标题），其余为层次支撑 | 主按钮唯一高饱和色；标题与正文层级分明 |
| **禁止** | 泛化 AI 感：多色堆砌、无层次白块、过重阴影、过小留白 | 契约中明确禁止项并注入 prompt |

---

## 二、与现有能力的衔接

- **UI Constitution**：已有背景/文本/按钮/卡片/输出契约；保留并**不削弱**，在其后追加「绝美默认风格」片段。
- **HIGH_QUALITY_UI_APPLE_STYLE_STITCH_PLAN**：苹果 HIG 片段已定义；**文本生成主链路**（generateUIFromText）此前未注入，本次在 system prompt 中**默认注入**。
- **档位**：已默认 quality；保持，不降为 draft。
- **美化**：已改为「仅视觉增强、不破坏结构」；保持。

---

## 三、执行计划

### Phase 1：设计卓越常量（可缓存、可复用）
- 在 \`src/lib/prompts/ui-constitution.ts\` 中新增 **PREMIUM_UI_BRIEF**（或 APPLE_HIG_BRIEF）：
  - 整体气质（干净、留白、层次）
  - 字体与字号层级（Tailwind 对应）
  - 圆角与阴影范围
  - 色彩与间距（8px 网格、最小 padding）
  - 单一焦点原则
  - 禁止：多色堆砌、无层次白块、过重阴影

### Phase 2：主生成链路注入
- 在 **generateUIFromText** 的 system prompt 中，在 \`${UI_CONSTITUTION}\` 之后、\`## 1. 基于描述生成UI\` 之前，拼接 **PREMIUM_UI_BRIEF**。
- 不增加新参数；默认即「绝美」风格，用户若描述其他风格（如深色、Material）仍由现有 toneInstruction / 用户 prompt 覆盖。

### Phase 3：可选强化
- 在「## 6.1 视觉样式」中增加一句：**默认遵循上方「绝美默认风格」**，与 PREMIUM_UI_BRIEF 呼应。
- 文档与自检：本文档即说明；验收以「生成页观感干净、有层次、有单一焦点、无泛化 AI 感」为准。

---

## 四、验收标准
- 生成页第一眼：留白充足、字体层级清晰、圆角与阴影克制、主 CTA 明确。
- 无多色堆砌、无大块重阴影、无「无样式」白块。
- 与现有视口/中文/禁止占位等契约无冲突。

---

## 五、实施记录
- **计划撰写**：本文件。
- **Phase 1**：\`src/lib/prompts/ui-constitution.ts\` 新增 **PREMIUM_UI_BRIEF**（绝美默认风格：气质、字体层级、圆角阴影、色彩、间距、单一焦点、禁止项）。
- **Phase 2**：\`generateUIFromText\` 的 system prompt 在 UI_CONSTITUTION 后拼接 PREMIUM_UI_BRIEF；「## 6.1 视觉样式」增加「默认遵循上方绝美默认风格」；\`refineUI\` 系统提示增加 PREMIUM 条款（单一焦点、留白、单一主色、克制阴影）。
- **验收**：生成/美化后的页面应满足：留白充足、层级清晰、单一主色、无多色堆砌与过重阴影。
