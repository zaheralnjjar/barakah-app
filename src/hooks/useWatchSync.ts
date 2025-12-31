import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFinance } from '@/hooks/useFinance';
import { useLocations } from '@/hooks/useLocations';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { registerPlugin } from '@capacitor/core';

// Define the plugin interface
interface WatchPlugin {
    sendMessage(options: { path: string; data: any }): Promise<void>;
}

const WatchPlugin = registerPlugin<WatchPlugin>('WatchPlugin');

export const useWatchSync = () => {
    const { toast } = useToast();
    const { addTransaction, financeData } = useFinance();
    const { saveLocation } = useLocations();
    const { prayerTimes, nextPrayer, timeUntilNext } = usePrayerTimes();
    const { tasks } = useTasks();
    const { appointments } = useAppointments();

    const sendToWatch = async (path: string, data: any) => {
        // ... (existing implementation)
        // ...

        // Auto-sync Productivity Data
        useEffect(() => {
            if (tasks || appointments) {
                const pendingTasks = tasks?.filter((t: any) => !t.completed).slice(0, 5) || [];
                const upcomingAppointments = appointments?.filter((a: any) => !a.is_completed).slice(0, 5) || [];

                sendToWatch('/barakah/productivity', {
                    tasks: pendingTasks.map((t: any) => ({
                        id: t.id,
                        title: t.title,
                        priority: t.priority
                    })),
                    appointments: upcomingAppointments.map((a: any) => ({
                        id: a.id,
                        title: a.title,
                        time: a.time,
                        date: a.date
                    }))
                });
            }
        }, [tasks, appointments, sendToWatch]);
        try {
            await WatchPlugin.sendMessage({
                path,
                data: JSON.stringify(data)
            });
            console.log('Sent to watch:', path, data);
        } catch (e) {
            console.error('Failed to send to watch:', e);
        }
    };

    // Auto-sync Finance Data
    useEffect(() => {
        if (financeData) {
            sendToWatch('/barakah/finance', {
                balance_ars: financeData.current_balance_ars,
                balance_usd: financeData.current_balance_usd,
                daily_limit: financeData.daily_limit, // or calculated daily limit
                total_debt: financeData.total_debt
            });
        }
    }, [financeData, sendToWatch]);

    // Auto-sync Prayer Times
    useEffect(() => {
        if (prayerTimes && nextPrayer) {
            sendToWatch('/barakah/prayers', {
                next_prayer: nextPrayer,
                time_remaining: timeUntilNext,
                times: prayerTimes
            });
        }
    }, [prayerTimes, nextPrayer, timeUntilNext, sendToWatch]);

    useEffect(() => {
        const handleWatchEvent = async (event: any) => {
            console.log('Received watch event:', event);
            // event.detail contains the JSON string we sent from Java: {"path": "...", "data": ...}
            try {
                const payload = typeof event.detail === 'string' ? JSON.parse(event.detail) : event.detail;
                const { path, data } = payload;

                // Parse inner data if it's a string (which it might be depending on how we constructed it in Java)
                const innerData = typeof data === 'string' ? JSON.parse(data) : data;

                switch (path) {
                    case '/barakah/action/add_transaction':
                        handleTransaction(innerData);
                        break;
                    case '/barakah/action/save_location':
                        handleLocation(innerData);
                        break;
                    case '/barakah/action/request_sync':
                        // TODO: Send full data back to watch
                        console.log('Watch requested sync');
                        break;
                    default:
                        console.log('Unknown watch path:', path);
                }
            } catch (e) {
                console.error('Error processing watch event', e);
            }
        };

        window.addEventListener('watch_event', handleWatchEvent);

        return () => {
            window.removeEventListener('watch_event', handleWatchEvent);
        };
    }, [addTransaction, saveLocation, toast]);

    const handleTransaction = async (data: any) => {
        try {
            await addTransaction({
                amount: data.amount,
                type: data.type || 'expense',
                description: data.description || 'من الساعة',
                category: 'أخرى', // Default category
                currency: 'ARS'
            });
            toast({ title: 'تمت المزامنة', description: `تم استلام مصروف: ${data.amount}` });
        } catch (e) {
            console.error('Sync transaction error', e);
        }
    };

    const handleLocation = async (data: any) => {
        try {
            // saveLocation(title, lat, lng, options)
            await saveLocation(
                data.name || 'موقع محفوظ',
                data.lat,
                data.lng,
                {
                    address: `${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`,
                    type: 'location'
                }
            );
            toast({ title: 'تمت المزامنة', description: 'تم حفظ الموقع من الساعة' });
        } catch (e) {
            console.error('Sync location error', e);
        }
    };

    return { sendToWatch };
};
