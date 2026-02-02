import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, CheckSquare, ShoppingCart, Target, ChevronLeft, Plus, Clock, ChevronRight, Heart, Play, Pause } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { useShoppingList } from '@/hooks/useShoppingList';
import { useHabits } from '@/hooks/useHabits';
import { useNotesV2 } from '@/hooks/useNotesV2';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { isAndroid } from '@/utils/platformDetection';

interface UnifiedDashboardCardProps {
    onOpenAdd: (type: 'task' | 'appointment' | 'goal' | 'shopping' | 'project' | 'medication' | 'habit') => void;
    onOpenEvent?: (event: any) => void;
    onOpenCalendar?: () => void;
}

type SlideType = 'agenda' | 'shopping' | 'goals' | 'projects' | 'appointment' | 'task';

type SlideItem = {
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
};

export const UnifiedDashboardCard: React.FC<UnifiedDashboardCardProps> = ({ onOpenAdd, onOpenEvent, onOpenCalendar }) => {
    // Data Hooks
    const { tasks } = useTasks();
    const { appointments } = useAppointments();
    const { items: shoppingItems } = useShoppingList();
    const { habits } = useHabits();
    const { notes } = useNotesV2(); // Fetch notes to find favorites

    // 1. Data Preparation
    const slides = React.useMemo<SlideItem[]>(() => {
        // --- 1. Collect Favorite Slides ---
        const favoriteSlides: SlideItem[] = [];
        const favNotes = notes.filter(n => n.is_favorite);

        favNotes.forEach(note => {
            // Advanced Parsing: Handle bullet points (- or *) and numbered lists (1.)
            // Logic:
            // 1. Split by newline
            // 2. Filter empty lines
            // 3. Check if line starts with a marker. If so, strip it.
            // 4. Ensure line length is reasonable (> 3 chars) to avoid noise.

            const rawLines = note.content.replace(/<[^>]*>?/gm, '\n').split('\n'); // Replace BRs with newlines first
            const validItems: string[] = [];

            rawLines.forEach(line => {
                const trimmed = line.trim();
                if (!trimmed) return;

                // Regex for list markers:
                const listMatch = trimmed.match(/^([-*•]|\d+[\.)])\s+(.*)/);

                if (listMatch) {
                    validItems.push(listMatch[2].trim()); // Push the content part
                } else if (trimmed.length > 5) {
                    // Also accept non-list lines if they look like substantial sentences
                    validItems.push(trimmed);
                }
            });

            if (validItems.length > 0) {
                validItems.forEach((item, idx) => {
                    favoriteSlides.push({
                        id: `fav-${note.id}-${idx}`,
                        type: 'goals',
                        title: item,
                        subtitle: note.title || 'من المفضلة',
                        icon: Heart,
                        data: note,
                        gradient: "from-rose-500 to-pink-600",
                        textColor: "text-white",
                        accentColor: "bg-white/20"
                    });
                });
            } else {
                // If just title
                favoriteSlides.push({
                    id: `fav-${note.id}`,
                    type: 'goals',
                    title: note.title,
                    subtitle: 'ملاحظة مميزة',
                    icon: Heart,
                    data: note,
                    gradient: "from-rose-500 to-pink-600",
                    textColor: "text-white",
                    accentColor: "bg-white/20"
                });
            }
        });

        // --- 2. Collect Standard Items ---
        const standardItems: SlideItem[] = [];
        const today = new Date().toISOString().split('T')[0];

        // Appointments
        appointments
            .filter(a => a.date === today)
            .forEach(a => {
                standardItems.push({
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
                standardItems.push({
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
                standardItems.push({
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
                standardItems.push({
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
                standardItems.push({
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

        // Productivity Items
        if (tasks.filter(t => t.progress < 100).length > 3) {
            standardItems.push({
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

        // --- 3. Interleave Logic ---
        // Strategy: Start with standard items. Insert one favorite item after every 2 standard items.
        // This ensures the "intermittent" display style.

        const finalSlides: SlideItem[] = [];

        // Emtpy States
        if (standardItems.length === 0 && favoriteSlides.length === 0) {
            return [{
                id: 'empty',
                type: 'agenda',
                title: 'لا يوجد مهام حالياً',
                subtitle: 'استمتع بوقتك!',
                icon: Calendar,
                data: null,
                gradient: "from-slate-700 to-slate-800",
                textColor: "text-white",
                accentColor: "bg-white/10"
            }];
        }

        // If no standard, just return favorites
        if (standardItems.length === 0) return favoriteSlides;

        // Interleave loop
        let favIndex = 0;
        let stdIndex = 0;
        const ratio = 2; // Ratio: 2 standard items -> 1 favorite note

        while (stdIndex < standardItems.length) {
            // 1. Push batch of standard items
            for (let i = 0; i < ratio && stdIndex < standardItems.length; i++) {
                finalSlides.push(standardItems[stdIndex]);
                stdIndex++;
            }

            // 2. Push 1 favorite item (if any exist)
            // Use modulo to cycle through favorites if we run out but still have standard items,
            // or just stop if user prefers strictly "what is available".
            // Since user said "intermittent", let's cycle them to keep the vibe alive.
            if (favoriteSlides.length > 0) {
                finalSlides.push(favoriteSlides[favIndex % favoriteSlides.length]);
                favIndex++;
            }
        }

        // If we have "leftover" favorites that were not shown because standard list finished?
        // Add a few more at the end just to be sure, or rely on the cycle. 
        // Logic above only loops while stdIndex < standardItems.length.
        // It's safer to ensure at least some favorites are shown if standard list is short.
        if (standardItems.length < 3 && favoriteSlides.length > 0) {
            // If very short standard list, append remaining distinct favorites
            while (favIndex < favoriteSlides.length) {
                finalSlides.push(favoriteSlides[favIndex]);
                favIndex++;
            }
        }

        return finalSlides;
    }, [tasks, appointments, shoppingItems, habits, notes]); // Added 'notes' to dependency array

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Refs for navigation logic
    const lastTapRef = React.useRef(0);
    const clickTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

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

    // Touch Handling for Swipe
    const touchStartX = React.useRef(0);
    const touchStartY = React.useRef(0); // Add Y tracking for vertical swipe
    const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);

    const onTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;

        // Start long press timer
        longPressTimer.current = setTimeout(() => {
            setIsPaused(true);
        }, 500); // 500ms hold to pause
    };

    const onTouchMove = () => {
        // If moving, cancel long press
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        // Clear timer on release
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
            // If we were paused (held long enough), unpause
            setIsPaused(false);
        }

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        // Calculate deltas
        const diffX = touchStartX.current - touchEndX;
        const diffY = touchStartY.current - touchEndY; // Positive = Swipe Up, Negative = Swipe Down

        // Horizontal Swipe (Next/Prev Item)
        if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > 0) {
                handleNext();
            } else {
                handlePrev();
            }
            return;
        }

        // Vertical Swipe (Change Type)
        // Swipe Up (positive diffY) -> Next Type
        // Swipe Down (negative diffY) -> Prev Type
        if (Math.abs(diffY) > 50 && Math.abs(diffY) > Math.abs(diffX)) {
            const currentType = activeItem.type;
            let nextIndex = currentIndex;
            let foundNewType = false;
            const direction = diffY > 0 ? 1 : -1; // Up = +1 (Next), Down = -1 (Prev)
            let checks = 0;

            // Loop to find next item with DIFFERENT type
            while (!foundNewType && checks < slides.length) {
                nextIndex = (nextIndex + direction + slides.length) % slides.length;
                if (slides[nextIndex].type !== currentType) {
                    foundNewType = true;
                }
                checks++;
            }

            if (foundNewType) {
                setCurrentIndex(nextIndex);
            }
        }
    };

    return (
        <Card
            className={cn(
                "w-full overflow-hidden border-0 shadow-xl rounded-[1.5rem] transition-all duration-700 bg-gradient-to-br min-h-[115px] relative group", // Reverted to more compact height
                activeItem.gradient
            )}
            dir="rtl"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onClick={(e) => {
                // Handle navigation: Single Tap -> Next, Double Tap -> Prev
                // We use a small timeout to distinguish single vs double tap
                // Note buttons/interactive elements must e.stopPropagation()
                const now = Date.now();
                const DOUBLE_TAP_DELAY = 300;

                if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
                    // Double Tap detected
                    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
                    handlePrev();
                    lastTapRef.current = 0; // Reset
                } else {
                    // Single Tap Candidate
                    lastTapRef.current = now;
                    clickTimeoutRef.current = setTimeout(() => {
                        handleNext();
                        clickTimeoutRef.current = null;
                    }, DOUBLE_TAP_DELAY);
                }
            }}
        >
            <CardContent className="p-4 relative h-full flex flex-col justify-center gap-1 z-10 pb-2 pointer-events-none"> {/* Disable pointer events on container, re-enable on children */}

                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                {/* row 1: Icon - Title - Countdown */}
                <div className="flex items-center gap-2 w-full">
                    <div className={cn("p-1.5 rounded-xl backdrop-blur-md border border-white/10 shrink-0", activeItem.accentColor)}>
                        <Icon className={cn("w-5 h-5", activeItem.textColor)} />
                    </div>

                    <div className="flex-1 min-w-0 flex items-center gap-2 pointer-events-auto cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent nav
                            if (activeItem.data && onOpenEvent && (activeItem.type === 'task' || activeItem.type === 'appointment')) {
                                onOpenEvent(activeItem.data);
                            }
                        }}
                    >
                        <h2 className={cn("text-base font-bold leading-tight line-clamp-2 drop-shadow-sm", activeItem.textColor)}>
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

                {/* Row 2: Subtitle (Note Content) - Expanded */}
                <div className="flex-1 w-full min-h-0 mt-1 mb-1">
                    <p className={cn("text-[10.5px] leading-relaxed font-medium opacity-80 line-clamp-3 whitespace-pre-line", activeItem.textColor)}>
                        {activeItem.subtitle}
                    </p>
                </div>

                {/* Remove old click areas as we use main card click */}
                {/* <div className="absolute inset-y-0 left-0 w-8 z-0" onClick={(e) => { e.stopPropagation(); handleNext(); }} /> */}
                {/* <div className="absolute inset-y-0 right-0 w-8 z-0" onClick={(e) => { e.stopPropagation(); handlePrev(); }} /> */}

            </CardContent>

            {/* Android Play/Pause Toggle Button - Outside CardContent for Exact Corner */}
            {isAndroid() && (
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent nav
                        setIsPaused(!isPaused);
                    }}
                    className={cn(
                        "absolute bottom-0 right-0 p-3 rounded-tl-2xl rounded-br-[1.5rem] backdrop-blur-md bg-white/5 border-t border-l border-white/10 z-30 transition-all active:scale-95 opacity-50 pointer-events-auto",
                        activeItem.accentColor,
                        activeItem.textColor
                    )}
                >
                    {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                </button>
            )}

        </Card >
    );
};
