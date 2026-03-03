# 094 Material 3 - Material 3 设计学习报告

## 1. 组织与设计系统名称

- **组织**：Material 3 (Google)
- **设计系统名称**：Material 3 (Material You)
- **官方链接**：https://m3.material.io/

## 2. 设计理念与原则

- **理念**：以印刷设计元素（字体、网格、空间、比例、色彩、图像）建立层级、含义与焦点；将数字界面视为「纸面」——可调整、可叠放的不透明表面。
- **Material You**：个性化、表达与基于用户偏好的动态定制；支持从壁纸生成主题、更强动效与更大触控目标；Material 3 Expressive 进一步强化可变字体、色彩与形态。
- **六类样式**：Color（动态色彩）、Typography（可读与灵活字阶）、Shape（圆角范围）、Elevation（层级）、Motion（过渡与导航）、Icons（Material Symbols 多字重与风格）。

## 3. 视觉与基础规范

- 设计 token 与样式在 m3.material.io 定义；跨平台（Android、Web、Flutter 等）一致。

## 4. 组件与模式

- 组件库覆盖导航、表单、卡片、对话框等；与 Motion 与 Elevation 配合。

## 5. 可访问性与包容性

- 动态色彩与对比度、触控目标与动效考虑多种用户；具体 a11y 需在官网查阅。

## 6. 与本项目可借鉴的共性

- **层级与焦点**：通过空间、比例与色彩建立层级；对应我们 DESIGN_PHILOSOPHY 中的清晰与层级、留白。
- **个性化与克制**：Material You 在系统级定制；我们可在「一致基础 + 有限主题」下借鉴，避免过度发明。
