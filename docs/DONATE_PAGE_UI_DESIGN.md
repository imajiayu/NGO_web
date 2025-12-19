# 捐赠页面 UI 设计文档

## 设计概览

捐赠页面将采用全新的布局设计，提供更直观的项目选择和捐赠流程。页面主要分为两个部分：
1. **项目选择画廊**（页面顶部）
2. **捐赠内容区**（分为左侧项目详情 + 右侧捐赠表单）

---

## 1. 项目选择画廊（Project Selection Gallery）

### 1.1 位置与布局
- **位置**: 页面最顶部（紧接导航栏下方）
- **容器**: 全宽背景，内容区 max-w-7xl 居中
- **背景**: 浅色渐变背景（bg-gradient-to-b from-gray-50 to-white）
- **间距**: py-12（上下padding）

### 1.2 组件复用方案

#### 1.2.1 重构 ProjectCard 组件
创建两种显示模式：

**模式一：完整模式 (Full Mode)**
- **用途**: 首页项目展示
- **特性**:
  - 显示所有项目信息（地点、价格、日期、进度等）
  - 包含 "Donate Now" 按钮
  - 卡片高度固定（适合画廊展示）
  - hover 效果：阴影增强 + 轻微上移

**模式二：简略模式 (Compact Mode)**
- **用途**: 捐赠页项目选择
- **特性**:
  - **默认状态**: 仅显示项目名称 + 状态标签
  - **hover 状态**: 展开显示完整信息
  - **无按钮**: 不显示 "Donate Now" 按钮
  - **可点击**: 整个卡片可点击选择
  - **选中样式**:
    - 边框变为蓝色加粗 (border-blue-600 border-4)
    - 背景添加浅蓝色 (bg-blue-50)
    - 显示选中图标（右上角勾选标记）
  - **尺寸**: 更窄 (w-64 vs w-80)

#### 1.2.2 组件 Props 接口设计

```typescript
interface ProjectCardProps {
  project: ProjectStats
  locale: string

  // 显示模式
  mode?: 'full' | 'compact'  // 默认 'full'

  // 交互配置
  showProgress?: boolean     // 是否显示进度条
  showDonateButton?: boolean // 是否显示捐赠按钮

  // 选择状态（仅 compact 模式使用）
  isSelected?: boolean       // 是否被选中
  onSelect?: (id: number) => void  // 选择回调
}
```

#### 1.2.3 组件文件结构

```
components/projects/
├── ProjectCard.tsx          # 主卡片组件（支持两种模式）
├── ProjectCardFull.tsx      # 完整模式的内容组件
├── ProjectCardCompact.tsx   # 简略模式的内容组件
├── ProjectsGallery.tsx      # 新：画廊容器组件（支持横向滚动）
└── ProjectProgressBar.tsx   # 进度条组件（已存在）
```

### 1.3 画廊容器设计 (ProjectsGallery)

#### 1.3.1 功能需求
- 横向滚动展示所有激活的项目
- 支持初始选中项目（从首页跳转时）
- 响应式设计（移动端显示滚动提示）
- 平滑滚动动画

#### 1.3.2 Props 接口

```typescript
interface ProjectsGalleryProps {
  // 项目数据
  projects: ProjectStats[]
  locale: string

  // 选择状态
  selectedProjectId: number | null
  onProjectSelect: (id: number) => void

  // 显示模式
  mode: 'full' | 'compact'  // 'full' 用于首页，'compact' 用于捐赠页

  // 初始选中（可选）
  initialSelectedId?: number  // 从 URL 参数获取
}
```

#### 1.3.3 布局结构

```jsx
<section className="bg-gradient-to-b from-gray-50 to-white py-12">
  <div className="max-w-7xl mx-auto px-6">
    {/* 标题（仅捐赠页显示） */}
    {mode === 'compact' && (
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          {t('donate.selectProject')}
        </h2>
        <p className="text-gray-600 mt-2">
          {t('donate.selectProjectDescription')}
        </p>
      </div>
    )}

    {/* 横向滚动容器 */}
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-min px-2">
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            locale={locale}
            mode={mode}
            isSelected={selectedProjectId === project.id}
            onSelect={onProjectSelect}
          />
        ))}
      </div>
    </div>

    {/* 滚动提示 */}
    {projects.length > 3 && (
      <div className="text-center mt-4">
        <p className="text-sm text-gray-500">
          ← {t('scrollToViewAll')} →
        </p>
      </div>
    )}
  </div>
</section>
```

### 1.4 从首页跳转的处理

#### 1.4.1 URL 参数传递
```typescript
// 首页 ProjectCard 的 Donate Now 按钮
<Link href={`/donate?project=${project.id}`}>
  {t('donateNow')}
</Link>
```

#### 1.4.2 捐赠页接收参数
```typescript
// app/[locale]/donate/page.tsx
export default async function DonatePage({
  searchParams
}: {
  searchParams: { project?: string }
}) {
  const initialProjectId = searchParams.project
    ? parseInt(searchParams.project)
    : null

  // 传递给客户端组件
  return <DonatePageClient initialProjectId={initialProjectId} />
}
```

---

## 2. 捐赠内容区（Donation Content Area）

### 2.1 整体布局

采用经典的两栏布局：
- **左侧 (60%)**：项目详情内容
- **右侧 (40%)**：统一捐赠表单
- **响应式**：移动端变为上下堆叠

```jsx
<div className="max-w-7xl mx-auto px-6 py-12">
  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
    {/* 左侧：项目详情 */}
    <div className="lg:col-span-3">
      <ProjectDetailContent projectId={selectedProjectId} />
    </div>

    {/* 右侧：捐赠表单 */}
    <div className="lg:col-span-2">
      <DonationFormCard
        project={selectedProject}
        locale={locale}
      />
    </div>
  </div>
</div>
```

### 2.2 左侧：项目详情内容 (ProjectDetailContent)

#### 2.2.1 功能需求
- **每个项目独立管理内容**
- 删除"默认"和"自定义"的选择逻辑
- 支持富文本内容（Markdown 或 Rich Text）
- 可包含图片、视频、文本等多媒体内容

#### 2.2.2 内容存储方案

**方案 A：数据库字段存储**
```sql
-- 在 projects 表添加字段
ALTER TABLE projects ADD COLUMN detail_content TEXT;
ALTER TABLE projects ADD COLUMN detail_content_zh TEXT;
```

**方案 B：文件系统存储（推荐）**
```
components/projects/content/
├── project-1-en.mdx      # 项目1英文内容
├── project-1-zh.mdx      # 项目1中文内容
├── project-2-en.mdx
├── project-2-zh.mdx
└── ...
```

采用 MDX 格式的优势：
- 支持 React 组件嵌入
- 支持 Markdown 语法
- 便于版本控制
- 可以包含图片、视频等资源引用

#### 2.2.3 组件实现

```typescript
// components/projects/ProjectDetailContent.tsx
interface ProjectDetailContentProps {
  projectId: number
  locale: string
}

export default async function ProjectDetailContent({
  projectId,
  locale
}: ProjectDetailContentProps) {
  // 动态导入对应的 MDX 文件
  const Content = await import(
    `@/components/projects/content/project-${projectId}-${locale}.mdx`
  ).catch(() => null)

  if (!Content) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
        <p className="text-gray-500 text-center">
          {locale === 'en'
            ? 'Content coming soon...'
            : '内容即将推出...'}
        </p>
      </div>
    )
  }

  return (
    <article className="prose prose-lg max-w-none bg-white rounded-xl border-2 border-gray-200 p-8">
      <Content />
    </article>
  )
}
```

#### 2.2.4 内容模板示例

```mdx
// components/projects/content/project-1-en.mdx

# Clean Water for Rural Communities

## Project Overview

Our Clean Water Project aims to provide sustainable access to clean drinking water
for rural communities in remote areas.

![Project Location](/images/projects/project-1-map.jpg)

## What We Do

- Install water filtration systems
- Train local technicians
- Provide ongoing maintenance support
- Monitor water quality regularly

## Impact So Far

<div className="grid grid-cols-2 gap-4 my-6">
  <div className="bg-blue-50 p-4 rounded-lg">
    <p className="text-3xl font-bold text-blue-600">1,200+</p>
    <p className="text-gray-700">Families Served</p>
  </div>
  <div className="bg-green-50 p-4 rounded-lg">
    <p className="text-3xl font-bold text-green-600">25</p>
    <p className="text-gray-700">Villages Reached</p>
  </div>
</div>

## Your Contribution

Each $10 donation provides:
- One complete water filtration kit
- Installation and training
- 6 months of maintenance

## Latest Updates

### December 2025
We've just completed installation in Village #25! Watch the video below...

<video controls className="w-full rounded-lg my-4">
  <source src="/videos/project-1-update.mp4" type="video/mp4" />
</video>
```

### 2.3 右侧：捐赠表单卡片 (DonationFormCard)

#### 2.3.1 功能需求
- 简化表单布局（移除项目选择下拉框）
- 固定侧边栏（sticky positioning）
- 显示当前选中项目的摘要信息
- 保持原有的表单字段和验证逻辑

#### 2.3.2 组件结构

```typescript
interface DonationFormCardProps {
  project: ProjectStats | null
  locale: string
}

export default function DonationFormCard({
  project,
  locale
}: DonationFormCardProps) {
  if (!project) {
    return (
      <div className="lg:sticky lg:top-24">
        <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-500">
            {locale === 'en'
              ? 'Please select a project above to continue'
              : '请在上方选择一个项目以继续'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="lg:sticky lg:top-24">
      <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg overflow-hidden">
        {/* 项目摘要 */}
        <div className="bg-gradient-to-br from-blue-50 to-white p-6 border-b border-gray-200">
          <h3 className="font-bold text-lg text-gray-900 mb-2">
            {project.project_name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPinIcon className="w-4 h-4" />
            <span>{project.location}</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">
              ${project.unit_price.toFixed(2)}
            </span>
            <span className="text-sm text-gray-500">
              per {project.unit_name}
            </span>
          </div>
        </div>

        {/* 捐赠表单 */}
        <div className="p-6">
          <DonationForm project={project} locale={locale} />
        </div>
      </div>
    </div>
  )
}
```

#### 2.3.3 表单字段（保持不变）
- 数量选择（快捷按钮 + 自定义输入）
- 捐赠者姓名
- 捐赠者邮箱
- 联系方式（Telegram/WhatsApp，可选）
- 留言（可选）
- 提交按钮

#### 2.3.4 Sticky 定位说明
```css
/* 固定在视口顶部 24px（96px）位置 */
.lg\:sticky {
  position: sticky;
  top: 6rem; /* 为导航栏留出空间 */
}
```

---

## 3. 删除的内容

### 3.1 需要删除的代码

#### 文件：`app/[locale]/donate/donation-form.tsx`
**删除**:
- 项目选择下拉框（第 94-112 行）
- 所有与 `selectedProjectId` state 相关的逻辑

#### 文件：`components/projects/GenericProjectContent.tsx`
**删除**:
- 整个文件（如果存在默认内容逻辑）

### 3.2 需要保留的代码
- 数量选择逻辑
- 捐赠者信息表单
- 联系方式表单
- 留言表单
- 表单验证逻辑
- Stripe 支付集成
- 错误处理

---

## 4. 页面状态管理

### 4.1 状态提升方案

由于项目选择画廊和捐赠表单需要共享选中状态，需要将状态提升到父组件。

```typescript
// app/[locale]/donate/DonatePageClient.tsx
'use client'

export default function DonatePageClient({
  projects,
  locale,
  initialProjectId
}: {
  projects: ProjectStats[]
  locale: string
  initialProjectId: number | null
}) {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    initialProjectId
  )

  const selectedProject = projects.find(p => p.id === selectedProjectId)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 项目选择画廊 */}
      <ProjectsGallery
        projects={projects}
        locale={locale}
        mode="compact"
        selectedProjectId={selectedProjectId}
        onProjectSelect={setSelectedProjectId}
      />

      {/* 内容区 */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* 左侧：项目详情 */}
          <div className="lg:col-span-3">
            {selectedProjectId ? (
              <ProjectDetailContent
                projectId={selectedProjectId}
                locale={locale}
              />
            ) : (
              <EmptyState locale={locale} />
            )}
          </div>

          {/* 右侧：捐赠表单 */}
          <div className="lg:col-span-2">
            <DonationFormCard
              project={selectedProject || null}
              locale={locale}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 4.2 空状态处理

```typescript
function EmptyState({ locale }: { locale: string }) {
  return (
    <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <ArrowUpIcon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {locale === 'en' ? 'Select a Project' : '选择一个项目'}
      </h3>
      <p className="text-gray-500">
        {locale === 'en'
          ? 'Choose a project from the gallery above to view details and make a donation'
          : '从上方画廊中选择一个项目以查看详情并进行捐赠'}
      </p>
    </div>
  )
}
```

---

## 5. 响应式设计

### 5.1 断点设计

| 断点 | 屏幕宽度 | 布局变化 |
|------|---------|---------|
| sm | 640px+ | 画廊显示 2 个卡片 |
| md | 768px+ | 画廊显示 3 个卡片 |
| lg | 1024px+ | 内容区两栏布局，表单固定侧边 |
| xl | 1280px+ | 画廊显示 4 个卡片 |

### 5.2 移动端优化

#### 画廊
- 横向滚动
- 显示滚动提示
- 触摸友好的卡片间距（gap-4）

#### 内容区
- 上下堆叠（项目详情在上，表单在下）
- 表单不固定，随页面滚动
- 表单变为全宽

```jsx
<div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
  {/* 移动端：顺序1 */}
  <div className="lg:col-span-3">
    <ProjectDetailContent />
  </div>

  {/* 移动端：顺序2，lg+：固定侧边 */}
  <div className="lg:col-span-2">
    <div className="lg:sticky lg:top-24">
      <DonationFormCard />
    </div>
  </div>
</div>
```

---

## 6. 交互体验优化

### 6.1 滚动行为

#### 选中项目后自动滚动
```typescript
const handleProjectSelect = (id: number) => {
  setSelectedProjectId(id)

  // 平滑滚动到内容区
  const contentSection = document.getElementById('donation-content')
  contentSection?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })
}
```

#### 画廊自动滚动到选中项
```typescript
useEffect(() => {
  if (selectedProjectId) {
    const selectedCard = document.getElementById(`project-card-${selectedProjectId}`)
    selectedCard?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    })
  }
}, [selectedProjectId])
```

### 6.2 加载状态

```typescript
// 加载内容时的骨架屏
function ProjectContentSkeleton() {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-8 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-4/6 mb-4"></div>
      <div className="h-64 bg-gray-200 rounded w-full"></div>
    </div>
  )
}
```

### 6.3 过渡动画

```css
/* 卡片选中过渡 */
.project-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* hover 展开过渡 */
.project-card-compact {
  transition: height 0.3s ease-in-out;
}

/* 表单出现动画 */
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.donation-form-card {
  animation: slideInRight 0.4s ease-out;
}
```

---

## 7. 国际化（i18n）新增翻译

### 7.1 需要添加的翻译键

```json
// messages/en.json
{
  "donate": {
    "selectProject": "Select a Project",
    "selectProjectDescription": "Choose the project you'd like to support",
    "noProjectSelected": "Please select a project above to continue",
    "contentComingSoon": "Content coming soon...",
    "scrollToViewAll": "Scroll to view all projects"
  }
}

// messages/zh.json
{
  "donate": {
    "selectProject": "选择项目",
    "selectProjectDescription": "选择您想要支持的项目",
    "noProjectSelected": "请在上方选择一个项目以继续",
    "contentComingSoon": "内容即将推出...",
    "scrollToViewAll": "滚动查看所有项目"
  }
}
```

---

## 8. 技术实现清单

### 8.1 新建文件

- [ ] `components/projects/ProjectsGallery.tsx`
- [ ] `components/projects/ProjectCardCompact.tsx`
- [ ] `components/projects/ProjectCardFull.tsx`
- [ ] `components/projects/ProjectDetailContent.tsx`
- [ ] `components/projects/DonationFormCard.tsx`
- [ ] `app/[locale]/donate/DonatePageClient.tsx`
- [ ] `components/projects/content/project-1-en.mdx`
- [ ] `components/projects/content/project-1-zh.mdx`

### 8.2 修改文件

- [ ] `components/projects/ProjectCard.tsx` - 添加模式支持
- [ ] `app/[locale]/donate/page.tsx` - 改为服务端获取参数
- [ ] `app/[locale]/donate/donation-form.tsx` - 移除项目选择逻辑
- [ ] `messages/en.json` - 添加新翻译
- [ ] `messages/zh.json` - 添加新翻译

### 8.3 删除文件（可选）

- [ ] `components/projects/GenericProjectContent.tsx` - 如果存在默认内容逻辑

---

## 9. 依赖安装

### 9.1 MDX 支持

```bash
npm install @next/mdx @mdx-js/loader @mdx-js/react @types/mdx
```

### 9.2 next.config.js 配置

```javascript
const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
})

module.exports = withMDX({
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  // ... other config
})
```

### 9.3 Tailwind Typography（prose 样式）

```bash
npm install @tailwindcss/typography
```

```javascript
// tailwind.config.js
module.exports = {
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
```

---

## 10. 测试场景

### 10.1 功能测试

- [ ] 从首页跳转到捐赠页，项目已预选
- [ ] 在捐赠页切换项目，内容和表单同步更新
- [ ] 简略模式卡片 hover 显示完整信息
- [ ] 简略模式卡片点击选中，样式正确显示
- [ ] 表单在桌面端固定侧边，移动端正常滚动
- [ ] MDX 内容正确加载和渲染
- [ ] 空状态显示正确
- [ ] 滚动行为平滑自然

### 10.2 响应式测试

- [ ] 移动端 (< 640px): 卡片堆叠，表单在下
- [ ] 平板端 (768px - 1023px): 画廊滚动，内容堆叠
- [ ] 桌面端 (>= 1024px): 两栏布局，表单固定

### 10.3 国际化测试

- [ ] 英文界面所有文本正确显示
- [ ] 中文界面所有文本正确显示
- [ ] 语言切换后内容正确更新
- [ ] MDX 文件根据语言加载正确版本

---

## 11. 性能优化

### 11.1 图片优化
```jsx
import Image from 'next/image'

// 在 MDX 中使用 Next.js Image 组件
<Image
  src="/images/projects/project-1.jpg"
  alt="Project Image"
  width={800}
  height={600}
  className="rounded-lg"
  loading="lazy"
/>
```

### 11.2 代码分割
```typescript
// 动态导入 MDX 内容
const Content = dynamic(
  () => import(`@/components/projects/content/project-${projectId}-${locale}.mdx`),
  {
    loading: () => <ProjectContentSkeleton />,
    ssr: true
  }
)
```

### 11.3 缓存策略
```typescript
// app/[locale]/donate/page.tsx
export const revalidate = 3600 // 1小时缓存
```

---

## 12. 后续扩展

### 12.1 CMS 集成（未来可选）
- 使用 Strapi/Sanity/Contentful 管理项目内容
- 支持非技术人员编辑内容
- 实时预览功能

### 12.2 进阶功能
- 项目视频播放器
- 图片画廊/轮播
- 社交分享按钮
- 项目进度时间线
- 捐赠者墙（感谢捐赠者）

---

## 13. 实现优先级

### Phase 1: 核心功能（本周）
1. 重构 ProjectCard 支持两种模式
2. 创建 ProjectsGallery 组件
3. 重构捐赠页面布局（两栏）
4. 状态管理和 URL 参数处理
5. 基础样式和响应式

### Phase 2: 内容系统（下周）
1. 配置 MDX 支持
2. 创建项目内容模板
3. 实现 ProjectDetailContent 组件
4. 添加骨架屏和加载状态
5. 内容管理文档编写

### Phase 3: 优化完善（第三周）
1. 交互动画优化
2. 性能优化（图片、代码分割）
3. 完整测试
4. 文档完善
5. 部署上线

---

**文档版本**: 1.0
**创建日期**: 2025-12-18
**最后更新**: 2025-12-18
**作者**: NGO Platform Team
**审核状态**: ✅ 待开发

---

## 附录 A: 设计稿参考

### 捐赠页面完整布局示意

```
┌─────────────────────────────────────────────────────────────┐
│                     Navigation Bar                          │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│              Project Selection Gallery                      │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐         │
│  │ Proj │  │ Proj │  │ Proj │  │ Proj │  │ Proj │ → Scroll│
│  │  1   │  │  2   │  │  3   │  │  4   │  │  5   │         │
│  │ (✓)  │  │      │  │      │  │      │  │      │         │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘         │
│              ← Scroll to view all projects →                │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Donation Content Area                    │
│  ┌────────────────────────┐  ┌─────────────────────┐       │
│  │                        │  │                     │       │
│  │  Project Detail        │  │  Donation Form      │       │
│  │  Content (MDX)         │  │  ┌───────────────┐ │       │
│  │                        │  │  │ Project Name  │ │       │
│  │  # Title               │  │  │ Location      │ │       │
│  │  Description...        │  │  │ $10 per kit   │ │       │
│  │                        │  │  └───────────────┘ │       │
│  │  [Image]               │  │  Quantity: [1][2] │       │
│  │                        │  │  Name: [_______]  │       │
│  │  More content...       │  │  Email: [______]  │       │
│  │                        │  │  Message: [____]  │ Sticky │
│  │                        │  │  [Donate Now]     │       │
│  │                        │  │                     │       │
│  └────────────────────────┘  └─────────────────────┘       │
│           60% width                  40% width              │
└─────────────────────────────────────────────────────────────┘
```

### 简略模式卡片状态示意

**默认状态（未选中）**:
```
┌────────────────┐
│  Clean Water   │ ← 只显示名称
│  [active]      │ ← 状态标签
└────────────────┘
```

**Hover 状态**:
```
┌────────────────────────┐
│  Clean Water           │
│  [active] [long-term]  │
│  📍 Rural Area         │
│  💰 $10 per kit        │
│  📅 Start: Jan 2025    │
│  ──────────────────    │
│  ████████░░ 80%        │
│  50/100 kits           │
└────────────────────────┘
```

**选中状态**:
```
┌════════════════════════┐ ← 加粗蓝色边框
║  Clean Water        ✓  ║ ← 右上角勾选
║  [active] [long-term]  ║
║  📍 Rural Area         ║
║  💰 $10 per kit        ║
║  📅 Start: Jan 2025    ║
║  ──────────────────    ║
║  ████████░░ 80%        ║
║  50/100 kits           ║
└════════════════════════┘
  ← 背景浅蓝色
```

---

**备注**:
- 所有尺寸为示意，实际开发时根据设计调整
- 图标使用 Heroicons（已在项目中使用）
- 颜色遵循现有的设计系统（蓝色主题）
