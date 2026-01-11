import { useState, useCallback, useEffect, useRef } from 'react';
import { cloudSync } from '@/lib/cloudSync';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/stores/useAppStore';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

const AUTO_SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Tables to subscribe to for realtime updates
const REALTIME_TABLES = ['locations', 'tasks', 'appointments', 'finances'] as const;

export const useCloudSync = () => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
        return localStorage.getItem('autoSyncEnabled') === 'true';
    });
    const { toast } = useToast();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const { isOnline, stats } = useOfflineQueue();

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
                // Don't show error for offline - handled by offline queue
                if (isOnline) {
                    toast({
                        title: '❌ فشلت المزامنة',
                        description: result.message,
                        variant: 'destructive',
                    });
                }
            }

            return result;
        } catch (error: any) {
            if (!silent && isOnline) {
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
    }, [toast, isOnline]);

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

    // Handle realtime updates for each table
    const handleRealtimeUpdate = useCallback((table: string, payload: any) => {
        const store = useAppStore.getState();
        const { eventType, new: newRecord, old: oldRecord } = payload;

        console.log(`Realtime ${eventType} on ${table}:`, payload);

        switch (table) {
            case 'locations':
                if (eventType === 'INSERT' || eventType === 'UPDATE') {
                    const location = {
                        id: newRecord.id,
                        title: newRecord.title,
                        url: newRecord.url,
                        category: newRecord.category,
                        createdAt: newRecord.created_at,
                        updatedAt: newRecord.updated_at,
                    };
                    const currentLocations = store.locations.filter(l => l.id !== location.id);
                    store.setLocations([...currentLocations, location]);
                } else if (eventType === 'DELETE') {
                    store.setLocations(store.locations.filter(l => l.id !== oldRecord.id));
                }
                break;

            case 'tasks':
                if (eventType === 'INSERT' || eventType === 'UPDATE') {
                    const task = {
                        id: newRecord.id,
                        title: newRecord.title,
                        description: newRecord.description,
                        deadline: newRecord.deadline,
                        completed: newRecord.completed,
                        priority: newRecord.priority,
                        type: newRecord.type,
                        subtasks: newRecord.subtasks || [],
                        progress: newRecord.progress,
                        createdAt: newRecord.created_at,
                        updatedAt: newRecord.updated_at,
                    };
                    const currentTasks = store.tasks.filter(t => t.id !== task.id);
                    store.setTasks([...currentTasks, task]);
                } else if (eventType === 'DELETE') {
                    store.setTasks(store.tasks.filter(t => t.id !== oldRecord.id));
                }
                break;

            case 'appointments':
                if (eventType === 'INSERT' || eventType === 'UPDATE') {
                    const appointment = {
                        id: newRecord.id,
                        title: newRecord.title,
                        date: newRecord.date,
                        time: newRecord.time,
                        reminderMinutes: newRecord.reminder_minutes,
                        isCompleted: newRecord.is_completed,
                        location: newRecord.location,
                        notes: newRecord.notes,
                        createdAt: newRecord.created_at,
                        updatedAt: newRecord.updated_at,
                    };
                    const currentAppointments = store.appointments.filter(a => a.id !== appointment.id);
                    store.setAppointments([...currentAppointments, appointment]);
                } else if (eventType === 'DELETE') {
                    store.setAppointments(store.appointments.filter(a => a.id !== oldRecord.id));
                }
                break;

            case 'finances':
                if (eventType === 'INSERT' || eventType === 'UPDATE') {
                    if (newRecord.data) {
                        store.setFinances(newRecord.data);
                    }
                }
                break;
        }
    }, []);

    // Auto-sync every 5 minutes when enabled + Realtime subscriptions
    useEffect(() => {
        if (autoSyncEnabled && isOnline) {
            // Initial sync
            syncNow(true);

            // Set up interval
            intervalRef.current = setInterval(() => {
                syncNow(true);
            }, AUTO_SYNC_INTERVAL);
        }

        // Realtime Subscriptions for each table
        const channels = REALTIME_TABLES.map(table => {
            return supabase
                .channel(`realtime-${table}`)
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table },
                    (payload) => handleRealtimeUpdate(table, payload)
                )
                .subscribe();
        });

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            channels.forEach(channel => supabase.removeChannel(channel));
        };
    }, [autoSyncEnabled, syncNow, handleRealtimeUpdate, isOnline]);

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
        // New exports for offline queue status
        isOnline,
        pendingActions: stats.pending,
        failedActions: stats.failed,
    };
};
