import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface FinanceData {
    pending_expenses?: Array<{
        amount: number;
        type: 'expense' | 'income';
        timestamp: string;
        currency: string;
    }>;
    exchange_rate?: number;
}

interface FinancialTrendChartProps {
    financeData: FinanceData;
}

const FinancialTrendChart: React.FC<FinancialTrendChartProps> = ({ financeData }) => {
    const chartData = useMemo(() => {
        if (!financeData?.pending_expenses) return [];

        // آخر 7 أيام
        const days = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dayName = date.toLocaleDateString('ar-EG', { weekday: 'long' });
            const dateKey = date.toISOString().split('T')[0];

            // حساب المصروفات والدخل لهذا اليوم
            const dayTransactions = financeData.pending_expenses.filter(t => {
                const transactionDate = new Date(t.timestamp).toISOString().split('T')[0];
                return transactionDate === dateKey;
            });

            const expenses = dayTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + (t.currency === 'ARS' ? t.amount : t.amount * (financeData.exchange_rate || 1200)), 0);

            const income = dayTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + (t.currency === 'ARS' ? t.amount : t.amount * (financeData.exchange_rate || 1200)), 0);

            days.push({
                day: dayName,
                مصروفات: Math.round(expenses),
                دخل: Math.round(income),
                صافي: Math.round(income - expenses),
            });
        }

        return days;
    }, [financeData]);

    const totals = useMemo(() => {
        return chartData.reduce((acc, day) => ({
            expenses: acc.expenses + day.مصروفات,
            income: acc.income + day.دخل,
            net: acc.net + day.صافي,
        }), { expenses: 0, income: 0, net: 0 });
    }, [chartData]);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="arabic-title flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        اتجاه المالية (آخر 7 أيام)
                    </CardTitle>
                    <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1">
                            <TrendingDown className="w-4 h-4 text-red-500" />
                            <span className="text-red-600 font-semibold">
                                {totals.expenses.toLocaleString()} ARS
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="text-green-600 font-semibold">
                                {totals.income.toLocaleString()} ARS
                            </span>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey="day"
                            tick={{ fontSize: 12 }}
                            stroke="#6b7280"
                        />
                        <YAxis
                            tick={{ fontSize: 12 }}
                            stroke="#6b7280"
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                        />
                        <Legend
                            wrapperStyle={{ fontSize: '12px' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="مصروفات"
                            stroke="#ef4444"
                            strokeWidth={2}
                            dot={{ fill: '#ef4444', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="دخل"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ fill: '#10b981', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="صافي"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: '#3b82f6', r: 3 }}
                        />
                    </LineChart>
                </ResponsiveContainer>

                {/* Summary Stats */}
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-red-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">إجمالي المصروفات</p>
                        <p className="text-lg font-bold text-red-600">
                            {totals.expenses.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">ARS</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">إجمالي الدخل</p>
                        <p className="text-lg font-bold text-green-600">
                            {totals.income.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">ARS</p>
                    </div>
                    <div className={`p-3 rounded-lg ${totals.net >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                        <p className="text-xs text-gray-600 mb-1">الصافي</p>
                        <p className={`text-lg font-bold ${totals.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                            {totals.net > 0 ? '+' : ''}{totals.net.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">ARS</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default FinancialTrendChart;
