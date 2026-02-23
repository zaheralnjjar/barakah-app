import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tracker, TrackerEntry } from "@/types/tracking";
import {
    Area, AreaChart, Bar, BarChart, Line, LineChart,
    CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
    ReferenceLine, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, Download, FileSpreadsheet, FileText } from "lucide-react";
import { TrackerExportService } from "@/services/TrackerExportService";
import { useEffect, useRef } from "react";

interface TrackerDetailsDialogProps {
    tracker: Tracker | null;
    entries: TrackerEntry[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAddEntry: () => void;
}

export function TrackerDetailsDialog({ tracker, entries, open, onOpenChange, onAddEntry }: TrackerDetailsDialogProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to top when dialog opens to see the most recent ones, 
    // or to bottom if specifically requested. 
    // In this context, the user wants to see the records at the bottom.
    useEffect(() => {
        if (open && scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                setTimeout(() => {
                    scrollContainer.scrollTo({
                        top: scrollContainer.scrollHeight,
                        behavior: 'smooth'
                    });
                }, 100);
            }
        }
    }, [open, entries]);

    if (!tracker) return null;

    const chartData = entries
        .slice(0, 30)
        .reverse()
        .map(e => ({
            date: format(new Date(e.date), "MMM d", { locale: ar }),
            value: e.value,
            shortDate: format(new Date(e.date), "dd/MM")
        }));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl w-full max-h-[90vh] overflow-hidden text-right p-0 gap-0 bg-white dark:bg-[#1a1b1e] border-none shadow-2xl rounded-3xl" dir="rtl">

                <ScrollArea className="h-full max-h-[90vh]" dir="rtl">
                    <div className="pb-10">
                        {/* Header Section */}
                        <div className="relative overflow-hidden mb-0">
                            <div
                                className="absolute inset-0 opacity-10"
                                style={{ backgroundColor: tracker.color }}
                            />
                            <div className="p-6 pb-4 pt-8">
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
                                                <div className="flex gap-2 mt-1">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 text-[10px] gap-1 px-2 border-green-100 hover:bg-green-50 text-green-600"
                                                        onClick={() => TrackerExportService.exportToExcel(tracker, entries)}
                                                    >
                                                        <FileSpreadsheet className="w-3 h-3" />
                                                        تصدير إكسيل
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 text-[10px] gap-1 px-2 border-red-100 hover:bg-red-50 text-red-600"
                                                        onClick={() => TrackerExportService.exportToPDF(tracker, entries)}
                                                    >
                                                        <FileText className="w-3 h-3" />
                                                        تصدير PDF
                                                    </Button>
                                                </div>
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

                            {/* Main Chart Section */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between gap-6">
                                    <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl min-w-[80px]">
                                        <span className="text-2xl font-bold" style={{ color: tracker.color }}>
                                            {entries.length > 0 ? entries[entries.length - 1].value : 0}
                                        </span>
                                        <span className="text-[10px] text-gray-400 uppercase">الحالي</span>
                                    </div>

                                    <div className="flex-1 h-[150px] w-full relative">
                                        {entries.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                {(!tracker.settings?.chart_type || tracker.settings.chart_type === 'area') ? (
                                                    <AreaChart data={chartData}>
                                                        <defs>
                                                            <linearGradient id={`grad-${tracker.id}`} x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor={tracker.color || "#3B82F6"} stopOpacity={0.4} />
                                                                <stop offset="95%" stopColor={tracker.color || "#3B82F6"} stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                        <XAxis dataKey="shortDate" hide />
                                                        <Tooltip
                                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                            labelStyle={{ display: 'none' }}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="value"
                                                            stroke={tracker.color || "#3B82F6"}
                                                            strokeWidth={3}
                                                            fill={`url(#grad-${tracker.id})`}
                                                            animationDuration={1500}
                                                        />
                                                    </AreaChart>
                                                ) : (
                                                    <BarChart data={chartData}>
                                                        <Bar
                                                            dataKey="value"
                                                            fill={tracker.color || "#3B82F6"}
                                                            radius={[6, 6, 0, 0]}
                                                            animationDuration={1500}
                                                        />
                                                    </BarChart>
                                                )}
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-gray-300 text-xs italic border rounded-xl border-dashed">
                                                لا توجد بيانات كافية للرسم
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl min-w-[80px]">
                                        <span className="text-2xl font-bold">{entries.length}</span>
                                        <span className="text-[10px] text-gray-400 uppercase">السجلات</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Action */}
                            <div className="bg-gray-50 dark:bg-gray-900/40 p-6 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                                <div className="flex items-center justify-between mb-4 flex-row-reverse">
                                    <h3 className="font-bold text-lg text-right text-gray-900 dark:text-white">تسجيل سريع</h3>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs gap-1 px-3 text-red-600 hover:bg-red-50"
                                            onClick={() => TrackerExportService.exportToPDF(tracker, entries)}
                                        >
                                            <FileText className="w-4 h-4" />
                                            PDF
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs gap-1 px-3 text-green-600 hover:bg-green-50"
                                            onClick={() => TrackerExportService.exportToExcel(tracker, entries)}
                                        >
                                            <FileSpreadsheet className="w-4 h-4" />
                                            إكسيل
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex gap-4 items-center flex-row-reverse">
                                    <Button
                                        onClick={onAddEntry}
                                        className="h-11 px-8 rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-transform active:scale-95"
                                        style={{ backgroundColor: tracker.color }}
                                    >
                                        سجل دخولاً جديداً
                                    </Button>
                                    <p className="text-xs text-gray-500 text-right leading-relaxed max-w-[200px]">
                                        أضف مدخلات جديدة لمتابعة تقدمك اليومي وإضافة ملاحظات سريعة.
                                    </p>
                                </div>
                            </div>

                            {/* History List */}
                            <div ref={scrollRef}>
                                <h3 className="font-bold text-xl mb-6 text-right flex items-center gap-3 flex-row-reverse">
                                    آخر السجلات
                                    <span className="w-2 h-7 rounded-full" style={{ backgroundColor: tracker.color }}></span>
                                </h3>

                                <ScrollArea className="h-[300px] -mx-4 px-4 overflow-y-auto" dir="rtl">
                                    <div className="space-y-4">
                                        {entries.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-gray-50 dark:bg-white/5 rounded-3xl border border-dashed">
                                                <p className="font-medium">لا توجد سجلات حالياً</p>
                                            </div>
                                        )}
                                        {entries.map(entry => (
                                            <div key={entry.id} className="group flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-transparent shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-gray-800 transition-all flex-row-reverse">
                                                <div className="text-right">
                                                    <div className="font-black text-gray-900 dark:text-gray-100 flex items-baseline gap-1 flex-row-reverse">
                                                        {tracker.type === 'mood' ? (
                                                            <span className="text-2xl">{['😢', '😕', '😐', '🙂', '😃'][entry.value ? entry.value - 1 : 2]}</span>
                                                        ) : tracker.type === 'time_range' ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold">
                                                                    {entry.data?.startTime} - {entry.data?.endTime}
                                                                </span>
                                                                <span className="text-[10px] text-gray-500 font-bold uppercase">
                                                                    ({Math.round(entry.value || 0)} دقيقة)
                                                                </span>
                                                            </div>
                                                        ) : entry.data?.selected ? (
                                                            <span className="text-lg">{entry.data.selected}</span>
                                                        ) : (
                                                            <div className="flex items-baseline gap-1 flex-row-reverse">
                                                                <span className="text-xl">{entry.value}</span>
                                                                <span className="text-xs font-bold text-gray-400 uppercase">{tracker.settings.unit}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
                                                        {format(new Date(entry.date), "PPP p", { locale: ar })}
                                                    </div>
                                                    {entry.note && (
                                                        <div className="mt-3 relative">
                                                            <div className="absolute top-0 right-0 bottom-0 w-1 bg-indigo-500/20 rounded-full" />
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 pr-4 italic">
                                                                "{entry.note}"
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
