import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import type { Location, Task, Appointment, FinanceData } from '@/stores/useAppStore';

/**
 * Cloud Sync Service
 * Syncs local data with Supabase for backup and multi-device access
 */
export class CloudSyncService {
    private userId: string | null = null;

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
     * Sync tasks
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
            if (!remote || new Date(local.updatedAt) > new Date(remote.updated_at)) {
                toUpsert.push({
                    id: local.id,
                    user_id: this.userId,
                    title: local.title,
                    description: local.description,
                    deadline: local.deadline,
                    completed: local.completed,
                    priority: local.priority,
                    type: local.type,
                    subtasks: local.subtasks,
                    progress: local.progress,
                    created_at: local.createdAt,
                    updated_at: local.updatedAt,
                });
            }
        }

        const toPull: Task[] = [];

        for (const remote of (remoteTasks || [])) {
            const local = localMap.get(remote.id);
            if (!local || new Date(remote.updated_at) > new Date(local.updatedAt)) {
                toPull.push({
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
                });
            }
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
