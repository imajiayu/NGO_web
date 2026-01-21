# React 性能优化指南

> 基于 Vercel React 最佳实践的代码库分析报告

**分析日期**: 2026-01-21
**分析范围**: 全站 React/Next.js 组件
**参考标准**: Vercel Engineering React Best Practices (45 条规则, 8 大类)

---

## 目录

1. [概述](#概述)
2. [Bundle 优化 (关键优先级)](#1-bundle-优化-关键优先级)
3. [重渲染优化 (中等优先级)](#2-重渲染优化-中等优先级)
4. [异步与瀑布流模式 (关键优先级)](#3-异步与瀑布流模式-关键优先级)
5. [渲染性能 (中等优先级)](#4-渲染性能-中等优先级)
6. [客户端数据获取 (中高优先级)](#5-客户端数据获取-中高优先级)
7. [优先级行动清单](#优先级行动清单)
8. [已实现的最佳实践](#已实现的最佳实践)

---

## 概述

本文档记录了基于 Vercel React 最佳实践对 NGO 捐赠平台的性能分析结果。分析覆盖了 70+ 个 React 组件，识别出若干优化机会，同时也确认了已正确实现的最佳实践。

### Vercel 规则优先级分类

| 优先级 | 类别 | 影响程度 | 规则前缀 |
|--------|------|----------|----------|
| 1 | 消除瀑布流 | 关键 | `async-` |
| 2 | Bundle 大小优化 | 关键 | `bundle-` |
| 3 | 服务端性能 | 高 | `server-` |
| 4 | 客户端数据获取 | 中高 | `client-` |
| 5 | 重渲染优化 | 中 | `rerender-` |
| 6 | 渲染性能 | 中 | `rendering-` |
| 7 | JavaScript 性能 | 低中 | `js-` |
| 8 | 高级模式 | 低 | `advanced-` |

---

## 1. Bundle 优化 (关键优先级)

### 1.1 已实现的优化 ✅

**图标组件优化** (`components/icons/index.tsx`)

项目已将 lucide-react (~150KB) 替换为内联 SVG 图标 (~5KB)，符合 `bundle-barrel-imports` 最佳实践：

```typescript
// components/icons/index.tsx 第 1-6 行
/**
 * P2 优化: 内联 SVG 图标组件
 * 替换 lucide-react 以减少 bundle 大小 (~150KB → ~5KB)
 */
```

**动态加载移动端组件** (`DonatePageClient.tsx`)

```typescript
// 第 21-24 行 - 正确使用 next/dynamic
const BottomSheet = dynamic(() => import('@/components/common/BottomSheet'), {
  ssr: false,
  loading: () => null,
})
```

### 1.2 待优化项 🔧

#### 优化点 A: 折叠区域组件动态加载

**文件**: `app/[locale]/donate/DonatePageClient.tsx`
**问题**: `DonationStatusFlow` 和 `ProjectDonationList` 位于页面下方，默认不可见，但会在初始 bundle 中加载
**规则**: `bundle-dynamic-imports`
**预估节省**: 8-12KB

**当前代码** (第 15-16 行):
```typescript
import DonationStatusFlow from '@/components/donation-display/DonationStatusFlow'
import ProjectDonationList from '@/components/donation-display/ProjectDonationList'
```

**优化方案**:
```typescript
import dynamic from 'next/dynamic'

// 折叠区域组件 - 用户展开后才需要
const DonationStatusFlow = dynamic(
  () => import('@/components/donation-display/DonationStatusFlow'),
  { ssr: true }
)

// 页面底部组件 - 滚动后才可见
const ProjectDonationList = dynamic(
  () => import('@/components/donation-display/ProjectDonationList'),
  { ssr: true }
)
```

#### 优化点 B: 支付组件条件加载

**文件**: `components/donate-form/DonationFormCard.tsx`
**问题**: `PaymentMethodSelector` 和 `CryptoSelector` 仅在表单提交后显示
**规则**: `bundle-conditional`
**预估节省**: 6-10KB

**当前代码** (第 10-11 行):
```typescript
import PaymentMethodSelector, { type PaymentMethod } from './PaymentMethodSelector'
import CryptoSelector from './CryptoSelector'
```

**优化方案**:
```typescript
import dynamic from 'next/dynamic'
import type { PaymentMethod } from './PaymentMethodSelector'

const PaymentMethodSelector = dynamic(() => import('./PaymentMethodSelector'))
const CryptoSelector = dynamic(() => import('./CryptoSelector'))
```

---

## 2. 重渲染优化 (中等优先级)

### 2.1 状态管理分析

**文件**: `components/donate-form/DonationFormCard.tsx`

该组件包含 **11 个 useState 调用** (第 218-233 行)：

```typescript
// 项目相关字段
const [quantity, setQuantity] = useState(1)
const [donationAmount, setDonationAmount] = useState(0.1)
const [tipAmount, setTipAmount] = useState(0)

// UI 状态
const [paymentParams, setPaymentParams] = useState<any | null>(null)
const [cryptoPaymentData, setCryptoPaymentData] = useState<CreatePaymentResponse | null>(null)
const [showWidget, setShowWidget] = useState(false)
const [processingState, setProcessingState] = useState<...>('idle')
const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
const [isCryptoLoading, setIsCryptoLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
```

当项目切换时，`useEffect` (第 239-250 行) 重置 9 个状态，虽然 React 会批量处理，但代码可读性和维护性可以改进。

### 2.2 待优化项 🔧

#### 优化点 A: 事件处理函数缺少 useCallback

**文件**: `components/donate-form/DonationFormCard.tsx`
**规则**: `rerender-functional-setstate`

以下处理函数每次渲染都会重新创建：

| 函数名 | 行号 | 影响 |
|--------|------|------|
| `handleSubmit` | 342 | 每次渲染重建 |
| `handlePaymentMethodSelect` | 358 | 每次渲染重建 |
| `handleCryptoSelect` | 468 | 每次渲染重建 |
| `handleBack` | 561 | 每次渲染重建 |
| `handleBackToMethodSelect` | 572 | 每次渲染重建 |

**当前代码** (第 342 行):
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!project || project.id === null || project.id === undefined) return
  // ...
}
```

**优化方案**:
```typescript
const handleSubmit = useCallback(async (e: React.FormEvent) => {
  e.preventDefault()
  if (!project || project.id === null || project.id === undefined) return
  // ...
}, [project, processingState, scrollToFormArea, /* 其他依赖 */])
```

#### 优化点 B: 复杂表单状态考虑使用 useReducer

**规则**: `rerender-` 系列

当前 `handleBack` 函数 (第 561-568 行) 一次性重置 8 个状态：

```typescript
const handleBack = () => {
  setShowWidget(false)
  setPaymentParams(null)
  setCryptoPaymentData(null)
  setProcessingState('idle')
  setSelectedPaymentMethod(null)
  setIsCryptoLoading(false)
  setError(null)
}
```

**优化方案** - 使用 useReducer 管理相关联的 UI 状态：

```typescript
type FormUIState = {
  showWidget: boolean
  paymentParams: any | null
  cryptoPaymentData: CreatePaymentResponse | null
  processingState: ProcessingState
  selectedPaymentMethod: PaymentMethod | null
  isCryptoLoading: boolean
  error: string | null
}

type FormAction =
  | { type: 'RESET' }
  | { type: 'START_PAYMENT_SELECT' }
  | { type: 'SELECT_CRYPTO' }
  | { type: 'SET_ERROR'; payload: string }
  // ...

const [uiState, dispatch] = useReducer(formUIReducer, initialUIState)

// 使用
const handleBack = () => dispatch({ type: 'RESET' })
```

#### 优化点 C: DonationsTable 复选框处理函数

**文件**: `components/admin/DonationsTable.tsx`
**规则**: `rerender-functional-setstate`

**当前代码** (第 49-67 行):
```typescript
const handleSelectAll = (checked: boolean) => {
  if (checked) {
    const newSelected = new Set(filteredDonations.map(d => d.id))
    setSelectedIds(newSelected)
  } else {
    setSelectedIds(new Set())
  }
}

const handleSelectOne = (id: number, checked: boolean) => {
  const newSelected = new Set(selectedIds)
  if (checked) {
    newSelected.add(id)
  } else {
    newSelected.delete(id)
  }
  setSelectedIds(newSelected)
}
```

**优化方案**:
```typescript
const handleSelectAll = useCallback((checked: boolean) => {
  if (checked) {
    setSelectedIds(new Set(filteredDonations.map(d => d.id)))
  } else {
    setSelectedIds(new Set())
  }
}, [filteredDonations])

const handleSelectOne = useCallback((id: number, checked: boolean) => {
  setSelectedIds(prev => {
    const newSelected = new Set(prev)
    checked ? newSelected.add(id) : newSelected.delete(id)
    return newSelected
  })
}, []) // 使用函数式 setState，无需依赖
```

---

## 3. 异步与瀑布流模式 (关键优先级)

### 3.1 已实现的优化 ✅

**服务端数据获取**

项目正确实现了服务端数据获取模式，避免了客户端瀑布流：

- `DonatePageClient` 通过 props 接收 `initialProjects`（第 72-73 行）
- 项目详情页使用 `Promise.all` 并行获取多个 JSON 文件
- 无顺序 await 阻塞关键路径

### 3.2 待优化项 🔧

#### 优化点: 邮件订阅不应阻塞支付流程

**文件**: `components/donate-form/DonationFormCard.tsx`
**规则**: `async-defer-await`

**当前代码** (第 441-452 行):
```typescript
// 支付成功后处理邮件订阅
if (subscribeToNewsletter && donorEmail) {
  try {
    await createEmailSubscription(  // ⚠️ 阻塞 UI
      donorEmail.trim(),
      locale as 'en' | 'zh' | 'ua'
    )
  } catch (subscriptionError) {
    clientLogger.error('FORM:DONATION', 'Failed to create email subscription', {...})
    // 不阻塞捐赠流程
  }
}
```

**问题**: `await` 会阻塞 UI，即使订阅失败也不影响捐赠流程，不应等待。

**优化方案**:
```typescript
// Fire-and-forget 模式 - 不阻塞支付流程
if (subscribeToNewsletter && donorEmail) {
  createEmailSubscription(
    donorEmail.trim(),
    locale as 'en' | 'zh' | 'ua'
  ).catch(subscriptionError => {
    clientLogger.error('FORM:DONATION', 'Failed to create email subscription', {
      error: subscriptionError instanceof Error ? subscriptionError.message : String(subscriptionError)
    })
  })
  // 不等待 - 订阅失败不应影响支付体验
}
```

---

## 4. 渲染性能 (中等优先级)

### 4.1 已实现的优化 ✅

**条件渲染提前返回** (`ProjectCard.tsx`)

```typescript
// 第 83 行 - compact 模式提前返回，避免渲染两个分支
if (mode === 'compact') {
  return ( /* compact JSX */ )
}

// 第 270 行 - full 模式在后面渲染
return ( /* full JSX */ )
```

符合 `rendering-conditional-render` 最佳实践。

**滚动处理优化** (`DonatePageClient.tsx`)

```typescript
// 第 161-166 行 - 使用 RAF 节流 + passive 监听器
const onScroll = () => {
  if (!ticking) {
    requestAnimationFrame(updatePosition)
    ticking = true
  }
}
window.addEventListener('scroll', onScroll, { passive: true })
```

正确实现了滚动性能优化模式。

---

## 5. 客户端数据获取 (中高优先级)

### 5.1 已实现的优化 ✅

**useMemo 优化计算** (`DonationsTable.tsx`)

```typescript
// 第 81-97 行 - 正确使用 useMemo 缓存分组计算
const donationGroups = useMemo(() => {
  const groups = new Map<string, Donation[]>()
  filteredDonations.forEach((donation) => {
    const key = donation.order_reference || `no-order-${donation.id}`
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(donation)
  })
  return Array.from(groups.entries()).map(([orderRef, donations]) => ({
    orderReference: orderRef.startsWith('no-order-') ? null : orderRef,
    donations,
    totalAmount: donations.reduce((sum, d) => sum + d.amount, 0)
  }))
}, [filteredDonations])
```

符合 `rerender-memo` 最佳实践。

---

## 优先级行动清单

| 优先级 | 文件 | 优化项 | 影响 | 工作量 | 状态 |
|--------|------|--------|------|--------|------|
| **1** | `DonatePageClient.tsx` | 动态加载 `DonationStatusFlow`, `ProjectDonationList` | Bundle -8-12KB | 低 | ✅ 已完成 |
| **2** | `DonationFormCard.tsx` | 事件处理函数添加 `useCallback` | INP -5% | 中 | 待处理 (涉及支付逻辑) |
| **3** | `DonationFormCard.tsx` | 邮件订阅使用 fire-and-forget 模式 | 支付流程更快 | 低 | ✅ 已完成 |
| **4** | `DonationsTable.tsx` | 复选框处理函数添加 `useCallback` | 减少重渲染 | 低 | ✅ 已完成 |
| **5** | `DonationFormCard.tsx` | 考虑使用 `useReducer` 管理表单状态 | 代码更清晰 | 高 | 可选 (涉及支付逻辑) |

---

## 已实现的最佳实践

以下是代码库中已正确实现的 Vercel React 最佳实践：

| 规则 | 文件 | 实现位置 |
|------|------|----------|
| `bundle-barrel-imports` | `components/icons/index.tsx` | 全文件 - 内联 SVG 替代 lucide-react |
| `bundle-dynamic-imports` | `DonatePageClient.tsx` | 第 21-24 行 - BottomSheet 动态加载 |
| `bundle-dynamic-imports` | `DonatePageClient.tsx` | 第 15-24 行 - DonationStatusFlow, ProjectDonationList 动态加载 ✨ |
| `rendering-conditional-render` | `ProjectCard.tsx` | 第 83 行 - compact 模式提前返回 |
| `rerender-memo` | `DonationsTable.tsx` | 第 81-97 行 - useMemo 分组计算 |
| `rerender-functional-setstate` | `DonationsTable.tsx` | 第 49-80 行 - 复选框处理函数 useCallback ✨ |
| `js-set-map-lookups` | `DonationsTable.tsx` | 第 82 行 - Map 用于分组 |
| `async-parallel` | 项目详情页 | Promise.all 并行加载 JSON |
| 滚动优化 | `DonatePageClient.tsx` | 第 161-166 行 - RAF + passive 监听器 |
| `rerender-functional-setstate` | `DonationFormCard.tsx` | 第 268 行 - scrollToFormArea 使用 useCallback |
| `rerender-functional-setstate` | `ProjectCard.tsx` | 第 60-69 行 - handleDonateClick, handleSelectClick 使用 useCallback ✨ |
| `rerender-functional-setstate` | `Project3/index.tsx` | 第 76-93 行 - lightbox 处理函数 useCallback ✨ |
| `rerender-functional-setstate` | `Project4/index.tsx` | 第 105-135 行 - lightbox 处理函数 useCallback ✨ |
| `async-defer-await` | `DonationFormCard.tsx` | 第 441-449, 531-539 行 - 邮件订阅 fire-and-forget ✨ |

> ✨ 标记为 2026-01-21 新增优化

---

## 参考资料

- [Vercel React Best Practices](https://vercel.com/docs/frameworks/react)
- [Next.js Dynamic Imports](https://nextjs.org/docs/pages/building-your-application/optimizing/lazy-loading)
- [React useCallback 文档](https://react.dev/reference/react/useCallback)
- [React useReducer 文档](https://react.dev/reference/react/useReducer)

---

## 变更日志

### v1.3.0 (2026-01-21)

**已实施的优化（异步模式）：**

1. **`DonationFormCard.tsx`** - 邮件订阅 fire-and-forget 优化
   - Card 支付成功后的邮件订阅（第 441-449 行）
   - Crypto 支付成功后的邮件订阅（第 531-539 行）
   - 移除 `await`，使用 `.catch()` 处理错误
   - 订阅失败不阻塞支付流程，用户体验更流畅

### v1.2.0 (2026-01-21)

**已实施的优化（低风险展示组件）：**

1. **`ProjectCard.tsx`** - 导航和选择处理函数优化
   - `handleDonateClick` 添加 `useCallback`，依赖 `[router, project.id]`
   - `handleSelectClick` 添加 `useCallback`，依赖 `[project.id, onSelect]`

2. **`Project3/index.tsx`** - Lightbox 处理函数优化
   - `handleDetailImageClick` 添加 `useCallback`
   - `handleReceiptClick` 添加 `useCallback`
   - 新增 `handleDetailLightboxClose`, `handleReceiptLightboxClose` 替代内联函数

3. **`Project4/index.tsx`** - Lightbox 处理函数优化
   - 5 个图片点击处理函数添加 `useCallback`
   - 5 个 lightbox 关闭处理函数添加 `useCallback`
   - 消除所有内联箭头函数

### v1.1.0 (2026-01-21)

**已实施的优化：**

1. **`DonatePageClient.tsx`** - 动态加载折叠区域组件
   - `DonationStatusFlow` 改为动态加载（默认折叠，用户展开后才需要）
   - `ProjectDonationList` 改为动态加载（页面底部，滚动后才可见）
   - 预估 Bundle 节省: 8-12KB

2. **`DonationsTable.tsx`** - 复选框处理函数优化
   - `handleSelectAll` 添加 `useCallback`，依赖 `filteredDonations`
   - `handleSelectOne` 添加 `useCallback` + 函数式 `setState`，无依赖
   - 新增 `handleSelectGroup` 函数，优化分组全选的内联处理

### v1.0.0 (2026-01-21)

- 初始版本：完成 Vercel React 最佳实践分析报告

---

**文档版本**: 1.3.0
**最后更新**: 2026-01-21
