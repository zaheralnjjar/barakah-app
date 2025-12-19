import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    MapPin,
    Navigation,
    Share2,
    Edit2,
    Trash2,
    Plus,
    Loader2
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface SavedLocation {
    id: string;
    name: string;
    type: 'area' | 'shop' | 'home' | 'work' | 'other';
    latitude: number;
    longitude: number;
    address?: string;
    createdAt: string;
}

const STORAGE_KEY = 'baraka_saved_locations';

const LocationSaver: React.FC = () => {
    const [locations, setLocations] = useState<SavedLocation[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Add Dialog
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    // Edit Dialog
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<SavedLocation | null>(null);

    // Form State for Add/Edit
    const [formName, setFormName] = useState('');
    const [formType, setFormType] = useState<SavedLocation['type']>('other');
    const [capturedPosition, setCapturedPosition] = useState<GeolocationPosition | null>(null);
    const [approxAddress, setApproxAddress] = useState<string>('');

    const { toast } = useToast();

    // Load saved locations & Initialize with requested defaults if empty
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setLocations(JSON.parse(saved));
            } catch (e) { }
        } else {
            setLocations([]);
        }
    }, [toast]);

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
    }, [locations]);

    const getCurrentLocation = useCallback(async (): Promise<GeolocationPosition> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('المتصفح لا يدعم الموقع'));
                return;
            }
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0,
            });
        });
    }, []);

    const handleQuickSave = async () => {
        setIsLoading(true);
        try {
            const position = await getCurrentLocation();
            setCapturedPosition(position);

            // Default Name strategy
            let initialName = '';

            // Try to get address for name auto-fill
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&accept-language=ar`
                );
                const data = await response.json();

                // Construct a focused address (Street + Number)
                const road = data.address?.road || '';
                const houseNumber = data.address?.house_number || '';
                const suburb = data.address?.suburb || data.address?.neighbourhood || '';

                if (road) {
                    initialName = `${road} ${houseNumber}`.trim();
                } else if (suburb) {
                    initialName = suburb;
                } else {
                    initialName = `موقع ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;
                }

                setApproxAddress(data.display_name || 'العنوان غير متوفر');

            } catch {
                initialName = `موقع ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`;
                setApproxAddress('تعذر جلب العنوان الدقيق');
            }

            setFormName(initialName);
            setFormType('other');
            setIsAddDialogOpen(true);

        } catch (error: any) {
            console.error(error);
            toast({ title: 'خطأ', description: error.message || 'فشل تحديد الموقع', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const confirmSaveLocation = () => {
        if (!capturedPosition || !formName.trim()) return;

        const newLocation: SavedLocation = {
            id: Date.now().toString(),
            name: formName.trim(),
            type: formType,
            latitude: capturedPosition.coords.latitude,
            longitude: capturedPosition.coords.longitude,
            createdAt: new Date().toISOString(),
        };

        setLocations(prev => [newLocation, ...prev]);
        setIsAddDialogOpen(false);
        setCapturedPosition(null);
        toast({ title: '✅ تم حفظ الموقع بنجاح' });
    };

    const startEdit = (loc: SavedLocation, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingLocation(loc);
        setFormName(loc.name);
        setFormType(loc.type);
        setIsEditDialogOpen(true);
    };

    const saveEditLocation = () => {
        if (!editingLocation || !formName.trim()) return;

        setLocations(prev => prev.map(loc =>
            loc.id === editingLocation.id
                ? { ...loc, name: formName.trim(), type: formType }
                : loc
        ));
        setIsEditDialogOpen(false);
        setEditingLocation(null);
        toast({ title: '✅ تم تعديل الموقع' });
    };

    const deleteLocation = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setLocations(prev => prev.filter(loc => loc.id !== id));
        toast({ title: '🗑️ تم الحذف' });
    };

    const navigateTo = (loc: SavedLocation, e?: React.MouseEvent) => {
        e?.stopPropagation();
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`, '_blank');
    };

    const shareLocation = (loc: SavedLocation, e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`;
        if (navigator.share) {
            navigator.share({
                title: loc.name,
                text: `موقعي: ${loc.name}`,
                url: url,
            }).catch(() => { });
        } else {
            navigator.clipboard.writeText(url);
            toast({ title: '📋 تم نسخ الرابط' });
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'area': return 'منطقة';
            case 'shop': return 'متجر';
            case 'home': return 'منزل';
            case 'work': return 'عمل';
            default: return 'آخر';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'area': return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
            case 'shop': return 'bg-orange-100 text-orange-700 hover:bg-orange-200';
            case 'home': return 'bg-green-100 text-green-700 hover:bg-green-200';
            case 'work': return 'bg-purple-100 text-purple-700 hover:bg-purple-200';
            default: return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
        }
    };

    return (
        <Card className="bg-white shadow-sm border-gray-100 h-full">
            <CardHeader className="pb-3 border-b border-gray-50">
                <CardTitle className="arabic-title text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2 text-primary">
                        <MapPin className="w-5 h-5 text-blue-500" />
                        المواقع المحفوظة
                    </span>
                    <Button onClick={handleQuickSave} disabled={isLoading} size="sm" className="h-8 gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 border-0">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        حفظ موقعي
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-4">
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                    {locations.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500 arabic-body text-sm">لا توجد مواقع محفوظة</p>
                            <Button variant="link" onClick={handleQuickSave} className="text-blue-500 mt-2">
                                حفظ موقعي الحالي
                            </Button>
                        </div>
                    ) : (
                        locations.map(loc => (
                            <div
                                key={loc.id}
                                className="group flex flex-col p-3 bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-200 rounded-xl transition-all shadow-sm hover:shadow"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className={`${getTypeColor(loc.type)} w-6 h-6 p-0 flex items-center justify-center rounded-full`}>
                                            <MapPin className="w-3 h-3" />
                                        </Badge>
                                        <span className="arabic-body font-bold text-gray-800">{loc.name}</span>
                                    </div>
                                    <Badge variant="outline" className="text-xs font-normal text-gray-500">
                                        {getTypeLabel(loc.type)}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between gap-2 mt-1">
                                    <div className="flex gap-1">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                                            title="ملاحة"
                                            onClick={(e) => navigateTo(loc, e)}
                                        >
                                            <Navigation className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 text-gray-500 hover:text-green-600 hover:bg-green-50"
                                            title="مشاركة"
                                            onClick={(e) => shareLocation(loc, e)}
                                        >
                                            <Share2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 text-gray-500 hover:text-orange-600 hover:bg-orange-50"
                                            title="تعديل"
                                            onClick={(e) => startEdit(loc, e)}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                        title="حذف"
                                        onClick={(e) => deleteLocation(loc.id, e)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Add/Confirm Dialog */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="arabic-title text-right">تأكيد حفظ الموقع</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            {/* Address Info Display */}
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-2">
                                <p className="text-xs text-blue-600 font-bold mb-1 arabic-body">العنوان التقريبي:</p>
                                <p className="text-sm text-gray-700">{approxAddress}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm arabic-body">اسم المكان (الشارع والرقم)</label>
                                <Input
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="text-right font-medium"
                                    placeholder="اسم المكان"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm arabic-body">التصنيف</label>
                                <Select value={formType} onValueChange={(val: any) => setFormType(val)}>
                                    <SelectTrigger className="w-full flex-row-reverse">
                                        <SelectValue placeholder="اختر التصنيف" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="area" className="flex-row-reverse">منطقة</SelectItem>
                                        <SelectItem value="shop" className="flex-row-reverse">متجر</SelectItem>
                                        <SelectItem value="home" className="flex-row-reverse">منزل</SelectItem>
                                        <SelectItem value="work" className="flex-row-reverse">عمل</SelectItem>
                                        <SelectItem value="other" className="flex-row-reverse">آخر</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={confirmSaveLocation} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold">
                                موافقة وحفظ
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="arabic-title text-right">تعديل الموقع</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm arabic-body">اسم المكان</label>
                                <Input
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="text-right"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm arabic-body">التصنيف</label>
                                <Select value={formType} onValueChange={(val: any) => setFormType(val)}>
                                    <SelectTrigger className="w-full flex-row-reverse">
                                        <SelectValue placeholder="اختر التصنيف" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="area" className="flex-row-reverse">منطقة</SelectItem>
                                        <SelectItem value="shop" className="flex-row-reverse">متجر</SelectItem>
                                        <SelectItem value="home" className="flex-row-reverse">منزل</SelectItem>
                                        <SelectItem value="work" className="flex-row-reverse">عمل</SelectItem>
                                        <SelectItem value="other" className="flex-row-reverse">آخر</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={saveEditLocation} className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white">حفظ التعديلات</Button>
                        </div>
                    </DialogContent>
                </Dialog>

            </CardContent>
        </Card>
    );
};

export default LocationSaver;
