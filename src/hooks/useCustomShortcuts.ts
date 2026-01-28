import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { CustomShortcut, NewCustomShortcut, ActionPlacement, ShortcutPreset } from '@/types/shortcuts';

export const useCustomShortcuts = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // 1. Fetch Shortcuts with Caching
    const { data: shortcuts = [], isLoading, refetch: refetchShortcuts, isRefetching: isSyncingShortcuts } = useQuery({
        queryKey: ['custom_shortcuts'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('custom_shortcuts')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .order('order_index', { ascending: true });

            if (error) throw error;
            return data as CustomShortcut[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
        refetchOnWindowFocus: false,
    });

    // 2. Fetch Presets with Caching
    const { data: presets = [], refetch: refetchPresets, isRefetching: isSyncingPresets } = useQuery({
        queryKey: ['shortcut_presets'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('user_shortcut_presets')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as ShortcutPreset[];
        },
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
    });

    const isSyncing = isSyncingShortcuts || isSyncingPresets;

    const forceSync = async () => {
        try {
            await Promise.all([refetchShortcuts(), refetchPresets()]);
            toast({ title: '🔄 تم المزامنة', description: 'تم تحديث البيانات بنجاح' });
        } catch (error) {
            toast({ title: '❌ فشل المزامنة', variant: 'destructive' });
        }
    };

    // 3. Mutations

    // Add Shortcut
    const addShortcutMut = useMutation({
        mutationFn: async (shortcut: NewCustomShortcut) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('custom_shortcuts')
                .insert({ ...shortcut, user_id: user.id })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['custom_shortcuts'] });
            toast({ title: '✅ تم الحفظ', description: 'تم إنشاء الاختصار بنجاح' });
        },
        onError: () => {
            toast({ title: '❌ خطأ', description: 'فشل في حفظ الاختصار', variant: 'destructive' });
        }
    });

    // Update Shortcut
    const updateShortcutMut = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<CustomShortcut> }) => {
            const { error } = await supabase
                .from('custom_shortcuts')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['custom_shortcuts'] });
            toast({ title: '✅ تم التحديث' });
        },
        onError: () => {
            toast({ title: '❌ خطأ', description: 'فشل في التحديث', variant: 'destructive' });
        }
    });

    // Delete Shortcut
    const deleteShortcutMut = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('custom_shortcuts')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['custom_shortcuts'] });
            toast({ title: '🗑️ تم الحذف' });
        },
        onError: () => {
            toast({ title: '❌ خطأ', description: 'فشل في الحذف', variant: 'destructive' });
        }
    });

    // Reorder Shortcuts
    const reorderShortcuts = async (reorderedIds: string[]) => {
        // Optimistic update setup could be complex, for now we just invalidate after
        // To implement true optimistic UI, we'd use onMutate.
        // For now, simpler implementation:
        try {
            const updates = reorderedIds.map((id, index) =>
                supabase.from('custom_shortcuts').update({ order_index: index }).eq('id', id)
            );
            await Promise.all(updates);
            queryClient.invalidateQueries({ queryKey: ['custom_shortcuts'] });
        } catch (error) {
            console.error('Error reordering:', error);
        }
    };

    // Save Preset
    const savePresetMut = useMutation({
        mutationFn: async ({ name, description }: { name: string; description?: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('user_shortcut_presets')
                .insert({
                    user_id: user.id,
                    preset_name: name,
                    preset_description: description,
                    shortcuts_config: shortcuts // Use current shortcuts from closure? No, explicitly pass or use from data
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['shortcut_presets'] });
            toast({ title: '💾 تم الحفظ', description: `تم حفظ الوضع "${data.preset_name}"` });
        },
        onError: () => {
            toast({ title: '❌ خطأ', description: 'فشل في حفظ الوضع', variant: 'destructive' });
        }
    });

    // Restore Preset
    const restorePresetMut = useMutation({
        mutationFn: async (presetId: string) => {
            const preset = presets.find(p => p.id === presetId);
            if (!preset) throw new Error('Preset not found');

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Delete current
            await supabase.from('custom_shortcuts').delete().eq('user_id', user.id);

            // Insert new
            const newShortcuts = preset.shortcuts_config.map(s => ({
                ...s,
                id: undefined,
                user_id: user.id
            }));

            const { error } = await supabase.from('custom_shortcuts').insert(newShortcuts);
            if (error) throw error;

            return preset.preset_name;
        },
        onSuccess: (name) => {
            queryClient.invalidateQueries({ queryKey: ['custom_shortcuts'] });
            toast({ title: '✅ تم الاستعادة', description: `تم تطبيق الوضع "${name}"` });
        },
        onError: () => {
            toast({ title: '❌ خطأ', description: 'فشل في استعادة الوضع', variant: 'destructive' });
        }
    });

    // Delete Preset
    const deletePresetMut = useMutation({
        mutationFn: async (presetId: string) => {
            const { error } = await supabase
                .from('user_shortcut_presets')
                .delete()
                .eq('id', presetId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shortcut_presets'] });
            toast({ title: '🗑️ تم الحذف' });
        },
        onError: () => {
            toast({ title: '❌ خطأ', variant: 'destructive' });
        }
    });


    // === FOLDER HELPERS (Derived from data) ===
    const getRootShortcuts = () => shortcuts.filter(s => !s.parent_folder_id && !s.is_folder);
    const getFolders = () => shortcuts.filter(s => s.is_folder);
    const getShortcutsInFolder = (folderId: string) => shortcuts.filter(s => s.parent_folder_id === folderId);

    const getByPlacement = (placement: ActionPlacement) =>
        shortcuts.filter(s => s.placement === placement && !s.parent_folder_id);

    return {
        // Shortcuts
        shortcuts,
        isLoading,
        isSyncing,
        addShortcut: addShortcutMut.mutateAsync,
        updateShortcut: (id: string, updates: Partial<CustomShortcut>) => updateShortcutMut.mutateAsync({ id, updates }),
        deleteShortcut: (id: string, skipConfirm = false) => {
            if (!skipConfirm && !confirm('هل أنت متأكد من حذف هذا الاختصار؟')) return Promise.resolve();
            return deleteShortcutMut.mutateAsync(id);
        },
        reorderShortcuts,
        getByPlacement,
        quickAccessShortcuts: getByPlacement('quick_access'),
        gridShortcuts: getByPlacement('shortcuts_grid'),

        // Folders
        folders: getFolders(),
        rootShortcuts: getRootShortcuts(),
        getShortcutsInFolder,
        createFolder: async (name: string, color: string = 'gray') => {
            return addShortcutMut.mutateAsync({
                custom_name: name,
                custom_icon: 'Folder',
                icon_color: color,
                shortcut_type: 'folder',
                is_folder: true,
                folder_color: color,
                placement: 'shortcuts_grid',
                order_index: shortcuts.length
            });
        },
        moveToFolder: (shortcutId: string, folderId: string | null) => updateShortcutMut.mutateAsync({ id: shortcutId, updates: { parent_folder_id: folderId } }),

        // Presets
        presets,
        savePreset: (name: string, description?: string) => savePresetMut.mutateAsync({ name, description }),
        restorePreset: (presetId: string) => {
            if (!confirm('سيتم استبدال الاختصارات الحالية بالوضع المحفوظ. هل تريد المتابعة؟')) return Promise.resolve();
            return restorePresetMut.mutateAsync(presetId);
        },
        deletePreset: (presetId: string) => {
            if (!confirm('هل أنت متأكد من حذف هذا الوضع المحفوظ؟')) return Promise.resolve();
            return deletePresetMut.mutateAsync(presetId);
        },

        // Sync
        refresh: forceSync,
        forceSync
    };
};
