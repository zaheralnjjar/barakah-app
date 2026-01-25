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
            <div className="p-1.5 bg-purple-50/50 border-b border-purple-100 flex items-center justify-between">
                <h3 className="font-bold text-purple-800 flex items-center gap-1.5 text-[10px]">
                    <MapPin className="w-3.5 h-3.5" />
                    المواقع
                </h3>
            </div>
            <CardContent className="p-1 h-[calc(100%-30px)] overflow-y-auto custom-scrollbar">
                {locations.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-[10px]">
                        لا توجد مواقع
                    </div>
                ) : (
                    <div className="space-y-1">
                        {locations.slice(0, 10).map((loc, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleNavigate(loc)}
                                className="w-full p-1.5 rounded-lg bg-white border border-purple-100 hover:border-purple-300 hover:shadow-sm transition-all flex items-center gap-2 group text-right"
                            >
                                <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center group-hover:bg-purple-500 transition-colors shrink-0">
                                    <Navigation className="w-3 h-3 text-purple-500 group-hover:text-white" />
                                </div>
                                <span className="text-[10px] font-bold text-gray-700 truncate flex-1">
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
