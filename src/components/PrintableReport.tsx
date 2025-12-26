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
    const prayersByDate: Record<string, Record<string, string>> = {};
    (data.prayerTimes || []).forEach((p: any) => {
        const dateKey = p.date || dateRange.split(' - ')[0];
        if (!prayersByDate[dateKey]) prayersByDate[dateKey] = {};
        const prayerName = p.nameAr || p.name;
        prayersByDate[dateKey][prayerName] = p.time;
    });

    // Prayer names in order
    const PRAYER_NAMES = ['الفجر', 'الشروق', 'الظهر', 'العصر', 'المغرب', 'العشاء'];

    // Common cell styles
    const cellStyle = "border border-black p-1 text-center text-xs";
    const headerCellStyle = "border border-black p-1 text-center text-xs font-bold bg-[#92D050]";

    return (
        <div
            ref={ref}
            className="bg-white p-4 w-[210mm] min-h-[297mm] mx-auto"
            dir="rtl"
            style={{ position: 'absolute', top: '-10000px', left: '-10000px', fontFamily: 'Arial, sans-serif', fontSize: '11px' }}
            id="printable-report-content"
        >
            {/* Header */}
            <table className="w-full border-collapse mb-4">
                <tbody>
                    <tr>
                        <td className="text-center p-2">
                            <span className="bg-[#92D050] px-6 py-1 font-bold text-sm inline-block">
                                التقرير المفصل
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Prayer Times Section */}
            {Object.keys(prayersByDate).length > 0 && (
                <table className="w-full border-collapse mb-4">
                    <tbody>
                        {/* Section Header */}
                        <tr>
                            <td colSpan={days.length + 1} className="border border-black text-center p-1 bg-gray-100 font-bold">
                                مواقيت الصلاة
                            </td>
                        </tr>
                        {/* Days Header Row */}
                        <tr>
                            <td className={cellStyle}></td>
                            {days.map((day, i) => (
                                <td key={i} className={cellStyle}>
                                    <div>{DAYS_AR[day.getDay()]}</div>
                                    <div>{day.getDate()} {day.getMonth() + 1}</div>
                                </td>
                            ))}
                        </tr>
                        {/* Prayer Rows */}
                        {PRAYER_NAMES.map((prayerName, pi) => (
                            <tr key={pi}>
                                <td className={`${cellStyle} font-bold text-right pr-2`}>{prayerName}</td>
                                {days.map((day, di) => {
                                    const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                                    const timeValue = prayersByDate[dateStr]?.[prayerName] || '';
                                    return (
                                        <td key={di} className={cellStyle}>
                                            {timeValue}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Appointments and Tasks Combined */}
            {(data.appointments?.length > 0 || data.tasks?.length > 0) && (
                <table className="w-full border-collapse mb-4">
                    <tbody>
                        {/* Section Header */}
                        <tr>
                            <td colSpan={4} className={headerCellStyle}>
                                المواعيد والمهام
                            </td>
                        </tr>
                        {/* Column Headers */}
                        <tr>
                            <td className={`${cellStyle} bg-gray-100`}>الموعد والمواعيد</td>
                            <td className={`${cellStyle} bg-gray-100`}>التاريخ</td>
                            <td className={`${cellStyle} bg-gray-100`}>الساعة</td>
                            <td className={`${cellStyle} bg-gray-100`}>تفاصيل</td>
                        </tr>
                        {/* Appointments */}
                        {(data.appointments || []).map((a: any, i: number) => (
                            <tr key={`apt-${i}`}>
                                <td className={cellStyle}>{a.title}</td>
                                <td className={cellStyle}>
                                    {a.date ? `${DAYS_AR[new Date(a.date).getDay()]} ${new Date(a.date).getDate()} ${new Date(a.date).getMonth() + 1}` : ''}
                                </td>
                                <td className={cellStyle}>{a.time || ''}</td>
                                <td className={cellStyle}>{a.notes || a.location || ''}</td>
                            </tr>
                        ))}
                        {/* Tasks */}
                        {(data.tasks || []).map((t: any, i: number) => (
                            <tr key={`task-${i}`}>
                                <td className={cellStyle}>{t.title}</td>
                                <td className={cellStyle}>
                                    {t.deadline ? `${DAYS_AR[new Date(t.deadline).getDay()]} ${new Date(t.deadline).getDate()} ${new Date(t.deadline).getMonth() + 1}` : ''}
                                </td>
                                <td className={cellStyle}>{t.deadline?.includes('T') ? t.deadline.split('T')[1]?.substring(0, 5) : ''}</td>
                                <td className={cellStyle}>{t.description || ''}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Two Column Layout: Medications & Shopping */}
            <div className="flex gap-4 mb-4">
                {/* Medications */}
                <div className="flex-1">
                    {data.medications?.length > 0 && (
                        <table className="w-full border-collapse">
                            <tbody>
                                <tr>
                                    <td colSpan={3} className={headerCellStyle}>الأدوية</td>
                                </tr>
                                <tr>
                                    <td className={`${cellStyle} bg-gray-100`}>الدواء</td>
                                    <td className={`${cellStyle} bg-gray-100`}>الجرعة</td>
                                    <td className={`${cellStyle} bg-gray-100`}>اليوم</td>
                                </tr>
                                {data.medications.map((m: any, i: number) => (
                                    <tr key={i}>
                                        <td className={cellStyle}>{m.name}</td>
                                        <td className={cellStyle}>{m.dosage || m.time || ''}</td>
                                        <td className={cellStyle}>{m.days?.join(' ') || m.frequency || ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {/* Empty placeholder */}
                    {!data.medications?.length && (
                        <table className="w-full border-collapse">
                            <tbody>
                                <tr><td className={headerCellStyle}>الأدوية</td></tr>
                                <tr><td className={cellStyle}>-</td></tr>
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Shopping List */}
                <div className="flex-1">
                    {data.shopping?.length > 0 && (
                        <table className="w-full border-collapse">
                            <tbody>
                                <tr>
                                    <td colSpan={2} className={headerCellStyle}>قائمة التسوق</td>
                                </tr>
                                <tr>
                                    <td className={`${cellStyle} bg-gray-100`}>النوع</td>
                                    <td className={`${cellStyle} bg-gray-100`}>الكمية</td>
                                </tr>
                                {data.shopping.map((item: any, i: number) => (
                                    <tr key={i}>
                                        <td className={cellStyle}>{item.text || item.name}</td>
                                        <td className={cellStyle}>{item.quantity || ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {!data.shopping?.length && (
                        <table className="w-full border-collapse">
                            <tbody>
                                <tr><td colSpan={2} className={headerCellStyle}>قائمة التسوق</td></tr>
                                <tr>
                                    <td className={cellStyle}>-</td>
                                    <td className={cellStyle}>-</td>
                                </tr>
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Expenses */}
            {data.expenses?.length > 0 && (
                <table className="w-full border-collapse mb-4">
                    <tbody>
                        <tr>
                            <td colSpan={3} className={headerCellStyle}>المصاريف</td>
                        </tr>
                        <tr>
                            <td className={`${cellStyle} bg-gray-100`}>التاريخ</td>
                            <td className={`${cellStyle} bg-gray-100`}>المبلغ</td>
                            <td className={`${cellStyle} bg-gray-100`}>البيان</td>
                        </tr>
                        {data.expenses.map((e: any, i: number) => (
                            <tr key={i}>
                                <td className={cellStyle}>
                                    {e.date ? `${DAYS_AR[new Date(e.date).getDay()]} ${new Date(e.date).getDate()} ${new Date(e.date).getMonth() + 1}` : ''}
                                </td>
                                <td className={cellStyle}>{e.amount}</td>
                                <td className={cellStyle}>{e.description || e.category || ''}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Footer */}
            <div className="mt-4 text-center text-gray-500 text-[9px]">
                تطبيق بركة • {new Date().toLocaleDateString('ar-EG')}
            </div>
        </div>
    );
});

export default PrintableReport;
