import React, { useState, useEffect } from 'react';
import {
    Timer, DollarSign, ListChecks, ShoppingCart, MapPin,
    Calendar, Users, GraduationCap, LayoutGrid, FileText,
    ChevronDown, ChevronUp, Bell, Droplets, Coffee, Brain, Zap, Settings,
    Moon, Wallet, Clock, Pill, Heart, Navigation, Copy, ExternalLink, Calculator, Sparkles
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '@/hooks/useFinance';
import { useTasks } from '@/hooks/useTasks';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isAndroid } from '@/utils/platformDetection';
import { DashboardShopping } from './widgets/DashboardShopping';

interface QuickActionsGridV2Props {
    onOpenAddDialog: (type: 'appointment' | 'task' | 'location' | 'shopping' | 'note' | 'expense' | 'goal') => void;
    onOpenTimer: () => void;
    onOpenVoiceRecorder: () => void;
    onNavigateToTab: (tabId: string) => void;
    onOpenNewMuslims: () => void;
    onOpenShortcuts?: () => void;
    activeWidgets?: string[];
}

export const QuickActionsGridV2: React.FC<QuickActionsGridV2Props> = ({
    onOpenAddDialog, onOpenTimer, onOpenVoiceRecorder, onNavigateToTab, onOpenNewMuslims, onOpenShortcuts
}) => {
    const navigate = useNavigate();
    const { toast } = useToast();

    // Data Hooks for "Smart" Info
    const { financeData } = useFinance();
    const { tasks } = useTasks();
    const { nextPrayer } = usePrayerTimes();

    const [shoppingCount, setShoppingCount] = useState(0);
    const [shortcutsCount, setShortcutsCount] = useState(3);
    const [showShoppingPopup, setShowShoppingPopup] = useState(false);

    useEffect(() => {
        try {
            const list = JSON.parse(localStorage.getItem('baraka_shopping_list') || '[]');
            setShoppingCount(list.length);
            const shortcuts = JSON.parse(localStorage.getItem('baraka_custom_shortcuts') || '[]');
            setShortcutsCount(shortcuts.length || 3);
        } catch {
            setShoppingCount(0);
            setShortcutsCount(3);
        }
    }, [showShoppingPopup]); // Sync on popup change

    // Derived States
    const todayExpenses = financeData?.pending_expenses?.filter((t: any) =>
        t.type === 'expense' && t.timestamp.startsWith(new Date().toISOString().split('T')[0])
    ).reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;

    const pendingTasks = tasks.filter(t => t.progress < 100).length;

    // Long Press Logic
    const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
    const handleLongPress = (id: string, normalAction: () => void) => {
        if (id === 'shopping') {
            const timer = setTimeout(() => {
                if (navigator.vibrate) navigator.vibrate(50);
                setShowShoppingPopup(true);
            }, 500);
            setPressTimer(timer);
        } else {
            normalAction();
        }
    };

    const clearTimer = () => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            setPressTimer(null);
        }
    };

    // Android: 2 rows × 5 columns (10 icons)
    if (isAndroid()) {
        const androidItems = [
            { id: 'timer', label: 'مؤقت', icon: Timer, color: 'bg-orange-50 text-orange-600', action: onOpenTimer },
            { id: 'expenses', label: 'مصروف', icon: DollarSign, color: 'bg-red-50 text-red-600', action: () => onOpenAddDialog('expense') },
            { id: 'tasks', label: 'مهمة', icon: ListChecks, color: 'bg-purple-50 text-purple-600', action: () => onOpenAddDialog('task') },
            { id: 'shopping', label: 'تسوق', icon: ShoppingCart, color: 'bg-pink-50 text-pink-600', action: () => onOpenAddDialog('shopping') },
            { id: 'notes', label: 'ملاحظة', icon: FileText, color: 'bg-yellow-50 text-yellow-600', action: () => onOpenAddDialog('note') },
            { id: 'calendar', label: 'تقويم', icon: Calendar, color: 'bg-indigo-50 text-indigo-600', action: () => onNavigateToTab('calendar') },
            { id: 'new_muslims', label: 'هداية', icon: Users, color: 'bg-emerald-50 text-emerald-600', action: onOpenNewMuslims },
            { id: 'education', label: 'أكاديميا', icon: GraduationCap, color: 'bg-violet-50 text-violet-600', action: () => navigate('/thesis') },
            { id: 'map', label: 'خريطة', icon: MapPin, color: 'bg-green-50 text-green-600', action: () => onOpenAddDialog('location') },
            { id: 'manage_shortcuts', label: 'إختصاراتي', icon: Sparkles, color: 'bg-teal-50 text-teal-600', action: onOpenShortcuts || (() => document.getElementById('shortcuts-section')?.scrollIntoView({ behavior: 'smooth' })) },
        ];

        return (
            <div className="grid grid-cols-5 gap-1 mb-1">
                {androidItems.map((item) => (
                    <button
                        key={item.id}
                        onMouseDown={() => handleLongPress(item.id, item.action)}
                        onMouseUp={clearTimer}
                        onMouseLeave={clearTimer}
                        onTouchStart={() => handleLongPress(item.id, item.action)}
                        onTouchEnd={clearTimer}
                        onClick={() => { if (!pressTimer) item.action(); }}
                        className={cn(
                            "flex flex-col items-center justify-center p-1 rounded-xl border border-transparent aspect-square active:scale-95 transition-all group",
                            item.color
                        )}
                    >
                        <item.icon className="w-5 h-5 mb-0.5 group-hover:scale-110 transition-transform" />
                        <span className="text-[7px] font-bold text-center leading-tight line-clamp-1 truncate w-full px-0.5">{item.label}</span>
                    </button>
                ))}
            </div>
        );
    }

    // Web Layout (Previous design)
    const webItems = [
        { id: 'timer', label: 'مؤقت', icon: Timer, color: 'bg-orange-50 text-orange-600', action: onOpenTimer },
        { id: 'expenses', label: 'مصروف', icon: DollarSign, color: 'bg-red-50 text-red-600', action: () => onOpenAddDialog('expense') },
        { id: 'tasks', label: 'مهمة', icon: ListChecks, color: 'bg-purple-50 text-purple-600', action: () => onOpenAddDialog('task') },
        { id: 'shopping', label: 'تسوق', icon: ShoppingCart, color: 'bg-pink-50 text-pink-600', action: () => onOpenAddDialog('shopping') },
        { id: 'notes', label: 'ملاحظة', icon: FileText, color: 'bg-yellow-50 text-yellow-600', action: () => onOpenAddDialog('note') },
        { id: 'calendar', label: 'تقويم', icon: Calendar, color: 'bg-indigo-50 text-indigo-100/50', action: () => onNavigateToTab('calendar') },
        { id: 'new_muslims', label: 'هداية', icon: Users, color: 'bg-emerald-50 text-emerald-600', action: onOpenNewMuslims },
        { id: 'education', label: 'أكاديميا', icon: GraduationCap, color: 'bg-violet-50 text-violet-600', action: () => navigate('/thesis') },
        { id: 'manage_shortcuts', label: 'إختصاراتي', icon: Sparkles, color: 'bg-teal-50 text-teal-600', action: onOpenShortcuts || (() => document.getElementById('shortcuts-section')?.scrollIntoView({ behavior: 'smooth' })) },
    ];

    return (
        <div className="grid grid-cols-5 md:grid-cols-9 gap-1.5 mb-2">
            {webItems.map((item) => (
                <button
                    key={item.id}
                    onMouseDown={() => handleLongPress(item.id, item.action)}
                    onMouseUp={clearTimer}
                    onMouseLeave={clearTimer}
                    onClick={() => { if (!pressTimer) item.action(); }}
                    className={cn(
                        "flex flex-col items-center justify-center p-1.5 rounded-xl transition-all hover:scale-105 active:scale-95 border border-transparent hover:border-gray-200",
                        item.color
                    )}
                >
                    <item.icon className="w-4 h-4 mb-0.5" />
                    <span className="text-[10px] font-bold whitespace-nowrap">{item.label}</span>
                </button>
            ))}
        </div>
    );
};

export default QuickActionsGridV2;
