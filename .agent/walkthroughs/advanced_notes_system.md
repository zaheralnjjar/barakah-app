---
description: نظام الملاحظات المتطور مع المجلدات والتعديلات الذكية
---

# 📝 Walkthrough: نظام الملاحظات المتطور

## 🚀 آخر التحديثات (Dashboard & Sorting)
- **زر الملاحظات في اللوحة**: تم تعديل زر "ملاحظة" الأصفر في لوحة التحكم ليقوم بفتح مدير الملاحظات الكامل (عرض المجلدات) بدلاً من نافذة الإضافة السريعة.
- **الترتيب في المجلد العام**: تمت إضافة زر لتبديل الترتيب في المجلد "عام" بين (التاريخ 📅) و (المجلد 📂).



## 🎯 الهدف
تطوير نظام ملاحظات احترافي يشبه Google Keep مع ميزات متقدمة:
- 📂 نظام مجلدات هرمي مع أيقونات
- 📝 ملاحظات بعناوين وأجسام نصية
- 🎨 سجل تعديلات ملون مع عناوين مخصصة
- ✨ بحث سريع، تثبيت، وسوم، قفل
- 📤 تصدير PDF/TXT
- 🔊 تحويل النص لصوت
- 📸 OCR لتحويل الصور لنص
- 🤖 ملخص ذكي للملاحظات

---

## 📊 قاعدة البيانات

### 1. جدول `note_folders`
```sql
CREATE TABLE IF NOT EXISTS note_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#4ade80',
    icon TEXT DEFAULT 'folder',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_note_folders_user ON note_folders(user_id);
ALTER TABLE note_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own folders" ON note_folders
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 2. تحديث جدول `quick_notes`
```sql
-- إضافة أعمدة جديدة
ALTER TABLE quick_notes ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES note_folders(id) ON DELETE SET NULL;
ALTER TABLE quick_notes ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE quick_notes ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE quick_notes ADD COLUMN IF NOT EXISTS lock_pin TEXT;
ALTER TABLE quick_notes ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE quick_notes ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quick_notes_folder ON quick_notes(folder_id);
CREATE INDEX IF NOT EXISTS idx_quick_notes_pinned ON quick_notes(is_pinned);
CREATE INDEX IF NOT EXISTS idx_quick_notes_tags ON quick_notes USING GIN(tags);
```

### 3. جدول `note_revisions`
```sql
CREATE TABLE IF NOT EXISTS note_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES quick_notes(id) ON DELETE CASCADE,
    revision_title TEXT NOT NULL,
    content TEXT NOT NULL,
    revision_number INTEGER NOT NULL,
    color_code TEXT NOT NULL,
    changes_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_note_revisions_note ON note_revisions(note_id);
CREATE INDEX idx_note_revisions_created ON note_revisions(created_at DESC);

ALTER TABLE note_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own note revisions" ON note_revisions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quick_notes 
            WHERE quick_notes.id = note_revisions.note_id 
            AND quick_notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users insert own note revisions" ON note_revisions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM quick_notes 
            WHERE quick_notes.id = note_revisions.note_id 
            AND quick_notes.user_id = auth.uid()
        )
    );
```

### 4. Trigger لتحديث `updated_at`
```sql
CREATE OR REPLACE FUNCTION update_note_folders_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_note_folders_updated
    BEFORE UPDATE ON note_folders
    FOR EACH ROW
    EXECUTE FUNCTION update_note_folders_timestamp();
```

---

## 🎨 نظام الألوان للتعديلات

```typescript
const REVISION_COLORS = [
    { number: 0, color: '#10b981', emoji: '🟢', name: 'النسخة الأصلية' },
    { number: 1, color: '#3b82f6', emoji: '🔵', name: 'التعديل الأول' },
    { number: 2, color: '#eab308', emoji: '🟡', name: 'التعديل الثاني' },
    { number: 3, color: '#f97316', emoji: '🟠', name: 'التعديل الثالث' },
    { number: 4, color: '#ef4444', emoji: '🔴', name: 'التعديل الرابع' },
    { number: 5, color: '#8b5cf6', emoji: '🟣', name: 'التعديل الخامس' },
];

const getRevisionColor = (revisionNumber: number) => {
    if (revisionNumber >= REVISION_COLORS.length) {
        return REVISION_COLORS[REVISION_COLORS.length - 1];
    }
    return REVISION_COLORS[revisionNumber];
};
```

---

## 🏗️ البنية المقترحة

### 1. المكونات (Components)

#### `NotesManager.tsx` - المكون الرئيسي
```typescript
interface NotesManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

// الحالات:
- selectedFolder: string | null
- selectedNote: string | null
- viewMode: 'folders' | 'notes' | 'editor' | 'revisions'
- searchQuery: string
- showPinnedOnly: boolean
```

#### `FolderGrid.tsx` - عرض المجلدات كأيقونات
```typescript
// عرض المجلدات على شكل Grid مثل Finder في Mac
// كل مجلد يحتوي على:
- أيقونة ملونة
- اسم المجلد
- عدد الملاحظات
- قائمة سياق (تعديل، حذف، تغيير اللون)
```

#### `NoteCard.tsx` - بطاقة الملاحظة
```typescript
// عرض الملاحظة كبطاقة تحتوي على:
- العنوان
- معاينة المحتوى (100 حرف)
- الوسوم
- عدد التعديلات مع النقاط الملونة
- أيقونات (مثبت، مقفل)
- تاريخ آخر تحديث
```

#### `NoteEditor.tsx` - محرر الملاحظة
```typescript
// محرر نصي بسيط يحتوي على:
- حقل العنوان
- شريط أدوات التنسيق
- منطقة النص الرئيسية
- أزرار الحفظ والإلغاء
```

#### `RevisionTimeline.tsx` - سجل التعديلات
```typescript
// عرض تاريخ التعديلات بشكل Timeline:
- كل تعديل له عنوان مخصص
- نقطة ملونة حسب رقم التعديل
- التاريخ والوقت
- معاينة التغييرات
- زر لاستعادة النسخة
```

#### `NoteToolbar.tsx` - شريط الأدوات
```typescript
// أدوات التحرير:
- Bold, Italic, Underline
- Highlight
- Text Color
- Insert Link
- Attach File
- Add Tag
```

---

### 2. الـ Hooks

#### `useNoteFolders.ts`
```typescript
export const useNoteFolders = () => {
    const [folders, setFolders] = useState<NoteFolder[]>([]);
    
    // Functions:
    - fetchFolders()
    - createFolder(name, color, icon)
    - updateFolder(id, updates)
    - deleteFolder(id)
    - reorderFolders(newOrder)
    
    return { folders, ... };
};
```

#### `useNotes.ts` (تحديث الموجود)
```typescript
export const useNotes = (folderId?: string) => {
    const [notes, setNotes] = useState<Note[]>([]);
    
    // Functions:
    - fetchNotes(folderId)
    - createNote(title, content, folderId)
    - updateNote(id, updates)
    - deleteNote(id)
    - togglePin(id)
    - lockNote(id, pin)
    - unlockNote(id, pin)
    - addTag(noteId, tag)
    - removeTag(noteId, tag)
    - searchNotes(query)
    - exportNote(id, format: 'pdf' | 'txt')
    
    return { notes, ... };
};
```

#### `useNoteRevisions.ts`
```typescript
export const useNoteRevisions = (noteId: string) => {
    const [revisions, setRevisions] = useState<NoteRevision[]>([]);
    
    // Functions:
    - fetchRevisions(noteId)
    - createRevision(noteId, title, content, summary)
    - restoreRevision(revisionId)
    - deleteRevision(revisionId)
    
    return { revisions, ... };
};
```

---

## 🎨 واجهة المستخدم

### 1. شاشة المجلدات (Folder Grid)
```
┌──────────────────────────────────────────────────────┐
│  📝 الملاحظات                    [🔍] [➕ مجلد جديد] │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐│
│  │  📁     │  │  📁     │  │  📁     │  │  📁     ││
│  │ العمل   │  │ الدراسة │  │ شخصي   │  │ أفكار   ││
│  │ 12 ملاحظة│  │ 8 ملاحظات│  │ 15 ملاحظة│  │ 23 ملاحظة││
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘│
│                                                      │
│  ┌─────────┐  ┌─────────┐                          │
│  │  📁     │  │  ➕     │                          │
│  │ مهم     │  │ جديد   │                          │
│  │ 5 ملاحظات│  │        │                          │
│  └─────────┘  └─────────┘                          │
└──────────────────────────────────────────────────────┘
```

### 2. شاشة الملاحظات (Notes List)
```
┌──────────────────────────────────────────────────────┐
│  ← العمل                     [🔍] [📌] [➕ ملاحظة]   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  📌 ┌────────────────────────────────────────────┐  │
│     │ 📝 اجتماع الفريق              🔒 🏷️ عمل │  │
│     │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│     │ مناقشة خطة العمل للربع القادم...      │  │
│     │                                          │  │
│     │ 🟢🔵🟡 3 تعديلات | منذ ساعتين          │  │
│     └────────────────────────────────────────────┘  │
│                                                      │
│     ┌────────────────────────────────────────────┐  │
│     │ 📝 ملاحظات المشروع           🏷️ مشروع  │  │
│     │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│     │ قائمة المهام والأفكار...               │  │
│     │                                          │  │
│     │ 🟢🔵 2 تعديلات | منذ 3 أيام            │  │
│     └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 3. محرر الملاحظة (Note Editor)
```
┌──────────────────────────────────────────────────────┐
│  ← رجوع                              [💾] [👁️] [⋮]  │
├──────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐ │
│  │ عنوان الملاحظة                                │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  [B] [I] [U] [⚡] [🎨] [🔗] [📎] [🏷️]              │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │                                                │ │
│  │  محتوى الملاحظة هنا...                        │ │
│  │                                                │ │
│  │                                                │ │
│  │                                                │ │
│  │                                                │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  🏷️ وسوم: [عمل] [مهم] [+ إضافة]                  │
│  📎 مرفقات: لا توجد                                │
└──────────────────────────────────────────────────────┘
```

### 4. سجل التعديلات (Revision Timeline)
```
┌──────────────────────────────────────────────────────┐
│  ← اجتماع الفريق                    [استعادة] [⋮]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  🟢 النسخة الأصلية: "خطة البداية"                  │
│  📅 22 يناير 2026 - 10:00 صباحاً                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  مناقشة خطة العمل للربع القادم...                  │
│                                                      │
│  🔵 تحديث الأهداف                                   │
│  📅 22 يناير 2026 - 02:30 مساءً                     │
│  ✏️ أضفت: 3 أهداف جديدة للفريق                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  مناقشة خطة العمل + الأهداف الجديدة...             │
│                                                      │
│  🟡 تعديل التواريخ                                  │
│  📅 23 يناير 2026 - 09:15 صباحاً                    │
│  ✏️ عدلت: تواريخ التسليم                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  مناقشة خطة العمل + الأهداف + التواريخ المحدثة...  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 🔧 الميزات المتقدمة

### 1. البحث السريع
```typescript
const searchNotes = async (query: string) => {
    // البحث في:
    // - عناوين الملاحظات
    // - محتوى الملاحظات
    // - الوسوم
    // - أسماء المجلدات
    
    const { data } = await supabase
        .from('quick_notes')
        .select('*, note_folders(*)')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('updated_at', { ascending: false });
    
    return data;
};
```

### 2. قفل الملاحظة
```typescript
const lockNote = async (noteId: string, pin: string) => {
    // تشفير الـ PIN
    const hashedPin = await bcrypt.hash(pin, 10);
    
    await supabase
        .from('quick_notes')
        .update({ is_locked: true, lock_pin: hashedPin })
        .eq('id', noteId);
};

const unlockNote = async (noteId: string, pin: string) => {
    const { data } = await supabase
        .from('quick_notes')
        .select('lock_pin')
        .eq('id', noteId)
        .single();
    
    const isValid = await bcrypt.compare(pin, data.lock_pin);
    if (!isValid) throw new Error('رقم سري خاطئ');
    
    return true;
};
```

### 3. تصدير الملاحظة
```typescript
const exportNoteToPDF = async (noteId: string) => {
    const note = await fetchNote(noteId);
    
    // استخدام jsPDF
    const doc = new jsPDF();
    doc.setFont('Amiri'); // خط عربي
    doc.text(note.title, 20, 20);
    doc.text(note.content, 20, 40);
    doc.save(`${note.title}.pdf`);
};

const exportNoteToTXT = async (noteId: string) => {
    const note = await fetchNote(noteId);
    const content = `${note.title}\n\n${note.content}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title}.txt`;
    a.click();
};
```

### 4. تحويل النص لصوت (Text-to-Speech)
```typescript
const speakNote = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
};
```

### 5. OCR - تحويل الصورة لنص
```typescript
import Tesseract from 'tesseract.js';

const extractTextFromImage = async (imageFile: File) => {
    const { data: { text } } = await Tesseract.recognize(
        imageFile,
        'ara', // Arabic language
        {
            logger: m => console.log(m)
        }
    );
    
    return text;
};
```

### 6. الملخص الذكي
```typescript
const generateSmartSummary = (content: string) => {
    // خوارزمية بسيطة للملخص:
    // 1. تقسيم النص لجمل
    // 2. اختيار أول 3 جمل
    // 3. أو أول 200 حرف
    
    const sentences = content.split(/[.!?]/);
    const summary = sentences.slice(0, 3).join('. ');
    
    return summary.length > 200 
        ? summary.substring(0, 200) + '...' 
        : summary;
};
```

---

## 📦 التبعيات المطلوبة

```json
{
    "dependencies": {
        "jspdf": "^2.5.1",
        "tesseract.js": "^5.0.0",
        "bcryptjs": "^2.4.3",
        "react-quill": "^2.0.0",
        "lucide-react": "latest"
    }
}
```

---

## 🚀 خطة التنفيذ

### المرحلة 1: قاعدة البيانات (30 دقيقة)
1. إنشاء جدول `note_folders`
2. تحديث جدول `quick_notes`
3. إنشاء جدول `note_revisions`
4. إضافة Triggers و Policies

### المرحلة 2: الـ Hooks (1 ساعة)
1. تحديث `useQuickNotes.ts`
2. إنشاء `useNoteFolders.ts`
3. إنشاء `useNoteRevisions.ts`

### المرحلة 3: المكونات الأساسية (2 ساعة)
1. `FolderGrid.tsx`
2. `NoteCard.tsx`
3. `NoteEditor.tsx`
4. `RevisionTimeline.tsx`

### المرحلة 4: الميزات المتقدمة (1.5 ساعة)
1. البحث السريع
2. القفل والتثبيت
3. الوسوم
4. التصدير

### المرحلة 5: الميزات الإضافية (1 ساعة)
1. Text-to-Speech
2. OCR
3. الملخص الذكي

### المرحلة 6: الاختبار والتحسين (30 دقيقة)
1. اختبار جميع الميزات
2. تحسين الأداء
3. إصلاح الأخطاء

---

## ✅ معايير النجاح

- ✅ إنشاء وإدارة المجلدات بسهولة
- ✅ إنشاء ملاحظات مع عناوين وأجسام
- ✅ سجل تعديلات ملون مع عناوين مخصصة
- ✅ بحث سريع يعمل بكفاءة
- ✅ تثبيت وقفل الملاحظات
- ✅ نظام وسوم فعال
- ✅ تصدير PDF/TXT يعمل
- ✅ Text-to-Speech للنصوص العربية
- ✅ OCR لتحويل الصور
- ✅ ملخص ذكي للملاحظات الطويلة

---

## 📝 ملاحظات إضافية

1. **الأداء**: استخدام Virtualization لقوائم الملاحظات الطويلة
2. **التزامن**: Realtime subscriptions لتحديثات فورية
3. **الأمان**: تشفير الملاحظات المقفلة
4. **UX**: Drag & Drop لنقل الملاحظات بين المجلدات
5. **Mobile**: واجهة متجاوبة تعمل على الهاتف

---

**⏳ جاهز للبدء بالتنفيذ عند الموافقة!**
