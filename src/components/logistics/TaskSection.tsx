import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Edit, Share2, Trash2, ChevronDown, ChevronUp, Layers, Clock, PieChart as PieChartIcon, CheckSquare, ChevronLeft, ChevronRight, Printer, Pill, Flame, Square, CheckSquare2, Moon, ShoppingCart } from 'lucide-react';
import { MainTask, SubTask } from '@/hooks/useTasks';
import { Appointment } from '@/hooks/useAppointments';
import { useHabits } from '@/hooks/useHabits';
import { useMedications } from '@/hooks/useMedications';

interface TaskSectionProps {
    tasks: MainTask[];
    appointments: Appointment[];
    activeTab: string;
    setActiveTab: (tab: 'task' | 'project' | 'appointment' | 'calendar') => void;

    // Actions
    onEditTask: (task: MainTask) => void;
    onDeleteTask: (id: string) => void;
    onShareTask: (task: MainTask) => void;

    onDeleteAppointment: (id: string) => void;

    // Subtask Actions
    onAddSubtask: (taskId: string, title: string) => void;
    onToggleSubtask: (taskId: string, subtaskId: string) => void;
    onDeleteSubtask: (taskId: string, subtaskId: string) => void;

    // Pomodoro
    pomodoro: {
        active: boolean;
        time: number;
        taskId: string | null;
        start: (id: string) => void;
        stop: () => void;
        format: () => string;
    };
}

export const TaskSection: React.FC<TaskSectionProps> = ({
    tasks, appointments, activeTab, setActiveTab,
    onEditTask, onDeleteTask, onShareTask,
    onDeleteAppointment,
    onAddSubtask, onToggleSubtask, onDeleteSubtask,
    pomodoro
}) => {
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

    // Print selection state
    const [showPrintOptions, setShowPrintOptions] = useState(false);
    const [printSelections, setPrintSelections] = useState({
        tasks: true,
        appointments: true,
        habits: true,
        medications: true,
        prayerTimes: true,
        shoppingList: false
    });
    const { habits } = useHabits();
    const { medications } = useMedications();

    const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    // Get calendar days for current month
    const getMonthDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        const days: (number | null)[] = [];

        // Add empty cells for days before the first of the month
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    };

    const getDateStr = (day: number) => {
        const year = currentMonth.getFullYear();
        const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}-${String(day).padStart(2, '0')}`;
    };

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

    const getDayCount = (day: number) => {
        const dateStr = getDateStr(day);
        const data = getDayData(dateStr);
        return data.tasks.length + data.appointments.length + data.habits.length + data.medications.length;
    };

    const printDayReport = (dateStr: string) => {
        const data = getDayData(dateStr);
        const date = new Date(dateStr);

        let html = `
            <html dir="rtl">
            <head>
                <title>مهام يوم ${date.toLocaleDateString('ar')}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: Tajawal, Arial; padding: 20px; margin: 0; }
                    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #16a34a; padding-bottom: 10px; }
                    .back-btn { background: #16a34a; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
                    h1 { color: #16a34a; margin: 0; font-size: 20px; }
                    .section { margin: 20px 0; padding: 15px; border-radius: 10px; }
                    .section-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
                    .item { padding: 8px 12px; margin: 5px 0; background: #f9fafb; border-radius: 8px; border-right: 3px solid; display: flex; align-items: flex-start; gap: 10px; }
                    .checkbox { width: 18px; height: 18px; border: 2px solid #9ca3af; border-radius: 4px; flex-shrink: 0; margin-top: 2px; }
                    .subtask { padding: 5px 10px; margin: 3px 0 3px 20px; background: #f3f4f6; border-radius: 6px; display: flex; align-items: center; gap: 8px; font-size: 14px; }
                    .subtask .checkbox { width: 14px; height: 14px; }
                    .tasks { background: #f0f9ff; } .tasks .item { border-color: #3b82f6; }
                    .appointments { background: #fff7ed; } .appointments .item { border-color: #f97316; }
                    .habits { background: #fef3c7; } .habits .item { border-color: #f59e0b; }
                    .medications { background: #fdf4ff; } .medications .item { border-color: #a855f7; }
                    @media print { .no-print { display: none !important; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📅 مهام ${date.toLocaleDateString('ar', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h1>
                    <button class="back-btn no-print" onclick="window.close()">← رجوع</button>
                </div>
                <button class="back-btn no-print" onclick="window.print()" style="background:#2563eb;margin-bottom:15px">🖨️ طباعة</button>
        `;

        if (printSelections.tasks && data.tasks.length > 0) {
            html += `<div class="section tasks"><div class="section-title">📋 المهام (${data.tasks.length})</div>`;
            data.tasks.forEach(t => {
                html += `<div class="item"><div class="checkbox"></div><div><strong>${t.title}</strong><br><small>${t.description || ''} - ${t.priority === 'high' ? 'أولوية عالية' : 'عادية'}</small>`;
                // Add subtasks with checkboxes
                if (t.subtasks && t.subtasks.length > 0) {
                    t.subtasks.forEach(st => {
                        html += `<div class="subtask"><div class="checkbox"></div><span>${st.title}</span></div>`;
                    });
                }
                html += `</div></div>`;
            });
            html += '</div>';
        }

        if (printSelections.appointments && data.appointments.length > 0) {
            html += `<div class="section appointments"><div class="section-title">📅 المواعيد (${data.appointments.length})</div>`;
            data.appointments.forEach(a => {
                html += `<div class="item"><div class="checkbox"></div><div><strong>${a.title}</strong><br><small>${a.time} ${(a as any).location ? '📍 ' + (a as any).location : ''}</small></div></div>`;
            });
            html += '</div>';
        }

        if (printSelections.habits && data.habits.length > 0) {
            html += `<div class="section habits"><div class="section-title">🔥 العادات (${data.habits.length})</div>`;
            data.habits.forEach(h => {
                html += `<div class="item"><div class="checkbox"></div><div>${h.name}`;
                // Add habit subtasks
                if (h.subtasks && h.subtasks.length > 0) {
                    h.subtasks.forEach(st => {
                        html += `<div class="subtask"><div class="checkbox"></div><span>${st.title}</span></div>`;
                    });
                }
                html += `</div></div>`;
            });
            html += '</div>';
        }

        if (printSelections.medications && data.medications.length > 0) {
            html += `<div class="section medications"><div class="section-title">💊 الأدوية (${data.medications.length})</div>`;
            data.medications.forEach(m => {
                html += `<div class="item"><div class="checkbox"></div><div><strong>${m.name}</strong><br><small>${m.time}</small></div></div>`;
            });
            html += '</div>';
        }

        html += `<p style="text-align:center;margin-top:30px;color:#9ca3af">✨ نظام بركة لإدارة الحياة</p></body></html>`;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
        }
        setShowPrintOptions(false);
    };

    // Print multiple days as table
    const printMultipleDays = () => {
        const dates = Array.from(selectedDates).sort();
        if (dates.length === 0) return;

        let html = `
            <html dir="rtl">
            <head>
                <title>تقرير ${dates.length} أيام</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: Tajawal, Arial; padding: 20px; margin: 0; }
                    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #16a34a; padding-bottom: 10px; }
                    h1 { color: #16a34a; font-size: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #16a34a; color: white; padding: 10px; text-align: right; }
                    td { padding: 8px; border: 1px solid #e5e7eb; vertical-align: top; }
                    .day-header { background: #f0fdf4; font-weight: bold; }
                    .checkbox { display: inline-block; width: 14px; height: 14px; border: 2px solid #9ca3af; border-radius: 3px; margin-left: 8px; }
                    .item { margin: 4px 0; display: flex; align-items: center; }
                    .task { color: #3b82f6; } .apt { color: #f97316; } .habit { color: #f59e0b; } .med { color: #a855f7; }
                    @media print { .no-print { display: none !important; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📅 تقرير ${dates.length} أيام</h1>
                    <p>${new Date(dates[0]).toLocaleDateString('ar')} - ${new Date(dates[dates.length - 1]).toLocaleDateString('ar')}</p>
                </div>
                <button class="no-print" onclick="window.print()" style="background:#2563eb;color:white;padding:10px 20px;border:none;border-radius:8px;cursor:pointer;margin-bottom:15px">🖨️ طباعة</button>
                <table>
                    <thead>
                        <tr>
                            <th>اليوم</th>
                            ${printSelections.tasks ? '<th>المهام</th>' : ''}
                            ${printSelections.appointments ? '<th>المواعيد</th>' : ''}
                            ${printSelections.habits ? '<th>العادات</th>' : ''}
                            ${printSelections.medications ? '<th>الأدوية</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
        `;

        dates.forEach(dateStr => {
            const data = getDayData(dateStr);
            const date = new Date(dateStr);

            html += `<tr>`;
            html += `<td class="day-header">${date.toLocaleDateString('ar', { weekday: 'short', month: 'short', day: 'numeric' })}</td>`;

            if (printSelections.tasks) {
                html += `<td>`;
                data.tasks.forEach(t => {
                    html += `<div class="item task"><span class="checkbox"></span>${t.title}</div>`;
                    if (t.subtasks) t.subtasks.forEach(st => {
                        html += `<div class="item" style="margin-right:20px"><span class="checkbox"></span><small>${st.title}</small></div>`;
                    });
                });
                html += `</td>`;
            }

            if (printSelections.appointments) {
                html += `<td>`;
                data.appointments.forEach(a => {
                    html += `<div class="item apt"><span class="checkbox"></span>${a.title} (${a.time})</div>`;
                });
                html += `</td>`;
            }

            if (printSelections.habits) {
                html += `<td>`;
                data.habits.forEach(h => {
                    html += `<div class="item habit"><span class="checkbox"></span>${h.name}</div>`;
                });
                html += `</td>`;
            }

            if (printSelections.medications) {
                html += `<td>`;
                data.medications.forEach(m => {
                    html += `<div class="item med"><span class="checkbox"></span>${m.name} (${m.time})</div>`;
                });
                html += `</td>`;
            }

            html += `</tr>`;
        });

        html += `</tbody></table><p style="text-align:center;margin-top:30px;color:#9ca3af">✨ نظام بركة لإدارة الحياة</p></body></html>`;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
        }
        setShowPrintOptions(false);
        setSelectedDates(new Set());
        setIsMultiSelectMode(false);
    };

    return (
        <div className="space-y-6">
            {/* View Toggle */}
            <div className="flex gap-2 mb-6 bg-gray-50/50 p-1.5 rounded-2xl border w-fit mx-auto sm:mx-0 shadow-sm">
                <button
                    onClick={() => setActiveTab('task')}
                    className={`px-6 py-2 text-sm rounded-xl font-bold transition-all duration-300 ${activeTab !== 'calendar'
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-200 scale-105'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                        }`}
                >
                    📋 قائمة المهام
                </button>
                <button
                    onClick={() => setActiveTab('calendar')}
                    className={`px-6 py-2 text-sm rounded-xl font-bold transition-all duration-300 ${activeTab === 'calendar'
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-200 scale-105'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                        }`}
                >
                    📅 التقويم الشهري
                </button>
            </div>

            {activeTab === 'calendar' ? (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white">
                        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                        <h2 className="font-bold text-lg">
                            {MONTHS_AR[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </h2>
                        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Multi-select toolbar */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
                        <div className="flex items-center gap-2">
                            <Button
                                variant={isMultiSelectMode ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                    setIsMultiSelectMode(!isMultiSelectMode);
                                    if (isMultiSelectMode) setSelectedDates(new Set());
                                }}
                                className={isMultiSelectMode ? "bg-blue-600" : ""}
                            >
                                <CheckSquare className="w-4 h-4 ml-1" />
                                {isMultiSelectMode ? 'إلغاء التحديد' : 'تحديد أيام'}
                            </Button>
                            {selectedDates.size > 0 && (
                                <Badge className="bg-blue-100 text-blue-700">{selectedDates.size} يوم محدد</Badge>
                            )}
                        </div>
                        {selectedDates.size > 0 && (
                            <Button size="sm" onClick={() => setShowPrintOptions(true)} className="bg-green-600 hover:bg-green-700">
                                <Printer className="w-4 h-4 ml-1" />
                                طباعة ({selectedDates.size})
                            </Button>
                        )}
                    </div>

                    {/* Days Header */}
                    <div className="grid grid-cols-7 bg-gray-100">
                        {DAYS_AR.map(day => (
                            <div key={day} className="text-center py-2 text-xs font-bold text-gray-600">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7">
                        {getMonthDays().map((day, idx) => {
                            if (day === null) {
                                return <div key={idx} className="h-16 bg-gray-50 border-b border-r"></div>;
                            }

                            const dateStr = getDateStr(day);
                            const isToday = dateStr === new Date().toISOString().split('T')[0];
                            const count = getDayCount(day);
                            const isSelected = selectedDates.has(dateStr);

                            const handleDayClick = () => {
                                if (isMultiSelectMode) {
                                    const newSet = new Set(selectedDates);
                                    if (newSet.has(dateStr)) {
                                        newSet.delete(dateStr);
                                    } else {
                                        newSet.add(dateStr);
                                    }
                                    setSelectedDates(newSet);
                                } else {
                                    setSelectedDate(dateStr);
                                }
                            };

                            return (
                                <div
                                    key={idx}
                                    onClick={handleDayClick}
                                    className={`h-16 border-b border-r p-1 cursor-pointer transition-all hover:bg-emerald-50 relative
                                        ${isToday ? 'bg-emerald-100 ring-2 ring-emerald-500 ring-inset' : 'bg-white'}
                                        ${isSelected ? 'bg-blue-100 ring-2 ring-blue-500 ring-inset' : ''}
                                    `}
                                >
                                    {isMultiSelectMode && (
                                        <div className={`absolute top-1 left-1 w-4 h-4 rounded border-2 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                            {isSelected && <CheckSquare className="w-3 h-3 text-white" />}
                                        </div>
                                    )}
                                    <div className={`text-sm font-bold ${isToday ? 'text-emerald-700' : isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                                        {day}
                                    </div>
                                    {count > 0 && (
                                        <div className="flex flex-wrap gap-0.5 mt-1">
                                            <span className="bg-emerald-500 text-white text-[8px] px-1.5 py-0.5 rounded-full">
                                                {count}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <>
                    {/* Appointments Section */}
                    {appointments.length > 0 && (
                        <div className="bg-white rounded-xl border p-4 shadow-sm">
                            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-orange-500" />
                                المواعيد القادمة
                            </h3>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {appointments.map(apt => (
                                    <div key={apt.id} className="border rounded-lg p-3 flex items-center justify-between bg-orange-50/30 border-orange-100">
                                        <div>
                                            <p className="font-bold text-sm text-gray-800">{apt.title}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                <span>{apt.date}</span>
                                                <span>•</span>
                                                <span>{apt.time}</span>
                                            </div>
                                            {apt.location && <p className="text-xs text-blue-500 mt-1">{apt.location}</p>}
                                        </div>
                                        <div className="flex gap-1">
                                            {/* Edit not hooked up yet */}
                                            <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="w-3 h-3" /></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => onDeleteAppointment(apt.id)}><Trash2 className="w-3 h-3" /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tasks & Projects */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <PieChartIcon className="w-5 h-5 text-purple-600" />
                            المهام والمشاريع الحالية
                        </h3>

                        {tasks.map(task => (
                            <div
                                key={task.id}
                                className={`
                                    border rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group
                                    ${task.priority === 'high' ? 'border-r-4 border-r-red-500' : 'border-r-4 border-r-transparent'}
                                    ${task.progress === 100 ? 'opacity-75 bg-gray-50' : ''}
                                `}
                            >
                                <div className="p-5 flex flex-wrap gap-4 justify-between items-start">

                                    {/* Progress Ring */}
                                    <div className="w-14 h-14 relative flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-full h-full transform -rotate-90 drop-shadow-sm">
                                            <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-100" />
                                            <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4" fill="transparent"
                                                className={`${task.progress === 100 ? 'text-green-500' : 'text-indigo-600'}`}
                                                strokeDasharray={138.2} strokeDashoffset={138.2 - (138.2 * task.progress) / 100}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold font-mono">{task.progress}%</span>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-[200px]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className={`font-bold text-lg group-hover:text-indigo-600 transition-colors ${task.progress === 100 ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</h4>
                                            {task.type === 'project' && <Badge variant="outline" className="text-[10px] border-indigo-200 text-indigo-700 bg-indigo-50">مشروع</Badge>}
                                            <Badge className={`text-[10px] px-2 py-0.5 rounded-full ${task.priority === 'high' ? 'bg-red-100 text-red-700 border-red-200 border' :
                                                task.priority === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-200 border' :
                                                    'bg-blue-100 text-blue-700 border-blue-200 border'
                                                }`}>
                                                {task.priority === 'high' ? 'مستعجل' : task.priority === 'medium' ? 'متوسط' : 'عادي'}
                                            </Badge>
                                        </div>
                                        {task.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">{task.description}</p>}
                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                            <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${new Date(task.deadline) < new Date() && task.progress < 100 ? 'bg-red-50 text-red-500' : 'bg-gray-50'}`}>
                                                <CalendarIcon className="w-3.5 h-3.5" />
                                                {task.deadline}
                                            </span>
                                            {task.subtasks.length > 0 && (
                                                <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                                                    <Layers className="w-3.5 h-3.5" />
                                                    {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1">
                                        {task.type === 'task' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={`h-8 w-8 ${pomodoro.taskId === task.id ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-green-600'}`}
                                                onClick={() => pomodoro.taskId === task.id ? pomodoro.stop() : pomodoro.start(task.id)}
                                            >
                                                <Clock className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600" onClick={() => onEditTask(task)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-purple-600" onClick={() => onShareTask(task)}>
                                            <Share2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-300 hover:text-red-500 hover:bg-red-50" onClick={() => onDeleteTask(task.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}>
                                            {expandedTaskId === task.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>

                                {/* Subtasks */}
                                {expandedTaskId === task.id && (
                                    <div className="bg-gray-50/50 p-4 border-t">
                                        <p className="text-xs font-bold text-gray-500 mb-2">المهام الفرعية</p>
                                        <div className="space-y-2 mb-3">
                                            {task.subtasks.map(sub => (
                                                <div key={sub.id} className="flex items-center gap-2 group">
                                                    <input
                                                        type="checkbox"
                                                        checked={sub.completed}
                                                        onChange={() => onToggleSubtask(task.id, sub.id)}
                                                        className="accent-purple-600"
                                                    />
                                                    <span className={`text-sm flex-1 ${sub.completed ? 'line-through text-gray-400' : ''}`}>{sub.title}</span>
                                                    <Trash2
                                                        className="w-3 h-3 text-red-300 opacity-0 group-hover:opacity-100 cursor-pointer"
                                                        onClick={() => onDeleteSubtask(task.id, sub.id)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="مهمة فرعية جديدة..."
                                                className="h-8 text-xs bg-white"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        onAddSubtask(task.id, e.currentTarget.value);
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Day Details Dialog */}
            <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
                <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-right flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-emerald-500" />
                                {selectedDate && new Date(selectedDate).toLocaleDateString('ar', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                            <Button variant="outline" size="sm" onClick={() => setShowPrintOptions(true)}>
                                <Printer className="w-4 h-4 ml-1" /> طباعة
                            </Button>
                        </DialogTitle>
                    </DialogHeader>

                    {selectedDate && (() => {
                        const data = getDayData(selectedDate);
                        const totalItems = data.tasks.length + data.appointments.length + data.habits.length + data.medications.length;

                        return (
                            <div className="space-y-4">
                                {totalItems === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                        <p>لا توجد مهام لهذا اليوم</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Tasks */}
                                        {data.tasks.length > 0 && (
                                            <div className="bg-blue-50 p-3 rounded-lg">
                                                <h4 className="font-bold text-blue-700 mb-2 flex items-center gap-2">
                                                    📋 المهام ({data.tasks.length})
                                                </h4>
                                                <div className="space-y-2">
                                                    {data.tasks.map(t => (
                                                        <div key={t.id} className="bg-white p-2 rounded border-r-2 border-blue-500">
                                                            <span className="font-bold">{t.title}</span>
                                                            {t.description && <p className="text-xs text-gray-500">{t.description}</p>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Appointments */}
                                        {data.appointments.length > 0 && (
                                            <div className="bg-orange-50 p-3 rounded-lg">
                                                <h4 className="font-bold text-orange-700 mb-2 flex items-center gap-2">
                                                    📅 المواعيد ({data.appointments.length})
                                                </h4>
                                                <div className="space-y-2">
                                                    {data.appointments.map(a => (
                                                        <div key={a.id} className="bg-white p-2 rounded border-r-2 border-orange-500">
                                                            <span className="font-bold">{a.title}</span>
                                                            <p className="text-xs text-gray-500">{a.time} {a.location && `- ${a.location}`}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Habits */}
                                        {data.habits.length > 0 && (
                                            <div className="bg-amber-50 p-3 rounded-lg">
                                                <h4 className="font-bold text-amber-700 mb-2 flex items-center gap-2">
                                                    🔥 العادات ({data.habits.length})
                                                </h4>
                                                <div className="space-y-2">
                                                    {data.habits.map(h => (
                                                        <div key={h.id} className="bg-white p-2 rounded border-r-2 border-amber-500">
                                                            <span className="font-bold">{h.name}</span>
                                                            <p className="text-xs text-gray-500">🔥 {h.streak} يوم متواصل</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Medications */}
                                        {data.medications.length > 0 && (
                                            <div className="bg-purple-50 p-3 rounded-lg">
                                                <h4 className="font-bold text-purple-700 mb-2 flex items-center gap-2">
                                                    💊 الأدوية ({data.medications.length})
                                                </h4>
                                                <div className="space-y-2">
                                                    {data.medications.map(m => (
                                                        <div key={m.id} className="bg-white p-2 rounded border-r-2 border-purple-500">
                                                            <span className="font-bold">{m.name}</span>
                                                            <p className="text-xs text-gray-500">{m.time}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* Print Options Dialog */}
            <Dialog open={showPrintOptions} onOpenChange={setShowPrintOptions}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-right arabic-title">خيارات الطباعة</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-gray-600 text-right">حدد ما تريد طباعته:</p>

                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100">
                                <input
                                    type="checkbox"
                                    checked={printSelections.tasks}
                                    onChange={(e) => setPrintSelections({ ...printSelections, tasks: e.target.checked })}
                                    className="w-5 h-5 accent-blue-600"
                                />
                                <span className="flex items-center gap-2">
                                    <CheckSquare className="w-4 h-4 text-blue-600" />
                                    المهام
                                </span>
                            </label>

                            <label className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100">
                                <input
                                    type="checkbox"
                                    checked={printSelections.appointments}
                                    onChange={(e) => setPrintSelections({ ...printSelections, appointments: e.target.checked })}
                                    className="w-5 h-5 accent-orange-600"
                                />
                                <span className="flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4 text-orange-600" />
                                    المواعيد
                                </span>
                            </label>

                            <label className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg cursor-pointer hover:bg-amber-100">
                                <input
                                    type="checkbox"
                                    checked={printSelections.habits}
                                    onChange={(e) => setPrintSelections({ ...printSelections, habits: e.target.checked })}
                                    className="w-5 h-5 accent-amber-600"
                                />
                                <span className="flex items-center gap-2">
                                    <Flame className="w-4 h-4 text-amber-600" />
                                    العادات
                                </span>
                            </label>

                            <label className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100">
                                <input
                                    type="checkbox"
                                    checked={printSelections.medications}
                                    onChange={(e) => setPrintSelections({ ...printSelections, medications: e.target.checked })}
                                    className="w-5 h-5 accent-purple-600"
                                />
                                <span className="flex items-center gap-2">
                                    <Pill className="w-4 h-4 text-purple-600" />
                                    الأدوية
                                </span>
                            </label>

                            <label className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg cursor-pointer hover:bg-indigo-100">
                                <input
                                    type="checkbox"
                                    checked={printSelections.prayerTimes}
                                    onChange={(e) => setPrintSelections({ ...printSelections, prayerTimes: e.target.checked })}
                                    className="w-5 h-5 accent-indigo-600"
                                />
                                <span className="flex items-center gap-2">
                                    <Moon className="w-4 h-4 text-indigo-600" />
                                    أوقات الصلاة
                                </span>
                            </label>

                            <label className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg cursor-pointer hover:bg-teal-100">
                                <input
                                    type="checkbox"
                                    checked={printSelections.shoppingList}
                                    onChange={(e) => setPrintSelections({ ...printSelections, shoppingList: e.target.checked })}
                                    className="w-5 h-5 accent-teal-600"
                                />
                                <span className="flex items-center gap-2">
                                    <ShoppingCart className="w-4 h-4 text-teal-600" />
                                    قائمة التسوق
                                </span>
                            </label>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowPrintOptions(false)}>
                            إلغاء
                        </Button>
                        <Button
                            onClick={() => {
                                if (selectedDates.size > 0) {
                                    printMultipleDays();
                                } else if (selectedDate) {
                                    printDayReport(selectedDate);
                                }
                            }}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Printer className="w-4 h-4 ml-2" />
                            طباعة {selectedDates.size > 0 ? `(${selectedDates.size} أيام)` : ''}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
