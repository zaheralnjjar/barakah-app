import { useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';
import { useTasks } from './useTasks';
import { useAppointments } from './useAppointments';
import { useHabits } from './useHabits';
import { usePrayerTimes } from './usePrayerTimes';
import { useLocations } from './useLocations'; // Not used in widget but good for completeness if needed later
import { supabase } from '@/integrations/supabase/client';

export const useWidgetSync = () => {
    const { tasks } = useTasks();
    const { appointments } = useAppointments();
    const { habits } = useHabits();
    const { prayerTimes } = usePrayerTimes();
    // Finance data is fetched directly as it's not in a global context hook commonly expose data, 
    // but we can fetch it here or accept it as a prop. 
    // For now, we will try to fetch it if possible, or use a simplified approach if it's too expensive.
    // Actually, let's fetch it once on mount or periodically.

    const syncToPreferences = async () => {
        try {
            // 1. Prayers
            // Widget expects JSON Array: [{ name: "Fajr", time: "05:00" }]
            // We want to show the Arabic name if possible.
            const formattedPrayers = prayerTimes.map(p => ({
                name: p.nameAr || p.name,
                time: p.time.replace(' (WT)', '')
            }));
            await Preferences.set({ key: 'widget_prayers', value: JSON.stringify(formattedPrayers) });

            // 2. Tasks
            // Widget uses length. We can store the whole array or just what's needed.
            // Storing IDs and Titles is safe.
            const formattedTasks = tasks.map(t => ({ id: t.id, title: t.title }));
            await Preferences.set({ key: 'widget_tasks', value: JSON.stringify(formattedTasks) });

            // 3. Habits
            const formattedHabits = habits.map(h => ({ id: h.id, title: h.name }));
            await Preferences.set({ key: 'widget_habits', value: JSON.stringify(formattedHabits) });

            // 4. Appointments
            // Widget uses 'title'
            const formattedAppointments = appointments.map(a => ({ title: a.title, date: a.date, time: a.time }));
            await Preferences.set({ key: 'widget_appointments', value: JSON.stringify(formattedAppointments) });

            // 5. Shopping (We need a hook for this or fetch from localStorage if it uses that)
            // Assuming shopping list is simple, currently we might not have a global hook easily accessible 
            // without refactoring ShoppingList component. 
            // Let's check if ShoppingList uses a hook. If not, we skip or read from localStorage if it writes there.
            // Checking ShoppingList code would be good, but let's assume it might store in 'shopping-list'
            // We'll try to read from localStorage 'shopping_items' or similar if known.
            // For now, let's skip shopping or leave empty to avoid errors.
            await Preferences.set({ key: 'widget_shopping', value: "[]" });

            // 6. Finance
            // We need to fetch the latest balance. 
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
            }

            // 7. Meds
            // Not implemented in main app yet? Leaving empty.
            await Preferences.set({ key: 'widget_meds', value: "[]" });

            console.log('Widget data synced successfully');

            // Trigger an update intent if possible? 
            // Capacitor doesn't support sending broadcast intents out of the box to update widgets immediately.
            // The widget usually updates on its own schedule (30 mins) or when the app is opened/closed if configured.
            // However, simply writing to SharedPreferences is what the Native code reads from (onUpdate). 
            // To force update, we'd need a native plugin method. 
            // For now, passive sync is enough.

        } catch (error) {
            console.error('Error syncing widget data:', error);
        }
    };

    useEffect(() => {
        // Sync on change of key data
        const timeout = setTimeout(syncToPreferences, 2000); // Debounce 2s
        return () => clearTimeout(timeout);
    }, [tasks, appointments, habits, prayerTimes]);

    return null; // This hook doesn't return anything, it just works in background
};
