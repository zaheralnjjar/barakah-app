import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Plus, Settings, ExternalLink, Calculator, FileText, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getActionById } from './QuickActionsGrid'; // Assuming this helper is exported

interface QuadrantShortcutsV2Props {
    customShortcuts: string[];
    customLocations: any[];
    onManageShortcuts?: () => void;
    onExecuteShortcut: (id: string) => void;
}

export const QuadrantShortcutsV2: React.FC<QuadrantShortcutsV2Props> = ({
    customShortcuts, customLocations, onManageShortcuts, onExecuteShortcut
}) => {
    return (
        <Card className="h-full border-indigo-100 shadow-sm bg-white/60 backdrop-blur-md overflow-hidden flex flex-col">
            <div className="p-2 border-b border-indigo-50 bg-indigo-50/30 flex items-center justify-between">
                <h3 className="font-bold text-indigo-800 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-4 h-4" />
                    اختصاراتي
                </h3>
                <button
                    onClick={onManageShortcuts}
                    className="p-1 rounded-full hover:bg-indigo-100 text-indigo-400 transition-colors"
                >
                    <Settings className="w-3.5 h-3.5" />
                </button>
            </div>

            <CardContent className="p-2 flex-1 overflow-y-auto custom-scrollbar">
                {(customShortcuts.length === 0 && customLocations.length === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center text-center gap-2">
                        <button
                            onClick={onManageShortcuts}
                            className="w-10 h-1 rounded-full border-2 border-dashed border-indigo-200 flex items-center justify-center text-indigo-300 hover:border-indigo-400 hover:text-indigo-500 transition-all hover:scale-110"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                        <p className="text-[10px] text-gray-400">أضف اختصارات</p>
                    </div>
                ) : (
                    <div className="grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto pb-2 min-w-full px-1 scrollbar-hide" style={{ direction: 'rtl' }}>
                        {/* Custom Locations */}
                        {customLocations.map((loc, idx) => (
                            <button
                                key={`loc-${idx}`}
                                onClick={() => window.open(loc.url, '_blank')}
                                className="flex flex-col items-center justify-center w-[70px] h-[60px] p-1 rounded-xl bg-violet-50 border border-violet-100 text-violet-700 hover:bg-violet-100 hover:border-violet-300 transition-all group shrink-0"
                            >
                                <MapPin className="w-4 h-4 mb-1 group-hover:scale-110 transition-transform" />
                                <span className="text-[8px] font-bold text-center leading-tight line-clamp-2 w-full">
                                    {loc.name}
                                </span>
                            </button>
                        ))}

                        {/* App Shortcuts */}
                        {customShortcuts.map((id) => {
                            const action = getActionById(id);
                            if (!action) return null;
                            const Icon = action.icon;

                            return (
                                <button
                                    key={id}
                                    onClick={() => onExecuteShortcut(id)}
                                    className="flex flex-col items-center justify-center w-[70px] h-[60px] p-1 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group shrink-0"
                                >
                                    <div className={`p-1 rounded-full ${action.category === 'calc' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'} mb-0.5 group-hover:scale-110 transition-transform`}>
                                        <Icon className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-[8px] font-bold text-gray-700 text-center leading-tight line-clamp-2 w-full">
                                        {action.name}
                                    </span>
                                </button>
                            );
                        })}

                        {/* Add Button */}
                        <button
                            onClick={onManageShortcuts}
                            className="flex flex-col items-center justify-center w-[70px] h-[60px] p-1 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-all shrink-0"
                        >
                            <Plus className="w-4 h-4 mb-1 opacity-50" />
                            <span className="text-[8px] font-medium">إضافة</span>
                        </button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
