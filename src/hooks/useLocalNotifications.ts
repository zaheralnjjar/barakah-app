import { useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { usePrayerTimes } from './usePrayerTimes';
import { useAppointments } from './useAppointments';

export const useLocalNotifications = () => {
    const { prayerTimes } = usePrayerTimes();
    const { appointments } = useAppointments();

    // 1. Request Permissions on Mount
    useEffect(() => {
        const requestPermissions = async () => {
            try {
                const result = await LocalNotifications.requestPermissions();
                if (result.display !== 'granted') {
                    console.log('Notification permissions denied');
                }
            } catch (e) {
                console.error('Error requesting notification permissions:', e);
            }
        };
        requestPermissions();
    }, []);

    // 2. Schedule Notifications
    useEffect(() => {
        const scheduleNotifications = async () => {
            try {
                // Cancel all existing to avoid duplicates (naive approach, but safe for this scale)
                const pending = await LocalNotifications.getPending();
                if (pending.notifications.length > 0) {
                    await LocalNotifications.cancel(pending);
                }

                const notifications = [];
                let idCounter = 1;

                // A. Schedule Prayer Times (Today)
                // We only schedule future prayers for today.
                // Ideally we should schedule for next few days, but let's start with today.
                const now = new Date();

                prayerTimes.forEach(p => {
                    if (!p.time.includes(':')) return;

                    // Parse time 'HH:MM'
                    const [hours, minutes] = p.time.replace(' (WT)', '').split(':').map(Number);
                    const prayerDate = new Date();
                    prayerDate.setHours(hours, minutes, 0, 0);

                    // If time is in past, ignore
                    if (prayerDate <= now) return;

                    notifications.push({
                        id: idCounter++,
                        title: 'حان وقت الصلاة',
                        body: `حان الآن موعد صلاة ${p.nameAr}`,
                        schedule: { at: prayerDate },
                        sound: 'adhan.wav', // optional, system default if missing
                        smallIcon: 'ic_stat_icon_config_sample', // Android resource if exists, customizable
                        actionTypeId: '',
                        extra: null
                    });
                });

                // B. Schedule Appointments
                appointments.forEach(appt => {
                    const apptDate = new Date(`${appt.date}T${appt.time}`);
                    // Notify 15 mins before
                    const notifyTime = new Date(apptDate.getTime() - 15 * 60000);

                    if (notifyTime <= now) return;

                    notifications.push({
                        id: idCounter++,
                        title: 'تذكير بموعد',
                        body: `لديك موعد بعد 15 دقيقة: ${appt.title}`,
                        schedule: { at: notifyTime },
                    });
                });

                if (notifications.length > 0) {
                    await LocalNotifications.schedule({ notifications });
                    console.log(`Scheduled ${notifications.length} notifications`);
                }

            } catch (error) {
                console.error('Error scheduling notifications:', error);
            }
        };

        // Debounce scheduling
        const timeout = setTimeout(scheduleNotifications, 3000);
        return () => clearTimeout(timeout);

    }, [prayerTimes, appointments]);

    return null;
};
