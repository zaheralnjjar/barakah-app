import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tracker, TrackerEntry } from "@/types/tracking";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TrackerDetailsDialogProps {
    tracker: Tracker | null;
    entries: TrackerEntry[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAddEntry: () => void;
}

export function TrackerDetailsDialog({ tracker, entries, open, onOpenChange, onAddEntry }: TrackerDetailsDialogProps) {
    if (!tracker) return null;

    const chartData = entries
        .slice(0, 30)
        .reverse()
        .map(e => ({
            date: format(new Date(e.date), "MMM d"),
            value: e.value,
            note: e.note
        }));

    const goal = tracker.settings.goal || 0;

    // Calculate basic stats for the "middle" chart/indicator
    const last7Days = entries.slice(0, 7).reverse(); // Last 7 entries (approx)
    // Create specific data for the mini-chart
    const miniChartData = last7Days.map(e => ({
        value: e.value,
        fullDate: e.date
    }));


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl w-full overflow-hidden text-right p-0 gap-0 bg-white dark:bg-[#1a1b1e] border-none shadow-2xl rounded-3xl" dir="rtl">

                {/* Header Section with Color Background */}
                <div className="relative overflow-hidden mb-0">
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{ backgroundColor: tracker.color }}
                    />
                    <div className="p-6 pb-8 pt-8">
                        <DialogHeader className="text-right space-y-4">
                            <div className="flex items-center justify-between flex-row-reverse">
                                <div className="flex items-center gap-4 flex-row-reverse">
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm bg-white dark:bg-black/10"
                                        style={{ color: tracker.color }}
                                    >
                                        {tracker.icon || "⚡️"}
                                    </div>
                                    <div className="text-right">
                                        <DialogTitle className="text-2xl font-bold">{tracker.name}</DialogTitle>
                                        <DialogDescription className="text-base text-gray-500">
                                            {tracker.type === 'checklist' ? 'سجل المتابعة' : 'التاريخ والتقدم'}
                                        </DialogDescription>
                                    </div>
                                </div>
                                <Button onClick={onAddEntry} size="icon" className="h-10 w-10 rounded-full shadow-md" style={{ backgroundColor: tracker.color }}>
                                    <Plus className="w-5 h-5 text-white" />
                                </Button>
                            </div>
                        </DialogHeader>
                    </div>
                </div>

                <div className="p-6 space-y-8 bg-white dark:bg-[#1a1b1e]">

                    {/* Main Chart Section - The "Middle" Chart requested */}
                    <div className="flex items-center justify-between gap-6">
                        {/* Left Side: Stats */}
                        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl min-w-[100px]">
                            <span className="text-3xl font-bold" style={{ color: tracker.color }}>
                                {entries.length > 0 ? entries[0].value : 0}
                            </span>
                            <span className="text-xs text-gray-400 mt-1 uppercase tracking-wider">الحالي</span>
                        </div>

                        {/* Center: The Mini Chart (Middle Area) */}
                        <div className="flex-1 h-[80px] w-full relative">
                            {miniChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={miniChartData}>
                                        <defs>
                                            <linearGradient id={`grad-mini-${tracker.id}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={tracker.color || "#000"} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={tracker.color || "#000"} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke={tracker.color || "#000"}
                                            strokeWidth={2}
                                            fill={`url(#grad-mini-${tracker.id})`}
                                            animationDuration={1000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-gray-300 text-sm italic border rounded-xl border-dashed">
                                    لا توجد بيانات كافية
                                </div>
                            )}
                        </div>

                        {/* Right Side: Stats */}
                        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl min-w-[100px]">
                            <span className="text-3xl font-bold">{entries.length}</span>
                            <span className="text-xs text-gray-400 mt-1 uppercase tracking-wider">السجلات</span>
                        </div>
                    </div>


                    {/* History List */}
                    <div>
                        <h3 className="font-bold text-lg mb-4 text-right flex items-center gap-2">
                            <span className="w-1 h-6 rounded-full" style={{ backgroundColor: tracker.color }}></span>
                            آخر السجلات
                        </h3>
                        <ScrollArea className="h-[250px] pr-4 -mr-4" dir="rtl">
                            <div className="space-y-3 pl-4">
                                {entries.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                        <p>لا توجد سجلات بعد.</p>
                                    </div>
                                )}
                                {entries.map(entry => (
                                    <div key={entry.id} className="group flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800/50 flex-row-reverse transition-all hover:bg-white hover:shadow-md hover:border-transparent dark:hover:bg-gray-800">
                                        <div className="text-right">
                                            <div className="font-bold text-gray-800 dark:text-gray-200">
                                                {tracker.type === 'mood' ? (
                                                    <span className="text-2xl">{['😢', '😕', '😐', '🙂', '😃'][entry.value ? entry.value - 1 : 2]}</span>
                                                ) : tracker.type === 'time_range' ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-sm">
                                                            {entry.data?.startTime} - {entry.data?.endTime}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            ({Math.round(entry.value || 0)} دقيقة)
                                                        </span>
                                                    </div>
                                                ) : entry.data?.selected ? (
                                                    entry.data.selected
                                                ) : (
                                                    <>{entry.value} <span className="text-sm font-normal text-gray-500">{tracker.settings.unit}</span></>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                {format(new Date(entry.date), "PPP p")}
                                            </div>
                                            {entry.note && (
                                                <p className="text-sm text-gray-500 mt-2 bg-white dark:bg-gray-800 p-2 rounded-lg inline-block border border-dashed text-right">
                                                    "{entry.note}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}
