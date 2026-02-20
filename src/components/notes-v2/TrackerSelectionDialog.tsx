import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle2, Circle, Activity } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Tracker } from '@/types/tracking';
import { useQuery } from '@tanstack/react-query';
import { trackingService } from '@/services/trackingService';

// Mock Data
const MOCK_TRACKERS: Tracker[] = [
    { id: 'water_intake', name: 'شرب الماء', icon: '💧', type: 'numeric', color: '#3B82F6', user_id: '1', settings: { unit: 'لتر', goal: 2 }, order_index: 0, is_archived: false, created_at: new Date().toISOString() },
    { id: 'quran_reading', name: 'قراءة القرآن', icon: '📖', type: 'numeric', color: '#F59E0B', user_id: '1', settings: { unit: 'صفحة', goal: 20 }, order_index: 1, is_archived: false, created_at: new Date().toISOString() },
    { id: 'prayers', name: 'الصلوات الخمس', icon: '🕌', type: 'checklist', color: '#10B981', user_id: '1', settings: { options: ['الفجر', 'الظهر', 'العصر', 'المغرب', 'العشاء'] }, order_index: 2, is_archived: false, created_at: new Date().toISOString() },
    { id: 'sleep_hours', name: 'ساعات النوم', icon: '😴', type: 'numeric', color: '#6366F1', user_id: '1', settings: { unit: 'ساعة', goal: 7 }, order_index: 3, is_archived: false, created_at: new Date().toISOString() },
    { id: 'workout', name: 'تمرين رياضي', icon: '🏋️', type: 'time', color: '#EF4444', user_id: '1', settings: { goal: 30 }, order_index: 4, is_archived: false, created_at: new Date().toISOString() },
    { id: 'deep_work', name: 'عمل عميق', icon: '💻', type: 'time', color: '#F43F5E', user_id: '1', settings: { goal: 120 }, order_index: 5, is_archived: false, created_at: new Date().toISOString() },
    { id: 'mood', name: 'الحالة المزاجية', icon: '😊', type: 'scale', color: '#8B5CF6', user_id: '1', settings: { min: 1, max: 5 }, order_index: 6, is_archived: false, created_at: new Date().toISOString() },
];

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

    const filteredTrackers = trackers.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleSelection = (id: string) => {
        setSelectedTrackerIds(prev =>
            prev.includes(id)
                ? prev.filter(tid => tid !== id)
                : [...prev, id]
        );
    };

    const handleConfirm = () => {
        if (selectedTrackerIds.length > 0) {
            const selectedTrackers = trackers
                .filter(t => selectedTrackerIds.includes(t.id))
                .map(t => ({
                    id: t.id,
                    label: t.name,
                    type: t.type,
                    color: t.color,
                    icon: t.icon
                }));

            onSelect(selectedTrackers);
            onClose();
            setSelectedTrackerIds([]); // Reset selection
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-right flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-600" />
                        اختر المتتبعات
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    <div className="relative mb-4">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="بحث عن متتبع..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pr-9"
                        />
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                        {filteredTrackers.map((tracker) => {
                            const isSelected = selectedTrackerIds.includes(tracker.id);
                            return (
                                <div
                                    key={tracker.id}
                                    onClick={() => toggleSelection(tracker.id)}
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
                                            {tracker.type === 'numeric' ? 'عداد / رقمي' :
                                                tracker.type === 'checklist' ? 'قائمة مهام' :
                                                    tracker.type === 'time' ? 'وقت / مدة' : 'مقياس'}
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
                            );
                        })}
                    </div>
                </div>

                <DialogFooter className="sm:justify-start gap-2">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        إلغاء
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={selectedTrackerIds.length === 0}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        إدراج ({selectedTrackerIds.length})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
