# iOS Payment Debugging Guide

## 问题描述 / Problem Description

在 iPhone 上无法拉起 WayForPay 支付窗口，显示 `donate.errors.paymentLoadFailed` 错误。

## 重要发现！🎯 Important Discovery

**WayForPay 在移动设备上的行为与桌面端不同：**

- **桌面浏览器**（包括 Mac Simulator）：使用**弹窗模式**（modal/popup）
- **真实移动设备**（iPhone/iPad）：使用**页面重定向**到 `https://secure.wayforpay.com/page?vkh=...`

**这是正常行为，不是错误！** 支付完成后，WayForPay 会自动跳转回 `returnUrl`。

## 已实施的修复方案 / Implemented Fixes

### 1. **添加缺失的翻译键**
- ✅ 在 `messages/en.json`、`messages/zh.json`、`messages/ua.json` 中添加了 `errors.paymentLoadFailed` 翻译
- 现在错误消息会正确显示，而不是显示键名

### 2. **增强错误处理和日志**
- ✅ 添加了详细的 console 日志记录，包括：
  - 设备信息（用户代理、平台、是否为 iOS）
  - 脚本加载状态
  - Widget 初始化步骤
  - 所有回调函数触发情况
- ✅ 添加了 15 秒脚本加载超时检测
- ✅ 添加了网络状态检测（检查 navigator.onLine）
- ✅ 针对 iOS 设备添加了特定的错误提示

### 3. **iOS 特定的调试功能**
- ✅ 自动检测 iOS 设备（包括 iPad 和使用触摸的 MacBook）
- ✅ 在错误消息中包含 iOS 特定的提示
- ✅ 添加了可展开的调试信息面板（仅在开发环境或出错时显示）
- ✅ 支持一键复制调试日志

### 4. **Content Security Policy (CSP) 配置**
- ✅ 在 `next.config.js` 中配置了 CSP 头部
- ✅ 明确允许 WayForPay 脚本加载：`https://secure.wayforpay.com`
- ✅ 允许必要的连接和框架嵌入

### 5. **移动端重定向支持** ⭐ 最新修复
- ✅ 自动检测移动设备（iOS）
- ✅ 在移动端显示"正在跳转到支付页面"的友好提示
- ✅ 不再将正常的页面跳转误判为错误
- ✅ 添加超时检测：如果 10 秒后仍未跳转，提示用户检查弹窗拦截器
- ✅ 完整的状态管理：加载中 → 正在跳转 → 已跳转或错误

## 移动端的预期行为 / Expected Mobile Behavior

### 正常的支付流程（iPhone）：

1. **用户填写捐赠表单并提交**
2. **页面显示"正在跳转到支付页面..."**
   - 蓝色背景的提示框
   - 旋转的加载图标
   - 提示信息："您即将跳转到 WayForPay 安全支付页面"
3. **页面自动跳转**到 `https://secure.wayforpay.com/page?vkh=...`
   - 这是 WayForPay 的安全支付页面
   - 用户在此页面完成支付
4. **支付完成后自动跳转回**你的网站 success 页面
   - URL: `/zh/donate/success?orderReference=...`

### 如果出现以下情况才是错误：

❌ 10 秒后仍显示"正在跳转"，没有实际跳转
❌ 显示红色错误消息："支付页面未打开"
❌ 显示："支付窗口加载失败"

### 可能需要的用户操作：

📱 **检查 Safari 设置**：
- 设置 > Safari > 阻止弹出式窗口 → **关闭**
- 设置 > Safari > 阻止跨网站跟踪 → **关闭**（可选）

🔄 **如果跳转被阻止**：
- Safari 地址栏可能显示弹窗拦截图标
- 点击允许跳转

## 如何在 iPhone 上测试 / How to Test on iPhone

### 步骤 1: 重启开发服务器
```bash
# 停止当前的开发服务器（Ctrl+C）
# 重新启动
npm run dev
```

### 步骤 2: 在 iPhone 上访问
1. 确保 iPhone 和开发机在同一 WiFi 网络
2. 找到开发机的 IP 地址（例如：192.168.1.100）
3. 在 iPhone Safari 中访问：`http://192.168.1.100:3000/zh/donate`

### 步骤 3: 查看调试信息

#### 方法 1: 使用 Safari 远程调试（推荐）
1. 在 Mac 上打开 Safari
2. Safari > Preferences > Advanced > 勾选 "Show Develop menu in menu bar"
3. 在 iPhone 上打开待测试页面
4. Mac Safari > Develop > [你的 iPhone] > [页面名称]
5. 查看 Console 面板，所有日志都有 `[WayForPay Debug]` 前缀

#### 方法 2: 使用页面内调试面板
1. 当出现错误时，页面底部会显示"调试信息"面板
2. 点击展开查看所有日志
3. 点击"复制调试信息"按钮
4. 将信息发送给开发者

### 步骤 4: 尝试支付流程
1. 选择项目
2. 填写捐赠信息
3. 提交表单
4. 观察支付窗口是否正常弹出

## 常见问题诊断 / Common Issues Diagnosis

### 问题 1: 脚本加载失败
**可能原因：**
- 网络连接不稳定
- DNS 解析问题
- 防火墙/VPN 阻止

**调试日志关键词：**
```
Script loading error
Script loading timeout (15s)
Device is offline
```

**解决方案：**
1. 检查网络连接是否稳定
2. 尝试关闭 VPN
3. 尝试切换到其他 WiFi 或使用移动数据

### 问题 2: window.Wayforpay 未定义
**可能原因：**
- 脚本已加载但对象未正确初始化
- 脚本被浏览器阻止

**调试日志关键词：**
```
WayForPay script loaded successfully
ERROR: window.Wayforpay is not defined
```

**解决方案：**
1. 检查 Safari 的内容拦截器是否启用
2. 在 iPhone Safari 设置中禁用"阻止跨网站跟踪"
3. 刷新页面重试

### 问题 3: iOS Safari 特有问题
**可能原因：**
- iOS Safari 的安全限制
- 弹窗被阻止
- 私密浏览模式

**调试日志关键词：**
```
iOS detected
isIOS: true
```

**解决方案：**
1. 确认不在私密浏览模式
2. 检查 Safari 设置 > 弹出式窗口阻止程序（应关闭）
3. 尝试在 Chrome 或 Firefox 浏览器测试

## 调试日志示例 / Debug Log Examples

### 正常流程日志：
```
[WayForPay Debug] Device: {"userAgent":"...","platform":"iPhone","isIOS":true,"online":true}
[WayForPay Debug] Starting payment widget initialization
[WayForPay Debug] Creating script element for WayForPay widget
[WayForPay Debug] Appending script to document body
[WayForPay Debug] WayForPay script loaded successfully
[WayForPay Debug] Initializing WayForPay widget
[WayForPay Debug] window.Wayforpay found, creating instance
[WayForPay Debug] WayForPay instance created successfully
[WayForPay Debug] Payment params: orderReference=DONATE-1-..., amount=100
[WayForPay Debug] wayforpay.run() called successfully
```

### 错误流程日志（脚本加载失败）：
```
[WayForPay Debug] Device: {"userAgent":"...","platform":"iPhone","isIOS":true,"online":true}
[WayForPay Debug] Starting payment widget initialization
[WayForPay Debug] Creating script element for WayForPay widget
[WayForPay Debug] Appending script to document body
[WayForPay Debug] Script loading error: [error details]
```

## 生产环境部署前检查 / Pre-Production Checklist

- [ ] 在真实 iPhone 设备上测试（不仅是模拟器）
- [ ] 在 iOS Safari 上测试
- [ ] 在 iOS Chrome 上测试
- [ ] 测试 WiFi 和移动数据两种网络
- [ ] 测试弱网络环境（可以使用 iOS 设置 > 开发者 > Network Link Conditioner）
- [ ] 禁用调试信息面板（仅在错误时显示，不在生产环境默认展开）
- [ ] 验证 CSP 头部在生产环境正确应用

## 需要收集的信息 / Information to Collect

如果问题仍然存在，请收集以下信息：

1. **设备信息：**
   - iOS 版本
   - Safari 版本
   - 设备型号（iPhone 13, iPhone 15 Pro 等）

2. **网络信息：**
   - WiFi 或移动数据
   - 网络提供商
   - 是否使用 VPN

3. **调试日志：**
   - 完整的调试信息面板内容
   - Safari 远程调试 Console 日志

4. **截图：**
   - 错误消息截图
   - Safari Console 截图

## 联系支持 / Contact Support

如果上述步骤无法解决问题，请将收集的信息发送到：
- GitHub Issue: [项目仓库链接]
- Email: [支持邮箱]

## 快速检查清单 / Quick Checklist

在报告问题之前，请确认：

- [ ] 我已经重启了开发服务器（`npm run dev`）
- [ ] 我在真实 iPhone 设备上测试（不是模拟器）
- [ ] 我看到了"正在跳转到支付页面..."的蓝色提示框
- [ ] Safari 的"阻止弹出式窗口"已关闭
- [ ] 我等待了至少 10 秒观察是否跳转
- [ ] 我检查了 Safari 控制台的调试日志
- [ ] 我复制了页面上的调试信息

## 预期的调试日志（正常流程）/ Expected Debug Logs (Normal Flow)

```
[WayForPay Debug] Device: {"userAgent":"...iPhone...","platform":"iPhone","isIOS":true,"online":true}
[WayForPay Debug] Starting payment widget initialization
[WayForPay Debug] Creating script element for WayForPay widget
[WayForPay Debug] Appending script to document body
[WayForPay Debug] WayForPay script loaded successfully
[WayForPay Debug] Initializing WayForPay widget
[WayForPay Debug] window.Wayforpay found, creating instance
[WayForPay Debug] WayForPay instance created successfully
[WayForPay Debug] Payment params: orderReference=DONATE-1-..., amount=100
[WayForPay Debug] Device is mobile: true
[WayForPay Debug] wayforpay.run() called successfully
[WayForPay Debug] Mobile device detected - expecting redirect to WayForPay page
然后页面应该跳转到 https://secure.wayforpay.com/page?vkh=...
```

---

**最后更新 / Last Updated:** 2025-12-20
**版本 / Version:** 2.0.0 - 添加移动端重定向支持
