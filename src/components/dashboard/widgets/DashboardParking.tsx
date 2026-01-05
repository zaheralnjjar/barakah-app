import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Clock } from 'lucide-react';
import { useLocations } from '@/hooks/useLocations';

export const DashboardParking: React.FC = () => {
    const { getParkingOnly, deleteLocation } = useLocations();
    const { toast } = useToast();
    const [parkingDuration, setParkingDuration] = useState<string | null>(null);
    const [latestParking, setLatestParking] = useState<any>(null);

    // Parking Timer Logic
    useEffect(() => {
        const updateTimer = () => {
            const spots = getParkingOnly();
            if (spots.length > 0) {
                const latest = spots.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                setLatestParking(latest);

                const start = new Date(latest.createdAt).getTime();
                const now = new Date().getTime();
                const diff = now - start;

                if (diff < 0) {
                    setParkingDuration('00:00:00');
                    return;
                }

                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                setParkingDuration(
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                );
            } else {
                setParkingDuration(null);
                setLatestParking(null);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [getParkingOnly]);

    const stopParking = async () => {
        if (latestParking) {
            await deleteLocation(latestParking.id);
            setParkingDuration(null);
            setLatestParking(null);
            toast({ title: '🛑 تم إيقاف المؤقت وحذف الموقف' });
        }
    };

    if (!parkingDuration || !latestParking) return null;

    return (
        <div className="mx-2 mb-4 bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-md animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-orange-400 to-orange-600"></div>
            <div className="flex items-center gap-3 mb-3">
                <div className="bg-orange-100 p-2.5 rounded-full animate-pulse shadow-inner">
                    <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                    <p className="text-xs text-orange-800 font-bold mb-0.5">مدة الوقوف</p>
                    <p className="text-2xl font-mono font-bold text-orange-700 dir-ltr tracking-wider leading-none">{parkingDuration}</p>
                </div>
            </div>
            <p className="text-xs text-orange-600/80 truncate mb-3 pr-2 border-b border-orange-200 pb-2">{latestParking.title}</p>
            <div className="flex gap-2 justify-end flex-wrap">
                <Button size="sm" variant="outline" className="h-9 px-3 text-xs border-green-400 text-green-700 hover:bg-green-50 gap-1" onClick={() => { setParkingDuration(null); setLatestParking(null); toast({ title: '✅ تم حفظ الموقف' }); }}>
                    حفظ 💾
                </Button>
                <Button size="sm" variant="destructive" onClick={stopParking} className="h-9 px-3 text-xs">حذف 🗑️</Button>
                <Button size="sm" className="h-9 px-3 bg-blue-500 hover:bg-blue-600 text-xs gap-1" onClick={() => window.open(latestParking.url || `https://www.google.com/maps/search/?api=1&query=${latestParking.lat},${latestParking.lng}`, '_blank')}>
                    ملاحة 🧭
                </Button>
            </div>
        </div>
    );
};
