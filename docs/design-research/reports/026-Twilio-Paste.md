# 026 Twilio - Paste 设计学习报告

## 1. 组织与设计系统名称

- **组织**：Twilio
- **设计系统名称**：Paste
- **官方链接**：https://paste.twilio.design/

## 2. 设计理念与原则

- **定位**：Twilio 的开源设计系统，用于构建包容、令人愉悦的客户体验；面向设计师与开发者，提供组件、模式与设计指南。
- **Pattern 目标**：一是建立 Twilio 全平台一致性，使用户在不同产品间无需重新学习；二是提升效率，避免团队重复解决同一问题。
- **组件规模**：80+ 已样式化组件，100+ 组件覆盖按钮、告警、数据网格、聊天界面等；Pattern 定义如何组合组件为可复用解决方案。
- **设计 token**：颜色、文本、阴影、间距、尺寸；支持多主题（twilio、twilio-dark、default、evergreen）；可主题化、可组合，强调包容体验。

## 3. 视觉与基础规范

- Design Guidelines 覆盖设计师；token 与组件在 Figma（Paste Components、Patterns & Templates、Asset Documentation）与代码中一致。

## 4. 组件与模式

- Components + Patterns + Templates；开发者通过 @twilio-paste/core、@twilio-paste/icons 使用；Paste Assistant 提供 AI 辅助，GitHub Discussions 支持。

## 5. 可访问性与包容性

- 明确强调「inclusive, delightful」体验；主题与焦点等支持多场景；具体 a11y 标准需在指南查阅。

## 6. 与本项目可借鉴的共性

- **全平台一致**：用户不因产品切换而重新学习；对应我们「同一套组件与模式」避免页面类型特例。  
- **效率与复用**：Pattern 解决「同一问题不解决两次」；对应我们推荐写法与组件库减少重复发明。  
- **包容与可主题**：inclusive + 多主题；可纳入设计原则中的包容性与适应性。
