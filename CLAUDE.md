# NGO 平台 - 项目技术文档

> 一个现代化的非政府组织(NGO)捐赠平台，支持多语言、在线支付和捐赠追踪

---

## 重要提示：数据库相关事项

**在处理任何数据库相关任务前，请先阅读以下文件：**

1. **`docs/DATABASE_SCHEMA.md`** - 数据库架构概览文档
2. **`supabase/migrations/20260109000000_baseline.sql`** - 完整的数据库 schema 定义（包含所有表、函数、触发器、RLS 策略、索引、存储桶）

这两个文件包含了数据库的完整定义，是理解和修改数据库结构的权威来源。

---

## 项目概述

**当前版本**: 2.3.0
**最后提交**: e797c780e8e416ec6041827fc2956738fef3bdf9
**开发状态**: 生产就绪

### 主要特性

- 多语言支持 (en/zh/ua)
- WayForPay 支付网关集成
- Supabase 实时数据同步
- Resend 多语言邮件通知
- 捐赠追踪与订单分组
- 管理员后台（项目/捐赠/订阅管理）
- Cloudinary 图像处理 + 人脸隐私保护
- 物资捐赠（按单位拆分）和金额捐赠（聚合模式）
- 14 个捐赠状态，完整支付和退款流程
- 邮件订阅系统
- 捐赠状态审计追踪

---

## 技术栈

| 类型 | 技术 |
|------|------|
| 前端 | Next.js 14 (App Router), TypeScript, Tailwind CSS, next-intl |
| 后端 | Supabase (PostgreSQL + Auth), WayForPay, Resend, Cloudinary |
| 部署 | Vercel, Supabase Cloud |

---

## 数据库架构

> **完整定义**: `supabase/migrations/20260109000000_baseline.sql`
> **文档概览**: [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)

### 核心表

| 表 | 说明 |
|-----|------|
| `projects` | 项目信息和进度 |
| `donations` | 捐赠记录和支付详情 |
| `email_subscriptions` | 邮件订阅 |
| `donation_status_history` | 状态转换历史 |

### 捐赠状态 (14个)

| 分类 | 状态 |
|------|------|
| 支付前 | pending, widget_load_failed |
| 处理中 | processing, fraud_check |
| 已支付 | paid, confirmed, delivering, completed |
| 失败 | expired, declined, failed |
| 退款 | refunding, refund_processing, refunded |

**管理员可修改**: paid → confirmed → delivering → completed

### 数据库函数

**业务函数 (5个)**

| 函数 | 说明 |
|------|------|
| `generate_donation_public_id()` | 生成唯一捐赠 ID |
| `get_donations_by_email_verified()` | 验证邮箱并查询捐赠 |
| `is_admin()` | 检查管理员权限 |
| `upsert_email_subscription()` | 订阅或更新邮件 |
| `unsubscribe_email()` | 取消订阅 |

**触发器函数 (7个)**

| 函数 | 说明 |
|------|------|
| `update_updated_at_column()` | 自动更新 updated_at |
| `update_project_units()` | 更新项目单位数 |
| `prevent_project_immutable_fields()` | 保护项目不可变字段 |
| `prevent_donation_immutable_fields()` | 保护捐赠不可变字段 + 状态验证 |
| `update_email_subscription_updated_at()` | 订阅表 updated_at |
| `prevent_subscription_immutable_fields()` | 保护订阅 id |
| `log_donation_status_change()` | 记录状态历史 |

---

## 目录结构

```
NGO_web/
├── app/
│   ├── [locale]/                 # 国际化路由
│   │   ├── page.tsx              # 主页
│   │   ├── donate/               # 捐赠流程
│   │   │   └── success/          # 支付成功页
│   │   ├── track-donation/       # 捐赠追踪
│   │   ├── unsubscribed/         # 取消订阅页
│   │   ├── privacy-policy/       # 隐私政策
│   │   └── public-agreement/     # 公开协议
│   ├── admin/                    # 管理员后台
│   │   ├── login/                # 登录
│   │   ├── projects/             # 项目管理
│   │   ├── donations/            # 捐赠管理
│   │   └── subscriptions/        # 订阅管理
│   ├── actions/                  # Server Actions
│   │   ├── admin.ts              # 管理员操作
│   │   ├── donation.ts           # 捐赠创建
│   │   ├── donation-result.ts    # 结果查询
│   │   ├── track-donation.ts     # 追踪和退款
│   │   ├── subscription.ts       # 订阅操作
│   │   └── email-broadcast.ts    # 群发邮件
│   └── api/
│       ├── webhooks/wayforpay/   # 支付回调
│       ├── webhooks/resend-inbound/ # 邮件回调
│       ├── donations/            # 捐赠 API
│       ├── donate/success-redirect/ # 重定向
│       └── unsubscribe/          # 取消订阅
├── components/
│   ├── admin/                    # 管理员组件
│   ├── home/                     # 主页组件
│   ├── projects/                 # 项目组件
│   │   ├── detail-pages/         # 项目详情页
│   │   └── shared/               # 共享组件
│   ├── donate/                   # 捐赠表单
│   └── donation/                 # 捐赠展示
├── lib/
│   ├── supabase/                 # 数据库集成
│   ├── wayforpay/                # 支付集成
│   ├── email/                    # 邮件服务
│   │   ├── templates/            # 邮件模板
│   │   └── senders/              # 发送器
│   ├── cloudinary.ts             # 图像处理
│   ├── validations.ts            # Zod 验证
│   └── i18n-utils.ts             # 国际化工具
├── messages/                     # 翻译文件 (en/zh/ua)
├── public/content/projects/      # 项目内容 JSON
├── types/                        # TypeScript 类型
├── supabase/migrations/          # 1 个 baseline 迁移文件 (20260109000000_baseline.sql)
└── docs/DATABASE_SCHEMA.md       # 数据库架构文档
```

---

## 页面路由

### 公开页面

| 路径 | 功能 |
|------|------|
| `/[locale]/` | 主页 |
| `/[locale]/donate` | 捐赠页面 |
| `/[locale]/donate/success` | 支付成功 |
| `/[locale]/track-donation` | 捐赠追踪 |
| `/[locale]/unsubscribed` | 取消订阅确认 |
| `/[locale]/privacy-policy` | 隐私政策 |
| `/[locale]/public-agreement` | 公开协议 |

### API 端点

| 端点 | 方法 | 用途 |
|------|------|------|
| `/api/webhooks/wayforpay` | POST | 支付回调 |
| `/api/donations/order/[orderReference]` | GET | 订单捐赠查询 |
| `/api/donations/project-public/[projectId]` | GET | 项目公开捐赠 |
| `/api/donate/success-redirect` | GET/POST | 重定向处理 |
| `/api/unsubscribe` | GET/POST | 取消订阅 |

### 管理员页面

| 路径 | 功能 |
|------|------|
| `/admin/login` | 登录 |
| `/admin/projects` | 项目管理 |
| `/admin/donations` | 捐赠管理 |
| `/admin/subscriptions` | 订阅管理 |

---

## 组件

### 布局组件

| 组件 | 说明 |
|------|------|
| Navigation | 导航栏 |
| Footer | 页脚 |
| GlobalLoadingSpinner | 全局加载 |
| BottomSheet | 底部弹出层 |
| ImageLightbox | 图片灯箱 |

### 主页组件 (`components/home/`)

MissionSection, ApproachSection, ImpactSection, DonationJourneySection, ComplianceSection, ProjectResultsSection

### 项目组件 (`components/projects/`)

| 组件 | 说明 |
|------|------|
| ProjectsGrid | 项目网格 |
| ProjectCard | 项目卡片 |
| ProjectProgressCard | 进度卡片 |
| ProjectsGallery | 项目选择 |
| ProjectResultsSection | 成果展示 |
| ProjectResultsMarquee | 成果滚动 |
| ProjectStatusBadge | 状态徽章 |

**共享组件** (`shared/`): ProjectProgressBar, ProjectProgressSection, ProjectResultsMasonry

**详情页** (`detail-pages/`): Project0, Project3

### 捐赠组件 (`components/donation/`)

| 组件 | 说明 |
|------|------|
| DonationFormCard | 捐赠表单 |
| DonationStatusFlow | 状态流程 |
| DonationStatusBadge | 状态徽章 |
| ProjectDonationList | 捐赠列表 |
| DonationResultViewer | 结果查看 |
| ProjectSelector | 项目选择 |

### 管理员组件 (`components/admin/`)

| 组件 | 说明 |
|------|------|
| AdminNav | 导航栏 |
| ProjectsTable | 项目表格 |
| ProjectCreateModal | 创建项目 |
| ProjectEditModal | 编辑项目 |
| DonationsTable | 捐赠表格 |
| DonationEditModal | 编辑捐赠 |
| BatchDonationEditModal | 批量编辑 |
| DonationStatusProgress | 状态进度 |
| SubscriptionsTable | 订阅表格 |
| BroadcastModal | 群发邮件 |

### 工具组件

CopyButton

---

## Server Actions

| Action | 说明 |
|--------|------|
| `createWayForPayDonation()` | 创建捐赠 |
| `getDonationResultUrl()` | 获取结果图片 |
| `trackDonations()` | 追踪捐赠 |
| `requestRefund()` | 申请退款 |
| `adminLogin/Logout()` | 管理员认证 |
| `getAdminProjects/Donations()` | 获取数据 |
| `createProject/updateProject()` | 项目操作 |
| `updateDonationStatus()` | 更新状态 |
| `createEmailSubscription()` | 创建订阅 |
| `getSubscriptions()` | 获取订阅 |
| `sendEmailBroadcast()` | 群发邮件 |

---

## 业务流程

### 捐赠流程

```
1. 选择项目 → 2. 填写表单 → 3. createWayForPayDonation()
→ 4. 创建 pending 记录 → 5. 加载支付小部件
→ 6. 用户支付 → 7. Webhook 更新状态 → 8. 发送邮件
→ 9. 重定向成功页 → 10. 展示捐赠详情
```

### 管理员流程

```
paid → confirmed (确认收款)
→ delivering (开始配送)
→ completed (上传照片完成)
```

---

## 开发配置

### 环境变量

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# WayForPay
WAYFORPAY_MERCHANT_ACCOUNT=
WAYFORPAY_SECRET_KEY=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Cloudinary (可选)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# App
NEXT_PUBLIC_APP_URL=
```

### 本地开发

```bash
npm install
npm run dev
```

### 数据库迁移

```bash
supabase login
supabase link --project-ref <ref>
supabase db push
```

### 生成类型

```bash
supabase gen types typescript --linked > types/database.ts
```

---

## 安全机制

- RLS 策略保护所有表 (10个策略)
- Service Role 用于 Webhook 和管理员操作
- 触发器保护不可变字段
- 状态转换数据库级验证
- 邮箱混淆保护隐私
- 双重验证防枚举攻击

---

## 国际化

支持 3 种语言: `en` (英文), `zh` (中文), `ua` (乌克兰语)

```typescript
// Server Component
const t = await getTranslations('namespace')

// Client Component
const t = useTranslations('namespace')

// 数据库 i18n 字段
getTranslatedText(project.project_name_i18n, locale, fallback)
```

---

## 部署

1. 推送到 GitHub
2. Vercel 导入项目
3. 配置环境变量
4. 部署

### 部署后配置

- WayForPay Webhook: `https://domain.com/api/webhooks/wayforpay`
- Resend 域名验证 (SPF, DKIM, DMARC)
- Cloudinary 配置 (可选)

---

## 相关文档

- [数据库架构](docs/DATABASE_SCHEMA.md)
- [Supabase 文档](https://supabase.com/docs)
- [Next.js 14 文档](https://nextjs.org/docs)
- [next-intl 文档](https://next-intl-docs.vercel.app/)

---

**文档版本**: 2.4.0
**最后更新**: 2026-01-09
