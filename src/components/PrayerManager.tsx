import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Moon, Clock, MapPin, Share2, FileDown, Calendar, FileText, Download, Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { formatNumberToLocale } from '@/lib/utils';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DailyPrayer {
    date: string;
    fajr: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    sunrise?: string;
    hijriDate?: string;
    hijriMonthName?: string;
    hijriMonthNumber?: number;
    [key: string]: any;
}

const PrayerManager = () => {
    const [prayerData, setPrayerData] = useState<DailyPrayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [nextPrayer, setNextPrayer] = useState<string>('');
    const [timeToNext, setTimeToNext] = useState<string>('');
    const [currentDate, setCurrentDate] = useState(new Date());

    // Export Modal State
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportPrayers, setExportPrayers] = useState<Record<string, boolean>>({
        fajr: true, sunrise: true, dhuhr: true, asr: true, maghrib: true, isha: true
    });
    const [exportLang, setExportLang] = useState<'ar' | 'es'>('es');
    const [exportFromDate, setExportFromDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [exportToDate, setExportToDate] = useState(() => {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth.toISOString().split('T')[0];
    });
    const [exportHijriMonth, setExportHijriMonth] = useState<string>('all');
    const [exportTitle, setExportTitle] = useState('');
    const [reminderMinutes, setReminderMinutes] = useState(15);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [expandedWeeks, setExpandedWeeks] = useState<number[]>([]); // Array of week indices

    // Share Modal State
    const [showShareModal, setShowShareModal] = useState(false);
    const [sharePeriod, setSharePeriod] = useState<'today' | 'week' | 'month' | 'custom'>('today');

    // Automated Source - Fixed to Online
    const [lastUpdated, setLastUpdated] = useState<string | null>(() => {
        const saved = localStorage.getItem('baraka_prayer_schedule_updated');
        return saved;
    });

    const { toast } = useToast();

    useEffect(() => {
        loadPrayerData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentDate]);

    // Group data into weeks and set default expanded
    const weeks = React.useMemo(() => {
        const w: DailyPrayer[][] = [];
        for (let i = 0; i < prayerData.length; i += 7) {
            w.push(prayerData.slice(i, i + 7));
        }
        return w;
    }, [prayerData]);

    useEffect(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const currentWeekIdx = weeks.findIndex(week => week.some(d => d.date === todayStr));
        if (currentWeekIdx !== -1) {
            setExpandedWeeks([currentWeekIdx]);
        } else {
            // If today is not in this month view, maybe expand the first one?
            if (weeks.length > 0) setExpandedWeeks([0]);
        }
    }, [weeks]);

    // Update time to next prayer every 30 seconds for more accuracy
    useEffect(() => {
        const timer = setInterval(calculateNextPrayer, 30000);
        calculateNextPrayer();
        return () => clearInterval(timer);
    }, [prayerData]);

    // Auto-select Sha'ban or Ramadan if present in current data
    useEffect(() => {
        if (prayerData.length > 0) {
            const specialDays = prayerData.filter(d => d.hijriMonthNumber === 9 || d.hijriMonthNumber === 8);
            if (specialDays.length > 0) {
                setExportFromDate(specialDays[0].date);
                setExportToDate(specialDays[specialDays.length - 1].date);
                const monthName = specialDays.some(d => d.hijriMonthNumber === 9) ? "شهر رمضان المبارك" : "شهر شعبان";
                setExportTitle(`مواقيت الصلاة - ${monthName}`);
            }
        }
    }, [prayerData]);

    const scheduleNotifications = async (formattedData: DailyPrayer[]) => {
        try {
            // Check permission
            const perm = await LocalNotifications.checkPermissions();
            if (perm.display !== 'granted') {
                const req = await LocalNotifications.requestPermissions();
                if (req.display !== 'granted') return;
            }

            // Cancel existing
            const pending = await LocalNotifications.getPending();
            if (pending.notifications.length > 0) {
                await LocalNotifications.cancel(pending);
            }

            const notifications: any[] = [];
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];

            // Limit to today and tomorrow to avoid system limits
            const relevantDays = formattedData.filter(d =>
                d.date === todayStr ||
                new Date(d.date) > now
            ).slice(0, 2);

            let idCounter = 1;

            relevantDays.forEach(day => {
                const prayers = [
                    { name: 'الفجر', key: 'fajr' },
                    { name: 'الظهر', key: 'dhuhr' },
                    { name: 'العصر', key: 'asr' },
                    { name: 'المغرب', key: 'maghrib' },
                    { name: 'العشاء', key: 'isha' }
                ];

                prayers.forEach(p => {
                    const timeStr = day[p.key];
                    const [h, m] = timeStr.split(':').map(Number);
                    const pDate = new Date(day.date);
                    pDate.setHours(h, m, 0);

                    // Alert 15 mins before (Notification before Adhan)
                    const notifyTime = new Date(pDate.getTime() - 15 * 60000);

                    if (notifyTime > now) {
                        notifications.push({
                            id: idCounter++,
                            title: `اقترب موعد صلاة ${p.name}`,
                            body: `بقي 15 دقيقة على موعد أذان ${p.name}`,
                            schedule: { at: notifyTime },
                            sound: 'adhan_notification.wav',
                            smallIcon: 'ic_stat_moon'
                        });
                    }

                    // Adhan Time
                    if (pDate > now) {
                        notifications.push({
                            id: idCounter++,
                            title: `حين الآن موعد صلاة ${p.name}`,
                            body: `حان الآن موعد أذان ${p.name}`,
                            schedule: { at: pDate },
                            sound: 'adhan.wav',
                            smallIcon: 'ic_stat_moon'
                        });
                    }
                });
            });

            if (notifications.length > 0) {
                await LocalNotifications.schedule({ notifications });
            }

        } catch (e) {
            console.error("Notification Scheduling Error:", e);
        }
    };

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
                `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${lat}&longitude=${lng}&method=3&adjustment=1`
            );
            const data = await response.json();

            if (data.code === 200 && data.data) {
                const formattedData: DailyPrayer[] = data.data.map((day: any) => ({
                    date: day.date.gregorian.date.split('-').reverse().join('-'), // DD-MM-YYYY -> YYYY-MM-DD
                    fajr: day.timings.Fajr.split(' ')[0],
                    sunrise: day.timings.Sunrise.split(' ')[0],
                    dhuhr: day.timings.Dhuhr.split(' ')[0],
                    asr: day.timings.Asr.split(' ')[0],
                    maghrib: day.timings.Maghrib.split(' ')[0],
                    isha: day.timings.Isha.split(' ')[0],
                    hijriDate: day.date.hijri.date,
                    hijriMonthName: day.date.hijri.month.ar,
                    hijriMonthNumber: day.date.hijri.month.number
                }));

                setPrayerData(formattedData);
                scheduleNotifications(formattedData);

                // Save to localStorage for TaskSection printing usage
                // Use full date (YYYY-MM-DD) as key to avoid month confusion
                const scheduleMap: Record<string, any> = {};
                formattedData.forEach(day => {
                    scheduleMap[day.date] = day;
                });
                localStorage.setItem('baraka_prayer_schedule', JSON.stringify(scheduleMap));
                const nowStr = new Date().toISOString();
                localStorage.setItem('baraka_prayer_schedule_updated', nowStr);
                setLastUpdated(nowStr);

                if (userId) {
                    await supabase.from('prayer_settings').upsert({
                        user_id: userId,
                        source: 'aladhan_auto',
                        schedule: formattedData,
                        updated_at: nowStr
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

                // Arabic words for hours
                const hoursArabic: Record<number, string> = {
                    0: '', 1: 'ساعة', 2: 'ساعتين', 3: 'ثلاث ساعات', 4: 'أربع ساعات',
                    5: 'خمس ساعات', 6: 'ست ساعات', 7: 'سبع ساعات', 8: 'ثماني ساعات',
                    9: 'تسع ساعات', 10: 'عشر ساعات', 11: 'إحدى عشرة ساعة', 12: 'اثنتا عشرة ساعة'
                };

                const hoursText = diffHours > 0 ? (hoursArabic[diffHours] || `${diffHours} ساعة`) : '';
                const minutesText = `${diffMinutes} دقيقة`;

                if (diffHours > 0) {
                    setTimeToNext(`${hoursText} و ${minutesText}`);
                } else {
                    setTimeToNext(minutesText);
                }
                return;
            }
        }

        // If all prayers passed, next is Fajr tomorrow
        setNextPrayer('الفجر (غداً)');
        setTimeToNext('--:--');
    };

    const downloadICS = async () => {
        let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Barakah App//Prayer Times//AR\n";

        const dataToExport = getExportData();
        const prayersToExport = Object.entries(exportPrayers)
            .filter(([_, enabled]) => enabled)
            .map(([key]) => key);

        dataToExport.forEach(day => {
            prayersToExport.forEach(p => {
                const dateStr = day.date.replace(/-/g, '');
                const timeStr = day[p].replace(':', '') + '00';
                const prayerNames: Record<string, string> = {
                    fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء'
                };
                const summary = day.hijriDate
                    ? `صلاة ${prayerNames[p]} (${day.hijriDate})`
                    : `صلاة ${prayerNames[p]}`;
                const uid = `${dateStr}-${p}@barakah-app`;

                icsContent += `BEGIN:VEVENT\n`;
                icsContent += `UID:${uid}\n`;
                icsContent += `SUMMARY:${summary}\n`;
                icsContent += `DTSTART:${dateStr}T${timeStr}\n`;
                icsContent += `DTEND:${dateStr}T${timeStr}\n`;
                icsContent += `DESCRIPTION:موعد صلاة ${prayerNames[p]}\n`;

                if (reminderMinutes > 0) {
                    icsContent += `BEGIN:VALARM\n`;
                    icsContent += `TRIGGER:-PT${reminderMinutes}M\n`;
                    icsContent += `ACTION:DISPLAY\n`;
                    icsContent += `DESCRIPTION:صلاة ${prayerNames[p]} بعد ${reminderMinutes} دقيقة\n`;
                    icsContent += `END:VALARM\n`;
                }

                icsContent += `END:VEVENT\n`;
            });
        });

        icsContent += "END:VCALENDAR";

        // Use Capacitor Share for mobile
        try {
            const fileName = 'prayer_times.ics';
            await Filesystem.writeFile({
                path: fileName,
                data: icsContent,
                directory: Directory.Cache,
                encoding: Encoding.UTF8,
            });

            const uriResult = await Filesystem.getUri({
                directory: Directory.Cache,
                path: fileName,
            });

            await Share.share({
                title: 'مواقيت الصلاة',
                url: uriResult.uri,
                dialogTitle: 'تصدير أوقات الصلاة'
            });
            toast({ title: 'تم التصدير بنجاح!', description: 'اختر التقويم للحفظ' });
        } catch (e) {
            console.error('ICS Share Error:', e);
            // First Fallback: Share as text
            try {
                await Share.share({
                    title: 'مواقيت الصلاة',
                    text: icsContent,
                    dialogTitle: 'تصدير أوقات الصلاة'
                });
            } catch (err2) {
                // Second Fallback: Web Download
                const blob = new Blob([icsContent], { type: 'text/calendar' });
                const fileName = `prayer-times-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}.ics`;
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                toast({ title: 'تم التصدير!', description: 'تم تحميل ملف التقويم' });
            }
        }
        setShowExportModal(false);
    };

    const downloadPDF = async () => {
        const dataToExport = getExportData();
        const prayersToExport = Object.entries(exportPrayers)
            .filter(([_, enabled]) => enabled)
            .map(([key]) => key);

        if (dataToExport.length === 0) {
            toast({ title: "خطأ", description: "لا توجد بيانات للتصدير في هذه الفترة", variant: "destructive" });
            return;
        }

        const isSpanish = exportLang === 'es';
        const doc = new jsPDF();

        // Translations
        const trans: Record<string, any> = {
            ar: {
                title: exportTitle || 'مواقيت الصلاة',
                system: 'نظام بركة لإدارة الحياة',
                date: 'التاريخ',
                hijri: 'الهجري',
                fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء',
                footer: 'تم التوليد بواسطة تطبيق بركة'
            },
            es: {
                title: isSpanish ? 'Horarios de Oración' : (exportTitle || 'Horarios de Oración'),
                system: 'Sistema Barakah de Gestión de Vida',
                date: 'Fecha',
                hijri: 'Hijri',
                fajr: 'Fajr', sunrise: 'Salida del Sol', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
                footer: 'Generado por la aplicación Barakah'
            }
        };

        const t = trans[exportLang];

        // Header
        doc.setFontSize(20);
        // Note: Arabic support in jsPDF requires custom font. 
        // For now we use the selected language. 
        // If Arabic, we try to use any loaded font or just fallback to basic text.
        doc.text(t.title, 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`${t.system} | ${exportFromDate} - ${exportToDate}`, 105, 30, { align: 'center' });

        // Table Header
        const head = [
            [t.date, t.hijri, ...prayersToExport.map(p => t[p])]
        ];

        // Table Body
        const body = dataToExport.map(day => [
            day.date,
            day.hijriDate || '',
            ...prayersToExport.map(p => day[p])
        ]);

        autoTable(doc, {
            head: head,
            body: body,
            startY: 40,
            theme: 'grid',
            styles: { fontSize: 9, halign: 'center', font: 'helvetica' },
            headStyles: { fillColor: [16, 185, 129] }, // Emerald-600
        });

        // Footer
        doc.setFontSize(8);
        doc.text(t.footer, 105, doc.internal.pageSize.height - 10, { align: 'center' });

        const fileName = `Barakah_Prayer_Times_${exportFromDate}.pdf`;

        // Mobile handling
        if (isAndroid()) {
            try {
                const pdfBase64 = doc.output('datauristring').split(',')[1];
                await Filesystem.writeFile({
                    path: fileName,
                    data: pdfBase64,
                    directory: Directory.Documents,
                    encoding: Encoding.UTF8
                });
                toast({ title: "تم الحفظ!", description: `تم حفظ الملف في المستندات باسم ${fileName}` });
            } catch (e) {
                doc.save(fileName);
            }
        } else {
            doc.save(fileName);
            toast({ title: "تم التحميل!", description: "تم تحميل ملف PDF بنجاح" });
        }

        setShowExportModal(false);
    };

    const isAndroid = () => {
        return /Android/i.test(navigator.userAgent);
    };

    const getExportData = () => {
        let data = prayerData;

        if (exportHijriMonth !== 'all') {
            data = data.filter(d => d.hijriMonthName === exportHijriMonth);
        } else {
            data = data.filter(d => d.date >= exportFromDate && d.date <= exportToDate);
        }

        return data;
    };

    const hijriMonths = React.useMemo(() => {
        const months = new Set<string>();
        prayerData.forEach(d => {
            if (d.hijriMonthName) months.add(d.hijriMonthName);
        });
        return Array.from(months);
    }, [prayerData]);

    const openShareDialog = () => {
        setShowShareModal(true);
    };

    const executeShare = async () => {
        const today = new Date();
        let fromDate: string, toDate: string;

        if (sharePeriod === 'today') {
            fromDate = toDate = today.toISOString().split('T')[0];
        } else if (sharePeriod === 'week') {
            fromDate = today.toISOString().split('T')[0];
            const weekLater = new Date(today);
            weekLater.setDate(weekLater.getDate() + 7);
            toDate = weekLater.toISOString().split('T')[0];
        } else if (sharePeriod === 'month') {
            fromDate = today.toISOString().split('T')[0];
            const monthLater = new Date(today);
            monthLater.setMonth(monthLater.getMonth() + 1);
            toDate = monthLater.toISOString().split('T')[0];
        } else {
            fromDate = exportFromDate;
            toDate = exportToDate;
        }

        const dataToShare = prayerData.filter(d => d.date >= fromDate && d.date <= toDate);

        let text = `📿 مواقيت الصلاة - نظام بركة\n`;
        text += `من ${fromDate} إلى ${toDate}\n\n`;

        dataToShare.forEach(day => {
            text += `📅 ${day.date}\n`;
            text += `   الفجر: ${day.fajr}\n`;
            text += `   الظهر: ${day.dhuhr}\n`;
            text += `   العصر: ${day.asr}\n`;
            text += `   المغرب: ${day.maghrib}\n`;
            text += `   العشاء: ${day.isha}\n\n`;
        });

        text += `✨ نظام بركة لإدارة الحياة`;

        try {
            await Share.share({
                title: 'مواقيت الصلاة - بركة',
                text: text,
                dialogTitle: 'مشاركة أوقات الصلاة'
            });
            toast({ title: 'تم!', description: 'اختر التطبيق للمشاركة' });
        } catch (err) {
            // Fallback
            try {
                await navigator.clipboard.writeText(text);
                toast({ title: 'تم النسخ', description: 'تم نسخ جدول الصلاة للحافظة' });
            } catch (e) {
                toast({ title: 'خطأ', variant: 'destructive' });
            }
        }
        setShowShareModal(false);
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
        <div className="space-y-6 container mx-auto px-4 py-4 md:py-8">

            {/* Next Prayer Card */}
            <Card className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white border-none shadow-lg overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
                <CardContent className="p-6 relative z-10">
                    <div className="flex items-start justify-between">
                        {/* Right side: Next prayer label + countdown */}
                        <div className="text-right">
                            <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm mb-2 inline-flex">
                                <Clock className="w-4 h-4 text-white" />
                                <span className="arabic-body text-sm font-medium">الصلاة القادمة</span>
                            </div>
                            <div className="text-3xl font-bold arabic-title tracking-wider">{timeToNext}</div>
                        </div>

                        {/* Left side: Prayer name + date */}
                        <div className="text-left">
                            <div className="text-4xl font-bold arabic-title mb-1">
                                {nextPrayer || '...'}
                            </div>
                            <p className="text-emerald-100 arabic-body text-sm">
                                {new Date().toLocaleDateString('ar-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                            <p className="text-emerald-200/80 arabic-body text-xs mt-0.5">
                                {new Date().toLocaleDateString('ar-SA-u-ca-islamic-nu-latn', { day: 'numeric', month: 'long' })}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Monthly Calendar View */}
            <Card className="border-gray-100 shadow-sm">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <CardTitle className="arabic-title text-xl text-gray-800">جدول الشهر</CardTitle>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            {/* Share Dialog */}
                            <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 md:flex-none border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                                    >
                                        <Share2 className="w-4 h-4 ml-2" />
                                        مشاركة
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-sm">
                                    <DialogHeader>
                                        <DialogTitle className="arabic-title text-center text-lg border-b pb-3">
                                            اختر الفترة للمشاركة
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-3 py-4">
                                        {[
                                            { id: 'today', label: 'اليوم فقط' },
                                            { id: 'week', label: 'الأسبوع القادم' },
                                            { id: 'month', label: 'الشهر كاملاً' },
                                            { id: 'custom', label: 'فترة مخصصة' }
                                        ].map(opt => (
                                            <div
                                                key={opt.id}
                                                onClick={() => setSharePeriod(opt.id as any)}
                                                className={`p-3 rounded-lg border cursor-pointer transition-all ${sharePeriod === opt.id ? 'bg-emerald-50 border-emerald-300' : 'hover:bg-gray-50'}`}
                                            >
                                                <span className="font-medium">{opt.label}</span>
                                            </div>
                                        ))}
                                        {sharePeriod === 'custom' && (
                                            <div className="grid grid-cols-2 gap-3 pt-2">
                                                <div>
                                                    <Label className="text-xs text-gray-500 mb-1 block">من تاريخ</Label>
                                                    <Input type="date" value={exportFromDate} onChange={(e) => setExportFromDate(e.target.value)} />
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-gray-500 mb-1 block">إلى تاريخ</Label>
                                                    <Input type="date" value={exportToDate} onChange={(e) => setExportToDate(e.target.value)} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={executeShare} className="w-full bg-emerald-600 hover:bg-emerald-700">
                                            <Share2 className="w-4 h-4 ml-2" />
                                            مشاركة الآن
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            {/* Export Modal */}
                            <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 md:flex-none border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                                    >
                                        <FileDown className="w-4 h-4 ml-2" />
                                        تصدير
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="arabic-title text-center text-lg border-b pb-3">
                                            خيارات تصدير التقويم
                                        </DialogTitle>
                                    </DialogHeader>

                                    <div className="space-y-5 py-4">
                                        {/* Date Range or Hijri Month */}
                                        <div className="space-y-4">
                                            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg mb-2">
                                                <button
                                                    onClick={() => setExportHijriMonth('all')}
                                                    className={`flex-1 py-1 px-3 rounded-md text-sm transition-all ${exportHijriMonth === 'all' ? 'bg-white shadow-sm text-emerald-700 font-bold' : 'text-gray-500'}`}
                                                >
                                                    تاريخ ميلادي
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (hijriMonths.length > 0) setExportHijriMonth(hijriMonths[0]);
                                                    }}
                                                    className={`flex-1 py-1 px-3 rounded-md text-sm transition-all ${exportHijriMonth !== 'all' ? 'bg-white shadow-sm text-emerald-700 font-bold' : 'text-gray-500'}`}
                                                >
                                                    شهر هجري
                                                </button>
                                            </div>

                                            {exportHijriMonth === 'all' ? (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label className="text-xs text-gray-500 mb-1 block">من تاريخ</Label>
                                                        <Input
                                                            type="date"
                                                            value={exportFromDate}
                                                            onChange={(e) => setExportFromDate(e.target.value)}
                                                            className="text-center border-2 border-primary/30 focus:border-primary"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs text-gray-500 mb-1 block">إلى تاريخ</Label>
                                                        <Input
                                                            type="date"
                                                            value={exportToDate}
                                                            onChange={(e) => setExportToDate(e.target.value)}
                                                            className="text-center border-2 border-primary/30 focus:border-primary"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <Label className="text-xs text-gray-500 mb-1 block">اختر الشهر الهجري</Label>
                                                    <select
                                                        value={exportHijriMonth}
                                                        onChange={(e) => setExportHijriMonth(e.target.value)}
                                                        className="w-full p-2 border-2 border-primary/30 rounded-lg text-right arabic-body"
                                                    >
                                                        {hijriMonths.map(m => (
                                                            <option key={m} value={m}>{m}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>


                                        {/* Language and Title */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-sm font-bold mb-2 block">لغة التقرير / Idioma</Label>
                                                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                                                    <button
                                                        onClick={() => setExportLang('ar')}
                                                        className={`flex-1 py-1 px-3 rounded-md text-sm transition-all ${exportLang === 'ar' ? 'bg-white shadow-sm text-emerald-700 font-bold' : 'text-gray-500'}`}
                                                    >
                                                        العربية
                                                    </button>
                                                    <button
                                                        onClick={() => setExportLang('es')}
                                                        className={`flex-1 py-1 px-3 rounded-md text-sm transition-all ${exportLang === 'es' ? 'bg-white shadow-sm text-emerald-700 font-bold' : 'text-gray-500'}`}
                                                    >
                                                        Español
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-bold mb-2 block">عنوان تحفيزي (اختياري)</Label>
                                                <Input
                                                    placeholder="مثال: اجعل صلاتك نبض حياتك..."
                                                    value={exportTitle}
                                                    onChange={(e) => setExportTitle(e.target.value)}
                                                    maxLength={100}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-bold mb-3 block text-center">الصلوات المشمولة</Label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {[
                                                    { id: 'fajr', label: 'الفجر' },
                                                    { id: 'sunrise', label: 'الشروق' },
                                                    { id: 'dhuhr', label: 'الظهر' },
                                                    { id: 'asr', label: 'العصر' },
                                                    { id: 'maghrib', label: 'المغرب' },
                                                    { id: 'isha', label: 'العشاء' }
                                                ].map(p => (
                                                    <div
                                                        key={p.id}
                                                        className={`flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition-all ${exportPrayers[p.id]
                                                            ? 'border-emerald-500 bg-emerald-50'
                                                            : 'border-gray-100 bg-white'
                                                            }`}
                                                        onClick={() => setExportPrayers(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                                                    >
                                                        <Checkbox
                                                            id={`prayer-${p.id}`}
                                                            checked={exportPrayers[p.id]}
                                                            onCheckedChange={(checked) =>
                                                                setExportPrayers(prev => ({ ...prev, [p.id]: !!checked }))
                                                            }
                                                            className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                                        />
                                                        <Label htmlFor={`prayer-${p.id}`} className="text-xs font-medium cursor-pointer">{p.label}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Reminder Section */}
                                        <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Bell className="w-4 h-4 text-primary" />
                                                <Label className="text-sm font-bold text-primary">التنبيه قبل الصلاة</Label>
                                            </div>
                                            <div className="flex items-center justify-center gap-3">
                                                <span className="text-sm text-gray-600">تذكير قبل</span>
                                                <Input
                                                    type="number"
                                                    value={reminderMinutes}
                                                    onChange={(e) => setReminderMinutes(parseInt(e.target.value) || 0)}
                                                    className="w-20 text-center text-lg font-bold border-2"
                                                    min={0}
                                                    max={60}
                                                />
                                                <span className="text-sm text-gray-600">دقيقة</span>
                                            </div>
                                            <p className="text-xs text-center text-gray-500 mt-2">
                                                سيتم إضافة منبه لكل صلاة في ملف التقويم
                                            </p>
                                        </div>
                                    </div>

                                    <DialogFooter className="flex-col gap-2">
                                        <Button
                                            onClick={downloadICS}
                                            className="w-full gap-2 h-12 text-base bg-primary hover:bg-primary/90"
                                        >
                                            <Download className="w-5 h-5" />
                                            تحميل ملف .ics
                                        </Button>
                                        <Button
                                            onClick={downloadPDF}
                                            variant="outline"
                                            className="w-full gap-2 h-12 text-base border-2"
                                        >
                                            <FileText className="w-5 h-5" />
                                            تحميل ملف PDF
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
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
                            {currentDate.toLocaleString('ar-u-nu-latn', { month: 'long', year: 'numeric' })}
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
                    {/* Expand/Collapse Controls */}
                    <div className="flex justify-end p-2 gap-2 bg-gray-50/50 border-b border-gray-100">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => setExpandedWeeks(weeks.map((_, i) => i))}
                        >
                            توسيع الكل
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => setExpandedWeeks([])}
                        >
                            طي الكل
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right border-collapse">
                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="p-4 font-semibold whitespace-nowrap w-32">التاريخ</th>
                                    <th className="p-4 font-semibold text-emerald-700 whitespace-nowrap">الفجر</th>
                                    <th className="p-4 font-semibold text-amber-500 whitespace-nowrap">الشروق</th>
                                    <th className="p-4 font-semibold text-gray-600 whitespace-nowrap">الظهر</th>
                                    <th className="p-4 font-semibold text-gray-600 whitespace-nowrap">العصر</th>
                                    <th className="p-4 font-semibold text-amber-600 whitespace-nowrap">المغرب</th>
                                    <th className="p-4 font-semibold text-indigo-700 whitespace-nowrap">العشاء</th>
                                </tr>
                            </thead>
                            {weeks.map((week, weekIdx) => {
                                const isExpanded = expandedWeeks.includes(weekIdx);
                                const startDate = new Date(week[0].date).toLocaleDateString('ar-SA-u-ca-islamic-nu-latn', { day: 'numeric', month: 'short' });
                                const endDate = new Date(week[week.length - 1].date).toLocaleDateString('ar-SA-u-ca-islamic-nu-latn', { day: 'numeric', month: 'short' });

                                return (
                                    <React.Fragment key={weekIdx}>
                                        {/* Week Header */}
                                        <tbody>
                                            <tr
                                                className="bg-gray-50/80 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                                                onClick={() => {
                                                    setExpandedWeeks(prev =>
                                                        prev.includes(weekIdx)
                                                            ? prev.filter(w => w !== weekIdx)
                                                            : [...prev, weekIdx]
                                                    );
                                                }}
                                            >
                                                <td colSpan={7} className="p-2 px-4">
                                                    <div className="flex items-center gap-2 font-bold text-gray-700">
                                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        <span>الأسبوع {weekIdx + 1}</span>
                                                        <span className="text-xs font-normal text-gray-500 mr-2">({startDate} - {endDate})</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>

                                        {/* Week Days */}
                                        {isExpanded && (
                                            <tbody className="divide-y divide-gray-100 border-b border-gray-200">
                                                {week.map((day, index) => {
                                                    const isToday = day.date === new Date().toISOString().split('T')[0];
                                                    return (
                                                        <tr key={index} className={`hover:bg-gray-50 transition-colors ${isToday ? 'bg-emerald-50/60' : ''}`}>
                                                            <td className="p-4 font-medium whitespace-nowrap text-right">
                                                                <div className="font-english dir-ltr">{day.date}</div>
                                                                <div className="text-[10px] text-gray-400 mt-0.5">
                                                                    {new Date(day.date).toLocaleDateString('ar-SA-u-ca-islamic-nu-latn', { day: 'numeric', month: 'short' })}
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-emerald-600 font-bold">{formatNumberToLocale(day.fajr)}</td>
                                                            <td className="p-4 text-amber-500 font-medium">{formatNumberToLocale(day.sunrise || '--:--')}</td>
                                                            <td className="p-4 text-gray-600">{formatNumberToLocale(day.dhuhr)}</td>
                                                            <td className="p-4 text-gray-600">{formatNumberToLocale(day.asr)}</td>
                                                            <td className="p-4 text-amber-600 font-bold">{formatNumberToLocale(day.maghrib)}</td>
                                                            <td className="p-4 text-indigo-700">{formatNumberToLocale(day.isha)}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
};

export default PrayerManager;
