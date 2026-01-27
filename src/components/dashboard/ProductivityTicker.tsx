import React from 'react';
import { useProductivityTicker } from '@/hooks/useProductivityTicker';
import { cn } from '@/lib/utils';
import {
    Moon, Calendar, CheckSquare, Pill, Heart, Zap, Sparkles
} from 'lucide-react';

interface ProductivityTickerProps {
    onClick?: () => void;
    // Props passed from useLongPress spread
    [key: string]: any;
}

export const ProductivityTicker: React.FC<ProductivityTickerProps> = ({ onClick, ...props }) => {
    const { currentItem } = useProductivityTicker();

    if (!currentItem) {
        return (
            <div className="w-full h-full min-h-[60px] flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-100/50 shadow-sm">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-gray-400 animate-pulse" />
                    <span className="text-xs text-gray-400">تحميل الجدول...</span>
                </div>
            </div>
        );
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'prayer': return Moon;
            case 'task': return CheckSquare;
            case 'appointment': return Calendar;
            case 'medication': return Pill;
            case 'habit': return Heart;
            default: return Zap;
        }
    };

    const Icon = getIcon(currentItem.type);

    // Color mapping (Softer pastel palette)
    const colorStyles = {
        prayer: 'bg-gradient-to-l from-emerald-50 to-white text-emerald-800 border-emerald-100',
        task: 'bg-gradient-to-l from-orange-50 to-white text-orange-800 border-orange-100',
        appointment: 'bg-gradient-to-l from-blue-50 to-white text-blue-800 border-blue-100',
        medication: 'bg-gradient-to-l from-pink-50 to-white text-pink-800 border-pink-100',
        habit: 'bg-gradient-to-l from-purple-50 to-white text-purple-800 border-purple-100',
        goal: 'bg-gradient-to-l from-yellow-50 to-white text-yellow-800 border-yellow-100',
    }[currentItem.type] || 'bg-gray-50 text-gray-700 border-gray-100';

    return (
        <button
            type="button"
            onClick={onClick}
            {...props}
            className={cn(
                "relative w-full h-full min-h-[64px] rounded-2xl border flex flex-row items-center justify-between px-3 overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.98]",
                colorStyles
            )}
        >
            {/* Animation Container */}
            <div className="flex items-center gap-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-500 key={currentItem.id}">
                <div className="p-2.5 bg-white/80 rounded-xl shrink-0 shadow-sm border border-black/5">
                    <Icon className="w-6 h-6" />
                </div>

                <div className="flex flex-col items-start truncate overflow-hidden flex-1 py-1">
                    <span className="text-sm font-bold truncate w-full text-right leading-tight">
                        {currentItem.title}
                    </span>
                    <span className="text-xs opacity-80 truncate w-full text-right font-medium mt-0.5">
                        {currentItem.time ? currentItem.time : currentItem.subtitle}
                    </span>
                </div>

                {currentItem.time && (
                    <div className="hidden sm:flex text-[10px] font-bold bg-white/50 px-2 py-1 rounded-lg shrink-0 backdrop-blur-sm">
                        {currentItem.type === 'prayer' ? 'الآن' : 'اليوم'}
                    </div>
                )}
            </div>
        </button>
    );
};
