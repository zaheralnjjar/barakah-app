import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TriggerType = 'time' | 'location' | 'prayer' | 'app_event';
export type ActionType = 'notification' | 'sound' | 'mode_change' | 'todo_add';

export interface Trigger {
    type: TriggerType;
    value: any; // e.g., '14:00', {lat, lng}, 'fajr'
    condition?: string; // 'equals', 'contains', 'radius'
}

export interface Action {
    type: ActionType;
    payload: {
        message?: string;
        title?: string;
        [key: string]: any;
    };
}

export interface Rule {
    id: string;
    name: string;
    isEnabled: boolean;
    trigger: Trigger;
    action: Action;
    lastRun?: number;
}

interface AutomationState {
    rules: Rule[];
    addRule: (rule: Omit<Rule, 'id' | 'isEnabled'>) => void;
    toggleRule: (id: string) => void;
    deleteRule: (id: string) => void;
    updateRule: (id: string, updates: Partial<Rule>) => void;
}

export const useAutomationStore = create<AutomationState>()(
    persist(
        (set) => ({
            rules: [],
            addRule: (ruleData) => set((state) => ({
                rules: [...state.rules, { ...ruleData, id: Date.now().toString(), isEnabled: true }]
            })),
            toggleRule: (id) => set((state) => ({
                rules: state.rules.map((r) => r.id === id ? { ...r, isEnabled: !r.isEnabled } : r)
            })),
            deleteRule: (id) => set((state) => ({
                rules: state.rules.filter((r) => r.id !== id)
            })),
            updateRule: (id, updates) => set((state) => ({
                rules: state.rules.map((r) => r.id === id ? { ...r, ...updates } : r)
            })),
        }),
        {
            name: 'barakah-automation-rules',
        }
    )
);
