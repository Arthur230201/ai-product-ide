# 独立导出：PRD / 需求规格说明书 / 测试报告 / 系统设计说明

> 目标：支持**独立**导出以下四类文档。现状与缺口如下。

---

## 一、四类文档与现状

| 文档类型 | 说明 | 当前是否支持 | 数据来源 |
|----------|------|--------------|----------|
| **PRD（产品需求文档）** | 产品需求、功能列表、页面说明、蓝图等 | ✅ **支持** | 画布节点 `spec`（requirements）、项目 meta、globalRules；导出为 HTML / Word / Markdown |
| **需求规格说明书（SRS）** | 偏正式的软件需求规格（章节化、版本表、目录） | ⚠️ **部分支持** | `wordGenerator.generateEnterpriseWord` 已实现「软件需求规格说明书」版式（封面标题为 SRS），但**未在工具栏暴露**为独立入口；当前工具栏「导出 Word」走的是 `prdGenerator.exportToWord`（Markdown 转 docx），非 SRS 版式 |
| **测试报告** | 含测试用例列表，执行结果列为空 | ❌ **不支持** | 节点 `artifacts.test.cases` 有数据，但**没有**汇总为「测试报告」文档并导出的逻辑 |
| **系统设计说明** | API 接口、数据库/规格等 | ❌ **不支持** | 节点 `artifacts.impl`（apiEndpoints、dbSchema）有数据，但**没有**汇总为「系统设计说明」文档并导出的逻辑 |

---

## 二、系统缺少的能力（缺口）

1. **需求规格说明书独立导出**  
   - 已有能力：`exportToEnterpriseWord`（SRS 版式）在代码中存在，但未在 UI 作为「需求规格说明书」单独导出。  
   - 缺口：在「导出」菜单中增加**独立入口**（如「导出需求规格说明书」），调用现有 Enterprise Word 流程，或与 PRD 区分（PRD=产品视角，SRS=规格化文档）。

2. **测试报告导出**  
   - 缺口：无「测试报告」导出。  
   - 需要：从所有节点的 `artifacts.test.cases` 汇总，生成一份文档（Markdown 或 Word），结构建议：  
     - 封面/标题：xxx 项目 - 测试报告  
     - 按节点（页面/模块）列出测试用例  
     - 表格列：序号、所属页面/模块、测试场景/步骤、预期结果、**执行结果**（导出时留空）、备注  
   - 数据：`nodes[].data.artifacts.test.cases`；执行结果列统一留空即可。

3. **系统设计说明导出**  
   - 缺口：无「系统设计说明」导出。  
   - 需要：从所有节点的 `artifacts.impl` 汇总，生成一份文档（Markdown 或 Word），结构建议：  
     - 封面/标题：xxx 项目 - 系统设计说明  
     - 按节点或按模块：API 接口列表（apiEndpoints）、数据库/数据规格说明（dbSchema）  
   - 数据：`nodes[].data.artifacts.impl`（apiEndpoints、dbSchema）。

4. **PRD 独立导出**  
   - 已支持：工具栏已有「导出 PRD」→ HTML / Word / Markdown，无需新增；保持为「独立」导出即可。

---

## 三、实现建议（简要）

1. **需求规格说明书**  
   - 在导出菜单中增加「导出需求规格说明书」选项，调用现有 `exportToEnterpriseWord`（或复用其数据组装 + SRS 版式），输出一份以「软件需求规格说明书」为标题的 Word，与「导出 PRD」并列。

2. **测试报告**  
   - 新增 `exportTestReport(options: { projectMeta, nodes })`：遍历 `nodes` 收集 `artifacts.test.cases`，生成 Markdown 或 Word，表格含「执行结果」列并留空。  
   - 在导出菜单中增加「导出测试报告」。

3. **系统设计说明**  
   - 新增 `exportSystemDesignDoc(options: { projectMeta, nodes })`：遍历 `nodes` 收集 `artifacts.impl`（apiEndpoints、dbSchema），生成 Markdown 或 Word。  
   - 在导出菜单中增加「导出系统设计说明」。

4. **入口统一**  
   - 建议：导出下拉中分为「PRD」「需求规格说明书」「测试报告」「系统设计说明」四类（或子菜单），每类下可再选格式（HTML/Word/Markdown 视实现而定），便于用户独立导出所需文档。

---

## 四、小结

| 文档 | 是否支持独立导出 | 建议 |
|------|------------------|------|
| PRD | ✅ 支持 | 保持现状，已可独立导出 |
| 需求规格说明书 | ⚠️ 有能力未暴露 | 增加菜单项，调用 SRS 版式 Word 导出 |
| 测试报告（含用例，结果为空） | ❌ 不支持 | 新增导出逻辑 + 菜单项 |
| 系统设计说明 | ❌ 不支持 | 新增导出逻辑 + 菜单项 |

上述能力已实现：工具栏「导出」下拉中已增加「导出需求规格说明书」「导出测试报告」「导出系统设计说明」入口，四类文档均可独立导出。另已支持**导出使用说明书**（标准结构：文档总览、快速入门、按页面功能说明、常见问题、附录），数据来自各节点「需求」与可选 `UserManualMeta`。
