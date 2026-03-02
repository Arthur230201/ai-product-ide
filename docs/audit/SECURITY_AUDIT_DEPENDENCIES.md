# 依赖安全审计记录

**日期**: 2026-02-06  
**关联**: PROJECT_AUDIT_REPORT_20260206 / P1-2

## 执行动作

- 已执行 `npm audit fix`（未使用 `--force`），以在不引入 major 升级的前提下修复可自动修复的漏洞。
- 未执行 `npm audit fix --force`：next、eslint-config-next、mermaid 等涉及 major 升级，需单独评估与回归后再决定。

## 当前已知漏洞（审计时）

| 依赖链 | 严重程度 | 说明 |
|--------|----------|------|
| glob（经 eslint-config-next） | high | 命令注入等，修复需升级至 eslint-config-next@16+，属 breaking。 |
| next | high | Image Optimizer DoS、RSC 反序列化 DoS 等，修复需升级至 next@16+。 |
| lodash / lodash-es（经 mermaid） | moderate | 原型污染，修复需 mermaid 上游升级。 |
| undici | moderate | 解压链导致资源耗尽，可尝试 `npm audit fix` 升级补丁版本。 |

## 缓解与建议

- **当前用途**：若仅本地/内网使用，暴露面有限；公网部署前必须再评估并优先安排 next 与 ESLint 相关升级。
- **后续**：每季度或 before 公网发布时重新运行 `npm audit`，对 high/critical 制定升级或缓解计划。
- **文档**：本文档随审计更新；升级完成后请更新“当前已知漏洞”表。

## 复查时间点

建议：下次大版本发布前或 2026-05 前复查一次。
