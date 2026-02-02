import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { googleTasksService } from '@/services/GoogleTasksService';

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

    // Fetch from Supabase
    const fetchItems = useCallback(async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data, error } = await supabase
                    .from('shopping_items')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Supabase fetch error:', error);
                    // Fallback to local storage
                    const saved = localStorage.getItem(STORAGE_KEY);
                    if (saved) setItems(JSON.parse(saved));
                } else if (data) {
                    const mappedItems: ShoppingItem[] = data.map((i: any) => ({
                        id: i.id,
                        text: i.text,
                        quantity: i.quantity,
                        unit: i.unit,
                        completed: i.completed,
                        deadline: i.deadline,
                        createdAt: i.created_at
                    }));
                    setItems(mappedItems);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(mappedItems));
                }
            } else {
                // Not logged in, load from local
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) setItems(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Error fetching shopping list:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial Load
    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    // Helpers
    const syncToSupabase = async (operation: 'insert' | 'update' | 'delete', payload: any, id?: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return; // Local only

            if (operation === 'insert') {
                await supabase.from('shopping_items').insert({ ...payload, user_id: user.id });
            } else if (operation === 'update' && id) {
                await supabase.from('shopping_items').update(payload).eq('id', id);
            } else if (operation === 'delete' && id) {
                await supabase.from('shopping_items').delete().eq('id', id);
            }
        } catch (e) {
            console.error("Supabase sync error", e);
            toast({ title: "خطأ في المزامنة", description: "لم يتم حفظ التغييرات في السحابة", variant: "destructive" });
        }
    };

    const addItem = async (item: Partial<ShoppingItem>) => {
        const newItem: ShoppingItem = {
            id: crypto.randomUUID(), // Temporarily generate UUID locally
            text: item.text || 'New Item',
            quantity: item.quantity || 1,
            unit: item.unit || 'unit',
            completed: false,
            deadline: item.deadline || undefined,
            createdAt: new Date().toISOString(),
            ...item
        };

        // Optimistic Update
        const updated = [newItem, ...items];
        setItems(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        // Sync
        await syncToSupabase('insert', {
            id: newItem.id,
            text: newItem.text,
            quantity: newItem.quantity,
            unit: newItem.unit,
            completed: newItem.completed,
            deadline: newItem.deadline,
            created_at: newItem.createdAt
        });

        // Dispatch global event for cross-component sync
        window.dispatchEvent(new CustomEvent('shopping-list-updated'));

        return newItem;
    };

    const updateItem = async (id: string, updates: Partial<ShoppingItem>) => {
        const updated = items.map(item => item.id === id ? { ...item, ...updates } : item);
        setItems(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        // Map updates to DB columns (camelCase to snake_case if needed, but DB is simple)
        // Our DB cols: text, quantity, unit, completed, deadline, created_at.
        // Updates might contain these keys.
        const dbUpdates: any = {};
        if (updates.text !== undefined) dbUpdates.text = updates.text;
        if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
        if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
        if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
        if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;

        if (Object.keys(dbUpdates).length > 0) {
            await syncToSupabase('update', dbUpdates, id);
        }
    };

    const deleteItem = async (id: string) => {
        const updated = items.filter(item => item.id !== id);
        setItems(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        await syncToSupabase('delete', null, id);
    };

    const toggleItem = async (id: string) => {
        const item = items.find(i => i.id === id);
        if (item) {
            await updateItem(id, { completed: !item.completed });
        }
    };

    const reorderItems = async (newItems: ShoppingItem[]) => {
        setItems(newItems);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
        // Reordering not fully supported in simple DB without 'order' column.
        // For now, we just save local.
    };

    const syncWithGoogle = useCallback(async () => {
        const isEnabled = localStorage.getItem('google_tasks_sync_enabled') === 'true';
        if (!isEnabled) return;

        try {
            await googleTasksService.syncShoppingList();
            await fetchItems(); // Refresh local state after sync
        } catch (err) {
            console.error('Google Tasks Sync failed', err);
        }
    }, [fetchItems]);

    // Periodically sync if enabled
    useEffect(() => {
        const interval = setInterval(syncWithGoogle, 30000); // Every 30s
        return () => clearInterval(interval);
    }, [syncWithGoogle]);

    return {
        items,
        loading,
        addItem,
        updateItem,
        deleteItem,
        toggleItem,
        reorderItems,
        syncWithGoogle
    };
};
