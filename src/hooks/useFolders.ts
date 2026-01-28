
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Folder {
    id: string;
    name: string;
    icon: string;
    color?: string;
    order_index?: number;
    created_at: string;
}

export const useFolders = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // 1. Fetch all folders
    const { data: folders = [], isLoading } = useQuery({
        queryKey: ['folders'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('note_folders')
                .select('*')
                .order('name');

            if (error) {
                console.error('Error fetching folders:', error);
                throw error;
            }
            return data as Folder[];
        },
    });

    const createFolderMut = useMutation({
        mutationFn: async ({ name, parent_id, icon, color }: { name: string; parent_id: string | null; icon?: string; color?: string }) => {
            const { data, error } = await supabase
                .from('note_folders')
                .insert([{
                    name,
                    icon: icon || 'folder',
                    color: color || '#4ade80',
                    user_id: (await supabase.auth.getUser()).data.user?.id
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folders'] });
            toast({ title: 'تم إنشاء المجلد بنجاح' });
        },
        onError: (error) => {
            console.error(error);
            toast({
                title: 'فشل إنشاء المجلد',
                description: `تأكد من إنشاء الجداول في قاعدة البيانات: ${error.message}`,
                variant: 'destructive',
                duration: 5000
            });
        },
    });

    // 3. Update Folder (Rename or Move)
    const updateFolderMut = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Folder> }) => {
            const { error } = await supabase
                .from('note_folders')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folders'] });
        },
    });

    // 4. Delete Folder
    const deleteFolderMut = useMutation({
        mutationFn: async (id: string) => {
            // Hard delete folder for now if no is_deleted column
            const { error: folderError } = await supabase
                .from('note_folders')
                .delete()
                .eq('id', id);

            if (folderError) throw folderError;

            // Cascade to notes - and since we use ON DELETE SET NULL in DB, 
            // the notes will automatically have folder_id = null.
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folders'] });
            toast({ title: 'تم حذف المجلد' });
        },
        onError: (err: any) => {
            console.error('Delete folder error:', err);
            toast({
                title: 'فشل الحذف',
                description: 'تأكد من وجود عمود is_deleted في جدول folders في Supabase. يرجى مراجعة التعليمات.',
                variant: 'destructive',
                duration: 5000
            });
        }
    });

    return {
        folders,
        isLoading,
        createFolder: createFolderMut.mutateAsync,
        updateFolder: updateFolderMut.mutateAsync,
        deleteFolder: deleteFolderMut.mutateAsync,
    };
};
