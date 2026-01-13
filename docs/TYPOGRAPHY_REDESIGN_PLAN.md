# NGO 网站字体改造方案

> **版本**: 1.0
> **制定日期**: 2026-01-13
> **目标**: 通过字体重塑建立温暖、人文、有力量的视觉识别系统

---

## 一、当前问题诊断

### 1.1 现状分析

**当前配置** (`app/[locale]/layout.tsx` 和 `app/admin/layout.tsx`):
```typescript
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})
```

**存在的问题**:

| 问题 | 影响 |
|------|------|
| 仅使用 Inter 作为唯一字体 | 缺乏视觉层次和品牌个性 |
| Inter 是 AI 生成风格的代表字体 | 用户潜意识产生"模板化"印象 |
| 标题与正文使用相同字体 | 视觉层次扁平，难以引导阅读 |
| 缺少数据展示专用字体 | 统计数字缺乏冲击力 |

### 1.2 字体使用场景统计

通过分析代码库，字体使用分布如下：

| 场景类型 | 代表组件 | 当前使用 | 问题 |
|---------|---------|---------|------|
| 主标题 (H1) | `MissionSection`, `ImpactSection`, Hero 区域 | `font-bold text-4xl-7xl` | 缺乏感染力 |
| 章节标题 (H2) | 各 Section 标题 | `font-bold/semibold text-xl-3xl` | 与正文区分度不足 |
| 子标题 (H3) | 卡片标题、模块标题 | `font-bold text-lg-xl` | 风格单调 |
| 正文段落 | 项目描述、介绍文字 | `text-sm-base text-gray-*` | 可读性尚可但缺温度 |
| 统计数字 | 影响力数据、进度数字 | `font-bold text-2xl-5xl` | 不够醒目 |
| 标签/徽章 | Status Badge、分类标签 | `text-xs font-bold uppercase tracking-widest` | 可接受 |
| 表单标签 | 捐赠表单、追踪表单 | `text-sm font-medium` | 需要更清晰 |
| 按钮文字 | CTA 按钮、导航按钮 | `font-medium/semibold text-sm` | 需要更有力 |
| 引用/证言 | 成功故事 | 暂无专用样式 | 需要建立 |
| 管理后台 | Admin 页面 | Inter 继承 | 保持专业即可 |

---

## 二、字体选型方案

### 2.1 设计原则

基于 NGO 人道主义性质，字体选择遵循以下原则：

1. **温暖人文** - 传达关怀与同理心，避免冷淡机械感
2. **力量感** - 在紧迫场景下展现坚定与决心
3. **可读性** - 多语言（英/中/乌克兰语）环境下保持良好阅读体验
4. **差异化** - 与标准"科技感"网站明确区分
5. **性能优化** - 字体文件大小可控，支持 font-display: swap

### 2.2 推荐字体组合

#### 方案 A：人文衬线 + 温暖无衬线（推荐）

| 用途 | 字体 | 特点 | Google Fonts 链接 |
|------|------|------|-------------------|
| **标题字体** | **Fraunces** | 可变字体，温暖有机，有慈善机构气质 | [链接](https://fonts.google.com/specimen/Fraunces) |
| **正文字体** | **Source Sans 3** | 比 Inter 更温暖，优秀的多语言支持 | [链接](https://fonts.google.com/specimen/Source+Sans+3) |
| **数据字体** | **JetBrains Mono** | 等宽字体，数字展示清晰有力 | [链接](https://fonts.google.com/specimen/JetBrains+Mono) |

**为什么选择 Fraunces**:
- 可变字体（Variable Font），支持 WONK 轴可切换光学风格
- 温暖的衬线设计传达人文关怀
- 独特的墨水陷阱（ink traps）设计在小尺寸下依然清晰
- 极佳的 Cyrillic（乌克兰语）支持

**为什么选择 Source Sans 3**:
- Adobe 开源字体，成熟稳定
- 比 Inter 更柔和的字形，减少机械感
- 完整的 Latin Extended 和 Cyrillic 支持
- 已在众多慈善机构网站验证

#### 方案 B：现代无衬线 + 展示字体

| 用途 | 字体 | 特点 |
|------|------|------|
| **标题字体** | **DM Serif Display** | 优雅有力的衬线展示字体 |
| **正文字体** | **Nunito** | 友好圆润的无衬线，温暖感强 |
| **数据字体** | **Space Mono** | 独特的等宽字体，有技术美感 |

#### 方案 C：极简现代（如需保守方案）

| 用途 | 字体 | 特点 |
|------|------|------|
| **标题字体** | **Outfit** | 几何无衬线，比 Inter 更有个性 |
| **正文字体** | **Work Sans** | 人文无衬线，适合长文阅读 |
| **数据字体** | **IBM Plex Mono** | IBM 设计语言，清晰专业 |

### 2.3 中文字体方案

由于网站支持中文，需要特别处理：

| 策略 | 字体 | 说明 |
|------|------|------|
| **主要方案** | 系统字体回退 | `-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif` |
| **备选方案** | Noto Sans SC (Subset) | 使用 Google Fonts 按需加载，仅加载实际使用的字符 |

**推荐 CSS 配置**:
```css
/* 中文专用字体栈 */
--font-chinese: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif;
```

---

## 三、具体应用规范

### 3.1 字体层级系统

```
┌─────────────────────────────────────────────────────────────────┐
│  DISPLAY / HERO                                                  │
│  Fraunces (wght: 700-900, WONK: 1)                              │
│  text-4xl → text-7xl                                             │
├─────────────────────────────────────────────────────────────────┤
│  HEADLINE / SECTION TITLE                                        │
│  Fraunces (wght: 600-700, WONK: 0)                              │
│  text-2xl → text-4xl                                             │
├─────────────────────────────────────────────────────────────────┤
│  SUBHEADLINE / CARD TITLE                                        │
│  Source Sans 3 (wght: 600-700)                                   │
│  text-lg → text-xl                                               │
├─────────────────────────────────────────────────────────────────┤
│  BODY / PARAGRAPH                                                │
│  Source Sans 3 (wght: 400-500)                                   │
│  text-sm → text-base                                             │
├─────────────────────────────────────────────────────────────────┤
│  DATA / STATISTICS                                               │
│  JetBrains Mono (wght: 500-700)                                  │
│  text-2xl → text-5xl                                             │
├─────────────────────────────────────────────────────────────────┤
│  LABEL / CAPTION                                                 │
│  Source Sans 3 (wght: 500-600)                                   │
│  text-xs → text-sm                                               │
├─────────────────────────────────────────────────────────────────┤
│  BUTTON                                                          │
│  Source Sans 3 (wght: 600)                                       │
│  text-sm → text-base                                             │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 页面应用详情

#### 首页 (Home Page)

| 组件 | 当前 | 改造后 |
|------|------|--------|
| **MissionSection 主标题** | `text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold` | `font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold` |
| **MissionSection 副标题** | `text-base sm:text-lg md:text-xl lg:text-2xl` | `font-body text-base sm:text-lg md:text-xl lg:text-2xl font-light` |
| **ImpactSection 统计数字** | `font-bold text-white tracking-tight` | `font-data font-bold text-white tracking-tight` |
| **ImpactSection 标签** | `text-white font-semibold` | `font-body text-white font-semibold` |
| **ApproachSection 卡片标题** | `text-2xl font-bold text-gray-900` | `font-display text-2xl font-semibold text-gray-900` |
| **DonationJourneySection 步骤标题** | `font-bold text-gray-800` | `font-display font-semibold text-gray-800` |
| **ProjectCard 项目名称** | `text-lg font-bold text-gray-900` | `font-display text-lg font-semibold text-gray-900` |

#### 项目详情页 (Project0/Project3)

| 组件 | 当前 | 改造后 |
|------|------|--------|
| **Header 项目标题** | `text-2xl md:text-4xl font-bold` | `font-display text-2xl md:text-4xl font-bold` |
| **Header 副标题** | `text-blue-100 text-sm md:text-lg` | `font-body text-blue-100 text-sm md:text-lg` |
| **统计卡片数值** | `text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text` | `font-data text-3xl md:text-5xl font-bold` |
| **统计卡片标签** | `text-xs md:text-base font-semibold text-gray-800` | `font-body text-xs md:text-base font-semibold text-gray-800` |
| **章节标题 (H2)** | `text-xl md:text-2xl font-bold text-gray-900` | `font-display text-xl md:text-2xl font-semibold text-gray-900` |
| **治疗项目名称** | `font-bold text-gray-900 mb-1 md:mb-2 text-xs md:text-base` | `font-display font-semibold text-gray-900` |
| **正文段落** | `text-sm md:text-base text-gray-700 leading-relaxed` | `font-body text-sm md:text-base text-gray-700 leading-relaxed` |
| **财务表格数据** | `font-bold text-red-600` 等 | `font-data font-bold` |
| **行动号召标题** | `text-xl md:text-2xl font-bold text-gray-900` | `font-display text-xl md:text-2xl font-bold text-gray-900` |

#### 捐赠页面 (Donate Page)

| 组件 | 当前 | 改造后 |
|------|------|--------|
| **DonationFormCard 项目名称** | `font-bold text-lg text-gray-900` | `font-display font-semibold text-lg text-gray-900` |
| **价格显示** | `text-2xl font-bold text-blue-600` | `font-data text-2xl font-bold text-blue-600` |
| **表单标签** | `text-sm font-medium` | `font-body text-sm font-medium` |
| **金额按钮** | `font-medium text-sm` | `font-data font-medium text-sm` |
| **总金额** | `text-2xl font-bold text-blue-600` | `font-data text-2xl font-bold text-blue-600` |
| **提交按钮** | `font-semibold` | `font-body font-semibold tracking-wide` |

#### 追踪捐赠页面 (Track Donation)

| 组件 | 当前 | 改造后 |
|------|------|--------|
| **页面标题** | `text-4xl sm:text-5xl lg:text-6xl font-bold text-white` | `font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white` |
| **描述文字** | `text-lg sm:text-xl text-white` | `font-body text-lg sm:text-xl text-white font-light` |
| **表单卡片标题** | 继承全局 | `font-display` |

#### 导航栏 (Navigation)

| 组件 | 当前 | 改造后 |
|------|------|--------|
| **按钮文字** | `text-sm font-medium` | `font-body text-sm font-semibold tracking-wide` |
| **捐赠按钮** | `text-sm font-medium text-white` | `font-body text-sm font-semibold text-white tracking-wide` |
| **语言切换** | `text-sm font-medium text-gray-700` | `font-body text-sm font-medium text-gray-700` |

#### 页脚 (Footer)

| 组件 | 当前 | 改造后 |
|------|------|--------|
| **标题** | `text-lg font-semibold text-gray-900` | `font-display text-lg font-semibold text-gray-900` |
| **联系信息** | `text-sm text-gray-900` | `font-body text-sm text-gray-900` |
| **版权信息** | `text-sm text-gray-600` | `font-body text-sm text-gray-500` |

#### 成功页面 (Success Page)

| 组件 | 当前 | 改造后 |
|------|------|--------|
| **感谢标题** | 继承全局 | `font-display text-3xl font-bold` |
| **捐赠 ID** | 继承全局 | `font-data text-sm font-medium` |
| **金额显示** | 继承全局 | `font-data text-2xl font-bold` |

#### 管理后台 (Admin)

保持相对简洁的风格，但引入字体层级：

| 组件 | 当前 | 改造后 |
|------|------|--------|
| **页面标题** | 继承全局 | `font-display text-2xl font-semibold` |
| **表格表头** | 继承全局 | `font-body text-sm font-semibold uppercase tracking-wider` |
| **表格数据** | 继承全局 | `font-body text-sm` |
| **金额/数字** | 继承全局 | `font-data text-sm font-medium` |
| **模态框标题** | 继承全局 | `font-display text-xl font-semibold` |

---

## 四、技术实现方案

### 4.1 Next.js 字体配置

修改 `app/[locale]/layout.tsx`:

```typescript
import { Fraunces, Source_Sans_3, JetBrains_Mono } from 'next/font/google'

// 标题字体 - Fraunces 可变字体
const fraunces = Fraunces({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-fraunces',
  // 启用可变字体轴
  axes: ['SOFT', 'WONK', 'opsz'],
})

// 正文字体 - Source Sans 3
const sourceSans = Source_Sans_3({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  variable: '--font-source-sans',
  weight: ['300', '400', '500', '600', '700'],
})

// 数据字体 - JetBrains Mono
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
  weight: ['400', '500', '600', '700'],
})

// 应用到 body
<body className={`${fraunces.variable} ${sourceSans.variable} ${jetbrainsMono.variable} font-body`}>
```

### 4.2 Tailwind 配置

修改 `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // 标题/展示字体
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        // 正文字体
        body: ['var(--font-source-sans)', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        // 数据/统计字体
        data: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
        // 中文字体 (回退)
        chinese: ['"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', 'sans-serif'],
      },
      // 可选：自定义字重
      fontWeight: {
        'display-normal': '500',
        'display-bold': '700',
        'display-black': '900',
      },
    },
  },
  plugins: [],
}
```

### 4.3 全局 CSS 配置

修改 `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* 字体变量 */
  --font-fraunces: 'Fraunces';
  --font-source-sans: 'Source Sans 3';
  --font-jetbrains-mono: 'JetBrains Mono';

  /* 字体大小缩放（可选，用于响应式优化）*/
  --font-scale-factor: 1;
}

/* 基础字体层级 */
@layer base {
  html {
    font-family: var(--font-source-sans), -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  }

  h1, h2 {
    font-family: var(--font-fraunces), Georgia, serif;
    font-weight: 700;
    /* Fraunces 可变字体设置 */
    font-variation-settings: 'WONK' 1, 'SOFT' 50, 'opsz' 72;
  }

  h3, h4, h5, h6 {
    font-family: var(--font-fraunces), Georgia, serif;
    font-weight: 600;
    font-variation-settings: 'WONK' 0, 'SOFT' 50, 'opsz' 36;
  }

  /* 数据/统计数字 */
  .font-data, [data-type="statistic"], .stat-value {
    font-family: var(--font-jetbrains-mono), ui-monospace, monospace;
    font-feature-settings: 'tnum' 1; /* 表格数字 */
  }
}

/* 工具类 */
@layer utilities {
  .font-display {
    font-family: var(--font-fraunces), Georgia, serif;
  }

  .font-body {
    font-family: var(--font-source-sans), -apple-system, sans-serif;
  }

  .font-data {
    font-family: var(--font-jetbrains-mono), ui-monospace, monospace;
    font-feature-settings: 'tnum' 1;
  }

  /* 中文优化 */
  .font-chinese {
    font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  }

  /* Fraunces 风格变体 */
  .font-wonky {
    font-variation-settings: 'WONK' 1;
  }

  .font-plain {
    font-variation-settings: 'WONK' 0;
  }
}
```

### 4.4 管理后台字体配置

修改 `app/admin/layout.tsx`:

```typescript
import { Source_Sans_3, JetBrains_Mono } from 'next/font/google'

// 管理后台使用 Source Sans 3 作为主字体，保持专业简洁
const sourceSans = Source_Sans_3({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-source-sans',
  weight: ['400', '500', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
  weight: ['400', '500', '600'],
})

// 应用
<body className={`${sourceSans.variable} ${jetbrainsMono.variable} font-body`}>
```

---

## 五、组件修改清单

### 5.1 核心布局组件

| 文件 | 修改内容 |
|------|---------|
| `app/[locale]/layout.tsx` | 添加字体导入和 CSS 变量 |
| `app/admin/layout.tsx` | 添加管理后台字体配置 |
| `app/globals.css` | 添加字体工具类和基础样式 |
| `tailwind.config.js` | 添加 fontFamily 扩展 |

### 5.2 首页组件

| 组件 | 修改说明 |
|------|---------|
| `components/home/MissionSection.tsx` | H1 添加 `font-display`，段落添加 `font-body` |
| `components/home/ApproachSection.tsx` | 标题添加 `font-display` |
| `components/home/ImpactSection.tsx` | 统计数字添加 `font-data`，标签添加 `font-body` |
| `components/home/DonationJourneySection.tsx` | 步骤标题添加 `font-display` |
| `components/home/ComplianceSection.tsx` | 标题添加 `font-display` |
| `components/home/ProjectResultsSection.tsx` | 标题添加 `font-display` |

### 5.3 项目组件

| 组件 | 修改说明 |
|------|---------|
| `components/projects/ProjectCard.tsx` | 项目名 `font-display`，价格 `font-data` |
| `components/projects/ProjectsGrid.tsx` | 标题添加 `font-display` |
| `components/projects/ProjectStatusBadge.tsx` | 保持 `font-body` |
| `components/projects/detail-pages/Project0/index.tsx` | 全面应用字体层级 |
| `components/projects/detail-pages/Project3/index.tsx` | 同上 |
| `components/projects/shared/ProjectProgressBar.tsx` | 数字添加 `font-data` |
| `components/projects/shared/ProjectProgressSection.tsx` | 标题 `font-display`，数据 `font-data` |

### 5.4 捐赠组件

| 组件 | 修改说明 |
|------|---------|
| `components/donate/DonationFormCard.tsx` | 金额 `font-data`，表单 `font-body` |
| `components/donate/PaymentMethodSelector.tsx` | 标题 `font-display` |
| `components/donate/CryptoSelector.tsx` | 标题 `font-display` |
| `components/donate/widgets/WayForPayWidget.tsx` | 金额 `font-data` |
| `components/donate/widgets/NowPaymentsWidget.tsx` | 金额 `font-data` |

### 5.5 捐赠展示组件

| 组件 | 修改说明 |
|------|---------|
| `components/donation/DonationStatusBadge.tsx` | 保持 `font-body` |
| `components/donation/DonationStatusFlow.tsx` | 标题 `font-display` |
| `components/donation/ProjectDonationList.tsx` | 金额 `font-data` |
| `components/donation/DonationResultViewer.tsx` | 标题 `font-display`，金额 `font-data` |

### 5.6 成功页面组件

| 组件 | 修改说明 |
|------|---------|
| `app/[locale]/donate/success/page.tsx` | 标题 `font-display` |
| `app/[locale]/donate/success/PageHeader.tsx` | 标题 `font-display` |
| `app/[locale]/donate/success/DonationDetails.tsx` | 金额 `font-data` |
| `app/[locale]/donate/success/DonationIdsList.tsx` | ID `font-data` |
| `app/[locale]/donate/success/InfoCard.tsx` | 标题 `font-display` |

### 5.7 全局/布局组件

| 组件 | 修改说明 |
|------|---------|
| `components/Navigation.tsx` | 按钮 `font-body font-semibold` |
| `components/Footer.tsx` | 标题 `font-display`，正文 `font-body` |
| `components/GlobalLoadingSpinner.tsx` | 文字 `font-body` |
| `components/BottomSheet.tsx` | 标题 `font-display` |

### 5.8 追踪捐赠页面

| 组件 | 修改说明 |
|------|---------|
| `app/[locale]/track-donation/page.tsx` | 标题 `font-display` |
| `app/[locale]/track-donation/track-donation-form.tsx` | 表单 `font-body`，数据 `font-data` |

### 5.9 管理后台组件

| 组件 | 修改说明 |
|------|---------|
| `components/admin/AdminNav.tsx` | 保持 `font-body` |
| `components/admin/ProjectsTable.tsx` | 表头 `font-body font-semibold`，数字 `font-data` |
| `components/admin/DonationsTable.tsx` | 同上 |
| `components/admin/SubscriptionsTable.tsx` | 同上 |
| `components/admin/DonationStatusProgress.tsx` | 标签 `font-body` |
| 各 Modal 组件 | 标题 `font-display`，内容 `font-body` |

### 5.10 法律页面

| 组件 | 修改说明 |
|------|---------|
| `app/[locale]/privacy-policy/page.tsx` | 标题 `font-display`，正文 `font-body` |
| `app/[locale]/public-agreement/page.tsx` | 同上 |
| `app/[locale]/unsubscribed/page.tsx` | 标题 `font-display` |

---

## 六、性能优化

### 6.1 字体子集化

使用 Next.js 内置的字体优化，自动进行子集化：

```typescript
// Fraunces 仅加载必要字符集
const fraunces = Fraunces({
  subsets: ['latin', 'latin-ext'],  // 不加载全部 Cyrillic，让 Source Sans 3 处理
  display: 'swap',
  variable: '--font-fraunces',
})

// Source Sans 3 处理所有语言的正文
const sourceSans = Source_Sans_3({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  variable: '--font-source-sans',
  weight: ['400', '500', '600', '700'],  // 仅加载使用的字重
})
```

### 6.2 预加载关键字体

```typescript
// 在 layout.tsx 中预加载首屏字体
export const metadata = {
  // ...
}

// Next.js 会自动为 Google Fonts 添加预加载
```

### 6.3 字体显示策略

所有字体使用 `display: 'swap'`，确保文本在字体加载前以系统字体显示，避免 FOIT (Flash of Invisible Text)。

### 6.4 预估字体文件大小

| 字体 | 预估大小 (gzipped) |
|------|-------------------|
| Fraunces Variable | ~60KB |
| Source Sans 3 (多字重) | ~40KB |
| JetBrains Mono | ~25KB |
| **总计** | **~125KB** |

相比当前 Inter (~30KB)，增加约 95KB，但换来显著的视觉差异化。

---

## 七、实施步骤

### 第一阶段：基础配置（第1步）

1. 修改 `tailwind.config.js` 添加 fontFamily
2. 修改 `app/globals.css` 添加字体工具类
3. 修改 `app/[locale]/layout.tsx` 导入字体
4. 修改 `app/admin/layout.tsx` 导入字体

### 第二阶段：核心组件（第2步）

1. 修改 `components/Navigation.tsx`
2. 修改 `components/Footer.tsx`
3. 修改首页各 Section 组件

### 第三阶段：项目组件（第3步）

1. 修改 `components/projects/` 下所有组件
2. 修改项目详情页组件

### 第四阶段：捐赠流程（第4步）

1. 修改 `components/donate/` 下所有组件
2. 修改 `components/donation/` 下所有组件
3. 修改成功页面组件

### 第五阶段：其他页面（第5步）

1. 修改追踪捐赠页面
2. 修改法律页面
3. 修改取消订阅页面

### 第六阶段：管理后台（第6步）

1. 修改 `components/admin/` 下所有组件
2. 修改管理后台页面

### 第七阶段：测试与优化（第7步）

1. 多语言字体渲染测试（英/中/乌克兰语）
2. 移动端字体大小测试
3. Lighthouse 性能测试
4. 视觉回归测试

---

## 八、回滚方案

如果字体改造出现问题，可以快速回滚：

1. 在 `tailwind.config.js` 中将 `fontFamily` 恢复为默认
2. 在 `layout.tsx` 中移除新字体导入
3. 移除组件中的 `font-display`、`font-data` 类名（可选，不影响功能）

---

## 九、视觉效果预览

### 改造前后对比

| 元素 | 改造前 | 改造后 |
|------|--------|--------|
| 主标题 | Inter Bold, 冷淡机械 | Fraunces Bold, 温暖有力 |
| 章节标题 | Inter Semibold, 平淡 | Fraunces Semibold, 有质感 |
| 正文 | Inter Regular, 通用 | Source Sans 3, 温暖友好 |
| 统计数字 | Inter Bold, 普通 | JetBrains Mono Bold, 清晰醒目 |
| 按钮文字 | Inter Medium, 无特色 | Source Sans 3 Semibold, 有力量感 |

### 预期效果

1. **品牌识别度提升** - 独特的字体组合让网站一眼可辨
2. **情感连接增强** - Fraunces 的温暖衬线传达人文关怀
3. **数据表现力增强** - JetBrains Mono 让统计数字更具冲击力
4. **阅读体验改善** - Source Sans 3 的友好字形降低阅读疲劳
5. **专业信任度提升** - 精心设计的字体层级体现专业性

---

## 十、相关资源

- [Fraunces on Google Fonts](https://fonts.google.com/specimen/Fraunces)
- [Source Sans 3 on Google Fonts](https://fonts.google.com/specimen/Source+Sans+3)
- [JetBrains Mono on Google Fonts](https://fonts.google.com/specimen/JetBrains+Mono)
- [Next.js Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
- [Variable Fonts Guide](https://web.dev/variable-fonts/)

---

**文档版本**: 1.0
**最后更新**: 2026-01-13
**作者**: Claude Code
