-- =============================================================================================================
-- Example: Adding i18n translations to projects
-- =============================================================================================================
-- This file shows examples of how to add translations to your projects
-- Copy and modify these examples for your actual projects
-- =============================================================================================================

-- =============================================
-- Example 1: Update existing project with translations
-- =============================================

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
    ),
    description_i18n = jsonb_build_object(
        'en', 'Providing clean water access to communities in need through sustainable filtration systems.',
        'zh', '通过可持续的过滤系统为有需要的社区提供清洁水源。',
        'ua', 'Забезпечення доступу до чистої води для громад, які потребують, через сталі системи фільтрації.'
    )
WHERE project_name = 'Clean Water Initiative';

-- =============================================
-- Example 2: Insert new project with translations
-- =============================================

INSERT INTO public.projects (
    project_name,
    project_name_i18n,
    location,
    location_i18n,
    start_date,
    end_date,
    is_long_term,
    target_units,
    unit_name,
    unit_name_i18n,
    unit_price,
    status,
    description_i18n
) VALUES (
    'Emergency Medical Kits',
    jsonb_build_object(
        'en', 'Emergency Medical Kits',
        'zh', '紧急医疗包',
        'ua', 'Екстрені медичні набори'
    ),
    'Eastern Ukraine',
    jsonb_build_object(
        'en', 'Eastern Ukraine',
        'zh', '乌克兰东部',
        'ua', 'Східна Україна'
    ),
    '2025-01-01',
    '2025-12-31',
    false,
    500,
    'medical kit',
    jsonb_build_object(
        'en', 'medical kit',
        'zh', '医疗包',
        'ua', 'медичний набір'
    ),
    50.00,
    'active',
    jsonb_build_object(
        'en', 'Distributing essential medical supplies to frontline communities.',
        'zh', '向前线社区分发必要的医疗用品。',
        'ua', 'Розподіл необхідних медичних засобів для громад на передовій.'
    )
);

-- =============================================
-- Example 3: Bulk update multiple projects
-- =============================================

-- Update multiple projects at once
WITH translation_data AS (
    SELECT
        'Food Packages' AS project_name,
        jsonb_build_object('en', 'Food Packages', 'zh', '食品包', 'ua', 'Продуктові пакети') AS name_i18n,
        jsonb_build_object('en', 'Kyiv Region', 'zh', '基辅地区', 'ua', 'Київська область') AS location_i18n,
        jsonb_build_object('en', 'food package', 'zh', '食品包', 'ua', 'продуктовий пакет') AS unit_i18n
    UNION ALL
    SELECT
        'Winter Clothing',
        jsonb_build_object('en', 'Winter Clothing', 'zh', '冬季衣物', 'ua', 'Зимовий одяг'),
        jsonb_build_object('en', 'Kharkiv', 'zh', '哈尔科夫', 'ua', 'Харків'),
        jsonb_build_object('en', 'clothing set', 'zh', '衣物套装', 'ua', 'комплект одягу')
)
UPDATE public.projects p
SET
    project_name_i18n = t.name_i18n,
    location_i18n = t.location_i18n,
    unit_name_i18n = t.unit_i18n
FROM translation_data t
WHERE p.project_name = t.project_name;

-- =============================================
-- Example 4: Add translation for single field only
-- =============================================

-- Only update project name translations, keep others unchanged
UPDATE public.projects
SET project_name_i18n = jsonb_build_object(
    'en', 'Shelter Reconstruction',
    'zh', '住所重建',
    'ua', 'Реконструкція житла'
)
WHERE project_name = 'Shelter Reconstruction';

-- =============================================
-- Example 5: Query to verify translations
-- =============================================

-- Check all projects with their translations
SELECT
    id,
    project_name,
    project_name_i18n,
    location,
    location_i18n,
    unit_name,
    unit_name_i18n
FROM public.projects
ORDER BY id;

-- =============================================
-- Example 6: Test translation function
-- =============================================

-- Get project name in different languages
SELECT
    id,
    project_name AS original,
    get_translated_text(project_name_i18n, project_name, 'en') AS english,
    get_translated_text(project_name_i18n, project_name, 'zh') AS chinese,
    get_translated_text(project_name_i18n, project_name, 'ua') AS ukrainian
FROM public.projects
LIMIT 5;

-- =============================================
-- Common Translation Patterns
-- =============================================

/*
Unit Names (English → Chinese → Ukrainian):
- kit → 套件 → комплект
- package → 包裹 → пакет
- filter → 过滤器 → фільтр
- meal → 餐 → прийом їжі
- blanket → 毯子 → ковдра
- set → 套装 → набір
- item → 项目 → предмет

Location Names:
- Kyiv → 基辅 → Київ
- Ukraine → 乌克兰 → Україна
- Eastern Ukraine → 乌克兰东部 → Східна Україна
- Western Ukraine → 乌克兰西部 → Західна Україна
- Rural Areas → 农村地区 → Сільські райони

Common Project Types:
- Emergency Aid → 紧急援助 → Екстрена допомога
- Medical Support → 医疗支持 → Медична підтримка
- Food Distribution → 食品分发 → Роздача їжі
- Shelter Program → 住所项目 → Програма притулку
- Education Initiative → 教育计划 → Освітня ініціатива
*/
