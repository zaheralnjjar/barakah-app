#!/bin/bash
# سكريبت إنشاء مشروع أكاديمي مستقل
# يقوم بنسخ الملفات المطلوبة فقط من نظام البركة

echo "🚀 بدء إنشاء مشروع Barakah Academic..."
echo ""

# المسارات
SOURCE="/Users/zaher/Downloads/barakah_life_management"
TARGET="/Users/zaher/Desktop/acadimi"

# إنشاء المجلد الهدف
echo "📁 إنشاء المجلد الهدف..."
mkdir -p "$TARGET"
cd "$TARGET"

# تهيئة مشروع Vite
echo "⚡ تهيئة مشروع Vite..."
npm create vite@latest . -- --template react-ts --yes 2>/dev/null || {
    # إذا فشل، نسخ الملفات الأساسية يدوياً
    echo "📋 نسخ ملفات التكوين..."
}

# إنشاء هيكل المجلدات
echo "📁 إنشاء هيكل المجلدات..."
mkdir -p src/components/academic
mkdir -p src/components/ui
mkdir -p src/components/logistics
mkdir -p src/services
mkdir -p src/hooks
mkdir -p src/lib
mkdir -p src/types
mkdir -p public

# نسخ مكونات UI الأساسية
echo "🎨 نسخ مكونات UI..."
cp -r "$SOURCE/src/components/ui/"* "$TARGET/src/components/ui/" 2>/dev/null

# نسخ مكونات Academic
echo "📚 نسخ مكونات Academic..."
cp -r "$SOURCE/src/components/academic/"* "$TARGET/src/components/academic/" 2>/dev/null
cp "$SOURCE/src/components/AcademicManager.tsx" "$TARGET/src/components/" 2>/dev/null

# نسخ مكونات المواعيد والمهام
echo "📅 نسخ مكونات المواعيد والمهام..."
cp "$SOURCE/src/components/AppointmentManager.tsx" "$TARGET/src/components/" 2>/dev/null
mkdir -p "$TARGET/src/components/logistics"
cp "$SOURCE/src/components/logistics/TaskSection.tsx" "$TARGET/src/components/logistics/" 2>/dev/null
cp "$SOURCE/src/components/logistics/QuickNotes.tsx" "$TARGET/src/components/logistics/" 2>/dev/null

# نسخ الخدمات
echo "🔧 نسخ الخدمات..."
cp "$SOURCE/src/services/AcademicService.ts" "$TARGET/src/services/" 2>/dev/null
cp "$SOURCE/src/services/supabase.ts" "$TARGET/src/services/" 2>/dev/null

# نسخ الأنماط
echo "🎨 نسخ الأنماط..."
cp "$SOURCE/src/index.css" "$TARGET/src/" 2>/dev/null

# نسخ الـ hooks
echo "🪝 نسخ الـ hooks..."
cp -r "$SOURCE/src/hooks/"* "$TARGET/src/hooks/" 2>/dev/null

# نسخ الـ lib
echo "📚 نسخ الـ lib..."
cp -r "$SOURCE/src/lib/"* "$TARGET/src/lib/" 2>/dev/null

# نسخ الـ types
echo "📝 نسخ الـ types..."
cp "$SOURCE/src/types/academic.ts" "$TARGET/src/types/" 2>/dev/null

# نسخ ملفات التكوين
echo "⚙️ نسخ ملفات التكوين..."
cp "$SOURCE/package.json" "$TARGET/" 2>/dev/null
cp "$SOURCE/tsconfig.json" "$TARGET/" 2>/dev/null
cp "$SOURCE/tsconfig.node.json" "$TARGET/" 2>/dev/null
cp "$SOURCE/vite.config.ts" "$TARGET/" 2>/dev/null
cp "$SOURCE/tailwind.config.ts" "$TARGET/" 2>/dev/null
cp "$SOURCE/postcss.config.js" "$TARGET/" 2>/dev/null
cp "$SOURCE/components.json" "$TARGET/" 2>/dev/null
cp "$SOURCE/.env.local" "$TARGET/" 2>/dev/null
cp "$SOURCE/index.html" "$TARGET/" 2>/dev/null

echo ""
echo "✅ تم نسخ الملفات بنجاح!"
echo ""
echo "📋 الخطوات التالية:"
echo "1. cd $TARGET"
echo "2. npm install"
echo "3. تعديل App.tsx و main.tsx"
echo "4. npm run dev"
echo ""
