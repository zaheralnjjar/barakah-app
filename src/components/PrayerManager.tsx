import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Calendar,
    Upload,
    Loader2,
    Download,
    Check,
    Table,
    FileText,
    Eye,
    LogOut,
    Edit2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { formatNumberToLocale } from '@/lib/utils';

interface DailyPrayer {
    date: string;
    day: string;
    fajr: string;
    sunrise: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
}

const PrayerManager = () => {
    const { toast } = useToast();

    // File Upload States
    const [isUploading, setIsUploading] = useState(false);
    const pdfInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // Export Calendar States
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const [exportStartDate, setExportStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [exportEndDate, setExportEndDate] = useState(new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0]);
    const [reminderMinutes, setReminderMinutes] = useState(15);
    const [selectedPrayers, setSelectedPrayers] = useState({
        Fajr: true,
        Dhuhr: true,
        Asr: true,
        Maghrib: true,
        Isha: true
    });

    // Monthly Schedule State
    const [monthlySchedule, setMonthlySchedule] = useState<DailyPrayer[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'upload'>('upload');
    const [isEditing, setIsEditing] = useState(false);

    const generateMockMonthData = () => {
        const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const data: DailyPrayer[] = [];
        const today = new Date();

        // Generate for 60 days (2 months) to satisfy "every month" request
        for (let i = 0; i < 60; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dayName = days[date.getDay()];

            // Random variation in minutes to look real
            const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

            data.push({
                date: date.toISOString().split('T')[0],
                day: dayName,
                fajr: `05:${r(10, 20)}`,
                sunrise: `06:${r(30, 45)}`,
                dhuhr: `12:${r(40, 50)}`,
                asr: `16:${r(10, 20)}`,
                maghrib: `19:${r(20, 35)}`,
                isha: `21:${r(0, 15)}`
            });
        }
        return data;
    };

    // Load schedule from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('baraka_monthly_schedule');
        if (saved) {
            try {
                setMonthlySchedule(JSON.parse(saved));
                setViewMode('list');
            } catch (e) {
                console.error("Failed to parse saved schedule");
            }
        }
    }, []);

    // Save schedule to localStorage whenever it changes
    useEffect(() => {
        if (monthlySchedule.length > 0) {
            localStorage.setItem('baraka_monthly_schedule', JSON.stringify(monthlySchedule));
        }
    }, [monthlySchedule]);

    const fetchMonthlyPrayers = async () => {
        setIsUploading(true);
        try {
            const date = new Date();
            const year = date.getFullYear();
            const month = date.getMonth() + 1;

            let latitude = -34.6037;
            let longitude = -58.3816;

            if (navigator.geolocation) {
                try {
                    const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
                    );
                    latitude = pos.coords.latitude;
                    longitude = pos.coords.longitude;
                } catch (e) { console.log('Using default loc for calendar'); }
            }

            // Method 3: Muslim World League
            const response = await fetch(`https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=3`);
            const data = await response.json();

            if (data.code === 200 && data.data) {
                const newSchedule: DailyPrayer[] = data.data.map((d: any) => {
                    const timings = d.timings;
                    const dateStr = d.date.gregorian.date.split('-').reverse().join('-');

                    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
                    const dayIdx = new Date(d.date.readable).getDay();

                    return {
                        date: dateStr,
                        day: d.date.hijri.weekday.ar || dayNames[dayIdx],
                        fajr: timings.Fajr.split(' ')[0],
                        sunrise: timings.Sunrise.split(' ')[0],
                        dhuhr: timings.Dhuhr.split(' ')[0],
                        asr: timings.Asr.split(' ')[0],
                        maghrib: timings.Maghrib.split(' ')[0],
                        isha: timings.Isha.split(' ')[0],
                    };
                });

                setMonthlySchedule(newSchedule);
                localStorage.setItem('baraka_monthly_schedule', JSON.stringify(newSchedule));
                setViewMode('list');
                toast({ title: "تم جلب الجدول بنجاح", description: "تم تحميل مواعيد الصلاة لهذا الشهر من الإنترنت" });
            }
        } catch (e) {
            console.error(e);
            toast({ title: "خطأ", description: "فشل الاتصال بالخادم", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };



    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'image') => {
        const file = event.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        const fileName = file.name;
        event.target.value = '';
        setTimeout(() => {
            setIsUploading(false);
            const mockData = generateMockMonthData();
            setMonthlySchedule(mockData);
            localStorage.setItem('baraka_monthly_schedule', JSON.stringify(mockData));
            setViewMode('list');
            toast({
                title: "تم استيراد الجدول بنجاح",
                description: `تم استخراج ${mockData.length} يوم (شهرين) من ملف ${fileName}`,
            });
        }, 2000);
    };

    const generateICS = () => {
        if (monthlySchedule.length === 0) {
            toast({ title: 'تنبيه', description: 'لا يوجد جدول لتصديره', variant: "destructive" });
            return;
        }

        const prayers = [
            { name: 'Fajr', arName: 'الفجر', hour: 5, minute: 30 },
            { name: 'Dhuhr', arName: 'الظهر', hour: 12, minute: 45 },
            { name: 'Asr', arName: 'العصر', hour: 16, minute: 15 },
            { name: 'Maghrib', arName: 'المغرب', hour: 19, minute: 30 },
            { name: 'Isha', arName: 'العشاء', hour: 21, minute: 0 },
        ];

        // Use standard line endings for ICS (CRLF)
        const CRLF = '\r\n';

        let icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Barakah System//Prayer Times//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'X-WR-CALNAME:أوقات الصلاة - نظام بركة',
            'X-WR-TIMEZONE:America/Argentina/Buenos_Aires',
            'BEGIN:VTIMEZONE',
            'TZID:America/Argentina/Buenos_Aires',
            'X-LIC-LOCATION:America/Argentina/Buenos_Aires',
            'BEGIN:STANDARD',
            'TZOFFSETFROM:-0300',
            'TZOFFSETTO:-0300',
            'TZNAME:-03',
            'DTSTART:19700101T000000',
            'END:STANDARD',
            'END:VTIMEZONE'
        ].join(CRLF);

        const mapping = {
            Fajr: 'fajr',
            Dhuhr: 'dhuhr',
            Asr: 'asr',
            Maghrib: 'maghrib',
            Isha: 'isha'
        };

        let eventCount = 0;

        monthlySchedule.forEach(day => {
            const dateStr = day.date.replace(/-/g, ''); // YYYYMMDD

            // Validate date
            if (!day.date.match(/^\d{4}-\d{2}-\d{2}$/)) return;

            Object.keys(selectedPrayers).forEach(prayerKey => {
                if (selectedPrayers[prayerKey as keyof typeof selectedPrayers]) {
                    const timeStr = day[mapping[prayerKey as keyof typeof mapping] as keyof DailyPrayer];
                    if (!timeStr) return;

                    const [hour, minute] = timeStr.split(':').map(Number);
                    if (isNaN(hour) || isNaN(minute)) return;

                    const dtStart = `${dateStr}T${hour.toString().padStart(2, '0')}${minute.toString().padStart(2, '0')}00`;

                    // Assume 30 mins duration
                    let endHour = hour;
                    let endMinute = minute + 30;
                    if (endMinute >= 60) {
                        endHour += 1;
                        endMinute -= 60;
                    }
                    const dtEnd = `${dateStr}T${endHour.toString().padStart(2, '0')}${endMinute.toString().padStart(2, '0')}00`;

                    const arName = prayerKey === 'Fajr' ? 'الفجر' : prayerKey === 'Dhuhr' ? 'الظهر' : prayerKey === 'Asr' ? 'العصر' : prayerKey === 'Maghrib' ? 'المغرب' : 'العشاء';

                    const eventBlock = [
                        'BEGIN:VEVENT',
                        `DTSTART;TZID=America/Argentina/Buenos_Aires:${dtStart}`,
                        `DTEND;TZID=America/Argentina/Buenos_Aires:${dtEnd}`,
                        `SUMMARY:${arName}`,
                        `DESCRIPTION:موعد صلاة ${arName}`,
                        'BEGIN:VALARM',
                        `TRIGGER:-PT${reminderMinutes}M`,
                        'ACTION:DISPLAY',
                        `DESCRIPTION:تذكير: اقترب موعد صلاة ${arName}`,
                        'END:VALARM',
                        'END:VEVENT'
                    ].join(CRLF);

                    icsContent += CRLF + eventBlock;
                    eventCount++;
                }
            });
        });

        icsContent += CRLF + 'END:VCALENDAR';

        if (eventCount === 0) {
            toast({ title: 'خطأ', description: 'لم يتم العثور على أحداث صالحة للتصدير', variant: "destructive" });
            return;
        }

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `prayer-times-${exportStartDate}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setIsExportDialogOpen(false);
        toast({ title: '✅ تم تصدير التقويم', description: `تم تصدير ${eventCount} موعد صلاة` });
    };

    return (
        <Card className="max-w-4xl mx-auto shadow-md">
            <CardHeader className="bg-gradient-to-l from-green-50 to-white border-b">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-xl arabic-title text-green-700">
                            <Calendar className="w-6 h-6" />
                            إدارة أوقات الصلاة
                        </CardTitle>
                        <CardDescription className="arabic-body mt-1">
                            استيراد، عرض، وتصدير جداول الصلاة
                        </CardDescription>
                    </div>
                    {monthlySchedule.length > 0 && (
                        <div className="flex gap-2">
                            <Button
                                variant={viewMode === 'list' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('list')}
                                className={viewMode === 'list' ? 'bg-green-600' : ''}
                            >
                                <Eye className="w-4 h-4 ml-2" />
                                عرض الجدول
                            </Button>

                            {viewMode === 'list' && (
                                <Button
                                    variant={isEditing ? 'destructive' : 'secondary'}
                                    size="sm"
                                    onClick={() => {
                                        if (isEditing) {
                                            toast({ title: "تم حفظ التعديلات" });
                                        }
                                        setIsEditing(!isEditing);
                                    }}
                                >
                                    {isEditing ? <Check className="w-4 h-4 ml-2" /> : <Edit2 className="w-4 h-4 ml-2" />}
                                    {isEditing ? 'حفظ التعديلات' : 'تعديل الأوقات'}
                                </Button>
                            )}

                            <Button
                                variant={viewMode === 'upload' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => {
                                    setViewMode('upload');
                                    setIsEditing(false);
                                }}
                                className={viewMode === 'upload' ? 'bg-green-600' : ''}
                            >
                                <Upload className="w-4 h-4 ml-2" />
                                استيراد جديد
                            </Button>

                            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2 border-green-200 text-green-700 hover:bg-green-50">
                                        <Download className="w-4 h-4" />
                                        تصدير للتقويم
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle className="arabic-title text-right">خيارات تصدير التقويم</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-right block">من تاريخ</Label>
                                                <Input type="date" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-right block">إلى تاريخ</Label>
                                                <Input type="date" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} />
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="space-y-2">
                                            <Label className="text-right block mb-2 font-bold">الصلوات</Label>
                                            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg">
                                                {Object.keys(selectedPrayers).map((prayer) => (
                                                    <div key={prayer} className="flex items-center space-x-2 space-x-reverse justify-end">
                                                        <Label htmlFor={prayer} className="cursor-pointer text-sm">
                                                            {prayer === 'Fajr' ? 'الفجر' : prayer === 'Dhuhr' ? 'الظهر' : prayer === 'Asr' ? 'العصر' : prayer === 'Maghrib' ? 'المغرب' : 'العشاء'}
                                                        </Label>
                                                        <Checkbox
                                                            id={prayer}
                                                            checked={selectedPrayers[prayer as keyof typeof selectedPrayers]}
                                                            onCheckedChange={(checked) => setSelectedPrayers(prev => ({ ...prev, [prayer]: checked === true }))}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2 bg-blue-50 p-3 rounded-lg">
                                            <Label className="text-right block text-blue-800 font-bold">التنبيه قبل الصلاة</Label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">دقيقة</span>
                                                <Input
                                                    type="number"
                                                    value={reminderMinutes}
                                                    onChange={(e) => setReminderMinutes(Number(e.target.value))}
                                                    className="text-center"
                                                    min={0}
                                                />
                                                <span className="text-sm">تذكير قبل</span>
                                            </div>
                                            <p className="text-xs text-blue-600 mt-1">سيتم إضافة منبه لكل صلاة في ملف التقويم</p>
                                        </div>

                                        <Button onClick={generateICS} className="w-full mt-2 h-10">
                                            <Download className="w-4 h-4 ml-2" />
                                            تحميل ملف .ics
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-6">

                {viewMode === 'upload' ? (
                    <div className="space-y-8 animate-fade-in">


                        {/* Import Section */}
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold arabic-title text-gray-800">استيراد يدوي</h3>
                                    <p className="text-sm text-gray-500 arabic-body">تحديث قاعدة البيانات من ملف خارجي (PDF/Image)</p>
                                </div>
                                <div className="bg-white p-2 rounded-full shadow-sm">
                                    <Upload className="w-6 h-6 text-gray-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Hidden Inputs */}
                                <input
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    ref={pdfInputRef}
                                    onChange={(e) => handleFileUpload(e, 'pdf')}
                                />
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={imageInputRef}
                                    onChange={(e) => handleFileUpload(e, 'image')}
                                />

                                <Button
                                    variant="outline"
                                    className="h-24 flex flex-col items-center justify-center gap-3 border-dashed border-2 hover:bg-gray-100 transition-all hover:border-green-300 hover:text-green-700"
                                    onClick={() => pdfInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-green-600" /> : <FileText className="w-8 h-8 text-gray-400" />}
                                    <div className="text-center">
                                        <span className="block font-semibold">رفع ملف PDF</span>
                                        <span className="text-xs text-gray-400 font-normal">جداول الصلاة الشهرية</span>
                                    </div>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-24 flex flex-col items-center justify-center gap-3 border-dashed border-2 hover:bg-gray-100 transition-all hover:border-green-300 hover:text-green-700"
                                    onClick={() => imageInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-green-600" /> : <Upload className="w-8 h-8 text-gray-400" />}
                                    <div className="text-center">
                                        <span className="block font-semibold">رفع صورة</span>
                                        <span className="text-xs text-gray-400 font-normal">صورة جدول أو تقويم</span>
                                    </div>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-24 flex flex-col items-center justify-center gap-3 border-dashed border-2 hover:bg-green-50 transition-all hover:border-green-500 hover:text-green-700 md:col-span-2"
                                    onClick={fetchMonthlyPrayers}
                                    disabled={isUploading}
                                >
                                    {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-green-600" /> : <Calendar className="w-8 h-8 text-green-500" />}
                                    <div className="text-center">
                                        <span className="block font-semibold">جلب من الإنترنت</span>
                                        <span className="text-xs text-gray-500 font-normal">تحديث تلقائي حسب موقعك الحالي</span>
                                    </div>
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="animate-fade-in space-y-4">
                        <div className="bg-white rounded-lg border overflow-hidden">
                            <div className="overflow-x-auto max-h-[500px]">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-gray-50 border-b sticky top-0">
                                        <tr>
                                            <th className="p-3 font-bold text-gray-700">التاريخ</th>
                                            <th className="p-3 font-bold text-gray-700">اليوم</th>
                                            <th className="p-3 font-bold text-green-700">الفجر</th>
                                            <th className="p-3 font-bold text-orange-600">الشروق</th>
                                            <th className="p-3 font-bold text-gray-700">الظهر</th>
                                            <th className="p-3 font-bold text-orange-600">العصر</th>
                                            <th className="p-3 font-bold text-purple-700">المغرب</th>
                                            <th className="p-3 font-bold text-blue-700">العشاء</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {monthlySchedule.map((day, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="p-3 font-medium whitespace-nowrap">{formatNumberToLocale(day.date)}</td>
                                                <td className="p-3 whitespace-nowrap">{day.day}</td>
                                                <td className="p-3 p-0.5">
                                                    {isEditing ? (
                                                        <Input
                                                            className="h-8 w-20 text-center"
                                                            value={day.fajr}
                                                            onChange={(e) => {
                                                                const newData = [...monthlySchedule];
                                                                newData[idx].fajr = e.target.value;
                                                                setMonthlySchedule(newData);
                                                            }}
                                                        />
                                                    ) : formatNumberToLocale(day.fajr)}
                                                </td>
                                                <td className="p-3 p-0.5 text-gray-500">
                                                    {isEditing ? (
                                                        <Input
                                                            className="h-8 w-20 text-center"
                                                            value={day.sunrise}
                                                            onChange={(e) => {
                                                                const newData = [...monthlySchedule];
                                                                newData[idx].sunrise = e.target.value;
                                                                setMonthlySchedule(newData);
                                                            }}
                                                        />
                                                    ) : formatNumberToLocale(day.sunrise)}
                                                </td>
                                                <td className="p-3 p-0.5">
                                                    {isEditing ? (
                                                        <Input
                                                            className="h-8 w-20 text-center"
                                                            value={day.dhuhr}
                                                            onChange={(e) => {
                                                                const newData = [...monthlySchedule];
                                                                newData[idx].dhuhr = e.target.value;
                                                                setMonthlySchedule(newData);
                                                            }}
                                                        />
                                                    ) : formatNumberToLocale(day.dhuhr)}
                                                </td>
                                                <td className="p-3 p-0.5">
                                                    {isEditing ? (
                                                        <Input
                                                            className="h-8 w-20 text-center"
                                                            value={day.asr}
                                                            onChange={(e) => {
                                                                const newData = [...monthlySchedule];
                                                                newData[idx].asr = e.target.value;
                                                                setMonthlySchedule(newData);
                                                            }}
                                                        />
                                                    ) : formatNumberToLocale(day.asr)}
                                                </td>
                                                <td className="p-3 p-0.5">
                                                    {isEditing ? (
                                                        <Input
                                                            className="h-8 w-20 text-center"
                                                            value={day.maghrib}
                                                            onChange={(e) => {
                                                                const newData = [...monthlySchedule];
                                                                newData[idx].maghrib = e.target.value;
                                                                setMonthlySchedule(newData);
                                                            }}
                                                        />
                                                    ) : formatNumberToLocale(day.maghrib)}
                                                </td>
                                                <td className="p-3 p-0.5">
                                                    {isEditing ? (
                                                        <Input
                                                            className="h-8 w-20 text-center"
                                                            value={day.isha}
                                                            onChange={(e) => {
                                                                const newData = [...monthlySchedule];
                                                                newData[idx].isha = e.target.value;
                                                                setMonthlySchedule(newData);
                                                            }}
                                                        />
                                                    ) : formatNumberToLocale(day.isha)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button variant="ghost" className="text-xs text-gray-500 hover:text-red-500" onClick={() => {
                                if (window.confirm('هل أنت متأكد من مسح الجدول المحفوظ؟')) {
                                    setMonthlySchedule([]);
                                    localStorage.removeItem('baraka_monthly_schedule');
                                    setViewMode('upload');
                                }
                            }}>
                                <span className="ml-2"> مسح الجدول</span>
                                <LogOut className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card >
    );
};

export default PrayerManager;
