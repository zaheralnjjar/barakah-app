import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'يناير', income: 4000, expense: 2400 },
    { name: 'فبراير', income: 3000, expense: 1398 },
    { name: 'مارس', income: 2000, expense: 9800 },
    { name: 'أبريل', income: 2780, expense: 3908 },
    { name: 'مايو', income: 1890, expense: 4800 },
    { name: 'يونيو', income: 2390, expense: 3800 },
    { name: 'يوليو', income: 3490, expense: 4300 },
];

const FinanceReport = () => {
    return (
        <div className="space-y-6 animate-fade-in text-right" dir="rtl">
            <h2 className="text-2xl font-bold text-gray-800">التقرير المالي العام</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">إجمالي الدخل (السنوي)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">+45,231.89 $</div>
                        <p className="text-xs text-muted-foreground">+20.1% من الشهر الماضي</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">إجمالي المصروفات</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">-12,340.00 $</div>
                        <p className="text-xs text-muted-foreground">+4% من الشهر الماضي</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">صافي الوفر</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">32,891.89 $</div>
                        <p className="text-xs text-muted-foreground">معدل ادخار 72%</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="h-[400px]">
                <CardHeader>
                    <CardTitle>تحليل الدخل والمصروفات</CardTitle>
                </CardHeader>
                <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <CartesianGrid strokeDasharray="3 3" />
                            <Tooltip />
                            <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
                            <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};

export default FinanceReport;
