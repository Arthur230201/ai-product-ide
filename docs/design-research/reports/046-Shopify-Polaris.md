# 046 Shopify - Polaris 设计学习报告

## 1. 组织与设计系统名称

- **组织**：Shopify
- **设计系统名称**：Polaris（Polaris Design System for React；主站标注 React 版为 Deprecated，推荐使用 Polaris Web Components 等）
- **官方链接**：https://polaris.shopify.com/

## 2. 设计理念与原则

- **定位**：为 **admin / 商家管理后台** 提供统一的设计与开发基础，强调「quality admin experiences」。
- **结构**：Foundations（基础设计指导）→ Components（可复用元素与样式，通过代码打包）→ Tokens（颜色、间距、字体等设计决策的编码名称）→ Icons（400+ 图标，聚焦商业与创业场景）。
- **目标用户**：创建与管理商家后台界面的设计师与开发者；体验围绕「管理任务」与「商业语境」优化。

## 3. 视觉与基础规范

- **Tokens**：颜色、间距、字体等以 **tokens** 形式编码，保证设计决策可被代码与设计工具一致消费。
- **Icons**：大量图标库，面向电商与后台场景（商品、订单、设置等），风格统一。
- **Foundations**：提供创建高质量 admin 体验的基础指导，而非仅组件库。

## 4. 组件与模式

- **Components**：可复用元素与样式，用于构建 admin 界面；通过代码封装，保证一致性与可维护性。
- **演进**：React 版标记为 Deprecated；官方推荐 Polaris Web Components 等新形态，体现设计系统与产品技术栈的协同演进。

## 5. 可访问性与包容性

- 官方文档未在本调研页面展开具体 WCAG 或包容性条款；Foundations 中应有与「quality」体验相关的基础要求，需在 Foundations 子页进一步查阅。

## 6. 与本项目可借鉴的共性

- **Admin 场景的明确边界**：Polaris 明确服务于「admin / 管理后台」，Foundations 与组件都围绕该场景；我们可借鉴「按场景收敛设计边界」的思路，而不必用词汇拟合（如「商品」），而是用「管理/数据/配置」等目标来约束。
- **Design Tokens 先行**：颜色、间距、字体等以 token 形式存在，便于多端与多实现一致；对应我们 Constitution 中的设计契约与 Tailwind 类名约定。
- **图标与场景匹配**：图标库针对业务场景设计，减少「通用图标 + 泛化界面」的违和感；我们可强调 lucide-react 中与页面目标一致的图标选择。
