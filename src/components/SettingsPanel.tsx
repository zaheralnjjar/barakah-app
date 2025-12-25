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
    Bot,
    Circle,
    Plus,
    DollarSign,
    FileText,
    Sparkles,
    ShoppingCart,
    Pill,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DataBackup from '@/components/DataBackup';
import { useCloudSync } from '@/hooks/useCloudSync';
import { useMultiGoogleSheetsSync } from '@/hooks/useMultiGoogleSheetsSync';
import { useGemini } from '@/hooks/useGemini';
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
    const { sheets, isSyncing: isSyncingSheets, currentSyncSheet, addSheet, removeSheet, toggleSheet, syncSheet, syncAllSheets } = useMultiGoogleSheetsSync();
    const { apiKey, setApiKey, clearApiKey, isConfigured } = useGemini();
    const lastSync = useAppStore(s => s.lastSync);
    const quickActions = useAppStore(s => s.quickActions);

    const [showChangePassword, setShowChangePassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Multi-Sheet Dialog State
    const [showAddSheet, setShowAddSheet] = useState(false);
    const [newSheetName, setNewSheetName] = useState('');
    const [newSheetUrl, setNewSheetUrl] = useState('');

    // Gemini API State
    const [geminiApiInput, setGeminiApiInput] = useState('');

    // Radial Menu Customization State
    const [radialMenuActions, setRadialMenuActions] = useState<any>(() => {
        const saved = localStorage.getItem('baraka_radial_menu_actions');
        if (saved) {
            try { return JSON.parse(saved); } catch { }
        }
        return {
            top: 'calendar',
            right: 'add_transaction',
            bottom: 'finance',
            left: 'settings',
        };
    });

    const saveRadialMenuActions = (newActions: any) => {
        setRadialMenuActions(newActions);
        localStorage.setItem('baraka_radial_menu_actions', JSON.stringify(newActions));
        toast({ title: 'تم الحفظ', description: 'تم حفظ إعدادات القائمة الدائرية' });
    };

    // Available actions for radial menu
    const availableActions = [
        { value: 'calendar', label: 'التقويم', icon: 'Calendar' },
        { value: 'add_transaction', label: 'إضافة معاملة', icon: 'Plus' },
        { value: 'finance', label: 'المالية', icon: 'DollarSign' },
        { value: 'settings', label: 'الإعدادات', icon: 'Settings' },
        { value: 'dashboard', label: 'الرئيسية', icon: 'Home' },
        { value: 'shopping', label: 'قائمة التسوق', icon: 'ShoppingCart' },
        { value: 'ai_report', label: 'تقرير ذكي (AI)', icon: 'Sparkles' },
        { value: 'sync_sheets', label: 'مزامنة الجداول', icon: 'FileSpreadsheet' },
        { value: 'ai_chat', label: 'المساعد الذكي', icon: 'Bot' },
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

            {/* Google Sheets Sync - Multi-Sheet Support */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between text-lg arabic-title">
                        <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-green-600" />
                            جداول Google Sheets
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowAddSheet(true)}
                            className="text-xs"
                        >
                            + إضافة جدول
                        </Button>
                    </CardTitle>
                    <CardDescription className="arabic-body text-xs">
                        إدارة جداول Google Sheets المتعددة للاستيراد
                    </CardDescription>
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
                                مزامنة جميع الجداول
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Add Sheet Dialog */}
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

            {/* Gemini AI Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg arabic-title">
                        <Bot className="w-5 h-5 text-purple-600" />
                        المساعد الذكي (Gemini AI)
                    </CardTitle>
                    <CardDescription className="arabic-body text-xs">
                        تحليل مالي ذكي وتقارير تلقائية
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {isConfigured ? (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-green-600">
                                <Sparkles className="w-4 h-4" />
                                <span className="text-sm">المساعد الذكي مفعّل ✓</span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearApiKey}
                                className="text-red-500 border-red-200"
                            >
                                حذف مفتاح API
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <Label className="text-xs">مفتاح Gemini API</Label>
                                <Input
                                    type="password"
                                    placeholder="AI..."
                                    value={geminiApiInput}
                                    onChange={(e) => setGeminiApiInput(e.target.value)}
                                    className="mt-1 text-left dir-ltr"
                                />
                            </div>
                            <Button
                                onClick={() => {
                                    if (geminiApiInput) {
                                        setApiKey(geminiApiInput);
                                        setGeminiApiInput('');
                                    }
                                }}
                                disabled={!geminiApiInput}
                                className="w-full bg-purple-600 hover:bg-purple-700"
                            >
                                <Bot className="w-4 h-4 ml-2" />
                                تفعيل المساعد الذكي
                            </Button>
                            <p className="text-[10px] text-gray-400">
                                احصل على المفتاح من: makersuite.google.com
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Radial Menu Customization */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg arabic-title">
                        <Circle className="w-5 h-5 text-green-600" />
                        تخصيص القائمة الدائرية
                    </CardTitle>
                    <CardDescription className="arabic-body text-xs">
                        اضغط مطولاً على الشاشة لفتح القائمة
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {(['top', 'right', 'bottom', 'left'] as const).map((position) => (
                        <div key={position} className="flex items-center justify-between">
                            <Label className="text-sm">
                                {position === 'top' ? '⬆️ الأعلى' :
                                    position === 'right' ? '➡️ اليمين' :
                                        position === 'bottom' ? '⬇️ الأسفل' : '⬅️ اليسار'}
                            </Label>
                            <Select
                                value={radialMenuActions[position]}
                                onValueChange={(value) => {
                                    saveRadialMenuActions({
                                        ...radialMenuActions,
                                        [position]: value,
                                    });
                                }}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableActions.map((action) => (
                                        <SelectItem key={action.value} value={action.value}>
                                            {action.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
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
