import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useProductivityTicker } from '@/hooks/useProductivityTicker';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useFinance } from '@/hooks/useFinance';
import { useMedications } from '@/hooks/useMedications';
import { cn } from '@/lib/utils';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
    CheckSquare, Calendar, Moon, Clock, TrendingUp,
    Wallet, Pill, Target, CheckCircle2, AlertTriangle,
    ArrowLeftRight, Activity
} from 'lucide-react';
import { Progress } from "@/components/ui/progress";

// --- Daily Report ---
interface DailyReportProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const DailyReportDialog: React.FC<DailyReportProps> = ({ open, onOpenChange }) => {
    const { allItems } = useProductivityTicker();
    const { tasks } = useTasks();
    const { financeData, dailyLimit } = useFinance();
    const { medications } = useMedications();

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayTasks = tasks.filter(t => t.deadline === todayStr);
    const completedTasksCount = todayTasks.filter(t => t.progress >= 100).length;
    const taskProgress = todayTasks.length > 0 ? (completedTasksCount / todayTasks.length) * 100 : 0;

    const todaySpent = financeData?.pending_expenses?.filter((e: any) =>
        e.timestamp?.startsWith(todayStr)
    ).reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0;

    const pendingMeds = medications.filter(m => m.reminder).length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-0 border-none shadow-2xl" dir="rtl">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white relative overflow-hidden">
                    {/* Decorative Circles */}
                    <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute bottom-[-40px] left-[-40px] w-48 h-48 bg-white/5 rounded-full blur-3xl" />

                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-right text-2xl font-black flex items-center gap-3">
                            <Activity className="w-6 h-6" />
                            تقرير البركة اليومي
                        </DialogTitle>
                        <p className="text-right text-indigo-100 font-bold mt-1">
                            {format(new Date(), 'EEEE, d MMMM yyyy', { locale: ar })}
                        </p>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-6 -mt-4 bg-white rounded-t-[2.5rem] relative z-20">
                    {/* 1. Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                                <span className="text-xs font-bold text-emerald-800">إنجاز المهام</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-emerald-700">{completedTasksCount}</span>
                                <span className="text-xs text-emerald-500">/ {todayTasks.length}</span>
                            </div>
                            <Progress value={taskProgress} className="h-1.5 mt-2 bg-emerald-200" />
                        </div>

                        <div className="bg-rose-50 p-4 rounded-3xl border border-rose-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Wallet className="w-4 h-4 text-rose-600" />
                                <span className="text-xs font-bold text-rose-800">المصروف اليومي</span>
                            </div>
                            <div className="text-xl font-black text-rose-700 truncate">
                                {todaySpent.toLocaleString()} <span className="text-[10px]">ARS</span>
                            </div>
                            <p className="text-[10px] text-rose-500 mt-2 font-bold">
                                المتبقي: {(dailyLimit || 0).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* 2. Today's Schedule (Card format) */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-gray-400 flex items-center gap-2 px-1">
                            <Clock className="w-4 h-4" />
                            برنامج اليوم
                        </h3>
                        {allItems.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                <Target className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-400 font-bold">يومك منجز تماماً! 🎉</p>
                            </div>
                        ) : (
                            <div className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                                {allItems.map((item, idx) => (
                                    <div key={item.id} className={cn(
                                        "flex items-center justify-between py-2",
                                        idx !== allItems.length - 1 && "border-b border-gray-50 pb-4"
                                    )}>
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center",
                                                item.type === 'prayer' ? 'bg-emerald-100 text-emerald-600' :
                                                    item.type === 'task' ? 'bg-orange-100 text-orange-600' :
                                                        'bg-blue-100 text-blue-600'
                                            )}>
                                                {item.type === 'prayer' ? <Moon className="w-4 h-4" /> :
                                                    item.type === 'task' ? <CheckSquare className="w-4 h-4" /> :
                                                        <Calendar className="w-4 h-4" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-gray-700 truncate">{item.title}</p>
                                                <p className="text-[9px] text-gray-400 font-bold">{item.subtitle}</p>
                                            </div>
                                        </div>
                                        {item.time && (
                                            <div className="bg-gray-100 px-3 py-1 rounded-full text-[10px] font-black text-gray-600">
                                                {item.time}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 3. Footer Tip */}
                    <div className="bg-blue-50 p-4 rounded-[2rem] border border-blue-100 flex items-center gap-4">
                        <div className="p-2 bg-white rounded-full text-blue-600">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-blue-900">نصيحة البركة</p>
                            <p className="text-[10px] text-blue-700 leading-relaxed font-bold">
                                ركز على المهام ذات الأولوية العالية أولاً لزيادة الإنتاجية اليومية بنسبة 20%.
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};


// --- Weekly Report ---
interface WeeklyReportProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const WeeklyReportDialog: React.FC<WeeklyReportProps> = ({ open, onOpenChange }) => {
    const { tasks } = useTasks();
    const { appointments } = useAppointments();
    const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

    // Weekly Stats Logic
    const upcomingTasks = tasks.filter(t => {
        const d = parseISO(t.deadline);
        return d >= new Date() && d <= addDays(new Date(), 7);
    });

    const highPriorityCount = upcomingTasks.filter(t => t.priority === 'high').length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden rounded-[2.5rem] p-0 border-none shadow-2xl flex flex-col" dir="rtl">
                <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 p-8 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-right text-2xl font-black flex items-center gap-3">
                            <Calendar className="w-6 h-6" />
                            الاستشراف الأسبوعي
                        </DialogTitle>
                        <p className="text-right text-indigo-100 font-bold mt-1">
                            الأسبوع القادم: {format(new Date(), 'd MMM')} - {format(addDays(new Date(), 7), 'd MMM yyyy')}
                        </p>
                    </DialogHeader>

                    <div className="flex items-center gap-4 mt-6">
                        <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl flex-1 border border-white/20">
                            <p className="text-xs opacity-80 mb-1">إجمالي المهام</p>
                            <p className="text-2xl font-black">{upcomingTasks.length}</p>
                        </div>
                        <div className="bg-rose-500/20 backdrop-blur-md p-3 rounded-2xl flex-1 border border-rose-500/30">
                            <p className="text-xs opacity-80 mb-1">أولوية عالية</p>
                            <p className="text-2xl font-black text-rose-300">{highPriorityCount}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                    <div className="space-y-4">
                        {days.map((day) => {
                            const dayStr = format(day, 'yyyy-MM-dd');
                            const dayTasks = tasks.filter(t => t.deadline === dayStr);
                            const dayAppts = appointments.filter(a => a.date === dayStr);

                            if (dayTasks.length === 0 && dayAppts.length === 0) return null;

                            return (
                                <div key={dayStr} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black text-indigo-700">
                                            {format(day, 'EEEE', { locale: ar })}
                                            <span className="text-[10px] text-gray-400 mr-2">{format(day, 'd MMMM')}</span>
                                        </h3>
                                        <div className="flex gap-1">
                                            {dayAppts.length > 0 && <span className="bg-blue-100 text-blue-600 text-[8px] font-black px-1.5 py-0.5 rounded-full">{dayAppts.length} مواعيد</span>}
                                            {dayTasks.length > 0 && <span className="bg-indigo-100 text-indigo-600 text-[8px] font-black px-1.5 py-0.5 rounded-full">{dayTasks.length} مهام</span>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {dayAppts.map(app => (
                                            <div key={app.id} className="flex items-center gap-3 text-xs bg-gray-50 p-2 rounded-xl">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                <span className="font-black text-gray-700">{app.time}</span>
                                                <span className="text-gray-500 truncate">{app.title}</span>
                                            </div>
                                        ))}
                                        {dayTasks.map(task => (
                                            <div key={task.id} className="flex items-center gap-3 text-xs bg-gray-50 p-2 rounded-xl">
                                                <div className={cn("w-1.5 h-1.5 rounded-full", task.priority === 'high' ? 'bg-rose-500' : 'bg-indigo-500')} />
                                                <span className="text-gray-500 truncate">{task.title}</span>
                                                {task.priority === 'high' && <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="text-center pb-4">
                        <p className="text-[10px] font-black text-gray-400">نهاية التقرير الأسبوعي</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

