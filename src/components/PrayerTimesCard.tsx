import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PrayerTimesCard: React.FC = () => {
    const { prayerTimes, nextPrayer, timeUntilNext, isLoading, refetch, source } = usePrayerTimes();

    const getPrayerEmoji = (name: string) => {
        const emojis: { [key: string]: string } = {
            fajr: '🌅', sunrise: '🌄', dhuhr: '🌞', asr: '🌤️', maghrib: '🌅', isha: '🌙'
        };
        return emojis[name] || '🕌';
    };

    const today = new Date();
    const hijriDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day: 'numeric', month: 'long' }).format(today);
    const gregorianDate = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long' }).format(today);
    const dayName = new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(today);

    return (
        <Card className="overflow-hidden shadow-sm border-0">
            <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="arabic-title text-base flex items-center gap-2 text-gray-700">
                        🕌 أوقات الصلاة
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-normal">
                            {source === 'api' ? 'تلقائي' : source === 'manual' ? 'يدوي' : 'ملف'}
                        </span>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={refetch} disabled={isLoading}>
                            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-1 px-3 pb-3">
                {/* Next Prayer Highlight */}
                {nextPrayer && (
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-xl p-4 mb-3 shadow-lg relative overflow-hidden">
                        {/* Background pattern opacity */}
                        <div className="absolute top-0 left-0 w-full h-full bg-white/5 pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="flex items-center gap-1.5 mb-2 px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-xs border border-white/10">
                                <Clock className="w-3 h-3" />
                                <span>الصلاة القادمة</span>
                            </div>

                            <div className="flex flex-col items-center my-1">
                                <h2 className="text-3xl font-bold mb-1 tracking-wide">{nextPrayer.nameAr}</h2>
                                <p className="text-lg font-medium opacity-90 dir-rtl text-emerald-50">
                                    باقي {timeUntilNext}
                                </p>
                            </div>

                            <div className="w-full h-px bg-white/20 my-3"></div>

                            <div className="flex items-center justify-between w-full text-xs opacity-90 px-1 font-medium arabic-body">
                                <span>{gregorianDate}</span>
                                <span className="bg-white/20 px-2 py-0.5 rounded-md">{dayName}</span>
                                <span>{hijriDate}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* All Prayer Times */}
                <div className="grid grid-cols-3 gap-2">
                    {prayerTimes
                        .filter(p => p.name !== 'sunrise')
                        .map(prayer => (
                            <div
                                key={prayer.name}
                                className={`text-center p-2 rounded-lg ${nextPrayer?.name === prayer.name
                                    ? 'bg-primary/20 ring-2 ring-primary/30'
                                    : 'bg-gray-50'
                                    }`}
                            >
                                <p className="text-lg">{getPrayerEmoji(prayer.name)}</p>
                                <p className="text-xs arabic-body font-medium">{prayer.nameAr}</p>
                                <p className="text-sm font-bold">{prayer.time}</p>
                            </div>
                        ))}
                </div>


            </CardContent>
        </Card>
    );
};

export default PrayerTimesCard;
