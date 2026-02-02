import { useState, useEffect } from 'react';

export interface QuickAccessSlot {
    id: string; // custom_1, custom_2, etc.
    type: 'action' | 'location' | 'link' | 'empty';
    targetId?: string; // Action ID or Location ID
    label?: string; // Custom Label
    icon?: string; // Icon Name (if applicable)
    color?: string; // Color class (bg-red-500 etc)
    url?: string; // If link
}

const DEFAULT_SLOTS: QuickAccessSlot[] = [
    { id: 'custom_1', type: 'empty', label: 'اختصار 1', color: 'bg-teal-500 text-white' },
    { id: 'custom_2', type: 'empty', label: 'اختصار 2', color: 'bg-cyan-500 text-white' },
    { id: 'custom_3', type: 'empty', label: 'اختصار 3', color: 'bg-sky-500 text-white' },
    { id: 'custom_4', type: 'empty', label: 'اختصار 4', color: 'bg-blue-400 text-white' },
];

export const useQuickAccessCustomization = () => {
    const [slots, setSlots] = useState<QuickAccessSlot[]>(DEFAULT_SLOTS);

    // Load from LocalStorage
    const loadFromStorage = () => {
        try {
            const stored = localStorage.getItem('quick_access_custom_slots');
            if (stored) {
                const parsed = JSON.parse(stored);
                const merged = DEFAULT_SLOTS.map(def =>
                    parsed.find((p: QuickAccessSlot) => p.id === def.id) || def
                );
                setSlots(merged);
            }
        } catch (e) {
            console.error("Failed to load quick access slots", e);
        }
    };

    useEffect(() => {
        loadFromStorage();

        const handleUpdate = () => loadFromStorage();
        window.addEventListener('quick_access_updated', handleUpdate);
        return () => window.removeEventListener('quick_access_updated', handleUpdate);
    }, []);

    const updateSlot = (slotId: string, data: Partial<QuickAccessSlot>) => {
        setSlots(prev => {
            const newSlots = prev.map(slot =>
                slot.id === slotId ? { ...slot, ...data } : slot
            );
            localStorage.setItem('quick_access_custom_slots', JSON.stringify(newSlots));
            window.dispatchEvent(new Event('quick_access_updated'));
            return newSlots;
        });
    };

    const resetSlot = (slotId: string) => {
        const defaultSlot = DEFAULT_SLOTS.find(d => d.id === slotId);
        if (defaultSlot) {
            // We pass the default values (including empty type and default color)
            updateSlot(slotId, { ...defaultSlot, type: 'empty' });
        }
    };

    return {
        slots,
        updateSlot,
        resetSlot
    };
};
