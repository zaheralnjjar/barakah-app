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
import { useQuickNotes, NoteData } from '@/hooks/useQuickNotes';
import { useShoppingList } from '@/hooks/useShoppingList';
import {
    Plus, CalendarPlus, ShoppingCart, DollarSign, FileText, CheckSquare, Target, Clock, MapPin, Timer, Play, StickyNote, Pin, LayoutGrid, Calendar, Wallet, ListChecks, ChevronDown, ChevronUp, Bell, CalendarDays, Share, Share2, Edit, Trash2
} from 'lucide-react';
import jsPDF from 'jspdf';
import { Share as CapacitorShare } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

import InteractiveMap from '@/components/InteractiveMap';
import AppointmentManager from '@/components/AppointmentManager';
import PrayerTimesRow from '@/components/PrayerTimesRow';
import PomodoroTimer from '@/components/PomodoroTimer';
import { Card, CardContent } from '@/components/ui/card';

// New Components
import { RoutineModesWidget } from './dashboard/RoutineModesWidget';
import DashboardHeader from './dashboard/DashboardHeader';
import DashboardHeaderStrip from './dashboard/DashboardHeaderStrip';
import DashboardStats from './dashboard/DashboardStats';
import QuickActionsGrid from './dashboard/QuickActionsGrid';
import DailyReportCard from './dashboard/DailyReportCard';
import DashboardCalendar from './dashboard/DashboardCalendar';
import DashboardProgressCharts from './dashboard/DashboardProgressCharts';
import DashboardTicker from './dashboard/DashboardTicker';

// Internal Collapsible Component
const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false, badge = null }: { title: string, icon?: any, children: React.ReactNode, defaultOpen?: boolean, badge?: string | number | null }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <Card className="border-0 shadow-sm bg-white overflow-hidden mb-3 transition-all duration-300">
            <div
                className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 border-b border-transparent hover:border-gray-100"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    {Icon && <div className="p-1.5 bg-emerald-50 rounded-full"><Icon className="w-4 h-4 text-emerald-600" /></div>}
                    <span className="text-sm font-bold text-gray-700">{title}</span>
                    {badge && <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-gray-100 text-gray-600">{badge}</Badge>}
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
            {isOpen && <div className="p-0 animate-in slide-in-from-top-2 duration-300">{children}</div>}
        </Card>
    );
};

interface SmartDashboardProps {
    onNavigateToTab: (tabId: string) => void;
    onOpenVoiceRecorder: () => void;
}

const SmartDashboard: React.FC<SmartDashboardProps> = ({ onNavigateToTab, onOpenVoiceRecorder }) => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const {
        financeData, loading: dataLoading,
        prayerTimes = [], refetch, nextPrayer, timeUntilNext
    } = useDashboardData();

    const { items: shoppingItems, addItem: addShoppingItem } = useShoppingList();

    const shoppingListSummary = {
        totalItems: shoppingItems.length,
        completedItems: shoppingItems.filter(i => i.completed).length,
        recentItems: shoppingItems.filter(i => !i.completed).slice(0, 5)
    };

    const { habits } = useHabits();
    const { medications } = useMedications();
    const { tasks, addTask, refreshTasks } = useTasks();
    const { appointments, refreshAppointments } = useAppointments();
    const { saveParking, getParkingOnly, deleteLocation } = useLocations();
    const { notesHistory, togglePin, deleteHistoryItem } = useQuickNotes();

    const [parkingDuration, setParkingDuration] = useState<string | null>(null);
    const [latestParking, setLatestParking] = useState<any>(null);

    const [currentDate] = useState(new Date());
    const [showAddDialog, setShowAddDialog] = useState<'appointment' | 'task' | 'location' | 'shopping' | 'note' | 'expense' | 'goal' | null>(null);
    const [showFinancialReport, setShowFinancialReport] = useState(false);
    const [showWidgetMenu, setShowWidgetMenu] = useState(false);
    const [selectedNoteForView, setSelectedNoteForView] = useState<{ note: NoteData; index: number } | null>(null);
    const [notesExpanded, setNotesExpanded] = useState(false);

    // Shopping form state
    const [shoppingItemName, setShoppingItemName] = useState('');
    const [shoppingItemQuantity, setShoppingItemQuantity] = useState(1);
    const [shoppingItemDeadline, setShoppingItemDeadline] = useState('');

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
                    finance: { balance: financeData?.current_balance_ars?.toString() || '0', debt: financeData?.total_debt?.toString() || '0' },
                    shopping: shoppingItems
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
        const explicitLimit = financeData?.daily_limit || 0;
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
            endDate.setHours(23, 59, 59, 999);
            const diffTime = endDate.getTime() - now.getTime();
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

    if (dataLoading) return <div className="p-8 text-center text-emerald-600">جاري تحميل البيانات...</div>;

    return (
        <div className="min-h-screen bg-slate-50/30">
            {/* 1. Main Header (Site Name & Notifications) */}
            <div className="px-4 pt-2 max-w-7xl mx-auto">
                <DashboardHeader currentDate={currentDate} />
            </div>

            {/* 2. Quick Actions (MOVED UP) */}
            <div className="px-2 pt-0 pb-2 max-w-7xl mx-auto">
                <QuickActionsGrid
                    onOpenAddDialog={setShowAddDialog}
                    onQuickParking={saveParking}
                    onOpenTimer={() => window.dispatchEvent(new CustomEvent('openPomodoroDialog'))}
                    onOpenVoiceRecorder={onOpenVoiceRecorder}
                />
            </div>

            {/* 3. Finance & Prayer Header Strip */}
            <div className="px-2 pt-1 pb-2 max-w-7xl mx-auto">
                <DashboardHeaderStrip />
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

                {/* Main Grid: Daily Report & Calendar (Collapsible) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {/* Left Column: Daily Report */}
                    <CollapsibleSection title="مهام اليوم" icon={ListChecks} defaultOpen={true}>
                        <DailyReportCard
                            tasks={tasks}
                            appointments={appointments}
                            habits={habits}
                            medications={medications}
                            onNavigateToTab={onNavigateToTab}
                            refetch={refetch}
                        />
                    </CollapsibleSection>

                    {/* Right Column: Calendar */}
                    <CollapsibleSection title="التقويم الأسبوعي" icon={CalendarDays} defaultOpen={false}>
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
                    </CollapsibleSection>
                </div>

                {/* ===== NOTES SECTION (Custom Collapsible with Horizontal Scroll) ===== */}
                {notesHistory && notesHistory.length > 0 && (() => {
                    // Sort: pinned first
                    const sortedNotes = [...notesHistory].sort((a, b) => {
                        if (a.isPinned && !b.isPinned) return -1;
                        if (!a.isPinned && b.isPinned) return 1;
                        return 0;
                    });

                    return (
                        <Card className="border-0 shadow-sm bg-white overflow-hidden mb-3">
                            <div
                                className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 border-b border-transparent hover:border-gray-100"
                                onClick={() => setNotesExpanded(!notesExpanded)}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-amber-50 rounded-full"><StickyNote className="w-4 h-4 text-amber-600" /></div>
                                    <span className="text-sm font-bold text-gray-700">الملاحظات</span>
                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-gray-100 text-gray-600">{notesHistory.length}</Badge>
                                </div>
                                {notesExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                            </div>

                            {/* Collapsed: Horizontal Scroll */}
                            {!notesExpanded && (
                                <div className="flex gap-3 p-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
                                    {sortedNotes.slice(0, 10).map((note, idx) => {
                                        const originalIdx = notesHistory.indexOf(note);
                                        const firstLine = note.content.split('\n')[0].trim();
                                        const title = firstLine.substring(0, 20) || `ملاحظة ${idx + 1}`;
                                        return (
                                            <div
                                                key={idx}
                                                className={`flex-shrink-0 w-32 p-2 rounded-lg border hover:shadow-md transition-all cursor-pointer relative ${note.isPinned
                                                    ? 'bg-amber-50 border-amber-200'
                                                    : 'bg-white border-gray-100'}`}
                                                onClick={() => setSelectedNoteForView({ note, index: originalIdx })}
                                            >
                                                {note.isPinned && (
                                                    <Pin className="absolute top-1 right-1 w-3 h-3 text-red-500" fill="currentColor" />
                                                )}
                                                <p className={`text-[11px] font-semibold truncate ${note.isPinned ? 'text-amber-900' : 'text-gray-700'}`}>{title}</p>
                                                <p className="text-[9px] text-gray-400 truncate mt-0.5">{note.content.substring(0, 30)}...</p>
                                            </div>
                                        );
                                    })}
                                    {sortedNotes.length > 10 && (
                                        <div className="flex-shrink-0 w-20 p-2 rounded-lg bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center cursor-pointer" onClick={() => setNotesExpanded(true)}>
                                            <span className="text-[10px] text-gray-500">+{sortedNotes.length - 10} المزيد</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Expanded: Full Grid */}
                            {notesExpanded && (
                                <div className="p-3 animate-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
                                        {sortedNotes.map((note, idx) => {
                                            const originalIdx = notesHistory.indexOf(note);
                                            const firstLine = note.content.split('\n')[0].trim();
                                            const title = firstLine.substring(0, 25) || `ملاحظة ${idx + 1}`;
                                            const preview = note.content.substring(0, 60).replace(/\n/g, ' ');
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`p-3 rounded-lg border hover:shadow-md transition-all cursor-pointer group relative ${note.isPinned
                                                        ? 'bg-amber-50 border-amber-200'
                                                        : 'bg-white border-gray-100 hover:border-amber-200'}`}
                                                    onClick={() => setSelectedNoteForView({ note, index: originalIdx })}
                                                >
                                                    {/* Action Buttons Row */}
                                                    <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); togglePin(originalIdx); }}
                                                            className={`p-1 rounded-full transition-all ${note.isPinned ? 'text-red-600 bg-red-100' : 'text-orange-400 hover:bg-orange-100'}`}
                                                            title={note.isPinned ? 'إلغاء التثبيت' : 'تثبيت'}
                                                        >
                                                            <Pin className="w-3 h-3" fill={note.isPinned ? "currentColor" : "none"} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedNoteForView({ note, index: originalIdx });
                                                            }}
                                                            className="p-1 rounded-full text-blue-400 hover:bg-blue-100 hover:text-blue-600"
                                                            title="عرض/تعديل"
                                                        >
                                                            <Edit className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (navigator.share) {
                                                                    navigator.share({ title: title, text: note.content });
                                                                } else {
                                                                    navigator.clipboard.writeText(note.content);
                                                                    toast({ title: '📋 تم نسخ الملاحظة' });
                                                                }
                                                            }}
                                                            className="p-1 rounded-full text-green-400 hover:bg-green-100 hover:text-green-600"
                                                            title="مشاركة"
                                                        >
                                                            <Share className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (confirm('هل تريد حذف هذه الملاحظة؟')) {
                                                                    deleteHistoryItem(originalIdx);
                                                                    toast({ title: '🗑️ تم حذف الملاحظة' });
                                                                }
                                                            }}
                                                            className="p-1 rounded-full text-red-400 hover:bg-red-100 hover:text-red-600"
                                                            title="حذف"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    {/* Pin indicator when pinned */}
                                                    {note.isPinned && (
                                                        <Pin className="absolute top-1.5 left-1.5 w-3 h-3 text-red-500" fill="currentColor" />
                                                    )}
                                                    <div className="flex items-start gap-2 mt-4">
                                                        <div className={`p-1.5 rounded-full transition-colors ${note.isPinned ? 'bg-amber-200' : 'bg-gray-100 group-hover:bg-amber-100'}`}>
                                                            <StickyNote className={`w-3.5 h-3.5 ${note.isPinned ? 'text-amber-700' : 'text-gray-500 group-hover:text-amber-600'}`} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-xs font-semibold truncate ${note.isPinned ? 'text-amber-900' : 'text-gray-700'}`}>{title}</p>
                                                            <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5 leading-tight">{preview}...</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </Card>
                    );
                })()}

                {/* Note View Dialog */}
                <Dialog open={selectedNoteForView !== null} onOpenChange={(open) => { if (!open) setSelectedNoteForView(null); }}>
                    <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="text-right flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <StickyNote className="w-5 h-5 text-amber-500" />
                                    <span>{selectedNoteForView?.note.content.split('\n')[0].substring(0, 30) || 'ملاحظة'}</span>
                                </div>

                                <div className="flex gap-1">
                                    <button
                                        onClick={() => {
                                            const text = selectedNoteForView.note.content;
                                            // Try native share first (likely text)
                                            CapacitorShare.share({
                                                title: 'مشاركة ملاحظة',
                                                text: text,
                                                dialogTitle: 'مشاركة الملاحظة'
                                            }).catch(() => {
                                                // Fallback to clipboard
                                                navigator.clipboard.writeText(text);
                                                toast({ title: 'تم النسخ', description: 'تم نسخ النص للحافظة' });
                                            });
                                        }}
                                        className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                                        title="مشاركة كنص"
                                    >
                                        <Share className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={async () => {
                                            try {
                                                const noteContent = selectedNoteForView.note.content;
                                                const fileName = `note-${Date.now()}.pdf`;

                                                // Check if running in Capacitor (Mobile) or Desktop/Web
                                                const isCapacitor = (window as any).Capacitor !== undefined;
                                                const isElectron = navigator.userAgent.includes('Electron');

                                                // Create a styled HTML content for better Arabic support
                                                const htmlContent = `
                                                    <html dir="rtl" lang="ar">
                                                    <head>
                                                        <meta charset="UTF-8">
                                                        <style>
                                                            body {
                                                                font-family: 'Amiri', 'Arial', sans-serif;
                                                                font-size: 16px;
                                                                line-height: 1.8;
                                                                padding: 40px;
                                                                direction: rtl;
                                                                text-align: right;
                                                            }
                                                            .content {
                                                                white-space: pre-wrap;
                                                            }
                                                            .header {
                                                                text-align: center;
                                                                margin-bottom: 20px;
                                                                color: #059669;
                                                                font-size: 24px;
                                                            }
                                                            .date {
                                                                text-align: left;
                                                                color: #666;
                                                                font-size: 12px;
                                                                margin-bottom: 20px;
                                                            }
                                                        </style>
                                                    </head>
                                                    <body>
                                                        <div class="header">بركة - ملاحظة</div>
                                                        <div class="date">${new Date().toLocaleDateString('ar-SA')}</div>
                                                        <div class="content">${noteContent.replace(/\n/g, '<br>')}</div>
                                                    </body>
                                                    </html>
                                                `;

                                                if (isElectron || !isCapacitor) {
                                                    // Desktop/Web: Use browser print dialog or text file download
                                                    // Create a blob with the content as text for simplicity
                                                    const textBlob = new Blob([noteContent], { type: 'text/plain;charset=utf-8' });
                                                    const textUrl = URL.createObjectURL(textBlob);
                                                    const a = document.createElement('a');
                                                    a.href = textUrl;
                                                    a.download = `note-${Date.now()}.txt`;
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    document.body.removeChild(a);
                                                    URL.revokeObjectURL(textUrl);
                                                    toast({ title: 'تم التصدير', description: 'تم تصدير الملاحظة كملف نصي' });
                                                } else {
                                                    // Mobile/Capacitor: Share as text (more reliable than PDF for Arabic)
                                                    await CapacitorShare.share({
                                                        title: 'مشاركة ملاحظة',
                                                        text: noteContent,
                                                        dialogTitle: 'مشاركة الملاحظة'
                                                    });
                                                }

                                            } catch (e) {
                                                console.error(e);
                                                toast({ title: 'خطأ', description: 'حدث خطأ أثناء التصدير', variant: 'destructive' });
                                            }
                                        }}
                                        className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:text-red-600 hover:bg-red-50"
                                        title="مشاركة PDF"
                                    >
                                        <FileText className="w-4 h-4" />
                                    </button>

                                    {selectedNoteForView && (
                                        <button
                                            onClick={() => {
                                                togglePin(selectedNoteForView.index);
                                                setSelectedNoteForView(null);
                                            }}
                                            className={`p-1.5 rounded-full ${selectedNoteForView.note.isPinned ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400 hover:text-amber-500'}`}
                                        >
                                            <Pin className="w-4 h-4" fill={selectedNoteForView.note.isPinned ? "currentColor" : "none"} />
                                        </button>
                                    )}
                                </div>
                            </DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto p-4 bg-amber-50/30 rounded-lg border border-amber-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {selectedNoteForView?.note.content}
                        </div>
                        {selectedNoteForView?.note.createdAt && (
                            <p className="text-[10px] text-gray-400 text-left mt-2">
                                {new Date(selectedNoteForView.note.createdAt).toLocaleString('ar-SA')}
                            </p>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Progress Charts at the Bottom - Collapsible too? User said "all sections". */}
                <CollapsibleSection title="إحصائيات التقدم" icon={Target} defaultOpen={false}>
                    <DashboardProgressCharts />
                </CollapsibleSection>

                {/* Pomodoro Timer (Hidden Trigger, accessible via Top Icon) */}
                <PomodoroTimer hideTrigger={true} />

                {/* Routine Modes Widget */}
                <div className="mb-20">
                    <RoutineModesWidget />
                </div>

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

                                        const { error } = await supabase
                                            .from('finance_data_2025_12_18_18_42')
                                            .update({
                                                current_balance_ars: balanceARS,
                                                current_balance_usd: balanceUSD,
                                                pending_expenses: updatedPendingExpenses,
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

                        {/* Other dialogs ... simplified here as I don't want to break existing logic */}
                        {showAddDialog === 'note' && (
                            <div className="space-y-4 mt-2">
                                <Input id="note-title" placeholder="عنوان الملاحظة" className="text-right" />
                                <div className="min-h-[100px] p-2 border rounded-md" contentEditable id="note-content"></div>
                                <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black" onClick={async () => {
                                    /* Note saving logic - using inline for simplicity or reuse existing functions if exposed */
                                    toast({ title: 'تم الحفظ (محاكاة)' }); setShowAddDialog(null);
                                }}>حفظ الملاحظة</Button>
                            </div>
                        )}
                        {/* Shopping Dialog with Full Form */}
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
                                                await addShoppingItem({
                                                    text: shoppingItemName,
                                                    quantity: shoppingItemQuantity,
                                                    deadline: shoppingItemDeadline || undefined
                                                });
                                                toast({ title: '✅ تمت الإضافة', description: shoppingItemName });
                                                setShoppingItemName('');
                                                setShoppingItemQuantity(1);
                                                setShoppingItemDeadline('');
                                            }
                                        }}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-sm text-gray-600 block mb-1">الكمية</label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={shoppingItemQuantity}
                                            onChange={(e) => setShoppingItemQuantity(Number(e.target.value))}
                                            className="text-center"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-600 block mb-1">مطلوب قبل (اختياري)</label>
                                        <Input
                                            type="date"
                                            value={shoppingItemDeadline}
                                            onChange={(e) => setShoppingItemDeadline(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button
                                    onClick={async () => {
                                        if (!shoppingItemName.trim()) return;
                                        await addShoppingItem({
                                            text: shoppingItemName,
                                            quantity: shoppingItemQuantity,
                                            deadline: shoppingItemDeadline || undefined
                                        });
                                        toast({ title: '✅ تمت الإضافة', description: shoppingItemName });
                                        setShoppingItemName('');
                                        setShoppingItemQuantity(1);
                                        setShoppingItemDeadline('');
                                    }}
                                    className="w-full bg-pink-500 hover:bg-pink-600"
                                >
                                    <ShoppingCart className="w-4 h-4 ml-2" />
                                    إضافة للقائمة
                                </Button>
                            </div>
                        )}
                        {showAddDialog === 'goal' && <div className="text-center p-4">إضافة هدف جديد (قريباً).</div>}

                    </DialogContent>
                </Dialog >
            </div >
        </div >
    );
};

export default SmartDashboard;
