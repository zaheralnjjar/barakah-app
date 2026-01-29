import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useAutoLocation } from '@/hooks/useAutoLocation';
import { useUserSettings } from '@/hooks/useUserSettings';

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
    const { fabConfig } = useUserSettings();
    const mainTimerRef = useRef<NodeJS.Timeout | null>(null);
    const subTimerRef = useRef<{ [key: number]: NodeJS.Timeout | null }>({});

    // === ACTION MAPPER ===
    const executeAction = (actionId: string) => {
        switch (actionId) {
            case 'save_location': case 'save_location_current':
                handleSaveLocation();
                break;
            case 'add_note': case 'new_note':
                onAddNote();
                break;
            case 'voice_note':
                if (onVoiceNote) onVoiceNote();
                break;
            case 'log_distraction':
                onAddDistraction();
                break;
            case 'add_event': case 'new_appointment':
                onAddAppointment();
                break;
            case 'open_map': case 'open_maps':
                window.open('https://www.google.com/maps', '_blank');
                break;
            case 'nav_map':
                window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'map' }));
                break;
            case 'nav_finance':
                window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'finance' }));
                break;
            case 'nav_productivity':
                window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'productivity' }));
                break;
            default:
                console.log('Action not implemented yet:', actionId);
        }
    };

    // Main Button Handlers
    const handleMainTouchStart = () => {
        mainTimerRef.current = setTimeout(() => {
            if (onVoiceNote) {
                if (navigator.vibrate) navigator.vibrate(50);
                onVoiceNote();
                setIsOpen(false);
            }
        }, 600);
    };

    const handleMainTouchEnd = () => {
        if (mainTimerRef.current) {
            clearTimeout(mainTimerRef.current);
            mainTimerRef.current = null;
        }
    };

    // Sub Button Handlers
    const handleSubTouchStart = (idx: number, actionId: string) => {
        subTimerRef.current[idx] = setTimeout(() => {
            if (navigator.vibrate) navigator.vibrate(50);
            executeAction(actionId);
            setIsOpen(false);
        }, 600);
    };

    const handleSubTouchEnd = (idx: number, tapActionId: string) => {
        if (subTimerRef.current[idx]) {
            clearTimeout(subTimerRef.current[idx]!);
            subTimerRef.current[idx] = null;
            // It was a tap
            executeAction(tapActionId);
            setIsOpen(false);
        }
    };

    const mainSize = 56 * sizeMultiplier;
    const mainIconSize = 24 * sizeMultiplier;
    const actionSize = 54 * sizeMultiplier;
    const actionIconSize = 24 * sizeMultiplier;

    return (
        <>
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
                        onPointerDown={handleMainTouchStart}
                        onPointerUp={handleMainTouchEnd}
                        onPointerLeave={handleMainTouchEnd}
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
                                {fabConfig.buttons.map((item, index) => {
                                    const Icon = (LucideIcons as any)[item.icon] || LucideIcons.HelpCircle;
                                    return (
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
                                            onPointerDown={() => handleSubTouchStart(index, item.longPressAction)}
                                            onPointerUp={() => handleSubTouchEnd(index, item.tapAction)}
                                            onPointerLeave={() => {
                                                if (subTimerRef.current[index]) {
                                                    clearTimeout(subTimerRef.current[index]!);
                                                    subTimerRef.current[index] = null;
                                                }
                                            }}
                                        >
                                            <div
                                                style={{ width: actionSize, height: actionSize }}
                                                className={`rounded-full ${item.color} text-white shadow-2xl flex items-center justify-center hover:brightness-110 active:scale-95 transition-all ring-2 ring-white/30`}
                                            >
                                                <Icon
                                                    style={{ width: actionIconSize, height: actionIconSize }}
                                                    className={item.tapAction === 'save_location' && isLocating ? 'animate-spin' : ''}
                                                />
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
};
