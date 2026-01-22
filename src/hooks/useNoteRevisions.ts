import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NoteRevision {
    id: string;
    noteId: string;
    revisionTitle: string;
    content: string;
    revisionNumber: number;
    colorCode: string;
    changesSummary?: string;
    createdAt: string;
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

export const getRevisionColor = (revisionNumber: number) => {
    if (revisionNumber >= REVISION_COLORS.length) {
        return REVISION_COLORS[REVISION_COLORS.length - 1];
    }
    return REVISION_COLORS[revisionNumber];
};

export const useNoteRevisions = (noteId?: string) => {
    const [revisions, setRevisions] = useState<NoteRevision[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Fetch revisions for a note
    const fetchRevisions = useCallback(async (id: string) => {
        if (!id) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('note_revisions')
                .select('*')
                .eq('note_id', id)
                .order('revision_number', { ascending: true });

            if (error) throw error;

            if (data) {
                const mapped: NoteRevision[] = data.map((r: any) => ({
                    id: r.id,
                    noteId: r.note_id,
                    revisionTitle: r.revision_title,
                    content: r.content,
                    revisionNumber: r.revision_number,
                    colorCode: r.color_code,
                    changesSummary: r.changes_summary,
                    createdAt: r.created_at,
                }));
                setRevisions(mapped);
            }
        } catch (error) {
            console.error('Error fetching revisions:', error);
            toast({
                title: 'خطأ في تحميل التعديلات',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (noteId) {
            fetchRevisions(noteId);
        }
    }, [noteId, fetchRevisions]);

    // Create new revision
    const createRevision = async (
        noteId: string,
        title: string,
        content: string,
        summary?: string
    ) => {
        try {
            // Get current revision count
            const { data: existingRevisions } = await supabase
                .from('note_revisions')
                .select('revision_number')
                .eq('note_id', noteId)
                .order('revision_number', { ascending: false })
                .limit(1);

            const nextRevisionNumber = existingRevisions && existingRevisions.length > 0
                ? existingRevisions[0].revision_number + 1
                : 0;

            const colorInfo = getRevisionColor(nextRevisionNumber);

            const { data, error } = await supabase
                .from('note_revisions')
                .insert({
                    note_id: noteId,
                    revision_title: title,
                    content,
                    revision_number: nextRevisionNumber,
                    color_code: colorInfo.color,
                    changes_summary: summary,
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const newRevision: NoteRevision = {
                    id: data.id,
                    noteId: data.note_id,
                    revisionTitle: data.revision_title,
                    content: data.content,
                    revisionNumber: data.revision_number,
                    colorCode: data.color_code,
                    changesSummary: data.changes_summary,
                    createdAt: data.created_at,
                };
                setRevisions(prev => [...prev, newRevision]);
                toast({ title: 'تم حفظ التعديل ✅' });
                return newRevision;
            }
        } catch (error) {
            console.error('Error creating revision:', error);
            toast({
                title: 'خطأ في حفظ التعديل',
                variant: 'destructive',
            });
        }
    };

    // Restore a revision (copy its content to current note)
    const restoreRevision = async (revisionId: string) => {
        try {
            const revision = revisions.find(r => r.id === revisionId);
            if (!revision) throw new Error('Revision not found');

            // Update the main note with this revision's content
            const { error } = await supabase
                .from('quick_notes')
                .update({
                    content: revision.content,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', revision.noteId);

            if (error) throw error;

            toast({
                title: 'تم استعادة النسخة ✅',
                description: `تم استعادة: ${revision.revisionTitle}`,
            });
        } catch (error) {
            console.error('Error restoring revision:', error);
            toast({
                title: 'خطأ في استعادة النسخة',
                variant: 'destructive',
            });
        }
    };

    // Delete a revision
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
            console.error('Error deleting revision:', error);
            toast({
                title: 'خطأ في حذف التعديل',
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
