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

        setIsLocating(true);

        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords;
            const now = new Date();
            const dateStr = now.toLocaleDateString('ar-SA');
            const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

            let addressName = `موقع_${dateStr}_${timeStr}`;

            try {
                // Reverse Geocoding using Nominatim
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`);
                const data = await res.json();

                if (data.address) {
                    const street = data.address.road || data.address.suburb || '';
                    const house = data.address.house_number || '';
                    const city = data.address.city || data.address.town || '';

                    if (street || house) {
                        addressName = `${street} ${house} - ${city}`.trim();
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
                    title: "تم حفظ الموقع",
                    description: `تم تسجيل الموقع: ${addressName}`
                });

            } catch (error) {
                console.error("Auto-location error:", error);
                toast({
                    title: "فشل حفظ الموقع",
                    description: "حدث خطأ أثناء محاولة جلب العنوان أو الحفظ",
                    variant: "destructive"
                });
            } finally {
                setIsLocating(false);
            }
        }, (error) => {
            setIsLocating(false);
            toast({
                title: "فشل تحديد الموقع",
                description: "يرجى التأكد من تفعيل الـ GPS وصلاحيات الموقع",
                variant: "destructive"
            });
        });
    };

    return { saveCurrentLocation, isLocating };
};
