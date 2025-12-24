import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CalendarDays, List, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Moon, Sun, Sunset, Star, Plus, ClipboardList, Clock, MapPin, X } from 'lucide-react';
import DailyCalendar from '@/components/DailyCalendar';
import WeeklyCalendar from '@/components/WeeklyCalendar';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { useHabits } from '@/hooks/useHabits';
import { useMedications } from '@/hooks/useMedications';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useToast } from '@/hooks/use-toast';

const DAYS_AR = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const CalendarSection: React.FC = () => {
    const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // Quick add popup state
    const [quickAddDate, setQuickAddDate] = useState<string | null>(null);
    const [viewAllDate, setViewAllDate] = useState<string | null>(null);

    // Refs for long press handling
    const pressTimer = React.useRef<NodeJS.Timeout | null>(null);
    const isLongPress = React.useRef(false);
    const isScrolling = React.useRef(false);

    const [addType, setAddType] = useState<'appointment' | 'task' | null>(null);
    const [formData, setFormData] = useState({ title: '', time: '', location: '', description: '', priority: 'medium' });

    const { tasks, addTask } = useTasks();
    const { appointments, addAppointment } = useAppointments();
    const { habits } = useHabits();
    const { medications } = useMedications();
    const { prayerTimes = [], nextPrayer, timeUntilNext } = useDashboardData();
    const { toast } = useToast();

    // Prayer icon helper
    const getPrayerIcon = (name: string) => {
        switch (name) {
            case 'fajr': return Moon;
            case 'dhuhr': return Sun;
            case 'asr': return Sun;
            case 'maghrib': return Sunset;
            case 'isha': return Star;
            default: return Moon;
        }
    };

    // Get data for a specific date
    const getDateData = (dateStr: string) => {
        const dateTasks = tasks.filter(t => t.deadline === dateStr);
        const dateAppointments = appointments.filter(a => a.date === dateStr);
        return { tasks: dateTasks, appointments: dateAppointments };
    };

    // Generate calendar days
    const generateCalendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const days: { date: Date; isCurrentMonth: boolean }[] = [];

        // Previous month days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDay - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevMonthLastDay - i),
                isCurrentMonth: false
            });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            });
        }

        // Next month days
        const remainingDays = 42 - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false
            });
        }

        return days;
    };

    const calendarDays = generateCalendarDays();
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-lg arabic-title text-primary font-bold">📅 التقويم</h1>
            </div>

            {/* Prayer Times Row */}
            <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                <CardContent className="py-3">
                    <div className="flex items-center justify-between overflow-x-auto whitespace-nowrap gap-2">
                        {prayerTimes.map((prayer) => {
                            const Icon = getPrayerIcon(prayer.name);
                            const isNext = nextPrayer?.name === prayer.name;
                            return (
                                <div
                                    key={prayer.name}
                                    className={`flex flex-col items-center px-3 py-2 rounded-lg min-w-[65px] transition-all ${isNext ? 'bg-emerald-100 border-2 border-emerald-400 scale-105' : 'bg-white/50'
                                        }`}
                                >
                                    <span className="text-xs text-gray-600 font-medium">{prayer.nameAr}</span>
                                    <Icon className={`w-4 h-4 my-1 ${isNext ? 'text-emerald-600' : 'text-gray-400'}`} />
                                    <span className={`text-sm font-bold tabular-nums ${isNext ? 'text-emerald-700' : 'text-gray-700'}`}>
                                        {prayer.time}
                                    </span>

                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* View Toggle */}
            <div className="flex gap-2 bg-gray-50/50 p-1.5 rounded-2xl border w-fit mx-auto shadow-sm">
                <button
                    onClick={() => setViewMode('daily')}
                    className={`px-4 py-2 text-sm rounded-xl font-bold transition-all duration-300 ${viewMode === 'daily'
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-200 scale-105'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                        }`}
                >
                    <List className="w-4 h-4 inline-block ml-1" />
                    اليومي
                </button>
                <button
                    onClick={() => setViewMode('weekly')}
                    className={`px-4 py-2 text-sm rounded-xl font-bold transition-all duration-300 ${viewMode === 'weekly'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-200 scale-105'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                        }`}
                >
                    <CalendarDays className="w-4 h-4 inline-block ml-1" />
                    الأسبوعي
                </button>
                <button
                    onClick={() => setViewMode('monthly')}
                    className={`px-4 py-2 text-sm rounded-xl font-bold transition-all duration-300 ${viewMode === 'monthly'
                        ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-200 scale-105'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                        }`}
                >
                    <CalendarIcon className="w-4 h-4 inline-block ml-1" />
                    الشهري
                </button>
            </div>

            {/* Daily View */}
            {viewMode === 'daily' && (
                <DailyCalendar />
            )}

            {/* Weekly View */}
            {viewMode === 'weekly' && (
                <WeeklyCalendar />
            )}

            {/* Monthly View */}
            {viewMode === 'monthly' && (
                <Card className="border-2 border-purple-200">
                    <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-violet-50">
                        <div className="flex items-center justify-between">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                            <CardTitle className="text-lg font-bold text-purple-700">
                                {MONTHS_AR[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                            </CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {/* Days Header */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {DAYS_AR.map(day => (
                                <div key={day} className="text-center text-xs font-bold text-gray-500 py-1">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 select-none">
                            {calendarDays.map((day, idx) => {
                                // Use manual string construction to avoid timezone shifts
                                const dateStr = `${day.date.getFullYear()}-${String(day.date.getMonth() + 1).padStart(2, '0')}-${String(day.date.getDate()).padStart(2, '0')}`;
                                const data = getDateData(dateStr);
                                const isToday = dateStr === today;
                                const hasItems = data.tasks.length > 0 || data.appointments.length > 0;

                                // Long press handlers
                                const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
                                    // Only allow left click for mouse
                                    if ('button' in e && e.button !== 0) return;

                                    isScrolling.current = false;
                                    isLongPress.current = false;

                                    // Store start position for movement threshold
                                    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
                                    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
                                    (window as any).startPos = { x: clientX, y: clientY };

                                    pressTimer.current = setTimeout(() => {
                                        isLongPress.current = true;
                                        if (navigator.vibrate) navigator.vibrate(50);
                                        setViewAllDate(dateStr);
                                    }, 400); // Reduced to 400ms for better responsiveness
                                };

                                const handleEnd = () => {
                                    if (pressTimer.current) clearTimeout(pressTimer.current);
                                    if (!isLongPress.current && !isScrolling.current) {
                                        setSelectedDate(dateStr);
                                        setQuickAddDate(dateStr);
                                    }
                                    // Clear flags after a short delay to prevent double firing
                                    setTimeout(() => {
                                        isLongPress.current = false;
                                        isScrolling.current = false;
                                    }, 100);
                                };

                                const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
                                    if (pressTimer.current) {
                                        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
                                        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
                                        const startPos = (window as any).startPos;

                                        if (startPos) {
                                            const moveX = Math.abs(clientX - startPos.x);
                                            const moveY = Math.abs(clientY - startPos.y);
                                            // Allow movement (jitter) of 20px for trackpads
                                            if (moveX > 20 || moveY > 20) {
                                                isScrolling.current = true;
                                                clearTimeout(pressTimer.current);
                                            }
                                        }
                                    }
                                };

                                return (
                                    <div
                                        key={idx}
                                        onTouchStart={handleStart}
                                        onTouchEnd={handleEnd}
                                        onTouchMove={handleMove}
                                        onMouseDown={handleStart}
                                        onMouseUp={handleEnd}
                                        onMouseMove={handleMove}
                                        onMouseLeave={() => {
                                            if (pressTimer.current) clearTimeout(pressTimer.current);
                                        }}
                                        onContextMenu={(e) => {
                                            // Prevent context menu to allow long press interactions
                                            e.preventDefault();
                                        }}
                                        className={`
                                            p-2 min-h-[60px] rounded-lg cursor-pointer transition-all relative select-none
                                            ${!day.isCurrentMonth ? 'opacity-40' : ''}
                                            ${isToday ? 'bg-purple-100 border-2 border-purple-400' : 'bg-gray-50 hover:bg-gray-100'}
                                            ${selectedDate === dateStr ? 'ring-2 ring-purple-500' : ''}
                                            active:scale-95 duration-200
                                        `}
                                    >
                                        <div className={`text-sm font-bold ${isToday ? 'text-purple-700' : 'text-gray-700'}`}>
                                            {day.date.getDate()}
                                        </div>
                                        {hasItems && (
                                            <div className="mt-1 space-y-0.5 max-h-[40px] overflow-hidden">
                                                {data.appointments.slice(0, 2).map(apt => (
                                                    <div key={apt.id} className="text-[8px] bg-orange-100 text-orange-700 rounded px-1 truncate">
                                                        📅 {apt.title}
                                                    </div>
                                                ))}
                                                {data.tasks.slice(0, 2).map(task => (
                                                    <div key={task.id} className="text-[8px] bg-blue-100 text-blue-700 rounded px-1 truncate">
                                                        ✅ {task.title}
                                                    </div>
                                                ))}
                                                {(data.appointments.length > 2 || data.tasks.length > 2) && (
                                                    <div className="text-[7px] text-gray-400 text-center">+المزيد</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Selected Date Details */}
                        {selectedDate && (
                            <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                                <h3 className="font-bold text-purple-700 mb-3">
                                    📅 {new Date(selectedDate).toLocaleDateString('ar', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </h3>
                                {(() => {
                                    const data = getDateData(selectedDate);
                                    if (data.tasks.length === 0 && data.appointments.length === 0) {
                                        return <p className="text-sm text-gray-500">لا توجد أحداث في هذا اليوم</p>;
                                    }
                                    return (
                                        <div className="space-y-2">
                                            {data.appointments.map(apt => (
                                                <div key={apt.id} className="flex items-center gap-2 text-sm bg-white p-2 rounded-lg">
                                                    <span className="text-orange-500">📍</span>
                                                    <span className="font-medium">{apt.title}</span>
                                                    {apt.time && <span className="text-gray-500 mr-auto">{apt.time}</span>}
                                                </div>
                                            ))}
                                            {data.tasks.map(task => (
                                                <div key={task.id} className="flex items-center gap-2 text-sm bg-white p-2 rounded-lg">
                                                    <span className="text-blue-500">✅</span>
                                                    <span className="font-medium">{task.title}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded mr-auto ${task.priority === 'high' ? 'bg-red-100 text-red-700' :
                                                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-green-100 text-green-700'
                                                        }`}>
                                                        {task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
            {/* Quick Add Type Selection Popup */}
            <Dialog open={!!quickAddDate && !addType} onOpenChange={() => { setQuickAddDate(null); setAddType(null); }}>
                <DialogContent className="max-w-xs">
                    <DialogHeader>
                        <DialogTitle className="text-center text-lg">
                            إضافة في {quickAddDate ? new Date(quickAddDate).toLocaleDateString('ar', { weekday: 'long', month: 'short', day: 'numeric' }) : ''}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 p-4">
                        <button
                            onClick={() => setAddType('appointment')}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-orange-200 bg-orange-50 hover:bg-orange-100 transition-all"
                        >
                            <CalendarIcon className="w-10 h-10 text-orange-500" />
                            <span className="font-bold text-orange-700">موعد</span>
                        </button>
                        <button
                            onClick={() => setAddType('task')}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-all"
                        >
                            <ClipboardList className="w-10 h-10 text-blue-500" />
                            <span className="font-bold text-blue-700">مهمة</span>
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Appointment Form */}
            <Dialog open={addType === 'appointment'} onOpenChange={() => { setAddType(null); setFormData({ title: '', time: '', location: '', description: '', priority: 'medium' }); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-orange-500" />
                            إضافة موعد جديد
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        <Input
                            placeholder="عنوان الموعد"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="text-right"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <div className="relative">
                                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    type="time"
                                    value={formData.time}
                                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                                    className="pr-10"
                                />
                            </div>
                            <div className="relative">
                                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="المكان"
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    className="text-right pr-10"
                                />
                            </div>
                        </div>
                        <Input
                            placeholder="ملاحظات"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="text-right"
                        />
                        <Button
                            className="w-full bg-orange-500 hover:bg-orange-600"
                            onClick={async () => {
                                if (!formData.title || !quickAddDate) {
                                    toast({ title: 'أدخل عنوان الموعد', variant: 'destructive' });
                                    return;
                                }
                                await addAppointment({
                                    title: formData.title,
                                    date: quickAddDate,
                                    time: formData.time || '09:00',
                                    location: formData.location,
                                    notes: formData.description
                                });
                                toast({ title: '✅ تم إضافة الموعد' });
                                setAddType(null);
                                setQuickAddDate(null);
                                setFormData({ title: '', time: '', location: '', description: '', priority: 'medium' });
                            }}
                        >
                            <Plus className="w-4 h-4 ml-2" /> حفظ الموعد
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Task Form */}
            <Dialog open={addType === 'task'} onOpenChange={() => { setAddType(null); setFormData({ title: '', time: '', location: '', description: '', priority: 'medium' }); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-blue-500" />
                            إضافة مهمة جديدة
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        <Input
                            placeholder="عنوان المهمة"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="text-right"
                        />
                        <Input
                            placeholder="وصف المهمة"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="text-right"
                        />
                        <div className="flex gap-2">
                            <span className="text-sm text-gray-600 self-center">الأولوية:</span>
                            {['low', 'medium', 'high'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setFormData({ ...formData, priority: p })}
                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${formData.priority === p
                                        ? p === 'high' ? 'bg-red-500 text-white' : p === 'medium' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {p === 'high' ? 'عالية' : p === 'medium' ? 'متوسطة' : 'منخفضة'}
                                </button>
                            ))}
                        </div>
                        <Button
                            className="w-full bg-blue-500 hover:bg-blue-600"
                            onClick={async () => {
                                if (!formData.title || !quickAddDate) {
                                    toast({ title: 'أدخل عنوان المهمة', variant: 'destructive' });
                                    return;
                                }
                                await addTask({
                                    title: formData.title,
                                    description: formData.description,
                                    deadline: quickAddDate,
                                    priority: formData.priority as 'low' | 'medium' | 'high',
                                    type: 'task'
                                });
                                toast({ title: '✅ تم إضافة المهمة' });
                                setAddType(null);
                                setQuickAddDate(null);
                                setFormData({ title: '', time: '', location: '', description: '', priority: 'medium' });
                            }}
                        >
                            <Plus className="w-4 h-4 ml-2" /> حفظ المهمة
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            {/* View All Activities Dialog */}
            <Dialog open={!!viewAllDate} onOpenChange={() => setViewAllDate(null)}>
                <DialogContent className="max-w-[90%] sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-center font-bold text-purple-700">
                            {viewAllDate && (() => {
                                const [y, m, d] = viewAllDate.split('-').map(Number);
                                return new Date(y, m - 1, d).toLocaleDateString('ar', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                            })()}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto space-y-3 p-1">
                        {viewAllDate && (() => {
                            const data = getDateData(viewAllDate);
                            if (data.tasks.length === 0 && data.appointments.length === 0) {
                                return (
                                    <div className="text-center py-8 text-gray-500 flex flex-col items-center">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                                            <CalendarIcon className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <p>لا توجد أحداث في هذا اليوم</p>
                                    </div>
                                );
                            }
                            return (
                                <div className="space-y-3">
                                    {/* Appointments */}
                                    {data.appointments.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-bold text-orange-700 flex items-center">
                                                <CalendarIcon className="w-4 h-4 ml-1" /> المواعيد
                                            </h4>
                                            {data.appointments.map(apt => (
                                                <div key={apt.id} className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                                                    <div className="flex justify-between items-start">
                                                        <span className="font-bold text-gray-800">{apt.title}</span>
                                                        <span className="text-xs bg-white px-2 py-1 rounded text-orange-600 font-medium">{apt.time}</span>
                                                    </div>
                                                    {apt.location && (
                                                        <div className="flex items-center text-xs text-gray-500 mt-1">
                                                            <MapPin className="w-3 h-3 ml-1" /> {apt.location}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Tasks */}
                                    {data.tasks.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-bold text-blue-700 flex items-center">
                                                <ClipboardList className="w-4 h-4 ml-1" /> المهام
                                            </h4>
                                            {data.tasks.map(task => (
                                                <div key={task.id} className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                                    <div className="flex justify-between items-start">
                                                        <span className="font-bold text-gray-800">{task.title}</span>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded ${task.priority === 'high' ? 'bg-red-100 text-red-700' :
                                                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-green-100 text-green-700'
                                                            }`}>
                                                            {task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                                                        </span>
                                                    </div>
                                                    {task.description && (
                                                        <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CalendarSection;
