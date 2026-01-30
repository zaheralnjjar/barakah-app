import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useFinance } from '@/hooks/useFinance';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import {
    LayoutGrid, ListChecks, Calendar, StickyNote, Heart, Pill,
    Bell, CheckSquare, Target, Wallet, Clock, Users, Search, Timer, ShoppingCart, MapPin, DollarSign, FileText, Sparkles, Settings,
    Mic, Copy, Brain, Zap, Moon, Calculator, ExternalLink, Trash2, Plus, GraduationCap, Navigation, CalendarPlus, Lightbulb
} from 'lucide-react';
import { AVAILABLE_ACTIONS, getActionById } from '@/constants/actionDefinitions';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLongPress } from '@/hooks/useLongPress';
import { useCustomShortcuts } from '@/hooks/useCustomShortcuts';
import { FloatingTimer } from '@/components/FloatingTimer';
import { SavedLocationsDialog } from '@/components/dashboard/SavedLocationsDialog';

interface QuickActionsGridProps {
    onOpenAddDialog: (type: 'appointment' | 'task' | 'location' | 'shopping' | 'note' | 'expense' | 'goal' | 'medication' | 'habit' | 'project') => void;
    onQuickParking?: () => void;
    onOpenTimer?: () => void;
    onOpenVoiceRecorder?: () => void;
    latestParking?: any;
    onNavigateToTab?: (tabId: string) => void;
    onOpenSearch?: () => void;
    onOpenNewMuslims?: () => void;
    onOpenShortcuts?: () => void; // Added explicitly
    onActivateWidgets?: (widgets: string[]) => void;
    activeWidgets?: string[];
    shortcutResult?: { id?: string; title: string; content: string } | null;
    setShortcutResult?: (val: { id?: string; title: string; content: string } | null) => void;
    isCleanMode?: boolean;
    onToggleCleanMode?: () => void;
}

const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({
    onOpenAddDialog, onQuickParking, onOpenTimer, onOpenVoiceRecorder,
    latestParking, onNavigateToTab, onOpenSearch, onOpenNewMuslims, onOpenShortcuts,
    onActivateWidgets, activeWidgets, shortcutResult, setShortcutResult
}) => {
    const { toast } = useToast();
    const { nextPrayer, timeUntilNext } = usePrayerTimes();
    const { financeData, dailyLimit } = useFinance();
    const { tasks } = useTasks();
    const { appointments } = useAppointments();
    const navigate = useNavigate();

    const [showEventMenu, setShowEventMenu] = useState(false);
    const [showLocationMenu, setShowLocationMenu] = useState(false);
    const [showSavedLocations, setShowSavedLocations] = useState(false);
    const [showWidgetMenu, setShowWidgetMenu] = useState(false);
    const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);
    const [inlineWidgetTypes, setInlineWidgetTypes] = useState<string[]>([]);
    const [showInlineWidget, setShowInlineWidget] = useState(false);
    // const [showShortcutsSettings, setShowShortcutsSettings] = useState(false); // Handled by prop now or internal if needed

    // Calculator states
    const [showCalcAge, setShowCalcAge] = useState(false);
    const [showCalcDays, setShowCalcDays] = useState(false);
    const [showCalcPercentage, setShowCalcPercentage] = useState(false);
    const [showCalcCurrency, setShowCalcCurrency] = useState(false);
    const [showCalcSalary, setShowCalcSalary] = useState(false);
    const [calcInput1, setCalcInput1] = useState('');
    const [calcInput2, setCalcInput2] = useState('');
    const [calcResult, setCalcResult] = useState('');

    useEffect(() => {
        const handleOpenCalc = () => setShowCalcPercentage(true);
        const handleOpenLocations = () => setShowSavedLocations(true);
        window.addEventListener('open-calculator', handleOpenCalc);
        window.addEventListener('open-saved-locations', handleOpenLocations);
        return () => {
            window.removeEventListener('open-calculator', handleOpenCalc);
            window.removeEventListener('open-saved-locations', handleOpenLocations);
        };
    }, []);

    // Shortcuts Management (Unified Hook)
    const {
        shortcuts,
        addShortcut,
        deleteShortcut,
    } = useCustomShortcuts();

    const customShortcuts = shortcuts.filter(s => s.shortcut_type === 'action');
    const customLocations = shortcuts.filter(s => s.shortcut_type === 'url');

    const [newLocName, setNewLocName] = useState('');
    const [newLocUrl, setNewLocUrl] = useState('');
    const [searchAddress, setSearchAddress] = useState('');
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    // Check if running on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const widgetOptions = [
        { type: 'finance', label: 'المالية', icon: Wallet, color: 'blue', size: '350,400' },
        { type: 'prayer', label: 'الصلاة', icon: Clock, color: 'amber', size: '380,300' },
        { type: 'tasks', label: 'المهام', icon: ListChecks, color: 'purple', size: '350,500' },
        { type: 'appointments', label: 'المواعيد', icon: Calendar, color: 'rose', size: '350,450' },
        { type: 'shopping', label: 'التسوق', icon: ShoppingCart, color: 'orange', size: '350,450' },
        { type: 'shortcuts', label: 'اختصارات', icon: Sparkles, color: 'emerald', size: '400,350' },
        { type: 'habits', label: 'العادات', icon: Heart, color: 'pink', size: '350,400' },
        { type: 'medications', label: 'الأدوية', icon: Pill, color: 'cyan', size: '350,400' },
        { type: 'locations', label: 'المواقع', icon: MapPin, color: 'indigo', size: '400,500' },
        { type: 'educational', label: 'أكاديمي', icon: GraduationCap, color: 'violet', size: '400,500' },
        { type: 'daura', label: 'المهتدين', icon: Users, color: 'teal', size: '400,500' },
    ];

    const openWidgetInline = () => {
        if (onActivateWidgets) {
            onActivateWidgets(selectedWidgets);
            setShowWidgetMenu(false);
            setSelectedWidgets([]);
        } else {
            setInlineWidgetTypes(selectedWidgets);
            setShowInlineWidget(true);
            setShowWidgetMenu(false);
            setSelectedWidgets([]);
        }
    };

    // Execute shortcut action
    const executeShortcut = (actionId: string) => {
        const action = getActionById(actionId);
        if (!action) return;

        switch (actionId) {
            case 'show_new_muslims':
                if (onOpenNewMuslims) onOpenNewMuslims();
                else if (onNavigateToTab) onNavigateToTab('daura');
                else toast({ title: 'غير متاح', description: 'التنقل غير مفعل' });
                break;

            // === INFORMATION ACTIONS ===
            case 'show_time':
                const now = new Date();
                const hijri = now.toLocaleDateString('ar-SA-u-ca-islamic', { dateStyle: 'full' });
                setShortcutResult?.({
                    title: '🕐 الوقت والتاريخ',
                    content: `الوقت: ${now.toLocaleTimeString('ar-SA')}\n\nالتاريخ الميلادي:\n${now.toLocaleDateString('ar-SA', { dateStyle: 'full' })}\n\nالتاريخ الهجري:\n${hijri}`
                });
                break;

            case 'show_balance':
                const balance = financeData?.current_balance_ars || 0;
                const remaining = dailyLimit || 0;
                setShortcutResult?.({
                    title: '💰 الرصيد المالي',
                    content: `الرصيد الحالي: ${balance.toLocaleString()} ARS\n\nالحد اليومي المتبقي: ${remaining.toLocaleString()} ARS`
                });
                break;

            case 'show_dollar':
                setShortcutResult?.({ title: '💵 سعر الدولار', content: 'جاري التحميل...' });
                fetch('https://dolarapi.com/v1/dolares/oficial')
                    .then(r => r.json())
                    .then(official => {
                        fetch('https://dolarapi.com/v1/dolares/blue')
                            .then(r => r.json())
                            .then(blue => {
                                setShortcutResult?.({
                                    title: '💵 سعر الدولار',
                                    content: `🏦 الدولار الرسمي:\nشراء: ${official.compra} | بيع: ${official.venta}\n\n💵 الدولار الأزرق:\nشراء: ${blue.compra} | بيع: ${blue.venta}`
                                });
                            });
                    })
                    .catch(() => setShortcutResult?.({ title: '💵 سعر الدولار', content: 'خطأ في جلب البيانات' }));
                break;

            case 'show_next_prayer':
                setShortcutResult?.({
                    title: '🕌 الصلاة القادمة',
                    content: `الصلاة: ${nextPrayer?.nameAr || 'غير متاح'}\n\nالوقت: ${nextPrayer?.time || '--:--'}\n\nالمتبقي: ${timeUntilNext || '--:--'}`
                });
                break;

            case 'show_today_tasks':
                const todayStr = new Date().toISOString().split('T')[0];
                const todayTasks = tasks.filter(t => t.deadline === todayStr && t.progress < 100);
                const completedToday = tasks.filter(t => t.deadline === todayStr && t.progress >= 100);
                setShortcutResult?.({
                    title: '📋 مهام اليوم',
                    content: `المهام المتبقية: ${todayTasks.length}\nالمهام المكتملة: ${completedToday.length}\n\n${todayTasks.length > 0 ? 'المهام:\n' + todayTasks.slice(0, 5).map(t => `• ${t.title}`).join('\n') : 'لا توجد مهام لليوم'}`
                });
                break;

            case 'show_appointments':
                const upcomingAppts = appointments.filter(a => new Date(a.date) >= new Date()).slice(0, 5);
                setShortcutResult?.({
                    title: '📅 المواعيد القادمة',
                    content: upcomingAppts.length > 0
                        ? upcomingAppts.map(a => `• ${a.title}\n  ${a.date} ${a.time || ''}`).join('\n\n')
                        : 'لا توجد مواعيد قادمة'
                });
                break;

            case 'show_shopping':
                try {
                    const shopping = JSON.parse(localStorage.getItem('baraka_shopping_list') || '[]');
                    setShortcutResult?.({
                        title: '🛒 قائمة التسوق',
                        content: shopping.length > 0
                            ? `عدد العناصر: ${shopping.length}\n\n${shopping.slice(0, 10).map((i: any) => `• ${i.name || i}`).join('\n')}`
                            : 'قائمة التسوق فارغة'
                    });
                } catch { setShortcutResult?.({ title: '🛒 قائمة التسوق', content: 'قائمة التسوق فارغة' }); }
                break;

            case 'show_habits':
                try {
                    const habits = JSON.parse(localStorage.getItem('baraka_habits') || '[]');
                    setShortcutResult?.({
                        title: '💪 العادات',
                        content: habits.length > 0
                            ? `عدد العادات: ${habits.length}\n\n${habits.slice(0, 10).map((h: any) => `• ${h.name}`).join('\n')}`
                            : 'لا توجد عادات مسجلة'
                    });
                } catch { setShortcutResult?.({ title: '💪 العادات', content: 'لا توجد عادات مسجلة' }); }
                break;

            case 'show_medications':
                try {
                    const meds = JSON.parse(localStorage.getItem('baraka_medications') || '[]');
                    setShortcutResult?.({
                        title: '💊 الأدوية',
                        content: meds.length > 0
                            ? `عدد الأدوية: ${meds.length}\n\n${meds.slice(0, 10).map((m: any) => `• ${m.name} - ${m.time || ''}`).join('\n')}`
                            : 'لا توجد أدوية مسجلة'
                    });
                } catch { setShortcutResult?.({ title: '💊 الأدوية', content: 'لا توجد أدوية مسجلة' }); }
                break;

            case 'show_goals':
                const goals = tasks.filter(t => (t.type as any) === 'goal');
                setShortcutResult?.({
                    title: '🎯 الأهداف',
                    content: goals.length > 0
                        ? `عدد الأهداف: ${goals.length}\n\n${goals.slice(0, 10).map((g: any) => `• ${g.title}`).join('\n')}`
                        : 'لا توجد أهداف مسجلة'
                });
                break;

            // === QUICK ACTIONS ===
            case 'add_expense':
                onOpenAddDialog('expense');
                break;

            case 'add_task':
                onOpenAddDialog('task');
                break;

            case 'add_note':
                if (onOpenVoiceRecorder) onOpenVoiceRecorder();
                else toast({ title: 'تسجيل ملاحظة صوتية غير متاح' });
                break;

            case 'save_parking':
                if (onQuickParking) {
                    onQuickParking();
                    toast({ title: '🅿️ تم حفظ موقف السيارة' });
                }
                break;

            case 'find_parking':
                if (latestParking) {
                    const url = `https://www.google.com/maps?q=${latestParking.lat},${latestParking.lng}`;
                    window.open(url, '_blank');
                    toast({ title: '🚗 جاري الملاحة إلى السيارة' });
                } else {
                    toast({ title: '🚫 لم يتم حفظ موقف مسبقاً', variant: 'destructive' });
                }
                break;

            case 'start_pomodoro':
                if (onOpenTimer) onOpenTimer();
                else toast({ title: 'المؤقت غير متاح' });
                break;

            case 'add_shopping':
                onOpenAddDialog('shopping');
                break;

            case 'copy_location':
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            const url = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
                            navigator.clipboard.writeText(url);
                            toast({ title: '📍 تم نسخ رابط الموقع' });
                        },
                        () => toast({ title: '❌ فشل في الحصول على الموقع' })
                    );
                } else {
                    toast({ title: '❌ خدمة الموقع غير متاحة' });
                }
                break;

            case 'open_map':
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            window.open(`https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`, '_blank');
                        },
                        () => toast({ title: '❌ فشل في الحصول على الموقع' })
                    );
                } else {
                    toast({ title: '❌ خدمة الموقع غير متاحة' });
                }
                break;

            // === CALCULATORS ===
            case 'calc_currency':
                setCalcInput1('');
                setCalcInput2('');
                setCalcResult('');
                setShowCalcCurrency(true);
                break;

            case 'calc_percentage':
                setCalcInput1('');
                setCalcInput2('');
                setCalcResult('');
                setShowCalcPercentage(true);
                break;

            case 'calc_age':
                setCalcInput1('');
                setCalcResult('');
                setShowCalcAge(true);
                break;

            case 'calc_days':
                setCalcInput1('');
                setCalcInput2('');
                setCalcResult('');
                setShowCalcDays(true);
                break;

            case 'calc_salary':
                setCalcInput1('');
                setCalcResult('');
                setShowCalcSalary(true);
                break;

            // === REMINDERS ===
            case 'remind_5min':
                setTimeout(() => {
                    toast({ title: '⏰ تذكير!', description: 'مضت 5 دقائق' });
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('تذكير البركة', { body: 'مضت 5 دقائق!' });
                    }
                }, 5 * 60 * 1000);
                toast({ title: '✅ تذكير 5 دقائق', description: 'سيتم تنبيهك بعد 5 دقائق' });
                break;

            case 'remind_15min':
                setTimeout(() => {
                    toast({ title: '⏰ تذكير!', description: 'مضت 15 دقيقة' });
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('تذكير البركة', { body: 'مضت 15 دقيقة!' });
                    }
                }, 15 * 60 * 1000);
                toast({ title: '✅ تذكير 15 دقيقة', description: 'سيتم تنبيهك بعد 15 دقيقة' });
                break;

            case 'remind_1hour':
                setTimeout(() => {
                    toast({ title: '⏰ تذكير!', description: 'مضت ساعة' });
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('تذكير البركة', { body: 'مضت ساعة!' });
                    }
                }, 60 * 60 * 1000);
                toast({ title: '✅ تذكير ساعة', description: 'سيتم تنبيهك بعد ساعة' });
                break;

            case 'remind_water':
                toast({ title: '💧 شرب الماء', description: 'تذكر أن تشرب الماء كل ساعة!' });
                break;

            case 'remind_break':
                toast({ title: '☕ استراحة', description: 'حان وقت أخذ استراحة قصيرة!' });
                break;

            // === SMART ===
            case 'daily_summary':
                // Simply reuse the logic to show summary
                const tTasks = tasks.filter(t => t.deadline === new Date().toISOString().split('T')[0]).length;
                const tAppts = appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length;
                setShortcutResult?.({
                    title: '📊 ملخص اليوم',
                    content: `📋 المهام: ${tTasks}\n📅 المواعيد: ${tAppts}\n🕌 الصلاة القادمة: ${nextPrayer?.nameAr || 'غير متاح'}\n💰 الحد اليومي: ${dailyLimit?.toLocaleString() || 'غير متاح'} ARS`
                });
                break;

            case 'quick_insights':
                // Show simple stats as insights
                const totalHabits = JSON.parse(localStorage.getItem('baraka_habits') || '[]').length;
                const totalMeds = JSON.parse(localStorage.getItem('baraka_medications') || '[]').length;
                setShortcutResult?.({
                    title: '💡 رؤى وتلميحات',
                    content: `لديك ${totalHabits} عادات نشطة.\nلديك ${totalMeds} أدوية مسجلة.\n\nتلميح: حاول إنجاز أهم 3 مهام في الصباح لزيادة الإنتاجية!`
                });
                break;

            case 'routine_modes':
                window.dispatchEvent(new CustomEvent('openRoutineModes'));
                toast({ title: '🔄 أوضاع دائمة', description: 'فتح الإعدادات...' });
                break;

            case 'flashlight':
                // Dispatch event for FlashlightOverlay
                window.dispatchEvent(new Event('toggle-flashlight'));
                toast({ title: '🔦 الكشاف', description: 'تم تفعيل وضع الكشاف' });
                break;

            case 'show_calculator':
                setShowCalcPercentage(true);
                break;

            default:
                toast({ title: action.name, description: action.description });
        }
    };

    // Helper for long-press coordinate copy
    const handleCopyCoords = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const coords = `${pos.coords.latitude},${pos.coords.longitude}`;
                    navigator.clipboard.writeText(coords);
                    toast({ title: '📍 تم نسخ الإحداثيات', description: coords });
                },
                () => toast({ title: '❌ فشل تحديد الموقع', variant: 'destructive' })
            );
        }
    };

    const handleShowFinanceSummary = () => {
        const totalToday = financeData?.pending_expenses?.filter(tx =>
            new Date(tx.timestamp).toDateString() === new Date().toDateString()
        ).reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

        setShortcutResult?.({
            title: '💰 الملخص المالي اليومي',
            content: `المصاريف اليومية: ${totalToday.toLocaleString()} ARS\nالحد المتبقي: ${dailyLimit?.toLocaleString() || 'غير محدد'} ARS`
        });
    };

    const handleQuickTimer = (mins: number) => {
        toast({ title: `⏰ مؤقت سريع (${mins} دقائق)`, description: 'بدأ العد التنازلي الآن' });
        setTimeout(() => {
            toast({ title: '⏰ انتهى الوقت!', variant: 'destructive' });
            if ('vibrate' in navigator) navigator.vibrate([500, 200, 500]);
        }, mins * 60 * 1000);
    };

    const handleResetSettings = () => {
        toast({
            title: '⚠️ تنبيه',
            description: 'هل تود حقاً استعادة ضبط المصنع للإعدادات؟ (تحتاج لتنفيذ خاص)',
            variant: 'destructive'
        });
    };

    const QuickActionItem = ({ item }: { item: any }) => {
        const bind = useLongPress({
            onLongPress: item.onLongPress,
            onClick: item.onClick,
        });

        return (
            <button
                {...bind}
                className={cn(
                    "flex items-center gap-2 p-1.5 px-3 rounded-full border-none active:scale-95 transition-all group overflow-hidden shadow-sm h-10 w-full",
                    item.color
                )}
            >
                <div className="flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 stroke-[2.5] group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-[11px] font-black tracking-tight text-right leading-none truncate flex-1">
                    {item.label}
                </span>
            </button>
        );
    };

    return (
        <>
            {/* ===== 3. QUICK ACTIONS - 5x2 Pills Grid ===== */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 px-2">
                {[
                    { icon: Timer, label: 'مؤقت', color: 'bg-orange-100 text-orange-700', onClick: () => onOpenTimer?.(), onLongPress: () => handleQuickTimer(5) },
                    { icon: Sparkles, label: 'حدث', color: 'bg-purple-100 text-purple-700', onClick: () => setShowEventMenu(true), onLongPress: () => onNavigateToTab?.('appointments') },
                    { icon: DollarSign, label: 'مصروف', color: 'bg-red-100 text-red-700', onClick: () => onOpenAddDialog('expense'), onLongPress: handleShowFinanceSummary },
                    { icon: MapPin, label: 'موقع', color: 'bg-green-100 text-green-700', onClick: () => setShowLocationMenu(true), onLongPress: handleCopyCoords },
                    { icon: ShoppingCart, label: 'تسوق', color: 'bg-pink-100 text-pink-700', onClick: () => onOpenAddDialog('shopping'), onLongPress: () => onNavigateToTab?.('shopping') },

                    { icon: FileText, label: 'ملاحظة', color: 'bg-yellow-100 text-yellow-700', onClick: () => onOpenAddDialog('note'), onLongPress: () => onNavigateToTab?.('notes-v2') },
                    { icon: Search, label: 'بحث', color: 'bg-blue-100 text-blue-700', onClick: () => onOpenSearch?.(), onLongPress: () => navigate('/thesis/dashboard') },
                    { icon: Sparkles, label: 'تخصيص', color: 'bg-teal-100 text-teal-700', onClick: () => onOpenShortcuts ? onOpenShortcuts() : setShowWidgetMenu(true), onLongPress: () => setShowWidgetMenu(true) }, // Updated to open shortcuts
                    { icon: Users, label: 'مهتدين', color: 'bg-emerald-100 text-emerald-700', onClick: () => onOpenNewMuslims?.(), onLongPress: () => toast({ title: '📊 إحصائيات', description: '3 مهتدين جدد هذا الأسبوع' }) },
                    { icon: Settings, label: 'إعدادات', color: 'bg-gray-100 text-gray-700', onClick: () => onNavigateToTab?.('settings'), onLongPress: handleResetSettings },
                ].map((item, idx) => (
                    <QuickActionItem key={idx} item={item} />
                ))}
            </div>

            {/* Event Type Selection Menu */}
            <Dialog open={showEventMenu} onOpenChange={setShowEventMenu}>
                <DialogContent className="sm:max-w-[350px]">
                    <DialogHeader>
                        <DialogTitle className="text-center">اختر نوع الحدث</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3 py-4">
                        <button
                            onClick={() => { setShowEventMenu(false); onOpenAddDialog('appointment'); }}
                            className="flex flex-col items-center p-4 rounded-xl bg-orange-100 text-orange-600 hover:scale-105 transition-transform"
                        >
                            <CalendarPlus className="w-8 h-8 mb-2" />
                            <span className="text-sm font-medium">موعد</span>
                        </button>
                        <button
                            onClick={() => { setShowEventMenu(false); onOpenAddDialog('task'); }}
                            className="flex flex-col items-center p-4 rounded-xl bg-blue-100 text-blue-600 hover:scale-105 transition-transform"
                        >
                            <CheckSquare className="w-8 h-8 mb-2" />
                            <span className="text-sm font-medium">مهمة</span>
                        </button>

                        <button
                            onClick={() => { setShowEventMenu(false); onOpenAddDialog('medication'); }}
                            className="flex flex-col items-center p-4 rounded-xl bg-teal-100 text-teal-600 hover:scale-105 transition-transform"
                        >
                            <Pill className="w-8 h-8 mb-2" />
                            <span className="text-sm font-medium">دواء</span>
                        </button>

                        <button
                            onClick={() => { setShowEventMenu(false); onOpenAddDialog('habit'); }}
                            className="flex flex-col items-center p-4 rounded-xl bg-emerald-100 text-emerald-600 hover:scale-105 transition-transform"
                        >
                            <Zap className="w-8 h-8 mb-2" />
                            <span className="text-sm font-medium">عادة</span>
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
                    <div className="grid grid-cols-1 gap-3 py-4">
                        <button
                            onClick={() => { setShowLocationMenu(false); if (onQuickParking) onQuickParking(); }}
                            className="flex items-center gap-4 p-4 rounded-xl bg-orange-100 text-orange-700 hover:scale-105 transition-transform"
                        >
                            <div className="bg-white p-2 rounded-full shadow-sm">
                                <span className="text-xl">🅿️</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-sm font-bold">حفظ موقف سريع</span>
                                <span className="text-[10px] text-orange-600/80">حفظ مكان السيارة وبدء المؤقت</span>
                            </div>
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => { setShowLocationMenu(false); onOpenAddDialog('location'); }}
                                className="flex flex-col items-center p-3 rounded-xl bg-green-100 text-green-600 hover:scale-105 transition-transform"
                            >
                                <Navigation className="w-6 h-6 mb-2" />
                                <span className="text-sm font-medium">خريطة</span>
                            </button>
                            <button
                                onClick={() => { setShowLocationMenu(false); setShowSavedLocations(true); }}
                                className="flex flex-col items-center p-3 rounded-xl bg-blue-100 text-blue-600 hover:scale-105 transition-transform"
                            >
                                <MapPin className="w-6 h-6 mb-2" />
                                <span className="text-sm font-medium">المواقع</span>
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Widget Selection Menu - MOVED TO SHORTCUTS SETTINGS DIALOG primarily, but kept here if accessed via other means */}
            <Dialog open={showWidgetMenu} onOpenChange={(open) => { setShowWidgetMenu(open); if (!open) setSelectedWidgets([]); }}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="text-center flex items-center justify-center gap-2">
                            <LayoutGrid className="w-5 h-5 text-teal-500" />
                            أدوات سطح المكتب
                        </DialogTitle>
                    </DialogHeader>
                    {/* ... Same content as before ... */}
                    <div className="grid grid-cols-3 gap-2 py-2">
                        {widgetOptions.map(item => {
                            const isSelected = selectedWidgets.includes(item.type);
                            return (
                                <button
                                    key={item.type}
                                    onClick={() => {
                                        if (item.type === 'shortcuts') {
                                            setShowWidgetMenu(false);
                                            if (onOpenShortcuts) onOpenShortcuts();
                                            // setShowShortcutsSettings(true);
                                            return;
                                        }
                                        if (isSelected) {
                                            setSelectedWidgets(prev => prev.filter(t => t !== item.type));
                                        } else {
                                            setSelectedWidgets(prev => [...prev, item.type]);
                                        }
                                    }}
                                    className={`relative flex flex-col items-center p-3 rounded-xl transition-all ${isSelected
                                        ? `bg-${item.color}-200 text-${item.color}-700 ring-2 ring-${item.color}-400 scale-105`
                                        : `bg-${item.color}-100 text-${item.color}-600 hover:scale-105`
                                        }`}
                                >
                                    {isSelected && (
                                        <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                            <CheckSquare className="w-3 h-3 text-green-600" />
                                        </div>
                                    )}
                                    <item.icon className="w-5 h-5 mb-1" />
                                    <span className="text-[10px] font-medium">{item.label}</span>
                                </button>
                            )
                        })}
                    </div>
                    <div className="space-y-2 mt-3 pt-3 border-t">
                        <Button
                            className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 font-bold h-10 rounded-xl"
                            disabled={selectedWidgets.length === 0}
                            onClick={openWidgetInline}
                        >
                            <LayoutGrid className="w-3 h-3 ml-1" />
                            عرض هنا ({selectedWidgets.length})
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Inline Widget Display Dialog */}
            <Dialog open={showInlineWidget} onOpenChange={setShowInlineWidget}>
                <DialogContent className="sm:max-w-[95vw] md:max-w-[420px] max-h-[85vh] p-0 overflow-hidden rounded-2xl border-2 border-teal-200 shadow-2xl">
                    <DialogHeader className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white p-3 flex-row items-center justify-between">
                        <DialogTitle className="flex items-center gap-2 text-sm font-bold">
                            <LayoutGrid className="w-4 h-4" />
                            أدوات البركة
                        </DialogTitle>
                    </DialogHeader>
                    <div className="h-full overflow-auto bg-gradient-to-b from-gray-50 to-white">
                        <iframe
                            src={`${window.location.pathname}#/widget?type=${inlineWidgetTypes.join(',')}`}
                            className="w-full border-0"
                            style={{ height: `${Math.min(70, 20 + inlineWidgetTypes.length * 12)}vh` }}
                            title="Barakah Widget"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default QuickActionsGrid;
