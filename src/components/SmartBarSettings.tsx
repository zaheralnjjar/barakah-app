import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Target, DollarSign, TrendingUp, Pill, Sun, BookOpen } from 'lucide-react';

interface SmartBarSettings {
    enabled: boolean;
    autoReturnDelay: number; // seconds
    customScreen1: string;
    customScreen2: string;
    customScreen3: string;
}

const CUSTOM_SCREEN_OPTIONS = [
    { value: 'none', label: 'بدون', icon: null },
    { value: 'habits', label: 'العادات', icon: Heart },
    { value: 'goals', label: 'الأهداف', icon: Target },
    { value: 'finance', label: 'الرصيد', icon: DollarSign },
    { value: 'trends', label: 'الإحصائيات', icon: TrendingUp },
    { value: 'medications', label: 'الأدوية', icon: Pill },
    { value: 'weather', label: 'الطقس', icon: Sun },
    { value: 'quote', label: 'اقتباس', icon: BookOpen },
];

export const SmartBarSettingsPanel: React.FC = () => {
    const [settings, setSettings] = useState<SmartBarSettings>({
        enabled: true,
        autoReturnDelay: 5,
        customScreen1: 'none',
        customScreen2: 'none',
        customScreen3: 'none',
    });

    // Load settings from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('smart_bar_settings');
        if (saved) {
            try {
                setSettings(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load smart bar settings:', e);
            }
        }
    }, []);

    // Save settings to localStorage
    const saveSettings = (newSettings: SmartBarSettings) => {
        setSettings(newSettings);
        localStorage.setItem('smart_bar_settings', JSON.stringify(newSettings));

        // Dispatch event to notify SmartBottomBar of changes
        window.dispatchEvent(new CustomEvent('smartBarSettingsChanged', { detail: newSettings }));
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    ⚡ الشريط السفلي الذكي
                </CardTitle>
                <CardDescription>
                    تخصيص الشريط السفلي القابل للتمرير
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Enable/Disable */}
                <div className="flex items-center justify-between">
                    <div>
                        <Label htmlFor="smart-bar-enabled" className="text-base font-medium">
                            تفعيل الشريط الذكي
                        </Label>
                        <p className="text-sm text-muted-foreground">
                            عرض معلومات إضافية عند السحب
                        </p>
                    </div>
                    <Switch
                        id="smart-bar-enabled"
                        checked={settings.enabled}
                        onCheckedChange={(checked) => saveSettings({ ...settings, enabled: checked })}
                    />
                </div>

                {/* Auto-return delay */}
                <div className="space-y-2">
                    <Label htmlFor="auto-return" className="text-base font-medium">
                        مدة العودة التلقائية
                    </Label>
                    <Select
                        value={settings.autoReturnDelay.toString()}
                        onValueChange={(value) => saveSettings({ ...settings, autoReturnDelay: parseInt(value) })}
                    >
                        <SelectTrigger id="auto-return">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="3">3 ثواني</SelectItem>
                            <SelectItem value="5">5 ثواني</SelectItem>
                            <SelectItem value="7">7 ثواني</SelectItem>
                            <SelectItem value="10">10 ثواني</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                        الوقت قبل العودة للأيقونات الرئيسية
                    </p>
                </div>

                {/* Custom Screen 1 */}
                <div className="space-y-2">
                    <Label htmlFor="custom-1" className="text-base font-medium">
                        الشاشة المخصصة 1
                    </Label>
                    <Select
                        value={settings.customScreen1}
                        onValueChange={(value) => saveSettings({ ...settings, customScreen1: value })}
                    >
                        <SelectTrigger id="custom-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {CUSTOM_SCREEN_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Custom Screen 2 */}
                <div className="space-y-2">
                    <Label htmlFor="custom-2" className="text-base font-medium">
                        الشاشة المخصصة 2
                    </Label>
                    <Select
                        value={settings.customScreen2}
                        onValueChange={(value) => saveSettings({ ...settings, customScreen2: value })}
                    >
                        <SelectTrigger id="custom-2">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {CUSTOM_SCREEN_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Custom Screen 3 */}
                <div className="space-y-2">
                    <Label htmlFor="custom-3" className="text-base font-medium">
                        الشاشة المخصصة 3
                    </Label>
                    <Select
                        value={settings.customScreen3}
                        onValueChange={(value) => saveSettings({ ...settings, customScreen3: value })}
                    >
                        <SelectTrigger id="custom-3">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {CUSTOM_SCREEN_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Preview */}
                <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">الشاشات المفعلة:</p>
                    <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                            الأيقونات الرئيسية
                        </span>
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                            الأيقونات الثانوية
                        </span>
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                            أوقات الصلاة
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            المواعيد
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            المهام
                        </span>
                        {settings.customScreen1 !== 'none' && (
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                {CUSTOM_SCREEN_OPTIONS.find(o => o.value === settings.customScreen1)?.label}
                            </span>
                        )}
                        {settings.customScreen2 !== 'none' && (
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                {CUSTOM_SCREEN_OPTIONS.find(o => o.value === settings.customScreen2)?.label}
                            </span>
                        )}
                        {settings.customScreen3 !== 'none' && (
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                {CUSTOM_SCREEN_OPTIONS.find(o => o.value === settings.customScreen3)?.label}
                            </span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// Helper function to get settings
export const getSmartBarSettings = (): SmartBarSettings => {
    const saved = localStorage.getItem('smart_bar_settings');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to load smart bar settings:', e);
        }
    }
    return {
        enabled: true,
        autoReturnDelay: 5,
        customScreen1: 'none',
        customScreen2: 'none',
        customScreen3: 'none',
    };
};
