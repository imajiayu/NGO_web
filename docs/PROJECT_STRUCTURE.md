# 项目3 图片和数据结构说明

## 📁 完整目录结构

```
public/
├── content/
│   ├── home/
│   │   ├── marquee-en.json         ← 首页轮播数据（英文）
│   │   ├── marquee-zh.json         ← 首页轮播数据（中文）
│   │   └── marquee-ua.json         ← 首页轮播数据（乌克兰语）
│   └── projects/
│       ├── project-3-en.json       ← 项目3详情数据（英文）
│       ├── project-3-zh.json       ← 项目3详情数据（中文）
│       ├── project-3-ua.json       ← 项目3详情数据（乌克兰语）
│       ├── project-3-supplies-en.json
│       ├── project-3-supplies-zh.json
│       └── project-3-supplies-ua.json
└── images/
    └── projects/
        └── project-3/
            ├── card/
            │   └── bg.webp                    ← 项目卡片背景图
            ├── details/
            │   ├── shelter-visit-1.webp       ← 项目详情页图片
            │   ├── shelter-visit-2.webp
            │   └── shelter-visit-3.webp
            ├── receipts/
            │   ├── receipt-1.webp             ← 收据图片
            │   ├── receipt-2.webp
            │   ├── receipt-3.webp
            │   ├── receipt-4.webp
            │   ├── receipt-5.webp
            │   ├── receipt-6.webp
            │   └── receipt-7.webp
            └── results/
                ├── group-photo-0.webp         ← 项目成果图片
                ├── group-photo-1.webp
                ├── group-photo-2.webp
                ├── group-photo-3.webp
                ├── delivery-1.webp
                ├── activity-2.webp
                └── ... (更多活动照片)
```

---

## 🎯 各目录用途

### 1. **card/** - 项目卡片背景图
**用途**: 项目列表页面的卡片背景图
**显示位置**: 首页项目网格、项目选择页面
**推荐尺寸**: 1200x800px
**格式**: WebP

### 2. **details/** - 项目详情图片
**用途**: 项目详情页面顶部展示的现场照片
**显示位置**: 项目详情页 "Images" 区域
**推荐尺寸**: 1920x1080px
**格式**: WebP
**数量**: 3-5 张

### 3. **receipts/** - 收据和发票图片
**用途**: 项目财务透明度展示
**显示位置**: 项目详情页 "Project Results" 区域
**推荐尺寸**: 1200x1600px（竖版）
**格式**: WebP
**分类**: category: "purchase"

### 4. **results/** - 项目成果图片
**用途**: 展示项目执行过程和完成效果
**显示位置**:
  - 首页轮播（marquee）
  - 项目详情页 "Project Results" 区域
**推荐尺寸**: 1200x800px
**格式**: WebP
**分类**:
  - category: "delivery" - 配送过程
  - category: "feedback" - 受益者反馈

---

## 📄 JSON 文件结构

### 首页轮播 (`public/content/home/marquee-{locale}.json`)

```json
{
  "title": "Our Impact in Action",
  "subtitle": "See the real difference your donations make",
  "results": [
    {
      "imageUrl": "/images/projects/project-3/results/group-photo-0.webp",
      "caption": "项目描述",
      "date": "2024-12-20",
      "category": "feedback",
      "projectId": 3
    }
  ]
}
```

**字段说明**:
- `title`: 轮播区块标题
- `subtitle`: 轮播区块副标题
- `results`: 图片数组
  - `imageUrl`: 图片路径
  - `caption`: 图片说明
  - `date`: 拍摄/活动日期
  - `category`: 分类（purchase/delivery/feedback）
  - `projectId`: 所属项目ID（可选）

---

### 项目详情 (`public/content/projects/project-3-{locale}.json`)

```json
{
  "title": "项目标题",
  "subtitle": "项目副标题",
  "images": [
    "/images/projects/project-3/details/shelter-visit-1.webp"
  ],
  "introduction": ["简介段落1", "简介段落2"],
  "shelters": [...],
  "statistics": {...},
  "giftsList": [...],
  "results": [
    {
      "imageUrl": "/images/projects/project-3/results/group-photo-0.webp",
      "caption": "图片说明",
      "date": "2024-12-20",
      "category": "feedback"
    }
  ]
}
```

**字段说明**:
- `images`: 项目详情图片（显示在详情页顶部）
- `results`: 项目成果图片（显示在详情页底部）

---

## 🔧 使用指南

### 添加新项目时

1. **创建目录结构**:
```bash
mkdir -p public/images/projects/project-{id}/{card,details,receipts,results}
```

2. **准备图片**:
   - 项目卡片背景: `card/bg.webp`
   - 现场照片 (3-5张): `details/photo-1.webp`, `details/photo-2.webp`...
   - 收据: `receipts/receipt-1.webp`, `receipts/receipt-2.webp`...
   - 成果照片: `results/result-1.webp`, `results/result-2.webp`...

3. **创建 JSON 文件**:
   - 项目详情: `public/content/projects/project-{id}-{locale}.json`
   - 更新首页轮播: `public/content/home/marquee-{locale}.json`

---

## 🚀 迁移现有图片

运行提供的脚本来重组项目3的图片：

```bash
chmod +x reorganize_project3_images.sh
./reorganize_project3_images.sh
```

**手动步骤**:
1. 添加项目卡片背景图到 `public/images/projects/project-3/card/bg.webp`
2. 验证所有图片已正确移动
3. 测试网站确保图片正常加载

---

## 📊 图片数量统计（项目3示例）

| 类型 | 数量 | 位置 |
|------|------|------|
| 卡片背景 | 1 | `card/bg.webp` |
| 详情图片 | 3 | `details/shelter-visit-*.webp` |
| 收据 | 7 | `receipts/receipt-*.webp` |
| 成果照片 | 45+ | `results/*.webp` |

---

## 🎨 图片优化建议

- **格式**: WebP（已优化）
- **质量**: 50-80（根据类型调整）
- **大小**: 控制在 50-150KB/张
- **尺寸**:
  - 卡片背景: 1200x800px
  - 详情图片: 1920x1080px
  - 收据: 1200x1600px
  - 成果照片: 1200x800px

---

## ✅ 更新日志

### 2025-01-04
- ✅ 创建新的目录结构（card/details/receipts/results）
- ✅ 分离首页轮播和项目详情的 JSON 文件
- ✅ 更新所有 JSON 文件的图片路径
- ✅ 更新首页代码使用独立的 marquee JSON
- ✅ 提供图片重组脚本

---

## 📝 注意事项

1. **路径一致性**: 所有 JSON 中的图片路径必须与实际文件位置一致
2. **多语言支持**: 每种语言的 JSON 文件必须包含相同数量的图片
3. **Caption 翻译**: 确保每种语言的 caption 都有准确翻译
4. **首页轮播**: 建议只选择最有代表性的 10-15 张照片展示
5. **项目详情**: 可以包含所有项目相关图片
