import React, { useState, useEffect } from 'react';
import { useProductivityTicker } from '@/hooks/useProductivityTicker';
import { useLongPress } from '@/hooks/useLongPress';
import { cn } from '@/lib/utils';
import { Moon, CheckSquare, Calendar, Pill, Target, Zap, Clock } from 'lucide-react';
import { differenceInMinutes, set } from 'date-fns';

interface SmartGridTickerProps {
    onClick?: () => void;
    onLongPress?: () => void;
    className?: string;
}

export const SmartGridTicker: React.FC<SmartGridTickerProps> = ({ onClick, onLongPress, className }) => {
    const { currentItem } = useProductivityTicker();
    const [timeLeft, setTimeLeft] = useState<string>('');

    // Long press logic
    const bind = useLongPress({
        onLongPress: () => onLongPress?.(),
        onClick: () => onClick?.(),
        ms: 600
    });

    // Time diff calculation
    useEffect(() => {
        if (!currentItem || !currentItem.time || !currentItem.time.includes(':')) {
            setTimeLeft('');
            return;
        }

        const calculateTime = () => {
            const now = new Date();
            const [h, m] = currentItem.time!.split(':').map(Number);
            const target = set(now, { hours: h, minutes: m, seconds: 0, milliseconds: 0 });

            const diff = differenceInMinutes(target, now);

            if (diff > 60) {
                const hours = Math.floor(diff / 60);
                const mins = diff % 60;
                setTimeLeft(`${hours}س ${mins > 0 ? `${mins}د` : ''}`);
            } else if (diff > 0) {
                setTimeLeft(`${diff}د`);
            } else if (diff > -30) {
                setTimeLeft('الآن');
            } else {
                setTimeLeft('-');
            }
        };

        calculateTime();
        const interval = setInterval(calculateTime, 60000);
        return () => clearInterval(interval);
    }, [currentItem]);

    if (!currentItem) {
        return (
            <button
                type="button"
                {...bind}
                className={cn(
                    "relative w-full h-full bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center animate-pulse",
                    className
                )}
            >
                <span className="text-xs text-gray-400 font-bold">جاري التحديث...</span>
            </button>
        );
    }

    const typeLabels: Record<string, string> = {
        prayer: 'صلاة',
        task: 'مهمة',
        appointment: 'موعد',
        medication: 'دواء',
        habit: 'عادة',
        goal: 'هدف',
    };

    const typeColors: Record<string, { bg: string, text: string, border: string }> = {
        prayer: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
        task: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
        appointment: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
        medication: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' },
        habit: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
        goal: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' },
    };

    const colors = typeColors[currentItem.type] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-100' };

    return (
        <button
            type="button"
            {...bind}
            className={cn(
                "relative w-full h-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden active:scale-95 transition-all grid grid-cols-2 grid-rows-2 p-0.5 gap-0.5",
                className
            )}
        >
            {/* Cell 1: Title (Top Right) */}
            <div className={cn("rounded-lg flex items-center justify-center px-1 overflow-hidden border", colors.bg, colors.border)}>
                <span className={cn("text-[10px] font-black truncate text-center", colors.text)}>
                    {currentItem.title}
                </span>
            </div>

            {/* Cell 2: Time (Top Left) */}
            <div className="bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 px-1">
                <span className="text-[11px] font-mono font-black text-gray-700">
                    {currentItem.time || '--:--'}
                </span>
            </div>

            {/* Cell 3: Remaining (Bottom Right) */}
            <div className="bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 px-1">
                <div className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-600">
                        {timeLeft || '-'}
                    </span>
                </div>
            </div>

            {/* Cell 4: Type (Bottom Left) */}
            <div className={cn("rounded-lg flex items-center justify-center px-1 border", colors.bg, colors.border)}>
                <span className={cn("text-[9px] font-black uppercase opacity-80", colors.text)}>
                    {typeLabels[currentItem.type]}
                </span>
            </div>
        </button>
    );
};
