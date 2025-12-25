import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface DashboardStatsProps {
    onNavigateToFinance: () => void;
    financeData?: {
        current_balance_ars?: number;
        exchange_rate?: number;
    };
    todayExpense: number;
    dailyLimitARS: number;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
    onNavigateToFinance,
    financeData,
    todayExpense,
    dailyLimitARS
}) => {
    const totalBalanceARS = financeData?.current_balance_ars || 0;
    const exchangeRate = financeData?.exchange_rate || 0;

    return (
        // ===== 2. FINANCIAL SUMMARY =====
        <Card className="border-emerald-100 shadow-sm cursor-pointer hover:shadow-md transition-all overflow-hidden mb-6" onClick={onNavigateToFinance}>
            <CardContent className="p-0">
                {/* Header Row - Compact */}
                <div className="grid grid-cols-3 bg-gradient-to-l from-emerald-500 to-teal-500 text-center">
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
                {/* Values Row - Local Currency - Compact */}
                <div className="grid grid-cols-3 bg-emerald-50 text-center">
                    <div className="py-2 px-1 border-l border-emerald-100">
                        <span className="text-lg font-bold text-gray-900 tabular-nums">{todayExpense.toLocaleString()}</span>
                    </div>
                    <div className="py-2 px-1 border-l border-emerald-100">
                        <span className="text-lg font-bold text-gray-900 tabular-nums">
                            {dailyLimitARS > 0 ? dailyLimitARS.toLocaleString() : <span className="text-sm text-gray-400">غير محدد</span>}
                        </span>
                    </div>
                    <div className="py-2 px-1">
                        <span className="text-lg font-bold text-emerald-700 tabular-nums">{totalBalanceARS.toLocaleString()}</span>
                    </div>
                </div>
                {/* Values Row - USD - Compact */}
                <div className="grid grid-cols-3 bg-gray-50 text-center border-t border-emerald-100">
                    <div className="py-1 px-1 border-l border-emerald-100">
                        <span className="text-sm font-medium text-gray-500" dir="ltr">${exchangeRate ? Math.round(todayExpense / exchangeRate).toLocaleString() : '--'}</span>
                    </div>
                    <div className="py-1 px-1 border-l border-emerald-100">
                        <span className="text-sm font-medium text-gray-500" dir="ltr">${exchangeRate ? Math.round(dailyLimitARS / exchangeRate).toLocaleString() : '--'}</span>
                    </div>
                    <div className="py-1 px-1">
                        <span className="text-sm font-medium text-emerald-600" dir="ltr">${exchangeRate ? Math.round(totalBalanceARS / exchangeRate).toLocaleString() : '--'}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default DashboardStats;
