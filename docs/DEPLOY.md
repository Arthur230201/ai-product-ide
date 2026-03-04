# 部署到 62.234.29.171

## 前置条件

- 本机可 SSH 到 `ubuntu@62.234.29.171`（会提示输入密码，或已配置 SSH 密钥）。
- 服务器安全组已放行 22（SSH）、3000（应用端口，或由 Nginx 反代 80/443）。

## 一、首次部署（一次性环境准备）

在**项目根目录**执行：

```bash
bash scripts/setup-server.sh
```

按提示输入服务器密码。脚本会在远端安装 Node 20、PM2 并创建 `/home/ubuntu/ai-product-ide`。

## 二、每次发布（同步代码并重启）

在**项目根目录**执行：

```bash
bash scripts/deploy.sh
```

会依次：rsync 同步代码 → 远端 `npm install --omit=dev` → `npm run build` → PM2 重启应用。首次会启动，之后为重启。

## 三、环境变量（API Key）

部署时会**同步本机项目根目录的 `.env.local`** 到服务器，因此只需在**本机**维护 `.env.local`（至少包含 `OPENAI_API_KEY=` 或您使用的 AI 提供商 key），执行 `bash scripts/deploy.sh` 后即可在远端生效。若需仅在服务器上修改而不被覆盖，可在部署后 SSH 到服务器编辑该文件，但下次部署会再次用本机内容覆盖。

## 四、自定义目标机

```bash
export DEPLOY_REMOTE="ubuntu@其他IP"
bash scripts/setup-server.sh   # 或 deploy.sh
```

## 五、常用 PM2 命令（在服务器上）

```bash
ssh ubuntu@62.234.29.171
pm2 status
pm2 logs ai-product-ide
pm2 restart ai-product-ide
```

应用默认监听 **3000** 端口，访问：`http://62.234.29.171:3000`。若需 HTTPS，可在该机安装 Nginx 并反代 3000。
