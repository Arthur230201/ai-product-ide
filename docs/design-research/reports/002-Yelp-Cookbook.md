# 002 Yelp - Cookbook 设计学习报告

## 1. 组织与设计系统名称

- **组织**：Yelp
- **设计系统名称**：Cookbook（Style Guide / 活的设计系统）
- **官方链接**：https://www.yelp.com/styleguide

## 2. 设计理念与原则

- **方法论**：基于 Brad Frost 的 **Atomic Design**，采用「食物层级」隐喻：Ingredients（样式）→ Recipes（组件）→ Entrees（复杂组件）→ Templates → Pages。
- **五条设计原则**：
  1. **Don't make me think!** — 有意、清晰的设计与无缝导航。
  2. **Make me feel understood** — 为多元用户与商家创造包容空间。
  3. **Help me get it done** — 帮助用户达成目标。
  4. **Treat me like a person** — 理解用户是谁、将去哪里。
  5. **Earn trust** — 通过设计与行为建立信任。
- **铁律**：「There are no special cases.」新功能必须使用既有模式，或将新模式纳入 styleguide，保证全平台一致；styleguide 与生产代码同步（living document + live code）。

## 3. 视觉与基础规范

- **Ingredients**：Typography 与 color 样式，考虑可访问性；主色 Red（按钮、徽章、错误）、Teal（链接、激活、选中）；Poppins（标题）、Open Sans（正文）。
- **Recipes / Entrees**：可扩展、可复用组件（按钮、徽章、评价条、选择元素等）。
- 跨 Web 与 Mobile 保持模式同步。

## 4. 组件与模式

- 组件层级清晰：从原子样式到页面级模板；Recipes 与 Entrees 对应中高层组件与复合组件。
- 无「特例」政策推动所有功能收敛到同一套模式，减少碎片化。

## 5. 可访问性与包容性

- Ingredients 设计时考虑可访问性；原则中「Make me feel understood」与包容性直接相关。
- 具体 WCAG 或对比度需在 Cookbook 站点内查阅。

## 6. 与本项目可借鉴的共性

- **无特例**：所有界面必须使用既有模式或贡献回系统；对应我们「生成前必须用提供的组件与推荐写法」，避免模型发明特例。
- **清晰与目标导向**：Don't make me think + Help me get it done；可归纳为「减少认知负担、以完成任务为中心」。
- **活文档与代码一致**：styleguide 与生产代码绑定，避免文档与实现脱节；我们通过「推荐写法」与真实可用组件保持生成结果与文档一致。
