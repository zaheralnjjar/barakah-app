import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAutoLocation = () => {
    const { toast } = useToast();
    const [isLocating, setIsLocating] = useState(false);

    const saveCurrentLocation = async () => {
        if (!navigator.geolocation) {
            toast({ title: "المتصفح لا يدعم تحديد الموقع", variant: "destructive" });
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        setIsLocating(true);

        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords;
            const now = new Date();
            const dateStr = now.toLocaleDateString('ar-SA');
            const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

            let addressName = `موقع_${dateStr}_${timeStr}`;

            try {
                // Reverse Geocoding using Nominatim
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`, {
                    signal: AbortSignal.timeout(5000)
                });
                const data = await res.json();

                if (data && data.address) {
                    const street = data.address.road || data.address.suburb || data.address.neighbourhood || '';
                    const house = data.address.house_number || '';
                    const city = data.address.city || data.address.town || data.address.village || '';

                    if (street || house || city) {
                        addressName = [street, house, city].filter(Boolean).join(' ').trim();
                    }
                }

                // Get User ID
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("User not authenticated");

                // Save to Supabase
                const { error } = await supabase.from('saved_locations').insert({
                    user_id: user.id,
                    name: addressName,
                    lat,
                    lng,
                    category: 'عام',
                    created_at: now.toISOString()
                });

                if (error) throw error;

                toast({
                    title: "تم حفظ الموقع ✅",
                    description: `الموقع: ${addressName}`
                });

            } catch (error) {
                console.error("Auto-location error:", error);
                toast({
                    title: "حدث خطأ أثناء الحفظ",
                    description: "تم تحديد الإحداثيات ولكن فشل جلب العنوان أو التخزين",
                    variant: "destructive"
                });
            } finally {
                setIsLocating(false);
            }
        }, (error) => {
            setIsLocating(false);
            let msg = "فشل تحديد الموقع";
            if (error.code === 1) msg = "تم رفض صلاحية الوصول للموقع";
            else if (error.code === 3) msg = "انتهت مهلة البحث عن الموقع (GPS)";

            toast({
                title: msg,
                description: "تأكد من تفعيل الموقع الجغرافي في جهازك والمتصفح",
                variant: "destructive"
            });
        }, options);
    };

    return { saveCurrentLocation, isLocating };
};
