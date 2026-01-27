import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { CustomShortcut, NewCustomShortcut, ActionPlacement } from '@/types/shortcuts';

export const useCustomShortcuts = () => {
    const [shortcuts, setShortcuts] = useState<CustomShortcut[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    // Fetch all shortcuts for current user
    const fetchShortcuts = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('custom_shortcuts')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .order('order_index', { ascending: true });

            if (error) throw error;
            setShortcuts(data || []);
        } catch (error) {
            console.error('Error fetching shortcuts:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchShortcuts();

        // Listen for realtime changes
        const channel = supabase
            .channel('custom_shortcuts_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_shortcuts' }, fetchShortcuts)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchShortcuts]);

    // Add new shortcut
    const addShortcut = async (shortcut: NewCustomShortcut) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('custom_shortcuts')
                .insert({ ...shortcut, user_id: user.id })
                .select()
                .single();

            if (error) throw error;

            setShortcuts(prev => [...prev, data]);
            toast({ title: '✅ تم الحفظ', description: `تم إنشاء "${shortcut.custom_name}"` });
            return data;
        } catch (error) {
            console.error('Error adding shortcut:', error);
            toast({ title: '❌ خطأ', description: 'فشل في حفظ الاختصار', variant: 'destructive' });
            return null;
        }
    };

    // Update existing shortcut
    const updateShortcut = async (id: string, updates: Partial<CustomShortcut>) => {
        try {
            const { error } = await supabase
                .from('custom_shortcuts')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            setShortcuts(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
            toast({ title: '✅ تم التحديث' });
        } catch (error) {
            console.error('Error updating shortcut:', error);
            toast({ title: '❌ خطأ', description: 'فشل في التحديث', variant: 'destructive' });
        }
    };

    // Delete shortcut
    const deleteShortcut = async (id: string) => {
        try {
            const { error } = await supabase
                .from('custom_shortcuts')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setShortcuts(prev => prev.filter(s => s.id !== id));
            toast({ title: '🗑️ تم الحذف' });
        } catch (error) {
            console.error('Error deleting shortcut:', error);
            toast({ title: '❌ خطأ', description: 'فشل في الحذف', variant: 'destructive' });
        }
    };

    // Reorder shortcuts (drag & drop support)
    const reorderShortcuts = async (reorderedIds: string[]) => {
        try {
            // Optimistic update
            const reordered = reorderedIds.map((id, index) => {
                const shortcut = shortcuts.find(s => s.id === id);
                return shortcut ? { ...shortcut, order_index: index } : null;
            }).filter(Boolean) as CustomShortcut[];

            setShortcuts(reordered);

            // Batch update in database
            const updates = reorderedIds.map((id, index) =>
                supabase.from('custom_shortcuts').update({ order_index: index }).eq('id', id)
            );
            await Promise.all(updates);
        } catch (error) {
            console.error('Error reordering:', error);
            fetchShortcuts(); // Rollback on error
        }
    };

    // Get shortcuts by placement
    const getByPlacement = (placement: ActionPlacement) =>
        shortcuts.filter(s => s.placement === placement);

    return {
        shortcuts,
        isLoading,
        addShortcut,
        updateShortcut,
        deleteShortcut,
        reorderShortcuts,
        getByPlacement,
        quickAccessShortcuts: getByPlacement('quick_access'),
        gridShortcuts: getByPlacement('shortcuts_grid'),
        refresh: fetchShortcuts
    };
};
