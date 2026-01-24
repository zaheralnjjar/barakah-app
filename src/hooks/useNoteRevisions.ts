/**
 * useNoteRevisions - Hook لإدارة سجل تعديلات الملاحظات
 * إصدار محدث للتوافق مع الجدول الجديد
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NoteRevision {
    id: string;
    note_id: string;
    user_id: string;
    title: string | null;
    content: string | null;
    change_note: string | null;
    created_at: string;
    // للتوافق مع الكود القديم
    noteId?: string;
    revisionTitle?: string;
    revisionNumber?: number;
    colorCode?: string;
    changesSummary?: string;
    createdAt?: string;
}

// نظام الألوان للتعديلات
export const REVISION_COLORS = [
    { number: 0, color: '#10b981', emoji: '🟢', name: 'النسخة الأصلية' },
    { number: 1, color: '#3b82f6', emoji: '🔵', name: 'التعديل الأول' },
    { number: 2, color: '#eab308', emoji: '🟡', name: 'التعديل الثاني' },
    { number: 3, color: '#f97316', emoji: '🟠', name: 'التعديل الثالث' },
    { number: 4, color: '#ef4444', emoji: '🔴', name: 'التعديل الرابع' },
    { number: 5, color: '#8b5cf6', emoji: '🟣', name: 'التعديل الخامس' },
];

export const getRevisionColor = (index: number) => {
    if (index >= REVISION_COLORS.length) {
        return REVISION_COLORS[REVISION_COLORS.length - 1];
    }
    return REVISION_COLORS[index];
};

export const useNoteRevisions = (noteId?: string) => {
    const [revisions, setRevisions] = useState<NoteRevision[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // جلب التعديلات
    const fetchRevisions = useCallback(async (id: string) => {
        if (!id) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('note_revisions')
                .select('*')
                .eq('note_id', id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (data) {
                const mapped: NoteRevision[] = data.map((r: any, index: number) => ({
                    id: r.id,
                    note_id: r.note_id,
                    user_id: r.user_id,
                    title: r.title,
                    content: r.content,
                    change_note: r.change_note,
                    created_at: r.created_at,
                    // التوافق مع الكود القديم
                    noteId: r.note_id,
                    revisionTitle: r.title || `تعديل ${index + 1}`,
                    revisionNumber: index,
                    colorCode: getRevisionColor(index).color,
                    changesSummary: r.change_note,
                    createdAt: r.created_at,
                }));
                setRevisions(mapped);
            }
        } catch (error) {
            console.error('[useNoteRevisions] خطأ في الجلب:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (noteId) {
            fetchRevisions(noteId);
        } else {
            setRevisions([]);
        }
    }, [noteId, fetchRevisions]);

    // إنشاء تعديل جديد
    const createRevision = async (
        noteId: string,
        title: string,
        content: string,
        summary?: string
    ) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from('note_revisions')
                .insert({
                    note_id: noteId,
                    user_id: user.id,
                    title: title,
                    content: content,
                    change_note: summary || null,
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const newRevision: NoteRevision = {
                    id: data.id,
                    note_id: data.note_id,
                    user_id: data.user_id,
                    title: data.title,
                    content: data.content,
                    change_note: data.change_note,
                    created_at: data.created_at,
                    noteId: data.note_id,
                    revisionTitle: data.title || 'تعديل',
                    revisionNumber: revisions.length,
                    colorCode: getRevisionColor(revisions.length).color,
                    changesSummary: data.change_note,
                    createdAt: data.created_at,
                };
                setRevisions(prev => [...prev, newRevision]);
                return newRevision;
            }
        } catch (error) {
            console.error('[useNoteRevisions] خطأ في الإنشاء:', error);
        }
        return null;
    };

    // استعادة تعديل
    const restoreRevision = async (revisionId: string) => {
        try {
            const revision = revisions.find(r => r.id === revisionId);
            if (!revision) throw new Error('التعديل غير موجود');

            const { error } = await supabase
                .from('quick_notes')
                .update({
                    content: revision.content,
                })
                .eq('id', revision.note_id);

            if (error) throw error;

            toast({
                title: 'تم استعادة النسخة ✅',
                description: `تم استعادة: ${revision.title || 'نسخة سابقة'}`,
            });
        } catch (error) {
            console.error('[useNoteRevisions] خطأ في الاستعادة:', error);
            toast({
                title: 'خطأ في استعادة النسخة ❌',
                variant: 'destructive',
            });
        }
    };

    // حذف تعديل
    const deleteRevision = async (revisionId: string) => {
        try {
            const { error } = await supabase
                .from('note_revisions')
                .delete()
                .eq('id', revisionId);

            if (error) throw error;

            setRevisions(prev => prev.filter(r => r.id !== revisionId));
            toast({ title: 'تم حذف التعديل ✅' });
        } catch (error) {
            console.error('[useNoteRevisions] خطأ في الحذف:', error);
            toast({
                title: 'خطأ في حذف التعديل ❌',
                variant: 'destructive',
            });
        }
    };

    return {
        revisions,
        loading,
        createRevision,
        restoreRevision,
        deleteRevision,
        refresh: () => noteId && fetchRevisions(noteId),
    };
};
