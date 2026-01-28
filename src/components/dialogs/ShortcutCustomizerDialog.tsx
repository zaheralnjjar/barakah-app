/**
 * ShortcutCustomizerDialog.tsx
 * Full-featured shortcut customization dialog with:
 * - Icon picker
 * - Action dropdowns (click & long-press)
 * - Macro support
 * - URL/Contact shortcuts
 * - Live preview
 * - Drag & drop reordering
 */

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useCustomShortcuts } from '@/hooks/useCustomShortcuts';
import { useLocations } from '@/hooks/useLocations';
import { AVAILABLE_ACTIONS, getActionById } from '@/constants/actionDefinitions';
import type { NewCustomShortcut, ShortcutType, ActionPlacement, CustomShortcut } from '@/types/shortcuts';
import {
    Plus, Trash2, GripVertical, Sparkles, Link, Phone, Zap, MousePointer, Hand, Map,
    // Common icons for picker
    Home, Star, Heart, Settings, Calendar, Bell, Mail, Search, User, Camera,
    Clock, MapPin, Music, Globe, Bookmark, AlertCircle, CheckCircle, XCircle,
    Coffee, Car, Plane, Train, Briefcase, ShoppingCart, Gift, Utensils, Smile,
    Cloud, Sun, Moon, Umbrella, Thermometer, Wifi, Battery, Lock, Key, Eye,
    Edit, Save, Download, Upload, Share, Send, Copy, Clipboard, Printer, Folder,
    File, Image, Video, Mic, Volume2, Play, Pause, SkipForward, SkipBack,
    ChevronRight, ChevronLeft, ArrowUp, ArrowDown, RefreshCw, RotateCw, Maximize,
    Minimize, ZoomIn, ZoomOut, Filter, List, Grid, Layers, Box, Package, Target
} from 'lucide-react';

// Icon library for picker - 'none' means text-only display
const ICON_LIBRARY: Record<string, any> = {
    'none': null, // No icon - text only
    'Home': Home, 'Star': Star, 'Heart': Heart, 'Settings': Settings, 'Calendar': Calendar,
    'Bell': Bell, 'Mail': Mail, 'Search': Search, 'User': User, 'Camera': Camera,
    'Clock': Clock, 'MapPin': MapPin, 'Music': Music, 'Globe': Globe, 'Bookmark': Bookmark,
    'AlertCircle': AlertCircle, 'CheckCircle': CheckCircle, 'XCircle': XCircle,
    'Coffee': Coffee, 'Car': Car, 'Plane': Plane, 'Train': Train, 'Briefcase': Briefcase,
    'ShoppingCart': ShoppingCart, 'Gift': Gift, 'Utensils': Utensils, 'Smile': Smile,
    'Cloud': Cloud, 'Sun': Sun, 'Moon': Moon, 'Umbrella': Umbrella, 'Thermometer': Thermometer,
    'Wifi': Wifi, 'Battery': Battery, 'Lock': Lock, 'Key': Key, 'Eye': Eye,
    'Edit': Edit, 'Save': Save, 'Download': Download, 'Upload': Upload, 'Share': Share,
    'Send': Send, 'Copy': Copy, 'Clipboard': Clipboard, 'Printer': Printer, 'Folder': Folder,
    'File': File, 'Image': Image, 'Video': Video, 'Mic': Mic, 'Volume2': Volume2,
    'Play': Play, 'Pause': Pause, 'SkipForward': SkipForward, 'SkipBack': SkipBack,
    'ChevronRight': ChevronRight, 'ChevronLeft': ChevronLeft, 'ArrowUp': ArrowUp,
    'ArrowDown': ArrowDown, 'RefreshCw': RefreshCw, 'RotateCw': RotateCw,
    'Maximize': Maximize, 'Minimize': Minimize, 'ZoomIn': ZoomIn, 'ZoomOut': ZoomOut,
    'Filter': Filter, 'List': List, 'Grid': Grid, 'Layers': Layers, 'Box': Box,
    'Package': Package, 'Target': Target, 'Zap': Zap, 'Sparkles': Sparkles,
    'Link': Link, 'Phone': Phone, 'Map': Map
};

// Color palette for icons
const ICON_COLORS = [
    { name: 'رمادي', value: 'gray', class: 'text-gray-600 bg-gray-100' },
    { name: 'أحمر', value: 'red', class: 'text-red-600 bg-red-100' },
    { name: 'برتقالي', value: 'orange', class: 'text-orange-600 bg-orange-100' },
    { name: 'أصفر', value: 'yellow', class: 'text-yellow-600 bg-yellow-100' },
    { name: 'أخضر', value: 'green', class: 'text-green-600 bg-green-100' },
    { name: 'زمردي', value: 'emerald', class: 'text-emerald-600 bg-emerald-100' },
    { name: 'أزرق', value: 'blue', class: 'text-blue-600 bg-blue-100' },
    { name: 'بنفسجي', value: 'purple', class: 'text-purple-600 bg-purple-100' },
    { name: 'وردي', value: 'pink', class: 'text-pink-600 bg-pink-100' },
];

interface ShortcutCustomizerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingShortcut?: CustomShortcut | null;
}

export const ShortcutCustomizerDialog: React.FC<ShortcutCustomizerDialogProps> = ({
    open, onOpenChange, editingShortcut
}) => {
    const { toast } = useToast();
    const { shortcuts, addShortcut, updateShortcut, deleteShortcut, reorderShortcuts } = useCustomShortcuts();
    const { locations } = useLocations();

    // Form State
    const [shortcutType, setShortcutType] = useState<ShortcutType>(editingShortcut?.shortcut_type || 'action');
    const [customName, setCustomName] = useState(editingShortcut?.custom_name || '');
    const [customIcon, setCustomIcon] = useState(editingShortcut?.custom_icon || 'Star');
    const [iconColor, setIconColor] = useState(editingShortcut?.icon_color || 'emerald');
    const [clickActionId, setClickActionId] = useState(editingShortcut?.click_action_id || '');
    const [longPressActionId, setLongPressActionId] = useState(editingShortcut?.long_press_action_id || '');
    const [url, setUrl] = useState(editingShortcut?.url || '');
    const [placement, setPlacement] = useState<ActionPlacement>(editingShortcut?.placement || 'shortcuts_grid');

    // Navigation specific state
    const [navLat, setNavLat] = useState<string>(editingShortcut?.location_lat?.toString() || '');
    const [navLng, setNavLng] = useState<string>(editingShortcut?.location_lng?.toString() || '');
    const [selectedLocationId, setSelectedLocationId] = useState<string>(''); // For dropdown selection

    const [showIconPicker, setShowIconPicker] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    const [actionSearch, setActionSearch] = useState('');

    // Filtered icons
    const filteredIcons = useMemo(() => {
        const search = iconSearch.toLowerCase();
        return Object.entries(ICON_LIBRARY).filter(([name]) =>
            name.toLowerCase().includes(search)
        );
    }, [iconSearch]);

    // Filtered actions
    const filteredActions = useMemo(() => {
        const search = actionSearch.toLowerCase();
        return AVAILABLE_ACTIONS.filter(a =>
            a.name.toLowerCase().includes(search) ||
            a.description.toLowerCase().includes(search)
        );
    }, [actionSearch]);

    // Get current icon component (null means no icon)
    const CurrentIcon = customIcon === 'none' ? null : (ICON_LIBRARY[customIcon] || Star);
    const colorClass = ICON_COLORS.find(c => c.value === iconColor)?.class || 'text-gray-600 bg-gray-100';

    // Reset form
    const resetForm = () => {
        setShortcutType('action');
        setCustomName('');
        setCustomIcon('Star');
        setIconColor('emerald');
        setClickActionId('');
        setLongPressActionId('');
        setUrl('');
        setPlacement('shortcuts_grid');
    };

    // Save handler
    const handleSave = async () => {
        if (!customName.trim()) {
            toast({ title: 'خطأ', description: 'يرجى إدخال اسم الاختصار', variant: 'destructive' });
            return;
        }

        const shortcutData: NewCustomShortcut = {
            custom_name: customName.trim(),
            custom_icon: customIcon,
            icon_color: iconColor,
            // Map specific actions to legacy types for execution compatibility
            shortcut_type:
                (shortcutType === 'action' && clickActionId === 'navigate_to_location') ? 'navigation' :
                    (shortcutType === 'action' && clickActionId === 'save_parking') ? 'save_parking' :
                        (shortcutType === 'action' && clickActionId === 'save_location_current') ? 'save_location' :
                            shortcutType,
            placement,
            click_action_id: clickActionId || undefined,
            long_press_action_id: longPressActionId || undefined,
            url: shortcutType === 'url' ? url : undefined,
            location_lat: (shortcutType === 'action' && clickActionId === 'navigate_to_location') && navLat ? parseFloat(navLat) : undefined,
            location_lng: (shortcutType === 'action' && clickActionId === 'navigate_to_location') && navLng ? parseFloat(navLng) : undefined,
            order_index: editingShortcut?.order_index ?? shortcuts.length
        };

        if (editingShortcut) {
            await updateShortcut(editingShortcut.id, shortcutData);
        } else {
            await addShortcut(shortcutData);
        }

        resetForm();
        onOpenChange(false);
    };


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="p-4 border-b bg-gradient-to-r from-emerald-50 to-blue-50">
                    <DialogTitle className="flex items-center gap-2 text-right">
                        <Sparkles className="w-5 h-5 text-emerald-500" />
                        {editingShortcut ? 'تعديل الاختصار' : 'إنشاء اختصار جديد'}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-6" dir="rtl">
                    {/* Live Preview */}
                    <div className="flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-dashed border-gray-200">
                        <div className="flex flex-col items-center gap-2">
                            {CurrentIcon ? (
                                <div className={cn(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center shadow-md transition-all duration-300",
                                    colorClass
                                )}>
                                    <CurrentIcon className="w-8 h-8" />
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300 bg-white">
                                    <span className="text-xs text-gray-400">بدون أيقونة</span>
                                </div>
                            )}
                            <span className="text-sm font-bold text-gray-700">
                                {customName || 'اسم الاختصار'}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                <span className="flex items-center gap-1">
                                    <MousePointer className="w-3 h-3" />
                                    {shortcutType === 'url' ? 'فتح الرابط' : (clickActionId ? getActionById(clickActionId)?.name : 'ضغطة')}
                                </span>
                                <span>|</span>
                                <span className="flex items-center gap-1">
                                    <Hand className="w-3 h-3" />
                                    {longPressActionId ? getActionById(longPressActionId)?.name : 'ضغط مطول'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Shortcut Type Selector */}
                    <div className="space-y-2">
                        <Label className="text-sm font-bold">نوع الاختصار</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { type: 'action' as ShortcutType, icon: Zap, label: 'وظيفة' },
                                { type: 'url' as ShortcutType, icon: Link, label: 'رابط' },
                            ].map(({ type, icon: Icon, label }) => (
                                <button
                                    key={type}
                                    onClick={() => setShortcutType(type)}
                                    className={cn(
                                        "flex flex-col items-center p-3 rounded-xl border transition-all",
                                        shortcutType === type
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                    )}
                                >
                                    <Icon className="w-5 h-5 mb-1" />
                                    <span className="text-xs font-medium">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Name & Icon */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold">الاسم</Label>
                            <Input
                                placeholder="اسم الاختصار"
                                value={customName}
                                onChange={e => setCustomName(e.target.value)}
                                className="text-right"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold">الأيقونة</Label>
                            <button
                                onClick={() => setShowIconPicker(!showIconPicker)}
                                className={cn(
                                    "w-full h-10 rounded-lg border flex items-center justify-center gap-2 transition-all",
                                    showIconPicker ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"
                                )}
                            >
                                {CurrentIcon ? (
                                    <>
                                        <div className={cn("w-6 h-6 rounded flex items-center justify-center", colorClass)}>
                                            <CurrentIcon className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm text-gray-600">{customIcon}</span>
                                    </>
                                ) : (
                                    <span className="text-sm text-gray-400">بدون أيقونة (نص فقط)</span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Icon Picker */}
                    {showIconPicker && (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3 animate-in fade-in slide-in-from-top-2">
                            {/* No Icon Option */}
                            <button
                                onClick={() => { setCustomIcon('none'); setShowIconPicker(false); }}
                                className={cn(
                                    "w-full p-2 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2",
                                    customIcon === 'none'
                                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                )}
                            >
                                <XCircle className="w-4 h-4" />
                                بدون أيقونة (نص فقط)
                            </button>

                            <Input
                                placeholder="ابحث عن أيقونة..."
                                value={iconSearch}
                                onChange={e => setIconSearch(e.target.value)}
                                className="h-8 text-sm"
                            />
                            <div className="flex gap-1 flex-wrap">
                                {ICON_COLORS.map(c => (
                                    <button
                                        key={c.value}
                                        onClick={() => setIconColor(c.value)}
                                        className={cn(
                                            "w-6 h-6 rounded-full border-2 transition-all",
                                            c.class,
                                            iconColor === c.value ? "border-gray-800 scale-110" : "border-transparent"
                                        )}
                                        title={c.name}
                                    />
                                ))}
                            </div>
                            <ScrollArea className="h-40">
                                <div className="grid grid-cols-8 gap-1">
                                    {filteredIcons.filter(([name]) => name !== 'none').map(([name, Icon]) => (
                                        <button
                                            key={name}
                                            onClick={() => { setCustomIcon(name); setShowIconPicker(false); }}
                                            className={cn(
                                                "p-2 rounded-lg transition-all hover:bg-white hover:shadow-sm",
                                                customIcon === name && "bg-white shadow-sm ring-2 ring-emerald-500"
                                            )}
                                            title={name}
                                        >
                                            <Icon className="w-5 h-5 text-gray-600" />
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    {/* Action Type Forms */}
                    {shortcutType === 'action' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Click Action */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold flex items-center gap-1">
                                        <MousePointer className="w-3 h-3" />
                                        عند الضغط
                                    </Label>
                                    <Select value={clickActionId} onValueChange={setClickActionId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر وظيفة..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <div className="p-2">
                                                <Input
                                                    placeholder="بحث..."
                                                    value={actionSearch}
                                                    onChange={e => setActionSearch(e.target.value)}
                                                    className="h-8 mb-2"
                                                />
                                            </div>
                                            <ScrollArea className="h-48">
                                                {filteredActions.map(action => {
                                                    const Icon = action.icon;
                                                    return (
                                                        <SelectItem key={action.id} value={action.id}>
                                                            <div className="flex items-center gap-2">
                                                                <Icon className="w-4 h-4" />
                                                                <span>{action.name}</span>
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </ScrollArea>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Long Press Action */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold flex items-center gap-1">
                                        <Hand className="w-3 h-3" />
                                        عند الضغط المطول
                                    </Label>
                                    <Select value={longPressActionId} onValueChange={setLongPressActionId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="اختر وظيفة..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <ScrollArea className="h-48">
                                                {AVAILABLE_ACTIONS.map(action => {
                                                    const Icon = action.icon;
                                                    return (
                                                        <SelectItem key={action.id} value={action.id}>
                                                            <div className="flex items-center gap-2">
                                                                <Icon className="w-4 h-4" />
                                                                <span>{action.name}</span>
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </ScrollArea>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Location Picker for Navigation Action */}
                            {clickActionId === 'navigate_to_location' && (
                                <div className="space-y-4 pt-4 border-t mt-4 border-emerald-100">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-emerald-700">اختر الوجهة (الموقع المحفوظ)</Label>
                                        <Select onValueChange={(val) => {
                                            const loc = locations.find(l => l.id === val);
                                            if (loc) {
                                                setNavLat(loc.lat.toString());
                                                setNavLng(loc.lng.toString());
                                                setCustomName(`ملاحة إلى: ${loc.title}`);
                                                setCustomIcon('Car');
                                            }
                                        }}>
                                            <SelectTrigger className="border-emerald-300 bg-emerald-50">
                                                <SelectValue placeholder="اختر موقعاً..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {locations.map(loc => (
                                                    <SelectItem key={loc.id} value={loc.id}>
                                                        {loc.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-gray-400">خط العرض</Label>
                                            <Input value={navLat} onChange={e => setNavLat(e.target.value)} className="h-8 text-xs font-mono" dir="ltr" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-gray-400">خط الطول</Label>
                                            <Input value={navLng} onChange={e => setNavLng(e.target.value)} className="h-8 text-xs font-mono" dir="ltr" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Task and URL forms are handled below */}

                    {/* URL Form */}
                    {shortcutType === 'url' && (
                        <div className="space-y-2">
                            <Label className="text-sm font-bold flex items-center gap-1">
                                <Link className="w-3 h-3" />
                                الرابط
                            </Label>
                            <Input
                                placeholder="https://example.com"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                className="text-left"
                                dir="ltr"
                            />
                            <div className="space-y-2 mt-4">
                                <Label className="text-sm font-bold flex items-center gap-1">
                                    <Hand className="w-3 h-3" />
                                    وظيفة الضغط المطول
                                </Label>
                                <Select value={longPressActionId} onValueChange={setLongPressActionId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر وظيفة..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <ScrollArea className="h-40">
                                            {AVAILABLE_ACTIONS.map(action => {
                                                const Icon = action.icon;
                                                return (
                                                    <SelectItem key={action.id} value={action.id}>
                                                        <div className="flex items-center gap-2">
                                                            <Icon className="w-4 h-4" />
                                                            <span>{action.name}</span>
                                                        </div>
                                                    </SelectItem>
                                                );
                                            })}
                                        </ScrollArea>
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-xs text-gray-400">الضغط العادي يفتح الرابط، والمطول ينفذ الوظيفة المحددة</p>
                        </div>
                    )}




                    {/* Placement */}
                    <div className="space-y-2">
                        <Label className="text-sm font-bold">مكان الظهور</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setPlacement('quick_access')}
                                className={cn(
                                    "p-3 rounded-xl border text-sm font-medium transition-all",
                                    placement === 'quick_access'
                                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                )}
                            >
                                الوصول السريع
                            </button>
                            <button
                                onClick={() => setPlacement('shortcuts_grid')}
                                className={cn(
                                    "p-3 rounded-xl border text-sm font-medium transition-all",
                                    placement === 'shortcuts_grid'
                                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                )}
                            >
                                شبكة الاختصارات
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 flex justify-between">
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
                            إلغاء
                        </Button>
                        {editingShortcut && (
                            <Button
                                variant="destructive"
                                onClick={async () => {
                                    if (confirm('هل أنت متأكد من حذف هذا الاختصار؟')) {
                                        await deleteShortcut(editingShortcut.id);
                                        resetForm();
                                        onOpenChange(false);
                                        toast({ title: '🗑️ تم حذف الاختصار' });
                                    }
                                }}
                            >
                                <Trash2 className="w-4 h-4 ml-1" />
                                حذف
                            </Button>
                        )}
                    </div>
                    <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="w-4 h-4 ml-2" />
                        {editingShortcut ? 'حفظ التعديلات' : 'إنشاء الاختصار'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog >
    );
};

export default ShortcutCustomizerDialog;
