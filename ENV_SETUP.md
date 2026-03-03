# 环境变量设置

## 必需的环境变量

可复制项目根目录的 `.env.example` 为 `.env.local`，再填写实际值。  
或在项目根目录直接创建 `.env.local` 文件，并添加以下内容：

```
OPENAI_API_KEY=your_openai_api_key_here
```

---

## 对接 reelxai.com / llmxapi.com（一码科技）

**本产品（AI Product IDE）使用 OpenAI 兼容接口**，可按以下方式对接 reelxai / llmxapi：

1. **接口地址（OpenAI 格式）**  
   原请求地址 `https://api.openai.com/v1` 替换为：
   - 主站：`https://reelxai.com/v1` 或 `https://llmxapi.com/v1`
   - 部分地区打不开可用备用：`https://hk.reelxai.com/v1` 或 `https://hk.llmxapi.com/v1`

2. **在 `.env.local` 中配置**  
   ```
   OPENAI_API_KEY=sk-你的key
   OPENAI_BASE_URL=https://reelxai.com/v1
   ```  
   若使用备用地址，将 `OPENAI_BASE_URL` 改为 `https://hk.reelxai.com/v1` 等即可。  
   （不写 `/v1` 也可，程序会自动补全。）

3. **可选：指定推荐模型**  
   在应用内「AI 配置」或通过环境变量指定模型 ID，例如：
   - 文本/通用：`gpt-5.2-2025-12-11`、`gpt-5.1-chat-2025-11-13`、`gemini-2.5-pro`、`gemini-3-flash-preview`
   - 视觉/多模态：与上述接口支持的 vision 模型一致即可  

   环境变量示例：
   ```
   NEXT_PUBLIC_AI_TEXT_MODEL=gpt-5.1-chat-2025-11-13
   NEXT_PUBLIC_AI_VISION_MODEL=gpt-5.1-chat-2025-11-13
   ```

3.1 **快速生成（Stitch 式）**  
   编辑栏默认是「快速预览」，会用**轻量模型**先出图；需要更好效果时再点「高质量」用大模型重生成。  
   若希望快速预览更快，可单独指定轻量模型（不设则默认 gpt-4o-mini）：
   ```
   NEXT_PUBLIC_AI_FAST_TEXT_MODEL=gemini-2.5-flash-nothinking
   NEXT_PUBLIC_AI_FAST_VISION_MODEL=gemini-2.5-flash-nothinking
   ```
   这样首屏出图更快，多页面连续生成也更顺畅。

4. **若 LLM 返回异常**  
   - 先确认 API Key 有效、余额充足（可到 https://query.llmxapi.com 查询）。  
   - 再尝试重试或更换推荐模型 ID。  
   - 若返回乱码，可在应用内将 Temperature 调低（如 0.7 以下）。

---

### 其他可选环境变量

如果你使用其他 OpenAI 兼容 API（如自建或别的代理），可设置：

```
OPENAI_BASE_URL=https://your-custom-api-url.com/v1
```

### 获取 OpenAI 官方 API Key（直连 OpenAI 时）

1. 访问 [OpenAI Platform](https://platform.openai.com/api-keys)
2. 登录你的账户
3. 创建新的 API Key
4. 将 API Key 复制到 `.env.local` 文件中

**注意**: `.env.local` 文件已被添加到 `.gitignore`，不会被提交到版本控制。

