import { useState, useEffect, useCallback, useRef } from 'react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { useToast } from '@/hooks/use-toast';

/**
 * Offline Queue System
 * Stores pending operations when offline and syncs when back online
 */

// Types
export type OfflineActionType = 'insert' | 'update' | 'delete';
export type SyncTableName = 'locations' | 'tasks' | 'appointments' | 'finances';

export interface OfflineAction {
    id: string;
    table: SyncTableName;
    action: OfflineActionType;
    data: any;
    timestamp: string;
    retryCount: number;
    lastError?: string;
}

export interface QueueStats {
    pending: number;
    failed: number;
    processing: boolean;
}

// IndexedDB Schema
interface OfflineQueueDB extends DBSchema {
    'offline-actions': {
        key: string;
        value: OfflineAction;
        indexes: {
            'by-timestamp': string;
            'by-table': SyncTableName;
        };
    };
}

const DB_NAME = 'barakah-offline-queue';
const DB_VERSION = 1;
const STORE_NAME = 'offline-actions';
const MAX_RETRIES = 3;

// Initialize IndexedDB
async function initDB(): Promise<IDBPDatabase<OfflineQueueDB>> {
    return openDB<OfflineQueueDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('by-timestamp', 'timestamp');
            store.createIndex('by-table', 'table');
        },
    });
}

// Generate unique ID
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useOfflineQueue = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [stats, setStats] = useState<QueueStats>({ pending: 0, failed: 0, processing: false });
    const dbRef = useRef<IDBPDatabase<OfflineQueueDB> | null>(null);
    const processingRef = useRef(false);
    const { toast } = useToast();

    // Initialize DB
    useEffect(() => {
        initDB().then(db => {
            dbRef.current = db;
            updateStats();
        });

        return () => {
            dbRef.current?.close();
        };
    }, []);

    // Online/Offline listeners
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            toast({
                title: '🌐 عاد الاتصال',
                description: 'جاري مزامنة البيانات المعلقة...',
            });
            processQueue();
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast({
                title: '📴 انقطع الاتصال',
                description: 'سيتم حفظ التغييرات محلياً',
                variant: 'destructive',
            });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [toast]);

    // Update stats from DB
    const updateStats = useCallback(async () => {
        if (!dbRef.current) return;

        const all = await dbRef.current.getAll(STORE_NAME);
        const pending = all.filter(a => a.retryCount < MAX_RETRIES).length;
        const failed = all.filter(a => a.retryCount >= MAX_RETRIES).length;

        setStats(prev => ({ ...prev, pending, failed }));
    }, []);

    // Add action to queue
    const addToQueue = useCallback(async (
        table: SyncTableName,
        action: OfflineActionType,
        data: any
    ): Promise<string> => {
        if (!dbRef.current) {
            await initDB().then(db => { dbRef.current = db; });
        }

        const queueAction: OfflineAction = {
            id: generateId(),
            table,
            action,
            data,
            timestamp: new Date().toISOString(),
            retryCount: 0,
        };

        await dbRef.current!.add(STORE_NAME, queueAction);
        await updateStats();

        return queueAction.id;
    }, [updateStats]);

    // Remove action from queue
    const removeFromQueue = useCallback(async (id: string) => {
        if (!dbRef.current) return;
        await dbRef.current.delete(STORE_NAME, id);
        await updateStats();
    }, [updateStats]);

    // Get all pending actions
    const getPendingActions = useCallback(async (): Promise<OfflineAction[]> => {
        if (!dbRef.current) return [];
        const all = await dbRef.current.getAll(STORE_NAME);
        return all
            .filter(a => a.retryCount < MAX_RETRIES)
            .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    }, []);

    // Mark action as failed
    const markFailed = useCallback(async (id: string, error: string) => {
        if (!dbRef.current) return;

        const action = await dbRef.current.get(STORE_NAME, id);
        if (action) {
            action.retryCount++;
            action.lastError = error;
            await dbRef.current.put(STORE_NAME, action);
            await updateStats();
        }
    }, [updateStats]);

    // Process the queue (called when online)
    const processQueue = useCallback(async (
        syncFunction?: (action: OfflineAction) => Promise<boolean>
    ) => {
        if (!dbRef.current || processingRef.current || !navigator.onLine) return;

        processingRef.current = true;
        setStats(prev => ({ ...prev, processing: true }));

        try {
            const pendingActions = await getPendingActions();

            for (const action of pendingActions) {
                try {
                    if (syncFunction) {
                        const success = await syncFunction(action);
                        if (success) {
                            await removeFromQueue(action.id);
                        } else {
                            await markFailed(action.id, 'Sync returned false');
                        }
                    } else {
                        // Default: just remove (actual sync will be handled by cloudSync)
                        await removeFromQueue(action.id);
                    }
                } catch (error: any) {
                    await markFailed(action.id, error.message);
                }
            }
        } finally {
            processingRef.current = false;
            setStats(prev => ({ ...prev, processing: false }));
            await updateStats();
        }
    }, [getPendingActions, removeFromQueue, markFailed, updateStats]);

    // Clear all failed actions
    const clearFailed = useCallback(async () => {
        if (!dbRef.current) return;

        const all = await dbRef.current.getAll(STORE_NAME);
        const failed = all.filter(a => a.retryCount >= MAX_RETRIES);

        for (const action of failed) {
            await dbRef.current.delete(STORE_NAME, action.id);
        }

        await updateStats();
    }, [updateStats]);

    // Clear all actions
    const clearAll = useCallback(async () => {
        if (!dbRef.current) return;
        await dbRef.current.clear(STORE_NAME);
        await updateStats();
    }, [updateStats]);

    return {
        // State
        isOnline,
        stats,

        // Actions
        addToQueue,
        removeFromQueue,
        getPendingActions,
        processQueue,
        clearFailed,
        clearAll,
    };
};

// Singleton instance for use outside React
let dbInstance: IDBPDatabase<OfflineQueueDB> | null = null;

export const offlineQueueService = {
    async init() {
        if (!dbInstance) {
            dbInstance = await initDB();
        }
        return dbInstance;
    },

    async add(table: SyncTableName, action: OfflineActionType, data: any): Promise<string> {
        const db = await this.init();
        const queueAction: OfflineAction = {
            id: generateId(),
            table,
            action,
            data,
            timestamp: new Date().toISOString(),
            retryCount: 0,
        };
        await db.add(STORE_NAME, queueAction);
        return queueAction.id;
    },

    async remove(id: string) {
        const db = await this.init();
        await db.delete(STORE_NAME, id);
    },

    async getAll(): Promise<OfflineAction[]> {
        const db = await this.init();
        return db.getAll(STORE_NAME);
    },

    async getPending(): Promise<OfflineAction[]> {
        const all = await this.getAll();
        return all
            .filter(a => a.retryCount < MAX_RETRIES)
            .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    },

    async getCount(): Promise<number> {
        const db = await this.init();
        return db.count(STORE_NAME);
    },
};
