export type TrackerType = 'numeric' | 'scale' | 'boolean' | 'text' | 'time' | 'select' | 'checklist' | 'mood' | 'time_range';

export interface Tracker {
    id: string;
    user_id: string;
    name: string;
    icon?: string;
    color?: string;
    type: TrackerType;
    settings: {
        min?: number;
        max?: number;
        options?: string[]; // For select/scale types
        step?: number;
        unit?: string;
        goal?: number;
    };
    order_index: number;
    is_archived: boolean;
    created_at: string;
}

export interface TrackerEntry {
    id: string;
    tracker_id: string;
    user_id: string;
    value: number | null;
    data?: any; // For select (text value), or multi-select
    date: string;
    note?: string;
    created_at: string;
    // Join fields
    tracker?: Tracker;
}

export interface CreateTrackerDTO {
    name: string;
    type: TrackerType;
    icon?: string;
    color?: string;
    settings?: any;
}

export interface CreateEntryDTO {
    tracker_id: string;
    value: number;
    data?: any;
    date?: Date;
    note?: string;
}
