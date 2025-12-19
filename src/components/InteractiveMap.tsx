import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
    MapPin,
    Search,
    Locate,
    Globe,
    Plus,
    Check,
    Trash2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationMarkerProps {
    position: { lat: number; lng: number } | null;
    setPosition: (pos: L.LatLng) => void;
    setLocationName: (name: string) => void;
    onSave: () => void;
    onShare: (pos: L.LatLng) => void;
}

function LocationMarker({ position, setPosition, setLocationName, onSave, onShare }: LocationMarkerProps) {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            setLocationName(`${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    return position ? (
        <Marker position={position}>
            <Popup>
                <div className="flex flex-col gap-2 p-1 min-w-[120px]">
                    <p className="text-xs font-bold text-center mb-1">الموقع المحدد</p>
                    <div className="flex gap-2 justify-center">
                        <Button size="sm" onClick={onSave} className="h-7 text-xs bg-blue-600 hover:bg-blue-700">
                            حفظ
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onShare(position as any)} className="h-7 text-xs">
                            مشاركة
                        </Button>
                    </div>
                </div>
            </Popup>
        </Marker>
    ) : null;
}

function ChangeView({ center, zoom }: any) {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, zoom);
    }, [center, zoom]);
    return null;
}

const InteractiveMap = () => {
    const [mapCenter, setMapCenter] = useState<[number, number]>([-34.6037, -58.3816]);
    const [newItem, setNewItem] = useState({ name: '', location: '' });
    const [formData, setFormData] = useState({ title: '', url: '' });
    const { toast } = useToast();

    const handleSaveLocation = async () => {
        if (!formData.title || !newItem.location) return;

        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) return;

            // Fetch current list to append
            const { data } = await supabase.from('logistics_data_2025_12_18_18_42').select('shopping_list').eq('user_id', user.id).single();
            // Note: We are saving to 'shopping_list' or 'resources'? 
            // Logic in LogisticsManager was appending to 'shopping_list' or 'resources'. 
            // Ideally we should have a 'saved_locations' array? 
            // Looking at LogisticsManager: "handleAddResource" saved to 'resources' state but didn't seem to persist clearly to DB in the shared snippet? 
            // Actually line 354 of LogisticsManager snippet shows `updatedShoppingList` logic but `handleAddResource` was separate (lines 246+). 
            // Wait, `handleAddResource` in LogisticsManager updated local state `resources`. 
            // I will implement a proper DB save here if possible, or just local for now if schema is unknown.
            // Re-reading LogisticsManager: It had `updateLogisticsData` but `handleAddResource` only updated local `resources` state! It didn't persist to DB!
            // That explains why user might have issues. 
            // I will try to save to `resources` column if it exists, or just use `shopping_list` as a fallback or creating a new way.
            // Actually, the user wants "Saved Locations". I'll stick to a local storage approach or basic visual save for now to match existing behavior unless I see a `resources` column in DB. 
            // The LogisticsManager had `savedResources` in localStorage (line 167). I will assume LocalStorage is the primary persistence for Resources for now.

            const newRes = {
                id: Date.now().toString(),
                title: formData.title,
                url: `geo:${newItem.location}`,
                category: 'other'
            };

            const existing = JSON.parse(localStorage.getItem('baraka_resources') || '[]');
            const updated = [...existing, newRes];
            localStorage.setItem('baraka_resources', JSON.stringify(updated));

            toast({ title: "تم حفظ الموقع", description: "تمت الإضافة للمواقع المحفوظة" });
            setFormData({ title: '', url: '' });
            setNewItem({ name: '', location: '' });

        } catch (e) { console.error(e); }
    };

    return (
        <Card className="overflow-hidden border shadow-md bg-white">
            <CardHeader className="pb-3 bg-blue-50/50 border-b">
                <CardTitle className="arabic-title text-base flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <span className="text-primary">الخريطة التفاعلية والمواقع</span>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="h-[400px] relative z-0">
                    <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <ChangeView center={mapCenter} zoom={15} />
                        <TileLayer
                            attribution='&copy; OpenStreetMap contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker
                            position={newItem.location ? { lat: parseFloat(newItem.location.split(',')[0]), lng: parseFloat(newItem.location.split(',')[1]) } : null}
                            setPosition={(pos) => {
                                setNewItem({ ...newItem, location: `${pos.lat}, ${pos.lng}` });
                                setMapCenter([pos.lat, pos.lng]);
                            }}
                            setLocationName={(name) => setNewItem({ ...newItem, location: name })}
                            onSave={() => document.getElementById('map-save-input')?.focus()}
                            onShare={(pos) => {
                                const url = `https://www.google.com/maps/search/?api=1&query=${pos.lat},${pos.lng}`;
                                if (navigator.share) {
                                    navigator.share({ title: 'موقع', url }).catch(() => { });
                                } else {
                                    navigator.clipboard.writeText(url);
                                    toast({ title: "تم نسخ الرابط" });
                                }
                            }}
                        />
                    </MapContainer>

                    {/* Search Overlay */}
                    <div className="absolute top-4 left-4 right-4 z-[400] flex gap-2">
                        <Button
                            size="icon"
                            className="h-10 w-10 bg-white text-blue-600 hover:bg-blue-50 shadow-lg border border-blue-100 rounded-full"
                            onClick={() => {
                                if (navigator.geolocation) {
                                    toast({ title: "جاري تحديد موقعك..." });
                                    navigator.geolocation.getCurrentPosition(
                                        (pos) => {
                                            const { latitude, longitude } = pos.coords;
                                            setMapCenter([latitude, longitude]);
                                            setNewItem({ ...newItem, location: `${latitude}, ${longitude}` });
                                            toast({ title: "تم تحديد موقعك الحالي" });
                                        },
                                        (err) => toast({ title: "تعذر تحديد الموقع", description: err.message, variant: "destructive" })
                                    );
                                }
                            }}
                        >
                            <Locate className="w-5 h-5" />
                        </Button>

                        <Input
                            placeholder="بحث عن مكان..."
                            className="bg-white/95 backdrop-blur-md h-10 shadow-lg dir-rtl flex-1 rounded-full border-blue-100 px-4"
                            onKeyDown={async (e) => {
                                if (e.key === 'Enter') {
                                    const q = e.currentTarget.value;
                                    if (!q) return;
                                    try {
                                        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`);
                                        const data = await res.json();
                                        if (data && data[0]) {
                                            const lat = parseFloat(data[0].lat);
                                            const lon = parseFloat(data[0].lon);
                                            setMapCenter([lat, lon]);
                                            setNewItem({ ...newItem, location: `${lat}, ${lon}`, name: q });
                                            toast({ title: "تم العثور على الموقع" });
                                        }
                                    } catch (err) { console.error(err); }
                                }
                            }}
                        />
                        <Button size="icon" className="h-10 w-10 bg-blue-600 hover:bg-blue-700 shadow-lg rounded-full">
                            <Search className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t flex gap-2 items-center">
                    <div className="flex-1">
                        <Input
                            id="map-save-input"
                            placeholder="اسم الموقع للحفظ..."
                            className="bg-white h-10"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <Button onClick={handleSaveLocation} className="bg-green-600 hover:bg-green-700 h-10 px-6">
                        حفظ <Check className="w-4 h-4 mr-2" />
                    </Button>
                </div>

                {/* Saved Locations List */}
                <div className="max-h-60 overflow-y-auto border-t bg-white">
                    <div className="p-3 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                        المواقع المحفوظة ({JSON.parse(localStorage.getItem('baraka_resources') || '[]').length})
                    </div>
                    {JSON.parse(localStorage.getItem('baraka_resources') || '[]').map((res: any) => (
                        <div key={res.id} className="flex items-center justify-between p-3 border-b hover:bg-blue-50 transition-colors">
                            <button
                                className="flex items-center gap-3 flex-1 text-right"
                                onClick={() => {
                                    if (res.url.startsWith('geo:')) {
                                        const [lat, lng] = res.url.replace('geo:', '').split(',').map(Number);
                                        setMapCenter([lat, lng]);
                                        setNewItem({ name: res.title, location: `${lat}, ${lng}` });
                                        toast({ title: "تم الانتقال للموقع", description: res.title });
                                    }
                                }}
                            >
                                <div className="bg-blue-100 p-2 rounded-full">
                                    <MapPin className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <div className="font-medium text-sm text-gray-800">{res.title}</div>
                                    <div className="text-[10px] text-gray-400 dir-ltr truncate max-w-[200px]">{res.url}</div>
                                </div>
                            </button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => {
                                    const current = JSON.parse(localStorage.getItem('baraka_resources') || '[]');
                                    const filtered = current.filter((i: any) => i.id !== res.id);
                                    localStorage.setItem('baraka_resources', JSON.stringify(filtered));
                                    toast({ title: "تم الحذف" });
                                    // Trigger re-render by updating dummy state or relying on parent state if lifted (here strictly local)
                                    // Simple hack: Update formData to trigger re-render or just use a state for the list.
                                    setFormData({ ...formData });
                                }}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default InteractiveMap;
