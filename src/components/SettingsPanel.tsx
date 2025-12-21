import React, { useState } from 'react';
import { Share } from '@capacitor/share';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
    Settings,
    User,
    Shield,
    Database,
    LogOut,
    Layout,
    ArrowUp,
    ArrowDown,
    RefreshCw,
    Download,
    Globe,
    PieChart,
    FileText,
    Calendar,
    DollarSign
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DataBackup from '@/components/DataBackup';
import { useCloudSync } from '@/hooks/useCloudSync';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/useAppStore';
import CategoryManager from '@/components/CategoryManager';

const SettingsPanel = () => {
    const { toast } = useToast();
    const { t } = useTranslation();
    const { syncNow, pullData, isSyncing } = useCloudSync();
    const lastSync = useAppStore(s => s.lastSync);
    const quickActions = useAppStore(s => s.quickActions);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    // Dashboard Customization Logic
    const DEFAULT_ORDER = ['expense', 'prayer', 'finance', 'appointments', 'shopping', 'quick_actions'];
    const [dashboardOrder, setDashboardOrder] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('baraka_dashboard_order');
            return saved ? JSON.parse(saved) : DEFAULT_ORDER;
        } catch { return DEFAULT_ORDER; }
    });

    const moveSection = (index: number, direction: 'up' | 'down') => {
        const newOrder = [...dashboardOrder];
        if (direction === 'up' && index > 0) {
            [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
        } else if (direction === 'down' && index < newOrder.length - 1) {
            [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        }
        setDashboardOrder(newOrder);
        localStorage.setItem('baraka_dashboard_order', JSON.stringify(newOrder));
        toast({ title: "تم تحديث الترتيب", description: "سيتم تطبيق التغييرات في الرئيسية" });
    };

    const SECTION_LABELS: Record<string, string> = {
        'expense': 'مصروف اليوم',
        'prayer': 'أوقات الصلاة',
        'finance': 'الملخص المالي',
        'appointments': 'المواعيد والتذكيرات',
        'shopping': 'قائمة التسوق',
        'quick_actions': 'الاختصارات السريعة'
    };

    // Reminder Customizations State - Enhanced
    const [reminders, setReminders] = useState(() => {
        try {
            const saved = localStorage.getItem('baraka_reminders_settings');
            return saved ? JSON.parse(saved) : {
                prayer: true,
                tasks: true,
                appointments: true,
                financial: true,
                dailySummary: false,
                sound: true,
                vibration: true,
                reminderMinutes: 15
            };
        } catch {
            return { prayer: true, tasks: true, appointments: true, financial: true, dailySummary: false, sound: true, vibration: true, reminderMinutes: 15 };
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



    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-gray-100 p-2 rounded-xl">
                    <Settings className="w-6 h-6 text-gray-600" />
                </div>
                <h1 className="text-2xl font-bold arabic-title text-gray-800">الإعدادات</h1>
            </div>

            {/* Statistics Entry Point */}
            <Card
                className="cursor-pointer hover:border-orange-300 transition-colors"
                onClick={() => {
                    // Navigate to analytics - need to call parent navigation
                    // For now, use a workaround with window event
                    window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: 'analytics' }));
                }}
            >
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-100 p-2 rounded-xl">
                            <PieChart className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="font-bold arabic-title">الإحصائيات والتقارير</h3>
                            <p className="text-xs text-gray-500">عرض التحليلات والرسوم البيانية</p>
                        </div>
                    </div>
                    <span className="text-gray-400">←</span>
                </CardContent>
            </Card>

            {/* Interface Customization */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg arabic-title">
                        <Layout className="w-5 h-5 text-purple-600" />
                        تخصيص الواجهة الرئيسية
                    </CardTitle>
                    <CardDescription className="arabic-body text-xs">رتب الأقسام حسب أولويتك</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {dashboardOrder.map((section, index) => (
                        <div key={section} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                            <span className="font-medium arabic-body">{SECTION_LABELS[section]}</span>
                            <div className="flex gap-1">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    disabled={index === 0}
                                    onClick={() => moveSection(index, 'up')}
                                >
                                    <ArrowUp className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    disabled={index === dashboardOrder.length - 1}
                                    onClick={() => moveSection(index, 'down')}
                                >
                                    <ArrowDown className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Reminder Customizations - Enhanced */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg arabic-title">
                        <Calendar className="w-5 h-5 text-teal-600" />
                        تخصيص التذكيرات
                    </CardTitle>
                    <CardDescription className="arabic-body text-xs">التحكم في الإشعارات والتنبيهات</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <label className="font-medium text-sm">🕌 إشعارات الصلاة</label>
                        <Checkbox checked={reminders.prayer} onCheckedChange={() => toggleReminder('prayer')} />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <label className="font-medium text-sm">✅ تذكير المهام</label>
                        <Checkbox checked={reminders.tasks} onCheckedChange={() => toggleReminder('tasks')} />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <label className="font-medium text-sm">📅 تذكير المواعيد</label>
                        <Checkbox checked={reminders.appointments} onCheckedChange={() => toggleReminder('appointments')} />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <label className="font-medium text-sm">💰 تنبيهات مالية</label>
                        <Checkbox checked={reminders.financial} onCheckedChange={() => toggleReminder('financial')} />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <label className="font-medium text-sm">📊 ملخص يومي</label>
                        <Checkbox checked={reminders.dailySummary} onCheckedChange={() => toggleReminder('dailySummary')} />
                    </div>
                    <div className="border-t pt-3">
                        <p className="text-xs text-gray-500 mb-2">وقت التذكير قبل الموعد</p>
                        <div className="flex gap-2">
                            {[5, 10, 15, 30, 60].map(min => (
                                <button
                                    key={min}
                                    onClick={() => setReminderMinutes(min)}
                                    className={`px-3 py-1 rounded-full text-xs ${reminders.reminderMinutes === min ? 'bg-primary text-white' : 'bg-gray-100'}`}
                                >
                                    {min} دقيقة
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="border-t pt-3 flex items-center justify-between">
                        <label className="font-medium text-sm">🔊 الأصوات</label>
                        <Checkbox checked={reminders.sound} onCheckedChange={() => toggleReminder('sound')} />
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="font-medium text-sm">📳 الاهتزاز</label>
                        <Checkbox checked={reminders.vibration} onCheckedChange={() => toggleReminder('vibration')} />
                    </div>
                </CardContent>
            </Card>
            {/* Quick Actions Customization */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg arabic-title">
                        <Settings className="w-5 h-5 text-orange-600" />
                        تخصيص الاختصارات السريعة
                    </CardTitle>
                    <CardDescription className="arabic-body text-xs">اختر الأزرار التي تظهر في لوحة التحكم</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { id: 'expense', label: 'إضافة مصروف' },
                            { id: 'income', label: 'إضافة دخل' },
                            { id: 'appointment', label: 'إضافة موعد' },
                            { id: 'shopping', label: 'قائمة التسوق' },
                            { id: 'task', label: 'إضافة مهمة' },
                            { id: 'location', label: 'حفظ الموقع' },
                        ].map((action) => (
                            <div key={action.id} className="flex items-center space-x-2 space-x-reverse justify-end bg-gray-50 p-3 rounded-lg border">
                                <label
                                    htmlFor={`action-${action.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 text-right"
                                >
                                    {action.label}
                                </label>
                                <Checkbox
                                    id={`action-${action.id}`}
                                    checked={quickActions.includes(action.id)}
                                    onCheckedChange={(checked) => {
                                        let newActions;
                                        if (checked) {
                                            newActions = [...quickActions, action.id];
                                        } else {
                                            newActions = quickActions.filter(id => id !== action.id);
                                        }
                                        useAppStore.getState().setQuickActions(newActions);
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Cloud Sync Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg arabic-title">
                        <RefreshCw className="w-5 h-5 text-green-600" />
                        {t('sync.syncNow')}
                    </CardTitle>
                    <CardDescription className="arabic-body text-xs">
                        مزامنة البيانات مع السحابة
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {lastSync && (
                        <p className="text-sm text-gray-500">
                            {t('sync.lastSync')}: {new Date(lastSync).toLocaleString('ar-EG')}
                        </p>
                    )}
                    <div className="flex gap-2">
                        <Button
                            onClick={() => syncNow()}
                            disabled={isSyncing}
                            className="flex-1"
                            data-action="sync-now"
                        >
                            {isSyncing ? (
                                <>
                                    <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                                    {t('sync.syncing')}
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4 ml-2" />
                                    {t('sync.syncNow')}
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={() => pullData()}
                            disabled={isSyncing}
                            variant="outline"
                            className="flex-1"
                        >
                            <Download className="w-4 h-4 ml-2" />
                            {t('sync.pullData')}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Financial Categories */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg arabic-title">
                        <Database className="w-5 h-5 text-purple-600" />
                        الفئات المالية
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <CategoryManager />
                </CardContent>
            </Card>

            {/* Backup & Data */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg arabic-title">
                        <Database className="w-5 h-5 text-blue-600" />
                        البيانات والنسخ الاحتياطي
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <DataBackup />
                </CardContent>
            </Card>

            {/* App Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg arabic-title">
                        <Shield className="w-5 h-5 text-gray-600" />
                        حول التطبيق
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-gray-600 space-y-2">
                        <p>الإصدار: 14.0.0</p>
                        <p>نظام بركة لإدارة الحياة</p>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
};

export default SettingsPanel;
