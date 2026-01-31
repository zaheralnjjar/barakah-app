import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLocations, LocationFolder } from '@/hooks/useLocations';
import {
    MapPin, Search, Locate, Loader2, Share2, Edit2, Trash2,
    Navigation, X, Car, Plus, Folder, Map as MapIcon, RotateCcw,
    MoreVertical, ChevronUp, Layers, ArrowUpDown, Target
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Share } from '@capacitor/share';
import { generateGoogleMapsLink, reverseGeocodeLimit } from '@/utils/locationUtils';
import { LocationIconPicker, getLocationIconComponent } from './LocationIconPicker';
import { isAndroid } from '@/utils/platformDetection';
import { useLongPress } from '@/hooks/useLongPress';
import { motion, AnimatePresence } from 'framer-motion';

// Fix Leaflet icons
if (typeof window !== 'undefined') {
    try {
        // @ts-ignore
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
    } catch (e) { console.warn('Leaflet icon fix failed', e); }
}

const MECCA_COORDS: [number, number] = [21.422487, 39.826206];

// Helper for map center updates in "Add Mode"
const CenterMonitor = ({ onCenterChange }: { onCenterChange: (center: L.LatLng) => void }) => {
    const map = useMap();
    useMapEvents({
        move: () => {
            onCenterChange(map.getCenter());
        },
        moveend: () => {
            onCenterChange(map.getCenter());
        }
    });
    return null;
};

// Fix for blank map tiles: Forces Leaflet to re-calculate container size
const MapRealigner = () => {
    const map = useMap();
    useEffect(() => {
        const timeout = setTimeout(() => {
            map.invalidateSize();
        }, 100);
        return () => clearTimeout(timeout);
    }, [map]);
    return null;
};

// Update map view when center/zoom changes
const MapUpdater = ({ center, zoom }: { center: [number, number], zoom: number }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
};

const InteractiveMap = () => {
    const { toast } = useToast();
    const {
        locations: savedLocations,
        folders,
        createFolder,
        deleteFolder,
        saveLocation,
        deleteLocation,
        updateLocation,
        saveParking
    } = useLocations();

    // Map State
    const [center, setCenter] = useState<[number, number]>([-34.6037, -58.3816]); // Buenos Aires
    const [zoom, setZoom] = useState(13);
    const [mapKey, setMapKey] = useState(0);
    const mapRef = useRef<L.Map | null>(null);

    // UI State
    const [isLocating, setIsLocating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [activeSheet, setActiveSheet] = useState(false);

    // Adding/Editing State
    const [isAddingMode, setIsAddingMode] = useState(false); // New "Pin Picker" mode
    const [tempLocation, setTempLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [newLocationTitle, setNewLocationTitle] = useState('');
    const [newLocationCategory, setNewLocationCategory] = useState('other');
    const [newLocationFolder, setNewLocationFolder] = useState<string | undefined>(undefined);

    // Sorting State
    const [sortBy, setSortBy] = useState<'date' | 'distance'>('date');

    // Dialogs
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<any>(null);
    const [isRoutePlannerOpen, setIsRoutePlannerOpen] = useState(false);
    const [routePoints, setRoutePoints] = useState<any[]>([]);
    const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768 || isAndroid());
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Initial Geolocation
    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                if (!isNaN(latitude) && !isNaN(longitude)) {
                    setUserLocation({ lat: latitude, lng: longitude });
                    setCenter([latitude, longitude]);
                    setZoom(15);
                    setMapKey(prev => prev + 1);
                    if (!tempLocation) setTempLocation({ lat: latitude, lng: longitude });
                }
            },
            () => console.log('Geolocation init error'),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }, []);

    // Distance Calculator
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return 99999999;
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // in metres
    };

    // Sorted Locations
    const getSortedLocations = (locs: typeof savedLocations) => {
        if (sortBy === 'date') {
            return [...locs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        if (sortBy === 'distance' && userLocation) {
            return [...locs].sort((a, b) => {
                const distA = getDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
                const distB = getDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
                return distA - distB;
            });
        }
        return locs;
    };

    const sortedLocations = useMemo(() => getSortedLocations(savedLocations), [savedLocations, sortBy, userLocation]);

    // Smart Search
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                // Priority: Argentina (local)
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&accept-language=es&addressdetails=1&countrycodes=ar`;
                const res = await fetch(url);
                let data = await res.json();

                if (data.length === 0) {
                    const globalUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&accept-language=es&addressdetails=1`;
                    const globalRes = await fetch(globalUrl);
                    data = await globalRes.json();
                }
                setSearchSuggestions(data);
                setShowSuggestions(data.length > 0);
            } catch (e) {
                console.log('Search error:', e);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // --- Smart Button Logic ---
    const handleSmartButtonPress = useLongPress({
        onLongPress: async () => {
            if (!navigator.geolocation) return;
            setIsLocating(true);
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const { latitude, longitude } = pos.coords;
                if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
                const timeStr = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                await saveParking({ lat: latitude, lng: longitude, name: `Estacionamiento ${timeStr}` });
                setIsLocating(false);
            }, () => setIsLocating(false));
        },
        onClick: () => {
            if (isAddingMode) return; // Disable sheet toggle in adding mode
            setActiveSheet(!activeSheet);
        },
        ms: 600
    });

    const enterAddingMode = () => {
        setActiveSheet(false);
        setIsAddingMode(true);
        setNewLocationTitle('');
        setNewLocationCategory('other');

        // Auto-center on user location if available
        if (userLocation) {
            setCenter([userLocation.lat, userLocation.lng]);
            setZoom(18);
            setTempLocation(userLocation);
        } else if (mapRef.current) {
            const c = mapRef.current.getCenter();
            setTempLocation({ lat: c.lat, lng: c.lng });
            // Try to fetch location if missing
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(pos => {
                    const { latitude, longitude } = pos.coords;
                    setCenter([latitude, longitude]);
                    setZoom(18);
                    setTempLocation({ lat: latitude, lng: longitude });
                    setUserLocation({ lat: latitude, lng: longitude });
                });
            }
        }
    };

    const saveNewLocation = async () => {
        if (!tempLocation) return;

        let title = newLocationTitle;
        if (!title.trim()) {
            title = 'Ubicación seleccionada';
            // Try to auto-name if empty
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${tempLocation.lat}&lon=${tempLocation.lng}&accept-language=es`);
                const data = await res.json();
                if (data.address?.road) title = data.address.road;
            } catch (e) { }
        }

        await saveLocation(title, tempLocation.lat, tempLocation.lng, {
            category: newLocationCategory as any,
            folder_id: newLocationFolder
        });

        setIsAddingMode(false);
        setNewLocationTitle('');
        toast({ title: 'Ubicación guardada correctamente' });
    };

    return (
        <div className="relative w-full h-[calc(100vh-140px)] min-h-[500px] bg-gray-100 overflow-hidden rounded-xl border border-gray-200 shadow-sm md:mr-[260px] mr-0 transition-all duration-300">
            {/* 1. Full Screen Map */}
            <MapContainer
                key={mapKey}
                center={center}
                zoom={zoom}
                zoomControl={!isMobile}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
                ref={mapRef}
            >
                <MapRealigner />
                <MapUpdater center={center} zoom={zoom} />
                <TileLayer
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                />

                {/* Center Monitor for Add Mode */}
                {isAddingMode && <CenterMonitor onCenterChange={(c) => setTempLocation({ lat: c.lat, lng: c.lng })} />}

                {/* User Location Marker */}
                {!isAddingMode && userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={new L.Icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    })}>
                        <Popup>
                            <div className="text-center">
                                <span className="font-bold text-sm">موقعك الحالي</span>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Existing Markers */}
                {!isAddingMode && savedLocations.filter(l => l.lat && l.lng).map(loc => (
                    <Marker key={loc.id} position={[loc.lat, loc.lng]}>
                        <Popup>
                            <div className="text-center min-w-[150px]">
                                <div className="flex items-center justify-center gap-1 mb-1 font-bold">
                                    {getLocationIconComponent(loc.category)}
                                    <span className="text-sm">{loc.title}</span>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <Button size="sm" className="flex-1 h-7 text-xs bg-blue-600"
                                        onClick={() => window.open(loc.url, '_blank')}>
                                        <Navigation className="w-3 h-3 mr-1" /> الذهاب
                                    </Button>
                                    <Button size="sm" variant="destructive" className="h-7 w-7 p-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('هل أنت متأكد من حذف هذا الموقع؟')) {
                                                deleteLocation(loc.id);
                                            }
                                        }}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* --- Add Mode UI: Center Pin & Bottom Panel --- */}
            {isAddingMode && (
                <>
                    {/* Fixed Center Pin */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] pointer-events-none pb-8">
                        <MapPin className="w-10 h-10 text-red-600 fill-red-600 drop-shadow-2xl" />
                        <div className="w-2 h-2 bg-black/50 rounded-full mx-auto mt-1 blur-[1px]" />
                    </div>

                    {/* Top Cancel Button */}
                    <div className="absolute top-4 left-4 z-[1000]">
                        <Button variant="secondary" className="rounded-full shadow-lg h-9 text-xs" onClick={() => setIsAddingMode(false)}>
                            <X className="w-4 h-4 mr-1" /> إلغاء
                        </Button>
                    </div>

                    {/* Locate Me Button (Specific for Add Mode) */}
                    <div className="absolute bottom-[340px] right-4 z-[1000]">
                        <Button
                            size="icon"
                            className="h-10 w-10 rounded-full shadow-lg bg-white text-gray-700 hover:bg-blue-50 border border-gray-100"
                            onClick={() => {
                                if (navigator.geolocation) {
                                    navigator.geolocation.getCurrentPosition((pos) => {
                                        const { latitude, longitude } = pos.coords;
                                        setCenter([latitude, longitude]);
                                        setZoom(18);
                                        setTempLocation({ lat: latitude, lng: longitude });
                                    });
                                }
                            }}
                        >
                            <Target className="w-5 h-5 text-blue-600" />
                        </Button>
                    </div>

                    {/* Bottom Edit/Save Panel */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] p-6 z-[2000] animate-in slide-in-from-bottom-20 duration-300">
                        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-center mb-4 text-gray-800">تحديد موقع جديد</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">اسم المكان</label>
                                <Input
                                    placeholder="مثال: المنزل، العمل..."
                                    value={newLocationTitle}
                                    onChange={e => setNewLocationTitle(e.target.value)}
                                    className="bg-gray-50 border-gray-200 focus:ring-blue-500 text-right"
                                    dir="rtl"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3" dir="rtl">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">التصنيف</label>
                                    <div className="flex gap-2 p-1 bg-gray-50 rounded-md border border-gray-200 h-10 items-center px-2">
                                        <LocationIconPicker
                                            selectedIconId={newLocationCategory}
                                            onSelect={setNewLocationCategory}
                                        />
                                        <span className="text-xs text-gray-500 mr-auto">اختر</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 mb-1 block">المجلد</label>
                                    <select
                                        className="w-full h-10 rounded-md border border-gray-200 bg-gray-50 text-sm p-2 outline-none focus:ring-2 focus:ring-blue-500 text-right"
                                        value={newLocationFolder || ''}
                                        onChange={e => setNewLocationFolder(e.target.value || undefined)}
                                        dir="rtl"
                                    >
                                        <option value="">بدون مجلد</option>
                                        {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <Button className="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all mt-2" onClick={saveNewLocation}>
                                <MapPin className="w-4 h-4 mr-2" /> حفظ الموقع
                            </Button>
                            <p className="text-[10px] text-center text-gray-400 mt-2">
                                قم بتحريك الخريطة لتحديد الموقع بدقة
                            </p>
                        </div>
                    </div>
                </>
            )}

            {/* --- Regular UI (Hidden in Add Mode) --- */}
            {!isAddingMode && (
                <>
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 p-4 pt-[max(1rem,env(safe-area-inset-top))] z-[1000] pointer-events-none flex flex-col items-center gap-2">
                        <div className="pointer-events-auto w-full max-w-md relative shadow-lg rounded-full bg-white flex items-center px-4 h-12">
                            <Search className="w-5 h-5 text-gray-400 ml-2" />
                            <input
                                className="flex-1 h-full outline-none text-right bg-transparent"
                                placeholder="بحث..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onFocus={() => setShowSuggestions(true)}
                                dir="rtl"
                            />
                        </div>
                        {/* Suggestions List... (Same as before) */}
                        {showSuggestions && searchSuggestions.length > 0 && (
                            <div className="pointer-events-auto w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden mt-1 border">
                                {searchSuggestions.map((s, i) => (
                                    <div key={i} className="p-3 border-b hover:bg-gray-50 cursor-pointer text-right flex justify-between items-center"
                                        onClick={() => {
                                            const lat = parseFloat(s.lat);
                                            const lon = parseFloat(s.lon);
                                            setCenter([lat, lon]);
                                            setZoom(16);
                                            setShowSuggestions(false);
                                            setSearchQuery('');
                                        }}>
                                        <span className="text-gray-500 text-xs truncate max-w-[200px]">{s.display_name}</span>
                                        <span className="font-bold text-sm">{s.display_name.split(',')[0]}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Smart Button (Left) */}
                    <div className="absolute bottom-8 left-4 z-[999]">
                        <motion.button
                            {...handleSmartButtonPress}
                            whileTap={{ scale: 0.9 }}
                            className={`h-14 w-14 rounded-full shadow-2xl flex items-center justify-center border-4 border-white transition-colors ${handleSmartButtonPress.isPressed ? 'bg-orange-500' : 'bg-blue-600'}`}
                        >
                            {handleSmartButtonPress.isPressed ? <Car className="w-7 h-7 text-white" /> : <MapIcon className="w-7 h-7 text-white" />}
                        </motion.button>
                    </div>

                    {/* Locate Me Button (Right - Stacked) */}
                    <div className="absolute bottom-24 right-4 z-[999]">
                        <Button
                            size="icon"
                            className="h-10 w-10 rounded-full shadow-lg bg-white text-gray-700 hover:bg-blue-50 border border-gray-100"
                            onClick={() => {
                                if (navigator.geolocation) {
                                    setIsLocating(true);
                                    navigator.geolocation.getCurrentPosition((pos) => {
                                        const { latitude, longitude } = pos.coords;
                                        setCenter([latitude, longitude]);
                                        setZoom(16);
                                        setUserLocation({ lat: latitude, lng: longitude });
                                        setIsLocating(false);
                                        toast({ title: "موقعك الحالي" });
                                    }, () => {
                                        setIsLocating(false);
                                        toast({ title: "تعذر تحديد الموقع", variant: "destructive" });
                                    });
                                }
                            }}
                        >
                            {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Target className="w-5 h-5" />}
                        </Button>
                    </div>

                    {/* Route Button (Right - Bottom) */}
                    <div className="absolute bottom-8 right-4 z-[999]">
                        <Button
                            size="icon"
                            className="h-12 w-12 rounded-full shadow-xl bg-white text-gray-700 hover:bg-gray-50"
                            onClick={() => setIsRoutePlannerOpen(true)}
                        >
                            <Navigation className="w-6 h-6" />
                        </Button>
                    </div>
                </>
            )}

            {/* Bottom Sheet (Locations Manager) */}
            <Sheet open={activeSheet} onOpenChange={setActiveSheet}>
                <SheetContent side="bottom" className="h-[75%] rounded-t-[2rem] bg-gray-50 border-t-0 p-0 overflow-hidden outline-none shadow-2xl">
                    <SheetHeader className="p-5 bg-white border-b flex flex-row items-center justify-between space-y-0 sticky top-0 z-10">
                        <div className="flex gap-2 items-center">
                            {/* New: Sort Button */}
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSortBy(prev => prev === 'date' ? 'distance' : 'date')}>
                                <ArrowUpDown className={`w-4 h-4 ${sortBy === 'distance' ? 'text-blue-600' : 'text-gray-400'}`} />
                            </Button>
                            <span className="text-[10px] text-gray-400 font-medium">
                                {sortBy === 'date' ? 'Por fecha' : 'Cerca de mí'}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* New: Add Button (Opens Add Mode) */}
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-8 px-3 gap-1 shadow-md shadow-blue-200" onClick={enterAddingMode}>
                                <Plus className="w-4 h-4" /> Agregar
                            </Button>

                            <Button size="sm" variant="outline" className="rounded-full h-8 px-3 gap-1 border-gray-200" onClick={() => setIsFolderDialogOpen(true)}>
                                <Folder className="w-3.5 h-3.5" /> Carpeta
                            </Button>
                        </div>
                    </SheetHeader>

                    <Tabs defaultValue="all" className="h-full flex flex-col bg-gray-50">
                        <div className="px-4 py-3 bg-white border-b">
                            <TabsList className="w-full justify-start flex-wrap h-auto gap-2 bg-transparent p-0">
                                <TabsTrigger value="all" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white bg-gray-100 text-gray-600 rounded-full px-4 text-xs h-7 border border-transparent shadow-none">Todos</TabsTrigger>
                                {folders.map(f => (
                                    <TabsTrigger key={f.id} value={f.id} className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 bg-white border border-gray-200 text-gray-600 rounded-full px-4 text-xs h-7 shadow-none">
                                        {f.name}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-3">
                            <TabsContent value="all" className="mt-0 space-y-3">
                                {sortedLocations.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400 text-sm">No hay ubicaciones guardadas</div>
                                ) : (
                                    sortedLocations.map(loc => (
                                        <LocationItem key={loc.id} loc={loc} onDelete={deleteLocation} onNavigate={() => window.open(loc.url)} onEdit={() => { setEditingResource(loc); setIsEditOpen(true); }} />
                                    ))
                                )}
                            </TabsContent>

                            {folders.map(f => (
                                <TabsContent key={f.id} value={f.id} className="mt-0 space-y-3">
                                    <div className="flex justify-between items-center px-1 mb-2">
                                        <span className="text-xs text-gray-400">{sortedLocations.filter(l => l.folder_id === f.id).length} ubicaciones</span>
                                        <Button size="sm" variant="ghost" className="h-6 text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deleteFolder(f.id)}>Checking Carpeta</Button>
                                    </div>
                                    {sortedLocations.filter(l => l.folder_id === f.id).map(loc => (
                                        <LocationItem key={loc.id} loc={loc} onDelete={deleteLocation} onNavigate={() => window.open(loc.url)} onEdit={() => { setEditingResource(loc); setIsEditOpen(true); }} />
                                    ))}
                                </TabsContent>
                            ))}
                        </div>
                    </Tabs>
                </SheetContent>
            </Sheet>

            {/* Helper Dialogs */}
            <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Crear Carpeta</DialogTitle></DialogHeader>
                    <Input placeholder="Nombre (ej. Gimnasio)" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} />
                    <DialogFooter>
                        <Button onClick={() => { createFolder(newFolderName); setIsFolderDialogOpen(false); setNewFolderName(''); }}>Crear</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Simplified Edit Dialog (For Editing existing) */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Editar Detalles</DialogTitle></DialogHeader>
                    {editingResource && (
                        <div className="space-y-4">
                            <Input value={editingResource.title} onChange={e => setEditingResource({ ...editingResource, title: e.target.value })} />
                            <select
                                className="w-full p-2 border rounded"
                                value={editingResource.folder_id || ''}
                                onChange={e => setEditingResource({ ...editingResource, folder_id: e.target.value || null })}
                            >
                                <option value="">Sin Carpeta</option>
                                {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                            <DialogFooter>
                                <Button onClick={async () => {
                                    await updateLocation(editingResource.id, {
                                        title: editingResource.title,
                                        folder_id: editingResource.folder_id
                                    });
                                    setIsEditOpen(false);
                                }}>Actualizar</Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Route Planner Dialog */}
            <Dialog open={isRoutePlannerOpen} onOpenChange={setIsRoutePlannerOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Planificar Ruta</DialogTitle></DialogHeader>
                    <p className="text-sm text-gray-500">Selecciona los puntos de parada:</p>
                    <div className="max-h-[300px] overflow-y-auto space-y-1">
                        {savedLocations.map(loc => (
                            <div key={loc.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${routePoints.find(p => p.id === loc.id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}
                                onClick={() => {
                                    if (routePoints.find(p => p.id === loc.id)) setRoutePoints(prev => prev.filter(p => p.id !== loc.id));
                                    else setRoutePoints(prev => [...prev, loc]);
                                }}>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${routePoints.find(p => p.id === loc.id) ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                                    {routePoints.find(p => p.id === loc.id) && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                                <span className="text-sm font-medium">{loc.title}</span>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button className="w-full bg-blue-600" onClick={() => {
                            if (routePoints.length < 1) return;
                            const destination = routePoints[routePoints.length - 1];
                            const waypoints = routePoints.slice(0, -1).map(p => `${p.lat},${p.lng}`).join('|');
                            const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&waypoints=${waypoints}`;
                            window.open(url, '_blank');
                        }} disabled={routePoints.length === 0}>
                            Ver Ruta en Google Maps
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

// Component for List Item
const LocationItem = ({ loc, onDelete, onNavigate, onEdit }: any) => (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all">
        <div className="flex items-center gap-3 overflow-hidden" onClick={onNavigate}>
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-600">
                {getLocationIconComponent(loc.category)}
            </div>
            <div className="flex flex-col overflow-hidden text-right">
                <span className="font-bold text-sm truncate text-gray-800">{loc.title}</span>
                <span className="text-[10px] text-gray-400 truncate">{loc.street_line || loc.address || 'Ubicación guardada'}</span>
            </div>
        </div>
        <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full" onClick={onEdit}>
                <Edit2 className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full" onClick={() => {
                if (confirm('هل أنت متأكد من حذف هذا الموقع؟')) onDelete(loc.id);
            }}>
                <Trash2 className="w-4 h-4" />
            </Button>
        </div>
    </div>
);

export default InteractiveMap;
