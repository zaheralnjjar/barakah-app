import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    BarChart,
    Bar
} from 'recharts';

interface ExpenseChartProps {
    expenses: Array<{
        id: number;
        amount: number;
        currency: string;
        type: string;
        description: string;
        timestamp: string;
    }>;
    exchangeRate: number;
}

const COLORS = ['#16a34a', '#2563eb', '#dc2626', '#ea580c', '#7c3aed', '#db2777', '#0891b2', '#65a30d'];

const ExpenseChart: React.FC<ExpenseChartProps> = ({ expenses, exchangeRate }) => {
    // Process expenses for pie chart (by category)
    const categoryData = expenses.reduce((acc: { [key: string]: number }, exp) => {
        const category = categorizeExpense(exp.description);
        const amountInARS = exp.currency === 'USD' ? exp.amount * exchangeRate : exp.amount;
        acc[category] = (acc[category] || 0) + amountInARS;
        return acc;
    }, {});

    const pieData = Object.entries(categoryData).map(([name, value]) => ({
        name,
        value: Math.round(value),
    }));

    // Process expenses for line chart (daily)
    const dailyData = expenses.reduce((acc: { [key: string]: number }, exp) => {
        const date = new Date(exp.timestamp).toLocaleDateString('ar-EG', { day: '2-digit', month: 'short' });
        const amountInARS = exp.currency === 'USD' ? exp.amount * exchangeRate : exp.amount;
        if (exp.type === 'expense') {
            acc[date] = (acc[date] || 0) + amountInARS;
        }
        return acc;
    }, {});

    const lineData = Object.entries(dailyData)
        .slice(-7)
        .map(([date, amount]) => ({
            date,
            مصروفات: Math.round(amount),
        }));

    // Calculate totals
    const totalExpenses = expenses
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + (e.currency === 'USD' ? e.amount * exchangeRate : e.amount), 0);

    const totalIncome = expenses
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + (e.currency === 'USD' ? e.amount * exchangeRate : e.amount), 0);

    const barData = [
        { name: 'الدخل', قيمة: Math.round(totalIncome), fill: '#16a34a' },
        { name: 'المصروفات', قيمة: Math.round(totalExpenses), fill: '#dc2626' },
    ];

    if (!expenses || expenses.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6 text-center">
                    <p className="arabic-body text-muted-foreground">لا توجد معاملات لعرض الرسوم البيانية</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Bar Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="arabic-title text-lg">ملخص الدخل والمصروفات</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={barData} layout="vertical">
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={80} />
                            <Tooltip
                                formatter={(value: number) => [`${value.toLocaleString('ar-EG')} ARS`, '']}
                                contentStyle={{ direction: 'rtl' }}
                            />
                            <Bar dataKey="قيمة" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pie Chart - Expenses by Category */}
                <Card>
                    <CardHeader>
                        <CardTitle className="arabic-title text-lg">المصروفات حسب الفئة</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => [`${value.toLocaleString('ar-EG')} ARS`, '']} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Line Chart - Daily Expenses */}
                <Card>
                    <CardHeader>
                        <CardTitle className="arabic-title text-lg">المصروفات اليومية</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={lineData}>
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => [`${value.toLocaleString('ar-EG')} ARS`, 'المصروفات']} />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="مصروفات"
                                    stroke="#16a34a"
                                    strokeWidth={3}
                                    dot={{ fill: '#16a34a', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

// Helper function to categorize expenses based on description
function categorizeExpense(description: string): string {
    const lower = description.toLowerCase();
    if (lower.includes('طعام') || lower.includes('أكل') || lower.includes('مطعم') || lower.includes('سوبر')) {
        return 'طعام';
    }
    if (lower.includes('مواصلات') || lower.includes('باص') || lower.includes('تاكسي') || lower.includes('نقل')) {
        return 'مواصلات';
    }
    if (lower.includes('صحة') || lower.includes('دواء') || lower.includes('طبيب') || lower.includes('مستشفى')) {
        return 'صحة';
    }
    if (lower.includes('تعليم') || lower.includes('كتاب') || lower.includes('دراسة')) {
        return 'تعليم';
    }
    if (lower.includes('إيجار') || lower.includes('سكن') || lower.includes('كهرباء') || lower.includes('ماء') || lower.includes('غاز')) {
        return 'سكن';
    }
    if (lower.includes('ملابس') || lower.includes('لبس')) {
        return 'ملابس';
    }
    return 'أخرى';
}

export default ExpenseChart;
