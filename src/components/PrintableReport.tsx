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
        if (!startStr) return [];

        const start = new Date(startStr + 'T00:00:00');
        const end = endStr ? new Date(endStr + 'T00:00:00') : new Date(startStr + 'T00:00:00');
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

    // Group prayer times by date - build a map of date -> prayer name -> time
    const prayersByDate: Record<string, Record<string, string>> = {};

    // Process prayer times data
    (data.prayerTimes || []).forEach((p: any) => {
        // Handle different date formats
        let dateKey = p.date;
        if (!dateKey && days.length > 0) {
            // If no date, assign to first day
            dateKey = days[0].toISOString().split('T')[0];
        }
        if (!dateKey) return;

        if (!prayersByDate[dateKey]) {
            prayersByDate[dateKey] = {};
        }

        // Map prayer names to Arabic
        const prayerNameMap: Record<string, string> = {
            'fajr': 'الفجر', 'الفجر': 'الفجر',
            'sunrise': 'الشروق', 'الشروق': 'الشروق',
            'dhuhr': 'الظهر', 'الظهر': 'الظهر',
            'asr': 'العصر', 'العصر': 'العصر',
            'maghrib': 'المغرب', 'المغرب': 'المغرب',
            'isha': 'العشاء', 'العشاء': 'العشاء'
        };

        const prayerName = p.nameAr || prayerNameMap[p.name?.toLowerCase()] || p.name;
        if (prayerName) {
            prayersByDate[dateKey][prayerName] = p.time;
        }
    });

    // Prayer column order
    const PRAYER_COLUMNS = ['الفجر', 'الشروق', 'الظهر', 'العصر', 'المغرب', 'العشاء'];

    // Format date for display
    const formatDate = (date: Date) => {
        return `${DAYS_AR[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`;
    };

    const formatDateKey = (date: Date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    return (
        <div
            ref={ref}
            className="bg-white p-8 w-[210mm] min-h-[297mm] mx-auto text-right"
            dir="rtl"
            style={{ position: 'absolute', top: '-10000px', left: '-10000px', fontFamily: 'Arial, sans-serif' }}
            id="printable-report-content"
        >
            {/* Header */}
            <div className="text-center mb-8 border-b-2 border-emerald-500 pb-4">
                <h1 className="text-3xl font-bold text-emerald-700 mb-2">📋 التقرير المفصل</h1>
                <p className="text-gray-600 text-lg">الفترة: {dateRange}</p>
                <p className="text-gray-400 text-sm mt-1">
                    {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* Prayer Times - Rows=Days, Columns=Prayers */}
            {days.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-xl font-bold text-emerald-700 mb-3 flex items-center gap-2">
                        🕌 مواقيت الصلاة
                    </h2>
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-emerald-600 text-white">
                                    <th className="p-2 border-l border-emerald-500 font-bold">اليوم</th>
                                    {PRAYER_COLUMNS.map((prayer, i) => (
                                        <th key={i} className="p-2 border-l border-emerald-500 font-bold text-center">
                                            {prayer}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {days.map((day, rowIdx) => {
                                    const dateKey = formatDateKey(day);
                                    const dayPrayers = prayersByDate[dateKey] || {};

                                    return (
                                        <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="p-2 border border-gray-200 font-medium text-gray-700">
                                                {formatDate(day)}
                                            </td>
                                            {PRAYER_COLUMNS.map((prayer, colIdx) => (
                                                <td key={colIdx} className="p-2 border border-gray-200 text-center font-mono text-gray-800">
                                                    {dayPrayers[prayer] || '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* Appointments & Tasks */}
            {(data.appointments?.length > 0 || data.tasks?.length > 0) && (
                <section className="mb-8">
                    <h2 className="text-xl font-bold text-purple-700 mb-3 flex items-center gap-2">
                        📅 المواعيد والمهام
                    </h2>
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-purple-600 text-white">
                                    <th className="p-2 border-l border-purple-500 font-bold">العنوان</th>
                                    <th className="p-2 border-l border-purple-500 font-bold text-center">التاريخ</th>
                                    <th className="p-2 border-l border-purple-500 font-bold text-center">الوقت</th>
                                    <th className="p-2 font-bold">الملاحظات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data.appointments || []).map((a: any, i: number) => (
                                    <tr key={`apt-${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="p-2 border border-gray-200 font-medium">{a.title}</td>
                                        <td className="p-2 border border-gray-200 text-center text-gray-600">
                                            {a.date ? formatDate(new Date(a.date + 'T00:00:00')) : '-'}
                                        </td>
                                        <td className="p-2 border border-gray-200 text-center font-mono">{a.time || '-'}</td>
                                        <td className="p-2 border border-gray-200 text-gray-500">{a.notes || a.location || '-'}</td>
                                    </tr>
                                ))}
                                {(data.tasks || []).map((t: any, i: number) => (
                                    <tr key={`task-${i}`} className={(data.appointments?.length || 0 + i) % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="p-2 border border-gray-200 font-medium">{t.title}</td>
                                        <td className="p-2 border border-gray-200 text-center text-gray-600">
                                            {t.deadline ? formatDate(new Date(t.deadline.split('T')[0] + 'T00:00:00')) : '-'}
                                        </td>
                                        <td className="p-2 border border-gray-200 text-center font-mono">
                                            {t.deadline?.includes('T') ? t.deadline.split('T')[1]?.substring(0, 5) : '-'}
                                        </td>
                                        <td className="p-2 border border-gray-200 text-gray-500">{t.description || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* Two Column: Medications & Shopping */}
            <div className="flex gap-6 mb-8">
                {/* Medications */}
                {data.medications?.length > 0 && (
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-red-700 mb-3 flex items-center gap-2">
                            💊 الأدوية
                        </h2>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-red-600 text-white">
                                        <th className="p-2 border-l border-red-500 font-bold">الدواء</th>
                                        <th className="p-2 border-l border-red-500 font-bold text-center">الجرعة</th>
                                        <th className="p-2 font-bold text-center">الأيام</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.medications.map((m: any, i: number) => (
                                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="p-2 border border-gray-200 font-medium">{m.name}</td>
                                            <td className="p-2 border border-gray-200 text-center">{m.dosage || m.time || '-'}</td>
                                            <td className="p-2 border border-gray-200 text-center text-gray-600">
                                                {m.days?.join('، ') || m.frequency || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Shopping List */}
                {data.shopping?.length > 0 && (
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-pink-700 mb-3 flex items-center gap-2">
                            🛒 قائمة التسوق
                        </h2>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-pink-600 text-white">
                                        <th className="p-2 border-l border-pink-500 font-bold">الصنف</th>
                                        <th className="p-2 font-bold text-center">الكمية</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.shopping.map((item: any, i: number) => (
                                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="p-2 border border-gray-200 font-medium">{item.text || item.name}</td>
                                            <td className="p-2 border border-gray-200 text-center">{item.quantity || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Expenses */}
            {data.expenses?.length > 0 && (
                <section className="mb-8">
                    <h2 className="text-xl font-bold text-amber-700 mb-3 flex items-center gap-2">
                        💰 المصاريف
                    </h2>
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-amber-600 text-white">
                                    <th className="p-2 border-l border-amber-500 font-bold text-center">التاريخ</th>
                                    <th className="p-2 border-l border-amber-500 font-bold text-center">المبلغ</th>
                                    <th className="p-2 font-bold">البيان</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.expenses.map((e: any, i: number) => (
                                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="p-2 border border-gray-200 text-center text-gray-600">
                                            {e.date ? formatDate(new Date(e.date.split('T')[0] + 'T00:00:00')) : '-'}
                                        </td>
                                        <td className="p-2 border border-gray-200 text-center font-bold text-amber-700">
                                            {e.amount} {e.currency || ''}
                                        </td>
                                        <td className="p-2 border border-gray-200">{e.description || e.category || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* Footer */}
            <div className="mt-12 text-center text-gray-400 text-xs border-t pt-4">
                تم التوليد بواسطة تطبيق بركة الإسلامي • {new Date().toLocaleDateString('ar-EG')}
            </div>
        </div>
    );
});

export default PrintableReport;
