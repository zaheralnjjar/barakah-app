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

import { motion } from "framer-motion";

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
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                onClick={handleClick}
                className={`group relative flex flex-col justify-between p-5 rounded-[2rem] backdrop-blur-2xl border transition-all cursor-pointer h-[200px] overflow-hidden
                    ${isSelectionMode && isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-900/40 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)] ring-1 ring-indigo-500'
                        : 'bg-white/40 dark:bg-black/40 border-white/40 dark:border-white/10 hover:shadow-xl hover:bg-white/60 dark:hover:bg-black/50 shadow-sm'
                    }
                `}
            >
                {/* Glow Effect */}
                <div
                    className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 pointer-events-none transition-transform group-hover:scale-150 duration-700"
                    style={{ backgroundColor: tracker.color || "#6366f1" }}
                />

                {/* Selection Indicator */}
                {isSelectionMode && (
                    <div className="absolute top-5 left-5 z-20">
                        <motion.div
                            initial={false}
                            animate={{ scale: isSelected ? 1.1 : 1 }}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 bg-white/50'}`}
                        >
                            {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full shadow-sm" />}
                        </motion.div>
                    </div>
                )}

                {/* Background Sparkline */}
                <div className="absolute bottom-0 left-0 right-0 h-28 opacity-30 pointer-events-none z-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id={`grad-${tracker.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={tracker.color || "#6366f1"} stopOpacity={0.6} />
                                    <stop offset="95%" stopColor={tracker.color || "#6366f1"} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={tracker.color || "#6366f1"}
                                fill={`url(#grad-${tracker.id})`}
                                strokeWidth={3}
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Content */}
                <div className="z-10 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner-sm transition-transform group-hover:scale-110 duration-300"
                            style={{
                                backgroundColor: `${tracker.color}15`,
                                color: tracker.color,
                                boxShadow: `inset 0 0 0 1px ${tracker.color}30`
                            }}
                        >
                            {tracker.icon || "⚡️"}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-tight">{tracker.name}</h3>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-1">
                                {tracker.type === 'numeric' ? 'رقمي' :
                                    tracker.type === 'boolean' ? 'نعم/لا' :
                                        tracker.type === 'scale' ? 'مقياس' :
                                            tracker.type === 'mood' ? 'مزاج' : 'متتبع'}
                            </p>
                        </div>
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 shrink-0">
                                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[160px]">
                                <DropdownMenuItem onClick={() => setShowEditDialog(true)} className="rounded-xl py-2 px-3">
                                    <Pencil className="w-4 h-4 ml-2 opacity-70" />
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
                                }} className="rounded-xl py-2 px-3">
                                    <Plus className="w-4 h-4 ml-2 opacity-70" />
                                    {tracker.settings?.show_on_dashboard ? "إزالة من الرئيسية" : "تثبيت على الرئيسية"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleArchive} className="rounded-xl py-2 px-3">
                                    <Archive className="w-4 h-4 ml-2 opacity-70" />
                                    {tracker.is_archived ? "استعادة" : "أرشفة/إخفاء"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-1" />
                                <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 rounded-xl py-2 px-3 font-medium">
                                    <Trash2 className="w-4 h-4 ml-2" />
                                    حذف
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="z-10 mt-auto flex items-end justify-between">
                    <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black font-mono tracking-tighter text-gray-900 dark:text-white">
                                {currentValue}
                            </span>
                            {tracker.settings.unit && (
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">
                                    {tracker.settings.unit}
                                </span>
                            )}
                        </div>
                        {goal > 0 && (
                            <div className="flex items-center gap-2">
                                <div className="h-1 flex-1 max-w-[60px] bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min((currentValue / goal) * 100, 100)}%` }}
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: tracker.color }}
                                    />
                                </div>
                                <span className="text-[10px] font-bold text-gray-400">
                                    الهدف: {goal}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        {tracker.type === 'numeric' && (
                            <Button
                                variant="secondary"
                                size="icon"
                                className="rounded-2xl w-12 h-12 shadow-md hover:scale-105 active:scale-95 transition-all bg-white dark:bg-gray-800 border-white dark:border-gray-700"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const increment = tracker.quick_add_increment || tracker.settings.step || 1;
                                    onQuickAdd(currentValue + increment);
                                }}
                            >
                                <Plus className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                            </Button>
                        )}

                        {tracker.type === 'boolean' && (
                            <Button
                                variant={currentValue ? "default" : "outline"}
                                size="sm"
                                className={`rounded-xl px-5 h-11 shadow-md transition-all font-bold ${currentValue ? 'bg-green-500 hover:bg-green-600 border-transparent text-white' : 'dark:bg-gray-800 dark:border-gray-700'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onQuickAdd(currentValue ? 0 : 1);
                                }}
                            >
                                {currentValue ? "تم بنجاح" : "بانتظار الإنجاز"}
                            </Button>
                        )}

                        {(tracker.type === 'scale' || tracker.type === 'time' || tracker.type === 'select' || tracker.type === 'mood' || tracker.type === 'time_range' || tracker.type === 'checklist' || tracker.type === 'text') && (
                            <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-xl px-5 h-11 shadow-md hover:scale-105 active:scale-95 transition-all bg-white dark:bg-gray-800 border-white dark:border-gray-700 font-bold"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenEntryDialog();
                                }}
                            >
                                سجل الآن
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>

            <EditTrackerDialog
                tracker={tracker}
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
            />
        </>
    );
}
