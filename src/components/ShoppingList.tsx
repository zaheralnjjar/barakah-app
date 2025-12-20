import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ShoppingCart, Plus, Trash2, Edit, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ShoppingItem {
    id: string;
    text: string;
    quantity: number;
    unit: 'kg' | 'unit' | 'liter' | 'gram';
    completed: boolean;
}

const STORAGE_KEY = 'baraka_shopping_list';

const ShoppingList = () => {
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [newItem, setNewItem] = useState('');
    const [newQuantity, setNewQuantity] = useState(1);
    const [newUnit, setNewUnit] = useState<'kg' | 'unit' | 'liter' | 'gram'>('unit');
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
    const { toast } = useToast();

    // Initial Load
    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (user) {
                const { data } = await supabase.from('logistics_data_2025_12_18_18_42').select('shopping_list').eq('user_id', user.id).single();
                if (data?.shopping_list) {
                    setItems(data.shopping_list.map((i: any) => ({
                        id: i.id?.toString() || Date.now().toString(),
                        text: i.name || i.text,
                        quantity: i.quantity || 1,
                        unit: i.unit || 'unit',
                        completed: i.completed
                    })));
                } else {
                    const saved = localStorage.getItem(STORAGE_KEY);
                    if (saved) setItems(JSON.parse(saved));
                }
            } else {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) setItems(JSON.parse(saved));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const saveItems = async (newItems: ShoppingItem[]) => {
        setItems(newItems);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));

        const user = (await supabase.auth.getUser()).data.user;
        if (user) {
            await supabase.from('logistics_data_2025_12_18_18_42')
                .update({
                    shopping_list: newItems.map(i => ({
                        id: i.id,
                        name: i.text,
                        quantity: i.quantity,
                        unit: i.unit,
                        completed: i.completed
                    })),
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id);
        }
    };

    const addItem = async () => {
        if (!newItem.trim()) return;
        const item: ShoppingItem = {
            id: Date.now().toString(),
            text: newItem.trim(),
            quantity: newQuantity,
            unit: newUnit,
            completed: false
        };
        const updated = [item, ...items];
        await saveItems(updated);
        setNewItem('');
        setNewQuantity(1);
        setNewUnit('unit');
        toast({ title: 'تمت الإضافة', description: 'تم إضافة العنصر للقائمة' });
    };

    const toggleItem = (id: string) => {
        const updated = items.map(item =>
            item.id === id ? { ...item, completed: !item.completed } : item
        );
        saveItems(updated);
    };

    const deleteItem = (id: string) => {
        const updated = items.filter(item => item.id !== id);
        saveItems(updated);
        toast({ title: 'تم الحذف', description: 'تم حذف العنصر من القائمة' });
    };

    const startEdit = (item: ShoppingItem) => {
        setEditingItem(item);
    };

    const saveEdit = () => {
        if (!editingItem) return;
        const updated = items.map(item =>
            item.id === editingItem.id ? editingItem : item
        );
        saveItems(updated);
        setEditingItem(null);
        toast({ title: 'تم التحديث', description: 'تم تحديث العنصر بنجاح' });
    };

    const shareList = async () => {
        const listText = items
            .map(item => `${item.completed ? '✓' : '○'} ${item.text} - ${item.quantity} ${getUnitLabel(item.unit)}`)
            .join('\n');

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'قائمة التسوق - بركة',
                    text: listText,
                });
                toast({ title: 'تمت المشاركة', description: 'تم مشاركة القائمة بنجاح' });
            } catch (err) {
                console.error(err);
            }
        } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(listText);
            toast({ title: 'تم النسخ', description: 'تم نسخ القائمة للحافظة' });
        }
    };

    const getUnitLabel = (unit: string) => {
        const labels = {
            'kg': 'كيلو',
            'unit': 'وحدة',
            'liter': 'لتر',
            'gram': 'جرام'
        };
        return labels[unit as keyof typeof labels] || unit;
    };

    if (loading) return <div className="text-center p-4">جاري التحميل...</div>;

    const completedCount = items.filter(i => i.completed).length;

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-xl">
                            <ShoppingCart className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <CardTitle className="text-xl arabic-title">قائمة التسوق</CardTitle>
                            <p className="text-sm text-gray-500">
                                {completedCount} من {items.length} مكتمل
                            </p>
                        </div>
                    </div>
                    <Button onClick={shareList} variant="outline" size="sm">
                        <Share2 className="w-4 h-4 ml-2" />
                        مشاركة
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {/* Add Item Form */}
                <div className="flex gap-2 mb-4 flex-wrap">
                    <Input
                        placeholder="أضف عنصر جديد..."
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addItem()}
                        className="flex-1 min-w-[150px]"
                    />
                    <Input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(parseFloat(e.target.value) || 1)}
                        className="w-24"
                        placeholder="الكمية"
                    />
                    <Select value={newUnit} onValueChange={(v: any) => setNewUnit(v)}>
                        <SelectTrigger className="w-28">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="unit">وحدة</SelectItem>
                            <SelectItem value="kg">كيلو</SelectItem>
                            <SelectItem value="gram">جرام</SelectItem>
                            <SelectItem value="liter">لتر</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={addItem} className="bg-green-600 hover:bg-green-700">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${item.completed ? 'bg-gray-50' : 'bg-white'
                                }`}
                        >
                            <Checkbox
                                checked={item.completed}
                                onCheckedChange={() => toggleItem(item.id)}
                            />
                            <div className="flex-1">
                                <p className={`${item.completed ? 'line-through text-gray-400' : ''}`}>
                                    {item.text}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {item.quantity} {getUnitLabel(item.unit)}
                                </p>
                            </div>
                            <div className="flex gap-1">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => startEdit(item)}
                                            className="h-8 w-8"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>تعديل العنصر</DialogTitle>
                                        </DialogHeader>
                                        {editingItem && editingItem.id === item.id && (
                                            <div className="space-y-4">
                                                <Input
                                                    value={editingItem.text}
                                                    onChange={(e) => setEditingItem({ ...editingItem, text: e.target.value })}
                                                    placeholder="اسم العنصر"
                                                />
                                                <Input
                                                    type="number"
                                                    min="0.1"
                                                    step="0.1"
                                                    value={editingItem.quantity}
                                                    onChange={(e) => setEditingItem({ ...editingItem, quantity: parseFloat(e.target.value) })}
                                                    placeholder="الكمية"
                                                />
                                                <Select
                                                    value={editingItem.unit}
                                                    onValueChange={(v: any) => setEditingItem({ ...editingItem, unit: v })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="unit">وحدة</SelectItem>
                                                        <SelectItem value="kg">كيلو</SelectItem>
                                                        <SelectItem value="gram">جرام</SelectItem>
                                                        <SelectItem value="liter">لتر</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button onClick={saveEdit} className="w-full">
                                                    حفظ
                                                </Button>
                                            </div>
                                        )}
                                    </DialogContent>
                                </Dialog>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => deleteItem(item.id)}
                                    className="h-8 w-8 text-red-500 hover:text-red-700"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {items.length === 0 && (
                        <p className="text-center text-gray-400 py-8">لا توجد عناصر في القائمة</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default ShoppingList;
