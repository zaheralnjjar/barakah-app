import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ShoppingCart, Plus, Trash2, Edit, Share2, GripVertical, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useShoppingList, ShoppingItem } from '@/hooks/useShoppingList';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

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
                <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 mt-0.5">
                    <span>
                        {item.quantity} {getUnitLabel(item.unit)}
                    </span>
                    {item.deadline && (
                        <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-1.5 rounded">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(item.deadline), 'dd/MM/yyyy')}
                        </span>
                    )}
                    {item.createdAt && (
                        <span className="flex items-center gap-1 text-gray-400">
                            <Clock className="w-3 h-3" />
                            {format(new Date(item.createdAt), 'dd/MM', { locale: arSA })}
                        </span>
                    )}
                </div>
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
                                <div className="grid grid-cols-2 gap-3">
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
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">تاريخ الاستحقاق (اختياري)</label>
                                    <Input
                                        type="date"
                                        value={editingItem.deadline || ''}
                                        onChange={(e) => setEditingItem({ ...editingItem, deadline: e.target.value })}
                                    />
                                </div>
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
    const { items, loading, addItem, updateItem, deleteItem, toggleItem, reorderItems } = useShoppingList();
    const [newItem, setNewItem] = useState('');
    const [newQuantity, setNewQuantity] = useState(1);
    const [newUnit, setNewUnit] = useState<'kg' | 'unit' | 'liter' | 'gram'>('unit');
    const [newDeadline, setNewDeadline] = useState('');
    const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
    const [showDeadlineInput, setShowDeadlineInput] = useState(false);
    const { toast } = useToast();

    // Drag and Drop Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleAddItem = async () => {
        if (!newItem.trim()) return;
        await addItem({
            text: newItem.trim(),
            quantity: newQuantity,
            unit: newUnit,
            deadline: newDeadline || undefined
        });
        setNewItem('');
        setNewQuantity(1);
        setNewUnit('unit');
        setNewDeadline('');
        setShowDeadlineInput(false);
        toast({ title: 'تمت الإضافة', description: 'تم إضافة العنصر للقائمة' });
    };

    // Handle drag end for reordering
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex(item => item.id === active.id);
            const newIndex = items.findIndex(item => item.id === over.id);
            const reordered = arrayMove(items, oldIndex, newIndex);
            reorderItems(reordered);
        }
    };

    const startEdit = (item: ShoppingItem) => {
        setEditingItem(item);
    };

    const saveEdit = async () => {
        if (!editingItem) return;
        await updateItem(editingItem.id, editingItem);
        setEditingItem(null);
        toast({ title: 'تم التحديث', description: 'تم تحديث العنصر بنجاح' });
    };

    const shareList = async () => {
        const listText = items
            .map(item => `${item.completed ? '✓' : '○'} ${item.text} - ${item.quantity} ${getUnitLabel(item.unit)}${item.deadline ? ` (قبل: ${item.deadline})` : ''}`)
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
                    <div className="flex flex-col gap-2 mb-4">
                        <div className="flex gap-2 flex-wrap">
                            <Input
                                placeholder="أضف عنصر جديد..."
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddItem();
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
                                className="w-20"
                                placeholder="الكمية"
                            />
                            <Select value={newUnit} onValueChange={(v: any) => setNewUnit(v)}>
                                <SelectTrigger className="w-24">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unit">وحدة</SelectItem>
                                    <SelectItem value="kg">كيلو</SelectItem>
                                    <SelectItem value="gram">جرام</SelectItem>
                                    <SelectItem value="liter">لتر</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="icon"
                                className={`w-10 ${showDeadlineInput ? 'bg-orange-50 border-orange-200 text-orange-600' : ''}`}
                                onClick={() => setShowDeadlineInput(!showDeadlineInput)}
                                title="إضافة تاريخ استحقاق"
                            >
                                <Calendar className="w-4 h-4" />
                            </Button>
                            <Button onClick={handleAddItem} className="bg-green-600 hover:bg-green-700">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                        {showDeadlineInput && (
                            <div className="animate-in slide-in-from-top-2">
                                <Input
                                    type="date"
                                    value={newDeadline}
                                    onChange={(e) => setNewDeadline(e.target.value)}
                                    className="w-full sm:w-1/2"
                                />
                            </div>
                        )}
                    </div>

                    {/* Items List with Drag and Drop */}
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
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
