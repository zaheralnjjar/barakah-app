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
                        <div className="space-y-3">
                            {sortedLocations.map((loc) => {
                                const dateStr = loc.createdAt
                                    ? new Date(loc.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' })
                                    : '';
                                return (
                                    <div
                                        key={loc.id}
                                        onClick={() => handleLocationClick(loc)}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-3 rounded-2xl bg-white border transition-all cursor-pointer relative overflow-hidden group",
                                            loc.type === 'parking' ? "border-blue-200 bg-blue-50/20" : "border-gray-100 hover:border-emerald-200 shadow-sm"
                                        )}
                                    >
                                        {/* Icon */}
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105",
                                            loc.type === 'parking'
                                                ? "bg-blue-100 text-blue-600"
                                                : "bg-emerald-50 text-emerald-600"
                                        )}>
                                            {loc.type === 'parking' ? <Car className="w-6 h-6" /> : <MapPin className="w-6 h-6" />}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 text-right min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-gray-900 text-sm truncate pl-2">
                                                    {loc.title}
                                                </span>
                                                {loc.type === 'parking' && (
                                                    <div className="shrink-0">
                                                        <ParkingTimer startTime={loc.createdAt} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center text-xs text-gray-500 gap-1.5 direction-rtl">
                                                {loc.address ? (
                                                    <span className="truncate opacity-80 flex-1">{loc.address}</span>
                                                ) : (
                                                    <span className="opacity-60">{dateStr}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Icon */}
                                        <div className="shrink-0 bg-gray-50 p-2 rounded-full group-hover:bg-emerald-50 transition-colors">
                                            <Navigation className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
                                        </div>

                                        {/* Parking Pulse Indicator */}
                                        {loc.type === 'parking' && (
                                            <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                        )}
                                    </div>
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
