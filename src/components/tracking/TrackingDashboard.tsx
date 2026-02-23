import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackingService } from "@/services/trackingService";
import { CreateTrackerDialog } from "./CreateTrackerDialog";
import { CreateFolderDialog } from "./CreateFolderDialog";
import { TrackerCard } from "./TrackerCard";
import { AddEntryDialog } from "./AddEntryDialog";
import { TrackerDetailsDialog } from "./TrackerDetailsDialog";
import { Button } from "@/components/ui/button";
import { Plus, FolderPlus, Folder, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Tracker, TrackerFolder } from "@/types/tracking";
import { TrackingReportDialog } from "./TrackingReportDialog";
import { TrackerBundlesDialog } from "./TrackerBundlesDialog";
import { motion } from "framer-motion";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Settings2, FileText as FileTextIcon, Package, FolderPlus as FolderPlusIcon, CheckSquare } from "lucide-react";

export function TrackingDashboard() {
    const queryClient = useQueryClient();
    const [entryDialogTracker, setEntryDialogTracker] = useState<Tracker | null>(null);
    const [detailsTracker, setDetailsTracker] = useState<Tracker | null>(null);
    const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

    const toggleFolder = (folderId: string) => {
        setCollapsedFolders(prev => ({
            ...prev,
            [folderId]: !prev[folderId]
        }));
    };

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

    // Group uncategorized by type for unification
    const uncategorizedByLabels: Record<string, Tracker[]> = {
        'numeric': uncategorizedTrackers.filter(t => t.type === 'numeric'),
        'boolean': uncategorizedTrackers.filter(t => t.type === 'boolean'),
        'checklist': uncategorizedTrackers.filter(t => t.type === 'checklist'),
        'scale': uncategorizedTrackers.filter(t => t.type === 'scale' || t.type === 'mood'),
        'time': uncategorizedTrackers.filter(t => t.type === 'time' || t.type === 'time_range'),
        'others': uncategorizedTrackers.filter(t => !['numeric', 'boolean', 'checklist', 'scale', 'mood', 'time', 'time_range'].includes(t.type))
    };

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

        const count = selectedTrackers.size;

        if (confirm(`هل أنت متأكد من حذف ${count} متتبع؟`)) {
            try {
                await Promise.all(Array.from(selectedTrackers).map(id => trackingService.deleteTracker(id)));
                queryClient.invalidateQueries({ queryKey: ['trackers'] });
                setIsSelectionMode(false);
                setSelectedTrackers(new Set());
            } catch (error) {
                console.error("Error deleting trackers:", error);
                alert("حدث خطأ أثناء الحذف");
            }
        }
    };

    const handleDeleteFolder = async (folderId: string) => {
        if (confirm("هل أنت متأكد من حذف المجلد؟ سيتم نقل المتتبعات بداخله إلى غير المصنف.")) {
            try {
                const folderTrackers = trackersByFolder[folderId] || [];
                await Promise.all(folderTrackers.map(t => trackingService.updateTracker(t.id, { folder_id: null } as any)));
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
        <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-right w-full md:w-auto order-1 md:order-2">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white">المتابعة</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">راقب عاداتك وحقق أهدافك اليومية.</p>
                </div>

                <div className="flex items-center gap-3 flex-wrap justify-end w-full md:w-auto order-2 md:order-1">
                    {isSelectionMode ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={toggleSelectionMode}
                                className="rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-9"
                            >
                                إلغاء
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleBulkDelete}
                                disabled={selectedTrackers.size === 0}
                                className="rounded-full shadow-sm h-9"
                            >
                                حذف المحدد ({selectedTrackers.size})
                            </Button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <CreateTrackerDialog>
                                <Button size="sm" className="rounded-full shadow-md bg-primary hover:bg-primary/90 h-10 px-4">
                                    <Plus className="w-4 h-4 ml-1.5" />
                                    <span>متتبع جديد</span>
                                </Button>
                            </CreateTrackerDialog>

                            <DropdownMenu dir="rtl">
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-gray-200 shadow-sm hover:bg-gray-50">
                                        <Settings2 className="w-4 h-4 text-gray-600" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl border-gray-100">
                                    <DropdownMenuItem onClick={toggleSelectionMode} className="rounded-xl py-2.5 flex items-center gap-2 text-gray-600">
                                        <CheckSquare className="w-4 h-4" />
                                        <span>تحديد وحذف</span>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator className="my-1" />

                                    <CreateFolderDialog>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="rounded-xl py-2.5 flex items-center gap-2 text-gray-600">
                                            <FolderPlusIcon className="w-4 h-4" />
                                            <span>مجلد جديد</span>
                                        </DropdownMenuItem>
                                    </CreateFolderDialog>

                                    <TrackerBundlesDialog />

                                    <TrackingReportDialog trackers={trackers || []} />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Summary */}
            {!isLoading && trackers && trackers.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-indigo-500 px-6 py-4 rounded-[2rem] text-white shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                        <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">إجمالي المتتبعات</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-black">{trackers.length}</span>
                            <span className="text-indigo-200 text-xs">نشط</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-gray-800 px-6 py-4 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm"
                    >
                        <p className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest">إنجاز اليوم</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-black text-gray-900 dark:text-white">
                                {trackers.filter(t => t.type === 'boolean' && trackersByFolder[t.folder_id || '']?.find(f => f.id === t.id)).length}
                                {/* Simplified logic for now, ideally would check today's entries */}
                            </span>
                            <span className="text-gray-400 text-xs">عادات</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-gray-800 px-6 py-4 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm"
                    >
                        <p className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest">المجلدات</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-black text-gray-900 dark:text-white">{folders?.length || 0}</span>
                            <span className="text-gray-400 text-xs">تصنيفات</span>
                        </div>
                    </motion.div>
                </div>
            )}

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
                                <Collapsible
                                    key={folder.id}
                                    open={!collapsedFolders[folder.id]}
                                    onOpenChange={() => toggleFolder(folder.id)}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center justify-between group">
                                        <div className="flex items-center gap-2">
                                            <CollapsibleTrigger asChild>
                                                <Button variant="ghost" size="sm" className="p-1 h-auto hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg -ml-1">
                                                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${collapsedFolders[folder.id] ? "-rotate-90" : ""}`} />
                                                </Button>
                                            </CollapsibleTrigger>
                                            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-200 cursor-pointer" onClick={() => toggleFolder(folder.id)}>
                                                <Folder className="w-5 h-5 text-indigo-500" />
                                                {folder.name}
                                                <span className="text-sm font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                                    {folderTrackers.length}
                                                </span>
                                            </h2>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <CreateTrackerDialog defaultFolderId={folder.id}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-gray-400 hover:text-indigo-600"
                                                    title="أضف متتبع لهذا المجلد"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </CreateTrackerDialog>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-red-500" onClick={() => handleDeleteFolder(folder.id)}>
                                                <span className="sr-only">Delete</span>
                                                &times;
                                            </Button>
                                        </div>
                                    </div>

                                    <CollapsibleContent>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 pt-4">
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
                                                <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 dark:bg-white/5 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
                                                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                                                        <Plus className="w-6 h-6 opacity-20" />
                                                    </div>
                                                    <p className="text-sm font-medium">مجلد فارغ</p>
                                                    <CreateTrackerDialog defaultFolderId={folder.id}>
                                                        <Button variant="link" className="text-indigo-500 font-bold mt-1">أضف متتبعك الأول هنا</Button>
                                                    </CreateTrackerDialog>
                                                </div>
                                            )}
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            );
                        })}

                        {/* Uncategorized Section */}
                        {uncategorizedTrackers.length > 0 && (
                            <section className="space-y-8 mt-12">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white shrink-0">
                                        غير مصنف
                                    </h2>
                                    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gray-200 dark:via-gray-800 to-transparent" />
                                </div>

                                {Object.entries(uncategorizedByLabels).map(([label, trackersInLabel]) => {
                                    if (trackersInLabel.length === 0) return null;
                                    const labelNames: Record<string, string> = {
                                        'numeric': 'رقمي',
                                        'boolean': 'نعم/لا',
                                        'checklist': 'قوائم',
                                        'scale': 'مقاييس ومزاج',
                                        'time': 'وقت ومجال',
                                        'others': 'أخرى'
                                    };

                                    return (
                                        <div key={label} className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[11px] font-black text-indigo-500/50 uppercase tracking-[0.2em] leading-none">{labelNames[label] || label}</span>
                                                <div className="h-px w-8 bg-indigo-500/10" />
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                                                {trackersInLabel.map(tracker => (
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
                                                {/* Add New Tracker Card (only in 'others' or if it's the only group) */}
                                                {label === 'others' && !isSelectionMode && (
                                                    <CreateTrackerDialog>
                                                        <motion.button
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            className="group relative flex flex-col items-center justify-center w-full h-[200px] rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all duration-300"
                                                        >
                                                            <div className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500/10 transition-all duration-500">
                                                                <Plus className="w-8 h-8 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                                                            </div>
                                                            <span className="mt-4 text-sm font-bold text-gray-400 group-hover:text-indigo-500 transition-colors">
                                                                متتبع جديد
                                                            </span>
                                                        </motion.button>
                                                    </CreateTrackerDialog>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </section>
                        )}

                        {trackers?.length === 0 && !isLoading && (
                            <div className="py-32 flex flex-col items-center justify-center text-center space-y-6 bg-gray-50/50 dark:bg-white/5 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-800 mt-10">
                                <div className="w-24 h-24 rounded-[2.5rem] bg-white dark:bg-gray-800 shadow-xl flex items-center justify-center animate-bounce">
                                    <Plus className="w-10 h-10 text-indigo-500" />
                                </div>
                                <div className="max-w-xs space-y-2">
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white">فلنبدأ بالرحلة!</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">لم تقم بإضافة أي متتبعات بعد. ابدأ الآن بتنظيم حياتك ومراقبة عاداتك.</p>
                                </div>
                                <CreateTrackerDialog>
                                    <Button size="lg" className="rounded-2xl px-8 h-12 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none font-bold">
                                        أضف أول متتبع
                                    </Button>
                                </CreateTrackerDialog>
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
                        const t = detailsTracker;
                        setDetailsTracker(null);
                        setTimeout(() => {
                            setEntryDialogTracker(t);
                        }, 100);
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
