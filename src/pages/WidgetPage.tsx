import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardParking } from '@/components/dashboard/widgets/DashboardParking';
import { DashboardShopping } from '@/components/dashboard/widgets/DashboardShopping';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { useDashboardData } from '@/hooks/useDashboardData';
import DashboardCalendar from '@/components/dashboard/DashboardCalendar';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { useHabits } from '@/hooks/useHabits';
import { useMedications } from '@/hooks/useMedications';
import { useState } from 'react';

export const WidgetPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const typeParam = searchParams.get('type') || '';
    const types = typeParam.split(',').filter(Boolean);
    const [weekStartDate, setWeekStartDate] = useState(new Date());

    const {
        financeData,
        dailyLimitARS,
        prayerTimes,
        refetch
    } = useDashboardData();

    const todayStr = new Date().toISOString().split('T')[0];
    const todayExpense = financeData?.pending_expenses
        ?.filter((t: any) => t.type === 'expense' && t.timestamp && t.timestamp.startsWith(todayStr))
        .reduce((sum: number, t: any) => sum + (t.currency === 'ARS' ? t.amount : t.amount * (financeData?.exchange_rate || 1200)), 0) || 0;

    const { tasks } = useTasks();
    const { appointments } = useAppointments();
    const { habits } = useHabits();
    const { medications } = useMedications();

    const renderWidget = (type: string) => {
        switch (type) {
            case 'finance':
                return <DashboardStats key={type} financeData={financeData} dailyLimitARS={dailyLimitARS} todayExpense={todayExpense} onNavigateToFinance={() => { }} />;
            case 'shopping':
                return <DashboardShopping key={type} />;
            case 'parking':
            case 'locations':
                return <DashboardParking key={type} />;
            case 'tasks':
            case 'appointments':
            case 'calendar':
                return (
                    <DashboardCalendar
                        key={type}
                        tasks={tasks}
                        appointments={appointments}
                        habits={habits}
                        medications={medications}
                        prayerTimes={prayerTimes}
                        refetch={refetch}
                        onNavigateToTab={() => { }}
                        weekStartDate={weekStartDate}
                        setWeekStartDate={setWeekStartDate}
                    />
                );
            default:
                return (
                    <div key={type} className="p-4 bg-white rounded-xl border border-dashed text-center text-gray-400 text-xs">
                        أداة {type} قيد التطوير
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-transparent p-2 space-y-4 overflow-x-hidden">
            {types.length > 0 ? (
                types.map(renderWidget)
            ) : (
                <div className="flex items-center justify-center min-h-[200px] text-gray-400 text-sm">
                    لا توجد أدوات محددة
                </div>
            )}
        </div>
    );
};

export default WidgetPage;
