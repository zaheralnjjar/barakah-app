import { useState, useEffect, useCallback } from 'react';

export interface ShortcutLocation {
    id: string;
    name: string;
    url: string;
}

import { AVAILABLE_ACTIONS } from '@/constants/actionDefinitions';

export const useShortcuts = () => {
    const [customShortcuts, setCustomShortcuts] = useState<string[]>([]);
    const [customLocations, setCustomLocations] = useState<ShortcutLocation[]>([]);

    const loadData = useCallback(() => {
        try {
            const savedShortcuts = localStorage.getItem('baraka_custom_shortcuts');
            const savedLocations = localStorage.getItem('baraka_custom_locations');
            const version = 'v6_grid_perfect_match';
            const savedVersion = localStorage.getItem('baraka_shortcuts_version');

            if (savedShortcuts && savedVersion === version) {
                try {
                    const parsed: string[] = JSON.parse(savedShortcuts);
                    // Prune invalid IDs
                    const valid = parsed.filter(id => AVAILABLE_ACTIONS.some(a => a.id === id));
                    setCustomShortcuts(valid);
                    // Update local storage if pruned
                    if (valid.length !== parsed.length) {
                        localStorage.setItem('baraka_custom_shortcuts', JSON.stringify(valid));
                    }
                } catch (e) {
                    console.error('Error parsing shortcuts', e);
                    // Fallback to defaults if parsing fails
                    const defaults = [
                        'shopping', 'location', 'expense', 'event', 'timer',
                        'note', 'open_academic', 'open_tools', 'show_new_muslims', 'open_settings'
                    ];
                    setCustomShortcuts(defaults);
                    localStorage.setItem('baraka_custom_shortcuts', JSON.stringify(defaults));
                    localStorage.setItem('baraka_shortcuts_version', version);
                }
            } else {
                // Force update to new defaults matching user screenshot (RTL order: TopRight -> TopLeft, then BotRight -> BotLeft)
                const defaults = [
                    'shopping', 'location', 'expense', 'event', 'timer',
                    'note', 'open_academic', 'open_tools', 'show_new_muslims', 'open_settings'
                ];
                setCustomShortcuts(defaults);
                localStorage.setItem('baraka_custom_shortcuts', JSON.stringify(defaults));
                localStorage.setItem('baraka_shortcuts_version', version);
            }

            if (savedLocations) {
                setCustomLocations(JSON.parse(savedLocations));
            } else {
                setCustomLocations([]);
            }
        } catch (error) {
            console.error('Error loading shortcuts/locations:', error);
        }
    }, []);

    useEffect(() => {
        loadData();

        const handleSync = () => loadData();
        window.addEventListener('shortcuts-updated', handleSync);
        window.addEventListener('locations-updated', handleSync);

        return () => {
            window.removeEventListener('shortcuts-updated', handleSync);
            window.removeEventListener('locations-updated', handleSync);
        };
    }, [loadData]);

    const addShortcut = (id: string) => {
        const updated = [...customShortcuts];
        if (!updated.includes(id)) {
            updated.push(id);
            setCustomShortcuts(updated);
            localStorage.setItem('baraka_custom_shortcuts', JSON.stringify(updated));
            window.dispatchEvent(new Event('shortcuts-updated'));
        }
    };

    const removeShortcut = (id: string) => {
        const updated = customShortcuts.filter(s => s !== id);
        setCustomShortcuts(updated);
        localStorage.setItem('baraka_custom_shortcuts', JSON.stringify(updated));
        window.dispatchEvent(new Event('shortcuts-updated'));
    };

    const addLocation = (name: string, url: string) => {
        const newLoc: ShortcutLocation = { id: crypto.randomUUID(), name, url };
        const updated = [newLoc, ...customLocations];
        setCustomLocations(updated);
        localStorage.setItem('baraka_custom_locations', JSON.stringify(updated));
        window.dispatchEvent(new Event('locations-updated'));
    };

    const removeLocation = (id: string) => {
        const updated = customLocations.filter(l => l.id !== id);
        setCustomLocations(updated);
        localStorage.setItem('baraka_custom_locations', JSON.stringify(updated));
        window.dispatchEvent(new Event('locations-updated'));
    };

    return {
        customShortcuts,
        customLocations,
        addShortcut,
        removeShortcut,
        addLocation,
        removeLocation,
        refresh: loadData
    };
};
