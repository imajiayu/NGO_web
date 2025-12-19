#!/bin/bash

# Vercel 部署准备脚本
# Prepare for Vercel Deployment Script

echo "🚀 准备 Vercel 部署 / Preparing Vercel Deployment"
echo "================================================"

# 检查是否有 .env.local 文件
if [ ! -f .env.local ]; then
    echo "❌ 错误：找不到 .env.local 文件"
    echo "❌ Error: .env.local file not found"
    echo "请先复制 .env.example 并填入正确的值"
    echo "Please copy .env.example and fill in the correct values"
    exit 1
fi

echo ""
echo "1️⃣ 检查环境变量 / Checking environment variables..."

# 读取必需的环境变量
source .env.local 2>/dev/null || true

required_vars=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "WAYFORPAY_MERCHANT_ACCOUNT"
    "WAYFORPAY_SECRET_KEY"
    "RESEND_API_KEY"
    "RESEND_FROM_EMAIL"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "❌ 缺少以下环境变量 / Missing environment variables:"
    printf '   - %s\n' "${missing_vars[@]}"
    echo ""
    echo "请在 .env.local 中配置这些变量"
    echo "Please configure these variables in .env.local"
    exit 1
else
    echo "✅ 所有必需的环境变量都已配置"
    echo "✅ All required environment variables are configured"
fi

echo ""
echo "2️⃣ 测试构建 / Testing build..."

# 运行构建测试
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败 / Build failed"
    echo "请修复错误后再部署"
    echo "Please fix errors before deployment"
    exit 1
else
    echo "✅ 构建成功 / Build successful"
fi

echo ""
echo "3️⃣ 检查 Git 状态 / Checking Git status..."

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  发现未提交的更改 / Uncommitted changes found"
    git status --short
    echo ""
    read -p "是否提交所有更改？ / Commit all changes? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        read -p "请输入提交信息 / Enter commit message: " commit_message
        git commit -m "$commit_message"
        echo "✅ 更改已提交 / Changes committed"
    else
        echo "⚠️  请手动提交更改后再部署"
        echo "⚠️  Please commit changes manually before deployment"
        exit 1
    fi
else
    echo "✅ 没有未提交的更改 / No uncommitted changes"
fi

echo ""
echo "4️⃣ 检查远程仓库 / Checking remote repository..."

# 检查是否配置了远程仓库
if git remote | grep -q "origin"; then
    echo "✅ 已配置 Git 远程仓库 / Git remote configured"
    remote_url=$(git remote get-url origin)
    echo "   远程 URL / Remote URL: $remote_url"

    read -p "是否推送到远程仓库？ / Push to remote? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push origin $(git branch --show-current)
        if [ $? -eq 0 ]; then
            echo "✅ 代码已推送 / Code pushed successfully"
        else
            echo "❌ 推送失败 / Push failed"
            exit 1
        fi
    fi
else
    echo "⚠️  未配置 Git 远程仓库 / No Git remote configured"
    echo "请先创建 GitHub 仓库并添加远程地址："
    echo "Please create a GitHub repository and add remote:"
    echo ""
    echo "  git remote add origin https://github.com/用户名/仓库名.git"
    echo "  git push -u origin master"
    exit 1
fi

echo ""
echo "================================================"
echo "✅ 部署准备完成！ / Deployment preparation complete!"
echo ""
echo "📋 下一步 / Next steps:"
echo ""
echo "1. 访问 Vercel / Visit Vercel: https://vercel.com"
echo "2. 导入 GitHub 仓库 / Import GitHub repository"
echo "3. 配置环境变量 / Configure environment variables"
echo "4. 部署项目 / Deploy project"
echo ""
echo "📖 查看完整指南 / See full guide: docs/VERCEL_DEPLOYMENT.md"
echo ""
echo "🔑 需要在 Vercel 中配置的环境变量 / Environment variables for Vercel:"
echo ""
echo "NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "SUPABASE_SERVICE_ROLE_KEY=***"
echo "WAYFORPAY_MERCHANT_ACCOUNT=$WAYFORPAY_MERCHANT_ACCOUNT"
echo "WAYFORPAY_SECRET_KEY=***"
echo "RESEND_API_KEY=***"
echo "RESEND_FROM_EMAIL=$RESEND_FROM_EMAIL"
echo "NEXT_PUBLIC_APP_URL=https://你的域名.vercel.app"
echo ""
