import { supabase } from "@/integrations/supabase/client";
import { CreateEntryDTO, CreateTrackerDTO, Tracker, TrackerEntry, TrackerFolder } from "@/types/tracking";

export const trackingService = {
    // Get all active trackers for the user
    async getTrackers(): Promise<Tracker[]> {
        const { data, error } = await supabase
            .from('trackers')
            .select('*')
            .eq('is_archived', false)
            .order('order_index', { ascending: true });

        if (error) {
            console.error('Error fetching trackers:', error);
            throw error;
        }
        return data as Tracker[];
    },

    // Create a new tracker
    async createTracker(dto: CreateTrackerDTO): Promise<Tracker> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('trackers')
            .insert({
                user_id: user.id,
                name: dto.name,
                type: dto.type,
                icon: dto.icon,
                color: dto.color,
                settings: dto.settings || {},
                order_index: 999,
                folder_id: dto.folder_id
            })
            .select()
            .single();

        if (error) throw error;
        return data as Tracker;
    },

    // Add a new entry (check-in)
    async addEntry(dto: CreateEntryDTO): Promise<TrackerEntry> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('tracker_entries')
            .insert({
                user_id: user.id,
                tracker_id: dto.tracker_id,
                value: dto.value,
                date: dto.date ? dto.date.toISOString() : new Date().toISOString(),
                note: dto.note
            })
            .select() // Returns the inserted row
            .single();

        if (error) throw error;
        return data as TrackerEntry;
    },

    // Delete a tracker (archive logic could be better but delete is fine for now)
    async deleteTracker(id: string): Promise<void> {
        const { error } = await supabase
            .from('trackers')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // Get history for charts
    async getHistory(trackerId: string, days = 30): Promise<TrackerEntry[]> {
        const { data, error } = await supabase
            .from('tracker_entries')
            .select('*')
            .eq('tracker_id', trackerId)
            .order('date', { ascending: false }) // Latest first
            .limit(days);

        if (error) throw error;
        // Return reversed (oldest first) for charting
        return (data as TrackerEntry[]).reverse();
    },
    async updateTracker(id: string, updates: Partial<CreateTrackerDTO>): Promise<Tracker> {
        const { data, error } = await supabase
            .from('trackers')
            .update({
                name: updates.name,
                type: updates.type,
                icon: updates.icon,
                color: updates.color,
                settings: updates.settings,
                folder_id: updates.folder_id
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Tracker;
    },


    // Folders
    async getFolders(): Promise<TrackerFolder[]> {
        const { data, error } = await supabase
            .from('tracker_folders')
            .select('*')
            .order('order_index', { ascending: true });

        if (error) throw error;
        return data as TrackerFolder[];
    },

    async createFolder(name: string): Promise<TrackerFolder> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('tracker_folders')
            .insert({ name, user_id: user.id })
            .select()
            .single();

        if (error) throw error;
        return data as TrackerFolder;
    },

    async updateFolder(id: string, name: string): Promise<TrackerFolder> {
        const { data, error } = await supabase
            .from('tracker_folders')
            .update({ name })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as TrackerFolder;
    },

    async deleteFolder(id: string): Promise<void> {
        const { error } = await supabase
            .from('tracker_folders')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
