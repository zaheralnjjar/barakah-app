import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { TABLES } from '@/lib/tableNames';
import {
    DollarSign,
    Calendar,
    Sun,
    Moon,
    Sunset,
    Star,
    ShoppingCart,
    CalendarPlus,
    LogOut,
    Sparkles,
    MapPin
} from 'lucide-react';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';

interface SmartDashboardProps {
    onNavigateToTab: (tabId: string) => void;
}

const SmartDashboard: React.FC<SmartDashboardProps> = ({ onNavigateToTab }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; remaining: string; icon: any } | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        loadDashboardData();
        // Hook handles time updates
    }, []);

    const loadDashboardData = async () => {
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) return;

            const { data: financeData } = await supabase
                .from(TABLES.finance)
                .select('*')
                .eq('user_id', user.id)
                .single();

            setData({ finance: financeData });
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Use the comprehensive prayer times hook
    const { prayerTimes: hookPrayerTimes, nextPrayer: hookNextPrayer, timeUntilNext: hookTimeUntilNext } = usePrayerTimes();

    // Map the icons to the hook's prayer times
    const getPrayerIcon = (name: string) => {
        switch (name) {
            case 'fajr': return Moon;
            case 'dhuhr': return Sun;
            case 'asr': return Sun;
            case 'maghrib': return Sunset;
            case 'isha': return Star;
            default: return Moon;
        }
    };

    // Update next prayer state based on hook data
    useEffect(() => {
        if (hookNextPrayer) {
            setNextPrayer({
                name: hookNextPrayer.nameAr,
                time: hookNextPrayer.time,
                remaining: hookTimeUntilNext,
                icon: getPrayerIcon(hookNextPrayer.name),
            });
        }
    }, [hookNextPrayer, hookTimeUntilNext]);

    // Format prayer times for the grid display
    const displayPrayerTimes = hookPrayerTimes.map(p => ({
        name: p.nameAr,
        hour: parseInt(p.time.split(':')[0]),
        minute: parseInt(p.time.split(':')[1]),
        icon: getPrayerIcon(p.name),
        originalName: p.name // Keep original english name for comparison
    }));

    // Fallback if no prayers loaded yet (loading state)
    const activePrayerTimes = displayPrayerTimes.length > 0 ? displayPrayerTimes : [
        { name: 'الفجر', hour: 5, minute: 30, icon: Moon, originalName: 'fajr' },
        { name: 'الظهر', hour: 12, minute: 45, icon: Sun, originalName: 'dhuhr' },
        { name: 'العصر', hour: 16, minute: 15, icon: Sun, originalName: 'asr' },
        { name: 'المغرب', hour: 19, minute: 30, icon: Sunset, originalName: 'maghrib' },
        { name: 'العشاء', hour: 21, minute: 0, icon: Star, originalName: 'isha' },
    ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const hijriDate = currentDate.toLocaleDateString('ar-SA-u-ca-islamic', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const gregorianDate = currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    const monthlyBudget = data?.finance?.monthly_budget || 500000;
    const totalExpenses = data?.finance?.total_expenses || 0;
    const remaining = monthlyBudget - totalExpenses;
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const dayOfMonth = currentDate.getDate();
    const remainingDays = daysInMonth - dayOfMonth + 1;
    const dailyLimit = Math.floor(remaining / remainingDays);

    const quickActions = [
        { id: 'add-expense', label: 'إضافة مصروف', icon: DollarSign, color: 'bg-green-500', action: () => onNavigateToTab('finance') },
        { id: 'add-appointment', label: 'إضافة موعد', icon: CalendarPlus, color: 'bg-blue-500', action: () => onNavigateToTab('productivity') },
        { id: 'shopping', label: 'قائمة تسوق', icon: ShoppingCart, color: 'bg-orange-500', action: () => onNavigateToTab('productivity') },
    ];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/10 to-emerald-500/10 rounded-xl p-4 shadow-sm border border-emerald-100/50">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/20 p-1.5 rounded-lg">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <span className="arabic-title text-xl font-bold text-primary">نظام بركة</span>
                    </div>
                    <div className="text-left flex flex-col items-end">
                        <span className="text-sm font-semibold text-gray-700 font-sans">{gregorianDate}</span>
                        <span className="text-xs text-primary font-medium arabic-body">{hijriDate}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
                    <div className="flex items-center gap-1.5 text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="arabic-body text-sm font-medium">بوينس آيرس</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 px-3 text-xs gap-1.5 rounded-full"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span className="mb-0.5">تسجيل خروج</span>
                    </Button>
                </div>
            </div>

            {/* Prayer Times Widget */}
            <Card className="bg-white border-primary/20 shadow-sm overflow-hidden">
                <div className="p-3 bg-primary/5 flex items-center justify-between border-b border-primary/10">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/20 rounded-full animate-pulse-slow">
                            {nextPrayer?.icon && <nextPrayer.icon className="w-4 h-4 text-primary" />}
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground block">الصلاة القادمة</span>
                            <span className="text-sm font-bold text-primary arabic-title">{nextPrayer?.name}</span>
                        </div>
                    </div>
                    <div className="text-left">
                        <span className="text-xl font-bold text-primary tabular-nums tracking-tight">
                            -{nextPrayer?.remaining}
                        </span>
                    </div>
                </div>
                {/* Single line display using flex and justify-between to force one line */}
                <div className="flex items-center justify-between p-2 lg:px-4 bg-white whitespace-nowrap overflow-x-auto no-scrollbar">
                    {activePrayerTimes.map((prayer) => (
                        <div key={prayer.name} className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-[60px] ${nextPrayer?.name === prayer.name ? 'bg-primary/5' : 'hover:bg-gray-50'
                            }`}>
                            <span className="text-[10px] text-gray-500 mb-1">{prayer.name}</span>
                            <prayer.icon className={`w-4 h-4 mb-1 ${nextPrayer?.name === prayer.name ? 'text-primary' : 'text-gray-400'
                                }`} />
                            <span className="text-xs font-semibold tabular-nums">
                                {prayer.hour}:{prayer.minute.toString().padStart(2, '0')}
                            </span>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Financial Status */}
            <Card className="shadow-sm border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30">
                <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <span className="text-[10px] text-gray-500 block mb-1">المتبقي</span>
                            <span className="text-lg font-bold text-emerald-600 tabular-nums">
                                {(remaining / 1000).toFixed(1)}k
                            </span>
                        </div>
                        <div className="border-x border-gray-100">
                            <span className="text-[10px] text-gray-500 block mb-1">الحد اليومي</span>
                            <span className="text-lg font-bold text-primary tabular-nums">
                                {(dailyLimit / 1000).toFixed(1)}k
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-500 block mb-1">أيام متبقية</span>
                            <span className="text-lg font-bold text-blue-600 tabular-nums">
                                {remainingDays}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-3">
                {quickActions.map((action) => (
                    <Button
                        key={action.id}
                        variant="outline"
                        className="h-20 flex flex-col gap-2 bg-white hover:bg-gray-50 border-gray-200 shadow-sm"
                        onClick={action.action}
                    >
                        <div className={`p-2 rounded-full ${action.color} text-white shadow-sm`}>
                            <action.icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium text-gray-600">{action.label}</span>
                    </Button>
                ))}
            </div>
        </div>
    );
};

export default SmartDashboard;
