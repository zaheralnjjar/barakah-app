import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Settings,
    User,
    Shield,
    Database,
    LogOut,
    Layout,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DataBackup from '@/components/DataBackup';

const SettingsPanel = () => {
    const { toast } = useToast();

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    // Dashboard Customization Logic
    const DEFAULT_ORDER = ['stats', 'appointments', 'shopping', 'map'];
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
        'stats': 'الإحصائيات والترحيب',
        'appointments': 'المواعيد والتذكيرات',
        'shopping': 'قائمة التسوق',
        'map': 'الخريطة والمواقع'
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-gray-100 p-2 rounded-xl">
                    <Settings className="w-6 h-6 text-gray-600" />
                </div>
                <h1 className="text-2xl font-bold arabic-title text-gray-800">الإعدادات</h1>
            </div>

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

            {/* Profile Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg arabic-title">
                        <User className="w-5 h-5 text-primary" />
                        الملف الشخصي
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-2xl">👤</span>
                        </div>
                        <div>
                            <p className="font-bold">المستخدم</p>
                            <p className="text-sm text-gray-500">user@example.com</p>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-600" onClick={handleLogout}>
                        <LogOut className="w-4 h-4 ml-2" />
                        تسجيل خروج
                    </Button>
                </CardContent>
            </Card>

            {/* Prayer Times Section Removed from here - Moved to PrayerManager */}

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
        </div>
    );
};

export default SettingsPanel;
