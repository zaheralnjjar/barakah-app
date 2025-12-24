import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface HabitSubtask {
    id: string;
    title: string;
    completed: boolean;
}

export interface Habit {
    id: string;
    name: string;
    streak: number;
    history: Record<string, boolean | number>; // number for times completed
    frequency: 'daily' | 'weekly' | 'monthly' | 'specific_days';
    customDays: string[]; // e.g. ['السبت', 'الأحد', ...]
    timesPerDay?: number; // for daily habits that need multiple completions
    timesCompleted?: Record<string, number>; // times completed per day
    subtasks?: HabitSubtask[]; // subtasks for complex habits
}

export const useHabits = () => {
    const [habits, setHabits] = useState<Habit[]>(() => {
        try { return JSON.parse(localStorage.getItem('baraka_habits') || '[]'); } catch { return []; }
    });
    const { toast } = useToast();

    useEffect(() => {
        localStorage.setItem('baraka_habits', JSON.stringify(habits));
        window.dispatchEvent(new Event('habits-updated'));
    }, [habits]);

    useEffect(() => {
        const handleUpdates = () => {
            const current = localStorage.getItem('baraka_habits');
            if (current && current !== JSON.stringify(habits)) {
                try {
                    setHabits(JSON.parse(current));
                } catch (e) {
                    // ignore
                }
            }
        };
        window.addEventListener('habits-updated', handleUpdates);
        return () => window.removeEventListener('habits-updated', handleUpdates);
    }, [habits]);

    const addHabit = (
        name: string,
        frequency: 'daily' | 'weekly' | 'monthly' | 'specific_days' = 'daily',
        customDays: string[] = [],
        timesPerDay: number = 1
    ) => {
        if (!name.trim()) return;
        const newHabit: Habit = {
            id: Date.now().toString(),
            name,
            streak: 0,
            history: {},
            frequency,
            customDays,
            timesPerDay: frequency === 'daily' ? timesPerDay : 1,
            timesCompleted: {}
        };
        setHabits(prev => [...prev, newHabit]);
        toast({ title: 'تم إضافة العادة' });
    };

    const updateHabit = (id: string, updates: Partial<Pick<Habit, 'name' | 'frequency' | 'customDays' | 'timesPerDay'>>) => {
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

    // Subtask functions
    const addHabitSubtask = (habitId: string, title: string) => {
        if (!title.trim()) return;
        setHabits(prev => prev.map(h => {
            if (h.id === habitId) {
                const newSubtask: HabitSubtask = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    title,
                    completed: false
                };
                return { ...h, subtasks: [...(h.subtasks || []), newSubtask] };
            }
            return h;
        }));
    };

    const toggleHabitSubtask = (habitId: string, subtaskId: string) => {
        setHabits(prev => prev.map(h => {
            if (h.id === habitId) {
                const subtasks = (h.subtasks || []).map(s =>
                    s.id === subtaskId ? { ...s, completed: !s.completed } : s
                );
                return { ...h, subtasks };
            }
            return h;
        }));
    };

    const deleteHabitSubtask = (habitId: string, subtaskId: string) => {
        setHabits(prev => prev.map(h => {
            if (h.id === habitId) {
                return { ...h, subtasks: (h.subtasks || []).filter(s => s.id !== subtaskId) };
            }
            return h;
        }));
    };

    return {
        habits,
        addHabit,
        updateHabit,
        toggleHabit,
        deleteHabit,
        addHabitSubtask,
        toggleHabitSubtask,
        deleteHabitSubtask
    };
};

