import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useFinance } from '@/hooks/useFinance';
import { useQuickAccessCustomization } from '@/hooks/useQuickAccessCustomization';
import { useSystemModes } from '@/hooks/useSystemModes';
import { isAndroid } from '@/utils/platformDetection';
import {
    Calendar, ListTodo, MapPin, Settings,
    DollarSign, Mic, Wallet, Banknote, Moon, Timer, Clock,
    Navigation, Save, User, Palette, Globe, Shield, Scale, ChevronDown, CheckSquare, CalendarPlus,
    ShoppingCart, BookOpen, Search, Star, Zap, Sparkles, Plus, Heart
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { SavedLocationsDialog } from '@/components/dashboard/SavedLocationsDialog';
import { MapsSettingsDialog } from '@/components/dialogs/MapsSettingsDialog';
import { CalendarSettingsDialog } from '@/components/dialogs/CalendarSettingsDialog';
import { ShortcutsSettingsDialog } from '@/components/dialogs/ShortcutsSettingsDialog';

// Detailed Actions Configuration
const ALL_QUICK_ACTIONS = [
    // 1. Events (Menu: Appointment / Task)
    {
        id: 'events_menu',
        name: 'أحداث',
        icon: Calendar,
        color: 'bg-blue-500 text-white',
        type: 'menu',
        menuItems: [
            { id: 'add_appointment', name: 'موعد', icon: Calendar },
            { id: 'add_task', name: 'مهمة', icon: ListTodo }
        ]
    },
    // 2. Timer
    { id: 'start_pomodoro', name: 'مؤقت', icon: Timer, color: 'bg-orange-500 text-white' },
    // 3. Expense
    { id: 'add_expense', name: 'مصروف', icon: DollarSign, color: 'bg-red-500 text-white' },
    // 4. Location (Opens List directly)
    { id: 'list_locations', name: 'موقع', icon: MapPin, color: 'bg-emerald-500 text-white', type: 'location_action' },
    // 5. Shopping (Click: Add, Long: List)
    { id: 'shopping_action', name: 'تسوق', icon: ShoppingCart, color: 'bg-rose-500 text-white', type: 'shopping_action' },
    // 6. Settings (Mobile) / Prayer (Web) - Placeholder, handled in logic
    {
        id: 'settings_menu', // Default, will be swapped on Web
        name: 'إعدادات',
        icon: Settings,
        color: 'bg-blue-600 text-white',
        type: 'menu',
        menuItems: [
            { id: 'show_next_prayer', name: 'مواقيت الصلاة', icon: Moon },
            { id: 'calendar_sync_settings', name: 'مزامنة التقويم', icon: Calendar },
            { id: 'goto_new_muslims', name: 'هداية', icon: Heart },
            { id: 'goto_thesis', name: 'أبحاث', icon: BookOpen },
            { id: 'open_shortcuts', name: 'الاختصارات', icon: Zap },
            { id: 'toggle_clean_mode', name: 'وضع التركيز', icon: Sparkles }
        ]
    },
    // --- Web Only Below ---
    // 7. Hidayah
    { id: 'goto_new_muslims', name: 'هداية', icon: Heart, color: 'bg-violet-500 text-white' },
    // 8. Academic Search
    { id: 'goto_thesis', name: 'أبحاث', icon: Search, color: 'bg-indigo-500 text-white' },
    // 9. Custom 1
    { id: 'custom_1', name: 'اختصار 1', icon: Star, color: 'bg-teal-500 text-white' },
    // 10. Custom 2
    { id: 'custom_2', name: 'اختصار 2', icon: Star, color: 'bg-cyan-500 text-white' },
    // 11. Custom 3
    { id: 'custom_3', name: 'اختصار 3', icon: Star, color: 'bg-sky-500 text-white' },
    // 12. Custom 4
    { id: 'custom_4', name: 'اختصار 4', icon: Star, color: 'bg-blue-400 text-white' }
];

interface QuickActionsGridV2Props {
    onOpenAddDialog: (type: 'appointment' | 'task' | 'location' | 'shopping' | 'note' | 'expense' | 'goal' | 'medication' | 'habit' | 'project') => void;
    onOpenTimer?: () => void;
    onOpenVoiceRecorder?: () => void;
    onNavigateToTab?: (tabId: string) => void;
    onOpenNewMuslims?: () => void;
    onOpenShortcuts?: () => void;
    onOpenSearch?: () => void;
    onQuickParking?: () => void;
    isCleanMode?: boolean;
    onToggleCleanMode?: () => void;
}

export const QuickActionsGridV2: React.FC<QuickActionsGridV2Props> = ({
    onOpenAddDialog, onOpenTimer, onOpenVoiceRecorder, onNavigateToTab, onOpenNewMuslims, onOpenShortcuts, onOpenSearch, onQuickParking,
    isCleanMode = false, onToggleCleanMode
}) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { nextPrayer, timeUntilNext } = usePrayerTimes();
    const { financeData } = useFinance();
    const { slots } = useQuickAccessCustomization(); // Added hook usage

    const [showActionResult, setShowActionResult] = useState<{ title: string; content: string } | null>(null);
    const [showCalendarSettings, setShowCalendarSettings] = useState(false);
    const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
    const [showSavedLocations, setShowSavedLocations] = useState(false);
    const [showMapsAddDialog, setShowMapsAddDialog] = useState(false);

    // Filter Logic
    const isMobileView = isAndroid() || typeof window !== 'undefined' && window.innerWidth < 1024;

    // Construct Displayed Actions
    let displayedActions = ALL_QUICK_ACTIONS.map(action => {
        // Map Custom Slots
        if (action.id.startsWith('custom_')) {
            const slot = slots.find(s => s.id === action.id);
            if (slot && slot.type !== 'empty') {
                return {
                    ...action,
                    name: slot.label || action.name,
                };
            }
        }
        return action;
    });

    if (isMobileView) {
        // Mobile: Show first 6 (Settings is #6)
        displayedActions = displayedActions.slice(0, 6);
    } else {
        // Web: Swap #6 (Settings) with Prayer
        displayedActions[5] = {
            id: 'show_next_prayer',
            name: 'الصلاة',
            icon: Moon,
            color: 'bg-blue-600 text-white'
        };
    }

    const executeAction = (actionId: string) => {
        // Check if custom slot first
        if (actionId.startsWith('custom_')) {
            const slot = slots.find(s => s.id === actionId);
            if (!slot || slot.type === 'empty') {
                setShowShortcutsDialog(true);
                return;
            }

            // Execute Slot Logic
            if (slot.type === 'action' && slot.targetId) {
                executeAction(slot.targetId);
            } else if (slot.type === 'location' && slot.url) {
                window.open(slot.url, '_blank');
            } else if (slot.type === 'link' && slot.url) {
                window.open(slot.url, '_blank');
            }
            return;
        }

        switch (actionId) {
            case 'add_appointment': onOpenAddDialog('appointment'); break;
            case 'add_task': onOpenAddDialog('task'); break;
            case 'start_pomodoro': if (onOpenTimer) onOpenTimer(); break;
            case 'add_expense': onOpenAddDialog('expense'); break;

            // Location
            case 'list_locations': setShowSavedLocations(true); break;
            case 'save_parking': if (onQuickParking) onQuickParking(); break;

            // Shopping
            case 'shopping_add': onOpenAddDialog('shopping'); break;
            case 'shopping_list': navigate('/notes-v2?folder=shopping'); break;

            // Settings Menu Items
            case 'show_next_prayer':
                navigate('/prayer-times');
                break;
            case 'calendar_sync_settings':
                setShowCalendarSettings(true);
                break;
            case 'goto_new_muslims':
                if (onOpenNewMuslims) onOpenNewMuslims();
                else navigate('/new-muslims'); // Adjust route if needed
                break;
            case 'goto_thesis':
                navigate('/thesis');
                break;
            case 'open_shortcuts':
                setShowShortcutsDialog(true);
                break;
            case 'toggle_clean_mode':
                if (onToggleCleanMode) onToggleCleanMode();
                break;

            // Standard / Custom
            case 'custom_1':
            case 'custom_2':
            case 'custom_3':
            case 'custom_4':
                // TODO: Check if assigned. For now, since they are static placeholders in this array, we treat them as unassigned or requiring management.
                // User said: "If unassigned, open management directly."
                // Since we don't have the dynamic assignment state here yet, we open the dialog.
                setShowShortcutsDialog(true);
                break;

            default: break;
        }
    };

    return (
        <div className="w-full relative">
            {/* Container: Grid on Large Screens, Flex Strip on Mobile */}
            <div
                className={cn(
                    "w-full pt-2 pb-4 px-1",
                    // Mobile: 6 Columns Grid (Fit to screen), Desktop: 12 Columns Grid
                    isMobileView ? "grid grid-cols-6 gap-1.5 bg-gray-50/50 rounded-xl p-2" : "grid grid-cols-12 gap-3"
                )}
                dir="rtl"
            >
                {displayedActions.map((action) => {
                    const Icon = action.icon;
                    const hasMenu = action.type === 'menu';

                    // Button styling: remove min-w to allow grid to squeeze them
                    const buttonClass = cn(
                        "flex flex-col items-center justify-center w-full aspect-square rounded-xl shadow-sm active:scale-95 transition-all text-white p-0.5",
                        action.color
                    );

                    if (hasMenu && action.menuItems) {
                        return (
                            <DropdownMenu key={action.id}>
                                <DropdownMenuTrigger asChild>
                                    <button className={buttonClass}>
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            <span className="text-[10px] md:text-sm font-bold whitespace-nowrap leading-tight text-center">{action.name}</span>
                                            {/* Tiny indicator for menu */}
                                            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-white/40 rounded-full" />
                                        </div>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="center" className="min-w-[160px]">
                                    {action.menuItems.map((subItem: any) => {
                                        const SubIcon = subItem.icon;
                                        return (
                                            <DropdownMenuItem key={subItem.id} onClick={() => executeAction(subItem.id)} className="gap-2 cursor-pointer text-right flex-row-reverse justify-between">
                                                <span className="flex-1 text-right">{subItem.name}</span>
                                                <SubIcon className="w-4 h-4 opacity-70" />
                                            </DropdownMenuItem>
                                        );
                                    })}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        );
                    }

                    if (action.id === 'shopping_action') {
                        return (
                            <DropdownMenu key={action.id}>
                                <DropdownMenuTrigger asChild>
                                    <button className={buttonClass}>
                                        <span className="text-[10px] md:text-sm font-bold whitespace-nowrap leading-tight text-center">{action.name}</span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => onOpenAddDialog('shopping')} className="justify-end gap-2">
                                        <span>إضافة غرض</span>
                                        <Plus className="w-4 h-4" />
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate('/notes-v2?folder=shopping')} className="justify-end gap-2">
                                        <span>عرض القائمة</span>
                                        <ListTodo className="w-4 h-4" />
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )
                    }

                    return (
                        <button
                            key={action.id}
                            onClick={() => executeAction(action.id)}
                            className={buttonClass}
                        >
                            <span className="text-[10px] md:text-sm font-bold whitespace-nowrap leading-tight text-center">{action.name}</span>
                        </button>
                    );
                })}
            </div>

            {/* Result Dialog */}
            <Dialog open={showActionResult !== null} onOpenChange={() => setShowActionResult(null)}>
                <DialogContent className="sm:max-w-sm bg-white/95 backdrop-blur text-right" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-700">
                            <Scale className="w-5 h-5" />
                            {showActionResult?.title}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="bg-gray-50 rounded-xl p-4 text-center text-lg font-medium leading-relaxed text-gray-800 border border-gray-100 whitespace-pre-line">
                        {showActionResult?.content}
                    </div>
                </DialogContent>
            </Dialog>

            <CalendarSettingsDialog open={showCalendarSettings} onOpenChange={setShowCalendarSettings} />
            <ShortcutsSettingsDialog open={showShortcutsDialog} onOpenChange={setShowShortcutsDialog} />
            <SavedLocationsDialog open={showSavedLocations} onOpenChange={setShowSavedLocations} />
            <MapsSettingsDialog
                open={showMapsAddDialog}
                onOpenChange={setShowMapsAddDialog}
                initialAddMode={true}
            />
        </div>
    );
};

export default QuickActionsGridV2;
