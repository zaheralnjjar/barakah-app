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
import { CustomShortcutsGrid } from '@/components/shortcuts/CustomShortcutsGrid';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
    const [showDailyReport, setShowDailyReport] = useState(false);
    const [showWeeklyReport, setShowWeeklyReport] = useState(false);

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

    // Enforce static default actions - Ignore dynamic shortcuts
    const displayActions = defaultActions;

    return (
        <div className="w-full relative">
            <div className={`grid grid-cols-${Math.min(displayActions.length, 6)} gap-2 px-1`} dir="rtl">
                {displayActions.map((action) => {
                    // Check for menu types
                    const isSettings = action.actionId === 'sys_settings' || action.actionId === 'nav_settings' || action.actionId === 'open_settings' || action.actionId === 'settings';
                    const isEvent = action.actionId === 'event' || action.actionId === 'add_event';
                    const isLocation = action.actionId === 'location' || action.actionId === 'loc_save_current' || action.actionId === 'save_location_current';

                    // Determine if any menu is open for this action
                    const isOpen = (isSettings && showSettingsMenu) || (isEvent && showEventMenu) || (isLocation && showLocationMenu);

                    return (
                        <div key={action.id} className="relative col-span-1">
                            <button
                                onClick={() => {
                                    if (isSettings) setShowSettingsMenu(!showSettingsMenu);
                                    else if (isEvent) setShowEventMenu(!showEventMenu);
                                    else if (isLocation) setShowLocationMenu(!showLocationMenu);
                                    else if (action.actionId) executeShortcut(action.actionId);
                                }}
                                className={cn(
                                    "flex items-center justify-center py-2.5 rounded-xl transition-all active:scale-95 shadow-md w-full h-full min-h-[50px]",
                                    action.color,
                                    "border-b-2 border-black/10"
                                )}
                            >
                                <span className={cn("text-[10px] md:text-xs font-black tracking-wide", displayActions.length > 5 && "text-[9px]")} style={{ fontFamily: 'Cairo, sans-serif' }}>
                                    {action.label}
                                </span>
                            </button>

                            {/* Unified Floating Menu Logic */}
                            {isOpen && (
                                <div className="absolute top-14 left-0 z-50 flex flex-col gap-2 w-full min-w-[50px]">
                                    {isSettings && [
                                        { icon: Icons.Moon, action: () => { navigate('/prayer-times'); setShowSettingsMenu(false); }, color: 'bg-indigo-500 text-white shadow-indigo-200' },
                                        { icon: Icons.Map, action: () => { navigate('/locations'); setShowSettingsMenu(false); }, color: 'bg-emerald-500 text-white shadow-emerald-200' },
                                        { icon: Icons.Heart, action: () => { onOpenNewMuslims?.(); setShowSettingsMenu(false); }, color: 'bg-teal-500 text-white shadow-teal-200' },
                                        { icon: Icons.GraduationCap, action: () => { navigate('/thesis'); setShowSettingsMenu(false); }, color: 'bg-blue-500 text-white shadow-blue-200' },
                                        { icon: Icons.Command, action: () => { onOpenShortcuts?.(); setShowSettingsMenu(false); }, color: 'bg-purple-500 text-white shadow-purple-200' }
                                    ].map((item, idx) => (
                                        <button key={idx} onClick={item.action} className={cn("flex items-center justify-center py-2 rounded-xl transition-all active:scale-95 shadow-md w-full border-b-2 border-black/10", item.color)}>
                                            <item.icon className="w-5 h-5" />
                                        </button>
                                    ))}

                                    {isEvent && [
                                        { icon: CalendarPlus, action: () => { setShowEventMenu(false); onOpenAddDialog('appointment'); }, color: 'bg-orange-500 text-white shadow-orange-200' },
                                        { icon: CheckSquare, action: () => { setShowEventMenu(false); onOpenAddDialog('task'); }, color: 'bg-blue-500 text-white shadow-blue-200' }
                                    ].map((item, idx) => (
                                        <button key={idx} onClick={item.action} className={cn("flex items-center justify-center py-2 rounded-xl transition-all active:scale-95 shadow-md w-full border-b-2 border-black/10", item.color)}>
                                            <item.icon className="w-5 h-5" />
                                        </button>
                                    ))}

                                    {isLocation && [
                                        { icon: MapPin, action: () => { setShowLocationMenu(false); setShowSavedLocations(true); }, color: 'bg-blue-500 text-white shadow-blue-200' },
                                        { icon: Navigation, action: () => { setShowLocationMenu(false); onQuickParking?.(); }, color: 'bg-orange-500 text-white shadow-orange-200' }
                                    ].map((item, idx) => (
                                        <button key={idx} onClick={item.action} className={cn("flex items-center justify-center py-2 rounded-xl transition-all active:scale-95 shadow-md w-full border-b-2 border-black/10", item.color)}>
                                            <item.icon className="w-5 h-5" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <ShortcutsSettingsDialog open={showShortcutsDialog} onOpenChange={setShowShortcutsDialog} />
            <SavedLocationsDialog open={showSavedLocations} onOpenChange={setShowSavedLocations} />
        </div>
    );
};
export default QuickActionsGridV2;
