# 重复代码提取方案

> 基于对 40+ 组件文件的扫描分析，按保守原则筛选真正值得提取的公共代码

---

## 提取原则

在决定是否提取公共组件时，必须遵循以下原则：

### 必须遵守

1. **不影响页面逻辑** - 提取不能改变原有组件的行为
2. **不统一特异化样式** - 如果样式差异是有意的设计决策，不应强行统一
3. **简单参数优先** - 如果需要复杂参数（colorMap、多层嵌套配置）才能工作，则不应提取
4. **命名清晰** - 提取的组件应有准确描述其功能的名称
5. **位置合理** - 放在符合其职责的目录中

### 不应提取的情况

- 样式相似但颜色/间距有细微差异（这通常是设计意图）
- 结构类似但内容逻辑不同（如不同的条件渲染）
- 需要传入复杂配置对象才能工作
- 提取后代码量反而增加

### 适合提取的情况

- 代码逐字相同（如滚动锁定逻辑）
- 纯展示组件，只需 1-2 个简单参数（如加载动画）
- 纯逻辑 Hook，无样式依赖

---

## 一、分析结果

经过按原则重新评估，原先识别的 12 个模式中，**仅 1 个**值得提取：

| 模式 | 决策 | 理由 |
|------|------|------|
| `useBodyScrollLock` | ✅ 提取 | 代码逐字相同，纯逻辑，无参数 |
| `Spinner` | ❌ 不提取 | 已有 `Loader2Icon`；内联 SVG 是不同设计风格 |
| `StatusBadge` | ❌ 不提取 | 各徽章颜色映射逻辑不同，需复杂 colorMap |
| `Modal` | ❌ 不提取 | 各弹窗内容结构差异大，滚动锁定用 Hook 解决即可 |
| `SectionHeader` | ❌ 不提取 | 每个章节标题样式、布局、额外元素不同，是设计意图 |
| `FeatureCard` | ❌ 不提取 | 卡片内容结构各异，渐变/布局是特异化设计 |
| `FundingInfo` | ❌ 不提取 | 条件逻辑复杂，显示内容因场景而异 |
| `InfoRow` | ❌ 不提取 | 收益太小，每处只节省 1-2 行 |
| `EmptyState` | ❌ 不提取 | 各处空状态样式/图标不同 |
| `TableToolbar` | ❌ 不提取 | 过滤器配置复杂，需大量参数 |
| `ModalHeader` | ❌ 不提取 | 配合 Modal 一起，不单独提取 |

---

## 二、值得提取的代码

### 2.1 useBodyScrollLock Hook

**类型**: 自定义 Hook（纯逻辑）

**路径**: `lib/hooks/useBodyScrollLock.ts`

**问题**: 3 个 Modal 文件中存在**逐字相同**的滚动锁定代码（约 20 行/处）

**已更新文件** (✅ 已完成):
- `components/admin/ProjectEditModal.tsx` ✅
- `components/admin/DonationEditModal.tsx` ✅
- `components/admin/BatchDonationEditModal.tsx` ✅

**未更新文件** (行为不同，保持原样):
- `components/common/BottomSheet.tsx` - 使用简化的 overflow 模式，无 position:fixed
- `components/layout/GlobalLoadingSpinner.tsx` - 清理时滚动到顶部而非恢复位置（页面导航意图）

**重复代码** (完全相同):
```tsx
useEffect(() => {
  const scrollY = window.scrollY
  document.body.style.overflow = 'hidden'
  document.body.style.position = 'fixed'
  document.body.style.top = `-${scrollY}px`
  document.body.style.width = '100%'

  return () => {
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
    window.scrollTo(0, scrollY)
  }
}, [])
```

**提取方案**:

```tsx
// lib/hooks/useBodyScrollLock.ts
'use client'

import { useEffect } from 'react'

/**
 * 锁定页面滚动的 Hook
 * 用于 Modal、BottomSheet 等需要阻止背景滚动的场景
 *
 * @param isLocked - 是否锁定，默认 true
 */
export function useBodyScrollLock(isLocked: boolean = true) {
  useEffect(() => {
    if (!isLocked) return

    const scrollY = window.scrollY
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [isLocked])
}
```

**使用方式**:
```tsx
// 之前 (20 行)
useEffect(() => {
  const scrollY = window.scrollY
  document.body.style.overflow = 'hidden'
  // ... 15+ 行代码
}, [])

// 之后 (1 行)
useBodyScrollLock()

// 或条件锁定
useBodyScrollLock(isOpen)
```

**收益**:
- 节省 ~100 行代码（5 处 × 20 行）
- 统一滚动锁定行为
- 便于未来修复浏览器兼容性问题

---

## 三、不应提取的代码（及理由）

### 3.0 Spinner 加载动画

**为什么不提取**:

1. **已有 `Loader2Icon`**：`components/icons/index.tsx` 中已有线条风格的加载图标
2. **两种设计风格不同**：
   - `Loader2Icon`：线条风格 (stroke)，用于 DonationResultViewer、ImageLightbox
   - 内联 SVG：实心圆环风格 (fill)，用于支付流程

```tsx
// Loader2Icon - 线条风格
<path d="M21 12a9 9 0 1 1-6.219-8.56" />

// 内联 SVG - 实心圆环风格
<circle className="opacity-25" /> + <path className="opacity-75" />
```

这是**两种不同的设计风格**，强行统一会破坏设计意图。

### 3.1 StatusBadge

**为什么不提取**:

虽然 `ProjectStatusBadge` 和 `DonationStatusBadge` 基础样式相似：
```tsx
// 看起来相似
const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
```

但它们各自有**特异化的颜色映射逻辑**：

```tsx
// ProjectStatusBadge - 根据项目状态映射颜色
switch (status) {
  case 'planned': return 'bg-ukraine-gold-100 text-ukraine-gold-800'
  case 'active': return 'bg-life-100 text-life-800'
  case 'completed': return 'bg-ukraine-blue-100 text-ukraine-blue-800'
  // ...
}

// DonationStatusBadge - 从 STATUS_COLORS 常量获取
const colors = STATUS_COLORS[status] // 14 种状态，各有不同颜色
```

如果要提取，需要传入复杂的 `colorMap` 参数，违反简单参数原则。

---

### 3.2 Modal 容器

**为什么不提取**:

虽然 overlay 样式相似：
```tsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
```

但各 Modal 的**内容结构差异巨大**：
- `ProjectEditModal`: 表单 + i18n 字段编辑
- `DonationEditModal`: 状态进度 + 文件上传 + 预览
- `BroadcastModal`: 富文本编辑器 + 收件人选择

滚动锁定问题已通过 `useBodyScrollLock` 解决，无需再封装 Modal 容器。

---

### 3.3 SectionHeader 章节标题

**为什么不提取**:

对比两个章节的标题区域：

```tsx
// MissionSection - 白色文字，h1，无按钮
<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-3 text-white">
  {t('title')}
</h1>

// ApproachSection - 深色文字，h2，有按钮
<h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
  {t('title')}
</h2>
<button onClick={handleScrollToCompliance}>...</button>
```

这些差异是**设计意图**，不是重复。强行统一会丢失设计灵活性。

---

### 3.4 FeatureCard 特性卡片

**为什么不提取**:

虽然卡片外框相似，但内部结构差异大：
- 有的卡片有图标 + 列表
- 有的只有标题 + 描述
- 渐变颜色各不相同

这是同一设计系统下的**有意变体**，不是无意重复。

---

## 四、实施计划 ✅ 已完成

### 步骤 1: 创建 Hook ✅

```bash
mkdir -p lib/hooks
# 创建 lib/hooks/useBodyScrollLock.ts
```

### 步骤 2: 更新引用 ✅

已更新以下文件，用 `useBodyScrollLock()` 替换内联的滚动锁定代码：
- ✅ `components/admin/ProjectEditModal.tsx`
- ✅ `components/admin/DonationEditModal.tsx`
- ✅ `components/admin/BatchDonationEditModal.tsx`

未更新（行为不同）：
- ⏭️ `components/common/BottomSheet.tsx` - 简化 overflow 模式
- ⏭️ `components/layout/GlobalLoadingSpinner.tsx` - 导航时滚动到顶部

### 步骤 3: 验证 ✅

```bash
npm run build  # 构建成功
```

---

## 五、实际收益

| 指标 | 数值 |
|------|------|
| 节省代码行数 | ~60 行 (3 × 20 行) |
| 受影响文件数 | 3 个 |
| 风险等级 | 低（纯逻辑提取） |
| 状态 | ✅ 已完成 |

---

## 六、目录结构更新

```
lib/
├── hooks/
│   └── useBodyScrollLock.ts   # ✅ 已创建
└── ...
```

---

**文档版本**: 2.2
**更新日期**: 2026-01-14
**更新说明**: useBodyScrollLock 提取已完成；仅更新 3 个行为相同的 Modal 文件
