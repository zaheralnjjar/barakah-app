import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ShoppingCart, Plus, Trash2, X } from 'lucide-react';

interface ShoppingItem {
    id: string;
    text: string;
    completed: boolean;
}

const STORAGE_KEY = 'baraka_shopping_list';

const ShoppingList = () => {
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [newItem, setNewItem] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setItems(JSON.parse(saved));
            } catch (e) { }
        } else {
            // Default items
            setItems([
                { id: '1', text: 'خبز', completed: false },
                { id: '2', text: 'حليب', completed: true },
            ]);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    const addItem = () => {
        if (!newItem.trim()) return;
        const item: ShoppingItem = {
            id: Date.now().toString(),
            text: newItem.trim(),
            completed: false
        };
        setItems([item, ...items]);
        setNewItem('');
    };

    const toggleItem = (id: string) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, completed: !item.completed } : item
        ));
    };

    const deleteItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            addItem();
        }
    };

    return (
        <Card className="h-full bg-white shadow-sm border-gray-100 flex flex-col">
            <CardHeader className="pb-3 border-b border-gray-50 px-4 py-3 shrink-0">
                <CardTitle className="arabic-title text-base flex items-center gap-2 text-primary">
                    <ShoppingCart className="w-4 h-4 text-orange-500" />
                    قائمة التسوق
                </CardTitle>
            </CardHeader>
            <CardContent className="p-3 flex-1 flex flex-col min-h-0">
                <div className="flex gap-2 mb-3 mt-1 shrink-0">
                    <Button
                        size="sm"
                        onClick={addItem}
                        className="bg-orange-500 hover:bg-orange-600 text-white h-8 w-8 p-0 rounded-full shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                    <Input
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="إضافة غرض..."
                        className="h-8 text-right text-sm"
                    />
                </div>

                <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 -mr-2 pr-2">
                    {items.length === 0 ? (
                        <p className="text-center text-gray-400 text-xs py-4 arabic-body">القائمة فارغة</p>
                    ) : (
                        items.map(item => (
                            <div key={item.id} className="group flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteItem(item.id)}
                                    className="h-6 w-6 p-0 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <span className={`arabic-body text-sm truncate ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                        {item.text}
                                    </span>
                                    <Checkbox
                                        checked={item.completed}
                                        onCheckedChange={() => toggleItem(item.id)}
                                        className="h-4 w-4 border-gray-300 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default ShoppingList;
