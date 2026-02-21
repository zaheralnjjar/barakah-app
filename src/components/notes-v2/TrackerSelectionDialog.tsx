import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle2, Circle, Activity } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Tracker } from '@/types/tracking';
import { useQuery } from '@tanstack/react-query';
import { trackingService } from '@/services/trackingService';

// Mock Data removed as we pull from API

interface TrackerSelectionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (trackers: { id: string; label: string; type: string, color?: string, icon?: string }[]) => void;
}

export const TrackerSelectionDialog: React.FC<TrackerSelectionDialogProps> = ({ isOpen, onClose, onSelect }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTrackerIds, setSelectedTrackerIds] = useState<string[]>([]);

    const { data: trackers = [] } = useQuery({
        queryKey: ['trackers'],
        queryFn: trackingService.getTrackers
    });

    const { data: folders = [] } = useQuery({
        queryKey: ['tracker-folders'],
        queryFn: trackingService.getFolders
    });

    const filteredTrackers = trackers.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Grouping Logic
    const trackersByFolder = (folders || []).reduce((acc, folder) => {
        acc[folder.id] = filteredTrackers.filter(t => t.folder_id === folder.id);
        return acc;
    }, {} as Record<string, Tracker[]>);

    const uncategorizedTrackers = filteredTrackers.filter(t => !t.folder_id);

    const toggleSelection = (id: string) => {
        setSelectedTrackerIds(prev =>
            prev.includes(id)
                ? prev.filter(tid => tid !== id)
                : [...prev, id]
        );
    };

    // ... confirm ...
    const handleConfirm = () => {
        if (selectedTrackerIds.length > 0) {
            const selectedTrackers = trackers
                .filter(t => selectedTrackerIds.includes(t.id))
                .map(t => ({
                    id: t.id,
                    label: t.name,
                    type: t.type,
                    color: t.color,
                    icon: t.icon,
                    settings: t.settings
                }));

            onSelect(selectedTrackers);
            onClose();
            setSelectedTrackerIds([]);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]" dir="rtl">
                <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <DialogTitle className="text-right flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-600" />
                        اختر المتتبعات
                    </DialogTitle>
                    <div className="flex items-center gap-2 mr-auto pl-4">
                        <Button type="button" variant="secondary" onClick={onClose} size="sm">
                            إلغاء
                        </Button>
                        <Button
                            type="button"
                            onClick={handleConfirm}
                            disabled={selectedTrackerIds.length === 0}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            size="sm"
                        >
                            إدراج ({selectedTrackerIds.length})
                        </Button>
                    </div>
                </DialogHeader>

                <div className="py-4">
                    {/* Search ... */}
                    <div className="relative mb-4">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="بحث عن متتبع..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pr-9"
                        />
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar p-1">
                        {/* Folders */}
                        {folders?.map(folder => {
                            const folderTrackers = trackersByFolder[folder.id] || [];
                            if (folderTrackers.length === 0) return null;

                            return (
                                <div key={folder.id} className="space-y-2">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
                                        {folder.name}
                                    </h3>
                                    {folderTrackers.map(tracker => (
                                        <TrackerItem
                                            key={tracker.id}
                                            tracker={tracker}
                                            isSelected={selectedTrackerIds.includes(tracker.id)}
                                            onToggle={() => toggleSelection(tracker.id)}
                                        />
                                    ))}
                                </div>
                            )
                        })}

                        {/* Uncategorized */}
                        {(uncategorizedTrackers.length > 0) && (
                            <div className="space-y-2">
                                {folders?.length > 0 && (
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
                                        غير مصنف
                                    </h3>
                                )}
                                {uncategorizedTrackers.map(tracker => (
                                    <TrackerItem
                                        key={tracker.id}
                                        tracker={tracker}
                                        isSelected={selectedTrackerIds.includes(tracker.id)}
                                        onToggle={() => toggleSelection(tracker.id)}
                                    />
                                ))}
                            </div>
                        )}

                        {filteredTrackers.length === 0 && (
                            <div className="text-center text-gray-400 py-8">
                                لا توجد نتائج
                            </div>
                        )}
                    </div>
                </div>

            </DialogContent>
        </Dialog >
    );
};

function TrackerItem({ tracker, isSelected, onToggle }: { tracker: Tracker, isSelected: boolean, onToggle: () => void }) {
    return (
        <div
            onClick={onToggle}
            draggable
            onDragStart={(e) => {
                const item = {
                    type: 'tracker',
                    trackers: [{
                        id: tracker.id,
                        label: tracker.name,
                        type: tracker.type,
                        color: tracker.color,
                        icon: tracker.icon
                    }]
                };
                e.dataTransfer.setData('application/x-barakah-item', JSON.stringify(item));
            }}
            className={cn(
                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                isSelected
                    ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
                    : "border-gray-200 hover:border-indigo-200 hover:bg-gray-50"
            )}
        >
            <div className="text-xl shrink-0 bg-white w-10 h-10 flex items-center justify-center rounded-lg shadow-sm border border-gray-100">
                {tracker.icon || <Activity className="w-5 h-5 text-gray-400" />}
            </div>
            <div className="flex-1 min-w-0 text-right">
                <h4 className="font-medium text-gray-900 truncate">{tracker.name}</h4>
                <p className="text-xs text-gray-500 truncate">
                    {tracker.type === 'numeric' && 'عداد / رقمي'}
                    {tracker.type === 'checklist' && 'قائمة مهام'}
                    {tracker.type === 'time_range' && 'نطاق زمني'}
                    {tracker.type === 'scale' && 'مقياس'}
                    {tracker.type === 'boolean' && 'نعم/لا'}
                    {tracker.type === 'select' && 'اختيار متعدد'}
                    {tracker.type === 'mood' && 'مزاج'}
                </p>
            </div>
            <div className={cn(
                "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                isSelected
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "border-gray-300 text-transparent"
            )}>
                {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5 text-gray-300" />}
            </div>
        </div>
    )
}
