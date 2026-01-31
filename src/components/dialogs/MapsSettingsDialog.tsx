import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Share2, Edit2, Trash2, CheckSquare, Plus, Globe, Search, X, Locate, Loader2 } from 'lucide-react';
import { useLocations } from '@/hooks/useLocations';
import { LocationIconPicker, getLocationIconComponent } from '@/components/LocationIconPicker';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Share } from '@capacitor/share';

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

    useEffect(() => {
        if (open && initialAddMode) {
            setEditingResource({ category: 'other', lat: 0, lng: 0 });
            setIsEditOpen(true);
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
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-right">تعديل الموقع</DialogTitle>
                        </DialogHeader>
                        {editingResource && (
                            <div className="py-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold block text-right">اسم الموقع</label>
                                        <Input
                                            value={editingResource.title || ''}
                                            onChange={(e) => setEditingResource({ ...editingResource, title: e.target.value })}
                                            className="text-right"
                                            placeholder="المنزل، العمل... (اختياري)"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold block text-right mb-1">التصنيف</label>
                                        <div className="w-full">
                                            <LocationIconPicker
                                                selectedIconId={editingResource.category || 'other'}
                                                onSelect={(iconId) => setEditingResource({ ...editingResource, category: iconId })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold block text-right">تفاصيل العنوان (الشارع، المبنى)</label>
                                    <Input
                                        value={editingResource.street_line || ''}
                                        onChange={(e) => setEditingResource({ ...editingResource, street_line: e.target.value })}
                                        className={`text-right ${(!editingResource.street_line || !/\d/.test(editingResource.street_line)) ? 'border-amber-400 bg-amber-50' : ''}`}
                                        placeholder="شارع الملك فهد، مبنى 5..."
                                        dir="rtl"
                                    />
                                    {(!editingResource.street_line || !/\d/.test(editingResource.street_line)) && (
                                        <p className="text-[10px] text-amber-600 font-bold mt-1">⚠️ يرجى التأكد من كتابة رقم المبنى</p>
                                    )}
                                </div>


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
                                                } catch (e) { console.error(e); }

                                                setEditingResource(prev => ({
                                                    ...prev,
                                                    lat: lat,
                                                    lng: lng,
                                                    // Don't overwrite title if it exists, or suggest generic name if empty
                                                    title: prev.title || 'موقع جديد',
                                                    street_line: addressSearchStr, // Put detailed Addess here
                                                    address: addressStr, // Full raw address string
                                                    address_search: addressSearchStr,
                                                    url: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
                                                }));
                                                toast({ title: "تم تحديد موقعك وملء البيانات تلقائياً" });
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
                                                            const resultsDiv = document.getElementById('dialog-search-results-list-settings');
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
                                                                                const lat = parseFloat(item.lat);
                                                                                const lng = parseFloat(item.lon);
                                                                                const addr = item.address || {};
                                                                                const road = addr.road || addr.street || addr.pedestrian || '';
                                                                                const number = addr.house_number || '';
                                                                                const searchStr = road ? (number ? `${road} ${number}` : road) : item.display_name.split(',')[0];

                                                                                setEditingResource(prev => ({
                                                                                    ...prev,
                                                                                    lat: lat,
                                                                                    lng: lng,
                                                                                    title: prev.title || '', // Keep existing title or empty
                                                                                    street_line: searchStr, // Put detailed address here
                                                                                    address: item.display_name,
                                                                                    address_search: searchStr,
                                                                                    url: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
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
                                                        const resultsDiv = document.getElementById('dialog-search-results-list-settings');
                                                        if (resultsDiv) resultsDiv.innerHTML = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div id="dialog-search-results-list-settings" className="absolute z-10 w-full bg-white border rounded shadow-lg max-h-40 overflow-y-auto mt-1 empty:hidden"></div>
                                    </div>

                                    {/* Link Parsing */}
                                    <div className="space-y-1.5 pt-2 border-t border-gray-100 mt-2">
                                        <label className="text-xs text-gray-500 block text-right">أو الصق رابط خرائط جوجل</label>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="secondary"
                                                onClick={() => {
                                                    const coords = parseGoogleMapsUrl(editingResource.url || '');
                                                    if (coords) {
                                                        setEditingResource({ ...editingResource, lat: coords.lat, lng: coords.lng });
                                                        toast({ title: '✅ تم استخراج الإحداثيات' });
                                                    } else {
                                                        toast({ title: '❌ فشل الاستخراج', description: 'تأكد من الرابط', variant: 'destructive' });
                                                    }
                                                }}
                                                className="bg-gray-200 hover:bg-gray-300 relative top-[1px]"
                                            >
                                                <Search className="w-4 h-4" />
                                            </Button>
                                            <Input
                                                value={editingResource.url || ''}
                                                onChange={(e) => setEditingResource({ ...editingResource, url: e.target.value })}
                                                className="text-left text-xs h-9 bg-white"
                                                placeholder="https://maps.google.com/..."
                                                dir="ltr"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border">
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-500 block">Latitude</label>
                                        <Input
                                            type="number"
                                            value={editingResource.lat || ''}
                                            onChange={(e) => setEditingResource({ ...editingResource, lat: parseFloat(e.target.value) })}
                                            dir="ltr"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-500 block">Longitude</label>
                                        <Input
                                            type="number"
                                            value={editingResource.lng || ''}
                                            onChange={(e) => setEditingResource({ ...editingResource, lng: parseFloat(e.target.value) })}
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                <DialogFooter className="gap-2 pt-4">
                                    <Button variant="outline" onClick={() => setIsEditOpen(false)}>إلغاء</Button>
                                    <Button onClick={handleSaveLocation} className="bg-blue-600 hover:bg-blue-700">
                                        {editingResource.id ? 'حفظ التعديلات' : 'إضافة الموقع'}
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    );
}
