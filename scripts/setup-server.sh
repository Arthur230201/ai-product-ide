#!/usr/bin/env bash
# 服务器一次性环境准备（Node 20 + PM2）。在本机执行：bash scripts/setup-server.sh
set -e
REMOTE="${DEPLOY_REMOTE:-ubuntu@62.234.29.171}"
APP_DIR="/home/ubuntu/ai-product-ide"

echo "=== 目标: $REMOTE ==="
echo "将安装 Node 20、PM2 并创建应用目录（若需密码请手动输入）"
[ -t 0 ] && read -p "按 Enter 继续..."

ssh "$REMOTE" "bash -s" << 'REMOTE_SCRIPT'
set -e
export DEBIAN_FRONTEND=noninteractive
if ! command -v node &>/dev/null; then
  echo "安装 Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
node -v
npm -v
if ! command -v pm2 &>/dev/null; then
  echo "安装 PM2..."
  sudo npm install -g pm2
fi
mkdir -p /home/ubuntu/ai-product-ide
echo "环境就绪。"
REMOTE_SCRIPT

echo "=== 服务器环境就绪 ==="
