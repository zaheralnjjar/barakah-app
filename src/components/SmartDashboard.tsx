import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

// Hooks
import { useDashboardData } from '@/hooks/useDashboardData';
import { useHabits } from '@/hooks/useHabits';
import { useMedications } from '@/hooks/useMedications';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { supabase } from '@/integrations/supabase/client';
import { useLocations } from '@/hooks/useLocations';
import { useShoppingList } from '@/hooks/useShoppingList';
import { useLocationReminders } from '@/hooks/useLocationReminders';
import { searchLocation } from '@/services/GeocodingService';

// Icons
import {
    CalendarPlus, ShoppingCart, DollarSign, FileText, CheckSquare, Target, MapPin,
    GraduationCap, Users
} from 'lucide-react';

import NewMuslimsManager from './NewMuslims/NewMuslimsManager';
import AcademicManager from './AcademicManager';

// Components
import InteractiveMap from '@/components/InteractiveMap';
import AppointmentManager from '@/components/AppointmentManager';
import PomodoroTimer from '@/components/PomodoroTimer';
import { RoutineModesWidget } from './dashboard/RoutineModesWidget';
import DashboardHeader from './dashboard/DashboardHeader';
import DashboardHeaderStrip from './dashboard/DashboardHeaderStrip';
import DashboardStats from './dashboard/DashboardStats';
import QuickActionsGrid from './dashboard/QuickActionsGrid';
import DailyReportCard from './dashboard/DailyReportCard';
import DashboardCalendar from './dashboard/DashboardCalendar';
import { CollapsibleSection } from './dashboard/CollapsibleSection';

// Refactored Widgets
import { DashboardNotes } from './dashboard/widgets/DashboardNotes';
import { DashboardParking } from './dashboard/widgets/DashboardParking';
import { DashboardShopping } from './dashboard/widgets/DashboardShopping';
import { GlobalSearchDialog } from './GlobalSearchDialog';

interface SmartDashboardProps {
    onNavigateToTab: (tabId: string) => void;
    onOpenVoiceRecorder: () => void;
}

const SmartDashboard: React.FC<SmartDashboardProps> = ({ onNavigateToTab, onOpenVoiceRecorder }) => {
    const { toast } = useToast();
    const navigate = useNavigate();

    // Data Hooks
    const {
        financeData, dailyLimitARS, loading: dataLoading,
        prayerTimes = [], refetch
    } = useDashboardData();

    useLocationReminders(); // Activate location tracking

    // Calculate today's expense
    const todayStr = new Date().toISOString().split('T')[0];
    const todayExpense = financeData?.pending_expenses
        ?.filter((t: any) => t.type === 'expense' && t.timestamp && t.timestamp.startsWith(todayStr))
        .reduce((sum: number, t: any) => sum + (t.currency === 'ARS' ? t.amount : t.amount * (financeData?.exchange_rate || 1200)), 0) || 0;

    const { items: shoppingItems, addItem: addShoppingItem } = useShoppingList();
    const { habits } = useHabits();
    const { medications } = useMedications();
    const { tasks, refreshTasks, addTask } = useTasks();
    const { appointments, refreshAppointments } = useAppointments();


    // State
    const [weekStartDate, setWeekStartDate] = useState(new Date());
    const [currentDate] = useState(new Date());
    const [showAddDialog, setShowAddDialog] = useState<'appointment' | 'task' | 'location' | 'shopping' | 'note' | 'expense' | 'goal' | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isParkingSectionOpen, setIsParkingSectionOpen] = useState(false);

    const { saveParking } = useLocations();

    // Shopping Add Form State
    const [shoppingItemName, setShoppingItemName] = useState('');
    const [shoppingItemQuantity, setShoppingItemQuantity] = useState(1);
    const [shoppingItemDeadline, setShoppingItemDeadline] = useState('');

    const handleQuickParking = async () => {
        toast({ title: "جاري حفظ الموقع..." });

        const location = await saveParking();

        if (location) {
            setIsParkingSectionOpen(true);

            // Scroll to parking section smoothly after a brief delay to allow render
            setTimeout(() => {
                const element = document.getElementById('parking-section');
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
        }
    };

    // New Muslims Count (Keep for Badge)
    const [newMuslimsCount, setNewMuslimsCount] = useState(0);
    useEffect(() => {
        const loadNewMuslimsCount = () => {
            try {
                const stored = localStorage.getItem('my_new_muslims_data');
                if (stored) {
                    const data = JSON.parse(stored);
                    if (Array.isArray(data)) setNewMuslimsCount(data.length);
                }
            } catch (e) { console.error(e); }
        };
        loadNewMuslimsCount();
        window.addEventListener('storage', loadNewMuslimsCount);
        return () => window.removeEventListener('storage', loadNewMuslimsCount);
    }, []);

    // Sync to Widget
    useEffect(() => {
        const syncToWidget = async () => {
            try {
                // Dynamic import to avoid SSR/Build issues if any
                const { syncWidgetData } = await import('@/utils/widgetSync');
                await syncWidgetData({
                    tasks, appointments, habits, medications, prayers: prayerTimes,
                    finance: { balance: financeData?.current_balance_ars?.toString() || '0', debt: financeData?.total_debt?.toString() || '0' },
                    shopping: shoppingItems
                });
            } catch (e) { console.error("Widget sync error", e); }
        };
        if (!dataLoading) syncToWidget();
    }, [tasks, appointments, habits, medications, prayerTimes, financeData, shoppingItems, dataLoading]);


    return (
        <div className="min-h-screen bg-gray-50/50 pb-24 animate-fade-in relative w-full max-w-[100vw] overflow-x-hidden">
            {/* 1. Header - Fixed */}
            <DashboardHeader />

            {/* 2. Prayer Times - Always Expanded (in HeaderStrip) */}
            <DashboardHeaderStrip />

            <div className="px-3 sm:px-4 space-y-4 max-w-4xl mx-auto mt-2 w-full">

                {/* 3. Quick Actions Icons - Always Expanded */}
                <QuickActionsGrid
                    onOpenAddDialog={setShowAddDialog}
                    onOpenTimer={() => { }}
                    onOpenVoiceRecorder={onOpenVoiceRecorder}
                    onNavigateToTab={onNavigateToTab}
                    onOpenSearch={() => setIsSearchOpen(true)}
                    onQuickParking={handleQuickParking}
                />

                {/* 4. Financial Summary - Always Expanded */}
                <DashboardStats
                    onNavigateToFinance={() => onNavigateToTab('finance')}
                    todayExpense={todayExpense}
                    dailyLimitARS={dailyLimitARS || 0}
                    financeData={{
                        current_balance_ars: financeData?.current_balance_ars || 0,
                        exchange_rate: financeData?.exchange_rate || 0
                    }}
                    newMuslimsCount={newMuslimsCount}
                />

                {/* 5. Quick Notes - Collapsible */}
                <CollapsibleSection title="الملاحظات السريعة" icon={FileText} defaultOpen={false}>
                    <DashboardNotes />
                </CollapsibleSection>

                {/* Shopping List - Collapsible */}
                {shoppingItems.length > 0 && (
                    <CollapsibleSection title="قائمة التسوق" icon={ShoppingCart} defaultOpen={false} badge={shoppingItems.length}>
                        <DashboardShopping />
                    </CollapsibleSection>
                )}

                {/* 8. Calendar & Appointments - Collapsible */}
                <CollapsibleSection title="التقويم والمواعيد" icon={CalendarPlus} defaultOpen={false}>
                    <DashboardCalendar
                        tasks={tasks}
                        appointments={appointments}
                        habits={habits}
                        medications={medications}
                        prayerTimes={prayerTimes}
                        onNavigateToTab={onNavigateToTab}
                        weekStartDate={weekStartDate}
                        setWeekStartDate={setWeekStartDate}
                        refetch={refetch}
                    />
                </CollapsibleSection>

                {/* 9. Routine Modes - Collapsible */}
                <CollapsibleSection title="الأوضاع الدائمة" icon={Target} defaultOpen={false}>
                    <RoutineModesWidget />
                </CollapsibleSection>

                {/* 10. New Muslims Care - Collapsible */}
                <CollapsibleSection title="رعاية المهتدين" icon={Users} defaultOpen={false} badge={newMuslimsCount > 0 ? newMuslimsCount : undefined}>
                    <NewMuslimsManager />
                </CollapsibleSection>

                {/* 11. Academic Section - Collapsible */}
                <CollapsibleSection title="القسم الأكاديمي" icon={GraduationCap} defaultOpen={false}>
                    <AcademicManager />
                </CollapsibleSection>

                {/* Pomodoro Timer (Hidden Trigger) */}
                <PomodoroTimer hideTrigger={true} />
            </div>

            {/* === DIALOGS === */}

            <GlobalSearchDialog
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onNavigateToTab={onNavigateToTab}
            />

            <Dialog open={showAddDialog !== null} onOpenChange={(open) => {
                if (!open) {
                    if (showAddDialog === 'appointment') refreshAppointments();
                    if (showAddDialog === 'task') refreshTasks();
                    setShowAddDialog(null);
                }
            }}>
                <DialogContent className={showAddDialog === 'appointment' || showAddDialog === 'location' ? 'w-full max-w-3xl max-h-[90vh] overflow-y-auto' : 'w-full max-w-sm'}>
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

                    {showAddDialog === 'task' && (
                        <div className="space-y-4 mt-2 p-1">
                            <div>
                                <label className="text-sm font-medium mb-1 block">عنوان المهمة</label>
                                <Input id="task-title" placeholder="ما الذي تريد إنجازه؟" className="text-right" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">تاريخ الاستحقاق</label>
                                    <Input id="task-date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">الأولوية</label>
                                    <select id="task-priority" className="w-full h-10 border rounded-md px-2 text-right bg-white">
                                        <option value="medium">متوسطة</option>
                                        <option value="high">عالية</option>
                                        <option value="low">منخفضة</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">الموقع (للتذكير الذكي)</label>
                                <Input id="task-location" placeholder="مثال: المنزل، العمل، المتجر..." className="text-right" />
                            </div>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-2" onClick={async () => {
                                const title = (document.getElementById('task-title') as HTMLInputElement).value;
                                const date = (document.getElementById('task-date') as HTMLInputElement).value;
                                const priority = (document.getElementById('task-priority') as HTMLSelectElement).value;
                                const location = (document.getElementById('task-location') as HTMLInputElement).value;

                                if (!title) {
                                    toast({ title: "يرجى إدخال العنوان", variant: "destructive" });
                                    return;
                                }

                                let lat, lon;
                                if (location) {
                                    toast({ title: "جاري البحث عن الموقع..." });
                                    const geo = await searchLocation(location);
                                    if (geo) {
                                        lat = geo.lat;
                                        lon = geo.lon;
                                        toast({ title: "تم تحديد الموقع", description: geo.display_name });
                                    } else {
                                        toast({ title: "لم يتم العثور على الموقع", variant: "destructive" });
                                    }
                                }

                                await addTask({
                                    title,
                                    deadline: date || new Date().toISOString().split('T')[0],
                                    priority: priority as any,
                                    type: 'task',
                                    location: location || undefined,
                                    latitude: lat,
                                    longitude: lon
                                });
                                setShowAddDialog(null);
                            }}>
                                <CheckSquare className="w-4 h-4 ml-2" /> إضافة المهمة
                            </Button>
                        </div>
                    )}

                    {showAddDialog === 'location' && (
                        <div className="pb-24 space-y-4 md:space-y-6">
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
                            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                                <button
                                    onClick={() => (document.getElementById('expense-type') as HTMLInputElement).value = 'expense'}
                                    className="flex-1 py-2.5 px-4 rounded-md flex items-center justify-center gap-2 transition-all bg-red-500 text-white shadow-md"
                                >
                                    <span className="font-medium">مصروف</span>
                                </button>
                                <button
                                    onClick={() => (document.getElementById('expense-type') as HTMLInputElement).value = 'income'}
                                    className="flex-1 py-2.5 px-4 rounded-md flex items-center justify-center gap-2 transition-all bg-transparent text-gray-600 hover:bg-gray-200"
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

                                    if (!currentData) { toast({ title: 'لا توجد بيانات' }); return; }

                                    const isExpense = type === 'expense';
                                    let balanceARS = currentData.current_balance_ars || 0;
                                    let balanceUSD = currentData.current_balance_usd || 0;

                                    if (currency === 'ARS') balanceARS += isExpense ? -amount : amount;
                                    else balanceUSD += isExpense ? -amount : amount;

                                    const newExpense = {
                                        id: Date.now(),
                                        amount, currency, type, category,
                                        description: desc || (isExpense ? 'مصروف سريع' : 'دخل'),
                                        timestamp: new Date().toISOString(),
                                        source: 'dashboard_quick_add'
                                    };

                                    const { error } = await supabase
                                        .from('finance_data_2025_12_18_18_42')
                                        .update({
                                            current_balance_ars: balanceARS,
                                            current_balance_usd: balanceUSD,
                                            pending_expenses: [...(currentData.pending_expenses || []), newExpense],
                                            updated_at: new Date().toISOString()
                                        })
                                        .eq('user_id', user.id);

                                    if (error) throw error;
                                    toast({ title: 'تمت العملية بنجاح! 💰' });
                                    if (refetch) refetch();
                                    setShowAddDialog(null);
                                } catch (e) {
                                    console.error(e);
                                    toast({ title: 'حدث خطأ', variant: 'destructive' });
                                }
                            }}>
                                حفظ العملية
                            </Button>
                        </div>
                    )}

                    {showAddDialog === 'note' && (
                        <div className="space-y-4 mt-2">
                            <Input id="note-title" placeholder="عنوان الملاحظة" className="text-right" />
                            <div className="min-h-[100px] p-2 border rounded-md" contentEditable id="note-content"></div>
                            <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black" onClick={() => {
                                const content = document.getElementById('note-content')?.innerText;
                                if (content) {
                                    // Normally we would use useQuickNotes hook addNote here, 
                                    // but hook logic might be simpler. For now just toast.
                                    toast({ title: '⚠️ يرجى استخدام قسم الملاحظات للإضافة' });
                                }
                                setShowAddDialog(null);
                            }}>حفظ الملاحظة</Button>
                        </div>
                    )}

                    {showAddDialog === 'shopping' && (
                        <div className="space-y-4 py-2">
                            <div>
                                <label className="text-sm text-gray-600 block mb-1">اسم المنتج</label>
                                <Input
                                    placeholder="مثال: حليب، خبز..."
                                    value={shoppingItemName}
                                    onChange={(e) => setShoppingItemName(e.target.value)}
                                    className="text-right"
                                    onKeyPress={async (e) => {
                                        if (e.key === 'Enter' && shoppingItemName.trim()) {
                                            await addShoppingItem({ text: shoppingItemName, quantity: shoppingItemQuantity, deadline: shoppingItemDeadline || undefined });
                                            toast({ title: '✅ تمت الإضافة', description: shoppingItemName });
                                            setShoppingItemName(''); setShoppingItemQuantity(1); setShoppingItemDeadline('');
                                        }
                                    }}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm text-gray-600 block mb-1">الكمية</label>
                                    <Input type="number" min={1} value={shoppingItemQuantity} onChange={(e) => setShoppingItemQuantity(Number(e.target.value))} className="text-center" />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600 block mb-1">مطلوب قبل (اختياري)</label>
                                    <Input type="date" value={shoppingItemDeadline} onChange={(e) => setShoppingItemDeadline(e.target.value)} />
                                </div>
                            </div>
                            <Button
                                onClick={async () => {
                                    if (!shoppingItemName.trim()) return;
                                    await addShoppingItem({ text: shoppingItemName, quantity: shoppingItemQuantity, deadline: shoppingItemDeadline || undefined });
                                    toast({ title: '✅ تمت الإضافة', description: shoppingItemName });
                                    setShoppingItemName(''); setShoppingItemQuantity(1); setShoppingItemDeadline('');
                                }}
                                className="w-full bg-pink-500 hover:bg-pink-600"
                            >
                                <ShoppingCart className="w-4 h-4 ml-2" /> إضافة للقائمة
                            </Button>
                        </div>
                    )}

                    {showAddDialog === 'goal' && <div className="text-center p-4">إضافة هدف جديد (قريباً).</div>}
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default SmartDashboard;
