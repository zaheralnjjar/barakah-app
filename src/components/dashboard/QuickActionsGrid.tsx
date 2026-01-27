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
    Mic, Copy, Brain, Zap, Moon, Calculator, ExternalLink, Trash2, Plus, GraduationCap, Navigation, CalendarPlus
} from 'lucide-react';
import { AVAILABLE_ACTIONS, getActionById } from '@/constants/actionDefinitions';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLongPress } from '@/hooks/useLongPress';
import { useShortcuts } from '@/hooks/useShortcuts';
import { FloatingTimer } from '@/components/FloatingTimer';
import { SavedLocationsDialog } from '@/components/dashboard/SavedLocationsDialog';

// Available Actions (Focused on Productivity & Legacy Balance)




interface QuickActionsGridProps {
    onOpenAddDialog: (type: 'appointment' | 'task' | 'location' | 'shopping' | 'note' | 'expense' | 'goal' | 'medication' | 'habit' | 'project') => void;
    onQuickParking?: () => void;
    onOpenTimer?: () => void;
    onOpenVoiceRecorder?: () => void;
    latestParking?: any;
    onNavigateToTab?: (tabId: string) => void;
    onOpenSearch?: () => void;
    onOpenNewMuslims?: () => void;
    onActivateWidgets?: (widgets: string[]) => void;
    activeWidgets?: string[];
    shortcutResult?: { id?: string; title: string; content: string } | null;
    setShortcutResult?: (val: { id?: string; title: string; content: string } | null) => void;
}

const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({
    onOpenAddDialog, onQuickParking, onOpenTimer, onOpenVoiceRecorder,
    latestParking, onNavigateToTab, onOpenSearch, onOpenNewMuslims,
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
    const [showShortcutsSettings, setShowShortcutsSettings] = useState(false);

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
        customShortcuts,
        customLocations,
        addShortcut,
        removeShortcut,
        addLocation,
        removeLocation
    } = useShortcuts();

    const [newLocName, setNewLocName] = useState('');
    const [newLocUrl, setNewLocUrl] = useState('');
    const [searchAddress, setSearchAddress] = useState('');
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast({ title: 'خطأ', description: 'المتصفح لا يدعم تحديد الموقع', variant: 'destructive' });
            return;
        }
        setIsLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const link = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
                setNewLocUrl(link);
                if (!newLocName) setNewLocName("موقعي الحالي");
                setIsLoadingLocation(false);
                toast({ title: 'تم تحديد الموقع' });
            },
            (err) => {
                console.error(err);
                setIsLoadingLocation(false);
                toast({ title: 'فشل تحديد الموقع', description: 'تأكد من تفعيل الـ GPS', variant: 'destructive' });
            }
        );
    };

    const handleGenerateUrlFromAddress = () => {
        if (!searchAddress) return;
        const link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchAddress)}`;
        setNewLocUrl(link);
        if (!newLocName) setNewLocName(searchAddress);
    };

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
                setShortcutResult({
                    title: '🕐 الوقت والتاريخ',
                    content: `الوقت: ${now.toLocaleTimeString('ar-SA')}\n\nالتاريخ الميلادي:\n${now.toLocaleDateString('ar-SA', { dateStyle: 'full' })}\n\nالتاريخ الهجري:\n${hijri}`
                });
                break;

            case 'show_balance':
                const balance = financeData?.current_balance_ars || 0;
                const remaining = dailyLimit || 0;
                setShortcutResult({
                    title: '💰 الرصيد المالي',
                    content: `الرصيد الحالي: ${balance.toLocaleString()} ARS\n\nالحد اليومي المتبقي: ${remaining.toLocaleString()} ARS`
                });
                break;

            case 'show_dollar':
                setShortcutResult({ title: '💵 سعر الدولار', content: 'جاري التحميل...' });
                fetch('https://dolarapi.com/v1/dolares/oficial')
                    .then(r => r.json())
                    .then(official => {
                        fetch('https://dolarapi.com/v1/dolares/blue')
                            .then(r => r.json())
                            .then(blue => {
                                setShortcutResult({
                                    title: '💵 سعر الدولار',
                                    content: `🏦 الدولار الرسمي:\nشراء: ${official.compra} | بيع: ${official.venta}\n\n💵 الدولار الأزرق:\nشراء: ${blue.compra} | بيع: ${blue.venta}`
                                });
                            });
                    })
                    .catch(() => setShortcutResult({ title: '💵 سعر الدولار', content: 'خطأ في جلب البيانات' }));
                break;

            case 'show_next_prayer':
                setShortcutResult({
                    title: '🕌 الصلاة القادمة',
                    content: `الصلاة: ${nextPrayer?.nameAr || 'غير متاح'}\n\nالوقت: ${nextPrayer?.time || '--:--'}\n\nالمتبقي: ${timeUntilNext || '--:--'}`
                });
                break;

            case 'show_today_tasks':
                const todayStr = new Date().toISOString().split('T')[0];
                const todayTasks = tasks.filter(t => t.deadline === todayStr && t.progress < 100);
                const completedToday = tasks.filter(t => t.deadline === todayStr && t.progress >= 100);
                setShortcutResult({
                    title: '📋 مهام اليوم',
                    content: `المهام المتبقية: ${todayTasks.length}\nالمهام المكتملة: ${completedToday.length}\n\n${todayTasks.length > 0 ? 'المهام:\n' + todayTasks.slice(0, 5).map(t => `• ${t.title}`).join('\n') : 'لا توجد مهام لليوم'}`
                });
                break;

            case 'show_appointments':
                const upcomingAppts = appointments.filter(a => new Date(a.date) >= new Date()).slice(0, 5);
                setShortcutResult({
                    title: '📅 المواعيد القادمة',
                    content: upcomingAppts.length > 0
                        ? upcomingAppts.map(a => `• ${a.title}\n  ${a.date} ${a.time || ''}`).join('\n\n')
                        : 'لا توجد مواعيد قادمة'
                });
                break;

            case 'show_shopping':
                try {
                    const shopping = JSON.parse(localStorage.getItem('baraka_shopping_list') || '[]');
                    setShortcutResult({
                        title: '🛒 قائمة التسوق',
                        content: shopping.length > 0
                            ? `عدد العناصر: ${shopping.length}\n\n${shopping.slice(0, 10).map((i: any) => `• ${i.name || i}`).join('\n')}`
                            : 'قائمة التسوق فارغة'
                    });
                } catch { setShortcutResult({ title: '🛒 قائمة التسوق', content: 'قائمة التسوق فارغة' }); }
                break;

            case 'show_habits':
                try {
                    const habits = JSON.parse(localStorage.getItem('baraka_habits') || '[]');
                    setShortcutResult({
                        title: '💪 العادات',
                        content: habits.length > 0
                            ? `عدد العادات: ${habits.length}\n\n${habits.slice(0, 10).map((h: any) => `• ${h.name}`).join('\n')}`
                            : 'لا توجد عادات مسجلة'
                    });
                } catch { setShortcutResult({ title: '💪 العادات', content: 'لا توجد عادات مسجلة' }); }
                break;

            case 'show_medications':
                try {
                    const meds = JSON.parse(localStorage.getItem('baraka_medications') || '[]');
                    setShortcutResult({
                        title: '💊 الأدوية',
                        content: meds.length > 0
                            ? `عدد الأدوية: ${meds.length}\n\n${meds.slice(0, 10).map((m: any) => `• ${m.name} - ${m.time || ''}`).join('\n')}`
                            : 'لا توجد أدوية مسجلة'
                    });
                } catch { setShortcutResult({ title: '💊 الأدوية', content: 'لا توجد أدوية مسجلة' }); }
                break;

            case 'show_goals':
                try {
                    const goals = JSON.parse(localStorage.getItem('baraka_goals') || '[]');
                    setShortcutResult({
                        title: '🎯 الأهداف',
                        content: goals.length > 0
                            ? `عدد الأهداف: ${goals.length}\n\n${goals.slice(0, 10).map((g: any) => `• ${g.title || g.name}`).join('\n')}`
                            : 'لا توجد أهداف مسجلة'
                    });
                } catch { setShortcutResult({ title: '🎯 الأهداف', content: 'لا توجد أهداف مسجلة' }); }
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
                const todayTasksCount = tasks.filter(t => t.deadline === new Date().toISOString().split('T')[0]).length;
                const todayApptsCount = appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length;
                setShortcutResult({
                    title: '📊 ملخص اليوم',
                    content: `📋 المهام: ${todayTasksCount}\n📅 المواعيد: ${todayApptsCount}\n🕌 الصلاة القادمة: ${nextPrayer?.nameAr || 'غير متاح'}\n💰 الحد اليومي: ${dailyLimit?.toLocaleString() || 'غير متاح'} ARS`
                });
                break;

            case 'quick_insights':
                setShortcutResult({
                    title: '💡 رؤى سريعة',
                    content: 'قريباً - تحليل ذكي لنشاطاتك ومصاريفك'
                });
                break;

            case 'routine_modes':
                // Dispatch custom event to open settings and navigate to routines section
                window.dispatchEvent(new CustomEvent('openRoutineModes'));
                toast({ title: '🔄 أوضاع دائمة', description: 'افتح الإعدادات > أوضاع دائمة' });
                break;

            case 'flashlight':
                toast({ title: '🔦 الكشاف', description: 'سيتم تفعيل كشاف الشاشة بأقصى سطوع' });
                // Simple implementation: change background to white or use Capacitor if available
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

        setShortcutResult({
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

    const handleDailyView = () => {
        onNavigateToTab?.('calendar');
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('change-tab', { detail: 'calendar-daily' }));
        }, 100);
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3 px-2">
                {[
                    { icon: Timer, label: 'مؤقت', color: 'bg-orange-100 text-orange-700', onClick: () => onOpenTimer?.(), onLongPress: () => handleQuickTimer(5) },
                    { icon: Sparkles, label: 'حدث', color: 'bg-purple-100 text-purple-700', onClick: () => setShowEventMenu(true), onLongPress: () => onNavigateToTab?.('appointments') },
                    { icon: DollarSign, label: 'مصروف', color: 'bg-red-100 text-red-700', onClick: () => onOpenAddDialog('expense'), onLongPress: handleShowFinanceSummary },
                    { icon: MapPin, label: 'موقع', color: 'bg-green-100 text-green-700', onClick: () => setShowLocationMenu(true), onLongPress: handleCopyCoords },
                    { icon: ShoppingCart, label: 'تسوق', color: 'bg-pink-100 text-pink-700', onClick: () => onOpenAddDialog('shopping'), onLongPress: () => onNavigateToTab?.('shopping') },

                    { icon: FileText, label: 'ملاحظة', color: 'bg-yellow-100 text-yellow-700', onClick: () => onOpenAddDialog('note'), onLongPress: () => onNavigateToTab?.('notes-v2') },
                    { icon: Search, label: 'بحث', color: 'bg-blue-100 text-blue-700', onClick: () => onOpenSearch?.(), onLongPress: () => navigate('/thesis/dashboard') },
                    { icon: Sparkles, label: 'تخصيص', color: 'bg-teal-100 text-teal-700', onClick: () => setShowShortcutsSettings(true), onLongPress: () => setShowWidgetMenu(true) },
                    { icon: Users, label: 'مهتدين', color: 'bg-emerald-100 text-emerald-700', onClick: () => onOpenNewMuslims?.(), onLongPress: () => toast({ title: '📊 إحصائيات', description: '3 مهتدين جدد هذا الأسبوع' }) },
                    { icon: Settings, label: 'إعدادات', color: 'bg-gray-100 text-gray-700', onClick: () => onNavigateToTab?.('settings'), onLongPress: handleResetSettings },
                ].map((item, idx) => (
                    <QuickActionItem key={idx} item={item} />
                ))}
            </div>

            {/* ===== CUSTOM SHORTCUTS BAR (REMOVED - Rendered externally) ===== */}
            {/* 
            {(customShortcuts.length > 0 || customLocations.length > 0) && (
                <div className="mb-2">
                   ...
                </div>
            )} 
            */}

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

            {/* Widget Selection Menu */}
            <Dialog open={showWidgetMenu} onOpenChange={(open) => { setShowWidgetMenu(open); if (!open) setSelectedWidgets([]); }}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="text-center flex items-center justify-center gap-2">
                            <LayoutGrid className="w-5 h-5 text-teal-500" />
                            أدوات سطح المكتب
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-xs text-gray-500 text-center mb-2">اختر أداة واحدة أو أكثر</p>

                    <div className="grid grid-cols-3 gap-2 py-2">
                        {widgetOptions.map(item => {
                            const isSelected = selectedWidgets.includes(item.type);
                            return (
                                <button
                                    key={item.type}
                                    onClick={() => {
                                        // Special handling for shortcuts - open settings directly
                                        if (item.type === 'shortcuts') {
                                            setShowWidgetMenu(false);
                                            setShowShortcutsSettings(true);
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
                            );
                        })}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 mt-3 pt-3 border-t">
                        <Button
                            className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 font-bold h-10 rounded-xl"
                            disabled={selectedWidgets.length === 0}
                            onClick={openWidgetInline}
                        >
                            <LayoutGrid className="w-3 h-3 ml-1" />
                            عرض هنا ({selectedWidgets.length})
                        </Button>

                        <button
                            onClick={() => { setShowWidgetMenu(false); onOpenAddDialog('project'); }}
                            className="w-full flex items-center justify-center gap-2 p-3 mt-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-100"
                        >
                            <Target className="w-4 h-4" />
                            <span className="text-xs font-bold">بدء مشروع جديد</span>
                        </button>

                        {/* Secondary Buttons - Open in Windows (Desktop) */}
                        {!isMobile && (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 text-xs"
                                    disabled={selectedWidgets.length === 0}
                                    onClick={() => {
                                        selectedWidgets.forEach((type, idx) => {
                                            const item = widgetOptions.find(w => w.type === type);
                                            if (item) {
                                                setTimeout(() => {
                                                    window.open(`${window.location.origin}${window.location.pathname}#/widget?type=${type}`, `Barakah${type}${idx}`, `width=${item.size.split(',')[0]},height=${item.size.split(',')[1]}`);
                                                }, idx * 200);
                                            }
                                        });
                                        setShowWidgetMenu(false);
                                        setSelectedWidgets([]);
                                    }}
                                >
                                    نوافذ منفصلة
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 text-xs"
                                    disabled={selectedWidgets.length === 0}
                                    onClick={() => {
                                        const types = selectedWidgets.join(',');
                                        const height = Math.min(800, 150 + selectedWidgets.length * 120);
                                        window.open(`${window.location.origin}${window.location.pathname}#/widget?type=${types}`, 'BarakahCombined', `width=400,height=${height}`);
                                        setShowWidgetMenu(false);
                                        setSelectedWidgets([]);
                                    }}
                                >
                                    نافذة واحدة
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Inline Widget Display Dialog - Floating Style */}
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


            {/* Shortcuts Settings Dialog */}
            < Dialog open={showShortcutsSettings} onOpenChange={setShowShortcutsSettings} >
                <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-right">
                            <Sparkles className="w-5 h-5 text-emerald-500" />
                            اختصارات مخصصة ({customShortcuts.length})
                        </DialogTitle>
                    </DialogHeader>

                    {/* Current Shortcuts */}
                    {customShortcuts.length > 0 && (
                        <div className="mb-3">
                            <h4 className="text-xs font-bold text-gray-500 mb-2">الاختصارات الحالية</h4>
                            <div className="flex flex-wrap gap-2">
                                {customShortcuts.map(id => {
                                    const action = getActionById(id);
                                    if (!action) return null;
                                    const Icon = action.icon;
                                    return (
                                        <div key={id} className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-1">
                                            <Icon className="w-3 h-3 text-emerald-600" />
                                            <span className="text-xs text-emerald-700">{action.name}</span>
                                            <button
                                                onClick={() => removeShortcut(id)}
                                                className="p-0.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Available Actions */}
                    <div className="flex-1 overflow-y-auto">
                        {/* Custom Locations Management */}
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <h4 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                إضافة موقع سريع
                            </h4>
                            <div className="space-y-2">
                                <Input
                                    placeholder="اسم المكان (مثال: العمل، المطعم المفضل)"
                                    value={newLocName}
                                    onChange={(e) => setNewLocName(e.target.value)}
                                    className="h-8 text-xs"
                                />
                                <div className="flex flex-col gap-2 bg-white p-2 rounded border border-gray-100">
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={handleGetCurrentLocation} disabled={isLoadingLocation} className="text-xs flex-1">
                                            <MapPin className="w-3 h-3 mr-1" /> {isLoadingLocation ? 'جاري التحديد...' : 'موقعي الحالي'}
                                        </Button>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <Input
                                            placeholder="أو ابحث عن العنوان / اسم الشارع..."
                                            value={searchAddress}
                                            onChange={(e) => setSearchAddress(e.target.value)}
                                            className="h-8 text-xs"
                                        />
                                        <Button size="sm" variant="ghost" onClick={handleGenerateUrlFromAddress}>
                                            بحث
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="رابط الخريطة (يتم تعبئته تلقائياً)"
                                        value={newLocUrl}
                                        onChange={(e) => setNewLocUrl(e.target.value)}
                                        className="h-8 text-xs text-left bg-gray-50"
                                        dir="ltr"
                                    />
                                    <Button
                                        size="icon"
                                        className="h-8 w-8 bg-indigo-600 hover:bg-indigo-700"
                                        onClick={() => {
                                            if (newLocName && newLocUrl) {
                                                addLocation(newLocName, newLocUrl);
                                                setNewLocName('');
                                                setNewLocUrl('');
                                                setSearchAddress('');
                                                toast({ title: 'تمت إضافة الموقع' });
                                            } else {
                                                toast({ title: 'يرجى إدخال الاسم والرابط', variant: 'destructive' });
                                            }
                                        }}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* List of custom locations to delete */}
                            {customLocations.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {customLocations.map(loc => (
                                        <div key={loc.id} className="flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2 py-1 shadow-sm">
                                            <span className="text-xs text-gray-600">{loc.name}</span>
                                            <button
                                                onClick={() => removeLocation(loc.id)}
                                                className="p-0.5 text-red-400 hover:text-red-600 rounded-full"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <h4 className="text-xs font-bold text-gray-500 mb-2">إضافة اختصار جديد</h4>

                        {['info', 'action', 'calc', 'remind', 'smart'].map(category => (
                            <div key={category} className="mb-3">
                                <Badge variant="outline" className="mb-2 text-[10px]">
                                    {category === 'info' ? '📊 عرض معلومات' :
                                        category === 'action' ? '⚡ إجراءات سريعة' :
                                            category === 'calc' ? '🧮 حاسبات' :
                                                category === 'remind' ? '🔔 تذكيرات' : '🧠 ذكي'}
                                </Badge>
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                    {AVAILABLE_ACTIONS.filter(a => a.category === category).map(action => {
                                        const isAdded = customShortcuts.includes(action.id);
                                        const Icon = action.icon;
                                        return (
                                            <button
                                                key={action.id}
                                                onClick={() => !isAdded && addShortcut(action.id)}
                                                disabled={isAdded}
                                                className={`flex flex-col items-center justify-between rounded-xl border aspect-square transition-all overflow-hidden ${isAdded
                                                    ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                                                    : 'bg-white border-gray-100 hover:border-emerald-300 hover:bg-emerald-50 shadow-sm'
                                                    }`}
                                            >
                                                {/* 70% Icon */}
                                                <div className="flex-[7] w-full flex items-center justify-center p-2 relative">
                                                    <Icon className="w-[60%] h-[60%] text-gray-600" />
                                                    {!isAdded && (
                                                        <div className="absolute top-1 right-1 bg-emerald-100 rounded-full p-0.5">
                                                            <Plus className="w-2 h-2 text-emerald-600" />
                                                        </div>
                                                    )}
                                                </div>
                                                {/* 30% Label */}
                                                <div className="flex-[3] w-full flex items-center justify-center bg-gray-50 border-t border-gray-100 px-1">
                                                    <span className="text-[9px] font-bold text-gray-700 truncate">
                                                        {action.name}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Done Button */}
                    <div className="pt-3 border-t">
                        <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => setShowShortcutsSettings(false)}
                        >
                            <Sparkles className="w-4 h-4 ml-2" />
                            تم
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Shortcut Result Dialog */}
            < Dialog open={!!shortcutResult && !!shortcutResult.title} onOpenChange={(open) => { if (!open) setShortcutResult(null); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="flex flex-row items-center justify-between">
                        <DialogTitle className="text-right text-lg">{shortcutResult?.title}</DialogTitle>
                        {shortcutResult?.id && ['show_medications', 'show_habits', 'show_appointments', 'show_tasks', 'show_shopping'].includes(shortcutResult.id) && (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 rounded-full bg-teal-50 text-teal-600 hover:bg-teal-100"
                                onClick={() => {
                                    const actionMap: Record<string, string> = {
                                        'show_medications': 'medication',
                                        'show_habits': 'habit',
                                        'show_appointments': 'appointment',
                                        'show_tasks': 'task',
                                        'show_shopping': 'shopping'
                                    };
                                    const actionId = (shortcutResult as any).id;
                                    const type = actionMap[actionId || ''];
                                    if (type) {
                                        setShortcutResult(null);
                                        onOpenAddDialog(type as any);
                                    }
                                }}
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        )}
                    </DialogHeader>
                    <div className="whitespace-pre-wrap text-right text-sm text-gray-700 p-4 bg-gray-50 rounded-lg">
                        {shortcutResult?.content}
                    </div>
                    <Button onClick={() => setShortcutResult(null)} className="w-full mt-2">
                        إغلاق
                    </Button>
                </DialogContent>
            </Dialog>

            {/* Age Calculator Dialog */}
            < Dialog open={showCalcAge} onOpenChange={setShowCalcAge} >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-right">🎂 حساب العمر</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-600 block mb-1">تاريخ الميلاد</label>
                            <Input
                                type="date"
                                value={calcInput1}
                                onChange={(e) => setCalcInput1(e.target.value)}
                            />
                        </div>
                        <Button
                            className="w-full"
                            onClick={() => {
                                if (calcInput1) {
                                    const birth = new Date(calcInput1);
                                    const now = new Date();
                                    const ageMs = now.getTime() - birth.getTime();
                                    const ageYears = Math.floor(ageMs / (365.25 * 24 * 60 * 60 * 1000));
                                    const ageMonths = Math.floor((ageMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
                                    const ageDays = Math.floor((ageMs % (30.44 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000));
                                    const totalDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));
                                    setCalcResult(`العمر: ${ageYears} سنة و ${ageMonths} شهر و ${ageDays} يوم\n\nإجمالي الأيام: ${totalDays.toLocaleString()} يوم`);
                                }
                            }}
                        >
                            احسب
                        </Button>
                        {calcResult && (
                            <div className="p-4 bg-emerald-50 rounded-lg text-right whitespace-pre-wrap">
                                {calcResult}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Days Difference Calculator */}
            < Dialog open={showCalcDays} onOpenChange={setShowCalcDays} >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-right">📆 الفرق بين تاريخين</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-600 block mb-1">التاريخ الأول</label>
                            <Input type="date" value={calcInput1} onChange={(e) => setCalcInput1(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm text-gray-600 block mb-1">التاريخ الثاني</label>
                            <Input type="date" value={calcInput2} onChange={(e) => setCalcInput2(e.target.value)} />
                        </div>
                        <Button
                            className="w-full"
                            onClick={() => {
                                if (calcInput1 && calcInput2) {
                                    const d1 = new Date(calcInput1);
                                    const d2 = new Date(calcInput2);
                                    const diffMs = Math.abs(d2.getTime() - d1.getTime());
                                    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
                                    const weeks = Math.floor(diffDays / 7);
                                    const months = Math.floor(diffDays / 30.44);
                                    setCalcResult(`الفرق: ${diffDays.toLocaleString()} يوم\n\n≈ ${weeks} أسبوع\n≈ ${months} شهر`);
                                }
                            }}
                        >
                            احسب
                        </Button>
                        {calcResult && (
                            <div className="p-4 bg-blue-50 rounded-lg text-right whitespace-pre-wrap">
                                {calcResult}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Percentage Calculator */}
            < Dialog open={showCalcPercentage} onOpenChange={setShowCalcPercentage} >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-right">📊 حساب النسبة المئوية</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-600 block mb-1">النسبة (%)</label>
                            <Input type="number" placeholder="مثال: 15" value={calcInput1} onChange={(e) => setCalcInput1(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm text-gray-600 block mb-1">من الرقم</label>
                            <Input type="number" placeholder="مثال: 200" value={calcInput2} onChange={(e) => setCalcInput2(e.target.value)} />
                        </div>
                        <Button
                            className="w-full"
                            onClick={() => {
                                if (calcInput1 && calcInput2) {
                                    const percent = parseFloat(calcInput1);
                                    const total = parseFloat(calcInput2);
                                    const result = (percent / 100) * total;
                                    setCalcResult(`${percent}% من ${total} = ${result.toLocaleString()}`);
                                }
                            }}
                        >
                            احسب
                        </Button>
                        {calcResult && (
                            <div className="p-4 bg-purple-50 rounded-lg text-right text-lg font-bold">
                                {calcResult}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Currency Converter */}
            < Dialog open={showCalcCurrency} onOpenChange={setShowCalcCurrency} >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-right">💱 تحويل العملات</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-600 block mb-1">المبلغ بالـ ARS</label>
                            <Input type="number" placeholder="أدخل المبلغ" value={calcInput1} onChange={(e) => setCalcInput1(e.target.value)} />
                        </div>
                        <Button
                            className="w-full"
                            onClick={async () => {
                                if (calcInput1) {
                                    setCalcResult('جاري الحساب...');
                                    try {
                                        const res = await fetch('https://dolarapi.com/v1/dolares/blue');
                                        const data = await res.json();
                                        const ars = parseFloat(calcInput1);
                                        const usd = ars / data.venta;
                                        setCalcResult(`${ars.toLocaleString()} ARS = ${usd.toFixed(2)} USD\n\n(سعر البلو: ${data.venta} ARS/USD)`);
                                    } catch {
                                        setCalcResult('خطأ في جلب سعر الدولار');
                                    }
                                }
                            }}
                        >
                            تحويل ARS → USD
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={async () => {
                                if (calcInput1) {
                                    setCalcResult('جاري الحساب...');
                                    try {
                                        const res = await fetch('https://dolarapi.com/v1/dolares/blue');
                                        const data = await res.json();
                                        const usd = parseFloat(calcInput1);
                                        const ars = usd * data.venta;
                                        setCalcResult(`${usd.toLocaleString()} USD = ${ars.toLocaleString()} ARS\n\n(سعر البلو: ${data.venta} ARS/USD)`);
                                    } catch {
                                        setCalcResult('خطأ في جلب سعر الدولار');
                                    }
                                }
                            }}
                        >
                            تحويل USD → ARS
                        </Button>
                        {calcResult && (
                            <div className="p-4 bg-amber-50 rounded-lg text-right whitespace-pre-wrap">
                                {calcResult}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Salary Calculator */}
            < Dialog open={showCalcSalary} onOpenChange={setShowCalcSalary} >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-right">💰 حساب الراتب اليومي</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-600 block mb-1">الراتب الشهري</label>
                            <Input type="number" placeholder="أدخل الراتب" value={calcInput1} onChange={(e) => setCalcInput1(e.target.value)} />
                        </div>
                        <Button
                            className="w-full"
                            onClick={() => {
                                if (calcInput1) {
                                    const salary = parseFloat(calcInput1);
                                    const daily30 = salary / 30;
                                    const dailyWorking = salary / 22; // Approx working days
                                    const hourly = dailyWorking / 8;

                                    setCalcResult(
                                        `الدخل اليومي (30 يوم): ${daily30.toLocaleString(undefined, { maximumFractionDigits: 2 })} ARS\n` +
                                        `الدخل اليومي (أيام عمل ≈ 22): ${dailyWorking.toLocaleString(undefined, { maximumFractionDigits: 2 })} ARS\n` +
                                        `الدخل بالساعة (8 ساعات): ${hourly.toLocaleString(undefined, { maximumFractionDigits: 2 })} ARS`
                                    );
                                }
                            }}
                        >
                            احسب
                        </Button>
                        {calcResult && (
                            <div className="p-4 bg-emerald-50 rounded-lg text-right whitespace-pre-wrap font-medium">
                                {calcResult}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Floating Timer */}
            <FloatingTimer />

            {/* Saved Locations Dialog */}
            <SavedLocationsDialog
                open={showSavedLocations}
                onOpenChange={setShowSavedLocations}
            />
        </>
    );
};

export default QuickActionsGrid;
