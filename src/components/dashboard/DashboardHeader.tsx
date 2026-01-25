import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { isAndroid } from '@/utils/platformDetection';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NotificationBell } from '@/components/NotificationBell';
import HolidaysDialog from '@/components/HolidaysDialog';
import { useAppStore } from '@/stores/useAppStore';
import { useCloudSync } from '@/hooks/useCloudSync';
import SyncStatusIndicator from '@/components/SyncStatusIndicator';
import { Timer, Play } from 'lucide-react';

interface DashboardHeaderProps {
    currentDate?: Date;
}

interface UpcomingEvent {
    title: string;
    time: string;
    type: 'appointment' | 'task' | 'habit';
    color: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ currentDate = new Date() }) => {
    const [showHolidaysPopup, setShowHolidaysPopup] = useState(false);
    const [showBarakahPopup, setShowBarakahPopup] = useState(false);
    const [upcomingEvent, setUpcomingEvent] = useState<UpcomingEvent | null>(null);
    const [showEventBanner, setShowEventBanner] = useState(false);

    // Focus Timer state
    const [showTimerDialog, setShowTimerDialog] = useState(false);
    const [timerMinutes, setTimerMinutes] = useState(25);
    const timerPresets = [
        { name: 'تركيز', minutes: 25 },
        { name: 'راحة قصيرة', minutes: 5 },
        { name: 'راحة طويلة', minutes: 15 },
    ];

    const { appointments, tasks } = useAppStore();
    const { isSyncing, lastSync, isOnline, pendingActions, failedActions, syncNow } = useCloudSync();

    const spanishDate = currentDate.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long'
    });

    const hijriDate = currentDate.toLocaleDateString('ar-SA-u-ca-islamic', {
        day: 'numeric',
        month: 'long'
    });

    // Helper to transliterate or map Hijri month to Spanish/English script as per user image
    const getSpanishHijri = () => {
        const parts = hijriDate.split(' ');
        const day = parts[0];
        const monthAr = parts[1];

        const monthMap: Record<string, string> = {
            'محرم': 'Muharram',
            'صفر': 'Safar',
            'ربيع الأول': 'Rabi I',
            'ربيع الآخر': 'Rabi II',
            'جمادى الأولى': 'Jumada I',
            'جمادى الآخرة': 'Jumada II',
            'رجب': 'Rajab',
            'شعبان': 'Shaban',
            'رمضان': 'Ramadan',
            'شوال': 'Shawwal',
            'ذو القعدة': 'Dhu al-Qi\'dah',
            'ذو الحجة': 'Dhu al-Hijjah'
        };

        return `${day} de ${monthMap[monthAr] || monthAr}`;
    };

    const hijriSpanish = getSpanishHijri();

    // Check for upcoming events every 30 seconds
    useEffect(() => {
        const checkUpcomingEvents = () => {
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            // Collect all today's events with times
            const todayEvents: UpcomingEvent[] = [];

            // Appointments
            (appointments || []).forEach((apt: any) => {
                if (apt.date === today && apt.time) {
                    const [hours, minutes] = apt.time.split(':').map(Number);
                    const eventMinutes = hours * 60 + minutes;
                    const diff = eventMinutes - currentMinutes;

                    // 5 minutes or less before event
                    if (diff > 0 && diff <= 5) {
                        todayEvents.push({
                            title: apt.title,
                            time: apt.time,
                            type: 'appointment',
                            color: 'bg-orange-500'
                        });
                    }
                }
            });

            // Tasks with deadlines today
            (tasks || []).forEach((task: any) => {
                if (task.deadline?.startsWith(today) && task.deadline.includes('T')) {
                    const timePart = task.deadline.split('T')[1]?.substring(0, 5);
                    if (timePart) {
                        const [hours, minutes] = timePart.split(':').map(Number);
                        const eventMinutes = hours * 60 + minutes;
                        const diff = eventMinutes - currentMinutes;

                        if (diff > 0 && diff <= 5) {
                            todayEvents.push({
                                title: task.title,
                                time: timePart,
                                type: 'task',
                                color: 'bg-blue-500'
                            });
                        }
                    }
                }
            });

            /* Habits check removed as they are not in the main app store */

            // Show the nearest upcoming event
            if (todayEvents.length > 0) {
                setUpcomingEvent(todayEvents[0]);
                setShowEventBanner(true);

                // Hide after 5 seconds
                setTimeout(() => {
                    setShowEventBanner(false);
                }, 5000);
            }
        };

        checkUpcomingEvents();
        const interval = setInterval(checkUpcomingEvents, 30000); // Every 30 seconds

        return () => clearInterval(interval);
    }, [appointments, tasks]);

    return (
        <>
            {/* ===== INTERACTIVE HEADER ===== */}
            <div className={`relative ${isAndroid() ? 'pt-[6mm]' : 'pt-2'} mb-2`}>
                {/* Event Notification Banner (slides in when event is near) */}
                {showEventBanner && upcomingEvent && (
                    <div
                        className={`absolute inset-0 z-10 ${upcomingEvent.color} text-white rounded-2xl p-4 shadow-lg animate-pulse flex items-center justify-between`}
                        style={{ animation: 'slideIn 0.3s ease-out' }}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">
                                {upcomingEvent.type === 'appointment' ? '📅' : upcomingEvent.type === 'task' ? '✅' : '🎯'}
                            </span>
                            <div>
                                <p className="font-bold text-lg">{upcomingEvent.title}</p>
                                <p className="text-sm opacity-90">الساعة {upcomingEvent.time} - خلال دقائق!</p>
                            </div>
                        </div>
                        <div className="text-4xl animate-bounce">⏰</div>
                    </div>
                )}

                {/* Normal Header */}
                <div className={`bg-gradient-to-br from-white to-emerald-50/50 rounded-2xl p-1 shadow-sm border border-emerald-50/50 transition-opacity ${showEventBanner ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1.5">
                        {/* Notification Bell - Left Side */}
                        <div className="flex items-center gap-1 order-1">
                            <NotificationBell />
                        </div>

                        {/* Logo - Centered */}
                        <div
                            className="flex flex-col items-center justify-center cursor-pointer select-none active:scale-95 transition-transform order-2"
                            onMouseDown={() => {
                                (window as any).logoPressTimer = setTimeout(() => {
                                    (window as any).logoIsLongPress = true;
                                    if (navigator.vibrate) navigator.vibrate(50);
                                    window.dispatchEvent(new Event('open-report-generator'));
                                }, 600);
                            }}
                            onMouseUp={() => {
                                clearTimeout((window as any).logoPressTimer);
                                if (!(window as any).logoIsLongPress) {
                                    setShowBarakahPopup(true);
                                }
                                (window as any).logoIsLongPress = false;
                            }}
                            onTouchStart={() => {
                                (window as any).logoPressTimer = setTimeout(() => {
                                    (window as any).logoIsLongPress = true;
                                    if (navigator.vibrate) navigator.vibrate(50);
                                    window.dispatchEvent(new Event('open-report-generator'));
                                }, 600);
                            }}
                            onTouchEnd={() => {
                                clearTimeout((window as any).logoPressTimer);
                                if (!(window as any).logoIsLongPress) {
                                    setShowBarakahPopup(true);
                                }
                                (window as any).logoIsLongPress = false;
                            }}
                        >
                            <h1 className="text-2xl md:text-2xl font-extrabold text-gray-900 tracking-tight font-arabic">البركة</h1>
                        </div>

                        {/* Date Info - Right Side */}
                        <div
                            className="text-right flex flex-col items-end gap-0 order-3 min-w-[65px] cursor-pointer"
                            onClick={() => setShowHolidaysPopup(true)}
                        >
                            <span className="text-[11px] font-bold text-gray-600 leading-none">{spanishDate}</span>
                            <span className="text-[10px] text-gray-400 leading-none">{hijriSpanish}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Holidays Dialog */}
            <HolidaysDialog open={showHolidaysPopup} onOpenChange={setShowHolidaysPopup} />

            {/* Barakah Credits Popup */}
            <Dialog open={showBarakahPopup} onOpenChange={setShowBarakahPopup}>
                <DialogContent className="w-[85%] max-w-[280px] rounded-xl text-center bg-white/95 backdrop-blur border-emerald-100 !top-32 !translate-y-0 p-4 shadow-xl">
                    <DialogHeader className="mb-2">
                        <DialogTitle className="text-emerald-700 font-bold text-lg">✨ البركة ✨</DialogTitle>
                    </DialogHeader>
                    <div className="py-2 space-y-3">
                        <p className="text-base font-medium text-gray-700 leading-relaxed font-arabic">
                            "اللهم بارك لنا في أعمالنا وأعمارنا"
                        </p>
                        <div className="w-12 h-1 bg-emerald-100 mx-auto rounded-full"></div>
                        <div className="text-xs text-gray-500">
                            <p>فكرة وتنفيذ</p>
                            <p className="font-bold text-emerald-600 mt-1">محمد زاهر</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* CSS Animation */}
            <style>{`
                @keyframes slideIn {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </>
    );
};

export default DashboardHeader;
