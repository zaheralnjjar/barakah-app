import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { useHabits } from '@/hooks/useHabits';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useLocations } from '@/hooks/useLocations';
import FinancialTrendChart from '@/components/FinancialTrendChart';
import { Loader2, CheckSquare, Target, MapPin } from 'lucide-react';
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
