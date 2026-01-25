import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface QuadrantFinanceProps {
    financeData: any;
}

export const QuadrantFinance: React.FC<QuadrantFinanceProps> = ({ financeData }) => {
    const exchangeRate = financeData?.exchange_rate || 1200;
    const blueRate = financeData?.blue_exchange_rate || exchangeRate + 50;

    return (
        <Card className="h-full border-emerald-100 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
            <div className="p-1.5 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between">
                <h3 className="font-bold text-emerald-800 flex items-center gap-1.5 text-[10px]">
                    <DollarSign className="w-3.5 h-3.5" />
                    المالية
                </h3>
            </div>
            <CardContent className="p-2 space-y-2">
                {/* Balances */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">الرصيد الكلي (ARS)</span>
                        <span className="font-bold text-emerald-700">
                            {financeData?.current_balance_ars?.toLocaleString() || 0}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">الرصيد الكلي (USD)</span>
                        <span className="font-bold text-blue-600">
                            {financeData?.current_balance_usd?.toLocaleString() || 0} $
                        </span>
                    </div>
                </div>

                <div className="h-px bg-emerald-100/50" />

                {/* Rates */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
                        <p className="text-[10px] text-blue-600 font-bold mb-1">Dólar Blue</p>
                        <p className="text-sm font-extrabold text-blue-800">{blueRate}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-gray-50 border border-gray-100">
                        <p className="text-[10px] text-gray-500 font-bold mb-1">Oficial</p>
                        <p className="text-sm font-extrabold text-gray-700">{exchangeRate}</p>
                    </div>
                </div>

                {/* Daily Status */}
                <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-gray-500">مصروف اليوم</span>
                    <span className="font-bold text-red-500">
                        {financeData?.today_expense?.toLocaleString() || 0} ARS
                    </span>
                </div>
            </CardContent>
        </Card>
    );
};
