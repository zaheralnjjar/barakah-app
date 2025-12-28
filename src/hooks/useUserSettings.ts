import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useUserSettings = () => {
    const { toast } = useToast();
    const [dashboardOrder, setDashboardOrder] = useState<string[]>([]);
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
                .select('dashboard_order')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) throw error;
            if (data?.dashboard_order) {
                setDashboardOrder(data.dashboard_order as string[]);
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
            // Removed toast to avoid spamming on drag
        } catch (error) {
            console.error('Error saving dashboard order:', error);
            toast({ title: 'فشل حفظ الترتيب', variant: 'destructive' });
        }
    };

    return {
        dashboardOrder,
        saveDashboardOrder,
        isLoading
    };
};
