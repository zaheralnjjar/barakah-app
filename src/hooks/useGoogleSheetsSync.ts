import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Google Sheets published CSV URL
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRxnGvZOJukEgiiJvkk2jUjWlbvLJa5gIRqZv3QgUtpaVaRdYdh30m6f0IlHz3VD480NxbOO9fHGWVT/pub?output=csv';

// Column mappings (Arabic column names from the sheet)
const COLUMN_MAP = {
    date: 'طابع زمني',
    amount: 'المبلغ',
    description: 'البيان',
};

// Sync interval - 24 hours in milliseconds
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

interface SyncState {
    lastSync: string | null;
    isSyncing: boolean;
    lastSyncCount: number;
}

export const useGoogleSheetsSync = () => {
    const { toast } = useToast();
    const [state, setState] = useState<SyncState>(() => {
        const saved = localStorage.getItem('baraka_sheets_sync');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch { }
        }
        return { lastSync: null, isSyncing: false, lastSyncCount: 0 };
    });

    // Parse CSV text to array of objects
    const parseCSV = (csvText: string): any[] => {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];

        // Parse header
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

        const rows: any[] = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const row: any = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            rows.push(row);
        }

        return rows;
    };

    // Sync function
    const syncFromSheets = useCallback(async (showToast = true): Promise<number> => {
        setState(prev => ({ ...prev, isSyncing: true }));

        try {
            // Fetch CSV from Google Sheets
            const response = await fetch(SHEET_CSV_URL);
            if (!response.ok) {
                throw new Error('فشل في جلب البيانات من Google Sheets');
            }

            const csvText = await response.text();
            const rows = parseCSV(csvText);

            if (rows.length === 0) {
                if (showToast) {
                    toast({
                        title: 'لا توجد بيانات',
                        description: 'الجدول فارغ أو لم يتم نشره بشكل صحيح',
                        variant: 'destructive',
                    });
                }
                setState(prev => ({ ...prev, isSyncing: false }));
                return 0;
            }

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('المستخدم غير مسجل');
            }

            // Fetch existing finance data
            const { data: financeData, error } = await supabase
                .from('finance_data_2025_12_18_18_42')
                .select('pending_expenses')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            const existingExpenses = financeData?.pending_expenses || [];

            // Get existing imported IDs to avoid duplicates
            const existingDescriptions = new Set(
                existingExpenses
                    .filter((e: any) => e.source === 'google_sheets')
                    .map((e: any) => `${e.description}_${e.timestamp}`)
            );

            // Convert rows to transactions
            const newTransactions: any[] = [];
            for (const row of rows) {
                const dateStr = row[COLUMN_MAP.date];
                const amountStr = row[COLUMN_MAP.amount];
                const description = row[COLUMN_MAP.description];

                if (!dateStr || !amountStr) continue;

                // Parse amount - remove non-numeric except minus and decimal
                const amount = Math.abs(parseFloat(String(amountStr).replace(/[^0-9.-]/g, '')));
                if (isNaN(amount) || amount === 0) continue;

                // Parse date
                let timestamp: string;
                try {
                    const date = new Date(dateStr);
                    timestamp = date.toISOString();
                } catch {
                    timestamp = new Date().toISOString();
                }

                // Check for duplicates
                const key = `${description}_${timestamp}`;
                if (existingDescriptions.has(key)) continue;

                // Determine type from amount sign (negative = expense)
                const rawAmount = parseFloat(String(amountStr).replace(/[^0-9.-]/g, ''));
                const type = rawAmount < 0 ? 'expense' : 'expense'; // Default to expense

                newTransactions.push({
                    id: crypto.randomUUID(),
                    amount,
                    type,
                    description: description || 'من Google Sheets',
                    currency: 'ARS',
                    timestamp,
                    status: 'pending',
                    source: 'google_sheets', // Mark as from Google Sheets
                });
            }

            if (newTransactions.length === 0) {
                if (showToast) {
                    toast({
                        title: 'لا توجد معاملات جديدة',
                        description: 'جميع المعاملات موجودة مسبقاً',
                    });
                }
                setState(prev => ({
                    ...prev,
                    isSyncing: false,
                    lastSync: new Date().toISOString(),
                }));
                return 0;
            }

            // Save to database
            const updatedExpenses = [...existingExpenses, ...newTransactions];
            await supabase
                .from('finance_data_2025_12_18_18_42')
                .upsert({
                    user_id: user.id,
                    pending_expenses: updatedExpenses,
                    last_modified: new Date().toISOString(),
                });

            const newState = {
                lastSync: new Date().toISOString(),
                isSyncing: false,
                lastSyncCount: newTransactions.length,
            };
            setState(newState);
            localStorage.setItem('baraka_sheets_sync', JSON.stringify(newState));

            if (showToast) {
                toast({
                    title: 'تمت المزامنة بنجاح ✅',
                    description: `تم إضافة ${newTransactions.length} معاملة من Google Sheets`,
                });
            }

            return newTransactions.length;

        } catch (error) {
            console.error('Google Sheets sync error:', error);
            setState(prev => ({ ...prev, isSyncing: false }));

            if (showToast) {
                toast({
                    title: 'خطأ في المزامنة',
                    description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
                    variant: 'destructive',
                });
            }
            return 0;
        }
    }, [toast]);

    // Auto-sync on mount and daily
    useEffect(() => {
        const checkAndSync = async () => {
            const lastSync = state.lastSync ? new Date(state.lastSync).getTime() : 0;
            const now = Date.now();

            // Sync if never synced or more than 24 hours ago
            if (now - lastSync > SYNC_INTERVAL_MS) {
                console.log('Auto-syncing from Google Sheets...');
                await syncFromSheets(false);
            }
        };

        // Check on mount
        const timeout = setTimeout(checkAndSync, 5000); // 5 second delay

        // Set up daily interval
        const interval = setInterval(checkAndSync, SYNC_INTERVAL_MS);

        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, [state.lastSync, syncFromSheets]);

    return {
        syncFromSheets,
        isSyncing: state.isSyncing,
        lastSync: state.lastSync,
        lastSyncCount: state.lastSyncCount,
    };
};
