/**
 * TypeScript types for Custom Shortcuts system V2
 * Supports: actions, URLs, contacts, macros, locations, and folders
 */

export type ActionPlacement = 'quick_access' | 'shortcuts_grid';
export type ShortcutType = 'action' | 'url' | 'contact' | 'macro' | 'location' | 'folder';

export interface CustomShortcut {
    id: string;
    user_id: string;

    // Identity
    custom_name: string;
    custom_icon: string; // Lucide icon name or emoji
    icon_color?: string; // For conditional coloring

    // Actions
    click_action_id?: string;
    long_press_action_id?: string;

    // Macro support
    click_macro?: string[]; // Array of action IDs to execute in sequence
    long_press_macro?: string[];

    // Special types
    shortcut_type: ShortcutType;
    url?: string; // For URL shortcuts
    contact_phone?: string;
    contact_name?: string;

    // Location support
    location_lat?: number;
    location_lng?: number;
    location_address?: string;

    // Folder support
    parent_folder_id?: string | null;
    is_folder?: boolean;
    folder_color?: string;

    // Placement & Order
    placement: ActionPlacement;
    order_index: number;

    // State
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// Helper type for creating new shortcuts
export interface NewCustomShortcut {
    custom_name: string;
    custom_icon: string;
    icon_color?: string;
    click_action_id?: string;
    long_press_action_id?: string;
    click_macro?: string[];
    long_press_macro?: string[];
    shortcut_type: ShortcutType;
    url?: string;
    contact_phone?: string;
    contact_name?: string;
    location_lat?: number;
    location_lng?: number;
    location_address?: string;
    parent_folder_id?: string | null;
    is_folder?: boolean;
    folder_color?: string;
    placement: ActionPlacement;
    order_index?: number;
}

// Saved Preset (Configuration Snapshot)
export interface ShortcutPreset {
    id: string;
    user_id: string;
    preset_name: string;
    preset_description?: string;
    shortcuts_config: CustomShortcut[];
    created_at: string;
    updated_at: string;
}

// All available actions for dropdowns
export interface AvailableAction {
    id: string;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    category: 'info' | 'action' | 'tool' | 'smart';
    description: string;
}
