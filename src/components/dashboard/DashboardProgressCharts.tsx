import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/stores/useAppStore';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts';
import { Target, TrendingUp, CheckCircle2, Flame, CalendarCheck } from 'lucide-react';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899'];
const HABIT_COLORS = ['#8b5cf6', '#06b6d4', '#f97316', '#84cc16', '#f43f5e'];

const DashboardProgressCharts: React.FC = () => {
    const { tasks: storeTasks } = useAppStore();
    const { tasks: hookTasks } = useTasks();
    const { habits } = useHabits();

    const tasks = hookTasks || storeTasks || [];
    const todayStr = new Date().toISOString().split('T')[0];

    // Calculate task statistics
    const completedTasks = tasks.filter(t => t.progress === 100).length;
    const pendingTasks = tasks.filter(t => t.progress < 100 && t.progress > 0).length;
    const notStartedTasks = tasks.filter(t => t.progress === 0).length;
    const totalTasks = tasks.length;

    const taskData = [
        { name: 'مكتمل', value: completedTasks, color: '#10b981' },
        { name: 'جاري', value: pendingTasks, color: '#f59e0b' },
        { name: 'لم يبدأ', value: notStartedTasks, color: '#e5e7eb' },
    ].filter(d => d.value > 0);

    // Calculate habit streaks/completion for the week
    const weekDays = ['أحد', 'اثن', 'ثلث', 'أرب', 'خمس', 'جمع', 'سبت'];
    const habitWeekData = weekDays.map((day, idx) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - idx));
        const dateStr = date.toISOString().split('T')[0];

        const completedCount = habits?.filter(h =>
            h.history?.[dateStr]
        ).length || 0;

        return {
            name: day,
            completed: completedCount,
            total: habits?.length || 0,
        };
    });

    // Calculate overall completion percentage
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const todayHabitsCompleted = habits?.filter(h =>
        h.history?.[todayStr]
    ).length || 0;
    const habitCompletionRate = habits?.length > 0 ? Math.round((todayHabitsCompleted / habits.length) * 100) : 0;

    // If no data, show placeholder
    if (totalTasks === 0 && (!habits || habits.length === 0)) {
        return (
            <Card className="border-purple-100 shadow-sm">
                <CardContent className="p-4 text-center text-gray-500">
                    <Target className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">أضف مهام وعادات لرؤية التقدم</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-indigo-100 shadow-sm bg-gradient-to-br from-indigo-50/30 to-purple-50/30">
            <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-full bg-indigo-100">
                        <TrendingUp className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h3 className="font-bold text-gray-700 text-sm">تقدم الأداء</h3>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Task Completion Circle */}
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500">المهام</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="relative">
                            <ResponsiveContainer width="100%" height={80}>
                                <PieChart>
                                    <Pie
                                        data={taskData.length > 0 ? taskData : [{ name: 'فارغ', value: 1, color: '#e5e7eb' }]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={25}
                                        outerRadius={35}
                                        dataKey="value"
                                        strokeWidth={0}
                                    >
                                        {taskData.map((entry, index) => (
                                            <Cell key={index} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-lg font-bold text-emerald-600">{taskCompletionRate}%</span>
                            </div>
                        </div>
                        <p className="text-center text-[10px] text-gray-500 mt-1">
                            {completedTasks}/{totalTasks} مكتمل
                        </p>
                    </div>

                    {/* Habit Completion Circle */}
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500">العادات اليوم</span>
                            <Flame className="w-4 h-4 text-orange-500" />
                        </div>
                        <div className="relative">
                            <ResponsiveContainer width="100%" height={80}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            { value: todayHabitsCompleted, color: '#f97316' },
                                            { value: Math.max(0, (habits?.length || 0) - todayHabitsCompleted), color: '#fed7aa' },
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={25}
                                        outerRadius={35}
                                        dataKey="value"
                                        strokeWidth={0}
                                    >
                                        <Cell fill="#f97316" />
                                        <Cell fill="#fed7aa" />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-lg font-bold text-orange-600">{habitCompletionRate}%</span>
                            </div>
                        </div>
                        <p className="text-center text-[10px] text-gray-500 mt-1">
                            {todayHabitsCompleted}/{habits?.length || 0} منجز
                        </p>
                    </div>
                </div>

                {/* Weekly Habit Bar Chart */}
                {habits && habits.length > 0 && (
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <CalendarCheck className="w-4 h-4 text-purple-500" />
                            <span className="text-xs text-gray-600 font-medium">العادات الأسبوعية</span>
                        </div>
                        <ResponsiveContainer width="100%" height={80}>
                            <BarChart data={habitWeekData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 9, fill: '#9ca3af' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white p-2 rounded shadow-lg border text-xs">
                                                    <p className="text-gray-600">{payload[0].payload.completed} من {payload[0].payload.total}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar
                                    dataKey="completed"
                                    fill="#8b5cf6"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={20}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Quick Legend */}
                <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-gray-500">
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>مكتمل</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        <span>العادات</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        <span>الأسبوع</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default DashboardProgressCharts;
