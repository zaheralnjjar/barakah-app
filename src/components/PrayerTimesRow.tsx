
import React from 'react';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';

interface PrayerTimesRowProps {
    className?: string;
    showTimeUntilNext?: boolean;
}

const PrayerTimesRow: React.FC<PrayerTimesRowProps> = ({ className = "grid grid-cols-5 gap-2 text-center", showTimeUntilNext = false }) => {
    const { prayerTimes, nextPrayer, timeUntilNext, isLoading, error } = usePrayerTimes();

    const prayerNameMap: Record<string, string> = { 'fajr': 'الفجر', 'dhuhr': 'الظهر', 'asr': 'العصر', 'maghrib': 'المغرب', 'isha': 'العشاء' };
    const PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

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
                <div className="text-center mb-3">
                    <span className="text-sm font-bold text-gray-500">الصلاة القادمة: {nextPrayer.nameAr}</span>
                    <span className="text-gray-300 mx-1">|</span>
                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-bold">{timeUntilNext}</span>
                </div>
            )}

            <div className={className}>
                {PRAYER_ORDER.map((prayerKey) => {
                    const nextPrayerName = nextPrayer?.name?.toLowerCase() || '';
                    const isNext = nextPrayerName === prayerKey;

                    // Safe find
                    const pData = prayerTimes.find(p => p.name.toLowerCase() === prayerKey);
                    const pTime = pData?.time || '--:--';

                    return (
                        <div key={prayerKey} className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${isNext ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400 scale-105 shadow-sm' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                            <span className={`text-[10px] block mb-1 ${isNext ? 'text-emerald-700 font-bold' : 'text-gray-500'}`}>{prayerNameMap[prayerKey]}</span>
                            <span className={`text-sm font-bold ${isNext ? 'text-emerald-800' : 'text-gray-800'}`} dir="ltr">{pTime}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PrayerTimesRow;
