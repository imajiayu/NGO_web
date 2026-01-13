# 组件重构方案

> 目标：建立清晰的组件层级，解决命名混淆，提取公共组件

---

## 一、当前问题分析

### 1. 命名混淆：donate vs donation

| 文件夹 | 内容 | 实际用途 |
|--------|------|----------|
| `components/donate/` | DonationFormCard, PaymentMethodSelector, CryptoSelector, widgets/ | **捐赠表单**（用户输入、支付选择） |
| `components/donation/` | DonationStatusBadge, DonationStatusFlow, DonationResultViewer, ProjectDonationList | **捐赠展示**（状态、历史、结果） |

**问题**：`donate` 和 `donation` 语义相近，难以直观区分功能边界。

### 2. 空文件夹

- `components/layout/` - 空目录
- `components/projects/custom/` - 空目录

### 3. 公共组件分散

根目录下的通用组件缺乏分类：
- `BottomSheet.tsx` - 移动端底部抽屉（UI 组件）
- `ImageLightbox.tsx` - 图片灯箱（UI 组件）
- `CopyButton.tsx` - 复制按钮（UI 组件）
- `Navigation.tsx` - 导航栏（布局组件）
- `Footer.tsx` - 页脚（布局组件）
- `GlobalLoadingSpinner.tsx` - 全局加载（布局组件）

### 4. 状态徽章分散

两个功能相似的徽章组件分散在不同位置：
- `projects/ProjectStatusBadge.tsx`
- `donation/DonationStatusBadge.tsx`

---

## 二、重构方案

### 新目录结构

```
components/
├── common/                     # 通用 UI 组件（可跨页面复用）
│   ├── BottomSheet.tsx
│   ├── CopyButton.tsx
│   ├── ImageLightbox.tsx
│   └── StatusBadge.tsx         # 新：通用状态徽章基础组件
│
├── icons/                      # 图标（保持不变）
│   └── index.tsx
│
├── layout/                     # 布局组件（页面框架）
│   ├── Navigation.tsx
│   ├── Footer.tsx
│   └── GlobalLoadingSpinner.tsx
│
├── home/                       # 首页特有组件（保持不变）
│   ├── MissionSection.tsx
│   ├── ApproachSection.tsx
│   ├── ImpactSection.tsx
│   ├── DonationJourneySection.tsx
│   ├── ComplianceSection.tsx
│   └── ProjectResultsSection.tsx
│
├── projects/                   # 项目相关组件
│   ├── ProjectCard.tsx
│   ├── ProjectsGrid.tsx
│   ├── ProjectsGallery.tsx
│   ├── ProjectStatusBadge.tsx
│   ├── ProjectResultsMarquee.tsx
│   ├── LongTermBadge.tsx
│   ├── shared/                 # 项目共享子组件
│   │   ├── ProjectProgressBar.tsx
│   │   ├── ProjectProgressSection.tsx
│   │   └── ProjectResultsMasonry.tsx
│   └── detail-pages/           # 项目详情页（保持不变）
│       ├── Project0/
│       └── Project3/
│
├── donate-form/                # 捐赠表单（原 donate/）
│   ├── DonationFormCard.tsx
│   ├── PaymentMethodSelector.tsx
│   ├── CryptoSelector.tsx
│   └── widgets/
│       ├── WayForPayWidget.tsx
│       └── NowPaymentsWidget.tsx
│
├── donation-display/           # 捐赠展示（原 donation/）
│   ├── DonationStatusBadge.tsx
│   ├── DonationStatusFlow.tsx
│   ├── DonationResultViewer.tsx
│   └── ProjectDonationList.tsx
│
└── admin/                      # 管理员组件（保持不变）
    ├── AdminNav.tsx
    ├── ProjectsTable.tsx
    ├── ProjectCreateModal.tsx
    ├── ProjectEditModal.tsx
    ├── DonationsTable.tsx
    ├── DonationEditModal.tsx
    ├── BatchDonationEditModal.tsx
    ├── DonationStatusProgress.tsx
    ├── SubscriptionsTable.tsx
    └── BroadcastModal.tsx
```

---

## 三、具体变更

### 3.1 重命名文件夹

| 原路径 | 新路径 | 说明 |
|--------|--------|------|
| `components/donate/` | `components/donate-form/` | 明确表示"捐赠表单"功能 |
| `components/donation/` | `components/donation-display/` | 明确表示"捐赠展示"功能 |

### 3.2 移动组件到 common/

| 原位置 | 新位置 |
|--------|--------|
| `components/BottomSheet.tsx` | `components/common/BottomSheet.tsx` |
| `components/CopyButton.tsx` | `components/common/CopyButton.tsx` |
| `components/ImageLightbox.tsx` | `components/common/ImageLightbox.tsx` |

### 3.3 移动组件到 layout/

| 原位置 | 新位置 |
|--------|--------|
| `components/Navigation.tsx` | `components/layout/Navigation.tsx` |
| `components/Footer.tsx` | `components/layout/Footer.tsx` |
| `components/GlobalLoadingSpinner.tsx` | `components/layout/GlobalLoadingSpinner.tsx` |

### 3.4 删除空目录

- 删除 `components/projects/custom/`（空目录）
- `components/layout/` 移动后将有内容

---

## 四、导入路径更新

重构后需要更新的导入路径：

### 4.1 布局组件导入更新

```typescript
// 旧
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import GlobalLoadingSpinner from '@/components/GlobalLoadingSpinner'

// 新
import Navigation from '@/components/layout/Navigation'
import Footer from '@/components/layout/Footer'
import GlobalLoadingSpinner from '@/components/layout/GlobalLoadingSpinner'
```

### 4.2 通用组件导入更新

```typescript
// 旧
import BottomSheet from '@/components/BottomSheet'
import CopyButton from '@/components/CopyButton'
import ImageLightbox from '@/components/ImageLightbox'

// 新
import BottomSheet from '@/components/common/BottomSheet'
import CopyButton from '@/components/common/CopyButton'
import ImageLightbox from '@/components/common/ImageLightbox'
```

### 4.3 捐赠表单组件导入更新

```typescript
// 旧
import DonationFormCard from '@/components/donate/DonationFormCard'
import PaymentMethodSelector from '@/components/donate/PaymentMethodSelector'
import WayForPayWidget from '@/components/donate/widgets/WayForPayWidget'

// 新
import DonationFormCard from '@/components/donate-form/DonationFormCard'
import PaymentMethodSelector from '@/components/donate-form/PaymentMethodSelector'
import WayForPayWidget from '@/components/donate-form/widgets/WayForPayWidget'
```

### 4.4 捐赠展示组件导入更新

```typescript
// 旧
import DonationStatusBadge from '@/components/donation/DonationStatusBadge'
import DonationStatusFlow from '@/components/donation/DonationStatusFlow'
import DonationResultViewer from '@/components/donation/DonationResultViewer'
import ProjectDonationList from '@/components/donation/ProjectDonationList'

// 新
import DonationStatusBadge from '@/components/donation-display/DonationStatusBadge'
import DonationStatusFlow from '@/components/donation-display/DonationStatusFlow'
import DonationResultViewer from '@/components/donation-display/DonationResultViewer'
import ProjectDonationList from '@/components/donation-display/ProjectDonationList'
```

---

## 五、执行步骤

### 阶段 1：创建目录结构
1. 创建 `components/common/` 目录
2. 确认 `components/layout/` 目录存在

### 阶段 2：移动布局组件
1. 移动 Navigation.tsx → layout/
2. 移动 Footer.tsx → layout/
3. 移动 GlobalLoadingSpinner.tsx → layout/
4. 更新所有导入路径

### 阶段 3：移动通用组件
1. 移动 BottomSheet.tsx → common/
2. 移动 CopyButton.tsx → common/
3. 移动 ImageLightbox.tsx → common/
4. 更新所有导入路径

### 阶段 4：重命名捐赠相关文件夹
1. 重命名 donate/ → donate-form/
2. 重命名 donation/ → donation-display/
3. 更新所有导入路径

### 阶段 5：清理
1. 删除 `components/projects/custom/`（空目录）
2. 验证构建通过
3. 运行测试

---

## 六、影响范围

### 需要更新导入的文件（预估）

| 组件 | 可能被引用的位置 |
|------|------------------|
| Navigation | app/[locale]/layout.tsx |
| Footer | app/[locale]/layout.tsx |
| GlobalLoadingSpinner | app/[locale]/layout.tsx |
| BottomSheet | app/[locale]/donate/page.tsx |
| ImageLightbox | components/donation-display/DonationResultViewer.tsx, 项目详情页 |
| CopyButton | 捐赠追踪页等 |
| DonationFormCard | app/[locale]/donate/page.tsx |
| DonationStatusBadge | 捐赠追踪页、管理员页面 |

---

## 七、可选增强（未来考虑）

### 7.1 提取通用 StatusBadge

`ProjectStatusBadge` 和 `DonationStatusBadge` 有相似的结构，可以提取公共基础组件：

```typescript
// components/common/StatusBadge.tsx
interface StatusBadgeProps {
  status: string
  colorMap: Record<string, { bg: string; text: string; border: string }>
  label: string
}

export default function StatusBadge({ status, colorMap, label }: StatusBadgeProps) {
  const colors = colorMap[status] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}>
      {label}
    </span>
  )
}
```

然后 `ProjectStatusBadge` 和 `DonationStatusBadge` 可以复用此基础组件。

### 7.2 创建 barrel exports

为每个文件夹创建 `index.ts` 方便导入：

```typescript
// components/common/index.ts
export { default as BottomSheet } from './BottomSheet'
export { default as CopyButton } from './CopyButton'
export { default as ImageLightbox } from './ImageLightbox'
```

---

## 八、确认清单

- [ ] 阶段 1：创建目录结构
- [ ] 阶段 2：移动布局组件
- [ ] 阶段 3：移动通用组件
- [ ] 阶段 4：重命名捐赠相关文件夹
- [ ] 阶段 5：清理和验证
- [ ] 更新 CLAUDE.md 中的目录结构说明

---

**文档版本**: 1.0
**创建日期**: 2026-01-14
