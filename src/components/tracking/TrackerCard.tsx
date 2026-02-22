import { Tracker, TrackerEntry } from "@/types/tracking";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Plus, Minus, MoreHorizontal, Pencil, Archive, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { EditTrackerDialog } from "./EditTrackerDialog";
import { trackingService } from "@/services/trackingService";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface TrackerCardProps {
    tracker: Tracker;
    entries: TrackerEntry[];
    onQuickAdd: (value: number) => void;
    onOpenEntryDialog: () => void;
    onClick: () => void;
    isSelectionMode?: boolean;
    isSelected?: boolean;
    onToggleSelection?: () => void;
}

export function TrackerCard({
    tracker,
    entries,
    onQuickAdd,
    onOpenEntryDialog,
    onClick,
    isSelectionMode = false,
    isSelected = false,
    onToggleSelection
}: TrackerCardProps) {
    const [showEditDialog, setShowEditDialog] = useState(false);
    const queryClient = useQueryClient();

    // Get last 7 days of entries for the sparkline
    const chartData = entries
        .slice(0, 7)
        .reverse()
        .map(e => ({ value: e.value }));

    // Calculate current value (today)
    const todayEntry = entries.find(e => {
        const entryDate = new Date(e.date);
        const today = new Date();
        return entryDate.getDate() === today.getDate() &&
            entryDate.getMonth() === today.getMonth() &&
            entryDate.getFullYear() === today.getFullYear();
    });

    const currentValue = todayEntry?.value || 0;
    const goal = tracker.settings.goal || 0;

    const handleDelete = async () => {
        if (confirm("هل أنت متأكد من حذف هذا المتتبع؟")) {
            try {
                await trackingService.deleteTracker(tracker.id);
                toast.success("تم حذف المتتبع");
                queryClient.invalidateQueries({ queryKey: ["trackers"] });
            } catch (error) {
                console.error(error);
                toast.error("حدث خطأ أثناء الحذف");
            }
        }
    };

    const handleArchive = async () => {
        try {
            await trackingService.updateTracker(tracker.id, { is_archived: !tracker.is_archived } as any);
            toast.success(tracker.is_archived ? "تم استعادة المتتبع" : "تم أرشفة المتتبع");
            queryClient.invalidateQueries({ queryKey: ["trackers"] });
        } catch (error) {
            console.error(error);
            toast.error("حدث خطأ أثناء الأرشفة");
        }
    }

    const handleClick = (e: React.MouseEvent) => {
        if (isSelectionMode && onToggleSelection) {
            e.stopPropagation();
            onToggleSelection();
        } else {
            onClick();
        }
    };

    return (
        <>
            <div
                onClick={handleClick}
                className={`group relative flex flex-col justify-between p-4 rounded-3xl backdrop-blur-xl border shadow-sm transition-all cursor-pointer h-[180px] overflow-hidden
                    ${isSelectionMode && isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 ring-2 ring-indigo-500'
                        : 'bg-white/40 dark:bg-black/20 border-white/20 hover:shadow-md'
                    }
                `}
            >
                {/* Selection Indicator */}
                {isSelectionMode && (
                    <div className="absolute top-4 left-4 z-20">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 bg-white/50'}`}>
                            {isSelected && <div className="w-3 h-3 bg-white rounded-full" />}
                        </div>
                    </div>
                )}
                {/* Background Sparkline - Absolute positioned to fill bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-24 opacity-20 pointer-events-none z-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id={`grad-${tracker.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={tracker.color || "#000"} stopOpacity={0.8} />
                                    <stop offset="95%" stopColor={tracker.color || "#000"} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={tracker.color || "#000"}
                                fill={`url(#grad-${tracker.id})`}
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Content */}
                <div className="z-10 flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-sm"
                            style={{ backgroundColor: `${tracker.color}20`, color: tracker.color }}
                        >
                            {tracker.icon || "⚡️"}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{tracker.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{tracker.type}</p>
                        </div>
                    </div>

                    {/* Menu Action */}
                    <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 shrink-0">
                                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                                    <Pencil className="w-4 h-4 ml-2" />
                                    تعديل
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={async () => {
                                    try {
                                        const currentSettings = tracker.settings || {};
                                        await trackingService.updateTracker(tracker.id, {
                                            settings: { ...currentSettings, show_on_dashboard: !currentSettings.show_on_dashboard }
                                        } as any);
                                        toast.success(currentSettings.show_on_dashboard ? "تم إزالة التثبيت من الرئيسية" : "تم التثبيت على الرئيسية");
                                        queryClient.invalidateQueries({ queryKey: ["trackers"] });
                                    } catch (e) { toast.error("فشل التثبيت"); }
                                }}>
                                    <Plus className="w-4 h-4 ml-2" />
                                    {tracker.settings?.show_on_dashboard ? "إزالة من الرئيسية" : "تثبيت على الرئيسية"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleArchive}>
                                    <Archive className="w-4 h-4 ml-2" />
                                    {tracker.is_archived ? "استعادة" : "أرشفة/إخفاء"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                                    <Trash2 className="w-4 h-4 ml-2" />
                                    حذف
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="z-10 mt-auto flex items-end justify-between">
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold font-mono tracking-tight text-gray-900 dark:text-white">
                                {currentValue}
                            </span>
                            {tracker.settings.unit && (
                                <span className="text-sm text-gray-500 font-medium">
                                    {tracker.settings.unit}
                                </span>
                            )}
                        </div>
                        {goal > 0 && (
                            <div className="text-xs text-gray-400 mt-1">
                                الهدف: {goal}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        {/* Quick Add for Numeric/Boolean */}
                        {tracker.type === 'numeric' && (
                            <Button
                                variant="secondary"
                                size="icon"
                                className="rounded-full w-10 h-10 shadow-sm hover:scale-105 transition-transform bg-white dark:bg-gray-800"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const step = tracker.settings.step || 1;
                                    onQuickAdd(currentValue + step);
                                }}
                            >
                                <Plus className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                            </Button>
                        )}

                        {tracker.type === 'boolean' && (
                            <Button
                                variant={currentValue ? "default" : "outline"}
                                size="sm"
                                className={`rounded-full px-4 shadow-sm transition-all ${currentValue ? 'bg-green-500 hover:bg-green-600 border-transparent text-white' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onQuickAdd(currentValue ? 0 : 1);
                                }}
                            >
                                {currentValue ? "تم" : "إنجاز"}
                            </Button>
                        )}

                        {/* Log Entry for Scale/Time/Select/Others */}
                        {(tracker.type === 'scale' || tracker.type === 'time' || tracker.type === 'select' || tracker.type === 'mood' || tracker.type === 'time_range' || tracker.type === 'checklist' || tracker.type === 'text') && (
                            <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-full px-3 shadow-sm hover:scale-105 transition-transform bg-white dark:bg-gray-800 text-xs"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenEntryDialog();
                                }}
                            >
                                سجل
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <EditTrackerDialog
                tracker={tracker}
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
            />
        </>
    );
}
