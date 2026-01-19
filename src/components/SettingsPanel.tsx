import React, { useState } from 'react';
import { Share } from '@capacitor/share';
import NewMuslimsManager from '@/components/NewMuslims/NewMuslimsManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Settings,
    Shield,
    Database,
    RefreshCw,
    Download,
    Calendar as CalendarIcon,
    LogOut,
    FileSpreadsheet,
    X,
    Circle,
    Plus,
    DollarSign,
    FileText,
    ShoppingCart,
    Pill,
    Bell,
    CheckSquare,
    Volume2,
    Vibrate,
    Clock,
    Zap, // Added icon
    Share2, // Added icon
    Smartphone, // Added icon
    Users, // Added icon
    ChevronUp,
    ChevronDown,
    LayoutDashboard,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import DataBackup from '@/components/DataBackup';
import { useCloudSync } from '@/hooks/useCloudSync';
import { useMultiGoogleSheetsSync } from '@/hooks/useMultiGoogleSheetsSync';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/useAppStore';
import CategoryManager from '@/components/CategoryManager';
import DataArchiver from '@/components/DataArchiver';
import { BatteryOptimizationGuide } from '@/components/BatteryOptimizationGuide';
import { PWAInstallButton } from '@/components/PWAInstallButton';
// import { AutomationBuilder } from '@/components/automation/AutomationBuilder';



import { DateRange } from 'react-day-picker';
import { LocalNotifications } from '@capacitor/local-notifications';

const hashCode = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
};

const SettingsPanel = () => {
    const { toast } = useToast();
    const { t } = useTranslation();
    const { syncNow, pullData, isSyncing } = useCloudSync();
    const { sheets, isSyncing: isSyncingSheets, currentSyncSheet, addSheet, removeSheet, toggleSheet, syncSheet, syncAllSheets } = useMultiGoogleSheetsSync();
    const lastSync = useAppStore(s => s.lastSync);
    const quickActions = useAppStore(s => s.quickActions);

    const [showChangePassword, setShowChangePassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Multi-Sheet Dialog State
    const [showAddSheet, setShowAddSheet] = useState(false);
    const [newSheetName, setNewSheetName] = useState('');
    const [newSheetUrl, setNewSheetUrl] = useState('');

    // Routine Editor State
    const [editingRoutine, setEditingRoutine] = useState<any>(null);
    const [routineItemText, setRoutineItemText] = useState('');
    const [routineItemType, setRoutineItemType] = useState<'task' | 'appointment' | 'habit' | 'medication'>('task');
    const [routineItemTime, setRoutineItemTime] = useState('');
    const [routineItemRepeat, setRoutineItemRepeat] = useState<'daily' | 'weekly' | 'custom' | 'once' | 'monthly'>('daily');
    const [routineItemDays, setRoutineItemDays] = useState<{ [day: string]: string }>({});
    const [routineItemCategory, setRoutineItemCategory] = useState<string>('work'); // New: Category
    const [routineItemStartDate, setRoutineItemStartDate] = useState<string>(''); // New: Start Date
    const [routineItemEndDate, setRoutineItemEndDate] = useState<string>(''); // New: End Date
    const [routineItemDayOfMonth, setRoutineItemDayOfMonth] = useState<number>(1); // New: Monthly Day

    // Routine Activation State
    const [activatingRoutine, setActivatingRoutine] = useState<any>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    const handleActivateRoutine = async () => {
        if (!activatingRoutine || !dateRange?.from || !dateRange?.to) {
            toast({ title: '❌ الرجاء تحديد فترة التفعيل', variant: 'destructive' });
            return;
        }

        const startDate = new Date(dateRange.from);
        const endDate = new Date(dateRange.to);
        endDate.setHours(23, 59, 59, 999);

        let tasksCreated = 0;
        let appointmentsCreated = 0;

        const existingTasks = JSON.parse(localStorage.getItem('baraka_tasks') || '[]');
        const existingAppointments = JSON.parse(localStorage.getItem('baraka_appointments') || '[]');
        const newTasks: any[] = [];
        const newAppointments: any[] = [];
        const notificationsToSchedule: any[] = [];

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = format(d, 'yyyy-MM-dd');
            const getDayId = (date: Date) => ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
            const currentDayId = getDayId(d);

            activatingRoutine.items.forEach((item: any) => {
                let shouldAdd = false;
                let itemTime = item.time;

                // --- Updated Logic: Date Range Check ---
                // If item has specific start/end dates, ensure current date 'd' is within range
                if (item.startDate || item.endDate) {
                    const itemStart = item.startDate ? new Date(item.startDate) : new Date('2000-01-01');
                    const itemEnd = item.endDate ? new Date(item.endDate) : new Date('2100-01-01');
                    // Reset hours for comparison
                    itemStart.setHours(0, 0, 0, 0);
                    itemEnd.setHours(23, 59, 59, 999);

                    if (d < itemStart || d > itemEnd) {
                        return; // Continue to next item without adding
                    }
                }

                if (item.repeat === 'daily') shouldAdd = true;
                else if (item.repeat === 'weekly' && d.getDay() === startDate.getDay()) shouldAdd = true;
                else if (item.repeat === 'custom' && item.customDays?.[currentDayId]) {
                    shouldAdd = true;
                    itemTime = item.customDays[currentDayId];
                }
                else if (item.repeat === 'once' && d.getTime() === startDate.getTime()) shouldAdd = true;
                else if (item.repeat === 'monthly' && d.getDate() === (item.dayOfMonth || 1)) shouldAdd = true; // New Check

                if (shouldAdd) {
                    if (['task', 'habit', 'medication'].includes(item.type)) {
                        const taskId = crypto.randomUUID();
                        const newTask = {
                            id: taskId,
                            title: `${item.type === 'medication' ? '💊 ' : item.type === 'habit' ? '❤️ ' : ''}${item.text}`,
                            description: `Generated from routine: ${activatingRoutine.name}`,
                            deadline: dateStr,
                            time: itemTime,
                            completed: false,
                            priority: 'medium',
                            type: 'task',
                            routineId: activatingRoutine.id,
                            category: item.category || 'work' // Pass Category
                        };
                        newTasks.push(newTask);
                        tasksCreated++;

                        // Schedule Notification for Task if time exists
                        if (itemTime) {
                            const dateObj = new Date(`${dateStr}T${itemTime}`);
                            if (dateObj > new Date()) {
                                notificationsToSchedule.push({
                                    title: item.type === 'medication' ? '💊 وقت الدواء' : item.type === 'habit' ? '❤️ تذكير عادة' : '📝 تذكير بمهمة',
                                    body: item.text,
                                    id: hashCode(taskId),
                                    schedule: { at: dateObj },
                                    sound: 'beep.wav',
                                    extra: { taskId }
                                });
                            }
                        }
                    } else if (item.type === 'appointment') {
                        const apptId = crypto.randomUUID();
                        const newAppt = {
                            id: apptId,
                            title: item.text,
                            date: dateStr,
                            time: itemTime || '09:00',
                            notes: `Generated from routine: ${activatingRoutine.name}`,
                            is_completed: false,
                            routineId: activatingRoutine.id
                        };
                        newAppointments.push(newAppt);
                        appointmentsCreated++;

                        // Schedule Notification for Appointment
                        if (itemTime) {
                            const dateObj = new Date(`${dateStr}T${itemTime}`);
                            if (dateObj > new Date()) {
                                notificationsToSchedule.push({
                                    title: '📅 تذكير بموعد',
                                    body: item.text,
                                    id: hashCode(apptId),
                                    schedule: { at: dateObj },
                                    sound: 'beep.wav',
                                    extra: { appointmentId: apptId }
                                });
                            }
                        }
                    }
                }
            });
        }

        // Save Data
        if (newTasks.length > 0) {
            localStorage.setItem('baraka_tasks', JSON.stringify([...existingTasks, ...newTasks]));
            window.dispatchEvent(new Event('tasks-updated'));
        }
        if (newAppointments.length > 0) {
            localStorage.setItem('baraka_appointments', JSON.stringify([...existingAppointments, ...newAppointments]));
            window.dispatchEvent(new Event('appointments-updated'));
        }

        // Schedule All Notifications
        if (notificationsToSchedule.length > 0) {
            try {
                await LocalNotifications.schedule({ notifications: notificationsToSchedule });
                console.log(`Scheduled ${notificationsToSchedule.length} notifications`);
            } catch (e) {
                console.error("Failed to schedule routine notifications", e);
            }
        }

        // Save Active Routine Reference
        const newActive = {
            id: Date.now().toString(),
            routineId: activatingRoutine.id,
            name: activatingRoutine.name,
            startDate: dateRange.from?.toISOString(),
            endDate: dateRange.to?.toISOString(),
            items: activatingRoutine.items
        };
        const activeRoutines = JSON.parse(localStorage.getItem('baraka_active_routines') || '[]');
        localStorage.setItem('baraka_active_routines', JSON.stringify([...activeRoutines, newActive]));

        // Reset & Feedack
        setActivatingRoutine(null);
        setDateRange(undefined);
        toast({
            title: '✅ تم تفعيل الوضع',
            description: `تم إنشاء ${tasksCreated} مهمة و ${appointmentsCreated} موعد مع التنبيهات`
        });
    };

    const DAYS_OF_WEEK = [
        { id: 'sun', name: 'الأحد' },
        { id: 'mon', name: 'الاثنين' },
        { id: 'tue', name: 'الثلاثاء' },
        { id: 'wed', name: 'الأربعاء' },
        { id: 'thu', name: 'الخميس' },
        { id: 'fri', name: 'الجمعة' },
        { id: 'sat', name: 'السبت' }
    ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    // Reminder Customizations State - Enhanced

    const [reminders, setReminders] = useState<any>(() => {
        try {
            const saved = localStorage.getItem('baraka_reminders_settings');
            const parsed = saved ? JSON.parse(saved) : {};
            return {
                prayer: true,
                tasks: true,
                appointments: true,
                financial: true,
                dailySummary: false,
                sound: true,
                vibration: true,
                reminderMinutes: 15,
                soundType: 'default',
                tickerSpeed: 5,
                ...parsed
            };
        } catch {
            return { prayer: true, tasks: true, appointments: true, financial: true, dailySummary: false, sound: true, vibration: true, reminderMinutes: 15, soundType: 'default', tickerSpeed: 5 };
        }
    });

    const toggleReminder = (key: string) => {
        const newSettings = { ...reminders, [key]: !reminders[key] };
        setReminders(newSettings);
        localStorage.setItem('baraka_reminders_settings', JSON.stringify(newSettings));
        toast({ title: "تم حفظ الإعدادات" });
    };

    const setReminderMinutes = (minutes: number) => {
        const newSettings = { ...reminders, reminderMinutes: minutes };
        setReminders(newSettings);
        localStorage.setItem('baraka_reminders_settings', JSON.stringify(newSettings));
        toast({ title: "تم حفظ وقت التذكير" });
    };
    const setTickerSpeed = (speed: number) => {
        const newSettings = { ...reminders, tickerSpeed: speed };
        setReminders(newSettings);
        localStorage.setItem('baraka_reminders_settings', JSON.stringify(newSettings));
        // Dispatch custom event for same-tab updates
        window.dispatchEvent(new Event('tickerSpeedChanged'));
        toast({ title: "تم تحديث سرعة الشريط" });
    };

    // --- Layout Customization State ---
    const DEFAULT_SECTIONS_ORDER = [
        'notifications', 'new_muslims', 'sync', 'finance',
        'storage', 'security', 'routines', 'about'
    ];

    const [sectionsOrder, setSectionsOrder] = useState<string[]>(() => {
        const saved = localStorage.getItem('baraka_settings_order');
        return saved ? JSON.parse(saved) : DEFAULT_SECTIONS_ORDER;
    });

    const [presets, setPresets] = useState<any[]>(() => {
        const saved = localStorage.getItem('baraka_layout_presets');
        return saved ? JSON.parse(saved) : [];
    });

    const [newPresetName, setNewPresetName] = useState('');

    const savePreset = (name: string) => {
        if (!name.trim()) return;
        const newPreset = { id: Date.now().toString(), name, order: sectionsOrder, dashboardOrder: dashboardSectionsOrder };
        const updated = [...presets, newPreset];
        setPresets(updated);
        localStorage.setItem('baraka_layout_presets', JSON.stringify(updated));
        setNewPresetName('');
        toast({ title: "✅ تم حفظ وضع الترتيب", description: name });
    };

    const loadPreset = (preset: any) => {
        if (preset.order) {
            setSectionsOrder(preset.order);
            localStorage.setItem('baraka_settings_order', JSON.stringify(preset.order));
        }
        if (preset.dashboardOrder) {
            setDashboardSectionsOrder(preset.dashboardOrder);
            localStorage.setItem('baraka_dashboard_order', JSON.stringify(preset.dashboardOrder));
            window.dispatchEvent(new Event('dashboardOrderChanged'));
        }
        toast({ title: "🚀 تم تفعيل وضع الترتيب", description: preset.name });
    };

    const deletePreset = (id: string) => {
        const updated = presets.filter(p => p.id !== id);
        setPresets(updated);
        localStorage.setItem('baraka_layout_presets', JSON.stringify(updated));
    };

    const reorderSection = (index: number, direction: 'up' | 'down') => {
        const newOrder = [...sectionsOrder];
        const nextIndex = direction === 'up' ? index - 1 : index + 1;
        if (nextIndex < 0 || nextIndex >= newOrder.length) return;
        [newOrder[index], newOrder[nextIndex]] = [newOrder[nextIndex], newOrder[index]];
        setSectionsOrder(newOrder);
        localStorage.setItem('baraka_settings_order', JSON.stringify(newOrder));
    };

    // --- Dashboard Layout Customization ---
    // Note: 'stats' and 'quick_actions' are FIXED and not included here
    const DEFAULT_DASHBOARD_ORDER = [
        'daily_report', 'parking', 'notes', 'shopping', 'calendar', 'progress', 'routines'
    ];

    const DASHBOARD_SECTIONS_DATA = [
        { id: 'daily_report', title: 'التقرير اليومي', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'parking', title: 'موقف السيارة', icon: Circle, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { id: 'notes', title: 'الملاحظات السريعة', icon: FileText, color: 'text-yellow-600', bg: 'bg-yellow-50' },
        { id: 'shopping', title: 'قائمة التسوق', icon: ShoppingCart, color: 'text-pink-600', bg: 'bg-pink-50' },
        { id: 'calendar', title: 'التقويم والمواعيد', icon: RefreshCw, color: 'text-orange-600', bg: 'bg-orange-50' },
        { id: 'progress', title: 'إحصائيات التقدم', icon: RefreshCw, color: 'text-purple-600', bg: 'bg-purple-50' },
        { id: 'routines', title: 'الأوضاع الدائمة', icon: RefreshCw, color: 'text-teal-600', bg: 'bg-teal-50' },
    ];

    const [dashboardSectionsOrder, setDashboardSectionsOrder] = useState<string[]>(() => {
        const saved = localStorage.getItem('baraka_dashboard_order');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Validate: ensure all default sections exist
                const validIds = DEFAULT_DASHBOARD_ORDER;
                const hasAllSections = validIds.every(id => parsed.includes(id));
                if (hasAllSections && parsed.length === validIds.length) {
                    return parsed;
                }
                // Reset if corrupted
                localStorage.removeItem('baraka_dashboard_order');
            } catch {
                localStorage.removeItem('baraka_dashboard_order');
            }
        }
        return DEFAULT_DASHBOARD_ORDER;
    });

    const reorderDashboardSection = (index: number, direction: 'up' | 'down') => {
        const newOrder = [...dashboardSectionsOrder];
        const nextIndex = direction === 'up' ? index - 1 : index + 1;
        if (nextIndex < 0 || nextIndex >= newOrder.length) return;
        [newOrder[index], newOrder[nextIndex]] = [newOrder[nextIndex], newOrder[index]];
        setDashboardSectionsOrder(newOrder);
        localStorage.setItem('baraka_dashboard_order', JSON.stringify(newOrder));
        window.dispatchEvent(new Event('dashboardOrderChanged'));
    };

    const [layoutTab, setLayoutTab] = useState<'dashboard' | 'settings'>('dashboard');


    const [activeSection, setActiveSection] = useState<string | null>(null);

    const SETTINGS_SECTIONS_DATA = [
        {
            id: 'notifications',
            title: 'التنبيهات',
            icon: Bell,
            color: 'text-orange-500',
            borderColor: 'border-orange-100',
            description: 'تخصيص تنبيهات الصلاة والمهام'
        },
        {
            id: 'new_muslims',
            title: 'هداية',
            icon: Users,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            borderColor: 'border-emerald-100',
            description: 'إدارة شؤون المسلمين الجدد'
        },
        {
            id: 'sync',
            title: 'المزامنة',
            icon: RefreshCw,
            color: 'text-green-600',
            bg: 'bg-green-50',
            borderColor: 'border-green-100',
            description: 'النسخ السحابي وجداول البيانات'
        },
        {
            id: 'whatsapp',
            title: 'اختصارات واتساب',
            icon: Smartphone,
            color: 'text-green-600',
            bg: 'bg-green-50',
            borderColor: 'border-green-100',
            description: 'إعدادات الإرسال السريع'
        },
        {
            id: 'finance',
            title: 'الإعدادات المالية',
            icon: DollarSign,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            borderColor: 'border-emerald-100',
            description: 'الدورة المالية والفئات'
        },
        {
            id: 'storage',
            title: 'البيانات',
            icon: Database,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            borderColor: 'border-blue-100',
            description: 'النسخ الاحتياطي والأرشفة'
        },
        {
            id: 'security',
            title: 'الأمان',
            icon: Shield,
            color: 'text-red-600',
            bg: 'bg-red-50',
            borderColor: 'border-red-100',
            description: 'كلمة المرور وتسجيل الخروج'
        },
        {
            id: 'routines',
            title: 'أوضاع دائمة',
            icon: RefreshCw,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            borderColor: 'border-purple-100',
            description: 'قوالب روتينية قابلة للتكرار'
        },
        {
            id: 'about',
            title: 'حول التطبيق',
            icon: Settings,
            color: 'text-gray-600',
            bg: 'bg-gray-50',
            borderColor: 'border-gray-100',
            description: 'معلومات الإصدار'
        }
    ];

    // Use fixed order (no more dynamic ordering)
    const SETTINGS_SECTIONS = SETTINGS_SECTIONS_DATA;

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-gray-100 p-2 rounded-xl">
                    <Settings className="w-6 h-6 text-gray-600" />
                </div>
                <h1 className="text-2xl font-bold arabic-title text-gray-800">الإعدادات</h1>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {SETTINGS_SECTIONS.map((section) => {
                    const Icon = section.icon;
                    return (
                        <div
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all hover:scale-[1.02] active:scale-95 ${section.borderColor} ${section.bg} hover:shadow-md h-full flex flex-col items-center justify-center text-center gap-3`}
                        >
                            <div className={`p-3 rounded-full bg-white shadow-sm ${section.color}`}>
                                <Icon className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">{section.title}</h3>
                                <p className="text-[10px] text-gray-500 mt-1">{section.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Dialogs for each section */}

            {/* 1. Notifications Dialog */}
            <Dialog open={activeSection === 'notifications'} onOpenChange={(open) => !open && setActiveSection(null)}>
                <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-orange-500" />
                            تخصيص التنبيهات
                        </DialogTitle>
                    </DialogHeader>
                    {/* Content from Reminder Customizations */}
                    <div className="space-y-6 py-4">
                        {/* Granular Toggles */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <CalendarIcon className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <Label className="text-sm">تنبيهات الصلاة والمواعيد</Label>
                                        <p className="text-[10px] text-gray-500">الأذان، الإقامة، ومواعيدك في التقويم</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={reminders.prayer && reminders.appointments}
                                    onCheckedChange={() => {
                                        toggleReminder('prayer');
                                        toggleReminder('appointments');
                                    }}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <CheckSquare className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <Label className="text-sm">تنبيهات المهام</Label>
                                        <p className="text-[10px] text-gray-500">تذكير بموعد استحقاق المهام</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={reminders.tasks}
                                    onCheckedChange={() => toggleReminder('tasks')}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-yellow-100 rounded-lg">
                                        <DollarSign className="w-4 h-4 text-yellow-600" />
                                    </div>
                                    <div>
                                        <Label className="text-sm">تنبيهات مالية</Label>
                                        <p className="text-[10px] text-gray-500">تجاوز الحد اليومي، استحقاق الفواتير</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={reminders.financial}
                                    onCheckedChange={() => toggleReminder('financial')}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <FileText className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div>
                                        <Label className="text-sm">الملخص اليومي</Label>
                                        <p className="text-[10px] text-gray-500">إشعار صباحي بملخص يومك</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={reminders.dailySummary}
                                    onCheckedChange={() => toggleReminder('dailySummary')}
                                />
                            </div>
                        </div>

                        <div className="h-px bg-gray-100" />

                        {/* Global Settings */}
                        <div className="space-y-4">
                            <Label className="text-sm font-semibold text-gray-700">إعدادات عامة</Label>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Volume2 className="w-4 h-4 text-gray-500" />
                                    <Label className="text-xs">الأصوات</Label>
                                </div>
                                <Switch
                                    checked={reminders.sound}
                                    onCheckedChange={() => toggleReminder('sound')}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Vibrate className="w-4 h-4 text-gray-500" />
                                    <Label className="text-xs">الاهتزاز</Label>
                                </div>
                                <Switch
                                    checked={reminders.vibration}
                                    onCheckedChange={() => toggleReminder('vibration')}
                                />
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between">
                                    <Label className="text-xs">وقت التذكير المسبق</Label>
                                    <span className="text-xs font-bold text-blue-600">{reminders.reminderMinutes} دقيقة</span>
                                </div>
                                <Slider
                                    defaultValue={[reminders.reminderMinutes || 15]}
                                    max={60}
                                    min={5}
                                    step={5}
                                    onValueChange={(vals) => setReminderMinutes(vals[0])}
                                    className="w-full"
                                />
                                <p className="text-[10px] text-gray-400 text-center">كم دقيقة قبل الموعد تريد التنبيه؟</p>
                            </div>

                            <div className="h-px bg-gray-100 my-4" />

                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label className="text-xs">سرعة شريط المعلومات (التيكر)</Label>
                                    <span className="text-xs font-bold text-orange-600">المستوى {reminders.tickerSpeed || 5}</span>
                                </div>
                                <Slider
                                    defaultValue={[reminders.tickerSpeed || 5]}
                                    max={10}
                                    min={1}
                                    step={1}
                                    onValueChange={(vals) => setTickerSpeed(vals[0])}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-[8px] text-gray-400 px-1">
                                    <span>بطيء جدًا</span>
                                    <span>متوسط</span>
                                    <span>سريع جدًا</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 2. Sync Dialog */}
            <Dialog open={activeSection === 'sync'} onOpenChange={(open) => !open && setActiveSection(null)}>
                <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <RefreshCw className="w-5 h-5 text-green-600" />
                            المزامنة والنسخ السحابي
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        {/* Cloud Sync */}
                        <Card className="border-green-100">
                            <CardHeader>
                                <CardTitle className="text-base">{t('sync.syncNow')}</CardTitle>
                                <CardDescription className="text-xs">مزامنة البيانات مع السحابة</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {lastSync && (
                                    <p className="text-sm text-gray-500">
                                        {t('sync.lastSync')}: {new Date(lastSync).toLocaleString('ar-EG')}
                                    </p>
                                )}
                                <div className="flex gap-2">
                                    <Button onClick={() => syncNow()} disabled={isSyncing} className="flex-1 bg-green-600 hover:bg-green-700">
                                        {isSyncing ? <RefreshCw className="w-4 h-4 ml-2 animate-spin" /> : <RefreshCw className="w-4 h-4 ml-2" />}
                                        {t('sync.syncNow')}
                                    </Button>
                                    <Button onClick={() => pullData()} disabled={isSyncing} variant="outline" className="flex-1">
                                        <Download className="w-4 h-4 ml-2" />
                                        {t('sync.pullData')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Google Sheets Sync */}
                        <Card className="border-green-100">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-base">جداول Google Sheets</CardTitle>
                                    <CardDescription className="text-xs">إدارة جداول البيانات المتعددة</CardDescription>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => setShowAddSheet(true)} className="text-xs h-8">
                                    + إضافة جدول
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Sheet List */}
                                {sheets.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-4">لا توجد جداول مضافة</p>
                                ) : (
                                    <div className="space-y-2">
                                        {sheets.map((sheet) => (
                                            <div key={sheet.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={sheet.enabled}
                                                        onCheckedChange={() => toggleSheet(sheet.id)}
                                                    />
                                                    <div>
                                                        <p className="text-sm font-medium">{sheet.name}</p>
                                                        {sheet.lastSync && (
                                                            <p className="text-[10px] text-gray-400">
                                                                آخر مزامنة: {new Date(sheet.lastSync).toLocaleDateString('ar-EG')}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7"
                                                        onClick={() => syncSheet(sheet.id)}
                                                        disabled={isSyncingSheets}
                                                    >
                                                        <RefreshCw className={`w-3 h-3 ${currentSyncSheet === sheet.id ? 'animate-spin' : ''}`} />
                                                    </Button>
                                                    {sheet.id !== 'default' && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7 text-red-500 hover:text-red-600"
                                                            onClick={() => removeSheet(sheet.id)}
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Sync All Button */}
                                <Button
                                    onClick={() => syncAllSheets()}
                                    disabled={isSyncingSheets}
                                    className="w-full bg-green-600 hover:bg-green-700 mt-2"
                                >
                                    {isSyncingSheets ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                                            جاري المزامنة...
                                        </>
                                    ) : (
                                        <>
                                            <FileSpreadsheet className="w-4 h-4 ml-2" />
                                            مزامنة جميع الجداول
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 3. Finance Dialog */}
            <Dialog open={activeSection === 'finance'} onOpenChange={(open) => !open && setActiveSection(null)}>
                <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-emerald-600" />
                            الإعدادات المالية
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <Card className="border-emerald-100">
                            <CardHeader>
                                <CardTitle className="text-base">إعدادات الدورة المالية</CardTitle>
                                <CardDescription className="text-xs">ضبط يوم الراتب وحساب الحد اليومي</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-sm">يوم نزول الراتب</Label>
                                        <p className="text-[10px] text-gray-500">للتجديد التلقائي</p>
                                    </div>
                                    <Select
                                        defaultValue={localStorage.getItem('baraka_salary_day') || '1'}
                                        onValueChange={(val) => {
                                            localStorage.setItem('baraka_salary_day', val);
                                            window.dispatchEvent(new Event('financialSettingsChanged'));
                                            toast({ title: "تم حفظ يوم الراتب" });
                                        }}
                                    >
                                        <SelectTrigger className="w-[80px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[...Array(31)].map((_, i) => (
                                                <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center justify-between border-t pt-4">
                                    <div>
                                        <Label className="text-sm">نهاية الدورة الحالية</Label>
                                        <p className="text-[10px] text-gray-500">حتى هذا التاريخ</p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Input
                                            type="date"
                                            className="w-40 text-center"
                                            defaultValue={localStorage.getItem('baraka_cycle_end_date') || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val) {
                                                    localStorage.setItem('baraka_cycle_end_date', val);
                                                } else {
                                                    localStorage.removeItem('baraka_cycle_end_date');
                                                }
                                                window.dispatchEvent(new Event('financialSettingsChanged'));
                                            }}
                                        />
                                        <Button variant="ghost" size="sm" className="text-xs text-blue-600 h-6" onClick={() => { localStorage.removeItem('baraka_cycle_end_date'); (document.querySelector('input[type="date"]') as HTMLInputElement).value = ''; window.dispatchEvent(new Event('financialSettingsChanged')); toast({ title: "تم التحويل للحساب التلقائي" }); }}>
                                            استخدام يوم الراتب
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="pt-2">
                            <h3 className="font-bold text-gray-700 mb-2">الفئات المالية</h3>
                            <CategoryManager />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 4. Storage Dialog */}
            <Dialog open={activeSection === 'storage'} onOpenChange={(open) => !open && setActiveSection(null)}>
                <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Database className="w-5 h-5 text-blue-600" />
                            البيانات والنسخ الاحتياطي
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <DataArchiver />
                        <div className="h-px bg-gray-100" />
                        <DataBackup />
                    </div>
                </DialogContent>
            </Dialog>

            {/* 5. Security Dialog */}
            <Dialog open={activeSection === 'security'} onOpenChange={(open) => !open && setActiveSection(null)}>
                <DialogContent className="max-w-xs">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Shield className="w-5 h-5" />
                            الأمان
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                        <Button
                            variant="outline"
                            className="w-full h-12 text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 gap-2"
                            onClick={() => setShowChangePassword(true)}
                        >
                            <Shield className="w-5 h-5" />
                            تغيير كلمة المرور
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full h-12 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 gap-2"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-5 h-5" />
                            تسجيل الخروج
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 6. Routines Dialog - أوضاع دائمة */}
            <Dialog open={activeSection === 'routines'} onOpenChange={(open) => !open && setActiveSection(null)}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-purple-600">
                            <RefreshCw className="w-5 h-5" />
                            أوضاع دائمة
                        </DialogTitle>
                        <DialogDescription>
                            إنشاء قوالب روتينية تحتوي على مهام ومواعيد وعادات قابلة للتكرار
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Editing a Routine */}
                        {editingRoutine ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between bg-purple-100 p-3 rounded-lg">
                                    <h4 className="font-bold text-purple-800">{editingRoutine.name}</h4>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingRoutine(null)}>
                                        رجوع
                                    </Button>
                                </div>

                                {/* Items List */}
                                <div className="space-y-2">
                                    <h5 className="text-sm font-bold text-gray-600">العناصر ({editingRoutine.items?.length || 0})</h5>
                                    {editingRoutine.items?.length > 0 ? (
                                        editingRoutine.items.map((item: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                                <span className={`text-xs px-2 py-0.5 rounded ${item.type === 'task' ? 'bg-blue-100 text-blue-700' :
                                                    item.type === 'appointment' ? 'bg-orange-100 text-orange-700' :
                                                        item.type === 'habit' ? 'bg-pink-100 text-pink-700' :
                                                            'bg-cyan-100 text-cyan-700'
                                                    }`}>
                                                    {item.type === 'task' ? 'مهمة' :
                                                        item.type === 'appointment' ? 'موعد' :
                                                            item.type === 'habit' ? 'عادة' : 'دواء'}
                                                </span>
                                                <span className="flex-1 text-sm">{item.text}</span>
                                                {item.time && <span className="text-xs text-gray-500">{item.time}</span>}
                                                <span className="text-[10px] text-purple-500">
                                                    {item.repeat === 'daily' ? 'يومياً' : item.repeat === 'weekly' ? 'أسبوعياً' : 'مرة'}
                                                </span>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 w-6 p-0 text-red-400"
                                                    onClick={() => {
                                                        const updated = { ...editingRoutine };
                                                        updated.items = updated.items.filter((_: any, i: number) => i !== idx);
                                                        setEditingRoutine(updated);
                                                        // Save to storage
                                                        const routines = JSON.parse(localStorage.getItem('baraka_routines') || '[]');
                                                        const routineIdx = routines.findIndex((r: any) => r.id === editingRoutine.id);
                                                        if (routineIdx >= 0) {
                                                            routines[routineIdx] = updated;
                                                            localStorage.setItem('baraka_routines', JSON.stringify(routines));
                                                        }
                                                    }}
                                                >
                                                    ×
                                                </Button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-gray-400 py-4 text-sm">لا توجد عناصر - أضف عناصر أدناه</p>
                                    )}
                                </div>

                                {/* Add New Item Form */}
                                <div className="border-t pt-4 space-y-3">
                                    <h5 className="text-sm font-bold text-gray-600">إضافة عنصر جديد</h5>
                                    <Input
                                        placeholder="النص (مثال: مشي 20 دقيقة)"
                                        value={routineItemText}
                                        onChange={(e) => setRoutineItemText(e.target.value)}
                                        className="text-right"
                                    />
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-[10px] text-gray-500 block mb-1">النوع</label>
                                            <select
                                                value={routineItemType}
                                                onChange={(e) => setRoutineItemType(e.target.value as any)}
                                                className="w-full h-9 text-xs border rounded-md px-2"
                                            >
                                                <option value="task">مهمة</option>
                                                <option value="appointment">موعد</option>
                                                <option value="habit">عادة</option>
                                                <option value="medication">دواء</option>
                                            </select>
                                        </div>
                                    </div>
                                    {/* New: Category Selection */}
                                    <div className="flex gap-2">
                                        <div className="flex-1 space-y-2">
                                            <Label className="text-xs">الفئة</Label>
                                            <Select value={routineItemCategory} onValueChange={setRoutineItemCategory}>
                                                <SelectTrigger className="h-9 text-xs">
                                                    <SelectValue placeholder="اختر الفئة" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="work">عمل</SelectItem>
                                                    <SelectItem value="personal">شخصي</SelectItem>
                                                    <SelectItem value="health">صحة</SelectItem>
                                                    <SelectItem value="family">عائلة</SelectItem>
                                                    <SelectItem value="worship">عبادة</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* New: Date Range (Start/End) */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-2">
                                            <Label className="text-xs">تاريخ البدء (اختياري)</Label>
                                            <Input
                                                type="date"
                                                value={routineItemStartDate}
                                                onChange={(e) => setRoutineItemStartDate(e.target.value)}
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">تاريخ الانتهاء (اختياري)</Label>
                                            <Input
                                                type="date"
                                                value={routineItemEndDate}
                                                onChange={(e) => setRoutineItemEndDate(e.target.value)}
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs">التكرار</Label>
                                        <Select value={routineItemRepeat} onValueChange={(val: any) => {
                                            setRoutineItemRepeat(val);
                                            if (val !== 'custom') {
                                                setRoutineItemDays({});
                                            }
                                        }}>
                                            <SelectTrigger className="h-9 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="daily">يومياً</SelectItem>
                                                <SelectItem value="weekly">أسبوعياً</SelectItem>
                                                <SelectItem value="monthly">شهرياً</SelectItem>
                                                <SelectItem value="custom">أيام مخصصة</SelectItem>
                                                <SelectItem value="once">مرة واحدة</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Time or Monthly Day */}
                                    {routineItemRepeat !== 'custom' && (
                                        <div className="flex gap-2">
                                            <div className="flex-1 space-y-2">
                                                <Label className="text-xs">الوقت</Label>
                                                <Input
                                                    type="time"
                                                    value={routineItemTime}
                                                    onChange={(e) => setRoutineItemTime(e.target.value)}
                                                    className="h-9 text-xs"
                                                />
                                            </div>
                                            {routineItemRepeat === 'monthly' && (
                                                <div className="flex-1 space-y-2">
                                                    <Label className="text-xs">يوم في الشهر</Label>
                                                    <Input
                                                        type="number"
                                                        min={1} max={31}
                                                        value={routineItemDayOfMonth}
                                                        onChange={(e) => setRoutineItemDayOfMonth(parseInt(e.target.value))}
                                                        className="h-9 text-xs"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Custom days with individual times */}
                                    {routineItemRepeat === 'custom' && (
                                        <div className="bg-purple-50 p-3 rounded-lg space-y-2">
                                            <p className="text-xs font-bold text-purple-700 mb-2">اختر الأيام والأوقات:</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {DAYS_OF_WEEK.map(day => (
                                                    <div key={day.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border">
                                                        <input
                                                            type="checkbox"
                                                            id={`day-${day.id}`}
                                                            checked={day.id in routineItemDays}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setRoutineItemDays({ ...routineItemDays, [day.id]: '08:00' });
                                                                } else {
                                                                    const newDays = { ...routineItemDays };
                                                                    delete newDays[day.id];
                                                                    setRoutineItemDays(newDays);
                                                                }
                                                            }}
                                                            className="w-4 h-4"
                                                        />
                                                        <label htmlFor={`day-${day.id}`} className="text-xs flex-1">{day.name}</label>
                                                        {day.id in routineItemDays && (
                                                            <Input
                                                                type="time"
                                                                value={routineItemDays[day.id]}
                                                                onChange={(e) => setRoutineItemDays({ ...routineItemDays, [day.id]: e.target.value })}
                                                                className="h-7 text-xs w-20"
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        className="w-full bg-purple-500 hover:bg-purple-600"
                                        disabled={!routineItemText.trim() || (routineItemRepeat === 'custom' && Object.keys(routineItemDays).length === 0)}
                                        onClick={() => {
                                            const newItem = {
                                                id: Date.now().toString(),
                                                text: routineItemText,
                                                type: routineItemType,
                                                time: routineItemRepeat === 'custom' ? null : (routineItemTime || null),
                                                repeat: routineItemRepeat,
                                                customDays: routineItemRepeat === 'custom' ? routineItemDays : null,
                                                category: routineItemCategory, // Save Category
                                                startDate: routineItemStartDate || null, // Save Start Date
                                                endDate: routineItemEndDate || null, // Save End Date
                                                dayOfMonth: routineItemRepeat === 'monthly' ? routineItemDayOfMonth : null // Save Monthly Day
                                            };
                                            const updated = { ...editingRoutine };
                                            updated.items = [...(updated.items || []), newItem];
                                            setEditingRoutine(updated);
                                            // Save to storage
                                            const routines = JSON.parse(localStorage.getItem('baraka_routines') || '[]');
                                            const routineIdx = routines.findIndex((r: any) => r.id === editingRoutine.id);
                                            if (routineIdx >= 0) {
                                                routines[routineIdx] = updated;
                                                localStorage.setItem('baraka_routines', JSON.stringify(routines));
                                            }
                                            // Reset form
                                            setRoutineItemText('');
                                            setRoutineItemTime('');
                                            setRoutineItemDays({});
                                            setRoutineItemStartDate('');
                                            setRoutineItemEndDate('');
                                            setRoutineItemCategory('work');
                                            toast({ title: '✅ تمت الإضافة' });
                                        }}
                                    >
                                        إضافة العنصر
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Saved Routines List */}
                                {(() => {
                                    const routines = JSON.parse(localStorage.getItem('baraka_routines') || '[]');

                                    return routines.length > 0 ? (
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-bold text-gray-700">الأوضاع المحفوظة</h4>
                                            {routines.map((routine: any, idx: number) => (
                                                <div key={idx} className="p-3 border rounded-lg hover:bg-purple-50 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div
                                                            className="flex-1 cursor-pointer"
                                                            onClick={() => setEditingRoutine(routine)}
                                                        >
                                                            <h5 className="font-bold text-gray-800">{routine.name}</h5>
                                                            <p className="text-xs text-gray-500">
                                                                {routine.items?.length || 0} عناصر - اضغط للتعديل
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-purple-600 border-purple-200 h-8 text-xs"
                                                                onClick={() => setActivatingRoutine(routine)}
                                                            >
                                                                تفعيل
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-red-500 h-8"
                                                                onClick={() => {
                                                                    const id = routine.id;

                                                                    // 1. Delete associated tasks
                                                                    const tasks = JSON.parse(localStorage.getItem('baraka_tasks') || '[]');
                                                                    localStorage.setItem('baraka_tasks', JSON.stringify(tasks.filter((t: any) => t.routineId !== id)));

                                                                    // 2. Delete associated appointments
                                                                    const appts = JSON.parse(localStorage.getItem('baraka_appointments') || '[]');
                                                                    localStorage.setItem('baraka_appointments', JSON.stringify(appts.filter((a: any) => a.routineId !== id)));

                                                                    // 3. Delete active routines
                                                                    const active = JSON.parse(localStorage.getItem('baraka_active_routines') || '[]');
                                                                    localStorage.setItem('baraka_active_routines', JSON.stringify(active.filter((ar: any) => ar.routineId !== id)));

                                                                    // Dispatch updates
                                                                    window.dispatchEvent(new Event('tasks-updated'));
                                                                    window.dispatchEvent(new Event('appointments-updated'));

                                                                    const updated = routines.filter((_: any, i: number) => i !== idx);
                                                                    localStorage.setItem('baraka_routines', JSON.stringify(updated));
                                                                    toast({ title: '🗑️ تم الحذف', description: 'تم حذف القالب وجميع الأحداث المرتبطة به' });
                                                                    setActiveSection(null);
                                                                    setTimeout(() => setActiveSection('routines'), 100);
                                                                }}
                                                            >
                                                                حذف
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <RefreshCw className="w-12 h-12 mx-auto mb-3 text-purple-200" />
                                            <p>لا توجد أوضاع محفوظة</p>
                                            <p className="text-xs mt-1">أنشئ وضعاً جديداً لتنظيم روتينك</p>
                                        </div>
                                    );
                                })()}

                                {/* Create New Routine */}
                                <div className="border-t pt-4">
                                    <h4 className="text-sm font-bold text-gray-700 mb-3">إنشاء وضع جديد</h4>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="اسم الوضع (مثال: أسبوع صحي)"
                                            id="new-routine-name"
                                            className="text-right flex-1"
                                        />
                                        <Button
                                            className="bg-purple-500 hover:bg-purple-600"
                                            onClick={() => {
                                                const name = (document.getElementById('new-routine-name') as HTMLInputElement)?.value;
                                                if (!name?.trim()) {
                                                    toast({ title: 'أدخل اسم الوضع', variant: 'destructive' });
                                                    return;
                                                }
                                                const newRoutine = {
                                                    id: Date.now().toString(),
                                                    name: name.trim(),
                                                    items: [],
                                                    createdAt: new Date().toISOString()
                                                };
                                                const routines = JSON.parse(localStorage.getItem('baraka_routines') || '[]');
                                                routines.push(newRoutine);
                                                localStorage.setItem('baraka_routines', JSON.stringify(routines));
                                                (document.getElementById('new-routine-name') as HTMLInputElement).value = '';
                                                setEditingRoutine(newRoutine);
                                                toast({ title: '✅ تم إنشاء الوضع' });
                                            }}
                                        >
                                            إنشاء
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* WhatsApp Shortcuts Dialog */}
            <Dialog open={activeSection === 'whatsapp'} onOpenChange={(open) => !open && setActiveSection(null)}>
                <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-green-600" />
                            اختصارات واتساب
                        </DialogTitle>
                        <DialogDescription>
                            إعداد رقم الواتساب وتخصيص الاختصارات
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* WhatsApp Number */}
                        <div className="space-y-2">
                            <Label htmlFor="whatsapp_number">رقم الواتساب (مع رمز الدولة)</Label>
                            <Input
                                id="whatsapp_number"
                                type="tel"
                                placeholder="مثال: 5491123456789"
                                defaultValue={localStorage.getItem('baraka_whatsapp_number') || ''}
                                onChange={(e) => localStorage.setItem('baraka_whatsapp_number', e.target.value)}
                                className="text-left"
                                dir="ltr"
                            />
                            <p className="text-xs text-gray-500">أدخل الرقم بدون + أو مسافات</p>
                        </div>

                        {/* Built-in Shortcuts */}
                        <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                            <h4 className="font-semibold text-green-700 mb-2">الاختصارات المدمجة:</h4>
                            <ul className="text-sm text-green-600 space-y-1">
                                <li>📍 حفظ الموقع - يرسل موقعك مع رابط الخريطة</li>
                                <li>💵 سعر الدولار - البيسو الأرجنتيني (رسمي + بلو)</li>
                                <li>🕌 مواقيت الصلاة - الصلوات الخمس</li>
                            </ul>
                        </div>

                        {/* Quick Send Buttons */}
                        <div className="space-y-2">
                            <h4 className="font-semibold text-gray-700">إرسال سريع:</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const number = localStorage.getItem('baraka_whatsapp_number');
                                        if (!number) { toast({ title: 'أدخل رقم WhatsApp أولاً', variant: 'destructive' }); return; }
                                        window.open(`https://wa.me/${number}?text=${encodeURIComponent('🏠 أنا في البيت')}`, '_blank');
                                    }}
                                >
                                    🏠 أنا في البيت
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const number = localStorage.getItem('baraka_whatsapp_number');
                                        if (!number) { toast({ title: 'أدخل رقم WhatsApp أولاً', variant: 'destructive' }); return; }
                                        window.open(`https://wa.me/${number}?text=${encodeURIComponent('🚗 أنا في الطريق')}`, '_blank');
                                    }}
                                >
                                    🚗 في الطريق
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const number = localStorage.getItem('baraka_whatsapp_number');
                                        if (!number) { toast({ title: 'أدخل رقم WhatsApp أولاً', variant: 'destructive' }); return; }
                                        window.open(`https://wa.me/${number}?text=${encodeURIComponent('✅ وصلت بسلام')}`, '_blank');
                                    }}
                                >
                                    ✅ وصلت
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const number = localStorage.getItem('baraka_whatsapp_number');
                                        if (!number) { toast({ title: 'أدخل رقم WhatsApp أولاً', variant: 'destructive' }); return; }
                                        window.open(`https://wa.me/${number}?text=${encodeURIComponent('📞 اتصل بي')}`, '_blank');
                                    }}
                                >
                                    📞 اتصل بي
                                </Button>
                            </div>
                        </div>

                        <p className="text-xs text-gray-400 text-center">
                            اضغط مطولاً على أيقونة التطبيق في الشاشة الرئيسية للوصول السريع
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* 7. About Dialog */}
            <Dialog open={activeSection === 'about'} onOpenChange={(open) => !open && setActiveSection(null)}>
                <DialogContent className="max-w-xs text-center">
                    <DialogHeader>
                        <DialogTitle className="justify-center flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            حول التطبيق
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-6 text-gray-600">
                        <div className="w-20 h-20 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                            <span className="text-4xl">🕋</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">نظام بركة</h2>
                        <p className="text-sm mt-1">لإدارة الحياة</p>
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs">
                            <p>الإصدار: 14.0.0</p>
                            <p className="mt-1">بناء: 2026.01.03</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Routine Activation Dialog */}
            <Dialog open={!!activatingRoutine} onOpenChange={(open) => !open && setActivatingRoutine(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-purple-600">
                            <Clock className="w-5 h-5" />
                            تفعيل {activatingRoutine?.name}
                        </DialogTitle>
                        <DialogDescription>
                            حدد المدة الزمنية لتفعيل هذا الروتين
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center space-y-4 py-4">
                        <div className="border rounded-lg p-2 bg-gray-50">
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={setDateRange}
                                locale={arSA}
                                className="rounded-md border bg-white"
                                dir="rtl"
                            />
                        </div>

                        {dateRange?.from && (
                            <div className="text-sm text-center bg-purple-50 p-2 rounded w-full">
                                <span className="font-bold text-purple-700">الفترة المحددة:</span>
                                <div className="mt-1">
                                    {format(dateRange.from, 'dd MMM', { locale: arSA })}
                                    {dateRange.to && ` - ${format(dateRange.to, 'dd MMM', { locale: arSA })}`}
                                </div>
                            </div>
                        )}

                        <Button
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                            disabled={!dateRange?.from || !dateRange?.to}
                            onClick={handleActivateRoutine}
                        >
                            تأكيد التفعيل وجدولة التنبيهات
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Change Password Dialog (Nested) */}
            <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-right flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-600" />
                            تغيير كلمة المرور
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label className="text-right block mb-2">كلمة المرور الجديدة</Label>
                            <Input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="أدخل كلمة المرور الجديدة"
                                className="text-right"
                            />
                        </div>
                        <div>
                            <Label className="text-right block mb-2">تأكيد كلمة المرور</Label>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="أعد إدخال كلمة المرور"
                                className="text-right"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowChangePassword(false)} className="flex-1">
                            إلغاء
                        </Button>
                        <Button
                            onClick={async () => {
                                if (newPassword !== confirmPassword) {
                                    toast({ title: "خطأ", description: "كلمتا المرور غير متطابقتين", variant: "destructive" });
                                    return;
                                }
                                if (newPassword.length < 6) {
                                    toast({ title: "خطأ", description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل", variant: "destructive" });
                                    return;
                                }
                                const { error } = await supabase.auth.updateUser({ password: newPassword });
                                if (error) {
                                    toast({ title: "خطأ", description: error.message, variant: "destructive" });
                                } else {
                                    toast({ title: "تم بنجاح", description: "تم تغيير كلمة المرور" });
                                    setShowChangePassword(false);
                                    setNewPassword('');
                                    setConfirmPassword('');
                                }
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                            تغيير
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Sheet Dialog (Nested) */}
            <Dialog open={showAddSheet} onOpenChange={setShowAddSheet}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="arabic-title">إضافة جدول Google Sheets</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div>
                            <Label className="arabic-body">اسم الجدول (للتمييز)</Label>
                            <Input
                                placeholder="مثال: مصروفات الزوجة"
                                value={newSheetName}
                                onChange={(e) => setNewSheetName(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label className="arabic-body">رابط الجدول المنشور</Label>
                            <Input
                                placeholder="https://docs.google.com/spreadsheets/..."
                                value={newSheetUrl}
                                onChange={(e) => setNewSheetUrl(e.target.value)}
                                className="mt-1 dir-ltr text-left"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">
                                انشر الجدول عبر: ملف {">"} مشاركة {">"} نشر على الويب
                            </p>
                        </div>
                        <Button
                            onClick={() => {
                                if (newSheetName && newSheetUrl) {
                                    addSheet(newSheetName, newSheetUrl);
                                    setNewSheetName('');
                                    setNewSheetUrl('');
                                    setShowAddSheet(false);
                                }
                            }}
                            className="w-full"
                            disabled={!newSheetName || !newSheetUrl}
                        >
                            إضافة الجدول
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* New Muslim Care Dialog */}
            <Dialog open={activeSection === 'new_muslims'} onOpenChange={(open) => !open && setActiveSection(null)}>
                <DialogContent
                    className="w-[98vw] sm:max-w-5xl max-h-[95vh] overflow-y-auto p-0"
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader className="sticky top-0 z-50 bg-white border-b p-3 flex flex-row items-center justify-between">
                        <DialogTitle className="flex items-center gap-2 text-emerald-700">
                            <Users className="w-5 h-5" />
                            هداية
                        </DialogTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setActiveSection(null)}
                            className="h-8 w-8 rounded-full hover:bg-red-100 text-red-500"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </DialogHeader>
                    <div className="p-2 sm:p-4">
                        <NewMuslimsManager />
                    </div>
                </DialogContent>
            </Dialog>


        </div >
    );
};

export default SettingsPanel;
