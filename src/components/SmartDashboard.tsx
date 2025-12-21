import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import QuickActions from '@/components/QuickActions';
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
    MapPin,
    Clock,
    Activity
} from 'lucide-react';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useToast } from "@/components/ui/use-toast";

interface SmartDashboardProps {
    onNavigateToTab: (tabId: string) => void;
}

const SmartDashboard: React.FC<SmartDashboardProps> = ({ onNavigateToTab }) => {
    const [financeData, setFinanceData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; remaining: string; icon: any } | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    // Stats State
    const [stats, setStats] = useState({
        appointmentsCount: 0,
        savedLocationsCount: 0,
        prayerSource: '',
        nextPrayer: ''
    });

    const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
    const [shoppingListSummary, setShoppingListSummary] = useState<any[]>([]);
    const [savedLocations, setSavedLocations] = useState<any[]>([]);

    const { toast } = useToast();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch Finance
            const { data: finance } = await supabase
                .from('finance_data_2025_12_18_18_42')
                .select('*')
                .eq('user_id', user.id)
                .single();
            setFinanceData(finance || {});

            // 2. Fetch Shopping List
            const { data: logistics } = await supabase
                .from(TABLES.logistics)
                .select('shopping_list, locations')
                .eq('user_id', user.id)
                .single();

            if (logistics?.shopping_list) {
                setShoppingListSummary(logistics.shopping_list.filter((i: any) => !i.completed).slice(0, 10));
            }
            if (logistics?.locations) {
                const locs = Array.isArray(logistics.locations) ? logistics.locations as any[] : [];
                setSavedLocations(locs.slice(0, 5));
            }

            // 3. Fetch Appointments
            const { data: apts, count: aptCount } = await supabase
                .from('appointments')
                .select('*', { count: 'exact' })
                .eq('user_id', user.id)
                .eq('is_completed', false)
                .order('date', { ascending: true })
                .limit(5);

            setRecentAppointments(apts || []);

            // 4. Fetch Prayer Settings
            const { data: prayerSettings } = await supabase
                .from('prayer_settings')
                .select('source, schedule')
                .eq('user_id', user.id)
                .single();

            // Calculate Next Prayer (Simplified logic for stats)
            // (Real-time calculation handled by hook, this is just for the summary card if needed)

            setStats({
                appointmentsCount: aptCount || 0,
                savedLocationsCount: logistics?.locations ? (Array.isArray(logistics.locations) ? logistics.locations.length : 0) : 0,
                prayerSource: prayerSettings?.source || 'غير محدد',
                nextPrayer: '--:--' // Handled by hook
            });

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const { prayerTimes: hookPrayerTimes, nextPrayer: hookNextPrayer, timeUntilNext: hookTimeUntilNext } = usePrayerTimes();

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

    const displayPrayerTimes = hookPrayerTimes.map(p => ({
        name: p.nameAr,
        hour: parseInt(p.time.split(':')[0]),
        minute: parseInt(p.time.split(':')[1]),
        icon: getPrayerIcon(p.name),
        originalName: p.name
    }));

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

    const hijriDate = currentDate.toLocaleDateString('ar-SA-u-ca-islamic', { year: 'numeric', month: 'long', day: 'numeric' });
    const spanishDate = currentDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const exchangeRate = financeData?.exchange_rate || 1200;

    const totalBalanceARS = financeData ? (financeData.current_balance_ars + (financeData.current_balance_usd * exchangeRate)) : 0;
    const totalBalanceUSD = totalBalanceARS / exchangeRate;
    const availableBalance = totalBalanceARS - (financeData?.emergency_buffer || 0) - (financeData?.total_debt || 0);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - currentDate.getDate();
    const dailyLimitARS = Math.max(0, availableBalance / (remainingDays + 3));
    const dailyLimitUSD = dailyLimitARS / exchangeRate;

    const quickActions = [
        { id: 'add-expense', label: 'إضافة مصروف', icon: DollarSign, color: 'bg-green-500', action: () => onNavigateToTab('finance') },
        { id: 'add-appointment', label: 'إضافة موعد', icon: CalendarPlus, color: 'bg-blue-500', action: () => onNavigateToTab('appointments') },
        { id: 'shopping', label: 'قائمة تسوق', icon: ShoppingCart, color: 'bg-orange-500', action: () => onNavigateToTab('shopping') },
    ];

    return (
        <div className="space-y-6 p-4">


            {/* Header */}
            <div className="bg-gradient-to-r from-primary/10 to-emerald-500/10 rounded-xl p-4 shadow-sm border border-emerald-100/50">
                <div className="flex items-center justify-between mb-3">
                    <div className="text-right">
                        <span className="text-sm font-semibold text-gray-700 font-sans capitalize">{spanishDate}</span>
                        <span className="text-xs text-primary font-medium arabic-body block">{hijriDate}</span>
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

            {/* Daily Expense Widget (New) */}
            <div
                className="bg-gradient-to-l from-red-50 to-white rounded-xl p-4 shadow-sm border border-red-100 cursor-pointer hover:shadow-md transition-all"
                onClick={() => onNavigateToTab('finance')}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-100 p-2 rounded-full">
                            <DollarSign className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <span className="text-xs text-gray-500 font-medium">مصروف اليوم</span>
                            <h3 className="text-xl font-bold text-red-600 tabular-nums">
                                {(() => {
                                    if (!financeData?.pending_expenses) return 0;
                                    const today = new Date().toISOString().split('T')[0];
                                    const dailySum = financeData.pending_expenses
                                        .filter((t: any) => t.type === 'expense' && t.timestamp.startsWith(today))
                                        .reduce((acc: number, curr: any) => acc + (curr.currency === 'USD' ? curr.amount * exchangeRate : curr.amount), 0);
                                    return dailySum.toLocaleString();
                                })()} <span className="text-xs">ARS</span>
                            </h3>
                        </div>
                    </div>
                    <div className="bg-white px-2 py-1 rounded-md text-[10px] text-gray-400 border shadow-sm">
                        اضغط للتفاصيل
                    </div>
                </div>
            </div>

            {/* Quick Actions */}

            {/* Prayer Times Widget */}
            <Card
                className="bg-white border-primary/20 shadow-sm overflow-hidden cursor-pointer hover:border-primary/40 transition-all"
                onClick={() => onNavigateToTab('prayer')}
            >
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
                <div className="flex items-center justify-between p-2 lg:px-4 bg-white whitespace-nowrap overflow-x-auto no-scrollbar">
                    {activePrayerTimes.map((prayer) => (
                        <div key={prayer.name} className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-[60px] ${nextPrayer?.name === prayer.name ? 'bg-primary/5' : 'hover:bg-gray-50'}`}>
                            <span className="text-[10px] text-gray-500 mb-1">{prayer.name}</span>
                            <prayer.icon className={`w-4 h-4 mb-1 ${nextPrayer?.name === prayer.name ? 'text-primary' : 'text-gray-400'}`} />
                            <span className="text-xs font-semibold tabular-nums">
                                {prayer.hour}:{prayer.minute.toString().padStart(2, '0')}
                            </span>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Financial Status */}
            <Card
                className="shadow-sm border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 cursor-pointer hover:shadow-md transition-all"
                onClick={() => onNavigateToTab('finance')}
            >
                <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <span className="text-[10px] text-gray-500 block mb-1">الرصيد</span>
                            <span className="text-lg font-bold text-emerald-600 tabular-nums">
                                {(totalBalanceARS / 1000).toFixed(1)}k
                            </span>
                            <span className="text-[10px] text-gray-400 block dir-ltr">
                                ${(totalBalanceUSD).toFixed(0)}
                            </span>
                        </div>
                        <div className="border-x border-gray-100">
                            <span className="text-[10px] text-gray-500 block mb-1">الحد اليومي</span>
                            <span className="text-lg font-bold text-primary tabular-nums">
                                {(dailyLimitARS).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-gray-400 block dir-ltr">
                                ${(dailyLimitUSD).toFixed(0)}
                            </span>
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-500 block mb-1">أيام متبقية</span>
                            <span className="text-xl font-bold text-blue-600 tabular-nums mt-1">
                                {remainingDays}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Synced Info: Shopping & Appointments */}
            <div className="grid grid-cols-2 gap-3">
                {/* Next Appointment */}
                <Card
                    className="shadow-sm border-orange-100 relative overflow-hidden cursor-pointer hover:shadow-md transition-all h-40"

                >
                    <div className="absolute top-0 right-0 w-1 h-full bg-orange-400"></div>
                    <CardContent className="p-3 h-full flex flex-col">
                        <div className="flex items-center gap-2 mb-2" onClick={() => onNavigateToTab('appointments')}>
                            <CalendarPlus className="w-4 h-4 text-orange-500" />
                            <span className="text-xs font-bold text-gray-700">المواعيد</span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {recentAppointments.length > 0 ? (
                                <div className="space-y-2">
                                    {recentAppointments.slice(0, 5).map((apt: any, i) => (
                                        <div key={i} className="text-sm border-b border-gray-100 pb-1 last:border-0" onClick={() => onNavigateToTab('appointments')}>
                                            <p className="font-semibold text-gray-800 line-clamp-1">{apt.title}</p>
                                            <p className="text-[10px] text-gray-500">{apt.time} - {apt.date}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center" onClick={() => onNavigateToTab('appointments')}>
                                    <p className="text-xs text-gray-400">لا يوجد مواعيد</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Shopping Summary */}
                <Card
                    className="shadow-sm border-blue-100 relative overflow-hidden cursor-pointer hover:shadow-md transition-all h-40"
                >
                    <div className="absolute top-0 right-0 w-1 h-full bg-blue-400"></div>
                    <CardContent className="p-3 h-full flex flex-col">
                        <div className="flex items-center gap-2 mb-2" onClick={() => onNavigateToTab('shopping')}>
                            <ShoppingCart className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-bold text-gray-700">التسوق</span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {shoppingListSummary.length > 0 ? (
                                <div className="space-y-1">
                                    {shoppingListSummary.map((i: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs border-b border-gray-50 pb-1 last:border-0" onClick={() => onNavigateToTab('shopping')}>
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                                            <span className="text-gray-700 truncate">{i.name}</span>
                                        </div>
                                    ))}
                                    {shoppingListSummary.length > 5 && (
                                        <p className="text-[10px] text-blue-500 text-center mt-1">المزيد...</p>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center" onClick={() => onNavigateToTab('shopping')}>
                                    <p className="text-xs text-gray-400">القائمة فارغة</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold arabic-title mb-4">اختصارات سريعة</h2>
                <QuickActions
                    onAddExpense={() => onNavigateToTab('finance')}
                    onAddIncome={() => onNavigateToTab('finance')}
                    onAddAppointment={() => onNavigateToTab('appointments')}
                    onOpenShoppingList={() => onNavigateToTab('shopping')}
                    onAddTask={() => onNavigateToTab('productivity')}
                    onSaveLocation={() => onNavigateToTab('map')}
                />
            </div>

            {/* Saved Locations Summary */}
            {savedLocations.length > 0 && (
                <Card className="shadow-sm">
                    <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                <span className="text-xs font-bold text-gray-700">مواقع محفوظة</span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => onNavigateToTab('map')}>
                                عرض الكل
                            </Button>
                        </div>
                        <div className="flex gap-2 common-scroll overflow-x-auto pb-2">
                            {savedLocations.map((loc: any, i: number) => (
                                <div
                                    key={i}
                                    className="min-w-[100px] p-2 bg-gray-50 rounded-lg text-center border cursor-pointer hover:bg-gray-100 active:scale-95 transition-all relative group"
                                    onClick={() => onNavigateToTab('map')}
                                >
                                    <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-blue-500 p-1 rounded-full text-white">
                                            <MapPin className="w-3 h-3" />
                                        </div>
                                    </div>
                                    <MapPin className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                                    <p className="text-xs font-semibold truncate">{loc.name || loc.title || 'موقع'}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default SmartDashboard;
