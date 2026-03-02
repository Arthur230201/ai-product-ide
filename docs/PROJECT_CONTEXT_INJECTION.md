# 项目级上下文注入清单

本文档列出 **projectMeta、globalRules、currentTheme、aiConfig** 在各 AI/生成入口中的使用位置与字段，便于新增字段时检查是否需同步注入。

## 入口与使用情况

| 入口 | 路径 | projectMeta | globalRules | currentTheme | aiConfig |
|------|------|-------------|------------|--------------|----------|
| PRD 生成 | `src/app/api/generate-prd/route.ts` | ✅ projectName, industry, targetAudience, description | （可扩展） | — | — |
| 拓扑生成 | `src/app/actions/generate-graph.ts` | 可选（prompt 上下文） | 可选 | — | ✅ visionModel, textModel |
| 三段式 UI | `src/app/actions/ui-pipeline.ts` | 可选（nodeLabel 等） | — | — | ✅ textModel |
| 节点 UI 生成/优化 | `src/app/actions/node-operations.ts` | — | — | ✅ themeConfig | ✅ 通过 getTextModel 等 |
| Tailwind 配置生成 | `src/app/actions/generate-tailwind-config.ts` | — | — | — | — |

## 字段速查（projectMeta）

- **必填**：projectName, industry, targetAudience, description, version  
- **扩展**：applicationScope, coreObjectScale, keyRequiredFunctions, integratedSystems, complianceConstraints, rolesAndPermissions（见 `src/types/fractal.ts` ProjectMeta）

新增 projectMeta 字段时：若希望影响 PRD 或拓扑生成，需在 generate-prd、generate-graph 的 prompt 或请求体中显式传入。

## 字段速查（globalRules）

- **必填**：performance, security, compatibility, errorHandling, dataTracking  

新增 globalRules 字段时：若希望约束生成质量，需在对应入口的 prompt 或校验逻辑中引用。

## 建议

- 新增「项目级」配置项时，先在本清单中补充一行「计划在哪些入口使用」再改类型与实现。
- aiConfig（visionModel / textModel）由前端/配置传入，各 server action 通过 getVisionModel / getTextModel（`src/lib/ai-config.ts`）读取，保持单一来源。
