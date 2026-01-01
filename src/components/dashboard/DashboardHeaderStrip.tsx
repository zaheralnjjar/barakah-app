import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, DollarSign, Wallet, Activity, Clock, Moon, Sun, Sunrise, Sunset } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
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

                    <CardContent className="p-0 flex flex-col justify-center h-full relative z-10">
                        {/* Dollar Rate Row - Enhanced with Oficial & Blue */}
                        <div className="flex justify-between items-center p-4 border-b-2 border-emerald-200/70">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white rounded-xl shadow-sm">
                                    <DollarSign className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="flex flex-col items-center justify-center gap-2">
                                    {/* Resmi Rate */}
                                    <span className="text-lg font-bold font-mono text-gray-500 leading-none tracking-tight">
                                        {financeData?.oficial_rate || financeData?.exchange_rate || '---'}
                                    </span>

                                    {/* Blue Rate */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold font-mono text-blue-600 leading-none tracking-tight">
                                            {financeData?.exchange_rate || '---'}
                                        </span>
                                        {financeData?.dollar_change !== 0 && (
                                            <Badge variant="outline" className={cn(
                                                "text-[9px] py-0 px-1 border-0 h-4 min-w-[32px] justify-center flex",
                                                (financeData?.dollar_change || 0) > 0 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                                            )}>
                                                {(financeData?.dollar_change || 0) > 0 ? <TrendingUp className="w-2.5 h-2.5 ml-0.5" /> : <TrendingDown className="w-2.5 h-2.5 ml-0.5" />}
                                                {Math.abs(financeData?.dollar_change || 0).toFixed(0)}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-[10px] text-emerald-600 bg-white/70 px-3 py-2 rounded-xl border border-emerald-100 flex flex-col items-end shadow-sm">
                                <span className="font-medium">تحديث {format(new Date(), 'HH:mm')}</span>
                                {financeData?.last_update && (
                                    <span className="opacity-60 text-[8px]">منذ {formatDistanceToNow(new Date(financeData.last_update), { locale: ar })}</span>
                                )}
                            </div>
                        </div>

                        {/* Stats Grid - Fixed 2 Rows x 3 Columns Layout */}
                        <div className="flex flex-col w-full bg-emerald-50/30">
                            {/* Row 1: Titles */}
                            <div className="flex w-full flex-nowrap divide-x divide-x-reverse divide-emerald-100/60 border-b border-emerald-100/50">
                                <div className="flex-1 text-center py-1 text-[9px] text-emerald-600/70 font-bold whitespace-nowrap overflow-hidden text-ellipsis">مصروف اليوم</div>
                                <div className="flex-1 text-center py-1 text-[9px] text-emerald-600/70 font-bold whitespace-nowrap overflow-hidden text-ellipsis">الحد اليومي</div>
                                <div className="flex-1 text-center py-1 text-[9px] text-emerald-600/70 font-bold whitespace-nowrap overflow-hidden text-ellipsis">الرصيد</div>
                            </div>

                            {/* Row 2: Values */}
                            <div className="flex w-full flex-nowrap divide-x divide-x-reverse divide-emerald-100/60 items-center">
                                {/* Today Expense */}
                                <div className="flex-1 text-center py-2 px-1">
                                    <span className="text-xs sm:text-sm font-bold font-mono text-red-600 tracking-tight block truncate">
                                        {todayExpense.toLocaleString()}
                                    </span>
                                </div>

                                {/* Daily Limit */}
                                <div className="flex-1 flex flex-col items-center justify-center py-1 px-1">
                                    <span className="text-xs sm:text-sm font-bold font-mono text-emerald-800 tracking-tight leading-none block truncate">
                                        {dailyLimitARS.toLocaleString()}
                                    </span>
                                    <span className={`text-[8px] font-mono mt-0.5 ${(dailyLimitARS - todayExpense) < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                        ({(dailyLimitARS - todayExpense).toLocaleString()})
                                    </span>
                                </div>

                                {/* Balance */}
                                <div className="flex-1 text-center py-2 px-1">
                                    <span className="text-xs sm:text-sm font-bold font-mono text-emerald-900 tracking-tight block truncate">
                                        {(financeData?.current_balance_ars || 0).toLocaleString()}
                                    </span>
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

                        {/* Prayer Grid with Intervals - Using Flex to ensure visibility */}
                        <div className="flex-1 flex justify-between divide-x divide-x-reverse divide-emerald-50 h-full min-h-[120px] overflow-x-auto">
                            {prayerTimes.filter(p => p.name !== 'sunset').map((prayer, idx, arr) => {
                                const isNext = nextPrayer?.name === prayer.name;
                                const interval = prayerIntervals[prayer.name];

                                return (
                                    <div
                                        key={prayer.name}
                                        className={cn(
                                            "flex-1 flex flex-col items-center justify-start p-2 pt-3 pb-6 text-center transition-all duration-300 relative group min-w-[50px]",
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
                                            "text-xs font-mono tracking-tight",
                                            isNext ? "text-emerald-900 font-bold" : "text-gray-700"
                                        )}>
                                            {prayer.time}
                                        </span>

                                        {/* Interval to Next Prayer (Bottom of cell - with more spacing) */}
                                        {interval && (
                                            <div className="absolute bottom-1.5 left-0 right-0 flex justify-center">
                                                <span className="text-[8px] bg-slate-100/80 text-slate-400 px-1 py-0.5 rounded-full border border-slate-200/50 whitespace-nowrap">
                                                    ➜ {interval}
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
