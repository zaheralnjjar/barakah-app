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

    // Exchange Rate State (Auto Sync)
    const [exchangeRate, setExchangeRate] = useState<number | null>(null);

    const { prayerTimes, nextPrayer: hookNextPrayer, timeUntilNext } = usePrayerTimes();

    useEffect(() => {
        fetchDashboardData();
        fetchExchangeRate();
    }, []);

    const fetchExchangeRate = async () => {
        try {
            // Fetch USD to Local Currency (Assuming TRY for Barakah context based on previous logs, or generic)
            // Let's fetch USD -> TRY as a default example, or fetch base.
            const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await res.json();
            if (data && data.rates) {
                // If user wants specific currency, we should store that preference.
                // For now, I'll store the whole rates object or a specific one if I knew it.
                // Or just set a common one. Let's return the whole rates or specific 'TRY'.
                setExchangeRate(data.rates.TRY); // Defaulting to TRY based on project context (Turkish Timezone often used)
            }
        } catch (e) {
            console.error("Failed to sync exchange rate", e);
        }
    };

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Run all queries in parallel for faster loading
            const [financeResult, logisticsResult, appointmentsResult, prayerResult] = await Promise.all([
                // 1. Finance Data
                supabase
                    .from('finance_data_2025_12_18_18_42')
                    .select('*')
                    .eq('user_id', user.id)
                    .single(),

                // 2. Logistics (Shopping & Locations)
                supabase
                    .from(TABLES.logistics)
                    .select('shopping_list, locations')
                    .eq('user_id', user.id)
                    .single(),

                // 3. Appointments
                supabase
                    .from('appointments')
                    .select('*', { count: 'exact' })
                    .eq('user_id', user.id)
                    .eq('is_completed', false)
                    .order('date', { ascending: true })
                    .limit(5),

                // 4. Prayer Settings
                supabase
                    .from('prayer_settings')
                    .select('source')
                    .eq('user_id', user.id)
                    .single()
            ]);

            // Process results
            setFinanceData(financeResult.data || {});

            if (logisticsResult.data?.shopping_list) {
                setShoppingListSummary(logisticsResult.data.shopping_list.filter((i: any) => !i.completed).slice(0, 10));
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
        loading,
        recentAppointments,
        shoppingListSummary,
        savedLocations,
        stats,
        prayerTimes,
        nextPrayer: hookNextPrayer,
        timeUntilNext,
        exchangeRate, // Exposed new state
        refetch: fetchDashboardData
    };
};
