import React from 'react';
import { Card } from '@/components/ui/card';
import {
    DollarSign, Wallet, TrendingDown, PiggyBank,
    Calendar as CalendarIcon, Receipt, CreditCard, ArrowRightLeft
} from 'lucide-react';

interface FinanceGridV3Props {
    officialRate: number;
    totalBalanceARS: number;
    todayExpense: number;
    savingsRate: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    remaining: number;
    lastTransaction: any;
    formatARS: (val: number) => string;
    formatUSD: (val: number) => string;
}

export const FinanceGridV3: React.FC<FinanceGridV3Props> = ({
    officialRate, totalBalanceARS, todayExpense, savingsRate,
    monthlyIncome, monthlyExpenses, remaining, lastTransaction,
    formatARS, formatUSD
}) => {
    const cards = [
        // Row 1
        {
            icon: DollarSign,
            label: 'سعر الدولار (بيع)',
            value: `${formatARS(officialRate)}`,
            subValue: 'السعر الرسمي',
            color: 'text-blue-700',
            bg: 'bg-blue-50/80 border border-blue-100'
        },
        {
            icon: Wallet,
            label: 'الرصيد',
            value: `${formatARS(totalBalanceARS)}`,
            subValue: `$${formatUSD(totalBalanceARS)}`,
            color: 'text-emerald-700',
            bg: 'bg-emerald-50/80 border border-emerald-100'
        },
        {
            icon: TrendingDown,
            label: 'المصروفات',
            value: `${formatARS(todayExpense)}`,
            subValue: `$${formatUSD(todayExpense)}`,
            color: 'text-red-600',
            bg: 'bg-red-50/80 border border-red-100'
        },
        {
            icon: PiggyBank,
            label: 'المدخرات',
            value: `${Math.round(savingsRate)}%`,
            subValue: savingsRate >= 20 ? 'جيد' : 'منخفض',
            color: savingsRate >= 20 ? 'text-emerald-700' : 'text-amber-600',
            bg: savingsRate >= 20 ? 'bg-emerald-50/80 border border-emerald-100' : 'bg-amber-50/80 border border-amber-100'
        },
        // Row 2 - Keeping 8 items as requested
        {
            icon: CalendarIcon, // Calendar/Monthly
            label: 'الدخل الشهري',
            value: `${formatARS(monthlyIncome)}`,
            subValue: `$${formatUSD(monthlyIncome)}`,
            color: 'text-teal-600',
            bg: 'bg-teal-50/80 border border-teal-100'
        },
        {
            icon: Receipt,
            label: 'مصاريف الشهر',
            value: `${formatARS(monthlyExpenses)}`,
            subValue: `$${formatUSD(monthlyExpenses)}`,
            color: 'text-orange-600',
            bg: 'bg-orange-50/80 border border-orange-100'
        },
        {
            icon: CreditCard,
            label: 'المتبقي (يومي)',
            value: `${formatARS(remaining)}`,
            subValue: remaining >= 0 ? 'متاح' : 'تجاوز',
            color: remaining >= 0 ? 'text-emerald-700' : 'text-red-600',
            bg: remaining >= 0 ? 'bg-emerald-50/80 border border-emerald-100' : 'bg-red-50/80 border border-red-100'
        },
        {
            icon: ArrowRightLeft,
            label: 'آخر معاملة',
            value: lastTransaction ? `${formatARS(lastTransaction.amount)}` : '-',
            subValue: lastTransaction?.description?.slice(0, 8) || '...',
            color: 'text-gray-600',
            bg: 'bg-gray-50/80 border border-gray-100'
        }
    ];

    return (
        <div className="grid grid-cols-4 gap-2" style={{ height: 'auto' }}>
            {cards.map((card, idx) => (
                <Card
                    key={idx}
                    className={`p-1.5 ${card.bg} border shadow-sm flex flex-col items-center justify-center text-center h-[70px]`}
                >
                    <card.icon className={`w-4 h-4 ${card.color} mb-1`} />
                    <span className="text-[9px] font-bold text-gray-600 leading-tight mb-0.5">{card.label}</span>
                    <span className={`text-[10px] font-extrabold ${card.color} leading-tight`}>{card.value}</span>
                    <span className="text-[8px] text-gray-400 mt-0.5">{card.subValue}</span>
                </Card>
            ))}
        </div>
    );
};
