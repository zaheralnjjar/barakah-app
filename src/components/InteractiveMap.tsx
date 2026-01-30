import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useLocations } from '@/hooks/useLocations';
import { reverseGeocodeLimit, generateGoogleMapsLink } from '@/utils/locationUtils';
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
const fixLeafletIcons = () => {
    if (typeof window === 'undefined') return;
    try {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
    } catch (e) {
        console.warn('Leaflet icon fix failed', e);
    }
};

// Stable selected icon
const selectedIcon = typeof window !== 'undefined' ? new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
}) : null;

// Map click handler - strictly defined
const MapClickHandler = ({ onMapClick }: { onMapClick: (e: any) => void }) => {
    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng);
        },
    });
    return null;
};



interface LocationMarkerProps {
    position: { lat: number; lng: number } | null;
    onSave: (addressName: string, addressDetails: string | undefined, position: { lat: number; lng: number }) => void;
    onShare: (pos: { lat: number; lng: number }) => void;
    onQuickPark: (addressName: string, addressDetails: string | undefined, position: { lat: number; lng: number }) => void;
}

function LocationMarker({ position, onSave, onShare, onQuickPark }: LocationMarkerProps) {
    const [addressName, setAddressName] = useState('');

    const handleNavigate = () => {
        if (position) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${position.lat},${position.lng}`, '_blank');
        }
    };

    if (!position) return null;

    // Use coordinates as default if no name provided
    const getDisplayName = () => addressName.trim() || `${(position?.lat || 0).toFixed(4)}, ${(position?.lng || 0).toFixed(4)}`;

    return (
        <Marker position={position}>
            <Popup>
                <div className="p-2 min-w-[200px] text-right space-y-2">
                    <p className="text-center font-bold text-sm text-primary mb-2">📍 حفظ الموقع</p>

                    {/* Name Input */}
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500">اسم الموقع</label>
                        <Input
                            placeholder="المنزل، العمل، المسجد..."
                            value={addressName}
                            onChange={(e) => setAddressName(e.target.value)}
                            className="h-9 text-sm text-right"
                            autoFocus
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-center gap-2 pt-2">
                        <Button
                            size="sm"
                            className="flex-1 h-9 bg-green-500 text-white"
                            onClick={() => {
                                const saveName = getDisplayName();
                                onSave(saveName, '', position);
                            }}
                        >
                            <Save className="w-4 h-4 ml-1" /> حفظ
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 border-purple-200"
                            onClick={() => onShare(position)}
                            title="مشاركة"
                        >
                            <Share2 className="w-4 h-4" />
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 border-blue-200"
                            onClick={handleNavigate}
                            title="ملاحة خارجية"
                        >
                            <Navigation className="w-4 h-4" />
                        </Button>

                        {/* Quick Parking Button */}
                        <Button
                            variant="outline"
                            size="icon"
                            className="w-full h-10 mt-2 border-orange-200 text-orange-700 flex items-center justify-center gap-2 hidden" // Hidden for simplicity if requested, or keep? Plan said remove auto-fill. Let's keep parking but simplify args
                            onClick={() => {
                                const saveName = getDisplayName() || 'موقف';
                                onQuickPark(saveName, '', position);
                            }}
                            title="حفظ موقف سريع"
                            style={{ display: 'none' }} // Actually hiding it to be safer on "Simple Level" request? User said "Simple level". Parking is useful though. I'll keep it but distinct from the simplification of the marker itself. Wait, the previous code had it. I will keep it but clean up the call.
                        >
                            <span className="text-xl">🅿️</span>
                        </Button>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 border-orange-200 text-orange-700 flex items-center justify-center gap-2"
                        onClick={() => {
                            const saveName = getDisplayName() || 'موقف';
                            onQuickPark(saveName, '', position);
                        }}
                    >
                        <span className="text-lg">🅿️</span>
                        <span className="text-xs font-bold">حفظ موقف</span>
                    </Button>
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

    // Unified Locations Hook
    const { locations: savedLocations, saveLocation: hookSaveLocation, saveParking, updateLocation, deleteLocation } = useLocations();

    const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('other');
    const [mapKey, setMapKey] = useState(Date.now()); // FORCE RE-MOUNT ON LOAD

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

    // Routing State



    const { toast } = useToast();
    // Removed duplicate hook usage

    // Move Leaflet setup to useEffect
    useEffect(() => {
        fixLeafletIcons();
    }, []);

    // Auto-locate user on map open and place pin at their location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    if (!isNaN(latitude) && !isNaN(longitude)) {
                        const userPos = { lat: latitude, lng: longitude };
                        setUserLocation(userPos);
                        // Center map on user location
                        setMapCenter([userPos.lat, userPos.lng]);
                        // Place marker/pin at user location automatically
                        setCurrentMarkerPosition(userPos);
                    }
                },
                (err) => {
                    console.log('Geolocation error:', err);
                    // Fallback: don't change default center
                }
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

    // Removed local loadLocations as hook handles it

    const getCategoryIcon = (category: string) => {
        return LOCATION_CATEGORIES.find(c => c.id === category)?.icon || '📍';
    };

    const handleSaveLocation = async (addressName: string, addressDetails?: string, positionArg?: { lat: number; lng: number }) => {
        const position = positionArg || currentMarkerPosition;

        if (!position || !addressName.trim()) {
            toast({ title: "الرجاء تحديد موقع وإدخال اسم", variant: "destructive" });
            return;
        }

        const standardUrl = generateGoogleMapsLink(position.lat, position.lng);
        const finalDetails = addressDetails || standardUrl;

        // Use the passed name directly, assuming user input is preferred.
        // If we wanted to enforce standard naming, we'd use a util here.
        // But keeping user input with optional date is better UX for "Save Location" dialog.
        // We removed the forced date appending to be cleaner, or we can keep it if user prefers.
        // The previous code appended date. Let's keep it if the name is generic, but usually user types a name.
        // Let's stick to the name provided by user.

        await hookSaveLocation(addressName, position.lat, position.lng, {
            address: finalDetails,
            category: selectedCategory as any
        });

        // Reset UI
        setNewItem({ name: '', location: '' });
        setSearchQuery('');
        setSelectedCategory('other');
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
                // Fix: Set map center AND current marker position so pin appears
                setMapCenter([latitude, longitude]);
                setCurrentMarkerPosition({ lat: latitude, lng: longitude });

                // Also update new item state for saving
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

            // Use reverse geocoding for a better name
            const addressName = await reverseGeocodeLimit(latitude, longitude);

            // Generate basic name if geocoding fails or just append time for uniqueness
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const title = addressName ? `${addressName} ${timeStr}` : `موقعي ${timeStr}`;

            const standardUrl = generateGoogleMapsLink(latitude, longitude);

            await hookSaveLocation(title, latitude, longitude, {
                category: 'other',
                address: standardUrl
            });

            setIsLocating(false);
            toast({ title: "تم حفظ موقعك الحالي" });
        }, (err) => {
            setIsLocating(false);
            toast({ title: "تعذر تحديد الموقع", description: err.message, variant: "destructive" });
        }, { enableHighAccuracy: true });
    };

    const handleUpdateLocation = async () => {
        if (!editingResource) return;

        if (!editingResource.title) {
            toast({ title: 'خطأ', description: 'يرجى إدخال اسم الموقع', variant: 'destructive' });
            return;
        }

        if (editingResource.id) {
            await updateLocation(editingResource.id, editingResource);
            toast({ title: "تم تحديث الموقع" });
        } else {
            if (!editingResource.lat || !editingResource.lng) {
                toast({ title: 'خطأ', description: 'يرجى تحديد موقع', variant: 'destructive' });
                return;
            }
            await hookSaveLocation(editingResource.title, editingResource.lat, editingResource.lng, {
                category: editingResource.category || 'other',
                address: editingResource.address,
                type: 'location'
            });
            // toast is handled in hook
        }
        setIsEditOpen(false);
        setEditingResource(null);
    };

    // deleted local deleteLocation to use hook's one





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
            <CardHeader className="py-2 px-3 bg-blue-50/50 border-b pt-[max(0.5rem,env(safe-area-inset-top))]">
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
                            onClick={() => {
                                setEditingResource({ title: '', category: 'other', lat: mapCenter[0], lng: mapCenter[1] });
                                setIsEditOpen(true);
                            }}
                        >
                            <MapPin className="w-3 h-3 text-green-600" />
                            إضافة موقع
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
                <div className="flex flex-col lg:flex-row h-auto lg:h-[80vh] min-h-[500px]">
                    {/* Map Section - 70% on Desktop */}
                    <div className="h-[50vh] min-h-[400px] lg:h-full lg:w-[70%] w-full relative z-0 order-1 border-b lg:border-b-0 lg:border-l border-gray-200 isolate">
                        {/* Map Container with Key for Remounting */}
                        <MapContainer
                            key={mapKey}
                            center={mapCenter}
                            zoom={13}
                            zoomControl={false}
                            style={{ height: '100%', width: '100%', minHeight: '400px' }}
                            whenReady={() => {
                                // Safety check or initialization
                            }}
                        >
                            <ChangeView center={mapCenter} zoom={15} />
                            <TileLayer
                                attribution='&copy; OpenStreetMap contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {/* Map click handler */}
                            <MapClickHandler onMapClick={(latlng) => {
                                setCurrentMarkerPosition({ lat: latlng.lat, lng: latlng.lng });
                                setMapCenter([latlng.lat, latlng.lng]);
                            }} />

                            {/* Current selection marker */}
                            <LocationMarker
                                position={currentMarkerPosition}
                                onSave={handleSaveLocation}
                                onShare={(pos) => {
                                    const url = `https://www.google.com/maps/search/?api=1&query=${pos.lat},${pos.lng}`;
                                    Share.share({ title: 'موقع', text: url, dialogTitle: 'مشاركة الموقع' }).catch(() => {
                                        navigator.clipboard.writeText(url);
                                        toast({ title: "تم نسخ الرابط" });
                                    });
                                }}
                                onQuickPark={async (name, address, pos) => {
                                    await saveParking({ lat: pos.lat, lng: pos.lng, address, name });
                                }}
                            />


                            {/* Saved locations markers */}
                            {React.useMemo(() => savedLocations.map((loc: any) => {
                                let lat = typeof loc.lat === 'number' ? loc.lat : parseFloat(loc.lat);
                                let lng = typeof loc.lng === 'number' ? loc.lng : parseFloat(loc.lng);

                                // Fallback for legacy data
                                if ((isNaN(lat) || isNaN(lng)) && loc.url && loc.url.startsWith('geo:')) {
                                    const coords = loc.url.replace('geo:', '').split(',');
                                    lat = parseFloat(coords[0]);
                                    lng = parseFloat(coords[1]);
                                }

                                if (isNaN(lat) || isNaN(lng)) return null;

                                // Check if this location is selected
                                const isSelected = selectedLocations.has(loc.id);

                                return (
                                    <Marker
                                        key={`saved-loc-${loc.id}`}
                                        position={[lat, lng]}
                                        icon={(isSelected && selectedIcon) ? selectedIcon : undefined}
                                    >
                                        <Popup>
                                            <div className="text-center min-w-[180px]">
                                                <p className="font-bold text-sm mb-1">{getCategoryIcon(loc.category)} {loc.title}</p>
                                                {loc.address && <p className="text-xs text-gray-500 mb-2 whitespace-normal">{loc.address}</p>}
                                                <div className="flex flex-col gap-2 mt-2">
                                                    {/* Navigation Button - Primary Action */}
                                                    <Button
                                                        size="sm"
                                                        className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white w-full gap-1"
                                                        onClick={() => {
                                                            const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
                                                            window.open(navUrl, '_blank');
                                                        }}
                                                    >
                                                        <Navigation className="w-3 h-3" />
                                                        انطلق للموقع
                                                    </Button>
                                                    <div className="flex gap-1 justify-center">
                                                        <Button size="sm" variant="outline" className="h-6 text-xs flex-1" onClick={() => {
                                                            setMapCenter([lat, lng]);
                                                        }}>تركيز</Button>
                                                        <Button size="sm" variant="outline" className="h-6 text-xs flex-1" onClick={() => {
                                                            toggleSelectLocation(loc.id);
                                                        }}>
                                                            {isSelected ? '✓ محدد' : 'تحديد'}
                                                        </Button>
                                                        <Button size="sm" variant="destructive" className="h-6 text-xs" onClick={() => deleteLocation(loc.id)}>حذف</Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                );
                            }), [savedLocations, selectedLocations, selectedIcon, deleteLocation, toggleSelectLocation, getCategoryIcon])}

                        </MapContainer>

                        {/* Search overlay on map - CENTERED */}
                        <div className="absolute left-1/2 -translate-x-1/2 z-[1000] flex gap-2 w-[90%] max-w-md" style={{ top: 'max(0.5rem, env(safe-area-inset-top))' }}>
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
                                className="h-10 w-10 bg-blue-600 shadow-md shrink-0"
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
                                                className="p-2.5 cursor-pointer border-b last:border-b-0 text-right"
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
                                                    <span className="text-xs text-blue-500">{(s.distance || 0).toFixed(1)} كم</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>


                    {/* Locations Table */}
                    {savedLocations.length > 0 && (
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
                                            <th className="p-2 text-right">الموقع</th>
                                            <th className="p-2 text-right">التصنيف</th>
                                            <th className="p-2 text-center">إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {savedLocations.map((loc) => (
                                            <tr key={loc.id} className="border-b last:border-0 hover:bg-gray-50">
                                                <td className="p-2">
                                                    <div className="font-medium text-blue-700 cursor-pointer hover:underline" onClick={() => setMapCenter([loc.lat, loc.lng])}>
                                                        {loc.title}
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{loc.address}</div>
                                                </td>
                                                <td className="p-2">
                                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{getCategoryIcon(loc.category)} {LOCATION_CATEGORIES.find(c => c.id === loc.category)?.label}</span>
                                                </td>
                                                <td className="p-2 flex justify-center gap-1">
                                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => {
                                                        setEditingResource(loc);
                                                        setIsEditOpen(true);
                                                    }}>
                                                        <Edit2 className="w-3 h-3 text-gray-500" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => deleteLocation(loc.id)}>
                                                        <Trash2 className="w-3 h-3 text-red-500" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => {
                                                        const url = `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`;
                                                        Share.share({ title: loc.title, text: url }).catch(() => navigator.clipboard.writeText(url));
                                                    }}>
                                                        <Share2 className="w-3 h-3 text-blue-500" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    )}
                </div>
            </CardContent>

            {/* Edit/Add Location Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[500px]" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-right flex items-center gap-2">
                            {editingResource?.id ? <Edit2 className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                            {editingResource?.id ? 'تعديل الموقع' : 'إضافة موقع جديد'}
                        </DialogTitle>
                    </DialogHeader>

                    {editingResource && (
                        <div className="py-4 space-y-4">
                            {/* 1. Name Input */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 block text-right">اسم الموقع</label>
                                <Input
                                    value={editingResource.title}
                                    onChange={(e) => setEditingResource({ ...editingResource, title: e.target.value })}
                                    className="text-right font-medium"
                                    placeholder="مثال: المنزل، العمل..."
                                    autoFocus
                                />
                            </div>

                            {/* 2. Category Selection */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 block text-right">التصنيف</label>
                                <div className="flex gap-2 flex-wrap justify-end">
                                    {LOCATION_CATEGORIES.map(cat => (
                                        <Button
                                            key={cat.id}
                                            size="sm"
                                            variant={editingResource.category === cat.id ? 'default' : 'outline'}
                                            onClick={() => setEditingResource({ ...editingResource, category: cat.id })}
                                            className={`text-xs h-8 ${editingResource.category === cat.id ? 'bg-blue-600 text-white' : ''}`}
                                        >
                                            {cat.icon} {cat.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-gray-100 my-2 pt-2"></div>

                            {/* 3. Helper Tools (Search & Link) */}
                            <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <p className="text-xs font-bold text-gray-500 mb-2">أدوات تحديد الموقع</p>

                                {/* Locate Me Button */}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        if (!navigator.geolocation) {
                                            toast({ title: "المتصفح لا يدعم تحديد الموقع", variant: "destructive" });
                                            return;
                                        }
                                        navigator.geolocation.getCurrentPosition((pos) => {
                                            setEditingResource({
                                                ...editingResource,
                                                lat: pos.coords.latitude,
                                                lng: pos.coords.longitude
                                            });
                                            toast({ title: "تم تحديد موقعك الحالي" });
                                        });
                                    }}
                                    className="w-full gap-2 border-dashed border-emerald-500 text-emerald-700 hover:bg-emerald-50 h-9 mb-2"
                                >
                                    <Locate className="w-4 h-4" />
                                    تحديد موقعي الحالي
                                </Button>

                                {/* Address Search (Auto) */}
                                <div className="space-y-1.5 relative">
                                    <label className="text-xs text-gray-500 block text-right">بحث بالعنوان (اسم الشارع، رقم المبنى)</label>
                                    <div className="flex items-center gap-2 border rounded-md px-2 focus-within:ring-2 ring-blue-100 bg-white h-9">
                                        <Search className="w-4 h-4 text-gray-400 shrink-0" />
                                        <Input
                                            className="border-0 bg-transparent focus-visible:ring-0 text-right px-0 h-full text-xs"
                                            placeholder="اكتب 3 أحرف للبحث..."
                                            value={editingResource.address_search || ''}
                                            onChange={(e) => {
                                                const query = e.target.value;
                                                setEditingResource({ ...editingResource, address_search: query });

                                                // Trigger search after 3 chars
                                                if (query.length >= 3) {
                                                    const debounceTimer = setTimeout(async () => {
                                                        const resultsDiv = document.getElementById('dialog-search-results-list');
                                                        if (resultsDiv) resultsDiv.innerHTML = '<div class="p-2 text-xs text-center text-gray-400">جاري البحث...</div>';

                                                        try {
                                                            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&accept-language=ar`);
                                                            const data = await res.json();

                                                            if (resultsDiv) {
                                                                if (data.length === 0) {
                                                                    resultsDiv.innerHTML = '<div class="p-2 text-xs text-center text-gray-400">لا توجد نتائج</div>';
                                                                } else {
                                                                    resultsDiv.innerHTML = '';
                                                                    data.forEach((item: any) => {
                                                                        const div = document.createElement('div');
                                                                        div.className = 'p-2 hover:bg-gray-100 cursor-pointer border-b last:border-0 text-right text-xs';
                                                                        div.innerHTML = `<div class="font-bold text-gray-700">${(item.display_name || '').split(',').slice(0, 2).join(',')}</div><div class="text-[10px] text-gray-400 truncate">${item.display_name}</div>`;
                                                                        div.onclick = () => {
                                                                            setEditingResource(prev => ({
                                                                                ...prev,
                                                                                lat: parseFloat(item.lat),
                                                                                lng: parseFloat(item.lon),
                                                                                title: prev.title || item.display_name.split(',')[0],
                                                                                address: item.display_name,
                                                                                address_search: item.display_name.split(',')[0]
                                                                            }));
                                                                            resultsDiv.innerHTML = '';
                                                                        };
                                                                        resultsDiv.appendChild(div);
                                                                    });
                                                                }
                                                            }
                                                        } catch (e) { console.error(e); }
                                                    }, 500);
                                                } else {
                                                    const resultsDiv = document.getElementById('dialog-search-results-list');
                                                    if (resultsDiv) resultsDiv.innerHTML = '';
                                                }
                                            }}
                                        />
                                    </div>
                                    <div id="dialog-search-results-list" className="absolute z-10 w-full bg-white border rounded shadow-lg max-h-40 overflow-y-auto mt-1 empty:hidden"></div>
                                </div>

                                {/* Link Parsing - Restored & Professional */}
                                <div className="space-y-1.5 pt-2 border-t border-gray-100 mt-2">
                                    <label className="text-xs text-gray-500 block text-right">أو الصق رابط خرائط جوجل (Google Maps Link)</label>
                                    <div className="flex gap-2">
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            className="shrink-0 bg-white border"
                                            onClick={() => {
                                                const link = editingResource.gmaps_link || '';
                                                // Robust regex for @lat,lng or q=lat,lng
                                                const atRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
                                                const qRegex = /q=(-?\d+\.\d+),(-?\d+\.\d+)/;

                                                const match = link.match(atRegex) || link.match(qRegex);

                                                if (match) {
                                                    const lat = parseFloat(match[1]);
                                                    const lng = parseFloat(match[2]);
                                                    setEditingResource({
                                                        ...editingResource,
                                                        url: `geo:${lat},${lng}`,
                                                        lat: lat,
                                                        lng: lng
                                                    });
                                                    toast({ title: "تم استخراج الإحداثيات بنجاح" });
                                                } else {
                                                    toast({ title: "رابط غير صالح", description: "لم يتم العثور على إحداثيات في الرابط", variant: "destructive" });
                                                }
                                            }}
                                            title="استخراج الموقع"
                                        >
                                            <Search className="w-4 h-4 text-green-600" />
                                        </Button>
                                        <Input
                                            value={editingResource.gmaps_link || ''}
                                            onChange={(e) => setEditingResource({ ...editingResource, gmaps_link: e.target.value })}
                                            className="text-right text-sm bg-white h-9"
                                            placeholder="https://maps.google.com/..."
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400 text-right mr-1">سيقوم النظام باستخراج الإحداثيات تلقائياً من الرابط.</p>
                                </div>

                                {/* Locate Me Button */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full bg-white text-xs gap-2"
                                    onClick={() => {
                                        if (navigator.geolocation) {
                                            navigator.geolocation.getCurrentPosition(pos => {
                                                const { latitude, longitude } = pos.coords;
                                                setEditingResource({
                                                    ...editingResource,
                                                    url: `geo:${latitude},${longitude}`,
                                                    lat: latitude,
                                                    lng: longitude,
                                                    address: 'موقعي الحالي'
                                                });
                                                toast({ title: "تم تحديد موقعك الحالي" });
                                            });
                                        }
                                    }}
                                >
                                    <Locate className="w-3 h-3 text-blue-500" />
                                    تحديد موقعي الحالي تلقائياً
                                </Button>
                            </div>

                            {/* 4. Coordinates Display (Read-onlyish) */}
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block text-right">الإحداثيات الحالية</label>
                                <div className="flex gap-2 items-center bg-gray-100 p-2 rounded text-xs font-mono text-gray-600">
                                    <span className="flex-1 text-center">{editingResource.lat?.toFixed(5) || '---'}</span>
                                    <span>,</span>
                                    <span className="flex-1 text-center">{editingResource.lng?.toFixed(5) || '---'}</span>
                                </div>
                            </div>
                        </div>
                    )
                    }

                    <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>إلغاء</Button>
                        <Button onClick={handleUpdateLocation} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {editingResource?.id ? 'حفظ التعديلات' : 'إضافة الموقع'}
                        </Button>
                    </DialogFooter>
                </DialogContent >
            </Dialog >
        </Card >
    );
};

export default InteractiveMap;
