# 项目详情页架构

> 每个项目独立开发详情页，不使用通用模板

---

## 目录结构

```
components/projects/
├── detail-pages/                    # 项目详情页组件（每个项目独立）
│   ├── index.ts                     # 统一导出入口
│   ├── Project0/                    # 项目0: Way to Health 康复中心
│   │   ├── index.tsx                # 主组件
│   │   ├── EmployeeCarousel.tsx     # 员工照片轮播
│   │   └── CollapsibleGallery.tsx   # 可折叠图片画廊
│   └── Project3/                    # 项目3: 圣诞礼物计划
│       └── index.tsx                # 主组件（整合详情、物资、进度、成果）
│
├── shared/                          # 共享的基础组件
│   ├── index.ts                     # 统一导出入口
│   ├── ProjectProgressBar.tsx       # 进度条组件
│   └── ProjectResultsMasonry.tsx    # 瀑布流图片展示
│
├── ProjectsGrid.tsx                 # 项目网格（首页）
├── ProjectsGallery.tsx              # 项目选择库（捐赠页）
├── ProjectCard.tsx                  # 项目卡片
├── ProjectProgressCard.tsx          # 进度卡片（可被项目详情页使用）
└── ...
```

---

## 核心原则

### 1. 每个项目独立开发

每个项目的详情页是独立的组件，可以自由定义内容结构和UI布局。

```typescript
// components/projects/detail-pages/Project0/index.tsx
export default function Project0DetailContent({ project, locale }: Props) {
  // 项目0特有的内容：康复中心介绍、团队、治疗项目、财务报告等
}

// components/projects/detail-pages/Project3/index.tsx
export default function Project3DetailContent({ project, locale }: Props) {
  // 项目3特有的内容：机构走访、儿童礼物清单、物资采购等
}
```

### 2. 统一的接口

所有项目详情组件遵循相同的 Props 接口：

```typescript
interface ProjectDetailProps {
  project: ProjectStats  // 来自数据库的项目信息
  locale: string         // 当前语言
}
```

### 3. 组件注册机制

在 `DonatePageClient.tsx` 中通过 switch 语句注册项目组件：

```typescript
function renderProjectDetail(
  projectId: number,
  project: ProjectStats,
  locale: string
): React.ReactNode {
  switch (projectId) {
    case 0:
      return <Project0DetailContent project={project} locale={locale} />
    case 3:
      return <Project3DetailContent project={project} locale={locale} />
    default:
      return <DefaultFallback locale={locale} />
  }
}
```

---

## 新增项目指南

### 步骤1: 创建项目目录

```bash
mkdir -p components/projects/detail-pages/ProjectN
```

### 步骤2: 创建主组件

```typescript
// components/projects/detail-pages/ProjectN/index.tsx
'use client'

import type { ProjectStats } from '@/types'

interface ProjectNDetailContentProps {
  project: ProjectStats
  locale: string
}

export default function ProjectNDetailContent({
  project,
  locale,
}: ProjectNDetailContentProps) {
  // 你的项目内容...
}
```

### 步骤3: 创建 JSON 内容文件

```bash
# 创建多语言 JSON 文件
touch public/content/projects/project-N-en.json
touch public/content/projects/project-N-zh.json
touch public/content/projects/project-N-ua.json
```

### 步骤4: 导出组件

```typescript
// components/projects/detail-pages/index.ts
export { default as ProjectNDetailContent } from './ProjectN'
```

### 步骤5: 注册组件

```typescript
// app/[locale]/donate/DonatePageClient.tsx
import { ProjectNDetailContent } from '@/components/projects/detail-pages'

function renderProjectDetail(...) {
  switch (projectId) {
    // ...existing cases...
    case N:
      return <ProjectNDetailContent project={project} locale={locale} />
  }
}
```

---

## 共享组件使用

可以复用 `shared/` 目录下的基础组件：

```typescript
import { ProjectProgressBar, ProjectResultsMasonry } from '@/components/projects/shared'

// 在你的项目详情组件中使用
<ProjectProgressBar
  current={project.current_units}
  target={project.target_units}
  unitName="items"
/>

<ProjectResultsMasonry results={results} />
```

---

## 项目内容文件

每个项目的内容存储在 JSON 文件中：

```
public/content/projects/
├── project-0-en.json    # 项目0 英文内容
├── project-0-zh.json    # 项目0 中文内容
├── project-0-ua.json    # 项目0 乌克兰语内容
├── project-3-en.json
├── project-3-zh.json
├── project-3-ua.json
├── project-3-supplies-en.json   # 项目3 物资清单（可选）
├── project-3-supplies-zh.json
└── project-3-supplies-ua.json
```

JSON 结构由每个项目自定义，没有固定模板。

---

## 项目图片

每个项目的图片存储在独立目录：

```
public/images/projects/
├── project-0/
│   ├── event/          # 活动图片
│   ├── employer/       # 员工照片
│   ├── progress/       # 治疗进展
│   ├── result/         # 康复成果
│   └── financial/      # 财务报告
│
└── project-3/
    ├── details/        # 机构走访图片
    ├── results/        # 活动成果图片
    └── receipts/       # 采购凭证
```

---

## 当前项目概览

| 项目ID | 名称 | 类型 | 组件 |
|--------|------|------|------|
| 0 | Way to Health | 打赏项目 | `Project0DetailContent` |
| 3 | 圣诞礼物计划 | 物资项目 | `Project3DetailContent` |

---

## 遗留组件（保留但不推荐）

以下组件是旧模板系统的一部分，保留用于参考，但新项目不应使用：

- `ProjectDetailContent.tsx` - 旧的通用详情模板
- `ProjectSuppliesInfo.tsx` - 旧的物资清单模板

这些组件可能在未来版本中移除。
