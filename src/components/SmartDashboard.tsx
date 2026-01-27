import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useNavigate } from "react-router-dom";
import { useOutletContext } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";

// Hooks
import { useDashboardData } from '@/hooks/useDashboardData';
import { useMedications } from '@/hooks/useMedications';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { useAppointments } from '@/hooks/useAppointments';
import { useFinance } from '@/hooks/useFinance';
import { useShoppingList } from '@/hooks/useShoppingList';
import { useLocations } from '@/hooks/useLocations';
import { cn } from '@/lib/utils';
import { isAndroid } from '@/utils/platformDetection';
import { useLocationReminders } from '@/hooks/useLocationReminders';
import { useNotesV2 } from '@/hooks/useNotesV2';
import { searchLocation } from '@/services/GeocodingService';

import {
    CalendarPlus, ShoppingCart, DollarSign, FileText, CheckSquare, Target, MapPin,
    Users, LayoutGrid, Calendar as CalendarIcon, Pill, Wallet, TrendingUp, Info, Sparkles, Trash2, Plus, Zap
} from 'lucide-react';

import { useShortcuts } from '@/hooks/useShortcuts';
import { useShortcutExecution } from '@/hooks/useShortcutExecution';
import NewMuslimsManager from './NewMuslims/NewMuslimsManager';
import InteractiveMap from '@/components/InteractiveMap';
import AppointmentManager from '@/components/AppointmentManager';
import PomodoroTimer from '@/components/PomodoroTimer';
import DashboardHeader from './dashboard/DashboardHeader';
import DashboardHeaderStrip from './dashboard/DashboardHeaderStrip';
import QuickActionsGridV2 from './dashboard/QuickActionsGridV2';

import { DashboardShopping } from './dashboard/widgets/DashboardShopping';
import { DashboardLocations } from './dashboard/DashboardLocations';
import { DashboardParking } from './dashboard/widgets/DashboardParking';
import { GlobalSearchDialog } from './GlobalSearchDialog';
import { QuickNoteDialog } from '@/components/notes-v2/QuickNoteDialog';
import { Badge } from '@/components/ui/badge';
import { getActionById, AVAILABLE_ACTIONS } from '@/constants/actionDefinitions';
import FlashlightOverlay from './FlashlightOverlay';
import { ShortcutDialogs } from './dialogs/ShortcutDialogs';

interface SmartDashboardProps {
    onNavigateToTab: (tabId: string) => void;
    onOpenVoiceRecorder: () => void;
}

type AddDialogType = 'appointment' | 'task' | 'location' | 'shopping' | 'note' | 'expense' | 'goal' | 'medication' | 'habit' | 'project';

const SmartDashboard: React.FC<SmartDashboardProps> = ({ onNavigateToTab, onOpenVoiceRecorder }) => {
    const { toast } = useToast();
    const navigate = useNavigate();

    useLocationReminders(); // Activate location tracking
    const { financeData, dailyLimit: dailyLimitARS, addTransaction } = useFinance();
    const { items: shoppingItems, addItem: addShoppingItem } = useShoppingList();
    const { habits, addHabit } = useHabits();
    const { medications, addMedication } = useMedications();
    const { tasks, refreshTasks, addTask } = useTasks();
    const { appointments, refreshAppointments } = useAppointments();
    const { notes, createNote } = useNotesV2();
    const { locations, saveParking } = useLocations();

    // State
    const [weekStartDate, setWeekStartDate] = useState(new Date());
    const [currentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [showAddDialog, setShowAddDialog] = useState<AddDialogType | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isParkingSectionOpen, setIsParkingSectionOpen] = useState(false);
    const [showNewMuslimsDialog, setShowNewMuslimsDialog] = useState(false);
    const [activeWidgets, setActiveWidgets] = useState<string[]>([]);
    const [routineVisibleSections, setRoutineVisibleSections] = useState<string[]>(['notes', 'shopping', 'calendar']);
    const { activeTab } = useOutletContext<{ activeTab: string }>();

    const { executeShortcut, shortcutResult, setShortcutResult } = useShortcutExecution({
        onOpenAddDialog: setShowAddDialog,
        onOpenVoiceRecorder,
        onNavigateToTab,
        onOpenNewMuslims: () => setShowNewMuslimsDialog(true),
        onOpenTimer: () => window.dispatchEvent(new Event('openPomodoroDialog'))
    });

    // Close full-screen dialogs when tab changes or moves away from dashboard
    useEffect(() => {
        const handleGlobalNav = () => {
            setShowNewMuslimsDialog(false);
            setShowAddDialog(null);
        };
        window.addEventListener('global-nav-change', handleGlobalNav);
        return () => window.removeEventListener('global-nav-change', handleGlobalNav);
    }, []);

    // Calculate dynamic stats
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthStr = todayStr.substring(0, 7);

    const transactions = financeData?.pending_expenses || [];

    const todayExpense = transactions
        ?.filter((t: any) => t.type === 'expense' && t.timestamp && t.timestamp.startsWith(todayStr))
        .reduce((sum: number, t: any) => sum + (t.currency === 'ARS' ? t.amount : t.amount * (financeData?.exchange_rate || 1200)), 0) || 0;

    const monthlyTotalSpent = transactions
        ?.filter((t: any) => t.type === 'expense' && t.timestamp && t.timestamp.startsWith(currentMonthStr))
        .reduce((sum: number, t: any) => sum + (t.currency === 'ARS' ? t.amount : t.amount * (financeData?.exchange_rate || 1200)), 0) || 0;

    const monthlyIncome = transactions
        ?.filter((t: any) => t.type === 'income' && t.timestamp && t.timestamp.startsWith(currentMonthStr))
        .reduce((sum: number, t: any) => sum + (t.currency === 'ARS' ? t.amount : t.amount * (financeData?.exchange_rate || 1200)), 0) || 0;

    const monthlySavings = Math.max(0, monthlyIncome - monthlyTotalSpent);

    // Routines logic
    useEffect(() => {
        const applyRoutineSettings = () => {
            try {
                const activeRoutinesStr = localStorage.getItem('baraka_active_routines');
                const routinesStr = localStorage.getItem('baraka_routines');
                if (activeRoutinesStr && routinesStr) {
                    const activeRoutines = JSON.parse(activeRoutinesStr);
                    const routines = JSON.parse(routinesStr);
                    if (activeRoutines.length > 0) {
                        const activeRoutine = routines.find((r: any) => r.id === activeRoutines[0].routineId);
                        if (activeRoutine?.settings) {
                            setRoutineVisibleSections(activeRoutine.settings.visibleSections || ['notes', 'shopping', 'calendar']);
                            setActiveWidgets(activeRoutine.settings.activeWidgets || []);
                        }
                    } else {
                        setRoutineVisibleSections(['notes', 'shopping', 'calendar']);
                    }
                }
            } catch (e) { console.error(e); }
        };
        applyRoutineSettings();
        window.addEventListener('routines-updated', applyRoutineSettings);

        const handleSaveParking = () => saveParking();
        const handleFindParking = () => {
            const parking = locations.find(l => l.type === 'parking');
            if (parking) {
                window.open(parking.url, '_blank');
            } else {
                toast({ title: 'خطأ', description: 'لم يتم العثور على موقع سيارة محفوظ', variant: 'destructive' });
            }
        };

        window.addEventListener('save-parking', handleSaveParking);
        window.addEventListener('find-parking', handleFindParking);

        const handleExecuteShortcut = (e: any) => {
            if (e.detail) executeShortcut(e.detail);
        };
        window.addEventListener('execute-shortcut', handleExecuteShortcut);

        return () => {
            window.removeEventListener('execute-shortcut', handleExecuteShortcut);
            window.removeEventListener('routines-updated', applyRoutineSettings);
            window.removeEventListener('save-parking', handleSaveParking);
            window.removeEventListener('find-parking', handleFindParking);
        };
    }, [saveParking, locations]);

    // Listen for custom shortcut events
    const [quickNoteTag, setQuickNoteTag] = useState<string | undefined>(undefined);

    useEffect(() => {
        const handleOpenQuickNote = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            setQuickNoteTag(detail?.tag || (detail?.type === 'brain_dump' ? 'تفريغ' : undefined));
            setShowAddDialog('note');
        };

        window.addEventListener('open-quick-note', handleOpenQuickNote);

        return () => {
            window.removeEventListener('open-quick-note', handleOpenQuickNote);
        }
    }, []);

    const [isCleanMode, setIsCleanMode] = useState(false);

    // ... existing shortcuts hook ...
    const {
        customShortcuts,
        customLocations,
        addShortcut,
        removeShortcut
    } = useShortcuts();

    const [showShortcutsSettings, setShowShortcutsSettings] = useState(false);


    // Shopping state
    const [shoppingItemName, setShoppingItemName] = useState('');
    const [shoppingItemQuantity, setShoppingItemQuantity] = useState(1);
    const [shoppingItemDeadline, setShoppingItemDeadline] = useState('');

    return (
        <div className={cn(
            "min-h-screen bg-transparent pb-32 animate-fade-in relative w-full max-w-[100vw] overflow-y-auto"
        )}>
            <DashboardHeader />
            <FlashlightOverlay />

            <div className="mx-[2%] mt-0.5 w-[96%]">
                <div className={cn("flex flex-col gap-2", activeWidgets.length > 0 && 'lg:flex-row-reverse', !isAndroid() && "gap-1")}>
                    <div className={cn(activeWidgets.length > 0 ? 'w-full lg:w-[70%]' : 'w-full', isAndroid() ? "space-y-1.5" : "space-y-1")}>
                        <DashboardHeaderStrip />

                        {/* Quick Access Grid - Sky Identity - MOVED UP */}
                        <div className="bg-sky-50/40 border border-sky-100 rounded-3xl p-1.5 shadow-sm mb-1.5 transition-all">
                            <QuickActionsGridV2
                                onOpenAddDialog={setShowAddDialog}
                                onOpenTimer={() => window.dispatchEvent(new Event('openPomodoroDialog'))}
                                onOpenVoiceRecorder={onOpenVoiceRecorder}
                                onNavigateToTab={onNavigateToTab}
                                onOpenNewMuslims={() => setShowNewMuslimsDialog(true)}
                                onOpenShortcuts={() => setShowShortcutsSettings(true)}
                                onOpenSearch={() => setIsSearchOpen(true)}
                                isCleanMode={isCleanMode}
                                onToggleCleanMode={() => setIsCleanMode(prev => !prev)}
                            />
                        </div>

                        {/* Financial Summary - Emerald Identity */}
                        <div className="bg-emerald-50/80 border border-emerald-200 rounded-3xl p-3 px-4 shadow-sm space-y-2 mb-1.5 transition-all">
                            <div className="flex justify-between items-center border-b border-emerald-100 pb-1.5">
                                <div className="flex items-center gap-2.5">
                                    <div className="bg-emerald-100 p-1.5 rounded-full">
                                        <Wallet className="w-4 h-4 text-emerald-700" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 md:gap-3">
                                    <span className="text-[10px] md:text-sm font-bold text-emerald-800/60">ARS</span>
                                    <span className="text-sm md:text-2xl font-mono font-black text-emerald-700">{financeData?.current_balance_ars?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex items-center gap-1.5 md:gap-3 border-l border-emerald-200/50 pl-2 md:pl-4">
                                    <span className="text-[10px] md:text-sm font-bold text-emerald-800/60">USD</span>
                                    <span className="text-sm md:text-2xl font-mono font-black text-emerald-700">{financeData?.current_balance_usd?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex items-center gap-1.5 md:gap-3 border-l border-emerald-200/50 pl-2 md:pl-4">
                                    <div className="bg-blue-100 p-1 md:p-1.5 rounded-full">
                                        <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                                    </div>
                                    <span className="text-[10px] md:text-xl font-black text-blue-700">{monthlySavings?.toLocaleString() || 0}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col">
                                        <span className="text-[7px] md:text-[10px] text-gray-400 font-bold">المتبقي اليومي</span>
                                        <span className="text-[10px] md:text-lg font-mono font-bold text-emerald-700">{dailyLimitARS?.toLocaleString() || 0}</span>
                                        <span className="text-[6.5px] md:text-[9px] font-bold text-emerald-900/30 -mt-0.5 leading-none">{((dailyLimitARS || 0) / (financeData?.exchange_rate || 1000)).toFixed(1)}</span>
                                    </div>
                                    <div className="flex flex-col border-r border-emerald-100/30 pr-2 md:pr-4">
                                        <span className="text-[7px] md:text-[10px] text-gray-400 font-bold">مصروف اليوم</span>
                                        <span className="text-[10px] md:text-lg font-mono font-bold text-red-500">{todayExpense?.toLocaleString() || 0}</span>
                                        <span className="text-[6.5px] md:text-[9px] font-bold text-red-900/30 -mt-0.5 leading-none">{((todayExpense || 0) / (financeData?.exchange_rate || 1000)).toFixed(1)}</span>
                                    </div>
                                    <div className="flex flex-col border-r border-emerald-100/30 pr-2 md:pr-4">
                                        <span className="text-[7px] md:text-[10px] text-gray-400 font-bold">إجمالي الشهر</span>
                                        <span className="text-[10px] md:text-lg font-mono font-bold text-indigo-600">{monthlyTotalSpent?.toLocaleString() || 0}</span>
                                        <span className="text-[6.5px] md:text-[9px] font-bold text-indigo-900/30 -mt-0.5 leading-none">{((monthlyTotalSpent || 0) / (financeData?.exchange_rate || 1000)).toFixed(1)}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-[7px] text-gray-400 font-bold uppercase">Rate</span>
                                    <div className="flex items-center gap-1">
                                        <Info className="w-2.5 h-2.5 text-emerald-400" />
                                        <span className="text-[9px] font-bold text-emerald-600">{financeData?.exchange_rate || 1200}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DashboardLocations - Conditionally Hidden in Clean Mode */}
                        {!isCleanMode && <DashboardLocations />}



                        {/* Shortcut Result Dialog */}
                        <Dialog open={shortcutResult !== null} onOpenChange={(open) => { if (!open) setShortcutResult(null); }}>
                            <DialogContent className="sm:max-w-md" dir="rtl">
                                <DialogHeader>
                                    <DialogTitle className="text-right text-lg border-b pb-2 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-emerald-500" />
                                        {shortcutResult?.title}
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="whitespace-pre-wrap text-right text-sm text-gray-700 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    {shortcutResult?.content}
                                </div>
                                <Button onClick={() => setShortcutResult(null)} className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                                    إغلاق
                                </Button>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* DashboardShopping removed - was linking to shopping list */}

                    <PomodoroTimer hideTrigger={true} />
                </div>

                {activeWidgets.length > 0 && (
                    <aside className="w-full lg:w-[30%] lg:sticky lg:top-4 lg:self-start mt-2">
                        <div className="bg-white border-2 border-teal-100 rounded-2xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-left-5">
                            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-3 flex items-center justify-between">
                                <span className="text-white text-sm font-bold flex items-center gap-2">
                                    <LayoutGrid className="w-4 h-4" /> أدواتك ({activeWidgets.length})
                                </span>
                                <Button variant="ghost" size="sm" onClick={() => setActiveWidgets([])} className="text-white hover:bg-white/20 h-6 px-2 text-[10px]">إغلاق ✕</Button>
                            </div>
                            <iframe src={`${window.location.pathname}#/widget?type=${activeWidgets.join(',')}`} className="w-full border-0 h-[400px]" title="Active Widgets" />
                        </div>
                    </aside>
                )}
            </div>

            {/* Dialogs */}
            <GlobalSearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onNavigateToTab={onNavigateToTab} onOpenNewMuslims={() => setShowNewMuslimsDialog(true)} />
            <QuickNoteDialog isOpen={showAddDialog === 'note'} onClose={() => setShowAddDialog(null)} />

            <Dialog open={showAddDialog !== null && showAddDialog !== 'note'} onOpenChange={(open) => {
                if (!open) {
                    if (showAddDialog === 'appointment') refreshAppointments();
                    if (showAddDialog === 'task') refreshTasks();
                    setShowAddDialog(null);
                }
            }}>
                <DialogContent className={cn(
                    "max-h-[85vh] overflow-y-auto p-0 border-none shadow-2xl rounded-[2rem]",
                    (showAddDialog === 'appointment' || showAddDialog === 'location') ? 'sm:max-w-2xl w-[92%]' : 'sm:max-w-sm w-[90%]'
                )} dir="rtl">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="text-right flex items-center gap-3 text-xl font-black">
                            {showAddDialog === 'appointment' && <div className="bg-orange-100 p-2 rounded-2xl"><CalendarPlus className="w-6 h-6 text-orange-600" /></div>}
                            {showAddDialog === 'task' && <div className="bg-blue-100 p-2 rounded-2xl"><CheckSquare className="w-6 h-6 text-blue-600" /></div>}
                            {showAddDialog === 'location' && <div className="bg-green-100 p-2 rounded-2xl"><MapPin className="w-6 h-6 text-green-600" /></div>}
                            {showAddDialog === 'shopping' && <div className="bg-pink-100 p-2 rounded-2xl"><ShoppingCart className="w-6 h-6 text-pink-600" /></div>}
                            {showAddDialog === 'expense' && <div className="bg-red-100 p-2 rounded-2xl"><DollarSign className="w-6 h-6 text-red-600" /></div>}
                            {showAddDialog === 'goal' && <div className="bg-purple-100 p-2 rounded-2xl"><Target className="w-6 h-6 text-purple-600" /></div>}
                            <span className="tracking-tight">
                                {showAddDialog === 'appointment' && 'حجز موعد جديد'}
                                {showAddDialog === 'task' && 'إضافة مهمة'}
                                {showAddDialog === 'location' && 'حفظ موقع'}
                                {showAddDialog === 'shopping' && 'قائمة التسوق'}
                                {showAddDialog === 'expense' && 'تسجيل معاملة'}
                                {showAddDialog === 'goal' && 'تحديد هدف'}
                                {showAddDialog === 'medication' && 'إضافة دواء'}
                                {showAddDialog === 'habit' && 'إضافة عادة'}
                                {showAddDialog === 'project' && 'مشروع جديد'}
                            </span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6 pt-4">
                        {showAddDialog === 'appointment' && <AppointmentManager />}
                        {showAddDialog === 'task' && (
                            <div className="space-y-4">
                                <Input id="task-title" placeholder="عنوان المهمة" className="text-right" />
                                <div className="grid grid-cols-2 gap-2">
                                    <Input id="task-date" type="date" defaultValue={todayStr} />
                                    <select id="task-priority" className="border rounded-md px-2 bg-white">
                                        <option value="medium">متوسطة</option>
                                        <option value="high">عالية</option>
                                        <option value="low">منخفضة</option>
                                    </select>
                                </div>
                                <Button className="w-full bg-blue-600 font-bold py-6 text-lg rounded-2xl shadow-lg active:scale-95 transition-transform" onClick={async () => {
                                    const title = (document.getElementById('task-title') as HTMLInputElement).value;
                                    if (!title) return;
                                    await addTask({ title, deadline: (document.getElementById('task-date') as HTMLInputElement).value || todayStr, priority: (document.getElementById('task-priority') as HTMLSelectElement).value as any, type: 'task' });
                                    toast({ title: 'تمت إضافة المهمة' });
                                    setShowAddDialog(null);
                                }}>حفظ المهمة</Button>
                            </div>
                        )}
                        {showAddDialog === 'location' && <div className="h-[400px]"><InteractiveMap /></div>}
                        {showAddDialog === 'expense' && (
                            <div className="space-y-4">
                                <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
                                    <Button
                                        id="btn-expense"
                                        onClick={() => (document.getElementById('exp-type') as HTMLInputElement).value = 'expense'}
                                        className="flex-1 bg-transparent text-gray-600 hover:bg-white/50 border-none shadow-none font-bold py-2 h-10 data-[active=true]:bg-red-500 data-[active=true]:text-white data-[active=true]:shadow-md"
                                        data-active="true"
                                    >مصروف</Button>
                                    <Button
                                        id="btn-income"
                                        onClick={() => (document.getElementById('exp-type') as HTMLInputElement).value = 'income'}
                                        className="flex-1 bg-transparent text-gray-600 hover:bg-white/50 border-none shadow-none font-bold py-2 h-10 data-[active=true]:bg-emerald-500 data-[active=true]:text-white data-[active=true]:shadow-md"
                                    >دخل</Button>
                                </div>
                                <input type="hidden" id="exp-type" defaultValue="expense" />

                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 px-1">المبلغ</label>
                                            <Input id="exp-amount" type="number" placeholder="0.00" className="text-center font-mono text-xl py-6 rounded-2xl border-2 border-gray-100 focus:border-red-200 transition-all" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 px-1">العملة</label>
                                            <select id="exp-currency" className="w-full h-[52px] border-2 border-gray-100 rounded-2xl px-2 font-bold bg-white text-center focus:border-red-200 transition-all">
                                                <option value="ARS">ARS</option>
                                                <option value="USD">USD</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 px-1">الفئة</label>
                                        <select id="exp-category" className="w-full h-12 border-2 border-gray-100 rounded-2xl px-4 font-bold bg-white focus:border-red-200 transition-all">
                                            {(document.getElementById('exp-type') as HTMLInputElement)?.value === 'income'
                                                ? ['راتب', 'منحة', 'استثمار', 'هدية', 'أخرى'].map(c => <option key={c} value={c}>{c}</option>)
                                                : ['طعام', 'سكن', 'نقل', 'ترفيه', 'صحة', 'تعليم', 'أخرى'].map(c => <option key={c} value={c}>{c}</option>)
                                            }
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 px-1">الوصف</label>
                                        <Input id="exp-desc" placeholder="عن ماذا كانت المعاملة؟" className="h-12 rounded-2xl border-2 border-gray-100 px-4 focus:border-red-200 transition-all" />
                                    </div>
                                </div>

                                <Button className="w-full bg-emerald-700 text-white font-black py-7 rounded-2xl shadow-xl active:scale-95 transition-all text-lg mt-2" onClick={async () => {
                                    const amount = parseFloat((document.getElementById('exp-amount') as HTMLInputElement).value);
                                    if (!amount) return;
                                    const type = (document.getElementById('exp-type') as HTMLInputElement).value as any;
                                    const currency = (document.getElementById('exp-currency') as HTMLSelectElement).value as any;
                                    const category = (document.getElementById('exp-category') as HTMLSelectElement).value;
                                    const description = (document.getElementById('exp-desc') as HTMLInputElement).value || 'معاملة سريعة';

                                    await addTransaction({ amount, type, currency, category, description });
                                    setShowAddDialog(null);
                                }}>حفظ المعاملة</Button>
                            </div>
                        )}
                        {showAddDialog === 'shopping' && (
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 px-1">اسم المنتج</label>
                                        <Input placeholder="مثلاً: خبز، حليب..." value={shoppingItemName} onChange={e => setShoppingItemName(e.target.value)} className="h-12 rounded-2xl border-2 border-gray-100 px-4 focus:border-pink-200 transition-all font-bold" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 px-1">الكمية</label>
                                            <Input type="number" min="0.1" step="0.1" value={shoppingItemQuantity} onChange={e => setShoppingItemQuantity(parseFloat(e.target.value))} className="h-12 rounded-2xl border-2 border-gray-100 text-center font-bold focus:border-pink-200 transition-all" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 px-1">الوحدة</label>
                                            <select id="shop-unit" className="w-full h-12 border-2 border-gray-100 rounded-2xl px-2 font-bold bg-white text-center focus:border-pink-200 transition-all">
                                                <option value="unit">وحدة</option>
                                                <option value="kg">كيلو</option>
                                                <option value="gram">جرام</option>
                                                <option value="liter">لتر</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <Button className="w-full bg-pink-600 text-white font-black py-7 rounded-2xl shadow-xl active:scale-95 transition-all text-lg" onClick={async () => {
                                    if (!shoppingItemName) return;
                                    const unit = (document.getElementById('shop-unit') as HTMLSelectElement).value as any;
                                    await addShoppingItem({ text: shoppingItemName, quantity: shoppingItemQuantity, unit });
                                    setShoppingItemName('');
                                    setShoppingItemQuantity(1);
                                    setShowAddDialog(null);
                                    toast({ title: '🛒 تمت الإضافة للقائمة' });
                                }}>إضافة للقائمة</Button>
                            </div>
                        )}

                        {showAddDialog === 'medication' && (
                            <div className="space-y-4">
                                <Input id="med-name" placeholder="اسم الدواء" className="text-right" />
                                <Input id="med-time" placeholder="الوقت (مثلاً: 08:00)" className="text-right" />
                                <Button className="w-full bg-teal-600 font-bold py-6 rounded-2xl" onClick={async () => {
                                    const name = (document.getElementById('med-name') as HTMLInputElement).value;
                                    const time = (document.getElementById('med-time') as HTMLInputElement).value;
                                    if (!name) return;
                                    await addMedication({
                                        name,
                                        time: time || '08:00',
                                        frequency: 'daily',
                                        customDays: [],
                                        startDate: new Date().toISOString().split('T')[0],
                                        endDate: '',
                                        isPermanent: true,
                                        reminder: true
                                    });
                                    setShowAddDialog(null);
                                }}>حفظ الدواء</Button>
                            </div>
                        )}

                        {showAddDialog === 'habit' && (
                            <div className="space-y-4">
                                <Input id="habit-title" placeholder="اسم العادة" className="text-right" />
                                <Button className="w-full bg-emerald-600 font-bold py-6 rounded-2xl" onClick={async () => {
                                    const name = (document.getElementById('habit-title') as HTMLInputElement).value;
                                    if (!name) return;
                                    await addHabit(name, 'daily');
                                    setShowAddDialog(null);
                                }}>حفظ العادة</Button>
                            </div>
                        )}

                        {showAddDialog === 'project' && (
                            <div className="space-y-4">
                                <Input id="proj-title" placeholder="اسم المشروع" className="text-right" />
                                <Button className="w-full bg-indigo-600 font-bold py-6 rounded-2xl" onClick={async () => {
                                    const title = (document.getElementById('proj-title') as HTMLInputElement).value;
                                    if (!title) return;
                                    await addTask({
                                        title,
                                        deadline: new Date().toISOString().split('T')[0],
                                        priority: 'medium',
                                        type: 'project'
                                    });
                                    setShowAddDialog(null);
                                }}>بدء المشروع</Button>
                            </div>
                        )}
                        {showAddDialog === 'goal' && (
                            <div className="space-y-4">
                                <Input id="goal-title" placeholder="اسم الهدف 🎯" className="text-right h-12 rounded-xl" />
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-400 px-1">تاريخ التحقيق</label>
                                    <Input id="goal-deadline" type="date" className="text-right h-12 rounded-xl" defaultValue={todayStr} />
                                </div>
                                <Button className="w-full bg-purple-600 hover:bg-purple-700 font-bold py-6 rounded-2xl text-lg shadow-lg active:scale-95 transition-all" onClick={async () => {
                                    const title = (document.getElementById('goal-title') as HTMLInputElement).value;
                                    const deadline = (document.getElementById('goal-deadline') as HTMLInputElement).value;
                                    if (!title) return;

                                    await addTask({
                                        title,
                                        deadline: deadline || todayStr,
                                        priority: 'high',
                                        type: 'goal'
                                    } as any); // Type cast if 'goal' isn't yet in MainTask type definition, but DB will accept text

                                    toast({ title: 'تمت إضافة الهدف بنجاح 🎯' });
                                    setShowAddDialog(null);
                                }}>حفظ الهدف</Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showShortcutsSettings} onOpenChange={setShowShortcutsSettings}>
                <DialogContent dir="rtl" className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>إدارة الاختصارات</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-3 gap-2 mt-4">
                        {AVAILABLE_ACTIONS.map(a => (
                            <Button key={a.id} variant={customShortcuts.includes(a.id) ? "secondary" : "outline"} onClick={() => customShortcuts.includes(a.id) ? removeShortcut(a.id) : addShortcut(a.id)} className="text-[10px] h-auto py-2 flex-col gap-1">
                                <a.icon className="w-4 h-4" /> {a.name}
                            </Button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {showNewMuslimsDialog && (
                <div className="fixed inset-0 lg:right-16 z-[100] bg-white flex flex-col">
                    <div className="p-4 border-b flex justify-between bg-emerald-50">
                        <h2 className="font-bold flex items-center gap-2"><Users className="w-5 h-5" /> هداية</h2>
                        <Button variant="ghost" onClick={() => setShowNewMuslimsDialog(false)}>إغلاق ✕</Button>
                    </div>
                    <div className="flex-1 overflow-y-auto"><NewMuslimsManager /></div>
                </div>
            )}

            {/* Dynamic Tools/Widgets Section - Shown as separate blocks directly below */}
            {activeWidgets.length > 0 && (
                <div className="mx-[2%] mt-2 space-y-4 pb-20">
                    {activeWidgets.map(type => (
                        <div key={type} className="relative bg-white rounded-3xl border border-teal-100/50 shadow-sm overflow-hidden">
                            <div className="flex justify-between items-center p-3 bg-teal-50/30 border-b border-teal-50/50">
                                <span className="text-xs font-black text-teal-800 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                    {type === 'finance' && 'الملخص المالي'}
                                    {type === 'prayer' && 'أوقات الصلاة'}
                                    {type === 'tasks' && 'المهام'}
                                    {type === 'appointments' && 'المواعيد'}
                                    {type === 'habits' && 'العادات'}
                                    {type === 'medications' && 'الأدوية'}
                                    {type === 'locations' && 'المواقع'}
                                    {type === 'shopping' && 'قائمة التسوق'}
                                    {!['finance', 'prayer', 'tasks', 'appointments', 'habits', 'medications', 'locations', 'shopping'].includes(type) && type}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setActiveWidgets(activeWidgets.filter(w => w !== type))}
                                    className="h-6 w-6 p-0 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-full"
                                >
                                    ✕
                                </Button>
                            </div>
                            <div className="w-full">
                                <iframe
                                    src={`${window.location.pathname}#/widget?type=${type}`}
                                    className="w-full border-0 h-[300px]"
                                    title={`Widget ${type}`}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Parking Section - Move to bottom */}
            <div className="mx-[2%] mt-2 mb-20">
                <DashboardParking />
            </div>

            {/* Shortcut Dialogs */}
            <ShortcutDialogs />

            <QuickNoteDialog
                isOpen={showAddDialog === 'note'}
                onClose={() => setShowAddDialog(null)}
                defaultTag={quickNoteTag}
            />

            <GlobalSearchDialog
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />
        </div>
    );
};

export default SmartDashboard;
