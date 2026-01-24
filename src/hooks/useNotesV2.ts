
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NoteV2 {
    id: string;
    title: string;
    content: string; // HTML or JSON
    folder_id: string | null;
    is_pinned: boolean;
    is_bookmarked?: boolean; // New field
    tags: string[];
    created_at: string;
    updated_at: string;
}

export const useNotesV2 = (folderId?: string | null, searchQuery?: string) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // 1. Fetch Notes (optionally filtered by folder or search)
    const { data: notes = [], isLoading } = useQuery({
        queryKey: ['notes_v2', folderId, searchQuery],
        queryFn: async () => {
            let query = supabase
                .from('notes_v2')
                .select('*')
                .order('is_pinned', { ascending: false })
                .order('updated_at', { ascending: false });

            if (searchQuery && searchQuery.trim().length > 0) {
                // Global Search
                query = query.eq('is_deleted', false)
                    .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
            } else if (folderId === 'trash') {
                query = query.eq('is_deleted', true);
            } else if (folderId === 'bookmarked') {
                query = query.eq('is_bookmarked', true).eq('is_deleted', false);
            } else {
                query = query.eq('is_deleted', false); // Default view shows only active notes
                if (folderId && folderId !== 'all') { // 'all' could be a virtual folder for "All Notes"
                    query = query.eq('folder_id', folderId);
                }
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as NoteV2[];
        },
    });

    // 2. Create Note
    const createNoteMut = useMutation({
        mutationFn: async ({ title, folder_id, content = '', color }: { title: string; folder_id: string | null, content?: string, color?: string }) => {
            const { data, error } = await supabase
                .from('notes_v2')
                .insert([{
                    title,
                    folder_id: folder_id === 'trash' ? null : folder_id, // Safety check
                    content,
                    cover_image: color, // Storing color in cover_image for now as requested "color"
                    user_id: (await supabase.auth.getUser()).data.user?.id
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes_v2'] });
            toast({ title: 'تم إنشاء الملاحظة' });
        },
    });

    // 3. Update Note
    const updateNoteMut = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<NoteV2> }) => {
            const { data, error } = await supabase
                .from('notes_v2')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes_v2'] });
        },
    });

    // 4. Soft Delete Note (Move to Trash)
    const deleteNoteMut = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('notes_v2')
                .update({ is_deleted: true, deleted_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes_v2'] });
            toast({ title: 'تم نقل الملاحظة لسلة المهملات' });
        },
    });

    // 5. Restore Note
    const restoreNoteMut = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('notes_v2')
                .update({ is_deleted: false, deleted_at: null })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes_v2'] });
            toast({ title: 'تم استعادة الملاحظة' });
        },
    });

    // 6. Permanent Delete (Empty Trash)
    const permanentDeleteMut = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('notes_v2')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes_v2'] });
        },
    });

    return {
        notes,
        isLoading,
        createNote: createNoteMut.mutateAsync,
        updateNote: updateNoteMut.mutateAsync,
        deleteNote: deleteNoteMut.mutateAsync,
        restoreNote: restoreNoteMut.mutateAsync,
        permanentDelete: permanentDeleteMut.mutateAsync,
    };
};
