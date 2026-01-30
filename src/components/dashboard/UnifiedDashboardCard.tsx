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
                "w-full overflow-hidden border-0 shadow-xl rounded-[2rem] transition-all duration-700 bg-gradient-to-br min-h-[145px] relative group",
                activeItem.gradient
            )}
            dir="rtl"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
        >
            <CardContent className="p-5 relative h-full flex flex-col justify-between z-10">

                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-black/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

                {/* Header: Category & Meta */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2.5 rounded-2xl backdrop-blur-xl shadow-lg border border-white/10", activeItem.accentColor)}>
                            <Icon className={cn("w-5 h-5", activeItem.textColor)} />
                        </div>
                        <div className="flex flex-col">
                            <span className={cn("text-[10px] font-bold tracking-wider uppercase opacity-70", activeItem.textColor)}>
                                {activeItem.type === 'shopping' ? 'تسوّق' :
                                    activeItem.type === 'goals' ? 'عادات' :
                                        activeItem.type === 'projects' ? 'مشاريع' :
                                            activeItem.type === 'appointment' ? 'موعد' : 'مهام'}
                            </span>
                            {/* Pagination Indicators - Moved here for cleaner look */}
                            <div className="flex gap-1 mt-1">
                                {slides.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "h-1 rounded-full transition-all duration-500",
                                            idx === currentIndex ? "w-4 bg-white" : "w-1 bg-white/30"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Meta Badge (Countdown or Time) */}
                    {(countdown || activeItem.meta) && (
                        <div className={cn(
                            "px-3 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-sm flex items-center gap-1.5",
                            activeItem.accentColor
                        )}>
                            <Clock className={cn("w-3 h-3 opacity-80", activeItem.textColor)} />
                            <span className={cn("text-xs font-bold font-mono pt-0.5", activeItem.textColor)}>
                                {countdown || activeItem.meta}
                            </span>
                        </div>
                    )}
                </div>

                {/* Main Content: Title & Action */}
                <div className="mt-2 flex flex-col gap-1 z-20"
                    onClick={() => {
                        if (activeItem.data && onOpenEvent && (activeItem.type === 'task' || activeItem.type === 'appointment')) {
                            onOpenEvent(activeItem.data);
                        } else {
                            handleNext();
                        }
                    }}
                >
                    <h2 className={cn("text-2xl font-black leading-tight tracking-tight line-clamp-2 drop-shadow-sm", activeItem.textColor)}>
                        {activeItem.title}
                    </h2>
                    <p className={cn("text-sm font-medium opacity-85 line-clamp-1", activeItem.textColor)}>
                        {activeItem.subtitle}
                    </p>
                </div>

                {/* Footer: Progress & Quick Action */}
                <div className="flex items-end justify-between mt-3">
                    {/* Progress Bar */}
                    <div className="flex-1 pl-6">
                        {activeItem.progress !== undefined ? (
                            <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                                <div
                                    className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.4)] transition-all duration-1000 ease-out"
                                    style={{ width: `${activeItem.progress}%` }}
                                />
                            </div>
                        ) : (
                            // If no progress, maybe show a motivational quote or just spacer
                            <div className="h-1.5" />
                        )}
                    </div>

                    {/* Quick Add Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (activeItem.type === 'shopping') onOpenAdd('shopping');
                            else if (activeItem.type === 'goals') onOpenAdd('habit');
                            else if (activeItem.type === 'projects') onOpenAdd('project');
                            else onOpenAdd('task');
                        }}
                        className={cn(
                            "rounded-full p-2.5 backdrop-blur-md border border-white/20 shadow-lg transition-all active:scale-95 hover:bg-white/20 hover:scale-105",
                            activeItem.accentColor,
                            activeItem.textColor
                        )}
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {/* Click Areas for Navigation */}
                <div className="absolute inset-y-0 left-0 w-16 z-0" onClick={(e) => { e.stopPropagation(); handleNext(); }} />
                <div className="absolute inset-y-0 right-0 w-16 z-0" onClick={(e) => { e.stopPropagation(); handlePrev(); }} />

            </CardContent>
        </Card>
    );
};
