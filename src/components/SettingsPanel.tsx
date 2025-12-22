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
    DollarSign,
    PlusCircle,
    MinusCircle,
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
    const DEFAULT_ORDER = [
        'header',
        'prayer',
        'finance_summary',
        'appointments_widget',
        'quick_actions',
        'full_map'
    ];
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
        window.dispatchEvent(new Event('dashboard_order_updated'));
        toast({ title: "تم تحديث الترتيب" });
    };

    const SECTION_LABELS: Record<string, string> = {
        'header': '🏠 رأس الصفحة (التاريخ والوقت)',
        'prayer': '🕌 أوقات الصلاة',
        'finance_daily': '💸 مصروف اليوم',
        'finance_summary': '💰 الملخص المالي',
        'appointments_widget': '📅 المواعيد والتذكيرات (ملخص)',
        'shopping_widget': '🛒 قائمة التسوق (ملخص)',
        'quick_actions': '⚡ الاختصارات السريعة',
        'full_map': '🗺️ الخريطة التفاعلية (كاملة)',
        'saved_locations': '📍 المواقع المحفوظة',
        'daily_calendar': '📅 التقويم اليومي',
        'full_appointments': '📝 إدارة المواعيد (كاملة)',
        'full_shopping': '🛍️ قائمة التسوق (كاملة)',
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
                ...parsed
            };
        } catch {
            return { prayer: true, tasks: true, appointments: true, financial: true, dailySummary: false, sound: true, vibration: true, reminderMinutes: 15, soundType: 'default' };
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
                    <CardDescription className="arabic-body text-xs">اسحب الأقسام لإعادة ترتيبها</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {dashboardOrder.map((section, index) => (
                        <div
                            key={section}
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData("text/plain", index.toString());
                                e.currentTarget.style.opacity = "0.5";
                            }}
                            onDragEnd={(e) => {
                                e.currentTarget.style.opacity = "1";
                            }}
                            onDragOver={(e) => {
                                e.preventDefault(); // Necessary to allow dropping
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                const draggedIdx = parseInt(e.dataTransfer.getData("text/plain"));
                                if (draggedIdx !== index) {
                                    const newLineup = [...dashboardOrder];
                                    const [movedItem] = newLineup.splice(draggedIdx, 1);
                                    newLineup.splice(index, 0, movedItem);
                                    setDashboardOrder(newLineup);
                                    localStorage.setItem('baraka_dashboard_order', JSON.stringify(newLineup));
                                    window.dispatchEvent(new Event('dashboard_order_updated'));
                                    toast({ title: "تم الترتيب" });
                                }
                            }}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border cursor-move hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400">☰</span>
                                <span className="font-medium arabic-body">{SECTION_LABELS[section]}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    const newOrder = dashboardOrder.filter((_, i) => i !== index);
                                    setDashboardOrder(newOrder);
                                    localStorage.setItem('baraka_dashboard_order', JSON.stringify(newOrder));
                                    window.dispatchEvent(new Event('dashboard_order_updated'));
                                }}
                                className="text-red-500 hover:bg-red-50 hover:text-red-600 h-8 w-8 p-0"
                            >
                                <MinusCircle className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}

                    {/* Available Sections */}
                    <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-bold mb-3 text-gray-600 flex items-center gap-2">
                            <PlusCircle className="w-4 h-4" />
                            أقسام متاحة للإضافة:
                        </h4>
                        <div className="grid gap-2">
                            {Object.keys(SECTION_LABELS).filter(s => !dashboardOrder.includes(s)).map(section => (
                                <div key={section} className="flex items-center justify-between p-3 bg-white border border-dashed rounded-lg hover:bg-gray-50">
                                    <span className="text-sm text-gray-600">{SECTION_LABELS[section]}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            const newOrder = [...dashboardOrder, section];
                                            setDashboardOrder(newOrder);
                                            localStorage.setItem('baraka_dashboard_order', JSON.stringify(newOrder));
                                            window.dispatchEvent(new Event('dashboard_order_updated'));
                                        }}
                                        className="text-emerald-600 hover:bg-emerald-50 h-8 w-8 p-0"
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            {Object.keys(SECTION_LABELS).filter(s => !dashboardOrder.includes(s)).length === 0 && (
                                <p className="text-xs text-gray-400 text-center py-2">جميع الأقسام مضافة</p>
                            )}
                        </div>
                    </div>
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
                    <div className="border-t pt-3 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="font-medium text-sm">🔊 الأصوات</label>
                            <Checkbox checked={reminders.sound} onCheckedChange={() => toggleReminder('sound')} />
                        </div>
                        {reminders.sound && (
                            <div className="pr-4">
                                <label className="text-xs text-gray-500 block mb-1">نغمة التنبيه</label>
                                <select
                                    className="w-full text-sm border rounded p-1"
                                    value={reminders.soundType || 'default'}
                                    onChange={(e) => {
                                        const newSound = e.target.value;
                                        const updated = { ...reminders, soundType: newSound };
                                        setReminders(updated);
                                        localStorage.setItem('baraka_reminders_settings', JSON.stringify(updated));

                                        // Play demo sound
                                        try {
                                            const audio = new Audio(`/sounds/${newSound}.mp3`);
                                            audio.play().catch(e => console.log('Audio error:', e));
                                        } catch (e) {
                                            console.error("Audio playback failed", e);
                                        }
                                    }}
                                >
                                    <option value="default">الافتراضي (بسيط)</option>
                                    <option value="athan_short">أذان قصير</option>
                                    <option value="beep">تنبيه رقمي</option>
                                    <option value="bell">جرس</option>
                                    <option value="gentle">هادئ</option>
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center justify-between pt-2">
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
