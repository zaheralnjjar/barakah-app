/**
 * useQuickNotes - Hook لإدارة الملاحظات
 * إصدار جديد نظيف ومبسط
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface QuickNote {
    id: string;
    user_id: string;
    folder_id: string | null;
    title: string;
    content: string;
    tags: string[];
    is_pinned: boolean;
    is_locked: boolean;
    bucket: string;
    created_at: string;
    updated_at: string;
}

// للتوافق مع الكود القديم
export interface NoteData {
    id: string;
    title?: string;
    content: string;
    type?: string;
    isSecure?: boolean;
    isPinned?: boolean;
    folderId?: string;
    tags?: string[];
    bucket?: string;
    createdAt?: string;
    updatedAt?: string;
}

export type NoteType = 'quick' | 'main' | 'voice';

// تحويل من صيغة قاعدة البيانات إلى صيغة الواجهة
const dbToUI = (note: QuickNote): NoteData => ({
    id: note.id,
    title: note.title,
    content: note.content,
    type: 'quick',
    isSecure: note.is_locked,
    isPinned: note.is_pinned,
    tags: note.tags || [],
    bucket: note.bucket || 'inbox',
    createdAt: note.created_at,
    updatedAt: note.updated_at,
});

export const useQuickNotes = () => {
    const [notes, setNotes] = useState<QuickNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    // للتوافق مع الكود القديم
    const notesHistory = notes.map(dbToUI);

    // ═══════════════════════════════════════════════════════════════
    // جلب الملاحظات
    // ═══════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════
    // جلب الملاحظات (مع فلترة المحذوفات محلياً)
    // ═══════════════════════════════════════════════════════════════
    const fetchNotes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setNotes([]);
                setLoading(false);
                return;
            }

            const { data, error: fetchError } = await supabase
                .from('quick_notes')
                .select('*')
                .eq('user_id', user.id)
                .order('is_pinned', { ascending: false })
                .order('updated_at', { ascending: false });

            if (fetchError) throw fetchError;

            // CLIENT-SIDE FILTERING OF DELETED NOTES
            // (Workaround for RLS issues preventing real delete)
            let deletedIds: string[] = [];
            try {
                const stored = localStorage.getItem('barakah_deleted_notes_ids');
                if (stored) {
                    deletedIds = JSON.parse(stored);
                    if (!Array.isArray(deletedIds)) deletedIds = [];
                }
            } catch (e) {
                console.error('Error parsing deleted notes ids', e);
                // Reset corrupted storage if needed, or just ignore
                deletedIds = [];
            }

            console.log('[fetchNotes] Filtering out deleted IDs:', deletedIds);
            const validNotes = (data || []).filter(note => !deletedIds.includes(note.id.trim()) && note.bucket !== 'trash');

            setNotes(validNotes);

        } catch (err: any) {
            console.error('[useQuickNotes] Fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // ═══════════════════════════════════════════════════════════════
    // إنشاء ملاحظة جديدة
    // ═══════════════════════════════════════════════════════════════
    const addNote = async (
        content: string,
        type: NoteType = 'quick',
        title?: string,
        isSecure: boolean = false,
        bucket: string = 'inbox'
    ) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast({ title: 'يجب تسجيل الدخول أولاً ⚠️', variant: 'destructive' });
                return null;
            }

            const { data, error: insertError } = await supabase
                .from('quick_notes')
                .insert({
                    user_id: user.id,
                    title: title?.trim() || 'ملاحظة جديدة',
                    content: content || '',
                    folder_id: null,
                    is_pinned: false,
                    is_locked: isSecure,
                    tags: [],
                    bucket: bucket,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            setNotes(prev => [data, ...prev]);
            toast({ title: 'تم إنشاء الملاحظة بنجاح ✅' });

            return data;

        } catch (err: any) {
            toast({ title: 'فشل إنشاء الملاحظة ❌', description: err.message, variant: 'destructive' });
            return null;
        }
    };

    // ═══════════════════════════════════════════════════════════════
    // تحديث ملاحظة
    // ═══════════════════════════════════════════════════════════════
    const updateNoteById = async (id: string, updates: Partial<NoteData>) => {
        try {
            const dbUpdates: any = {};
            if (updates.title !== undefined) dbUpdates.title = updates.title;
            if (updates.content !== undefined) dbUpdates.content = updates.content;
            if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
            if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
            if (updates.isSecure !== undefined) dbUpdates.is_locked = updates.isSecure;
            if (updates.bucket !== undefined) dbUpdates.bucket = updates.bucket;

            const { error: updateError } = await supabase
                .from('quick_notes')
                .update(dbUpdates)
                .eq('id', id);

            if (updateError) throw updateError;

            setNotes(prev => prev.map(n =>
                n.id === id ? { ...n, ...dbUpdates, updated_at: new Date().toISOString() } : n
            ));

            return true;

        } catch (err: any) {
            toast({ title: 'فشل تحديث الملاحظة ❌', description: err.message, variant: 'destructive' });
            return false;
        }
    };

    const updateNoteBucket = async (id: string, bucket: string) => {
        return updateNoteById(id, { bucket });
    };

    // ═══════════════════════════════════════════════════════════════
    // حذف ملاحظة (Local Hide + Try Server)
    // ═══════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════
    // حذف ملاحظة (Local Hide + Hard Delete)
    // ═══════════════════════════════════════════════════════════════
    const deleteNoteById = async (id: string) => {
        const cleanId = id.trim();
        console.log('[deleteNoteById] Attempting delete for:', cleanId);

        // 1. Optimistic UI Removal
        setNotes(prev => prev.filter(n => n.id !== id));

        // 2. Persist local deletion (The real fix for user)
        try {
            let deletedIds: string[] = [];
            try {
                const stored = localStorage.getItem('barakah_deleted_notes_ids');
                deletedIds = stored ? JSON.parse(stored) : [];
                if (!Array.isArray(deletedIds)) deletedIds = [];
            } catch { deletedIds = []; }

            if (!deletedIds.includes(cleanId)) {
                deletedIds.push(cleanId);
                localStorage.setItem('barakah_deleted_notes_ids', JSON.stringify(deletedIds));
                console.log('[deleteNoteById] Saved to localStorage:', deletedIds);
            }
        } catch (e) {
            console.error('Local delete failed', e);
        }

        // 3. Perform HARD DELETE on server
        // (We used to do soft delete, but RLS/Policies seem to be blocking updates or reverting them)
        try {
            const { error } = await supabase
                .from('quick_notes')
                .delete()
                .eq('id', cleanId);

            if (error) {
                console.error('[deleteNoteById] Server delete failed:', error);
                // We do NOT revert state. We keep it hidden locally.
                toast({ title: 'تم الحذف (محلي)', description: 'لم نتمكن من الحذف من الخادم، لكن تم إخفاء الملاحظة.', variant: 'default' });
            } else {
                console.log('[deleteNoteById] Server delete success');
                toast({ title: 'تم حذف الملاحظة نهائياً ✅' });
            }
            return true;

        } catch (err: any) {
            console.error('[deleteNoteById] Unexpected error:', err);
            toast({ title: 'تم حذف الملاحظة (محلياً) ✅' });
            return true;
        }
    };

    const togglePin = async (noteId: string) => {
        const note = notes.find(n => n.id === noteId);
        if (note) {
            await updateNoteById(noteId, { isPinned: !note.is_pinned });
        }
    };

    const searchNotes = async (query: string) => {
        if (!query.trim()) {
            await fetchNotes();
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error: searchError } = await supabase
                .from('quick_notes')
                .select('*')
                .eq('user_id', user.id)
                .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
                .order('updated_at', { ascending: false });

            if (searchError) throw searchError;
            setNotes(data || []);
        } catch (err: any) {
            console.error('[useQuickNotes] Search error:', err);
        }
    };

    const lockNote = async (noteId: string, pin: string) => {
        try {
            const hashedPin = btoa(pin);
            await supabase
                .from('quick_notes')
                .update({ is_locked: true, lock_pin: hashedPin })
                .eq('id', noteId);

            setNotes(prev => prev.map(n =>
                n.id === noteId ? { ...n, is_locked: true } : n
            ));
            toast({ title: 'تم قفل الملاحظة 🔒' });
        } catch {
            toast({ title: 'خطأ في قفل الملاحظة', variant: 'destructive' });
        }
    };

    const unlockNote = async (noteId: string, pin: string): Promise<boolean> => {
        try {
            const { data } = await supabase
                .from('quick_notes')
                .select('lock_pin')
                .eq('id', noteId)
                .single();

            if (!data) return false;
            const hashedPin = btoa(pin);
            if (hashedPin !== data.lock_pin) {
                toast({ title: 'رقم سري خاطئ ❌', variant: 'destructive' });
                return false;
            }
            return true;
        } catch {
            return false;
        }
    };

    const addTag = async (noteId: string, tag: string) => {
        const note = notes.find(n => n.id === noteId);
        if (note) {
            const newTags = [...(note.tags || []), tag];
            await updateNoteById(noteId, { tags: newTags });
        }
    };

    const removeTag = async (noteId: string, tag: string) => {
        const note = notes.find(n => n.id === noteId);
        if (note) {
            const newTags = (note.tags || []).filter(t => t !== tag);
            await updateNoteById(noteId, { tags: newTags });
        }
    };

    const appendToActivitiesNote = async (content: string) => {
        const today = new Date().toLocaleDateString('ar-SA');
        const activityTitle = `نشاط يوم ${today}`;

        // Find if an activities note for today already exists in 'activities' bucket
        // For simplicity, we create a new one or append to the latest one
        const { data: existing } = await supabase
            .from('quick_notes')
            .select('*')
            .eq('title', activityTitle)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        if (existing) {
            const newContent = existing.content + '\n' + content;
            await updateNoteById(existing.id, { content: newContent });
        } else {
            await addNote(content, 'quick', activityTitle, false, 'inbox');
        }
    };

    useEffect(() => {
        fetchNotes();

        const channel = supabase
            .channel('quick_notes_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'quick_notes' }, () => {
                fetchNotes();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchNotes]);

    return {
        notes,
        notesHistory,
        loading,
        error,
        addNote,
        updateNoteById,
        updateNoteBucket,
        deleteNoteById,
        togglePin,
        searchNotes,
        lockNote,
        unlockNote,
        addTag,
        removeTag,
        appendToActivitiesNote,
        refresh: fetchNotes,
    };
};

