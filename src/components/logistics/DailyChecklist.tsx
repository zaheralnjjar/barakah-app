import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    CheckSquare, Check, Pill, Flame, Calendar, Clock, Bell,
    Share2, Printer, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useHabits } from '@/hooks/useHabits';
import { useMedications } from '@/hooks/useMedications';
import { useAppointments } from '@/hooks/useAppointments';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ChecklistItem {
    id: string;
    title: string;
    time?: string;
    type: 'habit' | 'medication' | 'appointment';
    completed: boolean;
    icon: string;
    sourceId: string;
}

export const DailyChecklist = () => {
    const { habits, toggleHabit } = useHabits();
    const { medications, toggleMedTaken } = useMedications();
    const { appointments } = useAppointments();
    const { toast } = useToast();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showPrintDialog, setShowPrintDialog] = useState(false);
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

    const dateStr = selectedDate.toISOString().split('T')[0];
    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const todayDayName = dayNames[selectedDate.getDay()];

    // Build checklist items
    useEffect(() => {
        const items: ChecklistItem[] = [];

        // Add habits
        habits.forEach(habit => {
            const shouldShow =
                habit.frequency === 'daily' ||
                (habit.frequency === 'weekly' && selectedDate.getDay() === 0) ||
                (habit.frequency === 'monthly' && selectedDate.getDate() === 1) ||
                (habit.frequency === 'specific_days' && habit.customDays?.includes(todayDayName));

            if (shouldShow) {
                const timesPerDay = habit.timesPerDay || 1;
                for (let i = 0; i < timesPerDay; i++) {
                    items.push({
                        id: `habit-${habit.id}-${i}`,
                        title: timesPerDay > 1 ? `${habit.name} (${i + 1}/${timesPerDay})` : habit.name,
                        type: 'habit',
                        completed: !!(habit.history || {})[dateStr],
                        icon: '🔥',
                        sourceId: habit.id
                    });
                }
            }
        });

        // Add medications
        medications.forEach(med => {
            const shouldShow =
                med.frequency === 'daily' ||
                (med.frequency === 'specific_days' && med.customDays?.includes(todayDayName));

            if (shouldShow) {
                items.push({
                    id: `med-${med.id}`,
                    title: med.name,
                    time: med.time,
                    type: 'medication',
                    completed: !!(med.takenHistory || {})[dateStr],
                    icon: '💊',
                    sourceId: med.id
                });
            }
        });

        // Add appointments for selected date
        appointments.forEach(apt => {
            if (apt.date === dateStr) {
                items.push({
                    id: `apt-${apt.id}`,
                    title: apt.title,
                    time: apt.time,
                    type: 'appointment',
                    completed: (apt as any).is_completed || false,
                    icon: '📅',
                    sourceId: apt.id
                });
            }
        });

        // Sort by time
        items.sort((a, b) => {
            if (!a.time) return 1;
            if (!b.time) return -1;
            return a.time.localeCompare(b.time);
        });

        setChecklistItems(items);
    }, [habits, medications, appointments, dateStr, todayDayName]);

    const handleToggle = async (item: ChecklistItem) => {
        if (item.type === 'habit') {
            toggleHabit(item.sourceId);
            toast({ title: item.completed ? 'تم إلغاء الإكمال' : 'تم إنجاز العادة ✓' });
        } else if (item.type === 'medication') {
            toggleMedTaken(item.sourceId, dateStr);
            toast({ title: item.completed ? 'تم إلغاء التناول' : 'تم تناول الدواء ✓' });
        } else if (item.type === 'appointment') {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await supabase.from('appointments').update({ is_completed: !item.completed }).eq('id', item.sourceId);
            toast({ title: item.completed ? 'تم إلغاء الإتمام' : 'تم إنجاز الموعد ✓' });
            // Trigger re-fetch
            window.dispatchEvent(new Event('appointments-updated'));
        }
    };

    // Request notification permission on mount
    useEffect(() => {
        const requestPermission = async () => {
            try {
                // Try Capacitor LocalNotifications
                const { display } = await LocalNotifications.checkPermissions();
                if (display !== 'granted') {
                    await LocalNotifications.requestPermissions();
                }
            } catch (e) {
                // Fallback for web - use browser Notification API
                if ('Notification' in window && Notification.permission === 'default') {
                    await Notification.requestPermission();
                }
            }
        };
        requestPermission();
    }, []);

    // Helper to show browser notification fallback
    const showBrowserNotification = (title: string, body: string) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/icon-192.png' });
        }
    };

    const scheduleNotification = async (item: ChecklistItem) => {
        if (!item.time) {
            toast({ title: '⚠️ هذا العنصر بدون وقت محدد' });
            return;
        }

        try {
            const [hours, minutes] = item.time.split(':').map(Number);
            const notificationTime = new Date(selectedDate);
            notificationTime.setHours(hours, minutes - 5, 0); // 5 minutes before

            if (notificationTime < new Date()) {
                toast({ title: '⚠️ الوقت قد مر' });
                return;
            }

            // Calculate delay
            const delay = notificationTime.getTime() - Date.now();

            try {
                // Try Capacitor first
                await LocalNotifications.schedule({
                    notifications: [{
                        id: Math.floor(Math.random() * 100000),
                        title: `⏰ تذكير: ${item.title}`,
                        body: `حان وقت ${item.title}`,
                        schedule: { at: notificationTime },
                        sound: 'default',
                        channelId: 'barakah_notifications',
                        smallIcon: 'ic_notification',
                        largeIcon: 'ic_notification'
                    }]
                });
            } catch (capacitorError) {
                // Fallback: use setTimeout + browser notification
                setTimeout(() => {
                    showBrowserNotification(`⏰ تذكير: ${item.title}`, `حان وقت ${item.title}`);
                    // Also play a sound
                    try {
                        const audio = new Audio('/notification.mp3');
                        audio.play().catch(() => { });
                    } catch (e) { }
                }, delay);
            }

            toast({ title: '✅ تم جدولة التنبيه', description: `${item.time}` });
        } catch (e) {
            console.error('Notification error:', e);
            toast({ title: '❌ فشل جدولة التنبيه' });
        }
    };

    const scheduleAllNotifications = async () => {
        const itemsWithTime = checklistItems.filter(i => i.time && !i.completed);
        let scheduled = 0;

        for (const item of itemsWithTime) {
            try {
                const [hours, minutes] = item.time!.split(':').map(Number);
                const notificationTime = new Date(selectedDate);
                notificationTime.setHours(hours, minutes - 5, 0);

                if (notificationTime > new Date()) {
                    const delay = notificationTime.getTime() - Date.now();

                    try {
                        await LocalNotifications.schedule({
                            notifications: [{
                                id: Math.floor(Math.random() * 100000),
                                title: `⏰ ${item.icon} ${item.title}`,
                                body: `حان وقت ${item.title}`,
                                schedule: { at: notificationTime },
                                sound: 'default',
                                channelId: 'barakah_notifications'
                            }]
                        });
                    } catch (capacitorError) {
                        // Fallback for web
                        setTimeout(() => {
                            showBrowserNotification(`⏰ ${item.title}`, `حان وقت ${item.title}`);
                            try {
                                const audio = new Audio('/notification.mp3');
                                audio.play().catch(() => { });
                            } catch (e) { }
                        }, delay);
                    }
                    scheduled++;
                }
            } catch (e) {
                console.error('Failed to schedule:', item.title, e);
            }
        }

        if (scheduled > 0) {
            toast({ title: `✅ تم جدولة ${scheduled} تنبيه` });
        } else {
            toast({ title: '⚠️ لا توجد عناصر لجدولتها', description: 'جميع الأوقات قد مرت' });
        }
    };

    const navigateDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };

    const completedCount = checklistItems.filter(i => i.completed).length;
    const progressPercent = checklistItems.length > 0
        ? Math.round((completedCount / checklistItems.length) * 100)
        : 0;

    const generatePrintReport = () => {
        // Group by time slots
        const timeSlots: Record<string, ChecklistItem[]> = {};
        checklistItems.forEach(item => {
            const slot = item.time || 'بدون وقت';
            if (!timeSlots[slot]) timeSlots[slot] = [];
            timeSlots[slot].push(item);
        });

        let html = `
            <html dir="rtl">
            <head>
                <title>قائمة المهام اليومية - بركة</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: Tajawal, Arial; padding: 20px; margin: 0; }
                    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #16a34a; padding-bottom: 10px; }
                    .back-btn { background: #16a34a; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
                    h1 { color: #16a34a; margin: 0; }
                    .date { font-size: 18px; color: #666; }
                    .progress { background: #e5e7eb; border-radius: 10px; height: 20px; margin: 15px 0; overflow: hidden; }
                    .progress-bar { background: linear-gradient(90deg, #16a34a, #22c55e); height: 100%; transition: width 0.3s; }
                    .time-slot { background: #f3f4f6; padding: 10px 15px; font-weight: bold; margin-top: 15px; border-radius: 8px; }
                    .item { display: flex; align-items: center; gap: 10px; padding: 10px 15px; border-bottom: 1px solid #e5e7eb; }
                    .checkbox { width: 20px; height: 20px; border: 2px solid #16a34a; border-radius: 4px; }
                    .completed .checkbox { background: #16a34a; }
                    .completed .title { text-decoration: line-through; color: #9ca3af; }
                    .type { font-size: 12px; color: #6b7280; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
                    th { background: #16a34a; color: white; }
                    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
                    .summary-card { background: #f9fafb; padding: 15px; border-radius: 10px; text-align: center; }
                    .summary-value { font-size: 24px; font-weight: bold; color: #16a34a; }
                    @media print { .no-print { display: none !important; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1>📋 قائمة المهام اليومية</h1>
                        <p class="date">${selectedDate.toLocaleDateString('ar', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <button class="back-btn no-print" onclick="window.close()">← إغلاق</button>
                </div>

                <div class="progress">
                    <div class="progress-bar" style="width: ${progressPercent}%"></div>
                </div>
                <p style="text-align: center; font-weight: bold;">${completedCount} من ${checklistItems.length} مكتمل (${progressPercent}%)</p>

                <div class="summary">
                    <div class="summary-card">
                        <div class="summary-value">${checklistItems.filter(i => i.type === 'habit').length}</div>
                        <div>🔥 العادات</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value">${checklistItems.filter(i => i.type === 'medication').length}</div>
                        <div>💊 الأدوية</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value">${checklistItems.filter(i => i.type === 'appointment').length}</div>
                        <div>📅 المواعيد</div>
                    </div>
                </div>

                <button class="back-btn no-print" onclick="window.close()" style="background: #f3f4f6; color: #374151; margin-bottom: 15px; margin-left: 10px;">← إغلاق</button>
                <button class="back-btn no-print" onclick="window.print()" style="background: #16a34a; margin-bottom: 15px;">🖨️ طباعة</button>

                <table>
                    <tr>
                        <th>الوقت</th>
                        <th>النوع</th>
                        <th>المهمة</th>
                        <th>الحالة</th>
                    </tr>
        `;

        checklistItems.forEach(item => {
            html += `
                <tr class="${item.completed ? 'completed' : ''}">
                    <td>${item.time || '-'}</td>
                    <td>${item.icon} ${item.type === 'habit' ? 'عادة' : item.type === 'medication' ? 'دواء' : 'موعد'}</td>
                    <td>${item.title}</td>
                    <td>${item.completed ? '✅ مكتمل' : '⏳ معلق'}</td>
                </tr>
            `;
        });

        html += `
                </table>
                <p style="text-align: center; margin-top: 30px; color: #9ca3af;">✨ نظام بركة لإدارة الحياة</p>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
        }
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-primary" />
                        قائمة المهام اليومية
                    </span>
                    <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => navigateDate(-1)}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                            اليوم
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigateDate(1)}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                    </div>
                </CardTitle>
                <div className="text-center text-sm text-muted-foreground">
                    {selectedDate.toLocaleDateString('ar', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
            </CardHeader>
            <CardContent>
                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold">{completedCount}/{checklistItems.length}</span>
                        <span className="text-muted-foreground">{progressPercent}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-4">
                    <Button variant="outline" size="sm" className="flex-1" onClick={scheduleAllNotifications}>
                        <Bell className="w-4 h-4 ml-1" /> تنبيه الكل
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={generatePrintReport}>
                        <Printer className="w-4 h-4 ml-1" /> طباعة
                    </Button>
                </div>

                {/* Checklist Items */}
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {checklistItems.map(item => (
                        <div
                            key={item.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${item.completed
                                ? 'bg-green-50 border-green-200'
                                : 'bg-white hover:bg-gray-50'
                                }`}
                        >
                            <button
                                onClick={() => handleToggle(item)}
                                className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${item.completed
                                    ? 'bg-green-500 border-green-600 text-white'
                                    : 'border-gray-300 hover:border-green-400'
                                    }`}
                            >
                                {item.completed && <Check className="w-4 h-4" />}
                            </button>

                            <div className="flex-1">
                                <div className={`font-bold ${item.completed ? 'line-through text-gray-400' : ''}`}>
                                    {item.icon} {item.title}
                                </div>
                                <div className="flex gap-2 text-xs text-muted-foreground">
                                    {item.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.time}</span>}
                                    <span className={`px-1.5 py-0.5 rounded ${item.type === 'habit' ? 'bg-orange-100 text-orange-600' :
                                        item.type === 'medication' ? 'bg-purple-100 text-purple-600' :
                                            'bg-blue-100 text-blue-600'
                                        }`}>
                                        {item.type === 'habit' ? 'عادة' : item.type === 'medication' ? 'دواء' : 'موعد'}
                                    </span>
                                </div>
                            </div>

                            {item.time && !item.completed && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => scheduleNotification(item)}
                                >
                                    <Bell className="w-4 h-4 text-gray-400 hover:text-blue-500" />
                                </Button>
                            )}
                        </div>
                    ))}

                    {checklistItems.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <CheckSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>لا توجد مهام لهذا اليوم</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default DailyChecklist;
