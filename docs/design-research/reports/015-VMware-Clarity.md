# 015 VMware - Clarity Design System 设计学习报告

## 1. 组织与设计系统名称

- **组织**：VMware
- **设计系统名称**：Clarity Design System
- **官方链接**：https://clarity.design/（文档：core.clarity.design）

## 2. 设计理念与原则

- **定位**：可扩展、可定制的开源设计系统，口号为「enterprise-ready, consumer-simple」；核心原则为 **inclusion**（包容）。
- **受众**：面向设计师、开发者与最终用户；每个组件、模式与指南均根植于真实用户行为。
- **可访问性**：将 a11y 贯穿设计与开发，遵循 WCAG 2.1 AA，并有专职可访问性团队支持。
- **框架**：支持 Angular、React、Vue；Core 提供与框架无关的 Web Components，可在任意 JS 框架中使用。

## 3. 视觉与基础规范

- 30+ 组件、200+ 图标；含高性能 datagrid 等企业级组件；设计资产使用 Figma、Clarity City 字体与 SVG 图标库。
- 设计资源见 core.clarity.design get-started/design。

## 4. 组件与模式

- 组件库覆盖表单、数据展示、导航等；提供详细 API 与多框架示例；社区规模大（数百万下载、2,700+ 依赖仓库、300+ 发布），MIT 许可，GitHub Issues/Discussions 参与。

## 5. 可访问性与包容性

- 明确遵循 WCAG 2.1 AA；inclusion 作为核心原则；专职 a11y 团队，与「people-focused」一致。

## 6. 与本项目可借鉴的共性

- **Enterprise-ready, consumer-simple**：复杂能力封装为简单用法；对应我们「数据展示页/管理类」用通用模式与组件表达，不发明特例。
- **Inclusion 贯穿**：a11y 不是附加项而是设计前提；可纳入 HIGH_QUALITY_UI_DEFINITION 与 DESIGN_PHILOSOPHY 的包容性表述。
- **框架无关组件**：Web Components 思路与我们的 HTML-first、多端一致一致。
