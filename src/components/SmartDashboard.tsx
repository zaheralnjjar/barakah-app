import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import QuickActions from '@/components/QuickActions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/components/ui/use-toast";
import { useDashboardData } from '@/hooks/useDashboardData';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, MapPin, DollarSign, CalendarPlus, ShoppingCart, Sun, Moon, Sunset, Star, Clock } from 'lucide-react';

// Imported Full Components
import AppointmentManager from '@/components/AppointmentManager';
import ShoppingList from '@/components/ShoppingList';
import InteractiveMap from '@/components/InteractiveMap';
import PrayerManager from '@/components/PrayerManager';

interface SmartDashboardProps {
    onNavigateToTab: (tabId: string) => void;
}

// Module Definitions
const MODULES = {
    HEADER: 'header',
    PRAYER: 'prayer',
    FINANCE_DAILY: 'finance_daily',
    FINANCE_SUMMARY: 'finance_summary',
    APPOINTMENTS_WIDGET: 'appointments_widget',
    SHOPPING_WIDGET: 'shopping_widget',
    QUICK_ACTIONS: 'quick_actions',
    SAVED_LOCATIONS: 'saved_locations',
    FULL_APPOINTMENTS: 'full_appointments', // "Then appointments and reminders"
    FULL_SHOPPING: 'full_shopping',         // "Then shopping list"
    FULL_MAP: 'full_map'                    // "Then the map"
};

const DEFAULT_LAYOUT = [
    { id: MODULES.HEADER, visible: true },
    { id: MODULES.PRAYER, visible: true },
    { id: MODULES.FINANCE_SUMMARY, visible: true }, // "Financial side balance..."
    { id: MODULES.APPOINTMENTS_WIDGET, visible: true }, // "Appointments and shopping" (Widgets)
    { id: MODULES.SHOPPING_WIDGET, visible: true },
    { id: MODULES.QUICK_ACTIONS, visible: true },   // "Then quick shortcuts"
    { id: MODULES.FULL_SHOPPING, visible: false },  // User mentioned "Then shopping list" (Assuming full list)
    { id: MODULES.FULL_APPOINTMENTS, visible: false }, // "Then appointments and reminders"
    { id: MODULES.FULL_MAP, visible: true }         // "Then the map"
];

const SmartDashboard: React.FC<SmartDashboardProps> = ({ onNavigateToTab }) => {
    const {
        financeData, loading, recentAppointments, shoppingListSummary,
        savedLocations, stats, nextPrayer, prayerTimes, refetch, timeUntilNext
    } = useDashboardData();

    const [layout, setLayout] = useState(DEFAULT_LAYOUT);
    const [currentDate] = useState(new Date());

    useEffect(() => {
        const saved = localStorage.getItem('baraka_home_layout');
        if (saved) {
            try {
                setLayout(JSON.parse(saved));
            } catch (e) { console.error("Layout parse error", e); }
        }
    }, []);

    // --- Helper Logic for Widgets ---
    const handleLogout = async () => { await supabase.auth.signOut(); };
    const hijriDate = currentDate.toLocaleDateString('ar-SA-u-ca-islamic', { year: 'numeric', month: 'long', day: 'numeric' });
    const spanishDate = currentDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const exchangeRate = financeData?.exchange_rate || 1200;
    const totalBalanceARS = financeData ? (financeData.current_balance_ars + (financeData.current_balance_usd * exchangeRate)) : 0;
    const totalBalanceUSD = totalBalanceARS / exchangeRate;
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - currentDate.getDate();
    const availableBalance = totalBalanceARS - (financeData?.emergency_buffer || 0) - (financeData?.total_debt || 0);
    const dailyLimitARS = Math.max(0, availableBalance / (remainingDays + 3));
    const dailyLimitUSD = dailyLimitARS / exchangeRate;

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

    const activePrayerTimes = prayerTimes.map(p => ({
        name: p.nameAr,
        hour: parseInt(p.time.split(':')[0]),
        minute: parseInt(p.time.split(':')[1]),
        icon: getPrayerIcon(p.name),
        originalName: p.name
    }));


    // --- Renderers ---
    const renderModule = (id: string) => {
        switch (id) {
            case MODULES.HEADER:
                return (
                    <div className="bg-gradient-to-r from-primary/10 to-emerald-500/10 rounded-xl p-4 shadow-sm border border-emerald-100/50 mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-right">
                                <span className="text-base font-semibold text-gray-700 font-sans capitalize">{spanishDate}</span>
                                <span className="text-sm text-primary font-medium arabic-body block">{hijriDate}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
                            <div className="flex items-center gap-1.5 text-gray-600">
                                <MapPin className="w-5 h-5 text-gray-400" />
                                <span className="arabic-body text-sm font-medium">بوينس آيرس</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-3 text-sm gap-1.5 rounded-full">
                                <LogOut className="w-4 h-4" />
                                <span className="mb-0.5">تسجيل خروج</span>
                            </Button>
                        </div>
                    </div>
                );

            case MODULES.PRAYER:
                return (
                    <Card className="bg-white border-primary/20 shadow-sm overflow-hidden cursor-pointer hover:border-primary/40 transition-all mb-4" onClick={() => onNavigateToTab('prayer')}>
                        <div className="p-3 bg-primary/5 flex items-center justify-between border-b border-primary/10">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-primary/20 rounded-full">
                                    {nextPrayer && <Clock className="w-4 h-4 text-primary" />}
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground block">الصلاة القادمة</span>
                                    <span className="text-base font-bold text-primary arabic-title">{nextPrayer?.nameAr || '--'}</span>
                                </div>
                            </div>
                            <div className="text-left">
                                <span className="text-sm font-bold text-primary block">{timeUntilNext || '--'}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white whitespace-nowrap overflow-x-auto no-scrollbar">
                            {activePrayerTimes.map((prayer) => (
                                <div key={prayer.name} className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-[60px] ${nextPrayer?.name === prayer.originalName ? 'bg-primary/5' : 'hover:bg-gray-50'}`}>
                                    <span className="text-xs text-gray-500">{prayer.name}</span>
                                    <prayer.icon className={`w-4 h-4 my-1 ${nextPrayer?.name === prayer.originalName ? 'text-primary' : 'text-gray-400'}`} />
                                    <span className="text-xs font-semibold tabular-nums">{prayer.hour}:{prayer.minute.toString().padStart(2, '0')}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                );

            case MODULES.FINANCE_DAILY:
                return (
                    <div className="bg-gradient-to-l from-red-50 to-white rounded-xl p-4 shadow-sm border border-red-100 cursor-pointer hover:shadow-md transition-all mb-4" onClick={() => onNavigateToTab('finance')}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-red-100 p-2.5 rounded-full"><DollarSign className="w-6 h-6 text-red-600" /></div>
                                <div>
                                    <span className="text-sm text-gray-500 font-medium">مصروف اليوم</span>
                                    <h3 className="text-xl font-bold text-red-600 tabular-nums">
                                        {financeData?.pending_expenses ? (() => {
                                            const today = new Date().toISOString().split('T')[0];
                                            return financeData.pending_expenses
                                                .filter((t: any) => t.type === 'expense' && t.timestamp.startsWith(today))
                                                .reduce((acc: number, curr: any) => acc + (curr.currency === 'USD' ? curr.amount * exchangeRate : curr.amount), 0)
                                                .toLocaleString();
                                        })() : 0} <span className="text-sm text-red-400">ARS</span>
                                    </h3>
                                </div>
                            </div>
                            <div className="bg-white px-3 py-1.5 rounded-md text-xs text-gray-500 border shadow-sm">اضغط للتفاصيل</div>
                        </div>
                    </div>
                );

            case MODULES.FINANCE_SUMMARY:
                return (
                    <Card className="shadow-sm border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 cursor-pointer hover:shadow-md transition-all mb-4" onClick={() => onNavigateToTab('finance')}>
                        <CardContent className="p-4">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <span className="text-xs text-gray-500 block mb-1">الرصيد</span>
                                    <span className="text-lg font-bold text-emerald-600 tabular-nums">{totalBalanceARS.toLocaleString()}</span>
                                    <span className="text-xs text-gray-400 block dir-ltr">${totalBalanceUSD.toLocaleString()}</span>
                                </div>
                                <div className="border-x border-gray-100">
                                    <span className="text-xs text-gray-500 block mb-1">الحد اليومي</span>
                                    <span className="text-lg font-bold text-primary tabular-nums">{(dailyLimitARS).toLocaleString()}</span>
                                    <span className="text-xs text-gray-400 block dir-ltr">${(dailyLimitUSD).toFixed(0)}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500 block mb-1">أيام متبقية</span>
                                    <span className="text-xl font-bold text-blue-600 tabular-nums mt-1">{remainingDays}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );

            case MODULES.APPOINTMENTS_WIDGET:
                return (
                    <Card className="shadow-sm border-orange-100 relative overflow-hidden cursor-pointer hover:shadow-md transition-all mb-4 h-48" onClick={() => onNavigateToTab('appointments')}>
                        <div className="absolute top-0 right-0 w-1.5 h-full bg-orange-400"></div>
                        <CardContent className="p-4 h-full flex flex-col">
                            <div className="flex items-center gap-2 mb-3">
                                <CalendarPlus className="w-5 h-5 text-orange-500" />
                                <span className="text-sm font-bold text-gray-700">المواعيد القادمة</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {recentAppointments.length > 0 ? (
                                    <div className="space-y-3">
                                        {recentAppointments.slice(0, 3).map((apt: any, i) => (
                                            <div key={i} className="text-base border-b border-gray-100 pb-2 last:border-0">
                                                <p className="font-semibold text-gray-800 line-clamp-1">{apt.title}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{apt.time} - {apt.date}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-sm text-gray-400 text-center py-6">لا يوجد مواعيد قريبة</p>}
                            </div>
                        </CardContent>
                    </Card>
                );

            case MODULES.SHOPPING_WIDGET:
                return (
                    <Card className="shadow-sm border-blue-100 relative overflow-hidden cursor-pointer hover:shadow-md transition-all mb-4 h-48" onClick={() => onNavigateToTab('shopping')}>
                        <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-400"></div>
                        <CardContent className="p-4 h-full flex flex-col">
                            <div className="flex items-center gap-2 mb-3">
                                <ShoppingCart className="w-5 h-5 text-blue-500" />
                                <span className="text-sm font-bold text-gray-700">قائمة التسوق</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {shoppingListSummary.length > 0 ? (
                                    <div className="space-y-2">
                                        {shoppingListSummary.slice(0, 4).map((i: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-3 text-sm border-b border-gray-50 pb-2 last:border-0">
                                                <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0" />
                                                <span className="text-gray-700 truncate font-medium">{i.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-sm text-gray-400 text-center py-6">القائمة فارغة</p>}
                            </div>
                        </CardContent>
                    </Card>
                );

            case MODULES.QUICK_ACTIONS:
                return (
                    <div className="mb-4">
                        <QuickActions
                            onAddExpense={() => onNavigateToTab('finance')}
                            onAddIncome={() => onNavigateToTab('finance')}
                            onAddAppointment={() => onNavigateToTab('appointments')}
                            onOpenShoppingList={() => onNavigateToTab('shopping')}
                            onAddTask={() => onNavigateToTab('productivity')}
                            onSaveLocation={() => onNavigateToTab('map')}
                        />
                    </div>
                );

            case MODULES.SAVED_LOCATIONS:
                return savedLocations.length > 0 ? (
                    <Card className="shadow-sm mb-4">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-gray-500" />
                                    <span className="text-sm font-bold text-gray-700">مواقع محفوظة</span>
                                </div>
                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onNavigateToTab('map')}>عرض الكل</Button>
                            </div>
                            <div className="flex gap-3 common-scroll overflow-x-auto pb-2">
                                {savedLocations.map((loc: any, i: number) => (
                                    <div key={i} className="min-w-[110px] p-3 bg-gray-50 rounded-xl text-center border cursor-pointer hover:bg-gray-100" onClick={() => onNavigateToTab('map')}>
                                        <MapPin className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                                        <p className="text-sm font-semibold truncate">{loc.name || loc.title || 'موقع'}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ) : null;

            case MODULES.FULL_APPOINTMENTS:
                return <div className="mb-4 bg-white rounded-xl shadow-sm border overflow-hidden"><AppointmentManager /></div>;

            case MODULES.FULL_SHOPPING:
                return <div className="mb-4 bg-white rounded-xl shadow-sm border overflow-hidden"><ShoppingList /></div>;

            case MODULES.FULL_MAP:
                return <div className="mb-4 h-[300px] rounded-xl overflow-hidden shadow-sm border border-gray-200"><InteractiveMap /></div>;

            default: return null;
        }
    };

    if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

    return (
        <div className="p-4 space-y-1">
            {layout.filter(l => l.visible).map(module => (
                <div key={module.id} className="animate-fade-in">
                    {renderModule(module.id)}
                </div>
            ))}
        </div>
    );
};

export default SmartDashboard;
