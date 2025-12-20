# 🚀 تعليمات تطبيق Migration يدوياً

نظراً لأن Supabase CLI غير مُهيأ محلياً، يرجى اتباع الخطوات التالية:

## الطريقة 1: عبر Supabase Dashboard (موصى بها)

1. افتح https://app.supabase.com
2. اختر مشروعك
3. اذهب إلى **SQL Editor** من القائمة الجانبية
4. افتح ملف `/supabase/migrations/20251219_create_sync_tables.sql`
5. انسخ المحتوى بالكامل والصقه في SQL Editor
6. اضغط **Run** أو `Ctrl+Enter`
7. تأكد من عدم ظهور أخطاء

## الطريقة 2: عبر Supabase CLI (إذا كنت تريد تثبيته)

```bash
# تثبيت Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Apply migration
supabase db push
```

## التحقق من نجاح Migration

بعد التطبيق، تحقق من وجود الجداول التالية في **Table Editor**:
- ✅ `locations`
- ✅ `tasks`
- ✅ `appointments`
- ✅ `finances`

تحقق أيضاً من **Policies** في كل جدول (يجب أن يكون هناك 4 policies لكل جدول).

---

**ملاحظة:** الملف موجود في:
`/Users/zaher/Downloads/barakah_life_management/supabase/migrations/20251219_create_sync_tables.sql`
