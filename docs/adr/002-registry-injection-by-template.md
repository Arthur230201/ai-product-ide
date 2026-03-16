# ADR-002：按模板子集注入 Registry（Registry Injection by Template）

**状态**：已采纳（待落地）  
**日期**：2025-03

## 决策

- **知识库唯一源**：`registry/components/*.json` 为组件 RAG 唯一来源；synthesize 不再使用固定 `REGISTRY_SNIPPET` 常量。
- **按需子集**：`getComponentRegistrySnippet(templateId, pageType?, node?)` 根据模板规则与节点信息从 components JSON 选取子集（约 10～20 个组件），输出**结构化 JSON** 注入 prompt。
- **注入格式**：`{ allowedComponents: [{ name, allowedPropKeys, propEnums }, ...], globalDonts: ["no className", "no rawHtml", ...] }`，模型仅能使用枚举的 props，降低幻觉与风格漂移。
- **子集策略**：先规则驱动（list/search_results → Input/Table/Pagination/…；dashboard → Card/…；form/wizard → Input/Textarea/Button/…），不做向量检索；模板扩展时在配置中声明所需组件即可。

## 完成标准

- synthesize 注入内容随 templateId 变化；注入来自 components/*.json，扩展组件仅需加 JSON 文件、无需改 prompt 常量。
