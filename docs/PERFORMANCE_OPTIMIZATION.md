# 性能优化指南

本文档提供全面的响应速度优化方案，涵盖图片、代码、缓存、数据库等多个层面。

## 📊 当前状态分析

### 已完成 ✅
- Next.js 14 App Router（服务端渲染）
- next/image 组件（大部分页面）
- Tailwind CSS（原子化 CSS）
- 服务端组件（减少客户端 JS）

### 待优化 🔧
- 图片格式和大小
- 缓存策略
- 代码分割
- API 响应优化
- 数据库查询优化

---

## 🎯 优化方案（按影响力排序）

## 1. 图片优化 ⭐⭐⭐⭐⭐

### 1.1 转换为 WebP 格式
**当前状态**: JPG/PNG 格式，总大小 21.78MB
**优化效果**: 预计减少 25-40% 文件大小

```bash
# 运行图片优化脚本
./scripts/scan-images.sh
```

### 1.2 使用 Next.js Image 优化

更新 `next.config.js` 添加图片优化配置：

```javascript
const withNextIntl = require('next-intl/plugin')('./i18n.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 年
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = withNextIntl(nextConfig)
```

### 1.3 图片懒加载策略

更新组件中的 Image 使用：

```tsx
// 首屏关键图片（Hero）
<Image
  src="/images/hero/1.webp"
  alt="Hero"
  fill
  priority // 预加载
  quality={85}
  sizes="100vw"
/>

// 非首屏图片（Mission cards）
<Image
  src="/images/mission/displaced.webp"
  alt="Displaced"
  width={400}
  height={300}
  loading="lazy" // 懒加载
  quality={80}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### 1.4 响应式图片

为不同屏幕尺寸提供不同图片：

```tsx
<picture>
  <source
    media="(max-width: 640px)"
    srcSet="/images/hero/1-mobile.webp"
  />
  <source
    media="(max-width: 1024px)"
    srcSet="/images/hero/1-tablet.webp"
  />
  <Image
    src="/images/hero/1-desktop.webp"
    alt="Hero"
    fill
    priority
  />
</picture>
```

**预期效果**:
- 首次加载减少 40-60%
- LCP (Largest Contentful Paint) 从 3-4s 降到 1-2s

---

## 2. 缓存策略 ⭐⭐⭐⭐⭐

### 2.1 静态资源缓存

创建 `middleware.ts` 添加缓存头：

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'

const intlMiddleware = createMiddleware({
  locales: ['en', 'zh', 'ua'],
  defaultLocale: 'en',
  localePrefix: 'always'
})

export function middleware(request: NextRequest) {
  const response = intlMiddleware(request)

  // 添加缓存头
  const pathname = request.nextUrl.pathname

  // 静态资源缓存 1 年
  if (
    pathname.startsWith('/images/') ||
    pathname.startsWith('/icons/') ||
    pathname.match(/\.(jpg|jpeg|png|webp|svg|ico|css|js)$/)
  ) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    )
  }

  // API 响应缓存 5 分钟
  if (pathname.startsWith('/api/donations/project-public/')) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    )
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
```

### 2.2 数据缓存（Supabase 查询）

更新 `lib/supabase/queries.ts`：

```typescript
import { unstable_cache } from 'next/cache'

// 缓存活跃项目列表 5 分钟
export const getActiveProjects = unstable_cache(
  async () => {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },
  ['active-projects'],
  {
    revalidate: 300, // 5 分钟
    tags: ['projects']
  }
)

// 缓存项目统计 1 分钟
export const getProjectStats = unstable_cache(
  async (projectId: number) => {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('project_stats')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) throw error
    return data
  },
  ['project-stats'],
  {
    revalidate: 60, // 1 分钟
    tags: ['project-stats']
  }
)
```

### 2.3 API 路由缓存

更新 `app/api/donations/project-public/[projectId]/route.ts`：

```typescript
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge' // 使用 Edge Runtime
export const revalidate = 300 // 缓存 5 分钟

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  // ... 现有逻辑

  return NextResponse.json(donations, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
```

**预期效果**:
- API 响应时间从 200-500ms 降到 10-50ms
- 减少数据库查询次数 80%

---

## 3. 代码优化 ⭐⭐⭐⭐

### 3.1 动态导入非关键组件

更新 `app/[locale]/page.tsx`：

```tsx
import dynamic from 'next/dynamic'
import { getTranslations } from 'next-intl/server'
import ProjectsGrid from '@/components/projects/ProjectsGrid'
import MissionSection from '@/components/home/MissionSection'

// 动态导入非首屏组件
const ApproachSection = dynamic(() => import('@/components/home/ApproachSection'))
const ImpactSection = dynamic(() => import('@/components/home/ImpactSection'))
const DonationJourneySection = dynamic(() => import('@/components/home/DonationJourneySection'))
const ComplianceSection = dynamic(() => import('@/components/home/ComplianceSection'))

export default async function Home() {
  const t = await getTranslations('home.hero.projects')

  return (
    <main className="w-full">
      {/* 首屏：立即渲染 */}
      <MissionSection />

      {/* 非首屏：懒加载 */}
      <ApproachSection />
      <ImpactSection />

      <section id="projects-section">
        <ProjectsGrid />
      </section>

      <DonationJourneySection />
      <ComplianceSection />
    </main>
  )
}
```

### 3.2 优化 Bundle 大小

添加 Bundle 分析工具：

```bash
npm install @next/bundle-analyzer
```

更新 `next.config.js`：

```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const withNextIntl = require('next-intl/plugin')('./i18n.ts')

const nextConfig = {
  // ... 现有配置

  // 压缩输出
  compress: true,

  // 优化字体加载
  optimizeFonts: true,

  // React 生产模式优化
  reactStrictMode: true,

  // 移除 console.log（生产环境）
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = withBundleAnalyzer(withNextIntl(nextConfig))
```

运行分析：

```bash
ANALYZE=true npm run build
```

### 3.3 优化客户端组件

减少 `'use client'` 的使用，尽量使用服务端组件：

```tsx
// ❌ 不好：整个组件都是客户端
'use client'
export default function DonateForm() {
  const [amount, setAmount] = useState(0)
  return <div>...</div>
}

// ✅ 好：只有交互部分是客户端
// DonateForm.tsx (服务端组件)
export default function DonateForm({ projects }: { projects: Project[] }) {
  return (
    <div>
      <ProjectList projects={projects} />
      <AmountInput /> {/* 这是客户端组件 */}
    </div>
  )
}

// AmountInput.tsx (客户端组件)
'use client'
export default function AmountInput() {
  const [amount, setAmount] = useState(0)
  return <input value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
}
```

**预期效果**:
- JavaScript bundle 减少 20-30%
- FCP 提升 0.5-1s

---

## 4. 数据库优化 ⭐⭐⭐⭐

### 4.1 添加索引

更新数据库迁移，添加性能索引：

```sql
-- supabase/migrations/004_performance_indexes.sql

-- 优化项目查询
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_status_created
ON projects(status, created_at DESC)
WHERE status IN ('active', 'completed');

-- 优化捐赠查询
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_donations_project_status
ON donations(project_id, donation_status)
WHERE donation_status IN ('paid', 'confirmed', 'completed');

-- 优化公开捐赠列表查询
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_donations_donated_at
ON donations(donated_at DESC)
WHERE donation_status IN ('confirmed', 'completed');

-- 添加部分索引（只索引活跃数据）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_active_units
ON projects(current_units, target_units)
WHERE status = 'active';
```

### 4.2 优化查询

使用 `select` 只获取需要的字段：

```typescript
// ❌ 不好：获取所有字段
const { data } = await supabase
  .from('projects')
  .select('*')

// ✅ 好：只获取需要的字段
const { data } = await supabase
  .from('projects')
  .select('id, project_name, unit_price, current_units, target_units')
  .eq('status', 'active')
```

### 4.3 使用物化视图

创建物化视图加速复杂查询：

```sql
-- 创建物化视图
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_project_stats AS
SELECT
  p.id,
  p.project_name,
  p.status,
  p.current_units,
  p.target_units,
  COUNT(d.id) as donation_count,
  COALESCE(SUM(d.amount), 0) as total_raised
FROM projects p
LEFT JOIN donations d ON d.project_id = p.id
  AND d.donation_status IN ('confirmed', 'completed')
GROUP BY p.id;

-- 添加索引
CREATE INDEX idx_mv_project_stats_id ON mv_project_stats(id);

-- 创建刷新函数（每 5 分钟刷新）
CREATE OR REPLACE FUNCTION refresh_project_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_project_stats;
END;
$$ LANGUAGE plpgsql;

-- 设置定时任务（使用 pg_cron 扩展）
SELECT cron.schedule('refresh-stats', '*/5 * * * *', 'SELECT refresh_project_stats()');
```

**预期效果**:
- 查询速度提升 50-80%
- 复杂聚合查询从 500ms 降到 50ms

---

## 5. CDN 和部署优化 ⭐⭐⭐

### 5.1 Vercel 配置

创建 `vercel.json`：

```json
{
  "headers": [
    {
      "source": "/images/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*).webp",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

### 5.2 启用压缩

确保 Vercel 自动压缩已启用（默认启用）：
- Gzip
- Brotli

### 5.3 使用 Edge Runtime

将 API 路由迁移到 Edge Runtime：

```typescript
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
```

**预期效果**:
- 全球响应延迟降低 40-60%
- TTFB (Time to First Byte) 降到 100ms 以下

---

## 6. 字体优化 ⭐⭐⭐

### 6.1 使用 Next.js 字体优化

更新 `app/[locale]/layout.tsx`：

```tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap', // 使用字体交换策略
  preload: true,
  variable: '--font-inter',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
```

更新 `tailwind.config.js`：

```javascript
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
}
```

**预期效果**:
- 消除字体闪烁（FOUT）
- CLS (Cumulative Layout Shift) 接近 0

---

## 7. 监控和分析 ⭐⭐⭐

### 7.1 添加性能监控

安装 Vercel Analytics：

```bash
npm install @vercel/analytics
```

更新 `app/[locale]/layout.tsx`：

```tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 7.2 使用 Web Vitals

创建 `app/web-vitals.tsx`：

```tsx
'use client'

import { useReportWebVitals } from 'next/web-vitals'

export function WebVitals() {
  useReportWebVitals((metric) => {
    console.log(metric)

    // 发送到分析服务
    if (process.env.NODE_ENV === 'production') {
      // 发送到 Google Analytics 或其他服务
      window.gtag?.('event', metric.name, {
        value: Math.round(metric.value),
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.delta,
      })
    }
  })

  return null
}
```

---

## 📈 优化优先级和实施计划

### 第一阶段（立即执行，1天）⚡
1. ✅ 运行图片优化脚本（转换为 WebP）
2. ✅ 更新 next.config.js 图片配置
3. ✅ 添加缓存头到 middleware

**预期提升**: 加载速度提升 40-50%

### 第二阶段（本周完成，2-3天）🚀
4. 实施数据库索引优化
5. 添加 API 路由缓存
6. 动态导入非首屏组件
7. 优化客户端组件

**预期提升**: 总体性能提升 60-70%

### 第三阶段（下周完成，3-5天）📊
8. 创建物化视图
9. 实施字体优化
10. 添加性能监控
11. Bundle 大小优化

**预期提升**: 总体性能提升 75-85%

---

## 🎯 性能目标

### 当前性能（预估）
- FCP: 2.5-3.5s
- LCP: 3.5-5s
- TTI: 4-6s
- CLS: 0.1-0.25

### 优化后目标
- FCP: < 1.5s ✅
- LCP: < 2.5s ✅
- TTI: < 3s ✅
- CLS: < 0.1 ✅

---

## 🛠️ 工具和资源

### 性能测试工具
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)
- [Chrome DevTools Lighthouse](chrome://inspect)
- [Vercel Analytics](https://vercel.com/analytics)

### 监控工具
- [Vercel Speed Insights](https://vercel.com/docs/speed-insights)
- [Sentry Performance](https://sentry.io/)
- [New Relic](https://newrelic.com/)

### 分析命令
```bash
# 分析 Bundle 大小
ANALYZE=true npm run build

# 检查类型错误
npm run type-check

# Lighthouse CI
npx lighthouse https://yourdomain.com --view

# 测试本地性能
npm run build && npm start
# 然后在 Chrome DevTools 运行 Lighthouse
```

---

## 📝 检查清单

### 图片优化 ✅
- [ ] 运行图片优化脚本
- [ ] 所有图片使用 WebP 格式
- [ ] 使用 next/image 组件
- [ ] 首屏图片设置 priority
- [ ] 非首屏图片设置 loading="lazy"
- [ ] 使用正确的 sizes 属性

### 缓存策略 ✅
- [ ] 静态资源缓存 1 年
- [ ] API 响应缓存 5 分钟
- [ ] Supabase 查询使用 unstable_cache
- [ ] 添加 stale-while-revalidate

### 代码优化 ✅
- [ ] 非首屏组件动态导入
- [ ] 最小化 'use client' 使用
- [ ] 移除未使用的依赖
- [ ] Bundle 大小 < 300KB

### 数据库优化 ✅
- [ ] 添加必要索引
- [ ] 只查询需要的字段
- [ ] 使用物化视图
- [ ] 查询响应时间 < 100ms

### 部署优化 ✅
- [ ] 配置 CDN 缓存
- [ ] 启用压缩（Gzip/Brotli）
- [ ] 使用 Edge Runtime
- [ ] 配置 vercel.json

### 监控 ✅
- [ ] 安装 Vercel Analytics
- [ ] 实施 Web Vitals 追踪
- [ ] 设置性能预警
- [ ] 定期性能审计

---

**最后更新**: 2025-12-19
**维护者**: NGO Platform Team
