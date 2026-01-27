import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCustomShortcuts } from '@/hooks/useCustomShortcuts';
import { useLocations } from '@/hooks/useLocations';
import { useShortcutExecution } from '@/hooks/useShortcutExecution';
import { getActionById } from '@/constants/actionDefinitions';
import { ShortcutsSettingsDialog } from '@/components/dialogs/ShortcutsSettingsDialog';
import { SavedLocationsDialog } from '@/components/dashboard/SavedLocationsDialog';
import { CustomShortcutsGrid } from '@/components/shortcuts/CustomShortcutsGrid';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { isAndroid } from '@/utils/platformDetection';
import { useLongPress } from '@/hooks/useLongPress';
import { FileText, ShoppingCart, MapPin, DollarSign, Sparkles, Timer, Search, LayoutGrid, Users, Settings, Pill, CheckSquare, Zap, CalendarPlus, Navigation, Link, Folder } from 'lucide-react';
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
    const pinnedLocationsList = locations.filter(l => l.category === 'pinned' || l.type === 'location');

    // States
    const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
    const [showEventMenu, setShowEventMenu] = useState(false);
    const [showLocationMenu, setShowLocationMenu] = useState(false);
    const [showSavedLocations, setShowSavedLocations] = useState(false);

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

    const fixedActionIds = ['timer', 'event', 'expense', 'location', 'shopping', 'open_settings', 'show_new_muslims', 'open_tools', 'open_academic', 'note'];

    // Unified Button Component
    const ActionButton = ({ shortcutId, isFixed = false, customData }: { shortcutId: string, isFixed?: boolean, customData?: any }) => {
        let displayName = '';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let DisplayIcon: any = FileText;
        let colorClass = 'text-gray-700 bg-white border-gray-200';
        let onClickHandler = () => { };
        let onLongPressHandler = () => { };

        // 1. Fixed Actions
        if (isFixed) {
            const action = getActionById(shortcutId);
            if (!action) return null;

            displayName = (shortcutId === 'open_settings' && isCleanMode) ? 'إظهار' : action.name;
            DisplayIcon = (shortcutId === 'open_settings' && isCleanMode) ? LayoutGrid : action.icon;
            colorClass = colorMap[shortcutId] || 'text-gray-700';

            // Handlers
            onClickHandler = () => executeShortcut(shortcutId);

            // Specific overrides
            if (shortcutId === 'open_settings') {
                onClickHandler = () => {
                    if (onToggleCleanMode) {
                        onToggleCleanMode();
                        if (navigator.vibrate) navigator.vibrate(50);
                    } else {
                        setShowShortcutsDialog(true);
                    }
                };
                onLongPressHandler = () => setShowShortcutsDialog(true);
            } else if (shortcutId === 'timer') {
                onClickHandler = () => executeShortcut('start_pomodoro');
                onLongPressHandler = () => executeShortcut('quick_timer_5');
            } else if (shortcutId === 'event') {
                onClickHandler = () => setShowEventMenu(true);
                onLongPressHandler = () => onNavigateToTab?.('appointments');
            } else if (shortcutId === 'expense') {
                onClickHandler = () => onOpenAddDialog('expense');
                onLongPressHandler = () => executeShortcut('finance_summary');
            } else if (shortcutId === 'location') {
                onClickHandler = () => setShowLocationMenu(true);
                onLongPressHandler = () => executeShortcut('copy_coords');
            } else if (shortcutId === 'shopping') {
                onClickHandler = () => onOpenAddDialog('shopping');
                onLongPressHandler = () => onNavigateToTab?.('shopping');
            } else if (shortcutId === 'note') {
                onClickHandler = () => onOpenAddDialog('note');
                onLongPressHandler = () => onOpenVoiceRecorder?.();
            } else if (shortcutId === 'open_academic') {
                onClickHandler = () => navigate('/thesis');
            } else if (shortcutId === 'show_new_muslims') {
                onClickHandler = () => onOpenNewMuslims?.();
                onLongPressHandler = () => toast({ title: '📊 إحصائيات', description: 'تم تحديث البيانات' });
            }

        }
        // 2. Custom Shortcuts (DB)
        else if (customData) {
            displayName = customData.custom_name || 'اختصار';
            colorClass = `bg-${customData.icon_color || 'gray'}-50 text-${customData.icon_color || 'gray'}-700 border-${customData.icon_color || 'gray'}-200`;

            // Icon
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const IconComponent = (Icons as any)[customData.custom_icon] || Link;
            DisplayIcon = customData.is_folder ? Folder : IconComponent;

            // Handlers
            if (customData.is_folder) {
                onClickHandler = () => {
                    toast({ title: customData.custom_name, description: 'فتح المجلد...' });
                    // TODO: Implement folder opening logic
                };
            } else if (customData.shortcut_type === 'action') {
                onClickHandler = () => executeShortcut(customData.action_id);
            } else if (customData.shortcut_type === 'url') {
                onClickHandler = () => window.open(customData.action_payload, '_blank');
            }

            onLongPressHandler = () => setShowShortcutsDialog(true); // Edit on long press
        }

        const bind = useLongPress({ onClick: onClickHandler, onLongPress: onLongPressHandler });

        return (
            <button
                {...bind}
                className={cn(
                    "flex flex-col items-center justify-center p-2",
                    "aspect-square w-full active:scale-90 transition-transform",
                    "rounded-2xl border shadow-sm",
                    colorClass
                )}
            >
                <DisplayIcon className="w-7 h-7 stroke-[2]" />
                <span className="text-xs font-bold tracking-tight text-center leading-tight mt-1 line-clamp-2">
                    {displayName}
                </span>
            </button>
        );
    };

    // Android Layout - Proper Order: Fixed Actions → Custom Shortcuts
    if (isAndroid()) {
        return (
            <div className="space-y-3">
                {/* 1. Fixed Quick Actions (2 rows x 5 cols) */}
                <div className="px-1" dir="rtl">
                    <div className="grid grid-cols-5 gap-2">
                        {fixedActionIds.map(id => <ActionButton key={id} shortcutId={id} isFixed={true} />)}
                    </div>
                </div>

                {/* 2. Custom Shortcuts from Settings - Conditional Render */}
                {!isCleanMode && gridShortcuts.length > 0 && (
                    <div className="px-1 animate-in slide-in-from-top-2 fade-in duration-300" dir="rtl">
                        <div className="grid grid-cols-5 gap-2">
                            {gridShortcuts.map(shortcut => (
                                <ActionButton key={shortcut.id} shortcutId={shortcut.id} customData={shortcut} />
                            ))}
                        </div>
                    </div>
                )}

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
                                onClick={() => { setShowLocationMenu(false); onQuickParking?.(); }}
                                className="flex flex-col items-center justify-center p-5 rounded-2xl bg-orange-100 text-orange-700 active:scale-95"
                            >
                                <span className="text-3xl mb-2">🅿️</span>
                                <span className="text-sm font-bold">حفظ موقف</span>
                            </button>
                            <button
                                onClick={() => { setShowLocationMenu(false); setShowSavedLocations(true); }}
                                className="flex flex-col items-center justify-center p-5 rounded-2xl bg-blue-100 text-blue-600 active:scale-95"
                            >
                                <MapPin className="w-8 h-8 mb-2" />
                                <span className="text-sm font-bold">المواقع</span>
                            </button>
                        </div>
                    </DialogContent>
                </Dialog>

                <ShortcutsSettingsDialog open={showShortcutsDialog} onOpenChange={setShowShortcutsDialog} />
                <SavedLocationsDialog open={showSavedLocations} onOpenChange={setShowSavedLocations} />
            </div>
        );
    }

    // Web Layout (3-Row Sequential)

    return (
        <div className="space-y-8 py-2" dir="rtl">
            {/* Row 1: User's Selected Quick Access Icons (5 cols mobile, 10 desktop) */}
            <div className="space-y-3">
                <h3 className="text-sm font-black text-gray-400 px-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    الوصول السريع
                </h3>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-4 px-1">
                    {fixedActionIds.map(id => <ActionButton key={id} shortcutId={id} isFixed={true} />)}
                </div>
            </div>

            {/* Row 2: Saved Locations (5 cols mobile, 10 desktop) */}
            {pinnedLocationsList.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-black text-gray-400 px-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        المواقع المحفوظة
                    </h3>
                    <div className="grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-4 px-1">
                        {pinnedLocationsList.map(loc => (
                            <button
                                key={loc.id}
                                onClick={() => window.open(loc.url, '_blank')}
                                className="flex flex-col items-center justify-center p-2 rounded-[1.5rem] border border-emerald-100 shadow-sm aspect-square w-full active:scale-95 transition-all group overflow-hidden bg-emerald-50/50 text-emerald-700"
                            >
                                <span className="text-[10px] md:text-[12px] font-black tracking-tight text-center leading-tight line-clamp-3 w-full px-1">
                                    {loc.title}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Row 3: Custom Shortcuts from Database (اختصاراتي) */}
            <CustomShortcutsGrid
                placement="shortcuts_grid"
                onOpenAddDialog={onOpenAddDialog}
                onNavigateToTab={onNavigateToTab}
                columns={5}
                size="md"
            />

            {/* Row 4: Shortcuts from DB displayed as ActionButtons (Alternative view if needed) */}
            {!isCleanMode && gridShortcuts.length > 0 && (
                <div className="px-1">
                    <h3 className="text-sm font-black text-gray-400 px-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        اختصاراتي اضافية
                    </h3>
                    <div className="grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-4">
                        {gridShortcuts.map(shortcut => (
                            <ActionButton key={shortcut.id} shortcutId={shortcut.id} customData={shortcut} />
                        ))}
                    </div>
                </div>
            )}

            {/* Event Type Selection Menu - Appointment & Task Only */}
            <Dialog open={showEventMenu} onOpenChange={setShowEventMenu}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-center text-lg">اختر نوع الحدث</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-6">
                        <button
                            onClick={() => { setShowEventMenu(false); onOpenAddDialog('appointment'); }}
                            className="flex flex-col items-center justify-center p-6 rounded-2xl bg-orange-100 text-orange-600 active:scale-95 transition-transform"
                        >
                            <CalendarPlus className="w-12 h-12 mb-3" />
                            <span className="text-base font-bold">موعد</span>
                        </button>
                        <button
                            onClick={() => { setShowEventMenu(false); onOpenAddDialog('task'); }}
                            className="flex flex-col items-center justify-center p-6 rounded-2xl bg-blue-100 text-blue-600 active:scale-95 transition-transform"
                        >
                            <CheckSquare className="w-12 h-12 mb-3" />
                            <span className="text-base font-bold">مهمة</span>
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Location Type Selection Menu - Quick Parking & Saved Locations Only */}
            <Dialog open={showLocationMenu} onOpenChange={setShowLocationMenu}>
                <DialogContent className="sm:max-w-[350px]">
                    <DialogHeader>
                        <DialogTitle className="text-center flex items-center justify-center gap-2">
                            <MapPin className="w-5 h-5 text-green-500" />
                            الموقع
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <button
                            onClick={() => { setShowLocationMenu(false); onQuickParking?.(); }}
                            className="flex flex-col items-center justify-center p-5 rounded-2xl bg-orange-100 text-orange-700 active:scale-95 transition-transform"
                        >
                            <span className="text-3xl mb-2">🅿️</span>
                            <span className="text-sm font-bold">حفظ موقف</span>
                        </button>
                        <button
                            onClick={() => { setShowLocationMenu(false); setShowSavedLocations(true); }}
                            className="flex flex-col items-center justify-center p-5 rounded-2xl bg-blue-100 text-blue-600 active:scale-95 transition-transform"
                        >
                            <MapPin className="w-8 h-8 mb-2" />
                            <span className="text-sm font-bold">المواقع</span>
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
