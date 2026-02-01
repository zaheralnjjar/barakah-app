import React, { useState, useEffect, useMemo } from 'react';
import { Bell, X, Sparkles, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useAppointments, Appointment } from '@/hooks/useAppointments';
import { Button } from '@/components/ui/button';

export const ApproachingReminderBanner: React.FC = () => {
    const { nextPrayer } = usePrayerTimes();
    const { appointments } = useAppointments();
    const [isDismissed, setIsDismissed] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update current time every minute
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    // Session-based dismissal
    useEffect(() => {
        const dismissed = sessionStorage.getItem('reminder_banner_dismissed');
        if (dismissed === 'true') setIsDismissed(true);
    }, []);

    const handleDismiss = () => {
        setIsDismissed(true);
        sessionStorage.setItem('reminder_banner_dismissed', 'true');
    };

    // Thresholds: Prayer (20 mins), Appointments (30 mins)
    const PRAYER_THRESHOLD = 20 * 60 * 1000;
    const APPOINTMENT_THRESHOLD = 30 * 60 * 1000;

    const approachingReminder = useMemo(() => {
        if (isDismissed) return null;

        let active: { title: string; type: 'prayer' | 'appointment'; remaining: number } | null = null;

        // Check Prayer
        if (nextPrayer) {
            const diff = nextPrayer.timestamp.getTime() - currentTime.getTime();
            if (diff > 0 && diff <= PRAYER_THRESHOLD) {
                active = {
                    title: `حان وقت صلاة ${nextPrayer.nameAr}`,
                    type: 'prayer',
                    remaining: Math.floor(diff / 60000)
                };
            }
        }

        // Check Appointments
        const now = currentTime.getTime();
        const upcomingAppt = appointments
            .filter(a => !a.is_completed)
            .map(a => {
                const apptTime = new Date(`${a.date}T${a.time}`).getTime();
                return { ...a, timestamp: apptTime };
            })
            .filter(a => a.timestamp > now && a.timestamp - now <= APPOINTMENT_THRESHOLD)
            .sort((a, b) => a.timestamp - b.timestamp)[0];

        if (upcomingAppt) {
            const diff = upcomingAppt.timestamp - now;
            // If appointment is closer or if no prayer is active, set it
            if (!active || diff < active.remaining * 60000) {
                active = {
                    title: `موعد قادم: ${upcomingAppt.title}`,
                    type: 'appointment',
                    remaining: Math.floor(diff / 60000)
                };
            }
        }

        return active;
    }, [nextPrayer, appointments, currentTime, isDismissed]);

    if (!approachingReminder) return null;

    return (
        <div className="w-full px-1 mb-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className={cn(
                "relative group overflow-hidden rounded-2xl border-2 transition-all duration-1000",
                "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_auto] animate-gradient-x",
                "shadow-[0_0_20px_rgba(245,158,11,0.3)] border-amber-400/50",
                "flex items-center justify-between p-3"
            )}>
                {/* Pulsing Glow Background */}
                <div className="absolute inset-0 bg-white/10 animate-pulse-gentle pointer-events-none" />

                <div className="flex items-center gap-3 relative z-10">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm animate-bounce-subtle">
                        {approachingReminder.type === 'prayer' ? (
                            <Sparkles className="w-5 h-5 text-white" />
                        ) : (
                            <Clock className="w-5 h-5 text-white" />
                        )}
                    </div>

                    <div className="flex flex-col">
                        <span className="text-white font-black text-sm tracking-tight leading-none mb-1">
                            {approachingReminder.title}
                        </span>
                        <span className="text-white/80 text-[10px] font-bold flex items-center gap-1">
                            <Bell className="w-3 h-3" />
                            متبقي {approachingReminder.remaining} دقيقة
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 relative z-10">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDismiss}
                        className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20 rounded-full"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Animation Styles */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes pulse-gentle {
                        0%, 100% { opacity: 0.1; transform: scale(1); }
                        50% { opacity: 0.3; transform: scale(1.02); }
                    }
                    @keyframes gradient-x {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                    @keyframes bounce-subtle {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-3px); }
                    }
                    .animate-pulse-gentle {
                        animation: pulse-gentle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                    }
                    .animate-gradient-x {
                        animation: gradient-x 15s ease infinite;
                    }
                    .animate-bounce-subtle {
                        animation: bounce-subtle 2s ease-in-out infinite;
                    }
                `}} />
            </div>
        </div>
    );
};
