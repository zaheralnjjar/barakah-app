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
    Navigation, Save, Share2, ChevronLeft, ChevronRight
} from 'lucide-react';
import InteractiveMap from '@/components/InteractiveMap';

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
    const { medications } = useMedications();
    const { tasks } = useTasks();
    const { appointments } = useAppointments();

    const [currentDate] = useState(new Date());
    const [showPrintDialog, setShowPrintDialog] = useState(false);
    const [printRange, setPrintRange] = useState('today');
    const [printStartDate, setPrintStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [printEndDate, setPrintEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [printOptions, setPrintOptions] = useState({ tasks: true, appointments: true, medications: true, habits: true });
    const [showAddDialog, setShowAddDialog] = useState<'appointment' | 'task' | 'location' | 'shopping' | 'note' | null>(null);
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

    // --- Helper Functions ---
    const handleLogout = async () => { await supabase.auth.signOut(); };

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
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.deadline === todayStr);
    const todayAppointments = appointments.filter(a => a.date === todayStr);
    const todayMedications = medications;
    const todayHabits = habits;

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

    if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

    return (
        <div className="space-y-4 p-2 md:p-4 max-w-6xl mx-auto">

            {/* ===== 1. HEADER ===== */}
            <div className="bg-gradient-to-l from-emerald-50 to-white rounded-2xl p-4 shadow-sm border border-emerald-100">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Date Info - Single Box */}
                    <div className="bg-emerald-100 text-emerald-700 rounded-xl px-4 py-2 text-center min-w-[140px]">
                        <span className="text-sm font-bold block">{currentDate.getDate()} {currentDate.toLocaleDateString('ar', { month: 'long' })}</span>
                        <div className="border-t border-emerald-300 my-1"></div>
                        <span className="text-xs block">{hijriDate}</span>
                    </div>

                    {/* Logo & Actions */}
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-emerald-600 hidden sm:block">البركة</span>
                        <Button variant="ghost" size="sm" className="h-9 px-3 rounded-full text-red-500 hover:bg-red-50" onClick={handleLogout}>
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* ===== 2. FINANCIAL SUMMARY ===== */}
            <Card className="border-emerald-100 shadow-sm cursor-pointer hover:shadow-md transition-all" onClick={() => onNavigateToTab('finance')}>
                <CardContent className="p-4">
                    <div className="grid grid-cols-4 md:grid-cols-7 gap-2 text-center">
                        {/* Balance */}
                        <div className="col-span-1 p-2 bg-emerald-50 rounded-xl">
                            <span className="text-[10px] text-gray-500 block">الرصيد</span>
                            <span className="text-sm md:text-lg font-bold text-emerald-600 tabular-nums">{totalBalanceARS.toLocaleString()}</span>
                        </div>
                        {/* Daily Limit */}
                        <div className="col-span-1 p-2 bg-blue-50 rounded-xl">
                            <span className="text-[10px] text-gray-500 block">الحد اليومي</span>
                            <span className="text-sm md:text-lg font-bold text-blue-600 tabular-nums">{dailyLimitARS.toLocaleString()}</span>
                        </div>
                        {/* Today Expense */}
                        <div className="col-span-1 p-2 bg-red-50 rounded-xl">
                            <span className="text-[10px] text-gray-500 block">مصروف اليوم</span>
                            <span className="text-sm md:text-lg font-bold text-red-600 tabular-nums">{todayExpense.toLocaleString()}</span>
                        </div>
                        {/* Remaining Days */}
                        <div className="col-span-1 p-2 bg-purple-50 rounded-xl">
                            <span className="text-[10px] text-gray-500 block">الأيام المتبقية</span>
                            <span className="text-sm md:text-lg font-bold text-purple-600">{remainingDays}</span>
                        </div>
                        {/* Action Buttons - Hidden on mobile, shown on larger screens */}
                        <div className="hidden md:flex col-span-3 items-center justify-end gap-2">
                            <Button size="sm" variant="outline" className="h-9 gap-1" onClick={(e) => { e.stopPropagation(); onNavigateToTab('finance'); }}>
                                <Plus className="w-4 h-4" /> إضافة مصروف
                            </Button>
                            <Button size="sm" variant="outline" className="h-9 gap-1" onClick={(e) => { e.stopPropagation(); onNavigateToTab('finance'); }}>
                                <FileText className="w-4 h-4" /> تقرير مالي
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ===== 3. QUICK ACTIONS ===== */}
            <div className="grid grid-cols-5 gap-2">
                {[
                    { icon: CalendarPlus, label: 'موعد', color: 'bg-orange-100 text-orange-600', action: () => setShowAddDialog('appointment') },
                    { icon: CheckSquare, label: 'مهمة', color: 'bg-blue-100 text-blue-600', action: () => setShowAddDialog('task') },
                    { icon: MapPin, label: 'موقع', color: 'bg-green-100 text-green-600', action: () => setShowAddDialog('location') },
                    { icon: ShoppingCart, label: 'للتسوق', color: 'bg-pink-100 text-pink-600', action: () => setShowAddDialog('shopping') },
                    { icon: FileText, label: 'ملاحظة', color: 'bg-yellow-100 text-yellow-600', action: () => setShowAddDialog('note') },
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

            {/* ===== 4. DAILY REPORT ===== */}
            <Card className="border-blue-100 shadow-sm">
                <CardContent className="p-4">
                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        التقرير اليومي
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-gray-500 border-b">
                                    <th className="text-right py-2 px-2">النوع</th>
                                    <th className="text-right py-2 px-2">التفاصيل</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {/* Medications */}
                                {todayMedications.slice(0, 2).map((med, i) => (
                                    <tr key={`med-${i}`} className="hover:bg-gray-50">
                                        <td className="py-2 px-2"><Badge variant="outline" className="bg-red-50 text-red-600 text-[10px]"><Pill className="w-3 h-3 ml-1" />أدوية</Badge></td>
                                        <td className="py-2 px-2 font-medium">{med.name} - {med.time}</td>
                                    </tr>
                                ))}
                                {/* Appointments */}
                                {todayAppointments.slice(0, 2).map((apt, i) => (
                                    <tr key={`apt-${i}`} className="hover:bg-gray-50">
                                        <td className="py-2 px-2"><Badge variant="outline" className="bg-orange-50 text-orange-600 text-[10px]"><CalendarPlus className="w-3 h-3 ml-1" />موعد</Badge></td>
                                        <td className="py-2 px-2 font-medium">{apt.title} - {apt.time || '--'}</td>
                                    </tr>
                                ))}
                                {/* Tasks */}
                                {todayTasks.slice(0, 2).map((task, i) => (
                                    <tr key={`task-${i}`} className="hover:bg-gray-50">
                                        <td className="py-2 px-2"><Badge variant="outline" className="bg-blue-50 text-blue-600 text-[10px]"><CheckSquare className="w-3 h-3 ml-1" />مهمة</Badge></td>
                                        <td className="py-2 px-2 font-medium">{task.title}</td>
                                    </tr>
                                ))}
                                {/* Habits */}
                                {todayHabits.slice(0, 2).map((habit, i) => (
                                    <tr key={`habit-${i}`} className="hover:bg-gray-50">
                                        <td className="py-2 px-2"><Badge variant="outline" className="bg-yellow-50 text-yellow-600 text-[10px]"><Flame className="w-3 h-3 ml-1" />عادة</Badge></td>
                                        <td className="py-2 px-2 font-medium">{habit.name} - 🔥 {habit.streak || 0}</td>
                                    </tr>
                                ))}                                {(todayMedications.length + todayAppointments.length + todayTasks.length + todayHabits.length) === 0 && (
                                    <tr><td colSpan={2} className="text-center py-4 text-gray-400">لا توجد عناصر لليوم</td></tr>
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
                    <div className="grid grid-cols-7 gap-1">
                        {weekDays.map((day, idx) => {
                            const dateStr = day.toISOString().split('T')[0];
                            const isToday = dateStr === todayStr;
                            const dayAppts = appointments.filter(a => a.date === dateStr);
                            const dayMeds = medications; // All meds for now (daily)
                            const allItems = [
                                ...dayMeds.map(m => ({ type: 'med', name: m.name, time: m.time })),
                                ...dayAppts.map(a => ({ type: 'apt', name: a.title, time: a.time || '--' }))
                            ].sort((a, b) => (a.time || '').localeCompare(b.time || ''));

                            return (
                                <div
                                    key={idx}
                                    className={`rounded-lg transition-all ${isToday ? 'bg-purple-100 border-2 border-purple-400' : 'bg-gray-50 hover:bg-gray-100'}`}
                                >
                                    {/* Day Header */}
                                    <div className={`text-center py-1.5 border-b ${isToday ? 'border-purple-200' : 'border-gray-200'}`}>
                                        <span className="text-[10px] text-gray-500 block">{DAYS_AR[idx]}</span>
                                        <span className={`text-sm font-bold ${isToday ? 'text-purple-700' : 'text-gray-700'}`}>{day.getDate()}</span>
                                    </div>
                                    {/* Items inside day - scrollable */}
                                    <div className="h-[80px] overflow-y-auto p-1 space-y-0.5">
                                        {allItems.slice(0, 10).map((item, i) => (
                                            <div
                                                key={i}
                                                onClick={() => onNavigateToTab(item.type === 'apt' ? 'appointments' : 'productivity')}
                                                className={`text-[9px] px-1 py-1 rounded cursor-pointer hover:opacity-80 ${item.type === 'med' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                                    }`}
                                                title={`${item.name} - ${item.time}`}
                                            >
                                                <div className="flex items-center gap-1">
                                                    <span>{item.type === 'med' ? '💊' : '📅'}</span>
                                                    <span className="font-medium truncate flex-1">{item.name}</span>
                                                </div>
                                                <div className="text-[8px] opacity-70">{item.time}</div>
                                            </div>
                                        ))}
                                        {allItems.length === 0 && (
                                            <div className="text-[9px] text-gray-400 text-center py-4">لا توجد عناصر</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded-full"></span> الأدوية</div>
                        <div className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-400 rounded-full"></span> المواعيد</div>
                    </div>
                </CardContent>
            </Card>

            {/* ===== 6. MAPS SECTION ===== */}
            <Card className="border-green-100 shadow-sm">
                <CardContent className="p-4">
                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-green-500" />
                        الخرائط
                    </h3>

                    {/* Map */}
                    <div className="h-[300px] md:h-[400px] rounded-xl overflow-hidden border border-gray-200">

                        <InteractiveMap />
                    </div>
                </CardContent>
            </Card>

            {/* ===== PRINT DIALOG ===== */}
            <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="text-right flex items-center gap-2">
                            <Printer className="w-5 h-5 text-primary" />
                            طباعة الجدول
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
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

                        {/* Items Selection */}
                        <div>
                            <p className="text-sm text-gray-600 mb-2">اختر العناصر:</p>
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
                            </div>
                        </div>

                        <Button onClick={() => { onNavigateToTab('calendar'); setShowPrintDialog(false); }} className="w-full h-12 text-lg">
                            <Printer className="w-5 h-5 ml-2" />
                            طباعة الآن
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ===== QUICK ADD DIALOG ===== */}
            <Dialog open={showAddDialog !== null} onOpenChange={(open) => !open && setShowAddDialog(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-right flex items-center gap-2">
                            {showAddDialog === 'appointment' && <><CalendarPlus className="w-5 h-5 text-orange-500" /> إضافة موعد</>}
                            {showAddDialog === 'task' && <><CheckSquare className="w-5 h-5 text-blue-500" /> إضافة مهمة</>}
                            {showAddDialog === 'location' && <><MapPin className="w-5 h-5 text-green-500" /> حفظ موقع</>}
                            {showAddDialog === 'shopping' && <><ShoppingCart className="w-5 h-5 text-pink-500" /> إضافة للتسوق</>}
                            {showAddDialog === 'note' && <><FileText className="w-5 h-5 text-yellow-500" /> ملاحظة سريعة</>}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input placeholder="العنوان" className="text-right" id="quick-add-title" />
                        {showAddDialog === 'appointment' && (
                            <div className="grid grid-cols-2 gap-2">
                                <Input type="date" id="quick-add-date" defaultValue={todayStr} />
                                <Input type="time" id="quick-add-time" />
                            </div>
                        )}
                        {showAddDialog === 'note' && (
                            <textarea
                                placeholder="اكتب ملاحظتك هنا..."
                                className="w-full h-24 p-3 border rounded-lg text-right resize-none"
                                id="quick-add-note"
                            />
                        )}
                        <Button
                            className="w-full h-12"
                            onClick={() => {
                                const title = (document.getElementById('quick-add-title') as HTMLInputElement)?.value;
                                if (!title && showAddDialog !== 'note') { toast({ title: 'أدخل العنوان' }); return; }

                                let successMsg = '';
                                if (showAddDialog === 'appointment') {
                                    successMsg = 'تم حفظ الموعد';
                                } else if (showAddDialog === 'task') {
                                    successMsg = 'تم حفظ المهمة';
                                } else if (showAddDialog === 'location') {
                                    successMsg = 'تم حفظ الموقع';
                                } else if (showAddDialog === 'shopping') {
                                    successMsg = 'تم إضافة العنصر لقائمة التسوق';
                                } else if (showAddDialog === 'note') {
                                    const note = (document.getElementById('quick-add-note') as HTMLTextAreaElement)?.value || title;
                                    if (!note) { toast({ title: 'أدخل الملاحظة' }); return; }
                                    successMsg = 'تم حفظ الملاحظة';
                                }

                                setShowAddDialog(null);
                                toast({ title: successMsg, description: title || 'تمت الإضافة بنجاح' });
                            }}
                        >
                            <Plus className="w-5 h-5 ml-2" />
                            حفظ
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>

    );
};

export default SmartDashboard;
