# NGO 网站配色优化方案

> **目标**: 替换现有的蓝紫色渐变，建立以乌克兰国旗色为核心的人道主义配色系统
> **核心理念**: 希望 + 信任 + 紧迫感

---

## 一、设计理念

### 1.1 乌克兰国旗色彩的深层含义

| 颜色 | 象征 | 情感 |
|------|------|------|
| **蓝色** (天空) | 自由、和平、希望 | 宁静、信任 |
| **黄色** (麦田) | 繁荣、生命力、光明 | 温暖、活力、紧迫 |

### 1.2 配色策略

```
┌─────────────────────────────────────────────────────────────┐
│                    乌克兰人道主义配色                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   主色 (信任)          强调色 (行动)          辅助色 (温暖)    │
│   ┌─────────┐         ┌─────────┐           ┌─────────┐    │
│   │  深蓝   │         │  金黄   │           │  暖橙   │     │
│   │ #1E4D7B │         │ #F5B800 │           │ #E76F51 │     │
│   └─────────┘         └─────────┘           └─────────┘    │
│                                                             │
│   用途: 导航、标题      用途: CTA按钮、重要标记   用途: 警告、紧迫  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、完整配色变量定义

### 2.1 Tailwind 配置 (`tailwind.config.js`)

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        // 主色系 - 乌克兰蓝 (信任、和平)
        ukraine: {
          blue: {
            50: '#E8F4FC',
            100: '#C5E3F7',
            200: '#93CAF0',
            300: '#5FAEE7',
            400: '#3494DC',
            500: '#1E7AC0',  // 基准色
            600: '#1E4D7B',  // 主色 - 深沉有力
            700: '#183D62',
            800: '#122E49',
            900: '#0C1F31',
            950: '#061018',
          },
          // 强调色系 - 乌克兰金 (希望、行动)
          gold: {
            50: '#FFFBEB',
            100: '#FEF3C7',
            200: '#FDE68A',
            300: '#FCD34D',
            400: '#FBBF24',
            500: '#F5B800',  // 基准色 - CTA 按钮
            600: '#D19A00',
            700: '#A67C00',
            800: '#7C5D00',
            900: '#523E00',
            950: '#2B1F00',
          },
        },
        // 辅助色系 - 温暖橙 (紧迫、关怀)
        warm: {
          50: '#FEF7F4',
          100: '#FDEBE4',
          200: '#FBCFBE',
          300: '#F7A989',
          400: '#F28354',
          500: '#E76F51',  // 基准色
          600: '#C85A3D',
          700: '#A54632',
          800: '#843628',
          900: '#6B2D21',
          950: '#3A160F',
        },
        // 成功/完成色系 - 生命绿
        life: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',  // 基准色
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
          950: '#022C22',
        },
      },
    },
  },
}
```

### 2.2 CSS 变量 (`globals.css`)

```css
:root {
  /* 乌克兰蓝色系 */
  --ukraine-blue-50: #E8F4FC;
  --ukraine-blue-100: #C5E3F7;
  --ukraine-blue-200: #93CAF0;
  --ukraine-blue-300: #5FAEE7;
  --ukraine-blue-400: #3494DC;
  --ukraine-blue-500: #1E7AC0;
  --ukraine-blue-600: #1E4D7B;
  --ukraine-blue-700: #183D62;
  --ukraine-blue-800: #122E49;
  --ukraine-blue-900: #0C1F31;

  /* 乌克兰金色系 */
  --ukraine-gold-50: #FFFBEB;
  --ukraine-gold-100: #FEF3C7;
  --ukraine-gold-200: #FDE68A;
  --ukraine-gold-300: #FCD34D;
  --ukraine-gold-400: #FBBF24;
  --ukraine-gold-500: #F5B800;
  --ukraine-gold-600: #D19A00;
  --ukraine-gold-700: #A67C00;

  /* 温暖橙色系 */
  --warm-50: #FEF7F4;
  --warm-100: #FDEBE4;
  --warm-500: #E76F51;
  --warm-600: #C85A3D;

  /* 生命绿色系 */
  --life-500: #10B981;
  --life-600: #059669;

  /* 语义化变量 */
  --color-primary: var(--ukraine-blue-600);
  --color-primary-hover: var(--ukraine-blue-700);
  --color-accent: var(--ukraine-gold-500);
  --color-accent-hover: var(--ukraine-gold-600);
  --color-success: var(--life-500);
  --color-warning: var(--warm-500);
  --color-background: #FAFBFC;
  --color-background-warm: #FFFDF7;
}
```

---

## 三、各组件配色映射

### 3.1 导航栏 (`Navigation.tsx`)

| 元素 | 当前 | 新方案 |
|------|------|--------|
| 捐赠按钮背景 | `from-blue-600 to-purple-600` | `bg-ukraine-gold-500 hover:bg-ukraine-gold-600` |
| 捐赠按钮文字 | `text-white` | `text-ukraine-blue-900` (深色文字在金色上更醒目) |
| 追踪按钮边框 | `border-gray-300` | `border-ukraine-blue-200` |
| 语言选择器焦点 | `focus:ring-blue-500` | `focus:ring-ukraine-blue-500` |
| 当前语言高亮 | `bg-blue-50 text-blue-700` | `bg-ukraine-blue-50 text-ukraine-blue-700` |

**代码示例:**
```tsx
// 捐赠按钮 - 使用金色作为主 CTA
<button className="group relative px-5 py-2 text-sm font-semibold tracking-wide text-ukraine-blue-900 bg-ukraine-gold-500 hover:bg-ukraine-gold-600 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg overflow-hidden">
  ...
</button>
```

---

### 3.2 主页各 Section

#### MissionSection.tsx
| 元素 | 当前 | 新方案 |
|------|------|--------|
| 标签背景 | `bg-white/10` | `bg-ukraine-gold-500/20` |
| 标签边框 | `border-white/20` | `border-ukraine-gold-400/40` |

#### ApproachSection.tsx
| 元素 | 当前 | 新方案 |
|------|------|--------|
| 标签背景 | `bg-blue-100 text-blue-700` | `bg-ukraine-blue-100 text-ukraine-blue-700` |
| 合规按钮 | `border-blue-600 text-blue-600` | `border-ukraine-blue-600 text-ukraine-blue-600` |
| 特性卡片渐变 | `from-blue-500 to-cyan-500` 等 | 见下方 |

**特性卡片渐变映射:**
```tsx
const features = [
  {
    key: 'transparent',
    gradient: 'from-ukraine-blue-500 to-ukraine-blue-400',  // 透明 → 蓝色
  },
  {
    key: 'efficient',
    gradient: 'from-ukraine-gold-500 to-ukraine-gold-400',  // 高效 → 金色
  },
  {
    key: 'direct',
    gradient: 'from-warm-500 to-warm-400',  // 直接 → 温暖橙
  }
]
```

#### ImpactSection.tsx
| 元素 | 当前 | 新方案 |
|------|------|--------|
| 背景渐变 | `from-indigo-900/90 via-purple-900/85 to-pink-900/90` | `from-ukraine-blue-800/90 via-ukraine-blue-700/85 to-ukraine-blue-600/80` |
| 动画圆点 | `bg-blue-500/20`, `bg-purple-500/20` | `bg-ukraine-gold-500/20`, `bg-ukraine-blue-500/20` |

**统计卡片颜色映射:**
```tsx
const stats = [
  {
    key: 'donations',
    color: 'from-ukraine-gold-400 to-ukraine-gold-600',  // 金额 → 金色
  },
  {
    key: 'people',
    color: 'from-ukraine-blue-400 to-ukraine-blue-600',  // 人数 → 蓝色
  },
  {
    key: 'shelters',
    color: 'from-life-400 to-life-600',  // 庇护所 → 生命绿
  }
]
```

#### DonationJourneySection.tsx
| 元素 | 当前 | 新方案 |
|------|------|--------|
| 标签渐变 | `from-blue-600 to-purple-600` | `bg-ukraine-gold-500` |
| 追踪按钮 | `from-blue-600 to-blue-700` | `bg-ukraine-blue-600 hover:bg-ukraine-blue-700` |

#### ComplianceSection.tsx
| 元素 | 当前 | 新方案 |
|------|------|--------|
| 文档卡片悬停边框 | `hover:border-blue-500` | `hover:border-ukraine-blue-500` |
| 悬停文字 | `group-hover:text-blue-600` | `group-hover:text-ukraine-blue-600` |

---

### 3.3 项目组件

#### ProjectCard.tsx
| 元素 | 当前 | 新方案 |
|------|------|--------|
| 选中边框 | `border-blue-600` | `border-ukraine-blue-600` |
| 选中背景 | `bg-blue-50` | `bg-ukraine-blue-50` |
| 选中勾选 | `bg-blue-600` | `bg-ukraine-gold-500` |
| 悬停边框 | `hover:border-blue-400` | `hover:border-ukraine-blue-400` |
| 标题悬停 | `group-hover:text-blue-600` | `group-hover:text-ukraine-blue-600` |
| 捐赠按钮 | `from-blue-600 to-blue-700` | `bg-ukraine-gold-500 hover:bg-ukraine-gold-600 text-ukraine-blue-900` |
| 头部渐变 | `from-blue-50/80 to-white/80` | `from-ukraine-blue-50/80 to-white/80` |
| 单位数字 | `text-blue-600` | `text-ukraine-blue-600` |
| 任意金额 | `text-purple-700` | `text-ukraine-gold-700` |

#### ProjectProgressBar.tsx
| 元素 | 当前 | 新方案 |
|------|------|--------|
| 进度条背景 | `from-blue-500 to-blue-600` | `from-ukraine-blue-500 to-ukraine-blue-600` |
| 进度文字 | `text-blue-600` | `text-ukraine-blue-600` |

#### ProjectStatusBadge.tsx
| 状态 | 当前 | 新方案 |
|------|------|--------|
| active | `bg-green-100 text-green-800` | `bg-life-100 text-life-800` |
| completed | `bg-blue-100 text-blue-800` | `bg-ukraine-blue-100 text-ukraine-blue-800` |

---

### 3.4 捐赠组件

#### DonationFormCard.tsx
| 元素 | 当前 | 新方案 |
|------|------|--------|
| 项目摘要背景 | `from-blue-50 to-white` | `from-ukraine-blue-50 to-white` |
| 价格文字 | `text-blue-600` | `text-ukraine-blue-600` |
| 金额选中 | `bg-blue-600 border-blue-600` | `bg-ukraine-blue-600 border-ukraine-blue-600` |
| 小费选中 | `bg-amber-600 border-amber-600` | `bg-ukraine-gold-600 border-ukraine-gold-600` |
| 小费区块背景 | `from-amber-50 to-orange-50` | `from-ukraine-gold-50 to-ukraine-gold-100` |
| 小费统计 | `text-amber-600` | `text-ukraine-gold-600` |
| 总金额背景 | `from-blue-50 to-purple-50` | `from-ukraine-blue-50 to-ukraine-gold-50/30` |
| 总金额边框 | `border-blue-200` | `border-ukraine-blue-200` |
| 输入焦点 | `focus:ring-blue-500` | `focus:ring-ukraine-blue-500` |
| 提交按钮 | `from-blue-600 to-blue-700` | `bg-ukraine-gold-500 hover:bg-ukraine-gold-600 text-ukraine-blue-900` |

#### DonationStatusBadge.tsx
更新 `STATUS_COLORS` 映射:
```typescript
export const STATUS_COLORS: Record<DonationStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-ukraine-gold-100', text: 'text-ukraine-gold-800' },
  processing: { bg: 'bg-ukraine-blue-100', text: 'text-ukraine-blue-700' },
  paid: { bg: 'bg-life-100', text: 'text-life-800' },
  confirmed: { bg: 'bg-life-100', text: 'text-life-800' },
  delivering: { bg: 'bg-ukraine-blue-100', text: 'text-ukraine-blue-700' },
  completed: { bg: 'bg-life-100', text: 'text-life-800' },
  refunding: { bg: 'bg-warm-100', text: 'text-warm-700' },
  refund_processing: { bg: 'bg-warm-100', text: 'text-warm-700' },
  refunded: { bg: 'bg-gray-100', text: 'text-gray-700' },
  expired: { bg: 'bg-gray-100', text: 'text-gray-600' },
  declined: { bg: 'bg-red-100', text: 'text-red-700' },
  failed: { bg: 'bg-red-100', text: 'text-red-700' },
  // ...
}
```

#### DonationStatusFlow.tsx
| 元素 | 当前 | 新方案 |
|------|------|--------|
| 主流程连接线 | `bg-green-500` | `bg-life-500` |
| 主流程图标 | `text-green-600` | `text-life-600` |
| 退款流程图标 | `text-red-500` | `text-warm-500` |
| 退款连接线 | `bg-red-500` | `bg-warm-500` |
| 退款卡片边框 | `border-orange-100` | `border-warm-100` |
| 退款卡片背景 | `bg-orange-50` | `bg-warm-50` |

---

### 3.5 追踪捐赠页面 (`track-donation/page.tsx`)

| 元素 | 当前 | 新方案 |
|------|------|--------|
| 页面背景 | `from-blue-50 via-white to-gray-50` | `from-ukraine-blue-50 via-white to-ukraine-gold-50/30` |
| 标签背景 | `bg-white/20` | `bg-ukraine-gold-500/30` |

---

### 3.6 Footer.tsx

| 元素 | 当前 | 新方案 |
|------|------|--------|
| 社交图标悬停 | `hover:bg-blue-50 hover:text-blue-600` | `hover:bg-ukraine-blue-50 hover:text-ukraine-blue-600` |
| 链接悬停 | `hover:text-blue-600` | `hover:text-ukraine-blue-600` |

---

### 3.7 管理后台 (`components/admin/`)

管理后台保持功能性配色，但统一使用新的蓝色系:

| 元素 | 当前 | 新方案 |
|------|------|--------|
| 导航激活边框 | `border-blue-500` | `border-ukraine-blue-500` |
| 按钮主色 | `bg-blue-600` | `bg-ukraine-blue-600` |
| 焦点环 | `focus:ring-blue-500` | `focus:ring-ukraine-blue-500` |

---

## 四、渐变替换规则

### 4.1 旧渐变 → 新方案映射

| 旧渐变 | 新方案 | 用途 |
|--------|--------|------|
| `from-blue-600 to-purple-600` | `bg-ukraine-gold-500` | 主 CTA 按钮 |
| `from-blue-600 to-blue-700` | `bg-ukraine-blue-600` | 次要按钮 |
| `from-blue-50 to-purple-50` | `from-ukraine-blue-50 to-ukraine-gold-50/30` | 卡片背景 |
| `from-indigo-900 to-purple-900` | `from-ukraine-blue-800 to-ukraine-blue-600` | 深色背景 |
| `from-blue-500 to-cyan-500` | `from-ukraine-blue-500 to-ukraine-blue-400` | 图标背景 |
| `from-purple-500 to-pink-500` | `from-ukraine-gold-500 to-ukraine-gold-400` | 图标背景 |
| `from-orange-500 to-red-500` | `from-warm-500 to-warm-400` | 图标背景 |

### 4.2 全局搜索替换清单

```bash
# 需要替换的渐变模式
from-blue-600 to-purple-600  → bg-ukraine-gold-500
from-blue-600 to-blue-700    → bg-ukraine-blue-600
from-blue-700 to-purple-700  → hover:bg-ukraine-gold-600
from-blue-50 to-purple-50    → from-ukraine-blue-50 to-ukraine-gold-50/30

# 需要替换的单色
blue-50    → ukraine-blue-50
blue-100   → ukraine-blue-100
blue-200   → ukraine-blue-200
blue-400   → ukraine-blue-400
blue-500   → ukraine-blue-500
blue-600   → ukraine-blue-600
blue-700   → ukraine-blue-700

# 需要替换的强调色
amber-50   → ukraine-gold-50
amber-100  → ukraine-gold-100
amber-600  → ukraine-gold-600
amber-700  → ukraine-gold-700
```

---

## 五、视觉对比

### 5.1 CTA 按钮对比

```
旧: ████████████████  蓝紫渐变 (通用科技感)
新: ████████████████  金色 #F5B800 (希望、行动、乌克兰)
```

### 5.2 色彩心理学

| 颜色 | 情感反应 | 用途建议 |
|------|----------|----------|
| **乌克兰蓝** | 信任、和平、安全 | 导航、标题、信息展示 |
| **乌克兰金** | 希望、紧迫、行动 | CTA 按钮、重要标记、进度 |
| **温暖橙** | 关怀、紧迫、警告 | 警告信息、退款流程 |
| **生命绿** | 成功、完成、成长 | 成功状态、完成标记 |

---

## 六、实施步骤

### Phase 1: 基础设施 (Day 1)
1. [ ] 更新 `tailwind.config.js` 添加新颜色
2. [ ] 更新 `globals.css` 添加 CSS 变量
3. [ ] 创建颜色测试页面验证

### Phase 2: 核心组件 (Day 2-3)
1. [ ] Navigation.tsx - 捐赠按钮
2. [ ] ProjectCard.tsx - 卡片样式
3. [ ] DonationFormCard.tsx - 表单样式
4. [ ] Footer.tsx - 页脚

### Phase 3: 主页 Sections (Day 4-5)
1. [ ] MissionSection.tsx
2. [ ] ApproachSection.tsx
3. [ ] ImpactSection.tsx
4. [ ] DonationJourneySection.tsx
5. [ ] ComplianceSection.tsx

### Phase 4: 其他页面 (Day 6)
1. [ ] 追踪捐赠页面
2. [ ] 捐赠状态组件
3. [ ] 管理后台统一

### Phase 5: 测试和微调 (Day 7)
1. [ ] 全站视觉检查
2. [ ] 响应式测试
3. [ ] 对比度检查 (WCAG AA)
4. [ ] 用户测试反馈

---

## 七、注意事项

### 7.1 对比度要求 (WCAG AA)
- 金色 `#F5B800` 上使用深色文字 `#0C1F31` 确保可读性
- 深蓝背景 `#1E4D7B` 上使用白色文字

### 7.2 色盲友好
- 不仅依赖颜色传达信息
- 添加图标或文字标识状态

### 7.3 保持一致性
- 同一语义使用同一颜色
- CTA 按钮始终使用金色
- 信息/导航始终使用蓝色

---

## 八、预期效果

### Before (当前)
- 通用的蓝紫科技感
- 缺乏品牌识别度
- 与乌克兰人道主义使命无关联

### After (新方案)
- 乌克兰国旗色建立强烈品牌认知
- 金色 CTA 传达希望和行动紧迫感
- 深蓝传达信任和安全感
- 整体设计与人道主义使命一致

---

**文档版本**: 1.0
**创建日期**: 2026-01-13
**作者**: Claude Code (Frontend Design Skill)
