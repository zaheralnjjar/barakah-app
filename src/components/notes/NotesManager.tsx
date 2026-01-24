/**
 * NotesManager - إدارة الملاحظات (نظام الحاويات)
 * إصدار جديد نظيف ومبسط - خالٍ من المجلدات
 */

import React, { useState, useMemo } from 'react';
import { Search, ArrowLeft, Lock, Unlock, X, Plus, RefreshCw, Menu, Columns, Home } from 'lucide-react';
import { useQuickNotes } from '@/hooks/useQuickNotes';
import { supabase } from '@/integrations/supabase/client';
import { useNoteRevisions } from '@/hooks/useNoteRevisions';
import { useBuckets } from '@/hooks/useBuckets'; // Imported
import { NoteCard } from './NoteCard';
import { NoteEditor } from './NoteEditor';
import { RevisionTimeline } from './RevisionTimeline';
import { NoteSidebar } from './NoteSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type ViewMode = 'list' | 'editor' | 'revisions';

interface NotesManagerProps {
    onClose?: () => void;
}

export const NotesManager: React.FC<NotesManagerProps> = ({ onClose }) => {
    const { toast } = useToast();

    // ═══════════════════════════════════════════════════════════════
    // الحالات
    // ═══════════════════════════════════════════════════════════════
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [activeBucket, setActiveBucket] = useState<string>('inbox');
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showLockDialog, setShowLockDialog] = useState(false);
    const [lockPin, setLockPin] = useState('');
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);

    // New Features States
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [showSplitView, setShowSplitView] = useState(false);
    const [splitBuckets, setSplitBuckets] = useState<string[]>(['inbox', 'personal', 'work']); // Default 3 columns

    // Delete Alert State
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null);



    // ═══════════════════════════════════════════════════════════════
    // الـ Hooks
    // ═══════════════════════════════════════════════════════════════
    const {
        notesHistory,
        loading: notesLoading,
        addNote,
        updateNoteById,
        updateNoteBucket,
        deleteNoteById,
        searchNotes,
        lockNote,
        unlockNote,
        refresh: refreshNotes
    } = useQuickNotes();

    const { buckets, addBucket, deleteBucket, iconMap } = useBuckets(); // Use hook here
    const { revisions, createRevision, restoreRevision } = useNoteRevisions(selectedNoteId || undefined);

    // ═══════════════════════════════════════════════════════════════
    // البيانات المحسوبة
    // ═══════════════════════════════════════════════════════════════

    // استخراج جميع الوسوم الفريدة
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        notesHistory.forEach(note => {
            note.tags?.forEach(tag => tags.add(tag));
        });
        return Array.from(tags).sort();
    }, [notesHistory]);

    // حساب عدد الملاحظات في كل حاوية
    const bucketCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        buckets.forEach(b => counts[b.id] = 0); // Use dynamic buckets

        notesHistory.forEach(note => {
            const bucket = note.bucket || 'inbox';
            // Only count if bucket exists (or fallback to inbox/others if needed)
            if (counts[bucket] !== undefined) {
                counts[bucket]++;
            } else if (counts['inbox'] !== undefined) {
                // Counts for deleted buckets could go to inbox or ignored
            }
        });
        return counts;
    }, [notesHistory, buckets]);

    // دالة مساعدة لجلب ملاحظات حاوية معينة (مع تطبيق الفلتر)
    const getNotesForBucket = (bucketId: string) => {
        return notesHistory.filter(n => {
            const matchesBucket = (n.bucket || 'inbox') === bucketId;
            const matchesTag = selectedTag ? n.tags?.includes(selectedTag) : true;
            const matchesSearch = searchQuery.trim().length > 0
                ? (n.title?.toLowerCase().includes(searchQuery.toLowerCase()) || n.content?.toLowerCase().includes(searchQuery.toLowerCase()))
                : true;

            return matchesBucket && matchesTag && matchesSearch;
        });
    };

    // القائمة الرئيسية المعروضة (للعرض الفردي)
    const displayNotes = useMemo(() => {
        // إذا كان هناك بحث عالمي، تجاهل الحاوية (اختياري، لكن المستخدم قد يفضل البحث داخل الحاوية)
        // سنبقي البحث داخل الحاوية + الوسم للتناسق، أو بحث شامل إذا رغبنا.
        // هنا سنطبق المنطق: البحث يطبق على السياق الحالي.
        return getNotesForBucket(activeBucket);
    }, [activeBucket, selectedTag, searchQuery, notesHistory]);

    const selectedNote = notesHistory.find(n => n.id === selectedNoteId);

    // ═══════════════════════════════════════════════════════════════
    // معالجات الأحداث
    // ═══════════════════════════════════════════════════════════════
    const handleBucketSelect = (bucketId: string) => {
        setActiveBucket(bucketId);
        setViewMode('list');
        setSearchQuery('');
        setShowMobileSidebar(false);
    };

    const handleNoteClick = async (noteId: string) => {
        console.log('[NotesManager] النقر على الملاحظة:', noteId);
        const note = notesHistory.find(n => n.id === noteId);
        if (!note) return;

        if (note.isSecure) {
            setSelectedNoteId(noteId);
            setShowLockDialog(true);
        } else {
            setSelectedNoteId(noteId);
            setViewMode('editor');
        }
    };

    const handleUnlock = async () => {
        if (!selectedNoteId) return;
        const success = await unlockNote(selectedNoteId, lockPin);
        if (success) {
            setShowLockDialog(false);
            setLockPin('');
            setViewMode('editor');
        }
    };

    const handleSaveNote = async (title: string, content: string, tags: string[], bucket: string) => {
        console.log('[NotesManager] حفظ الملاحظة:', { title, selectedNoteId, bucket });

        try {
            if (selectedNoteId) {
                // تحديث ملاحظة موجودة
                await updateNoteById(selectedNoteId, { title, content, tags, bucket });
                // إضافة سجل تعديل إذا كان هناك تغيير جوهري
                if (title || content) {
                    await createRevision(selectedNoteId, title || 'تعديل', content, 'تم التحديث');
                }
            } else {
                // إنشاء ملاحظة جديدة
                console.log('[NotesManager] إنشاء جديد في الحاوية:', bucket);

                // نمرر الحاوية المختارة
                const newNote = await addNote(
                    content,           // content
                    'quick',           // type
                    title,             // title
                    false,             // isSecure
                    bucket             // bucket
                );

                if (newNote) {
                    toast({ title: 'تم الحفظ بنجاح ✅' });
                }
            }

            // العودة للعرض السابق
            setViewMode('list');
            setSelectedNoteId(null);

        } catch (error) {
            console.error('[NotesManager] خطأ في الحفظ:', error);
            toast({
                title: 'حدث خطأ أثناء الحفظ ❌',
                description: 'يرجى المحاولة مرة أخرى',
                variant: 'destructive'
            });
        }
    };

    const handleDeleteRequest = async (noteId: string) => {
        console.log('[NotesManager] طلب حذف ملاحظة (UI):', noteId);
        setNoteToDelete(noteId);
        setDeleteAlertOpen(true);
    };

    const confirmDelete = async () => {
        if (!noteToDelete) return;

        console.log('[NotesManager] تنفيذ الحذف الفعلي:', noteToDelete);
        try {
            await deleteNoteById(noteToDelete);

            // ✅ Fix: Force UI to return to list if we deleted the currently open note
            // Checking exact match.
            if (viewMode === 'editor' && selectedNoteId === noteToDelete) {
                setViewMode('list');
                setSelectedNoteId(null);
            }

        } catch (error) {
            console.error('[NotesManager] فشل الحذف:', error);
        } finally {
            setDeleteAlertOpen(false);
            setNoteToDelete(null);
        }
    };


    // ══════════════════════════════════════════════════════

    // const confirmDeleteNote = async () => { // Removed
    //     if (noteToDelete) {
    //         console.log('[NotesManager] تأكيد حذف ملاحظة:', noteToDelete);

    //         // 1. أغلق الحوار أولاً لتجنب تجميد الواجهة إذا تأخر الحذف
    //         const idToDelete = noteToDelete;
    //         setShowDeleteAlert(false);
    //         setNoteToDelete(null);

    //         // 2. نفذ الحذف في الخلفية
    //         try {
    //             await deleteNoteById(idToDelete);
    //         } catch (error) {
    //             console.error('Delete failed async', error);
    //         }
    //     }
    // };

    const handleMoveNote = async (noteId: string, targetBucketId: string) => {
        console.log('[NotesManager] نقل ملاحظة:', noteId, 'إلى', targetBucketId);
        await updateNoteBucket(noteId, targetBucketId);
        toast({ title: 'تم نقل الملاحظة ✅' });
    };

    const handleDragStart = (e: React.DragEvent, noteId: string) => {
        e.dataTransfer.setData('text/plain', noteId);
    };

    const handleDropOnBucket = async (e: React.DragEvent, bucketId: string) => {
        e.preventDefault();
        const noteId = e.dataTransfer.getData('text/plain');
        if (noteId) {
            await handleMoveNote(noteId, bucketId);
        }
    };

    const handleBack = () => {
        if (viewMode === 'revisions') {
            setViewMode('editor');
        } else if (viewMode === 'editor') {
            setViewMode('list');
            setSelectedNoteId(null);
        }
    };

    const currentBucketInfo = buckets.find(b => b.id === activeBucket);

    // ═══════════════════════════════════════════════════════════════
    // العرض
    // ═══════════════════════════════════════════════════════════════
    return (
        <div className="h-screen flex bg-gray-50 overflow-hidden text-right" dir="rtl">

            {/* الشريط الجانبي (سطح المكتب) */}
            <div className="hidden md:block h-full">
                <NoteSidebar
                    activeBucket={activeBucket}
                    onSelectBucket={handleBucketSelect}
                    counts={bucketCounts}
                    tags={allTags}
                    selectedTag={selectedTag}
                    onSelectTag={setSelectedTag}
                    buckets={buckets}
                    addBucket={addBucket}
                    deleteBucket={deleteBucket}
                    iconMap={iconMap}
                    onDropNote={handleMoveNote}
                    onGoHome={onClose}
                />
            </div>

            {/* الشريط الجانبي (موبايل) */}
            {showMobileSidebar && (
                <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setShowMobileSidebar(false)}>
                    <div className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-xl" onClick={e => e.stopPropagation()}>
                        <NoteSidebar
                            activeBucket={activeBucket}
                            onSelectBucket={handleBucketSelect}
                            counts={bucketCounts}
                            tags={allTags}
                            selectedTag={selectedTag}
                            onSelectTag={setSelectedTag}
                            buckets={buckets}
                            addBucket={addBucket}
                            deleteBucket={deleteBucket}
                            iconMap={iconMap}
                            onDropNote={handleMoveNote}
                            onGoHome={onClose}
                        />
                    </div>
                </div>
            )}

            {/* المحتوى الرئيسي */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">

                {/* الرأس */}
                <div className="bg-white border-b px-4 py-3 shadow-sm flex items-center gap-3">

                    {/* زر القائمة (موبايل) */}
                    <button
                        onClick={() => setShowMobileSidebar(true)}
                        className="p-2 md:hidden text-gray-500 hover:bg-gray-100 rounded-lg"
                    >
                        <Menu className="w-5 h-5" />
                    </button>





                    <h1 className="text-xl font-bold text-gray-800 flex-1 flex items-center gap-2">
                        {viewMode === 'list' && (
                            <>
                                {currentBucketInfo && (() => {
                                    const HeaderIcon = iconMap[currentBucketInfo.icon_name] || iconMap['Star'];
                                    return <HeaderIcon className="w-5 h-5" />;
                                })()}
                                {currentBucketInfo?.label || 'الملاحظات'}
                            </>
                        )}
                        {viewMode === 'editor' && (selectedNote?.title || '✏️ ملاحظة جديدة')}
                        {viewMode === 'revisions' && '📜 سجل التعديلات'}
                    </h1>

                    {viewMode === 'editor' && (
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 
                                       bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors ml-auto"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            رجوع
                        </button>
                    )}

                    {viewMode === 'list' && (
                        <button
                            onClick={() => setShowSplitView(!showSplitView)}
                            className={`p-2 rounded-lg transition-colors hidden md:block
                                ${showSplitView ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                            title={showSplitView ? "إخفاء عرض الأعمدة" : "عرض الاعمده (Split View)"}
                        >
                            <Columns className="w-5 h-5" />
                        </button>
                    )}

                    {/* زر التحديث */}
                    <button
                        onClick={async () => {
                            toast({ title: 'جارٍ التحديث... ⏳' });
                            await refreshNotes();
                            toast({ title: 'تم التحديث بنجاح ✅' });
                        }}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="تحديث البيانات"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>

                    {viewMode === 'list' && (
                        <div className="relative hidden sm:block">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="بحث..."
                                className="pr-10 w-48 h-9 text-sm"
                            />
                        </div>
                    )}

                    {viewMode === 'list' && (
                        <button
                            onClick={() => {
                                setSelectedNoteId(null);
                                setViewMode('editor');
                            }}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white 
                                       bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
                                       rounded-lg shadow-sm transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">ملاحظة جديدة</span>
                        </button>
                    )}
                </div>

                {/* منطقة العرض */}
                <div className="flex-1 overflow-hidden relative">

                    {/* قائمة الملاحظات (عرض القوائم أو الأعمدة) */}
                    {viewMode === 'list' && (
                        <div className="p-4 h-full overflow-hidden">
                            {showSplitView ? (
                                // ══════════ عرض الأعمدة (Split View) ══════════
                                <div className="flex gap-4 h-full overflow-x-auto pb-4">
                                    {splitBuckets.map(bucketId => {
                                        const bucket = buckets.find(b => b.id === bucketId);
                                        const notes = getNotesForBucket(bucketId);
                                        const Icon = bucket ? (iconMap[bucket.icon_name] || iconMap['Star']) : iconMap['Star'];

                                        return (
                                            <div
                                                key={bucketId}
                                                className="flex-shrink-0 w-80 md:w-96 flex flex-col bg-gray-100/50 rounded-xl border border-gray-200"
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => handleDropOnBucket(e, bucketId)}
                                            >
                                                {/* Column Header */}
                                                <div className={`p-3 border-b flex items-center gap-2 font-semibold ${bucket?.bg_color || 'bg-gray-100'} rounded-t-xl`}>
                                                    {Icon && <Icon className={`w-4 h-4 ${bucket?.color}`} />}
                                                    <span className="text-gray-700">{bucket?.label}</span>
                                                    <span className="mr-auto bg-white/50 px-2 py-0.5 rounded-full text-xs text-gray-500">
                                                        {notes.length}
                                                    </span>
                                                </div>

                                                {/* Column Content */}
                                                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                                    {notes.map(note => (
                                                        <NoteCard
                                                            key={note.id}
                                                            note={note}
                                                            onClick={() => handleNoteClick(note.id)}
                                                            onDelete={() => handleDeleteRequest(note.id)}
                                                            onDragStart={handleDragStart}
                                                            revisionsCount={0}
                                                        />
                                                    ))}
                                                    {notes.length === 0 && (
                                                        <div className="h-20 flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg mx-2 my-4">
                                                            اسحب الملاحظات هنا
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                // ══════════ العرض الشبكي العادي ══════════
                                <div className="h-full overflow-y-auto">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                                        {displayNotes.map(note => (
                                            <NoteCard
                                                key={note.id}
                                                note={note}
                                                onClick={() => handleNoteClick(note.id)}
                                                onDelete={() => handleDeleteRequest(note.id)}
                                                onDragStart={handleDragStart}
                                                revisionsCount={0}
                                            />
                                        ))}
                                    </div>

                                    {displayNotes.length === 0 && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none">
                                            <div className="p-4 bg-gray-50 rounded-full mb-4">
                                                <Search className="w-8 h-8 opacity-20" />
                                            </div>
                                            <p className="text-lg">لا توجد ملاحظات هنا</p>
                                            <p className="text-sm mt-2 opacity-60">
                                                {searchQuery ? 'جرب البحث عن شيء آخر' : 'اضغط على زر الإضافة لإنشاء ملاحظة'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* المحرر */}
                    {viewMode === 'editor' && (
                        <div className="h-full overflow-hidden">
                            <NoteEditor
                                initialTitle={selectedNote?.title}
                                initialContent={selectedNote?.content}
                                initialTags={selectedNote?.tags}
                                initialBucket={selectedNote?.bucket || activeBucket}
                                buckets={buckets}
                                isEditing={!!selectedNoteId}
                                onSave={handleSaveNote}
                                onCancel={handleBack}
                                onDelete={selectedNoteId ? () => handleDeleteRequest(selectedNoteId) : undefined}
                            />
                        </div>
                    )}

                    {/* سجل التعديلات */}
                    {viewMode === 'revisions' && (
                        <RevisionTimeline
                            revisions={revisions}
                            onRestore={async (revisionId) => {
                                await restoreRevision(revisionId);
                                setViewMode('editor');
                            }}
                        />
                    )}
                </div>
            </div>

            {/* نافذة القفل */}
            <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-center">🔒 ملاحظة مقفلة</DialogTitle>
                        <DialogDescription className="text-center">أدخل الرقم السري لفتح الملاحظة</DialogDescription>
                    </DialogHeader>
                    <div className="text-center py-6">
                        <Lock className="w-16 h-16 mx-auto mb-4 text-amber-500" />
                        <Input
                            type="password"
                            value={lockPin}
                            onChange={(e) => setLockPin(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                            placeholder="الرقم السري"
                            className="mb-4 text-center"
                            autoFocus
                        />
                        <div className="flex gap-2 justify-center">
                            <Button variant="outline" onClick={() => { setShowLockDialog(false); setLockPin(''); setSelectedNoteId(null); }}>
                                إلغاء
                            </Button>
                            <Button onClick={handleUnlock}>
                                <Unlock className="w-4 h-4 ml-1" />
                                فتح
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* نافذة تأكيد الحذف */}
            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-right">هل أنت متأكد من حذف الملاحظة؟</AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                            سيتم حذف هذه الملاحظة ولا يمكن استرجاعها.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse sm:justify-start gap-2">
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
                            حذف نهائي
                        </AlertDialogAction>
                        <AlertDialogCancel onClick={() => setDeleteAlertOpen(false)}>
                            إلغاء
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>



        </div>
    );
};
