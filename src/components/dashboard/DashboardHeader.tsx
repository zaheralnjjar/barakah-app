import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NotificationBell } from '@/components/NotificationBell';
import HolidaysDialog from '@/components/HolidaysDialog';
import { useAppStore } from '@/stores/useAppStore';

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

    const { appointments, tasks, habits } = useAppStore();

    const hijriDate = currentDate.toLocaleDateString('ar-SA-u-ca-islamic', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

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

            // Habits with scheduled times
            (habits || []).forEach((habit: any) => {
                if (habit.time) {
                    const [hours, minutes] = habit.time.split(':').map(Number);
                    const eventMinutes = hours * 60 + minutes;
                    const diff = eventMinutes - currentMinutes;

                    if (diff > 0 && diff <= 5) {
                        todayEvents.push({
                            title: habit.name || habit.title,
                            time: habit.time,
                            type: 'habit',
                            color: 'bg-purple-500'
                        });
                    }
                }
            });

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
    }, [appointments, tasks, habits]);

    return (
        <>
            {/* ===== INTERACTIVE HEADER ===== */}
            <div className="relative mb-6">
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
                <div className={`bg-gradient-to-l from-emerald-50 to-white rounded-2xl p-4 shadow-sm border border-emerald-100 transition-opacity ${showEventBanner ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="flex items-center justify-between gap-3">
                        {/* Date Info - Right Side (First in RTL) - CLICKABLE */}
                        <div
                            className="bg-emerald-100 text-emerald-700 rounded-xl px-4 py-2 text-center min-w-[120px] cursor-pointer hover:bg-emerald-200 transition-colors"
                            onClick={() => setShowHolidaysPopup(true)}
                        >
                            <span className="text-sm font-bold block">{currentDate.getDate()} {currentDate.toLocaleDateString('ar', { month: 'long' })}</span>
                            <div className="border-t border-emerald-300 my-1"></div>
                            <span className="text-xs block">{hijriDate}</span>
                        </div>

                        {/* Logo - Centered & Larger */}
                        <div className="flex-1 text-center cursor-pointer" onClick={() => setShowBarakahPopup(true)}>
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">البركة</h1>
                            <span className="text-xs text-gray-400">Barakah Life</span>
                        </div>

                        {/* Notification Bell - Left Side (Last in RTL) */}
                        <div className="flex items-center">
                            <NotificationBell />
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
