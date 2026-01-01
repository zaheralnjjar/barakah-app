import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from "react-router-dom";

import { useToast } from "@/components/ui/use-toast";
import { useDashboardData } from '@/hooks/useDashboardData';
import { useHabits } from '@/hooks/useHabits';
import { useMedications } from '@/hooks/useMedications';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { supabase } from '@/integrations/supabase/client';
import { useLocations } from '@/hooks/useLocations';
import { useDollarRate } from '@/hooks/useDollarRate';
import { useQuickNotes } from '@/hooks/useQuickNotes';
import {
    Plus, CalendarPlus, ShoppingCart, DollarSign, FileText, CheckSquare, Target, Clock, MapPin, Timer, Play, StickyNote, LayoutGrid, Calendar, Wallet, ListChecks
} from 'lucide-react';

import InteractiveMap from '@/components/InteractiveMap';
import AppointmentManager from '@/components/AppointmentManager';
import PrayerTimesRow from '@/components/PrayerTimesRow';
import PomodoroTimer from '@/components/PomodoroTimer';
import { Card, CardContent } from '@/components/ui/card';

// New Components
import DashboardHeader from './dashboard/DashboardHeader';
import DashboardHeaderStrip from './dashboard/DashboardHeaderStrip';
import DashboardStats from './dashboard/DashboardStats';
import QuickActionsGrid from './dashboard/QuickActionsGrid';
import DailyReportCard from './dashboard/DailyReportCard';
import DashboardCalendar from './dashboard/DashboardCalendar';
import DashboardProgressCharts from './dashboard/DashboardProgressCharts';
import DashboardTicker from './dashboard/DashboardTicker';

// Dashboard sections are now rendered in fixed order (no drag-and-drop)

interface SmartDashboardProps {
    onNavigateToTab: (tabId: string) => void;
    onOpenVoiceRecorder: () => void;
}

const SmartDashboard: React.FC<SmartDashboardProps> = ({ onNavigateToTab, onOpenVoiceRecorder }) => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const {
        financeData, loading: dataLoading, shoppingListSummary,
        prayerTimes = [], refetch, nextPrayer, timeUntilNext
    } = useDashboardData();

    const { habits } = useHabits();
    const { medications } = useMedications();
    const { tasks, addTask, refreshTasks } = useTasks();
    const { appointments, refreshAppointments } = useAppointments();
    const { saveParking, getParkingOnly, deleteLocation } = useLocations();
    const { notesHistory } = useQuickNotes();

    const [parkingDuration, setParkingDuration] = useState<string | null>(null);
    const [latestParking, setLatestParking] = useState<any>(null);

    const [currentDate] = useState(new Date());
    const [showAddDialog, setShowAddDialog] = useState<'appointment' | 'task' | 'location' | 'shopping' | 'note' | 'expense' | 'goal' | null>(null);
    const [showFinancialReport, setShowFinancialReport] = useState(false);
    const [showWidgetMenu, setShowWidgetMenu] = useState(false);

    const [weekStartDate, setWeekStartDate] = useState(() => {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(today.setDate(diff));
    });

    // Parking Timer Logic
    useEffect(() => {
        const updateTimer = () => {
            const spots = getParkingOnly();
            if (spots.length > 0) {
                const latest = spots.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                setLatestParking(latest);

                const start = new Date(latest.createdAt).getTime();
                const now = new Date().getTime();
                const diff = now - start;

                if (diff < 0) {
                    setParkingDuration('00:00:00');
                    return;
                }

                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                setParkingDuration(
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                );
            } else {
                setParkingDuration(null);
                setLatestParking(null);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [getParkingOnly]);

    const stopParking = async () => {
        if (latestParking) {
            await deleteLocation(latestParking.id);
            setParkingDuration(null);
            setLatestParking(null);
            toast({ title: '🛑 تم إيقاف المؤقت وحذف الموقف' });
        }
    };

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
        if (!dataLoading) syncToWidget();
    }, [tasks, appointments, habits, medications, prayerTimes, financeData, shoppingListSummary, dataLoading]);

    // Pull-to-refresh state
    const [isRefreshing, setIsRefreshing] = useState(false);
    const handlePullRefresh = async () => {
        setIsRefreshing(true);
        if (refetch) await refetch();
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const saveExpense = async (amount: number, description: string, category: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

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

    const saveShoppingItem = async (itemName: string, quantity: number, category: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

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

    const saveNote = async (title: string, content: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

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

    // Dollar Rate Logic
    const { rates: dollarRates } = useDollarRate();

    // Force re-render on settings change
    const [settingsVersion, setSettingsVersion] = useState(0);
    useEffect(() => {
        const handleSettingsChange = () => setSettingsVersion(v => v + 1);
        window.addEventListener('financialSettingsChanged', handleSettingsChange);
        return () => window.removeEventListener('financialSettingsChanged', handleSettingsChange);
    }, []);

    const calculateDailyLimit = () => {
        if (!financeData) return 0;
        const explicitLimit = financeData?.financial_config?.daily_limit_ars || 0;
        if (explicitLimit > 0) return explicitLimit;

        const balance = financeData.current_balance_ars || 0;
        const buffer = financeData.emergency_buffer || 0;
        const debt = financeData.total_debt || 0;
        const available = balance - buffer - debt;
        if (available <= 0) return 0;

        const now = new Date();

        // Check for Specific Cycle End Date
        const cycleEndDateStr = localStorage.getItem('baraka_cycle_end_date');
        if (cycleEndDateStr) {
            const endDate = new Date(cycleEndDateStr);
            // End date should be end of day
            endDate.setHours(23, 59, 59, 999);
            const diffTime = endDate.getTime() - now.getTime();
            // If date is in past, default to 1 to avoid division by zero/negative, effectively 0 limit
            if (diffTime < 0) return 0;
            const remaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return Math.floor(available / remaining);
        }

        // Check for Manual Override
        const manualDays = parseInt(localStorage.getItem('baraka_manual_remaining_days') || '0');
        if (manualDays > 0) {
            return Math.floor(available / manualDays);
        }

        // Calculate based on Salary Day (Auto Renewal)
        const salaryDay = parseInt(localStorage.getItem('baraka_salary_day') || '1');
        let nextSalaryDate = new Date(now.getFullYear(), now.getMonth(), salaryDay);

        // If today is past the salary day (or is the salary day), aim for next month's salary day
        if (now.getDate() >= salaryDay) {
            nextSalaryDate = new Date(now.getFullYear(), now.getMonth() + 1, salaryDay);
        }

        const diffTime = nextSalaryDate.getTime() - now.getTime();
        const remainingDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        return Math.floor(available / remainingDays);
    };

    const dailyLimitARS = calculateDailyLimit();
    const todayExpense = financeData?.pending_expenses?.filter((e: any) =>
        e.timestamp?.startsWith(new Date().toISOString().split('T')[0]) && e.type === 'expense'
    ).reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0;

    if (dataLoading) return <div className="p-8 text-center text-emerald-600">جاري تحميل البيانات...</div>;

    return (
        <div className="min-h-screen bg-slate-50/30">
            {/* 1. Main Header (Site Name & Notifications) */}
            <div className="px-4 pt-2 max-w-7xl mx-auto">
                <DashboardHeader currentDate={currentDate} />
            </div>

            {/* 2. Finance & Prayer Header Strip */}
            <div className="px-2 pt-1 pb-2 max-w-7xl mx-auto">
                <DashboardHeaderStrip
                    financeData={{
                        ...financeData,
                        exchange_rate: dollarRates?.real_blue?.value_sell ?? dollarRates?.blue?.value_sell, // Use Real Blue for display, fallback to Blue (which is Official now)
                        oficial_rate: dollarRates?.oficial?.value_sell,
                        prev_exchange_rate: dollarRates?.previous_blue?.value_avg,
                        dollar_change: dollarRates?.change,
                        last_update: dollarRates?.last_update,
                    }}
                    todayExpense={todayExpense}
                    dailyLimitARS={dailyLimitARS}
                    prayerTimes={prayerTimes}
                    nextPrayer={nextPrayer}
                    timeUntilNext={timeUntilNext}
                />
            </div>

            <div
                className="space-y-2 px-2 pt-1 max-w-6xl mx-auto"
                onTouchStart={(e) => {
                    if (e.touches[0].clientY < 50) {
                        const startY = e.touches[0].clientY;
                        const handleTouchEnd = (endEvent: TouchEvent) => {
                            const endY = endEvent.changedTouches[0].clientY;
                            if (endY - startY > 100) handlePullRefresh();
                            document.removeEventListener('touchend', handleTouchEnd as EventListener);
                        };
                        document.addEventListener('touchend', handleTouchEnd as EventListener);
                    }
                }}
            >
                {isRefreshing && (
                    <div className="fixed top-0 left-0 right-0 z-50 bg-emerald-500 text-white text-center py-2 text-sm animate-pulse">
                        🔄 جاري التحديث...
                    </div>
                )}

                {parkingDuration && latestParking && (
                    <div className="mx-2 mb-4 bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-md animate-fade-in relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-orange-400 to-orange-600"></div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-orange-100 p-2.5 rounded-full animate-pulse shadow-inner">
                                <Clock className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-orange-800 font-bold mb-0.5">مدة الوقوف</p>
                                <p className="text-2xl font-mono font-bold text-orange-700 dir-ltr tracking-wider leading-none">{parkingDuration}</p>
                            </div>
                        </div>
                        <p className="text-xs text-orange-600/80 truncate mb-3 pr-2 border-b border-orange-200 pb-2">{latestParking.title}</p>
                        <div className="flex gap-2 justify-end flex-wrap">
                            <Button size="sm" variant="outline" className="h-9 px-3 text-xs border-green-400 text-green-700 hover:bg-green-50 gap-1" onClick={() => { setParkingDuration(null); setLatestParking(null); toast({ title: '✅ تم حفظ الموقف' }); }}>
                                حفظ 💾
                            </Button>
                            <Button size="sm" variant="destructive" onClick={stopParking} className="h-9 px-3 text-xs">حذف 🗑️</Button>
                            <Button size="sm" className="h-9 px-3 bg-blue-500 hover:bg-blue-600 text-xs gap-1" onClick={() => window.open(latestParking.url || `https://www.google.com/maps/search/?api=1&query=${latestParking.lat},${latestParking.lng}`, '_blank')}>
                                ملاحة 🧭
                            </Button>
                        </div>
                    </div>
                )}


                {/* Quick Actions */}
                <QuickActionsGrid
                    onOpenAddDialog={setShowAddDialog}
                    onQuickParking={saveParking}
                    onOpenTimer={() => setShowAddDialog('goal')} // Placeholder for timer
                    onOpenVoiceRecorder={onOpenVoiceRecorder}
                />

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {/* Left Column: Daily Report */}
                    <DailyReportCard
                        tasks={tasks}
                        appointments={appointments}
                        habits={habits}
                        medications={medications}
                        onNavigateToTab={onNavigateToTab}
                        refetch={refetch}
                    />

                    {/* Right Column: Calendar */}
                    <DashboardCalendar
                        tasks={tasks}
                        appointments={appointments}
                        habits={habits}
                        medications={medications}
                        prayerTimes={prayerTimes}
                        onNavigateToTab={onNavigateToTab}
                        refetch={refetch}
                        weekStartDate={weekStartDate}
                        setWeekStartDate={setWeekStartDate}
                    />
                </div>

                {/* ===== NOTES SECTION ===== */}
                {notesHistory && notesHistory.length > 0 && (
                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                                    <StickyNote className="w-3 h-3" />
                                    الملاحظات ({notesHistory.length})
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {notesHistory.slice(0, 8).map((note, idx) => {
                                    const firstLine = note.content.split('\n')[0].trim();
                                    const title = firstLine.substring(0, 25) || `ملاحظة ${idx + 1}`;
                                    const preview = note.content.substring(0, 60).replace(/\n/g, ' ');
                                    return (
                                        <div
                                            key={idx}
                                            className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-100 hover:shadow-md transition-all cursor-pointer group"
                                            onClick={() => onNavigateToTab('logistics')}
                                        >
                                            <div className="flex items-start gap-2">
                                                <div className="p-1.5 bg-amber-100 rounded-full group-hover:bg-amber-200 transition-colors">
                                                    <StickyNote className="w-3.5 h-3.5 text-amber-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-amber-800 truncate">{title}</p>
                                                    <p className="text-[10px] text-amber-600/70 line-clamp-2 mt-0.5 leading-tight">{preview}...</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Progress Charts at the Bottom */}
                <DashboardProgressCharts />

                {/* Pomodoro Timer (Hidden Trigger, accessible via Top Icon) */}
                <PomodoroTimer hideTrigger={true} />



                <Dialog open={showAddDialog !== null} onOpenChange={(open) => {
                    if (!open) {
                        if (showAddDialog === 'appointment') refreshAppointments();
                        if (showAddDialog === 'task') refreshTasks();
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
                                {showAddDialog === 'goal' && <><Target className="w-5 h-5 text-purple-500" /> إضافة هدف</>}
                            </DialogTitle>
                        </DialogHeader>

                        {showAddDialog === 'appointment' && <div className="mt-2"><AppointmentManager /></div>}

                        {showAddDialog === 'location' && (
                            <div className="pb-24 space-y-4 md:space-y-6">

                                {/* Header Strip */}
                                <div className="h-[500px] rounded-lg overflow-hidden border-2 border-green-200">
                                    <InteractiveMap />
                                </div>

                                <p className="text-sm text-center text-gray-500 bg-green-50 p-2 rounded-lg">
                                    💡 اضغط على الخريطة لحفظ الموقع أو استخدم البحث
                                </p>
                            </div>
                        )}

                        {showAddDialog === 'expense' && (
                            <div className="space-y-4 mt-2">
                                {/* Transaction Type Toggle */}
                                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                                    <button
                                        onClick={() => (document.getElementById('expense-type') as HTMLInputElement).value = 'expense'}
                                        className="flex-1 py-2.5 px-4 rounded-md flex items-center justify-center gap-2 transition-all bg-red-500 text-white shadow-md transaction-type-btn"
                                        data-type="expense"
                                        id="expense-type-expense-btn"
                                    >
                                        <span className="font-medium">مصروف</span>
                                    </button>
                                    <button
                                        onClick={() => (document.getElementById('expense-type') as HTMLInputElement).value = 'income'}
                                        className="flex-1 py-2.5 px-4 rounded-md flex items-center justify-center gap-2 transition-all bg-transparent text-gray-600 hover:bg-gray-200 transaction-type-btn"
                                        data-type="income"
                                        id="expense-type-income-btn"
                                    >
                                        <span className="font-medium">دخل</span>
                                    </button>
                                </div>
                                <input type="hidden" id="expense-type" defaultValue="expense" />

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">المبلغ</label>
                                        <Input placeholder="0.00" type="number" className="text-right" id="expense-amount" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">العملة</label>
                                        <select className="w-full h-10 border rounded-md px-3 text-sm" id="expense-currency">
                                            <option value="ARS">ARS - بيزو</option>
                                            <option value="USD">USD - دولار</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">الفئة</label>
                                    <select className="w-full h-10 border rounded-md px-3 text-sm" id="expense-category">
                                        <option value="طعام">طعام</option>
                                        <option value="مواصلات">مواصلات</option>
                                        <option value="فواتير">فواتير</option>
                                        <option value="تسوق">تسوق</option>
                                        <option value="صحة">صحة</option>
                                        <option value="ترفيه">ترفيه</option>
                                        <option value="راتب">راتب</option>
                                        <option value="مكافأة">مكافأة</option>
                                        <option value="أخرى">أخرى</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">الوصف</label>
                                    <Input placeholder="وصف المعاملة..." className="text-right" id="expense-desc" />
                                </div>

                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={async () => {
                                    const amount = parseFloat((document.getElementById('expense-amount') as HTMLInputElement)?.value || '0');
                                    const desc = (document.getElementById('expense-desc') as HTMLInputElement)?.value || '';
                                    const category = (document.getElementById('expense-category') as HTMLSelectElement)?.value || 'أخرى';
                                    const currency = (document.getElementById('expense-currency') as HTMLSelectElement)?.value || 'ARS';
                                    const type = (document.getElementById('expense-type') as HTMLInputElement)?.value || 'expense';

                                    if (!amount || amount <= 0) { toast({ title: 'أدخل المبلغ' }); return; }

                                    try {
                                        const { data: { user } } = await supabase.auth.getUser();
                                        if (!user) { toast({ title: 'يجب تسجيل الدخول', variant: 'destructive' }); return; }

                                        const { data: currentData } = await supabase
                                            .from('finance_data_2025_12_18_18_42')
                                            .select('*')
                                            .eq('user_id', user.id)
                                            .single();

                                        if (!currentData) { toast({ title: 'لا توجد بيانات مالية', variant: 'destructive' }); return; }

                                        const isExpense = type === 'expense';
                                        let balanceARS = currentData.current_balance_ars || 0;
                                        let balanceUSD = currentData.current_balance_usd || 0;

                                        if (currency === 'ARS') {
                                            balanceARS += isExpense ? -amount : amount;
                                        } else {
                                            balanceUSD += isExpense ? -amount : amount;
                                        }

                                        const updatedPendingExpenses = [...(currentData.pending_expenses || []), {
                                            id: Date.now(),
                                            amount,
                                            currency,
                                            type,
                                            category,
                                            description: desc || (isExpense ? 'مصروف سريع' : 'دخل'),
                                            timestamp: new Date().toISOString(),
                                            source: 'dashboard_quick_add'
                                        }];

                                        await supabase
                                            .from('finance_data_2025_12_18_18_42')
                                            .update({
                                                current_balance_ars: balanceARS,
                                                current_balance_usd: balanceUSD,
                                                pending_expenses: updatedPendingExpenses,
                                                updated_at: new Date().toISOString()
                                            })
                                            .eq('user_id', user.id);

                                        if (refetch) refetch();
                                        toast({
                                            title: isExpense ? 'تم تسجيل المصروف' : 'تم تسجيل الدخل',
                                            description: `${isExpense ? '-' : '+'}${amount} ${currency}`
                                        });
                                    } catch (e) {
                                        console.error('Error saving transaction:', e);
                                        toast({ title: 'فشل حفظ المعاملة', variant: 'destructive' });
                                    }
                                    setShowAddDialog(null);
                                }}>
                                    <Plus className="w-4 h-4 ml-2" /> حفظ المعاملة
                                </Button>
                            </div>
                        )}

                        {showAddDialog === 'task' && (
                            <div className="space-y-4 mt-2">
                                <Input placeholder="عنوان المهمة" className="text-right" id="task-title" />
                                <textarea placeholder="وصف المهمة (اختياري)" className="w-full h-20 p-3 border rounded-lg text-right resize-none" id="task-desc" />
                                <div className="grid grid-cols-3 gap-2">
                                    <div><label className="text-xs text-gray-500">التاريخ</label><Input type="date" defaultValue={new Date().toISOString().split('T')[0]} id="task-date" /></div>
                                    <div><label className="text-xs text-gray-500">الوقت</label><Input type="time" defaultValue="09:00" id="task-time" /></div>
                                    <div><label className="text-xs text-gray-500">الأولوية</label><select className="w-full h-10 border rounded-md px-3" id="task-priority"><option value="low">منخفضة</option><option value="medium">متوسطة</option><option value="high">عالية</option></select></div>
                                </div>
                                <Button className="w-full" onClick={async () => {
                                    const title = (document.getElementById('task-title') as HTMLInputElement)?.value;
                                    if (!title) { toast({ title: 'أدخل عنوان المهمة' }); return; }
                                    const priority = (document.getElementById('task-priority') as HTMLSelectElement)?.value as 'low' | 'medium' | 'high' || 'medium';
                                    const deadline = (document.getElementById('task-date') as HTMLInputElement)?.value || new Date().toISOString().split('T')[0];
                                    const taskTime = (document.getElementById('task-time') as HTMLInputElement)?.value || '09:00';
                                    await addTask({ title, type: 'task', deadline: `${deadline}T${taskTime}`, priority });
                                    if (refetch) refetch();
                                    toast({ title: 'تم حفظ المهمة', description: title });
                                    setShowAddDialog(null);
                                }}>
                                    <Plus className="w-4 h-4 ml-2" /> حفظ المهمة
                                </Button>
                            </div>
                        )}

                        {showAddDialog === 'shopping' && (
                            <div className="space-y-4 mt-2">
                                <Input placeholder="اسم العنصر" className="text-right" id="shop-item" />
                                <div className="grid grid-cols-2 gap-2">
                                    <Input placeholder="الكمية" type="number" defaultValue="1" id="shop-qty" />
                                    <select className="h-10 border rounded-md px-3" id="shop-category">
                                        <option>طعام</option><option>منزل</option><option>صحة</option><option>أخرى</option>
                                    </select>
                                </div>
                                <Button className="w-full" onClick={async () => {
                                    const item = (document.getElementById('shop-item') as HTMLInputElement)?.value;
                                    const qty = parseInt((document.getElementById('shop-qty') as HTMLInputElement)?.value || '1');
                                    const cat = (document.getElementById('shop-category') as HTMLSelectElement)?.value || 'أخرى';
                                    if (!item) { toast({ title: 'أدخل اسم العنصر' }); return; }
                                    const success = await saveShoppingItem(item, qty, cat);
                                    if (success) toast({ title: 'تم إضافة للتسوق', description: item });
                                    else toast({ title: 'فشل الإضافة', variant: 'destructive' });
                                    setShowAddDialog(null);
                                }}>
                                    <Plus className="w-4 h-4 ml-2" /> إضافة للقائمة
                                </Button>
                            </div>
                        )}

                        {showAddDialog === 'note' && (
                            <div className="space-y-4 mt-2">
                                <Input placeholder="عنوان الملاحظة" className="text-right" id="note-title" />
                                <textarea placeholder="اكتب ملاحظتك هنا..." className="w-full h-32 p-3 border rounded-lg text-right resize-none" id="note-content" />
                                <Button className="w-full" onClick={async () => {
                                    const title = (document.getElementById('note-title') as HTMLInputElement)?.value || '';
                                    const content = (document.getElementById('note-content') as HTMLTextAreaElement)?.value;
                                    if (!content) { toast({ title: 'أدخل الملاحظة' }); return; }
                                    const success = await saveNote(title, content);
                                    if (success) toast({ title: 'تم حفظ الملاحظة', description: title || 'ملاحظة جديدة' });
                                    else toast({ title: 'فشل حفظ الملاحظة', variant: 'destructive' });
                                    setShowAddDialog(null);
                                }}>
                                    <Plus className="w-4 h-4 ml-2" /> حفظ الملاحظة
                                </Button>
                            </div>
                        )}

                        {showAddDialog === 'goal' && (
                            <div className="space-y-4 mt-2">
                                <Input placeholder="عنوان الهدف" className="text-right" id="goal-title" />
                                <textarea placeholder="وصف الهدف..." className="w-full h-20 p-3 border rounded-lg text-right resize-none" id="goal-desc" />
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className="text-xs text-gray-500">التاريخ المستهدف</label><Input type="date" id="goal-date" /></div>
                                    <div><label className="text-xs text-gray-500">التقدم الحالي %</label><Input type="number" defaultValue="0" min="0" max="100" id="goal-progress" /></div>
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
                </Dialog>

                {/* ===== FINANCIAL REPORT DIALOG (Legacy/View Only) ===== */}
                <Dialog open={showFinancialReport} onOpenChange={setShowFinancialReport}>
                    <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-right flex items-center gap-2">
                                <FileText className="w-5 h-5 text-emerald-500" />
                                التقرير المالي
                            </DialogTitle>
                        </DialogHeader>
                        {/* Simplified for now since printing is centralized */}
                        <div className="text-center py-4">
                            <p>يمكنك الآن طباعة التقارير من قسم التقويم.</p>
                            <Button className="mt-4" onClick={() => { setShowFinancialReport(false); onNavigateToTab('finance'); }}>
                                <DollarSign className="w-4 h-4 ml-2" /> فتح المالية
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default SmartDashboard;
