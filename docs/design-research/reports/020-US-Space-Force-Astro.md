# 020 United States Space Force - Astro 设计学习报告

## 1. 组织与设计系统名称

- **组织**：United States Space Force / Space Systems Command (SSC)
- **设计系统名称**：Astro UXDS
- **官方链接**：https://www.astrouxds.com/

## 2. 设计理念与原则

- **定位**：为美国太空军与太空系统司令部打造的空间任务应用设计系统（当前 v7.0），面向政府与商业空间应用；由 Rocket Communications 维护。
- **起源**：为 R2C2（指挥控制）与 SATOPS（卫星运维）等 Web 应用设计，基于以用户为中心的研究，在设计中纳入领域专家与商业空间运营商。
- **设计资源**：Figma（深色/浅色/线框主题）、图标库、设计 token、排版与网格；符合 MIL-STD-1472H；开发者端为 Stencil Web Components、多框架 Starter（HTML/Angular/React/Vue）、Storybook。

## 3. 视觉与基础规范

- 设计 token、排版、主题与网格有明确规范；支持深色/浅色/线框多种主题；2025 年推出 PowerPoint 工具包便于在受限环境中做合规稿。

## 4. 组件与模式

- Web Components 通过 npm 交付；含 GRM、TT&C、FDS 等任务场景的 UX 设计；GitHub、Figma Community、Slack 支持。

## 5. 可访问性与包容性

- MIL-STD-1472H 涉及人因与可读性；具体 WCAG 需在官网查阅。

## 6. 与本项目可借鉴的共性

- **领域与通用兼顾**：在专业领域（空间任务）内仍强调用户研究、一致组件与多主题；对应我们「通用原则 + 领域由 LLM 推断」。
- **多端与多框架**：Web Components + 多框架 Starter；对应我们同一套约束跨桌面/移动与不同技术栈。
