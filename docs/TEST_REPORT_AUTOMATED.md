# 自动化测试验证报告

| 项 | 内容 |
|----|------|
| **生成时间** | 2026-03-18（以执行机为准） |
| **仓库** | ai-product-ide |
| **总结论** | **通过** — 单元测试、类型检查、ESLint、生产构建、项目自检均成功 |

---

## 1. 执行摘要

| 阶段 | 命令 | 结果 |
|------|------|------|
| 单元测试 | `npm test` | **PASS**（21 条用例） |
| 类型检查 | `npx tsc --noEmit` | **PASS** |
| 代码规范 | `npm run lint` | **PASS**（0 warning） |
| 生产构建 | `npm run build` | **PASS** |
| 工程自检 | `npm run selfcheck` | **PASS** |

---

## 2. 单元测试明细（`npm test`）

| 套件 | 用例数 | 状态 |
|------|--------|------|
| `validatePlan` | 4 | ✅ |
| `renderHtml` | 4 | ✅ |
| `buildDataQueryRuntime` | 4 | ✅ |
| `design-system M1`（截断 / 快照解析 / PRD 附录） | 7 | ✅ |
| `design-system M3`（UUPM 快照构建） | 2 | ✅ |
| **合计** | **21** | ✅ |

**说明**：当前为 `tsx` 驱动的轻量断言脚本，非 Jest/Vitest；E2E（Playwright）未纳入本次流水线，需单独执行 `e2e:stitch` 等。

---

## 3. 生产构建（`npm run build`）

- Next.js 优化构建 **Compiled successfully**
- 静态页生成 **11/11** 完成
- **告警处理**：根路径已改为 **动态渲染**（`dynamic = 'force-dynamic'`）+ 构建脚本净化 `NODE_OPTIONS`，一般不再出现 `localstorage-file` 警告；详见 [TROUBLESHOOTING_BUILD.md](./TROUBLESHOOTING_BUILD.md)

---

## 4. 项目自检（`npm run selfcheck`）

| 检查项 | 结果 |
|--------|------|
| Build / Lint / TypeCheck | ✅ |
| LLM 调用入口扫描 | ✅（11 文件） |
| JSON 解析链路 | ✅ |
| 429/ECONNRESET 处理 | ✅ |
| 衍生报告 | `docs/项目自检报告.md`、`docs/prompt-hotspots.md`、`docs/error-hotspots.md` |

---

## 5. 复现命令

```bash
cd /path/to/ai-product-ide
npm test
npx tsc --noEmit
npm run lint
npm run build
npm run selfcheck
```

与 CI 对齐可执行：`npm run ci`（`typecheck` + `build` + `test`）。

---

## 6. 建议后续（非本次失败项）

| 项 | 说明 |
|----|------|
| E2E | 按需跑 `npm run e2e:stitch` 或 Playwright 套件 |
| UUPM Python | 设计系统 Python 路径需本地 `DESIGN_SYSTEM_UUPM_ENABLED=1` + skill 目录，**不在**上述自动化中覆盖 |
| localStorage 警告 | 若需清零构建告警，可排查 SSG 阶段引用 `localStorage` 的依赖或加 polyfill 路径 |

---

*本报告由自动化命令输出整理，可随流水线定期覆盖更新。*
