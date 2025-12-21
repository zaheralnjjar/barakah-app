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
    CheckSquare
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
    onSave: (addressName: string) => void;
    onShare: (pos: L.LatLng) => void;
}

function LocationMarker({ position, setPosition, onSave, onShare }: LocationMarkerProps) {
    const [addressName, setAddressName] = useState('');
    const { toast } = useToast();

    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, map.getZoom());

            // Reverse geocode to get address
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&accept-language=ar`)
                .then(res => res.json())
                .then(data => {
                    const addr = data.address || {};
                    const name = addr.road || addr.suburb || addr.city || data.display_name?.split(',')[0] || 'موقع جديد';
                    const number = addr.house_number || '';
                    setAddressName(number ? `${name} ${number}` : name);
                })
                .catch(() => setAddressName('موقع جديد'));
        },
    });

    return position ? (
        <Marker position={position}>
            <Popup>
                <div className="flex flex-col gap-2 p-1 min-w-[140px]">
                    <p className="text-xs font-bold text-center mb-1">{addressName || 'الموقع المحدد'}</p>
                    <div className="flex gap-2 justify-center">
                        <Button size="sm" onClick={() => onSave(addressName)} className="h-7 text-xs bg-blue-600 hover:bg-blue-700">
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

    const { toast } = useToast();

    // Load saved locations
    useEffect(() => {
        loadLocations();
    }, []);

    const loadLocations = () => {
        const data = JSON.parse(localStorage.getItem('baraka_resources') || '[]');
        setSavedLocations(data);
    };

    const getCategoryIcon = (category: string) => {
        return LOCATION_CATEGORIES.find(c => c.id === category)?.icon || '📍';
    };

    const saveLocation = (addressName: string) => {
        if (!newItem.location) return;

        const [lat, lng] = newItem.location.split(',').map(s => s.trim());

        const newRes = {
            id: Date.now().toString(),
            title: addressName || 'موقع جديد',
            url: `geo:${lat},${lng}`,
            category: selectedCategory
        };

        const updated = [...savedLocations, newRes];
        localStorage.setItem('baraka_resources', JSON.stringify(updated));
        setSavedLocations(updated);

        toast({ title: `تم حفظ ${getCategoryIcon(selectedCategory)} ${addressName}` });
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

                const newRes = {
                    id: Date.now().toString(),
                    title: addressName,
                    url: `geo:${latitude},${longitude}`,
                    category: 'other'
                };
                const updated = [...savedLocations, newRes];
                localStorage.setItem('baraka_resources', JSON.stringify(updated));
                setSavedLocations(updated);

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
        localStorage.setItem('baraka_resources', JSON.stringify(updated));
        setSavedLocations(updated);
        toast({ title: "تم تحديث الاسم" });
        setIsEditOpen(false);
        setEditingResource(null);
    };

    const deleteLocation = (id: string) => {
        const updated = savedLocations.filter((i: any) => i.id !== id);
        localStorage.setItem('baraka_resources', JSON.stringify(updated));
        setSavedLocations(updated);
        selectedLocations.delete(id);
        setSelectedLocations(new Set(selectedLocations));
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
                {/* 60/40 Split Layout */}
                <div className="flex flex-col lg:flex-row h-[70vh] min-h-[400px]">
                    {/* Map Section - 60% */}
                    <div className="lg:w-[60%] w-full h-[50%] lg:h-full relative z-0">
                        <MapContainer
                            center={mapCenter}
                            zoom={13}
                            zoomControl={true}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <ChangeView center={mapCenter} zoom={15} />
                            <TileLayer
                                attribution='&copy; OpenStreetMap contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {/* Current selection marker */}
                            <LocationMarker
                                position={newItem.location ? { lat: parseFloat(newItem.location.split(',')[0]), lng: parseFloat(newItem.location.split(',')[1]) } : null}
                                setPosition={(pos) => {
                                    setNewItem({ ...newItem, location: `${pos.lat}, ${pos.lng}` });
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
                                const coords = loc.url.replace('geo:', '').split(',');
                                const lat = parseFloat(coords[0]);
                                const lng = parseFloat(coords[1]);
                                return (
                                    <Marker key={loc.id} position={[lat, lng]}>
                                        <Popup>
                                            <div className="text-center">
                                                <p className="font-bold">{getCategoryIcon(loc.category)} {loc.title}</p>
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

                        {/* Search overlay on map */}
                        <div className="absolute top-2 left-2 right-2 z-[1000] flex gap-2">
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
                        </div>
                    </div>

                    {/* Locations List Section - 40% */}
                    <div className="lg:w-[40%] w-full h-[50%] lg:h-full border-t lg:border-t-0 lg:border-l bg-gray-50 flex flex-col">
                        {/* List Header */}
                        <div className="p-3 bg-white border-b flex justify-between items-center">
                            <span className="font-bold text-sm">📍 المواقع ({savedLocations.length})</span>
                            <div className="flex gap-1">
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={quickSaveMyLocation} disabled={isLocating}>
                                    {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                    <span className="mr-1">حفظ موقعي</span>
                                </Button>
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div className="p-2 bg-white border-b flex gap-1 overflow-x-auto">
                            <Button
                                size="sm"
                                variant={selectedCategory === 'all' ? 'default' : 'ghost'}
                                className="h-6 text-xs shrink-0"
                                onClick={() => setSelectedCategory('all')}
                            >الكل</Button>
                            {LOCATION_CATEGORIES.map(cat => (
                                <Button
                                    key={cat.id}
                                    size="sm"
                                    variant={selectedCategory === cat.id ? 'default' : 'ghost'}
                                    className="h-6 text-xs shrink-0"
                                    onClick={() => setSelectedCategory(cat.id)}
                                >{cat.icon}</Button>
                            ))}
                        </div>

                        {/* Locations List */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            <div className="border-t bg-white">
                                <div className="p-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b flex justify-between items-center">
                                    <span>المواقع المحفوظة ({savedLocations.length})</span>
                                    {savedLocations.length > 0 && (
                                        <Button
                                            size="sm"
                                            variant={isSelectMode ? "default" : "ghost"}
                                            className="h-6 text-xs gap-1"
                                            onClick={() => {
                                                if (isSelectMode && selectedLocations.size > 0) {
                                                    shareSelectedLocations();
                                                } else {
                                                    setIsSelectMode(!isSelectMode);
                                                    setSelectedLocations(new Set());
                                                }
                                            }}
                                        >
                                            {isSelectMode && selectedLocations.size > 0 ? (
                                                <>
                                                    <Share2 className="w-3 h-3" />
                                                    مشاركة ({selectedLocations.size})
                                                </>
                                            ) : (
                                                <>
                                                    <CheckSquare className="w-3 h-3" />
                                                    {isSelectMode ? 'إلغاء' : 'تحديد'}
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                                <div className="max-h-[200px] overflow-y-auto">
                                    {savedLocations.map((res: any) => (
                                        <div
                                            key={res.id}
                                            className={`flex items-center gap-2 p-2 border-b hover:bg-blue-50 transition-colors ${selectedLocations.has(res.id) ? 'bg-blue-50' : ''
                                                }`}
                                        >
                                            {isSelectMode && (
                                                <Checkbox
                                                    checked={selectedLocations.has(res.id)}
                                                    onCheckedChange={() => toggleSelectLocation(res.id)}
                                                    className="shrink-0"
                                                />
                                            )}
                                            <button
                                                className="flex items-center gap-2 flex-1 text-right min-w-0"
                                                onClick={() => {
                                                    if (isSelectMode) {
                                                        toggleSelectLocation(res.id);
                                                    } else if (res.url.startsWith('geo:')) {
                                                        const [lat, lng] = res.url.replace('geo:', '').split(',').map(Number);
                                                        setMapCenter([lat, lng]);
                                                        setNewItem({ name: res.title, location: `${lat}, ${lng}` });
                                                        toast({ title: "تم الانتقال للموقع", description: res.title });
                                                    }
                                                }}
                                            >
                                                <div className="bg-blue-100 p-1.5 rounded-full shrink-0">
                                                    <MapPin className="w-3 h-3 text-blue-600" />
                                                </div>
                                                <span className="font-medium text-sm text-gray-800 truncate">{res.title}</span>
                                            </button>
                                            {!isSelectMode && (
                                                <div className="flex gap-0.5 shrink-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-blue-400 hover:text-blue-600"
                                                        onClick={() => {
                                                            const url = `https://www.google.com/maps/search/?api=1&query=${res.url.replace('geo:', '')}`;
                                                            if (navigator.share) {
                                                                navigator.share({ title: res.title, url }).catch(() => { });
                                                            } else {
                                                                navigator.clipboard.writeText(url);
                                                                toast({ title: "تم نسخ الرابط" });
                                                            }
                                                        }}
                                                    >
                                                        <Share2 className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-orange-400 hover:text-orange-600"
                                                        onClick={() => {
                                                            setEditingResource(res);
                                                            setIsEditOpen(true);
                                                        }}
                                                    >
                                                        <Edit2 className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-red-400 hover:text-red-600"
                                                        onClick={() => deleteLocation(res.id)}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {savedLocations.length === 0 && (
                                        <p className="text-center text-gray-400 py-6 text-sm">
                                            لا توجد مواقع محفوظة
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>

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
        </Card>
    );
};

export default InteractiveMap;
