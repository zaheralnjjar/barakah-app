import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLocations } from '@/hooks/useLocations';
import { MapPin, Search, Locate, Plus, Loader2, Share2, Edit2, Trash2, Navigation, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Share } from '@capacitor/share';
import { generateGoogleMapsLink, reverseGeocodeLimit } from '@/utils/locationUtils';

// Fix Leaflet icons once
if (typeof window !== 'undefined') {
    try {
        // @ts-ignore
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
    } catch (e) {
        console.warn('Leaflet icon fix failed', e);
    }
}

const LOCATION_CATEGORIES = [
    { id: 'home', label: 'منزل', icon: '🏠' },
    { id: 'work', label: 'عمل', icon: '💼' },
    { id: 'mosque', label: 'مسجد', icon: '🕌' },
    { id: 'market', label: 'سوق', icon: '🛒' },
    { id: 'restaurant', label: 'مطعم', icon: '🍽️' },
    { id: 'other', label: 'آخر', icon: '📍' },
];

const InteractiveMap = () => {
    const { toast } = useToast();
    const { locations: savedLocations, saveLocation, deleteLocation, updateLocation, saveParking } = useLocations();

    const [center, setCenter] = useState<[number, number]>([-34.6037, -58.3816]);
    const [zoom, setZoom] = useState(13);
    const [mapKey, setMapKey] = useState(0); // For forcing re-render when center changes
    const mapRef = useRef<L.Map | null>(null);

    const [isLocating, setIsLocating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

    const [currentMarker, setCurrentMarker] = useState<{ lat: number, lng: number } | null>(null);
    const [markerName, setMarkerName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('other');

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<any>(null);
    const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());

    const getCategoryIcon = (category: string) => {
        return LOCATION_CATEGORIES.find(c => c.id === category)?.icon || '📍';
    };

    // Initial geolocation - request immediately when component mounts
    useEffect(() => {
        const requestLocation = () => {
            if (!navigator.geolocation) {
                console.log('Geolocation not supported');
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    if (!isNaN(latitude) && !isNaN(longitude)) {
                        setUserLocation({ lat: latitude, lng: longitude });
                        setCenter([latitude, longitude]);
                        setZoom(15);
                        setMapKey(prev => prev + 1);
                    }
                },
                (err) => {
                    console.log('Geolocation error:', err.code, err.message);
                    // Keep default Buenos Aires location
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000 // Accept cached location up to 1 minute old
                }
            );
        };

        // Request location immediately
        requestLocation();
    }, []);


    // Search with debounce
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&accept-language=ar&addressdetails=1`;
                const res = await fetch(url);
                const data = await res.json();
                setSearchSuggestions(data);
                setShowSuggestions(data.length > 0);
            } catch (e) {
                console.log('Search error:', e);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleQuickSave = async () => {
        if (!navigator.geolocation) {
            toast({ title: "المتصفح لا يدعم تحديد الموقع", variant: "destructive" });
            return;
        }
        setIsLocating(true);

        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            const addressName = await reverseGeocodeLimit(latitude, longitude);
            const now = new Date();
            const dateStr = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()}`;
            const title = addressName ? `${addressName} ${dateStr}` : `موقعي ${dateStr}`;

            await saveLocation(title, latitude, longitude, {
                category: 'other',
                address: generateGoogleMapsLink(latitude, longitude)
            });

            setIsLocating(false);
            toast({ title: "تم حفظ موقعك" });
        }, (err) => {
            setIsLocating(false);
            console.log('Quick save location error:', err.message);
        }, { enableHighAccuracy: true, timeout: 5000 });
    };

    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            toast({ title: "المتصفح لا يدعم تحديد الموقع", variant: "destructive" });
            return;
        }
        setIsLocating(true);

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setCenter([latitude, longitude]);
                setZoom(16);
                setMapKey(prev => prev + 1);
                setUserLocation({ lat: latitude, lng: longitude });

                // Set marker and fetch address
                setCurrentMarker({ lat: latitude, lng: longitude });
                try {
                    const address = await reverseGeocodeLimit(latitude, longitude);
                    setMarkerName(address);
                } catch (e) {
                    console.error('Failed to reverse geocode', e);
                }

                setIsLocating(false);
                toast({ title: "تم تحديد موقعك" });
            },
            (err) => {
                setIsLocating(false);
                console.log('Location error:', err.message);
                toast({ title: "تعذر تحديد الموقع بدقة", variant: "destructive" });
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSaveMarker = async () => {
        if (!currentMarker) return;

        // Auto-fetch name if empty
        let finalName = markerName.trim();
        if (!finalName) {
            try {
                finalName = await reverseGeocodeLimit(currentMarker.lat, currentMarker.lng);
            } catch (e) {
                finalName = `موقع جديد ${new Date().toLocaleDateString('ar-EG')}`;
            }
        }

        await saveLocation(finalName, currentMarker.lat, currentMarker.lng, {
            category: selectedCategory as any,
            address: generateGoogleMapsLink(currentMarker.lat, currentMarker.lng)
        });

        setCurrentMarker(null);
        setMarkerName('');
        setSelectedCategory('other');
        toast({ title: "تم حفظ الموقع" });
    };

    const handleSaveParking = async () => {
        if (!currentMarker) return;

        await saveParking({
            lat: currentMarker.lat,
            lng: currentMarker.lng,
            name: markerName || 'موقف',
            address: generateGoogleMapsLink(currentMarker.lat, currentMarker.lng)
        });

        setCurrentMarker(null);
        setMarkerName('');
        toast({ title: "تم حفظ الموقف" });
    };

    const toggleLocationSelection = (id: string) => {
        setSelectedLocations(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const shareSelectedLocations = async () => {
        const locsToShare = selectedLocations.size > 0
            ? savedLocations.filter(loc => selectedLocations.has(loc.id))
            : savedLocations;

        if (locsToShare.length === 0) {
            toast({ title: "لا توجد مواقع للمشاركة", variant: "destructive" });
            return;
        }

        const text = locsToShare.map(loc =>
            `📍 ${loc.title}\n${generateGoogleMapsLink(loc.lat, loc.lng)}`
        ).join('\n\n');

        try {
            await Share.share({ title: 'مواقعي', text });
        } catch (e) {
            navigator.clipboard.writeText(text);
            toast({ title: "تم النسخ" });
        }
        setSelectedLocations(new Set());
    };

    const deleteSelectedLocations = async () => {
        if (selectedLocations.size === 0) {
            toast({ title: "اختر مواقع للحذف", variant: "destructive" });
            return;
        }

        if (!confirm(`هل تريد حذف ${selectedLocations.size} موقع؟`)) return;

        for (const id of selectedLocations) {
            await deleteLocation(id);
        }
        setSelectedLocations(new Set());
        toast({ title: `تم حذف ${selectedLocations.size} موقع` });
    };

    const shareAllLocations = async () => {
        if (savedLocations.length === 0) {
            toast({ title: "لا توجد مواقع", variant: "destructive" });
            return;
        }

        const text = savedLocations.map(loc =>
            `📍 ${loc.title}\n${generateGoogleMapsLink(loc.lat, loc.lng)}`
        ).join('\n\n');

        try {
            await Share.share({ title: 'مواقعي', text });
        } catch (e) {
            navigator.clipboard.writeText(text);
            toast({ title: "تم النسخ" });
        }
    };

    const handleSearchSelect = (suggestion: any) => {
        const lat = parseFloat(suggestion.lat);
        const lng = parseFloat(suggestion.lon);
        setCenter([lat, lng]);
        setZoom(16);
        setMapKey(prev => prev + 1);
        setCurrentMarker({ lat, lng });
        setSearchQuery(suggestion.display_name.split(',')[0]);
        setShowSuggestions(false);
    };

    const handleLocationClick = (lat: number, lng: number) => {
        setCenter([lat, lng]);
        setZoom(16);
        setMapKey(prev => prev + 1);
    };

    return (
        <Card className="overflow-hidden border shadow-md bg-white h-full flex flex-col">
            <CardHeader className="py-2 px-3 bg-blue-50/50 border-b shrink-0 pt-[max(0.5rem,env(safe-area-inset-top))]">
                <CardTitle className="text-sm flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span>المواقع المحفوظة</span>
                    </div>
                    <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleQuickSave} disabled={isLocating}>
                            {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                            حفظ موقعي
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={shareAllLocations}>
                            <Share2 className="w-3 h-3" />
                            مشاركة
                        </Button>
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent className="p-0 flex flex-col lg:flex-row flex-1 h-[calc(100%-50px)]">
                {/* Map */}
                <div className="relative w-full lg:w-[70%] h-[400px] lg:h-full border-b lg:border-b-0 lg:border-l">
                    {/* Search Bar */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] flex gap-2 w-[90%] max-w-sm">
                        <Button size="icon" variant="secondary" className="h-9 w-9 bg-white shadow-md" onClick={handleLocateMe}>
                            {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Locate className="w-4 h-4 text-blue-600" />}
                        </Button>
                        <div className="relative flex-1">
                            <Input
                                className="h-9 bg-white shadow-md pr-8 text-right"
                                placeholder="بحث..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                            />
                            <Search className="absolute right-2 top-2.5 w-4 h-4 text-gray-400" />

                            {/* Clear Marker Button */}
                            {currentMarker && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute left-8 top-0 h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                        setCurrentMarker(null);
                                        setMarkerName('');
                                    }}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            )}

                            {showSuggestions && searchSuggestions.length > 0 && (
                                <div className="absolute top-10 left-0 right-0 bg-white rounded-lg shadow-xl z-[1001] max-h-48 overflow-y-auto border">
                                    {searchSuggestions.map((s, i) => (
                                        <div
                                            key={i}
                                            className="p-2 border-b text-right text-xs hover:bg-gray-50 cursor-pointer"
                                            onClick={() => handleSearchSelect(s)}
                                        >
                                            <p className="font-bold">{s.display_name.split(',')[0]}</p>
                                            <p className="text-gray-500 truncate">{s.display_name}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <MapContainer
                        key={mapKey}
                        center={center}
                        zoom={zoom}
                        zoomControl={true}
                        style={{ height: '400px', width: '100%', minHeight: '400px' }}
                        scrollWheelZoom={true}
                        ref={mapRef}
                        whenReady={() => {
                            setTimeout(() => {
                                if (mapRef.current) {
                                    mapRef.current.invalidateSize();
                                }
                            }, 200);
                        }}
                    >
                        <TileLayer
                            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />

                        {/* Current Marker */}
                        {currentMarker && (
                            <Marker position={[currentMarker.lat, currentMarker.lng]}>
                                <Popup>
                                    <div className="text-center p-2 space-y-2 min-w-[200px]">
                                        <p className="font-bold text-xs">📍 موقع جديد</p>
                                        <Input
                                            placeholder="اسم الموقع..."
                                            className="h-7 text-xs text-right"
                                            value={markerName}
                                            onChange={e => setMarkerName(e.target.value)}
                                        />
                                        <div className="flex gap-1 flex-wrap justify-center">
                                            {LOCATION_CATEGORIES.map(cat => (
                                                <div
                                                    key={cat.id}
                                                    onClick={() => setSelectedCategory(cat.id)}
                                                    className={`px-2 py-1 rounded text-xs cursor-pointer border ${selectedCategory === cat.id ? 'bg-blue-100 border-blue-500' : 'bg-gray-50'}`}
                                                >
                                                    {cat.icon}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-1">
                                            <Button size="sm" className="h-7 text-xs flex-1 bg-green-600" onClick={handleSaveMarker}>
                                                حفظ
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={async () => {
                                                const link = generateGoogleMapsLink(currentMarker.lat, currentMarker.lng);
                                                try {
                                                    await Share.share({ title: markerName || 'موقعي', text: `📍 ${markerName || 'موقع محدد'}\n${link}` });
                                                } catch (e) {
                                                    navigator.clipboard.writeText(link);
                                                    toast({ title: "تم نسخ الرابط" });
                                                }
                                            }}>
                                                <Share2 className="w-3 h-3" />
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-7 text-xs flex-1 border-orange-200 text-orange-600" onClick={handleSaveParking}>
                                                🅿️ موقف
                                            </Button>
                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setCurrentMarker(null)}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        )}

                        {/* Saved Locations */}
                        {savedLocations.map((loc: any) => {
                            const lat = typeof loc.lat === 'number' ? loc.lat : parseFloat(loc.lat);
                            const lng = typeof loc.lng === 'number' ? loc.lng : parseFloat(loc.lng);

                            if (isNaN(lat) || isNaN(lng)) return null;

                            return (
                                <Marker key={loc.id} position={[lat, lng]}>
                                    <Popup>
                                        <div className="text-center min-w-[180px]">
                                            <p className="font-bold text-sm mb-1">{getCategoryIcon(loc.category)} {loc.title}</p>
                                            <p className="text-xs text-gray-500 mb-2 truncate">{loc.address}</p>
                                            <div className="flex flex-col gap-2">
                                                <Button
                                                    size="sm"
                                                    className="h-7 text-xs w-full bg-blue-600"
                                                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')}
                                                >
                                                    <Navigation className="w-3 h-3 mr-1" /> انطلق
                                                </Button>
                                                <div className="flex gap-1">
                                                    <Button size="sm" variant="outline" className="h-6 text-xs flex-1" onClick={() => handleLocationClick(lat, lng)}>
                                                        تركيز
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="h-6 text-xs flex-1" onClick={() => {
                                                        setEditingResource(loc);
                                                        setIsEditOpen(true);
                                                    }}>
                                                        <Edit2 className="w-3 h-3" />
                                                    </Button>
                                                    <Button size="sm" variant="destructive" className="h-6 px-2" onClick={() => deleteLocation(loc.id)}>
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </div>

                {/* Locations List */}
                <div className="flex-1 lg:w-[30%] overflow-y-auto bg-gray-50">
                    <div className="p-2 border-b bg-white sticky top-0 flex justify-between items-center z-10">
                        <h3 className="font-bold text-xs">المواقع ({savedLocations.length})</h3>
                        {selectedLocations.size > 0 && (
                            <div className="flex gap-1">
                                <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1 text-red-600 border-red-200" onClick={deleteSelectedLocations}>
                                    <Trash2 className="w-3 h-3" />
                                    حذف ({selectedLocations.size})
                                </Button>
                                <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1" onClick={shareSelectedLocations}>
                                    <Share2 className="w-3 h-3" />
                                    مشاركة
                                </Button>
                            </div>
                        )}
                    </div>
                    {savedLocations.map((loc: any) => (
                        <div
                            key={loc.id}
                            className={`p-3 border-b cursor-pointer flex justify-between items-center group transition-colors ${selectedLocations.has(loc.id) ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`}
                            onClick={() => handleLocationClick(loc.lat, loc.lng)}
                        >
                            <div className="flex items-center gap-2">
                                <div onClick={(e) => { e.stopPropagation(); toggleLocationSelection(loc.id); }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedLocations.has(loc.id)}
                                        readOnly
                                        className="rounded border-gray-300 w-4 h-4 cursor-pointer accent-blue-600"
                                    />
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-blue-700 flex items-center gap-1">
                                        <span>{getCategoryIcon(loc.category)}</span>
                                        <span>{loc.title}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 truncate max-w-[150px]">
                                        {loc.address}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-500 hover:text-blue-700" onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(generateGoogleMapsLink(loc.lat, loc.lng), '_blank');
                                }}>
                                    <Navigation className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400" onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingResource(loc);
                                    setIsEditOpen(true);
                                }}>
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-300 hover:text-red-500" onClick={(e) => {
                                    e.stopPropagation();
                                    deleteLocation(loc.id);
                                }}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {savedLocations.length === 0 && (
                        <div className="p-4 text-center text-xs text-gray-400">
                            لا توجد مواقع محفوظة
                        </div>
                    )}
                </div>
            </CardContent>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-md top-[20%] translate-y-0 text-right" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>تعديل الموقع</DialogTitle>
                    </DialogHeader>
                    {editingResource && (
                        <div className="space-y-3 py-2">
                            <div className="space-y-1">
                                <label className="text-xs font-medium">الاسم</label>
                                <Input
                                    value={editingResource.title}
                                    onChange={e => setEditingResource({ ...editingResource, title: e.target.value })}
                                    className="text-right"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium">التصنيف</label>
                                <div className="flex gap-2 flex-wrap">
                                    {LOCATION_CATEGORIES.map(cat => (
                                        <div
                                            key={cat.id}
                                            onClick={() => setEditingResource({ ...editingResource, category: cat.id })}
                                            className={`p-2 rounded border text-xs cursor-pointer ${editingResource.category === cat.id ? 'bg-blue-100 border-blue-500' : 'bg-gray-50'}`}
                                        >
                                            {cat.icon} {cat.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <DialogFooter className="gap-2 sm:justify-start">
                                <Button size="sm" variant="outline" onClick={() => setIsEditOpen(false)}>إلغاء</Button>
                                <Button size="sm" onClick={async () => {
                                    await updateLocation(editingResource.id, {
                                        title: editingResource.title,
                                        category: editingResource.category
                                    });
                                    toast({ title: "تم التحديث" });
                                    setIsEditOpen(false);
                                }}>حفظ</Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default InteractiveMap;
