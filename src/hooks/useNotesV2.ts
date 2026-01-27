
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NoteV2 {
    id: string;
    title: string;
    content: string;
    folder_id: string | null;
    is_pinned: boolean;
    tags: string[] | null;
    color: string;
    created_at: string;
    updated_at: string;
    // Removed fields not in quick_notes: is_deleted, is_bookmarked
}

export const useNotesV2 = (folderId?: string | null, searchQuery?: string) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // 1. Fetch Notes
    const { data: notes = [], isLoading } = useQuery({
        queryKey: ['quick_notes', folderId, searchQuery],
        queryFn: async () => {
            let query = supabase
                .from('quick_notes')
                .select('*')
                .order('is_pinned', { ascending: false })
                .order('updated_at', { ascending: false });

            if (searchQuery && searchQuery.trim().length > 0) {
                query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
            } else if (folderId) {
                if (folderId !== 'all' && folderId !== 'trash') {
                    // 'trash' is not supported in quick_notes schema yet (no is_deleted), so we just ignore it or return empty
                    query = query.eq('folder_id', folderId);
                } else if (folderId === 'trash') {
                    // No soft delete support yet, return empty for now
                    return [] as NoteV2[];
                }
            }

            const { data, error } = await query;
            if (error) throw error;

            // Map quick_notes response to NoteV2 interface if needed, or just return as is
            return data as unknown as NoteV2[];
        },
    });

    // 2. Create Note
    const createNoteMut = useMutation({
        mutationFn: async ({ title, folder_id, content = '', color, tags = [] }: { title: string; folder_id: string | null, content?: string, color?: string, tags?: string[] }) => {
            const userId = (await supabase.auth.getUser()).data.user?.id;
            if (!userId) throw new Error('يجب تسجيل الدخول أولاً');

            const { data, error } = await supabase
                .from('quick_notes')
                .insert([{
                    title,
                    folder_id: (folder_id === 'trash' || folder_id === 'all') ? null : folder_id,
                    content,
                    // color: color || '#ffffff', // Suspended until DB migration
                    tags: tags,
                    user_id: userId,
                    is_pinned: false
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quick_notes'] });
            toast({ title: 'تم إنشاء الملاحظة بنجاح' });
        },
    });

    // 3. Update Note
    const updateNoteMut = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<NoteV2> }) => {
            // Map updates to quick_notes columns
            const dbUpdates: any = { ...updates };
            // if (updates.color) dbUpdates.color = updates.color; // Suspended until DB migration

            const { data, error } = await supabase
                .from('quick_notes')
                .update(dbUpdates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quick_notes'] });
        },
    });

    // 4. Delete Note (Hard Delete for now as quick_notes lacks is_deleted)
    const deleteNoteMut = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('quick_notes')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quick_notes'] });
            toast({ title: 'تم حذف الملاحظة' });
        },
    });

    // 5. Restore Note (Not supported yet, placeholder)
    const restoreNoteMut = useMutation({
        mutationFn: async (id: string) => {
            // No-op for hard delete system
            console.warn("Restore not supported in hard-delete mode");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quick_notes'] });
        },
    });

    // 6. Permanent Delete (Same as Delete)
    const permanentDeleteMut = deleteNoteMut;

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
