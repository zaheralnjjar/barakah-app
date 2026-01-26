import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

// Hooks
import { useDashboardData } from '@/hooks/useDashboardData';
import { useHabits } from '@/hooks/useHabits';
import { cn } from '@/lib/utils';
import { isAndroid } from '@/utils/platformDetection';
import { useMedications } from '@/hooks/useMedications';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { supabase } from '@/integrations/supabase/client';
import { useLocations } from '@/hooks/useLocations';
import { useShoppingList } from '@/hooks/useShoppingList';
import { useLocationReminders } from '@/hooks/useLocationReminders';
import { useNotesV2 } from '@/hooks/useNotesV2';
import { searchLocation } from '@/services/GeocodingService';

import {
    CalendarPlus, ShoppingCart, DollarSign, FileText, CheckSquare, Target, MapPin,
    Users, LayoutGrid, Calendar as CalendarIcon, Pill, Wallet, TrendingUp, Info, Sparkles, Trash2, Plus, Zap
} from 'lucide-react';

import { useShortcutExecution } from '@/hooks/useShortcutExecution';

import NewMuslimsManager from './NewMuslims/NewMuslimsManager';
import InteractiveMap from '@/components/InteractiveMap';
import AppointmentManager from '@/components/AppointmentManager';
import PomodoroTimer from '@/components/PomodoroTimer';
import DashboardHeader from './dashboard/DashboardHeader';
import DashboardHeaderStrip from './dashboard/DashboardHeaderStrip';
import { QuickActionsGridV2 } from './dashboard/QuickActionsGridV2';
import { QuadrantShortcutsV3 } from './dashboard/QuadrantShortcutsV3';
import { DashboardShopping } from './dashboard/widgets/DashboardShopping';
import { DashboardParking } from './dashboard/widgets/DashboardParking';
import { GlobalSearchDialog } from './GlobalSearchDialog';
import { QuickNoteDialog } from '@/components/notes-v2/QuickNoteDialog';
import { Badge } from '@/components/ui/badge';
import { getActionById, AVAILABLE_ACTIONS } from './dashboard/QuickActionsGrid';

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

    const { items: shoppingItems, addItem: addShoppingItem } = useShoppingList();
    const { habits } = useHabits();
    const { medications } = useMedications();
    const { tasks, refreshTasks, addTask } = useTasks();
    const { appointments, refreshAppointments } = useAppointments();
    const { notes, createNote } = useNotesV2();
    const { locations, saveParking } = useLocations();

    // State
    const [weekStartDate, setWeekStartDate] = useState(new Date());
    const [currentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [showAddDialog, setShowAddDialog] = useState<'appointment' | 'task' | 'location' | 'shopping' | 'note' | 'expense' | 'goal' | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isParkingSectionOpen, setIsParkingSectionOpen] = useState(false);
    const [showNewMuslimsDialog, setShowNewMuslimsDialog] = useState(false);
    const [activeWidgets, setActiveWidgets] = useState<string[]>([]);
    const [routineVisibleSections, setRoutineVisibleSections] = useState<string[]>(['notes', 'shopping', 'calendar']);

    const { executeShortcut, shortcutResult, setShortcutResult } = useShortcutExecution({
        onOpenAddDialog: setShowAddDialog,
        onOpenVoiceRecorder,
        onNavigateToTab,
        onOpenNewMuslims: () => setShowNewMuslimsDialog(true),
        onOpenTimer: () => window.dispatchEvent(new Event('openPomodoroDialog'))
    });

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
        return () => window.removeEventListener('routines-updated', applyRoutineSettings);
    }, []);

    // Custom Shortcuts & Locations
    const [customShortcuts, setCustomShortcuts] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('baraka_custom_shortcuts');
            return saved ? JSON.parse(saved) : ['show_next_prayer', 'show_balance', 'add_note'];
        } catch { return []; }
    });

    const [customLocations, setCustomLocations] = useState<{ id: string, name: string, url: string }[]>(() => {
        try {
            const saved = localStorage.getItem('baraka_custom_locations');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    const [showShortcutsSettings, setShowShortcutsSettings] = useState(false);
    const [newLocName, setNewLocName] = useState('');
    const [newLocUrl, setNewLocUrl] = useState('');

    useEffect(() => {
        localStorage.setItem('baraka_custom_shortcuts', JSON.stringify(customShortcuts));
    }, [customShortcuts]);

    useEffect(() => {
        localStorage.setItem('baraka_custom_locations', JSON.stringify(customLocations));
    }, [customLocations]);

    const addShortcut = (id: string) => {
        if (!customShortcuts.includes(id)) setCustomShortcuts([...customShortcuts, id]);
    };

    const removeShortcut = (id: string) => {
        setCustomShortcuts(customShortcuts.filter(s => s !== id));
    };

    const addCustomLocation = (name: string, url: string) => {
        setCustomLocations([...customLocations, { id: Date.now().toString(), name, url }]);
    };

    const removeCustomLocation = (id: string) => {
        setCustomLocations(customLocations.filter(l => l.id !== id));
    };

    // Shopping state
    const [shoppingItemName, setShoppingItemName] = useState('');
    const [shoppingItemQuantity, setShoppingItemQuantity] = useState(1);
    const [shoppingItemDeadline, setShoppingItemDeadline] = useState('');

    return (
        <div className={cn(
            "min-h-screen bg-transparent pb-32 animate-fade-in relative w-full max-w-[100vw]",
            isAndroid() ? "overflow-y-auto" : "md:h-screen md:overflow-hidden"
        )}>
            <DashboardHeader />

            <div className="mx-[2%] mt-0.5 w-[96%]">
                <div className={cn("flex flex-col gap-2", activeWidgets.length > 0 && 'lg:flex-row-reverse', !isAndroid() && "gap-1")}>
                    <div className={cn(activeWidgets.length > 0 ? 'w-full lg:w-[70%]' : 'w-full', isAndroid() ? "space-y-1.5" : "space-y-1")}>
                        <DashboardHeaderStrip />

                        {/* Financial Summary */}
                        <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-2 px-3 shadow-sm space-y-1.5">
                            <div className="flex justify-between items-center border-b border-emerald-100/30 pb-1">
                                <div className="flex items-center gap-2">
                                    <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-[10px] font-bold text-emerald-800/80">المحفظة</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-bold text-gray-500">ARS:</span>
                                        <span className="text-xs font-mono font-bold text-emerald-600">{financeData?.current_balance_ars?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 border-l border-emerald-100/50 pl-3">
                                        <span className="text-[10px] font-bold text-gray-500">USD:</span>
                                        <span className="text-xs font-mono font-bold text-emerald-600">${financeData?.current_balance_usd?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 border-l border-emerald-100/50 pl-3">
                                        <TrendingUp className="w-3 h-3 text-blue-500" />
                                        <span className="text-[9px] font-bold text-blue-600">{monthlySavings?.toLocaleString() || 0}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col">
                                        <span className="text-[7px] text-gray-400 font-bold">المتبقي اليومي</span>
                                        <span className="text-[10px] font-mono font-bold text-emerald-700">{dailyLimitARS?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex flex-col border-r border-emerald-100/30 pr-2">
                                        <span className="text-[7px] text-gray-400 font-bold">مصروف اليوم</span>
                                        <span className="text-[10px] font-mono font-bold text-red-500">{todayExpense?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex flex-col border-r border-emerald-100/30 pr-2">
                                        <span className="text-[7px] text-gray-400 font-bold">إجمالي الشهر</span>
                                        <span className="text-[10px] font-mono font-bold text-indigo-600">{monthlyTotalSpent?.toLocaleString() || 0}</span>
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

                        <QuickActionsGridV2
                            onOpenAddDialog={setShowAddDialog}
                            onOpenTimer={() => window.dispatchEvent(new Event('openPomodoroDialog'))}
                            onOpenVoiceRecorder={onOpenVoiceRecorder}
                            onNavigateToTab={onNavigateToTab}
                            onOpenNewMuslims={() => setShowNewMuslimsDialog(true)}
                            onOpenShortcuts={() => setShowShortcutsSettings(true)}
                            activeWidgets={activeWidgets}
                        />

                        <div className={cn(!isAndroid() ? "mb-1" : "mb-2")} id="shortcuts-section">
                            <QuadrantShortcutsV3
                                customShortcuts={customShortcuts}
                                customLocations={customLocations}
                                onExecuteShortcut={executeShortcut}
                            />
                        </div>

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

                    {!isAndroid() && (
                        <div className="my-1">
                            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden h-[200px]" onClick={() => setShowAddDialog('shopping')}>
                                <DashboardShopping />
                            </div>
                        </div>
                    )}
                    <DashboardParking />
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
                <DialogContent className={cn("max-h-[90vh] overflow-y-auto p-4", (showAddDialog === 'appointment' || showAddDialog === 'location') ? 'sm:max-w-3xl' : 'sm:max-w-sm')} dir="rtl">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-right flex items-center gap-2 text-lg">
                            {showAddDialog === 'appointment' && <><CalendarPlus className="w-5 h-5 text-orange-500" /> إضافة موعد</>}
                            {showAddDialog === 'task' && <><CheckSquare className="w-5 h-5 text-blue-500" /> إضافة مهمة</>}
                            {showAddDialog === 'location' && <><MapPin className="w-5 h-5 text-green-500" /> حفظ موقع</>}
                            {showAddDialog === 'shopping' && <><ShoppingCart className="w-5 h-5 text-pink-500" /> إضافة للتسوق</>}
                            {showAddDialog === 'expense' && <><DollarSign className="w-5 h-5 text-red-500" /> إضافة مصروف</>}
                            {showAddDialog === 'goal' && <><Target className="w-5 h-5 text-purple-500" /> إضافة هدف</>}
                        </DialogTitle>
                    </DialogHeader>

                    {showAddDialog === 'appointment' && <div className="mt-2"><AppointmentManager /></div>}
                    {showAddDialog === 'task' && (
                        <div className="space-y-4">
                            <Input id="task-title" placeholder="عنوان المهمة" className="text-right" />
                            <div className="grid grid-cols-2 gap-2">
                                <Input id="task-date" type="date" defaultValue={todayStr} />
                                <select id="task-priority" className="border rounded-md px-2"><option value="medium">متوسطة</option><option value="high">عالية</option><option value="low">منخفضة</option></select>
                            </div>
                            <Button className="w-full bg-blue-600" onClick={async () => {
                                const title = (document.getElementById('task-title') as HTMLInputElement).value;
                                if (!title) return;
                                await addTask({ title, deadline: (document.getElementById('task-date') as HTMLInputElement).value || todayStr, priority: (document.getElementById('task-priority') as HTMLSelectElement).value as any, type: 'task' });
                                setShowAddDialog(null);
                            }}>حفظ المهمة</Button>
                        </div>
                    )}
                    {showAddDialog === 'location' && <div className="h-[400px]"><InteractiveMap /></div>}
                    {showAddDialog === 'expense' && (
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <Button className="flex-1 bg-red-500" onClick={() => (document.getElementById('exp-type') as HTMLInputElement).value = 'expense'}>مصروف</Button>
                                <Button className="flex-1 bg-emerald-500" onClick={() => (document.getElementById('exp-type') as HTMLInputElement).value = 'income'}>دخل</Button>
                            </div>
                            <input type="hidden" id="exp-type" defaultValue="expense" />
                            <div className="grid grid-cols-2 gap-2">
                                <Input id="exp-amount" type="number" placeholder="المبلغ" />
                                <select id="exp-currency" className="border rounded-md px-2"><option value="ARS">ARS</option><option value="USD">USD</option></select>
                            </div>
                            <Button className="w-full bg-emerald-600" onClick={async () => {
                                const amount = parseFloat((document.getElementById('exp-amount') as HTMLInputElement).value);
                                if (!amount) return;
                                // Simple save logic
                                toast({ title: 'تم الحفظ' });
                                setShowAddDialog(null);
                            }}>حفظ المعاملة</Button>
                        </div>
                    )}
                    {showAddDialog === 'shopping' && (
                        <div className="space-y-4">
                            <Input placeholder="المنتج" value={shoppingItemName} onChange={e => setShoppingItemName(e.target.value)} />
                            <Button className="w-full bg-pink-500" onClick={async () => {
                                if (!shoppingItemName) return;
                                await addShoppingItem({ text: shoppingItemName, quantity: shoppingItemQuantity });
                                setShoppingItemName(''); setShowAddDialog(null);
                            }}>إضافة</Button>
                        </div>
                    )}
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
                <div className="fixed inset-0 z-[100] bg-white flex flex-col">
                    <div className="p-4 border-b flex justify-between bg-emerald-50">
                        <h2 className="font-bold flex items-center gap-2"><Users className="w-5 h-5" /> هداية</h2>
                        <Button variant="ghost" onClick={() => setShowNewMuslimsDialog(false)}>إغلاق ✕</Button>
                    </div>
                    <div className="flex-1 overflow-y-auto"><NewMuslimsManager /></div>
                </div>
            )}
        </div>
    );
};

export default SmartDashboard;
