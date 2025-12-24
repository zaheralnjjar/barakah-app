import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Moon, Sun } from 'lucide-react';

interface HolidaysDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const HolidaysDialog: React.FC<HolidaysDialogProps> = ({ open, onOpenChange }) => {
    const currentYear = new Date().getFullYear();
    const currentHijriYear = 1446; // Approximation for 2024-2025

    // Static list of holidays (simplified for now)
    // In a real app, we might want a library to calculate these dynamically
    // Generate holidays for current and next year to ensure coverage
    const generateHolidays = (year: number) => [
        // Argentine Holidays
        { name: 'رأس السنة الميلادية', date: `${year}-01-01`, type: 'arg', icon: Sun },
        { name: 'كرنفال (الإثنين)', date: `${year}-02-16`, type: 'arg', icon: Sun }, // Approx for 2026, varies
        { name: 'كرنفال (الثلاثاء)', date: `${year}-02-17`, type: 'arg', icon: Sun }, // Approx for 2026, varies
        { name: 'يوم الذكرى (الحقيقة والعدالة)', date: `${year}-03-24`, type: 'arg', icon: Sun },
        { name: 'يوم المحاربين القدامى', date: `${year}-04-02`, type: 'arg', icon: Sun },
        { name: 'عيد العمال', date: `${year}-05-01`, type: 'arg', icon: Sun },
        { name: 'يوم الثورة (مايو)', date: `${year}-05-25`, type: 'arg', icon: Sun },
        { name: 'يوم العلم', date: `${year}-06-20`, type: 'arg', icon: Sun },

        // Islamic Holidays (Approx calculations for 2025/2026)
        // Note: In real app, convert Hijri to Gregorian dynamically
        ...(year === 2025 ? [
            { name: 'عيد الميلاد', date: '2025-12-25', type: 'arg', icon: Sun },
        ] : year === 2026 ? [
            { name: 'بداية رمضان 1447', date: '2026-02-17', type: 'hijri', icon: Moon },
            { name: 'عيد الفطر', date: '2026-03-19', type: 'hijri', icon: Moon },
            { name: 'عيد الأضحى', date: '2026-05-26', type: 'hijri', icon: Moon },
            { name: 'رأس السنة الهجرية 1448', date: '2026-06-16', type: 'hijri', icon: Moon },
        ] : [])
    ];

    const holidays = [
        ...generateHolidays(currentYear),
        ...generateHolidays(currentYear + 1)
    ];

    // Filter for upcoming holidays (Next 6 Months)
    const today = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(today.getMonth() + 6);

    const upcomingHolidays = holidays
        .filter(h => {
            const date = new Date(h.date);
            return date >= today && date <= sixMonthsLater;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] bg-white/95 backdrop-blur">
                <DialogHeader>
                    <DialogTitle className="text-center flex items-center justify-center gap-2 text-emerald-700">
                        <Calendar className="w-5 h-5" />
                        العطل والمناسبات القادمة
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    {upcomingHolidays.map((holiday, idx) => (
                        <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg border ${holiday.type === 'hijri' ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${holiday.type === 'hijri' ? 'bg-emerald-200 text-emerald-700' : 'bg-blue-200 text-blue-700'}`}>
                                <holiday.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 text-sm">{holiday.name}</h4>
                                <p className="text-xs text-gray-500 mt-1">{formatDate(holiday.date)}</p>
                            </div>
                            <div className="mr-auto text-[10px] px-2 py-1 rounded-full bg-white bg-opacity-50 font-medium">
                                {holiday.type === 'hijri' ? 'هجري' : 'أرجنتين'}
                            </div>
                        </div>
                    ))}

                    {upcomingHolidays.length === 0 && (
                        <p className="text-center text-gray-500 py-4">لا توجد عطل قادمة مسجلة قريباً</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default HolidaysDialog;
