import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useMedications } from '@/hooks/useMedications';
import { useTasks } from '@/hooks/useTasks';
import {
    CalendarPlus, ChevronLeft, ChevronRight, CheckSquare, Pill, Flame
} from 'lucide-react';

interface DashboardCalendarProps {
    tasks: any[];
    appointments: any[];
    habits: any[];
    medications: any[];
    prayerTimes: any[];
    onNavigateToTab: (tabId: string) => void;
    refetch?: () => void;
    weekStartDate: Date;
    setWeekStartDate: (date: Date) => void;
}

const DashboardCalendar: React.FC<DashboardCalendarProps> = ({
    tasks, appointments, habits, medications, prayerTimes,
    onNavigateToTab, refetch, weekStartDate, setWeekStartDate
}) => {
    const { toast } = useToast();
    const { toggleMedTaken } = useMedications();
    const { updateTask } = useTasks();

    const FILTER_DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const DAYS_AR = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
    const todayStr = new Date().toISOString().split('T')[0];

    // Week days for weekly calendar
    const getWeekDays = () => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStartDate);
            day.setDate(weekStartDate.getDate() + i);
            days.push(day);
        }
        return days;
    };
    const weekDays = getWeekDays();

    // Render day card for weekly calendar
    const renderDayCard = (day: Date, idx: number, fullWidth = false) => {
        const dateStr = day.toISOString().split('T')[0];
        const isToday = dateStr === todayStr;
        const dayNameForFilter = FILTER_DAY_NAMES[day.getDay()];

        const dayAppts = appointments.filter(a => a.date === dateStr);
        // Fix: Use correct filtering for dayMeds
        const dayMeds = medications.filter(m =>
            m.frequency === 'daily' ||
            (m.frequency === 'specific_days' && m.customDays?.includes(dayNameForFilter))
        );
        // Add: Include tasks for the day
        const dayTasks = tasks.filter(t => t.deadline === dateStr);

        const allItems = [
            ...dayMeds.map(m => ({ type: 'med' as const, name: m.name, time: m.time, id: m.id || m.name })),
            ...dayAppts.map(a => ({ type: 'apt' as const, name: a.title, time: a.time || '--', id: a.id, isCompleted: (a as any).is_completed })),
            ...dayTasks.map(t => ({ type: 'task' as const, name: t.title, time: 'مهام', id: t.id, isCompleted: t.progress === 100 }))
        ].sort((a, b) => {
            const timeA = a.time === 'مهام' ? '23:59' : (a.time || '');
            const timeB = b.time === 'مهام' ? '23:59' : (b.time || '');
            return timeA.localeCompare(timeB);
        });

        const handleToggle = async (item: any, isCompleted: boolean, isTaken: boolean) => {
            if (item.type === 'apt') {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                await supabase.from('appointments').update({ is_completed: !isCompleted }).eq('id', item.id);
                if (refetch) refetch();
                toast({ title: isCompleted ? 'تم إلغاء الإتمام' : 'تم إنجاز الموعد ✓' });
            } else if (item.type === 'med') {
                toggleMedTaken(item.id, dateStr);
                toast({ title: isTaken ? 'تم إلغاء التناول' : 'تم تناول الدواء ✓' });
            } else if (item.type === 'task') {
                const taskToUpdate = tasks.find(t => t.id === item.id);
                if (taskToUpdate) {
                    updateTask({
                        ...taskToUpdate,
                        progress: isCompleted ? 0 : 100
                    });
                    toast({ title: isCompleted ? 'تم إلغاء الإنجاز' : 'تم إنجاز المهمة ✓' });
                }
            }
        };

        return (
            <div
                key={idx}
                className={`rounded-xl transition-all ${fullWidth ? '' : ''} ${isToday ? 'bg-purple-100 border-2 border-purple-400' : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'}`}
            >
                {/* Day Header */}
                <div className={`text-center py-2 border-b ${isToday ? 'border-purple-200 bg-purple-50' : 'border-gray-200'} rounded-t-xl`}>
                    <span className="text-xs font-medium text-gray-600 block">{DAYS_AR[idx]}</span>
                    <span className={`text-lg font-bold ${isToday ? 'text-purple-700' : 'text-gray-700'}`}>{day.getDate()}</span>
                </div>

                {/* Horizontal Prayers Row */}
                {prayerTimes.find((p: any) => p.date === dateStr) && (
                    <div className="flex items-center justify-between px-2 py-1 bg-emerald-50/50 border-b border-emerald-100 text-[9px] text-emerald-800">
                        {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((pKey) => {
                            const pTime = prayerTimes.find((p: any) => p.date === dateStr)?.[pKey];
                            return (
                                <div key={pKey} className="flex flex-col items-center">
                                    <span className="opacity-70">{pKey === 'fajr' ? 'فجر' : pKey === 'dhuhr' ? 'ظهر' : pKey === 'asr' ? 'عصر' : pKey === 'maghrib' ? 'مغرب' : 'عشاء'}</span>
                                    <span className="font-bold">{pTime}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
                {/* Items inside day - scrollable */}
                <div className={`${fullWidth ? 'h-[60px]' : 'h-[100px]'} overflow-y-auto p-2 space-y-1.5`}>
                    {allItems.slice(0, 10).map((item, i) => {
                        const isTaken = item.type === 'med' && medications.find(m => m.id === item.id)?.takenHistory?.[dateStr];
                        const isCompleted = item.type === 'apt' ? (item as any).isCompleted : (item.type === 'task' ? (item as any).isCompleted : isTaken);

                        return (
                            <div
                                key={i}
                                className={`flex items-center gap-2 text-xs px-2 py-2 rounded-lg ${item.type === 'med' ? 'bg-red-100 text-red-700' :
                                    item.type === 'apt' ? 'bg-orange-100 text-orange-700' :
                                        'bg-blue-100 text-blue-700'} ${isCompleted ? 'opacity-50 bg-gray-100' : ''}`}
                            >
                                <button
                                    type="button"
                                    onClick={() => handleToggle(item, isCompleted, isTaken)}
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${isCompleted
                                        ? 'bg-green-500 border-green-500 text-white'
                                        : 'bg-white border-gray-400 hover:border-green-500'
                                        }`}
                                >
                                    {isCompleted && <CheckSquare className="w-4 h-4" />}
                                </button>
                                <div
                                    className={`flex-1 min-w-0 ${isCompleted ? 'line-through text-gray-500' : ''} cursor-pointer`}
                                    onClick={() => onNavigateToTab(
                                        item.type === 'apt' ? 'appointments' :
                                            item.type === 'task' ? 'tasks' : 'logistics'
                                    )}
                                >
                                    <div className="font-medium truncate">{item.name}</div>
                                    <div className="text-[10px] opacity-70">{item.time}</div>
                                </div>
                            </div>
                        );
                    })}
                    {allItems.length === 0 && (
                        <div className="text-xs text-gray-400 text-center py-3">{fullWidth ? 'لا توجد أنشطة' : '-'}</div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Card className="border-purple-100 shadow-sm mb-20">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <CalendarPlus className="w-5 h-5 text-purple-500" />
                        التقويم الأسبوعي
                    </h3>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setWeekStartDate(new Date(weekStartDate.setDate(weekStartDate.getDate() - 7)))}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setWeekStartDate(new Date(weekStartDate.setDate(weekStartDate.getDate() + 7)))}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Mobile: 3-row grid layout */}
                <div className="md:hidden space-y-2">
                    {/* Row 1: Mon, Tue, Wed */}
                    <div className="grid grid-cols-3 gap-2">
                        {weekDays.slice(0, 3).map((day, idx) => renderDayCard(day, idx))}
                    </div>
                    {/* Row 2: Thu, Fri, Sat */}
                    <div className="grid grid-cols-3 gap-2">
                        {weekDays.slice(3, 6).map((day, idx) => renderDayCard(day, idx + 3))}
                    </div>
                    {/* Row 3: Sunday (full width) */}
                    <div className="grid grid-cols-1 gap-2">
                        {weekDays.slice(6, 7).map((day, idx) => renderDayCard(day, idx + 6, true))}
                    </div>
                </div>

                {/* Desktop: 7-column grid */}
                <div className="hidden md:grid grid-cols-7 gap-1">
                    {weekDays.map((day, idx) => renderDayCard(day, idx))}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full"></span> الأدوية</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-400 rounded-full"></span> المواعيد</div>
                </div>
            </CardContent>
        </Card>
    );
};

export default DashboardCalendar;
