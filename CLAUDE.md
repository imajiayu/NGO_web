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
- ✅ **在线支付**: WayForPay 支付网关集成
- ✅ **实时更新**: 基于 Supabase 的实时数据同步
- ✅ **邮件通知**: Resend 自动发送捐赠确认邮件
- ✅ **捐赠追踪**: 用户可查询和追踪捐赠状态
- ✅ **管理员后台**: 项目管理、捐赠状态更新、配送管理
- ✅ **安全可靠**: 完整的 RLS 策略和签名验证

### 项目信息

**当前版本**: 1.1.0
**最后更新**: 2025-12-23
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

### 2. 捐赠流程

- 项目选择
- 捐赠表单填写
- WayForPay 在线支付
- 支付成功确认
- 邮件通知

### 3. 捐赠追踪

- 邮箱验证查询
- 捐赠状态实时更新
- 退款申请

### 4. 多语言支持

- 3 种语言（en/zh/ua）
- 动态语言切换
- 服务端渲染翻译

### 5. 管理员后台

- 管理员登录/登出
- 项目创建和编辑
- 捐赠状态管理
- 配送结果上传

---

## 数据库架构

### 核心表结构

#### `projects` - 项目表

存储所有 NGO 项目的信息和进度。

**关键字段**:
- `id` - 主键
- `project_name_i18n` - 多语言项目名称 (JSONB)
- `location_i18n` - 多语言地点 (JSONB)
- `target_units` - 目标单位数
- `current_units` - 当前完成单位数（自动更新）
- `unit_price` - 单位价格
- `status` - 项目状态 (planned/active/completed/paused)
- `description_i18n` - 多语言描述 (JSONB)

**状态流转**: planned → active → completed/paused

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

**状态流转**:
```
pending → paid → confirmed → delivering → completed
                    ↓
               refunding → refunded
```

### 数据库视图

| 视图名 | 用途 | 特性 |
|--------|------|------|
| `project_stats` | 项目统计信息 | 聚合捐赠总额、进度百分比 |
| `public_project_donations` | 公开捐赠列表 | 邮箱混淆保护隐私 |
| `order_donations_secure` | 订单捐赠查询 | 用于支付成功页面 |

### 核心数据库函数

| 函数名 | 用途 | 返回值 |
|--------|------|--------|
| `generate_donation_public_id()` | 生成唯一捐赠 ID | TEXT (如: 1-A1B2C3) |
| `get_donations_by_email_verified()` | 验证邮箱并查询捐赠 | TABLE |
| `request_donation_refund()` | 处理退款请求 | JSON |

### 安全机制

- ✅ **RLS (行级安全)**: 所有表启用 RLS 策略
- ✅ **双客户端模式**:
  - 常规客户端: 用户操作（强制 RLS）
  - 服务角色客户端: Webhook 操作（绕过 RLS）
- ✅ **邮箱混淆**: 公开视图中邮箱自动混淆（如: j***e@e***.com）
- ✅ **防枚举攻击**: 查询需要邮箱+捐赠ID双重验证

> 详细的数据库文档请参考: [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)

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
│   │   ├── privacy-policy/       # 隐私政策
│   │   └── public-agreement/     # 公开协议
│   ├── admin/                    # 管理员后台 (新增)
│   │   ├── layout.tsx            # 管理员布局
│   │   ├── login/                # 管理员登录
│   │   ├── projects/             # 项目管理
│   │   └── donations/            # 捐赠管理
│   ├── actions/                  # Server Actions
│   │   ├── admin.ts              # 管理员操作 (新增)
│   │   ├── donation.ts           # 捐赠创建
│   │   ├── donation-result.ts    # 捐赠结果查询
│   │   └── track-donation.ts     # 捐赠追踪
│   └── api/                      # API 路由
│       ├── webhooks/wayforpay/   # WayForPay 回调
│       └── donations/            # 捐赠查询 API
├── components/                   # React 组件
│   ├── admin/                    # 管理员组件 (新增)
│   ├── home/                     # 主页组件
│   ├── projects/                 # 项目组件
│   ├── donate/                   # 捐赠组件
│   └── ...                       # 其他组件
├── lib/                          # 工具库
│   ├── supabase/                 # Supabase 集成
│   │   └── admin-auth.ts         # 管理员认证 (新增)
│   ├── wayforpay/                # WayForPay 集成
│   ├── email/                    # 邮件服务
│   ├── validations.ts            # Zod 验证
│   ├── utils.ts                  # 工具函数
│   └── i18n-utils.ts             # 国际化工具
├── messages/                     # 翻译文件
│   ├── en.json                   # 英文
│   ├── zh.json                   # 中文
│   └── ua.json                   # 乌克兰语
├── types/                        # TypeScript 类型
│   ├── database.ts               # 数据库类型（自动生成）
│   └── index.ts                  # 应用类型
├── supabase/                     # Supabase 配置
│   └── migrations/               # 数据库迁移
├── docs/                         # 项目文档
│   ├── DATABASE_SCHEMA.md        # 数据库架构文档
│   └── UNUSED_DATABASE_FUNCTIONS.md
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
| `/[locale]/privacy-policy` | `privacy-policy/page.tsx` | 隐私政策 | 法律声明 |
| `/[locale]/public-agreement` | `public-agreement/page.tsx` | 公开协议 | 捐赠条款 |

### API 端点

| 端点 | 方法 | 用途 |
|------|------|------|
| `/api/webhooks/wayforpay` | POST | WayForPay 支付回调 |
| `/api/donations/order/[orderReference]` | GET | 查询订单的所有捐赠 |
| `/api/donations/project-public/[projectId]` | GET | 查询项目公开捐赠列表 |
| `/api/donate/success-redirect` | GET/POST | WayForPay 重定向处理 |

### 管理员页面 (新增)

| 路径 | 组件 | 功能 | 权限 |
|------|------|------|------|
| `/admin/login` | `admin/login/page.tsx` | 管理员登录 | 公开 |
| `/admin/projects` | `admin/projects/page.tsx` | 项目管理 | 需要登录 |
| `/admin/donations` | `admin/donations/page.tsx` | 捐赠管理 | 需要登录 |

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
| `actions/admin.ts` | `getAdminDonations()` | 获取所有捐赠 (新增) |
| `actions/admin.ts` | `updateDonationStatus()` | 更新捐赠状态 (新增) |

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
| ProjectProgressBar | 进度条组件 | Client Component |
| ProjectProgressCard | 进度卡片 | Client Component |
| ProjectDetailContent | 项目详情内容 | Client Component |
| ProjectSuppliesInfo | 项目物资信息 | Client Component |
| ProjectsGallery | 项目选择库 | Client Component |

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

---

## 业务流程

### 完整捐赠流程

```
1. 用户进入捐赠页面
   ↓
2. 选择项目
   ↓
3. 填写捐赠表单（姓名、邮箱、数量、可选信息）
   ↓
4. 提交表单 → Server Action: createWayForPayDonation()
   ↓
5. 验证项目状态和数量限制
   ↓
6. 为每个单位创建 pending 状态捐赠记录
   ↓
7. 生成支付参数和 MD5 签名
   ↓
8. 加载 WayForPay 支付小部件
   ↓
9. 用户完成支付
   ↓
10. WayForPay Webhook 回调 /api/webhooks/wayforpay
    ├─ 验证签名
    ├─ 更新捐赠状态为 paid
    └─ 发送确认邮件（Resend）
   ↓
11. 重定向到 /donate/success?order={orderReference}
   ↓
12. 成功页面轮询获取捐赠详情
   ↓
13. 展示捐赠 ID 和确认信息
```

### 捐赠状态转换

```
创建: pending (待支付)
  ↓ 用户支付成功
paid (已支付)
  ↓ NGO 确认
confirmed (已确认)
  ↓ 开始配送
delivering (配送中)
  ↓ 配送完成
completed (已完成)

退款流程:
paid/confirmed/delivering → refunding (退款中) → refunded (已退款)

支付失败:
pending → failed (支付失败)
```

### 捐赠追踪流程

```
1. 用户进入 /track-donation
   ↓
2. 输入邮箱和捐赠 ID
   ↓
3. 提交查询 → trackDonations() Server Action
   ↓
4. 调用数据库函数 get_donations_by_email_verified()
   ├─ 验证所有权（邮箱 + 捐赠 ID）
   └─ 防止枚举攻击
   ↓
5. 返回该邮箱的所有捐赠记录
   ↓
6. 展示捐赠列表（ID、项目、金额、状态、日期）
   ↓
7. 用户可选择申请退款
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
- ✅ **可编辑字段**: project_name, location, description, target_units, status 等
- ❌ **不可编辑字段**: id, created_at（触发器保护）
- ⚙️ **自动更新字段**: updated_at（触发器自动更新）

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

**状态转换规则**:

管理员只能执行以下状态转换：

| 当前状态 | 可转换为 | 说明 |
|---------|---------|------|
| `paid` | `confirmed` | 确认收款 |
| `confirmed` | `delivering` | 开始配送 |
| `delivering` | `completed` | 配送完成（需上传结果图片） |
| `refunding` | `refunded` | 完成退款 |

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

### 安全机制

#### 1. 数据库 RLS 策略

```
┌─────────────────────────────────────┐
│     匿名用户（anon key）             │
├─────────────────────────────────────┤
│ ✓ 读取项目                           │
│ ✓ 读取捐赠（视图混淆邮箱）            │
│ ✓ 插入待支付捐赠                      │
│ ✗ 更新捐赠状态                       │
│ ✗ 创建/编辑项目                      │
└─────────────────────────────────────┘

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
-- 保护: id, created_at

-- Donations 表触发器
CREATE TRIGGER prevent_donation_immutable_fields_trigger
BEFORE UPDATE ON donations
EXECUTE FUNCTION prevent_donation_immutable_fields();
-- 保护: id, donation_public_id, project_id,
--       donor_name, donor_email, amount,
--       order_reference, created_at
```

**好处**:
- ✅ 数据库级强制保护
- ✅ 即使 RLS 策略被绕过也无法修改
- ✅ 防止应用层错误

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
   - 目标单位数
   - 单位价格
   - 单位名称
   - 开始日期/结束日期
   ↓
5. 提交 → createProject() Server Action
   ↓
6. RLS 验证 is_admin()
   ↓
7. 插入数据库 → 触发器自动设置 created_at, updated_at
   ↓
8. 重新验证页面缓存
   ↓
9. 项目出现在公开主页
```

---

#### 捐赠状态管理流程

```
1. 用户完成支付 → 状态: pending
   ↓
2. Webhook 确认 → 状态: paid
   ↓
3. 管理员查看 /admin/donations
   ↓
4. 确认收款 → 点击"确认" → paid → confirmed
   ↓
5. 采购物资 → 点击"配送中" → confirmed → delivering
   ↓
6. 配送完成 → 上传照片 → 点击"完成"
   ↓
7. Server Action 验证:
   - delivering → completed ✅
   - 必须有 donation_result_url ✅
   ↓
8. 更新状态 → 状态: completed
   ↓
9. 用户通过捐赠追踪查看结果图片
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

#### 3. 测试完整流程

- ✅ 测试捐赠流程
- ✅ 测试 Webhook 接收
- ✅ 测试邮件发送
- ✅ 测试所有语言版本
- ✅ 测试捐赠追踪

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

**文档版本**: 1.1.0 (新增管理员功能文档)
**最后更新**: 2025-12-23
**维护者**: 开发团队
