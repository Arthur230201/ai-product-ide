import { defineConfig, devices } from '@playwright/test';

const E2E_PORT = Number(process.env.E2E_PORT ?? 3100);
const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: E2E_BASE_URL,
    trace: 'on-first-retry',
    // 固定视口，避免小窗口导致工具栏/下拉菜单被裁切、点击「滚动到可见」失败（如 Cursor 内嵌浏览器约 300x408）
    viewport: { width: 1280, height: 800 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // 用独立端口避免与用户现有 dev 冲突（否则会出现“复用到错误服务 / 或端口占用”）。
    // 清空 NODE_OPTIONS（避免 node 在执行脚本前就打印 --localstorage-file 警告），再由 wrapper 二次净化。
    // 并在 E2E dev wrapper 中开启 NODE_NO_WARNINGS（仅对 webServer 生效）以减少噪声告警。
    // mock next/font/google，避免无网环境下载 Google Fonts 产生 AbortError 噪声。
    command: `NEXT_FONT_GOOGLE_MOCKED=1 NEXT_DEV_SUPPRESS_NODE_WARNINGS=1 NODE_OPTIONS= node scripts/next-dev.cjs --port ${E2E_PORT} --clean-webpack-cache`,
    url: E2E_BASE_URL,
    // 禁止静默复用已有 3000 端口（可能不是本仓库 Next 服务，导致 _next chunk 404、页面永远停在“加载中”）。
    // 若 3000 被占用请先停止占用进程，再运行 e2e。
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
