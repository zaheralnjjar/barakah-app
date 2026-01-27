import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { CustomShortcut, NewCustomShortcut, ActionPlacement, ShortcutPreset } from '@/types/shortcuts';

export const useCustomShortcuts = () => {
    const [shortcuts, setShortcuts] = useState<CustomShortcut[]>([]);
    const [presets, setPresets] = useState<ShortcutPreset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
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

    // Fetch user presets
    const fetchPresets = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('user_shortcut_presets')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPresets(data || []);
        } catch (error) {
            console.error('Error fetching presets:', error);
        }
    }, []);

    // Force Sync (Manual Refresh)
    const forceSync = useCallback(async () => {
        setIsSyncing(true);
        try {
            await Promise.all([fetchShortcuts(), fetchPresets()]);
            toast({ title: '🔄 تم المزامنة', description: 'تم تحديث البيانات بنجاح' });
        } catch (error) {
            toast({ title: '❌ فشل المزامنة', variant: 'destructive' });
        } finally {
            setIsSyncing(false);
        }
    }, [fetchShortcuts, fetchPresets, toast]);

    useEffect(() => {
        fetchShortcuts();
        fetchPresets();

        // Listen for realtime changes
        const channel = supabase
            .channel('custom_shortcuts_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_shortcuts' }, fetchShortcuts)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_shortcut_presets' }, fetchPresets)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchShortcuts, fetchPresets]);

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

    // Delete shortcut with confirmation
    const deleteShortcut = async (id: string, skipConfirm = false) => {
        if (!skipConfirm && !confirm('هل أنت متأكد من حذف هذا الاختصار؟')) return;

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

    // === FOLDER SUPPORT ===

    // Get root shortcuts (no parent folder)
    const getRootShortcuts = () => shortcuts.filter(s => !s.parent_folder_id && !s.is_folder);

    // Get folders only
    const getFolders = () => shortcuts.filter(s => s.is_folder);

    // Get shortcuts inside a folder
    const getShortcutsInFolder = (folderId: string) =>
        shortcuts.filter(s => s.parent_folder_id === folderId);

    // Create a folder
    const createFolder = async (name: string, color: string = 'gray') => {
        return addShortcut({
            custom_name: name,
            custom_icon: 'Folder',
            icon_color: color,
            shortcut_type: 'folder',
            is_folder: true,
            folder_color: color,
            placement: 'shortcuts_grid',
            order_index: shortcuts.length
        });
    };

    // Move shortcut to folder
    const moveToFolder = async (shortcutId: string, folderId: string | null) => {
        return updateShortcut(shortcutId, { parent_folder_id: folderId });
    };

    // === PRESETS (SAVED CONFIGURATIONS) ===

    // Save current configuration as preset
    const savePreset = async (name: string, description?: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('user_shortcut_presets')
                .insert({
                    user_id: user.id,
                    preset_name: name,
                    preset_description: description,
                    shortcuts_config: shortcuts
                })
                .select()
                .single();

            if (error) throw error;

            setPresets(prev => [data, ...prev]);
            toast({ title: '💾 تم الحفظ', description: `تم حفظ الوضع "${name}"` });
            return data;
        } catch (error) {
            console.error('Error saving preset:', error);
            toast({ title: '❌ خطأ', description: 'فشل في حفظ الوضع', variant: 'destructive' });
            return null;
        }
    };

    // Restore a preset
    const restorePreset = async (presetId: string) => {
        if (!confirm('سيتم استبدال الاختصارات الحالية بالوضع المحفوظ. هل تريد المتابعة؟')) return;

        try {
            const preset = presets.find(p => p.id === presetId);
            if (!preset) throw new Error('Preset not found');

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Delete all current shortcuts
            await supabase
                .from('custom_shortcuts')
                .delete()
                .eq('user_id', user.id);

            // Insert preset shortcuts
            const newShortcuts = preset.shortcuts_config.map(s => ({
                ...s,
                id: undefined, // Let DB generate new IDs
                user_id: user.id
            }));

            const { error } = await supabase
                .from('custom_shortcuts')
                .insert(newShortcuts);

            if (error) throw error;

            await fetchShortcuts();
            toast({ title: '✅ تم الاستعادة', description: `تم تطبيق الوضع "${preset.preset_name}"` });
        } catch (error) {
            console.error('Error restoring preset:', error);
            toast({ title: '❌ خطأ', description: 'فشل في استعادة الوضع', variant: 'destructive' });
        }
    };

    // Delete a preset
    const deletePreset = async (presetId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الوضع المحفوظ؟')) return;

        try {
            const { error } = await supabase
                .from('user_shortcut_presets')
                .delete()
                .eq('id', presetId);

            if (error) throw error;

            setPresets(prev => prev.filter(p => p.id !== presetId));
            toast({ title: '🗑️ تم الحذف' });
        } catch (error) {
            console.error('Error deleting preset:', error);
            toast({ title: '❌ خطأ', variant: 'destructive' });
        }
    };

    // Get shortcuts by placement
    const getByPlacement = (placement: ActionPlacement) =>
        shortcuts.filter(s => s.placement === placement && !s.parent_folder_id);

    return {
        // Shortcuts
        shortcuts,
        isLoading,
        isSyncing,
        addShortcut,
        updateShortcut,
        deleteShortcut,
        reorderShortcuts,
        getByPlacement,
        quickAccessShortcuts: getByPlacement('quick_access'),
        gridShortcuts: getByPlacement('shortcuts_grid'),

        // Folders
        folders: getFolders(),
        rootShortcuts: getRootShortcuts(),
        getShortcutsInFolder,
        createFolder,
        moveToFolder,

        // Presets
        presets,
        savePreset,
        restorePreset,
        deletePreset,

        // Sync
        refresh: fetchShortcuts,
        forceSync
    };
};
