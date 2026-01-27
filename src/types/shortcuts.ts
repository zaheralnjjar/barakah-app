/**
 * TypeScript types for Custom Shortcuts system
 * Supports: actions, URLs, contacts, and macros
 */

export type ActionPlacement = 'quick_access' | 'shortcuts_grid';
export type ShortcutType = 'action' | 'url' | 'contact' | 'macro';

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
    placement: ActionPlacement;
    order_index?: number;
}

// All available actions for dropdowns
export interface AvailableAction {
    id: string;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    category: 'info' | 'action' | 'tool' | 'smart';
    description: string;
}
