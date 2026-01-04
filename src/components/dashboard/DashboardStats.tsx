import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useDollarRate } from '@/hooks/useDollarRate';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface DashboardStatsProps {
    onNavigateToFinance: () => void;
    financeData?: {
        current_balance_ars?: number;
        exchange_rate?: number;
    };
    todayExpense: number;
    dailyLimitARS: number;
    newMuslimsCount?: number;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
    onNavigateToFinance,
    financeData,
    todayExpense,
    dailyLimitARS,
    newMuslimsCount
}) => {
    const totalBalanceARS = financeData?.current_balance_ars || 0;
    const exchangeRate = financeData?.exchange_rate || 0;
    const { rates, loading: ratesLoading } = useDollarRate();

    const formatCurrency = (val: number) => Math.round(val).toLocaleString();

    return (
        <Card className="border-emerald-100 shadow-sm cursor-pointer hover:shadow-md transition-all overflow-hidden h-full" onClick={onNavigateToFinance}>
            <CardContent className="p-0">
                {/* Header Row - Compact */}
                <div className="grid grid-cols-4 bg-gradient-to-l from-emerald-500 to-teal-500 text-center">
                    <div className="py-1.5 px-1 border-l border-white/20">
                        <span className="text-xs font-bold text-white">دولار (رسمي)</span>
                    </div>
                    <div className="py-1.5 px-1 border-l border-white/20">
                        <span className="text-xs font-bold text-white">مصروف اليوم</span>
                    </div>
                    <div className="py-1.5 px-1 border-l border-white/20">
                        <span className="text-xs font-bold text-white">الحد اليومي</span>
                    </div>
                    <div className="py-1.5 px-1">
                        <span className="text-xs font-bold text-white">الرصيد</span>
                    </div>
                </div>

                {/* Values Row - Local Currency / Rates */}
                <div className="grid grid-cols-4 bg-emerald-50 text-center">
                    {/* Dollar Rate Cell */}
                    <div className="py-2 px-1 border-l border-emerald-100 flex flex-col items-center justify-center bg-blue-50/50">
                        {ratesLoading ? (
                            <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                        ) : rates ? (
                            <>
                                <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                    <span>بيع:</span>
                                    <span className="font-bold text-red-600">{rates.oficial.value_sell}</span>
                                </div>
                                <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                    <span>شراء:</span>
                                    <span className="font-bold text-green-600">{rates.oficial.value_buy}</span>
                                </div>
                            </>
                        ) : (
                            <span className="text-xs text-gray-400">--</span>
                        )}
                    </div>

                    <div className="py-2 px-1 border-l border-emerald-100 flex items-center justify-center">
                        <span className="text-sm sm:text-lg font-bold text-gray-900 tabular-nums">{formatCurrency(todayExpense)}</span>
                    </div>
                    <div className="py-2 px-1 border-l border-emerald-100 flex items-center justify-center">
                        <span className="text-sm sm:text-lg font-bold text-gray-900 tabular-nums">
                            {dailyLimitARS > 0 ? formatCurrency(dailyLimitARS) : <span className="text-sm text-gray-400">--</span>}
                        </span>
                    </div>
                    <div className="py-2 px-1 flex items-center justify-center">
                        <span className="text-sm sm:text-lg font-bold text-emerald-700 tabular-nums">{formatCurrency(totalBalanceARS)}</span>
                    </div>
                </div>

                {/* Values Row - USD Equivalent (using Manual Rate or Blue Rate fallback) */}
                <div className="grid grid-cols-4 bg-gray-50 text-center border-t border-emerald-100">
                    <div className="py-1 px-1 border-l border-emerald-100">
                        <span className="text-[10px] text-gray-400">آخر تحديث: {rates?.last_update ? new Date(rates.last_update).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                    </div>
                    <div className="py-1 px-1 border-l border-emerald-100">
                        <span className="text-xs font-medium text-gray-500" dir="ltr">${exchangeRate ? formatCurrency(todayExpense / exchangeRate) : '--'}</span>
                    </div>
                    <div className="py-1 px-1 border-l border-emerald-100">
                        <span className="text-xs font-medium text-gray-500" dir="ltr">${exchangeRate ? formatCurrency(dailyLimitARS / exchangeRate) : '--'}</span>
                    </div>
                    <div className="py-1 px-1">
                        <span className="text-xs font-medium text-emerald-600" dir="ltr">${exchangeRate ? formatCurrency(totalBalanceARS / exchangeRate) : '--'}</span>
                    </div>
                </div>
                {/* New Muslims Count Badge - Optional Display */}
                {newMuslimsCount !== undefined && newMuslimsCount > 0 && (
                    <div className="bg-emerald-600 text-white text-center py-1 text-xs font-bold w-full">
                        👥 عدد المهتدين الجدد: {newMuslimsCount}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default DashboardStats;
