import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TABLES } from '@/lib/tableNames';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';

export const useDashboardData = () => {
    const [financeData, setFinanceData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [nextPrayer, setNextPrayer] = useState<any>(null);
    const [stats, setStats] = useState({
        appointmentsCount: 0,
        savedLocationsCount: 0,
        prayerSource: '',
        nextPrayer: ''
    });
    const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
    const [shoppingListSummary, setShoppingListSummary] = useState<any[]>([]);
    const [savedLocations, setSavedLocations] = useState<any[]>([]);

    const { prayerTimes, nextPrayer: hookNextPrayer, timeUntilNext } = usePrayerTimes();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch Finance
            const { data: finance } = await supabase
                .from('finance_data_2025_12_18_18_42')
                .select('*')
                .eq('user_id', user.id)
                .single();
            setFinanceData(finance || {});

            // 2. Fetch Shopping List & Locations
            const { data: logistics } = await supabase
                .from(TABLES.logistics)
                .select('shopping_list, locations')
                .eq('user_id', user.id)
                .single();

            if (logistics?.shopping_list) {
                setShoppingListSummary(logistics.shopping_list.filter((i: any) => !i.completed).slice(0, 10));
            }
            if (logistics?.locations) {
                const locs = Array.isArray(logistics.locations) ? logistics.locations as any[] : [];
                setSavedLocations(locs.slice(0, 5));
            }

            // 3. Fetch Appointments
            const { data: apts, count: aptCount } = await supabase
                .from('appointments')
                .select('*', { count: 'exact' })
                .eq('user_id', user.id)
                .eq('is_completed', false)
                .order('date', { ascending: true })
                .limit(5);

            setRecentAppointments(apts || []);

            // 4. Fetch Prayer Settings
            const { data: prayerSettings } = await supabase
                .from('prayer_settings')
                .select('source')
                .eq('user_id', user.id)
                .single();

            setStats({
                appointmentsCount: aptCount || 0,
                savedLocationsCount: logistics?.locations ? (Array.isArray(logistics.locations) ? logistics.locations.length : 0) : 0,
                prayerSource: prayerSettings?.source || 'غير محدد',
                nextPrayer: '--:--'
            });

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    return {
        financeData,
        loading,
        recentAppointments,
        shoppingListSummary,
        savedLocations,
        stats,
        prayerTimes,
        nextPrayer: hookNextPrayer,
        timeUntilNext,
        refetch: fetchDashboardData
    };
};
