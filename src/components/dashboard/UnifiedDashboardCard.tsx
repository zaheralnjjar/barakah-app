import React, { useState, useEffect, useRef } from 'react';
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
    onOpenAdd: (type: 'task' | 'appointment' | 'goal' | 'shopping' | 'project') => void;
    onOpenEvent?: (event: any) => void;
    onOpenCalendar?: () => void;
}

type SectionType = 'agenda' | 'shopping' | 'goals' | 'projects';

export const UnifiedDashboardCard: React.FC<UnifiedDashboardCardProps> = ({ onOpenAdd, onOpenEvent, onOpenCalendar }) => {
    // Data Hooks
    const { tasks } = useTasks();
    const { appointments } = useAppointments();
    const { items: shoppingItems } = useShoppingList();
    const { habits } = useHabits();

    // 1. Agenda Logic
    const todayAgenda = React.useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const todayTasks = tasks
            .filter(t => t.progress < 100 && t.deadline?.startsWith(today))
            .map(t => ({ ...t, type: 'task' as const, time: t.time || '23:59' }));
        const todayAppts = appointments
            .filter(a => a.date === today)
            .map(a => ({ ...a, type: 'appointment' as const, time: a.time }));
        return [...todayTasks, ...todayAppts]
            .sort((a, b) => a.time.localeCompare(b.time))
            .slice(0, 4);
    }, [tasks, appointments]);

    // 2. Shopping Logic
    const pendingShopping = shoppingItems.filter(i => !i.completed).slice(0, 4);

    // 3. Goals/Habits Logic
    const activeHabits = habits.slice(0, 4);

    // 4. Projects Logic
    const activeProjects = tasks
        .filter(t => (t.type === 'project' || (t.type as any) === 'goal') && t.progress < 100)
        .slice(0, 4);

    // Determine available slides
    const slides = React.useMemo(() => {
        const available: { type: SectionType, title: string, color: string, icon: any }[] = [];

        // Always show agenda? Or only if has items? User said "Only display available info".
        // But if everything is empty, we should probably show at least Agenda or a "Nothing today" state.
        // Let's assume Agenda is always valid to show "Next upcoming" or standard view, 
        // but if strictly "only available", we filter.
        // However, if ALL are empty, we need a fallback.

        if (todayAgenda.length > 0) available.push({ type: 'agenda', title: 'اليوم', color: 'text-indigo-600', icon: Calendar });
        if (pendingShopping.length > 0) available.push({ type: 'shopping', title: 'تسوق', color: 'text-pink-600', icon: ShoppingCart });
        if (activeHabits.length > 0) available.push({ type: 'goals', title: 'أهداف', color: 'text-emerald-600', icon: Target });
        if (activeProjects.length > 0) available.push({ type: 'projects', title: 'مشاريع', color: 'text-blue-600', icon: Target });

        // Fallback if absolutely empty
        if (available.length === 0) {
            available.push({ type: 'agenda', title: 'اليوم', color: 'text-gray-400', icon: Calendar });
        }

        return available;
    }, [todayAgenda.length, pendingShopping.length, activeHabits.length, activeProjects.length]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Reset index if slides change significantly (optional, but safer)
    useEffect(() => {
        if (currentIndex >= slides.length) {
            setCurrentIndex(0);
        }
    }, [slides.length]);

    // Auto-Rotation Logic
    useEffect(() => {
        // If only 1 slide, no need to rotate
        if (slides.length <= 1) return;

        const startTimer = () => {
            timeoutRef.current = setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % slides.length);
            }, 3000); // 3 Seconds
        };

        startTimer();

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [currentIndex, slides.length]); // Dep includes currentIndex to re-trigger on change

    const activeSlide = slides[currentIndex] || slides[0];

    // Manual Navigation
    const handleNext = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setCurrentIndex((prev) => (prev + 1) % slides.length);
    };

    const handlePrev = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    };

    // Render Content based on active slide
    const renderContent = () => {
        switch (activeSlide.type) {
            case 'agenda':
                if (todayAgenda.length === 0) return (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-400 gap-2">
                        <CheckSquare className="w-8 h-8 opacity-20" />
                        <p className="text-xs">يومك فارغ! استرح قليلاً.</p>
                    </div>
                );
                return (
                    <div className="space-y-2 animate-in fade-in duration-500">
                        {todayAgenda.map((item) => (
                            <div
                                key={`${item.type}-${item.id}`}
                                className="flex items-center gap-3 p-2 rounded-xl bg-white border border-gray-100 hover:border-indigo-100 transition-all group cursor-pointer"
                                onClick={() => onOpenEvent && onOpenEvent(item)}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                    item.type === 'appointment' ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
                                )}>
                                    {item.type === 'appointment' ? <Clock className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-800 text-sm truncate">{item.title}</h4>
                                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                        {format(new Date(`2000-01-01T${item.time}`), 'p', { locale: arSA })}
                                        {item.type === 'appointment' && ` • ${item.location || 'بدون موقع'}`}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'shopping':
                return (
                    <div className="grid grid-cols-2 gap-2 animate-in fade-in duration-500">
                        {pendingShopping.map(item => (
                            <div key={item.id} className="flex items-center gap-2 p-2 rounded-xl bg-white border border-gray-100">
                                <div className="w-2 h-2 rounded-full bg-pink-400 shrink-0" />
                                <span className="text-xs font-bold text-gray-700 truncate">{item.text}</span>
                                {item.quantity > 1 && <span className="text-[10px] bg-gray-100 px-1.5 rounded text-gray-500">{item.quantity}</span>}
                            </div>
                        ))}
                        {pendingShopping.length > 0 && (
                            <button onClick={() => onOpenAdd('shopping')} className="col-span-2 text-xs text-center text-pink-600 font-bold py-1 hover:underline">
                                إدارة القائمة
                            </button>
                        )}
                    </div>
                );
            case 'goals':
                return (
                    <div className="space-y-2 animate-in fade-in duration-500">
                        {activeHabits.map(habit => (
                            <div key={habit.id} className="flex items-center justify-between p-2 rounded-xl bg-white border border-gray-100">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🎯</span>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-800">{habit.name}</span>
                                        <span className="text-[9px] text-gray-400">{habit.streak} يوم متتالي</span>
                                    </div>
                                </div>
                                <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full"
                                        style={{ width: `${Math.min(100, (habit.streak / 66) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'projects':
                return (
                    <div className="space-y-2 animate-in fade-in duration-500">
                        {activeProjects.map(project => (
                            <div key={project.id} className="flex flex-col gap-1 p-2 rounded-xl bg-white border border-gray-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-800">{project.title}</span>
                                    <span className="text-[9px] text-gray-400">{project.progress}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full"
                                        style={{ width: `${project.progress}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                );
            default:
                return null;
        }
    };

    const Icon = activeSlide.icon;

    return (
        <Card className="w-full bg-white/80 backdrop-blur-sm border-gray-100 shadow-sm overflow-hidden rounded-3xl" dir="rtl">
            <CardContent className="p-0">
                {/* Header */}
                <div
                    className="flex items-center justify-between p-3 bg-gray-50/50 border-b border-gray-100 cursor-pointer select-none"
                    onClick={handleNext}
                >
                    <div className="flex items-center gap-2">
                        <div className={cn("p-1.5 rounded-lg bg-white shadow-sm", activeSlide.color)}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <h3 className={cn("text-sm font-bold transition-colors duration-300", activeSlide.color)}>
                            {activeSlide.title}
                        </h3>
                        {/* Pagination Dots */}
                        <div className="flex gap-1 mr-3">
                            {slides.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                        idx === currentIndex ? "bg-gray-800 w-3" : "bg-gray-300"
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {/* Interactive Calendar/Add Buttons */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (activeSlide.type === 'agenda' && onOpenCalendar) onOpenCalendar();
                                else onOpenAdd(activeSlide.type === 'agenda' ? 'task' : activeSlide.type === 'shopping' ? 'shopping' : activeSlide.type === 'goals' ? 'goal' : 'project');
                            }}
                            className="bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-xl p-1.5 transition-colors shadow-sm active:scale-95"
                        >
                            {activeSlide.type === 'agenda' ? <Calendar className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                </div>

                {/* Content Area - Swipeable via Clicks for now (Desktop/Mobile unified) */}
                <div className="p-3 min-h-[140px] relative">
                    {/* Arrows for manual navigation */}
                    {slides.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                className="absolute top-1/2 -translate-y-1/2 right-1 p-1 text-gray-300 hover:text-gray-600 z-10 hidden md:block"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                className="absolute top-1/2 -translate-y-1/2 left-1 p-1 text-gray-300 hover:text-gray-600 z-10 hidden md:block"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        </>
                    )}

                    {renderContent()}
                </div>
            </CardContent>
        </Card>
    );
};
