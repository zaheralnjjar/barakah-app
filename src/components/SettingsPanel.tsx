import React, { useState } from 'react';
import { Share } from '@capacitor/share';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Settings,
    Shield,
    Database,
    RefreshCw,
    Download,
    Calendar,
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

} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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


    const [activeSection, setActiveSection] = useState<string | null>(null);

    const SETTINGS_SECTIONS = [
        {
            id: 'notifications',
            title: 'التنبيهات',
            icon: Bell,
            color: 'text-orange-500',
            bg: 'bg-orange-50',
            borderColor: 'border-orange-100',
            description: 'تخصيص تنبيهات الصلاة والمهام'
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
            id: 'about',
            title: 'حول التطبيق',
            icon: Settings,
            color: 'text-gray-600',
            bg: 'bg-gray-50',
            borderColor: 'border-gray-100',
            description: 'معلومات الإصدار'
        }
    ];

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
                                        <Calendar className="w-4 h-4 text-green-600" />
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

            {/* 6. About Dialog */}
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
                            <p className="mt-1">بناء: 2026.01.02</p>
                        </div>
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
        </div >
    );
};

export default SettingsPanel;
