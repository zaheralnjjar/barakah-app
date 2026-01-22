import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface RecurringExpense {
    id: string;
    name: string;
    amount: number;
    currency: 'ARS' | 'USD';
    category: string;
    cycle: 'monthly' | 'yearly';
    dayOfMonth: number;
    monthOfYear?: number;
    isActive: boolean;
    lastProcessed?: string;
    nextDue?: string;
    reminderDays: number;
    notes?: string;
    createdAt: string;
}

const STORAGE_KEY = 'baraka_recurring_expenses';
const PROCESSED_KEY = 'baraka_recurring_processed';

export const useRecurringExpenses = () => {
    const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Fetch from Supabase
    const fetchExpenses = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // Fallback to localStorage
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) setRecurringExpenses(JSON.parse(saved));
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('recurring_expenses')
                .select('*')
                .order('next_due', { ascending: true });

            if (error) throw error;

            if (data) {
                const mapped: RecurringExpense[] = data.map((e: any) => ({
                    id: e.id,
                    name: e.name,
                    amount: parseFloat(e.amount) || 0,
                    currency: e.currency as 'ARS' | 'USD',
                    category: e.category || 'عام',
                    cycle: e.frequency === 'yearly' ? 'yearly' : 'monthly',
                    dayOfMonth: e.due_day || 1,
                    monthOfYear: e.due_day, // Simplified
                    isActive: e.is_active,
                    lastProcessed: e.last_processed,
                    nextDue: e.next_due,
                    reminderDays: 3,
                    notes: e.notes,
                    createdAt: e.created_at,
                }));
                setRecurringExpenses(mapped);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
            }
        } catch (error) {
            console.error('Error fetching recurring expenses:', error);
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) setRecurringExpenses(JSON.parse(saved));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchExpenses();

        // Realtime subscription
        const channel = supabase
            .channel('recurring_expenses_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'recurring_expenses' }, () => {
                fetchExpenses();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchExpenses]);

    // Calculate next due date
    const calculateNextDue = (expense: Omit<RecurringExpense, 'id' | 'createdAt' | 'isActive'>): string => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();

        if (expense.cycle === 'monthly') {
            let nextDate = new Date(year, month, expense.dayOfMonth);
            if (nextDate <= today) {
                nextDate = new Date(year, month + 1, expense.dayOfMonth);
            }
            return nextDate.toISOString().split('T')[0];
        } else {
            let nextDate = new Date(year, (expense.monthOfYear || 1) - 1, expense.dayOfMonth);
            if (nextDate <= today) {
                nextDate = new Date(year + 1, (expense.monthOfYear || 1) - 1, expense.dayOfMonth);
            }
            return nextDate.toISOString().split('T')[0];
        }
    };

    const addRecurringExpense = async (data: Omit<RecurringExpense, 'id' | 'createdAt' | 'isActive'>) => {
        const id = crypto.randomUUID();
        const nextDue = calculateNextDue(data);

        const newExpense: RecurringExpense = {
            ...data,
            id,
            isActive: true,
            nextDue,
            createdAt: new Date().toISOString(),
        };

        // Optimistic update
        setRecurringExpenses(prev => [...prev, newExpense]);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('recurring_expenses').insert({
                    id,
                    user_id: user.id,
                    name: data.name,
                    amount: data.amount,
                    currency: data.currency,
                    category: data.category,
                    frequency: data.cycle,
                    due_day: data.dayOfMonth,
                    is_active: true,
                    next_due: nextDue,
                    notes: data.notes,
                });
            }
            toast({ title: 'تم الإضافة', description: `تم إضافة "${data.name}" كمصروف متكرر` });
        } catch (error) {
            console.error('Error adding recurring expense:', error);
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...recurringExpenses, newExpense]));
        }

        return newExpense;
    };

    const updateRecurringExpense = async (id: string, updates: Partial<RecurringExpense>) => {
        setRecurringExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('recurring_expenses').update({
                    name: updates.name,
                    amount: updates.amount,
                    currency: updates.currency,
                    category: updates.category,
                    frequency: updates.cycle,
                    due_day: updates.dayOfMonth,
                    is_active: updates.isActive,
                    notes: updates.notes,
                }).eq('id', id);
            }
            toast({ title: 'تم التحديث' });
        } catch (error) {
            console.error('Error updating recurring expense:', error);
        }
    };

    const deleteRecurringExpense = async (id: string) => {
        setRecurringExpenses(prev => prev.filter(e => e.id !== id));

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('recurring_expenses').delete().eq('id', id);
            }
            toast({ title: 'تم الحذف' });
        } catch (error) {
            console.error('Error deleting recurring expense:', error);
        }
    };

    const toggleActive = async (id: string) => {
        const expense = recurringExpenses.find(e => e.id === id);
        if (!expense) return;

        const newActiveState = !expense.isActive;
        setRecurringExpenses(prev => prev.map(e => e.id === id ? { ...e, isActive: newActiveState } : e));

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('recurring_expenses').update({ is_active: newActiveState }).eq('id', id);
            }
        } catch (error) {
            console.error('Error toggling active:', error);
        }
    };

    // Check if due today
    const isDueToday = (expense: RecurringExpense): boolean => {
        if (!expense.isActive) return false;
        const today = new Date();
        const todayDay = today.getDate();
        const todayMonth = today.getMonth() + 1;

        if (expense.cycle === 'monthly') {
            return todayDay === expense.dayOfMonth;
        } else {
            return todayDay === expense.dayOfMonth && todayMonth === expense.monthOfYear;
        }
    };

    const wasProcessedToday = (expenseId: string): boolean => {
        try {
            const processed = JSON.parse(localStorage.getItem(PROCESSED_KEY) || '{}');
            const today = new Date().toISOString().split('T')[0];
            return processed[expenseId] === today;
        } catch {
            return false;
        }
    };

    const markAsProcessed = async (expenseId: string) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const processed = JSON.parse(localStorage.getItem(PROCESSED_KEY) || '{}');
            processed[expenseId] = today;
            localStorage.setItem(PROCESSED_KEY, JSON.stringify(processed));

            setRecurringExpenses(prev => prev.map(e =>
                e.id === expenseId ? { ...e, lastProcessed: today } : e
            ));

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('recurring_expenses').update({ last_processed: today }).eq('id', expenseId);
            }
        } catch (e) {
            console.error('Error marking as processed:', e);
        }
    };

    const getDueExpenses = (): RecurringExpense[] => {
        return recurringExpenses.filter(e => isDueToday(e) && !wasProcessedToday(e.id));
    };

    const getNextDueDate = (expense: RecurringExpense): Date => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();

        if (expense.cycle === 'monthly') {
            let nextDate = new Date(year, month, expense.dayOfMonth);
            if (nextDate <= today) {
                nextDate = new Date(year, month + 1, expense.dayOfMonth);
            }
            return nextDate;
        } else {
            let nextDate = new Date(year, (expense.monthOfYear || 1) - 1, expense.dayOfMonth);
            if (nextDate <= today) {
                nextDate = new Date(year + 1, (expense.monthOfYear || 1) - 1, expense.dayOfMonth);
            }
            return nextDate;
        }
    };

    const getUpcomingReminders = (): Array<RecurringExpense & { dueDate: Date; daysUntil: number }> => {
        const today = new Date();
        const reminders: Array<RecurringExpense & { dueDate: Date; daysUntil: number }> = [];

        recurringExpenses.filter(e => e.isActive).forEach(expense => {
            const nextDueDate = getNextDueDate(expense);
            const daysUntil = Math.ceil((nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (daysUntil > 0 && daysUntil <= expense.reminderDays) {
                reminders.push({ ...expense, dueDate: nextDueDate, daysUntil });
            }
        });

        return reminders.sort((a, b) => a.daysUntil - b.daysUntil);
    };

    const scheduleReminders = async () => {
        try {
            const reminders = getUpcomingReminders();

            for (const reminder of reminders) {
                const notifId = parseInt(reminder.id.replace(/\D/g, '').slice(-6)) || Date.now();

                await LocalNotifications.schedule({
                    notifications: [{
                        id: notifId,
                        title: '💰 تذكير بدفعة قادمة',
                        body: `${reminder.name}: ${reminder.amount} ${reminder.currency} - بعد ${reminder.daysUntil} ${reminder.daysUntil === 1 ? 'يوم' : 'أيام'}`,
                        schedule: { at: new Date(Date.now() + 1000) },
                        sound: 'default',
                    }]
                });
            }
        } catch (e) {
            console.error('Error scheduling reminders:', e);
        }
    };

    const getMonthlyTotal = (): { ars: number; usd: number } => {
        return recurringExpenses
            .filter(e => e.isActive && e.cycle === 'monthly')
            .reduce((acc, e) => {
                if (e.currency === 'ARS') {
                    acc.ars += e.amount;
                } else {
                    acc.usd += e.amount;
                }
                return acc;
            }, { ars: 0, usd: 0 });
    };

    const getYearlyTotal = (): { ars: number; usd: number } => {
        return recurringExpenses
            .filter(e => e.isActive && e.cycle === 'yearly')
            .reduce((acc, e) => {
                if (e.currency === 'ARS') {
                    acc.ars += e.amount;
                } else {
                    acc.usd += e.amount;
                }
                return acc;
            }, { ars: 0, usd: 0 });
    };

    return {
        recurringExpenses,
        loading,
        addRecurringExpense,
        updateRecurringExpense,
        deleteRecurringExpense,
        toggleActive,
        getDueExpenses,
        getUpcomingReminders,
        getNextDueDate,
        markAsProcessed,
        scheduleReminders,
        getMonthlyTotal,
        getYearlyTotal,
        refresh: fetchExpenses,
    };
};
