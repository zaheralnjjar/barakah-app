
import React, { useState, useEffect, useCallback } from 'react';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';

interface PrayerTimesRowProps {
    className?: string;
    showTimeUntilNext?: boolean;
}

const PrayerTimesRow: React.FC<PrayerTimesRowProps> = ({ className = "grid grid-cols-5 gap-2 text-center", showTimeUntilNext = false }) => {
    const { prayerTimes, nextPrayer, timeUntilNext, isLoading, error } = usePrayerTimes();
    const [showPreviousPrayer, setShowPreviousPrayer] = useState(false);
    const [previousPrayerInfo, setPreviousPrayerInfo] = useState<{ name: string; elapsed: string } | null>(null);

    const prayerNameMap: Record<string, string> = { 'fajr': 'الفجر', 'sunrise': 'الشروق', 'dhuhr': 'الظهر', 'asr': 'العصر', 'maghrib': 'المغرب', 'isha': 'العشاء' };
    const PRAYER_ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

    // Calculate previous prayer info
    const calculatePreviousPrayer = useCallback(() => {
        if (!prayerTimes.length || !nextPrayer) return null;

        const now = new Date();
        const currentPrayerIndex = PRAYER_ORDER.indexOf(nextPrayer.name.toLowerCase());
        const previousIndex = currentPrayerIndex === 0 ? 4 : currentPrayerIndex - 1;
        const previousPrayerKey = PRAYER_ORDER[previousIndex];
        const previousPrayerName = prayerNameMap[previousPrayerKey];

        const previousPrayer = prayerTimes.find(p => p.name.toLowerCase() === previousPrayerKey);
        if (!previousPrayer) return null;

        // Parse prayer time
        const [hours, minutes] = previousPrayer.time.split(':').map(Number);
        const prayerTime = new Date(now);
        prayerTime.setHours(hours, minutes, 0, 0);

        // If previous prayer was yesterday (e.g., Isha for Fajr)
        if (currentPrayerIndex === 0) {
            prayerTime.setDate(prayerTime.getDate() - 1);
        }

        const elapsedMs = now.getTime() - prayerTime.getTime();
        const elapsedMinutes = Math.floor(elapsedMs / 60000);
        const elapsedHours = Math.floor(elapsedMinutes / 60);
        const remainingMinutes = elapsedMinutes % 60;

        let elapsed = '';
        if (elapsedHours > 0) {
            elapsed = `${elapsedHours} ساعة و ${remainingMinutes} دقيقة`;
        } else {
            elapsed = `${remainingMinutes} دقيقة`;
        }

        return { name: previousPrayerName, elapsed };
    }, [prayerTimes, nextPrayer]);

    // Update previous prayer info periodically
    useEffect(() => {
        const info = calculatePreviousPrayer();
        setPreviousPrayerInfo(info);

        const interval = setInterval(() => {
            const info = calculatePreviousPrayer();
            setPreviousPrayerInfo(info);
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [calculatePreviousPrayer]);

    // Handle click to toggle view
    const handleCountdownClick = () => {
        if (showPreviousPrayer) return; // Already showing previous

        setShowPreviousPrayer(true);

        // Revert after 5 seconds
        setTimeout(() => {
            setShowPreviousPrayer(false);
        }, 5000);
    };

    if (isLoading) {
        return <div className="text-center text-gray-500 text-xs py-4">جاري تحميل أوقات الصلاة...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 text-xs py-4">فشل تحميل الأوقات</div>;
    }

    // Ensure we have data, otherwise fallback to placeholders
    const displayTimes = prayerTimes.length > 0 ? prayerTimes : PRAYER_ORDER.map(key => ({
        name: key,
        time: '--:--',
    }));

    return (
        <div className="w-full">
            {showTimeUntilNext && nextPrayer && (
                <div
                    className="text-center mb-3 cursor-pointer select-none transition-all"
                    onClick={handleCountdownClick}
                    title="اضغط لرؤية الوقت منذ الصلاة الماضية"
                >
                    {showPreviousPrayer && previousPrayerInfo ? (
                        // Show previous prayer elapsed time
                        <>
                            <span className="text-sm font-bold text-amber-600">الصلاة الماضية: {previousPrayerInfo.name}</span>
                            <span className="text-gray-300 mx-1">|</span>
                            <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">
                                منذ {previousPrayerInfo.elapsed}
                            </span>
                        </>
                    ) : (
                        // Show next prayer countdown
                        <>
                            <span className="text-sm font-bold text-gray-500">الصلاة القادمة: {nextPrayer.nameAr}</span>
                            <span className="text-gray-300 mx-1">|</span>
                            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-bold">{timeUntilNext}</span>
                        </>
                    )}
                </div>
            )}

            {/* Row 1: Prayer times (attached together, no gaps) */}
            <div className="flex items-stretch">
                {PRAYER_ORDER.map((prayerKey, idx) => {
                    const nextPrayerName = nextPrayer?.name?.toLowerCase() || '';
                    const isNext = nextPrayerName === prayerKey;

                    const pData = prayerTimes.find(p => p.name.toLowerCase() === prayerKey);
                    const pTime = pData?.time || '--:--';

                    return (
                        <div
                            key={prayerKey}
                            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 transition-all ${isNext
                                ? 'bg-emerald-200 ring-2 ring-emerald-500 shadow-md z-10'
                                : 'bg-white hover:bg-gray-50'
                                } ${idx === 0 ? 'rounded-r-lg' : ''} ${idx === 4 ? 'rounded-l-lg' : ''} border-y border-gray-200 ${idx > 0 ? '' : 'border-r'} ${idx < 4 ? 'border-l border-l-gray-100' : 'border-l'}`}
                        >
                            <span className={`text-[9px] block ${isNext ? 'text-emerald-800 font-bold' : 'text-gray-500'}`}>{prayerNameMap[prayerKey]}</span>
                            <span className={`text-xs font-bold ${isNext ? 'text-emerald-900' : 'text-gray-800'}`} dir="ltr">{pTime}</span>
                        </div>
                    );
                })}
            </div>

            {/* Row 2: Interval icons (centered between each pair of prayers) */}
            {prayerTimes.length > 0 && (
                <div className="relative h-6 mt-1">
                    {[0, 1, 2, 3, 4].map((idx) => {
                        const currentPrayer = prayerTimes.find(p => p.name.toLowerCase() === PRAYER_ORDER[idx]);
                        const nextPrayerData = prayerTimes.find(p => p.name.toLowerCase() === PRAYER_ORDER[idx + 1]);

                        if (!currentPrayer || !nextPrayerData) return null;

                        const [h1, m1] = currentPrayer.time.split(':').map(Number);
                        const [h2, m2] = nextPrayerData.time.split(':').map(Number);
                        const mins1 = h1 * 60 + m1;
                        const mins2 = h2 * 60 + m2;
                        const diffMins = mins2 - mins1;
                        const hours = Math.floor(diffMins / 60);
                        const mins = diffMins % 60;

                        let intervalText = '';
                        if (hours > 0 && mins > 0) {
                            intervalText = `${hours}س${mins}د`;
                        } else if (hours > 0) {
                            intervalText = `${hours}س`;
                        } else {
                            intervalText = `${mins}د`;
                        }

                        // Position: centered between prayer idx and idx+1
                        // With 6 prayers, each takes ~16.67% width
                        const leftPercent = (idx + 0.5) * (100 / 6) + (100 / 12);

                        return (
                            <div
                                key={idx}
                                className="absolute top-0 transform -translate-x-1/2"
                                style={{ left: `${leftPercent}%` }}
                                title={`المدة بين ${prayerNameMap[PRAYER_ORDER[idx]]} و ${prayerNameMap[PRAYER_ORDER[idx + 1]]}`}
                            >
                                <div className="flex flex-col items-center bg-gray-50 border border-gray-200 rounded-full px-1.5 py-0.5">
                                    <span className="text-[7px] text-gray-500 font-medium">{intervalText}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PrayerTimesRow;
