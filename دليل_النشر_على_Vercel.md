# 🚀 دليل النشر على Vercel

## الطريقة الموصى بها: عبر واجهة Vercel (الأسهل)

### الخطوات:

#### 1. افتح Vercel
- اذهب إلى: **https://vercel.com**
- سجل دخول بحسابك (GitHub/GitLab/Bitbucket)

#### 2. استيراد المشروع
1. انقر على **"Add New Project"**
2. اختر **"Import Git Repository"**
3. ابحث عن مستودع `barakah-app` أو `barakah_life_management`
4. انقر على **"Import"**

#### 3. إعدادات المشروع (تلقائية)

Vercel سيكتشف تلقائياً أن المشروع Vite:

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Root Directory: ./
```

**لا تغير هذه الإعدادات!** ✅

#### 4. متغيرات البيئة (مهم جداً!) 🔑

في قسم **"Environment Variables"**، أضف:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `your-anon-key-here` |

**كيف تحصل على هذه القيم؟**
1. افتح مشروع Supabase
2. اذهب إلى: **Settings** → **API**
3. انسخ:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

#### 5. النشر 🚀

1. انقر على **"Deploy"**
2. انتظر 2-3 دقائق
3. ستحصل على رابط مثل: `https://barakah-app.vercel.app`

---

## الطريقة البديلة: عبر سطر الأوامر (CLI)

### المتطلبات:
- Vercel CLI مثبت ✅ (موجود عندك)
- تسجيل دخول نشط

### الخطوات:

#### 1. تسجيل الدخول
```bash
vercel login
```
- سيفتح متصفح
- سجل دخول بحسابك
- ارجع للطرفية

#### 2. ربط المشروع (أول مرة فقط)
```bash
cd /Users/zaher/Downloads/barakah_life_management
vercel link
```

اختر:
- **Scope**: حسابك الشخصي
- **Link to existing project?**: No (إذا كان مشروع جديد)
- **Project name**: barakah-app
- **Directory**: `./`

#### 3. إضافة متغيرات البيئة
```bash
# إضافة SUPABASE_URL
vercel env add VITE_SUPABASE_URL production

# إضافة SUPABASE_ANON_KEY
vercel env add VITE_SUPABASE_ANON_KEY production
```

عند كل أمر، أدخل القيمة المناسبة.

#### 4. النشر على الإنتاج
```bash
vercel --prod
```

انتظر حتى يكتمل البناء والنشر.

#### 5. الحصول على الرابط
بعد النشر الناجح، ستحصل على:
```
✅ Production: https://barakah-app.vercel.app
```

---

## ⚠️ ملاحظات مهمة

### 1. ملف `.env` المحلي
تأكد من وجود ملف `.env.local` في المشروع:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. ملف `.gitignore`
تأكد من أن `.env.local` موجود في `.gitignore`:
```
.env.local
.env*.local
```

### 3. إعدادات Supabase
تأكد من:
- ✅ RLS مفعّل على جميع الجداول
- ✅ Policies صحيحة
- ✅ CORS مفعّل لنطاق Vercel

### 4. التحديثات المستقبلية
بعد أي تعديل:
```bash
git add .
git commit -m "تحديث"
git push
```

Vercel سيعيد النشر تلقائياً! 🎉

---

## 🔍 استكشاف الأخطاء

### خطأ: "Build failed"
**الحل**:
1. تحقق من أن `npm run build` يعمل محلياً
2. تحقق من متغيرات البيئة في Vercel

### خطأ: "Supabase connection failed"
**الحل**:
1. تحقق من صحة `VITE_SUPABASE_URL`
2. تحقق من صحة `VITE_SUPABASE_ANON_KEY`
3. تحقق من CORS في Supabase

### خطأ: "404 Not Found"
**الحل**:
1. تأكد من أن `Output Directory` هو `dist`
2. تأكد من وجود ملف `dist/index.html` بعد البناء

---

## 📊 بعد النشر

### 1. اختبر التطبيق
- افتح الرابط
- جرب جميع الميزات
- تحقق من استيراد Word
- تحقق من الكتابة بالعربية

### 2. إعدادات النطاق (اختياري)
إذا أردت نطاق مخصص:
1. اذهب إلى **Settings** → **Domains**
2. أضف نطاقك
3. اتبع التعليمات

### 3. المراقبة
- **Analytics**: تابع الزيارات
- **Logs**: راقب الأخطاء
- **Performance**: تحقق من السرعة

---

## ✅ قائمة التحقق النهائية

قبل النشر، تأكد من:
- [ ] البناء ناجح محلياً (`npm run build`)
- [ ] متغيرات البيئة صحيحة
- [ ] Git محدّث (`git push`)
- [ ] Supabase يعمل
- [ ] RLS مفعّل

بعد النشر، تأكد من:
- [ ] التطبيق يفتح
- [ ] تسجيل الدخول يعمل
- [ ] قاعدة البيانات متصلة
- [ ] استيراد Word يعمل
- [ ] الكتابة بالعربية صحيحة

---

## 🎉 تهانينا!

إذا اتبعت الخطوات، تطبيقك الآن **منشور على الإنترنت**!

شارك الرابط مع الآخرين: `https://barakah-app.vercel.app`

---

**آخر تحديث**: 14 يناير 2026  
**الحالة**: جاهز للنشر ✅
