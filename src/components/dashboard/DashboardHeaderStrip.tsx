import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    TrendingDown, TrendingUp, Wallet,
    Clock, Moon, Sun, Sunrise,
    BadgeDollarSign, ChevronDown, ChevronUp
} from 'lucide-react';
import { useFinance } from '@/hooks/useFinance';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { cn } from '@/lib/utils';

const DashboardHeaderStrip: React.FC = () => {
    // 1. Fetch Finance Data
    const { financeData, dailyLimit } = useFinance();
    const [dollarRates, setDollarRates] = useState<{ official: number; blue: number } | null>(null);

    // Fetch Rates Logic
    useEffect(() => {
        const fetchRates = async () => {
            try {
                const [officialRes, blueRes] = await Promise.all([
                    fetch('https://dolarapi.com/v1/dolares/oficial'),
                    fetch('https://dolarapi.com/v1/dolares/blue')
                ]);
                const officialData = await officialRes.json();
                const blueData = await blueRes.json();
                setDollarRates({
                    official: officialData.venta,
                    blue: blueData.venta
                });
            } catch (e) { console.error("Failed to fetch rates", e); }
        };
        fetchRates();
    }, []);

    // 2. Fetch Prayer Times
    const { nextPrayer, prayerTimes, timeUntilNext } = usePrayerTimes();
    const [elapsedTime, setElapsedTime] = useState(0);
    const [showElapsed, setShowElapsed] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const elapsedTimeStr = useMemo(() => {
        const hours = Math.floor(elapsedTime / 3600);
        const minutes = Math.floor((elapsedTime % 3600) / 60);
        const seconds = elapsedTime % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, [elapsedTime]);

    // 3. States for Collapsibility
    const [expandFinance, setExpandFinance] = useState(false); // Default collapsed
    const [expandPrayer, setExpandPrayer] = useState(false);   // Default collapsed

    // 4. Calculations
    const dailyLimitARS = dailyLimit || 0;

    // Calculate Today's Expense
    const todayExpense = useMemo(() => {
        if (!financeData?.pending_expenses) return 0;
        const todayStr = new Date().toISOString().split('T')[0];
        return financeData.pending_expenses
            .filter((t: any) => t.type === 'expense' && t.timestamp.startsWith(todayStr))
            .reduce((sum: number, t: any) => sum + (t.currency === 'ARS' ? t.amount : t.amount * (dollarRates?.blue || 1200)), 0);
    }, [financeData?.pending_expenses, dollarRates]);

    const remainingDaily = dailyLimitARS - todayExpense;

    // Helpers
    const handleCountdownClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowElapsed(!showElapsed);
    };

    const getPrayerIcon = (name: string) => {
        switch (name.toLowerCase()) {
            case 'fajr': return <Sunrise className="w-4 h-4 text-orange-400" />;
            case 'sunrise': return <Sun className="w-4 h-4 text-yellow-500" />;
            case 'dhuhr': return <Sun className="w-4 h-4 text-orange-500" />;
            case 'asr': return <Sun className="w-4 h-4 text-orange-600" />;
            case 'maghrib': return <Moon className="w-4 h-4 text-indigo-400" />;
            case 'isha': return <Moon className="w-4 h-4 text-indigo-800" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    return (
        <div className="w-full space-y-3 animate-fade-in font-sans">
            <div className="flex flex-col lg:flex-row gap-3">

                {/* 1. Dollar Exchange Rate Card (Always visible, small) */}
                <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 min-w-[150px]">
                    <CardContent className="p-3 flex flex-col justify-center h-full">
                        <div className="flex items-center gap-2 mb-2">
                            <BadgeDollarSign className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-bold text-blue-800">أسعار الصرف</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-gray-500 font-medium">الرسمي</span>
                                <span className="text-xs font-mono font-bold text-gray-700 bg-white/50 px-1.5 py-0.5 rounded">
                                    {dollarRates?.official || '---'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] text-blue-600 font-medium">بلو</span>
                                <span className="text-xs font-mono font-bold text-blue-700 bg-white/50 px-1.5 py-0.5 rounded">
                                    {dollarRates?.blue || financeData?.exchange_rate || '---'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Financial Summary Card (Collapsible) */}
                <Card className="border-0 shadow-sm flex-1 bg-white overflow-hidden transition-all duration-300">
                    <CardContent className="p-0">
                        {/* Header (Always Visible) */}
                        <div
                            className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                            onClick={() => setExpandFinance(!expandFinance)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-emerald-100 rounded-full text-emerald-600">
                                    <Wallet className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-700">الملخص المالي</span>
                                    {!expandFinance && (
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className={`text-[10px] font-bold ${remainingDaily < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {remainingDaily < 0 ? 'تجاوزت الحد' : 'ضمن الحد'}
                                            </span>
                                            <span className="text-[10px] text-gray-400">|</span>
                                            <span className="text-[10px] font-mono text-gray-500">المتبقي: {remainingDaily.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {expandFinance ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>

                        {/* Details (Collapsible) */}
                        {expandFinance && (
                            <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-1">
                                <div className="h-px w-full bg-gray-100 mb-2"></div>
                                <div className="grid grid-cols-3 gap-2 divide-x divide-x-reverse divide-gray-100">
                                    <div className="text-center px-1">
                                        <p className="text-[9px] text-gray-400 mb-0.5">الحد اليومي</p>
                                        <p className="text-sm font-bold font-mono text-gray-700">{dailyLimitARS.toLocaleString()}</p>
                                    </div>
                                    <div className="text-center px-1">
                                        <p className="text-[9px] text-gray-400 mb-0.5">مصروف اليوم</p>
                                        <p className="text-sm font-bold font-mono text-red-600">{todayExpense.toLocaleString()}</p>
                                    </div>
                                    <div className="text-center px-1">
                                        <p className="text-[9px] text-gray-400 mb-0.5">المتبقي</p>
                                        <p className={`text-sm font-bold font-mono ${remainingDaily < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {remainingDaily.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 3. Prayer Times Card (Collapsible) */}
                <Card className="border-0 shadow-md bg-emerald-50/50 overflow-hidden flex-1 min-w-[300px] transition-all duration-300">
                    <CardContent className="p-0">
                        {/* Header (Always Visible) */}
                        <div
                            className="bg-white/60 p-2 px-3 border-b border-white flex justify-between items-center cursor-pointer hover:bg-white/80"
                            onClick={() => setExpandPrayer(!expandPrayer)}
                        >
                            <div className="flex items-center gap-2">
                                {getPrayerIcon(nextPrayer?.name || '')}
                                <div>
                                    <span className="text-xs font-bold text-emerald-800 block">
                                        {nextPrayer ? `القادمة: ${nextPrayer.nameAr}` : 'الصلاة القادمة'}
                                    </span>
                                    {!expandPrayer && (
                                        <span className="text-[10px] font-mono text-emerald-600 block">
                                            {showElapsed ? elapsedTimeStr : (timeUntilNext || '--:--:--')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {expandPrayer && (
                                    <div
                                        onClick={handleCountdownClick}
                                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded cursor-pointer ${showElapsed ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
                                    >
                                        {showElapsed ? elapsedTimeStr : (timeUntilNext || '--:--:--')}
                                    </div>
                                )}
                                {expandPrayer ? <ChevronUp className="w-4 h-4 text-emerald-600" /> : <ChevronDown className="w-4 h-4 text-emerald-600" />}
                            </div>
                        </div>

                        {/* Grid (Collapsible) */}
                        {expandPrayer && (
                            <div className="grid grid-cols-6 divide-x divide-x-reverse divide-emerald-100/50 animate-in slide-in-from-top-1">
                                {['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].map((key) => {
                                    const prayer = prayerTimes.find(p => p.name === key);
                                    if (!prayer) return null;
                                    const isNext = nextPrayer?.name === prayer.name;

                                    return (
                                        <div key={key} className={`p-2 text-center flex flex-col items-center justify-center transition-colors ${isNext ? 'bg-emerald-100/50' : 'hover:bg-white/50'}`}>
                                            <span className={`text-[9px] mb-1 ${isNext ? 'font-bold text-emerald-700' : 'text-gray-500'}`}>{prayer.nameAr}</span>
                                            <span className={`text-[10px] font-mono ${isNext ? 'font-bold text-emerald-900' : 'text-gray-600'}`}>{prayer.time}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DashboardHeaderStrip;
