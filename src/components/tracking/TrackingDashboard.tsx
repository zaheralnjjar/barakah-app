import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackingService } from "@/services/trackingService";
import { CreateTrackerDialog } from "./CreateTrackerDialog";
import { CreateFolderDialog } from "./CreateFolderDialog";
import { TrackerCard } from "./TrackerCard";
import { AddEntryDialog } from "./AddEntryDialog";
import { TrackerDetailsDialog } from "./TrackerDetailsDialog";
import { Button } from "@/components/ui/button";
import { Plus, FolderPlus, Folder } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tracker, TrackerFolder } from "@/types/tracking";
import { TrackingReportDialog } from "./TrackingReportDialog";
import { TrackerBundlesDialog } from "./TrackerBundlesDialog";

export function TrackingDashboard() {
    const queryClient = useQueryClient();
    const [entryDialogTracker, setEntryDialogTracker] = useState<Tracker | null>(null);
    const [detailsTracker, setDetailsTracker] = useState<Tracker | null>(null);

    // Bulk Delete State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedTrackers, setSelectedTrackers] = useState<Set<string>>(new Set());

    const { data: trackers, isLoading: isLoadingTrackers } = useQuery({
        queryKey: ['trackers'],
        queryFn: trackingService.getTrackers
    });

    const { data: folders, isLoading: isLoadingFolders } = useQuery({
        queryKey: ['tracker-folders'],
        queryFn: trackingService.getFolders
    });

    const isLoading = isLoadingTrackers || isLoadingFolders;

    // Group trackers by folder
    const trackersByFolder = (folders || []).reduce((acc, folder) => {
        acc[folder.id] = (trackers || []).filter(t => t.folder_id === folder.id);
        return acc;
    }, {} as Record<string, Tracker[]>);

    const uncategorizedTrackers = (trackers || []).filter(t => !t.folder_id);

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedTrackers(new Set());
    };

    const toggleTrackerSelection = (id: string) => {
        const newSelected = new Set(selectedTrackers);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedTrackers(newSelected);
    };

    const handleBulkDelete = async () => {
        if (selectedTrackers.size === 0) return;

        // Count how many trackers are selected
        const count = selectedTrackers.size;

        if (confirm(`هل أنت متأكد من حذف ${count} متتبع؟`)) {
            try {
                await Promise.all(Array.from(selectedTrackers).map(id => trackingService.deleteTracker(id)));
                queryClient.invalidateQueries({ queryKey: ['trackers'] });
                setIsSelectionMode(false);
                setSelectedTrackers(new Set());
                // Use a generic success toast or rely on UI update
            } catch (error) {
                console.error("Error deleting trackers:", error);
                alert("حدث خطأ أثناء الحذف");
            }
        }
    };

    // Function to delete folder (if needed later, or can be added to UI)
    const handleDeleteFolder = async (folderId: string) => {
        if (confirm("هل أنت متأكد من حذف المجلد؟ سيتم نقل المتتبعات بداخله إلى غير المصنف.")) {
            try {
                // First update trackers to remove folder_id
                const folderTrackers = trackersByFolder[folderId] || [];
                await Promise.all(folderTrackers.map(t => trackingService.updateTracker(t.id, { folder_id: null } as any)));

                // Then delete folder
                await trackingService.deleteFolder(folderId);
                queryClient.invalidateQueries({ queryKey: ['tracker-folders'] });
                queryClient.invalidateQueries({ queryKey: ['trackers'] });
            } catch (e) {
                console.error(e);
                alert("فشل حذف المجلد");
            }
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 flex-row-reverse">
                <div className="text-right w-full md:w-auto">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">المتابعة</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">راقب عاداتك وأهدافك.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end w-full md:w-auto">
                    {isSelectionMode ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={toggleSelectionMode}
                                className="rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                                إلغاء
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleBulkDelete}
                                disabled={selectedTrackers.size === 0}
                                className="rounded-full shadow-sm"
                            >
                                حذف المحدد ({selectedTrackers.size})
                            </Button>
                        </>
                    ) : (
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleSelectionMode}
                                className="text-gray-500 hover:text-gray-900"
                            >
                                تحديد
                            </Button>
                            <CreateFolderDialog>
                                <Button variant="outline" size="sm" className="hidden md:flex">
                                    <FolderPlus className="w-4 h-4 ml-2" />
                                    مجلد
                                </Button>
                            </CreateFolderDialog>
                            <TrackerBundlesDialog />
                            <TrackingReportDialog trackers={trackers || []} />
                            <CreateTrackerDialog>
                                <Button size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90 flex-row-reverse">
                                    <Plus className="w-5 h-5 ml-2" />
                                    متتبع جديد
                                </Button>
                            </CreateTrackerDialog>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-10" dir="rtl">
                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array(4).fill(0).map((_, i) => (
                            <Skeleton key={i} className="h-[180px] w-full rounded-3xl" />
                        ))}
                    </div>
                )}

                {!isLoading && (
                    <>
                        {/* Folders Sections */}
                        {folders?.map(folder => {
                            const folderTrackers = trackersByFolder[folder.id] || [];
                            if (folderTrackers.length === 0 && !isSelectionMode) return null; // Hide empty folders unless valid reason? Or maybe show them to allow adding? Let's show empty for now logic-wise but users might prefer hiding. Let's show if user wants to manage. But for now, if empty maybe hide to reduce clutter unless logic requires. Actually, let's SHOW them so user can see they exist and maybe drag/drop later? For now, render.

                            return (
                                <section key={folder.id} className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-200">
                                            <Folder className="w-5 h-5 text-indigo-500" />
                                            {folder.name}
                                            <span className="text-sm font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                                {folderTrackers.length}
                                            </span>
                                        </h2>
                                        {/* Optional: Add folder actions (rename/delete) here */}
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-red-500" onClick={() => handleDeleteFolder(folder.id)}>
                                            <span className="sr-only">Delete</span>
                                            &times;
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {folderTrackers.map(tracker => (
                                            <TrackerCardWrapper
                                                key={tracker.id}
                                                tracker={tracker}
                                                onOpenEntry={() => setEntryDialogTracker(tracker)}
                                                onOpenDetails={() => setDetailsTracker(tracker)}
                                                isSelectionMode={isSelectionMode}
                                                isSelected={selectedTrackers.has(tracker.id)}
                                                onToggleSelection={() => toggleTrackerSelection(tracker.id)}
                                            />
                                        ))}
                                        {folderTrackers.length === 0 && (
                                            <div className="col-span-full py-8 text-center text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-sm">
                                                مجلد فارغ
                                            </div>
                                        )}
                                    </div>
                                </section>
                            );
                        })}

                        {/* Uncategorized Section */}
                        {(uncategorizedTrackers.length > 0 || (folders?.length === 0 && !isLoading)) && (
                            <section className="space-y-4">
                                {folders?.length > 0 && (
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                                        غير مصنف
                                    </h2>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {uncategorizedTrackers.map(tracker => (
                                        <TrackerCardWrapper
                                            key={tracker.id}
                                            tracker={tracker}
                                            onOpenEntry={() => setEntryDialogTracker(tracker)}
                                            onOpenDetails={() => setDetailsTracker(tracker)}
                                            isSelectionMode={isSelectionMode}
                                            isSelected={selectedTrackers.has(tracker.id)}
                                            onToggleSelection={() => toggleTrackerSelection(tracker.id)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {trackers?.length === 0 && (
                            <div className="py-20 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl">
                                <p>لا توجد متتبعات بعد. ابدأ بإضافة واحد!</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Dialogs */}
            {entryDialogTracker && (
                <AddEntryDialog
                    open={!!entryDialogTracker}
                    onOpenChange={(open) => !open && setEntryDialogTracker(null)}
                    tracker={entryDialogTracker}
                />
            )}

            {detailsTracker && (
                <TrackerDetailsDialogWrapper
                    tracker={detailsTracker}
                    open={!!detailsTracker}
                    onOpenChange={(open) => !open && setDetailsTracker(null)}
                    onAddEntry={() => {
                        setEntryDialogTracker(detailsTracker);
                        setDetailsTracker(null); // Close details to avoid stacking issues
                    }}
                />
            )}

        </div>
    );
}

// Wrapper to handle fetching entries for specific tracker
function TrackerCardWrapper({
    tracker,
    onOpenEntry,
    onOpenDetails,
    isSelectionMode,
    isSelected,
    onToggleSelection
}: {
    tracker: Tracker,
    onOpenEntry: () => void,
    onOpenDetails: () => void,
    isSelectionMode: boolean,
    isSelected: boolean,
    onToggleSelection: () => void
}) {
    const queryClient = useQueryClient();

    // Fetch last 30 entries
    const { data: entries } = useQuery({
        queryKey: ['tracker-entries', tracker.id],
        queryFn: () => trackingService.getHistory(tracker.id, 30)
    });

    const addEntryMutation = useMutation({
        mutationFn: trackingService.addEntry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tracker-entries', tracker.id] });
            queryClient.invalidateQueries({ queryKey: ['tracker-latest', tracker.id] });
        }
    });

    return (
        <TrackerCard
            tracker={tracker}
            entries={entries || []}
            onQuickAdd={(val) => addEntryMutation.mutate({
                tracker_id: tracker.id,
                value: val,
                date: new Date()
            })}
            onOpenEntryDialog={onOpenEntry}
            onClick={onOpenDetails}
            isSelectionMode={isSelectionMode}
            isSelected={isSelected}
            onToggleSelection={onToggleSelection}
        />
    )
}

function TrackerDetailsDialogWrapper({ tracker, open, onOpenChange, onAddEntry }: { tracker: Tracker, open: boolean, onOpenChange: (open: boolean) => void, onAddEntry: () => void }) {
    const { data: entries } = useQuery({
        queryKey: ['tracker-entries', tracker.id],
        queryFn: () => trackingService.getHistory(tracker.id, 90) // Fetch more history for details
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
