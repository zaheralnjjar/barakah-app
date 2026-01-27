import React from 'react';
import { useLocations } from '@/hooks/useLocations';
import { isAndroid } from '@/utils/platformDetection';
import { cn } from '@/lib/utils';
import { Navigation } from 'lucide-react';

export const DashboardLocations: React.FC = () => {
    const { locations } = useLocations();
    const pinnedLocationsList = locations.filter(l => l.category === 'pinned' || l.type === 'location');

    // Open navigation directly from current location to destination
    const handleNavigate = (lat: number, lng: number, title: string) => {
        // Google Maps Navigation URL - starts from current location
        const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
        window.open(navigationUrl, '_blank');
    };

    if (!pinnedLocationsList.length) return null;

    if (isAndroid()) {
        return (
            <div className="overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none mt-1 mb-2">
                <div className="grid grid-cols-5 gap-1.5 direction-rtl min-w-[350px]">
                    {pinnedLocationsList.map(loc => (
                        <button
                            key={loc.id}
                            onClick={() => handleNavigate(loc.lat, loc.lng, loc.title)}
                            className="flex flex-col items-center justify-center p-0 rounded-2xl border-none h-14 w-[90%] mx-auto active:scale-95 transition-all group overflow-hidden shadow-sm bg-white text-emerald-700 relative"
                        >
                            <Navigation className="w-3 h-3 absolute top-1 left-1 text-emerald-400 opacity-50" />
                            <span className="text-[11px] font-bold tracking-tight text-center leading-tight line-clamp-2 w-full px-1">
                                {loc.title}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return null;
};

