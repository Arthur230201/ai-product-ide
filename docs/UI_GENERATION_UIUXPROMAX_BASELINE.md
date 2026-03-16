# UI 生成：以 UIUX Pro Max 为基准

## 原则

- **UIUX Pro Max 为设计智能的唯一起点**：可访问性、对比度、触控、布局、动效与交付自检均由其定义。
- **不再重复打补丁**：若 UIUX Pro Max 已覆盖某条规则，则不在 `buildUIGenerationSystemPrompt` 或其它提示中重复写一遍，避免冲突与冗长。

## 实现

1. **`src/lib/prompts/ui-ux-pro-max-guidance.ts`**  
   - 标明为「设计基准」；与 Design Philosophy 等冲突时以本段为准。

2. **`src/lib/prompts/ui-generation-prompt.ts`**  
   - 开头增加「设计基准」说明，指向末尾的 [UIUXProMax 设计智能]。  
   - Design Philosophy 只做高层指导；用色与可访问性不在此展开，指向 UIUX Pro Max。  
   - 删除原「文字颜色与可见性」整段，改为「见 [UIUXProMax 设计智能]」。  
   - Platform & Viewport 只保留组件与结构（NavBar/AppBar/Sidebar、根容器）；触控与对比度见 UIUX Pro Max。

3. **组装顺序**（`node-operations.ts`）  
   - 基础系统提示 → 风格/主题片段（若有）→ **UI_UX_PRO_MAX_GUIDANCE**，保证基准在 system 末尾统一出现。

## 参考

- 开源技能：https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
