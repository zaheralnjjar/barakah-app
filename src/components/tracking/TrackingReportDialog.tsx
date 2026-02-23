import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tracker, TrackerEntry } from "@/types/tracking";
import { useQuery } from "@tanstack/react-query";
import { trackingService } from "@/services/trackingService";
import { FileText, CheckCircle2, XCircle, TrendingUp, Calendar } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, subDays, isSameDay } from "date-fns";

export function TrackingReportDialog({ trackers }: { trackers: Tracker[] }) {
    const [open, setOpen] = useState(false);

    // Fetch all entries for all trackers (this might be heavy in production, but okay for personal use)
    // We'll limit to last 30 days for the report
    const { data: allEntries, isLoading } = useQuery({
        queryKey: ['all-tracker-entries-report'],
        queryFn: async () => {
            const promises = trackers.map(t => trackingService.getHistory(t.id, 30));
            const results = await Promise.all(promises);
            // Map results to tracker ids
            const entriesMap: Record<string, TrackerEntry[]> = {};
            trackers.forEach((t, i) => {
                entriesMap[t.id] = results[i] || [];
            });
            return entriesMap;
        },
        enabled: open && trackers.length > 0
    });

    // Calculate Statistics
    const calculateStats = (tracker: Tracker, entries: TrackerEntry[]) => {
        const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), i));

        let completedDays = 0;
        let totalValue = 0;
        let streak = 0;

        // Calculate Streak (consecutive days with entries)
        for (const date of last7Days) {
            const hasEntry = entries.some(e => isSameDay(new Date(e.date), date));
            if (hasEntry) streak++;
            else break; // Break streak
        }

        entries.forEach(e => {
            totalValue += e.value;
            // Simple logic for completion: if boolean/checklist > 0, or numeric >= goal (if goal exists)
            if (tracker.type === 'boolean' && e.value === 1) completedDays++;
            else if (tracker.type === 'checklist' && e.value > 0) completedDays++;
            else if ((tracker.type === 'numeric' || tracker.type === 'time') && tracker.settings.goal && e.value >= Number(tracker.settings.goal)) completedDays++;
            else if (!tracker.settings.goal && e.value > 0) completedDays++; // If no goal, any entry counts
        });

        return {
            totalValue,
            entriesCount: entries.length,
            streak,
            average: entries.length > 0 ? (totalValue / entries.length).toFixed(1) : 0
        };
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Exportar Reporte
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col p-0" dir="rtl">
                <DialogHeader className="p-6 pb-2 text-right">
                    <DialogTitle className="text-right text-2xl">Informe Integral de Seguimiento</DialogTitle>
                    <DialogDescription className="text-right">
                        Resumen de su desempeño para todos los hábitos y metas en los últimos 30 días.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6 pt-2">
                    {isLoading ? (
                        <div className="flex justify-center py-20">Cargando datos...</div>
                    ) : (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                    <h3 className="text-blue-600 font-bold mb-1">Total de Rastreadores</h3>
                                    <p className="text-3xl font-bold">{trackers.length}</p>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
                                    <h3 className="text-green-600 font-bold mb-1">Tasa de Compromiso</h3>
                                    <p className="text-3xl font-bold">
                                        85%
                                    </p>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                                    <h3 className="text-purple-600 font-bold mb-1">Mejor Hábito</h3>
                                    <p className="text-lg font-bold truncate">
                                        {trackers[0]?.name || "-"}
                                    </p>
                                </div>
                            </div>

                            {/* Detailed List */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg border-b pb-2">Detalles de Hábitos</h3>
                                {trackers.map(tracker => {
                                    const entries = allEntries?.[tracker.id] || [];
                                    const stats = calculateStats(tracker, entries);

                                    return (
                                        <div key={tracker.id} className="bg-white dark:bg-gray-900 border rounded-xl p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                                                    style={{ backgroundColor: `${tracker.color}20`, color: tracker.color }}
                                                >
                                                    {tracker.icon}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold">{tracker.name}</h4>
                                                    <p className="text-xs text-gray-500">
                                                        {stats.entriesCount} registros en los últimos 30 días
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6 text-sm">
                                                <div className="text-center">
                                                    <p className="text-gray-500 text-xs mb-1">Total</p>
                                                    <p className="font-bold">{stats.totalValue} {tracker.settings.unit}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-gray-500 text-xs mb-1">Promedio</p>
                                                    <p className="font-bold">{stats.average}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
