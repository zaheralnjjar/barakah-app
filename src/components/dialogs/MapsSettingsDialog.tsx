import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Share2, Edit2, Trash2, CheckSquare, Plus, Globe, Search, X } from 'lucide-react';
import { useLocations } from '@/hooks/useLocations';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Share } from '@capacitor/share';

interface MapsSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function MapsSettingsDialog({ open, onOpenChange }: MapsSettingsDialogProps) {
    const { locations, deleteLocation, updateLocation, saveLocation } = useLocations();
    const { toast } = useToast();
    const [editingResource, setEditingResource] = useState<any | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

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

    const getCategoryIcon = (catId?: string) => {
        return LOCATION_CATEGORIES.find(c => c.id === catId)?.icon || '📍';
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
                address: editingResource.address || ''
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
            for (const id of selectedIds) {
                await deleteLocation(id);
            }
            setSelectedLocations(new Set());
            setIsSelectMode(false);
            toast({ title: 'تم حذف المواقع المحددة' });
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
                                            placeholder="المنزل، العمل..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold block text-right">التصنيف</label>
                                        <select
                                            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                            value={editingResource.category || 'other'}
                                            onChange={(e) => setEditingResource({ ...editingResource, category: e.target.value })}
                                            dir="rtl"
                                        >
                                            {LOCATION_CATEGORIES.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold block text-right">استخراج من رابط جوجل مابس</label>
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
                                        >
                                            <Search className="w-4 h-4" />
                                        </Button>
                                        <Input
                                            value={editingResource.url || ''}
                                            onChange={(e) => setEditingResource({ ...editingResource, url: e.target.value })}
                                            className="text-left"
                                            placeholder="https://maps.google.com/..."
                                            dir="ltr"
                                        />
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
