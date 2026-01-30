import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Clock, Calendar, ChevronRight, Play, Pause, ChevronLeft, MapPin, Info } from 'lucide-react';
import { useTime } from '@/hooks/useTime';
import { useAppointments, Appointment } from '@/hooks/useAppointments';
import { useTasks, MainTask } from '@/hooks/useTasks';
import { useMedications } from '@/hooks/useMedications';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { useHabits } from '@/hooks/useHabits';
import { useShoppingList } from '@/hooks/useShoppingList';
import { useToast } from '@/hooks/use-toast';

interface ActiveTimerCardProps {
    onOpenEvent?: (event: Appointment | MainTask) => void;
    onOpenCalendar?: () => void;
}

export const ActiveTimerCard: React.FC<ActiveTimerCardProps> = ({
    onOpenEvent,
    onOpenCalendar
}) => {
    const now = useTime(60000); // Update every minute
    const { appointments } = useAppointments();
    const { tasks } = useTasks();
    const { medications } = useMedications();
    const { habits } = useHabits();
    const { items: shoppingList } = useShoppingList();
    const { toast } = useToast();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [displayItems, setDisplayItems] = useState<any[]>([]); // Using any for flexibility or define a union type
    const [timeLeft, setTimeLeft] = useState('');

    // Combine and sort upcoming events and tasks with deadlines
    useEffect(() => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const dayMap = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const todayDayName = dayMap[today.getDay()];

        // 1. Appointments (Today & Future)
        const activeAppointments = appointments
            .filter(a => {
                const eventDate = new Date(`${a.date}T${a.time || '00:00'}`);
                return eventDate >= new Date() && !a.is_completed;
            })
            .map(a => ({ ...a, type: 'appointment', sortTime: new Date(`${a.date}T${a.time || '00:00'}`).getTime() }));

        // 2. Tasks (Deadline >= Today, Not Completed)
        const activeTasks = tasks
            .filter(t => t.type === 'task' && t.deadline && new Date(t.deadline) >= new Date(new Date().setHours(0, 0, 0, 0)) && t.progress < 100)
            .map(t => ({
                ...t,
                date: t.deadline,
                time: t.time || '23:59',
                type: 'task',
                sortTime: new Date(`${t.deadline}T${t.time || '23:59'}`).getTime()
            }));

        // 3. Projects (Active)
        const activeProjects = tasks
            .filter(t => t.type === 'project' && t.deadline && new Date(t.deadline) >= new Date(new Date().setHours(0, 0, 0, 0)) && t.progress < 100)
            .map(t => ({
                ...t,
                date: t.deadline,
                time: '23:59',
                type: 'project',
                title: `مشروع: ${t.title}`,
                sortTime: new Date(`${t.deadline}T23:59`).getTime() + 1000 // Push slighty after tasks
            }));

        // 4. Medications (Due Today, Not Taken)
        const activeMedications = medications
            .filter(m => {
                const isTodayDue = m.frequency === 'daily' ||
                    (m.frequency === 'specific_days' && m.customDays?.includes(todayDayName));
                const isTaken = m.takenHistory && m.takenHistory[todayStr];
                return isTodayDue && !isTaken;
            })
            .map(m => {
                // Determine time
                let time = m.time;
                if (m.frequency === 'specific_days' && m.customTimes && m.customTimes[todayDayName]) {
                    time = m.customTimes[todayDayName];
                }
                return {
                    id: m.id,
                    title: `دواء: ${m.name}`,
                    date: todayStr,
                    time: time || '08:00',
                    type: 'medication',
                    location: null,
                    sortTime: new Date(`${todayStr}T${time || '08:00'}`).getTime()
                };
            });

        // 5. Habits (Due Today, Not Completed)
        const activeHabits = habits
            .filter(h => {
                const isTodayDue = h.frequency === 'daily' ||
                    (h.frequency === 'specific_days' && h.customDays?.includes(todayDayName));
                const history = h.history || {};
                // Check if completed (for simple boolean history) or count < timesPerDay
                const entry = history[todayStr];
                const isCompleted = entry === true || (typeof entry === 'number' && entry >= (h.timesPerDay || 1));
                return isTodayDue && !isCompleted;
            })
            .map(h => ({
                id: h.id,
                title: `عادة: ${h.name}`,
                date: todayStr,
                time: '23:59', // Habits are usually all day
                type: 'habit',
                location: null,
                sortTime: new Date(`${todayStr}T23:59`).getTime() + 2000
            }));

        // 6. Shopping List (If items exist and not completed)
        const shoppingCount = shoppingList.filter(i => !i.completed).length;
        const activeShopping = shoppingCount > 0 ? [{
            id: 'shopping-summary',
            title: `تسوّق: ${shoppingCount} أغراض مطلوبة`,
            date: todayStr,
            time: '23:59',
            type: 'shopping',
            location: null,
            sortTime: new Date().getTime() // Priority? Maybe current time to show it relevantly
        }] : [];


        // Combine all
        const allItems = [
            ...activeAppointments,
            ...activeTasks,
            ...activeProjects,
            ...activeMedications,
            ...activeHabits,
            ...activeShopping
        ]
            .sort((a, b) => a.sortTime - b.sortTime)
            .slice(0, 8); // Increase limit slightly to show variety if many exist

        setDisplayItems(allItems);

        // Reset index if out of bounds (e.g. filtered items changed)
        if (currentIndex >= allItems.length) {
            setCurrentIndex(0);
        }

    }, [appointments, tasks, medications, habits, shoppingList, now, currentIndex]);


    // Styling helpers for types
    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'appointment': return "bg-orange-100 text-orange-700";
            case 'task': return "bg-blue-100 text-blue-700";
            case 'project': return "bg-indigo-100 text-indigo-700";
            case 'medication': return "bg-red-100 text-red-700";
            case 'habit': return "bg-green-100 text-green-700";
            case 'shopping': return "bg-pink-100 text-pink-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'appointment': return 'Cita';
            case 'task': return 'Tarea';
            case 'project': return 'Proyecto';
            case 'medication': return 'Dosis';
            case 'habit': return 'Hábito';
            case 'shopping': return 'Compras';
            default: return 'Evento';
        }
    };

    const currentItem = displayItems[currentIndex];

    // Update countdown timer
    useEffect(() => {
        if (!currentItem) {
            setTimeLeft('');
            return;
        }

        const targetDateStr = currentItem.date;
        const targetTimeStr = currentItem.time || '00:00';
        const target = new Date(`${targetDateStr}T${targetTimeStr}`);

        const updateTimer = () => {
            const now = new Date();
            const diff = target.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft('¡Es hora!');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) setTimeLeft(`${days}d ${hours}h`);
            else setTimeLeft(`${hours}:${minutes.toString().padStart(2, '0')}`);
        };

        const timerInterval = setInterval(updateTimer, 60000); // Check every minute
        updateTimer(); // Initial check

        return () => clearInterval(timerInterval);
    }, [currentItem]);

    const getFormattedDate = (item: any) => {
        if (!item) return { dateDisplay: '', timeDisplay: '' };

        // Items like Shopping or Habits might not have a specific time, default to all day
        if (item.type === 'habit' || item.type === 'shopping' || item.type === 'project') {
            return { dateDisplay: 'Hoy', timeDisplay: 'Todo el día' };
        }

        const dateStr = item.date;
        const timeStr = item.time || '00:00';

        if (!dateStr) return { dateDisplay: '', timeDisplay: '' };

        const date = new Date(`${dateStr}T${timeStr}`);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let dateDisplay = format(date, 'EEEE d MMMM', { locale: es });
        if (date.toDateString() === today.toDateString()) {
            dateDisplay = 'Hoy';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            dateDisplay = 'Mañana';
        }

        // Capitalize first letter
        dateDisplay = dateDisplay.charAt(0).toUpperCase() + dateDisplay.slice(1);

        return {
            dateDisplay,
            timeDisplay: timeStr ? format(date, 'h:mm a', { locale: es }) : ''
        };
    };

    if (!currentItem) {
        // Fallback state when no events
        return (
            <Card
                onClick={onOpenCalendar}
                className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 border-0 shadow-lg group active:scale-[0.98] transition-all duration-200 h-32 md:h-40 cursor-pointer"
            >
                <div className="absolute inset-0 bg-[url('/patterns/islamic-geometric.png')] opacity-10 mix-blend-overlay" />
                <div className="absolute top-0 right-0 p-3 opacity-20">
                    <Calendar className="w-16 h-16 text-white rotate-12" />
                </div>

                <div className="relative z-10 h-full flex flex-col justify-center items-start px-6 text-white space-y-1">
                    <span className="text-violet-200 text-sm font-medium">No hay eventos próximos</span>
                    <h3 className="text-2xl md:text-3xl font-bold tracking-tight">Descansa y planifica</h3>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-violet-100 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm mt-2">
                        <Play className="w-3 h-3 fill-current" />
                        <span>Toca para añadir</span>
                    </div>
                </div>
            </Card>
        );
    }

    const { dateDisplay, timeDisplay } = getFormattedDate(currentItem);
    const isToday = dateDisplay === 'Hoy';


    return (
        <Card
            onClick={() => {
                if (displayItems.length > 1) {
                    setCurrentIndex(prev => (prev + 1) % displayItems.length);
                }
            }}
            className="relative overflow-hidden bg-white dark:bg-zinc-900 border-0 shadow-md h-32 cursor-pointer group active:scale-[0.98] transition-all duration-200 flex flex-col justify-between"
        >
            {/* Background Decoration */}
            <div className={cn(
                "absolute top-0 right-0 w-1.5 h-full z-20",
                isToday ? "bg-amber-500" : "bg-blue-500"
            )} />

            {/* Row 1: Header (Right) & Time (Left) */}
            <div className="flex justify-between items-start px-5 py-3 border-b border-gray-100 z-10 relative bg-white/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 pr-2">
                    <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        getTypeStyles(currentItem.type)
                    )}>
                        {getTypeLabel(currentItem.type)}
                    </span>
                    <h3 className="text-base font-bold text-gray-800 line-clamp-1 max-w-[150px]">
                        {currentItem.title.replace(/^(دواء:|عادة:|مشروع:|تسوّق:)\s*/, '')}
                    </h3>
                </div>

                <div className="flex flex-col items-end text-xs font-bold text-gray-500">
                    <span className="text-gray-800">{dateDisplay}</span>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Clock className="w-3 h-3" /> {timeDisplay}
                    </div>
                </div>
            </div>

            {/* Row 2: Timer (Right) & Info (Left) */}
            <div className="flex-1 flex items-center justify-between px-5 relative z-10">
                {/* Right: Countdown */}
                <div className="flex items-end flex-col">
                    <span className="text-[10px] text-gray-400 font-bold mb-0.5">Tiempo restante</span>
                    <div className="text-2xl font-black font-mono tracking-tight text-gray-800 flex items-center gap-1">
                        {timeLeft}
                    </div>
                </div>

                {/* Left/Center: Additional Info */}
                <div className="flex-1 flex flex-col items-end pl-2">
                    {currentItem.location ? (
                        <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 max-w-full">
                            <span className="text-xs font-bold text-gray-600 truncate max-w-[120px]">{currentItem.location}</span>
                            <div className="bg-red-100 p-1 rounded-full"><MapPin className="w-3 h-3 text-red-500" /></div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                            <span className="text-xs font-bold text-gray-400">
                                {currentItem.type === 'shopping' ? 'Elementos en lista' :
                                    currentItem.type === 'medication' ? 'Hora de la dosis' :
                                        currentItem.type === 'habit' ? 'Hábito diario' : 'Sin ubicación'}
                            </span>
                            <div className="bg-gray-100 p-1 rounded-full"><Info className="w-3 h-3 text-gray-400" /></div>
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination Dots (if multiple) */}
            {displayItems.length > 1 && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 z-30">
                    {displayItems.map((_, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "w-1 h-1 rounded-full transition-all",
                                idx === currentIndex ? "bg-gray-800 w-3" : "bg-gray-300"
                            )}
                        />
                    ))}
                </div>
            )}
        </Card>
    );
};
