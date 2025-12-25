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
    FileSpreadsheet,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DataBackup from '@/components/DataBackup';
import { useCloudSync } from '@/hooks/useCloudSync';
import { useGoogleSheetsSync } from '@/hooks/useGoogleSheetsSync';
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
    const { syncFromSheets, isSyncing: isSyncingSheets, lastSync: lastSheetSync } = useGoogleSheetsSync();
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



            {/* Reminder Customizations - Enhanced */}





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

            {/* Google Sheets Sync */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg arabic-title">
                        <FileSpreadsheet className="w-5 h-5 text-green-600" />
                        مزامنة Google Sheets
                    </CardTitle>
                    <CardDescription className="arabic-body text-xs">
                        استيراد المصاريف تلقائياً من جدول Google Sheets
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {lastSheetSync && (
                        <p className="text-sm text-gray-500">
                            آخر مزامنة: {new Date(lastSheetSync).toLocaleString('ar-EG')}
                        </p>
                    )}
                    <p className="text-xs text-gray-400">
                        المزامنة التلقائية: كل 24 ساعة
                    </p>
                    <Button
                        onClick={() => syncFromSheets()}
                        disabled={isSyncingSheets}
                        className="w-full bg-green-600 hover:bg-green-700"
                    >
                        {isSyncingSheets ? (
                            <>
                                <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                                جاري المزامنة...
                            </>
                        ) : (
                            <>
                                <FileSpreadsheet className="w-4 h-4 ml-2" />
                                مزامنة الآن
                            </>
                        )}
                    </Button>
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
