
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getActionById, AVAILABLE_ACTIONS, ACTION_CATEGORIES } from '@/constants/actionDefinitions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useShortcuts } from '@/hooks/useShortcuts';
import { useCustomShortcuts } from '@/hooks/useCustomShortcuts';
import { useLocations } from '@/hooks/useLocations';
import { MapPin, Plus, Trash2, Sparkles, Navigation, Edit, Link, Phone, Zap, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ShortcutCustomizerDialog } from './ShortcutCustomizerDialog';
import type { CustomShortcut } from '@/types/shortcuts';
import { cn } from '@/lib/utils'; // Import cn
import { reverseGeocodeLimit, generateGoogleMapsLink } from '@/utils/locationUtils';

interface ShortcutsSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ShortcutsSettingsDialog: React.FC<ShortcutsSettingsDialogProps> = ({ open, onOpenChange }) => {
    const { toast } = useToast();

    // Custom shortcuts (new system for everything now)
    const {
        shortcuts: customShortcuts,
        addShortcut,
        deleteShortcut
    } = useCustomShortcuts();

    const [editingShortcut, setEditingShortcut] = useState<CustomShortcut | null>(null);
    const [showCustomizerDialog, setShowCustomizerDialog] = useState(false);

    // Use useLocations for location management
    const { locations, saveLocation, deleteLocation } = useLocations();

    // Filter locations to show only those added as 'pinned' or via this dialog
    const pinnedLocations = locations.filter(l => l.category === 'pinned');

    const [newLocName, setNewLocName] = useState('');
    const [newLocUrl, setNewLocUrl] = useState('');
    const [searchAddress, setSearchAddress] = useState('');
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    // Temp state for coords if fetched
    const [tempCoords, setTempCoords] = useState<{ lat: number, lng: number } | null>(null);

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast({ title: 'خطأ', description: 'المتصفح لا يدعم تحديد الموقع', variant: 'destructive' });
            return;
        }
        setIsLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const link = generateGoogleMapsLink(pos.coords.latitude, pos.coords.longitude);
                setNewLocUrl(link);
                setTempCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });

                // Standardized Reverse Geocoding
                if (!newLocName) {
                    setIsLoadingLocation(true);
                    const name = await reverseGeocodeLimit(pos.coords.latitude, pos.coords.longitude);
                    setNewLocName(name);
                    setIsLoadingLocation(false);
                } else {
                    setIsLoadingLocation(false);
                }

                toast({ title: 'تم تحديد الموقع' });
            },
            (err) => {
                console.error(err);
                setIsLoadingLocation(false);
                toast({ title: 'فشل تحديد الموقع', description: 'تأكد من تفعيل الـ GPS', variant: 'destructive' });
            }
        );
    };

    const handleGenerateUrlFromAddress = () => {
        if (!searchAddress) return;
        // Search query link
        const link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchAddress)}`;
        setNewLocUrl(link);
        setTempCoords({ lat: 0, lng: 0 }); // Fallback
        if (!newLocName) setNewLocName(searchAddress);
    };

    const handleAddLocation = async () => {
        if (newLocName) {
            // Priority to tempCoords (from GPS), else 0,0
            const lat = tempCoords?.lat || 0;
            const lng = tempCoords?.lng || 0;

            await saveLocation(newLocName, lat, lng, {
                category: 'pinned', // Use 'pinned' category to identify these
                address: newLocUrl || 'رابط خارجي'
            });

            setNewLocName('');
            setNewLocUrl('');
            setSearchAddress('');
            setTempCoords(null);
            // Toast is handled in saveLocation
        } else {
            toast({ title: 'يرجى إدخال اسم الموقع', variant: 'destructive' });
        }
    };

    const handleAddFunctionShortcut = async (actionId: string, actionName: string, iconName?: string) => {
        try {
            await addShortcut({
                custom_name: actionName,
                custom_icon: iconName || 'Zap', // Use string name or default
                icon_color: 'emerald', // Default styling
                shortcut_type: 'action', // Ensure this maps to legacy execution
                placement: 'shortcuts_grid', // Default placement for dashboard visibility
                click_action_id: actionId,
                order_index: customShortcuts.length
            });
            // Toast is handled in hook
        } catch (e) {
            console.error(e);
            toast({ title: 'خطأ', description: 'فشل إضافة الاختصار', variant: 'destructive' });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="flex items-center gap-2 text-right">
                        <Sparkles className="w-5 h-5 text-emerald-500" />
                        إدارة الاختصارات
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="custom" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-4 pt-2">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="custom">اختصاراتي</TabsTrigger>
                            <TabsTrigger value="locations">المواقع</TabsTrigger>
                            <TabsTrigger value="shortcuts">الوظائف</TabsTrigger>
                        </TabsList>
                    </div>

                    {/* === CUSTOM SHORTCUTS TAB === */}
                    <TabsContent value="custom" className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-gray-700">
                                اختصاراتي المخصصة ({customShortcuts.length})
                            </h4>
                            <Button
                                size="sm"
                                onClick={() => { setEditingShortcut(null); setShowCustomizerDialog(true); }}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                <Plus className="w-4 h-4 ml-1" />
                                جديد
                            </Button>
                        </div>

                        {customShortcuts.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">لم تقم بإنشاء اختصارات مخصصة بعد</p>
                                <p className="text-xs mt-1">اضغط "جديد" لإنشاء اختصار مخصص</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {customShortcuts.map(shortcut => {
                                    const typeIcon = shortcut.shortcut_type === 'url' ? Link
                                        : shortcut.shortcut_type === 'contact' ? Phone
                                            : shortcut.shortcut_type === 'macro' ? Layers
                                                : Zap;
                                    const TypeIcon = typeIcon;
                                    return (
                                        <div key={shortcut.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${shortcut.icon_color || 'gray'}-100 text-${shortcut.icon_color || 'gray'}-600`}>
                                                    <TypeIcon className="w-5 h-5" />
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-gray-700">{shortcut.custom_name}</p>
                                                    <p className="text-[10px] text-gray-400">
                                                        {shortcut.shortcut_type === 'url' ? 'رابط خارجي' :
                                                            shortcut.shortcut_type === 'contact' ? 'جهة اتصال' :
                                                                shortcut.shortcut_type === 'macro' ? 'ماكرو' :
                                                                    shortcut.click_action_id ? getActionById(shortcut.click_action_id)?.name : 'وظيفة'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => { setEditingShortcut(shortcut); setShowCustomizerDialog(true); }}
                                                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0 rounded-full"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={async () => {
                                                        if (confirm('هل أنت متأكد من حذف هذا الاختصار؟')) {
                                                            await deleteShortcut(shortcut.id);
                                                            toast({ title: '🗑️ تم حذف الاختصار' });
                                                        }
                                                    }}
                                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0 rounded-full"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </TabsContent>

                    {/* === LOCATIONS TAB === */}
                    <TabsContent value="locations" className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-emerald-600" />
                                إضافة موقع جديد
                            </h4>

                            <div className="space-y-3">
                                <Input
                                    placeholder="اسم المكان (مثال: العمل، المطعم...)"
                                    value={newLocName}
                                    onChange={(e) => setNewLocName(e.target.value)}
                                    className="h-9 text-right"
                                />

                                <div className="flex flex-col gap-2 bg-white p-2 rounded border border-gray-200">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleGetCurrentLocation}
                                        disabled={isLoadingLocation}
                                        className="w-full text-xs"
                                    >
                                        <MapPin className="w-3 h-3 mr-2" />
                                        {isLoadingLocation ? 'جاري التحديد...' : 'استخدم موقعي الحالي'}
                                    </Button>

                                    <div className="relative">
                                        <Input
                                            placeholder="أو ابحث عن عنوان..."
                                            value={searchAddress}
                                            onChange={(e) => setSearchAddress(e.target.value)}
                                            className="h-8 text-xs pr-8"
                                        />
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={handleGenerateUrlFromAddress}
                                            className="absolute left-1 top-0.5 h-7 px-2 text-xs"
                                        >
                                            <Navigation className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Input
                                        placeholder="رابط الخريطة (اختياري)"
                                        value={newLocUrl}
                                        onChange={(e) => setNewLocUrl(e.target.value)}
                                        className="h-9 text-xs text-left bg-gray-50 flex-1"
                                        dir="ltr"
                                    />
                                    <Button
                                        className="bg-emerald-600 hover:bg-emerald-700 px-4"
                                        onClick={handleAddLocation}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-500">المواقع المثبتة ({pinnedLocations.length})</h4>
                            {pinnedLocations.length === 0 ? (
                                <p className="text-xs text-center text-gray-400 py-4">لا توجد مواقع مثبتة</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    {pinnedLocations.map(loc => (
                                        <div key={loc.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg p-3 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-emerald-50 p-2 rounded-full">
                                                    <MapPin className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-gray-700">{loc.title}</p>
                                                    <p className="text-[10px] text-gray-400 truncate max-w-[150px]" dir="ltr">{loc.address}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => deleteLocation(loc.id)}
                                                className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0 rounded-full"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* === SHORTCUTS TAB (UPDATED TO USE SUPABASE) === */}
                    <TabsContent value="shortcuts" className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-6">
                            {Object.entries(ACTION_CATEGORIES).map(([category, label]) => {
                                const actions = AVAILABLE_ACTIONS.filter(a => a.category === category);
                                if (actions.length === 0) return null;

                                return (
                                    <div key={category}>
                                        <Badge variant="outline" className="mb-3 text-xs px-2 py-0.5 bg-gray-50">
                                            {label}
                                        </Badge>
                                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                            {actions.map(action => {
                                                // Check if this action ID is already present in click_action_id of any custom shortcut
                                                const existingShortcut = customShortcuts.find(s => s.click_action_id === action.id);
                                                const isAdded = !!existingShortcut;
                                                const Icon = action.icon;

                                                return (
                                                    <button
                                                        key={action.id}
                                                        onClick={() => {
                                                            if (!isAdded) {
                                                                handleAddFunctionShortcut(action.id, action.name, (action as any).iconName);
                                                            } else if (existingShortcut) {
                                                                // Optional: Allow removing directly from here?
                                                                // For now, let's keep it additive-focused or toggle
                                                                if (confirm(`هل تريد إزالة ${action.name}؟`)) {
                                                                    deleteShortcut(existingShortcut.id);
                                                                }
                                                            }
                                                        }}
                                                        className={cn(
                                                            "relative flex flex-col items-center justify-center p-2 rounded-xl transition-all border aspect-square",
                                                            isAdded
                                                                ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                                                                : 'bg-white border-gray-200 hover:border-emerald-400 hover:shadow-md hover:-translate-y-0.5'
                                                        )}
                                                    >
                                                        <Icon className={cn("w-6 h-6 mb-2", isAdded ? 'text-emerald-600' : 'text-gray-700')} />
                                                        <span className={cn("text-[10px] font-bold text-center leading-tight line-clamp-2", isAdded ? 'text-emerald-800' : '')}>{action.name}</span>

                                                        <div className="absolute top-1 right-1">
                                                            {isAdded ? (
                                                                <div className="bg-emerald-500 rounded-full p-0.5">
                                                                    <div className="w-2 h-2 bg-white rounded-full" />
                                                                </div>
                                                            ) : (
                                                                <Plus className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="p-3 border-t bg-gray-50 flex justify-end">
                    <Button onClick={() => onOpenChange(false)}>إغلاق</Button>
                </div>
            </DialogContent>

            {/* Shortcut Customizer Dialog */}
            <ShortcutCustomizerDialog
                open={showCustomizerDialog}
                onOpenChange={(open) => {
                    setShowCustomizerDialog(open);
                    if (!open) setEditingShortcut(null);
                }}
                editingShortcut={editingShortcut}
            />
        </Dialog>
    );
};


