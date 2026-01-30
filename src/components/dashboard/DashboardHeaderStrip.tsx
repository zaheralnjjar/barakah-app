import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
    Wallet, ChevronDown, ChevronUp, BadgeDollarSign, Clock,
    FileText, Heart, RefreshCw, Navigation
} from 'lucide-react';
import { isAndroid } from '@/utils/platformDetection';
import { useFinance } from '@/hooks/useFinance';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useSystemModes } from '@/hooks/useSystemModes';
import { cn } from '@/lib/utils';

interface DashboardHeaderStripProps {
    newMuslimsCount?: number;
}

const DashboardHeaderStrip: React.FC<DashboardHeaderStripProps> = ({ newMuslimsCount }) => {
    // 1. Fetch Finance Data
    const { financeData, dailyLimit } = useFinance();
    const [dollarRates, setDollarRates] = useState<{ official: number; blue: number } | null>(null);

    // 1.5 Fetch System Modes
    const { modes, toggleMode } = useSystemModes();
    const activeMode = modes.find(m => m.is_active);

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
                const PRAYER_NAMES_ES = { 'fajr': 'Fajr', 'sunrise': 'Amanecer', 'dhuhr': 'Dhuhr', 'asr': 'Asr', 'maghrib': 'Maghrib', 'isha': 'Isha' };
                const prevNameEs = PRAYER_NAMES_ES[prevNameKey as keyof typeof PRAYER_NAMES_ES];
                setElapsedSincePrev(`${hours > 0 ? hours + 'h ' : ''}${mins}m desde ${prevNameEs}`);
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

    // 4. Calculate Intervals
    const getInterval = (currentKey: string): string => {
        const currentIdx = PRAYER_ORDER.indexOf(currentKey);
        if (currentIdx === -1) return '--';

        const nextIdx = (currentIdx + 1) % PRAYER_ORDER.length;
        const nextKey = PRAYER_ORDER[nextIdx];

        const currentP = prayerTimes.find(p => p.name.toLowerCase() === currentKey);
        const nextP = prayerTimes.find(p => p.name.toLowerCase() === nextKey);

        if (!currentP || !nextP) return '--';

        const [h1, m1] = currentP.time.split(':').map(Number);
        const [h2, m2] = nextP.time.split(':').map(Number);

        const d1 = new Date(); d1.setHours(h1, m1, 0, 0);
        const d2 = new Date(); d2.setHours(h2, m2, 0, 0);

        if (d2 < d1) d2.setDate(d2.getDate() + 1); // Cross midnight interval (Isha -> Fajr)

        const diffMs = d2.getTime() - d1.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;

        return `${hours > 0 ? hours + 'س ' : ''}${mins}د`;
    };

    return (
        <div className="flex flex-col gap-2">
            <Card className="w-full border-0 shadow-sm bg-white overflow-hidden rounded-xl">
                <CardContent className="p-0">
                    {/* Top Status Bar */}
                    <div className="bg-white px-2 py-1 flex justify-between items-center border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-800">
                                القادمة: {nextPrayer ? nextPrayer.nameAr : '...'}
                            </span>
                        </div>
                        <div
                            className={`px-3 py-1 border rounded-lg text-xs font-bold shadow-sm cursor-pointer select-none transition-all ${showElapsedHeader
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-white text-emerald-700 border-emerald-200'
                                }`}
                            onClick={handleHeaderTimeClick}
                        >
                            {showElapsedHeader ? elapsedSincePrev : (timeUntilNext || '--:--')}
                        </div>
                    </div>

                    {/* Active System Mode Strip */}
                    {activeMode && (
                        <div
                            className="px-3 py-1.5 flex items-center justify-between border-b animate-in fade-in slide-in-from-top-1 duration-500"
                            style={{ backgroundColor: `${activeMode.color}15`, borderBottomColor: `${activeMode.color}30` }}
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className="p-1 rounded-md text-white"
                                    style={{ backgroundColor: activeMode.color }}
                                >
                                    <RefreshCw className="w-3 h-3" />
                                </div>
                                <span className="text-xs font-black" style={{ color: activeMode.color }}>
                                    الوضع النشط: {activeMode.name}
                                </span>
                            </div>
                            <button
                                onClick={() => toggleMode({ id: activeMode.id, active: false })}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white/50 hover:bg-white transition-colors"
                                style={{ color: activeMode.color, borderColor: `${activeMode.color}40` }}
                            >
                                إيقاف
                            </button>
                        </div>
                    )}

                    {/* Table-like Grid */}
                    <div className="w-full">
                        {/* 1. Header Row (Names) */}
                        <div className="grid grid-cols-6 bg-[#0F8A74] text-white">
                            {PRAYER_ORDER.map((key) => (
                                <div key={key} className={cn(
                                    "text-center border-l border-emerald-600/30 last:border-l-0",
                                    !isAndroid() ? "py-1" : "py-1"
                                )}>
                                    <span className="text-[10px] md:text-xs font-bold">{PRAYER_NAMES[key as keyof typeof PRAYER_NAMES]}</span>
                                </div>
                            ))}
                        </div>

                        {/* 2. Times Row */}
                        <div className="grid grid-cols-6 bg-emerald-50/30">
                            {PRAYER_ORDER.map((key) => {
                                const isNext = nextPrayer?.name.toLowerCase() === key;
                                const pData = prayerTimes.find(p => p.name.toLowerCase() === key);
                                return (
                                    <div
                                        key={key}
                                        className={cn(
                                            "flex items-center justify-center border-l border-gray-100 last:border-l-0 relative",
                                            !isAndroid() ? "py-1" : "py-1.5",
                                            isNext && "bg-emerald-100/50"
                                        )}
                                    >
                                        <span className={cn(
                                            "text-xs md:text-sm font-bold font-mono",
                                            isNext ? "text-emerald-900" : "text-emerald-700"
                                        )}>
                                            {pData?.time || '--:--'}
                                        </span>
                                        {/* Active Indicator Line */}
                                        {isNext && <div className="absolute bottom-0 w-8 md:w-12 h-0.5 md:h-1 bg-emerald-500 rounded-full" />}
                                    </div>
                                );
                            })}
                        </div>

                        {/* 3. Intervals Row (The requested "Calculation") */}
                        <div className="grid grid-cols-6 bg-white border-t border-gray-100 mb-0.5">
                            {PRAYER_ORDER.map((key) => {
                                const isNext = nextPrayer?.name.toLowerCase() === key;
                                return (
                                    <div
                                        key={key}
                                        className={cn(
                                            "flex items-center justify-center border-l border-gray-100 last:border-l-0",
                                            !isAndroid() ? "py-0.5" : "py-1",
                                            isNext && "bg-emerald-50/30"
                                        )}
                                    >
                                        <span className="text-[9px] text-gray-400 font-medium">
                                            {getInterval(key)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DashboardHeaderStrip;
