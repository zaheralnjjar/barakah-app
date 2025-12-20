import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Moon, Clock, MapPin, Share2, FileDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatNumberToLocale } from '@/lib/utils';

interface DailyPrayer {
    date: string;
    fajr: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    [key: string]: string;
}

const PrayerManager = () => {
    const [prayerData, setPrayerData] = useState<DailyPrayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [nextPrayer, setNextPrayer] = useState<string>('');
    const [timeToNext, setTimeToNext] = useState<string>('');
    const [currentDate, setCurrentDate] = useState(new Date());

    // Automated Source - Fixed to Online
    const prayerSource = 'aladhan';

    const { toast } = useToast();

    useEffect(() => {
        loadPrayerData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentDate]);

    // Update time to next prayer every minute
    useEffect(() => {
        const timer = setInterval(calculateNextPrayer, 60000);
        calculateNextPrayer();
        return () => clearInterval(timer);
    }, [prayerData]);

    const loadPrayerData = async () => {
        setLoading(true);
        try {
            const user = (await supabase.auth.getUser()).data.user;

            // 1. Try to fetch from Supabase (cache) first if we saved it previously
            // But since user wants automation, fetching fresh online is safer for correctness,
            // or we can verify if the cached data matches the current month/year.
            // For now, let's prioritize fetching fresh data to ensure accuracy.

            await fetchOnlinePrayerTimes(user?.id);

        } catch (error) {
            console.error('Error loading prayer data:', error);
            toast({ title: "خطأ", description: "فشل تحميل مواقيت الصلاة", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const fetchOnlinePrayerTimes = async (userId?: string) => {
        // Default to Buenos Aires (as per previous context) or saved location
        let lat = -34.6037;
        let lng = -58.3816;

        const savedLocation = localStorage.getItem('baraka_user_location');
        if (savedLocation) {
            try {
                const loc = JSON.parse(savedLocation);
                lat = loc.latitude;
                lng = loc.longitude;
            } catch (e) { }
        }

        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            // Method 2: ISNA (usually good for generic), or Method 3 (Muslim World League) as seen in previous code.
            // Let's stick to Method 2 or 3. Validated previous code used Method 3.
            const response = await fetch(
                `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${lat}&longitude=${lng}&method=3`
            );
            const data = await response.json();

            if (data.code === 200 && data.data) {
                const formattedData: DailyPrayer[] = data.data.map((day: any) => ({
                    date: day.date.gregorian.date.split('-').reverse().join('-'), // DD-MM-YYYY -> YYYY-MM-DD
                    fajr: day.timings.Fajr.split(' ')[0],
                    dhuhr: day.timings.Dhuhr.split(' ')[0],
                    asr: day.timings.Asr.split(' ')[0],
                    maghrib: day.timings.Maghrib.split(' ')[0],
                    isha: day.timings.Isha.split(' ')[0]
                }));

                setPrayerData(formattedData);

                // Sync with Cloud if user exists
                if (userId) {
                    await supabase.from('prayer_settings').upsert({
                        user_id: userId,
                        source: 'aladhan_auto',
                        schedule: formattedData,
                        updated_at: new Date().toISOString()
                    });
                }
            } else {
                throw new Error("Invalid API response");
            }
        } catch (error) {
            console.error("Failed to fetch online prayer times", error);
        }
    };

    const calculateNextPrayer = () => {
        if (!prayerData.length) return;

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const todayPrayers = prayerData.find(p => p.date === todayStr);

        if (!todayPrayers) return;

        const prayers = [
            { name: 'الفجر', time: todayPrayers.fajr },
            { name: 'الظهر', time: todayPrayers.dhuhr },
            { name: 'العصر', time: todayPrayers.asr },
            { name: 'المغرب', time: todayPrayers.maghrib },
            { name: 'العشاء', time: todayPrayers.isha },
        ];

        for (const prayer of prayers) {
            const [hours, minutes] = prayer.time.split(':').map(Number);
            const prayerTime = new Date(now);
            prayerTime.setHours(hours, minutes, 0);

            if (prayerTime > now) {
                setNextPrayer(prayer.name);
                const diff = prayerTime.getTime() - now.getTime();
                const diffHours = Math.floor(diff / (1000 * 60 * 60));
                const diffMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                setTimeToNext(`${diffHours} ساعة و ${diffMinutes} دقيقة`);
                return;
            }
        }

        // If all prayers passed, next is Fajr tomorrow
        setNextPrayer('الفجر (غداً)');
        setTimeToNext('--:--');
    };

    const downloadICS = () => {
        let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Barakah App//Prayer Times//AR\n";

        prayerData.forEach(day => {
            const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
            prayers.forEach(p => {
                const dateStr = day.date.replace(/-/g, '');
                const timeStr = day[p].replace(':', '') + '00';
                icsContent += `BEGIN:VEVENT\nSUMMARY:Salah ${p}\nDTSTART:${dateStr}T${timeStr}\nDTEND:${dateStr}T${timeStr}\nDESCRIPTION:Prayer time for ${p}\nEND:VEVENT\n`;
            });
        });

        icsContent += "END:VCALENDAR";

        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prayer-times-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const shareSchedule = async () => {
        const today = new Date().toISOString().split('T')[0];
        const todayPrayers = prayerData.find(p => p.date === today);

        let text = `مواقيت الصلاة لشهر ${currentDate.toLocaleString('ar-EG', { month: 'long' })} ${currentDate.getFullYear()}\n`;

        if (todayPrayers) {
            text += `\nمواقيت اليوم (${today}):\n`;
            text += `الفجر: ${todayPrayers.fajr}\n`;
            text += `الظهر: ${todayPrayers.dhuhr}\n`;
            text += `العصر: ${todayPrayers.asr}\n`;
            text += `المغرب: ${todayPrayers.maghrib}\n`;
            text += `العشاء: ${todayPrayers.isha}\n`;
        }

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'مواقيت الصلاة - بركة',
                    text: text,
                });
            } catch (err) {
                console.log("Share failed", err);
            }
        } else {
            await navigator.clipboard.writeText(text);
            toast({ title: 'تم النسخ', description: 'تم نسخ جدول الصلاة' });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
                <p className="arabic-body text-gray-500">جاري تحديث مواقيت الصلاة...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-fade-in">
                    <Moon className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl arabic-title text-primary mb-2">مواقيت الصلاة</h1>
                <div className="flex items-center justify-center gap-2 text-muted-foreground arabic-body">
                    <MapPin className="w-4 h-4" />
                    <span>تحديث تلقائي (حسب الموقع)</span>
                </div>
            </div>

            {/* Next Prayer Card */}
            <Card className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white border-none shadow-lg overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
                <CardContent className="p-8 relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                            <Clock className="w-4 h-4 text-white" />
                            <span className="arabic-body text-sm font-medium">الصلاة القادمة</span>
                        </div>
                        <span className="arabic-body text-2xl font-light tracking-wider">{timeToNext}</span>
                    </div>
                    <div className="text-5xl font-bold arabic-title mb-2">
                        {nextPrayer || '...'}
                    </div>
                    <p className="text-emerald-100 arabic-body text-sm mt-2">
                        {new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </CardContent>
            </Card>

            {/* Monthly Calendar View */}
            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <CardTitle className="arabic-title text-xl text-gray-800">جدول الشهر</CardTitle>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={shareSchedule}
                                className="flex-1 md:flex-none border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                            >
                                <Share2 className="w-4 h-4 ml-2" />
                                مشاركة
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={downloadICS}
                                className="flex-1 md:flex-none border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                            >
                                <FileDown className="w-4 h-4 ml-2" />
                                تصدير
                            </Button>
                        </div>
                    </div>

                    {/* Month Selector */}
                    <div className="flex items-center justify-center gap-6 mt-6 bg-white p-2 rounded-lg border border-gray-100 shadow-sm w-full md:w-fit mx-auto">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                            className="hover:bg-gray-100"
                        >
                            السابق
                        </Button>
                        <span className="font-bold text-gray-700 min-w-[140px] text-center">
                            {currentDate.toLocaleString('ar-EG', { month: 'long', year: 'numeric' })}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                            className="hover:bg-gray-100"
                        >
                            التالي
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="p-4 font-semibold whitespace-nowrap">التاريخ</th>
                                    <th className="p-4 font-semibold text-emerald-700 whitespace-nowrap">الفجر</th>
                                    <th className="p-4 font-semibold text-gray-600 whitespace-nowrap">الظهر</th>
                                    <th className="p-4 font-semibold text-gray-600 whitespace-nowrap">العصر</th>
                                    <th className="p-4 font-semibold text-amber-600 whitespace-nowrap">المغرب</th>
                                    <th className="p-4 font-semibold text-indigo-700 whitespace-nowrap">العشاء</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {prayerData.map((day, index) => {
                                    const isToday = day.date === new Date().toISOString().split('T')[0];
                                    return (
                                        <tr key={index} className={`hover:bg-gray-50 transition-colors ${isToday ? 'bg-emerald-50/60' : ''}`}>
                                            <td className="p-4 font-medium whitespace-nowrap dir-ltr text-right">
                                                <span className="font-english">{day.date}</span>
                                            </td>
                                            <td className="p-4 text-emerald-600 font-bold">{formatNumberToLocale(day.fajr)}</td>
                                            <td className="p-4 text-gray-600">{formatNumberToLocale(day.dhuhr)}</td>
                                            <td className="p-4 text-gray-600">{formatNumberToLocale(day.asr)}</td>
                                            <td className="p-4 text-amber-600 font-bold">{formatNumberToLocale(day.maghrib)}</td>
                                            <td className="p-4 text-indigo-700">{formatNumberToLocale(day.isha)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PrayerManager;
