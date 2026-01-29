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
}

export const MultiActionFAB: React.FC<MultiActionFABProps> = ({
    onAddNote,
    onVoiceNote,
    onAddAppointment,
    onAddDistraction
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

    return (
        <div className="fixed bottom-6 left-6 z-[60] flex flex-col items-center">
            {/* Action Buttons */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        className="flex flex-col items-center gap-3 mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        {actions.map((action, index) => (
                            <motion.div
                                key={action.id}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center gap-3"
                            >
                                <span className="bg-black/70 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                    {action.label}
                                </span>
                                <button
                                    onClick={action.onClick}
                                    className={`${action.color} text-white p-3 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all flex items-center justify-center relative group`}
                                >
                                    <action.icon className={`w-5 h-5 ${action.id === 'location' && isLocating ? 'animate-spin' : ''}`} />
                                    {/* Tooltip for mobile visibility */}
                                    <span className="absolute right-14 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        {action.label}
                                    </span>
                                </button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main FAB */}
            <button
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                onContextMenu={(e) => e.preventDefault()}
                className={`relative p-4 rounded-full text-white shadow-2xl transition-all duration-300 flex items-center justify-center border-4 border-white/20 overflow-hidden ${isExpanded
                        ? 'bg-gray-800 rotate-45 scale-90'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-600 scale-100 hover:scale-105 active:scale-95'
                    } ${isPressed ? 'brightness-125' : ''}`}
            >
                <Plus className={`w-8 h-8 stroke-[3] transition-transform duration-300`} />

                {/* Visual indicator for long press */}
                {isPressed && !isExpanded && (
                    <motion.div
                        className="absolute inset-0 bg-white/20"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5 }}
                    />
                )}
            </button>

            {!isExpanded && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap opacity-50">
                    اضغط (مطول للصوت)
                </div>
            )}
        </div>
    );
};
