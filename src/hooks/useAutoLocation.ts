import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { isAndroid } from '@/utils/platformDetection';
import { Geolocation } from '@capacitor/geolocation';

export const useAutoLocation = () => {
    const [isLocating, setIsLocating] = useState(false);
    const { toast } = useToast();

    const handleSaveLocation = async () => {
        setIsLocating(true);
        try {
            let lat: number, lng: number;

            if (isAndroid()) {
                const coordinates = await Geolocation.getCurrentPosition({
                    enableHighAccuracy: true,
                    timeout: 15000
                });
                lat = coordinates.coords.latitude;
                lng = coordinates.coords.longitude;
            } else {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    if (!navigator.geolocation) {
                        return reject(new Error("المتصفح لا يدعم تحديد الموقع"));
                    }
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 15000,
                        maximumAge: 0
                    });
                });
                lat = position.coords.latitude;
                lng = position.coords.longitude;
            }

            const now = new Date();
            const dateStr = now.toLocaleDateString('ar-SA');
            const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

            // Default fallback name
            let addressName = `موقع (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

            try {
                // Fetch with zoom 18 and addressdetails to get street/number
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                    {
                        headers: { 'Accept-Language': 'ar' },
                        signal: AbortSignal.timeout(10000)
                    }
                );
                const data = await res.json();

                if (data && data.address) {
                    const addr = data.address;
                    const street = addr.road || addr.street || addr.pedestrian || addr.suburb || '';
                    const houseNumber = addr.house_number || addr.building || '';
                    const neighborhood = addr.neighbourhood || addr.residential || '';

                    // Priority: House Number + Street, then Street, then Neighborhood
                    if (street && houseNumber) {
                        addressName = `${street} ${houseNumber}`;
                    } else if (street) {
                        addressName = street;
                    } else if (neighborhood) {
                        addressName = neighborhood;
                    } else if (data.display_name) {
                        // Truncate display name to first part if it's too long
                        addressName = data.display_name.split(',')[0];
                    }
                }
            } catch (e) {
                console.log("Reverse geocoding failed, using coordinates", e);
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error: dbError } = await supabase
                    .from('saved_locations')
                    .insert([{
                        id: crypto.randomUUID(),
                        user_id: user.id,
                        title: addressName,
                        lat: lat,
                        lng: lng,
                        address: addressName,
                        category: 'other',
                        type: 'location'
                    }]);

                if (dbError) throw new Error(`Database error: ${dbError.message}`);

                toast({ title: '✅ تم حفظ الموقع آلياً', description: addressName });
            } else {
                toast({ title: '⚠️ فشل الحفظ السحابي', description: 'المستخدم غير مسجل' });
            }
            window.dispatchEvent(new Event('locations-updated'));
        } catch (error: any) {
            console.error('Location error:', error);
            toast({
                title: '❌ فشل في العملية',
                description: error.message || 'خطأ غير متوقع',
                variant: 'destructive'
            });
        } finally {
            setIsLocating(false);
        }
    };

    return { isLocating, handleSaveLocation };
};
