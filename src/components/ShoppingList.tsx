import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ShoppingCart, Plus, Trash2, Edit, Share2, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ShoppingItem {
    id: string;
    text: string;
    quantity: number;
    unit: 'kg' | 'unit' | 'liter' | 'gram';
    completed: boolean;
}

const STORAGE_KEY = 'baraka_shopping_list';

// Sortable Item Component
interface SortableItemProps {
    item: ShoppingItem;
    toggleItem: (id: string) => void;
    startEdit: (item: ShoppingItem) => void;
    deleteItem: (id: string) => void;
    getUnitLabel: (unit: string) => string;
    editingItem: ShoppingItem | null;
    setEditingItem: (item: ShoppingItem | null) => void;
    saveEdit: () => void;
}

const SortableShoppingItem: React.FC<SortableItemProps> = ({
    item, toggleItem, startEdit, deleteItem, getUnitLabel, editingItem, setEditingItem, saveEdit
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-2 p-2.5 rounded-lg border ${item.completed ? 'bg-gray-50' : 'bg-white'} ${isDragging ? 'shadow-lg' : ''}`}
        >
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600">
                <GripVertical className="w-4 h-4" />
            </button>
            <Checkbox
                checked={item.completed}
                onCheckedChange={() => toggleItem(item.id)}
            />
            <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${item.completed ? 'line-through text-gray-400' : ''}`}>
                    {item.text}
                </p>
                <p className="text-[10px] text-gray-500">
                    {item.quantity} {getUnitLabel(item.unit)}
                </p>
            </div>
            <div className="flex gap-0.5">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button size="icon" variant="ghost" onClick={() => startEdit(item)} className="h-7 w-7">
                            <Edit className="w-3 h-3" />
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
                    className="h-7 w-7 text-red-500 hover:text-red-700"
                >
                    <Trash2 className="w-3 h-3" />
                </Button>
            </div>
        </div>
    );
};

const ShoppingList = () => {
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [newItem, setNewItem] = useState('');
    const [newQuantity, setNewQuantity] = useState(1);
    const [newUnit, setNewUnit] = useState<'kg' | 'unit' | 'liter' | 'gram'>('unit');
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
    const { toast } = useToast();

    // Drag and Drop Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

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

    // Handle drag end for reordering
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex(item => item.id === active.id);
            const newIndex = items.findIndex(item => item.id === over.id);
            const reordered = arrayMove(items, oldIndex, newIndex);
            saveItems(reordered);
        }
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
        <div className="space-y-6 container mx-auto px-4 py-4 md:py-8">
            <Card className="w-full">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                            <div className="bg-green-100 p-1.5 rounded-lg">
                                <ShoppingCart className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <CardTitle className="text-base">قائمة التسوق</CardTitle>
                                <p className="text-xs text-gray-500">
                                    {completedCount}/{items.length} مكتمل
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-1.5">
                            <Button
                                onClick={() => {
                                    const listText = items
                                        .map(item => `${item.completed ? '✓' : '○'} ${item.text} - ${item.quantity} ${getUnitLabel(item.unit)}`)
                                        .join('\n');
                                    const url = `https://wa.me/?text=${encodeURIComponent('📝 قائمة التسوق:\\n\\n' + listText)}`;
                                    window.open(url, '_blank');
                                }}
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs text-green-600 border-green-200"
                            >
                                📱
                            </Button>
                            <Button onClick={shareList} variant="outline" size="sm" className="h-7 px-2 text-xs">
                                <Share2 className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Add Item Form */}
                    <div className="flex gap-2 mb-4 flex-wrap">
                        <Input
                            placeholder="أضف عنصر جديد..."
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addItem();
                                    // Keep focus on input for continuous entry
                                    (e.target as HTMLInputElement).focus();
                                }
                            }}
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

                    {/* Items List with Drag and Drop */}
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                                {items.map((item) => (
                                    <SortableShoppingItem
                                        key={item.id}
                                        item={item}
                                        toggleItem={toggleItem}
                                        startEdit={startEdit}
                                        deleteItem={deleteItem}
                                        getUnitLabel={getUnitLabel}
                                        editingItem={editingItem}
                                        setEditingItem={setEditingItem}
                                        saveEdit={saveEdit}
                                    />
                                ))}
                                {items.length === 0 && (
                                    <p className="text-center text-gray-400 py-8 text-sm">لا توجد عناصر في القائمة</p>
                                )}
                            </div>
                        </SortableContext>
                    </DndContext>
                </CardContent>
            </Card>
        </div>
    );
};

export default ShoppingList;
