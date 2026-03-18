# 设计系统 E2E / UUPM 校验

## Playwright：Sparkles + 风格面板

- **用例**：`e2e/design-system-toolbar.spec.ts`（预置 `fractal-canvas-storage` 退出 Stitch 首页）。
- **默认跳过**（避免无头环境 chunk 404 导致永久「加载中」）。
- **运行**：

```bash
# Playwright 将在 3100 端口启动本仓库 next dev（清空 NODE_OPTIONS；wrapper 二次净化；清理 .next webpack cache；并 mock Google Fonts 以避免无网环境拉取字体的噪声）
E2E_DESIGN_SYSTEM=1 npm run e2e:design-system
```

## UUPM Python 一键校验

```bash
DESIGN_SYSTEM_UUPM_ENABLED=1 UIUXPROMAX_SKILL_ROOT=/path/to/ui-ux-pro-max-skill npm run verify:uupm
```

未开启或缺少 `search.py` 时脚本 **exit 0**（跳过）。成功时打印 stdout 字节数。

## 相关修复

- **工具栏消失**：`ProjectToolbar` 曾用 `style*="z-index: 10000"` 误判演示模式（与 `100001` 等冲突），已改为仅识别 `[data-presentation-mode="true"]`。
