# UX/UI 优化说明

**日期**: 2026-02-06  
**依据**: `.cursorrules`（Tailwind、Lucide）、frontend-design skill、commonsense（可读性、一致性）

---

## 1. 设计原则（对齐 Skills & Rules）

- **Typography**：使用有辨识度的无衬线字体（DM Sans），避免通用 Inter/系统栈独占；通过 `--font-sans` 与 Tailwind `font-sans` 统一。
- **Color & Theme**：深色基底（zinc-950），单一强调色（cyan-400）用于焦点、加载与成功态，CSS 变量 `--ui-accent` 便于后续扩展。
- **Motion**：过渡统一为 `duration-150`/`200ms`，加载使用柔和旋转；“已就绪”使用 `fadeInSlideDown` 轻微上滑进入。
- **Accessibility**：工具栏按钮增加 `focus-visible` 焦点环（`.focus-ring`）、`aria-label`/`aria-expanded`/`role="status"` 等，加载与成功提示具备语义与 `aria-live`。
- **Consistency**：工具栏所有主操作使用相同 hover/transition 与 focus-ring 类。

---

## 2. 已实施的改动

| 区域 | 改动 |
|------|------|
| **globals.css** | 新增 `:root` 变量：`--ui-accent`、`--ui-accent-muted`、`--ui-surface`、`--ui-border`、`--motion-*`；新增 `pulseSoft`/`spinSlow` 关键帧；新增工具类 `.focus-ring`；body 使用 `var(--font-sans)` 回退。 |
| **layout.tsx** | 引入 `next/font/google` 的 DM Sans，`variable: --font-sans`，html/body 应用 `font-sans`。 |
| **tailwind.config.ts** | `theme.extend.fontFamily.sans` 使用 `var(--font-sans)` 并保留系统回退。 |
| **page.tsx** | 加载态：简化层级、`role="status"`/`aria-label`、旋转时长 0.9s；“已就绪”改为带 Check 图标的卡片样式、`animate-[fadeInSlideDown_0.25s_ease-out]`、`role="status"`。 |
| **ProjectToolbar.tsx** | 所有主按钮与下拉项增加 `duration-150`、`focus-ring`；导出菜单按钮增加 `aria-expanded`；图标增加 `shrink-0` 防止挤压。 |

---

## 3. 规则符合性

- **.cursorrules**：全量使用 Tailwind CSS、Lucide React（如 Check），TypeScript 不变。
- **frontend-design**：明确字体与主色、动效节奏、焦点与语义化，避免通用 AI 风格。
- **commonsense**：命名清晰、状态可读、焦点与键盘可访问性提升。

---

## 4. 后续可做

- 在 CommandBar、NodeDetailPanel 等入口按钮上统一应用 `focus-ring` 与 `transition-colors duration-150`。
- 使用 `--ui-accent` 统一所有强调色（链接、选中边、成功 toasts）。
- 如需更多动效，可复用 `--motion-ease-out` / `--motion-duration` 做统一曲线与时长。
