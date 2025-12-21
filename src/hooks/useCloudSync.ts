import { useState, useCallback, useEffect, useRef } from 'react';
import { cloudSync } from '@/lib/cloudSync';
import { useToast } from '@/hooks/use-toast';

const AUTO_SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const useCloudSync = () => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
        return localStorage.getItem('autoSyncEnabled') === 'true';
    });
    const { toast } = useToast();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const syncNow = useCallback(async (silent = false) => {
        setIsSyncing(true);
        try {
            const result = await cloudSync.syncAll();

            if (result.success) {
                setLastSync(new Date());
                localStorage.setItem('lastSync', new Date().toISOString());
                if (!silent) {
                    toast({
                        title: '✅ تمت المزامنة',
                        description: result.message,
                    });
                }
            } else if (!silent) {
                toast({
                    title: '❌ فشلت المزامنة',
                    description: result.message,
                    variant: 'destructive',
                });
            }

            return result;
        } catch (error: any) {
            if (!silent) {
                toast({
                    title: '❌ خطأ',
                    description: error.message,
                    variant: 'destructive',
                });
            }
            return { success: false, message: error.message };
        } finally {
            setIsSyncing(false);
        }
    }, [toast]);

    const pullData = useCallback(async () => {
        setIsSyncing(true);
        try {
            const result = await cloudSync.pullAll();

            if (result.success) {
                toast({
                    title: '✅ تم السحب',
                    description: result.message,
                });
            } else {
                toast({
                    title: '❌ فشل السحب',
                    description: result.message,
                    variant: 'destructive',
                });
            }

            return result;
        } catch (error: any) {
            toast({
                title: '❌ خطأ',
                description: error.message,
                variant: 'destructive',
            });
            return { success: false, message: error.message };
        } finally {
            setIsSyncing(false);
        }
    }, [toast]);

    const toggleAutoSync = useCallback((enabled: boolean) => {
        setAutoSyncEnabled(enabled);
        localStorage.setItem('autoSyncEnabled', enabled.toString());
    }, []);

    // Auto-sync every 5 minutes when enabled
    useEffect(() => {
        if (autoSyncEnabled) {
            // Initial sync
            syncNow(true);

            // Set up interval
            intervalRef.current = setInterval(() => {
                syncNow(true);
            }, AUTO_SYNC_INTERVAL);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [autoSyncEnabled, syncNow]);

    // Load last sync from storage
    useEffect(() => {
        const stored = localStorage.getItem('lastSync');
        if (stored) {
            setLastSync(new Date(stored));
        }
    }, []);

    return {
        isSyncing,
        syncNow,
        pullData,
        lastSync,
        autoSyncEnabled,
        toggleAutoSync,
    };
};
