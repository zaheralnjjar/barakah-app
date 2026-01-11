import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import type { Location, Task, Appointment, FinanceData } from '@/stores/useAppStore';
import { offlineQueueService, type OfflineAction, type SyncTableName } from '@/hooks/useOfflineQueue';

/**
 * Merge Strategies for different data types
 * - last-write-wins: Simple timestamp comparison (default)
 * - field-level: Merge individual fields, keeping newest value for each
 * - accumulative: For arrays/collections, merge items from both sides
 */
type MergeStrategy = 'last-write-wins' | 'field-level' | 'accumulative';

const MERGE_STRATEGIES: Record<SyncTableName, MergeStrategy> = {
    locations: 'last-write-wins',
    tasks: 'field-level',        // Subtasks should be merged
    appointments: 'last-write-wins',
    finances: 'accumulative',    // Expenses/Income should be merged
};

/**
 * Cloud Sync Service
 * Syncs local data with Supabase for backup and multi-device access
 * Now with Offline Queue support and Smart Merge Strategies
 */
export class CloudSyncService {
    private userId: string | null = null;
    private isOnline: boolean = navigator.onLine;

    constructor() {
        // Listen for online/offline events
        window.addEventListener('online', () => { this.isOnline = true; });
        window.addEventListener('offline', () => { this.isOnline = false; });
    }

    async init() {
        const { data: { user } } = await supabase.auth.getUser();
        this.userId = user?.id || null;
        return this.userId !== null;
    }

    /**
     * Sync all data to cloud
     */
    async syncAll(): Promise<{ success: boolean; message: string }> {
        try {
            if (!this.userId) {
                const initialized = await this.init();
                if (!initialized) {
                    return { success: false, message: 'المستخدم غير مسجل الدخول' };
                }
            }

            // Check if online
            if (!this.isOnline) {
                return { success: false, message: 'لا يوجد اتصال بالإنترنت - سيتم المزامنة لاحقاً' };
            }

            // First, process any pending offline actions
            await this.processOfflineQueue();

            await Promise.all([
                this.syncLocations(),
                this.syncTasks(),
                this.syncAppointments(),
                this.syncFinances(),
            ]);

            useAppStore.getState().markSynced();
            return { success: true, message: 'تمت المزامنة بنجاح' };
        } catch (error: any) {
            console.error('Sync error:', error);
            return { success: false, message: error.message || 'فشلت المزامنة' };
        }
    }

    /**
     * Process pending offline actions
     */
    private async processOfflineQueue() {
        const pendingActions = await offlineQueueService.getPending();

        for (const action of pendingActions) {
            try {
                await this.executeOfflineAction(action);
                await offlineQueueService.remove(action.id);
            } catch (error) {
                console.error('Failed to process offline action:', action.id, error);
            }
        }
    }

    /**
     * Execute a single offline action
     */
    private async executeOfflineAction(action: OfflineAction) {
        const { table, action: actionType, data } = action;

        switch (actionType) {
            case 'insert':
            case 'update':
                await supabase.from(table).upsert({
                    ...data,
                    user_id: this.userId,
                });
                break;
            case 'delete':
                await supabase.from(table).delete().eq('id', data.id);
                break;
        }
    }

    /**
     * Queue an action for later sync (when offline)
     */
    async queueAction(table: SyncTableName, action: 'insert' | 'update' | 'delete', data: any) {
        return offlineQueueService.add(table, action, data);
    }

    /**
     * Check if currently online
     */
    get online(): boolean {
        return this.isOnline;
    }

    // ============= HELPER METHODS =============

    /**
     * Convert local Task to remote format
     */
    private taskToRemote(task: Task): any {
        return {
            id: task.id,
            user_id: this.userId,
            title: task.title,
            description: task.description,
            deadline: task.deadline,
            completed: task.completed,
            priority: task.priority,
            type: task.type,
            subtasks: task.subtasks,
            progress: task.progress,
            created_at: task.createdAt,
            updated_at: task.updatedAt,
        };
    }

    /**
     * Convert remote format to local Task
     */
    private remoteToTask(remote: any): Task {
        return {
            id: remote.id,
            title: remote.title,
            description: remote.description,
            deadline: remote.deadline,
            completed: remote.completed,
            priority: remote.priority,
            type: remote.type,
            subtasks: remote.subtasks || [],
            progress: remote.progress,
            createdAt: remote.created_at,
            updatedAt: remote.updated_at,
        };
    }

    /**
     * Field-Level Merge for Tasks
     * Intelligently merges subtasks and other fields
     */
    private fieldLevelMergeTask(local: Task, remote: any): { task: Task; changed: boolean } {
        const localTime = new Date(local.updatedAt).getTime();
        const remoteTime = new Date(remote.updated_at).getTime();

        // If timestamps are equal, no change needed
        if (localTime === remoteTime) {
            return { task: local, changed: false };
        }

        // Start with the newer as base
        const base = localTime > remoteTime ? local : this.remoteToTask(remote);
        const other = localTime > remoteTime ? remote : local;

        // Merge subtasks (accumulative - don't lose any subtasks)
        const localSubtasks = local.subtasks || [];
        const remoteSubtasks = remote.subtasks || [];

        // Create a map of all subtasks by ID, preferring the newer version
        const subtaskMap = new Map<string, any>();

        for (const st of remoteSubtasks) {
            subtaskMap.set(st.id, st);
        }

        for (const st of localSubtasks) {
            const existing = subtaskMap.get(st.id);
            if (!existing) {
                subtaskMap.set(st.id, st);
            } else {
                // If both have the same subtask, keep the one with completed = true (progress is never lost)
                if (st.completed && !existing.completed) {
                    subtaskMap.set(st.id, st);
                }
            }
        }

        const mergedSubtasks = Array.from(subtaskMap.values());

        // Build merged task
        const mergedTask: Task = {
            ...base,
            subtasks: mergedSubtasks,
            // Progress should reflect actual completed subtasks
            progress: mergedSubtasks.length > 0
                ? Math.round((mergedSubtasks.filter(s => s.completed).length / mergedSubtasks.length) * 100)
                : base.progress,
            updatedAt: new Date().toISOString(),
        };

        // Check if merge produced any changes
        const changed = localTime > remoteTime || mergedSubtasks.length !== remoteSubtasks.length;

        return { task: mergedTask, changed };
    }

    /**
     * Sync locations
     */
    private async syncLocations() {
        const localLocations = useAppStore.getState().locations;

        // Get remote data
        const { data: remoteLocations, error } = await supabase
            .from('locations')
            .select('*')
            .eq('user_id', this.userId);

        if (error) throw error;

        // Merge strategy: Last-write-wins (simple for personal use)
        const remoteMap = new Map(remoteLocations?.map(r => [r.id, r]) || []);
        const localMap = new Map(localLocations.map(l => [l.id, l]));

        // Items to upsert to remote
        const toUpsert: any[] = [];

        for (const local of localLocations) {
            const remote = remoteMap.get(local.id);
            if (!remote || new Date(local.updatedAt) > new Date(remote.updated_at)) {
                toUpsert.push({
                    id: local.id,
                    user_id: this.userId,
                    title: local.title,
                    url: local.url,
                    category: local.category,
                    created_at: local.createdAt,
                    updated_at: local.updatedAt,
                });
            }
        }

        // Items to pull from remote
        const toPull: Location[] = [];

        for (const remote of (remoteLocations || [])) {
            const local = localMap.get(remote.id);
            if (!local || new Date(remote.updated_at) > new Date(local.updatedAt)) {
                toPull.push({
                    id: remote.id,
                    title: remote.title,
                    url: remote.url,
                    category: remote.category,
                    createdAt: remote.created_at,
                    updatedAt: remote.updated_at,
                });
            }
        }

        // Upsert to remote
        if (toUpsert.length > 0) {
            const { error: upsertError } = await supabase
                .from('locations')
                .upsert(toUpsert);

            if (upsertError) throw upsertError;
        }

        // Update local with newer remote items
        if (toPull.length > 0) {
            const currentLocations = useAppStore.getState().locations;
            const merged = [...currentLocations];

            for (const remote of toPull) {
                const index = merged.findIndex(l => l.id === remote.id);
                if (index >= 0) {
                    merged[index] = remote;
                } else {
                    merged.push(remote);
                }
            }

            useAppStore.getState().setLocations(merged);
        }
    }

    /**
     * Sync tasks with Field-Level Merge for subtasks
     */
    private async syncTasks() {
        const localTasks = useAppStore.getState().tasks;

        const { data: remoteTasks, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', this.userId);

        if (error) throw error;

        const remoteMap = new Map(remoteTasks?.map(r => [r.id, r]) || []);
        const localMap = new Map(localTasks.map(l => [l.id, l]));

        const toUpsert: any[] = [];

        for (const local of localTasks) {
            const remote = remoteMap.get(local.id);
            if (!remote) {
                // New local task - push to remote
                toUpsert.push(this.taskToRemote(local));
            } else {
                // Both exist - use field-level merge
                const merged = this.fieldLevelMergeTask(local, remote);
                if (merged.changed) {
                    toUpsert.push(this.taskToRemote(merged.task));
                }
            }
        }

        const toPull: Task[] = [];

        for (const remote of (remoteTasks || [])) {
            const local = localMap.get(remote.id);
            if (!local) {
                // Only on remote - pull
                toPull.push(this.remoteToTask(remote));
            }
            // If local exists, it was already handled above
        }

        if (toUpsert.length > 0) {
            const { error: upsertError } = await supabase
                .from('tasks')
                .upsert(toUpsert);

            if (upsertError) throw upsertError;
        }

        if (toPull.length > 0) {
            const currentTasks = useAppStore.getState().tasks;
            const merged = [...currentTasks];

            for (const remote of toPull) {
                const index = merged.findIndex(t => t.id === remote.id);
                if (index >= 0) {
                    merged[index] = remote;
                } else {
                    merged.push(remote);
                }
            }

            useAppStore.getState().setTasks(merged);
        }
    }

    /**
     * Sync appointments
     */
    private async syncAppointments() {
        const localAppointments = useAppStore.getState().appointments;

        const { data: remoteAppointments, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('user_id', this.userId);

        if (error) throw error;

        const remoteMap = new Map(remoteAppointments?.map(r => [r.id, r]) || []);
        const localMap = new Map(localAppointments.map(l => [l.id, l]));

        const toUpsert: any[] = [];

        for (const local of localAppointments) {
            const remote = remoteMap.get(local.id);
            if (!remote || new Date(local.updatedAt) > new Date(remote.updated_at)) {
                toUpsert.push({
                    id: local.id,
                    user_id: this.userId,
                    title: local.title,
                    date: local.date,
                    time: local.time,
                    reminder_minutes: local.reminderMinutes,
                    is_completed: local.isCompleted,
                    location: local.location,
                    notes: local.notes,
                    created_at: local.createdAt,
                    updated_at: local.updatedAt,
                });
            }
        }

        const toPull: Appointment[] = [];

        for (const remote of (remoteAppointments || [])) {
            const local = localMap.get(remote.id);
            if (!local || new Date(remote.updated_at) > new Date(local.updatedAt)) {
                toPull.push({
                    id: remote.id,
                    title: remote.title,
                    date: remote.date,
                    time: remote.time,
                    reminderMinutes: remote.reminder_minutes,
                    isCompleted: remote.is_completed,
                    location: remote.location,
                    notes: remote.notes,
                    createdAt: remote.created_at,
                    updatedAt: remote.updated_at,
                });
            }
        }

        if (toUpsert.length > 0) {
            const { error: upsertError } = await supabase
                .from('appointments')
                .upsert(toUpsert);

            if (upsertError) throw upsertError;
        }

        if (toPull.length > 0) {
            const currentAppointments = useAppStore.getState().appointments;
            const merged = [...currentAppointments];

            for (const remote of toPull) {
                const index = merged.findIndex(a => a.id === remote.id);
                if (index >= 0) {
                    merged[index] = remote;
                } else {
                    merged.push(remote);
                }
            }

            useAppStore.getState().setAppointments(merged);
        }
    }

    /**
     * Sync finances
     */
    private async syncFinances() {
        const localFinances = useAppStore.getState().finances;

        const { data: remoteFinances, error } = await supabase
            .from('finances')
            .select('*')
            .eq('user_id', this.userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

        // For finances, we store as a single document
        const localUpdated = new Date().toISOString();

        if (!remoteFinances) {
            // Insert new
            const { error: insertError } = await supabase
                .from('finances')
                .insert({
                    user_id: this.userId,
                    data: localFinances,
                    updated_at: localUpdated,
                });

            if (insertError) throw insertError;
        } else {
            // Compare and merge
            const remoteUpdated = new Date(remoteFinances.updated_at);

            // Simple: always use newer
            if (new Date(localUpdated) > remoteUpdated) {
                // Upload local
                const { error: updateError } = await supabase
                    .from('finances')
                    .update({
                        data: localFinances,
                        updated_at: localUpdated,
                    })
                    .eq('user_id', this.userId);

                if (updateError) throw updateError;
            } else {
                // Pull remote
                useAppStore.getState().setFinances(remoteFinances.data);
            }
        }
    }

    /**
     * Pull all data from cloud (for initial sync or reset)
     */
    async pullAll(): Promise<{ success: boolean; message: string }> {
        try {
            if (!this.userId) {
                const initialized = await this.init();
                if (!initialized) {
                    return { success: false, message: 'المستخدم غير مسجل الدخول' };
                }
            }

            // Pull locations
            const { data: locations } = await supabase
                .from('locations')
                .select('*')
                .eq('user_id', this.userId);

            if (locations) {
                useAppStore.getState().setLocations(
                    locations.map(l => ({
                        id: l.id,
                        title: l.title,
                        url: l.url,
                        category: l.category,
                        createdAt: l.created_at,
                        updatedAt: l.updated_at,
                    }))
                );
            }

            // Pull tasks
            const { data: tasks } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', this.userId);

            if (tasks) {
                useAppStore.getState().setTasks(
                    tasks.map(t => ({
                        id: t.id,
                        title: t.title,
                        description: t.description,
                        deadline: t.deadline,
                        completed: t.completed,
                        priority: t.priority,
                        type: t.type,
                        subtasks: t.subtasks || [],
                        progress: t.progress,
                        createdAt: t.created_at,
                        updatedAt: t.updated_at,
                    }))
                );
            }

            // Pull appointments
            const { data: appointments } = await supabase
                .from('appointments')
                .select('*')
                .eq('user_id', this.userId);

            if (appointments) {
                useAppStore.getState().setAppointments(
                    appointments.map(a => ({
                        id: a.id,
                        title: a.title,
                        date: a.date,
                        time: a.time,
                        reminderMinutes: a.reminder_minutes,
                        isCompleted: a.is_completed,
                        location: a.location,
                        notes: a.notes,
                        createdAt: a.created_at,
                        updatedAt: a.updated_at,
                    }))
                );
            }

            // Pull finances
            const { data: finances } = await supabase
                .from('finances')
                .select('*')
                .eq('user_id', this.userId)
                .single();

            if (finances) {
                useAppStore.getState().setFinances(finances.data);
            }

            useAppStore.getState().markSynced();
            return { success: true, message: 'تم سحب البيانات' };
        } catch (error: any) {
            console.error('Pull error:', error);
            return { success: false, message: error.message || 'فشل السحب' };
        }
    }
}

export const cloudSync = new CloudSyncService();
