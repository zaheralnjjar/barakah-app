import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, DollarSign, Wallet, Activity, Clock, Moon, Sun, Sunrise, Sunset } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface DashboardHeaderStripProps {
    financeData: any;
    todayExpense: number;
    dailyLimitARS: number;
    prayerTimes: any[];
    nextPrayer: any;
    timeUntilNext: string;
}

const DashboardHeaderStrip: React.FC<DashboardHeaderStripProps> = ({
    financeData,
    todayExpense,
    dailyLimitARS,
    prayerTimes,
    nextPrayer,
    timeUntilNext,
}) => {
    const [showElapsed, setShowElapsed] = useState(false);
    const [elapsedTimeStr, setElapsedTimeStr] = useState('');

    // Identify Previous Prayer
    const previousPrayer = useMemo(() => {
        if (!prayerTimes || prayerTimes.length === 0) return null;
        const now = new Date();
        // Filter prayers that have already passed today
        const passedPrayers = prayerTimes.filter(p => p.timestamp < now && p.name !== 'sunrise');

        if (passedPrayers.length > 0) {
            return passedPrayers[passedPrayers.length - 1];
        } else {
            // If no prayers passed today (e.g. early morning before Fajr), previous was Isha yesterday.
            // Ideally we would have yesterday's Isha, but for simplicity we can assume the last prayer in the list was yesterday
            // Or handle this edge case by showing "Yesterday's Isha" logic if needed. 
            // For now, let's just grab the last prayer of the list (Isha) and assume it was yesterday
            const isha = prayerTimes.find(p => p.name === 'isha');
            if (isha) {
                const prevIsha = new Date(isha.timestamp);
                prevIsha.setDate(prevIsha.getDate() - 1);
                return { ...isha, timestamp: prevIsha };
            }
        }
        return null;
    }, [prayerTimes]);

    // Update elapsed time every second if showing
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (showElapsed && previousPrayer) {
            const updateElapsed = () => {
                const now = new Date();
                const diff = now.getTime() - previousPrayer.timestamp.getTime();
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setElapsedTimeStr(
                    `منذ ${hours > 0 ? `${hours} ساعة و ` : ''}${minutes} دقيقة و ${seconds} ثانية`
                );
            };

            updateElapsed();
            interval = setInterval(updateElapsed, 1000);

            // Auto revert after 10 seconds
            const timeout = setTimeout(() => {
                setShowElapsed(false);
            }, 10000);

            return () => {
                clearInterval(interval);
                clearTimeout(timeout);
            };
        }
        return () => clearInterval(interval);
    }, [showElapsed, previousPrayer]);

    // Calculate Prayer Intervals
    const prayerIntervals = useMemo(() => {
        if (!prayerTimes || prayerTimes.length < 2) return {} as Record<string, string>;

        // Sort prayers just in case
        const sorted = [...prayerTimes].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        // Calculate intervals between adjacent prayers
        const intervals: Record<string, string> = {};
        for (let i = 0; i < sorted.length - 1; i++) {
            const current = sorted[i];
            const next = sorted[i + 1];
            if (!current || !next) continue;

            const diff = next.timestamp.getTime() - current.timestamp.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            intervals[current.name] = hours > 0
                ? `${hours}س ${minutes}د`
                : `${minutes}د`;
        }
        return intervals;
    }, [prayerTimes]);

    const handleCountdownClick = () => {
        if (previousPrayer) {
            setShowElapsed(true);
        }
    };

    // Helper for icons
    const getPrayerIcon = (name: string) => {
        switch (name) {
            case 'fajr': return <Moon className="w-4 h-4" />;
            case 'sunrise': return <Sunrise className="w-4 h-4" />;
            case 'dhuhr': return <Sun className="w-4 h-4" />;
            case 'asr': return <Sun className="w-4 h-4 opacity-80" />;
            case 'maghrib': return <Sunset className="w-4 h-4" />;
            case 'isha': return <Moon className="w-4 h-4 opacity-80" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    return (
        <div className="w-full space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr] gap-4 w-full">

                {/* Finance Section (Left Side - Light Green Theme) */}
                <Card className="border-0 shadow-lg bg-emerald-50 text-emerald-900 overflow-hidden relative min-w-[320px]">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-full blur-3xl -translate-y-16 translate-x-16 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-100/40 rounded-full blur-2xl translate-y-8 -translate-x-8 pointer-events-none" />

                    <CardContent className="p-4 flex flex-col justify-center h-full relative z-10">
                        {/* Dollar Rate Row */}
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-emerald-200/50">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <DollarSign className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-emerald-600 font-bold">سعر الدولار</span>
                                    <span className="text-xl font-bold font-mono tracking-tight flex items-baseline gap-1 text-emerald-800">
                                        {financeData?.exchange_rate || '---'}
                                        <span className="text-[10px] font-normal text-emerald-600">ARS</span>
                                    </span>
                                </div>
                            </div>
                            <div className="text-[10px] text-emerald-600 bg-white/50 px-2 py-1 rounded-full border border-emerald-100">
                                تحديث {format(new Date(), 'HH:mm')}
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-2">
                            {/* Balance */}
                            <div className="bg-white/60 rounded-lg p-2 border border-emerald-100 hover:bg-white/80 transition-colors shadow-sm">
                                <div className="flex items-center gap-1 mb-1 text-emerald-600">
                                    <Wallet className="w-3 h-3" />
                                    <span className="text-[9px] font-bold">الرصيد</span>
                                </div>
                                <div className="text-sm font-bold truncate text-emerald-900">
                                    {(financeData?.current_balance_ars || 0).toLocaleString()}
                                </div>
                            </div>

                            {/* Daily Limit & Remaining */}
                            <div className="bg-white/60 rounded-lg p-2 border border-emerald-100 hover:bg-white/80 transition-colors shadow-sm">
                                <div className="flex items-center gap-1 mb-1 text-emerald-600">
                                    <Activity className="w-3 h-3" />
                                    <span className="text-[9px] font-bold">الحد اليومي</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-bold text-emerald-700">{dailyLimitARS.toLocaleString()}</span>
                                    <span className="text-[10px] text-gray-400">/</span>
                                    <span className={`text-sm font-bold ${(dailyLimitARS - todayExpense) < 0 ? 'text-red-600' : 'text-red-500'}`}>
                                        {(dailyLimitARS - todayExpense).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Expense */}
                            <div className="bg-red-50/50 rounded-lg p-2 border border-red-100 hover:bg-red-50 transition-colors shadow-sm">
                                <div className="flex items-center gap-1 mb-1 text-red-500">
                                    <TrendingDown className="w-3 h-3" />
                                    <span className="text-[9px] font-bold">مصروف اليوم</span>
                                </div>
                                <div className="text-sm font-bold truncate text-red-700">
                                    {todayExpense.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Prayer Times Section (Right Side) */}
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-md overflow-hidden flex flex-col">
                    <CardContent className="p-0 flex flex-col h-full">
                        {/* Header Row */}
                        <div className="bg-emerald-50/80 p-3 border-b border-emerald-100 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-white text-emerald-700 border-emerald-200 gap-1.5 pl-3 py-1 shadow-sm">
                                    {getPrayerIcon(nextPrayer?.name || '')}
                                    <span>
                                        {nextPrayer ? `القادمة: ${nextPrayer.nameAr}` : 'الصلاة القادمة'}
                                    </span>
                                </Badge>
                            </div>

                            {/* Interactive Countdown */}
                            <div
                                onClick={handleCountdownClick}
                                className={cn(
                                    "cursor-pointer transition-all duration-300 transform active:scale-95 text-sm font-bold px-3 py-1 rounded-md shadow-sm border",
                                    showElapsed
                                        ? "bg-amber-50 text-amber-700 animate-pulse border-amber-200"
                                        : "bg-white text-emerald-700 hover:bg-emerald-50 border-emerald-100"
                                )}
                            >
                                {showElapsed ? elapsedTimeStr : (timeUntilNext || '--:--')}
                            </div>
                        </div>

                        {/* Prayer Grid with Intervals */}
                        <div className="flex-1 grid grid-cols-6 divide-x divide-x-reverse divide-emerald-50 h-full min-h-[100px]">
                            {prayerTimes.filter(p => p.name !== 'sunset').map((prayer, idx, arr) => {
                                const isNext = nextPrayer?.name === prayer.name;
                                const interval = prayerIntervals[prayer.name];

                                return (
                                    <div
                                        key={prayer.name}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-2 text-center transition-all duration-300 relative group",
                                            isNext ? "bg-emerald-50/50" : "hover:bg-slate-50"
                                        )}
                                    >
                                        {isNext && (
                                            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 rounded-b-full shadow-[0_2px_8px_rgba(16,185,129,0.3)]" />
                                        )}

                                        <div className={cn(
                                            "mb-1.5 p-1.5 rounded-full transition-all duration-300",
                                            isNext ? "bg-emerald-100 text-emerald-600 scale-110" : "text-gray-400 group-hover:text-emerald-500 group-hover:bg-emerald-50"
                                        )}>
                                            {getPrayerIcon(prayer.name)}
                                        </div>

                                        <span className={cn(
                                            "text-[10px] font-medium mb-0.5",
                                            isNext ? "text-emerald-700 font-bold" : "text-gray-500"
                                        )}>
                                            {prayer.nameAr}
                                        </span>

                                        <span className={cn(
                                            "text-xs font-mono tracking-tight mb-1",
                                            isNext ? "text-emerald-900 font-bold" : "text-gray-700"
                                        )}>
                                            {prayer.time}
                                        </span>

                                        {/* Interval to Next Prayer (Bottom of cell) */}
                                        {interval && (
                                            <div className="absolute bottom-1 left-0 right-0 flex justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 rounded-full border border-slate-200 whitespace-nowrap scale-90">
                                                    {interval} ➜
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DashboardHeaderStrip;
