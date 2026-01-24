-- Seed 10 Default Notes
INSERT INTO quick_notes (user_id, title, content, bucket, is_pinned, is_locked)
SELECT 
    auth.uid(), 
    'مرحباً بك في نظام الملاحظات', 
    'هذه ملاحظة ترحيبية في صندوق الوارد. يمكنك نقلها أو حذفها.', 
    'inbox', 
    true, 
    false
FROM auth.users LIMIT 1;

INSERT INTO quick_notes (user_id, title, content, bucket, is_pinned, is_locked)
SELECT auth.uid(), 'فكرة مشروع جديد', 'دراسة جدوى لتطبيق إدارة المهام...', 'projects', false, false FROM auth.users LIMIT 1;

INSERT INTO quick_notes (user_id, title, content, bucket, is_pinned, is_locked)
SELECT auth.uid(), 'قائمة التسوق', '- حليب\n- خبز\n- فواكه', 'personal', false, false FROM auth.users LIMIT 1;

INSERT INTO quick_notes (user_id, title, content, bucket, is_pinned, is_locked)
SELECT auth.uid(), 'ملاحظات الاجتماع', 'مناقشة الخطة الربع سنوية...\n- النقطة الأولى\n- النقطة الثانية', 'work', false, false FROM auth.users LIMIT 1;

INSERT INTO quick_notes (user_id, title, content, bucket, is_pinned, is_locked)
SELECT auth.uid(), 'كود مهم', 'git commit -m "update"', 'projects', false, false FROM auth.users LIMIT 1;

INSERT INTO quick_notes (user_id, title, content, bucket, is_pinned, is_locked)
SELECT auth.uid(), 'تذكير', 'موعد طبيب الأسنان يوم الثلاثاء', 'personal', true, false FROM auth.users LIMIT 1;

INSERT INTO quick_notes (user_id, title, content, bucket, is_pinned, is_locked)
SELECT auth.uid(), 'مسودة بريد إلكتروني', 'عزيزي المدير،\nأود إعلامكم بأنني...', 'work', false, false FROM auth.users LIMIT 1;

INSERT INTO quick_notes (user_id, title, content, bucket, is_pinned, is_locked)
SELECT auth.uid(), 'فكرة عشوائية', 'لماذا السماء زرقاء؟', 'inbox', false, false FROM auth.users LIMIT 1;

INSERT INTO quick_notes (user_id, title, content, bucket, is_pinned, is_locked)
SELECT auth.uid(), 'خطة السفر', 'حجز التذاكر، الفندق، تجهيز الحقائب', 'personal', false, false FROM auth.users LIMIT 1;

INSERT INTO quick_notes (user_id, title, content, bucket, is_pinned, is_locked)
SELECT auth.uid(), 'مهام اليوم', '- مراجعة الكود\n- إرسال التقرير', 'work', false, false FROM auth.users LIMIT 1;
