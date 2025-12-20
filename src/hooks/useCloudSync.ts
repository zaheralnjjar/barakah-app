import { useState, useCallback } from 'react';
import { cloudSync } from '@/lib/cloudSync';
import { useToast } from '@/hooks/use-toast';

export const useCloudSync = () => {
    const [isSyncing, setIsSyncing] = useState(false);
    const { toast } = useToast();

    const syncNow = useCallback(async () => {
        setIsSyncing(true);
        try {
            const result = await cloudSync.syncAll();

            if (result.success) {
                toast({
                    title: '✅ تمت المزامنة',
                    description: result.message,
                });
            } else {
                toast({
                    title: '❌ فشلت المزامنة',
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

    return {
        isSyncing,
        syncNow,
        pullData,
    };
};
