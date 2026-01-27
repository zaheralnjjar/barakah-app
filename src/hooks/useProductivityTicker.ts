import { useState, useEffect } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { useMedications } from '@/hooks/useMedications';
import { useHabits } from '@/hooks/useHabits';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { format } from 'date-fns';

export type TickerItem = {
    id: string;
    type: 'prayer' | 'task' | 'appointment' | 'medication' | 'habit' | 'goal';
    title: string;
    subtitle?: string;
    time?: string;
    priority?: 'high' | 'medium' | 'low';
};

export const useProductivityTicker = () => {
    const [currentItem, setCurrentItem] = useState<TickerItem | null>(null);
    const [allItems, setAllItems] = useState<TickerItem[]>([]);

    // Hooks
    const { tasks } = useTasks();
    const { appointments } = useAppointments();
    const { medications } = useMedications();
    const { habits } = useHabits();
    const { nextPrayer } = usePrayerTimes();

    useEffect(() => {
        const buildItems = () => {
            const items: TickerItem[] = [];
            const now = new Date();
            const todayStr = format(now, 'yyyy-MM-dd');
            const nowTime = now.getHours() * 60 + now.getMinutes();

            // 1. Next Prayer
            if (nextPrayer) {
                items.push({
                    id: 'next-prayer',
                    type: 'prayer',
                    title: `صلاة ${nextPrayer.nameAr || nextPrayer.name}`,
                    subtitle: 'الصلاة القادمة',
                    time: nextPrayer.time
                });
            }

            // 2. Today's Appointments (Future only)
            const todayAppointments = appointments.filter(a => {
                if (a.date !== todayStr) return false;
                const [h, m] = a.time.split(':').map(Number);
                const appTime = h * 60 + m;
                return appTime > nowTime;
            });

            todayAppointments.forEach(app => {
                items.push({
                    id: `app-${app.id}`,
                    type: 'appointment',
                    title: app.title,
                    subtitle: app.location || 'موعد',
                    time: app.time
                });
            });

            // 3. Urgent Tasks (Incomplete)
            const urgentTasks = tasks.filter(t => t.progress < 100 && (t.priority === 'high' || t.deadline === todayStr));
            urgentTasks.slice(0, 3).forEach(task => {
                items.push({
                    id: `task-${task.id}`,
                    type: 'task',
                    title: task.title,
                    subtitle: 'مهمة عاجلة',
                    priority: 'high'
                });
            });

            // 4. Medications (Cast to any to bypass type checks for now)
            medications.slice(0, 2).forEach((med: any) => {
                items.push({
                    id: `med-${med.id}`,
                    type: 'medication',
                    title: `دواء: ${med.name}`,
                    subtitle: med.time || 'اليوم',
                    time: med.time
                });
            });

            // 5. Habits
            if (habits && habits.length > 0) {
                const activeHabits = habits.filter((h: any) => !h.archived); // Assuming archived exists, or just show all
                if (activeHabits.length > 0) {
                    items.push({
                        id: `habit-summary`,
                        type: 'habit',
                        title: `${activeHabits.length} عادات`,
                        subtitle: 'استمر في التقدم!'
                    });
                }
            }

            return items;
        };

        setAllItems(buildItems());
    }, [tasks, appointments, medications, habits, nextPrayer]);

    // Rotation
    useEffect(() => {
        if (allItems.length === 0) {
            setCurrentItem(null);
            return;
        }

        let index = 0;
        setCurrentItem(allItems[0]);

        const interval = setInterval(() => {
            index = (index + 1) % allItems.length;
            setCurrentItem(allItems[index]);
        }, 3000);

        return () => clearInterval(interval);
    }, [allItems]);

    return { currentItem, allItems };
};
