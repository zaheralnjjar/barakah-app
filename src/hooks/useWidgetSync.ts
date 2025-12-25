import { useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';
import { useTasks } from './useTasks';
import { useAppointments } from './useAppointments';
import { useHabits } from './useHabits';
import { usePrayerTimes } from './usePrayerTimes';
import { useMedications } from './useMedications';
import { supabase } from '@/integrations/supabase/client';

export const useWidgetSync = () => {
    const { tasks } = useTasks();
    const { appointments } = useAppointments();
    const { habits } = useHabits();
    const { prayerTimes } = usePrayerTimes();
    const { medications } = useMedications();

    const syncToPreferences = async () => {
        try {
            // 1. Prayers
            const formattedPrayers = prayerTimes.map(p => ({
                name: p.nameAr || p.name,
                time: p.time.replace(' (WT)', '')
            }));
            await Preferences.set({ key: 'widget_prayers', value: JSON.stringify(formattedPrayers) });

            // 2. Tasks
            const formattedTasks = tasks.map(t => ({ id: t.id, title: t.title }));
            await Preferences.set({ key: 'widget_tasks', value: JSON.stringify(formattedTasks) });

            // 3. Habits
            const formattedHabits = habits.map(h => ({ id: h.id, title: h.name }));
            await Preferences.set({ key: 'widget_habits', value: JSON.stringify(formattedHabits) });

            // 4. Appointments
            const formattedAppointments = appointments.map(a => ({ title: a.title, date: a.date, time: a.time }));
            await Preferences.set({ key: 'widget_appointments', value: JSON.stringify(formattedAppointments) });

            // 5. Shopping
            // Read from localStorage primarily
            try {
                const savedShopping = localStorage.getItem('baraka_shopping_list');
                const shoppingList = savedShopping ? JSON.parse(savedShopping) : [];
                // Filter only uncompleted items for the widget
                const activeShopping = shoppingList.filter((i: any) => !i.completed).map((i: any) => ({ name: i.text, quantity: i.quantity }));
                await Preferences.set({ key: 'widget_shopping', value: JSON.stringify(activeShopping) });
            } catch (e) {
                await Preferences.set({ key: 'widget_shopping', value: "[]" });
            }

            // 6. Finance
            // Fetch from Supabase if user is logged in
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: financeData } = await supabase
                    .from('finance_data_2025_12_18_18_42')
                    .select('current_balance, total_debts')
                    .eq('user_id', user.id)
                    .single();

                if (financeData) {
                    const financeObj = {
                        balance: financeData.current_balance?.toString() || "0",
                        debt: financeData.total_debts?.toString() || "0"
                    };
                    await Preferences.set({ key: 'widget_finance', value: JSON.stringify(financeObj) });
                }
            } else {
                // Fallback to simpler local check if available, or 0
                // Maybe use recurring expenses hook data? For now 0 is safe.
            }

            // 7. Meds
            const activeMeds = medications.filter(m => m.isPermanent || new Date(m.endDate) >= new Date())
                .map(m => ({ name: m.name, time: m.time }));
            await Preferences.set({ key: 'widget_meds', value: JSON.stringify(activeMeds) });

            console.log('Widget data synced details successfully');
        } catch (error) {
            console.error('Error syncing widget data:', error);
        }
    };

    useEffect(() => {
        // Sync on change of key data
        const timeout = setTimeout(syncToPreferences, 3000); // Debounce 3s
        return () => clearTimeout(timeout);
    }, [tasks, appointments, habits, prayerTimes, medications]);

    return { syncToPreferences };
};
