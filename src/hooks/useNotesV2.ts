
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NoteV2 {
    id: string;
    title: string;
    content: string; // HTML or JSON
    folder_id: string | null;
    is_pinned: boolean;
    tags: string[];
    created_at: string;
    updated_at: string;
}

export const useNotesV2 = (folderId?: string | null) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // 1. Fetch Notes (optionally filtered by folder)
    const { data: notes = [], isLoading } = useQuery({
        queryKey: ['notes_v2', folderId],
        queryFn: async () => {
            let query = supabase
                .from('notes_v2')
                .select('*')
                .order('is_pinned', { ascending: false })
                .order('updated_at', { ascending: false });

            if (folderId) {
                query = query.eq('folder_id', folderId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as NoteV2[];
        },
    });

    // 2. Create Note
    const createNoteMut = useMutation({
        mutationFn: async ({ title, folder_id, content = '' }: { title: string; folder_id: string | null, content?: string }) => {
            const { data, error } = await supabase
                .from('notes_v2')
                .insert([{
                    title,
                    folder_id,
                    content,
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

    // 4. Delete Note
    const deleteNoteMut = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('notes_v2')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes_v2'] });
            toast({ title: 'تم حذف الملاحظة' });
        },
    });

    return {
        notes,
        isLoading,
        createNote: createNoteMut.mutateAsync,
        updateNote: updateNoteMut.mutateAsync,
        deleteNote: deleteNoteMut.mutateAsync,
    };
};
