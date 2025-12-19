#!/bin/bash

# 性能优化快速实施脚本
# 自动应用最关键的性能优化配置

set -e  # 遇到错误立即退出

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=================================="
echo -e "性能优化快速实施工具"
echo -e "==================================${NC}"
echo ""

# 检查依赖
echo -e "${YELLOW}检查依赖...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未找到 Node.js${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}错误: 未找到 npm${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 依赖检查通过${NC}"
echo ""

# 询问用户要执行哪些优化
echo -e "${YELLOW}请选择要执行的优化（多选，用空格分隔）：${NC}"
echo "1. 优化 next.config.js（图片配置）"
echo "2. 安装 Bundle Analyzer"
echo "3. 安装 Vercel Analytics"
echo "4. 创建数据库索引迁移文件"
echo "5. 创建 vercel.json 配置"
echo "6. 全部执行"
echo ""
read -p "请输入选项（例如：1 2 3 或 6）: " choices

# 解析选择
apply_all=false
apply_nextconfig=false
apply_bundleanalyzer=false
apply_analytics=false
apply_dbindex=false
apply_verceljson=false

if [[ $choices == *"6"* ]]; then
    apply_all=true
    apply_nextconfig=true
    apply_bundleanalyzer=true
    apply_analytics=true
    apply_dbindex=true
    apply_verceljson=true
else
    [[ $choices == *"1"* ]] && apply_nextconfig=true
    [[ $choices == *"2"* ]] && apply_bundleanalyzer=true
    [[ $choices == *"3"* ]] && apply_analytics=true
    [[ $choices == *"4"* ]] && apply_dbindex=true
    [[ $choices == *"5"* ]] && apply_verceljson=true
fi

echo ""
echo -e "${BLUE}开始执行优化...${NC}"
echo ""

# 1. 优化 next.config.js
if [ "$apply_nextconfig" = true ]; then
    echo -e "${YELLOW}[1/5] 优化 next.config.js...${NC}"

    cat > next.config.js << 'EOF'
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
  compress: true,
  optimizeFonts: true,
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = withNextIntl(nextConfig)
EOF

    echo -e "${GREEN}✓ next.config.js 已优化${NC}"
    echo ""
fi

# 2. 安装 Bundle Analyzer
if [ "$apply_bundleanalyzer" = true ]; then
    echo -e "${YELLOW}[2/5] 安装 Bundle Analyzer...${NC}"

    npm install --save-dev @next/bundle-analyzer

    # 更新 next.config.js 添加 bundle analyzer
    cat > next.config.js << 'EOF'
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const withNextIntl = require('next-intl/plugin')('./i18n.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  compress: true,
  optimizeFonts: true,
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = withBundleAnalyzer(withNextIntl(nextConfig))
EOF

    echo -e "${GREEN}✓ Bundle Analyzer 已安装${NC}"
    echo -e "${BLUE}使用方法: ANALYZE=true npm run build${NC}"
    echo ""
fi

# 3. 安装 Vercel Analytics
if [ "$apply_analytics" = true ]; then
    echo -e "${YELLOW}[3/5] 安装 Vercel Analytics...${NC}"

    npm install @vercel/analytics

    echo -e "${GREEN}✓ Vercel Analytics 已安装${NC}"
    echo -e "${BLUE}请手动在 app/[locale]/layout.tsx 中添加:${NC}"
    echo -e "${BLUE}import { Analytics } from '@vercel/analytics/react'${NC}"
    echo -e "${BLUE}然后在 body 中添加: <Analytics />${NC}"
    echo ""
fi

# 4. 创建数据库索引迁移
if [ "$apply_dbindex" = true ]; then
    echo -e "${YELLOW}[4/5] 创建数据库索引迁移文件...${NC}"

    mkdir -p supabase/migrations

    cat > supabase/migrations/004_performance_indexes.sql << 'EOF'
-- 性能优化索引
-- 创建日期: 2025-12-19

-- 优化项目查询（按状态和创建时间）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_status_created
ON projects(status, created_at DESC)
WHERE status IN ('active', 'completed');

-- 优化捐赠查询（按项目和状态）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_donations_project_status
ON donations(project_id, donation_status)
WHERE donation_status IN ('paid', 'confirmed', 'completed');

-- 优化公开捐赠列表查询（按捐赠时间）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_donations_donated_at_desc
ON donations(donated_at DESC)
WHERE donation_status IN ('confirmed', 'completed');

-- 优化活跃项目的单位查询
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_active_units
ON projects(current_units, target_units)
WHERE status = 'active';

-- 优化捐赠者邮箱查询
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_donations_email_lower
ON donations(LOWER(donor_email))
WHERE donation_status != 'pending';

-- 优化订单引用查询
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_donations_order_ref_unique
ON donations(order_reference)
WHERE order_reference IS NOT NULL;

-- 添加注释
COMMENT ON INDEX idx_projects_status_created IS '优化按状态和时间查询项目';
COMMENT ON INDEX idx_donations_project_status IS '优化按项目查询捐赠记录';
COMMENT ON INDEX idx_donations_donated_at_desc IS '优化公开捐赠列表查询';
COMMENT ON INDEX idx_projects_active_units IS '优化活跃项目进度查询';
COMMENT ON INDEX idx_donations_email_lower IS '优化大小写不敏感的邮箱查询';
COMMENT ON INDEX idx_donations_order_ref_unique IS '优化订单引用查询';
EOF

    echo -e "${GREEN}✓ 数据库索引迁移文件已创建${NC}"
    echo -e "${BLUE}位置: supabase/migrations/004_performance_indexes.sql${NC}"
    echo -e "${BLUE}应用迁移: supabase db push${NC}"
    echo ""
fi

# 5. 创建 vercel.json
if [ "$apply_verceljson" = true ]; then
    echo -e "${YELLOW}[5/5] 创建 vercel.json 配置...${NC}"

    cat > vercel.json << 'EOF'
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
      "source": "/(.*)\\.webp",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)\\.svg",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/api/donations/project-public/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, s-maxage=300, stale-while-revalidate=600"
        }
      ]
    }
  ]
}
EOF

    echo -e "${GREEN}✓ vercel.json 已创建${NC}"
    echo ""
fi

echo ""
echo -e "${GREEN}=================================="
echo -e "优化完成！"
echo -e "==================================${NC}"
echo ""
echo -e "${YELLOW}后续步骤：${NC}"
echo ""
echo "1. 运行图片优化:"
echo "   ./scripts/scan-images.sh"
echo ""
echo "2. 应用数据库迁移:"
echo "   supabase db push"
echo ""
echo "3. 分析 Bundle 大小:"
echo "   ANALYZE=true npm run build"
echo ""
echo "4. 重新构建项目:"
echo "   npm run build"
echo ""
echo "5. 测试性能:"
echo "   - 本地: npm run build && npm start"
echo "   - 线上: 使用 PageSpeed Insights"
echo ""
echo -e "${BLUE}详细文档: docs/PERFORMANCE_OPTIMIZATION.md${NC}"
