# 项目多语言化 - 快速开始 🚀

## ✅ 已完成的工作

1. ✅ **数据库迁移已应用**
   - 添加了 `project_name_i18n`, `location_i18n`, `unit_name_i18n`, `description_i18n` JSON 字段
   - 创建了 `get_translated_text()` 辅助函数
   - 更新了 `project_stats` 视图
   - 为现有数据自动添加了英文翻译

2. ✅ **TypeScript 类型已更新**
   - 定义了 `I18nText` 类型
   - 更新了 `projects` 表的类型定义

3. ✅ **前端辅助函数已创建**
   - `lib/i18n-utils.ts` - 包含所有翻译辅助函数

4. ✅ **组件已更新**
   - `ProjectCard.tsx` - 使用多语言数据
   - `ProjectCardCompact.tsx` - 使用多语言数据

---

## 🎯 下一步：添加翻译数据

### 方法1：在 Supabase Dashboard 中添加

1. 打开 Supabase Dashboard → SQL Editor
2. 运行以下 SQL（替换为你的实际数据）：

```sql
-- 更新项目 ID 为 1 的翻译
UPDATE public.projects
SET
    project_name_i18n = jsonb_build_object(
        'en', 'Your Project Name',
        'zh', '你的项目名称',
        'ua', 'Назва вашого проєкту'
    ),
    location_i18n = jsonb_build_object(
        'en', 'Location Name',
        'zh', '地点名称',
        'ua', 'Назва місця'
    ),
    unit_name_i18n = jsonb_build_object(
        'en', 'kit',
        'zh', '套件',
        'ua', 'комплект'
    ),
    description_i18n = jsonb_build_object(
        'en', 'Project description in English...',
        'zh', '项目的中文描述...',
        'ua', 'Опис проєкту українською...'
    )
WHERE id = 1;  -- 替换为你的项目 ID
```

### 方法2：批量导入（推荐）

参考文件：`supabase/example_project_i18n_data.sql`

里面包含了：
- 单个项目更新示例
- 新建项目示例
- 批量更新示例
- 常用翻译参考

---

## 📊 验证效果

### 1. 在数据库中查看

```sql
SELECT
    id,
    project_name,
    project_name_i18n->>'en' AS name_en,
    project_name_i18n->>'zh' AS name_zh,
    project_name_i18n->>'ua' AS name_ua
FROM public.projects;
```

### 2. 在网站上测试

访问以下链接查看不同语言版本：
- http://localhost:3000/en → 英文
- http://localhost:3000/zh → 中文
- http://localhost:3000/ua → 乌克兰语

---

## 📚 常用翻译参考

### 单位名称
```
kit          → 套件     → комплект
package      → 包裹     → пакет
medical kit  → 医疗包   → медичний набір
food package → 食品包   → продуктовий пакет
filter       → 过滤器   → фільтр
blanket      → 毯子     → ковдра
```

### 地点
```
Ukraine         → 乌克兰     → Україна
Kyiv            → 基辅       → Київ
Eastern Ukraine → 乌克兰东部 → Східна Україна
Rural Areas     → 农村地区   → Сільські райони
```

---

## 📖 详细文档

完整指南请参考：`docs/PROJECT_I18N_GUIDE.md`

包含内容：
- 架构设计详解
- 数据库函数说明
- 前端使用方法
- 故障排除指南
- 完整翻译参考表

---

## 🎉 示例

假设你有一个"清洁水源"项目：

```sql
UPDATE public.projects
SET
    project_name_i18n = jsonb_build_object(
        'en', 'Clean Water Initiative',
        'zh', '清洁水源计划',
        'ua', 'Ініціатива чистої води'
    ),
    location_i18n = jsonb_build_object(
        'en', 'Rural Ukraine',
        'zh', '乌克兰农村地区',
        'ua', 'Сільська Україна'
    ),
    unit_name_i18n = jsonb_build_object(
        'en', 'water filter',
        'zh', '净水器',
        'ua', 'фільтр для води'
    )
WHERE id = 1;
```

然后访问网站：
- `/en/donate` 显示："Clean Water Initiative" in "Rural Ukraine"
- `/zh/donate` 显示："清洁水源计划" in "乌克兰农村地区"
- `/ua/donate` 显示："Ініціатива чистої води" in "Сільська Україна"

---

**问题？** 查看 `docs/PROJECT_I18N_GUIDE.md` 的故障排除部分
