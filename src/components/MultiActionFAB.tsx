import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, X, FileText, Calendar,
    MapPin, AlertTriangle, Mic, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLongPress } from '@/hooks/useLongPress';
import { useAutoLocation } from '@/hooks/useAutoLocation';

interface MultiActionFABProps {
    onAddNote: () => void;
    onVoiceNote: () => void;
    onAddAppointment: () => void;
    onAddDistraction: () => void;
    direction?: 'up' | 'down' | 'left' | 'right';
    className?: string;
    showLabel?: boolean;
}

export const MultiActionFAB: React.FC<MultiActionFABProps> = ({
    onAddNote,
    onVoiceNote,
    onAddAppointment,
    onAddDistraction,
    direction = 'up',
    className = "",
    showLabel = true
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { saveCurrentLocation, isLocating } = useAutoLocation();

    const actions = [
        {
            id: 'note',
            icon: FileText,
            label: 'ملاحظة',
            color: 'bg-yellow-500',
            onClick: () => { onAddNote(); setIsExpanded(false); }
        },
        {
            id: 'appointment',
            icon: Calendar,
            label: 'موعد',
            color: 'bg-purple-500',
            onClick: () => { onAddAppointment(); setIsExpanded(false); }
        },
        {
            id: 'location',
            icon: isLocating ? Loader2 : MapPin,
            label: 'موقع',
            color: 'bg-blue-500',
            onClick: () => { if (!isLocating) saveCurrentLocation(); setIsExpanded(false); }
        },
        {
            id: 'distraction',
            icon: AlertTriangle,
            label: 'تشتت',
            color: 'bg-red-500',
            onClick: () => { onAddDistraction(); setIsExpanded(false); }
        },
    ];

    const { onMouseDown, onMouseUp, onMouseLeave, onTouchStart, onTouchEnd, isPressed } = useLongPress({
        onLongPress: () => {
            onVoiceNote();
            setIsExpanded(false);
        },
        onClick: () => setIsExpanded(!isExpanded),
        ms: 500
    });

    const getLayoutClasses = () => {
        switch (direction) {
            case 'left': return 'flex-row-reverse items-center gap-3 mr-4 mb-0';
            case 'right': return 'flex-row items-center gap-3 ml-4 mb-0';
            case 'down': return 'flex-col items-center gap-3 mt-4 mb-0';
            default: return 'flex-col items-center gap-3 mb-4 mt-0';
        }
    };

    const getExitDirection = () => {
        switch (direction) {
            case 'left': return { x: 20, y: 0 };
            case 'right': return { x: -20, y: 0 };
            case 'down': return { x: 0, y: -20 };
            default: return { x: 0, y: 20 };
        }
    };

    const isSidebarMode = direction === 'left' || direction === 'right';

    return (
        <div className={`${!isSidebarMode ? 'fixed z-[60]' : 'relative'} ${className} flex ${isSidebarMode ? 'flex-row' : 'flex-col-reverse'} items-center`}>
            {/* Main FAB */}
            <button
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                onContextMenu={(e) => e.preventDefault()}
                className={`relative p-3 rounded-xl text-white shadow-lg transition-all duration-300 flex items-center justify-center border-2 border-white/20 overflow-hidden ${isExpanded
                        ? 'bg-gray-800 rotate-45 scale-90'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-600 scale-100'
                    } ${isPressed ? 'brightness-125' : ''} ${isSidebarMode ? 'w-10 h-10' : 'w-14 h-14 rounded-full border-4'}`}
            >
                <Plus className={`${isSidebarMode ? 'w-6 h-6' : 'w-8 h-8'} stroke-[3] transition-transform duration-300`} />

                {isPressed && !isExpanded && (
                    <motion.div
                        className="absolute inset-0 bg-white/20"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5 }}
                    />
                )}
            </button>

            {/* Action Buttons */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        className={`flex ${getLayoutClasses()}`}
                        initial={{ opacity: 0, ...getExitDirection() }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, ...getExitDirection() }}
                    >
                        {actions.map((action, index) => (
                            <motion.div
                                key={action.id}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center gap-2"
                            >
                                <button
                                    onClick={action.onClick}
                                    className={`${action.color} text-white p-2.5 rounded-xl shadow-md hover:scale-110 active:scale-95 transition-all flex items-center justify-center relative group`}
                                >
                                    <action.icon className={`w-5 h-5 ${action.id === 'location' && isLocating ? 'animate-spin' : ''}`} />
                                    <span className={`absolute ${direction === 'left' ? 'right-12' : 'left-12'} bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[100]`}>
                                        {action.label}
                                    </span>
                                </button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {!isExpanded && showLabel && !isSidebarMode && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap opacity-50">
                    اضغط (مطول للصوت)
                </div>
            )}
        </div>
    );
};
