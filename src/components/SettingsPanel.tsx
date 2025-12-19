import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Settings,
    User,
    Shield,
    Database,
    LogOut
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DataBackup from '@/components/DataBackup';

const SettingsPanel = () => {
    const { toast } = useToast();

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-gray-100 p-2 rounded-xl">
                    <Settings className="w-6 h-6 text-gray-600" />
                </div>
                <h1 className="text-2xl font-bold arabic-title text-gray-800">الإعدادات</h1>
            </div>

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
