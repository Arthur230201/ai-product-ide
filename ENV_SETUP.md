# 环境变量设置

## 必需的环境变量

在项目根目录创建 `.env.local` 文件，并添加以下内容：

```
OPENAI_API_KEY=your_openai_api_key_here
```

### 可选的环境变量

如果你使用自定义的 OpenAI 兼容 API（如本地部署的模型或其他服务），可以添加：

```
OPENAI_BASE_URL=https://your-custom-api-url.com/v1
```

### 获取 OpenAI API Key

1. 访问 [OpenAI Platform](https://platform.openai.com/api-keys)
2. 登录你的账户
3. 创建新的 API Key
4. 将 API Key 复制到 `.env.local` 文件中

**注意**: `.env.local` 文件已被添加到 `.gitignore`，不会被提交到版本控制。

