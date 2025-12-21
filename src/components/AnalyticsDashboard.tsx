import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, CheckCircle2, DollarSign, MapPin, Calendar, Loader2 } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export const AnalyticsDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        transactionCount: 0,
        appointmentCount: 0,
        completedAppointments: 0,
        locationCount: 0,
    });
    const [financeByCategory, setFinanceByCategory] = useState<any[]>([]);
    const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) return;

            // Get finance data
            const { data: financeData } = await supabase
                .from('finance_data_2025_12_18_18_42')
                .select('pending_expenses')
                .eq('user_id', user.id)
                .single();

            const transactions = financeData?.pending_expenses || [];

            let totalIncome = 0;
            let totalExpense = 0;
            const categoryMap: Record<string, number> = {};

            transactions.forEach((t: any) => {
                if (t.type === 'income') {
                    totalIncome += t.amount || 0;
                } else {
                    totalExpense += t.amount || 0;
                    const cat = t.category || 'أخرى';
                    categoryMap[cat] = (categoryMap[cat] || 0) + (t.amount || 0);
                }
            });

            // Get appointments
            const { data: appointments } = await supabase
                .from('appointments')
                .select('*')
                .eq('user_id', user.id);

            const appts = appointments || [];
            const completedAppts = appts.filter((a: any) => a.is_completed).length;

            // Get saved locations
            const locations = JSON.parse(localStorage.getItem('baraka_resources') || '[]');

            // Category data for pie chart
            const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
                name,
                value
            })).slice(0, 5);

            // Weekly trend (last 7 days expenses)
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - i));
                return date.toISOString().split('T')[0];
            });

            const trendData = last7Days.map(day => {
                const dayExpense = transactions
                    .filter((t: any) => t.timestamp?.startsWith(day) && t.type === 'expense')
                    .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

                return {
                    day: new Date(day).toLocaleDateString('ar-EG', { weekday: 'short' }),
                    مصروفات: dayExpense,
                };
            });

            setStats({
                totalIncome,
                totalExpense,
                balance: totalIncome - totalExpense,
                transactionCount: transactions.length,
                appointmentCount: appts.length,
                completedAppointments: completedAppts,
                locationCount: locations.length,
            });
            setFinanceByCategory(categoryData);
            setWeeklyTrend(trendData);

        } catch (e) {
            console.error('Analytics error:', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4">
            <h2 className="text-2xl font-bold text-center">📊 لوحة الإحصائيات</h2>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="pt-4 pb-3">
                        <div className="text-center">
                            <p className="text-xs text-gray-500">إجمالي الدخل</p>
                            <p className="text-xl font-bold text-green-600">{stats.totalIncome.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100">
                    <CardContent className="pt-4 pb-3">
                        <div className="text-center">
                            <p className="text-xs text-gray-500">إجمالي المصروفات</p>
                            <p className="text-xl font-bold text-red-600">{stats.totalExpense.toLocaleString()}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="pt-4 pb-3">
                        <div className="text-center">
                            <p className="text-xs text-gray-500">الرصيد</p>
                            <p className={`text-xl font-bold ${stats.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {stats.balance.toLocaleString()}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="pt-4 pb-3">
                        <div className="text-center">
                            <p className="text-xs text-gray-500">المواعيد</p>
                            <p className="text-xl font-bold text-purple-600">
                                {stats.completedAppointments}/{stats.appointmentCount}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Weekly Expense Trend */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">📈 المصروفات - آخر 7 أيام</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={weeklyTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Bar dataKey="مصروفات" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Expense by Category */}
            {financeByCategory.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">🥧 توزيع المصروفات</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={financeByCategory}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => `${entry.name}`}
                                    outerRadius={70}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {financeByCategory.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Summary */}
            <Card>
                <CardContent className="pt-4">
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div>
                            <p className="text-gray-500">المعاملات</p>
                            <p className="font-bold">{stats.transactionCount}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">المواقع</p>
                            <p className="font-bold">{stats.locationCount}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">المواعيد المكتملة</p>
                            <p className="font-bold text-green-600">{stats.completedAppointments}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
