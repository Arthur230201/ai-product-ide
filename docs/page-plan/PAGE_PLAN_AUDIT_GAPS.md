# PagePlan HTML-first 专家审核：还缺少什么

> 审核维度：架构对齐、计划落地完整性、质量与可维护性、安全与可观测性。  
> 依据：ARCHITECTURE.md、落地计划（四件套）、AGENTS.md、当前代码与文档。

---

## 一、流水线与接入（已落 vs 未落）

| 项 | 状态 | 说明 |
|----|------|------|
| Stage1 selectTemplate + buildFallbackPlan | ✅ | 规则化选模板，无 LLM |
| Stage2 LLM 合成 PagePlan JSON | ❌ | `buildSynthesizePlanPrompt` 存在，**无调用方**（无 API、无 CommandBar 入口） |
| validatePlan + 错误 JSONPath/hint | ✅ | 已用，错误结构供 repair 消费 |
| repair 循环（max 2） | ❌ | `buildRepairPlanPrompt` 存在，**未接入**：校验失败后没有「调 LLM repair → 再校验」 |
| renderHtml → view.code → HtmlSandboxRenderer | ✅ | ProjectToolbar 已接，写入 `artifacts.view.code` |
| data-data-query-ref + runtime 注入 | ✅ | renderHtml 输出属性 + JSON script，BehaviorInjector.injectDataQueryRuntime 填充 tbody |
| 禁 Tailwind 任意值 [] | ✅ | classMap/recipes 纯 token，textarea 用 min-h-20 |

**结论**：四件套代码齐，Fallback 路径完整；**LLM 合成 + Repair 闭环尚未接入**，属计划内「后续」能力。

---

## 二、架构与文档缺口

| 缺口 | 严重度 | 说明 |
|------|--------|------|
| ARCHITECTURE.md 未提 PagePlan/HTML-first | 中 | 新模块未入架构主文档，不利于新人/智能体对齐 |
| AGENTS.md 未索引 page-plan | 中 | 入口索引无「View 生成 / PagePlan」指引 |
| COMPONENT_LIBRARY 只写 preview-ui（React） | 低 | 与 page-plan 的 registry/components/*.json 两套体系，文档未说明「HTML 沙箱用 PagePlan + classMap，React 预览用 preview-ui」 |
| README 在 src/lib/page-plan 内 | ✅ | 有；可考虑在 docs/ 放一份「PagePlan 流水线」简述并链回 |

**建议**：在 ARCHITECTURE.md 增加一节「View 生成：PagePlan HTML-first」；在 AGENTS.md 增加一行索引到 `src/lib/page-plan/README.md` 或 `docs/page-plan/`。

---

## 三、校验与错误码

| 项 | 状态 | 说明 |
|----|------|------|
| errorCodes 中 E_LAYOUT_DENSITY_TOO_TIGHT | ❌ 未使用 | 已在类型中声明，validatePlan 未使用，属死码或预留 |
| templateRules.layoutRules（如 requirePrimaryResultsBinding） | 未强制 | list.json 有 layoutRules，validatePlan 只做 requiredSections/allowedSections，未校验「results 必须绑定 primary data」等（当前通过 bindings.data primary 间接保证） |

**建议**：若不做「密度过紧」校验，从 errorCodes 移除 E_LAYOUT_DENSITY_TOO_TIGHT；若做，在 validatePlan 中按 template 的 layoutRules 补校验。

---

## 四、渲染与 BehaviorInjector 对齐

| 项 | 状态 | 说明 |
|----|------|------|
| data-action / data-tab / data-filter / role=tab | ✅ | renderHtml 与 injector 约定一致 |
| states 区：loading / empty / error 仅展示其一 | ❌ | 当前三个块同时渲染，无「视图状态」切换逻辑；injector 的 setState 是通用键值，非 loading→empty→content 的 UI 状态机 |
| navBinding / edgeRef | ❌ | schema 有 nav/edgeRef，renderHtml 未输出「链接/按钮 → 跳转」的 data 属性或 href，无法做页面间导航 |
| 列表除 Table 外（如 Card 列表） | 未实现 | 仅 Table + data-data-query-ref 有 runtime 填充；若有「列表型」Card，需扩展 data-role 或 data-data-query-ref 约定 |

**建议**：  
- 在 injector 或约定中增加「视图状态」：如 `data-view-state="loading|empty|error|content"`，仅显示对应块；或由 runtime 脚本在注入数据后切换。  
- 后续迭代再补 navBinding（如 data-nav-ref + 简单路由/消息）。

---

## 五、测试与质量

| 项 | 状态 | 说明 |
|----|------|------|
| page-plan 单测 | ❌ | 无 *page-plan*.test.*；validatePlan、renderHtml、buildDataQueryRuntimePayload 均无单测 |
| 集成/ E2E「从 Plan 生成 HTML → 沙箱展示」 | ❌ | 未发现专门 E2E |

**建议**：  
- 至少为 validatePlan（合法/非法 plan）、renderHtml（无 []、含 data-data-query-ref）、buildDataQueryRuntimePayload（mock/embedded）写单测。  
- 可选：一条 E2E「选中节点 → 点 LayoutTemplate → 检查 iframe 内存在 table 且 tbody 有行」。

---

## 六、安全与可访问性

| 项 | 状态 | 说明 |
|----|------|------|
| 用户输入逃逸 | ✅ | renderHtml 与 wrapFullHtml 对 title/copy 等用 esc；body 为生成 HTML，无直接用户 HTML 注入 |
| data-query-runtime JSON | ✅ | 由 buildDataQueryRuntimePayload 生成，无 raw 用户输入拼接；若未来 rowsByQueryId 来自接口，需在调用方做校验/白名单 |
| 沙箱 | ✅ | 沿用现有 iframe + HtmlSandboxRenderer |
| 无障碍 | 部分 | 有 role=grid、role=alert；states 区若长期三块同显，需用 aria-hidden/aria-live 区分，否则读屏会混乱 |

---

## 七、优先级汇总（还缺少什么）

### 高优先级（建议本迭代或下一迭代）

1. **接入 Stage2 + Repair**  
   - 提供「从节点 + 描述生成 PagePlan」的 API 或 CommandBar 入口，调用 `buildSynthesizePlanPrompt`，返回 JSON 后走 validatePlan。  
   - 校验失败时调用 `buildRepairPlanPrompt`，最多重试 2 次，再决定写入 view.code 或报错。

2. **states 视图状态**  
   - 仅展示 loading / empty / error / content 其一（或由 data 注入结果驱动），避免三块同时可见。

3. **架构/入口文档**  
   - ARCHITECTURE.md 增加 PagePlan HTML-first 小节；AGENTS.md 增加对 page-plan 的索引。

### 中优先级

4. **errorCodes 与 layoutRules**  
   - 使用或移除 E_LAYOUT_DENSITY_TOO_TIGHT；按需在 validatePlan 中落实 template layoutRules。

5. **单测**  
   - validatePlan、renderHtml、buildDataQueryRuntimePayload 的单元测试。

### 低优先级 / 后续

6. **navBinding**  
   - renderHtml 输出 edgeRef/nav 的 data 属性；injector 或上层实现简单跳转/消息。

7. **非 Table 的列表数据绑定**  
   - 扩展 data-data-query-ref 到 Card 列表等，并统一 runtime payload 结构。

8. **E2E**  
   - 「Plan → HTML → 沙箱」一条端到端用例。

---

## 八、与「不要求本阶段完成」的对照

- Dashboard 模板：未做 ✅ 符合计划  
- React/JIT 双后端：未做 ✅ 符合计划  
- 完整 RAG（prompt 内嵌 registry 片段即可）：当前 prompt 已用 templateRules + componentRegistrySnippet ✅ 满足最小要求  

---

**审核结论**：  
四件套与 Fallback 路径、data binding runtime、禁任意值已落地；**主要缺口**为：**Stage2 LLM 合成 + Repair 闭环未接入**、**states 仅展示其一未实现**、**架构/入口文档未更新**、**无单测**。建议按上表优先级逐项补齐。
