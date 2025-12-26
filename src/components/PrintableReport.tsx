import React from 'react';

interface PrintableReportProps {
    data: any;
    viewType: 'table' | 'timeline';
    dateRange: string;
}

const PrintableReport = React.forwardRef<HTMLDivElement, PrintableReportProps>(({ data, viewType, dateRange }, ref) => {
    // Parse date range to get all days
    const getDaysInRange = () => {
        const [startStr, endStr] = dateRange.split(' - ');
        const start = new Date(startStr);
        const end = new Date(endStr);
        const days: Date[] = [];

        const current = new Date(start);
        while (current <= end) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return days;
    };

    const days = getDaysInRange();
    const DAYS_AR: Record<number, string> = {
        0: 'الأحد', 1: 'الاثنين', 2: 'الثلاثاء', 3: 'الأربعاء',
        4: 'الخميس', 5: 'الجمعة', 6: 'السبت'
    };

    // Group prayer times by date
    const prayersByDate: Record<string, any[]> = {};
    (data.prayerTimes || []).forEach((p: any) => {
        const dateKey = p.date || dateRange.split(' - ')[0];
        if (!prayersByDate[dateKey]) prayersByDate[dateKey] = [];
        prayersByDate[dateKey].push(p);
    });

    // Prayer names in order
    const PRAYER_NAMES = ['الفجر', 'الشروق', 'الظهر', 'العصر', 'المغرب', 'العشاء'];

    return (
        <div
            ref={ref}
            className="bg-white p-6 w-[210mm] min-h-[297mm] mx-auto text-right"
            dir="rtl"
            style={{ position: 'absolute', top: '-10000px', left: '-10000px', fontFamily: 'Arial, sans-serif' }}
            id="printable-report-content"
        >
            {/* Header */}
            <div className="text-center mb-6">
                <div className="inline-block bg-green-600 text-white px-8 py-2 font-bold text-xl">
                    التقرير المفصل
                </div>
            </div>

            {/* Prayer Times Section - Multi-day Grid */}
            {Object.keys(prayersByDate).length > 0 && (
                <section className="mb-6">
                    <table className="w-full border-collapse border border-gray-400 text-sm">
                        <thead>
                            <tr>
                                <th colSpan={days.length + 1} className="bg-gray-100 border border-gray-400 p-2 text-center font-bold">
                                    مواقيت الصلاة
                                </th>
                            </tr>
                            <tr>
                                <th className="border border-gray-400 p-2 bg-white"></th>
                                {days.map((day, i) => (
                                    <th key={i} className="border border-gray-400 p-2 bg-white text-center">
                                        <div className="font-bold">{DAYS_AR[day.getDay()]}</div>
                                        <div className="text-xs text-gray-600">{day.getDate()} {day.getMonth() + 1}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {PRAYER_NAMES.map((prayerName, pi) => (
                                <tr key={pi}>
                                    <td className="border border-gray-400 p-2 font-medium bg-gray-50">{prayerName}</td>
                                    {days.map((day, di) => {
                                        const dateStr = day.toISOString().split('T')[0];
                                        const prayersForDay = prayersByDate[dateStr] || [];
                                        const prayer = prayersForDay.find((p: any) =>
                                            p.name === prayerName || p.nameAr === prayerName
                                        );
                                        return (
                                            <td key={di} className="border border-gray-400 p-2 text-center font-mono">
                                                {prayer?.time || '-'}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            {/* Appointments and Tasks Combined */}
            {(data.appointments?.length > 0 || data.tasks?.length > 0) && (
                <section className="mb-6">
                    <table className="w-full border-collapse border border-gray-400 text-sm">
                        <thead>
                            <tr>
                                <th colSpan={4} className="bg-green-600 text-white border border-gray-400 p-2 text-center font-bold">
                                    المواعيد والمهام
                                </th>
                            </tr>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-400 p-2">الموعد والمواعيد</th>
                                <th className="border border-gray-400 p-2">التاريخ</th>
                                <th className="border border-gray-400 p-2">الساعة</th>
                                <th className="border border-gray-400 p-2">تفاصيل</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data.appointments || []).map((a: any, i: number) => (
                                <tr key={`apt-${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="border border-gray-400 p-2 font-medium">{a.title}</td>
                                    <td className="border border-gray-400 p-2 text-center">
                                        {a.date ? `${DAYS_AR[new Date(a.date).getDay()]} ${new Date(a.date).getDate()} ${new Date(a.date).getMonth() + 1}` : '-'}
                                    </td>
                                    <td className="border border-gray-400 p-2 text-center font-mono">{a.time || '-'}</td>
                                    <td className="border border-gray-400 p-2 text-gray-600">{a.notes || a.location || '-'}</td>
                                </tr>
                            ))}
                            {(data.tasks || []).map((t: any, i: number) => (
                                <tr key={`task-${i}`} className={((data.appointments?.length || 0) + i) % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="border border-gray-400 p-2 font-medium">{t.title}</td>
                                    <td className="border border-gray-400 p-2 text-center">
                                        {t.deadline ? `${DAYS_AR[new Date(t.deadline).getDay()]} ${new Date(t.deadline).getDate()} ${new Date(t.deadline).getMonth() + 1}` : '-'}
                                    </td>
                                    <td className="border border-gray-400 p-2 text-center font-mono">
                                        {t.deadline && t.deadline.includes('T') ? t.deadline.split('T')[1]?.substring(0, 5) : '-'}
                                    </td>
                                    <td className="border border-gray-400 p-2 text-gray-600">{t.description || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            {/* Two Column Layout: Medications & Shopping */}
            <div className="flex gap-4 mb-6">
                {/* Medications */}
                {data.medications?.length > 0 && (
                    <div className="flex-1">
                        <table className="w-full border-collapse border border-gray-400 text-sm">
                            <thead>
                                <tr>
                                    <th colSpan={3} className="bg-green-600 text-white border border-gray-400 p-2 text-center font-bold">
                                        الأدوية
                                    </th>
                                </tr>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-400 p-2">الدواء</th>
                                    <th className="border border-gray-400 p-2">الجرعة</th>
                                    <th className="border border-gray-400 p-2">اليوم</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.medications.map((m: any, i: number) => (
                                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="border border-gray-400 p-2">{m.name}</td>
                                        <td className="border border-gray-400 p-2 text-center">{m.dosage || m.time || '-'}</td>
                                        <td className="border border-gray-400 p-2 text-center">{m.days?.join(', ') || m.frequency || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Shopping List */}
                {data.shopping?.length > 0 && (
                    <div className="flex-1">
                        <table className="w-full border-collapse border border-gray-400 text-sm">
                            <thead>
                                <tr>
                                    <th colSpan={2} className="bg-green-600 text-white border border-gray-400 p-2 text-center font-bold">
                                        قائمة التسوق
                                    </th>
                                </tr>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-400 p-2">النوع</th>
                                    <th className="border border-gray-400 p-2">الكمية</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.shopping.map((item: any, i: number) => (
                                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="border border-gray-400 p-2">{item.text || item.name}</td>
                                        <td className="border border-gray-400 p-2 text-center">{item.quantity || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Expenses */}
            {data.expenses?.length > 0 && (
                <section className="mb-6">
                    <table className="w-full border-collapse border border-gray-400 text-sm">
                        <thead>
                            <tr>
                                <th colSpan={3} className="bg-green-600 text-white border border-gray-400 p-2 text-center font-bold">
                                    المصاريف
                                </th>
                            </tr>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-400 p-2">التاريخ</th>
                                <th className="border border-gray-400 p-2">المبلغ</th>
                                <th className="border border-gray-400 p-2">البيان</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.expenses.map((e: any, i: number) => (
                                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="border border-gray-400 p-2 text-center">
                                        {e.date ? `${DAYS_AR[new Date(e.date).getDay()]} ${new Date(e.date).getDate()} ${new Date(e.date).getMonth() + 1}` : '-'}
                                    </td>
                                    <td className="border border-gray-400 p-2 text-center font-bold">{e.amount}</td>
                                    <td className="border border-gray-400 p-2">{e.description || e.category || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            {/* Footer */}
            <div className="mt-8 text-center text-gray-400 text-xs border-t pt-3">
                تم التوليد بواسطة تطبيق بركة الإسلامي • {new Date().toLocaleDateString('ar-EG')}
            </div>
        </div>
    );
});

export default PrintableReport;
