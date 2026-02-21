import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { trackingService } from "@/services/trackingService";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tracker, TrackerEntry } from "@/types/tracking";
import { cn } from "@/lib/utils";
import { TrendingUp, CheckCircle2, Activity, Plus, Settings } from "lucide-react";
import { format, subDays, isSameDay } from "date-fns";
import { AddEntryDialog } from "./AddEntryDialog";
import { TrackerDetailsDialog } from "./TrackerDetailsDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function TrackingSummaryStrip() {
    const [entryDialogTracker, setEntryDialogTracker] = useState<Tracker | null>(null);
    const [detailsTracker, setDetailsTracker] = useState<Tracker | null>(null);
    const [showSettings, setShowSettings] = useState(false);

    // Load visible trackers from localStorage
    const [hiddenTrackerIds, setHiddenTrackerIds] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('dashboard-hidden-trackers');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    const toggleTrackerVisibility = (trackerId: string) => {
        setHiddenTrackerIds(prev => {
            const next = prev.includes(trackerId)
                ? prev.filter(id => id !== trackerId)
                : [...prev, trackerId];
            localStorage.setItem('dashboard-hidden-trackers', JSON.stringify(next));
            return next;
        });
    };

    const { data: trackers, isLoading: isLoadingTrackers } = useQuery({
        queryKey: ['trackers'],
        queryFn: trackingService.getTrackers
    });

    if (isLoadingTrackers) {
        return <Skeleton className="w-full h-24 rounded-xl" />;
    }

    if (!trackers || trackers.length === 0) return null;

    const visibleTrackers = trackers.filter(t => !hiddenTrackerIds.includes(t.id));

    return (
        <div className="w-full mb-3 animate-in fade-in slide-in-from-top-4 duration-700">
            <ScrollArea className="w-full whitespace-nowrap rounded-xl border border-gray-100 bg-white/50 backdrop-blur-sm shadow-sm">
                <div className="flex w-max space-x-2 space-x-reverse p-2">
                    {visibleTrackers.map(tracker => (
                        <TrackerMiniCard
                            key={tracker.id}
                            tracker={tracker}
                            onClick={() => setDetailsTracker(tracker)}
                        />
                    ))}
                    {/* Settings toggle button */}
                    <div className="inline-flex items-center justify-center w-[36px] h-[80px] shrink-0">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                                showSettings
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-gray-100 hover:bg-gray-200 text-gray-400"
                            )}
                            title="إدارة المتتبعات"
                        >
                            <Settings className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {/* Tracker visibility settings */}
            {showSettings && (
                <div className="mt-2 p-3 bg-white rounded-xl border border-gray-100 shadow-md animate-in slide-in-from-top-2 duration-200" dir="rtl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-600">إدارة المتتبعات المعروضة</span>
                        <button
                            onClick={() => setShowSettings(false)}
                            className="text-[10px] text-gray-400 hover:text-gray-600"
                        >
                            إغلاق ✕
                        </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {trackers.map(tracker => {
                            const isVisible = !hiddenTrackerIds.includes(tracker.id);
                            return (
                                <button
                                    key={tracker.id}
                                    onClick={() => toggleTrackerVisibility(tracker.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all",
                                        isVisible
                                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                            : "bg-gray-50 border-gray-200 text-gray-400"
                                    )}
                                >
                                    <span className="text-sm">{tracker.icon}</span>
                                    <span className="truncate">{tracker.name}</span>
                                    {isVisible && <CheckCircle2 className="w-3 h-3 mr-auto text-emerald-500" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Dialogs */}
            {detailsTracker && (
                <TrackerDetailsDialogWrapper
                    tracker={detailsTracker}
                    open={!!detailsTracker}
                    onOpenChange={(open) => !open && setDetailsTracker(null)}
                    onAddEntry={() => {
                        setEntryDialogTracker(detailsTracker);
                        setDetailsTracker(null);
                    }}
                />
            )}

            {entryDialogTracker && (
                <AddEntryDialog
                    open={!!entryDialogTracker}
                    onOpenChange={(open) => !open && setEntryDialogTracker(null)}
                    tracker={entryDialogTracker}
                />
            )}
        </div>
    );
}

function TrackerMiniCard({ tracker, onClick }: { tracker: Tracker, onClick: () => void }) {
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
                "h-full w-full rounded-lg border-2 p-2 flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer",
                isCompletedToday ? "bg-opacity-10 border-opacity-50" : "bg-white border-transparent hover:border-gray-200"
            )}
                onClick={onClick}
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

function TrackerDetailsDialogWrapper({ tracker, open, onOpenChange, onAddEntry }: { tracker: Tracker, open: boolean, onOpenChange: (open: boolean) => void, onAddEntry: () => void }) {
    const { data: entries } = useQuery({
        queryKey: ['tracker-entries', tracker.id],
        queryFn: () => trackingService.getHistory(tracker.id, 90)
    });

    return (
        <TrackerDetailsDialog
            tracker={tracker}
            entries={entries || []}
            open={open}
            onOpenChange={onOpenChange}
            onAddEntry={onAddEntry}
        />
    )
}
