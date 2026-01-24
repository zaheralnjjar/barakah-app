-- 1. تمكين RLS للجداول إذا لم تكن مفعلة
ALTER TABLE quick_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE buckets ENABLE ROW LEVEL SECURITY;

-- 2. حذف السياسات القديمة لتجنب التعارض
DROP POLICY IF EXISTS "Users can manage their own notes" ON quick_notes;
DROP POLICY IF EXISTS "Users can manage their own buckets" ON buckets;
DROP POLICY IF EXISTS "Users can view their own notes" ON quick_notes;
DROP POLICY IF EXISTS "Users can insert their own notes" ON quick_notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON quick_notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON quick_notes;

-- 3. إنشاء سياسة شاملة للملاحظات (Quick Notes)
-- تسمح للمستخدم المسجل بالقيام بكل العمليات على ملاحظاته فقط
CREATE POLICY "Users can manage their own notes" 
ON quick_notes 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 4. إنشاء سياسة شاملة للحاويات (Buckets)
-- تسمح للمستخدم المسجل بالقيام بكل العمليات على تصنيفاته فقط
CREATE POLICY "Users can manage their own buckets" 
ON buckets 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 5. التأكد من منح الصلاحيات الأساسية للمستخدمين المسجلين
GRANT ALL ON quick_notes TO authenticated;
GRANT ALL ON buckets TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
