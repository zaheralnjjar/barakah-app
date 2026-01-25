import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation } from 'lucide-react';

interface QuadrantLocationsProps {
    locations: any[];
}

export const QuadrantLocations: React.FC<QuadrantLocationsProps> = ({ locations }) => {
    const handleNavigate = (loc: any) => {
        if (loc.latitude && loc.longitude) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`, '_blank');
        }
    };

    return (
        <Card className="h-full border-purple-100 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
            <div className="p-3 bg-purple-50/50 border-b border-purple-100 flex items-center justify-between">
                <h3 className="font-bold text-purple-800 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    المواقع
                </h3>
            </div>
            <CardContent className="p-3 h-[calc(100%-45px)] overflow-y-auto custom-scrollbar">
                {locations.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-xs">
                        لا توجد مواقع محفوظة
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        {locations.slice(0, 8).map((loc, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleNavigate(loc)}
                                className="p-2 rounded-xl bg-white border border-purple-100 hover:border-purple-300 hover:shadow-md transition-all flex flex-col items-center justify-center gap-1 group text-center"
                            >
                                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                                    <Navigation className="w-4 h-4 text-purple-500 group-hover:text-white" />
                                </div>
                                <span className="text-[10px] font-bold text-gray-700 truncate w-full">
                                    {loc.name || 'موقع غير معروف'}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
