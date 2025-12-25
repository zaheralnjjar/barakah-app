import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { PieChartIcon, BarChart3 } from 'lucide-react';

interface Transaction {
    amount: number;
    type: 'expense' | 'income';
    category?: string;
    timestamp: string;
    currency: string;
}

interface CategoryExpenseChartProps {
    transactions: Transaction[];
    exchangeRate?: number;
}

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
    'طعام': '#ef4444',
    'مواصلات': '#f97316',
    'تسوق': '#eab308',
    'فواتير': '#22c55e',
    'ترفيه': '#06b6d4',
    'صحة': '#3b82f6',
    'تعليم': '#8b5cf6',
    'أخرى': '#ec4899',
    'إيجار': '#6366f1',
    'اشتراكات': '#14b8a6',
};

const DEFAULT_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

const CategoryExpenseChart: React.FC<CategoryExpenseChartProps> = ({ transactions, exchangeRate = 1200 }) => {
    const [chartType, setChartType] = React.useState<'pie' | 'bar'>('pie');

    const categoryData = useMemo(() => {
        if (!transactions?.length) return [];

        // Filter only expenses
        const expenses = transactions.filter(t => t.type === 'expense');

        // Group by category
        const categoryMap: Record<string, number> = {};
        expenses.forEach(t => {
            const cat = t.category || 'أخرى';
            const amountARS = t.currency === 'ARS' ? t.amount : t.amount * exchangeRate;
            categoryMap[cat] = (categoryMap[cat] || 0) + amountARS;
        });

        // Convert to array and sort
        return Object.entries(categoryMap)
            .map(([name, value], idx) => ({
                name,
                value: Math.round(value),
                color: CATEGORY_COLORS[name] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]
            }))
            .sort((a, b) => b.value - a.value);
    }, [transactions, exchangeRate]);

    const total = useMemo(() => categoryData.reduce((sum, c) => sum + c.value, 0), [categoryData]);

    if (!categoryData.length) {
        return (
            <Card className="border-orange-200">
                <CardContent className="py-8 text-center text-gray-500">
                    <PieChartIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>لا توجد مصروفات لعرض التوزيع</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="arabic-title flex items-center gap-2 text-orange-700">
                        <PieChartIcon className="w-5 h-5" />
                        توزيع المصروفات حسب الفئة
                    </CardTitle>
                    <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm">
                        <button
                            onClick={() => setChartType('pie')}
                            className={`p-1.5 rounded-md transition-colors ${chartType === 'pie' ? 'bg-orange-100 text-orange-700' : 'text-gray-400'}`}
                        >
                            <PieChartIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setChartType('bar')}
                            className={`p-1.5 rounded-md transition-colors ${chartType === 'bar' ? 'bg-orange-100 text-orange-700' : 'text-gray-400'}`}
                        >
                            <BarChart3 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'pie' ? (
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={90}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => [`${value.toLocaleString()} ARS`, 'المبلغ']}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                />
                            </PieChart>
                        ) : (
                            <BarChart data={categoryData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis type="number" tick={{ fontSize: 11 }} />
                                <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 11 }} />
                                <Tooltip
                                    formatter={(value: number) => [`${value.toLocaleString()} ARS`, 'المبلغ']}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>

                {/* Category Legend with Amounts */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                    {categoryData.slice(0, 6).map((cat, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-white/80 rounded-lg p-2 text-sm">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                            <span className="truncate flex-1 font-medium">{cat.name}</span>
                            <span className="text-xs text-gray-600 font-mono">{cat.value.toLocaleString()}</span>
                        </div>
                    ))}
                </div>

                {/* Total */}
                <div className="mt-3 text-center p-2 bg-white/60 rounded-lg border border-orange-100">
                    <span className="text-sm text-gray-600">إجمالي المصروفات: </span>
                    <span className="font-bold text-orange-700">{total.toLocaleString()} ARS</span>
                </div>
            </CardContent>
        </Card>
    );
};

export default CategoryExpenseChart;
