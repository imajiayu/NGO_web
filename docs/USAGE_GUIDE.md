# 项目图片和数据管理使用指南

## 🎯 快速开始

### 步骤 1: 重组现有图片

运行脚本移动项目3的图片到新位置：

```bash
cd /Users/majiayu/NGO_web
chmod +x reorganize_project3_images.sh
./reorganize_project3_images.sh
```

### 步骤 2: 添加项目卡片背景图

手动添加一张项目卡片背景图：

```bash
# 将你的背景图放到这个位置
cp your-background-image.webp public/images/projects/project-3/card/bg.webp
```

**背景图要求**:
- 尺寸: 1200x800px
- 格式: WebP
- 大小: < 100KB

### 步骤 3: 启动测试

```bash
npm run dev
```

访问以下页面验证：
- 首页: http://localhost:3000
- 项目详情: 找到项目3并点击查看详情

---

## 📝 日常使用

### 更新首页轮播图片

编辑文件: `public/content/home/marquee-{locale}.json`

**示例 - 添加新图片**:

```json
{
  "results": [
    {
      "imageUrl": "/images/projects/project-3/results/new-photo.webp",
      "caption": "新活动照片描述",
      "date": "2025-01-10",
      "category": "feedback",
      "projectId": 3
    }
  ]
}
```

**三个语言文件都需要更新**:
- `marquee-en.json` - 英文
- `marquee-zh.json` - 中文
- `marquee-ua.json` - 乌克兰语

---

### 更新项目详情页图片

编辑文件: `public/content/projects/project-3-{locale}.json`

#### 1. 更新详情页顶部图片 (`images` 字段)

```json
{
  "images": [
    "/images/projects/project-3/details/shelter-visit-1.webp",
    "/images/projects/project-3/details/shelter-visit-2.webp",
    "/images/projects/project-3/details/new-visit.webp"
  ]
}
```

#### 2. 更新项目成果图片 (`results` 字段)

```json
{
  "results": [
    {
      "imageUrl": "/images/projects/project-3/results/group-photo-0.webp",
      "caption": "2025圣诞节第聂伯罗孤儿礼物包裹项目",
      "date": "2024-12-20",
      "category": "feedback"
    }
  ]
}
```

---

## 🖼️ 添加新图片的完整流程

### 场景 1: 添加项目成果照片

1. **处理图片**:
```bash
# 使用 ImageMagick 和 ffmpeg 压缩
magick your-photo.jpg -resize '1200x1200>' -quality 80 -strip temp.jpg
ffmpeg -i temp.jpg -c:v libwebp -quality 50 output.webp -y
rm temp.jpg
```

2. **移动到正确位置**:
```bash
mv output.webp public/images/projects/project-3/results/activity-XX.webp
```

3. **更新 JSON** (三个语言文件):

**英文** (`project-3-en.json`):
```json
{
  "imageUrl": "/images/projects/project-3/results/activity-XX.webp",
  "caption": "English description",
  "date": "2025-01-10",
  "category": "feedback"
}
```

**中文** (`project-3-zh.json`):
```json
{
  "imageUrl": "/images/projects/project-3/results/activity-XX.webp",
  "caption": "中文描述",
  "date": "2025-01-10",
  "category": "feedback"
}
```

**乌克兰语** (`project-3-ua.json`):
```json
{
  "imageUrl": "/images/projects/project-3/results/activity-XX.webp",
  "caption": "Опис українською",
  "date": "2025-01-10",
  "category": "feedback"
}
```

4. **（可选）添加到首页轮播**:

如果这张照片特别好，可以添加到首页轮播：

```bash
# 编辑 public/content/home/marquee-en.json
# 编辑 public/content/home/marquee-zh.json
# 编辑 public/content/home/marquee-ua.json
```

---

### 场景 2: 添加收据图片

1. **处理图片**:
```bash
magick receipt.jpg -resize '1200x1200>' -quality 80 -strip temp.jpg
ffmpeg -i temp.jpg -c:v libwebp -quality 60 receipt-X.webp -y
rm temp.jpg
```

2. **移动到 receipts 文件夹**:
```bash
mv receipt-X.webp public/images/projects/project-3/receipts/
```

3. **更新 JSON**:
```json
{
  "imageUrl": "/images/projects/project-3/receipts/receipt-X.webp",
  "caption": "收据描述",
  "date": "2024-12-15",
  "category": "purchase"
}
```

---

## 🎨 图片分类指南

### Category 字段说明

| Category | 用途 | 示例 |
|----------|------|------|
| `purchase` | 采购相关 | 收据、发票、购物清单 |
| `delivery` | 配送过程 | 运输、分发、交接照片 |
| `feedback` | 受益者反馈 | 孩子们的笑脸、使用礼物的场景 |
| `other` | 其他 | 不属于上述分类的照片 |

### 建议的图片分布

**首页轮播** (10-15张):
- 70% `feedback` - 展示影响力
- 20% `delivery` - 展示执行力
- 10% `purchase` - 展示透明度

**项目详情页** (所有相关图片):
- 包含完整的项目记录
- 按时间顺序排列

---

## 📋 检查清单

### 添加新图片前

- [ ] 图片已经过压缩（< 150KB）
- [ ] 图片格式为 WebP
- [ ] 图片尺寸适当（1200px 宽度）
- [ ] 准备好三种语言的 caption

### 添加新图片后

- [ ] 已添加到正确的文件夹
- [ ] 已更新三个语言版本的 JSON
- [ ] caption 翻译准确
- [ ] 本地测试图片正常显示
- [ ] 检查移动端显示效果

---

## 🔧 常见问题

### Q: 图片不显示怎么办？

**检查步骤**:
1. 确认图片路径正确（使用绝对路径，以 `/images/` 开头）
2. 确认文件确实存在于 `public/` 目录下
3. 清除浏览器缓存
4. 重启开发服务器

### Q: 首页轮播图片太多了，如何精简？

编辑 `public/content/home/marquee-{locale}.json`，只保留最有代表性的 10-15 张图片。

### Q: 如何调整首页轮播的速度？

编辑 `app/[locale]/page.tsx`，找到这一行：

```typescript
<ProjectResultsMarquee results={projectResults} rowCount={3} speed={35} />
```

调整 `speed` 参数：
- 更小的值 = 更快（如 `speed={25}`）
- 更大的值 = 更慢（如 `speed={45}`）

### Q: 如何添加新项目？

1. 创建目录结构:
```bash
mkdir -p public/images/projects/project-4/{card,details,receipts,results}
```

2. 创建 JSON 文件:
```bash
cp public/content/projects/project-3-en.json public/content/projects/project-4-en.json
# 编辑内容...
```

3. 更新首页轮播（如需要）

---

## 📞 需要帮助？

- 查看详细结构: `PROJECT_STRUCTURE.md`
- 技术文档: `CLAUDE.md`
- 数据库文档: `docs/DATABASE_SCHEMA.md`

---

## 🎉 完成！

现在你已经了解如何管理项目图片和数据了。记住：

1. ✅ 图片放在正确的文件夹（card/details/receipts/results）
2. ✅ 更新对应的 JSON 文件（三种语言）
3. ✅ 测试确保正常显示

祝使用愉快！
