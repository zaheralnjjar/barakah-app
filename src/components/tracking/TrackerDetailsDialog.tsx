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
            shortDate: format(new Date(e.date), "dd/MM")
        }));

    const last7Days = entries.slice(0, 7).reverse();
    const miniChartData = last7Days.map(e => ({
        value: e.value,
        fullDate: e.date
    }));

    // Data for Radar chart (e.g. for checklist/mood analysis)
    const radarData = entries.slice(0, 20).reduce((acc: any[], curr) => {
        const dayName = format(new Date(curr.date), 'EEEE');
        const existing = acc.find(a => a.subject === dayName);
        if (existing) {
            existing.A = (existing.A + curr.value) / 2;
        } else {
            acc.push({ subject: dayName, A: curr.value, fullMark: 100 });
        }
        return acc;
    }, []);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl w-full overflow-hidden text-right p-0 gap-0 bg-white dark:bg-[#1a1b1e] border-none shadow-2xl rounded-3xl" dir="rtl">

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
                                                تصدير Excel
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
                                    {entries.length > 0 ? entries[0].value : 0}
                                </span>
                                <span className="text-[10px] text-gray-400 uppercase">الحالي</span>
                            </div>

                            <div className="flex-1 h-[120px] w-full relative">
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
                                        ) : tracker.settings.chart_type === 'radar' ? (
                                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                                <PolarGrid />
                                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                                                <Radar
                                                    name={tracker.name}
                                                    dataKey="A"
                                                    stroke={tracker.color}
                                                    fill={tracker.color}
                                                    fillOpacity={0.6}
                                                />
                                            </RadarChart>
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


                    {/* Quick Log & Actions */}
                    <div className="bg-gray-50 dark:bg-gray-900/40 p-5 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-4 flex-row-reverse">
                            <h3 className="font-bold text-lg text-right">تسجيل سريع</h3>
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
                                    Excel
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-3 items-end flex-row-reverse">
                            <Button
                                onClick={onAddEntry}
                                className="h-10 px-6 rounded-xl font-bold shadow-lg transition-transform active:scale-95"
                                style={{ backgroundColor: tracker.color }}
                            >
                                سجل الآن
                            </Button>
                            <p className="text-xs text-gray-400 text-right flex-1 leading-relaxed">
                                يمكنك إضافة مدخلات جديدة لمتابعة تقدمك اليومي أو إضافة ملاحظات سريعة.
                            </p>
                        </div>
                    </div>

                    {/* History List */}
                    <div>
                        <h3 className="font-bold text-lg mb-4 text-right flex items-center gap-2 flex-row-reverse">
                            آخر السجلات
                            <span className="w-1.5 h-6 rounded-full" style={{ backgroundColor: tracker.color }}></span>
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
                                                {format(new Date(entry.date), "PPP p", { locale: ar })}
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
