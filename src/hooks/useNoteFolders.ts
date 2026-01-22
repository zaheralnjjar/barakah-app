import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NoteFolder {
    id: string;
    name: string;
    color: string;
    icon: string;
    orderIndex: number;
    notesCount?: number;
    createdAt: string;
    updatedAt: string;
}

export const useNoteFolders = () => {
    const [folders, setFolders] = useState<NoteFolder[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Fetch folders from Supabase
    const fetchFolders = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('note_folders')
                .select('*, quick_notes(count)')
                .order('order_index', { ascending: true });

            if (error) throw error;

            if (data) {
                const mapped: NoteFolder[] = data.map((f: any) => ({
                    id: f.id,
                    name: f.name,
                    color: f.color,
                    icon: f.icon,
                    orderIndex: f.order_index,
                    notesCount: f.quick_notes?.[0]?.count || 0,
                    createdAt: f.created_at,
                    updatedAt: f.updated_at,
                }));
                setFolders(mapped);
            }
        } catch (error) {
            console.error('Error fetching folders:', error);
            toast({
                title: 'خطأ في تحميل المجلدات',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchFolders();

        // Realtime subscription
        const channel = supabase
            .channel('note_folders_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'note_folders'
            }, () => {
                fetchFolders();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchFolders]);

    // Create new folder
    const createFolder = async (
        name: string,
        color = '#4ade80',
        icon = 'folder'
    ) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('note_folders')
                .insert({
                    user_id: user.id,
                    name,
                    color,
                    icon,
                    order_index: folders.length,
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const newFolder: NoteFolder = {
                    id: data.id,
                    name: data.name,
                    color: data.color,
                    icon: data.icon,
                    orderIndex: data.order_index,
                    notesCount: 0,
                    createdAt: data.created_at,
                    updatedAt: data.updated_at,
                };
                setFolders(prev => [...prev, newFolder]);
                toast({ title: 'تم إنشاء المجلد ✅' });
                return newFolder;
            }
        } catch (error) {
            console.error('Error creating folder:', error);
            toast({
                title: 'خطأ في إنشاء المجلد',
                variant: 'destructive',
            });
        }
    };

    // Update folder
    const updateFolder = async (
        id: string,
        updates: Partial<Pick<NoteFolder, 'name' | 'color' | 'icon'>>
    ) => {
        try {
            const { error } = await supabase
                .from('note_folders')
                .update({
                    name: updates.name,
                    color: updates.color,
                    icon: updates.icon,
                })
                .eq('id', id);

            if (error) throw error;

            setFolders(prev => prev.map(f =>
                f.id === id ? { ...f, ...updates } : f
            ));
            toast({ title: 'تم تحديث المجلد ✅' });
        } catch (error) {
            console.error('Error updating folder:', error);
            toast({
                title: 'خطأ في تحديث المجلد',
                variant: 'destructive',
            });
        }
    };

    // Delete folder
    const deleteFolder = async (id: string) => {
        try {
            const { error } = await supabase
                .from('note_folders')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setFolders(prev => prev.filter(f => f.id !== id));
            toast({ title: 'تم حذف المجلد ✅' });
        } catch (error) {
            console.error('Error deleting folder:', error);
            toast({
                title: 'خطأ في حذف المجلد',
                variant: 'destructive',
            });
        }
    };

    // Reorder folders
    const reorderFolders = async (newOrder: NoteFolder[]) => {
        try {
            const updates = newOrder.map((folder, index) => ({
                id: folder.id,
                order_index: index,
            }));

            for (const update of updates) {
                await supabase
                    .from('note_folders')
                    .update({ order_index: update.order_index })
                    .eq('id', update.id);
            }

            setFolders(newOrder);
        } catch (error) {
            console.error('Error reordering folders:', error);
            toast({
                title: 'خطأ في إعادة الترتيب',
                variant: 'destructive',
            });
        }
    };

    return {
        folders,
        loading,
        createFolder,
        updateFolder,
        deleteFolder,
        reorderFolders,
        refresh: fetchFolders,
    };
};
