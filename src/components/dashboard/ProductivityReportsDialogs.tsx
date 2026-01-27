import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useProductivityTicker } from '@/hooks/useProductivityTicker';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { CheckSquare, Calendar, Moon, Clock } from 'lucide-react';

// --- Daily Report ---
interface DailyReportProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const DailyReportDialog: React.FC<DailyReportProps> = ({ open, onOpenChange }) => {
    const { allItems } = useProductivityTicker();
    // Filter to show only today's relevant items, sorted by time if possible
    // Note: allItems logic in hook already prioritizes today/urgent.

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-3xl" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl font-bold flex items-center justify-center gap-2">
                        📅 تقرير اليوم
                    </DialogTitle>
                    <p className="text-center text-sm text-gray-500">
                        {format(new Date(), 'EEEE, d MMMM', { locale: ar })}
                    </p>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {allItems.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            لا توجد أحداث هامة متبقية اليوم! 🎉
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {allItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-3 p-3 rounded-xl border bg-gray-50/50 hover:bg-white transition-colors"
                                >
                                    <div className={`
                                        p-2 rounded-lg shrink-0 
                                        ${item.type === 'prayer' ? 'bg-emerald-100 text-emerald-600' :
                                            item.type === 'task' ? 'bg-orange-100 text-orange-600' :
                                                item.type === 'appointment' ? 'bg-blue-100 text-blue-600' :
                                                    'bg-purple-100 text-purple-600'}
                                    `}>
                                        {item.type === 'prayer' && <Moon className="w-5 h-5" />}
                                        {item.type === 'task' && <CheckSquare className="w-5 h-5" />}
                                        {item.type === 'appointment' && <Calendar className="w-5 h-5" />}
                                        {['medication', 'habit', 'goal'].includes(item.type) && <Clock className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-sm">{item.title}</h4>
                                        <p className="text-xs text-gray-500">{item.subtitle}</p>
                                    </div>
                                    {item.time && (
                                        <div className="text-xs font-bold font-mono bg-white px-2 py-1 rounded shadow-sm">
                                            {item.time}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
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
    // We need to fetch data for the next 7 days
    const { tasks } = useTasks();
    const { appointments } = useAppointments();

    // Generate next 7 days
    const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl font-bold">
                        📊 التقرير الأسبوعي
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {days.map((day) => {
                        const dayStr = format(day, 'yyyy-MM-dd');

                        // Filter Tasks
                        const dayTasks = tasks.filter(t => t.deadline === dayStr && t.progress < 100);

                        // Filter Appointments
                        // Assuming appointments have date property YYYY-MM-DD
                        const dayAppointments = appointments.filter(a => a.date === dayStr);

                        if (dayTasks.length === 0 && dayAppointments.length === 0) return null;

                        return (
                            <div key={dayStr} className="space-y-2">
                                <h3 className="text-sm font-bold text-gray-500 bg-gray-100/50 px-3 py-1 rounded-lg w-fit">
                                    {format(day, 'EEEE, d MMMM', { locale: ar })}
                                </h3>

                                <div className="space-y-2 pr-2 border-r-2 border-gray-100">
                                    {dayAppointments.map(app => (
                                        <div key={app.id} className="flex items-center gap-2 text-sm bg-blue-50/50 p-2 rounded-lg border border-blue-50">
                                            <Calendar className="w-4 h-4 text-blue-500" />
                                            <span className="font-medium">{app.time}</span>
                                            <span>{app.title}</span>
                                        </div>
                                    ))}

                                    {dayTasks.map(task => (
                                        <div key={task.id} className="flex items-center gap-2 text-sm bg-orange-50/50 p-2 rounded-lg border border-orange-50">
                                            <CheckSquare className="w-4 h-4 text-orange-500" />
                                            <span>{task.title}</span>
                                            {task.priority === 'high' && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded">هام</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    <div className="text-center text-xs text-gray-400 pt-4">
                        تم عرض أهم الأحداث المجدولة للأسبوع القادم
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
