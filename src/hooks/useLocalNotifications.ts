import { useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { usePrayerTimes } from './usePrayerTimes';
import { useAppointments } from './useAppointments';
import { useTasks } from './useTasks';
import { useMedications } from './useMedications';
import { useRecurringExpenses } from './useRecurringExpenses';

export const useLocalNotifications = () => {
    const { prayerTimes } = usePrayerTimes();
    const { appointments } = useAppointments();
    const { tasks } = useTasks();
    const { medications } = useMedications();
    const { getUpcomingReminders } = useRecurringExpenses();

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
                // Cancel all existing to avoid duplicates
                const pending = await LocalNotifications.getPending();
                if (pending.notifications.length > 0) {
                    await LocalNotifications.cancel(pending);
                }

                const notifications: any[] = [];
                let idCounter = 1;
                const now = new Date();

                // A. Schedule Prayer Times (Today)
                prayerTimes.forEach(p => {
                    if (!p.time.includes(':')) return;
                    const [hours, minutes] = p.time.replace(' (WT)', '').split(':').map(Number);
                    const prayerDate = new Date();
                    prayerDate.setHours(hours, minutes, 0, 0);

                    if (prayerDate > now) {
                        notifications.push({
                            id: idCounter++,
                            title: 'حان وقت الصلاة',
                            body: `حان الآن موعد صلاة ${p.nameAr}`,
                            schedule: { at: prayerDate },
                            sound: 'adhan.wav',
                            channelId: 'prayers',
                        });
                    }
                });

                // B. Schedule Appointments (Today & Future)
                appointments.forEach(appt => {
                    const apptDate = new Date(`${appt.date}T${appt.time || '09:00'}`);
                    // Notify 30 mins before
                    const notifyTime = new Date(apptDate.getTime() - 30 * 60000);

                    if (notifyTime > now) {
                        notifications.push({
                            id: idCounter++,
                            title: 'تذكير بموعد 📅',
                            body: `لديك موعد بعد 30 دقيقة: ${appt.title}`,
                            schedule: { at: notifyTime },
                            channelId: 'appointments',
                        });
                    }
                });

                // C. Schedule Task Deadlines
                tasks.forEach(task => {
                    if (!task.deadline || task.progress === 100) return;

                    const deadlineDate = new Date(task.deadline);
                    // If deadline has specific time, use it, otherwise default to 9 AM
                    if (task.time) {
                        const [h, m] = task.time.split(':').map(Number);
                        deadlineDate.setHours(h, m, 0, 0);
                    } else {
                        deadlineDate.setHours(9, 0, 0, 0);
                    }

                    // Notify 1 hour before deadline
                    const notifyTime = new Date(deadlineDate.getTime() - 60 * 60000);

                    if (notifyTime > now) {
                        notifications.push({
                            id: idCounter++,
                            title: 'مهمة قادمة 📝',
                            body: `تذكير بموعد المهمة: ${task.title}`,
                            schedule: { at: notifyTime },
                            channelId: 'tasks',
                        });
                    }
                });

                // D. Schedule Medications (Today)
                const todayStr = now.toISOString().split('T')[0];
                const dayMap = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
                const todayDayName = dayMap[now.getDay()];

                medications.forEach(med => {
                    if (!med.reminder || !med.time) return;

                    const isTodayDue = med.frequency === 'daily' ||
                        (med.frequency === 'specific_days' && med.customDays?.includes(todayDayName));

                    if (isTodayDue) {
                        const [h, m] = med.time.split(':').map(Number);
                        const medDate = new Date();
                        medDate.setHours(h, m, 0, 0);

                        if (medDate > now && !med.takenHistory?.[todayStr]) {
                            notifications.push({
                                id: idCounter++,
                                title: 'وقت الدواء 💊',
                                body: `حان موعد تناول: ${med.name}`,
                                schedule: { at: medDate },
                                channelId: 'medications',
                            });
                        }
                    }
                });

                // E. Recurring Expenses
                try {
                    const expenses = getUpcomingReminders?.() || [];
                    expenses.forEach((exp: any) => {
                        // Notify at 10 AM on due date? Or now if close?
                        // Hook returns "dueDate" and "daysUntil"
                        // Let's assume we notify at 10 AM on the day causing the alert
                        // But simplify: just schedule for tomorrow morning if due soon
                        const notifyDate = new Date();
                        notifyDate.setHours(10, 0, 0, 0);
                        if (notifyDate <= now) notifyDate.setDate(notifyDate.getDate() + 1);

                        if (exp.daysUntil <= 3) {
                            notifications.push({
                                id: idCounter++,
                                title: 'دفعة مالية مستحقة 💰',
                                body: `تذكير: ${exp.name} بقيمة ${exp.amount} ${exp.currency} تستحق قريباً`,
                                schedule: { at: notifyDate },
                                channelId: 'finance',
                            });
                        }
                    });
                } catch (e) { }

                if (notifications.length > 0) {
                    await LocalNotifications.schedule({ notifications });
                    console.log(`Scheduled ${notifications.length} enhanced notifications`);
                }

            } catch (error) {
                console.error('Error scheduling notifications:', error);
            }
        };

        const timeout = setTimeout(scheduleNotifications, 5000); // 5s debounce
        return () => clearTimeout(timeout);

    }, [prayerTimes, appointments, tasks, medications, getUpcomingReminders]);

    return null;
};
