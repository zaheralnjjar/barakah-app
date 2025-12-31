import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TABLES } from '@/lib/tableNames';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useFinance } from '@/hooks/useFinance';

export const useDashboardData = () => {
    const { financeData, dailyLimit, loading: financeLoading, refresh: refreshFinance } = useFinance();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        appointmentsCount: 0,
        savedLocationsCount: 0,
        prayerSource: '',
        nextPrayer: ''
    });
    const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
    const [shoppingListSummary, setShoppingListSummary] = useState<any>({ totalItems: 0, completedItems: 0, recentItems: [] });
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

            // Trigger finance refresh too
            refreshFinance();

            // Run other queries in parallel
            const [logisticsResult, appointmentsResult, prayerResult] = await Promise.all([
                // 1. Logistics (Shopping & Locations)
                supabase
                    .from(TABLES.logistics)
                    .select('shopping_list, locations')
                    .eq('user_id', user.id)
                    .single(),

                // 2. Appointments
                supabase
                    .from('appointments')
                    .select('*', { count: 'exact' })
                    .eq('user_id', user.id)
                    .eq('is_completed', false)
                    .order('date', { ascending: true })
                    .limit(5),

                // 3. Prayer Settings
                supabase
                    .from('prayer_settings')
                    .select('source')
                    .eq('user_id', user.id)
                    .single()
            ]);

            if (logisticsResult.data?.shopping_list) {
                const list = logisticsResult.data.shopping_list || [];
                setShoppingListSummary({
                    totalItems: list.length,
                    completedItems: list.filter((i: any) => i.completed).length,
                    recentItems: list.filter((i: any) => !i.completed).slice(0, 10)
                } as any);
            }
            if (logisticsResult.data?.locations) {
                const locs = Array.isArray(logisticsResult.data.locations) ? logisticsResult.data.locations as any[] : [];
                setSavedLocations(locs.slice(0, 5));
            }

            setRecentAppointments(appointmentsResult.data || []);

            setStats({
                appointmentsCount: appointmentsResult.count || 0,
                savedLocationsCount: logisticsResult.data?.locations ? (Array.isArray(logisticsResult.data.locations) ? logisticsResult.data.locations.length : 0) : 0,
                prayerSource: prayerResult.data?.source || 'غير محدد',
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
        // Calculate the 'available daily limit' by subtracting today's expenses
        // Note: financeData.daily_limit might be stored, but we use the live calculation 'dailyLimit' from hook
        dailyLimitARS: dailyLimit,
        loading: loading || financeLoading,
        recentAppointments,
        shoppingListSummary,
        savedLocations,
        stats,
        prayerTimes,
        nextPrayer: hookNextPrayer,
        timeUntilNext,
        exchangeRate: financeData?.exchange_rate,
        refetch: fetchDashboardData
    };
};
