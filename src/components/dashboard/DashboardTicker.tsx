
import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import {
    Bell,
    CheckSquare,
    DollarSign,
    Clock,
    AlertTriangle,
    Calendar,
    ArrowLeft,
    ArrowRight
} from 'lucide-react';
import { formatDistanceToNow, isAfter, isBefore, isToday, parseISO } from 'date-fns';
import { arMA } from 'date-fns/locale';

interface TickerItem {
    id: string;
    icon: React.ReactNode;
    text: string;
    color: string;
    priority?: number;
}

interface DashboardTickerProps {
    externalBalance?: number;
}

const DashboardTicker: React.FC<DashboardTickerProps> = ({ externalBalance }) => {
    const {
        tasks,
        appointments,
        finances
    } = useAppStore();

    const { nextPrayer, timeUntilNext, prayerTimes } = usePrayerTimes();
    const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
    const [animationDuration, setAnimationDuration] = useState('30s');
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update time every minute to keep relative times accurate
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    // Load custom speed from settings
    useEffect(() => {
        const loadSettings = () => {
            try {
                const saved = localStorage.getItem('baraka_reminders_settings');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    // New formula for SUPER FAST speeds (Doubled/Tripled):
                    // Speed 1 (Slowest) = 45s (was 60s)
                    // Speed 5 (Medium) = ~25s
                    // Speed 10 (Fastest) = 5s (was 15s)
                    const speed = parsed.tickerSpeed || 5;
                    const duration = 45 - (speed * 4);
                    setAnimationDuration(`${Math.max(5, duration)}s`);
                }
            } catch (e) {
                console.error('Error loading settings', e);
            }
        };

        loadSettings();
        // Listen for storage changes (other tabs)
        window.addEventListener('storage', loadSettings);
        // Listen for custom event (same tab)
        window.addEventListener('tickerSpeedChanged', loadSettings);

        return () => {
            window.removeEventListener('storage', loadSettings);
            window.removeEventListener('tickerSpeedChanged', loadSettings);
        };
    }, []);

    useEffect(() => {
        const items: TickerItem[] = [];
        const now = new Date();

        // --- 1. Finance Section ---
        // Calculate dynamic balance to ensure it's up to date
        // Priority 1: External Balance passed from parent (Source of Truth)
        // Priority 2: Calculated from transactions if balance is 0
        // Priority 3: Store balance

        let displayBalance = externalBalance !== undefined ? externalBalance : (finances.balance || 0);

        // If externalBalance wasn't provided and store balance is 0, try fallback calc
        if (externalBalance === undefined && displayBalance === 0 && (finances.income?.length > 0 || finances.expenses?.length > 0)) {
            const totalIncome = finances.income?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
            const totalExpense = finances.expenses?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
            displayBalance = totalIncome - totalExpense;
        }

        items.push({
            id: 'balance',
            icon: <DollarSign className="w-3.5 h-3.5" />,
            text: `الرصيد: ${displayBalance.toLocaleString()} ARS`,
            color: 'text-emerald-400'
        });

        // Last 3 Expenses
        if (finances.expenses && finances.expenses.length > 0) {
            const recentExpenses = [...finances.expenses].slice(-3).reverse();
            const expensesText = recentExpenses
                .map(e => `${e.amount} (${e.description})`)
                .join(' | ');

            items.push({
                id: 'expenses',
                icon: <AlertTriangle className="w-3.5 h-3.5" />,
                text: `آخر المصاريف: ${expensesText}`,
                color: 'text-amber-400'
            });
        }

        // --- 2. Appointments Section ---
        // Previous (Last 2 hours)
        const previousApps = appointments.filter(a => {
            const appTime = new Date(a.date);
            const diffInHours = (now.getTime() - appTime.getTime()) / (1000 * 60 * 60);
            return diffInHours > 0 && diffInHours <= 2;
        });

        // Current (Happening now +/- 15 mins overlaps)
        // ... simplified to "Next" logic for now as "Current" is transient

        // Next Appointment
        const upcomingApps = appointments
            .filter(a => isAfter(parseISO(a.date), now))
            .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

        const nextApp = upcomingApps[0];

        if (previousApps.length > 0) {
            const lastApp = previousApps[previousApps.length - 1]; // Closest past one
            items.push({
                id: 'prev-app',
                icon: <ArrowRight className="w-3.5 h-3.5" />,
                text: `الموعد السابق: ${lastApp.title} (منذ ${formatDistanceToNow(parseISO(lastApp.date), { locale: arMA })})`,
                color: 'text-gray-400'
            });
        }

        if (nextApp) {
            items.push({
                id: 'next-app',
                icon: <Calendar className="w-3.5 h-3.5" />,
                text: `الموعد القادم: ${nextApp.title} (بعد ${formatDistanceToNow(parseISO(nextApp.date), { locale: arMA })})`,
                color: 'text-purple-400'
            });
        } else {
            items.push({
                id: 'no-apps',
                icon: <Bell className="w-3.5 h-3.5" />,
                text: `لا توجد مواعيد قادمة`,
                color: 'text-gray-500'
            });
        }

        // --- 3. Prayer Times Section ---
        if (nextPrayer) {
            items.push({
                id: 'next-prayer',
                icon: <Clock className="w-3.5 h-3.5" />,
                text: `${nextPrayer.nameAr}: بعد ${timeUntilNext}`,
                color: 'text-sky-400'
            });
        }

        // Previous Prayer Elapsed Time
        // Find the prayer that just passed
        const prayerNames = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
        // Use 'name' instead of 'nameEn' and lowercase match
        const currentPrayerIdx = nextPrayer ? prayerNames.indexOf(nextPrayer.name.toLowerCase()) - 1 : 5;

        if (prayerTimes && prayerTimes.length > 0) {
            const prevIdx = currentPrayerIdx < 0 ? 5 : currentPrayerIdx;
            const prevPrayerName = prayerNames[prevIdx];
            const prevPrayer = prayerTimes.find(p => p.name === prevPrayerName);

            if (prevPrayer) {
                // Calculate elapsed time from prevPrayer.timestamp (today) matches
                // If we wrapped back to Isha yesterday, we might need logic, but simpler:
                // Just show "Since [Time]" or diff if simple.
                // Let's use diff if it's today positive, else assume yesterday

                let diff = now.getTime() - prevPrayer.timestamp.getTime();
                if (diff < 0) {
                    // It meant "prev prayer" was logically yesterday (e.g. now is Fajr, prev is Isha)
                    // Add 24h
                    diff += 24 * 60 * 60 * 1000;
                }

                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                const timeString = hours > 0 ? `${hours} ساعة و ${minutes} دقيقة` : `${minutes} دقيقة`;

                items.push({
                    id: 'prev-prayer',
                    icon: <Clock className="w-3.5 h-3.5" />,
                    text: `صلاة ${prevPrayer.nameAr}: مضى ${timeString}`,
                    color: 'text-gray-400'
                });
            }
        }

        // --- 4. Tasks Section ---
        const pendingTasks = tasks.filter(t => !t.completed).length;
        if (pendingTasks > 0) {
            // Get top 2 high priority pending tasks
            const topTasks = tasks
                .filter(t => !t.completed && t.priority === 'high')
                .slice(0, 2)
                .map(t => t.title)
                .join('، ');

            const taskText = topTasks ? `${pendingTasks} مهام (أهمها: ${topTasks})` : `${pendingTasks} مهام قيد الانتظار`;

            items.push({
                id: 'tasks',
                icon: <CheckSquare className="w-3.5 h-3.5" />,
                text: taskText,
                color: 'text-blue-400'
            });
        } else {
            items.push({
                id: 'all-done',
                icon: <CheckSquare className="w-3.5 h-3.5" />,
                text: `أنجزت جميع المهام!`,
                color: 'text-green-400'
            });
        }

        setTickerItems(items);
    }, [tasks, appointments, finances, nextPrayer, timeUntilNext, currentTime]);

    if (tickerItems.length === 0) return null;

    return (
        <div className="w-full bg-slate-900/80 backdrop-blur-lg border-b border-white/10 overflow-hidden py-3.5 z-50 shadow-md">
            <div
                className="flex whitespace-nowrap animate-marquee"
                style={{ animationDuration: animationDuration }}
            >
                {/* Render multiple times for seamless loop - increased duplication for smooth long screens */}
                {[...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems].map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="flex items-center gap-2 px-6 border-l border-white/10 last:border-l-0">
                        <span className={item.color}>{item.icon}</span>
                        <span className="text-xs font-medium text-white/90 tracking-wide" style={{ direction: 'rtl' }}>
                            {item.text}
                        </span>
                    </div>
                ))}
            </div>

            <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(25%); }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
        .animate-marquee:hover {
            animation-play-state: paused;
        }
      `}</style>
        </div>
    );
};

export default DashboardTicker;
