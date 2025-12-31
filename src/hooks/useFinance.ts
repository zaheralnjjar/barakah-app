import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { fetchBNARate } from '@/lib/currency';

// The specific table name currently in use
export const FINANCE_TABLE = 'finance_data_2025_12_18_18_42';

export interface FinanceData {
    current_balance_ars: number;
    current_balance_usd: number;
    total_debt: number;
    daily_limit: number;
    exchange_rate: number;
    emergency_buffer: number;
    pending_expenses: Transaction[];
    updated_at: string;
}

export interface Transaction {
    id: number;
    amount: number;
    currency: 'ARS' | 'USD';
    type: 'expense' | 'income';
    category: string;
    description: string;
    timestamp: string;
}

export const useFinance = () => {
    const [financeData, setFinanceData] = useState<FinanceData | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const calculateDailyLimit = (data: FinanceData) => {
        if (!data) return 0;
        const currentRate = data.exchange_rate || 1200;
        const totalBalance = data.current_balance_ars + (data.current_balance_usd * currentRate);
        // Ensure we handle debts if needed, typically debt reduces available
        const availableBalance = totalBalance - (data.emergency_buffer || 0) - (data.total_debt || 0);

        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const remainingDays = daysInMonth - today.getDate();

        // Add minimal buffer of 3 days explicitly as per existing logic
        return Math.max(0, availableBalance / (remainingDays + 3));
    };

    const fetchFinanceData = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from(FINANCE_TABLE)
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) throw error;

            // Check for BNA rate update automatically
            const bnaRate = await fetchBNARate();
            if (bnaRate && data.exchange_rate && bnaRate !== data.exchange_rate) {
                // Update simpler local state immediately
                data.exchange_rate = bnaRate;
                // Fire and forget update
                supabase.from(FINANCE_TABLE)
                    .update({ exchange_rate: bnaRate, updated_at: new Date().toISOString() })
                    .eq('user_id', user.id)
                    .then();
            }

            setFinanceData(data);
        } catch (error) {
            console.error('Error fetching finance data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFinanceData();

        // Optional: Realtime subscription could go here
    }, [fetchFinanceData]);

    const addTransaction = async (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
        if (!financeData) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const amount = typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount;
            const isExpense = transaction.type === 'expense';

            let balanceARS = financeData.current_balance_ars;
            let balanceUSD = financeData.current_balance_usd;

            if (transaction.currency === 'ARS') {
                balanceARS += isExpense ? -amount : amount;
            } else {
                balanceUSD += isExpense ? -amount : amount;
            }

            const newTx: Transaction = {
                id: Date.now(),
                ...transaction,
                amount,
                timestamp: new Date().toISOString()
            };

            const updatedExpenses = [...(financeData.pending_expenses || []), newTx];

            const { error } = await supabase.from(FINANCE_TABLE)
                .update({
                    current_balance_ars: balanceARS,
                    current_balance_usd: balanceUSD,
                    pending_expenses: updatedExpenses,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id);

            if (error) throw error;

            toast({ title: 'تمت العملية بنجاح', description: 'تم تسجيل المعاملة وتحديث الرصيد' });
            fetchFinanceData(); // Refresh state

        } catch (e) {
            console.error(e);
            toast({ title: 'خطأ', description: 'فشل في حفظ المعاملة', variant: 'destructive' });
        }
    };

    return {
        financeData,
        loading,
        dailyLimit: financeData ? calculateDailyLimit(financeData) : 0,
        refresh: fetchFinanceData,
        addTransaction
    };
};
