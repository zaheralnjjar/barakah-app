import { Preferences } from '@capacitor/preferences';

/**
 * Syncs app data to SharedPreferences for Android Widget
 * Call this whenever data changes to keep widget updated
 */
export const syncWidgetData = async (data: {
    tasks?: any[];
    appointments?: any[];
    habits?: any[];
    medications?: any[];
    prayers?: any[];
    finance?: { balance: string; debt: string };
    shopping?: any[];
}) => {
    try {
        // Sync tasks
        if (data.tasks) {
            await Preferences.set({
                key: 'widget_tasks',
                value: JSON.stringify(data.tasks.slice(0, 5).map(t => ({
                    title: t.title,
                    progress: t.progress
                })))
            });
        }

        // Sync appointments
        if (data.appointments) {
            await Preferences.set({
                key: 'widget_appointments',
                value: JSON.stringify(data.appointments.slice(0, 3).map(a => ({
                    title: a.title,
                    time: a.time,
                    date: a.date
                })))
            });
        }

        // Sync habits
        if (data.habits) {
            await Preferences.set({
                key: 'widget_habits',
                value: JSON.stringify(data.habits.slice(0, 5).map(h => ({
                    name: h.name,
                    streak: h.streak
                })))
            });
        }

        // Sync medications
        if (data.medications) {
            await Preferences.set({
                key: 'widget_meds',
                value: JSON.stringify(data.medications.slice(0, 5).map(m => ({
                    name: m.name,
                    time: m.time
                })))
            });
        }

        // Sync prayers
        if (data.prayers) {
            await Preferences.set({
                key: 'widget_prayers',
                value: JSON.stringify(data.prayers.map(p => ({
                    name: p.name || p.nameAr,
                    time: p.time
                })))
            });
        }

        // Sync finance
        if (data.finance) {
            await Preferences.set({
                key: 'widget_finance',
                value: JSON.stringify(data.finance)
            });
        }

        // Sync shopping
        if (data.shopping) {
            await Preferences.set({
                key: 'widget_shopping',
                value: JSON.stringify(data.shopping.slice(0, 5).map(s => ({
                    name: s.name || s.item
                })))
            });
        }

        console.log('Widget data synced successfully');
    } catch (error) {
        console.error('Failed to sync widget data:', error);
    }
};
