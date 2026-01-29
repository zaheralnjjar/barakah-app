import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FABButtonConfig {
    id: number;
    icon: string;
    tapAction: string;
    longPressAction: string;
    color: string;
}

export const useUserSettings = () => {
    const { toast } = useToast();
    const [dashboardOrder, setDashboardOrder] = useState<string[]>([]);
    const [fabConfig, setFabConfig] = useState<{ buttons: FABButtonConfig[] }>({
        buttons: [
            { id: 1, icon: "MapPin", tapAction: "save_location", longPressAction: "open_maps", color: "bg-green-500" },
            { id: 2, icon: "StickyNote", tapAction: "new_note", longPressAction: "voice_note", color: "bg-yellow-500" },
            { id: 3, icon: "AlertTriangle", tapAction: "log_distraction", longPressAction: "view_history", color: "bg-orange-500" },
            { id: 4, icon: "Calendar", tapAction: "new_appointment", longPressAction: "view_calendar", color: "bg-purple-500" }
        ]
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('user_settings')
                .select('dashboard_order, fab_config')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) throw error;
            if (data?.dashboard_order) {
                setDashboardOrder(data.dashboard_order as string[]);
            }
            if (data?.fab_config) {
                setFabConfig(data.fab_config as any);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveDashboardOrder = async (newOrder: string[]) => {
        setDashboardOrder(newOrder);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('user_settings')
                .upsert({
                    user_id: user.id,
                    dashboard_order: newOrder,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error saving dashboard order:', error);
            toast({ title: 'فشل حفظ الترتيب', variant: 'destructive' });
        }
    };

    const saveFabConfig = async (newConfig: { buttons: FABButtonConfig[] }) => {
        setFabConfig(newConfig);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('user_settings')
                .upsert({
                    user_id: user.id,
                    fab_config: newConfig,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            toast({ title: '✅ تم حفظ إعدادات الزر بنجاح' });
        } catch (error) {
            console.error('Error saving FAB config:', error);
            toast({ title: 'فشل حفظ إعدادات الزر', variant: 'destructive' });
        }
    };

    return {
        dashboardOrder,
        saveDashboardOrder,
        fabConfig,
        saveFabConfig,
        isLoading
    };
};
