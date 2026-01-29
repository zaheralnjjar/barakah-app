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
    const filteredGridShortcuts = React.useMemo(() => {
        if (activeMode && activeMode.shortcut_ids.length > 0) {
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

    const fixedActionIds = ['timer', 'event', 'expense', 'location', 'shopping', 'open_settings', 'show_new_muslims', 'open_tools', 'note'];

    // Simplified Layout - Text Only Grid
    const gridActions = [
        { id: 'event', label: 'حدث', color: 'bg-[#8B5CF6] text-white shadow-purple-200' }, // Violet
        { id: 'timer', label: 'مؤقت', color: 'bg-[#F97316] text-white shadow-orange-200' }, // Orange
        { id: 'expense', label: 'مصروف', color: 'bg-[#EF4444] text-white shadow-red-200' }, // Red
        { id: 'location', label: 'موقع', color: 'bg-[#10B981] text-white shadow-emerald-200' }, // Emerald
        { id: 'shopping', label: 'تسوق', color: 'bg-[#EC4899] text-white shadow-pink-200' }, // Pink
        { id: 'settings', label: 'إعدادات', color: 'bg-[#3B82F6] text-white shadow-blue-200' }, // Blue (replaced prayer)
    ];

    return (
        <div className="w-full relative">
            <div className="grid grid-cols-6 gap-2 px-1" dir="rtl">
                {gridActions.map((action) => {
                    const isSettings = action.id === 'settings';
                    return (
                        <div key={action.id} className="relative">
                            <button
                                onClick={() => {
                                    if (action.id === 'event') setShowEventMenu(true);
                                    else if (action.id === 'timer') window.dispatchEvent(new Event('openPomodoroDialog'));
                                    else if (action.id === 'expense') onOpenAddDialog('expense');
                                    else if (action.id === 'location') setShowLocationMenu(true);
                                    else if (action.id === 'shopping') onOpenAddDialog('shopping');
                                    else if (action.id === 'settings') onOpenShortcuts?.(); // Direct to Shortcuts
                                }}
                                className={cn(
                                    "flex items-center justify-center py-2.5 rounded-xl transition-all active:scale-95 shadow-md w-full",
                                    action.color,
                                    "border-b-2 border-black/10"
                                )}
                            >
                                <span className="text-[10px] md:text-xs font-black tracking-wide" style={{ fontFamily: 'Cairo, sans-serif' }}>{action.label}</span>
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Event Type Selection Menu */}
            <Dialog open={showEventMenu} onOpenChange={setShowEventMenu}>
                <DialogContent className="max-w-[90vw] rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-center text-lg">اختر نوع الحدث</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <button
                            onClick={() => { setShowEventMenu(false); onOpenAddDialog('appointment'); }}
                            className="flex flex-col items-center justify-center p-5 rounded-2xl bg-orange-100 text-orange-600 active:scale-95"
                        >
                            <CalendarPlus className="w-10 h-10 mb-2" />
                            <span className="text-sm font-bold">موعد</span>
                        </button>
                        <button
                            onClick={() => { setShowEventMenu(false); onOpenAddDialog('task'); }}
                            className="flex flex-col items-center justify-center p-5 rounded-2xl bg-blue-100 text-blue-600 active:scale-95"
                        >
                            <CheckSquare className="w-10 h-10 mb-2" />
                            <span className="text-sm font-bold">مهمة</span>
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Location Type Selection Menu */}
            <Dialog open={showLocationMenu} onOpenChange={setShowLocationMenu}>
                <DialogContent className="max-w-[90vw] rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-center flex items-center justify-center gap-2">
                            <MapPin className="w-5 h-5 text-green-500" />
                            الموقع
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <button
                            onClick={() => {
                                setShowLocationMenu(false);
                                setShowSavedLocations(true); // Open Saved Locations Dialog
                            }}
                            className="flex flex-col items-center justify-center p-5 rounded-2xl bg-blue-100 text-blue-600 active:scale-95"
                        >
                            <MapPin className="w-8 h-8 mb-2" />
                            <span className="text-sm font-bold">مواقع محفوظة</span>
                        </button>

                        <button
                            onClick={() => { setShowLocationMenu(false); onQuickParking?.(); }}
                            className="flex flex-col items-center justify-center p-5 rounded-2xl bg-orange-100 text-orange-700 active:scale-95"
                        >
                            <div className="relative">
                                <MapPin className="w-8 h-8 mb-2 text-orange-600" />
                                <span className="text-2xl absolute -top-1 -right-1">🅿️</span>
                            </div>
                            <span className="text-sm font-bold">حفظ سريع (موقف)</span>
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            <ShortcutsSettingsDialog open={showShortcutsDialog} onOpenChange={setShowShortcutsDialog} />
            <SavedLocationsDialog open={showSavedLocations} onOpenChange={setShowSavedLocations} />
        </div>
    );
};
export default QuickActionsGridV2;
