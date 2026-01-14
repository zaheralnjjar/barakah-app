#!/bin/bash
# دليل نشر التطبيق على Vercel

echo "🚀 دليل نشر التطبيق على Vercel"
echo "=================================="
echo ""

echo "الخطوة 1: تسجيل الدخول"
echo "----------------------"
echo "قم بتشغيل الأمر التالي وافتح الرابط الذي سيظهر:"
echo "vercel login"
echo ""

echo "الخطوة 2: ربط المشروع"
echo "---------------------"
echo "بعد تسجيل الدخول، قم بتشغيل:"
echo "vercel link"
echo ""

echo "الخطوة 3: إضافة متغيرات البيئة"
echo "----------------------------"
echo "أضف متغيرات Supabase:"
echo "vercel env add VITE_SUPABASE_URL"
echo "vercel env add VITE_SUPABASE_ANON_KEY"
echo ""

echo "الخطوة 4: النشر"
echo "---------------"
echo "للنشر على الإنتاج:"
echo "vercel --prod"
echo ""

echo "✅ بعد اكتمال النشر، ستحصل على رابط التطبيق!"
echo ""
echo "مثال: https://barakah-app.vercel.app"
