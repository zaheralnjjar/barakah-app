
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSystemModes, SystemMode, ModeItem, CustomAction } from '@/hooks/useSystemModes';
import { useCustomShortcuts } from '@/hooks/useCustomShortcuts';
import { useLocations } from '@/hooks/useLocations';
import { Zap, Plus, Trash2, Clock, MapPin, Layers, Bell, Smartphone, Send, Calendar as CalendarIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

interface SystemModeEditorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    modeId?: string | null;
}

const DAYS_OF_WEEK = [
    { id: '1', name: 'الاثنين' },
    { id: '2', name: 'الثلاثاء' },
    { id: '3', name: 'الأربعاء' },
    { id: '4', name: 'الخميس' },
    { id: '5', name: 'الجمعة' },
    { id: '6', name: 'السبت' },
    { id: '0', name: 'الأحد' }
];

const ICONS = ['Zap', 'Briefcase', 'Moon', 'Sun', 'Book', 'Heart', 'Coffee', 'Car', 'Plane', 'Home'];
const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

export const SystemModeEditorDialog: React.FC<SystemModeEditorDialogProps> = ({ open, onOpenChange, modeId }) => {
    const { toast } = useToast();
    const { modes, createMode, updateMode } = useSystemModes();
    const { shortcuts } = useCustomShortcuts();
    const { locations } = useLocations();

    const [name, setName] = useState('');
    const [icon, setIcon] = useState('Zap');
    const [color, setColor] = useState('#8b5cf6');
    const [autoActivate, setAutoActivate] = useState(false);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [recurrence, setRecurrence] = useState('daily');

    const [modeItems, setModeItems] = useState<ModeItem[]>([]);
    const [selectedShortcutIds, setSelectedShortcutIds] = useState<string[]>([]);
    const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
    const [customActions, setCustomActions] = useState<CustomAction[]>([]);

    // Form for adding individual items
    const [newItemText, setNewItemText] = useState('');
    const [newItemType, setNewItemType] = useState<'task' | 'appointment' | 'habit' | 'medication'>('task');
    const [newItemTime, setNewItemTime] = useState('');

    useEffect(() => {
        if (modeId) {
            const mode = modes.find(m => m.id === modeId);
            if (mode) {
                setName(mode.name);
                setIcon(mode.icon);
                setColor(mode.color);
                setAutoActivate(mode.auto_activate);
                setStartTime(mode.start_time || '');
                setEndTime(mode.end_time || '');
                setRecurrence(mode.recurrence);
                setModeItems(mode.mode_items);
                setSelectedShortcutIds(mode.shortcut_ids);
                setSelectedLocationIds(mode.location_ids);
                setCustomActions(mode.custom_actions || []);
            }
        } else {
            // Reset for new
            setName('');
            setIcon('Zap');
            setColor('#8b5cf6');
            setAutoActivate(false);
            setStartTime('');
            setEndTime('');
            setRecurrence('daily');
            setModeItems([]);
            setSelectedShortcutIds([]);
            setSelectedLocationIds([]);
            setCustomActions([]);
        }
    }, [modeId, modes, open]);

    const handleAddItem = () => {
        if (!newItemText.trim()) return;
        const item: ModeItem = {
            id: Date.now().toString(),
            text: newItemText,
            type: newItemType,
            time: newItemTime || null,
            repeat: 'daily',
            customDays: null,
            category: 'general',
            startDate: null,
            endDate: null,
            dayOfMonth: null
        };
        setModeItems([...modeItems, item]);
        setNewItemText('');
        setNewItemTime('');
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast({ title: 'يرجى إدخال اسم الوضع', variant: 'destructive' });
            return;
        }

        const modeData: Partial<SystemMode> = {
            name,
            icon,
            color,
            auto_activate: autoActivate,
            start_time: startTime || null,
            end_time: endTime || null,
            recurrence,
            mode_items: modeItems,
            shortcut_ids: selectedShortcutIds,
            location_ids: selectedLocationIds,
            custom_actions: customActions
        };

        try {
            if (modeId) {
                await updateMode({ id: modeId, updates: modeData });
            } else {
                await createMode(modeData);
            }
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast({ title: 'فشل الحفظ', variant: 'destructive' });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-purple-600" />
                        {modeId ? 'تعديل الملف الشخصي' : 'إنشاء ملف شخصي جديد'}
                    </DialogTitle>
                    <DialogDescription>
                        قم بتخصيص هذا الوضع لتغيير سلوك التطبيق عند تفعيله
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>اسم الوضع</Label>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="مثل: وضع العمل، وضع السفر" />
                        </div>
                        <div className="space-y-2">
                            <Label>الأيقونة واللون</Label>
                            <div className="flex gap-2">
                                <Select value={icon} onValueChange={setIcon}>
                                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {ICONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <div className="flex gap-1 items-center">
                                    {COLORS.map(c => (
                                        <button
                                            key={c}
                                            className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-black' : 'border-transparent'}`}
                                            style={{ backgroundColor: c }}
                                            onClick={() => setColor(c)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Auto Activation */}
                    <div className="bg-purple-50 p-4 rounded-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-purple-600" />
                                <span className="font-bold text-sm">التفعيل التلقائي</span>
                            </div>
                            <Checkbox checked={autoActivate} onCheckedChange={(val) => setAutoActivate(!!val)} />
                        </div>
                        {autoActivate && (
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <Label className="text-xs">وقت البدء</Label>
                                    <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-8" />
                                </div>
                                <div>
                                    <Label className="text-xs">وقت الانتهاء</Label>
                                    <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-8" />
                                </div>
                                <div>
                                    <Label className="text-xs">التكرار</Label>
                                    <Select value={recurrence} onValueChange={setRecurrence}>
                                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="daily">يومي</SelectItem>
                                            <SelectItem value="weekly">أسبوعي</SelectItem>
                                            <SelectItem value="workdays">أيام العمل</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mode Items (Tasks, etc) */}
                    <div className="space-y-3">
                        <Label className="font-bold border-b pb-1 flex justify-between">
                            <span>المهام والعناصر المرتبطة</span>
                            <Badge variant="outline">{modeItems.length}</Badge>
                        </Label>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {modeItems.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm">
                                    <Badge variant="secondary" className="text-[10px]">
                                        {item.type === 'task' ? 'مهمة' : item.type === 'medication' ? 'دواء' : 'عادة'}
                                    </Badge>
                                    <span className="flex-1">{item.text}</span>
                                    {item.time && <span className="text-xs text-gray-500">{item.time}</span>}
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setModeItems(modeItems.filter((_, i) => i !== idx))}>
                                        <Trash2 className="w-3 h-3 text-red-400" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input value={newItemText} onChange={e => setNewItemText(e.target.value)} placeholder="إضافة مهمة جديدة للملف..." className="flex-1 h-9" />
                            <Input type="time" value={newItemTime} onChange={e => setNewItemTime(e.target.value)} className="w-24 h-9" />
                            <Button size="sm" onClick={handleAddItem} className="bg-purple-600"><Plus className="w-4 h-4" /></Button>
                        </div>
                    </div>

                    {/* Shortcuts Multi-select */}
                    <div className="space-y-2">
                        <Label className="font-bold flex items-center gap-2">
                            <Layers className="w-4 h-4 text-blue-600" />
                            الاختصارات المرتبطة
                        </Label>
                        <div className="flex flex-wrap gap-2 p-2 border rounded-lg min-h-12">
                            {shortcuts.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => {
                                        if (selectedShortcutIds.includes(s.id)) {
                                            setSelectedShortcutIds(selectedShortcutIds.filter(id => id !== s.id));
                                        } else {
                                            setSelectedShortcutIds([...selectedShortcutIds, s.id]);
                                        }
                                    }}
                                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${selectedShortcutIds.includes(s.id) ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                                >
                                    {s.custom_name}
                                </button>
                            ))}
                            {shortcuts.length === 0 && <p className="text-[10px] text-gray-400">لا توجد اختصارات مخصصة. أنشئها في إعدادات الاختصارات.</p>}
                        </div>
                    </div>

                    {/* Locations Multi-select */}
                    <div className="space-y-2">
                        <Label className="font-bold flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-600" />
                            المواقع المرتبطة
                        </Label>
                        <div className="flex flex-wrap gap-2 p-2 border rounded-lg min-h-12">
                            {locations.map(l => (
                                <button
                                    key={l.id}
                                    onClick={() => {
                                        if (selectedLocationIds.includes(l.id)) {
                                            setSelectedLocationIds(selectedLocationIds.filter(id => id !== l.id));
                                        } else {
                                            setSelectedLocationIds([...selectedLocationIds, l.id]);
                                        }
                                    }}
                                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${selectedLocationIds.includes(l.id) ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                                >
                                    {l.title}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Actions (Macros) */}
                    <div className="space-y-2">
                        <Label className="font-bold flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-orange-600" />
                            الإجراءات المخصصة
                        </Label>
                        <div className="space-y-2">
                            {customActions.map((action, idx) => (
                                <div key={action.id} className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-100 rounded-lg text-xs">
                                    <Badge className="bg-orange-500">{action.trigger === 'on_start' ? 'عند البدء' : 'عند الانتهاء'}</Badge>
                                    <span className="flex-1 font-bold">
                                        {action.action === 'send_whatsapp' ? 'إرسال واتساب' : 'تنبيه'}
                                    </span>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setCustomActions(customActions.filter((_, i) => i !== idx))}>
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-[10px] border-dashed"
                                onClick={() => {
                                    setCustomActions([...customActions, {
                                        id: Date.now().toString(),
                                        trigger: 'on_start',
                                        action: 'send_whatsapp',
                                        params: { message: 'بدأت الوضع!' }
                                    }]);
                                }}
                            >
                                <Plus className="w-3 h-3 ml-1" /> إضافة إجراء جديد
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                    <Button onClick={handleSave} className="flex-1 bg-purple-600 hover:bg-purple-700">
                        {modeId ? 'تحديث الملف' : 'إنشاء الملف'}
                    </Button>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
