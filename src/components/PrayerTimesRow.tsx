
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
        <div className="w-full h-full flex flex-col">
            {/* Header Row - Same as DashboardStats */}
            <div className="grid grid-cols-6 bg-gradient-to-l from-emerald-500 to-teal-500 text-center">
                {PRAYER_ORDER.map((prayerKey, idx) => (
                    <div key={prayerKey} className={`py-1.5 px-0.5 ${idx < 5 ? 'border-l border-white/20' : ''}`}>
                        <span className="text-[10px] font-bold text-white whitespace-nowrap">
                            {prayerNameMap[prayerKey]}
                        </span>
                    </div>
                ))}
            </div>

            {/* Values Row - Matching DashboardStats style */}
            <div className="grid grid-cols-6 bg-emerald-50 text-center flex-1">
                {PRAYER_ORDER.map((prayerKey, idx) => {
                    const nextPrayerName = nextPrayer?.name?.toLowerCase() || '';
                    const isNext = nextPrayerName === prayerKey;
                    const pData = prayerTimes.find(p => p.name.toLowerCase() === prayerKey);
                    const pTime = pData?.time || '--:--';

                    return (
                        <div
                            key={prayerKey}
                            className={`py-2 px-0.5 flex flex-col items-center justify-center transition-all ${isNext ? 'bg-emerald-100/80 ring-1 ring-inset ring-emerald-400/50 z-10' : ''
                                } ${idx < 5 ? 'border-l border-emerald-100' : ''}`}
                        >
                            <span className={`text-xs font-bold ${isNext ? 'text-emerald-900 scale-110' : 'text-emerald-700'}`} dir="ltr">
                                {pTime}
                            </span>
                            {isNext && showTimeUntilNext && (
                                <span className="text-[8px] text-emerald-600 font-medium mt-0.5 animate-pulse">
                                    {timeUntilNext}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Interval Footer (Optional / Compact) */}
            {prayerTimes.length > 0 && (
                <div className="grid grid-cols-5 bg-white/50 border-t border-emerald-100/50 py-1">
                    {[0, 1, 2, 3, 4].map((idx) => {
                        const currentPrayer = prayerTimes.find(p => p.name.toLowerCase() === PRAYER_ORDER[idx]);
                        const nextPrayerData = prayerTimes.find(p => p.name.toLowerCase() === PRAYER_ORDER[idx + 1]);
                        if (!currentPrayer || !nextPrayerData) return null;

                        const [h1, m1] = currentPrayer.time.split(':').map(Number);
                        const [h2, m2] = nextPrayerData.time.split(':').map(Number);
                        const mins1 = h1 * 60 + m1;
                        let mins2 = h2 * 60 + m2;
                        if (mins2 < mins1) mins2 += 24 * 60; // Handle next day (Isha-Fajr)

                        const diffMins = mins2 - mins1;
                        const hours = Math.floor(diffMins / 60);
                        const mins = diffMins % 60;
                        const text = hours > 0 ? `${hours}س${mins > 0 ? mins + 'د' : ''}` : `${mins}د`;

                        return (
                            <div key={idx} className="flex flex-col items-center border-l last:border-l-0 border-emerald-100/30">
                                <span className="text-[8px] text-gray-400 font-mono">{text}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PrayerTimesRow;
