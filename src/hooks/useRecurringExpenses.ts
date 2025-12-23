import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface RecurringExpense {
    id: string;
    name: string;
    amount: number;
    currency: 'ARS' | 'USD';
    category: string;
    cycle: 'monthly' | 'yearly';
    dayOfMonth: number;  // 1-31
    monthOfYear?: number; // 1-12 (for yearly)
    isActive: boolean;
    lastProcessed?: string; // ISO date string
    reminderDays: number; // Days before to remind
    createdAt: string;
}

const STORAGE_KEY = 'baraka_recurring_expenses';
const PROCESSED_KEY = 'baraka_recurring_processed';

export const useRecurringExpenses = () => {
    const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const { toast } = useToast();

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recurringExpenses));
    }, [recurringExpenses]);

    const addRecurringExpense = (data: Omit<RecurringExpense, 'id' | 'createdAt' | 'isActive'>) => {
        const newExpense: RecurringExpense = {
            ...data,
            id: `recurring-${Date.now()}`,
            isActive: true,
            createdAt: new Date().toISOString(),
        };
        setRecurringExpenses(prev => [...prev, newExpense]);
        toast({ title: 'تم الإضافة', description: `تم إضافة "${data.name}" كمصروف متكرر` });
        return newExpense;
    };

    const updateRecurringExpense = (id: string, updates: Partial<RecurringExpense>) => {
        setRecurringExpenses(prev => prev.map(e =>
            e.id === id ? { ...e, ...updates } : e
        ));
        toast({ title: 'تم التحديث' });
    };

    const deleteRecurringExpense = (id: string) => {
        setRecurringExpenses(prev => prev.filter(e => e.id !== id));
        toast({ title: 'تم الحذف' });
    };

    const toggleActive = (id: string) => {
        setRecurringExpenses(prev => prev.map(e =>
            e.id === id ? { ...e, isActive: !e.isActive } : e
        ));
    };

    // Check if an expense is due today
    const isDueToday = (expense: RecurringExpense): boolean => {
        if (!expense.isActive) return false;

        const today = new Date();
        const todayDay = today.getDate();
        const todayMonth = today.getMonth() + 1;

        if (expense.cycle === 'monthly') {
            return todayDay === expense.dayOfMonth;
        } else {
            // Yearly
            return todayDay === expense.dayOfMonth && todayMonth === expense.monthOfYear;
        }
    };

    // Check if expense was already processed today
    const wasProcessedToday = (expenseId: string): boolean => {
        try {
            const processed = JSON.parse(localStorage.getItem(PROCESSED_KEY) || '{}');
            const today = new Date().toISOString().split('T')[0];
            return processed[expenseId] === today;
        } catch {
            return false;
        }
    };

    // Mark expense as processed
    const markAsProcessed = (expenseId: string) => {
        try {
            const processed = JSON.parse(localStorage.getItem(PROCESSED_KEY) || '{}');
            const today = new Date().toISOString().split('T')[0];
            processed[expenseId] = today;
            localStorage.setItem(PROCESSED_KEY, JSON.stringify(processed));

            setRecurringExpenses(prev => prev.map(e =>
                e.id === expenseId ? { ...e, lastProcessed: today } : e
            ));
        } catch (e) {
            console.error('Error marking as processed:', e);
        }
    };

    // Get expenses due today that haven't been processed
    const getDueExpenses = (): RecurringExpense[] => {
        return recurringExpenses.filter(e =>
            isDueToday(e) && !wasProcessedToday(e.id)
        );
    };

    // Get upcoming reminders (expenses due within reminderDays)
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

    // Get next due date for an expense
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
            // Yearly
            let nextDate = new Date(year, (expense.monthOfYear || 1) - 1, expense.dayOfMonth);
            if (nextDate <= today) {
                nextDate = new Date(year + 1, (expense.monthOfYear || 1) - 1, expense.dayOfMonth);
            }
            return nextDate;
        }
    };

    // Schedule reminder notifications
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
                        schedule: { at: new Date(Date.now() + 1000) }, // Now for testing
                        sound: 'default',
                    }]
                });
            }
        } catch (e) {
            console.error('Error scheduling reminders:', e);
        }
    };

    // Calculate total monthly recurring expenses
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

    // Calculate total yearly recurring expenses
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
    };
};
