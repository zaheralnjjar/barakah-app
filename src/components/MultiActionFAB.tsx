import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, StickyNote, Calendar, AlertTriangle, MapPin } from 'lucide-react';
import { useAutoLocation } from '@/hooks/useAutoLocation';

interface MultiActionFABProps {
    onAddNote: () => void;
    onVoiceNote: () => void;
    onAddAppointment: () => void;
    onAddDistraction: () => void;
    direction?: 'up' | 'down' | 'left' | 'right';
    className?: string;
    showLabel?: boolean;
    sizeMultiplier?: number;
}

export const MultiActionFAB: React.FC<MultiActionFABProps> = ({
    onAddNote,
    onVoiceNote,
    onAddAppointment,
    onAddDistraction,
    direction = 'up',
    className = '',
    showLabel = true,
    sizeMultiplier = 1
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const { handleSaveLocation, isLocating } = useAutoLocation();

    // Order (bottom to top): Location, Note, Distraction, Appointment
    const menuItems = [
        { id: 'location', icon: MapPin, label: 'حفظ الموقع', color: 'bg-green-500', onClick: () => { handleSaveLocation(); setIsOpen(false); }, loading: isLocating },
        { id: 'note', icon: StickyNote, label: 'ملاحظة ملاحظة', color: 'bg-blue-500', onClick: () => { onAddNote(); setIsOpen(false); } },
        { id: 'distraction', icon: AlertTriangle, label: 'تسجيل تشتت', color: 'bg-orange-500', onClick: () => { onAddDistraction(); setIsOpen(false); } },
        { id: 'appointment', icon: Calendar, label: 'موعد جديد', color: 'bg-purple-500', onClick: () => { onAddAppointment(); setIsOpen(false); } },
    ];

    const fabSize = 56 * sizeMultiplier;
    const iconSize = 24 * sizeMultiplier;
    const actionSize = 48 * sizeMultiplier;
    const actionIconSize = 20 * sizeMultiplier;

    return (
        <div className={`relative ${className}`}>
            {/* Backdrop for closing when clicking outside */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/5"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div className={`relative z-50 flex flex-col-reverse items-center`}>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ width: fabSize, height: fabSize }}
                    className="rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center z-50 transition-colors hover:bg-blue-700"
                >
                    <motion.div
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    >
                        <Plus style={{ width: iconSize, height: iconSize }} />
                    </motion.div>
                </motion.button>

                <AnimatePresence>
                    {isOpen && (
                        <div className="flex flex-col-reverse items-center mb-4 space-y-reverse space-y-3">
                            {menuItems.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                                    transition={{
                                        delay: index * 0.05,
                                        type: 'spring',
                                        stiffness: 300,
                                        damping: 20
                                    }}
                                    className="flex flex-row-reverse items-center justify-end group cursor-pointer"
                                    onClick={item.onClick}
                                >
                                    <button
                                        style={{ width: actionSize, height: actionSize }}
                                        className={`rounded-full ${item.color} text-white shadow-md flex items-center justify-center hover:brightness-110 active:scale-95 transition-all`}
                                    >
                                        <item.icon
                                            style={{ width: actionIconSize, height: actionIconSize }}
                                            className={item.loading ? 'animate-spin' : ''}
                                        />
                                    </button>
                                    {showLabel && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="mr-3 bg-white px-2 py-1 rounded shadow-sm text-xs font-medium text-gray-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
