import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocations } from '@/hooks/useLocations';
import { MapPin, Loader2, Navigation, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LocationShortcutDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LocationShortcutDialog: React.FC<LocationShortcutDialogProps> = ({ isOpen, onClose }) => {
    const { saveLocation } = useLocations();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [siteName, setSiteName] = useState('');
    const [addressDetails, setAddressDetails] = useState('');
    const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [step, setStep] = useState<'fetching' | 'confirm'>('fetching');

    // Fetch location on mount
    useEffect(() => {
        if (isOpen) {
            setStep('fetching');
            setLoading(true);
            setSiteName('');
            setAddressDetails('');
            setCoords(null);

            if (!navigator.geolocation) {
                toast({ title: 'Geolocation not supported', variant: 'destructive' });
                onClose();
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setCoords({ lat: latitude, lng: longitude });

                    // Reverse Geocode
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`);
                        const data = await res.json();
                        const addr = data.address || {};

                        // Construct meaningful address
                        const road = addr.road || addr.street || addr.pedestrian || '';
                        const number = addr.house_number || '';
                        const suburb = addr.suburb || addr.neighbourhood || '';
                        const city = addr.city || addr.town || '';

                        let constructedAddr = '';
                        if (road) constructedAddr += road;
                        if (number) constructedAddr += ` ${number}`;
                        if (suburb) constructedAddr += `, ${suburb}`;
                        if (city) constructedAddr += `, ${city}`;

                        setAddressDetails(constructedAddr || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                        setStep('confirm');
                    } catch (e) {
                        setAddressDetails(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                        setStep('confirm');
                    } finally {
                        setLoading(false);
                    }
                },
                (err) => {
                    toast({ title: 'Error getting location', description: err.message, variant: 'destructive' });
                    onClose();
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        }
    }, [isOpen, toast]);

    const handleSave = async () => {
        if (!coords) return;

        // Default name if empty
        const finalName = siteName.trim() || addressDetails.split(',')[0] || 'موقع محفوظ';

        await saveLocation(finalName, coords.lat, coords.lng, {
            address: addressDetails
        });

        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Navigation className="w-5 h-5 text-blue-600" />
                        حفظ الموقع الحالي
                    </DialogTitle>
                </DialogHeader>

                {step === 'fetching' ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                        <p className="text-sm text-gray-500">جاري تحديد الموقع بدقة...</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 py-2">

                        {/* Address Display */}
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
                                <p className="text-xs text-gray-600 leading-relaxed font-mono">
                                    {addressDetails}
                                </p>
                            </div>
                        </div>

                        {/* Name Input */}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="site-name">اسم الموقع</Label>
                            <Input
                                id="site-name"
                                value={siteName}
                                onChange={(e) => setSiteName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="مثال: الواجهة البحرية، موقف السيارة..."
                                className="text-right"
                                autoFocus
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 mt-4">
                            <Button onClick={onClose} variant="ghost">إلغاء</Button>
                            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                                <Check className="w-4 h-4" />
                                حفظ الموقع
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
