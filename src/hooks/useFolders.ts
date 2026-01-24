
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Folder {
    id: string;
    name: string;
    parent_id: string | null;
    icon: string;
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
                .from('folders')
                .select('*')
                .order('name');

            if (error) {
                console.error('Error fetching folders:', error);
                throw error;
            }
            return data as Folder[];
        },
    });

    // 2. Create Folder
    const createFolderMut = useMutation({
        mutationFn: async ({ name, parent_id }: { name: string; parent_id: string | null }) => {
            const { data, error } = await supabase
                .from('folders')
                .insert([{ name, parent_id, user_id: (await supabase.auth.getUser()).data.user?.id }])
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
                .from('folders')
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
            const { error } = await supabase
                .from('folders')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folders'] });
            toast({ title: 'تم حذف المجلد' });
        },
    });

    return {
        folders,
        isLoading,
        createFolder: createFolderMut.mutateAsync,
        updateFolder: updateFolderMut.mutateAsync,
        deleteFolder: deleteFolderMut.mutateAsync,
    };
};
