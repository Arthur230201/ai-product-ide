#!/usr/bin/env bash
# 部署到远端：同步代码 → 安装依赖 → 构建 → PM2 重启。在项目根目录执行：bash scripts/deploy.sh
set -e
REMOTE="${DEPLOY_REMOTE:-ubuntu@62.234.29.171}"
APP_DIR="/home/ubuntu/ai-product-ide"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT"
echo "=== 部署目标: $REMOTE 应用目录: $APP_DIR ==="

echo "=== 1. 同步代码（含 .env.local，便于 API key 等配置一并部署）==="
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.next' \
  --exclude 'out' \
  --exclude '*.log' \
  --exclude '.cursor' \
  --exclude 'scripts/viewport-debug-*.json' \
  --exclude 'terminals' \
  "$ROOT/" "$REMOTE:$APP_DIR/"

echo "=== 2. 远端安装依赖、构建并重启 ==="
# 构建需要 devDependencies（tailwindcss/postcss/typescript 等），全量安装后构建；不执行 prune 以免再次触发 peer 冲突
ssh "$REMOTE" "cd $APP_DIR && npm install --legacy-peer-deps && npm run build && (pm2 restart ai-product-ide 2>/dev/null || pm2 start npm --name ai-product-ide -- start)"

echo "=== 部署完成 ==="
echo "应用默认端口 3000。若需外网访问，请在安全组放行 3000 或配置 Nginx 反代。"
