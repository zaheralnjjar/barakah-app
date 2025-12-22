import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Habit {
    id: string;
    name: string;
    streak: number;
    history: Record<string, boolean>;
    frequency: 'daily' | 'weekly' | 'specific_days';
    customDays: string[]; // e.g. ['السبت', 'الأحد', ...]
}

export const useHabits = () => {
    const [habits, setHabits] = useState<Habit[]>(() => {
        try { return JSON.parse(localStorage.getItem('baraka_habits') || '[]'); } catch { return []; }
    });
    const { toast } = useToast();

    useEffect(() => {
        localStorage.setItem('baraka_habits', JSON.stringify(habits));
    }, [habits]);

    const addHabit = (name: string, frequency: 'daily' | 'weekly' | 'specific_days' = 'daily', customDays: string[] = []) => {
        if (!name.trim()) return;
        const newHabit: Habit = {
            id: Date.now().toString(),
            name,
            streak: 0,
            history: {},
            frequency,
            customDays
        };
        setHabits(prev => [...prev, newHabit]);
        toast({ title: 'تم إضافة العادة' });
    };

    const updateHabit = (id: string, updates: Partial<Pick<Habit, 'name' | 'frequency' | 'customDays'>>) => {
        setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
        toast({ title: 'تم تحديث العادة' });
    };

    const toggleHabit = (id: string) => {
        const today = new Date().toISOString().split('T')[0];
        setHabits(prev => prev.map(h => {
            if (h.id === id) {
                const history = h.history || {};
                const completedToday = !!history[today];
                const newHistory = { ...history, [today]: !completedToday };

                // Recalculate streak
                let streak = 0;
                let d = new Date();
                // Simple streak: look back from today
                // Check today first? If completed today, streak is at least 1?
                // Logic derived from previous implementation:
                // Count consecutive days backwards.

                // If we toggled OFF today, streak might drop if today was the chain link.
                // If we toggled ON today, streak might increase.

                // Re-eval streak from scratch
                let checkDate = new Date();
                let currentStreak = 0;

                // Check today
                const todayStr = checkDate.toISOString().split('T')[0];
                if (newHistory[todayStr]) {
                    currentStreak++;
                }

                // Check yesterday backwards
                while (true) {
                    checkDate.setDate(checkDate.getDate() - 1);
                    const dStr = checkDate.toISOString().split('T')[0];
                    if (newHistory[dStr]) {
                        currentStreak++;
                    } else {
                        // Use original logic: if today isn't done, we might still have a streak from yesterday?
                        // But here we are just counting loose consecutive days including or excluding today?
                        // Let's stick to simple: Consecutive days ending today or yesterday.
                        if (dStr === todayStr && !newHistory[todayStr]) {
                            // skip today if checking backwards loop (impossible since loop starts yesterday)
                        } else {
                            break;
                        }
                    }
                }

                // A better streak approach:
                // If today is done, streak = 1 + yesterday streak.
                // If today is NOT done, streak = yesterday streak (provided yesterday was done).
                // Actually, let's just stick to the basic count:
                // Check if today is done?
                // If yes, count back. 
                // If no, check if yesterday is done? If yes, count back from yesterday.

                let loopDate = new Date();
                let loopDateStr = loopDate.toISOString().split('T')[0];

                let calculatedStreak = 0;
                if (newHistory[loopDateStr]) {
                    // Today is done
                } else {
                    // Today not done, check yesterday
                    loopDate.setDate(loopDate.getDate() - 1);
                    loopDateStr = loopDate.toISOString().split('T')[0];
                }

                while (newHistory[loopDateStr]) {
                    calculatedStreak++;
                    loopDate.setDate(loopDate.getDate() - 1);
                    loopDateStr = loopDate.toISOString().split('T')[0];
                }

                return { ...h, history: newHistory, streak: calculatedStreak };
            }
            return h;
        }));
    };

    const deleteHabit = (id: string) => {
        setHabits(prev => prev.filter(h => h.id !== id));
    };

    return {
        habits,
        addHabit,
        updateHabit,
        toggleHabit,
        deleteHabit
    };
};

