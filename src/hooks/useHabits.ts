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

import { supabase } from '@/integrations/supabase/client';

export const useHabits = () => {
    const [habits, setHabits] = useState<Habit[]>([]);
    const { toast } = useToast();

    // Fetch Habits & Logs
    const fetchHabits = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // 1. Get Habits
                const { data: habitsData, error: habitsError } = await supabase
                    .from('habits')
                    .select('*')
                    .order('created_at', { ascending: true });

                if (habitsError) throw habitsError;

                if (habitsData) {
                    // 2. Get Logs (last 90 days for client-side streak/grid)
                    const { data: logsData } = await supabase
                        .from('habit_logs')
                        .select('*')
                        .gte('date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

                    const mappedHabits: Habit[] = habitsData.map((h: any) => {
                        const history: Record<string, boolean | number> = {};
                        logsData?.filter((l: any) => l.habit_id === h.id).forEach((l: any) => {
                            history[l.date] = l.completed ? true : l.count;
                        });

                        return {
                            id: h.id,
                            name: h.name,
                            frequency: h.frequency as any,
                            customDays: h.custom_days || [],
                            timesPerDay: h.times_per_day || 1,
                            streak: h.streak || 0,
                            history: history,
                            timesCompleted: {} // reset daily counter
                        };
                    });
                    setHabits(mappedHabits);
                    localStorage.setItem('baraka_habits', JSON.stringify(mappedHabits));
                }
            } else {
                const saved = localStorage.getItem('baraka_habits');
                if (saved) setHabits(JSON.parse(saved));
            }
        } catch (e) {
            console.error("Error fetching habits", e);
        }
    };

    useEffect(() => {
        fetchHabits();
    }, []);

    const addHabit = async (
        name: string,
        frequency: 'daily' | 'weekly' | 'monthly' | 'specific_days' = 'daily',
        customDays: string[] = [],
        timesPerDay: number = 1
    ) => {
        if (!name.trim()) return;

        const newHabitLoc: Habit = {
            id: crypto.randomUUID(),
            name,
            streak: 0,
            history: {},
            frequency,
            customDays,
            timesPerDay,
            timesCompleted: {}
        };

        // Optimistic
        setHabits(prev => [...prev, newHabitLoc]);

        // Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data, error } = await supabase.from('habits').insert({
                id: newHabitLoc.id,
                user_id: user.id,
                name,
                frequency,
                custom_days: customDays,
                times_per_day: timesPerDay,
                streak: 0
            });
            if (error) {
                toast({ title: "خطأ", description: "فشل حفظ العادة في السحابة", variant: "destructive" });
            } else {
                toast({ title: 'تم إضافة العادة' });
            }
        }
    };

    const updateHabit = async (id: string, updates: Partial<Pick<Habit, 'name' | 'frequency' | 'customDays' | 'timesPerDay'>>) => {
        setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const dbUpdates: any = {};
            if (updates.name) dbUpdates.name = updates.name;
            if (updates.frequency) dbUpdates.frequency = updates.frequency;
            if (updates.customDays) dbUpdates.custom_days = updates.customDays;
            if (updates.timesPerDay) dbUpdates.times_per_day = updates.timesPerDay;

            await supabase.from('habits').update(dbUpdates).eq('id', id);
            toast({ title: 'تم تحديث العادة' });
        }
    };

    const toggleHabit = async (id: string) => {
        const today = new Date().toISOString().split('T')[0];
        let newStreak = 0;
        let isCompleted = false;

        // 1. Update Local State
        setHabits(prev => prev.map(h => {
            if (h.id === id) {
                const history = h.history || {};
                const wasCompleted = !!history[today];
                const newHistory = { ...history, [today]: !wasCompleted };
                isCompleted = !wasCompleted;

                // Simple Streak Calc (Approximation)
                newStreak = h.streak;
                if (isCompleted) newStreak += 1;
                else newStreak = Math.max(0, newStreak - 1);

                return { ...h, history: newHistory, streak: newStreak };
            }
            return h;
        }));

        // 2. Update Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            if (isCompleted) {
                // Insert log
                await supabase.from('habit_logs').upsert({
                    habit_id: id,
                    user_id: user.id,
                    date: today,
                    completed: true,
                    count: 1
                }, { onConflict: 'habit_id, date' });
            } else {
                // Remove log
                await supabase.from('habit_logs').delete().match({ habit_id: id, date: today });
            }

            // Update Streak in Habit
            await supabase.from('habits').update({ streak: newStreak }).eq('id', id);
        }
    };

    const deleteHabit = async (id: string) => {
        setHabits(prev => prev.filter(h => h.id !== id));
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('habits').delete().eq('id', id);
            toast({ title: 'تم الحذف' });
        }
    };

    // Subtasks not fully migrated yet in DB schema, keeping local state logic if needed or removing if unused
    // Since migration file had no subtasks, we assume habits are simple for now or subtasks stored in `subtasks` JSON column?
    // Migration didn't add subtasks col. I'll omit subtask DB sync for now or suggest adding JSON column. 
    // To match previous functionality, I should allow subtasks. I'll stick to local-only for subtasks or add a jsonb column 'subtasks' later.
    // For now, subtask functions will update local state but not persist to DB deeply.

    const addHabitSubtask = (habitId: string, title: string) => {
        // Implementation kept local for now
        setHabits(prev => prev.map(h => {
            if (h.id === habitId) {
                const newSubtask: HabitSubtask = {
                    id: `${Date.now()}`,
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

