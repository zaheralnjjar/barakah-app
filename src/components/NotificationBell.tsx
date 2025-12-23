import React, { useState, useEffect, useMemo } from 'react';
import { Bell, Calendar, Pill, Moon, DollarSign, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMedications } from '@/hooks/useMedications';
import { useAppointments } from '@/hooks/useAppointments';
import { useRecurringExpenses } from '@/hooks/useRecurringExpenses';
import { useDashboardData } from '@/hooks/useDashboardData';

interface Notification {
    id: string;
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    type: 'prayer' | 'appointment' | 'medication' | 'expense' | 'info';
    icon: React.ReactNode;
}

export const NotificationBell = () => {
    const { medications } = useMedications();
    const { appointments } = useAppointments();
    const { recurringExpenses, getUpcomingReminders } = useRecurringExpenses();
    const { nextPrayer, timeUntilNext, prayerTimes } = useDashboardData();

    const [readIds, setReadIds] = useState<Set<string>>(() => {
        try {
            return new Set(JSON.parse(localStorage.getItem('baraka_read_notifications') || '[]'));
        } catch { return new Set(); }
    });

    // Generate real notifications from data sources
    const notifications = useMemo(() => {
        const notifs: Notification[] = [];
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().split('T')[0];

        // 1. Next Prayer Notification
        if (nextPrayer && timeUntilNext) {
            notifs.push({
                id: `prayer-${nextPrayer}`,
                title: `صلاة ${nextPrayer}`,
                message: `باقي ${timeUntilNext} على الأذان`,
                timestamp: now,
                read: readIds.has(`prayer-${nextPrayer}`),
                type: 'prayer',
                icon: <Moon className="w-4 h-4 text-blue-500" />
            });
        }

        // 2. Today's Appointments
        const todayAppts = appointments.filter(a => a.date === todayStr);
        todayAppts.forEach(apt => {
            notifs.push({
                id: `apt-today-${apt.id}`,
                title: `موعد اليوم: ${apt.title}`,
                message: apt.time ? `الساعة ${apt.time}` : 'طوال اليوم',
                timestamp: now,
                read: readIds.has(`apt-today-${apt.id}`),
                type: 'appointment',
                icon: <Calendar className="w-4 h-4 text-orange-500" />
            });
        });

        // 3. Tomorrow's Appointments
        const tomorrowAppts = appointments.filter(a => a.date === tomorrowStr);
        tomorrowAppts.forEach(apt => {
            notifs.push({
                id: `apt-tomorrow-${apt.id}`,
                title: `موعد غداً: ${apt.title}`,
                message: apt.time ? `الساعة ${apt.time}` : 'طوال اليوم',
                timestamp: now,
                read: readIds.has(`apt-tomorrow-${apt.id}`),
                type: 'appointment',
                icon: <Calendar className="w-4 h-4 text-amber-500" />
            });
        });

        // 4. Today's Medications
        const dayMap = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const todayDayName = dayMap[now.getDay()];

        medications.forEach(med => {
            const isTodayDue = med.frequency === 'daily' ||
                (med.frequency === 'specific_days' && med.customDays?.includes(todayDayName));

            if (isTodayDue) {
                const taken = med.takenHistory?.[todayStr];
                notifs.push({
                    id: `med-${med.id}-${todayStr}`,
                    title: taken ? `✓ ${med.name}` : `💊 ${med.name}`,
                    message: taken ? 'تم تناوله اليوم' : `موعد الجرعة: ${med.time}`,
                    timestamp: now,
                    read: taken || readIds.has(`med-${med.id}-${todayStr}`),
                    type: 'medication',
                    icon: <Pill className={`w-4 h-4 ${taken ? 'text-green-500' : 'text-red-500'}`} />
                });
            }
        });

        // 5. Upcoming Recurring Expenses (from hook)
        try {
            const upcomingExpenses = getUpcomingReminders?.() || [];
            upcomingExpenses.forEach((exp: any) => {
                notifs.push({
                    id: `expense-${exp.id}`,
                    title: `📅 ${exp.name}`,
                    message: `بعد ${exp.daysUntil} ${exp.daysUntil === 1 ? 'يوم' : 'أيام'} - ${exp.amount} ${exp.currency}`,
                    timestamp: now,
                    read: readIds.has(`expense-${exp.id}`),
                    type: 'expense',
                    icon: <DollarSign className="w-4 h-4 text-amber-600" />
                });
            });
        } catch (e) { }

        // Sort: unread first, then by type priority
        return notifs.sort((a, b) => {
            if (a.read !== b.read) return a.read ? 1 : -1;
            return 0;
        });
    }, [medications, appointments, nextPrayer, timeUntilNext, readIds, getUpcomingReminders]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id: string) => {
        const newReadIds = new Set(readIds);
        newReadIds.add(id);
        setReadIds(newReadIds);
        localStorage.setItem('baraka_read_notifications', JSON.stringify([...newReadIds]));
    };

    const markAllAsRead = () => {
        const newReadIds = new Set(notifications.map(n => n.id));
        setReadIds(newReadIds);
        localStorage.setItem('baraka_read_notifications', JSON.stringify([...newReadIds]));
    };

    const clearReadHistory = () => {
        setReadIds(new Set());
        localStorage.removeItem('baraka_read_notifications');
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="relative">
                    <Button variant="ghost" size="icon" className="h-10 w-10 bg-white/10 hover:bg-white/20 text-white rounded-full">
                        <Bell className="w-5 h-5" />
                    </Button>
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[450px] overflow-y-auto z-[200]">
                <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-emerald-50 to-blue-50">
                    <span className="font-bold text-sm arabic-title flex items-center gap-2">
                        <Bell className="w-4 h-4 text-emerald-600" />
                        الإشعارات ({notifications.length})
                    </span>
                    <div className="flex gap-1">
                        {unreadCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-[10px] text-blue-600 h-6">
                                قراءة الكل
                            </Button>
                        )}
                    </div>
                </div>

                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-300" />
                        <p className="text-sm arabic-body">لا توجد إشعارات</p>
                        <p className="text-xs text-gray-400 mt-1">كل شيء في أمان! 🎉</p>
                    </div>
                ) : (
                    <div className="py-1">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => !notification.read && markAsRead(notification.id)}
                                className={`p-3 border-b last:border-b-0 hover:bg-gray-50 flex gap-3 cursor-pointer transition-all ${notification.read ? 'opacity-60 bg-gray-50/50' : 'bg-white'
                                    }`}
                            >
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                    {notification.icon}
                                </div>
                                <div className="flex-1 space-y-0.5 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={`font-bold text-sm arabic-body truncate ${notification.read ? 'text-gray-500' : 'text-gray-800'}`}>
                                            {notification.title}
                                        </p>
                                        {!notification.read && (
                                            <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">{notification.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="p-2 border-t bg-gray-50 text-center">
                    <p className="text-[10px] text-gray-400">
                        آخر تحديث: {new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
