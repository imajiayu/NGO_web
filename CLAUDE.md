# NGO 平台 - 项目技术文档

> 一个现代化的非政府组织(NGO)捐赠平台，支持多语言、在线支付和捐赠追踪

---

## 📋 目录

1. [项目概述](#项目概述)
2. [技术栈](#技术栈)
3. [核心功能](#核心功能)
4. [数据库架构](#数据库架构)
5. [应用架构](#应用架构)
6. [页面与路由](#页面与路由)
7. [组件目录](#组件目录)
8. [业务流程](#业务流程)
9. [国际化方案](#国际化方案)
10. [开发指南](#开发指南)
11. [部署说明](#部署说明)

---

## 项目概述

### 核心理念

这是一个以项目为中心的 NGO 捐赠平台，每个项目都是独立的实体，拥有自己的目标、进度和捐赠追踪系统。

### 主要特性

- ✅ **多语言支持**: 完整的中文、英文、乌克兰语支持
- ✅ **在线支付**: WayForPay 支付网关集成（支持完整支付流程状态）
- ✅ **实时更新**: 基于 Supabase 的实时数据同步
- ✅ **邮件通知**: Resend 自动发送捐赠确认邮件（支持多语言模板）
- ✅ **捐赠追踪**: 用户可查询和追踪捐赠状态（支持订单分组展示）
- ✅ **管理员后台**: 项目管理、捐赠状态更新、配送管理
- ✅ **智能图像处理**: Cloudinary 自动压缩优化 + AI 人脸隐私保护
- ✅ **灵活捐赠模式**: 支持物资捐赠（按单位拆分）和金额捐赠（聚合模式）
- ✅ **安全可靠**: 完整的 RLS 策略、签名验证和字段保护触发器
- ✅ **扩展状态系统**: 15 个捐赠状态，覆盖完整支付和退款流程
- ✅ **邮件订阅系统**: 支持用户订阅项目更新通知和管理员群发邮件 ✨ NEW
- ✅ **独立项目详情页**: 每个项目独立开发详情页，支持自定义内容和布局 ✨ NEW

### 项目信息

**当前版本**: 2.1.0
**最后更新**: 2026-01-04
**开发状态**: 生产就绪

---

## 技术栈

### 前端框架

- **Next.js 14** (App Router) - React 服务端渲染框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 原子化 CSS 框架
- **next-intl** - 国际化解决方案

### 后端服务

- **Supabase** - PostgreSQL 数据库 + 认证 + 实时订阅
- **WayForPay** - 乌克兰支付网关
- **Resend** - 邮件发送服务
- **Cloudinary** - 图像处理（压缩 + 人脸打码）

### 部署平台

- **Vercel** - 前端托管和边缘函数
- **Supabase Cloud** - 数据库托管

### 开发工具

- **ESLint** + **Prettier** - 代码规范
- **Git** - 版本控制

---

## 核心功能

### 1. 项目展示与管理

- 项目列表展示（网格视图）
- 项目详情页面
- 实时进度追踪
- 多语言项目信息
- **双模式支持**：物资项目（按单位计算）和打赏项目（聚合金额）

### 2. 捐赠流程

- 项目选择（支持搜索和筛选）
- **智能捐赠表单**：
  - 物资项目：数量选择 + 单位价格计算
  - 打赏项目：自定义金额输入
  - 可选小费功能
- WayForPay 在线支付
- 支付成功确认（轮询更新）
- 多语言邮件通知

### 3. 捐赠追踪

- 邮箱 + 捐赠 ID 双重验证查询
- 捐赠状态实时更新（15 个状态）
- 订单分组展示（同一订单的多个捐赠）
- 退款申请（通过 WayForPay API）
- 配送结果查看（图片展示）

### 4. 多语言支持

- 3 种语言（en/zh/ua）
- 动态语言切换
- 服务端渲染翻译

### 5. 管理员后台

- 管理员登录/登出
- 项目创建和编辑
- 捐赠状态管理
- 配送结果上传
- **邮件订阅管理** ✨ NEW
  - 查看所有订阅者列表
  - 按状态/语言筛选
  - 多选订阅者群发邮件
  - 邮件模板选择和预览

### 6. 邮件订阅系统 ✨ NEW

- **用户订阅**: 捐赠时可选择订阅项目更新
- **一键取消订阅**: 邮件底部取消订阅链接
- **多语言群发**: 根据用户语言偏好发送对应版本
- **模板管理**: 文件系统存储邮件模板

---

## 数据库架构

### 核心表结构

#### `projects` - 项目表

存储所有 NGO 项目的信息和进度。

**关键字段**:
- `id` - 主键
- `project_name_i18n` - 多语言项目名称 (JSONB)
- `location_i18n` - 多语言地点 (JSONB)
- `target_units` - 目标单位数（物资项目）或目标金额（打赏项目）
- `current_units` - 当前完成单位数（自动更新）
- `unit_price` - 单位价格（物资项目）
- `aggregate_donations` - **聚合标志** (TRUE=打赏模式, FALSE=物资模式) ✨ NEW
- `is_long_term` - 长期项目标志（无截止日期）
- `status` - 项目状态 (planned/active/completed/paused)
- `description_i18n` - 多语言描述 (JSONB)

**状态流转**: planned → active → completed/paused

**捐赠模式**:
- **物资模式** (`aggregate_donations = false`): 按单位拆分捐赠记录（如：10 个睡袋 = 10 条记录）
- **打赏模式** (`aggregate_donations = true`): 聚合为单条捐赠记录（如：$100 捐赠 = 1 条记录）

#### `donations` - 捐赠表

跟踪所有捐赠记录和支付详情。

**关键字段**:
- `id` - 主键
- `donation_public_id` - 公开捐赠 ID（格式：{项目ID}-{6位随机码}）
- `project_id` - 关联项目
- `donor_name` / `donor_email` - 捐赠者信息
- `amount` - 捐赠金额
- `order_reference` - WayForPay 订单号
- `donation_status` - 捐赠状态
- `locale` - 用户语言（en/zh/ua）

**状态流转** (15 个状态):
```
用户捐赠流程：
pending → processing → fraud_check → paid → confirmed → delivering → completed
   ↓           ↓           ↓
widget_load_failed    expired/declined

退款流程：
paid/confirmed/delivering → refunding → refund_processing → refunded

支付失败流程：
pending → failed/expired/declined
```

**状态分类**:
- **Pre-payment (支付前)**: pending, widget_load_failed
- **Processing (处理中)**: processing, fraud_check
- **Payment Complete (支付完成)**: paid, confirmed, delivering, completed
- **Payment Failed (支付失败)**: expired, declined, failed
- **Refund (退款)**: refunding, refund_processing, refunded

#### `email_subscriptions` - 邮件订阅表 ✨ NEW

存储用户邮件订阅信息，用于新项目通知群发。

**关键字段**:
- `id` - 主键
- `email` - 订阅者邮箱（唯一）
- `locale` - 语言偏好 (en/zh/ua)
- `is_subscribed` - 订阅状态
- `updated_at` - 最后更新时间

**特性**:
- 幂等订阅操作（重复订阅只更新语言）
- 软删除（取消订阅只修改状态）
- 管理员只读访问（修改通过函数）

### 数据库视图

| 视图名 | 用途 | 特性 |
|--------|------|------|
| `project_stats` | 项目统计信息 | 聚合捐赠总额、进度百分比、**支持 aggregate_donations 字段** |
| `public_project_donations` | 公开捐赠列表 | 邮箱混淆保护隐私、**包含 order_id 用于分组** |
| `order_donations_secure` | 订单捐赠查询 | 用于支付成功页面、包含 pending 状态 |

### 核心数据库函数

| 函数名 | 用途 | 返回值 |
|--------|------|--------|
| `generate_donation_public_id()` | 生成唯一捐赠 ID（项目范围） | TEXT (如: 1-A1B2C3) |
| `get_donations_by_email_verified()` | 验证邮箱并查询捐赠（**含 order_reference**） | TABLE |
| `is_admin()` | 检查当前用户是否为管理员 | BOOLEAN |
| `update_project_units()` | 自动更新项目进度（触发器函数） | TRIGGER |
| `prevent_donation_immutable_fields()` | 保护不可变字段 + **状态转换验证** | TRIGGER |
| `prevent_project_immutable_fields()` | 保护项目不可变字段（**含 aggregate_donations**） | TRIGGER |
| `upsert_email_subscription()` | 订阅或更新邮件订阅（幂等操作）✨ NEW | BIGINT |
| `unsubscribe_email()` | 取消邮件订阅 ✨ NEW | BOOLEAN |

### 安全机制

- ✅ **RLS (行级安全)**: 所有表启用 RLS 策略（14 个策略）
- ✅ **双客户端模式**:
  - 常规客户端: 用户操作（强制 RLS）
  - 服务角色客户端: Webhook 操作（绕过 RLS）
- ✅ **字段保护触发器**:
  - 保护项目不可变字段：id, created_at, aggregate_donations, is_long_term
  - 保护捐赠不可变字段：id, donation_public_id, project_id, donor_name, donor_email, amount, order_reference, created_at
- ✅ **状态转换验证**:
  - 管理员只能执行 3 个业务流程转换（paid→confirmed, confirmed→delivering, delivering→completed）
  - 退款状态由 WayForPay API 自动处理
  - 数据库触发器强制执行
- ✅ **邮箱混淆**: 公开视图中邮箱自动混淆（如: j***e@e***.com）
- ✅ **防枚举攻击**: 查询需要邮箱+捐赠ID双重验证
- ✅ **匿名用户限制**: 只能创建 pending 状态捐赠、更新为 widget_load_failed

> 详细的数据库文档请参考: [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) (38 个迁移文件)

---

## 应用架构

### 目录结构

```
NGO_web/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # 国际化路由
│   │   ├── page.tsx              # 主页
│   │   ├── donate/               # 捐赠流程
│   │   ├── track-donation/       # 捐赠追踪
│   │   ├── unsubscribed/         # 取消订阅成功页 ✨ NEW
│   │   ├── privacy-policy/       # 隐私政策
│   │   └── public-agreement/     # 公开协议
│   ├── admin/                    # 管理员后台
│   │   ├── layout.tsx            # 管理员布局
│   │   ├── login/                # 管理员登录
│   │   ├── projects/             # 项目管理
│   │   ├── donations/            # 捐赠管理
│   │   └── subscriptions/        # 邮件订阅管理 ✨ NEW
│   ├── actions/                  # Server Actions
│   │   ├── admin.ts              # 管理员操作
│   │   ├── donation.ts           # 捐赠创建
│   │   ├── donation-result.ts    # 捐赠结果查询
│   │   ├── track-donation.ts     # 捐赠追踪
│   │   ├── subscription.ts       # 邮件订阅 ✨ NEW
│   │   └── email-broadcast.ts    # 群发邮件 ✨ NEW
│   └── api/                      # API 路由
│       ├── webhooks/wayforpay/   # WayForPay 回调
│       ├── donations/            # 捐赠查询 API
│       └── unsubscribe/          # 取消订阅 API ✨ NEW
├── components/                   # React 组件
│   ├── admin/                    # 管理员组件
│   │   ├── SubscriptionsTable.tsx  # 订阅管理表格 ✨ NEW
│   │   └── BroadcastModal.tsx      # 群发邮件模态框 ✨ NEW
│   ├── home/                     # 主页组件
│   ├── projects/                 # 项目组件
│   │   ├── detail-pages/         # 项目详情页组件 ✨ NEW
│   │   │   ├── Project0/         # 项目0 详情组件
│   │   │   ├── Project3/         # 项目3 详情组件
│   │   │   └── index.ts          # 统一导出
│   │   ├── shared/               # 共享基础组件 ✨ NEW
│   │   │   ├── ProjectProgressBar.tsx
│   │   │   └── ProjectResultsMasonry.tsx
│   │   └── ...
│   ├── donate/                   # 捐赠组件
│   └── ...                       # 其他组件
├── lib/                          # 工具库
│   ├── supabase/                 # Supabase 集成
│   │   ├── admin-auth.ts         # 管理员认证
│   │   ├── queries.ts            # 数据库查询
│   │   └── server.ts             # 服务端客户端
│   ├── wayforpay/                # WayForPay 集成
│   ├── email/                    # 邮件服务
│   │   ├── templates/            # 邮件模板系统 ✨ NEW
│   │   │   ├── transactional/    # 事务性邮件
│   │   │   ├── broadcast/        # 群发邮件模板定义
│   │   │   ├── content/          # 群发邮件 HTML 内容
│   │   │   └── index.ts          # 模板加载器
│   │   └── broadcast.ts          # 群发邮件发送 ✨ NEW
│   ├── cloudinary.ts             # Cloudinary 图像处理
│   ├── validations.ts            # Zod 验证
│   ├── utils.ts                  # 工具函数
│   └── i18n-utils.ts             # 国际化工具
├── messages/                     # 翻译文件
│   ├── en.json                   # 英文
│   ├── zh.json                   # 中文
│   └── ua.json                   # 乌克兰语
├── public/content/projects/      # 项目内容 JSON ✨ NEW
│   ├── project-0-en.json         # 项目0 英文内容
│   ├── project-0-zh.json         # 项目0 中文内容
│   └── ...
├── types/                        # TypeScript 类型
│   ├── database.ts               # 数据库类型（自动生成）
│   └── index.ts                  # 应用类型
├── supabase/                     # Supabase 配置
│   └── migrations/               # 数据库迁移
├── docs/                         # 项目文档
│   ├── DATABASE_SCHEMA.md        # 数据库架构
│   ├── EMAIL_SUBSCRIPTION_DESIGN.md  # 邮件订阅设计 ✨ NEW
│   └── PROJECT_DETAIL_ARCHITECTURE.md # 项目详情架构 ✨ NEW
├── i18n/                         # 国际化配置
├── middleware.ts                 # Next.js 中间件
└── CLAUDE.md                     # 本文档
```

### 架构设计原则

1. **服务端优先**: 默认使用 React Server Components
2. **类型安全**: TypeScript 严格模式 + Zod 运行时验证
3. **国际化优先**: 所有文本支持多语言
4. **安全第一**: RLS + 签名验证 + 输入验证
5. **用户体验**: 实时更新 + 优化加载状态

---

## 页面与路由

### 公开页面

| 路径 | 组件 | 功能 | 特性 |
|------|------|------|------|
| `/[locale]/` | `page.tsx` | 主页 | 展示使命、项目、影响力 |
| `/[locale]/donate` | `donate/page.tsx` | 捐赠页面 | 项目选择 + 捐赠表单 |
| `/[locale]/donate/success` | `donate/success/page.tsx` | 支付成功页 | 展示捐赠详情 |
| `/[locale]/track-donation` | `track-donation/page.tsx` | 捐赠追踪 | 邮箱验证查询 |
| `/[locale]/unsubscribed` | `unsubscribed/page.tsx` | 取消订阅成功页 ✨ NEW | 确认取消订阅 |
| `/[locale]/privacy-policy` | `privacy-policy/page.tsx` | 隐私政策 | 法律声明 |
| `/[locale]/public-agreement` | `public-agreement/page.tsx` | 公开协议 | 捐赠条款 |

### API 端点

| 端点 | 方法 | 用途 |
|------|------|------|
| `/api/webhooks/wayforpay` | POST | WayForPay 支付回调 |
| `/api/donations/order/[orderReference]` | GET | 查询订单的所有捐赠 |
| `/api/donations/project-public/[projectId]` | GET | 查询项目公开捐赠列表 |
| `/api/donate/success-redirect` | GET/POST | WayForPay 重定向处理 |
| `/api/unsubscribe` | GET/POST | 取消邮件订阅 ✨ NEW |

### 管理员页面

| 路径 | 组件 | 功能 | 权限 |
|------|------|------|------|
| `/admin/login` | `admin/login/page.tsx` | 管理员登录 | 公开 |
| `/admin/projects` | `admin/projects/page.tsx` | 项目管理 | 需要登录 |
| `/admin/donations` | `admin/donations/page.tsx` | 捐赠管理 | 需要登录 |
| `/admin/subscriptions` | `admin/subscriptions/page.tsx` | 邮件订阅管理 ✨ NEW | 需要登录 |

### Server Actions

| 文件 | 主函数 | 用途 |
|------|--------|------|
| `actions/donation.ts` | `createWayForPayDonation()` | 创建捐赠并生成支付参数 |
| `actions/donation-result.ts` | `getDonationResultUrl()` | 获取捐赠结果图片 |
| `actions/track-donation.ts` | `trackDonations()` | 追踪捐赠记录 |
| `actions/track-donation.ts` | `requestRefund()` | 申请退款 |
| `actions/admin.ts` | `adminLogin()` | 管理员登录 (新增) |
| `actions/admin.ts` | `adminLogout()` | 管理员登出 (新增) |
| `actions/admin.ts` | `getAdminProjects()` | 获取所有项目 (新增) |
| `actions/admin.ts` | `createProject()` | 创建项目 (新增) |
| `actions/admin.ts` | `updateProject()` | 更新项目 (新增) |
| `actions/admin.ts` | `getAdminDonations()` | 获取所有捐赠 |
| `actions/admin.ts` | `updateDonationStatus()` | 更新捐赠状态 |
| `actions/subscription.ts` | `createEmailSubscription()` | 创建邮件订阅 ✨ NEW |
| `actions/subscription.ts` | `getSubscriptions()` | 获取订阅列表（管理员）✨ NEW |
| `actions/subscription.ts` | `getSubscriptionStats()` | 获取订阅统计 ✨ NEW |
| `actions/email-broadcast.ts` | `sendEmailBroadcast()` | 发送群发邮件 ✨ NEW |
| `actions/email-broadcast.ts` | `getAvailableBroadcastTemplates()` | 获取可用模板 ✨ NEW |
| `actions/email-broadcast.ts` | `previewEmailTemplate()` | 预览邮件模板 ✨ NEW |

---

## 组件目录

### 布局组件

| 组件 | 文件 | 功能 |
|------|------|------|
| Navigation | `Navigation.tsx` | 导航栏（Logo + 语言切换 + 操作按钮） |
| Footer | `Footer.tsx` | 页脚（社交链接 + 联系信息 + 政策链接） |

### 主页组件

位于 `components/home/` 目录:

| 组件 | 用途 |
|------|------|
| MissionSection | 使命宣言展示 |
| ApproachSection | 工作方法介绍 |
| ImpactSection | 影响力数据展示 |
| DonationJourneySection | 捐赠流程说明 |
| ComplianceSection | 合规信息展示 |

### 项目组件

位于 `components/projects/` 目录:

| 组件 | 用途 | 类型 |
|------|------|------|
| ProjectsGrid | 项目网格展示 | Server Component |
| ProjectCard | 项目卡片（完整模式） | Client Component |
| ProjectCardCompact | 项目卡片（紧凑模式） | Client Component |
| ProjectProgressCard | 进度卡片 | Client Component |
| ProjectsGallery | 项目选择库 | Client Component |
| ProjectResultsSection | 项目成果展示 | Client Component |

**项目详情页组件** (位于 `components/projects/detail-pages/`): ✨ NEW

| 组件 | 项目 | 说明 |
|------|------|------|
| Project0DetailContent | 项目0 (Way to Health) | 康复中心详情页 |
| Project3DetailContent | 项目3 (圣诞礼物) | 圣诞礼物计划详情页 |

每个项目独立开发详情页组件，支持自定义布局和内容。详见 [PROJECT_DETAIL_ARCHITECTURE.md](docs/PROJECT_DETAIL_ARCHITECTURE.md)

**共享组件** (位于 `components/projects/shared/`): ✨ NEW

| 组件 | 用途 |
|------|------|
| ProjectProgressBar | 进度条组件 |
| ProjectResultsMasonry | 瀑布流图片展示 |

### 捐赠组件

位于 `components/donate/` 和 `components/donation/` 目录:

| 组件 | 用途 | 关键功能 |
|------|------|----------|
| DonationFormCard | 捐赠表单 | 表单验证 + 调用 Server Action |
| DonationStatusFlow | 状态流程可视化 | 展示捐赠状态转换 |
| ProjectDonationList | 项目捐赠列表 | 展示公开捐赠记录 |
| DonationResultViewer | 捐赠结果查看器 | 展示配送完成照片 |
| ProjectSelector | 项目选择器 | 项目搜索和筛选 |

### 工具组件

| 组件 | 文件 | 用途 |
|------|------|------|
| CopyButton | `CopyButton.tsx` | 复制文本到剪贴板 |
| LanguageSwitcher | `LanguageSwitcher.tsx` | 语言切换下拉菜单 |

### 管理员组件 (新增)

位于 `components/admin/` 目录:

| 组件 | 用途 | 类型 |
|------|------|------|
| AdminNav | 管理员导航栏（登出按钮、页面导航） | Client Component |
| ProjectsTable | 项目列表表格（编辑、状态管理） | Client Component |
| ProjectEditModal | 项目编辑模态框（多语言表单） | Client Component |
| DonationsTable | 捐赠列表表格（状态更新） | Client Component |
| DonationEditModal | 捐赠编辑模态框（状态转换、结果上传） | Client Component |
| SubscriptionsTable | 订阅者列表（多选、群发）✨ NEW | Client Component |
| BroadcastModal | 群发邮件模态框（模板选择、预览）✨ NEW | Client Component |

---

## 业务流程

### 完整捐赠流程

```
1. 用户进入捐赠页面
   ↓
2. 选择项目（支持搜索和筛选）
   ↓
3. 填写捐赠表单
   ├─ 物资项目：选择数量（如：10 个睡袋）
   └─ 打赏项目：输入自定义金额（如：$100）
   ↓
4. 提交表单 → Server Action: createWayForPayDonation()
   ↓
5. 验证项目状态和数量/金额限制
   ├─ 物资项目：检查剩余单位数
   └─ 打赏项目：检查剩余目标金额
   ↓
6. 创建捐赠记录（pending 状态）
   ├─ 物资项目：为每个单位创建一条记录（10 个 = 10 条）
   └─ 打赏项目：创建单条聚合记录（$100 = 1 条）
   ↓
7. 生成支付参数和 MD5 签名
   ↓
8. 加载 WayForPay 支付小部件
   ↓
9. 用户完成支付
   ↓
10. WayForPay Webhook 回调 /api/webhooks/wayforpay
    ├─ 验证签名
    ├─ 更新捐赠状态（pending → paid/processing/fraud_check）
    ├─ 发送多语言确认邮件（Resend）
    └─ 触发器自动更新项目进度
   ↓
11. 重定向到 /donate/success?order={orderReference}
   ↓
12. 成功页面轮询获取捐赠详情（包含 pending 状态）
   ↓
13. 展示捐赠 ID、订单分组和确认信息
```

### 捐赠状态转换 (15 个状态)

```
正常流程：
pending (待支付)
  ↓ WayForPay 处理
processing (处理中)
  ↓ 反欺诈检查
fraud_check (审核中)
  ↓ 支付成功
paid (已支付)
  ↓ NGO 确认
confirmed (已确认)
  ↓ 开始配送
delivering (配送中)
  ↓ 配送完成
completed (已完成)

退款流程：
paid/confirmed/delivering
  ↓ 用户申请退款
refunding (退款中)
  ↓ WayForPay 处理
refund_processing (退款处理中)
  ↓ 退款完成
refunded (已退款)

支付失败流程：
pending
  ↓
widget_load_failed (窗口加载失败)
expired (支付超时)
declined (银行拒绝)
failed (其他失败)
```

**状态说明**:
- **管理员可修改**: paid → confirmed → delivering → completed
- **WayForPay 自动**: pending ↔ processing/fraud_check/expired/declined
- **退款系统**: refunding ↔ refund_processing → refunded
- **客户端错误**: pending → widget_load_failed

### 捐赠追踪流程

```
1. 用户进入 /track-donation
   ↓
2. 输入邮箱和捐赠 ID（任意一个即可）
   ↓
3. 提交查询 → trackDonations() Server Action
   ↓
4. 调用数据库函数 get_donations_by_email_verified()
   ├─ 验证所有权（邮箱 + 捐赠 ID）
   ├─ 防止枚举攻击（双重验证）
   └─ 返回 order_reference 用于分组
   ↓
5. 返回该邮箱的所有捐赠记录
   ↓
6. 前端按 order_reference 分组展示
   ├─ 同一订单的多个捐赠显示为一组
   ├─ 物资项目：显示数量和单位
   └─ 打赏项目：显示总金额
   ↓
7. 展示详细信息
   ├─ 捐赠 ID、项目名称、金额
   ├─ 当前状态（15 个状态之一）
   ├─ 更新时间（实时）
   └─ 配送结果图片（completed 状态）
   ↓
8. 用户可选择申请退款（调用 WayForPay API）
```

---

## 管理员功能

### 系统架构

管理员系统采用基于 Supabase Auth 的认证方案，只有管理员登录功能，无用户注册。

#### 认证逻辑

```
登录用户 = 管理员
判断依据: auth.uid() IS NOT NULL
```

**特点**:
- ✅ 简化的权限模型（只有管理员和匿名用户两种角色）
- ✅ 基于 Supabase RLS 的安全保护
- ✅ 数据库级字段保护（触发器）
- ✅ 应用层双重验证

### 功能模块

#### 1. 管理员登录

**路径**: `/admin/login`

**功能**:
- 邮箱 + 密码登录
- Session 持久化
- 登录失败提示

**实现**:
```typescript
// Server Action
await adminLogin(email, password)

// 底层使用 Supabase Auth
supabase.auth.signInWithPassword({ email, password })
```

**安全特性**:
- ✅ HTTPS 加密传输
- ✅ Session Cookie 保护
- ✅ 登录失败不泄露账户信息

---

#### 2. 项目管理

**路径**: `/admin/projects`

**功能**:
- 查看所有项目列表
- 创建新项目
- 编辑现有项目
- 更新项目状态

**权限控制**:
```sql
-- RLS 策略
CREATE POLICY "Admins can insert projects" ON projects
FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Admins can update projects" ON projects
FOR UPDATE TO authenticated USING (is_admin());
```

**字段保护**:
- ✅ **可编辑字段**: project_name_i18n, location_i18n, description_i18n, target_units, unit_price, status 等
- ❌ **不可编辑字段** (触发器保护):
  - `id` - 主键
  - `created_at` - 创建时间
  - `aggregate_donations` - 捐赠模式（创建后不可改）
  - `is_long_term` - 长期标志（创建后不可改）
- ⚙️ **自动更新字段**: updated_at, current_units（触发器自动更新）

**状态管理**:
```
planned (计划中)
  ↓
active (进行中)
  ↓
completed / paused (已完成/已暂停)
```

---

#### 3. 捐赠管理

**路径**: `/admin/donations`

**功能**:
- 查看所有捐赠记录（含完整信息）
- 更新捐赠状态
- 上传配送结果图片

**权限控制**:
```sql
-- 管理员可以查看所有捐赠
CREATE POLICY "Admins can view all donations" ON donations
FOR SELECT TO authenticated USING (is_admin());

-- 管理员可以更新捐赠状态
CREATE POLICY "Admins can update donation status" ON donations
FOR UPDATE TO authenticated USING (is_admin());
```

**状态转换规则** (数据库触发器强制执行):

管理员只能执行以下 3 个业务流程转换：

| 当前状态 | 可转换为 | 说明 |
|---------|---------|------|
| `paid` | `confirmed` | 确认收款 |
| `confirmed` | `delivering` | 开始配送 |
| `delivering` | `completed` | 配送完成（需上传结果图片） |

**禁止的转换** (由系统自动处理):
- `pending` → `paid/processing/fraud_check` - WayForPay Webhook
- `refunding` → `refund_processing` → `refunded` - WayForPay API
- 其他所有状态转换 - 防止管理员误操作

**字段保护**:
- ✅ **可编辑字段**: donation_status, donation_result_url
- ❌ **不可编辑字段**: id, donation_public_id, project_id, donor_name, donor_email, amount, order_reference, created_at（触发器保护）
- ⚙️ **自动更新字段**: updated_at（触发器自动更新）

**配送完成流程**:
1. 管理员将状态从 `delivering` 更新为 `completed`
2. 必须上传配送结果图片到 `donation-results` 存储桶
3. 图片 URL 存储在 `donation_result_url` 字段
4. 用户可通过捐赠追踪查看配送照片

---

#### 4. Storage 管理

**存储桶**: `donation-results`

**权限**:
```sql
-- 管理员拥有完整 CRUD 权限
- INSERT: 上传新文件
- SELECT: 查看文件列表
- UPDATE: 更新文件元数据
- DELETE: 删除文件
```

**使用场景**:
- 上传配送完成照片
- 管理项目进展图片
- 存储捐赠成果展示

**公开访问**:
- ✅ 所有用户可以查看（bucket.public = true）
- ❌ 只有管理员可以上传/删除

---

#### 5. 图像处理（Cloudinary）

**功能**: 自动优化上传的图片，保护隐私

**处理流程**:

```
管理员上传图片
  ↓
1. 上传到 Cloudinary（临时）
  ↓
2. 应用智能转换：
   • 人脸检测和打码（pixelate_faces:20）
   • 智能压缩（quality: auto:good）
   • 自动格式优化（f_auto）
   • 尺寸限制（最大 1920px 宽）
  ↓
3. 下载处理后的图片
  ↓
4. 上传到 Supabase Storage
  ↓
5. 删除 Cloudinary 临时文件
  ↓
6. 生成缩略图（300px 宽）
```

**技术实现**:

```typescript
// lib/cloudinary.ts
const transformedUrl = cloudinary.url(publicId, {
  transformation: [
    { effect: 'pixelate_faces:20' },        // 人脸打码
    { width: 1920, crop: 'limit' },         // 尺寸限制
    {
      quality: 'auto:good',                 // 智能压缩
      fetch_format: 'auto',                 // 自动格式
      flags: 'lossy'                        // 有损压缩
    }
  ]
})
```

**处理效果**:
- ✅ **文件大小**: 通常减少 50-80%（几 MB → 几百 KB）
- ✅ **隐私保护**: 自动检测并模糊人脸
- ✅ **画质保持**: auto:good 模式保持高质量
- ✅ **格式优化**: 现代浏览器使用 WebP，旧浏览器回退到 JPEG

**支持的文件类型**:
- **图片**: JPEG, PNG, GIF, WebP（自动处理）
- **视频**: MP4, MOV（直接上传，不处理）

**配置要求**:

环境变量:
```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**测试命令**:

```bash
# 测试 Cloudinary 功能
npm run test:cloudinary

# 需要：在项目根目录放置 test-image.jpg
# 输出：test-image-processed.{format}
```

**降级策略**:

如果 Cloudinary 未配置或处理失败，系统会自动回退：
1. **首选**: 使用 Sharp 库进行简单压缩（无人脸检测）
2. **最后**: 直接上传原图

这确保即使 Cloudinary 服务不可用，配送结果上传功能仍可正常工作。

**处理特性**:
- 🔁 **重试机制**: 最多重试 3 次（Cloudinary AI 转换需要时间）
- 📊 **进度日志**: 详细的处理日志便于调试
- 🎯 **智能退化**: 三层降级策略确保可用性
- 🗑️ **自动清理**: 处理完成后自动删除 Cloudinary 临时文件

**注意事项**:
- ⚠️ Cloudinary 免费计划限制：25GB 存储 + 25,000 次转换/月
- ⚠️ 人脸检测依赖 Cloudinary AI，首次处理可能需要 1-3 秒
- ⚠️ 视频文件不经过 Cloudinary 处理（直接上传）
- ⚠️ 建议为生产环境配置 Cloudinary 以获得最佳效果

---

### 安全机制

#### 1. 数据库 RLS 策略

```
┌─────────────────────────────────────────────┐
│     匿名用户（anon key）                     │
├─────────────────────────────────────────────┤
│ ✓ 读取项目                                   │
│ ✓ 读取捐赠（视图混淆邮箱）                    │
│ ✓ 插入待支付捐赠（仅 pending 状态）           │
│ ✓ 更新 pending → widget_load_failed          │
│ ✗ 更新其他捐赠状态                           │
│ ✗ 创建/编辑项目                              │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────┐
│   管理员（authenticated + is_admin）│
├─────────────────────────────────────┤
│ ✓ 读取所有数据（含敏感信息）          │
│ ✓ 创建项目                           │
│ ✓ 更新项目（字段受限）                │
│ ✓ 更新捐赠状态（状态转换受限）         │
│ ✓ 管理 Storage                      │
│ ✗ 删除项目/捐赠（无 DELETE 策略）     │
└─────────────────────────────────────┘
```

#### 2. 触发器保护

**防止修改不可变字段**:

```sql
-- Projects 表触发器
CREATE TRIGGER prevent_project_immutable_fields_trigger
BEFORE UPDATE ON projects
EXECUTE FUNCTION prevent_project_immutable_fields();
-- 保护字段:
--   • id, created_at
--   • aggregate_donations (捐赠模式，创建后不可改)
--   • is_long_term (长期标志，创建后不可改)

-- Donations 表触发器 + 状态转换验证
CREATE TRIGGER prevent_donation_immutable_fields_trigger
BEFORE UPDATE ON donations
EXECUTE FUNCTION prevent_donation_immutable_fields();
-- 保护字段:
--   • id, donation_public_id, project_id
--   • donor_name, donor_email, amount
--   • order_reference, created_at
-- 状态转换验证:
--   • 管理员只能执行: paid→confirmed, confirmed→delivering, delivering→completed
--   • 服务角色（Webhook）可以执行任意状态转换
```

**好处**:
- ✅ 数据库级强制保护（最高安全级别）
- ✅ 即使 RLS 策略被绕过也无法修改
- ✅ 防止应用层错误和管理员误操作
- ✅ 状态转换验证确保业务流程正确性

#### 3. 应用层验证

**Server Actions 双重检查**:

```typescript
// 1. 检查管理员权限
export async function updateProject(id: number, updates: ProjectUpdate) {
  await requireAdmin() // 抛出异常如果未登录

  // 2. 过滤不可变字段
  const { id: _, created_at, updated_at, ...safeUpdates } = updates

  // 3. 执行更新
  await supabase.from('projects').update(safeUpdates).eq('id', id)
}
```

**状态转换验证**:

```typescript
// 验证状态转换是否合法
const validTransitions: Record<string, string[]> = {
  refunding: ['refunded'],
  paid: ['confirmed'],
  confirmed: ['delivering'],
  delivering: ['completed'],
}

if (!validTransitions[currentStatus].includes(newStatus)) {
  throw new Error(`Invalid status transition: ${currentStatus} → ${newStatus}`)
}
```

---

### 管理员工作流程

#### 项目创建流程

```
1. 管理员登录 /admin/login
   ↓
2. 访问 /admin/projects
   ↓
3. 点击"创建项目"
   ↓
4. 填写项目信息（支持多语言）
   - 项目名称（en/zh/ua）
   - 地点（en/zh/ua）
   - 描述（en/zh/ua）
   - 🆕 选择捐赠模式（物资模式 vs 打赏模式）
   - 目标单位数（物资模式）或目标金额（打赏模式）
   - 单位价格（仅物资模式）
   - 单位名称（仅物资模式）
   - 开始日期/结束日期
   - 是否长期项目
   ↓
5. 提交 → createProject() Server Action
   ↓
6. RLS 验证 is_admin()
   ↓
7. 插入数据库
   ├─ 触发器自动设置 created_at, updated_at
   └─ aggregate_donations 和 is_long_term 创建后不可修改（触发器保护）
   ↓
8. 重新验证页面缓存
   ↓
9. 项目出现在公开主页（根据捐赠模式显示不同表单）
```

---

#### 捐赠状态管理流程

```
1. 用户完成支付 → 状态: pending
   ↓
2. Webhook 确认 → 状态: paid（可能经过 processing/fraud_check）
   ↓
3. 管理员查看 /admin/donations（可筛选状态、项目、日期）
   ↓
4. 确认收款 → 点击"确认" → paid → confirmed
   ↓
5. 采购物资 → 点击"配送中" → confirmed → delivering
   ↓
6. 配送完成 → 上传照片
   ├─ 上传到 Cloudinary
   ├─ AI 人脸检测和打码（pixelate_faces:20）
   ├─ 智能压缩（quality: auto:good）
   ├─ 下载处理后的图片
   └─ 上传到 Supabase Storage (donation-results bucket)
   ↓
7. 点击"完成" → Server Action 验证:
   - delivering → completed ✅
   - 必须有 donation_result_url ✅
   - 数据库触发器验证状态转换 ✅
   ↓
8. 更新状态 → 状态: completed
   ├─ 触发器自动更新 updated_at
   └─ 配送结果 URL 保存到 donation_result_url 字段
   ↓
9. 用户通过捐赠追踪查看结果图片（已经过隐私保护处理）
```

---

### 开发指南

#### 创建管理员账户

**步骤**:

1. 在 Supabase Dashboard 创建用户:
   ```
   Authentication → Users → Add User
   Email: admin@example.com
   Password: [secure-password]
   Email Confirm: ✓
   ```

2. 或使用 SQL:
   ```sql
   -- 注意：需要在 Supabase SQL Editor 中执行
   SELECT auth.admin_create_user(
     email := 'admin@example.com',
     password := 'secure-password',
     email_confirm := true
   );
   ```

3. 使用该账户登录 `/admin/login`

#### 本地测试管理员功能

```bash
# 1. 确保环境变量正确
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 2. 运行开发服务器
npm run dev

# 3. 访问管理员登录页
http://localhost:3000/admin/login

# 4. 使用测试管理员账户登录
```

---

## 国际化方案

### 支持的语言

| 代码 | 语言 | 文件 |
|------|------|------|
| `en` | 英文（默认） | `messages/en.json` |
| `zh` | 中文（简体） | `messages/zh.json` |
| `ua` | 乌克兰语 | `messages/ua.json` |

### 路由结构

```
/en/              → 英文主页
/zh/              → 中文主页
/ua/              → 乌克兰语主页
/en/donate        → 英文捐赠页面
/zh/donate        → 中文捐赠页面
...
```

### 翻译使用方式

#### Server Components (服务端组件)

```typescript
import { getTranslations } from 'next-intl/server'

export default async function Page() {
  const t = await getTranslations('namespace')
  return <h1>{t('title')}</h1>
}
```

#### Client Components (客户端组件)

```typescript
'use client'
import { useTranslations } from 'next-intl'

export default function Component() {
  const t = useTranslations('namespace')
  return <h1>{t('title')}</h1>
}
```

#### 动态内容（数据库 i18n 字段）

```typescript
import { getTranslatedText } from '@/lib/i18n-utils'

const projectName = getTranslatedText(
  project.project_name_i18n,
  locale,
  project.project_name // 后备值
)
```

### 翻译文件结构

```json
{
  "common": { "..." },
  "navigation": { "..." },
  "home": { "..." },
  "donate": { "..." },
  "donateSuccess": { "..." },
  "trackDonation": { "..." },
  "footer": { "..." },
  "metadata": { "..." }
}
```

---

## 开发指南

### 前置要求

- Node.js 18+
- npm 或 pnpm
- Git
- Supabase 账户
- WayForPay 商户账户
- Resend 账户

### 本地开发

#### 1. 克隆项目

```bash
git clone <repository-url>
cd NGO_web
```

#### 2. 安装依赖

```bash
npm install
# 或
pnpm install
```

#### 3. 配置环境变量

创建 `.env.local` 文件:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# WayForPay
WAYFORPAY_MERCHANT_ACCOUNT=your_merchant_account
WAYFORPAY_SECRET_KEY=your_secret_key

# Resend
RESEND_API_KEY=re_xxx...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Cloudinary (可选，但推荐用于图像处理和隐私保护)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 4. 运行数据库迁移

```bash
# 登录 Supabase
npx supabase login

# 链接项目
npx supabase link --project-ref your-project-ref

# 推送迁移
npx supabase db push
```

#### 5. 启动开发服务器

```bash
npm run dev
```

访问: http://localhost:3000

### 代码规范

#### TypeScript

- 使用严格模式
- 优先使用 Server Components
- 必要时才使用 Client Components（添加 `'use client'` 指令）

#### 组件编写

**Server Component 示例**:

```typescript
// app/[locale]/page.tsx
import { getTranslations } from 'next-intl/server'
import { getActiveProjects } from '@/lib/supabase/queries'

export default async function HomePage() {
  const t = await getTranslations('home')
  const projects = await getActiveProjects()

  return (
    <div>
      <h1>{t('title')}</h1>
      {/* ... */}
    </div>
  )
}
```

**Client Component 示例**:

```typescript
// components/DonationForm.tsx
'use client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

export default function DonationForm() {
  const t = useTranslations('donate')
  const [amount, setAmount] = useState(0)

  return <form>{/* ... */}</form>
}
```

#### Server Actions

```typescript
// app/actions/donation.ts
'use server'
import { z } from 'zod'

const schema = z.object({
  projectId: z.number(),
  amount: z.number().positive()
})

export async function createDonation(formData: FormData) {
  const data = schema.parse(Object.fromEntries(formData))
  // ... 业务逻辑
  return { success: true }
}
```

### 错误处理

#### 表单验证

```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('errors.invalidEmail')
})

try {
  const data = schema.parse(input)
} catch (err) {
  if (err instanceof z.ZodError) {
    setError(t(err.errors[0].message))
  }
}
```

#### API 错误处理

```typescript
try {
  const result = await createDonation(data)
} catch (err) {
  if (err instanceof Error) {
    console.error(err.message)
    setError(t('errors.serverError'))
  }
}
```

### 安全最佳实践

1. **永远不要在客户端使用 Service Role Key**
2. **所有用户输入必须验证** (使用 Zod)
3. **Webhook 必须验证签名**
4. **使用 RLS 保护数据库**
5. **公开 API 使用邮箱混淆视图**

---

## 部署说明

### Vercel 部署

#### 1. 推送代码到 GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

#### 2. 在 Vercel 导入项目

1. 访问 [vercel.com](https://vercel.com)
2. 点击 "Import Project"
3. 选择 GitHub 仓库
4. 配置项目名称

#### 3. 配置环境变量

在 Vercel 项目设置中添加所有环境变量:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
WAYFORPAY_MERCHANT_ACCOUNT
WAYFORPAY_SECRET_KEY
RESEND_API_KEY
RESEND_FROM_EMAIL
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

#### 4. 部署

点击 "Deploy" 开始部署。

### 部署后配置

#### 1. 配置 WayForPay Webhook

在 WayForPay 商户后台设置 Webhook URL:

```
https://yourdomain.com/api/webhooks/wayforpay
```

#### 2. 配置 Resend 域名

在 Resend 控制台:
1. 添加并验证域名
2. 配置 DNS 记录（SPF、DKIM、DMARC）

**DNS 记录示例**:

```
# SPF Record
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all

# DKIM Record (由 Resend 提供)
Type: TXT
Name: resend._domainkey
Value: [Resend 提供的值]

# DMARC Record
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

#### 3. 配置 Cloudinary（可选但推荐）

**注册 Cloudinary 账户**:

1. 访问 [cloudinary.com](https://cloudinary.com) 注册免费账户
2. 获取配置信息（Dashboard 首页）:
   - Cloud Name
   - API Key
   - API Secret

**配置环境变量**:

在 Vercel 项目设置中添加 Cloudinary 环境变量（已在步骤 3 添加）。

**功能说明**:

- ✅ **启用**: 自动压缩图片 + 人脸打码
- ❌ **未启用**: 直接上传原图（功能仍可正常使用）

**免费计划配额**:
- 25 GB 存储空间
- 25 GB 月流量
- 25,000 次转换/月

对于中小型 NGO，免费计划通常足够使用。

#### 4. 测试完整流程

- ✅ 测试捐赠流程
- ✅ 测试 Webhook 接收
- ✅ 测试邮件发送
- ✅ 测试所有语言版本
- ✅ 测试捐赠追踪
- ✅ 测试图片上传和处理（如已配置 Cloudinary）

---

## 附录

### 常见问题

#### Q: 如何添加新语言？

1. 在 `messages/` 目录创建新的语言文件（如 `fr.json`）
2. 在 `i18n/config.ts` 添加语言代码
3. 在 `middleware.ts` 添加语言支持
4. 更新 `LanguageSwitcher` 组件

#### Q: 如何更新数据库 schema？

1. 在 `supabase/migrations/` 创建新迁移文件
2. 运行 `supabase db push`
3. 更新 TypeScript 类型: `npx supabase gen types typescript`

#### Q: Webhook 签名验证失败？

检查:
1. `WAYFORPAY_SECRET_KEY` 是否正确
2. 签名字段顺序是否一致
3. 字段值是否有额外空格

#### Q: 邮件发送失败？

检查:
1. DNS 记录是否正确配置
2. `RESEND_API_KEY` 是否有效
3. 发件人邮箱是否已验证

### 相关文档

- [数据库架构详细文档](docs/DATABASE_SCHEMA.md)
- [未使用的数据库函数分析](docs/UNUSED_DATABASE_FUNCTIONS.md)
- [Supabase 官方文档](https://supabase.com/docs)
- [Next.js 14 文档](https://nextjs.org/docs)
- [next-intl 文档](https://next-intl-docs.vercel.app/)

### 技术支持

如有问题，请联系开发团队或在 GitHub 仓库提交 Issue。

---

**文档版本**: 1.2.0 (新增邮件订阅系统 + 项目详情页架构)
**最后更新**: 2026-01-04
**维护者**: 开发团队
