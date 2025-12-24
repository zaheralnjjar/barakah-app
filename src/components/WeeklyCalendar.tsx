import React, { useState, DragEvent, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useTasks, MainTask } from '@/hooks/useTasks';
import { useAppointments, Appointment } from '@/hooks/useAppointments';
import { useHabits } from '@/hooks/useHabits';
import { useMedications } from '@/hooks/useMedications';
import { useToast } from '@/hooks/use-toast';
import {
    ChevronLeft,
    ChevronRight,
    Printer,
    Calendar,
    GripVertical,
    ClipboardList,
    Clock,
    MapPin,
    Plus
} from 'lucide-react';

interface WeeklyCalendarProps {
    onPrint?: () => void;
}

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ onPrint }) => {
    const { tasks, updateTask, addTask } = useTasks();
    const { appointments, addAppointment } = useAppointments();
    const { habits } = useHabits();
    const { medications } = useMedications();
    const { toast } = useToast();

    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const start = new Date(today);
        start.setDate(today.getDate() - dayOfWeek);
        return start;
    });

    const [draggedItem, setDraggedItem] = useState<{ type: 'task'; id: string } | null>(null);
    const [prayerSchedule, setPrayerSchedule] = useState<any>({});

    // Quick add popup state
    const [quickAddDate, setQuickAddDate] = useState<string | null>(null);
    const [quickAddHour, setQuickAddHour] = useState<number | null>(null);
    const [addType, setAddType] = useState<'appointment' | 'task' | null>(null);
    const [formData, setFormData] = useState({ title: '', time: '', location: '', description: '', priority: 'medium' });

    useEffect(() => {
        try {
            const schedule = localStorage.getItem('baraka_prayer_schedule');
            if (schedule) setPrayerSchedule(JSON.parse(schedule));
        } catch (e) { }
    }, []);

    const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const HOURS = Array.from({ length: 18 }, (_, i) => i + 4); // 04:00 to 21:00

    // Get week dates
    const getWeekDates = (): Date[] => {
        const dates: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(currentWeekStart);
            date.setDate(currentWeekStart.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    const getDateStr = (date: Date): string => {
        return date.toISOString().split('T')[0];
    };

    const navigateWeek = (direction: number) => {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(currentWeekStart.getDate() + (direction * 7));
        setCurrentWeekStart(newStart);
    };

    const goToToday = () => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const start = new Date(today);
        start.setDate(today.getDate() - dayOfWeek);
        setCurrentWeekStart(start);
    };

    // Get data for a specific date
    const getDayData = (dateStr: string) => {
        const dayName = DAYS_AR[new Date(dateStr).getDay()];
        return {
            tasks: tasks.filter(t => t.deadline === dateStr),
            appointments: appointments.filter(a => a.date === dateStr),
            habits: habits.filter(h =>
                h.frequency === 'daily' ||
                (h.frequency === 'weekly' && new Date(dateStr).getDay() === 0) ||
                (h.frequency === 'monthly' && new Date(dateStr).getDate() === 1) ||
                (h.frequency === 'specific_days' && h.customDays?.includes(dayName))
            ),
            medications: medications.filter(m =>
                m.frequency === 'daily' ||
                (m.frequency === 'specific_days' && m.customDays?.includes(dayName))
            )
        };
    };

    // Drag & Drop handlers
    const handleDragStart = (e: DragEvent<HTMLDivElement>, type: 'task', id: string) => {
        setDraggedItem({ type, id });
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify({ type, id }));
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>, targetDateStr: string) => {
        e.preventDefault();

        if (!draggedItem) return;

        if (draggedItem.type === 'task') {
            const task = tasks.find(t => t.id === draggedItem.id);
            if (task) {
                updateTask({ ...task, deadline: targetDateStr });
                toast({ title: 'تم نقل المهمة', description: `تم نقل "${task.title}" إلى ${targetDateStr}` });
            }
        }

        setDraggedItem(null);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
    };

    // Print weekly schedule
    const printWeeklySchedule = () => {
        const weekDates = getWeekDates();

        let html = `
            <html dir="rtl">
            <head>
                <title>جدول الأسبوع</title>
                <style>
                    @page { size: A4 landscape; margin: 10mm; }
                    body { font-family: Tajawal, Arial; padding: 10px; margin: 0; font-size: 10px; }
                    .header { text-align: center; margin-bottom: 15px; }
                    h1 { color: #16a34a; font-size: 18px; margin: 0; }
                    .period { color: #666; font-size: 12px; }
                    table { width: 100%; border-collapse: collapse; }
                    th { background: #16a34a; color: white; padding: 8px 4px; font-size: 11px; text-align: center; }
                    td { padding: 3px; border: 1px solid #e5e7eb; vertical-align: top; height: 28px; font-size: 9px; }
                    .hour { background: #f3f4f6; font-weight: bold; width: 50px; text-align: center; }
                    .item { padding: 2px 4px; margin: 1px 0; border-radius: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    .task { background: #dbeafe; color: #1e40af; }
                    .apt { background: #fed7aa; color: #c2410c; }
                    .habit { background: #fef3c7; color: #92400e; }
                    .med { background: #f3e8ff; color: #7c3aed; }
                    .prayer { background: #dcfce7; color: #166534; font-weight: bold; }
                    @media print { button { display: none !important; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📅 جدول الأسبوع</h1>
                    <p class="period">${weekDates[0].toLocaleDateString('ar')} - ${weekDates[6].toLocaleDateString('ar')}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>الساعة</th>
        `;

        // Day headers
        weekDates.forEach(date => {
            const isToday = getDateStr(date) === getDateStr(new Date());
            html += `<th style="${isToday ? 'background:#059669' : ''}">${DAYS_AR[date.getDay()]}<br>${date.getDate()}</th>`;
        });
        html += `</tr></thead><tbody>`;

        // Get prayer times
        let prayerSchedule: any = {};
        try {
            const schedule = localStorage.getItem('baraka_prayer_schedule');
            if (schedule) prayerSchedule = JSON.parse(schedule);
        } catch (e) { }

        // Hours rows
        HOURS.forEach(hour => {
            const hourStr = hour.toString().padStart(2, '0') + ':00';
            html += `<tr><td class="hour">${hourStr}</td>`;

            weekDates.forEach(date => {
                const dateStr = getDateStr(date);
                const data = getDayData(dateStr);
                html += `<td>`;

                // Prayer times for this hour
                const prayers = prayerSchedule[dateStr] || {};
                const prayerNames: any = { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
                Object.entries(prayers).forEach(([name, time]) => {
                    if (typeof time === 'string' && time.startsWith(hour.toString().padStart(2, '0'))) {
                        html += `<div class="item prayer">🕌 ${prayerNames[name] || name} (${time})</div>`;
                    }
                });

                // Appointments at this hour
                data.appointments.filter(a => a.time.startsWith(hour.toString().padStart(2, '0'))).forEach(a => {
                    html += `<div class="item apt">📅 ${a.title}</div>`;
                });

                // Medications at this hour
                data.medications.filter(m => {
                    const medHour = parseInt(m.time?.split(':')[0] || '0');
                    return medHour === hour;
                }).forEach(m => {
                    html += `<div class="item med">💊 ${m.name}</div>`;
                });

                // Show habits in morning hours
                if (hour === 7 || hour === 8) {
                    data.habits.slice(0, 2).forEach(h => {
                        html += `<div class="item habit">🔥 ${h.name}</div>`;
                    });
                }

                // Show tasks (without specific time, show in work hours)
                if (hour >= 9 && hour <= 17) {
                    const tasksToShow = data.tasks.slice(0, 2);
                    if (hour === 9) {
                        tasksToShow.forEach(t => {
                            html += `<div class="item task">📋 ${t.title}</div>`;
                        });
                    }
                }

                html += `</td>`;
            });

            html += `</tr>`;
        });

        html += `</tbody></table>`;
        html += `<p style="text-align:center;margin-top:15px;color:#9ca3af;font-size:10px">✨ نظام بركة لإدارة الحياة</p>`;
        html += `</body></html>`;

        // Print via iframe
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;border:0;opacity:0.01;visibility:hidden;z-index:-1;';
        iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-modals');
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (doc) {
            doc.open();
            doc.write(html);
            doc.close();
            setTimeout(() => {
                iframe.contentWindow?.print();
                setTimeout(() => {
                    if (document.body.contains(iframe)) {
                        document.body.removeChild(iframe);
                    }
                }, 5000);
            }, 500);
        }
    };

    const weekDates = getWeekDates();
    const today = getDateStr(new Date());

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                        onClick={() => navigateWeek(-1)}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>

                    <div className="text-center">
                        <CardTitle className="text-lg flex items-center gap-2 justify-center">
                            <Calendar className="w-5 h-5" />
                            العرض الأسبوعي
                        </CardTitle>
                        <p className="text-sm text-white/80 mt-1">
                            {weekDates[0].toLocaleDateString('ar', { month: 'long', day: 'numeric' })} - {weekDates[6].toLocaleDateString('ar', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                        onClick={() => navigateWeek(1)}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex justify-center gap-2 mt-2">
                    <Button size="sm" variant="secondary" onClick={goToToday}>
                        اليوم
                    </Button>
                    <Button size="sm" variant="secondary" onClick={printWeeklySchedule}>
                        <Printer className="w-4 h-4 ml-1" />
                        طباعة الأسبوع
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
                <div className="min-w-[800px]">
                    {/* Days Header */}
                    <div className="grid grid-cols-8 bg-gray-100 sticky top-0 z-10">
                        <div className="p-2 text-center text-xs font-bold text-gray-600 border-b border-r">
                            الساعة
                        </div>
                        {weekDates.map((date, idx) => {
                            const dateStr = getDateStr(date);
                            const isToday = dateStr === today;
                            return (
                                <div
                                    key={idx}
                                    className={`p-2 text-center border-b border-r ${isToday ? 'bg-blue-100 text-blue-700' : ''
                                        }`}
                                >
                                    <div className="text-xs font-bold">{DAYS_AR[date.getDay()]}</div>
                                    <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                                        {date.getDate()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>



                    {/* Hours Grid */}
                    <div className="max-h-[500px] overflow-y-auto">
                        {HOURS.map(hour => (
                            <div key={hour} className="grid grid-cols-8 border-b">
                                {/* Hour Column */}
                                <div className="p-2 text-center text-xs font-bold text-gray-500 bg-gray-50 border-r">
                                    {hour.toString().padStart(2, '0')}:00
                                </div>

                                {/* Day Columns */}
                                {weekDates.map((date, dayIdx) => {
                                    const dateStr = getDateStr(date);
                                    const isToday = dateStr === today;
                                    const data = getDayData(dateStr);

                                    return (
                                        <div
                                            key={dayIdx}
                                            className={`min-h-[50px] p-1 border-r text-[10px] transition-colors cursor-pointer ${isToday ? 'bg-blue-50/50' : 'bg-white'
                                                } ${draggedItem ? 'hover:bg-blue-100' : 'hover:bg-gray-50'}`}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, dateStr)}
                                            onClick={() => {
                                                setQuickAddDate(dateStr);
                                                setQuickAddHour(hour);
                                                setFormData({ ...formData, time: `${hour.toString().padStart(2, '0')}:00` });
                                            }}
                                        >
                                            {/* Show appointments at this hour */}
                                            {data.appointments
                                                .filter(a => a.time.startsWith(hour.toString().padStart(2, '0')))
                                                .map(a => (
                                                    <div
                                                        key={a.id}
                                                        className="bg-orange-100 text-orange-700 p-1 rounded mb-1 truncate"
                                                    >
                                                        📅 {a.title}
                                                    </div>
                                                ))
                                            }

                                            {/* Show tasks (draggable, show at task time or 9:00 default) */}
                                            {data.tasks
                                                .filter(task => {
                                                    const taskHour = task.time ? parseInt(task.time.split(':')[0]) : 9;
                                                    return taskHour === hour;
                                                })
                                                .map(task => (
                                                    <div
                                                        key={task.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, 'task', task.id)}
                                                        onDragEnd={handleDragEnd}
                                                        className={`bg-blue-100 text-blue-700 p-1 rounded mb-1 truncate cursor-move flex items-center gap-1 ${draggedItem?.id === task.id ? 'opacity-50' : ''
                                                            }`}
                                                    >
                                                        <GripVertical className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                                        <span className="truncate">{task.title}</span>
                                                    </div>
                                                ))}

                                            {/* Show habits in morning */}
                                            {(hour === 7 || hour === 8) && data.habits.slice(0, 1).map(h => (
                                                <div
                                                    key={h.id}
                                                    className="bg-amber-100 text-amber-700 p-1 rounded mb-1 truncate"
                                                >
                                                    🔥 {h.name}
                                                </div>
                                            ))}

                                            {/* Show medications */}
                                            {data.medications
                                                .filter(m => parseInt(m.time?.split(':')[0] || '0') === hour)
                                                .map(m => (
                                                    <div
                                                        key={m.id}
                                                        className="bg-purple-100 text-purple-700 p-1 rounded mb-1 truncate"
                                                    >
                                                        💊 {m.name}
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>

            {/* Drag indicator */}
            {draggedItem && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg z-50 text-sm">
                    اسحب المهمة إلى اليوم المطلوب
                </div>
            )}

            {/* Quick Add Type Selection Popup */}
            <Dialog open={!!quickAddDate && !addType} onOpenChange={() => { setQuickAddDate(null); setAddType(null); setQuickAddHour(null); }}>
                <DialogContent className="max-w-xs">
                    <DialogHeader>
                        <DialogTitle className="text-center text-lg">
                            إضافة في {quickAddDate ? new Date(quickAddDate).toLocaleDateString('ar', { weekday: 'long', month: 'short', day: 'numeric' }) : ''}
                            {quickAddHour !== null && <span className="block text-sm text-gray-500">الساعة {quickAddHour}:00</span>}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 p-4">
                        <button
                            onClick={() => setAddType('appointment')}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-orange-200 bg-orange-50 hover:bg-orange-100 transition-all"
                        >
                            <Calendar className="w-10 h-10 text-orange-500" />
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
            <Dialog open={addType === 'appointment'} onOpenChange={(open) => {
                if (!open) {
                    setAddType(null);
                    setFormData({ title: '', time: '', location: '', description: '', priority: 'medium' });
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-orange-500" />
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
                                // Use quickAddHour for the time, or formData.time if user changed it
                                const appointmentTime = formData.time || (quickAddHour !== null ? `${quickAddHour.toString().padStart(2, '0')}:00` : '09:00');
                                await addAppointment({
                                    title: formData.title,
                                    date: quickAddDate,
                                    time: appointmentTime,
                                    location: formData.location,
                                    notes: formData.description
                                });
                                toast({ title: '✅ تم إضافة الموعد' });
                                setAddType(null);
                                setQuickAddDate(null);
                                setQuickAddHour(null);
                                setFormData({ title: '', time: '', location: '', description: '', priority: 'medium' });
                            }}
                        >
                            <Plus className="w-4 h-4 ml-2" /> حفظ الموعد
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Task Form */}
            <Dialog open={addType === 'task'} onOpenChange={(open) => {
                if (!open) {
                    setAddType(null);
                    setFormData({ title: '', time: '', location: '', description: '', priority: 'medium' });
                }
            }}>
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
                                // Use quickAddHour for the time, or formData.time if user changed it
                                const taskTime = formData.time || (quickAddHour !== null ? `${quickAddHour.toString().padStart(2, '0')}:00` : '09:00');

                                await addTask({
                                    title: formData.title,
                                    description: formData.description,
                                    deadline: quickAddDate,
                                    time: taskTime,
                                    priority: formData.priority as 'low' | 'medium' | 'high',
                                    type: 'task'
                                });
                                toast({ title: '✅ تم إضافة المهمة' });
                                setAddType(null);
                                setQuickAddDate(null);
                                setQuickAddHour(null);
                                setFormData({ title: '', time: '', location: '', description: '', priority: 'medium' });
                            }}
                        >
                            <Plus className="w-4 h-4 ml-2" /> حفظ المهمة
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default WeeklyCalendar;
