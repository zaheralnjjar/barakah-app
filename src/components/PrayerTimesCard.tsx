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

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-2 bg-gradient-to-r from-amber-500/10 to-amber-600/5">
                <div className="flex items-center justify-between">
                    <CardTitle className="arabic-title text-lg flex items-center gap-2">
                        🕌 أوقات الصلاة
                    </CardTitle>
                    <Button size="icon" variant="ghost" onClick={refetch} disabled={isLoading}>
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                {/* Next Prayer Highlight */}
                {nextPrayer && (
                    <div className="bg-primary/10 rounded-lg p-3 mb-4 text-center">
                        <p className="text-xs text-muted-foreground arabic-body">الصلاة القادمة</p>
                        <p className="text-xl font-bold arabic-title text-primary">
                            {getPrayerEmoji(nextPrayer.name)} {nextPrayer.nameAr}
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-1">
                            <Badge variant="secondary" className="arabic-body">
                                <Clock className="w-3 h-3 ml-1" />
                                {nextPrayer.time}
                            </Badge>
                            <span className="text-sm text-muted-foreground arabic-body">
                                باقي {timeUntilNext}
                            </span>
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

                {/* Source indicator */}
                <div className="mt-3 text-center">
                    <Badge variant="outline" className="text-xs arabic-body">
                        {source === 'api' ? 'تلقائي' : source === 'manual' ? 'يدوي' : 'من ملف'}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
};

export default PrayerTimesCard;
