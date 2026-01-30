import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, CheckSquare, ShoppingCart, Target, ChevronLeft, Plus, Clock, ChevronRight } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { useShoppingList } from '@/hooks/useShoppingList';
import { useHabits } from '@/hooks/useHabits';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

interface UnifiedDashboardCardProps {
    onOpenAdd: (type: 'task' | 'appointment' | 'goal' | 'shopping' | 'project' | 'medication' | 'habit') => void;
    onOpenEvent?: (event: any) => void;
    onOpenCalendar?: () => void;
}

type SlideType = 'agenda' | 'shopping' | 'goals' | 'projects' | 'appointment' | 'task';

export const UnifiedDashboardCard: React.FC<UnifiedDashboardCardProps> = ({ onOpenAdd, onOpenEvent, onOpenCalendar }) => {
    // Data Hooks
    const { tasks } = useTasks();
    const { appointments } = useAppointments();
    const { items: shoppingItems } = useShoppingList();
    const { habits } = useHabits();

    // 1. Data Preparation
    const slides = React.useMemo(() => {
        const items: {
            id: string;
            type: SlideType;
            title: string;
            subtitle?: string;
            meta?: string;
            icon: any;
            progress?: number;
            data: any;
            gradient: string;
            textColor: string;
            accentColor: string;
        }[] = [];

        // Agenda Items (Tasks + Appointments)
        const today = new Date().toISOString().split('T')[0];

        // Appointments
        appointments
            .filter(a => a.date === today)
            .forEach(a => {
                items.push({
                    id: `appt-${a.id}`,
                    type: 'appointment',
                    title: a.title,
                    subtitle: a.location || 'موعد',
                    meta: a.time,
                    icon: Clock,
                    data: a,
                    gradient: "from-violet-500 to-fuchsia-600",
                    textColor: "text-white",
                    accentColor: "bg-white/20"
                });
            });

        // Tasks (Due Today)
        tasks
            .filter(t => t.progress < 100 && t.deadline?.startsWith(today))
            .forEach(t => {
                items.push({
                    id: `task-${t.id}`,
                    type: 'task',
                    title: t.title,
                    subtitle: 'مهمة اليوم',
                    meta: t.time || '23:59',
                    icon: CheckSquare,
                    data: t,
                    gradient: "from-blue-500 to-cyan-500",
                    textColor: "text-white",
                    accentColor: "bg-white/20"
                });
            });

        // Shopping Items (Unchecked)
        shoppingItems
            .filter(i => !i.completed)
            .slice(0, 5) // Limit just in case
            .forEach(i => {
                items.push({
                    id: `shop-${i.id}`,
                    type: 'shopping',
                    title: i.text,
                    subtitle: i.quantity > 1 ? `الكمية: ${i.quantity}` : 'لشراء',
                    icon: ShoppingCart,
                    data: i,
                    gradient: "from-pink-500 to-rose-500",
                    textColor: "text-white",
                    accentColor: "bg-white/20"
                });
            });

        // Habits (Active)
        habits
            .slice(0, 3)
            .forEach(h => {
                items.push({
                    id: `habit-${h.id}`,
                    type: 'goals',
                    title: h.name,
                    subtitle: `${h.streak} يوم متتالي`,
                    progress: Math.min(100, (h.streak / 66) * 100),
                    icon: Target,
                    data: h,
                    gradient: "from-emerald-500 to-teal-500",
                    textColor: "text-white",
                    accentColor: "bg-white/20"
                });
            });

        // Projects
        tasks
            .filter(t => t.type === 'project' && t.progress < 100)
            .slice(0, 3)
            .forEach(p => {
                items.push({
                    id: `proj-${p.id}`,
                    type: 'projects',
                    title: p.title,
                    subtitle: `${p.progress}% مكتمل`,
                    progress: p.progress,
                    icon: Target,
                    data: p,
                    gradient: "from-indigo-500 to-blue-600",
                    textColor: "text-white",
                    accentColor: "bg-white/20"
                });
            });

        // Productivity Items (Focus & Reading from Tasks/Habits)
        // We can simulate productivity cues or specific tasks tagged as 'focus'
        // For now, let's mix in "Deep Work" suggestions if user has many tasks
        if (tasks.filter(t => t.progress < 100).length > 3) {
            items.push({
                id: 'prod-focus',
                type: 'goals',
                title: 'جلسة تركيز عميق',
                subtitle: 'لديك مهام متراكمة، خصص ساعة للتركيز',
                icon: Target,
                data: null,
                gradient: "from-indigo-600 to-purple-700",
                textColor: "text-white",
                accentColor: "bg-white/20"
            });
        }

        // Empty State
        if (items.length === 0) {
            items.push({
                id: 'empty',
                type: 'agenda',
                title: 'لا يوجد مهام حالياً',
                subtitle: 'استمتع بوقتك!',
                icon: Calendar,
                data: null,
                gradient: "from-slate-700 to-slate-800",
                textColor: "text-white",
                accentColor: "bg-white/10"
            });
        }

        return items;
    }, [tasks, appointments, shoppingItems, habits]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Reset index safely
    useEffect(() => {
        if (currentIndex >= slides.length) {
            setCurrentIndex(0);
        }
    }, [slides.length]);

    // Auto-Rotation
    useEffect(() => {
        if (slides.length <= 1 || isPaused) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % slides.length);
        }, 3500); // Slightly slower for better readability
        return () => clearInterval(interval);
    }, [slides.length, isPaused]);

    const activeItem = slides[currentIndex] || slides[0];
    const Icon = activeItem.icon;

    // Navigation
    const handleNext = () => setCurrentIndex(prev => (prev + 1) % slides.length);
    const handlePrev = () => setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length);

    // Helpers
    const getCountdown = (timeStr?: string) => {
        if (!timeStr) return null;
        const now = new Date();
        const [hours, minutes] = timeStr.split(':').map(Number);
        const eventTime = new Date();
        eventTime.setHours(hours, minutes, 0, 0);

        const diff = (eventTime.getTime() - now.getTime()) / 60000; // minutes

        if (diff < 0) return 'انتهى';
        if (diff < 60) return `${Math.floor(diff)} دقيقة`;
        const h = Math.floor(diff / 60);
        const m = Math.floor(diff % 60);
        return `${h} ساعة ${m} دقيقة`;
    };

    const countdown = activeItem.meta ? getCountdown(activeItem.meta) : null;

    return (
        <Card
            className={cn(
                "w-full overflow-hidden border-0 shadow-xl rounded-[1.5rem] transition-all duration-700 bg-gradient-to-br min-h-[90px] relative group",
                activeItem.gradient
            )}
            dir="rtl"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
        >
            <CardContent className="p-3 relative h-full flex flex-col justify-center gap-1 z-10">

                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                {/* row 1: Icon - Title - Countdown */}
                <div className="flex items-center gap-2 w-full">
                    <div className={cn("p-1.5 rounded-xl backdrop-blur-md border border-white/10 shrink-0", activeItem.accentColor)}>
                        <Icon className={cn("w-4 h-4", activeItem.textColor)} />
                    </div>

                    <div className="flex-1 min-w-0 flex items-center gap-2"
                        onClick={() => {
                            if (activeItem.data && onOpenEvent && (activeItem.type === 'task' || activeItem.type === 'appointment')) {
                                onOpenEvent(activeItem.data);
                            } else {
                                handleNext();
                            }
                        }}
                    >
                        <h2 className={cn("text-lg font-bold leading-tight truncate drop-shadow-sm", activeItem.textColor)}>
                            {activeItem.title}
                        </h2>
                    </div>

                    {(countdown || activeItem.meta) && (
                        <div className={cn(
                            "px-2 py-0.5 rounded-lg backdrop-blur-md border border-white/10 shadow-sm flex items-center gap-1 shrink-0",
                            activeItem.accentColor
                        )}>
                            <Clock className={cn("w-3 h-3 opacity-80", activeItem.textColor)} />
                            <span className={cn("text-[10px] font-bold font-mono pt-0.5", activeItem.textColor)}>
                                {countdown || activeItem.meta}
                            </span>
                        </div>
                    )}
                </div>

                {/* Row 2: Indicators - Subtitle - Progress - Button */}
                <div className="flex items-center justify-between gap-2 w-full mt-0.5">

                    {/* Dots + Subtitle Group */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="flex gap-0.5 shrink-0">
                            {slides.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "h-1 rounded-full transition-all duration-500",
                                        idx === currentIndex ? "w-3 bg-white" : "w-1 bg-white/30"
                                    )}
                                />
                            ))}
                        </div>
                        <p className={cn("text-xs font-medium opacity-80 truncate", activeItem.textColor)}>
                            {activeItem.subtitle}
                        </p>
                    </div>

                    {/* Progress Bar (if exists) */}
                    {activeItem.progress !== undefined && (
                        <div className="w-16 h-1 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm shrink-0">
                            <div
                                className="h-full bg-white shadow-[0_0_5px_rgba(255,255,255,0.4)] transition-all duration-1000 ease-out"
                                style={{ width: `${activeItem.progress}%` }}
                            />
                        </div>
                    )}

                    {/* Action Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (activeItem.type === 'shopping') onOpenAdd('shopping');
                            else if (activeItem.type === 'goals') onOpenAdd('habit');
                            else if (activeItem.type === 'projects') onOpenAdd('project');
                            else onOpenAdd('task');
                        }}
                        className={cn(
                            "rounded-full p-1.5 backdrop-blur-md border border-white/20 shadow-sm transition-all active:scale-95 hover:bg-white/20 shrink-0",
                            activeItem.accentColor,
                            activeItem.textColor
                        )}
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Click Areas for Navigation */}
                <div className="absolute inset-y-0 left-0 w-8 z-0" onClick={(e) => { e.stopPropagation(); handleNext(); }} />
                <div className="absolute inset-y-0 right-0 w-8 z-0" onClick={(e) => { e.stopPropagation(); handlePrev(); }} />

            </CardContent>
        </Card>
    );
};
