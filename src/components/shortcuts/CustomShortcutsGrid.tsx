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
}

export const CustomShortcutsGrid: React.FC<CustomShortcutsGridProps> = ({
    placement,
    onOpenAddDialog,
    onNavigateToTab,
    columns = 5,
    size = 'md'
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
        return (
            <>
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-emerald-400 hover:text-emerald-600 transition-all w-full justify-center"
                >
                    <Plus className="w-5 h-5" />
                    <span className="text-sm font-medium">إضافة اختصار مخصص</span>
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
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-gray-400 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        <Sparkles className="w-3 h-3" />
                        اختصاراتي
                    </h3>
                    <button
                        onClick={handleAddNew}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors text-xs font-medium"
                    >
                        <Plus className="w-3 h-3" />
                        إضافة
                    </button>
                </div>

                <div
                    className={cn("grid gap-3", {
                        'grid-cols-4': columns === 4,
                        'grid-cols-5': columns === 5,
                        'grid-cols-6': columns === 6,
                        'md:grid-cols-10': columns >= 5,
                    })}
                >
                    {placementShortcuts.map(shortcut => (
                        <CustomShortcutButton
                            key={shortcut.id}
                            shortcut={shortcut}
                            onExecute={handleExecute}
                            onEdit={handleEdit}
                            size={size}
                        />
                    ))}
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
