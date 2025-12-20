import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/stores/useAppStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, CheckCircle2, DollarSign, MapPin } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export const AnalyticsDashboard = () => {
    const tasks = useAppStore(s => s.tasks);
    const finances = useAppStore(s => s.finances);
    const locations = useAppStore(s => s.locations);
    const appointments = useAppStore(s => s.appointments);

    // Calculate statistics
    const stats = useMemo(() => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Tasks
        const completedThisWeek = tasks.filter(
            t => t.completed && new Date(t.updatedAt) >= weekAgo
        ).length;

        const totalCompleted = tasks.filter(t => t.completed).length;
        const completionRate = tasks.length > 0
            ? Math.round((totalCompleted / tasks.length) * 100)
            : 0;

        // Finances
        const monthlyExpenses = finances.expenses
            .filter(e => new Date(e.date) >= monthAgo)
            .reduce((sum, e) => sum + e.amount, 0);

        const monthlyIncome = finances.income
            .filter(i => new Date(i.date) >= monthAgo)
            .reduce((sum, i) => sum + i.amount, 0);

        // Appointments
        const upcomingAppointments = appointments.filter(
            a => !a.isCompleted && new Date(a.date) >= now
        ).length;

        return {
            completedThisWeek,
            completionRate,
            monthlyExpenses,
            monthlyIncome,
            totalLocations: locations.length,
            upcomingAppointments,
        };
    }, [tasks, finances, locations, appointments]);

    // Task distribution by priority
    const tasksByPriority = useMemo(() => {
        const distribution = {
            high: 0,
            medium: 0,
            low: 0,
        };

        tasks.forEach(t => {
            if (!t.completed) {
                distribution[t.priority]++;
            }
        });

        return [
            { name: 'عالية', value: distribution.high },
            { name: 'متوسطة', value: distribution.medium },
            { name: 'منخفضة', value: distribution.low },
        ];
    }, [tasks]);

    // Weekly task completion trend
    const weeklyTrend = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return date.toISOString().split('T')[0];
        });

        return last7Days.map(day => {
            const completed = tasks.filter(
                t => t.completed && t.updatedAt.startsWith(day)
            ).length;

            return {
                day: new Date(day).toLocaleDateString('ar-EG', { weekday: 'short' }),
                completed,
            };
        });
    }, [tasks]);

    return (
        <div className="space-y-6 p-6">
            <h2 className="text-2xl font-bold">📊 لوحة الإحصائيات</h2>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">مهام الأسبوع</p>
                                <p className="text-3xl font-bold text-blue-600">{stats.completedThisWeek}</p>
                            </div>
                            <CheckCircle2 className="w-12 h-12 text-blue-600 opacity-20" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">نسبة الإنجاز</p>
                                <p className="text-3xl font-bold text-green-600">{stats.completionRate}%</p>
                            </div>
                            <TrendingUp className="w-12 h-12 text-green-600 opacity-20" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">مصروفات الشهر</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {stats.monthlyExpenses.toLocaleString()}
                                </p>
                            </div>
                            <DollarSign className="w-12 h-12 text-red-600 opacity-20" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">أماكن محفوظة</p>
                                <p className="text-3xl font-bold text-purple-600">{stats.totalLocations}</p>
                            </div>
                            <MapPin className="w-12 h-12 text-purple-600 opacity-20" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Completion Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle>اتجاه إنجاز المهام (آخر 7 أيام)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={weeklyTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="completed" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Financial Trend - NEW */}
                <Card>
                    <CardHeader>
                        <CardTitle>اتجاه المالية (آخر 7 أيام)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={weeklyTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Second Row Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Tasks by Priority */}
                <Card>
                    <CardHeader>
                        <CardTitle>توزيع المهام حسب الأولوية</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={tasksByPriority}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => `${entry.name}: ${entry.value}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {tasksByPriority.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Info */}
            <Card>
                <CardHeader>
                    <CardTitle>معلومات إضافية</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <p className="text-gray-500 text-sm">دخل الشهر</p>
                            <p className="text-xl font-semibold text-green-600">
                                {stats.monthlyIncome.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">الرصيد الحالي</p>
                            <p className="text-xl font-semibold">
                                {finances.balance.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">مواعيد قادمة</p>
                            <p className="text-xl font-semibold text-blue-600">
                                {stats.upcomingAppointments}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">إجمالي المهام</p>
                            <p className="text-xl font-semibold">
                                {tasks.length}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
