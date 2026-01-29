import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useAutoLocation } from '@/hooks/useAutoLocation';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useToast } from '@/hooks/use-toast';

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
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const { handleSaveLocation, isLocating } = useAutoLocation();
    const { fabConfig } = useUserSettings();
    const mainTimerRef = useRef<NodeJS.Timeout | null>(null);
    const subTimerRef = useRef<{ [key: number]: NodeJS.Timeout | null }>({});

    // === ACTION MAPPER ===
    const executeAction = (actionId: string) => {
        // Handle common prefixes
        if (actionId.startsWith('nav_')) {
            const tab = actionId.replace('nav_', '');
            if (tab === 'reports') {
                window.dispatchEvent(new Event('open-report-generator'));
            } else if (tab === 'settings') {
                window.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'settings' }));
            } else {
                window.dispatchEvent(new CustomEvent('navigate-tab', { detail: tab }));
            }
            return;
        }

        if (actionId.startsWith('timer_')) {
            const minutes = actionId === 'timer_focus' ? 25 : parseInt(actionId.replace('timer_', ''));
            window.dispatchEvent(new CustomEvent('start-quick-timer', { detail: { minutes } }));
            return;
        }

        if (actionId.startsWith('prod_')) {
            const sub = actionId.replace('prod_', '');
            if (sub === 'distraction') onAddDistraction();
            else if (sub === 'water') {
                toast({ title: '✅ تم تسجيل شرب الماء', description: 'بوركت، حافظ على رطوبة جسمك!' });
                window.dispatchEvent(new Event('record-water-intake'));
            } else if (sub === 'pomo') {
                window.dispatchEvent(new CustomEvent('start-quick-timer', { detail: { minutes: 25 } }));
            } else if (sub === 'reading') {
                window.dispatchEvent(new CustomEvent('start-quick-timer', { detail: { minutes: 20 } }));
            }
            return;
        }

        if (actionId.startsWith('islam_')) {
            const sub = actionId.replace('islam_', '');
            window.dispatchEvent(new CustomEvent('open-islamic-tool', { detail: { tool: sub } }));
            return;
        }

        if (actionId.startsWith('remind_')) {
            const sub = actionId.replace('remind_', '');
            if (sub === 'pill') {
                window.dispatchEvent(new Event('open-medications-dialog'));
            } else {
                const mins = parseInt(sub) || 5;
                toast({ title: '🔔 تم ضبط التذكير', description: `سنذكرك بعد ${mins} دقائق` });
                window.dispatchEvent(new CustomEvent('set-quick-reminder', { detail: { minutes: mins } }));
            }
            return;
        }

        if (actionId.startsWith('info_')) {
            const type = actionId.replace('info_', '');
            window.dispatchEvent(new CustomEvent('show-info-dialog', { detail: { type } }));
            return;
        }

        if (actionId.startsWith('loc_')) {
            const sub = actionId.replace('loc_', '');
            if (sub === 'save_current') handleSaveLocation();
            else if (sub === 'save_parking') executeAction('save_parking'); // fallback to old ID or handle here
            else if (sub === 'find_car') window.dispatchEvent(new Event('find-car-location'));
            else if (sub === 'share') handleSaveLocation(); // or copy link
            return;
        }

        switch (actionId) {
            case 'save_location': case 'save_location_current': case 'loc_save_current':
                handleSaveLocation();
                break;
            case 'save_parking': case 'loc_save_parking':
                // Logic for saving parking
                handleSaveLocation(); // For now, maybe mark as parking?
                break;
            case 'add_note': case 'new_note': case 'add_note_quick':
                onAddNote();
                break;
            case 'voice_note': case 'add_voice_quick':
                if (onVoiceNote) onVoiceNote();
                break;
            case 'log_distraction': case 'add_distraction_log':
                onAddDistraction();
                break;
            case 'add_event': case 'new_appointment': case 'add_event_quick':
                onAddAppointment();
                break;
            case 'add_task_priority':
                window.dispatchEvent(new CustomEvent('open-task-dialog', { detail: { priority: 'high' } }));
                break;
            case 'add_task_normal':
                window.dispatchEvent(new Event('open-task-dialog'));
                break;
            case 'sys_sync': case 'sync_now':
                window.dispatchEvent(new Event('trigger-cloud-sync'));
                break;
            case 'sys_calc':
                window.dispatchEvent(new Event('open-calculator'));
                break;
            case 'sys_clean':
                window.dispatchEvent(new Event('toggle-clean-mode'));
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
