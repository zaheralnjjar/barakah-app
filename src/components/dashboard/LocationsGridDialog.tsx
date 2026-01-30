import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLocations } from '@/hooks/useLocations';
import { MapPin, Navigation, Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface LocationsGridDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const LocationsGridDialog: React.FC<LocationsGridDialogProps> = ({ open, onOpenChange }) => {
    const { locations } = useLocations();

    // Prioritize parking, then pinned, then others
    const sortedLocations = [...locations].sort((a, b) => {
        if (a.type === 'parking') return -1;
        if (b.type === 'parking') return 1;
        if (a.category === 'pinned') return -1;
        if (b.category === 'pinned') return 1;
        return 0;
    });

    const handleLocationClick = (loc: any) => {
        // Open Navigation
        window.open(loc.url || `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`, '_blank');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border-none shadow-2xl p-0 overflow-hidden rounded-3xl" dir="rtl">
                <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-xl font-black text-gray-800">
                        <MapPin className="w-6 h-6 text-emerald-600 fill-emerald-100" />
                        مواقعي
                    </DialogTitle>
                </DialogHeader>

                <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {sortedLocations.length === 0 ? (
                        <div className="text-center py-10 opacity-50">
                            <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm font-bold text-gray-400">لا توجد مواقع محفوظة</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2">
                            {sortedLocations.map((loc) => {
                                const dateStr = loc.createdAt
                                    ? new Date(loc.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })
                                    : '';
                                return (
                                    <button
                                        key={loc.id}
                                        onClick={() => handleLocationClick(loc)}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-2 rounded-2xl bg-white border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-center h-auto min-h-[80px] relative overflow-hidden",
                                            loc.type === 'parking' ? "border-blue-200 bg-blue-50/30" : "border-gray-100"
                                        )}
                                    >
                                        {loc.type === 'parking' && (
                                            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                        )}

                                        <div className={cn(
                                            "w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 shadow-sm",
                                            loc.type === 'parking'
                                                ? "bg-blue-100 text-blue-600"
                                                : "bg-emerald-50 text-emerald-600"
                                        )}>
                                            {loc.type === 'parking' ? <Car className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                                        </div>

                                        <span className="block text-[10px] font-bold text-gray-800 leading-tight line-clamp-1 w-full">
                                            {loc.title}
                                        </span>
                                        {loc.type === 'parking' ? (
                                            <ParkingTimer startTime={loc.createdAt} />
                                        ) : (
                                            <span className="block text-[9px] text-gray-400 mt-0.5">
                                                {dateStr}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-3 bg-gray-50/50 border-t border-gray-100 flex justify-center">
                    <p className="text-[10px] text-gray-400 font-medium">اضغط للملاحة عبر Google Maps</p>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const ParkingTimer = ({ startTime }: { startTime: string }) => {
    const [elapsed, setElapsed] = React.useState('');

    React.useEffect(() => {
        const update = () => {
            const diff = Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 60000);
            if (diff < 60) {
                setElapsed(`${diff} دقيقة`);
            } else {
                const hours = Math.floor(diff / 60);
                const mins = diff % 60;
                setElapsed(`${hours} ساعة و ${mins} د`);
            }
        };
        update();
        const interval = setInterval(update, 60000);
        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <span className="block text-[10px] font-bold text-blue-600 bg-blue-100/50 px-1.5 py-0.5 rounded-full mt-1">
            منذ {elapsed}
        </span>
    );
};
