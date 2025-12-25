import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from "@/components/ui/use-toast";
import { useDashboardData } from '@/hooks/useDashboardData';
import { useHabits } from '@/hooks/useHabits';
import { useMedications } from '@/hooks/useMedications';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { supabase } from '@/integrations/supabase/client';
import { useLocations } from '@/hooks/useLocations';
import {
    Plus, CalendarPlus, ShoppingCart, DollarSign, FileText, CheckSquare, Target, Clock, MapPin
} from 'lucide-react';

import InteractiveMap from '@/components/InteractiveMap';
import AppointmentManager from '@/components/AppointmentManager';
import PrayerTimesRow from '@/components/PrayerTimesRow';
import PomodoroTimer from '@/components/PomodoroTimer';
import { Card, CardContent } from '@/components/ui/card';

// New Components
import DashboardHeader from './dashboard/DashboardHeader';
import DashboardStats from './dashboard/DashboardStats';
import QuickActionsGrid from './dashboard/QuickActionsGrid';
import DailyReportCard from './dashboard/DailyReportCard';
import DashboardCalendar from './dashboard/DashboardCalendar';

interface SmartDashboardProps {
    onNavigateToTab: (tabId: string) => void;
}

const SmartDashboard: React.FC<SmartDashboardProps> = ({ onNavigateToTab }) => {
    const { toast } = useToast();
    const {
        financeData, loading, shoppingListSummary,
        prayerTimes = [], refetch
    } = useDashboardData();

    const { habits } = useHabits();
    const { medications } = useMedications();
    const { tasks, addTask, refreshTasks } = useTasks();

    const { appointments, refreshAppointments } = useAppointments();
    const { saveParking, getParkingOnly, deleteLocation } = useLocations();

    const [parkingDuration, setParkingDuration] = useState<string | null>(null);
    const [latestParking, setLatestParking] = useState<any>(null);

    const [currentDate] = useState(new Date());
    const [showAddDialog, setShowAddDialog] = useState<'appointment' | 'task' | 'location' | 'shopping' | 'note' | 'expense' | 'goal' | null>(null);
    const [showFinancialReport, setShowFinancialReport] = useState(false);
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
                // Sort by createdAt descending
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

    // Derived Financial Data
    const todayExpense = financeData?.pending_expenses?.filter((e: any) =>
        e.timestamp?.startsWith(new Date().toISOString().split('T')[0]) && e.type === 'expense'
    ).reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0;

    // Calculate Dynamic Daily Limit (Unified with FinancialController)
    const calculateDailyLimit = () => {
        if (!financeData) return 0;

        // 1. Check if explicit limit is set in config
        const explicitLimit = financeData?.financial_config?.daily_limit_ars || 0;
        if (explicitLimit > 0) return explicitLimit;

        // 2. Auto-calculate based on Available Balance
        const balance = financeData.current_balance_ars || 0;
        const buffer = financeData.emergency_buffer || 0;
        const debt = financeData.total_debt || 0;

        // Available = Balance - (Buffer + Debt)
        const available = balance - buffer - debt;
        if (available <= 0) return 0;

        // Remaining Days in Month
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const remainingDays = daysInMonth - now.getDate();

        // Safe division (remaining + padding)
        return Math.floor(available / (remainingDays + 3));
    };

    const dailyLimitARS = calculateDailyLimit();
    const totalBalanceARS = financeData?.current_balance_ars || 0;

    if (loading) return <div className="p-8 text-center text-emerald-600">جاري تحميل البيانات...</div>;

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
            <DashboardHeader currentDate={currentDate} />

            {/* ===== PARKING TIMER (Enhanced with 3 Buttons) ===== */}
            {parkingDuration && latestParking && (
                <div className="mx-2 mb-4 bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-md animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-orange-400 to-orange-600"></div>

                    {/* Header Row */}
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-orange-100 p-2.5 rounded-full animate-pulse shadow-inner">
                            <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-xs text-orange-800 font-bold mb-0.5">مدة الوقوف</p>
                            <p className="text-2xl font-mono font-bold text-orange-700 dir-ltr tracking-wider leading-none">{parkingDuration}</p>
                        </div>
                    </div>

                    {/* Location Title */}
                    <p className="text-xs text-orange-600/80 truncate mb-3 pr-2 border-b border-orange-200 pb-2">{latestParking.title}</p>

                    {/* Action Buttons Row */}
                    <div className="flex gap-2 justify-end flex-wrap">
                        {/* Save Button - Keeps location, stops timer display */}
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-9 px-3 text-xs border-green-400 text-green-700 hover:bg-green-50 gap-1"
                            onClick={() => {
                                setParkingDuration(null);
                                setLatestParking(null);
                                toast({ title: '✅ تم حفظ الموقف', description: 'يمكنك العثور عليه في المواقع المحفوظة' });
                            }}
                        >
                            حفظ 💾
                        </Button>

                        {/* Delete Button - Deletes location entirely */}
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={stopParking}
                            className="h-9 px-3 text-xs"
                        >
                            حذف 🗑️
                        </Button>

                        {/* Navigate Button */}
                        <Button
                            size="sm"
                            className="h-9 px-3 bg-blue-500 hover:bg-blue-600 text-xs gap-1"
                            onClick={() => {
                                const url = latestParking.url || `https://www.google.com/maps/search/?api=1&query=${latestParking.lat},${latestParking.lng}`;
                                window.open(url, '_blank');
                            }}
                        >
                            ملاحة 🧭
                        </Button>
                    </div>
                </div>
            )}

            {/* ===== 2. FINANCIAL SUMMARY ===== */}
            <DashboardStats
                onNavigateToFinance={() => onNavigateToTab('finance')}
                financeData={financeData}
                todayExpense={todayExpense}
                dailyLimitARS={dailyLimitARS}
            />

            {/* ===== 3. QUICK ACTIONS ===== */}
            <QuickActionsGrid onOpenAddDialog={setShowAddDialog} onQuickParking={saveParking} />

            {/* ===== PRAYER TIMES (TODAY) ===== */}
            <Card className="border-teal-100 shadow-sm bg-gradient-to-br from-teal-50/50 to-white mb-6">
                <CardContent className="p-4">
                    <PrayerTimesRow showTimeUntilNext={true} />
                </CardContent>
            </Card>

            {/* ===== POMODORO TIMER ===== */}
            <PomodoroTimer />

            {/* ===== 4. DAILY REPORT ===== */}
            <DailyReportCard
                tasks={tasks}
                appointments={appointments}
                habits={habits}
                medications={medications}
                onNavigateToTab={onNavigateToTab}
                refetch={refetch}
            />

            {/* ===== 5. WEEKLY CALENDAR ===== */}
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

            {/* ===== QUICK ADD DIALOGS ===== */}
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
                        </DialogTitle>
                    </DialogHeader>

                    {showAddDialog === 'appointment' && <div className="mt-2"><AppointmentManager /></div>}

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

                    {showAddDialog === 'expense' && (
                        <div className="space-y-4 mt-2">
                            <Input placeholder="المبلغ" type="number" className="text-right" id="expense-amount" />
                            <Input placeholder="الوصف" className="text-right" id="expense-desc" />
                            <div className="grid grid-cols-3 gap-2">
                                {['طعام', 'مواصلات', 'فواتير', 'تسوق', 'صحة', 'أخرى'].map(cat => (
                                    <Button key={cat} variant="outline" size="sm" className="text-xs">{cat}</Button>
                                ))}
                            </div>
                            <Button className="w-full" onClick={async () => {
                                const amount = parseFloat((document.getElementById('expense-amount') as HTMLInputElement)?.value || '0');
                                const desc = (document.getElementById('expense-desc') as HTMLInputElement)?.value || '';
                                if (!amount || amount <= 0) { toast({ title: 'أدخل المبلغ' }); return; }
                                const success = await saveExpense(amount, desc, 'أخرى');
                                if (success) toast({ title: 'تم حفظ المصروف', description: `${amount} ARS` });
                                else toast({ title: 'فشل حفظ المصروف', variant: 'destructive' });
                                setShowAddDialog(null);
                            }}>
                                <Plus className="w-4 h-4 ml-2" /> حفظ المصروف
                            </Button>
                        </div>
                    )}

                    {showAddDialog === 'task' && (
                        <div className="space-y-4 mt-2">
                            <Input placeholder="عنوان المهمة" className="text-right" id="task-title" />
                            <textarea placeholder="وصف المهمة (اختياري)" className="w-full h-20 p-3 border rounded-lg text-right resize-none" id="task-desc" />
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="text-xs text-gray-500">التاريخ</label>
                                    <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} id="task-date" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">الوقت</label>
                                    <Input type="time" defaultValue="09:00" id="task-time" />
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
    );
};

export default SmartDashboard;
