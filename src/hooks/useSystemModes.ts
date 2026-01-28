
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ModeItem {
    id: string;
    text: string;
    type: 'task' | 'appointment' | 'habit' | 'medication';
    time: string | null;
    repeat: 'daily' | 'weekly' | 'monthly' | 'custom' | 'once';
    customDays: Record<string, string> | null;
    category: string;
    startDate: string | null;
    endDate: string | null;
    dayOfMonth: number | null;
}

export interface CustomAction {
    id: string;
    trigger: 'on_start' | 'on_end';
    action: 'send_whatsapp' | 'show_notification' | 'play_sound';
    params: Record<string, any>;
}

export interface SystemMode {
    id: string;
    user_id: string;
    name: string;
    icon: string;
    color: string;
    is_active: boolean;
    auto_activate: boolean;
    start_time: string | null;
    end_time: string | null;
    recurrence: string;
    mode_items: ModeItem[];
    shortcut_ids: string[];
    location_ids: string[];
    custom_actions: CustomAction[];
    fab_settings?: {
        visible: boolean;
        custom_actions?: { id: string; actionId: string; order: number }[];
    };
    created_at: string;
    updated_at: string;
}

export const useSystemModes = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // 1. Fetch all modes
    const { data: modes = [], isLoading } = useQuery({
        queryKey: ['system_modes'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('system_modes')
                .select('*')
                .order('created_at');

            if (error) {
                console.error('Error fetching system modes:', error);
                throw error;
            }
            return data as SystemMode[];
        },
    });

    const executeCustomAction = async (action: CustomAction) => {
        console.log('Running system mode action:', action);

        switch (action.action) {
            case 'show_notification':
                toast({
                    title: 'تنبيه النظام',
                    description: action.params?.message || 'تم تفعيل إجراء مخصص'
                });
                break;
            case 'send_whatsapp':
                const phone = action.params?.phone || '';
                const message = encodeURIComponent(action.params?.message || 'تم تفعيل وضع جديد');
                if (phone) {
                    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
                } else {
                    // Fallback to just opening whatsapp if no phone
                    window.open(`https://wa.me/?text=${message}`, '_blank');
                }
                break;
            case 'play_sound':
                // Optional
                break;
            default:
                break;
        }
    };

    // 2. Create Mode
    const createModeMut = useMutation({
        mutationFn: async (mode: Partial<SystemMode>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('system_modes')
                .insert([{
                    ...mode,
                    user_id: user.id
                }])
                .select()
                .single();

            if (error) {
                console.error('Supabase create error in useSystemModes:', error);
                throw error;
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system_modes'] });
            toast({ title: '✅ تم إنشاء الوضع الجديد' });
        },
    });

    // 3. Update Mode
    const updateModeMut = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<SystemMode> }) => {
            const { error } = await supabase
                .from('system_modes')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system_modes'] });
        },
    });

    // 4. Delete Mode
    const deleteModeMut = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('system_modes')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system_modes'] });
            toast({ title: '🗑️ تم حذف الوضع' });
        },
    });

    // 5. Toggle Mode Activation
    const toggleModeMut = useMutation({
        mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
            // Update mode status
            const { error } = await supabase
                .from('system_modes')
                .update({ is_active: active })
                .eq('id', id);

            if (error) throw error;

            // Handle Custom Actions
            const currentMode = modes.find(m => m.id === id);
            if (currentMode && currentMode.custom_actions) {
                const triggerType = active ? 'on_start' : 'on_end';
                const actionsToRun = currentMode.custom_actions.filter(a => a.trigger === triggerType);

                for (const action of actionsToRun) {
                    await executeCustomAction(action);
                }
            }

            // Log activation
            if (active) {
                const { data: { user } } = await supabase.auth.getUser();
                await supabase.from('mode_activation_logs').insert({
                    mode_id: id,
                    user_id: user?.id,
                    status: 'active'
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system_modes'] });
            toast({ title: '🔄 تم تحديث حالة الوضع' });
        },
    });

    return {
        modes,
        isLoading,
        createMode: createModeMut.mutateAsync,
        updateMode: updateModeMut.mutateAsync,
        deleteMode: deleteModeMut.mutateAsync,
        toggleMode: toggleModeMut.mutateAsync,
    };
};
