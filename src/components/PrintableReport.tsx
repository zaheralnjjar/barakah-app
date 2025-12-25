import React from 'react';
import { Card } from '@/components/ui/card';

interface PrintableReportProps {
    data: any;
    viewType: 'table' | 'timeline';
    dateRange: string;
}

const PrintableReport = React.forwardRef<HTMLDivElement, PrintableReportProps>(({ data, viewType, dateRange }, ref) => {
    return (
        <div ref={ref} className="bg-white p-8 w-[210mm] min-h-[297mm] mx-auto text-right" dir="rtl" style={{ position: 'absolute', top: '-10000px', left: '-10000px' }} id="printable-report-content">
            {/* Header */}
            <div className="text-center mb-8 border-b pb-4">
                <h1 className="text-4xl font-bold text-blue-700 mb-2">تقرير بركة</h1>
                <p className="text-gray-500 text-lg">الفترة: {dateRange}</p>
                <div className="flex justify-center gap-4 mt-2 text-sm text-gray-400">
                    <span>{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            {viewType === 'table' ? (
                <div className="space-y-8">
                    {/* Prayer Times */}
                    {data.prayerTimes?.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold text-emerald-700 mb-4 flex items-center gap-2">
                                🕌 مواقيت الصلاة
                            </h2>
                            <div className="border rounded-xl overflow-hidden shadow-sm">
                                <table className="w-full text-right">
                                    <thead className="bg-emerald-50">
                                        <tr>
                                            <th className="p-3 text-emerald-900">الصلاة</th>
                                            <th className="p-3 text-emerald-900 border-r">الوقت</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {data.prayerTimes.map((p: any, i: number) => (
                                            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="p-3 font-medium">{p.name}</td>
                                                <td className="p-3 border-r font-mono dir-ltr text-right">{p.time}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* Appointments */}
                    {data.appointments?.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold text-purple-700 mb-4 flex items-center gap-2">
                                📅 المواعيد
                            </h2>
                            <div className="border rounded-xl overflow-hidden shadow-sm">
                                <table className="w-full text-right">
                                    <thead className="bg-purple-50">
                                        <tr>
                                            <th className="p-3 text-purple-900">العنوان</th>
                                            <th className="p-3 text-purple-900 border-r">الوقت</th>
                                            <th className="p-3 text-purple-900 border-r">المكان</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {data.appointments.map((a: any, i: number) => (
                                            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="p-3 font-medium">{a.title}</td>
                                                <td className="p-3 border-r font-mono">{a.time}</td>
                                                <td className="p-3 border-r text-gray-500">{a.location || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* Tasks */}
                    {data.tasks?.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold text-blue-700 mb-4 flex items-center gap-2">
                                ✅ المهام
                            </h2>
                            <div className="border rounded-xl overflow-hidden shadow-sm">
                                <table className="w-full text-right">
                                    <thead className="bg-blue-50">
                                        <tr>
                                            <th className="p-3 text-blue-900">المهمة</th>
                                            <th className="p-3 text-blue-900 border-r">الأولوية</th>
                                            <th className="p-3 text-blue-900 border-r">الحالة</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {data.tasks.map((t: any, i: number) => (
                                            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="p-3 font-medium">{t.title}</td>
                                                <td className="p-3 border-r">
                                                    <span className={`px-2 py-1 rounded text-xs ${t.priority === 'high' ? 'bg-red-100 text-red-700' :
                                                            t.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                                        }`}>
                                                        {t.priority === 'high' ? 'عالية' : t.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                                                    </span>
                                                </td>
                                                <td className="p-3 border-r text-gray-500">{t.completed ? 'منجزة' : 'معلقة'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </div>
            ) : (
                // Timeline View
                <section>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">الجدول الزمني</h2>
                    <div className="border-l-4 border-gray-200 mr-4 space-y-8 relative">
                        {(() => {
                            const items = [
                                ...(data.prayerTimes || []).map((p: any) => ({ ...p, type: 'prayer', sortTime: p.time.split(' ')[0] })),
                                ...(data.appointments || []).map((a: any) => ({ ...a, type: 'appointment', sortTime: a.time })),
                                ...(data.tasks || []).filter((t: any) => t.date /* assume tasks have date/time for timeline */).map((t: any) => ({ ...t, type: 'task', sortTime: '00:00' }))
                            ].sort((a, b) => a.sortTime.localeCompare(b.sortTime));

                            return items.map((item, i) => (
                                <div key={i} className="relative pr-8">
                                    <div className={`absolute -right-3 top-0 w-6 h-6 rounded-full border-4 border-white shadow-sm ${item.type === 'prayer' ? 'bg-emerald-500' :
                                            item.type === 'appointment' ? 'bg-purple-500' : 'bg-blue-500'
                                        }`} />
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg">{item.name || item.title}</h3>
                                                <span className={`text-xs px-2 rounded ${item.type === 'prayer' ? 'bg-emerald-100 text-emerald-700' :
                                                        item.type === 'appointment' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {item.type === 'prayer' ? 'صلاة' : item.type === 'appointment' ? 'موعد' : 'مهمة'}
                                                </span>
                                            </div>
                                            <span className="font-mono font-bold text-xl text-gray-400">{item.time || item.sortTime}</span>
                                        </div>
                                        {item.location && <p className="text-sm text-gray-500 mt-2">📍 {item.location}</p>}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </section>
            )}

            <div className="mt-12 text-center text-gray-400 text-sm border-t pt-4">
                تم التوليد بواسطة تطبيق بركة الإسلامي
            </div>
        </div>
    );
});

export default PrintableReport;
