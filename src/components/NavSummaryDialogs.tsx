import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { useHabits } from '@/hooks/useHabits';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useLocations } from '@/hooks/useLocations';
import FinancialTrendChart from '@/components/FinancialTrendChart';
import { Loader2, CheckSquare, Target, MapPin, Moon, Calendar, Calculator, Share2, Navigation, Timer } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';


interface NavSummaryDialogsProps {
    type: string | null;
    onClose: () => void;
}

const NavSummaryDialogs: React.FC<NavSummaryDialogsProps> = ({ type, onClose }) => {
    const [financeData, setFinanceData] = useState<any>(null);
    const [loadingFinance, setLoadingFinance] = useState(false);

    // Hooks
    const { tasks } = useTasks();
    const { appointments } = useAppointments();
    const { habits } = useHabits();
    const { prayerTimes, nextPrayer, timeUntilNext } = usePrayerTimes();
    const { locations } = useLocations();

    // Fetch Finance Data
    useEffect(() => {
        if (type === 'mohamed' || type === 'home_summary') {
            const fetchFinance = async () => {
                setLoadingFinance(true);
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;
                    const { data } = await supabase
                        .from('finance_data_2025_12_18_18_42')
                        .select('*')
                        .eq('user_id', user.id)
                        .single();
                    setFinanceData(data);
                } catch (e) {
                    console.error('Error fetching finance:', e);
                } finally {
                    setLoadingFinance(false);
                }
            };
            fetchFinance();
        }
    }, [type]);

    // Productivity Data
    const productivityData = useMemo(() => {
        const completedTasks = tasks.filter(t => t.progress === 100).length;
        const pendingTasks = tasks.filter(t => t.progress < 100).length;

        // Count habits completed TODAY
        const today = new Date().toISOString().split('T')[0];
        const completedHabits = habits.filter(h => h.history && h.history[today]).length;
        const pendingHabits = habits.length - completedHabits;

        const totalAppointments = appointments.length;

        return [
            { name: 'مهام مكتملة', value: completedTasks, color: '#10b981' }, // green
            { name: 'مهام معلقة', value: pendingTasks, color: '#ef4444' }, // red
            { name: 'عادات منجزة', value: completedHabits, color: '#3b82f6' }, // blue
            { name: 'عادات متبقية', value: pendingHabits, color: '#f59e0b' }, // amber
            { name: 'مواعيد اليوم', value: totalAppointments, color: '#8b5cf6' }, // purple
        ].filter(d => d.value > 0);
    }, [tasks, habits, appointments]);



    // Render Content based on Type
    const renderContent = () => {
        const today = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const todayStr = new Date().toISOString().split('T')[0];

        switch (type) {
            case 'mohamed': // Finance
                return (
                    <div className="space-y-4">
                        {loadingFinance ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                        ) : financeData ? (
                            <FinancialTrendChart financeData={financeData} />
                        ) : (
                            <p className="text-center text-gray-500">لا توجد بيانات مالية</p>
                        )}
                    </div>
                );

            case 'fatima': // Productivity
                return (
                    <div className="space-y-4">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={productivityData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {productivityData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-center text-sm">
                            <div className="bg-green-50 p-2 rounded">
                                <span className="block font-bold text-green-700">{tasks.filter(t => t.progress === 100).length}</span>
                                <span className="text-gray-600">مهام منجزة</span>
                            </div>
                            <div className="bg-red-50 p-2 rounded">
                                <span className="block font-bold text-red-700">{tasks.filter(t => t.progress < 100).length}</span>
                                <span className="text-gray-600">مهام متبقية</span>
                            </div>
                        </div>
                    </div>
                );

            case 'map':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <MapPin className="w-6 h-6 text-blue-500" />
                            <h3 className="font-bold text-lg">المواقع المحفوظة</h3>
                        </div>
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                            {locations.length > 0 ? (
                                locations.map((loc) => (
                                    <div key={loc.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${loc.category === 'mosque' ? 'bg-emerald-100 text-emerald-600' :
                                                loc.category === 'home' ? 'bg-blue-100 text-blue-600' :
                                                    loc.category === 'work' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100'
                                                }`}>
                                                <MapPin className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">{loc.title}</p>
                                                <p className="text-[10px] text-gray-500">{loc.address || 'لا يوجد عنوان'}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`, '_blank')}
                                                className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                                                title="ملاحة"
                                            >
                                                <Navigation className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (navigator.share) {
                                                        navigator.share({
                                                            title: loc.title,
                                                            text: `موقع ${loc.title}`,
                                                            url: `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`
                                                        });
                                                    } else {
                                                        navigator.clipboard.writeText(`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`);
                                                    }
                                                }}
                                                className="p-2 bg-purple-100 text-purple-600 rounded-full hover:bg-purple-200 transition-colors"
                                                title="مشاركة"
                                            >
                                                <Share2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-4">لا توجد مواقع محفوظة</p>
                            )}
                        </div>
                    </div>
                );

            case 'calendar_weekly':
                const startOfWeek = new Date();
                const endOfWeek = new Date();
                endOfWeek.setDate(endOfWeek.getDate() + 7);

                const weeklyTasks = tasks.filter(t => {
                    if (!t.deadline) return false;
                    const d = new Date(t.deadline);
                    return d >= startOfWeek && d <= endOfWeek;
                });

                const weeklyAppointments = appointments.filter(a => {
                    const d = new Date(a.date);
                    return d >= startOfWeek && d <= endOfWeek;
                });

                return (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Calendar className="w-6 h-6 text-purple-500" />
                            <h3 className="font-bold text-lg">أسبوعك القادم</h3>
                        </div>

                        {/* Weekly Tasks Section */}
                        <div className="space-y-2">
                            <div className="bg-blue-50 p-3 rounded-lg flex justify-between items-center">
                                <span className="text-blue-800 font-bold text-sm">مهام الأسبوع القادم</span>
                                <span className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs">{weeklyTasks.length} مهمة</span>
                            </div>

                            {weeklyTasks.length === 0 ? (
                                <p className="text-center text-gray-500 py-4 text-xs">لا يوجد مهام</p>
                            ) : (
                                <div className="space-y-2">
                                    {weeklyTasks.map((task, i) => (
                                        <div
                                            key={i}
                                            onClick={() => { onClose(); const event = new CustomEvent('navigate-tab', { detail: 'productivity' }); window.dispatchEvent(event); }}
                                            className="flex items-center gap-3 p-3 bg-white border rounded-lg shadow-sm cursor-pointer hover:bg-blue-50 transition-colors"
                                        >
                                            <div className={`w-3 h-3 rounded-full ${task.progress === 100 ? 'bg-green-500' : 'bg-gray-300'}`} />
                                            <div className="flex-1">
                                                <p className={`font-bold text-sm ${task.progress === 100 ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</p>
                                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(task.deadline!).toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric' })}
                                                </p>
                                            </div>
                                            <span className={`text-[10px] px-2 py-1 rounded ${task.priority === 'high' ? 'bg-red-100 text-red-600' :
                                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                                                }`}>
                                                {task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'عادية'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Weekly Appointments Section */}
                        <div className="space-y-2">
                            <div className="bg-purple-50 p-3 rounded-lg flex justify-between items-center">
                                <span className="text-purple-800 font-bold text-sm">مواعيد الأسبوع القادم</span>
                                <span className="bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full text-xs">{weeklyAppointments.length} موعد</span>
                            </div>

                            {weeklyAppointments.length === 0 ? (
                                <p className="text-center text-gray-500 py-4 text-xs">لا يوجد مواعيد</p>
                            ) : (
                                <div className="space-y-2">
                                    {weeklyAppointments.map((appt, i) => (
                                        <div
                                            key={i}
                                            onClick={() => { onClose(); const event = new CustomEvent('navigate-tab', { detail: 'appointments' }); window.dispatchEvent(event); }}
                                            className="flex items-center gap-3 p-3 bg-white border rounded-lg shadow-sm cursor-pointer hover:bg-purple-50 transition-colors"
                                        >
                                            <div className="w-1 h-8 bg-purple-500 rounded-full" />
                                            <div className="flex-1">
                                                <p className="font-bold text-sm text-gray-800">{appt.title}</p>
                                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(appt.date).toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric' })}
                                                    <span className="mx-1">|</span>
                                                    {appt.time}
                                                </p>
                                            </div>
                                            {appt.location && (
                                                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> {appt.location}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'prayer':
                return (
                    <div className="space-y-4">
                        <div className="bg-emerald-50 p-4 rounded-lg text-center">
                            <p className="text-emerald-800 font-medium">الصلاة القادمة</p>
                            <h2 className="text-2xl font-bold text-emerald-600 mt-1">{nextPrayer ? nextPrayer.nameAr : '-'}</h2>
                            <p className="text-emerald-700 mt-2 dir-ltr">{timeUntilNext}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-center text-sm">
                            {prayerTimes.filter(p => ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].includes(p.name) || ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(p.name)).map((prayer) => (
                                <div key={prayer.name} className="flex justify-between p-2 bg-gray-50 rounded border border-gray-100">
                                    <span>{prayer.nameAr}</span>
                                    <span className="font-mono font-bold text-primary">{prayer.time.replace(' (WT)', '')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'dashboard': // Home Summary
            case 'home_summary':
                // حساب البيانات للتقرير الشامل
                const todayTasks = tasks.filter(t => t.deadline?.startsWith(todayStr));
                const completedTodayTasks = todayTasks.filter(t => t.progress === 100);
                const todayAppointments = appointments.filter(a => a.date === todayStr);
                const todayExpenses = financeData?.today_expenses || 0;
                const monthlyBudget = financeData?.monthly_budget || 0;
                const currentBalance = financeData?.current_balance || 0;

                // بناء الخط الزمني للأسبوعين القادمين
                const timeline: { date: string; day: string; events: any[] }[] = [];
                for (let i = -1; i <= 14; i++) {
                    const d = new Date();
                    d.setDate(d.getDate() + i);
                    const dateKey = d.toISOString().split('T')[0];
                    const dayName = d.toLocaleDateString('ar', { weekday: 'short' });
                    const dayEvents = [
                        ...appointments.filter(a => a.date === dateKey).map(a => ({ ...a, type: 'appointment' })),
                        ...tasks.filter(t => t.deadline?.startsWith(dateKey)).map(t => ({ ...t, type: 'task' }))
                    ];
                    timeline.push({ date: dateKey, day: dayName, events: dayEvents });
                }

                return (
                    <div className="space-y-4 max-h-[80vh] overflow-y-auto">
                        {/* رأس التقرير */}
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-3 rounded-xl text-white text-center shadow-lg">
                            <h3 className="font-bold text-base whitespace-nowrap">📊 التقرير الاحترافي الشامل</h3>
                            <p className="opacity-90 text-xs mt-1">{today}</p>
                        </div>

                        {/* ملخص اليوم */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 text-center">
                                <span className="text-lg font-bold text-blue-600">{todayTasks.length}</span>
                                <p className="text-[10px] text-gray-600">مهام اليوم</p>
                            </div>
                            <div className="p-2 bg-purple-50 rounded-lg border border-purple-100 text-center">
                                <span className="text-lg font-bold text-purple-600">{todayAppointments.length}</span>
                                <p className="text-[10px] text-gray-600">مواعيد اليوم</p>
                            </div>
                            <div className="p-2 bg-amber-50 rounded-lg border border-amber-100 text-center">
                                <span className="text-lg font-bold text-amber-600">{habits.filter(h => h.history?.[todayStr]).length}/{habits.length}</span>
                                <p className="text-[10px] text-gray-600">العادات المنجزة</p>
                            </div>
                            <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
                                <span className="text-lg font-bold text-emerald-600">{currentBalance}</span>
                                <p className="text-[10px] text-gray-600">الرصيد الحالي</p>
                            </div>
                        </div>

                        {/* قسم المالية */}
                        <div className="bg-white rounded-xl border p-3">
                            <h4 className="font-bold text-sm text-gray-700 mb-2">💰 الملخص المالي</h4>
                            {financeData ? <FinancialTrendChart financeData={financeData} /> : <p className="text-xs text-gray-400 text-center">لا توجد بيانات مالية</p>}
                        </div>

                        {/* قسم الإنتاجية */}
                        <div className="bg-white rounded-xl border p-3">
                            <h4 className="font-bold text-sm text-gray-700 mb-2">📈 الإنتاجية</h4>
                            <div className="h-[180px] w-full">
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={productivityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} innerRadius={20}>
                                            {productivityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip />
                                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* الخط الزمني */}
                        <div className="bg-white rounded-xl border p-3">
                            <h4 className="font-bold text-sm text-gray-700 mb-2">📅 الجدول الزمني</h4>
                            <div className="space-y-2 max-h-[250px] overflow-y-auto">
                                {timeline.map((day, idx) => (
                                    <div key={idx} className={`p-2 rounded-lg ${day.date === todayStr ? 'bg-emerald-100 border-2 border-emerald-400' : idx === 0 ? 'bg-gray-100' : 'bg-gray-50'}`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-sm">{day.day} {new Date(day.date).getDate()}/{new Date(day.date).getMonth() + 1}</span>
                                            <span className="text-xs bg-white px-2 py-0.5 rounded">{day.events.length} حدث</span>
                                        </div>
                                        {day.events.length > 0 ? (
                                            <div className="space-y-1">
                                                {day.events.slice(0, 3).map((ev: any, i: number) => (
                                                    <div key={i} className={`text-xs p-1 rounded ${ev.type === 'appointment' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {ev.type === 'appointment' ? '📍' : '✅'} {ev.title}
                                                    </div>
                                                ))}
                                                {day.events.length > 3 && <p className="text-xs text-gray-400">+{day.events.length - 3} أخرى</p>}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-400">لا أحداث</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* الصلاة القادمة */}
                        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                            <p className="text-xs text-emerald-600 mb-1">🕌 الصلاة القادمة</p>
                            <div className="flex justify-between items-center">
                                <p className="font-bold text-emerald-800 text-lg">{nextPrayer ? nextPrayer.nameAr : '...'}</p>
                                <p className="text-sm text-emerald-700 font-mono">{timeUntilNext}</p>
                            </div>
                        </div>

                        {/* زر المشاركة */}
                        <Button
                            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                            onClick={async () => {
                                const reportText = `📊 تقرير ${today}\n✅ مهام: ${completedTodayTasks.length}/${todayTasks.length}\n📅 مواعيد: ${todayAppointments.length}\n🎯 عادات: ${habits.filter(h => h.history?.[todayStr]).length}/${habits.length}\n💰 الرصيد: ${currentBalance}`;
                                if (navigator.share) {
                                    try {
                                        await navigator.share({
                                            title: 'تقريري اليومي - تطبيق البركة',
                                            text: reportText,
                                        });
                                    } catch (e) { console.log('Share cancelled'); }
                                } else {
                                    // Fallback: copy to clipboard
                                    try {
                                        await navigator.clipboard.writeText(reportText);
                                        alert('✅ تم نسخ التقرير للحافظة');
                                    } catch (e) { console.log('Copy failed'); }
                                }
                            }}
                        >
                            📤 مشاركة التقرير
                        </Button>
                    </div>
                );

            default:
                return <p>...</p>;
        }
    };

    const getTitle = () => {
        switch (type) {
            case 'mohamed': return 'التقرير المالي';
            case 'fatima': return 'تقرير الإنتاجية';
            case 'dashboard': return 'ملخص اليوم';
            case 'prayer': return 'مواقيت الصلاة';
            case 'map': return 'المواقع المحفوظة';

            case 'home_summary': return 'الملخص الشامل';
            case 'calendar_weekly': return 'مهام الأسبوع';
            default: return '';
        }
    };

    // Prevent empty popup for settings/sync actions (Toast only)
    if (type === 'settings' || type === 'settings_sync') return null;

    return (
        <Dialog open={!!type} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[90%] sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="text-center arabic-title text-xl text-primary">
                        {getTitle()}
                    </DialogTitle>
                </DialogHeader>
                {renderContent()}
            </DialogContent>
        </Dialog>
    );
};

export default NavSummaryDialogs;
