import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
    MapPin,
    Search,
    Locate,
    Plus,
    Check,
    Trash2,
    Loader2,
    Share2,
    Edit2,
    CheckSquare,
    Navigation,
    Save
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';
import { Share } from '@capacitor/share';

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
    onSave: (addressName: string, addressDetails: string | undefined, position: { lat: number; lng: number }) => void;
    onShare: (pos: { lat: number; lng: number }) => void;
}

function LocationMarker({ position, setPosition, onSave, onShare }: LocationMarkerProps) {
    const [addressName, setAddressName] = useState('');
    const [addressDetails, setAddressDetails] = useState('');
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);
    const [locationImage, setLocationImage] = useState<string | null>(null);
    const map = useMap();

    useEffect(() => {
        if (!position) return;

        setIsLoadingAddress(true);
        // Fetch address using Nominatim (OSM)
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&accept-language=ar`)
            .then(res => res.json())
            .then(data => {
                const addr = data.address || {};
                const road = addr.road || '';
                const number = addr.house_number || '';
                // Construct address string
                const parts = [road, number, addr.suburb].filter(Boolean);
                const fullAddress = parts.join('، ');

                setAddressDetails(fullAddress);
                // Default name can be the road name if available, or empty to let user type
                if (!addressName && road) setAddressName(road);
            })
            .catch(() => setAddressDetails('')) // Fail silently or show empty
            .finally(() => setIsLoadingAddress(false));
    }, [position]);

    const handleNavigate = () => {
        if (position) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${position.lat},${position.lng}`, '_blank');
        }
    };

    useMapEvents({
        click(e) {
            setPosition(e.latlng);
            map.setView([e.latlng.lat, e.latlng.lng], map.getZoom(), {
                animate: true,
                duration: 0.5
            });
        },
    });

    if (!position) return null;

    // Use street name as default if no name provided
    const getDisplayName = () => addressName.trim() || addressDetails || `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`;

    return (
        <Marker position={position}>
            <Popup>
                <div className="p-2 min-w-[250px] text-right space-y-2">
                    <p className="text-center font-bold text-sm text-primary mb-2">📍 حفظ الموقع</p>

                    {/* Name Input */}
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500">اسم الموقع</label>
                        <Input
                            placeholder="المنزل، العمل، المسجد..."
                            value={addressName}
                            onChange={(e) => setAddressName(e.target.value)}
                            className="h-9 text-sm text-right"
                        />
                    </div>

                    {/* Address Details */}
                    <div className="space-y-1 relative">
                        <label className="text-xs text-gray-500">العنوان</label>
                        <Input
                            placeholder="الشارع، الرقم..."
                            value={addressDetails}
                            onChange={(e) => setAddressDetails(e.target.value)}
                            className="h-9 text-sm text-right pl-7"
                        />
                        {isLoadingAddress && <Loader2 className="w-3 h-3 absolute left-2 top-7 animate-spin text-gray-400" />}
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500">صورة (اختياري)</label>
                        {locationImage ? (
                            <div className="relative inline-block">
                                <img src={locationImage} alt="" className="w-16 h-16 object-cover rounded-lg" />
                                <button
                                    onClick={() => setLocationImage(null)}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center"
                                >✕</button>
                            </div>
                        ) : (
                            <label className="flex items-center justify-center gap-2 p-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-400 hover:bg-green-50 text-xs">
                                <span>📷</span>
                                <span className="text-gray-500">إضافة صورة</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = (ev) => setLocationImage(ev.target?.result as string);
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </label>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-center gap-2 pt-2">
                        <Button
                            size="sm"
                            className="flex-1 h-9 bg-green-500 hover:bg-green-600 text-white"
                            onClick={() => {
                                const saveName = getDisplayName();
                                onSave(saveName, addressDetails, position);
                            }}
                        >
                            <Save className="w-4 h-4 ml-1" /> حفظ
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 border-purple-200 hover:bg-purple-50"
                            onClick={() => onShare(position)}
                            title="مشاركة"
                        >
                            <Share2 className="w-4 h-4" />
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 border-blue-200 hover:bg-blue-50"
                            onClick={handleNavigate}
                            title="ملاحة"
                        >
                            <Navigation className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </Popup>
        </Marker>
    );
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
    const [searchQuery, setSearchQuery] = useState('');
    const [isLocating, setIsLocating] = useState(false);
    const [savedLocations, setSavedLocations] = useState<any[]>([]);
    const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('other');

    // Location Categories with icons
    const LOCATION_CATEGORIES = [
        { id: 'home', label: 'منزل', icon: '🏠' },
        { id: 'work', label: 'عمل', icon: '💼' },
        { id: 'mosque', label: 'مسجد', icon: '🕌' },
        { id: 'market', label: 'سوق', icon: '🛒' },
        { id: 'restaurant', label: 'مطعم', icon: '🍽️' },
        { id: 'other', label: 'آخر', icon: '📍' },
    ];

    // Edit State
    const [editingResource, setEditingResource] = useState<any | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);

    const [currentMarkerPosition, setCurrentMarkerPosition] = useState<{ lat: number, lng: number } | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

    const { toast } = useToast();

    // Get user location for sorting
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => { }
            );
        }
    }, []);

    // Calculate distance for sorting
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    // Live search with debounce
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=8&accept-language=ar&addressdetails=1`;
                if (userLocation) {
                    url += `&viewbox=${userLocation.lng - 0.5},${userLocation.lat - 0.5},${userLocation.lng + 0.5},${userLocation.lat + 0.5}&bounded=0`;
                }
                const res = await fetch(url);
                let data = await res.json();

                // Sort by distance
                if (userLocation && data.length > 0) {
                    data = data.map((item: any) => ({
                        ...item,
                        distance: getDistance(userLocation.lat, userLocation.lng, parseFloat(item.lat), parseFloat(item.lon))
                    })).sort((a: any, b: any) => a.distance - b.distance).slice(0, 5);
                }

                setSearchSuggestions(data);
                setShowSuggestions(data.length > 0);
            } catch (e) {
                console.log('Search error:', e);
            }
        }, 200);

        return () => clearTimeout(timer);
    }, [searchQuery, userLocation]);

    // Load saved locations
    useEffect(() => {
        loadLocations();
    }, []);

    const loadLocations = () => {
        // Try new key first, then fallback to old keys
        let data = JSON.parse(localStorage.getItem('baraka_locations') || '[]');
        if (data.length === 0) {
            data = JSON.parse(localStorage.getItem('baraka_resources') || '[]');
        }
        if (data.length === 0) {
            data = JSON.parse(localStorage.getItem('baraka_saved_locations') || '[]');
        }
        setSavedLocations(data);
    };

    const getCategoryIcon = (category: string) => {
        return LOCATION_CATEGORIES.find(c => c.id === category)?.icon || '📍';
    };

    const saveLocation = async (addressName: string, addressDetails?: string, positionArg?: { lat: number; lng: number }) => {
        const position = positionArg || currentMarkerPosition;

        if (!position || !addressName.trim()) {
            toast({ title: "الرجاء تحديد موقع وإدخال اسم", variant: "destructive" });
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const newLocation = {
                id: Date.now().toString(),
                title: addressName,
                address: addressDetails ? addressDetails : `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`,
                category: selectedCategory,
                lat: position.lat,
                lng: position.lng,
                url: `https://www.google.com/maps?q=${position.lat},${position.lng}`,
                user_id: user?.id
            };

            if (user) {
                const { error } = await supabase.from('saved_locations').insert({
                    user_id: user.id,
                    title: newLocation.title,
                    address: newLocation.address,
                    category: newLocation.category,
                    lat: newLocation.lat,
                    lng: newLocation.lng,
                    url: newLocation.url
                });

                if (error) throw error;
            }

            const updatedLocations = [...savedLocations, newLocation];
            setSavedLocations(updatedLocations);
            // Save to all keys for compatibility
            localStorage.setItem('baraka_locations', JSON.stringify(updatedLocations));
            localStorage.setItem('baraka_resources', JSON.stringify(updatedLocations));
            window.dispatchEvent(new Event('locations-updated'));

            toast({ title: "تم حفظ الموقع بنجاح" });
            setNewItem({ name: '', location: '' });
            setSearchQuery('');
            setSelectedCategory('other');
        } catch (error: any) {
            console.error('Error saving location:', error);
            const newLocation = {
                id: Date.now().toString(),
                title: addressName,
                address: addressDetails ? addressDetails : `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`,
                category: selectedCategory,
                lat: position.lat,
                lng: position.lng,
                url: `https://www.google.com/maps?q=${position.lat},${position.lng}`,
                user_id: 'guest'
            };
            const updatedLocations = [...savedLocations, newLocation];
            setSavedLocations(updatedLocations);
            // Save to all keys for compatibility
            localStorage.setItem('baraka_locations', JSON.stringify(updatedLocations));
            localStorage.setItem('baraka_resources', JSON.stringify(updatedLocations));
            window.dispatchEvent(new Event('locations-updated'));
            toast({ title: "تم حفظ الموقع محلياً" });
        }
    };

    const performSearch = async () => {
        if (!searchQuery) return;
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=1`);
            const data = await res.json();
            if (data && data[0]) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                setMapCenter([lat, lon]);
                setNewItem({
                    name: searchQuery,
                    location: `${lat}, ${lon}`
                });
                toast({ title: "تم العثور على الموقع", description: data[0].display_name?.split(',').slice(0, 2).join(',') });
            } else {
                toast({ title: "لم يتم العثور على نتائج", variant: "destructive" });
            }
        } catch (err) {
            console.error(err);
            toast({ title: "خطأ في البحث", variant: "destructive" });
        }
    };

    const locateMe = () => {
        if (!navigator.geolocation) {
            toast({ title: "المتصفح لا يدعم تحديد الموقع", variant: "destructive" });
            return;
        }
        setIsLocating(true);

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setMapCenter([latitude, longitude]);
                setNewItem({ name: 'موقعي الحالي', location: `${latitude}, ${longitude}` });
                toast({ title: "تم تحديد موقعك الحالي" });
                setIsLocating(false);
            },
            (err) => {
                setIsLocating(false);
                toast({ title: "تعذر تحديد الموقع", description: err.message, variant: "destructive" });
            },
            { enableHighAccuracy: true }
        );
    };

    const quickSaveMyLocation = async () => {
        if (!navigator.geolocation) {
            toast({ title: "المتصفح لا يدعم تحديد الموقع", variant: "destructive" });
            return;
        }
        setIsLocating(true);

        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;

            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`);
                const data = await res.json();
                const addr = data.address || {};
                const road = addr.road || addr.suburb || addr.city || 'موقعي';
                const number = addr.house_number || '';
                const addressName = number ? `${road} ${number}` : road;

                const newLocation = {
                    id: Date.now().toString(),
                    title: addressName,
                    address: addressName,
                    lat: latitude,
                    lng: longitude,
                    url: `https://www.google.com/maps?q=${latitude},${longitude}`,
                    category: 'other'
                };
                const updated = [...savedLocations, newLocation];
                // Save to all keys for compatibility
                localStorage.setItem('baraka_locations', JSON.stringify(updated));
                localStorage.setItem('baraka_resources', JSON.stringify(updated));
                setSavedLocations(updated);
                window.dispatchEvent(new Event('locations-updated'));

                toast({ title: "تم الحفظ السريع!", description: addressName });
            } catch (e) {
                console.error(e);
            } finally {
                setIsLocating(false);
            }
        }, (err) => {
            setIsLocating(false);
            toast({ title: "تعذر تحديد الموقع", description: err.message, variant: "destructive" });
        }, { enableHighAccuracy: true });
    };

    const saveEditResource = () => {
        if (!editingResource || !editingResource.title.trim()) return;
        const updated = savedLocations.map((r: any) => r.id === editingResource.id ? editingResource : r);
        // Save to all keys for compatibility
        localStorage.setItem('baraka_locations', JSON.stringify(updated));
        localStorage.setItem('baraka_resources', JSON.stringify(updated));
        setSavedLocations(updated);
        window.dispatchEvent(new Event('locations-updated'));
        toast({ title: "تم تحديث الاسم" });
        setIsEditOpen(false);
        setEditingResource(null);
    };

    const deleteLocation = (id: string) => {
        const updated = savedLocations.filter((i: any) => i.id !== id);
        // Save to all keys for compatibility
        localStorage.setItem('baraka_locations', JSON.stringify(updated));
        localStorage.setItem('baraka_resources', JSON.stringify(updated));
        setSavedLocations(updated);
        selectedLocations.delete(id);
        setSelectedLocations(new Set(selectedLocations));
        window.dispatchEvent(new Event('locations-updated'));
        toast({ title: "تم الحذف" });
    };

    const toggleSelectLocation = (id: string) => {
        const newSet = new Set(selectedLocations);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedLocations(newSet);
    };

    const shareSelectedLocations = async () => {
        const locationsToShare = savedLocations.filter(loc => selectedLocations.has(loc.id));
        if (locationsToShare.length === 0) {
            toast({ title: "اختر مواقع للمشاركة", variant: "destructive" });
            return;
        }

        const shareText = locationsToShare.map(loc => {
            const coords = loc.url.replace('geo:', '');
            const url = `https://www.google.com/maps/search/?api=1&query=${coords}`;
            return `📍 ${loc.title}\n${url}`;
        }).join('\n\n');

        try {
            await Share.share({
                title: 'مواقعي المحفوظة',
                text: shareText,
                dialogTitle: 'مشاركة المواقع'
            });
            toast({ title: "تمت المشاركة بنجاح" });
        } catch (e) {
            await navigator.clipboard.writeText(shareText);
            toast({ title: "تم نسخ المواقع للحافظة" });
        }

        setSelectedLocations(new Set());
        setIsSelectMode(false);
    };

    const shareAllLocations = async () => {
        if (savedLocations.length === 0) {
            toast({ title: "لا توجد مواقع محفوظة", variant: "destructive" });
            return;
        }

        const shareText = savedLocations.map(loc => {
            const coords = loc.url.replace('geo:', '');
            const url = `https://www.google.com/maps/search/?api=1&query=${coords}`;
            return `📍 ${loc.title}\n${url}`;
        }).join('\n\n');

        try {
            await Share.share({
                title: 'مواقعي المحفوظة',
                text: shareText,
                dialogTitle: 'مشاركة جميع المواقع'
            });
        } catch (e) {
            await navigator.clipboard.writeText(shareText);
            toast({ title: "تم نسخ جميع المواقع للحافظة" });
        }
    };

    return (
        <Card className="overflow-hidden border shadow-md bg-white">
            <CardHeader className="py-2 px-3 bg-blue-50/50 border-b">
                <CardTitle className="arabic-title text-sm flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span className="text-primary">المواقع المحفوظة</span>
                    </div>
                    <div className="flex gap-1">
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 bg-white"
                            onClick={quickSaveMyLocation}
                            disabled={isLocating}
                        >
                            {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                            حفظ موقعي
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 bg-white"
                            onClick={shareAllLocations}
                        >
                            <Share2 className="w-3 h-3" />
                            مشاركة الكل
                        </Button>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {/* 70/30 Split Layout - Desktop: Horizontal | Mobile: Vertical */}
                <div className="flex flex-col lg:flex-row h-auto lg:h-[80vh] min-h-[400px]">
                    {/* Map Section - 70% on Desktop */}
                    <div className="h-[400px] lg:h-full lg:w-[70%] w-full relative z-0 order-1">
                        <MapContainer
                            center={mapCenter}
                            zoom={13}
                            zoomControl={false}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <ChangeView center={mapCenter} zoom={15} />
                            <TileLayer
                                attribution='&copy; OpenStreetMap contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {/* Current selection marker */}
                            <LocationMarker
                                position={currentMarkerPosition}
                                setPosition={(pos) => {
                                    setCurrentMarkerPosition(pos);
                                    setMapCenter([pos.lat, pos.lng]);
                                }}
                                onSave={saveLocation}
                                onShare={(pos) => {
                                    const url = `https://www.google.com/maps/search/?api=1&query=${pos.lat},${pos.lng}`;
                                    Share.share({ title: 'موقع', text: url, dialogTitle: 'مشاركة الموقع' }).catch(() => {
                                        navigator.clipboard.writeText(url);
                                        toast({ title: "تم نسخ الرابط" });
                                    });
                                }}
                            />
                            {/* Saved locations markers */}
                            {savedLocations.map((loc: any) => {
                                let lat = typeof loc.lat === 'number' ? loc.lat : parseFloat(loc.lat);
                                let lng = typeof loc.lng === 'number' ? loc.lng : parseFloat(loc.lng);

                                // Fallback for legacy data
                                if ((isNaN(lat) || isNaN(lng)) && loc.url && loc.url.startsWith('geo:')) {
                                    const coords = loc.url.replace('geo:', '').split(',');
                                    lat = parseFloat(coords[0]);
                                    lng = parseFloat(coords[1]);
                                }

                                if (isNaN(lat) || isNaN(lng)) return null;

                                return (
                                    <Marker key={loc.id} position={[lat, lng]}>
                                        <Popup>
                                            <div className="text-center min-w-[150px]">
                                                <p className="font-bold text-sm mb-1">{getCategoryIcon(loc.category)} {loc.title}</p>
                                                {loc.address && <p className="text-xs text-gray-500 mb-2 whitespace-normal">{loc.address}</p>}
                                                <div className="flex gap-1 mt-2 justify-center">
                                                    <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => {
                                                        setMapCenter([lat, lng]);
                                                    }}>تركيز</Button>
                                                    <Button size="sm" variant="destructive" className="h-6 text-xs" onClick={() => deleteLocation(loc.id)}>حذف</Button>
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                );
                            })}
                        </MapContainer>

                        {/* Search overlay on map - CENTERED */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] flex gap-2 w-[90%] max-w-md">
                            <Button
                                size="icon"
                                variant="secondary"
                                className="h-10 w-10 bg-white shadow-md shrink-0"
                                onClick={locateMe}
                                disabled={isLocating}
                            >
                                {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Locate className="w-5 h-5 text-blue-600" />}
                            </Button>
                            <Input
                                placeholder="بحث عن مكان..."
                                className="bg-white shadow-md h-10 flex-1"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') performSearch();
                                }}
                            />
                            <Button
                                size="icon"
                                className="h-10 w-10 bg-blue-600 hover:bg-blue-700 shadow-md shrink-0"
                                onClick={performSearch}
                            >
                                <Search className="w-5 h-5" />
                            </Button>

                            {/* Live suggestions dropdown */}
                            {showSuggestions && searchSuggestions.length > 0 && (
                                <div className="absolute top-14 left-0 right-0 bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                                    {searchSuggestions.map((s, idx) => {
                                        // Extract street name and number
                                        const addr = s.address || {};
                                        const streetName = addr.road || addr.street || addr.pedestrian || s.display_name.split(',')[0];
                                        const houseNumber = addr.house_number || '';
                                        const formattedName = houseNumber ? `${streetName} ${houseNumber}` : streetName;

                                        return (
                                            <div
                                                key={idx}
                                                className="p-2.5 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 text-right"
                                                onMouseDown={() => {
                                                    const lat = parseFloat(s.lat);
                                                    const lng = parseFloat(s.lon);
                                                    setMapCenter([lat, lng]);
                                                    setSearchQuery(formattedName);
                                                    setCurrentMarkerPosition({ lat, lng }); // Set current marker position
                                                    setNewItem({ name: formattedName, location: `${lat}, ${lng}` });
                                                    setShowSuggestions(false);
                                                    toast({ title: "📍 تم تحديد الموقع", description: formattedName });
                                                }}
                                            >
                                                <p className="text-sm font-medium">{formattedName}</p>
                                                <p className="text-xs text-gray-500 truncate">{s.display_name.split(',').slice(1, 3).join(',')}</p>
                                                {s.distance && (
                                                    <span className="text-xs text-blue-500">{s.distance.toFixed(1)} كم</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>

            {/* Locations Table */}
            {
                savedLocations.length > 0 && (
                    <div className="border-t bg-white order-2">
                        <div className="p-3 bg-gray-50 border-b">
                            <h3 className="font-bold text-sm flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-blue-600" />
                                المواقع المحفوظة ({savedLocations.length})
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="text-right p-3 font-bold">الاسم</th>
                                        <th className="text-center p-3 font-bold w-40">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {savedLocations.map((loc: any) => {
                                        return (
                                            <tr key={loc.id} className="border-b hover:bg-blue-50/50 transition-colors">
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="bg-blue-100 p-1.5 rounded-full">
                                                            <MapPin className="w-3 h-3 text-blue-600" />
                                                        </div>
                                                        <span className="font-medium">{loc.title}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {/* Navigate */}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-green-600 hover:bg-green-50"
                                                            onClick={() => {
                                                                const url = `https://www.google.com/maps/dir/?api=1&destination=${loc.url.replace('geo:', '')}`;
                                                                window.open(url, '_blank');
                                                            }}
                                                            title="الملاحة"
                                                        >
                                                            <Navigation className="w-4 h-4" />
                                                        </Button>
                                                        {/* Share */}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                                            onClick={() => {
                                                                const url = `https://www.google.com/maps/search/?api=1&query=${loc.url.replace('geo:', '')}`;
                                                                if (navigator.share) {
                                                                    navigator.share({ title: loc.title, url }).catch(() => { });
                                                                } else {
                                                                    navigator.clipboard.writeText(url);
                                                                    toast({ title: "تم نسخ الرابط" });
                                                                }
                                                            }}
                                                            title="مشاركة"
                                                        >
                                                            <Share2 className="w-4 h-4" />
                                                        </Button>
                                                        {/* Edit */}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-orange-600 hover:bg-orange-50"
                                                            onClick={() => {
                                                                setEditingResource(loc);
                                                                setIsEditOpen(true);
                                                            }}
                                                            title="تعديل"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                        {/* Delete */}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                                                            onClick={() => deleteLocation(loc.id)}
                                                            title="حذف"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            }

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-right">تعديل الموقع</DialogTitle>
                    </DialogHeader>
                    {editingResource && (
                        <div className="py-4 space-y-4">
                            <div>
                                <label className="text-sm text-gray-500 mb-1 block text-right">اسم الموقع</label>
                                <Input
                                    value={editingResource.title}
                                    onChange={(e) => setEditingResource({ ...editingResource, title: e.target.value })}
                                    className="text-right"
                                    placeholder="اسم الموقع"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-gray-500 mb-1 block text-right">الفئة</label>
                                <div className="flex gap-2 flex-wrap">
                                    {LOCATION_CATEGORIES.map(cat => (
                                        <Button
                                            key={cat.id}
                                            size="sm"
                                            variant={editingResource.category === cat.id ? 'default' : 'outline'}
                                            onClick={() => setEditingResource({ ...editingResource, category: cat.id })}
                                            className="text-sm"
                                        >
                                            {cat.icon} {cat.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-gray-500 mb-1 block text-right">الإحداثيات</label>
                                <div className="flex gap-2">
                                    <Input
                                        value={editingResource.url.replace('geo:', '')}
                                        readOnly
                                        className="flex-1 text-xs text-gray-500"
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            navigator.clipboard.writeText(editingResource.url.replace('geo:', ''));
                                            toast({ title: 'تم النسخ', description: 'تم نسخ الإحداثيات للحافظة' });
                                        }}
                                    >
                                        نسخ
                                    </Button>
                                </div>
                            </div>

                            <DialogFooter className="gap-2">
                                <Button variant="outline" onClick={() => setIsEditOpen(false)}>إلغاء</Button>
                                <Button onClick={saveEditResource}>حفظ التعديلات</Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Card >
    );
};

export default InteractiveMap;
