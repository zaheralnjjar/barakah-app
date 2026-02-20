import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { trackingService } from "@/services/trackingService";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tracker, TrackerEntry } from "@/types/tracking";
import { cn } from "@/lib/utils";
import { TrendingUp, CheckCircle2, Activity } from "lucide-react";
import { format, subDays, isSameDay } from "date-fns";

export function TrackingSummaryStrip() {
    const { data: trackers, isLoading: isLoadingTrackers } = useQuery({
        queryKey: ['trackers'],
        queryFn: trackingService.getTrackers
    });

    if (isLoadingTrackers) {
        return <Skeleton className="w-full h-24 rounded-xl" />;
    }

    if (!trackers || trackers.length === 0) return null;

    return (
        <div className="w-full mb-3 animate-in fade-in slide-in-from-top-4 duration-700">
            <ScrollArea className="w-full whitespace-nowrap rounded-xl border border-gray-100 bg-white/50 backdrop-blur-sm shadow-sm">
                <div className="flex w-max space-x-2 space-x-reverse p-2">
                    {trackers.map(tracker => (
                        <TrackerMiniCard key={tracker.id} tracker={tracker} />
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}

function TrackerMiniCard({ tracker }: { tracker: Tracker }) {
    // Fetch history for this tracker specifically for the sparkline
    const { data: history } = useQuery({
        queryKey: ['tracker-history', tracker.id],
        queryFn: () => trackingService.getHistory(tracker.id, 7), // Last 7 days
    });

    // Calculate quick stats
    const today = new Date();
    const todayEntry = history?.find(e => isSameDay(new Date(e.date), today));
    const isCompletedToday = !!todayEntry && (
        tracker.type === 'boolean' ? todayEntry.value === 1 :
            (tracker.settings?.goal ? todayEntry.value >= tracker.settings.goal : true)
    );

    // Prepare chart data (simple array of values)
    const chartData = Array.from({ length: 7 }).map((_, i) => {
        const d = subDays(today, 6 - i);
        const entry = history?.find(e => isSameDay(new Date(e.date), d));
        return entry ? entry.value : 0;
    });

    // Color adjustments
    const color = tracker.color || "#3B82F6";

    return (
        <div className="inline-block w-[140px] h-[80px] mr-2 first:mr-0">
            <div className={cn(
                "h-full w-full rounded-lg border-2 p-2 flex flex-col justify-between transition-all hover:scale-[1.02]",
                isCompletedToday ? "bg-opacity-10 border-opacity-50" : "bg-white border-transparent hover:border-gray-200"
            )}
                style={{
                    backgroundColor: isCompletedToday ? `${color}10` : 'white',
                    borderColor: isCompletedToday ? color : undefined
                }}
            >
                <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs truncate max-w-[80px] text-right" title={tracker.name}>
                        {tracker.name}
                    </span>
                    <span className="text-[10px]">{tracker.icon}</span>
                </div>

                <div className="flex items-end justify-between gap-1">
                    <div className="flex items-end gap-[1px] h-6 w-full opacity-70">
                        {chartData.map((val, i) => {
                            const maxVal = Math.max(...chartData, tracker.settings?.goal || 1, 1);
                            const height = Math.min(100, Math.max(10, (val / maxVal) * 100));
                            return (
                                <div
                                    key={i}
                                    className="w-full rounded-t-sm transition-all"
                                    style={{
                                        height: `${height}%`,
                                        backgroundColor: color,
                                        opacity: i === 6 ? 1 : 0.5
                                    }}
                                />
                            )
                        })}
                    </div>
                    {isCompletedToday && (
                        <div className="bg-white rounded-full p-0.5 shadow-sm">
                            <CheckCircle2 className="w-3 h-3" style={{ color: color }} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
