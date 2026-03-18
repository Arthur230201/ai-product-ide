import { defineConfig, devices } from '@playwright/test';

/**
 * Full-flow 专用配置：
 * - 不启动 webServer（使用外部已启动的 BASE_URL，例如 npm run dev）
 * - 不依赖固定端口，避免与 E2E webServer 端口冲突
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 800 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});

