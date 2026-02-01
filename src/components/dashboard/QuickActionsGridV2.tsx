import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCustomShortcuts } from '@/hooks/useCustomShortcuts';
import { useLocations } from '@/hooks/useLocations';
import { useShortcutExecution } from '@/hooks/useShortcutExecution';
import { useSystemModes } from '@/hooks/useSystemModes';
import { getActionById } from '@/constants/actionDefinitions';
import { ShortcutsSettingsDialog } from '@/components/dialogs/ShortcutsSettingsDialog';
import { SavedLocationsDialog } from '@/components/dashboard/SavedLocationsDialog';
import { LocationsGridDialog } from '@/components/dashboard/LocationsGridDialog'; // Import new dialog
import { MapsSettingsDialog } from '@/components/dialogs/MapsSettingsDialog';
import { CustomShortcutsGrid } from '@/components/shortcuts/CustomShortcutsGrid';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { isAndroid } from '@/utils/platformDetection';
import { useLongPress } from '@/hooks/useLongPress';
import { FileText, ShoppingCart, MapPin, DollarSign, Sparkles, Timer, Search, LayoutGrid, Users, Settings, Pill, CheckSquare, Zap, CalendarPlus, Navigation, Link, Folder, Map } from 'lucide-react';
import { ProductivityTicker } from './ProductivityTicker';
import { SmartGridTicker } from './SmartGridTicker';
import { DailyReportDialog, WeeklyReportDialog } from './ProductivityReportsDialogs';
import * as Icons from 'lucide-react';

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
    const { gridShortcuts } = useCustomShortcuts();
    const { locations } = useLocations();
    const { modes } = useSystemModes();
    const activeMode = modes.find(m => m.is_active);

    const pinnedLocationsList = locations.filter(l => {
        // If mode is active and has specific locations, only show those or prioritize them
        if (activeMode && activeMode.location_ids.length > 0) {
            return activeMode.location_ids.includes(l.id);
        }
        return l.category === 'pinned' || l.type === 'location';
    });

    // Filter shortcuts based on mode
    // Filter shortcuts based on mode, fallback to global if mode has no shortcuts
    const filteredGridShortcuts = React.useMemo(() => {
        if (activeMode && activeMode.shortcut_ids && activeMode.shortcut_ids.length > 0) {
            return gridShortcuts.filter(s => activeMode.shortcut_ids.includes(s.id));
        }
        return gridShortcuts;
    }, [gridShortcuts, activeMode]);

    // States
    const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
    const [showEventMenu, setShowEventMenu] = useState(false);
    const [showLocationMenu, setShowLocationMenu] = useState(false);
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);
    const [showSavedLocations, setShowSavedLocations] = useState(false);
    const [showLocationsGrid, setShowLocationsGrid] = useState(false); // New state for grid dialog
    const [showDailyReport, setShowDailyReport] = useState(false);
    const [showWeeklyReport, setShowWeeklyReport] = useState(false);
    const [showMapsAddDialog, setShowMapsAddDialog] = useState(false);

    // Shortcut Execution
    const { executeShortcut } = useShortcutExecution({
        onOpenAddDialog,
        onOpenVoiceRecorder,
        onOpenTimer,
        onOpenNewMuslims,
        onNavigateToTab,
        onOpenSearch,
        onOpenShortcuts: () => setShowShortcutsDialog(true),
        onQuickParking
    });

    // Color map based on user screenshot
    const colorMap: Record<string, string> = {
        'timer': 'bg-orange-50/80 text-orange-700 border-orange-100',
        'event': 'bg-purple-50/80 text-purple-700 border-purple-100',
        'expense': 'bg-red-50/80 text-red-700 border-red-100',
        'location': 'bg-green-50/80 text-green-700 border-green-100',
        'shopping': 'bg-pink-50/80 text-pink-700 border-pink-100',
        'note': 'bg-yellow-50/80 text-amber-700 border-yellow-100',
        'open_academic': 'bg-indigo-50/80 text-indigo-700 border-indigo-100',
        'open_tools': 'bg-emerald-50/80 text-emerald-700 border-emerald-100',
        'show_new_muslims': 'bg-green-50/80 text-green-700 border-green-100',
        'open_settings': isCleanMode
            ? 'bg-blue-500 text-white border-blue-600 shadow-md ring-2 ring-blue-200'
            : 'bg-slate-100/80 text-slate-700 border-slate-200',
    };

    // Default actions fallback
    const defaultActions = [
        { id: 'event-default', label: 'حدث', color: 'bg-[#8B5CF6] text-white shadow-purple-200', actionId: 'event' },
        { id: 'timer-default', label: 'مؤقت', color: 'bg-[#F97316] text-white shadow-orange-200', actionId: 'timer' },
        { id: 'expense-default', label: 'مصروف', color: 'bg-[#EF4444] text-white shadow-red-200', actionId: 'expense' },
        { id: 'location-default', label: 'موقع', color: 'bg-[#10B981] text-white shadow-emerald-200', actionId: 'location' },
        { id: 'shopping-default', label: 'تسوق', color: 'bg-[#EC4899] text-white shadow-pink-200', actionId: 'shopping' },
        { id: 'settings-default', label: 'إعدادات', color: 'bg-[#3B82F6] text-white shadow-blue-200', actionId: 'sys_settings' },
    ];

    // Close menus when clicking outside
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSettingsMenu(false);
                setShowEventMenu(false);
                setShowLocationMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleActionClick = (action: any) => {
        const isSettings = action.actionId === 'sys_settings' || action.actionId === 'nav_settings' || action.actionId === 'open_settings' || action.actionId === 'settings';
        const isEvent = action.actionId === 'event' || action.actionId === 'add_event';
        const isLocation = action.actionId === 'location' || action.actionId === 'loc_save_current' || action.actionId === 'save_location_current';
        const isMyLocations = action.actionId === 'open_locations_grid';

        if (isSettings) setShowSettingsMenu(!showSettingsMenu);
        else if (isEvent) setShowEventMenu(!showEventMenu);
        else if (isLocation) {
            // Direct "Add Location" workflow for Phase 6
            setShowMapsAddDialog(true);
        }
        else if (isMyLocations) setShowLocationsGrid(true);
        else if (action.id === 'loc_direct_detailed' || action.actionId === 'loc_direct_detailed') {
            window.dispatchEvent(new Event('open-location-shortcut-dialog'));
        }
        else if (action.actionId) executeShortcut(action.actionId);
    };

    const handleLongPress = (action: any) => {
        if (action.id === 'loc_direct_detailed' || action.actionId === 'loc_direct_detailed') {
            // Planificar Ruta (Plan Route) -> Open Google Maps Directions
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(pos => {
                    const url = `https://www.google.com/maps/dir/?api=1&origin=${pos.coords.latitude},${pos.coords.longitude}`;
                    window.open(url, '_blank');
                });
            } else {
                window.open('https://www.google.com/maps', '_blank');
            }
            toast({ title: 'رسم المسار', description: 'جاري فتح الخرائط...' });
        } else if (action.actionId === 'open_locations_grid') {
            onQuickParking?.();
        }
    };

    return (
        <div className="w-full relative" ref={containerRef}>
            <div className={`grid grid-cols-${Math.min(defaultActions.length, 6)} gap-2 px-1`} dir="rtl">
                {defaultActions.map((action) => {
                    const isSettings = action.actionId === 'sys_settings';
                    const isEvent = action.actionId === 'event';

                    // Only these have menus
                    const hasMenu = isSettings || isEvent;
                    const isOpen = (isSettings && showSettingsMenu) || (isEvent && showEventMenu);

                    const ButtonContent = (
                        <div className="w-full h-full">
                            <QuickActionButton
                                action={action}
                                onClick={() => handleActionClick(action)}
                                onLongPress={() => handleLongPress(action)}
                            />
                        </div>
                    );

                    return (
                        <div key={action.id} className="relative col-span-1 aspect-square">
                            {hasMenu ? (
                                <DropdownMenu open={isOpen} onOpenChange={(open) => {
                                    if (!open) {
                                        if (isSettings) setShowSettingsMenu(false);
                                        if (isEvent) setShowEventMenu(false);
                                    }
                                }}>
                                    <DropdownMenuTrigger asChild>
                                        {ButtonContent}
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent className="w-56 z-[60]" align="start" sideOffset={5}>
                                        {isSettings && (
                                            <>
                                                <DropdownMenuItem onClick={() => { navigate('/prayer-times'); setShowSettingsMenu(false); }} className="gap-2">
                                                    <Icons.Moon className="w-4 h-4 text-indigo-500" /> <span>أوقات الصلاة</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { navigate('/locations'); setShowSettingsMenu(false); }} className="gap-2">
                                                    <Icons.Map className="w-4 h-4 text-emerald-500" /> <span>المواقع</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { onOpenNewMuslims?.(); setShowSettingsMenu(false); }} className="gap-2">
                                                    <Icons.Heart className="w-4 h-4 text-teal-500" /> <span>المهتدين</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { navigate('/thesis'); setShowSettingsMenu(false); }} className="gap-2">
                                                    <Icons.GraduationCap className="w-4 h-4 text-blue-500" /> <span>الأطروحة</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { onOpenShortcuts?.(); setShowSettingsMenu(false); }} className="gap-2">
                                                    <Icons.Command className="w-4 h-4 text-purple-500" /> <span>الاختصارات</span>
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                        {isEvent && (
                                            <>
                                                <DropdownMenuItem onClick={() => { setShowEventMenu(false); onOpenAddDialog('appointment'); }} className="gap-2">
                                                    <CalendarPlus className="w-4 h-4 text-orange-500" /> <span>موعد</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { setShowEventMenu(false); onOpenAddDialog('task'); }} className="gap-2">
                                                    <CheckSquare className="w-4 h-4 text-blue-500" /> <span>مهمة</span>
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                ButtonContent
                            )}
                        </div>
                    );
                })}
            </div>

            <ShortcutsSettingsDialog open={showShortcutsDialog} onOpenChange={setShowShortcutsDialog} />
            <SavedLocationsDialog open={showSavedLocations} onOpenChange={setShowSavedLocations} />
            <LocationsGridDialog open={showLocationsGrid} onOpenChange={setShowLocationsGrid} />
            <MapsSettingsDialog
                open={showMapsAddDialog}
                onOpenChange={setShowMapsAddDialog}
                initialAddMode={true}
            />
        </div>
    );
};

const QuickActionButton = ({ action, onClick, onLongPress }: { action: any, onClick: () => void, onLongPress?: () => void }) => {
    const { onMouseDown, onMouseUp, onMouseLeave, onTouchStart, onTouchEnd } = useLongPress({
        onClick,
        onLongPress: onLongPress || (() => { }),
        ms: 600
    });

    // If no long press handler is provided, use standard onclick for better responsiveness
    const handlers = onLongPress ? {
        onMouseDown, onMouseUp, onMouseLeave, onTouchStart, onTouchEnd
    } : { onClick };

    const isMobile = isAndroid();

    return (
        <button
            {...handlers}
            className={cn(
                "flex flex-col items-center justify-center p-1 rounded-2xl transition-all active:scale-95 shadow-sm w-full h-full aspect-square relative overflow-hidden ring-1 ring-black/5",
                action.color
            )}
        >
            {action.icon ? <action.icon className={cn("mb-1 shrink-0 opacity-90", isMobile ? "w-6 h-6" : "w-9 h-9")} /> : null}
            <span className={cn("font-bold tracking-tight leading-3 text-center w-full px-0.5 line-clamp-1", isMobile ? "text-[10px]" : "text-[11px]")}>
                {action.actionId === 'sys_settings' ? 'إعدادات' : action.label}
            </span>
        </button>
    );
};

export default QuickActionsGridV2;
