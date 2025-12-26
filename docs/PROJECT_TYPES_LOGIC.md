# 项目类型逻辑文档

> 本文档详细说明了 NGO 平台中不同项目类型的展示、检查和提交逻辑
>
> **版本**: 2.0.0
> **更新日期**: 2025-12-26

---

## 📋 目录

1. [项目类型维度](#项目类型维度)
2. [四种项目类型详解](#四种项目类型详解)
3. [数据库字段含义](#数据库字段含义)
4. [前端展示逻辑](#前端展示逻辑)
5. [捐赠表单逻辑](#捐赠表单逻辑)
6. [后端检查逻辑](#后端检查逻辑)
7. [数据库记录创建逻辑](#数据库记录创建逻辑)
8. [完整流程示例](#完整流程示例)

---

## 项目类型维度

项目通过两个独立的 boolean 字段进行分类:

| 字段 | 类型 | 说明 |
|------|------|------|
| `is_long_term` | boolean | 长期项目: `true` / 非长期项目: `false` |
| `aggregate_donations` | boolean | 聚合模式: `true` / 非聚合模式: `false` |

**四种组合类型**:

```
┌─────────────────────┬──────────────────┬──────────────────┐
│                     │   非聚合模式      │    聚合模式       │
│                     │ (aggregate=false) │ (aggregate=true) │
├─────────────────────┼──────────────────┼──────────────────┤
│ 长期项目            │   类型 1         │   类型 2         │
│ (is_long_term=true) │                  │                  │
├─────────────────────┼──────────────────┼──────────────────┤
│ 非长期项目          │   类型 3         │   类型 4         │
│ (is_long_term=false)│                  │                  │
└─────────────────────┴──────────────────┴──────────────────┘
```

---

## 四种项目类型详解

### 类型 1: 长期 + 非聚合

**特点**: 持续募集固定单位的物资,无明确结束时间

**实际案例**: 康复中心持续支持项目 (Project ID: 0)
- 持续为康复中心提供医疗包
- 每个医疗包单价固定: $15.00
- 用户捐赠整数单位: 1包、2包、5包...

**字段配置**:
```json
{
  "is_long_term": true,
  "aggregate_donations": false,
  "target_units": null,          // 无目标限制
  "unit_price": 15.00,
  "unit_name": "medical kit"
}
```

#### 展示逻辑

**项目卡片** (`ProjectCard.tsx`):
- ✅ 显示 "长期项目" 标签
- ✅ 显示单价: `$15.00 / medical kit`
- ✅ 显示开始日期
- ❌ **不显示**结束日期
- ❌ **不显示**进度条 (无目标)
- ✅ **额外显示**: 当前已募集单位数 `Current Units: X kits`
- ✅ 显示捐赠总额和捐赠次数

**代码位置**: `ProjectCard.tsx:161-169`
```typescript
{/* Show current units for long-term NON-aggregated projects */}
{project.is_long_term === true && !project.aggregate_donations && (
  <div className="flex justify-between text-sm mb-2">
    <span className="text-gray-600">Current Units</span>
    <span className="font-semibold text-blue-600">
      {currentUnits} {unitName}
    </span>
  </div>
)}
```

#### 捐赠表单

**输入方式**: 数量选择器 (整数)
- 快捷选择: 1, 2, 5, 10
- 自定义输入: 最小 1, 最大 999

**金额计算**: `金额 = unit_price × quantity`

**表单字段** (`DonationFormCard.tsx:544-631`):
```typescript
{/* Unit-based Project: Quantity Selection */}
<input
  type="number"
  min="1"
  max="999"
  value={quantity}
  // ...防止小数输入
/>
<div className="p-2.5 bg-blue-50 rounded-lg">
  <span>项目总额: ${projectAmount.toFixed(2)} USD</span>
</div>
```

#### 提交数据

```typescript
{
  project_id: 0,
  quantity: 5,              // 用户选择的数量
  amount: undefined,        // 不传递
  donor_name: "John Doe",
  donor_email: "john@example.com",
  // ... 其他字段
}
```

#### 后端检查逻辑

**文件**: `app/actions/donation.ts:78-120`

```typescript
// 长期项目 - 无数量限制
if (!project.is_long_term) {
  // ... 检查逻辑 (长期项目跳过)
}

// 计算金额
projectAmount = unitPrice * validated.quantity  // $15.00 × 5 = $75.00

// 总金额限制检查 (RLS 策略)
if (totalAmount > 10000) {
  // 错误: 超过 $10,000 限制
}
```

**检查项**:
- ✅ 项目必须为 `active` 状态
- ✅ 总金额不超过 $10,000 (RLS 策略限制)
- ❌ **不检查**数量限制 (长期项目无上限)

#### 数据库记录创建

**每个单位创建一条记录** (`donation.ts:209-237`)

示例: 用户捐赠 5 个医疗包,创建 **5 条** 记录:

```javascript
// 循环创建 5 条记录
for (let i = 0; i < 5; i++) {
  donationRecords.push({
    donation_public_id: '0-A1B2C3',  // 每条不同
    order_reference: 'DONATE-0-1703...',  // 相同
    project_id: 0,
    amount: 15.00,  // 单价
    // ...
  })
}
```

**结果**:
- `donations` 表插入 5 行
- 每行 `amount = $15.00`
- 共享同一个 `order_reference`

---

### 类型 2: 长期 + 聚合

**特点**: 持续募集资金,用户自定义金额,无明确结束时间

**实际案例**: 通用捐赠基金、应急响应基金

**字段配置**:
```json
{
  "is_long_term": true,
  "aggregate_donations": true,
  "target_units": null,          // 无目标
  "unit_price": 1.00,            // 象征性单价
  "unit_name": "USD"
}
```

#### 展示逻辑

**项目卡片**:
- ✅ 显示 "长期项目" 标签
- ✅ 显示: **"任意金额"** (Any Amount / 任意金额 / Будь-яка сума)
- ✅ 显示开始日期
- ❌ **不显示**结束日期
- ❌ **不显示**进度条 (长期 + 无目标)
- ❌ **不显示** "Current Units" (聚合模式下单位数无意义)
- ✅ 显示捐赠总额和捐赠次数

**代码位置**: `ProjectCard.tsx:125-134`
```typescript
{project.aggregate_donations ? (
  <span className="text-sm font-semibold text-purple-700">
    {locale === 'en' ? 'Any Amount' : locale === 'zh' ? '任意金额' : 'Будь-яка сума'}
  </span>
) : (
  <span className="text-sm text-gray-700">
    <span className="font-semibold text-gray-900">${(project.unit_price || 0).toFixed(2)}</span>
    {' '}{t('perUnit', { unitName })}
  </span>
)}
```

#### 捐赠表单

**输入方式**: 金额输入框 (支持小数)
- 快捷选择: $10, $50, $100, $500
- 自定义输入: 最小 $0.1, 最大 $10,000

**金额计算**: `金额 = 用户输入的金额`

**表单字段** (`DonationFormCard.tsx:456-543`):
```typescript
{/* Aggregated Project: Direct Amount Input */}
<input
  type="number"
  min="0.1"
  max="10000"
  step="0.1"
  value={donationAmount}
  // ...
/>
<div className="p-2.5 bg-blue-50 rounded-lg">
  <span>项目总额: ${projectAmount.toFixed(2)} USD</span>
</div>
```

#### 提交数据

```typescript
{
  project_id: 5,
  quantity: 1,              // 固定为 1
  amount: 250.50,           // 用户输入的金额
  donor_name: "Jane Smith",
  donor_email: "jane@example.com",
  // ... 其他字段
}
```

#### 后端检查逻辑

**文件**: `app/actions/donation.ts:59-75`

```typescript
if (project.aggregate_donations) {
  // 聚合项目: 使用传入的金额
  if (!validated.amount || validated.amount <= 0) {
    return { success: false, error: 'server_error' }
  }
  projectAmount = validated.amount  // 直接使用用户输入
}

// 长期项目 - 跳过数量限制检查
if (!project.is_long_term) {
  // ... 检查逻辑 (长期项目跳过)
}
```

**检查项**:
- ✅ 项目必须为 `active` 状态
- ✅ `amount` 必须 > 0 且 <= $10,000
- ✅ 总金额不超过 $10,000
- ❌ **不检查**目标金额限制 (长期项目)

#### 数据库记录创建

**创建 1 条聚合记录** (`donation.ts:181-207`)

示例: 用户捐赠 $250.50,创建 **1 条** 记录:

```javascript
donationRecords.push({
  donation_public_id: '5-X7Y8Z9',
  order_reference: 'DONATE-5-1703...',
  project_id: 5,
  amount: 250.50,  // 用户输入的完整金额
  // ...
})
```

**结果**:
- `donations` 表插入 **1 行**
- `amount = $250.50` (完整金额)

---

### 类型 3: 非长期 + 非聚合

**特点**: 有明确目标和结束日期,按固定单位募集

**实际案例**: 乌克兰冬季医疗包项目
- 目标: 募集 100 个医疗包
- 单价: $85.00 / 包
- 截止日期: 2025-02-28

**字段配置**:
```json
{
  "is_long_term": false,
  "aggregate_donations": false,
  "target_units": 100,          // 目标 100 个单位
  "unit_price": 85.00,
  "unit_name": "medical kit",
  "end_date": "2025-02-28"
}
```

#### 展示逻辑

**项目卡片**:
- ❌ **不显示** "长期项目" 标签
- ✅ 显示单价: `$85.00 / medical kit`
- ✅ 显示开始日期
- ✅ **显示**结束日期: `2025-02-28`
- ✅ **显示**进度条: `45 / 100 medical kits (45.0%)`
- ✅ 显示捐赠总额和捐赠次数

**进度条逻辑** (`ProjectCard.tsx:180-188`, `ProjectProgressBar.tsx`):
```typescript
{/* Progress Bar - Only for fixed-term projects with valid targets */}
{project.is_long_term !== true && showProgress && hasValidTarget && (
  <ProjectProgressBar
    current={currentUnits}      // 45
    target={targetUnits}        // 100
    unitName={unitName}         // "medical kit"
    showAsAmount={false}        // 显示为单位数,不是金额
  />
)}
```

**进度条显示**:
```
45 / 100 medical kits        45.0%
████████████░░░░░░░░░░░░░░░
```

#### 捐赠表单

**输入方式**: 数量选择器 (整数)
- 快捷选择: 1, 2, 5, 10
- 自定义输入: 最小 1, 最大 999

**金额计算**: `金额 = unit_price × quantity`

#### 提交数据

```typescript
{
  project_id: 3,
  quantity: 10,             // 用户选择的数量
  amount: undefined,        // 不传递
  donor_name: "Bob Lee",
  donor_email: "bob@example.com",
  // ... 其他字段
}
```

#### 后端检查逻辑

**文件**: `app/actions/donation.ts:96-118`

```typescript
// 非聚合项目的非长期检查
if (!project.is_long_term) {
  if (!project.aggregate_donations) {
    // 检查 1: 数量不超过剩余单位
    const remainingUnits = (project.target_units || 0) - (project.current_units || 0)
    // 假设: target=100, current=45, remaining=55
    if (validated.quantity > remainingUnits) {
      return {
        success: false,
        error: 'quantity_exceeded',
        remainingUnits: 55,  // 返回剩余数量
        unitName: 'medical kit'
      }
    }

    // 检查 2: 总金额不超过 $10,000 (RLS 策略限制)
    const totalAmount = unitPrice * validated.quantity
    // 假设: $85.00 × 10 = $850.00 ✅
    if (totalAmount > 10000) {
      const maxQuantity = Math.floor(10000 / unitPrice)  // floor(10000/85) = 117
      return {
        success: false,
        error: 'amount_limit_exceeded',
        maxQuantity,
        unitName: 'medical kit'
      }
    }
  }
}
```

**检查项**:
- ✅ 项目必须为 `active` 状态
- ✅ 捐赠数量 <= 剩余单位数 (`remainingUnits = target_units - current_units`)
- ✅ 总金额 <= $10,000 (单次捐赠限制)

**错误场景**:

1. **超过剩余单位**:
   ```javascript
   // 剩余 55 个,用户输入 60
   {
     success: false,
     error: 'quantity_exceeded',
     remainingUnits: 55,
     unitName: 'medical kit'
   }
   ```

2. **超过金额限制**:
   ```javascript
   // 用户输入 120 个 ($85 × 120 = $10,200)
   {
     success: false,
     error: 'amount_limit_exceeded',
     maxQuantity: 117,  // floor(10000/85)
     unitName: 'medical kit'
   }
   ```

#### 数据库记录创建

**每个单位创建一条记录** (与类型 1 相同)

示例: 用户捐赠 10 个医疗包,创建 **10 条** 记录:

```javascript
for (let i = 0; i < 10; i++) {
  donationRecords.push({
    donation_public_id: '3-D4E5F6',  // 每条不同
    order_reference: 'DONATE-3-1703...',
    project_id: 3,
    amount: 85.00,  // 单价
    // ...
  })
}
```

**结果**:
- `donations` 表插入 10 行
- `current_units` 自动从 45 增加到 55 (触发器更新)
- 进度更新为: `55 / 100 (55.0%)`

---

### 类型 4: 非长期 + 聚合

**特点**: 有明确目标金额和结束日期,用户自定义捐赠金额

**实际案例**: 特定筹款活动、紧急救援募捐
- 目标: 募集 $50,000
- 截止日期: 2025-03-15
- 用户可捐赠任意金额

**字段配置**:
```json
{
  "is_long_term": false,
  "aggregate_donations": true,
  "target_units": 50000,        // ⚠️ target_units 表示目标金额 (USD)
  "unit_price": 1.00,           // 象征性单价
  "unit_name": "USD",
  "end_date": "2025-03-15"
}
```

**⚠️ 重要**: 对于聚合模式的非长期项目,`target_units` **不是单位数**,而是**目标金额** (单位: USD)

#### 展示逻辑

**项目卡片**:
- ❌ **不显示** "长期项目" 标签
- ✅ 显示: **"任意金额"** (Any Amount)
- ✅ 显示开始日期
- ✅ **显示**结束日期: `2025-03-15`
- ✅ **显示**进度条: `$35,000 / $50,000 (70.0%)`
- ✅ 显示捐赠总额和捐赠次数

**进度条逻辑** (`ProjectProgressBar.tsx:24-37`):
```typescript
{/* Progress Bar for aggregated fixed-term projects */}
{project.is_long_term !== true && hasValidTarget && (
  <ProjectProgressBar
    current={currentUnits}      // 35000 (实际是 total_raised)
    target={targetUnits}        // 50000 (目标金额)
    unitName={unitName}         // "USD"
    showAsAmount={true}         // ⚠️ 重要: 显示为金额
  />
)}
```

**进度条显示**:
```typescript
// showAsAmount = true
$35,000 / $50,000            70.0%
██████████████████░░░░░░░░░
```

**代码位置**: `ProjectProgressBar.tsx:24-33`
```typescript
{showAsAmount ? (
  <>
    ${current.toLocaleString()} / ${target.toLocaleString()}
  </>
) : (
  <>
    {current} / {target} {unitName}
  </>
)}
```

#### 捐赠表单

**输入方式**: 金额输入框 (支持小数)
- 快捷选择: $10, $50, $100, $500
- 自定义输入: 最小 $0.1, 最大 $10,000

**金额计算**: `金额 = 用户输入的金额`

#### 提交数据

```typescript
{
  project_id: 7,
  quantity: 1,              // 固定为 1
  amount: 500.00,           // 用户输入的金额
  donor_name: "Alice Wang",
  donor_email: "alice@example.com",
  // ... 其他字段
}
```

#### 后端检查逻辑

**文件**: `app/actions/donation.ts:78-94`

```typescript
// 非长期 + 聚合项目的特殊检查
if (!project.is_long_term) {
  if (project.aggregate_donations) {
    // ⚠️ 关键: target_units 表示目标金额 (not units!)
    const targetAmount = project.target_units || 0  // $50,000
    const currentAmount = project.total_raised || 0  // $35,000
    const remainingAmount = targetAmount - currentAmount  // $15,000

    if (projectAmount > remainingAmount) {
      return {
        success: false,
        error: 'amount_limit_exceeded',
        maxQuantity: Math.floor(remainingAmount),  // $15,000
        unitName: 'USD'
      }
    }
  }
}
```

**检查项**:
- ✅ 项目必须为 `active` 状态
- ✅ 捐赠金额 <= 剩余目标金额
- ✅ 捐赠金额 <= $10,000 (单次限制)

**错误场景**:

```javascript
// 剩余 $15,000, 用户输入 $20,000
{
  success: false,
  error: 'amount_limit_exceeded',
  maxQuantity: 15000,  // 剩余金额
  unitName: 'USD'
}
```

#### 数据库记录创建

**创建 1 条聚合记录** (与类型 2 相同)

示例: 用户捐赠 $500.00,创建 **1 条** 记录:

```javascript
donationRecords.push({
  donation_public_id: '7-P9Q0R1',
  order_reference: 'DONATE-7-1703...',
  project_id: 7,
  amount: 500.00,  // 用户输入的金额
  // ...
})
```

**结果**:
- `donations` 表插入 **1 行**
- `total_raised` 从 $35,000 增加到 $35,500
- `current_units` 从 35000 增加到 35500 (用于进度条计算)
- 进度更新为: `$35,500 / $50,000 (71.0%)`

---

## 数据库字段含义

### 关键字段语义对照表

| 字段 | 非聚合项目 | 聚合项目 |
|------|-----------|---------|
| `target_units` (非长期) | 目标**单位数** (如: 100 kits) | 目标**金额** (如: 50000 USD) |
| `target_units` (长期) | `null` (无限制) | `null` (无限制) |
| `current_units` | 已募集**单位数** | 已募集**金额** (= total_raised) |
| `unit_price` | 实际单价 (如: $85.00) | 象征性单价 (固定 $1.00) |
| `unit_name` | 实际单位 (如: "medical kit") | 货币单位 (固定 "USD") |
| `donation.amount` | 单个单位的价格 | 完整捐赠金额 |

### 数据库视图: `project_stats`

该视图自动计算统计数据:

```sql
CREATE VIEW project_stats AS
SELECT
  p.*,
  -- 总募集金额 (SUM 所有 paid+ 状态的捐赠)
  COALESCE(SUM(d.amount) FILTER (WHERE d.donation_status IN (...)), 0) AS total_raised,

  -- 捐赠次数 (聚合模式下统计记录数,非聚合模式下也统计记录数)
  COUNT(d.id) FILTER (WHERE d.donation_status IN (...)) AS donation_count,

  -- 当前单位数 (非聚合: 实际单位数, 聚合: = total_raised)
  p.current_units,

  -- 进度百分比
  CASE
    WHEN p.target_units > 0 THEN (p.current_units::float / p.target_units * 100)
    ELSE 0
  END AS progress_percentage
FROM projects p
LEFT JOIN donations d ON d.project_id = p.id
GROUP BY p.id;
```

**关键触发器**: `update_project_current_units_trigger`

该触发器在捐赠状态变更时自动更新 `current_units`:

```sql
-- 非聚合模式: current_units = COUNT(已完成的捐赠记录)
-- 聚合模式: current_units = SUM(已完成捐赠的金额)
```

---

## 前端展示逻辑

### 显示逻辑决策树

```
项目卡片显示逻辑:
├─ 标签
│  ├─ is_long_term = true → 显示 "Long-term" 标签
│  └─ aggregate_donations = true → (无特殊标签)
│
├─ 单价/金额模式
│  ├─ aggregate_donations = true → 显示 "Any Amount"
│  └─ aggregate_donations = false → 显示 "$X.XX / unit_name"
│
├─ 日期显示
│  ├─ 总是显示开始日期
│  └─ is_long_term = false → 显示结束日期
│
├─ 进度条
│  ├─ is_long_term = true → 不显示进度条
│  └─ is_long_term = false AND target_units > 0
│     ├─ aggregate_donations = true → 显示金额进度条 ($X / $Y)
│     └─ aggregate_donations = false → 显示单位进度条 (X / Y units)
│
└─ 额外信息
   ├─ is_long_term = true AND aggregate_donations = false
   │  └─ 显示 "Current Units: X units"
   └─ 总是显示: 捐赠次数 + 总募集金额
```

### 关键代码位置

| 显示元素 | 文件 | 行号 | 逻辑 |
|---------|------|------|------|
| "Any Amount" 显示 | `ProjectCard.tsx` | 125-134 | `aggregate_donations ? "Any Amount" : "$X.XX / unit"` |
| 长期标签 | `ProjectCard.tsx` | 97-101 | `is_long_term === true` |
| 结束日期 | `ProjectCard.tsx` | 148-157 | `is_long_term !== true` |
| 进度条 | `ProjectCard.tsx` | 180-188 | `is_long_term !== true && hasValidTarget` |
| Current Units | `ProjectCard.tsx` | 162-169 | `is_long_term === true && !aggregate_donations` |
| 进度条模式 | `ProjectProgressBar.tsx` | 24-37 | `showAsAmount ? "$X / $Y" : "X / Y units"` |

---

## 捐赠表单逻辑

### 表单输入决策

**代码位置**: `DonationFormCard.tsx:195, 456-631`

```typescript
// 判断项目类型
const isAggregatedProject = project?.aggregate_donations === true

// 根据类型计算金额
const projectAmount = project
  ? (isAggregatedProject ? donationAmount : (project.unit_price || 0) * quantity)
  : 0
```

### 表单字段对照

| 项目类型 | 输入控件 | 变量名 | 取值范围 | 显示标签 |
|---------|---------|--------|---------|---------|
| 非聚合 | Number Input (整数) | `quantity` | 1 - 999 | "数量" / "Quantity" |
| 聚合 | Number Input (小数) | `donationAmount` | 0.1 - 10000 | "金额" / "Amount" |

### 表单验证

**客户端验证** (`DonationFormCard.tsx`):

```typescript
// 非聚合项目: 防止小数输入
onKeyDown={(e) => {
  if (e.key === '.' || e.key === 'e' || e.key === 'E' || ...) {
    e.preventDefault()
  }
}}

// 聚合项目: 允许小数,四舍五入到 0.1
onChange={(e) => {
  const num = Number(e.target.value)
  setDonationAmount(Math.round(num * 10) / 10)  // 保留1位小数
}}
```

**服务端验证** (`lib/validations.ts:48-59`):

```typescript
export const donationFormSchema = z.object({
  project_id: z.number().int().positive(),
  quantity: z.number().int().min(1).max(999),
  amount: z.number().positive().max(10000).optional(),  // 聚合项目使用
  donor_name: z.string().min(2).max(255),
  donor_email: z.string().email(),
  // ...
})
```

### 提交参数转换

**代码位置**: `DonationFormCard.tsx:298-313`

```typescript
// 聚合项目: quantity=1, 传递 amount
// 非聚合项目: 传递 quantity, amount=undefined
const submitQuantity = isAggregatedProject ? 1 : quantity
const submitAmount = isAggregatedProject ? donationAmount : undefined

const result = await createWayForPayDonation({
  project_id: project.id,
  quantity: submitQuantity,
  amount: submitAmount,
  // ...
})
```

---

## 后端检查逻辑

### 检查流程图

```
createWayForPayDonation()
  │
  ├─ 1. 验证输入 (Zod schema)
  │
  ├─ 2. 查询项目信息 (getProjectStats)
  │  ├─ 项目不存在? → 返回 'project_not_found'
  │  └─ 项目状态 ≠ 'active'? → 返回 'project_not_active'
  │
  ├─ 3. 计算项目金额
  │  ├─ aggregate_donations = true → projectAmount = validated.amount
  │  └─ aggregate_donations = false → projectAmount = unit_price × quantity
  │
  ├─ 4. 限制检查 (仅非长期项目)
  │  │
  │  ├─ is_long_term = true → 跳过检查
  │  │
  │  └─ is_long_term = false
  │     │
  │     ├─ aggregate_donations = true
  │     │  └─ projectAmount > (target_units - total_raised)?
  │     │     └─ 返回 'amount_limit_exceeded', maxQuantity = 剩余金额
  │     │
  │     └─ aggregate_donations = false
  │        ├─ quantity > (target_units - current_units)?
  │        │  └─ 返回 'quantity_exceeded', remainingUnits
  │        │
  │        └─ projectAmount > 10000?
  │           └─ 返回 'amount_limit_exceeded', maxQuantity = floor(10000 / unit_price)
  │
  ├─ 5. 创建支付参数 (WayForPay)
  │
  └─ 6. 插入待支付记录
     ├─ aggregate_donations = true → 插入 1 条记录, amount = projectAmount
     └─ aggregate_donations = false → 插入 quantity 条记录, 每条 amount = unit_price
```

### 错误码说明

| 错误码 | 含义 | 返回数据 | 前端处理 |
|-------|------|---------|---------|
| `project_not_found` | 项目不存在 | - | 显示通用错误 |
| `project_not_active` | 项目已结束/暂停 | - | 禁用捐赠按钮 |
| `quantity_exceeded` | 超过剩余单位数 | `remainingUnits`, `unitName` | 自动调整数量 + 提示 |
| `amount_limit_exceeded` | 超过金额限制 | `maxQuantity`, `unitName` | 自动调整金额/数量 + 提示 |
| `server_error` | 服务器错误 | - | 显示通用错误 |

### 关键代码

**文件**: `app/actions/donation.ts`

```typescript
// 59-75: 计算项目金额
if (project.aggregate_donations) {
  projectAmount = validated.amount  // 聚合: 直接使用输入金额
} else {
  projectAmount = unitPrice * validated.quantity  // 非聚合: 单价 × 数量
}

// 78-120: 非长期项目限制检查
if (!project.is_long_term) {
  if (project.aggregate_donations) {
    // 聚合模式: 检查金额限制
    const targetAmount = project.target_units || 0  // ⚠️ target_units = 目标金额
    const currentAmount = project.total_raised || 0
    const remainingAmount = targetAmount - currentAmount

    if (projectAmount > remainingAmount) {
      return { success: false, error: 'amount_limit_exceeded', maxQuantity: Math.floor(remainingAmount), unitName: 'USD' }
    }
  } else {
    // 非聚合模式: 检查数量 + 金额限制
    const remainingUnits = (project.target_units || 0) - (project.current_units || 0)

    if (validated.quantity > remainingUnits) {
      return { success: false, error: 'quantity_exceeded', remainingUnits, unitName }
    }

    if (projectAmount > 10000) {
      const maxQuantity = Math.floor(10000 / unitPrice)
      return { success: false, error: 'amount_limit_exceeded', maxQuantity, unitName }
    }
  }
}
```

---

## 数据库记录创建逻辑

### 创建规则

**核心原则**:
- **聚合模式**: 每个订单创建 **1 条** 记录,`amount` = 完整捐赠金额
- **非聚合模式**: 每个单位创建 **1 条** 记录,`amount` = 单价

**代码位置**: `app/actions/donation.ts:173-237`

```typescript
if (project.aggregate_donations) {
  // 聚合模式: 创建 1 条记录
  donationRecords.push({
    donation_public_id: donationPublicId,
    order_reference: orderReference,
    project_id: validated.project_id,
    amount: projectAmount,  // 完整金额 (如: $500.00)
    // ...
  })
} else {
  // 非聚合模式: 循环创建多条记录
  for (let i = 0; i < validated.quantity; i++) {
    donationRecords.push({
      donation_public_id: donationPublicId,  // 每条不同
      order_reference: orderReference,       // 相同
      project_id: validated.project_id,
      amount: unitPrice,  // 单价 (如: $85.00)
      // ...
    })
  }
}
```

### 批量插入

所有记录通过一次 `INSERT` 操作批量插入:

```typescript
const { data: insertedData, error: dbError } = await supabase
  .from('donations')
  .insert(donationRecords)  // 数组
  .select()

console.log(`[DONATION] Created ${insertedData.length} pending records: ${orderReference}`)
```

### Tip 捐赠处理

如果用户添加了 Tip (给项目 0),**始终创建 1 条聚合记录**:

```typescript
if (validated.tip_amount && validated.tip_amount > 0) {
  donationRecords.push({
    donation_public_id: tipDonationId,
    order_reference: orderReference,  // 共享同一个订单号
    project_id: 0,  // 项目 0 = 康复中心支持
    amount: validated.tip_amount,  // Tip 金额
    // ...
  })
}
```

### 记录示例对比

#### 非聚合项目 (捐赠 5 个单位)

```sql
-- 插入 5 条记录
INSERT INTO donations (order_reference, project_id, amount, ...) VALUES
  ('DONATE-3-1703...', 3, 85.00, ...),  -- 记录 1
  ('DONATE-3-1703...', 3, 85.00, ...),  -- 记录 2
  ('DONATE-3-1703...', 3, 85.00, ...),  -- 记录 3
  ('DONATE-3-1703...', 3, 85.00, ...),  -- 记录 4
  ('DONATE-3-1703...', 3, 85.00, ...);  -- 记录 5
```

#### 聚合项目 (捐赠 $425.00)

```sql
-- 插入 1 条记录
INSERT INTO donations (order_reference, project_id, amount, ...) VALUES
  ('DONATE-7-1703...', 7, 425.00, ...);  -- 单条记录
```

#### 混合订单 (项目 + Tip)

```sql
-- 非聚合项目 (3个单位) + Tip ($20)
INSERT INTO donations (order_reference, project_id, amount, ...) VALUES
  ('DONATE-3-1703...', 3, 85.00, ...),  -- 项目记录 1
  ('DONATE-3-1703...', 3, 85.00, ...),  -- 项目记录 2
  ('DONATE-3-1703...', 3, 85.00, ...),  -- 项目记录 3
  ('DONATE-3-1703...', 0, 20.00, ...);  -- Tip 记录 (聚合)
```

---

## 完整流程示例

### 示例 1: 类型 3 (非长期 + 非聚合)

**场景**: 用户向"乌克兰冬季医疗包"项目捐赠 5 个单位

**项目信息**:
```json
{
  "id": 3,
  "is_long_term": false,
  "aggregate_donations": false,
  "target_units": 100,
  "current_units": 45,
  "unit_price": 85.00,
  "unit_name": "medical kit",
  "status": "active"
}
```

#### 步骤 1: 前端展示

**项目卡片显示**:
- ✅ 单价: `$85.00 / medical kit`
- ✅ 进度条: `45 / 100 medical kits (45.0%)`
- ✅ 结束日期: `2025-02-28`

#### 步骤 2: 用户填写表单

**表单输入**:
- 数量: `5` (选择或手动输入)
- 捐赠者姓名: `John Doe`
- 邮箱: `john@example.com`

**前端计算**:
```typescript
projectAmount = 85.00 × 5 = $425.00
totalAmount = $425.00 (无 Tip)
```

#### 步骤 3: 提交到后端

```typescript
await createWayForPayDonation({
  project_id: 3,
  quantity: 5,
  amount: undefined,  // 非聚合不传 amount
  donor_name: "John Doe",
  donor_email: "john@example.com",
  locale: "en"
})
```

#### 步骤 4: 后端检查

```typescript
// 1. 计算金额
projectAmount = 85.00 × 5 = 425.00 ✅

// 2. 检查剩余单位
remainingUnits = 100 - 45 = 55
5 <= 55 ✅

// 3. 检查金额限制
425.00 <= 10000 ✅
```

#### 步骤 5: 创建数据库记录

```javascript
// 循环创建 5 条 pending 记录
donations 表:
[
  { id: 1001, donation_public_id: '3-A1B2C3', order_reference: 'DONATE-3-1703...', project_id: 3, amount: 85.00, status: 'pending' },
  { id: 1002, donation_public_id: '3-D4E5F6', order_reference: 'DONATE-3-1703...', project_id: 3, amount: 85.00, status: 'pending' },
  { id: 1003, donation_public_id: '3-G7H8I9', order_reference: 'DONATE-3-1703...', project_id: 3, amount: 85.00, status: 'pending' },
  { id: 1004, donation_public_id: '3-J0K1L2', order_reference: 'DONATE-3-1703...', project_id: 3, amount: 85.00, status: 'pending' },
  { id: 1005, donation_public_id: '3-M3N4O5', order_reference: 'DONATE-3-1703...', project_id: 3, amount: 85.00, status: 'pending' }
]
```

#### 步骤 6: 支付成功 Webhook

WayForPay 回调更新所有记录状态:

```sql
UPDATE donations
SET donation_status = 'paid'
WHERE order_reference = 'DONATE-3-1703...';

-- 触发器自动更新:
-- current_units = 45 + 5 = 50
```

#### 步骤 7: 前端更新

**进度条自动更新**:
```
50 / 100 medical kits        50.0%
████████████████░░░░░░░░░░░
```

---

### 示例 2: 类型 4 (非长期 + 聚合)

**场景**: 用户向"紧急救援基金"捐赠 $1,500

**项目信息**:
```json
{
  "id": 7,
  "is_long_term": false,
  "aggregate_donations": true,
  "target_units": 50000,       // ⚠️ 目标金额 $50,000
  "current_units": 35000,      // 当前 $35,000
  "total_raised": 35000,
  "unit_price": 1.00,
  "unit_name": "USD",
  "status": "active"
}
```

#### 步骤 1: 前端展示

**项目卡片显示**:
- ✅ 捐赠模式: `Any Amount` (任意金额)
- ✅ 进度条: `$35,000 / $50,000 (70.0%)`
- ✅ 结束日期: `2025-03-15`

#### 步骤 2: 用户填写表单

**表单输入**:
- 金额: `$1,500.00` (手动输入)
- 捐赠者姓名: `Alice Wang`
- 邮箱: `alice@example.com`

**前端计算**:
```typescript
projectAmount = $1,500.00
totalAmount = $1,500.00
```

#### 步骤 3: 提交到后端

```typescript
await createWayForPayDonation({
  project_id: 7,
  quantity: 1,         // 聚合项目固定 quantity=1
  amount: 1500.00,     // 用户输入金额
  donor_name: "Alice Wang",
  donor_email: "alice@example.com",
  locale: "en"
})
```

#### 步骤 4: 后端检查

```typescript
// 1. 使用传入金额
projectAmount = validated.amount = 1500.00 ✅

// 2. 检查剩余金额
targetAmount = 50000
currentAmount = 35000
remainingAmount = 50000 - 35000 = 15000
1500.00 <= 15000 ✅

// 3. 检查单次限制
1500.00 <= 10000 ✅
```

#### 步骤 5: 创建数据库记录

```javascript
// 创建 1 条 pending 记录
donations 表:
[
  {
    id: 2001,
    donation_public_id: '7-P9Q0R1',
    order_reference: 'DONATE-7-1703...',
    project_id: 7,
    amount: 1500.00,  // 完整金额
    status: 'pending'
  }
]
```

#### 步骤 6: 支付成功 Webhook

```sql
UPDATE donations
SET donation_status = 'paid'
WHERE order_reference = 'DONATE-7-1703...';

-- 触发器自动更新:
-- current_units = 35000 + 1500 = 36500
-- total_raised = 35000 + 1500 = 36500
```

#### 步骤 7: 前端更新

**进度条自动更新**:
```
$36,500 / $50,000            73.0%
███████████████████░░░░░░░░░
```

---

## 总结表格

### 四种类型对照总览

| 维度 | 类型 1 (长期+非聚合) | 类型 2 (长期+聚合) | 类型 3 (非长期+非聚合) | 类型 4 (非长期+聚合) |
|------|-------------------|-----------------|---------------------|-------------------|
| **字段配置** | | | | |
| `is_long_term` | `true` | `true` | `false` | `false` |
| `aggregate_donations` | `false` | `true` | `false` | `true` |
| `target_units` 含义 | `null` | `null` | 目标**单位数** | 目标**金额** (USD) |
| `unit_price` | 实际单价 | 1.00 | 实际单价 | 1.00 |
| **前端展示** | | | | |
| 单价/金额模式 | `$X.XX / unit` | `Any Amount` | `$X.XX / unit` | `Any Amount` |
| 显示结束日期 | ❌ | ❌ | ✅ | ✅ |
| 显示进度条 | ❌ | ❌ | ✅ (单位) | ✅ (金额) |
| 额外显示 | `Current Units` | - | - | - |
| **捐赠表单** | | | | |
| 输入类型 | 整数数量 | 小数金额 | 整数数量 | 小数金额 |
| 最小值 | 1 | $0.1 | 1 | $0.1 |
| 最大值 | 999 | $10,000 | 999 | $10,000 |
| 提交 `quantity` | 用户输入 | 1 | 用户输入 | 1 |
| 提交 `amount` | `undefined` | 用户输入 | `undefined` | 用户输入 |
| **后端检查** | | | | |
| 数量限制检查 | ❌ | ❌ | ✅ | ❌ |
| 金额/目标限制 | ❌ | ❌ | ✅ ($10k) | ✅ (剩余金额) |
| **数据库记录** | | | | |
| 记录数量 | `quantity` 条 | 1 条 | `quantity` 条 | 1 条 |
| 每条 `amount` | 单价 | 完整金额 | 单价 | 完整金额 |
| **实际案例** | 康复中心支持 | 通用捐赠基金 | 冬季医疗包 | 紧急救援基金 |

### 关键代码位置速查

| 功能模块 | 文件 | 关键行号 |
|---------|------|---------|
| 项目类型判断 | `DonationFormCard.tsx` | 195 |
| 聚合/非聚合表单 | `DonationFormCard.tsx` | 456-631 |
| 进度条模式 | `ProjectProgressBar.tsx` | 24-37 |
| "Any Amount" 显示 | `ProjectCard.tsx` | 125-134 |
| Current Units 显示 | `ProjectCard.tsx` | 162-169 |
| 进度条显示条件 | `ProjectCard.tsx` | 180-188 |
| 金额计算 | `donation.ts` | 59-75 |
| 限制检查 | `donation.ts` | 78-120 |
| 记录创建 | `donation.ts` | 181-237 |
| 表单验证 | `validations.ts` | 48-59 |

---

## 附录: 开发检查清单

### 新增项目时的检查项

创建新项目时,请确认:

- [ ] `is_long_term` 和 `aggregate_donations` 组合正确
- [ ] 如果 `aggregate_donations = true`:
  - [ ] `unit_price = 1.00`
  - [ ] `unit_name = "USD"`
  - [ ] 非长期项目的 `target_units` = 目标金额 (非单位数)
- [ ] 如果 `aggregate_donations = false`:
  - [ ] `unit_price` 为实际单价
  - [ ] `unit_name` 为实际单位 (如 "medical kit")
  - [ ] `target_units` = 目标单位数
- [ ] 如果 `is_long_term = true`:
  - [ ] `target_units = null`
  - [ ] `end_date = null`
- [ ] 如果 `is_long_term = false`:
  - [ ] `target_units` 必须设置
  - [ ] `end_date` 必须设置

### 测试场景

对于每种项目类型,测试:

- [ ] 项目卡片正确显示 (单价/金额、进度条、日期)
- [ ] 捐赠表单正确显示 (数量/金额输入框)
- [ ] 前端金额计算正确
- [ ] 后端限制检查正确
- [ ] 数据库记录数量正确
- [ ] Webhook 更新 `current_units` 正确
- [ ] 进度条实时更新正确

---

**文档结束**

如有问题或需要补充,请联系开发团队。
