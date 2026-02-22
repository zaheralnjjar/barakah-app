
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NoteV2 {
    id: string;
    title: string;
    content: string;
    folder_id: string | null;
    is_pinned: boolean;
    is_favorite?: boolean;
    tags: string[] | null;
    color: string; // Background color (legacy/primary)
    font_family?: string;
    font_size?: string;
    text_color?: string;
    background_color?: string; // Explicit background color
    is_bold?: boolean;
    text_align?: 'right' | 'center' | 'left';
    created_at: string;
    updated_at: string;
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
                    query = query.eq('folder_id', folderId);
                } else if (folderId === 'trash') {
                    return [] as NoteV2[];
                }
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as unknown as NoteV2[];
        },
    });

    // 2. Create Note
    const createNoteMut = useMutation({
        mutationFn: async ({ title, folder_id, content = '', color, tags = [], font_family, font_size, text_color, background_color, is_bold, text_align }: Partial<NoteV2>) => {
            const userId = (await supabase.auth.getUser()).data.user?.id;
            if (!userId) throw new Error('يجب تسجيل الدخول أولاً');

            const { data, error } = await supabase
                .from('quick_notes')
                .insert([{
                    title: title || 'ملاحظة جديدة',
                    folder_id: (folder_id === 'trash' || folder_id === 'all' || folder_id === 'bookmarked') ? null : folder_id,
                    content,
                    color: color || '#ffffff',
                    tags: tags,
                    user_id: userId,
                    is_pinned: false
                }])
                .select()
                .single();

            if (error) {
                console.error("Note creation error:", error);
                throw error;
            }
            return data;
        },
        onError: (error: any) => {
            console.error(error);
            toast({ title: 'فشل إنشاء الملاحظة', description: error.message || 'حدث خطأ غير معروف', variant: 'destructive' });
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

    // 7. Toggle Favorite
    const toggleFavoriteMut = useMutation({
        mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
            const { data, error } = await supabase
                .from('quick_notes')
                .update({ is_favorite: isFavorite })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['quick_notes'] });
            toast({ title: variables.isFavorite ? 'تمت الإضافة للمفضلة' : 'تم الإزالة من المفضلة' });
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
        toggleFavorite: toggleFavoriteMut.mutateAsync,
    };
};
