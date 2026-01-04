# 如何添加项目卡片背景图

## 📸 项目3的卡片背景图

### 当前问题
项目卡片背景图无法加载，因为文件不存在于新的位置。

### 解决方案

#### 步骤 1: 准备背景图

1. 选择一张代表项目的照片（建议使用项目现场照片或成果照片）
2. 使用以下命令处理图片：

```bash
cd /Users/majiayu/NGO_web

# 假设你的原始图片是 source-image.jpg
# 使用 ImageMagick 调整大小并优化
magick source-image.jpg -resize '1200x800^' -gravity center -extent 1200x800 -quality 85 -strip temp_bg.jpg

# 使用 ffmpeg 转换为 WebP
ffmpeg -i temp_bg.jpg -c:v libwebp -quality 70 public/images/projects/project-3/card/bg.webp -y

# 清理临时文件
rm temp_bg.jpg
```

**推荐参数**:
- 尺寸: 1200x800px (3:2 比例)
- 格式: WebP
- 质量: 70-80
- 文件大小: < 150KB

#### 步骤 2: 验证文件位置

确保文件存在于正确位置：
```bash
ls -lh public/images/projects/project-3/card/bg.webp
```

应该看到类似输出：
```
-rw-r--r--  1 user  staff   120K  1月  4 12:00 public/images/projects/project-3/card/bg.webp
```

#### 步骤 3: 测试

```bash
# 启动开发服务器
npm run dev

# 访问首页查看项目卡片
# http://localhost:3000
```

---

## 🎨 为其他项目添加背景图

### 目录结构

每个项目都应该有自己的背景图：

```
public/images/projects/
├── project-1/
│   └── card/
│       └── bg.webp
├── project-2/
│   └── card/
│       └── bg.webp
├── project-3/
│   └── card/
│       └── bg.webp  ← 需要添加这个
└── ...
```

### 批量添加脚本

如果你有多个项目需要添加背景图：

```bash
#!/bin/bash

# 为项目1添加背景图
mkdir -p public/images/projects/project-1/card
magick project-1-source.jpg -resize '1200x800^' -gravity center -extent 1200x800 -quality 85 -strip temp.jpg
ffmpeg -i temp.jpg -c:v libwebp -quality 70 public/images/projects/project-1/card/bg.webp -y
rm temp.jpg

# 为项目2添加背景图
mkdir -p public/images/projects/project-2/card
magick project-2-source.jpg -resize '1200x800^' -gravity center -extent 1200x800 -quality 85 -strip temp.jpg
ffmpeg -i temp.jpg -c:v libwebp -quality 70 public/images/projects/project-2/card/bg.webp -y
rm temp.jpg

echo "All card backgrounds created!"
```

---

## 🔍 故障排查

### 问题: 404 错误 - background.webp not found

**原因**: 路径已更新，但背景图文件不存在

**解决**:
```bash
# 检查文件是否存在
ls public/images/projects/project-3/card/bg.webp

# 如果不存在，添加背景图（参考上面的步骤）
```

### 问题: 背景图显示模糊

**原因**: 图片质量或尺寸不合适

**解决**:
```bash
# 重新处理图片，提高质量
magick source-image.jpg -resize '1200x800^' -gravity center -extent 1200x800 -quality 90 -strip temp_bg.jpg
ffmpeg -i temp_bg.jpg -c:v libwebp -quality 80 public/images/projects/project-3/card/bg.webp -y
rm temp_bg.jpg
```

### 问题: 背景图太大，加载慢

**原因**: 文件大小过大

**解决**:
```bash
# 降低质量以减小文件大小
ffmpeg -i original.webp -c:v libwebp -quality 60 public/images/projects/project-3/card/bg.webp -y

# 检查文件大小
ls -lh public/images/projects/project-3/card/bg.webp
```

---

## 📋 背景图选择建议

### 好的背景图特征：
- ✅ 清晰、高质量
- ✅ 代表项目主题
- ✅ 色彩柔和（避免过于鲜艳）
- ✅ 构图简洁（避免过于复杂）
- ✅ 适合作为背景（文字可读）

### 避免：
- ❌ 人脸特写（隐私问题）
- ❌ 文字过多的图片
- ❌ 对比度过高的图片
- ❌ 过于暗淡的图片

### 推荐来源：
- 项目现场照片（模糊处理人脸）
- 项目成果展示照片
- 相关的场景照片（如学校、庇护所外景）

---

## 🎯 快速开始（项目3）

如果你手头有一张合适的照片：

```bash
cd /Users/majiayu/NGO_web

# 1. 复制你的照片到项目根目录，命名为 project-3-bg.jpg

# 2. 运行处理命令
magick project-3-bg.jpg -resize '1200x800^' -gravity center -extent 1200x800 -quality 85 -strip temp_bg.jpg
ffmpeg -i temp_bg.jpg -c:v libwebp -quality 70 public/images/projects/project-3/card/bg.webp -y
rm temp_bg.jpg

# 3. 验证
ls -lh public/images/projects/project-3/card/bg.webp

# 4. 测试
npm run dev
```

完成！🎉

---

## 📝 注意事项

1. **路径格式**: `/images/projects/project-{id}/card/bg.webp`
2. **文件命名**: 必须是 `bg.webp`（小写）
3. **目录创建**: 确保 `card/` 目录存在
4. **缓存清理**: 如果更新背景图后没有变化，清除浏览器缓存

---

## 🔗 相关文档

- [项目结构说明](PROJECT_STRUCTURE.md)
- [使用指南](USAGE_GUIDE.md)
- [重组脚本](reorganize_project3_images.sh)
