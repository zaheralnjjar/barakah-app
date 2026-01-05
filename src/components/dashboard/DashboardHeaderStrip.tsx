import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
    Wallet, ChevronDown, ChevronUp, BadgeDollarSign, Clock
} from 'lucide-react';
import { useFinance } from '@/hooks/useFinance';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { cn } from '@/lib/utils';

interface DashboardHeaderStripProps {
    newMuslimsCount?: number;
}

const DashboardHeaderStrip: React.FC<DashboardHeaderStripProps> = ({ newMuslimsCount }) => {
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
    const PRAYER_ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const PRAYER_NAMES = { 'fajr': 'الفجر', 'sunrise': 'الشروق', 'dhuhr': 'الظهر', 'asr': 'العصر', 'maghrib': 'المغرب', 'isha': 'العشاء' };

    // 3. Header Timer Logic (Remaining vs Elapsed)
    const [showElapsedHeader, setShowElapsedHeader] = useState(false);
    const [elapsedSincePrev, setElapsedSincePrev] = useState('');

    useEffect(() => {
        if (!prayerTimes.length || !nextPrayer) return;

        const calcElapsed = () => {
            const now = new Date();
            const currentIdx = PRAYER_ORDER.indexOf(nextPrayer.name.toLowerCase());

            const prevIdx = currentIdx === 0 ? 5 : currentIdx - 1;
            const prevNameKey = PRAYER_ORDER[prevIdx];
            const prevPrayerObj = prayerTimes.find(p => p.name.toLowerCase() === prevNameKey);

            if (prevPrayerObj) {
                const [h, m] = prevPrayerObj.time.split(':').map(Number);
                const prevTime = new Date();
                prevTime.setHours(h, m, 0, 0);
                if (currentIdx === 0) prevTime.setDate(prevTime.getDate() - 1); // Yesterday's Isha

                const diff = now.getTime() - prevTime.getTime();
                if (diff < 0) { setElapsedSincePrev('--'); return; }

                const diffMins = Math.floor(diff / 60000);
                const hours = Math.floor(diffMins / 60);
                const mins = diffMins % 60;
                const prevNameAr = PRAYER_NAMES[prevNameKey as keyof typeof PRAYER_NAMES];
                setElapsedSincePrev(`${hours > 0 ? hours + 'س ' : ''}${mins}د منذ ${prevNameAr}`);
            }
        };
        calcElapsed();
        const interval = setInterval(calcElapsed, 60000);
        return () => clearInterval(interval);
    }, [nextPrayer, prayerTimes]);

    const handleHeaderTimeClick = () => {
        if (!showElapsedHeader) {
            setShowElapsedHeader(true);
            setTimeout(() => setShowElapsedHeader(false), 30000);
        } else {
            setShowElapsedHeader(false);
        }
    };

    // 4. States for Collapsibility
    const [expandFinance, setExpandFinance] = useState(false); // Default collapsed

    // 5. Calculations
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

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
            {/* 1. Prayer Times Card */}
            <Card className="border-0 shadow-sm bg-white overflow-hidden">
                <CardContent className="p-0">
                    {/* Header (Next Prayer) */}
                    <div
                        className="bg-emerald-50/50 px-3 py-2 flex justify-between items-center border-b border-emerald-100 cursor-pointer select-none transition-colors hover:bg-emerald-100/50"
                        onClick={handleHeaderTimeClick}
                    >
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold text-emerald-800 flex items-center gap-1.5`}>
                                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                {nextPrayer ? `القادمة: ${nextPrayer.nameAr}` : 'الصلاة القادمة'}
                            </span>
                        </div>

                        <div className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold transition-all shadow-sm border ${showElapsedHeader
                            ? 'bg-amber-100 text-amber-800 border-amber-200 animate-in fade-in zoom-in'
                            : 'bg-white text-emerald-700 border-emerald-200'
                            }`}>
                            {showElapsedHeader ? elapsedSincePrev : (timeUntilNext || '--:--:--')}
                        </div>
                    </div>

                    {/* Header Row (Grid Titles) */}
                    <div className="grid grid-cols-6 bg-gradient-to-l from-emerald-600 to-teal-600 text-center">
                        {
                            PRAYER_ORDER.map((prayerKey, idx) => (
                                <div key={prayerKey} className={`py-1.5 px-0.5 ${idx < 5 ? 'border-l border-white/20' : ''}`}>
                                    <span className="text-[10px] font-bold text-white whitespace-nowrap">
                                        {PRAYER_NAMES[prayerKey as keyof typeof PRAYER_NAMES]}
                                    </span>
                                </div>
                            ))
                        }
                    </div>

                    {/* Times Row with Intervals Inside */}
                    <div className="grid grid-cols-6 bg-emerald-50 text-center pb-2">
                        {
                            PRAYER_ORDER.map((prayerKey, idx) => {
                                const isNext = nextPrayer?.name?.toLowerCase() === prayerKey;
                                const pData = prayerTimes.find(p => p.name.toLowerCase() === prayerKey);
                                const pTime = pData?.time || '--:--';

                                // Calculate interval to next prayer
                                let intervalText = '';
                                const nextKey = PRAYER_ORDER[(idx + 1) % 6]; // Circular for Isha->Fajr
                                const nextPData = prayerTimes.find(p => p.name.toLowerCase() === nextKey);

                                if (pData && nextPData) {
                                    const [h1, m1] = pData.time.split(':').map(Number);
                                    const [h2, m2] = nextPData.time.split(':').map(Number);
                                    const mins1 = h1 * 60 + m1;
                                    let mins2 = h2 * 60 + m2;

                                    // Handle overflow (Isha -> Fajr)
                                    if (mins2 < mins1) mins2 += 24 * 60;

                                    const diff = mins2 - mins1;
                                    const h = Math.floor(diff / 60);
                                    const m = diff % 60;
                                    intervalText = h > 0 ? `${h}س ${m}د` : `${m}د`;
                                }

                                return (
                                    <div
                                        key={prayerKey}
                                        className={`py-2 px-0.5 flex flex-col items-center justify-center transition-all ${isNext ? 'bg-emerald-100/80 ring-1 ring-inset ring-emerald-400/50 z-10' : ''
                                            } ${idx < 5 ? 'border-l border-emerald-100' : ''}`}
                                    >
                                        <span className={`text-xs font-bold ${isNext ? 'text-emerald-900 scale-110' : 'text-emerald-700'} font-mono mb-0.5`}>
                                            {pTime}
                                        </span>

                                        {/* Divider */}
                                        {intervalText && (
                                            <div className={`w-8 h-px my-1 ${isNext ? 'bg-emerald-300' : 'bg-emerald-200/50'}`}></div>
                                        )}

                                        {/* Interval Text (Darker) */}
                                        {intervalText && (
                                            <span className={`text-[9px] font-bold font-mono ${isNext ? 'text-emerald-800' : 'text-gray-500'}`}>
                                                {intervalText}
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        }
                    </div>
                </CardContent>
            </Card>

            {/* 2. Financial Summary Card (Collapsible) */}
            <Card className="border-0 shadow-sm bg-white overflow-hidden transition-all duration-300">
                <CardContent className="p-0">
                    {/* Header (Collapsible Trigger) */}
                    <div
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                        onClick={() => setExpandFinance(!expandFinance)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-emerald-100 rounded-full text-emerald-600 relative">
                                <Wallet className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-700">الملخص المالي</span>
                                    {/* Official Rate Badge */}
                                    <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                        <span className="text-[9px] text-gray-400">$</span>
                                        <span className="text-[9px] font-mono font-bold text-gray-600">{dollarRates?.official || '---'}</span>
                                    </div>
                                </div>
                                {!expandFinance && (
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="flex items-center gap-1">
                                            <span className="text-[9px] text-gray-400">الرصيد:</span>
                                            <span className="text-[10px] font-mono font-bold text-gray-700">
                                                {financeData?.current_balance_ars?.toLocaleString() || '0'}
                                                <span className="text-[8px] text-gray-400 mr-1">(${dollarRates?.official ? ((financeData?.current_balance_ars || 0) / dollarRates.official).toFixed(0) : '--'})</span>
                                            </span>
                                        </div>
                                        <span className="text-[9px] text-gray-300">|</span>
                                        <span className={`text-[10px] font-mono font-bold ${remainingDaily < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                            {remainingDaily.toLocaleString()}
                                            <span className={`text-[8px] mr-1 ${remainingDaily < 0 ? 'text-red-400' : 'text-emerald-400'}`}>(${dollarRates?.official ? (remainingDaily / dollarRates.official).toFixed(0) : '--'})</span>
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        {expandFinance ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>

                    {/* Expanded Details */}
                    {expandFinance && (
                        <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-1">
                            <div className="h-px w-full bg-gray-100 mb-2"></div>

                            {/* Full Rates */}
                            <div className="flex justify-between items-center mb-2 px-1 bg-blue-50/50 p-1.5 rounded">
                                <div className="flex items-center gap-1">
                                    <BadgeDollarSign className="w-3 h-3 text-blue-500" />
                                    <span className="text-[10px] font-bold text-blue-700">أسعار الصرف:</span>
                                </div>
                                <div className="flex gap-3">
                                    <span className="text-[10px] text-gray-600">رسمي: <b className="font-mono">{dollarRates?.official || '---'}</b></span>
                                    <span className="text-[10px] text-blue-600">بلو: <b className="font-mono">{dollarRates?.blue || '---'}</b></span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 divide-x divide-x-reverse divide-gray-100">
                                <div className="text-center px-1">
                                    <p className="text-[9px] text-gray-400 mb-0.5">الحد اليومي</p>
                                    <p className="text-sm font-bold font-mono text-gray-700">{dailyLimitARS.toLocaleString()}</p>
                                    <p className="text-[8px] text-gray-400">${dollarRates?.official ? (dailyLimitARS / dollarRates.official).toFixed(1) : '--'}</p>
                                </div>
                                <div className="text-center px-1">
                                    <p className="text-[9px] text-gray-400 mb-0.5">مصروف اليوم</p>
                                    <p className="text-sm font-bold font-mono text-red-600">{todayExpense.toLocaleString()}</p>
                                    <p className="text-[8px] text-red-400">${dollarRates?.official ? (todayExpense / dollarRates.official).toFixed(1) : '--'}</p>
                                </div>
                                <div className="text-center px-1">
                                    <p className="text-[9px] text-gray-400 mb-0.5">الرصيد الكلي</p>
                                    <p className="text-sm font-bold font-mono text-emerald-600">
                                        {financeData?.current_balance_ars?.toLocaleString() || '0'}
                                    </p>
                                    <p className="text-[8px] text-emerald-400">${dollarRates?.official ? ((financeData?.current_balance_ars || 0) / dollarRates.official).toFixed(1) : '--'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    );
};

export default DashboardHeaderStrip;
