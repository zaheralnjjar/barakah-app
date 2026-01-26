import React from 'react';
import { Card } from '@/components/ui/card';
import { Sparkles, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isAndroid } from '@/utils/platformDetection';
import { getActionById } from './QuickActionsGrid';

interface QuadrantShortcutsV3Props {
    customShortcuts: string[];
    customLocations: any[];
    onManageShortcuts?: () => void;
    onExecuteShortcut: (id: string) => void;
}

export const QuadrantShortcutsV3: React.FC<QuadrantShortcutsV3Props> = ({
    customShortcuts, customLocations, onManageShortcuts, onExecuteShortcut
}) => {
    // Combine locations and shortcuts (Unlimited items, will wrap in grid)
    const allItems = [
        ...customLocations.map(loc => ({ type: 'location', data: loc })),
        ...customShortcuts.map(id => ({ type: 'shortcut', data: id }))
    ];

    if (allItems.length === 0) {
        return null;
    }

    return (
        <Card className="border-emerald-100 shadow-sm bg-white overflow-hidden p-2 md:p-3">
            {/* Dynamic Grid: 5 columns (Mobile) / 10 columns (Desktop) */}
            <div className="grid grid-cols-5 md:grid-cols-10 gap-1 md:gap-2">
                {allItems.map((item, idx) => {
                    if (item.type === 'location') {
                        const loc = item.data;
                        return (
                            <button
                                key={`loc-${idx}`}
                                onClick={() => window.open(loc.url, '_blank')}
                                className="flex flex-col items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 transition-all aspect-square p-1 group"
                            >
                                <span className="text-lg md:text-xl mb-0.5 transition-transform group-hover:scale-110">📍</span>
                                <span className="font-bold text-center leading-tight line-clamp-2 text-[7px] md:text-[8px]">
                                    {loc.name}
                                </span>
                            </button>
                        );
                    } else {
                        const action = getActionById(item.data);
                        if (!action) return null;
                        const Icon = action.icon;

                        const colorMap: Record<string, string> = {
                            'info': 'bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100',
                            'action': 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100',
                            'calc': 'bg-purple-50 border-purple-100 text-purple-700 hover:bg-purple-100',
                            'remind': 'bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100',
                            'smart': 'bg-pink-50 border-pink-100 text-pink-700 hover:bg-pink-100'
                        };

                        return (
                            <button
                                key={`shortcut-${idx}`}
                                onClick={() => onExecuteShortcut(item.data)}
                                className={cn(
                                    `flex flex-col items-center justify-center rounded-xl border transition-all aspect-square group ${colorMap[action.category] || colorMap['info']}`,
                                    "p-1"
                                )}
                                title={action.description}
                            >
                                <Icon className="w-5 h-5 md:w-6 md:h-6 mb-0.5 transition-transform group-hover:scale-110" />
                                <span className="font-bold text-center leading-tight line-clamp-2 text-[7px] md:text-[8px]">
                                    {action.name}
                                </span>
                            </button>
                        );
                    }
                })}
            </div>
        </Card>
    );
};
