import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface GoogleSheet {
    id: string;
    name: string; // Label like "مصروفات الزوجة"
    url: string;  // Published CSV URL
    lastSync: string | null;
    enabled: boolean;
}

interface SyncState {
    sheets: GoogleSheet[];
    isSyncing: boolean;
    currentSyncSheet: string | null;
}

// Column mappings (Arabic column names)
const COLUMN_MAP = {
    date: 'طابع زمني',
    amount: 'المبلغ',
    description: 'البيان',
};

// Convert pubhtml URL to CSV URL
const convertToCSVUrl = (url: string): string => {
    // If already a CSV URL, return as is
    if (url.includes('output=csv')) return url;

    // Convert pubhtml to CSV
    if (url.includes('/pubhtml')) {
        return url.replace('/pubhtml', '/pub?output=csv');
    }

    // If it's an edit URL, try to convert
    if (url.includes('/edit')) {
        const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match) {
            return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
        }
    }

    // Default: append output=csv
    if (url.includes('?')) {
        return url + '&output=csv';
    }
    return url + '?output=csv';
};

export const useMultiGoogleSheetsSync = () => {
    const { toast } = useToast();
    const [state, setState] = useState<SyncState>(() => {
        const saved = localStorage.getItem('baraka_google_sheets');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return { ...parsed, isSyncing: false, currentSyncSheet: null };
            } catch { }
        }
        // Default sheet
        return {
            sheets: [{
                id: 'default',
                name: 'الجدول الرئيسي',
                url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRxnGvZOJukEgiiJvkk2jUjWlbvLJa5gIRqZv3QgUtpaVaRdYdh30m6f0IlHz3VD480NxbOO9fHGWVT/pub?output=csv',
                lastSync: null,
                enabled: true,
            }],
            isSyncing: false,
            currentSyncSheet: null,
        };
    });

    // Save to localStorage whenever sheets change
    useEffect(() => {
        localStorage.setItem('baraka_google_sheets', JSON.stringify({
            sheets: state.sheets,
        }));
    }, [state.sheets]);

    // Parse CSV text to array of objects
    const parseCSV = (csvText: string): any[] => {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

        const rows: any[] = [];
        for (let i = 1; i < lines.length; i++) {
            // Handle CSV with commas in values (basic parsing)
            const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const row: any = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            rows.push(row);
        }

        return rows;
    };

    // Add a new sheet
    const addSheet = useCallback((name: string, url: string) => {
        const newSheet: GoogleSheet = {
            id: crypto.randomUUID(),
            name,
            url: convertToCSVUrl(url),
            lastSync: null,
            enabled: true,
        };
        setState(prev => ({
            ...prev,
            sheets: [...prev.sheets, newSheet],
        }));
        toast({ title: 'تمت الإضافة', description: `تم إضافة جدول "${name}"` });
        return newSheet.id;
    }, [toast]);

    // Remove a sheet
    const removeSheet = useCallback((sheetId: string) => {
        setState(prev => ({
            ...prev,
            sheets: prev.sheets.filter(s => s.id !== sheetId),
        }));
        toast({ title: 'تم الحذف', description: 'تم حذف الجدول' });
    }, [toast]);

    // Toggle sheet enabled status
    const toggleSheet = useCallback((sheetId: string) => {
        setState(prev => ({
            ...prev,
            sheets: prev.sheets.map(s =>
                s.id === sheetId ? { ...s, enabled: !s.enabled } : s
            ),
        }));
    }, []);

    // Sync a single sheet
    const syncSheet = useCallback(async (sheetId: string, showToast = true): Promise<number> => {
        const sheet = state.sheets.find(s => s.id === sheetId);
        if (!sheet || !sheet.enabled) return 0;

        setState(prev => ({ ...prev, isSyncing: true, currentSyncSheet: sheetId }));

        try {
            const response = await fetch(sheet.url);
            if (!response.ok) {
                throw new Error(`فشل في جلب "${sheet.name}"`);
            }

            const csvText = await response.text();
            const rows = parseCSV(csvText);

            if (rows.length === 0) {
                if (showToast) {
                    toast({ title: 'لا توجد بيانات', description: `"${sheet.name}" فارغ`, variant: 'destructive' });
                }
                setState(prev => ({ ...prev, isSyncing: false, currentSyncSheet: null }));
                return 0;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('المستخدم غير مسجل');

            const { data: financeData } = await supabase
                .from('finance_data_2025_12_18_18_42')
                .select('pending_expenses')
                .eq('user_id', user.id)
                .single();

            const existingExpenses = financeData?.pending_expenses || [];

            // Check for duplicates by description+timestamp+source
            const existingKeys = new Set(
                existingExpenses
                    .filter((e: any) => e.sourceSheet === sheetId)
                    .map((e: any) => `${e.description}_${e.timestamp}`)
            );

            const newTransactions: any[] = [];
            for (const row of rows) {
                const dateStr = row[COLUMN_MAP.date];
                const amountStr = row[COLUMN_MAP.amount];
                const description = row[COLUMN_MAP.description];

                if (!dateStr || !amountStr) continue;

                const amount = Math.abs(parseFloat(String(amountStr).replace(/[^0-9.-]/g, '')));
                if (isNaN(amount) || amount === 0) continue;

                let timestamp: string;
                try {
                    timestamp = new Date(dateStr).toISOString();
                } catch {
                    timestamp = new Date().toISOString();
                }

                const key = `${description}_${timestamp}`;
                if (existingKeys.has(key)) continue;

                newTransactions.push({
                    id: crypto.randomUUID(),
                    amount,
                    type: 'expense',
                    description: description || 'من Google Sheets',
                    currency: 'ARS',
                    timestamp,
                    status: 'pending',
                    source: 'google_sheets',
                    sourceSheet: sheetId,
                    sourceLabel: sheet.name, // For display
                });
            }

            if (newTransactions.length === 0) {
                if (showToast) {
                    toast({ title: 'لا توجد معاملات جديدة', description: `"${sheet.name}" محدّث` });
                }
            } else {
                const updatedExpenses = [...existingExpenses, ...newTransactions];
                const { error: updateError } = await supabase
                    .from('finance_data_2025_12_18_18_42')
                    .update({ pending_expenses: updatedExpenses, last_modified: new Date().toISOString() })
                    .eq('user_id', user.id);

                if (updateError) {
                    await supabase
                        .from('finance_data_2025_12_18_18_42')
                        .insert({ user_id: user.id, pending_expenses: updatedExpenses, last_modified: new Date().toISOString() });
                }

                if (showToast) {
                    toast({
                        title: 'تمت المزامنة ✅',
                        description: `${newTransactions.length} معاملة من "${sheet.name}"`,
                    });
                }
            }

            // Update lastSync for this sheet
            setState(prev => ({
                ...prev,
                isSyncing: false,
                currentSyncSheet: null,
                sheets: prev.sheets.map(s =>
                    s.id === sheetId ? { ...s, lastSync: new Date().toISOString() } : s
                ),
            }));

            return newTransactions.length;

        } catch (error) {
            console.error('Sheet sync error:', error);
            setState(prev => ({ ...prev, isSyncing: false, currentSyncSheet: null }));
            if (showToast) {
                toast({
                    title: 'خطأ في المزامنة',
                    description: error instanceof Error ? error.message : 'خطأ غير متوقع',
                    variant: 'destructive',
                });
            }
            return 0;
        }
    }, [state.sheets, toast]);

    // Sync all enabled sheets
    const syncAllSheets = useCallback(async () => {
        let totalCount = 0;
        for (const sheet of state.sheets) {
            if (sheet.enabled) {
                const count = await syncSheet(sheet.id, false);
                totalCount += count;
            }
        }
        if (totalCount > 0) {
            toast({ title: 'تمت المزامنة ✅', description: `${totalCount} معاملة جديدة` });
        } else {
            toast({ title: 'لا توجد معاملات جديدة' });
        }
        return totalCount;
    }, [state.sheets, syncSheet, toast]);

    return {
        sheets: state.sheets,
        isSyncing: state.isSyncing,
        currentSyncSheet: state.currentSyncSheet,
        addSheet,
        removeSheet,
        toggleSheet,
        syncSheet,
        syncAllSheets,
    };
};
