import React, { useState } from 'react';
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

    // Export Reports State
    const [reportType, setReportType] = useState<'finance' | 'appointments'>('finance');
    const [reportPeriod, setReportPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('week');
    const [reportFromDate, setReportFromDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportToDate, setReportToDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().split('T')[0];
    });

    const generateReport = async () => {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) {
            toast({ title: "يرجى تسجيل الدخول", variant: "destructive" });
            return;
        }

        let fromDate: string, toDate: string;
        const today = new Date();

        if (reportPeriod === 'today') {
            fromDate = toDate = today.toISOString().split('T')[0];
        } else if (reportPeriod === 'week') {
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            fromDate = weekAgo.toISOString().split('T')[0];
            toDate = today.toISOString().split('T')[0];
        } else if (reportPeriod === 'month') {
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            fromDate = monthAgo.toISOString().split('T')[0];
            toDate = today.toISOString().split('T')[0];
        } else {
            fromDate = reportFromDate;
            toDate = reportToDate;
        }

        let textContent = '';

        if (reportType === 'finance') {
            const { data } = await supabase
                .from('finance_data_2025_12_18_18_42')
                .select('pending_expenses')
                .eq('user_id', user.id)
                .single();

            const transactions = (data?.pending_expenses || [])
                .filter((t: any) => t.timestamp >= fromDate && t.timestamp <= toDate + 'T23:59:59');

            const totalIncome = transactions.filter((t: any) => t.type === 'income').reduce((a: number, t: any) => a + t.amount, 0);
            const totalExpense = transactions.filter((t: any) => t.type === 'expense').reduce((a: number, t: any) => a + t.amount, 0);

            textContent = `💰 التقرير المالي\n`;
            textContent += `من ${fromDate} إلى ${toDate}\n\n`;
            textContent += `📈 الدخل: ${totalIncome.toLocaleString()}\n`;
            textContent += `📉 المصروفات: ${totalExpense.toLocaleString()}\n`;
            textContent += `💵 الصافي: ${(totalIncome - totalExpense).toLocaleString()}\n\n`;
            textContent += `التفاصيل:\n`;
            transactions.forEach((t: any) => {
                textContent += `${t.type === 'income' ? '➕' : '➖'} ${t.description}: ${t.amount.toLocaleString()} ${t.currency}\n`;
            });
            textContent += `\n✨ نظام بركة لإدارة الحياة`;
        } else {
            const { data } = await supabase
                .from('appointments')
                .select('*')
                .eq('user_id', user.id)
                .gte('date', fromDate)
                .lte('date', toDate)
                .order('date', { ascending: true });

            const appointments = data || [];

            textContent = `📅 تقرير المواعيد\n`;
            textContent += `من ${fromDate} إلى ${toDate}\n`;
            textContent += `إجمالي المواعيد: ${appointments.length}\n\n`;
            appointments.forEach((a: any) => {
                textContent += `📌 ${a.title}\n`;
                textContent += `   التاريخ: ${a.date} ${a.time || ''}\n`;
                textContent += `   الحالة: ${a.is_completed ? '✅ مكتمل' : '⏳ معلق'}\n`;
                if (a.notes) textContent += `   ملاحظات: ${a.notes}\n`;
                textContent += `\n`;
            });
            textContent += `\n✨ نظام بركة لإدارة الحياة`;
        }

        // Try native share first (shows app list like WhatsApp, Email, etc.)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: reportType === 'finance' ? 'التقرير المالي' : 'تقرير المواعيد',
                    text: textContent
                });
                toast({ title: "تم التصدير!", description: "اختر التطبيق للمشاركة" });
                return;
            } catch (e) {
                console.log('Share cancelled');
            }
        }

        // Fallback: copy to clipboard
        try {
            await navigator.clipboard.writeText(textContent);
            toast({ title: "تم النسخ!", description: "تم نسخ التقرير للحافظة" });
        } catch (e) {
            toast({ title: "خطأ", description: "تعذر النسخ", variant: "destructive" });
        }
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

            {/* Export Reports */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg arabic-title">
                        <FileText className="w-5 h-5 text-teal-600" />
                        تصدير التقارير
                    </CardTitle>
                    <CardDescription className="arabic-body text-xs">إنشاء تقارير مالية أو مواعيد بصيغة PDF</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Report Type Selection */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">نوع التقرير</Label>
                        <div className="flex gap-2">
                            <Button
                                variant={reportType === 'finance' ? 'default' : 'outline'}
                                className="flex-1 gap-2"
                                onClick={() => setReportType('finance')}
                            >
                                <DollarSign className="w-4 h-4" />
                                مالي
                            </Button>
                            <Button
                                variant={reportType === 'appointments' ? 'default' : 'outline'}
                                className="flex-1 gap-2"
                                onClick={() => setReportType('appointments')}
                            >
                                <Calendar className="w-4 h-4" />
                                المواعيد
                            </Button>
                        </div>
                    </div>

                    {/* Period Selection */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">الفترة</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { id: 'today', label: 'اليوم' },
                                { id: 'week', label: 'أسبوع' },
                                { id: 'month', label: 'شهر' },
                                { id: 'custom', label: 'مخصص' }
                            ].map(p => (
                                <Button
                                    key={p.id}
                                    variant={reportPeriod === p.id ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setReportPeriod(p.id as any)}
                                    className="text-xs"
                                >
                                    {p.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Date Range */}
                    {reportPeriod === 'custom' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs text-gray-500 mb-1 block">من تاريخ</Label>
                                <Input
                                    type="date"
                                    value={reportFromDate}
                                    onChange={(e) => setReportFromDate(e.target.value)}
                                    className="text-center"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-gray-500 mb-1 block">إلى تاريخ</Label>
                                <Input
                                    type="date"
                                    value={reportToDate}
                                    onChange={(e) => setReportToDate(e.target.value)}
                                    className="text-center"
                                />
                            </div>
                        </div>
                    )}

                    {/* Generate Button */}
                    <Button
                        onClick={generateReport}
                        className="w-full gap-2 h-11 bg-teal-600 hover:bg-teal-700"
                    >
                        <FileText className="w-5 h-5" />
                        إنشاء التقرير
                    </Button>
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
                            onClick={syncNow}
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
                            onClick={pullData}
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
