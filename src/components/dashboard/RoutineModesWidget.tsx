import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Settings, ChevronDown, ChevronUp, Play, Trash2, Calendar as CalendarIcon, Check, Plus, X, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface RoutineModesWidgetProps {
    className?: string;
}

export const RoutineModesWidget: React.FC<RoutineModesWidgetProps> = ({ className }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [routines, setRoutines] = useState<any[]>([]);
    const [activeRoutines, setActiveRoutines] = useState<any[]>([]);
    const [showCalendar, setShowCalendar] = useState<string | null>(null); // ID of routine being activated
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined,
    });

    // Editor State (mirrored from SettingsPanel)
    const [editingRoutine, setEditingRoutine] = useState<any>(null);
    const [routineItemText, setRoutineItemText] = useState('');
    const [routineItemType, setRoutineItemType] = useState<'task' | 'appointment' | 'habit' | 'medication'>('task');
    const [routineItemTime, setRoutineItemTime] = useState('');
    const [routineItemRepeat, setRoutineItemRepeat] = useState<'daily' | 'weekly' | 'custom' | 'once'>('daily');
    const [routineItemDays, setRoutineItemDays] = useState<{ [day: string]: string }>({});

    // Create new routine state - simplified, triggers editor
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newRoutineName, setNewRoutineName] = useState('');

    const { toast } = useToast();

    const DAYS_OF_WEEK = [
        { id: 'sun', name: 'الأحد' },
        { id: 'mon', name: 'الاثنين' },
        { id: 'tue', name: 'الثلاثاء' },
        { id: 'wed', name: 'الأربعاء' },
        { id: 'thu', name: 'الخميس' },
        { id: 'fri', name: 'الجمعة' },
        { id: 'sat', name: 'السبت' }
    ];

    useEffect(() => {
        loadRoutines();
        // Listen for updates
        window.addEventListener('routines-updated', loadRoutines);
        return () => window.removeEventListener('routines-updated', loadRoutines);
    }, []);

    const loadRoutines = () => {
        const savedRoutines = JSON.parse(localStorage.getItem('baraka_routines') || '[]');
        const savedActive = JSON.parse(localStorage.getItem('baraka_active_routines') || '[]');
        setRoutines(savedRoutines);
        setActiveRoutines(savedActive);
    };

    const deleteRoutine = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();

        // 1. Delete associated tasks
        const tasks = JSON.parse(localStorage.getItem('baraka_tasks') || '[]');
        const updatedTasks = tasks.filter((t: any) => t.routineId !== id);
        if (tasks.length !== updatedTasks.length) {
            localStorage.setItem('baraka_tasks', JSON.stringify(updatedTasks));
            window.dispatchEvent(new Event('tasks-updated'));
        }

        // 2. Delete associated appointments
        const appts = JSON.parse(localStorage.getItem('baraka_appointments') || '[]');
        const updatedAppts = appts.filter((a: any) => a.routineId !== id);
        if (appts.length !== updatedAppts.length) {
            localStorage.setItem('baraka_appointments', JSON.stringify(updatedAppts));
            window.dispatchEvent(new Event('appointments-updated'));
        }

        // 3. Delete associated active routine entries
        const activeRoutinesList = JSON.parse(localStorage.getItem('baraka_active_routines') || '[]');
        const updatedActive = activeRoutinesList.filter((ar: any) => ar.routineId !== id);
        localStorage.setItem('baraka_active_routines', JSON.stringify(updatedActive));
        setActiveRoutines(updatedActive);

        // 4. Delete the routine itself
        const updated = routines.filter(r => r.id !== id);
        localStorage.setItem('baraka_routines', JSON.stringify(updated));
        setRoutines(updated);

        // Also close editor if deleting the currently edited one
        if (editingRoutine?.id === id) {
            setEditingRoutine(null);
        }
        window.dispatchEvent(new Event('routines-updated'));
        toast({ title: '🗑️ تم حذف القالب', description: 'تم حذف القالب وجميع الأحداث المرتبطة به' });
    };

    const activateRoutine = (routine: any) => {
        if (!dateRange.from || !dateRange.to) {
            toast({ title: '❌ الرجاء تحديد فترة التفعيل', variant: 'destructive' });
            return;
        }

        const startDate = new Date(dateRange.from);
        const endDate = new Date(dateRange.to);
        endDate.setHours(23, 59, 59, 999); // Include the last day fully

        // Track new items for summary
        let tasksCreated = 0;
        let appointmentsCreated = 0;

        // Load existing data
        const existingTasks = JSON.parse(localStorage.getItem('baraka_tasks') || '[]');
        const existingAppointments = JSON.parse(localStorage.getItem('baraka_appointments') || '[]');
        const newTasks: any[] = [];
        const newAppointments: any[] = [];

        // Loop through dates
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = format(d, 'yyyy-MM-dd');

            // Map standard day names to our custom IDs
            const getDayId = (date: Date) => {
                const map = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                return map[date.getDay()];
            };
            const currentDayId = getDayId(d);

            routine.items.forEach((item: any) => {
                let shouldAdd = false;
                let itemTime = item.time;

                // Check recurrence
                if (item.repeat === 'daily') {
                    shouldAdd = true;
                } else if (item.repeat === 'weekly') {
                    if (d.getDay() === startDate.getDay()) {
                        shouldAdd = true;
                    }
                } else if (item.repeat === 'custom') {
                    if (item.customDays && item.customDays[currentDayId]) {
                        shouldAdd = true;
                        itemTime = item.customDays[currentDayId];
                    }
                } else if (item.repeat === 'once') {
                    if (d.getTime() === startDate.getTime()) {
                        shouldAdd = true;
                    }
                }

                if (shouldAdd) {
                    if (item.type === 'task' || item.type === 'habit' || item.type === 'medication') {
                        // Create Task
                        const newTask = {
                            id: crypto.randomUUID(),
                            title: `${item.type === 'medication' ? '💊 ' : item.type === 'habit' ? '❤️ ' : ''}${item.text}`,
                            description: `Generated from routine: ${routine.name}`,
                            deadline: dateStr,
                            time: itemTime,
                            completed: false,
                            progress: 0,
                            priority: 'medium',
                            type: 'task',
                            subtasks: [],
                            routineId: routine.id
                        };
                        newTasks.push(newTask);
                        tasksCreated++;
                    } else if (item.type === 'appointment') {
                        // Create Appointment
                        const newAppt = {
                            id: crypto.randomUUID(),
                            title: item.text,
                            date: dateStr,
                            time: itemTime || '09:00',
                            notes: `Generated from routine: ${routine.name}`,
                            is_completed: false,
                            routineId: routine.id
                        };
                        newAppointments.push(newAppt);
                        appointmentsCreated++;
                    }
                }
            });
        }

        // Save generated items
        if (newTasks.length > 0) {
            const updatedTasks = [...existingTasks, ...newTasks];
            localStorage.setItem('baraka_tasks', JSON.stringify(updatedTasks));
            window.dispatchEvent(new Event('tasks-updated'));
        }

        if (newAppointments.length > 0) {
            const updatedAppts = [...existingAppointments, ...newAppointments];
            localStorage.setItem('baraka_appointments', JSON.stringify(updatedAppts));
            window.dispatchEvent(new Event('appointments-updated'));
        }

        const newActive = {
            id: Date.now().toString(),
            routineId: routine.id,
            name: routine.name,
            startDate: dateRange.from.toISOString(),
            endDate: dateRange.to.toISOString(),
            items: routine.items
        };

        const updatedActive = [...activeRoutines, newActive];
        localStorage.setItem('baraka_active_routines', JSON.stringify(updatedActive));
        setActiveRoutines(updatedActive);

        setShowCalendar(null);
        setDateRange({ from: undefined, to: undefined });

        toast({
            title: '✅ تم تفعيل الوضع وتوليد العناصر',
            description: `تمت جدولة ${tasksCreated} مهمة و ${appointmentsCreated} موعد للفترة المحددة.`
        });
    };

    const deactivateRoutine = (activeId: string) => {
        const updated = activeRoutines.filter(r => r.id !== activeId);
        localStorage.setItem('baraka_active_routines', JSON.stringify(updated));
        setActiveRoutines(updated);
        toast({ title: '⏹️ تم إيقاف الوضع' });
    };

    const createRoutine = () => {
        if (!newRoutineName.trim()) return;

        const newRoutine = {
            id: Date.now().toString(),
            name: newRoutineName,
            items: []
        };

        const updated = [...routines, newRoutine];
        localStorage.setItem('baraka_routines', JSON.stringify(updated));
        setRoutines(updated);
        setNewRoutineName('');
        setIsCreateOpen(false);
        setEditingRoutine(newRoutine); // Simply open editor for new routine
        toast({ title: '✨ تم إنشاء القالب', description: 'يمكنك الآن إضافة العناصر' });
        window.dispatchEvent(new Event('routines-updated'));
    };

    const saveEditedRoutine = (updatedRoutine: any) => {
        const routineIdx = routines.findIndex(r => r.id === updatedRoutine.id);
        const updatedRoutines = [...routines];
        if (routineIdx >= 0) {
            updatedRoutines[routineIdx] = updatedRoutine;
        } else {
            updatedRoutines.push(updatedRoutine);
        }
        localStorage.setItem('baraka_routines', JSON.stringify(updatedRoutines));
        setRoutines(updatedRoutines);
        setEditingRoutine(updatedRoutine); // Keep editing
        window.dispatchEvent(new Event('routines-updated'));
    };

    return (
        <Card className={cn("overflow-hidden border shadow-sm bg-white transition-all duration-300", className)}>
            <CardHeader
                className="py-3 px-4 bg-gradient-to-r from-purple-50 to-white border-b cursor-pointer flex flex-row items-center justify-between"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-600" />
                    <div>
                        <CardTitle className="text-sm font-bold text-gray-800">الأوضاع الدائمة</CardTitle>
                        <p className="text-[10px] text-gray-500">
                            {activeRoutines.length > 0
                                ? `${activeRoutines.length} أوضاع مفعلة حالياً`
                                : 'لا توجد أوضاع مفعلة'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="p-4 bg-gray-50/50">

                    {/* Active Routines Section */}
                    {activeRoutines.length > 0 && !editingRoutine && (
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-purple-700 mb-3 flex items-center gap-1">
                                <Play className="w-3 h-3 fill-current" />
                                الأوضاع النشطة
                            </h3>
                            <div className="space-y-2">
                                {activeRoutines.map(active => {
                                    const isActive = new Date(active.endDate) >= new Date();
                                    return (
                                        <div key={active.id} className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm flex justify-between items-center">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm">{active.name}</span>
                                                    {!isActive && <Badge variant="secondary" className="text-[10px]">منتهي</Badge>}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                    <CalendarIcon className="w-3 h-3" />
                                                    {format(new Date(active.startDate), 'dd/MM', { locale: arSA })} - {format(new Date(active.endDate), 'dd/MM', { locale: arSA })}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                                                onClick={() => deactivateRoutine(active.id)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Saved Templates Section */}
                    <div>
                        {editingRoutine ? (
                            <div className="bg-white p-3 rounded-lg border shadow-sm space-y-4">
                                <div className="flex items-center justify-between pb-2 border-b">
                                    <h4 className="font-bold text-purple-800 flex items-center gap-2">
                                        <Pencil className="w-4 h-4" />
                                        تعديل: {editingRoutine.name}
                                    </h4>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingRoutine(null)} className="h-8 text-xs">
                                        رجوع للقائمة
                                    </Button>
                                </div>

                                {/* Items List */}
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                    <h5 className="text-xs font-bold text-gray-500">العناصر ({editingRoutine.items?.length || 0})</h5>
                                    {editingRoutine.items?.length > 0 ? (
                                        editingRoutine.items.map((item: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border">
                                                <span className={`text-[10px] px-2 py-0.5 rounded ${item.type === 'task' ? 'bg-blue-100 text-blue-700' :
                                                    item.type === 'appointment' ? 'bg-orange-100 text-orange-700' :
                                                        item.type === 'habit' ? 'bg-pink-100 text-pink-700' :
                                                            'bg-cyan-100 text-cyan-700'
                                                    }`}>
                                                    {item.type === 'task' ? 'مهمة' :
                                                        item.type === 'appointment' ? 'موعد' :
                                                            item.type === 'habit' ? 'عادة' : 'دواء'}
                                                </span>
                                                <span className="flex-1 text-xs font-medium">{item.text}</span>
                                                {item.time && <span className="text-[10px] text-gray-500 bg-gray-100 px-1 rounded">{item.time}</span>}
                                                <span className="text-[10px] text-purple-500">
                                                    {item.repeat === 'daily' ? 'يومياً' :
                                                        item.repeat === 'weekly' ? 'أسبوعياً' :
                                                            item.repeat === 'custom' ? 'مخصص' : 'مرة'}
                                                </span>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => {
                                                        const updated = { ...editingRoutine };
                                                        updated.items = updated.items.filter((_: any, i: number) => i !== idx);
                                                        saveEditedRoutine(updated);
                                                    }}
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-gray-400 py-4 text-xs italic">لا توجد عناصر مضافة بعد</p>
                                    )}
                                </div>

                                {/* Add New Item Form */}
                                <div className="border-t pt-3 space-y-3 bg-gray-50/50 p-2 rounded-lg">
                                    <h5 className="text-xs font-bold text-gray-600 flex items-center gap-1">
                                        <Plus className="w-3 h-3" /> إضافة عنصر جديد
                                    </h5>
                                    <Input
                                        placeholder="النص (مثال: قراءة صفحتين)"
                                        value={routineItemText}
                                        onChange={(e) => setRoutineItemText(e.target.value)}
                                        className="text-right h-8 text-xs bg-white"
                                    />
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-[10px] text-gray-500 block mb-1">النوع</label>
                                            <select
                                                value={routineItemType}
                                                onChange={(e) => setRoutineItemType(e.target.value as any)}
                                                className="w-full h-8 text-xs border rounded-md px-1 bg-white"
                                            >
                                                <option value="task">مهمة</option>
                                                <option value="appointment">موعد</option>
                                                <option value="habit">عادة</option>
                                                <option value="medication">دواء</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[10px] text-gray-500 block mb-1">التكرار</label>
                                            <select
                                                value={routineItemRepeat}
                                                onChange={(e) => {
                                                    setRoutineItemRepeat(e.target.value as any);
                                                    if (e.target.value !== 'custom') {
                                                        setRoutineItemDays({});
                                                    }
                                                }}
                                                className="w-full h-8 text-xs border rounded-md px-1 bg-white"
                                            >
                                                <option value="daily">يومياً</option>
                                                <option value="weekly">أسبوعياً</option>
                                                <option value="custom">أيام مخصصة</option>
                                                <option value="once">مرة واحدة</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Default time for daily/weekly/once */}
                                    {routineItemRepeat !== 'custom' && (
                                        <div>
                                            <label className="text-[10px] text-gray-500 block mb-1">الوقت</label>
                                            <Input
                                                type="time"
                                                value={routineItemTime}
                                                onChange={(e) => setRoutineItemTime(e.target.value)}
                                                className="h-8 text-xs bg-white"
                                            />
                                        </div>
                                    )}

                                    {/* Custom days with individual times */}
                                    {routineItemRepeat === 'custom' && (
                                        <div className="bg-purple-50 p-2 rounded-lg space-y-2 border border-purple-100">
                                            <p className="text-[10px] font-bold text-purple-700 mb-1">الأيام والأوقات:</p>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                {DAYS_OF_WEEK.map(day => (
                                                    <div key={day.id} className="flex items-center gap-1 bg-white p-1 rounded border">
                                                        <input
                                                            type="checkbox"
                                                            id={`widget-day-${day.id}`}
                                                            checked={day.id in routineItemDays}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setRoutineItemDays({ ...routineItemDays, [day.id]: '08:00' });
                                                                } else {
                                                                    const newDays = { ...routineItemDays };
                                                                    delete newDays[day.id];
                                                                    setRoutineItemDays(newDays);
                                                                }
                                                            }}
                                                            className="w-3 h-3"
                                                        />
                                                        <label htmlFor={`widget-day-${day.id}`} className="text-[10px] flex-1 cursor-pointer">{day.name}</label>
                                                        {day.id in routineItemDays && (
                                                            <Input
                                                                type="time"
                                                                value={routineItemDays[day.id]}
                                                                onChange={(e) => setRoutineItemDays({ ...routineItemDays, [day.id]: e.target.value })}
                                                                className="h-5 text-[10px] w-14 p-0 px-1"
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        className="w-full bg-purple-600 hover:bg-purple-700 h-8 text-xs"
                                        disabled={!routineItemText.trim() || (routineItemRepeat === 'custom' && Object.keys(routineItemDays).length === 0)}
                                        onClick={() => {
                                            const newItem = {
                                                id: Date.now().toString(),
                                                text: routineItemText,
                                                type: routineItemType,
                                                time: routineItemRepeat === 'custom' ? null : (routineItemTime || null),
                                                repeat: routineItemRepeat,
                                                customDays: routineItemRepeat === 'custom' ? routineItemDays : null
                                            };
                                            const updated = { ...editingRoutine };
                                            updated.items = [...(updated.items || []), newItem];
                                            saveEditedRoutine(updated);

                                            // Reset form
                                            setRoutineItemText('');
                                            setRoutineItemTime('');
                                            setRoutineItemDays({});
                                            toast({ title: '✅ تمت الإضافة', description: 'تمت إضافة العنصر للقالب' });
                                        }}
                                    >
                                        <Plus className="w-3 h-3 ml-1" />
                                        إضافة العنصر
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            // List View
                            <>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1">
                                        <Settings className="w-3 h-3" />
                                        القوالب المحفوظة
                                    </h3>
                                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                                        <DialogTrigger asChild>
                                            <Button size="sm" className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1">
                                                <Plus className="w-3 h-3" />
                                                جديد
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                                <DialogTitle className="text-right">إنشاء وضع جديد</DialogTitle>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="items-center gap-4">
                                                    <Input
                                                        id="name"
                                                        placeholder="اسم الوضع (مثال: نظام الامتحانات)"
                                                        className="col-span-3 text-right"
                                                        value={newRoutineName}
                                                        onChange={(e) => setNewRoutineName(e.target.value)}
                                                    />
                                                </div>
                                                <Button onClick={createRoutine} className="w-full bg-purple-600 hover:bg-purple-700">
                                                    إنشاء
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                {routines.length === 0 ? (
                                    <div className="text-center py-6 text-gray-400 bg-white rounded-lg border border-dashed">
                                        <p className="text-sm">لا توجد قوالب محفوظة</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {routines.map(routine => (
                                            <div key={routine.id} className="bg-white p-3 rounded-lg border hover:border-purple-200 transition-colors group">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h4 className="font-bold text-sm text-gray-800">{routine.name}</h4>
                                                        <p className="text-[10px] text-gray-500">{routine.items?.length || 0} عناصر</p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Popover open={showCalendar === routine.id} onOpenChange={(open) => {
                                                            setShowCalendar(open ? routine.id : null);
                                                            if (!open) setDateRange({ from: undefined, to: undefined });
                                                        }}>
                                                            <PopoverTrigger asChild>
                                                                <Button variant="outline" size="sm" className="h-7 gap-1 text-[10px] border-purple-200 text-purple-700 hover:bg-purple-50">
                                                                    <CalendarIcon className="w-3 h-3" />
                                                                    تفعيل
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0" align="end">
                                                                <div className="p-3 bg-white">
                                                                    <p className="text-xs font-bold text-center mb-2 text-gray-600">اختر فترة التفعيل</p>
                                                                    <Calendar
                                                                        mode="range"
                                                                        selected={dateRange}
                                                                        onSelect={(range: any) => setDateRange(range)}
                                                                        numberOfMonths={1}
                                                                        initialFocus
                                                                        className="rounded-md border shadow-sm"
                                                                    />
                                                                    <div className="mt-3 flex gap-2">
                                                                        <Button
                                                                            size="sm"
                                                                            className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs"
                                                                            disabled={!dateRange.from || !dateRange.to}
                                                                            onClick={() => activateRoutine(routine)}
                                                                        >
                                                                            تأكيد التفعيل
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 text-gray-500 hover:bg-gray-100"
                                                            onClick={() => setEditingRoutine(routine)}
                                                            title="تعديل القالب"
                                                        >
                                                            <Pencil className="w-3 h-3" />
                                                        </Button>

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                            onClick={(e) => deleteRoutine(routine.id, e)}
                                                            title="حذف القالب"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                </CardContent>
            )}
        </Card>
    );
};
