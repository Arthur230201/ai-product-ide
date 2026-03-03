# Cursor 内置浏览器 MCP 访问 localhost 说明

## 现象

在 Agent 对话中使用 **cursor-ide-browser** 的 `browser_navigate` 打开 `http://localhost:3000` 时，工具经常返回 **`Error: Aborted`**，无法完成导航。

## 可能原因（推断）

1. **工具调用超时**：本地 dev 首次响应较慢（Next 编译等），MCP 或 Cursor 侧对单次工具调用有时间上限，超时后中止。
2. **安全/沙箱策略**：浏览器进程若在隔离环境内，可能限制访问本机环回地址（localhost/127.0.0.1）。
3. **实现侧中止**：某些情况下客户端或服务端主动中止未完成的导航。

官方文档中并未写明「禁止 localhost」，因此更可能是**超时**或**实现细节**导致。

## 可尝试的解决办法

### 1. 先保证 dev 已就绪再让 Agent 用浏览器

- 在本机先执行 `npm run dev`，等终端出现 “Ready” 且浏览器能正常打开 `http://localhost:3000`。
- 再在对话中让 Agent「用浏览器打开应用并操作」。
- 这样可减少「首次请求慢 → 导航超时 → Aborted」的情况。

### 2. 用隧道把 localhost 暴露为公网 URL（推荐）

若仍被中止，可把本机 3000 端口通过隧道暴露为 `https://xxx.ngrok.io` 等公网地址，让 MCP 浏览器访问该公网 URL（不访问 localhost），往往能绕过环回限制或超时问题。

**示例（ngrok）：**

```bash
# 安装 ngrok 后
ngrok http 3000
```

终端会给出类似 `https://xxxx.ngrok-free.app` 的地址。在对话中说明：

「请用浏览器打开 **https://xxxx.ngrok-free.app**（这是我把本机 3000 端口的隧道地址）」  
Agent 即可用 `browser_navigate` 打开该 URL 进行操作。

**其他隧道工具**：localhost.run、cloudflared 等，只要能把 `http://localhost:3000` 映射到公网 HTTPS 即可。

### 3. 向 Cursor 反馈

若希望从产品侧解决：

- 在 Cursor 设置 → **Tools & MCP** 中确认 **cursor-ide-browser** 已启用。
- 在 [Cursor 论坛](https://forum.cursor.com) 或反馈渠道说明：**browser_navigate 到 http://localhost:3000 经常返回 Aborted**，并注明 Cursor 版本与是否必现，便于官方排查超时或 localhost 策略。

### 4. 本项目的替代方案（不依赖 MCP 浏览器）

- **视口调试**：服务端会把最近一次 UI 生成的视口信息写入 `scripts/viewport-debug-last.json`。运行 `npm run viewport:read` 可查看服务端实际收到的视口。
- **桌面布局兜底**：当选择「桌面」时，服务端会对生成代码做桌面布局后处理（替换移动端根宽度等），减轻「选 PC 仍是一窄条」的问题。

---

**总结**：环境限制很可能来自工具超时或对 localhost 的访问策略；当前最稳妥的绕过方式是用 **ngrok 等隧道** 把 localhost 暴露为公网 URL，再让 Agent 用该 URL 操作浏览器。
