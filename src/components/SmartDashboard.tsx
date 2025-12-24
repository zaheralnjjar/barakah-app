import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from "@/components/ui/use-toast";
import { useDashboardData } from '@/hooks/useDashboardData';
import { useHabits } from '@/hooks/useHabits';
import { useMedications } from '@/hooks/useMedications';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { supabase } from '@/integrations/supabase/client';
import {
    LogOut, MapPin, DollarSign, CalendarPlus, ShoppingCart, Sun, Moon, Sunset, Star,
    Clock, Printer, Plus, FileText, CheckSquare, Pill, Flame, Bell, Search,
    Navigation, Save, Share2, ChevronLeft, ChevronRight, Target, Sparkles
} from 'lucide-react';
import InteractiveMap from '@/components/InteractiveMap';
import AppointmentManager from '@/components/AppointmentManager';
import PrayerTimesRow from '@/components/PrayerTimesRow';
import { NotificationBell } from '@/components/NotificationBell';

interface SmartDashboardProps {
    onNavigateToTab: (tabId: string) => void;
}

const SmartDashboard: React.FC<SmartDashboardProps> = ({ onNavigateToTab }) => {
    const { toast } = useToast();
    const {
        financeData, loading, recentAppointments, shoppingListSummary,
        savedLocations, stats, nextPrayer, prayerTimes = [], refetch, timeUntilNext
    } = useDashboardData();

    const { habits } = useHabits();
    const { medications, toggleMedTaken } = useMedications();
    const { tasks, addTask, updateTask, refreshTasks } = useTasks();
    const { appointments, refreshAppointments } = useAppointments();

    const [currentDate] = useState(new Date());
    const [showPrintDialog, setShowPrintDialog] = useState(false);
    const [printRange, setPrintRange] = useState('today');
    const [printStartDate, setPrintStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [printEndDate, setPrintEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [printOptions, setPrintOptions] = useState({
        tasks: true, appointments: true, medications: true, habits: true,
        financial: false, shopping: false, prayers: false
    });
    const [printCalendarType, setPrintCalendarType] = useState<'weekly' | 'monthly'>('weekly');
    const [printCalendarStyle, setPrintCalendarStyle] = useState<'normal' | 'hourly'>('normal');
    const [showAddDialog, setShowAddDialog] = useState<'appointment' | 'task' | 'location' | 'shopping' | 'note' | 'expense' | 'goal' | null>(null);
    const [showFinancialReport, setShowFinancialReport] = useState(false);
    const [showEventMenu, setShowEventMenu] = useState(false);
    const [showLocationMenu, setShowLocationMenu] = useState(false);
    const [weekStartDate, setWeekStartDate] = useState(() => {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(today.setDate(diff));
    });

    // Sync data to Android Widget
    useEffect(() => {
        const syncToWidget = async () => {
            try {
                const { syncWidgetData } = await import('@/utils/widgetSync');
                await syncWidgetData({
                    tasks, appointments, habits, medications, prayers: prayerTimes,
                    finance: { balance: financeData?.total_balance?.toString() || '0', debt: financeData?.total_debt?.toString() || '0' },
                    shopping: shoppingListSummary
                });
            } catch (e) { console.error("Widget sync error", e); }
        };
        if (!loading) syncToWidget();
    }, [tasks, appointments, habits, medications, prayerTimes, financeData, shoppingListSummary, loading]);

    // Pull-to-refresh state
    const [isRefreshing, setIsRefreshing] = useState(false);
    const handlePullRefresh = async () => {
        setIsRefreshing(true);
        if (refetch) await refetch();
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    // Auto-sync every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => {
            if (refetch) refetch();
        }, 5 * 60 * 1000); // 5 minutes
        return () => clearInterval(interval);
    }, [refetch]);

    // Save expense function
    const saveExpense = async (amount: number, description: string, category: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            // Get current finance data
            const { data: currentData } = await supabase
                .from('finance_data_2025_12_18_18_42')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (!currentData) return false;

            const updatedBalanceARS = (currentData.current_balance_ars || 0) - amount;
            const updatedPendingExpenses = [...(currentData.pending_expenses || []), {
                id: Date.now(),
                amount,
                currency: 'ARS',
                type: 'expense',
                category,
                description: description || 'مصروف سريع',
                timestamp: new Date().toISOString(),
                source: 'dashboard_quick_add'
            }];

            const { error } = await supabase
                .from('finance_data_2025_12_18_18_42')
                .update({
                    current_balance_ars: updatedBalanceARS,
                    pending_expenses: updatedPendingExpenses,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id);

            if (error) throw error;
            if (refetch) refetch();
            return true;
        } catch (e) {
            console.error('Error saving expense:', e);
            return false;
        }
    };

    // Save shopping item function
    const saveShoppingItem = async (itemName: string, quantity: number, category: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            // Get current logistics data
            const { data: logistics } = await supabase
                .from('logistics_data_2025_12_18_18_42')
                .select('shopping_list')
                .eq('user_id', user.id)
                .single();

            const currentList = logistics?.shopping_list || [];
            const updatedList = [...currentList, {
                id: Date.now(),
                name: itemName,
                quantity,
                category,
                completed: false,
                createdAt: new Date().toISOString(),
                source: 'dashboard_quick_add'
            }];

            const { error } = await supabase
                .from('logistics_data_2025_12_18_18_42')
                .update({ shopping_list: updatedList })
                .eq('user_id', user.id);

            if (error) throw error;
            if (refetch) refetch();
            return true;
        } catch (e) {
            console.error('Error saving shopping item:', e);
            return false;
        }
    };

    // Save note function
    const saveNote = async (title: string, content: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            // Get current productivity data
            const { data: prod } = await supabase
                .from('productivity_data_2025_12_18_18_42')
                .select('notes')
                .eq('user_id', user.id)
                .single();

            const currentNotes = prod?.notes || [];
            const updatedNotes = [...currentNotes, {
                id: Date.now(),
                title: title || 'ملاحظة بدون عنوان',
                content,
                createdAt: new Date().toISOString(),
                source: 'dashboard_quick_add'
            }];

            const { error } = await supabase
                .from('productivity_data_2025_12_18_18_42')
                .update({ notes: updatedNotes })
                .eq('user_id', user.id);

            if (error) throw error;
            if (refetch) refetch();
            return true;
        } catch (e) {
            console.error('Error saving note:', e);
            return false;
        }
    };

    // --- Helper Functions ---
    const handleLogout = async () => { await supabase.auth.signOut(); };

    // Professional Financial Report Print
    const printFinancialReport = () => {
        const reportDate = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

        // Clean and modern HTML template for printing
        let html = `
    <html dir="rtl">
            <head>
                <title>التقرير المالي - ${reportDate}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: 'Tajawal', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; margin: 0; background-color: #fff; color: #1f2937; }
                    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #10b981; padding-bottom: 20px; }
                    .header h1 { margin: 0; color: #111827; font-size: 28px; }
                    .header h2 { margin: 10px 0 0; color: #10b981; font-size: 18px; font-weight: normal; }
                    .header .date { margin-top: 5px; color: #6b7280; font-size: 14px; }
                    
                    .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 40px; }
                    .summary-card { padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; background: #f9fafb; text-align: center; }
                    .summary-card.balance { background: #ecfdf5; border-color: #d1fae5; }
                    .summary-card.expense { background: #fff1f2; border-color: #ffe4e6; }
                    
                    .label { font-size: 14px; color: #4b5563; margin-bottom: 5px; }
                    .value { font-size: 24px; font-weight: bold; color: #111827; direction: ltr; display: inline-block; }
                    .currency { font-size: 12px; color: #6b7280; margin-top: 2px; }

                    h3 { font-size: 18px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin-top: 0; }

                    .transactions-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
                    .transactions-table th { text-align: right; padding: 10px; background: #f3f4f6; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb; }
                    .transactions-table td { padding: 10px; border-bottom: 1px solid #f3f4f6; color: #4b5563; }
                    .transactions-table tr:last-child td { border-bottom: none; }
                    
                    .amount { font-weight: 600; direction: ltr; text-align: left; }
                    .amount.income { color: #059669; }
                    .amount.expense { color: #dc2626; }
                    
                    .footer { margin-top: 50px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
                    
                    @media print {
                        body { padding: 20px; }
                        .no-print { display: none; }
                        .summary-card { break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🌟 نظام بركة لإدارة الحياة</h1>
                    <h2>التقرير المالي</h2>
                    <div class="date">${reportDate}</div>
                </div>

                <div class="summary-grid">
                    <div class="summary-card balance">
                        <div class="label">الرصيد الحالي</div>
                        <div class="value">${totalBalanceARS.toLocaleString()}</div>
                        <div class="currency">ARS</div>
                    </div>
                    <div class="summary-card">
                        <div class="label">إجمالي الديون</div>
                        <div class="value">${(financeData?.total_debt || 0).toLocaleString()}</div>
                        <div class="currency">ARS</div>
                    </div>
                    <div class="summary-card">
                        <div class="label">الحد اليومي المتاح</div>
                        <div class="value">${dailyLimitARS.toLocaleString()}</div>
                        <div class="currency">ARS</div>
                    </div>
                    <div class="summary-card expense">
                        <div class="label">مصروف اليوم</div>
                        <div class="value">${todayExpense.toLocaleString()}</div>
                        <div class="currency">ARS</div>
                    </div>
                </div>

                <div class="transactions">
                    <h3>📊 آخر المعاملات</h3>
                    <table class="transactions-table">
                        <thead>
                            <tr>
                                <th>الوصف</th>
                                <th style="text-align: left;">المبلغ</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${financeData?.pending_expenses && financeData.pending_expenses.length > 0
                ? financeData.pending_expenses.slice(0, 15).map((t: any) => `
                                <tr>
                                    <td>${t.description || 'معاملة'}</td>
                                    <td class="amount ${t.type === 'expense' ? 'expense' : 'income'}">
                                        ${t.type === 'expense' ? '-' : '+'}${t.amount.toLocaleString()} ${t.currency}
                                    </td>
                                </tr>
                            `).join('')
                : '<tr><td colspan="2" style="text-align: center; padding: 20px; color: #9ca3af;">لا توجد معاملات مسجلة</td></tr>'
            }
                        </tbody>
                    </table>
                </div>

                <div class="footer">
                    <p>تم استخراج التقرير في: ${new Date().toLocaleString('ar-EG')}</p>
                    <p>✨ نظام بركة لإدارة الحياة</p>
                </div>
            </body>
            </html>
        `;

        // Create iframe for printing
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '1px';
        iframe.style.height = '1px';
        iframe.style.opacity = '0.01';
        iframe.style.pointerEvents = 'none';
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
                }, 1000);
            }, 500);
        }

        setShowFinancialReport(false);
        toast({ title: '📄 جاري الطباعة...', description: 'تم تحضير التقرير المالي للطباعة' });
    };

    const hijriDate = currentDate.toLocaleDateString('ar-SA-u-ca-islamic', { year: 'numeric', month: 'long', day: 'numeric' });
    const gregorianDate = currentDate.toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const dayName = currentDate.toLocaleDateString('ar', { weekday: 'long' });

    const exchangeRate = financeData?.exchange_rate || 1200;
    const totalBalanceARS = financeData ? (financeData.current_balance_ars + (financeData.current_balance_usd * exchangeRate)) : 0;
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - currentDate.getDate();
    const availableBalance = totalBalanceARS - (financeData?.emergency_buffer || 0) - (financeData?.total_debt || 0);
    const dailyLimitARS = Math.max(0, availableBalance / (remainingDays + 3));

    const todayExpense = financeData?.pending_expenses ? (() => {
        const today = new Date().toISOString().split('T')[0];
        return financeData.pending_expenses
            .filter((t: any) => t.type === 'expense' && t.timestamp.startsWith(today))
            .reduce((acc: number, curr: any) => acc + (curr.currency === 'USD' ? curr.amount * exchangeRate : curr.amount), 0);
    })() : 0;

    // Today's data
    // Today's data
    const FILTER_DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const todayStr = new Date().toISOString().split('T')[0];
    const todayName = FILTER_DAY_NAMES[new Date().getDay()];

    const todayTasks = tasks.filter(t => t.deadline === todayStr);
    const todayAppointments = appointments.filter(a => a.date === todayStr);

    // Fix: Filter medications and habits based on frequency and custom days
    const todayMedications = medications.filter(m =>
        m.frequency === 'daily' ||
        (m.frequency === 'specific_days' && m.customDays?.includes(todayName))
    );
    const todayHabits = habits.filter(h =>
        h.frequency === 'daily' ||
        (h.frequency === 'specific_days' && h.customDays?.includes(todayName))
    );

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
    const DAYS_AR = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];

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

                        const handleToggle = async () => {
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
                                key={i}
                                className={`flex items-center gap-2 text-xs px-2 py-2 rounded-lg ${item.type === 'med' ? 'bg-red-100 text-red-700' :
                                    item.type === 'apt' ? 'bg-orange-100 text-orange-700' :
                                        'bg-blue-100 text-blue-700'} ${isCompleted ? 'opacity-50 bg-gray-100' : ''}`}
                            >
                                <button
                                    type="button"
                                    onClick={handleToggle}
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

    if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

    return (
        <div
            className="space-y-4 p-2 md:p-4 max-w-6xl mx-auto"
            onTouchStart={(e) => {
                const startY = e.touches[0].clientY;
                const handleTouchEnd = (endEvent: TouchEvent) => {
                    const endY = endEvent.changedTouches[0].clientY;
                    if (startY < 50 && endY - startY > 100) {
                        handlePullRefresh();
                    }
                    document.removeEventListener('touchend', handleTouchEnd);
                };
                document.addEventListener('touchend', handleTouchEnd as EventListener);
            }}
        >
            {/* Pull-to-refresh indicator */}
            {isRefreshing && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-emerald-500 text-white text-center py-2 text-sm animate-pulse">
                    🔄 جاري التحديث...
                </div>
            )}

            {/* ===== 1. HEADER ===== */}
            <div className="bg-gradient-to-l from-emerald-50 to-white rounded-2xl p-4 shadow-sm border border-emerald-100">
                <div className="flex items-center justify-between gap-3">
                    {/* Date Info - Right Side */}
                    <div className="bg-emerald-100 text-emerald-700 rounded-xl px-4 py-2 text-center min-w-[120px]">
                        <span className="text-sm font-bold block">{currentDate.getDate()} {currentDate.toLocaleDateString('ar', { month: 'long' })}</span>
                        <div className="border-t border-emerald-300 my-1"></div>
                        <span className="text-xs block">{hijriDate}</span>
                    </div>

                    {/* Logo - Centered & Larger */}
                    <div className="flex-1 text-center">
                        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">البركة</h1>
                        <span className="text-xs text-gray-400">Barakah Life</span>
                    </div>

                    {/* Notification Bell - Left Side */}
                    <div className="flex items-center">
                        <NotificationBell />
                    </div>
                </div>
            </div>

            {/* ===== 2. FINANCIAL SUMMARY ===== */}
            <Card className="border-emerald-100 shadow-sm cursor-pointer hover:shadow-md transition-all overflow-hidden" onClick={() => onNavigateToTab('finance')}>
                <CardContent className="p-0">
                    {/* Header Row - Compact */}
                    <div className="grid grid-cols-3 bg-gradient-to-l from-emerald-500 to-teal-500 text-center">
                        <div className="py-1.5 px-1 border-l border-white/20">
                            <span className="text-xs font-bold text-white">مصروف اليوم</span>
                        </div>
                        <div className="py-1.5 px-1 border-l border-white/20">
                            <span className="text-xs font-bold text-white">الحد اليومي</span>
                        </div>
                        <div className="py-1.5 px-1">
                            <span className="text-xs font-bold text-white">الرصيد</span>
                        </div>
                    </div>
                    {/* Values Row - Local Currency - Compact */}
                    <div className="grid grid-cols-3 bg-emerald-50 text-center">
                        <div className="py-2 px-1 border-l border-emerald-100">
                            <span className="text-lg font-bold text-gray-900 tabular-nums">{todayExpense.toLocaleString()}</span>
                        </div>
                        <div className="py-2 px-1 border-l border-emerald-100">
                            <span className="text-lg font-bold text-gray-900 tabular-nums">{dailyLimitARS.toLocaleString()}</span>
                        </div>
                        <div className="py-2 px-1">
                            <span className="text-lg font-bold text-emerald-700 tabular-nums">{totalBalanceARS.toLocaleString()}</span>
                        </div>
                    </div>
                    {/* Values Row - USD - Compact */}
                    <div className="grid grid-cols-3 bg-gray-50 text-center border-t border-emerald-100">
                        <div className="py-1 px-1 border-l border-emerald-100">
                            <span className="text-sm font-medium text-gray-500" dir="ltr">${exchangeRate ? Math.round(todayExpense / exchangeRate).toLocaleString() : '--'}</span>
                        </div>
                        <div className="py-1 px-1 border-l border-emerald-100">
                            <span className="text-sm font-medium text-gray-500" dir="ltr">${exchangeRate ? Math.round(dailyLimitARS / exchangeRate).toLocaleString() : '--'}</span>
                        </div>
                        <div className="py-1 px-1">
                            <span className="text-sm font-medium text-emerald-600" dir="ltr">${exchangeRate ? Math.round(totalBalanceARS / exchangeRate).toLocaleString() : '--'}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ===== 3. QUICK ACTIONS ===== */}
            <div className="grid grid-cols-5 gap-2">
                {[
                    { icon: FileText, label: 'ملاحظة', color: 'bg-yellow-100 text-yellow-600', action: () => setShowAddDialog('note') },
                    { icon: ShoppingCart, label: 'للتسوق', color: 'bg-pink-100 text-pink-600', action: () => setShowAddDialog('shopping') },
                    { icon: MapPin, label: 'موقع', color: 'bg-green-100 text-green-600', action: () => setShowLocationMenu(true) },
                    { icon: DollarSign, label: 'مصروف', color: 'bg-red-100 text-red-600', action: () => setShowAddDialog('expense') },
                    { icon: Sparkles, label: 'حدث', color: 'bg-purple-100 text-purple-600', action: () => setShowEventMenu(true) },
                ].map((item, idx) => (
                    <button
                        key={idx}
                        onClick={item.action}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl ${item.color} hover:scale-105 transition-transform`}
                    >
                        <item.icon className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Event Type Selection Menu */}
            <Dialog open={showEventMenu} onOpenChange={setShowEventMenu}>
                <DialogContent className="sm:max-w-[350px]">
                    <DialogHeader>
                        <DialogTitle className="text-center">اختر نوع الحدث</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-3 gap-3 py-4">
                        <button
                            onClick={() => { setShowEventMenu(false); setShowAddDialog('appointment'); }}
                            className="flex flex-col items-center p-4 rounded-xl bg-orange-100 text-orange-600 hover:scale-105 transition-transform"
                        >
                            <CalendarPlus className="w-8 h-8 mb-2" />
                            <span className="text-sm font-medium">موعد</span>
                        </button>
                        <button
                            onClick={() => { setShowEventMenu(false); setShowAddDialog('task'); }}
                            className="flex flex-col items-center p-4 rounded-xl bg-blue-100 text-blue-600 hover:scale-105 transition-transform"
                        >
                            <CheckSquare className="w-8 h-8 mb-2" />
                            <span className="text-sm font-medium">مهمة</span>
                        </button>
                        <button
                            onClick={() => { setShowEventMenu(false); setShowAddDialog('goal'); }}
                            className="flex flex-col items-center p-4 rounded-xl bg-emerald-100 text-emerald-600 hover:scale-105 transition-transform"
                        >
                            <Target className="w-8 h-8 mb-2" />
                            <span className="text-sm font-medium">هدف</span>
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Location Type Selection Menu */}
            <Dialog open={showLocationMenu} onOpenChange={setShowLocationMenu}>
                <DialogContent className="sm:max-w-[350px]">
                    <DialogHeader>
                        <DialogTitle className="text-center flex items-center justify-center gap-2">
                            <MapPin className="w-5 h-5 text-green-500" />
                            الموقع
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3 py-4">
                        <button
                            onClick={() => { setShowLocationMenu(false); setShowAddDialog('location'); }}
                            className="flex flex-col items-center p-4 rounded-xl bg-green-100 text-green-600 hover:scale-105 transition-transform"
                        >
                            <Navigation className="w-8 h-8 mb-2" />
                            <span className="text-sm font-medium">خريطة</span>
                            <span className="text-[10px] text-gray-500">تحديد وبحث وحفظ</span>
                        </button>
                        <button
                            onClick={() => { setShowLocationMenu(false); onNavigateToTab('map'); }}
                            className="flex flex-col items-center p-4 rounded-xl bg-blue-100 text-blue-600 hover:scale-105 transition-transform"
                        >
                            <MapPin className="w-8 h-8 mb-2" />
                            <span className="text-sm font-medium">المواقع</span>
                            <span className="text-[10px] text-gray-500">المواقع المحفوظة</span>
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ===== PRAYER TIMES (TODAY) ===== */}
            <Card className="border-teal-100 shadow-sm bg-gradient-to-br from-teal-50/50 to-white">
                <CardContent className="p-4">
                    <PrayerTimesRow showTimeUntilNext={true} />
                </CardContent>
            </Card>

            {/* ===== 4. DAILY REPORT ===== */}
            <Card className="border-blue-100 shadow-sm">
                <CardContent className="p-4">
                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        التقرير اليومي
                    </h3>
                    <div className="overflow-y-auto max-h-[280px]">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-white z-10">
                                <tr className="text-xs text-gray-500 border-b">
                                    <th className="py-2 px-1 w-8">✓</th>
                                    <th className="text-right py-2 px-2">النوع</th>
                                    <th className="text-right py-2 px-2">التفاصيل</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {/* Medications */}
                                {todayMedications.map((med, i) => (
                                    <tr key={`med-${i}`} className="hover:bg-gray-50">
                                        <td className="py-2 px-1 text-center">
                                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-green-600 cursor-pointer" />
                                        </td>
                                        <td className="py-2 px-2"><Badge variant="outline" className="bg-red-50 text-red-600 text-[10px]"><Pill className="w-3 h-3 ml-1" />أدوية</Badge></td>
                                        <td className="py-2 px-2 font-medium">{med.name} - {med.time}</td>
                                    </tr>
                                ))}
                                {/* Appointments */}
                                {todayAppointments.map((apt, i) => (
                                    <tr key={`apt-${i}`} className="hover:bg-gray-50">
                                        <td className="py-2 px-1 text-center">
                                            <input
                                                type="checkbox"
                                                checked={(apt as any).is_completed || false}
                                                onChange={async () => {
                                                    const { data: { user } } = await supabase.auth.getUser();
                                                    if (!user) return;
                                                    await supabase.from('appointments').update({ is_completed: !(apt as any).is_completed }).eq('id', apt.id);
                                                    if (refetch) refetch();
                                                }}
                                                className="w-4 h-4 rounded border-gray-300 text-green-600 cursor-pointer"
                                            />
                                        </td>
                                        <td className="py-2 px-2"><Badge variant="outline" className="bg-orange-50 text-orange-600 text-[10px]"><CalendarPlus className="w-3 h-3 ml-1" />موعد</Badge></td>
                                        <td className="py-2 px-2 font-medium">{apt.title} - {apt.time || '--'}</td>
                                    </tr>
                                ))}
                                {/* Tasks */}
                                {todayTasks.map((task, i) => (
                                    <tr key={`task-${i}`} className={`hover:bg-gray-50 ${(task as any).isCompleted ? 'opacity-50 line-through' : ''}`}>
                                        <td className="py-2 px-1 text-center">
                                            <input
                                                type="checkbox"
                                                checked={(task as any).isCompleted || false}
                                                onChange={() => {
                                                    toast({ title: 'انتقل لقسم الإنتاجية لتحديث حالة المهمة' });
                                                }}
                                                className="w-4 h-4 rounded border-gray-300 text-green-600 cursor-pointer"
                                            />
                                        </td>
                                        <td className="py-2 px-2"><Badge variant="outline" className="bg-blue-50 text-blue-600 text-[10px]"><CheckSquare className="w-3 h-3 ml-1" />مهمة</Badge></td>
                                        <td className="py-2 px-2 font-medium">{task.title}</td>
                                    </tr>
                                ))}
                                {/* Habits */}
                                {todayHabits.map((habit, i) => (
                                    <tr key={`habit-${i}`} className="hover:bg-gray-50">
                                        <td className="py-2 px-1 text-center">
                                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-green-600 cursor-pointer" />
                                        </td>
                                        <td className="py-2 px-2"><Badge variant="outline" className="bg-yellow-50 text-yellow-600 text-[10px]"><Flame className="w-3 h-3 ml-1" />عادة</Badge></td>
                                        <td className="py-2 px-2 font-medium">{habit.name} - 🔥 {habit.streak || 0}</td>
                                    </tr>
                                ))}                                {(todayMedications.length + todayAppointments.length + todayTasks.length + todayHabits.length) === 0 && (
                                    <tr><td colSpan={3} className="text-center py-4 text-gray-400">لا توجد عناصر لليوم</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* ===== 5. WEEKLY CALENDAR ===== */}
            <Card className="border-purple-100 shadow-sm">
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



            {/* ===== UNIFIED PRINT DIALOG ===== */}
            < Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog} >
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-right flex items-center gap-2">
                            <Printer className="w-5 h-5 text-primary" />
                            طباعة التقويم الموحد
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Calendar Type Selection */}
                        <div>
                            <p className="text-sm text-gray-600 mb-2">نوع التقويم:</p>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant={printCalendarType === 'weekly' ? 'default' : 'outline'}
                                    onClick={() => setPrintCalendarType('weekly')}
                                    className="h-10"
                                >
                                    📅 أسبوعي
                                </Button>
                                <Button
                                    variant={printCalendarType === 'monthly' ? 'default' : 'outline'}
                                    onClick={() => setPrintCalendarType('monthly')}
                                    className="h-10"
                                >
                                    📆 شهري
                                </Button>
                            </div>
                        </div>

                        {/* Calendar Style Selection */}
                        <div>
                            <p className="text-sm text-gray-600 mb-2">نمط التقويم:</p>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant={printCalendarStyle === 'normal' ? 'default' : 'outline'}
                                    onClick={() => setPrintCalendarStyle('normal')}
                                    className="h-10"
                                >
                                    📋 تقويم عادي
                                </Button>
                                <Button
                                    variant={printCalendarStyle === 'hourly' ? 'default' : 'outline'}
                                    onClick={() => setPrintCalendarStyle('hourly')}
                                    className="h-10"
                                >
                                    ⏰ تقويم بالساعات
                                </Button>
                            </div>
                        </div>

                        {/* Range Selection */}
                        <div>
                            <p className="text-sm text-gray-600 mb-2">اختر الفترة:</p>
                            <div className="grid grid-cols-4 gap-2">
                                <Button variant={printRange === 'today' ? 'default' : 'outline'} onClick={() => setPrintRange('today')} className="h-9 text-sm">اليوم</Button>
                                <Button variant={printRange === 'week' ? 'default' : 'outline'} onClick={() => setPrintRange('week')} className="h-9 text-sm">الأسبوع</Button>
                                <Button variant={printRange === 'month' ? 'default' : 'outline'} onClick={() => setPrintRange('month')} className="h-9 text-sm">الشهر</Button>
                                <Button variant={printRange === 'custom' ? 'default' : 'outline'} onClick={() => setPrintRange('custom')} className="h-9 text-sm">مخصص</Button>
                            </div>
                        </div>

                        {/* Custom Date Range */}
                        {printRange === 'custom' && (
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-gray-500">من</label>
                                    <Input type="date" value={printStartDate} onChange={e => setPrintStartDate(e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">إلى</label>
                                    <Input type="date" value={printEndDate} onChange={e => setPrintEndDate(e.target.value)} />
                                </div>
                            </div>
                        )}

                        {/* Content Selection */}
                        <div>
                            <p className="text-sm text-gray-600 mb-2">المحتوى المراد تضمينه:</p>
                            <div className="grid grid-cols-2 gap-2">
                                <label className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                                    <input type="checkbox" checked={printOptions.tasks} onChange={e => setPrintOptions(p => ({ ...p, tasks: e.target.checked }))} className="rounded" />
                                    <CheckSquare className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm">المهام</span>
                                </label>
                                <label className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                                    <input type="checkbox" checked={printOptions.appointments} onChange={e => setPrintOptions(p => ({ ...p, appointments: e.target.checked }))} className="rounded" />
                                    <CalendarPlus className="w-4 h-4 text-orange-500" />
                                    <span className="text-sm">المواعيد</span>
                                </label>
                                <label className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                                    <input type="checkbox" checked={printOptions.medications} onChange={e => setPrintOptions(p => ({ ...p, medications: e.target.checked }))} className="rounded" />
                                    <Pill className="w-4 h-4 text-red-500" />
                                    <span className="text-sm">الأدوية</span>
                                </label>
                                <label className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                                    <input type="checkbox" checked={printOptions.habits} onChange={e => setPrintOptions(p => ({ ...p, habits: e.target.checked }))} className="rounded" />
                                    <Flame className="w-4 h-4 text-yellow-500" />
                                    <span className="text-sm">العادات</span>
                                </label>
                                <label className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg cursor-pointer hover:bg-emerald-100">
                                    <input type="checkbox" checked={printOptions.financial} onChange={e => setPrintOptions(p => ({ ...p, financial: e.target.checked }))} className="rounded" />
                                    <DollarSign className="w-4 h-4 text-emerald-600" />
                                    <span className="text-sm">الموجز المالي</span>
                                </label>
                                <label className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100">
                                    <input type="checkbox" checked={printOptions.shopping} onChange={e => setPrintOptions(p => ({ ...p, shopping: e.target.checked }))} className="rounded" />
                                    <ShoppingCart className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm">قائمة التسوق</span>
                                </label>
                                <label className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 col-span-2">
                                    <input type="checkbox" checked={printOptions.prayers} onChange={e => setPrintOptions(p => ({ ...p, prayers: e.target.checked }))} className="rounded" />
                                    <Moon className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm">أوقات الصلاة</span>
                                </label>
                            </div>
                        </div>

                        <Button onClick={() => { onNavigateToTab('calendar'); setShowPrintDialog(false); }} className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-700">
                            <Printer className="w-5 h-5 ml-2" />
                            طباعة الآن
                        </Button>
                    </div>
                </DialogContent>
            </Dialog >

            {/* ===== QUICK ADD DIALOG ===== */}
            <Dialog open={showAddDialog !== null} onOpenChange={(open) => {
                if (!open) {
                    if (showAddDialog === 'appointment') refreshAppointments();
                    if (showAddDialog === 'task') refreshTasks(); // In case task is added via this dialog

                    setShowAddDialog(null);
                }
            }}>
                <DialogContent className={showAddDialog === 'appointment' || showAddDialog === 'location' ? 'sm:max-w-[800px] max-h-[95vh] overflow-y-auto' : 'sm:max-w-[450px]'}>
                    <DialogHeader>
                        <DialogTitle className="text-right flex items-center gap-2">
                            {showAddDialog === 'appointment' && <><CalendarPlus className="w-5 h-5 text-orange-500" /> إضافة موعد</>}
                            {showAddDialog === 'task' && <><CheckSquare className="w-5 h-5 text-blue-500" /> إضافة مهمة</>}
                            {showAddDialog === 'location' && <><MapPin className="w-5 h-5 text-green-500" /> حفظ موقع</>}
                            {showAddDialog === 'shopping' && <><ShoppingCart className="w-5 h-5 text-pink-500" /> إضافة للتسوق</>}
                            {showAddDialog === 'note' && <><FileText className="w-5 h-5 text-yellow-500" /> ملاحظة سريعة</>}
                            {showAddDialog === 'expense' && <><DollarSign className="w-5 h-5 text-red-500" /> إضافة مصروف</>}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Full Appointment Manager */}
                    {showAddDialog === 'appointment' && (
                        <div className="mt-2">
                            <AppointmentManager />
                        </div>
                    )}

                    {/* Full Location with Map */}
                    {showAddDialog === 'location' && (
                        <div className="mt-2 space-y-4">
                            <div className="h-[500px] rounded-lg overflow-hidden border-2 border-green-200">
                                <InteractiveMap />
                            </div>
                            <p className="text-sm text-center text-gray-500 bg-green-50 p-2 rounded-lg">
                                💡 اضغط على الخريطة لحفظ الموقع أو استخدم البحث
                            </p>
                        </div>
                    )}

                    {/* Expense Dialog */}
                    {showAddDialog === 'expense' && (
                        <div className="space-y-4 mt-2">
                            <Input placeholder="المبلغ" type="number" className="text-right" id="expense-amount" />
                            <Input placeholder="الوصف" className="text-right" id="expense-desc" />
                            <div className="grid grid-cols-3 gap-2">
                                {['طعام', 'مواصلات', 'فواتير', 'تسوق', 'صحة', 'أخرى'].map(cat => (
                                    <Button key={cat} variant="outline" size="sm" className="text-xs">
                                        {cat}
                                    </Button>
                                ))}
                            </div>
                            <Button className="w-full" onClick={async () => {
                                const amount = parseFloat((document.getElementById('expense-amount') as HTMLInputElement)?.value || '0');
                                const desc = (document.getElementById('expense-desc') as HTMLInputElement)?.value || '';
                                if (!amount || amount <= 0) { toast({ title: 'أدخل المبلغ' }); return; }
                                const success = await saveExpense(amount, desc, 'أخرى');
                                if (success) {
                                    toast({ title: 'تم حفظ المصروف', description: `${amount} ARS` });
                                } else {
                                    toast({ title: 'فشل حفظ المصروف', variant: 'destructive' });
                                }
                                setShowAddDialog(null);
                            }}>
                                <Plus className="w-4 h-4 ml-2" /> حفظ المصروف
                            </Button>
                        </div>
                    )}

                    {/* Task Dialog */}
                    {showAddDialog === 'task' && (
                        <div className="space-y-4 mt-2">
                            <Input placeholder="عنوان المهمة" className="text-right" id="task-title" />
                            <textarea
                                placeholder="وصف المهمة (اختياري)"
                                className="w-full h-20 p-3 border rounded-lg text-right resize-none"
                                id="task-desc"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-gray-500">التاريخ</label>
                                    <Input type="date" defaultValue={todayStr} id="task-date" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">الأولوية</label>
                                    <select className="w-full h-10 border rounded-md px-3" id="task-priority">
                                        <option value="low">منخفضة</option>
                                        <option value="medium">متوسطة</option>
                                        <option value="high">عالية</option>
                                    </select>
                                </div>
                            </div>
                            <Button className="w-full" onClick={async () => {
                                const title = (document.getElementById('task-title') as HTMLInputElement)?.value;
                                if (!title) { toast({ title: 'أدخل عنوان المهمة' }); return; }
                                const priority = (document.getElementById('task-priority') as HTMLSelectElement)?.value as 'low' | 'medium' | 'high' || 'medium';
                                const deadline = (document.getElementById('task-date') as HTMLInputElement)?.value || todayStr;
                                await addTask({ title, type: 'task', deadline, priority });
                                if (refetch) refetch();
                                toast({ title: 'تم حفظ المهمة', description: title });
                                setShowAddDialog(null);
                            }}>
                                <Plus className="w-4 h-4 ml-2" /> حفظ المهمة
                            </Button>
                        </div>
                    )}

                    {/* Shopping Dialog */}
                    {showAddDialog === 'shopping' && (
                        <div className="space-y-4 mt-2">
                            <Input placeholder="اسم العنصر" className="text-right" id="shop-item" />
                            <div className="grid grid-cols-2 gap-2">
                                <Input placeholder="الكمية" type="number" defaultValue="1" id="shop-qty" />
                                <select className="h-10 border rounded-md px-3" id="shop-category">
                                    <option>طعام</option>
                                    <option>منزل</option>
                                    <option>صحة</option>
                                    <option>أخرى</option>
                                </select>
                            </div>
                            <Button className="w-full" onClick={async () => {
                                const item = (document.getElementById('shop-item') as HTMLInputElement)?.value;
                                const qty = parseInt((document.getElementById('shop-qty') as HTMLInputElement)?.value || '1');
                                const cat = (document.getElementById('shop-category') as HTMLSelectElement)?.value || 'أخرى';
                                if (!item) { toast({ title: 'أدخل اسم العنصر' }); return; }
                                const success = await saveShoppingItem(item, qty, cat);
                                if (success) {
                                    toast({ title: 'تم إضافة للتسوق', description: item });
                                } else {
                                    toast({ title: 'فشل الإضافة', variant: 'destructive' });
                                }
                                setShowAddDialog(null);
                            }}>
                                <Plus className="w-4 h-4 ml-2" /> إضافة للقائمة
                            </Button>
                        </div>
                    )}

                    {/* Note Dialog */}
                    {showAddDialog === 'note' && (
                        <div className="space-y-4 mt-2">
                            <Input placeholder="عنوان الملاحظة" className="text-right" id="note-title" />
                            <textarea
                                placeholder="اكتب ملاحظتك هنا..."
                                className="w-full h-32 p-3 border rounded-lg text-right resize-none"
                                id="note-content"
                            />
                            <Button className="w-full" onClick={async () => {
                                const title = (document.getElementById('note-title') as HTMLInputElement)?.value || '';
                                const content = (document.getElementById('note-content') as HTMLTextAreaElement)?.value;
                                if (!content) { toast({ title: 'أدخل الملاحظة' }); return; }
                                const success = await saveNote(title, content);
                                if (success) {
                                    toast({ title: 'تم حفظ الملاحظة', description: title || 'ملاحظة جديدة' });
                                } else {
                                    toast({ title: 'فشل حفظ الملاحظة', variant: 'destructive' });
                                }
                                setShowAddDialog(null);
                            }}>
                                <Plus className="w-4 h-4 ml-2" /> حفظ الملاحظة
                            </Button>
                        </div>
                    )}

                    {/* Goal Dialog */}
                    {showAddDialog === 'goal' && (
                        <div className="space-y-4 mt-2">
                            <Input placeholder="عنوان الهدف" className="text-right" id="goal-title" />
                            <textarea
                                placeholder="وصف الهدف..."
                                className="w-full h-20 p-3 border rounded-lg text-right resize-none"
                                id="goal-desc"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-gray-500">التاريخ المستهدف</label>
                                    <Input type="date" id="goal-date" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">التقدم الحالي %</label>
                                    <Input type="number" defaultValue="0" min="0" max="100" id="goal-progress" />
                                </div>
                            </div>
                            <Button className="w-full" onClick={() => {
                                const title = (document.getElementById('goal-title') as HTMLInputElement)?.value;
                                if (!title) { toast({ title: 'أدخل عنوان الهدف' }); return; }
                                toast({ title: 'تم حفظ الهدف', description: title });
                                setShowAddDialog(null);
                            }}>
                                <Target className="w-4 h-4 ml-2" /> حفظ الهدف
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog >

            {/* ===== FINANCIAL REPORT DIALOG ===== */}
            < Dialog open={showFinancialReport} onOpenChange={setShowFinancialReport} >
                <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-right flex items-center gap-2">
                            <FileText className="w-5 h-5 text-emerald-500" />
                            التقرير المالي
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-emerald-50 rounded-lg text-center">
                                <span className="text-sm text-gray-500 block">الرصيد الحالي</span>
                                <span className="text-xl font-bold text-emerald-600">{totalBalanceARS.toLocaleString()} ARS</span>
                            </div>
                            <div className="p-3 bg-red-50 rounded-lg text-center">
                                <span className="text-sm text-gray-500 block">الديون</span>
                                <span className="text-xl font-bold text-red-600">{(financeData?.total_debt || 0).toLocaleString()} ARS</span>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg text-center">
                                <span className="text-sm text-gray-500 block">الحد اليومي</span>
                                <span className="text-xl font-bold text-blue-600">{dailyLimitARS.toLocaleString()} ARS</span>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg text-center">
                                <span className="text-sm text-gray-500 block">مصروف اليوم</span>
                                <span className="text-xl font-bold text-purple-600">{todayExpense.toLocaleString()} ARS</span>
                            </div>
                        </div>

                        {/* Recent Transactions */}
                        <div className="border rounded-lg p-3">
                            <h4 className="font-medium text-gray-700 mb-2">آخر المعاملات</h4>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {financeData?.pending_expenses?.slice(0, 5).map((t: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                                        <span>{t.description || 'معاملة'}</span>
                                        <span className={t.type === 'expense' ? 'text-red-500' : 'text-green-500'}>
                                            {t.type === 'expense' ? '-' : '+'}{t.amount} {t.currency}
                                        </span>
                                    </div>
                                )) || <p className="text-gray-400 text-center">لا توجد معاملات</p>}
                            </div>
                        </div>

                        {/* Print Options */}
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={printFinancialReport}>
                                <Printer className="w-4 h-4 ml-2" /> طباعة احترافية
                            </Button>
                            <Button className="flex-1" onClick={() => { setShowFinancialReport(false); onNavigateToTab('finance'); }}>
                                <DollarSign className="w-4 h-4 ml-2" /> فتح المالية
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog >
        </div >

    );
};

export default SmartDashboard;
