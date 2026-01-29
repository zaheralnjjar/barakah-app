import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, StickyNote, Calendar, AlertTriangle, MapPin, X } from 'lucide-react';
import { useAutoLocation } from '@/hooks/useAutoLocation';

interface MultiActionFABProps {
    onAddNote: () => void;
    onVoiceNote?: () => void;
    onAddAppointment: () => void;
    onAddDistraction: () => void;
    sizeMultiplier?: number;
    className?: string;
    isFixed?: boolean;
}

export const MultiActionFAB: React.FC<MultiActionFABProps> = ({
    onAddNote,
    onVoiceNote,
    onAddAppointment,
    onAddDistraction,
    sizeMultiplier = 1,
    className = "",
    isFixed = true
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const { handleSaveLocation, isLocating } = useAutoLocation();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const handleTouchStart = () => {
        timerRef.current = setTimeout(() => {
            if (onVoiceNote) {
                if (navigator.vibrate) navigator.vibrate(50);
                onVoiceNote();
                setIsOpen(false);
            }
        }, 600);
    };

    const handleTouchEnd = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const menuItems = [
        { id: 'location', icon: MapPin, color: 'bg-green-500', onClick: () => { handleSaveLocation(); setIsOpen(false); }, loading: isLocating },
        { id: 'note', icon: StickyNote, color: 'bg-yellow-500', onClick: () => { onAddNote(); setIsOpen(false); } },
        { id: 'distraction', icon: AlertTriangle, color: 'bg-orange-500', onClick: () => { onAddDistraction(); setIsOpen(false); } },
        { id: 'appointment', icon: Calendar, color: 'bg-purple-500', onClick: () => { onAddAppointment(); setIsOpen(false); } },
    ];

    const mainSize = 56 * sizeMultiplier;
    const mainIconSize = 24 * sizeMultiplier;
    const actionSize = 54 * sizeMultiplier;
    const actionIconSize = 24 * sizeMultiplier;

    return (
        <>
            {/* Global Backdrop - Extremely high z-index but less than container */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[999990]"
                    />
                )}
            </AnimatePresence>

            <div className={`${isFixed ? 'fixed' : 'relative'} z-[999991] ${className}`}>
                <div className="relative flex flex-col-reverse items-center">
                    <motion.button
                        onPointerDown={handleTouchStart}
                        onPointerUp={handleTouchEnd}
                        onPointerLeave={handleTouchEnd}
                        onClick={() => setIsOpen(!isOpen)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 pointer-events-auto ${isOpen ? 'bg-red-500' : 'bg-primary'}`}
                        style={{ width: mainSize, height: mainSize, zIndex: 999992 }}
                    >
                        {isOpen ? (
                            <X style={{ width: mainIconSize, height: mainIconSize }} />
                        ) : (
                            <Plus style={{ width: mainIconSize, height: mainIconSize }} />
                        )}
                    </motion.button>

                    <AnimatePresence>
                        {isOpen && (
                            <div className="flex flex-col-reverse items-center mb-6 space-y-reverse space-y-5 absolute bottom-full pb-4 pointer-events-auto">
                                {menuItems.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 30, scale: 0.5 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 30, scale: 0.5 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 450,
                                            damping: 25,
                                            delay: index * 0.04
                                        }}
                                        className="flex items-center justify-center cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            item.onClick();
                                        }}
                                    >
                                        <div
                                            style={{ width: actionSize, height: actionSize }}
                                            className={`rounded-full ${item.color} text-white shadow-2xl flex items-center justify-center hover:brightness-110 active:scale-95 transition-all ring-2 ring-white/30`}
                                        >
                                            <item.icon
                                                style={{ width: actionIconSize, height: actionIconSize }}
                                                className={item.loading ? 'animate-spin' : ''}
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
};
