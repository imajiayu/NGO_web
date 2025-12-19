#!/bin/bash

# 图片扫描和优化脚本
# 功能：
# 1. 扫描项目根目录下所有图片文件
# 2. 使用 imagemagick 将图片转换为 webp 格式并压缩质量
# 3. 不处理 svg 文件
# 4. 保持原始尺寸不变

# 设置根目录（项目根目录，脚本所在目录的上一层）
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="$ROOT_DIR/backup_images_$(date +%Y%m%d_%H%M%S)"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# WebP 质量设置（80-85 是一个好的平衡点）
WEBP_QUALITY=85

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}图片扫描和优化工具${NC}"
echo -e "${BLUE}==================================${NC}"
echo ""
echo "扫描目录: $ROOT_DIR"
echo ""

# 检查依赖
if ! command -v magick &> /dev/null; then
    echo -e "${RED}错误: 未找到 imagemagick (magick 命令)${NC}"
    echo "请安装: brew install imagemagick"
    exit 1
fi

# 图片文件扩展名（排除 svg 和 webp）
IMAGE_EXTENSIONS=("jpg" "jpeg" "png" "gif" "bmp" "tiff" "tif")

# 存储找到的图片文件
declare -a image_files
declare -a image_sizes

echo -e "${YELLOW}正在扫描图片文件...${NC}"
echo ""

# 总计数和总大小
total_count=0
total_size=0

# 遍历每个扩展名
for ext in "${IMAGE_EXTENSIONS[@]}"; do
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            # 获取文件大小（字节）
            size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)

            # 转换大小为可读格式
            if [ $size -lt 1024 ]; then
                size_readable="${size}B"
            elif [ $size -lt 1048576 ]; then
                size_readable="$(echo "scale=2; $size/1024" | bc)KB"
            else
                size_readable="$(echo "scale=2; $size/1048576" | bc)MB"
            fi

            # 打印文件路径和大小
            echo "$file -> $size_readable"

            # 存储文件信息
            image_files+=("$file")
            image_sizes+=("$size")

            # 累加统计
            ((total_count++))
            total_size=$((total_size + size))
        fi
    done < <(find "$ROOT_DIR" -type f \( -iname "*.${ext}" \) -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/.next/*" -not -path "*/backup_images_*/*" 2>/dev/null)
done

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}扫描完成！${NC}"
echo "总文件数: $total_count"

# 转换总大小
if [ $total_size -lt 1024 ]; then
    echo "总大小: ${total_size}B"
elif [ $total_size -lt 1048576 ]; then
    echo "总大小: $(echo "scale=2; $total_size/1024" | bc)KB"
else
    echo "总大小: $(echo "scale=2; $total_size/1048576" | bc)MB"
fi
echo -e "${GREEN}================================${NC}"
echo ""

# 如果没有找到图片，退出
if [ $total_count -eq 0 ]; then
    echo -e "${YELLOW}没有找到需要优化的图片文件${NC}"
    exit 0
fi

# 询问是否优化
echo -e "${YELLOW}是否要优化这些图片？${NC}"
echo "优化操作："
echo "  - 将图片转换为 WebP 格式"
echo "  - 质量设置: ${WEBP_QUALITY}%"
echo "  - 保持原始尺寸不变"
echo "  - 原文件将被备份到: $BACKUP_DIR"
echo ""
read -p "继续优化？(y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}已取消优化${NC}"
    exit 0
fi

# 创建备份目录
echo ""
echo -e "${BLUE}创建备份目录...${NC}"
mkdir -p "$BACKUP_DIR"

# 开始优化
echo ""
echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}开始优化图片...${NC}"
echo -e "${BLUE}==================================${NC}"
echo ""

optimized_count=0
failed_count=0
total_saved=0

for i in "${!image_files[@]}"; do
    file="${image_files[$i]}"
    original_size="${image_sizes[$i]}"

    # 获取文件目录和文件名
    file_dir=$(dirname "$file")
    file_name=$(basename "$file")
    file_base="${file_name%.*}"

    # 新的 webp 文件路径
    webp_file="${file_dir}/${file_base}.webp"

    echo -e "${YELLOW}[$((i+1))/$total_count]${NC} 处理: $file"

    # 备份原文件
    backup_path="$BACKUP_DIR/$file_name"
    cp "$file" "$backup_path"

    # 使用 imagemagick 转换为 webp
    if magick "$file" -quality $WEBP_QUALITY "$webp_file" 2>/dev/null; then
        # 获取新文件大小
        new_size=$(stat -f%z "$webp_file" 2>/dev/null || stat -c%s "$webp_file" 2>/dev/null)
        saved=$((original_size - new_size))
        total_saved=$((total_saved + saved))

        # 格式化大小显示
        if [ $original_size -lt 1048576 ]; then
            orig_readable="$(echo "scale=2; $original_size/1024" | bc)KB"
        else
            orig_readable="$(echo "scale=2; $original_size/1048576" | bc)MB"
        fi

        if [ $new_size -lt 1048576 ]; then
            new_readable="$(echo "scale=2; $new_size/1024" | bc)KB"
        else
            new_readable="$(echo "scale=2; $new_size/1048576" | bc)MB"
        fi

        # 计算节省百分比
        if [ $original_size -gt 0 ]; then
            saved_percent=$(echo "scale=1; ($saved * 100) / $original_size" | bc)
        else
            saved_percent=0
        fi

        echo -e "${GREEN}  ✓ 成功${NC}: $orig_readable -> $new_readable (节省 ${saved_percent}%)"

        # 删除原文件
        rm "$file"

        ((optimized_count++))
    else
        echo -e "${RED}  ✗ 失败${NC}"
        ((failed_count++))
        # 如果失败，恢复备份
        cp "$backup_path" "$file"
    fi

    echo ""
done

# 最终统计
echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}优化完成！${NC}"
echo -e "${GREEN}==================================${NC}"
echo "成功优化: $optimized_count 个文件"
echo "失败: $failed_count 个文件"

# 显示总节省空间
if [ $total_saved -lt 1048576 ]; then
    saved_readable="$(echo "scale=2; $total_saved/1024" | bc)KB"
else
    saved_readable="$(echo "scale=2; $total_saved/1048576" | bc)MB"
fi

if [ $total_size -gt 0 ]; then
    total_saved_percent=$(echo "scale=1; ($total_saved * 100) / $total_size" | bc)
else
    total_saved_percent=0
fi

echo "总节省空间: $saved_readable (${total_saved_percent}%)"
echo ""
echo "原文件备份位置: $BACKUP_DIR"
echo ""
echo -e "${BLUE}提示: 如果优化效果满意，可以删除备份目录以释放空间${NC}"
