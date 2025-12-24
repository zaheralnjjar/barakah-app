import React, { useState } from 'react';
import { Share } from '@capacitor/share';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
    Settings,
    Shield,
    Database,
    RefreshCw,
    Download,
    Calendar,
    LogOut,
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
import DataArchiver from '@/components/DataArchiver';
import { BatteryOptimizationGuide } from '@/components/BatteryOptimizationGuide';
import { PWAInstallButton } from '@/components/PWAInstallButton';

const SettingsPanel = () => {
    const { toast } = useToast();
    const { t } = useTranslation();
    const { syncNow, pullData, isSyncing } = useCloudSync();
    const lastSync = useAppStore(s => s.lastSync);
    const quickActions = useAppStore(s => s.quickActions);

    const [showChangePassword, setShowChangePassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

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

            {/* Application Tools */}
            <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100 mb-6 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg arabic-title text-indigo-700">
                        <Shield className="w-5 h-5" />
                        أدوات التطبيق
                    </CardTitle>
                    <CardDescription className="arabic-body text-xs text-indigo-600/80">تحسين الأداء والتثبيت</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <PWAInstallButton />
                    <BatteryOptimizationGuide />
                </CardContent>
            </Card>

            {/* Application Tools */}
            <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-100 mb-6 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg arabic-title text-indigo-700">
                        <Shield className="w-5 h-5" />
                        أدوات التطبيق
                    </CardTitle>
                    <CardDescription className="arabic-body text-xs text-indigo-600/80">تحسين الأداء والتثبيت</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <PWAInstallButton />
                    <BatteryOptimizationGuide />
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
                            <div className="pr-4 space-y-2">
                                <label className="text-xs text-gray-500 block mb-1">نغمة التنبيه</label>
                                <div className="flex gap-2">
                                    <select
                                        className="flex-1 text-sm border rounded p-1.5"
                                        value={reminders.soundType || 'default'}
                                        onChange={(e) => {
                                            const newSound = e.target.value;
                                            const updated = { ...reminders, soundType: newSound };
                                            setReminders(updated);
                                            localStorage.setItem('baraka_reminders_settings', JSON.stringify(updated));
                                        }}
                                    >
                                        <optgroup label="🔔 أصوات بسيطة">
                                            <option value="default">الافتراضي</option>
                                            <option value="beep">تنبيه رقمي</option>
                                            <option value="bell">جرس</option>
                                            <option value="gentle">هادئ</option>
                                            <option value="chime">رنين</option>
                                        </optgroup>
                                        <optgroup label="🕌 إسلامية">
                                            <option value="athan_short">أذان قصير</option>
                                            <option value="takbir">تكبير</option>
                                            <option value="bismillah">بسملة</option>
                                        </optgroup>
                                        <optgroup label="🎵 موسيقى">
                                            <option value="piano">بيانو</option>
                                            <option value="harp">قيثارة</option>
                                            <option value="marimba">ماريمبا</option>
                                        </optgroup>
                                        <optgroup label="🌿 طبيعة">
                                            <option value="bird">طيور</option>
                                            <option value="water">ماء</option>
                                            <option value="wind">رياح</option>
                                        </optgroup>
                                    </select>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="px-3"
                                        onClick={() => {
                                            try {
                                                const soundType = reminders.soundType || 'default';
                                                const audio = new Audio(`/sounds/${soundType}.mp3`);
                                                audio.volume = (reminders.volume || 100) / 100;
                                                audio.play().catch(e => console.log('Audio error:', e));
                                            } catch (e) {
                                                console.error("Audio playback failed", e);
                                            }
                                        }}
                                    >
                                        ▶️ معاينة
                                    </Button>
                                </div>

                                {/* Volume Control */}
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-gray-500">🔈</span>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={reminders.volume || 100}
                                        onChange={(e) => {
                                            const updated = { ...reminders, volume: parseInt(e.target.value) };
                                            setReminders(updated);
                                            localStorage.setItem('baraka_reminders_settings', JSON.stringify(updated));
                                        }}
                                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <span className="text-xs text-gray-500">🔊</span>
                                    <span className="text-xs w-8">{reminders.volume || 100}%</span>
                                </div>
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

            {/* Archiving & Reset */}
            <DataArchiver />

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

            {/* Logout Section */}
            <Card className="border-red-100">
                <CardContent className="pt-6 space-y-3">
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
                </CardContent>
            </Card>

            {/* Change Password Dialog */}
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
        </div >
    );
};

export default SettingsPanel;
