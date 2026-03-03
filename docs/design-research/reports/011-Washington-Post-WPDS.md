# 011 Washington Post - WPDS 设计学习报告

## 1. 组织与设计系统名称

- **组织**：Washington Post
- **设计系统名称**：WPDS (Washington Post Design System)
- **官方链接**：https://build.washingtonpost.com/

## 2. 设计理念与原则

- **定位**：为 washingtonpost.com 打造的 design tokens 与交互组件库，支持设计师与开发者以模块化、优雅、可访问的方式交付读者端数字产品，并在规模上保持视觉一致。
- **技术栈**：WPDS UI Kit 基于 React、Stitches、Radix UI，开源见 washingtonpost/wpds-ui-kit。
- **三大板块**：Foundations（设计 token 及实现）→ Components（文档、示例、用法与最佳实践）→ Resources（Figma、Zeplin、React 等集成指南）。

## 3. 视觉与基础规范

- Foundations 定义设计 token；支持 Tailwind WPDS Theme；文档覆盖 Next.js 建页、贡献组件、自定义图标及性能/SEO。
- 以 Figma 为主要设计工具，Zeplin 用于交接。

## 4. 组件与模式

- 组件带设计示例、使用指南与技术最佳实践；近期新增 emoji 用法、用户教育框架、轮播组件等。
- 多仓库发布说明（UI Kit、WAM、设计插件）保证文档与实现同步。

## 5. 可访问性与包容性

- 目标明确为「accessible reader-facing digital products」；具体 WCAG 或对比度需在官网 Foundations/Components 查阅。

## 6. 与本项目可借鉴的共性

- **模块化与可访问并重**：组件库即生产代码，保证文档与实现一致；对应我们「推荐写法 + 真实组件」的事前约束。
- **Foundations → Components → Resources**：先 token 再组件再集成；对应 Constitution + Building Blocks + 集成指南的层次。
