import React, { useState, useEffect } from 'react';
import { useProductivityTicker, TickerItem } from '@/hooks/useProductivityTicker';
import { cn } from '@/lib/utils';
import { useLongPress } from '@/hooks/useLongPress';
import { Moon, CheckSquare, Calendar, Pill, Target, Zap, Clock } from 'lucide-react';
import { differenceInMinutes, set } from 'date-fns';

interface ProductivityTickerProps {
    onClick?: () => void;
    onLongPress?: () => void;
    className?: string; // Support className overrides
}

export const ProductivityTicker: React.FC<ProductivityTickerProps> = ({ onClick, onLongPress, className }) => {
    const { currentItem } = useProductivityTicker();
    const [timeLeft, setTimeLeft] = useState<string>('');

    // Long press logic
    const bind = useLongPress(() => {
        onLongPress?.();
    }, {
        onCancel: () => onClick?.(), // If not long press, trigger click
        threshold: 600
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
                setTimeLeft(`بعد ${hours}س ${mins > 0 ? `و ${mins}د` : ''}`);
            } else if (diff > 0) {
                setTimeLeft(`بعد ${diff} دقيقة`);
            } else if (diff > -30) {
                setTimeLeft('الآن');
            } else {
                setTimeLeft('');
            }
        };

        calculateTime();
        const interval = setInterval(calculateTime, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [currentItem]);

    // Handle Empty State
    if (!currentItem) {
        return (
            <button
                type="button"
                className={cn(
                    "relative w-full h-full rounded-2xl border flex flex-col items-center justify-center overflow-hidden transition-all duration-300 shadow-sm bg-gray-50 border-dashed border-gray-300",
                    className
                )}
                {...bind}
            >
                <Zap className="w-5 h-5 text-gray-400 mb-1" />
                <span className="text-xs text-gray-400">لا توجد أحداث قادمة</span>
            </button>
        );
    }

    // Color Logic
    const colors: Record<string, string> = {
        prayer: 'bg-emerald-50 border-emerald-100 text-emerald-900',
        task: 'bg-orange-50 border-orange-100 text-orange-900',
        appointment: 'bg-blue-50 border-blue-100 text-blue-900',
        medication: 'bg-pink-50 border-pink-100 text-pink-900',
        habit: 'bg-purple-50 border-purple-100 text-purple-900',
        goal: 'bg-indigo-50 border-indigo-100 text-indigo-900',
    };

    const icons: Record<string, any> = {
        prayer: Moon,
        task: CheckSquare,
        appointment: Calendar,
        medication: Pill,
        habit: Zap,
        goal: Target,
    };

    const typeLabels: Record<string, string> = {
        prayer: 'صلاة',
        task: 'مهمة',
        appointment: 'موعد',
        medication: 'دواء',
        habit: 'عادة',
        goal: 'هدف',
    };

    const colorStyles = colors[currentItem.type] || 'bg-gray-50 border-gray-200 text-gray-900';
    const Icon = icons[currentItem.type] || Zap;

    return (
        <button
            type="button"
            className={cn(
                "relative w-full h-full rounded-2xl border flex flex-row items-center justify-between px-3 overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.98]",
                colorStyles,
                className
            )}
            {...bind}
        >
            {/* Type Badge (Top Left) */}
            <div className="absolute top-2 left-2 bg-white/60 backdrop-blur-sm px-1.5 py-0.5 rounded-md border border-black/5">
                <span className="text-[9px] font-bold opacity-70">
                    {typeLabels[currentItem.type]}
                </span>
            </div>

            <div className="flex items-center gap-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-500" key={currentItem.id}>
                <div className="p-2.5 bg-white/60 rounded-xl shadow-sm shrink-0 backdrop-blur-sm">
                    <Icon className="w-6 h-6 stroke-[1.5]" />
                </div>

                <div className="flex flex-col items-start min-w-0 flex-1">
                    <h3 className="font-bold text-sm truncate w-full text-right leading-tight mb-0.5">
                        {currentItem.title}
                    </h3>
                    <div className="flex items-center gap-2 w-full">
                        <span className="text-[10px] opacity-80 truncate">{currentItem.subtitle}</span>
                        {timeLeft && (
                            <span className="text-[9px] font-bold bg-white/50 px-1.5 rounded-full flex items-center gap-1 whitespace-nowrap">
                                <Clock className="w-2.5 h-2.5" />
                                {timeLeft}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Progress Indicator (Optional visual flair) */}
            <div className="absolute bottom-0 left-0 h-0.5 bg-current opacity-20 transition-all duration-[5000ms] ease-linear w-full" key={currentItem.id + '-progress'} />
        </button>
    );
};
