import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLocations } from '@/hooks/useLocations';
import { MapPin, Navigation, ExternalLink, Trash2, Share2, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SavedLocationsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const SavedLocationsDialog: React.FC<SavedLocationsDialogProps> = ({ open, onOpenChange }) => {
    const { locations, deleteLocation } = useLocations();
    const { toast } = useToast();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    const handleNavigate = (lat: number, lng: number) => {
        if (isSelectionMode) return;
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
        onOpenChange(false);
    };

    const toggleSelection = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(i => i !== id));
        } else {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    const handleDeleteSelected = async () => {
        if (confirm(`هل أنت متأكد من حذف ${selectedIds.length} مواقع؟`)) {
            for (const id of selectedIds) {
                await deleteLocation(id);
            }
            setSelectedIds([]);
            setIsSelectionMode(false);
            toast({ title: 'تم الحذف', description: 'تم حذف المواقع المحددة' });
        }
    };

    const handleShareSelected = () => {
        const selectedLocs = locations.filter(l => selectedIds.includes(l.id));
        const text = selectedLocs.map(l => `${l.title}: ${l.url}`).join('\n\n');
        if (navigator.share) {
            navigator.share({ title: 'المواقع المحفوظة', text });
        } else {
            navigator.clipboard.writeText(text);
            toast({ title: 'تم النسخ', description: 'تم نسخ قائمة المواقع للحافظة' });
        }
        setIsSelectionMode(false);
        setSelectedIds([]);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-4 bg-emerald-500 text-white flex flex-row items-center justify-between">
                    <div className="flex gap-2">
                        {isSelectionMode && (
                            <>
                                <Button size="sm" variant="ghost" className="text-white h-8 w-8 p-0" onClick={handleDeleteSelected} disabled={selectedIds.length === 0}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-white h-8 w-8 p-0" onClick={handleShareSelected} disabled={selectedIds.length === 0}>
                                    <Share2 className="w-4 h-4" />
                                </Button>
                            </>
                        )}
                        <Button
                            size="sm"
                            variant="ghost"
                            className={cn("text-white h-8 px-2 text-xs", isSelectionMode ? "bg-emerald-700" : "")}
                            onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds([]); }}
                        >
                            {isSelectionMode ? 'إلغاء' : 'تحديد'}
                        </Button>
                        {isSelectionMode && (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-white h-8 px-2 text-xs hover:bg-emerald-600"
                                onClick={() => setSelectedIds(selectedIds.length === locations.length ? [] : locations.map(l => l.id))}
                            >
                                {selectedIds.length === locations.length ? 'إلغاء الكل' : 'الكل'}
                            </Button>
                        )}
                    </div>

                    <DialogTitle className="text-right flex items-center justify-end gap-2 text-base">
                        <span>المواقع المحفوظة</span>
                        <MapPin className="w-5 h-5" />
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] p-4 text-right">
                    {locations.length > 0 ? (
                        <div className="space-y-3">
                            {locations.map((loc) => (
                                <div
                                    key={loc.id}
                                    onClick={() => isSelectionMode ? toggleSelection(loc.id) : handleNavigate(loc.lat, loc.lng)}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-2xl border cursor-pointer active:scale-[0.98] transition-transform relative overflow-hidden",
                                        isSelectionMode && selectedIds.includes(loc.id)
                                            ? "bg-emerald-100 border-emerald-300"
                                            : "bg-gray-50 border-gray-100"
                                    )}
                                >
                                    {isSelectionMode && (
                                        <div className="absolute inset-y-0 right-0 w-10 flex items-center justify-center bg-gray-50/50">
                                            {selectedIds.includes(loc.id)
                                                ? <CheckSquare className="w-5 h-5 text-emerald-600" />
                                                : <Square className="w-5 h-5 text-gray-300" />
                                            }
                                        </div>
                                    )}

                                    <div className={cn("flex flex-1 items-center gap-3", isSelectionMode ? "mr-8" : "")}>
                                        <div className="bg-white p-2 rounded-full shadow-sm">
                                            {loc.type === 'parking' ? '🅿️' : <Navigation className="w-4 h-4 text-emerald-600" />}
                                        </div>
                                        <div className="flex-1 text-right">
                                            <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{loc.title}</h4>
                                            <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                                                {loc.address || `${(loc.lat || 0).toFixed(4)}, ${(loc.lng || 0).toFixed(4)}`}
                                            </p>
                                        </div>
                                    </div>

                                    {!isSelectionMode && (
                                        <ExternalLink className="w-4 h-4 text-gray-300" />
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                            <MapPin className="w-12 h-12 mb-2 opacity-20" />
                            <p>لا توجد مواقع محفوظة بعد</p>
                        </div>
                    )}
                </ScrollArea>

                <div className="p-3 bg-gray-50 border-t text-center">
                    <p className="text-[10px] text-gray-400">
                        {isSelectionMode ? 'حدد المواقع التي تريد حذفها أو مشاركتها' : 'اضغط للذهاب، أو "تحديد" للإدارة'}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};
