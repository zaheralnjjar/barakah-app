import { useEffect } from 'react';
import { useLocations } from '@/hooks/useLocations';
import { useToast } from '@/hooks/use-toast';

export const LocationShortcutListener = () => {
    const { saveParking, saveLocation } = useLocations();
    const { toast } = useToast();

    useEffect(() => {
        const handleSaveCurrentLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    const time = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                    // Fetch address for better name
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=es`);
                        const data = await res.json();
                        const road = data.address?.road || '';
                        const name = road ? `${road} ${time}` : `Ubicación ${time}`;

                        await saveLocation(name, latitude, longitude);
                    } catch (e) {
                        await saveLocation(`Ubicación ${time}`, latitude, longitude);
                    }
                }, (err) => {
                    toast({ title: 'Error obteniendo ubicación', description: err.message, variant: 'destructive' });
                });
            } else {
                toast({ title: 'Geolocalización no soportada', variant: 'destructive' });
            }
        };

        const handleSaveParking = () => {
            saveParking();
        };

        window.addEventListener('action-save-current-location', handleSaveCurrentLocation);
        window.addEventListener('action-save-parking', handleSaveParking);

        return () => {
            window.removeEventListener('action-save-current-location', handleSaveCurrentLocation);
            window.removeEventListener('action-save-parking', handleSaveParking);
        };
    }, [saveLocation, saveParking, toast]);

    return null;
};
