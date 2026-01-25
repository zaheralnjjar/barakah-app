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
    const [expandFinance, setExpandFinance] = useState(true);

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
    // 4. States for Collapsibility
    // expandFinance declared above

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
        <div className="flex flex-col gap-2">
            {/* 1. Prayer Times Card - Ultra Compact Single Row */}
            <Card className="w-full border-0 shadow-sm bg-white overflow-hidden">
                <CardContent className="p-0">
                    {/* Top Status Bar (Next Prayer & Remaining Time) */}
                    <div
                        className="bg-emerald-50/50 px-2 py-1 flex justify-between items-center border-b border-emerald-100 cursor-pointer select-none transition-colors hover:bg-emerald-100/50"
                        onClick={handleHeaderTimeClick}
                    >
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] font-bold text-emerald-800">
                                {nextPrayer ? `${nextPrayer.nameAr}` : 'الصلاة'}
                            </span>
                        </div>

                        <div className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all border ${showElapsedHeader
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-white text-emerald-700 border-emerald-200'
                            }`}>
                            {showElapsedHeader ? elapsedSincePrev : (timeUntilNext || '--:--:--')}
                        </div>
                    </div>

                    {/* Compact Grid Row (Name + Time) */}
                    <div className="grid grid-cols-6 bg-white text-center">
                        {
                            PRAYER_ORDER.map((prayerKey, idx) => {
                                const isNext = nextPrayer?.name?.toLowerCase() === prayerKey;
                                const pData = prayerTimes.find(p => p.name.toLowerCase() === prayerKey);
                                const pTime = pData?.time || '--:--';

                                return (
                                    <div
                                        key={prayerKey}
                                        className={cn(
                                            "py-0.5 flex flex-col items-center justify-center border-emerald-50 relative",
                                            idx < 5 && "border-l",
                                            isNext && "bg-emerald-50/80 ring-1 ring-inset ring-emerald-200"
                                        )}
                                    >
                                        <span className={cn(
                                            "text-[8px] font-bold leading-none mb-0.5",
                                            isNext ? "text-emerald-800" : "text-gray-400"
                                        )}>
                                            {PRAYER_NAMES[prayerKey as keyof typeof PRAYER_NAMES]}
                                        </span>
                                        <span className={cn(
                                            "text-[10px] font-bold font-mono leading-none tracking-tighter",
                                            isNext ? "text-emerald-900" : "text-emerald-600"
                                        )}>
                                            {pTime}
                                        </span>
                                    </div>
                                );
                            })
                        }
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DashboardHeaderStrip;
