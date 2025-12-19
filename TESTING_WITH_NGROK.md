# 使用 ngrok 在本地测试 WayForPay Webhook

## 为什么需要 ngrok？

WayForPay 的服务器无法访问 `localhost:3000`，所以 webhook 永远不会被调用。
ngrok 可以创建一个公网 URL，将请求转发到你的本地服务器。

## 步骤

### 1. 安装 ngrok

```bash
# macOS
brew install ngrok

# 或者从官网下载
# https://ngrok.com/download
```

### 2. 启动你的 Next.js 开发服务器

```bash
npm run dev
```

### 3. 在另一个终端启动 ngrok

```bash
ngrok http 3000
```

你会看到类似这样的输出：

```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

### 4. 更新环境变量

在 `.env.local` 中临时更新：

```bash
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
```

### 5. 重启开发服务器

```bash
# 按 Ctrl+C 停止服务器
npm run dev
```

### 6. 进行支付测试

现在 serviceUrl 会是：
```
https://abc123.ngrok.io/api/webhooks/wayforpay
```

WayForPay 可以访问这个 URL 了！

## 注意事项

- ngrok 的免费版 URL 每次重启都会变化
- 每次 URL 变化都需要更新 NEXT_PUBLIC_APP_URL
- 测试完成后记得改回原来的配置

## 查看 webhook 日志

在 ngrok 控制台（http://127.0.0.1:4040）可以看到所有请求，包括 webhook！
