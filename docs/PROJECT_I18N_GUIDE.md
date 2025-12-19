# 项目信息多语言化指南 / Project i18n Guide

## 📚 概述 / Overview

本指南说明如何为项目数据（项目名称、地点、单位名称等）实现多语言支持。

This guide explains how to implement multi-language support for project data (project names, locations, unit names, etc.).

---

## 🎯 支持的语言 / Supported Languages

- 🇺🇸 **English (en)** - 英语
- 🇨🇳 **中文 (zh)** - Chinese
- 🇺🇦 **Українська (ua)** - Ukrainian

---

## 🏗️ 架构设计 / Architecture

### 数据库结构 / Database Structure

项目表 (`projects`) 包含以下多语言字段：

```sql
-- 原始字段（英文，作为默认值）
project_name VARCHAR(255)
location VARCHAR(255)
unit_name VARCHAR(50)

-- 多语言 JSON 字段
project_name_i18n JSONB  -- {"en": "...", "zh": "...", "ua": "..."}
location_i18n JSONB      -- {"en": "...", "zh": "...", "ua": "..."}
unit_name_i18n JSONB     -- {"en": "...", "zh": "...", "ua": "..."}
description_i18n JSONB   -- {"en": "...", "zh": "...", "ua": "..."}
```

### 前端使用 / Frontend Usage

使用辅助函数从 JSON 字段中提取对应语言的文本：

```typescript
import { getProjectName, getLocation, getUnitName } from '@/lib/i18n-utils'

// 在组件中
const projectName = getProjectName(
  project.project_name_i18n,
  project.project_name,
  locale as SupportedLocale
)
```

---

## 🚀 快速开始 / Quick Start

### 1. 运行数据库迁移 / Run Database Migration

```bash
# 确保你已经配置好 Supabase CLI
cd /Users/majiayu/NGO_web

# 应用迁移（添加 i18n 字段）
supabase db push

# 或者手动在 Supabase Dashboard 中运行迁移文件：
# supabase/migrations/20251219100000_add_project_i18n.sql
```

### 2. 添加翻译数据 / Add Translation Data

参考示例文件：`supabase/example_project_i18n_data.sql`

**方法 A：更新现有项目**

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
WHERE id = 1; -- 替换为你的项目 ID
```

**方法 B：插入新项目时包含翻译**

```sql
INSERT INTO public.projects (
    project_name,
    project_name_i18n,
    location,
    location_i18n,
    unit_name,
    unit_name_i18n,
    -- ... 其他字段
) VALUES (
    'Emergency Medical Kits',
    '{"en": "Emergency Medical Kits", "zh": "紧急医疗包", "ua": "Екстрені медичні набори"}',
    'Eastern Ukraine',
    '{"en": "Eastern Ukraine", "zh": "乌克兰东部", "ua": "Східна Україна"}',
    'medical kit',
    '{"en": "medical kit", "zh": "医疗包", "ua": "медичний набір"}',
    -- ... 其他值
);
```

### 3. 验证效果 / Verify Results

访问你的网站：
- `/en/donate` - 查看英文版本
- `/zh/donate` - 查看中文版本
- `/ua/donate` - 查看乌克兰语版本

---

## 📖 详细使用说明 / Detailed Usage

### 数据库函数 / Database Functions

#### `get_translated_text()`

获取指定语言的翻译文本：

```sql
SELECT get_translated_text(
    project_name_i18n,  -- i18n JSON 对象
    project_name,       -- 默认值（原始文本）
    'zh'                -- 请求的语言代码
) AS translated_name
FROM projects
WHERE id = 1;
```

**回退逻辑 / Fallback Logic:**
1. 尝试返回请求的语言（zh）
2. 如果不存在，返回英语（en）
3. 如果英语也不存在，返回原始字段的值

### 前端辅助函数 / Frontend Helper Functions

位置：`lib/i18n-utils.ts`

```typescript
// 通用翻译函数
getTranslatedText(i18nText, fallbackText, locale)

// 专用辅助函数
getProjectName(projectNameI18n, fallbackName, locale)
getLocation(locationI18n, fallbackLocation, locale)
getUnitName(unitNameI18n, fallbackUnitName, locale)
getDescription(descriptionI18n, fallbackDescription, locale)
```

**使用示例：**

```typescript
import { getProjectName, type SupportedLocale } from '@/lib/i18n-utils'

function MyComponent({ project, locale }) {
  const name = getProjectName(
    project.project_name_i18n,
    project.project_name,
    locale as SupportedLocale
  )

  return <h1>{name}</h1>
}
```

---

## 🔍 常见翻译参考 / Common Translations

### 单位名称 / Unit Names

| English | 中文 | Українська |
|---------|------|------------|
| kit | 套件 | комплект |
| package | 包裹 | пакет |
| filter | 过滤器 | фільтр |
| meal | 餐 | прийом їжі |
| blanket | 毯子 | ковдра |
| set | 套装 | набір |
| medical kit | 医疗包 | медичний набір |
| food package | 食品包 | продуктовий пакет |

### 地点 / Locations

| English | 中文 | Українська |
|---------|------|------------|
| Ukraine | 乌克兰 | Україна |
| Kyiv | 基辅 | Київ |
| Eastern Ukraine | 乌克兰东部 | Східна Україна |
| Western Ukraine | 乌克兰西部 | Західна Україна |
| Rural Areas | 农村地区 | Сільські райони |
| Kharkiv | 哈尔科夫 | Харків |
| Lviv | 利沃夫 | Львів |

### 项目类型 / Project Types

| English | 中文 | Українська |
|---------|------|------------|
| Emergency Aid | 紧急援助 | Екстрена допомога |
| Medical Support | 医疗支持 | Медична підтримка |
| Food Distribution | 食品分发 | Роздача їжі |
| Shelter Program | 住所项目 | Програма притулку |
| Education Initiative | 教育计划 | Освітня ініціатива |
| Water Access | 水源供应 | Доступ до води |
| Winter Relief | 冬季救援 | Зимова допомога |

---

## 🛠️ 管理和维护 / Management & Maintenance

### 查询所有翻译 / Query All Translations

```sql
SELECT
    id,
    project_name,
    project_name_i18n->>'en' AS name_en,
    project_name_i18n->>'zh' AS name_zh,
    project_name_i18n->>'ua' AS name_ua,
    location,
    location_i18n->>'en' AS location_en,
    location_i18n->>'zh' AS location_zh,
    location_i18n->>'ua' AS location_ua
FROM public.projects
ORDER BY id;
```

### 查找缺失翻译 / Find Missing Translations

```sql
-- 查找没有中文翻译的项目
SELECT id, project_name
FROM public.projects
WHERE project_name_i18n->>'zh' IS NULL
   OR project_name_i18n->>'zh' = '';

-- 查找没有乌克兰语翻译的项目
SELECT id, project_name
FROM public.projects
WHERE project_name_i18n->>'ua' IS NULL
   OR project_name_i18n->>'ua' = '';
```

### 批量更新 / Bulk Update

```sql
-- 为所有项目添加缺失的英文翻译（使用原字段值）
UPDATE public.projects
SET project_name_i18n = jsonb_set(
    COALESCE(project_name_i18n, '{}'::jsonb),
    '{en}',
    to_jsonb(project_name)
)
WHERE project_name_i18n->>'en' IS NULL;
```

---

## 🧪 测试 / Testing

### 1. 数据库层测试

```sql
-- 测试翻译函数
SELECT
    id,
    project_name,
    get_translated_text(project_name_i18n, project_name, 'en') AS en,
    get_translated_text(project_name_i18n, project_name, 'zh') AS zh,
    get_translated_text(project_name_i18n, project_name, 'ua') AS ua
FROM public.projects
LIMIT 3;
```

### 2. 前端测试清单

- [ ] 访问 `/en/donate` - 验证显示英文
- [ ] 访问 `/zh/donate` - 验证显示中文
- [ ] 访问 `/ua/donate` - 验证显示乌克兰语
- [ ] 切换语言时项目信息正确更新
- [ ] 缺少翻译时正确回退到英文
- [ ] 项目卡片显示翻译后的名称、地点、单位

---

## ⚠️ 注意事项 / Important Notes

### 1. 数据完整性

- **始终保持英文版本**：英文作为默认回退语言，必须提供
- **原始字段依然重要**：`project_name`, `location`, `unit_name` 仍作为最终回退值
- **JSON 格式要正确**：使用 `jsonb_build_object()` 确保格式正确

### 2. 性能优化

- 已创建索引优化 JSON 字段查询：
  ```sql
  CREATE INDEX idx_projects_name_i18n_en ON projects ((project_name_i18n->>'en'));
  CREATE INDEX idx_projects_name_i18n_zh ON projects ((project_name_i18n->>'zh'));
  CREATE INDEX idx_projects_name_i18n_ua ON projects ((project_name_i18n->>'ua'));
  ```

### 3. 添加新语言

如需添加新语言（例如俄语 'ru'）：

1. 更新类型定义：
   ```typescript
   // types/database.ts
   export type I18nText = {
     en?: string
     zh?: string
     ua?: string
     ru?: string  // 新增
   }
   ```

2. 更新辅助函数支持新语言（如需要）

3. 在数据库中添加翻译数据

### 4. 与现有系统兼容

- 原有代码继续使用 `project.project_name` 仍然有效
- 新代码推荐使用 `getProjectName()` 等辅助函数
- 数据库视图 `project_stats` 已更新包含 i18n 字段

---

## 🐛 故障排除 / Troubleshooting

### 问题：翻译不显示

**原因：** JSON 字段为空或格式错误

**解决：**
```sql
-- 检查 JSON 内容
SELECT project_name_i18n FROM projects WHERE id = 1;

-- 如果为空，添加数据
UPDATE projects
SET project_name_i18n = '{"en": "Your Project", "zh": "你的项目", "ua": "Ваш проєкт"}'
WHERE id = 1;
```

### 问题：TypeScript 类型错误

**原因：** 未更新类型定义

**解决：**
```bash
# 重新启动开发服务器
npm run dev
```

### 问题：回退到英文而不是原字段值

**说明：** 这是预期行为，函数会优先使用 i18n JSON 中的英文值

---

## 📚 相关文档 / Related Documentation

- [CLAUDE.md](../CLAUDE.md) - 项目技术文档
- [Supabase CLI Guide](./SUPABASE_CLI_GUIDE.md) - 数据库迁移指南
- [example_project_i18n_data.sql](../supabase/example_project_i18n_data.sql) - 示例数据

---

## 🎉 总结 / Summary

✅ **优点：**
- 简单易用，无需额外表
- 易于扩展新语言
- 良好的性能（已优化索引）
- 自动回退机制
- 与现有代码兼容

✅ **最佳实践：**
1. 始终提供英文翻译
2. 保持原字段和 i18n 字段同步
3. 使用辅助函数读取翻译
4. 定期检查缺失的翻译

---

**最后更新 / Last Updated:** 2025-12-19
**版本 / Version:** 1.0.0
