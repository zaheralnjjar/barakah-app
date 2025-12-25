import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { useHabits } from '@/hooks/useHabits';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useLocations } from '@/hooks/useLocations';
import FinancialTrendChart from '@/components/FinancialTrendChart';
import { Loader2, CheckSquare, Target, MapPin, Moon, Calendar, Calculator } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

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
        if (type === 'mohamed') {
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

            case 'dashboard': // Home Summary
                const today = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                const nextAppt = appointments
                    .filter(a => {
                        const apptDate = new Date(`${a.date}T${a.time}`);
                        return apptDate > new Date();
                    })
                    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())[0];

                const todayStr = new Date().toISOString().split('T')[0];

                return (
                    <div className="space-y-4 text-center">
                        <div className="bg-primary/10 p-4 rounded-lg">
                            <h3 className="font-bold text-primary text-lg">{today}</h3>
                            <p className="text-sm text-gray-600 mt-1">ملخص يومك</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <CheckSquare className="w-4 h-4 text-blue-500" />
                                    <span>المهام المتبقية</span>
                                </div>
                                <span className="font-bold">{tasks.filter(t => t.progress < 100).length}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4 text-amber-500" />
                                    <span>الأهداف المعلقة</span>
                                </div>
                                <span className="font-bold">{habits.filter(h => !(h.history && h.history[todayStr])).length}</span>
                            </div>
                            {nextAppt && (
                                <div className="bg-purple-50 p-3 rounded-lg text-right">
                                    <p className="text-xs text-purple-600 mb-1">الموعد التالي:</p>
                                    <p className="font-bold text-purple-800">{nextAppt.title}</p>
                                    <p className="text-sm text-purple-700">{nextAppt.time} - {nextAppt.location || 'بدون موقع'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'prayer': // Prayer Times
                if (!prayerTimes) return <Loader2 className="animate-spin mx-auto" />;
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

            case 'map': // Saved Locations
                return (
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                        {locations.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">لا توجد مواقع محفوظة</p>
                        ) : (
                            locations.map((loc) => (
                                <div key={loc.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <MapPin className="w-5 h-5 text-red-500 mt-1 shrink-0" />
                                    <div>
                                        <p className="font-bold text-gray-800">{loc.title}</p>
                                        <p className="text-xs text-gray-500 line-clamp-2">{loc.address}</p>
                                        {loc.category && (
                                            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-gray-200 rounded-full text-gray-600">
                                                {loc.category}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                );

            case 'home_summary': // General Summary (All Sections) requested by user
                const todaySummary = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                const nextApptSummary = appointments
                    .filter(a => {
                        const apptDate = new Date(`${a.date}T${a.time}`);
                        return apptDate > new Date();
                    })
                    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())[0];

                const financeBal = financeData?.current_balance || '---';

                return (
                    <div className="space-y-4">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-xl text-white text-center shadow-lg">
                            <h3 className="font-bold text-lg">{todaySummary}</h3>
                            <p className="opacity-90 text-sm mt-1">تقرير شامل</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                                <h4 className="font-bold text-emerald-800 text-sm mb-2 flex items-center gap-2">
                                    <Moon className="w-3 h-3" /> الصلاة القادمة
                                </h4>
                                <div className="text-center">
                                    <span className="block text-xl font-bold text-emerald-600">{nextPrayer ? nextPrayer.nameAr : '-'}</span>
                                    <span className="text-xs text-emerald-500 dir-ltr">{timeUntilNext}</span>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                                <h4 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-2">
                                    <CheckSquare className="w-3 h-3" /> المهام
                                </h4>
                                <div className="flex justify-around text-center">
                                    <div>
                                        <span className="block text-lg font-bold text-blue-600">{tasks.filter(t => t.progress === 100).length}</span>
                                        <span className="text-[10px] text-blue-400">منجز</span>
                                    </div>
                                    <div>
                                        <span className="block text-lg font-bold text-red-500">{tasks.filter(t => t.progress < 100).length}</span>
                                        <span className="text-[10px] text-red-400">متبقي</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                                <h4 className="font-bold text-purple-800 text-sm mb-2 flex items-center gap-2">
                                    <Calendar className="w-3 h-3" /> الموعد القادم
                                </h4>
                                {nextApptSummary ? (
                                    <div className="text-sm">
                                        <p className="font-bold text-purple-700 truncate">{nextApptSummary.title}</p>
                                        <p className="text-xs text-purple-500 font-mono">{nextApptSummary.time}</p>
                                    </div>
                                ) : (
                                    <p className="text-xs text-center text-purple-400 py-2">لا توجد مواعيد</p>
                                )}
                            </div>

                            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                                <h4 className="font-bold text-amber-800 text-sm mb-2 flex items-center gap-2">
                                    <Calculator className="w-3 h-3" /> الرصيد
                                </h4>
                                <div className="text-center">
                                    <span className="block text-lg font-bold text-amber-600 font-mono">{financeBal}</span>
                                    <span className="text-[10px] text-amber-400">ريال</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'calendar_weekly': // Weekly Tasks & Appointments
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
                                        <div key={i} className="flex items-center gap-3 p-3 bg-white border rounded-lg shadow-sm">
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
                                        <div key={i} className="flex items-center gap-3 p-3 bg-white border rounded-lg shadow-sm">
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

            default:
                return null;
        }
    };

    const getTitle = () => {
        switch (type) {
            case 'mohamed': return 'التقرير المالي';
            case 'fatima': return 'تقرير الإنتاجية';
            case 'dashboard': return 'ملخص اليوم';
            case 'prayer': return 'مواقيت الصلاة';
            case 'map': return 'المواقع المحفوظة';
            case 'settings': return 'الإعدادات';
            case 'home_summary': return 'الملخص الشامل';
            case 'calendar_weekly': return 'مهام الأسبوع';
            default: return '';
        }
    };

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
