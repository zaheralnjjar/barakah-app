import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Share2, Edit2, Trash2, CheckSquare, Plus, Globe, Search, X, Locate, Loader2 } from 'lucide-react';
import { useLocations } from '@/hooks/useLocations';
import { LocationIconPicker, getLocationIconComponent, ICON_LIBRARY } from '@/components/LocationIconPicker';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Share } from '@capacitor/share';
import { cn } from '@/lib/utils';

interface MapsSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialAddMode?: boolean;
}

export function MapsSettingsDialog({ open, onOpenChange, initialAddMode }: MapsSettingsDialogProps) {
    const { locations, deleteLocation, deleteLocations, updateLocation, saveLocation } = useLocations();
    const { toast } = useToast();
    const [editingResource, setEditingResource] = useState<any | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            toast({ title: "المتصفح لا يدعم تحديد الموقع", variant: "destructive" });
            return;
        }

        navigator.geolocation.getCurrentPosition(async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            let addressStr = '';
            let addressSearchStr = '';

            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar&addressdetails=1`);
                const data = await res.json();
                if (data) {
                    addressStr = data.display_name;
                    const addr = data.address || {};
                    const road = addr.road || addr.street || addr.pedestrian || '';
                    const number = addr.house_number || '';

                    let refinedStr = '';
                    if (number) refinedStr = `${road} ${number}`;
                    else {
                        const parts = (data.display_name || '').split(',');
                        const partWithNumber = parts.find((p: string) => /\d/.test(p) && p.includes(road));
                        refinedStr = partWithNumber || road;
                    }
                    addressSearchStr = refinedStr;
                }
            } catch (e) {
                console.error(e);
            }

            setEditingResource((prev: any) => ({
                ...prev,
                lat: lat,
                lng: lng,
                title: prev?.title || 'موقع جديد',
                street_line: addressSearchStr,
                address: addressStr,
                address_search: addressSearchStr,
                url: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
            }));
            toast({ title: "تم تحديد موقعك وملء البيانات تلقائياً" });
        }, (err) => {
            toast({ title: "فشل تحديد الموقع", description: err.message, variant: "destructive" });
        });
    };

    useEffect(() => {
        if (open && initialAddMode) {
            setEditingResource({ category: 'other', lat: 0, lng: 0 });
            setIsEditOpen(true);
            // Phase 6: Automatic locate on open
            handleLocateMe();
        }
    }, [open, initialAddMode]);

    // Sharing State
    const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
    const [isSelectMode, setIsSelectMode] = useState(false);

    const LOCATION_CATEGORIES = [
        { id: 'home', label: 'منزل', icon: '🏠' },
        { id: 'work', label: 'عمل', icon: '💼' },
        { id: 'mosque', label: 'مسجد', icon: '🕌' },
        { id: 'market', label: 'سوق', icon: '🛒' },
        { id: 'restaurant', label: 'مطعم', icon: '🍽️' },
        { id: 'other', label: 'آخر', icon: '📍' },
    ];

    // Helper to get icon
    const getCategoryIcon = (catId?: string) => {
        return getLocationIconComponent(catId || 'other');
    };

    // Google Maps URL Parser
    const parseGoogleMapsUrl = (url: string) => {
        try {
            // Regex for @lat,lng
            const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

            // Regex for q=lat,lng
            const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };

            // Regex for 3d...4d...
            const dMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
            if (dMatch) return { lat: parseFloat(dMatch[1]), lng: parseFloat(dMatch[2]) };

            return null;
        } catch (e) {
            return null;
        }
    };

    const handleSaveLocation = async () => {
        if (!editingResource) return;

        // Validation
        if (!editingResource.title) {
            toast({ title: 'خطأ', description: 'يرجى إدخال اسم الموقع', variant: 'destructive' });
            return;
        }

        if (editingResource.id) {
            // Update
            await updateLocation(editingResource.id, editingResource);
        } else {
            // Create
            if (!editingResource.lat || !editingResource.lng) {
                toast({ title: 'خطأ', description: 'يرجى تحديد الإحداثيات', variant: 'destructive' });
                return;
            }
            await saveLocation(editingResource.title, parseFloat(editingResource.lat), parseFloat(editingResource.lng), {
                category: editingResource.category || 'other',
                address: editingResource.address || '',
                street_line: editingResource.street_line || ''
            });
        }
        setIsEditOpen(false);
        setEditingResource(null);
    };

    const toggleLocationSelection = (id: string) => {
        const next = new Set(selectedLocations);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedLocations(next);
    };

    const handleBulkDelete = async () => {
        const selectedIds = Array.from(selectedLocations);
        if (selectedIds.length === 0) return;

        if (confirm(`هل أنت متأكد من حذف ${selectedIds.length} مواقع؟`)) {
            await deleteLocations(selectedIds);
            setSelectedLocations(new Set());
            setIsSelectMode(false);
        }
    };

    const handleBulkShare = async () => {
        const selected = locations.filter(l => selectedLocations.has(l.id));
        if (selected.length === 0) return;

        const text = selected.map(l => `${l.title}: ${l.url.replace('geo:', 'https://maps.google.com/?q=')}`).join('\n\n');

        try {
            await Share.share({
                title: 'مشاركة المواقع',
                text: text,
            });
        } catch (e) {
            navigator.clipboard.writeText(text);
            toast({ title: 'تم نسخ الروابط' });
        }
        setIsSelectMode(false);
        setSelectedLocations(new Set());
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        إدارة المواقع المحفوظة
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {/* Toolbar */}
                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg sticky top-0 z-10 border-b">
                        <div className="text-sm text-gray-500 font-bold">
                            {locations.length} موقع
                        </div>
                        <div className="flex gap-2">
                            {isSelectMode ? (
                                <>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:bg-gray-200" onClick={() => { setIsSelectMode(false); setSelectedLocations(new Set()); }}>
                                        <X className="w-5 h-5" />
                                    </Button>
                                    <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
                                    <Button size="icon" variant="outline" className="h-8 w-8 text-red-500 hover:bg-red-50 border-red-200" onClick={handleBulkDelete} disabled={selectedLocations.size === 0}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="outline" className="h-8 w-8 text-blue-600 hover:bg-blue-50 border-blue-200" onClick={handleBulkShare} disabled={selectedLocations.size === 0}>
                                        <Share2 className="w-4 h-4" />
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button size="icon" onClick={() => {
                                        setEditingResource({ category: 'other', lat: 0, lng: 0 });
                                        setIsEditOpen(true);
                                    }} className="bg-emerald-600 hover:bg-emerald-700 h-8 w-8 rounded-full shadow-sm">
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:bg-gray-100" onClick={() => setIsSelectMode(true)}>
                                        <CheckSquare className="w-5 h-5" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Compact List - 2 Rows per Item */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {locations.map((loc) => (
                            <div key={loc.id} className={`
                                border rounded-lg p-3 transition-all relative
                                ${selectedLocations.has(loc.id) ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-white hover:bg-gray-50'}
                            `}>
                                {/* Selection Overlay for whole card click in select mode */}
                                {isSelectMode && (
                                    <div
                                        className="absolute inset-0 z-10 cursor-pointer"
                                        onClick={() => toggleLocationSelection(loc.id)}
                                    />
                                )}

                                {/* Row 1: Icon + Title + Selection Checkbox */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="text-lg shrink-0">{getCategoryIcon(loc.category)}</span>
                                        <span className="font-bold text-gray-800 text-sm truncate">{loc.title}</span>
                                    </div>
                                    {isSelectMode && (
                                        <Checkbox
                                            checked={selectedLocations.has(loc.id)}
                                            onCheckedChange={() => toggleLocationSelection(loc.id)}
                                            className="ml-1"
                                        />
                                    )}
                                </div>

                                {/* Row 2: Action Buttons (Icon Only) */}
                                <div className="flex items-center justify-between border-t pt-2 mt-1">
                                    <div className="flex gap-1" dir="ltr">
                                        {/* Actions - specific order using flex-row-reverse if in RTL or just LTR for icons */}
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:bg-green-50" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`, '_blank')}>
                                            <Navigation className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-600 hover:bg-blue-50" onClick={() => {
                                            const url = `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`;
                                            Share.share({ title: loc.title, text: url }).catch(() => navigator.clipboard.writeText(url));
                                        }}>
                                            <Share2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-orange-600 hover:bg-orange-50" onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingResource(loc);
                                            setIsEditOpen(true);
                                        }}>
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:bg-red-50" onClick={(e) => {
                                            e.stopPropagation();
                                            deleteLocation(loc.id);
                                        }}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Edit Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
                        <DialogHeader className="flex flex-row items-center justify-between border-b pb-2 mb-4 space-y-0">
                            <DialogTitle className="text-right text-base font-bold">تعديل تفاصيل الموقع</DialogTitle>
                            <div className="flex gap-2 shrink-0">
                                <Button variant="outline" size="sm" onClick={() => setIsEditOpen(false)} className="h-8 text-xs">إلغاء</Button>
                                <Button size="sm" onClick={handleSaveLocation} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700">
                                    {editingResource?.id ? 'حفظ' : 'إضافة'}
                                </Button>
                            </div>
                        </DialogHeader>

                        {editingResource && (
                            <div className="space-y-5">
                                {/* Auto Locate Section - Most Important */}
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold text-emerald-800">تحديد الموقع التلقائي</p>
                                        <Locate className="w-4 h-4 text-emerald-600 animate-pulse" />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="default"
                                        onClick={handleLocateMe}
                                        className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 transition-all"
                                    >
                                        <Locate className="w-5 h-5" />
                                        تحديث الموقع الحالي الآن
                                    </Button>
                                    <p className="text-[10px] text-emerald-600 text-center font-medium">سيتم ملء الشارع والرقم تلقائياً عند الضغط</p>
                                </div>

                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 pr-1">اسم الموقع</label>
                                        <Input
                                            value={editingResource.title || ''}
                                            onChange={(e) => setEditingResource({ ...editingResource, title: e.target.value })}
                                            className="text-right h-11 bg-gray-50 border-gray-200 focus:bg-white"
                                            placeholder="مثلاً: البيت، العمل، المسجد..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 pr-1">الشارع ورقم المبنى (هام)</label>
                                            <div className="relative">
                                                <Input
                                                    value={editingResource.street_line || ''}
                                                    onChange={(e) => setEditingResource({ ...editingResource, street_line: e.target.value })}
                                                    className={cn(
                                                        "text-right h-11 bg-gray-50 border-gray-200 focus:bg-white pr-9",
                                                        (!editingResource.street_line || !/\d/.test(editingResource.street_line)) && "border-amber-400 bg-amber-50"
                                                    )}
                                                    placeholder="مثلاً: شارع النيل، مبنى 12"
                                                    dir="rtl"
                                                />
                                                <Navigation className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                                            </div>
                                            {(!editingResource.street_line || !/\d/.test(editingResource.street_line)) && (
                                                <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    يرجى التأكد من كتابة رقم المبنى لضمان دقة الموقع
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 pr-1">التصنيف</label>
                                        <div className="grid grid-cols-5 gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100 max-h-40 overflow-y-auto">
                                            {ICON_LIBRARY.map((item) => (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => setEditingResource({ ...editingResource, category: item.id })}
                                                    className={cn(
                                                        "flex flex-col items-center justify-center p-1.5 rounded-lg transition-all border",
                                                        (editingResource.category || 'other') === item.id
                                                            ? "bg-white border-blue-400 shadow-sm ring-1 ring-blue-400"
                                                            : "border-transparent hover:bg-white hover:border-gray-200"
                                                    )}
                                                >
                                                    <div className={cn("p-1.5 rounded-full mb-1", item.bg, item.color)}>
                                                        <item.icon className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-[9px] font-medium text-gray-500 line-clamp-1">{item.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Full Address & Search (Secondary) */}
                                <div className="pt-4 border-t border-gray-100 space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-400 pr-1">العنوان الكامل (تلقائي)</label>
                                        <Input
                                            value={editingResource.address || ''}
                                            readOnly
                                            className="text-right text-[11px] bg-gray-50 border-none text-gray-500 h-auto py-2"
                                            placeholder="يتم تحديده تلقائياً..."
                                        />
                                    </div>

                                    <div className="space-y-1.5 relative">
                                        <label className="text-xs font-bold text-gray-500 pr-1">بحث يدوي بالعنوان</label>
                                        <div className="flex items-center gap-2 border rounded-xl px-3 bg-gray-50 focus-within:bg-white h-11 transition-colors">
                                            <Search className="w-4 h-4 text-gray-400 shrink-0" />
                                            <Input
                                                className="border-0 bg-transparent focus-visible:ring-0 text-right px-0 h-full text-xs"
                                                placeholder="ابحث عن مكان آخر..."
                                                value={editingResource.address_search || ''}
                                                onChange={(e) => {
                                                    const query = e.target.value;
                                                    setEditingResource({ ...editingResource, address_search: query });
                                                    if (query.length >= 3) {
                                                        const resultsDiv = document.getElementById('dialog-search-results-list-settings');
                                                        if (resultsDiv) resultsDiv.innerHTML = '<div class="p-4 text-xs text-center text-gray-400"><Loader2 class="w-4 h-4 animate-spin mx-auto mb-1"/>جاري البحث...</div>';

                                                        const timer = setTimeout(async () => {
                                                            try {
                                                                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&accept-language=ar`);
                                                                const data = await res.json();
                                                                if (resultsDiv) {
                                                                    resultsDiv.innerHTML = '';
                                                                    if (data.length === 0) resultsDiv.innerHTML = '<div class="p-4 text-xs text-center text-gray-400">لا توجد نتائج</div>';
                                                                    data.forEach((item: any) => {
                                                                        const div = document.createElement('div');
                                                                        div.className = 'p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 text-right transition-colors';
                                                                        div.innerHTML = `<div class="font-bold text-sm text-gray-700">${(item.display_name || '').split(',')[0]}</div><div class="text-[10px] text-gray-400 truncate">${item.display_name}</div>`;
                                                                        div.onclick = () => {
                                                                            const latP = parseFloat(item.lat);
                                                                            const lngP = parseFloat(item.lon);
                                                                            const addr = item.address || {};
                                                                            const road = addr.road || addr.street || addr.pedestrian || '';
                                                                            const num = addr.house_number || '';
                                                                            const sStr = road ? (num ? `${road} ${num}` : road) : item.display_name.split(',')[0];
                                                                            setEditingResource(prev => ({
                                                                                ...prev,
                                                                                lat: latP, lng: lngP,
                                                                                street_line: sStr,
                                                                                address: item.display_name,
                                                                                address_search: sStr,
                                                                                url: `https://www.google.com/maps/search/?api=1&query=${latP},${lngP}`
                                                                            }));
                                                                            resultsDiv.innerHTML = '';
                                                                        };
                                                                        resultsDiv.appendChild(div);
                                                                    });
                                                                }
                                                            } catch (e) { }
                                                        }, 500);
                                                        return () => clearTimeout(timer);
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div id="dialog-search-results-list-settings" className="absolute z-20 w-full bg-white border rounded-xl shadow-2xl max-h-60 overflow-y-auto mt-1 empty:hidden"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    );
}
