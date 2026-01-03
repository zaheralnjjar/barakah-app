import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ShoppingItem {
    id: string;
    text: string;
    quantity: number;
    unit: 'kg' | 'unit' | 'liter' | 'gram';
    completed: boolean;
    deadline?: string;
    createdAt?: string;
}

const STORAGE_KEY = 'baraka_shopping_list';
const EVENT_KEY = 'shopping-list-updated';

export const useShoppingList = () => {
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchItems = useCallback(async () => {
        try {
            const user = (await supabase.auth.getUser()).data.user;
            let loadedItems: ShoppingItem[] = [];

            // 1. Try Local Storage first for immediate feedback (or offline)
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    // Map legacy or external formats to standardized ShoppingItem
                    loadedItems = parsed.map((i: any) => ({
                        id: i.id?.toString() || Date.now().toString(),
                        text: i.text || i.name || 'Unnamed Item',
                        quantity: i.quantity || 1,
                        unit: i.unit || 'unit',
                        completed: !!i.completed,
                        deadline: i.deadline || null,
                        createdAt: i.createdAt || i.addedAt || new Date().toISOString()
                    }));
                } catch (e) {
                    console.error("Error parsing local shopping list", e);
                }
            }

            // 2. If user is logged in, try to fetch/sync with Supabase
            // Note: In a real robust sync, we'd merge. For now, Supabase applies over local if exists.
            if (user) {
                const { data, error } = await supabase
                    .from('logistics_data_2025_12_18_18_42')
                    .select('shopping_list')
                    .eq('user_id', user.id)
                    .single();

                if (!error && data?.shopping_list) {
                    // Prefer server data if available, but maybe we should merge? 
                    // For simplicity, let's respect the server as source of truth if it has data.
                    // But we must map it correctly.
                    const serverItems = data.shopping_list.map((i: any) => ({
                        id: i.id?.toString() || Date.now().toString(),
                        text: i.text || i.name || 'Unnamed Item',
                        quantity: i.quantity || 1,
                        unit: i.unit || 'unit',
                        completed: !!i.completed,
                        deadline: i.deadline || null,
                        createdAt: i.createdAt || i.addedAt || new Date().toISOString()
                    }));

                    // If server has data, use it. Otherwise keep local.
                    if (serverItems.length > 0 || loadedItems.length === 0) {
                        loadedItems = serverItems;
                    }
                }
            }

            setItems(loadedItems);
        } catch (error) {
            console.error('Error fetching shopping list:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load and Event Listener
    useEffect(() => {
        fetchItems();

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY) {
                fetchItems();
            }
        };

        const handleCustomEvent = () => fetchItems();

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener(EVENT_KEY, handleCustomEvent);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener(EVENT_KEY, handleCustomEvent);
        };
    }, [fetchItems]);

    // Persist helper
    const persistItems = async (newItems: ShoppingItem[]) => {
        // 1. Update State
        setItems(newItems);

        // 2. Update Local Storage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));

        // 3. Dispatch Event for other components
        window.dispatchEvent(new Event(EVENT_KEY));

        // 4. Update Supabase
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (user) {
                await supabase.from('logistics_data_2025_12_18_18_42')
                    .update({
                        shopping_list: newItems,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', user.id);
            }
        } catch (error) {
            console.error("Error syncing shopping list to Supabase", error);
        }
    };

    const addItem = async (item: Partial<ShoppingItem>) => {
        const newItem: ShoppingItem = {
            id: Date.now().toString(),
            text: item.text || 'New Item',
            quantity: item.quantity || 1,
            unit: item.unit || 'unit',
            completed: false,
            deadline: item.deadline || undefined,
            createdAt: new Date().toISOString(),
            ...item
        };

        // Handle Reminder Logic if deadline exists (moved from SmartDashboard)
        if (newItem.deadline) {
            try {
                const reminders = JSON.parse(localStorage.getItem('baraka_reminders') || '[]');
                const deadlineDate = new Date(newItem.deadline);
                const now = new Date();

                // Reminder on deadline day morning (8 AM)
                const dayOfReminder = new Date(deadlineDate);
                dayOfReminder.setHours(8, 0, 0, 0);
                reminders.push({
                    id: `shop-${newItem.id}-day`,
                    type: 'shopping',
                    title: `🛒 تذكير: ${newItem.text}`,
                    message: `اليوم آخر موعد لشراء: ${newItem.text}`,
                    scheduledFor: dayOfReminder.toISOString(),
                    itemId: newItem.id
                });

                // Reminder day before (8 AM)
                const dayBefore = new Date(deadlineDate);
                dayBefore.setDate(dayBefore.getDate() - 1);
                dayBefore.setHours(8, 0, 0, 0);
                if (dayBefore > now) {
                    reminders.push({
                        id: `shop-${newItem.id}-before`,
                        type: 'shopping',
                        title: `🛒 تذكير: ${newItem.text}`,
                        message: `غداً آخر موعد لشراء: ${newItem.text}`,
                        scheduledFor: dayBefore.toISOString(),
                        itemId: newItem.id
                    });
                }
                localStorage.setItem('baraka_reminders', JSON.stringify(reminders));
            } catch (e) {
                console.error("Error adding reminders", e);
            }
        }

        const updated = [newItem, ...items];
        await persistItems(updated);
        return newItem;
    };

    const updateItem = async (id: string, updates: Partial<ShoppingItem>) => {
        const updated = items.map(item => item.id === id ? { ...item, ...updates } : item);
        await persistItems(updated);
    };

    const deleteItem = async (id: string) => {
        const updated = items.filter(item => item.id !== id);
        await persistItems(updated);
    };

    const toggleItem = async (id: string) => {
        const item = items.find(i => i.id === id);
        if (item) {
            await updateItem(id, { completed: !item.completed });
        }
    };

    const reorderItems = async (newItems: ShoppingItem[]) => {
        await persistItems(newItems);
    };

    return {
        items,
        loading,
        addItem,
        updateItem,
        deleteItem,
        toggleItem,
        reorderItems
    };
};
