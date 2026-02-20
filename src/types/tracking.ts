// Basic Tracker Definition
export type TrackerType = 'numeric' | 'boolean' | 'scale' | 'checklist' | 'select' | 'mood' | 'time_range' | 'time';

export interface TrackerFolder {
    id: string;
    user_id: string;
    name: string;
    order_index: number;
    created_at?: string;
}

export interface Tracker {
    id: string;
    user_id: string;
    name: string;
    type: TrackerType;
    icon?: string;
    color?: string;
    order_index: number;
    folder_id?: string | null;
    is_archived: boolean;
    settings: {
        goal?: number; // For numeric/scale
        unit?: string; // e.g. "cups", "km"
        min?: number; // Scale min
        max?: number; // Scale max
        options?: string[]; // For select/checklist
        chart_type?: string; // "line", "bar", "area", "pie"
    };
    created_at?: string;
}

export interface TrackerEntry {
    id: string;
    tracker_id: string;
    value: number;
    date: string;
    note?: string;
    data?: any; // For flexible data (e.g. prompt answers)
}

export interface CreateTrackerDTO {
    name: string;
    type: TrackerType;
    icon?: string;
    color?: string;
    folder_id?: string;
    settings?: {
        min?: number;
        max?: number;
        options?: string[];
        goal?: number;
        unit?: string;
        step?: number;
        chart_type?: string;
    };
}

export interface CreateEntryDTO {
    tracker_id: string;
    value: number;
    data?: any;
    date?: Date;
    note?: string;
}
