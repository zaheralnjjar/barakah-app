import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    Pill,
    CheckSquare,
    CalendarDays,
    ListChecks,
    Share2,
    Printer
} from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { useHabits } from '@/hooks/useHabits';
import { useMedications } from '@/hooks/useMedications';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useToast } from '@/hooks/use-toast';

interface DailyCalendarProps {
    compact?: boolean;
}

export const DailyCalendar: React.FC<DailyCalendarProps> = ({ compact = false }) => {
    const { tasks } = useTasks();
    const { appointments } = useAppointments();
    const { habits } = useHabits();
    const { medications } = useMedications();
    const { prayerTimes } = useDashboardData();
    const { toast } = useToast();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showExportDialog, setShowExportDialog] = useState(false);

    const dateStr = selectedDate.toISOString().split('T')[0];
    const dayMap = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const todayDayName = dayMap[selectedDate.getDay()];

    // Get activities for selected date
    const dayAppointments = appointments.filter(a => a.date === dateStr);
    const dayTasks = tasks.filter(t => t.deadline === dateStr || t.startDate === dateStr);
    const dayHabits = habits.filter(h =>
        h.frequency === 'daily' ||
        (h.frequency === 'specific_days' && h.customDays?.includes(todayDayName))
    );
    const dayMedications = medications.filter(m =>
        m.frequency === 'daily' ||
        (m.frequency === 'specific_days' && m.customDays?.includes(todayDayName))
    );

    // Get prayer times for today - prayerTimes is already an array
    const todayPrayers = prayerTimes?.map(p => ({
        name: p.nameAr || p.name,
        time: p.time,
        icon: p.name === 'Fajr' ? '🌙' : p.name === 'Sunrise' ? '🌅' : p.name === 'Dhuhr' ? '☀️' : p.name === 'Asr' ? '🌤️' : p.name === 'Maghrib' ? '🌅' : '🌙'
    })).filter(p => p.name !== 'Sunrise') || [];

    const navigateDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };

    const generateDayReport = () => {
        let report = `📅 جدول اليوم - ${selectedDate.toLocaleDateString('ar')}\n`;
        report += `━━━━━━━━━━━━━━━━\n\n`;

        if (todayPrayers.length > 0) {
            report += `🕌 أوقات الصلاة:\n`;
            todayPrayers.forEach(p => {
                report += `   ${p.icon} ${p.name}: ${p.time}\n`;
            });
            report += `\n`;
        }

        if (dayAppointments.length > 0) {
            report += `📆 المواعيد:\n`;
            dayAppointments.forEach(a => {
                report += `   ⏰ ${a.time || '--'} - ${a.title}\n`;
            });
            report += `\n`;
        }

        if (dayTasks.length > 0) {
            report += `📋 المهام:\n`;
            dayTasks.forEach(t => {
                const status = t.progress === 100 ? '✅' : '⏳';
                report += `   ${status} ${t.title}\n`;
            });
            report += `\n`;
        }

        if (dayHabits.length > 0) {
            report += `🔥 العادات:\n`;
            dayHabits.forEach(h => {
                const done = (h.history || {})[dateStr];
                report += `   ${done ? '✅' : '⏳'} ${h.name}\n`;
            });
            report += `\n`;
        }

        if (dayMedications.length > 0) {
            report += `💊 الأدوية:\n`;
            dayMedications.forEach(m => {
                const taken = (m.takenHistory || {})[dateStr];
                report += `   ${taken ? '✅' : '⏳'} ${m.name} - ${m.time}\n`;
            });
            report += `\n`;
        }

        report += `\n✨ نظام بركة لإدارة الحياة`;
        return report;
    };

    const handleShare = async () => {
        const report = generateDayReport();
        if (navigator.share) {
            await navigator.share({ title: 'جدول اليوم', text: report });
        } else {
            await navigator.clipboard.writeText(report);
            toast({ title: 'تم النسخ للحافظة' });
        }
        setShowExportDialog(false);
    };

    const handlePrint = () => {
        const report = generateDayReport();
        const win = window.open('', '_blank');
        if (win) {
            win.document.write(`
                <html dir="rtl">
                <head>
                    <title>جدول اليوم - بركة</title>
                    <style>
                        body { font-family: Tajawal, Arial; padding: 30px; white-space: pre-wrap; line-height: 1.8; }
                        h1 { color: #16a34a; border-bottom: 2px solid #16a34a; padding-bottom: 10px; }
                        .no-print { margin-bottom: 15px; }
                        .back-btn { padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; margin-left: 10px; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <div class="no-print">
                        <button class="back-btn" onclick="window.close()" style="background: #f3f4f6; color: #374151;">← إغلاق</button>
                        <button class="back-btn" onclick="window.print()" style="background: #16a34a; color: white;">🖨️ طباعة</button>
                    </div>
                    <h1>📅 جدول اليوم</h1>
                    <pre>${report}</pre>
                </body>
                </html>
            `);
            win.document.close();
        }
        setShowExportDialog(false);
    };

    const totalItems = dayAppointments.length + dayTasks.length + dayHabits.length + dayMedications.length + todayPrayers.length;

    if (compact) {
        // Compact widget version for main screen
        return (
            <Card
                className="hover:shadow-md transition-shadow"
                onClick={(e) => e.stopPropagation()}
            >
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-primary" />
                            تقويم اليوم
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {selectedDate.toLocaleDateString('ar', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div className="bg-emerald-50 p-2 rounded">
                            <span className="block text-base font-bold text-emerald-600">{todayPrayers.length}</span>
                            <span className="text-[10px] text-gray-500">صلاة</span>
                        </div>
                        <div className="bg-blue-50 p-2 rounded">
                            <span className="block text-base font-bold text-blue-600">{dayAppointments.length}</span>
                            <span className="text-[10px] text-gray-500">موعد</span>
                        </div>
                        <div className="bg-orange-50 p-2 rounded">
                            <span className="block text-base font-bold text-orange-600">{dayTasks.length}</span>
                            <span className="text-[10px] text-gray-500">مهمة</span>
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                            <span className="block text-base font-bold text-purple-600">{dayMedications.length}</span>
                            <span className="text-[10px] text-gray-500">دواء</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Full calendar view
    return (
        <>
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base font-bold whitespace-nowrap">
                            <CalendarDays className="w-4 h-4 text-primary" />
                            تقويم الأنشطة اليومية
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
                            <Share2 className="w-4 h-4 ml-1" />
                            تصدير
                        </Button>
                    </div>

                    {/* Date Navigator */}
                    <div className="flex items-center justify-center gap-4 mt-3">
                        <Button variant="ghost" size="sm" onClick={() => navigateDate(-1)}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <div className="text-center">
                            <span className="text-lg font-bold block">
                                {selectedDate.toLocaleDateString('ar', { weekday: 'long' })}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                {selectedDate.toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => navigateDate(1)}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button
                        variant="link"
                        size="sm"
                        className="mx-auto block mt-1"
                        onClick={() => setSelectedDate(new Date())}
                    >
                        العودة لليوم
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">

                        {/* Appointments */}
                        {dayAppointments.length > 0 && (
                            <div className="border rounded-lg p-3 bg-blue-50/50">
                                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4" /> المواعيد ({dayAppointments.length})
                                </h4>
                                <div className="space-y-1">
                                    {dayAppointments.map((a, i) => (
                                        <div key={i} className="flex items-center justify-between bg-white p-2 rounded text-sm">
                                            <span>{a.title}</span>
                                            <span className="text-muted-foreground">{a.time || '--'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tasks */}
                        {dayTasks.length > 0 && (
                            <div className="border rounded-lg p-3 bg-orange-50/50">
                                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                                    <CheckSquare className="w-4 h-4" /> المهام ({dayTasks.length})
                                </h4>
                                <div className="space-y-1">
                                    {dayTasks.map((t, i) => (
                                        <div key={i} className="flex items-center justify-between bg-white p-2 rounded text-sm">
                                            <span className={t.progress === 100 ? 'line-through text-gray-400' : ''}>{t.title}</span>
                                            <span className={`text-xs ${t.progress === 100 ? 'text-green-600' : 'text-orange-600'}`}>
                                                {t.progress === 100 ? '✅ مكتمل' : `${t.progress}%`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Habits */}
                        {dayHabits.length > 0 && (
                            <div className="border rounded-lg p-3 bg-yellow-50/50">
                                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                                    <ListChecks className="w-4 h-4" /> العادات ({dayHabits.length})
                                </h4>
                                <div className="space-y-1">
                                    {dayHabits.map((h, i) => {
                                        const done = (h.history || {})[dateStr];
                                        return (
                                            <div key={i} className="flex items-center justify-between bg-white p-2 rounded text-sm">
                                                <span className={done ? 'line-through text-gray-400' : ''}>{h.name}</span>
                                                <span className="text-orange-600 text-xs">🔥 {h.streak || 0}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Medications */}
                        {dayMedications.length > 0 && (
                            <div className="border rounded-lg p-3 bg-purple-50/50">
                                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                                    <Pill className="w-4 h-4" /> الأدوية ({dayMedications.length})
                                </h4>
                                <div className="space-y-1">
                                    {dayMedications.map((m, i) => {
                                        const taken = (m.takenHistory || {})[dateStr];
                                        return (
                                            <div key={i} className="flex items-center justify-between bg-white p-2 rounded text-sm">
                                                <span className={taken ? 'line-through text-gray-400' : ''}>{m.name}</span>
                                                <span className="text-muted-foreground">{m.time}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {totalItems === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <CalendarDays className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p>لا توجد أنشطة لهذا اليوم</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Export Dialog */}
            <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
                <DialogContent className="sm:max-w-[350px]">
                    <DialogHeader>
                        <DialogTitle className="text-right">تصدير جدول اليوم</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3">
                        <Button onClick={handleShare} variant="outline" className="h-20 flex-col gap-2">
                            <Share2 className="w-6 h-6" />
                            <span>مشاركة</span>
                        </Button>
                        <Button onClick={handlePrint} variant="outline" className="h-20 flex-col gap-2">
                            <Printer className="w-6 h-6" />
                            <span>طباعة</span>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default DailyCalendar;
