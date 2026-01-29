/**
 * CustomShortcutsGrid.tsx
 * Grid display for custom shortcuts with:
 * - Separate sections for quick_access and shortcuts_grid
 * - Drag and drop reordering (future)
 * - Empty state with add button
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useCustomShortcuts } from '@/hooks/useCustomShortcuts';
import { useCustomShortcutExecution } from '@/hooks/useCustomShortcutExecution';
import { useShortcutExecution } from '@/hooks/useShortcutExecution';
import { CustomShortcutButton } from './CustomShortcutButton';
import { ShortcutCustomizerDialog } from '@/components/dialogs/ShortcutCustomizerDialog';
import { Plus, Sparkles } from 'lucide-react';
import type { CustomShortcut, ActionPlacement } from '@/types/shortcuts';

interface CustomShortcutsGridProps {
    placement: ActionPlacement;
    onOpenAddDialog: (type: any) => void;
    onNavigateToTab?: (tabId: string) => void;
    columns?: number;
    size?: 'sm' | 'md' | 'lg';
    gridVariant?: 'icon' | 'text-card'; // New prop to control button style
    readonly?: boolean; // If true, hides the Add button
}

export const CustomShortcutsGrid: React.FC<CustomShortcutsGridProps> = ({
    placement,
    onOpenAddDialog,
    onNavigateToTab,
    columns = 6, // Default to 6 to match Quick Actions
    size = 'md',
    gridVariant = 'icon',
    readonly = false
}) => {
    const { shortcuts, getByPlacement } = useCustomShortcuts();
    const [showCustomizer, setShowCustomizer] = useState(false);
    const [editingShortcut, setEditingShortcut] = useState<CustomShortcut | null>(null);

    // Get the base executeShortcut from the standard hook
    const { executeShortcut: baseExecuteShortcut } = useShortcutExecution({
        onOpenAddDialog,
        onNavigateToTab
    });

    // Create extended execution hook
    const { executeCustomShortcut } = useCustomShortcutExecution({
        executeAction: baseExecuteShortcut
    });

    const placementShortcuts = getByPlacement(placement);

    const handleExecute = (shortcut: CustomShortcut, isLongPress: boolean) => {
        executeCustomShortcut(shortcut, isLongPress);
    };

    const handleEdit = (shortcut: CustomShortcut) => {
        setEditingShortcut(shortcut);
        setShowCustomizer(true);
    };

    const handleAddNew = () => {
        setEditingShortcut(null);
        setShowCustomizer(true);
    };

    // Empty state
    if (placementShortcuts.length === 0) {
        if (readonly) return null;

        return (
            <>
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-emerald-400 hover:text-emerald-600 transition-all w-full justify-center"
                >
                    <Plus className="w-5 h-5" />
                    <span className="text-sm font-medium">إضافة اختصار</span>
                </button>
                <ShortcutCustomizerDialog
                    open={showCustomizer}
                    onOpenChange={setShowCustomizer}
                    editingShortcut={editingShortcut}
                />
            </>
        );
    }

    return (
        <>
            <div className="space-y-3">
                <div className="space-y-1">
                    {/* Header hidden to make it look continuous, or make it subtle if needed. 
                    User asked for "Display Custom Shortcuts Below Quick Actions". 
                    If we want it valid, we can keep the header but make it small. 
                    But "in the same row type style" implies continuity. 
                    Let's Keep the header but minimalistic or remove if placement is 'shortcuts_grid' specifically for top dashboard.
                */}

                    <div
                        className={cn("grid gap-2 px-1", {
                            'grid-cols-4': columns === 4,
                            'grid-cols-5': columns === 5,
                            'grid-cols-6': columns === 6,
                        })}
                        dir="rtl"
                    >
                        {placementShortcuts.map(shortcut => (
                            <div key={shortcut.id} className="col-span-1">
                                <CustomShortcutButton
                                    shortcut={shortcut}
                                    onExecute={handleExecute}
                                    onEdit={handleEdit}
                                    size={size}
                                    variant={gridVariant}
                                    showLabel={gridVariant === 'icon'} // Hide external label if text-card
                                />
                            </div>
                        ))}

                        {/* Add Button as the last item in the grid flow - Only if not readonly */}
                        {!readonly && (
                            <button
                                onClick={handleAddNew}
                                className={cn(
                                    "flex items-center justify-center rounded-xl transition-all active:scale-95 shadow-sm border-2 border-dashed border-gray-200 text-gray-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50",
                                    gridVariant === 'text-card' ? "w-full min-h-[50px] py-2.5" : "w-16 h-16"
                                )}
                                title="إضافة اختصار جديد"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <ShortcutCustomizerDialog
                open={showCustomizer}
                onOpenChange={setShowCustomizer}
                editingShortcut={editingShortcut}
            />
        </>
    );
};

export default CustomShortcutsGrid;
