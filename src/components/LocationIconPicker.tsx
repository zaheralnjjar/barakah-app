
import React from 'react';
import {
    Home, Briefcase, MapPin, ShoppingCart, Utensils,
    Coffee, GraduationCap, Building2, Trees, Car,
    Plane, Heart, Star, Flag, Landmark,
    Music, Camera, Phone, Wrench, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// Define the expanded icon library
export const ICON_LIBRARY = [
    { id: 'home', label: 'منزل', icon: Home, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'work', label: 'عمل', icon: Briefcase, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'mosque', label: 'مسجد', icon: Landmark, color: 'text-emerald-600', bg: 'bg-emerald-50' }, // Landmark as Mosque proxy
    { id: 'market', label: 'سوق', icon: ShoppingCart, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 'restaurant', label: 'مطعم', icon: Utensils, color: 'text-red-500', bg: 'bg-red-50' },
    { id: 'cafe', label: 'مقهى', icon: Coffee, color: 'text-amber-700', bg: 'bg-amber-50' },
    { id: 'school', label: 'مدرسة', icon: GraduationCap, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { id: 'office', label: 'مكتب', icon: Building2, color: 'text-slate-600', bg: 'bg-slate-50' },
    { id: 'park', label: 'منتزه', icon: Trees, color: 'text-green-500', bg: 'bg-green-50' },
    { id: 'parking', label: 'موقف', icon: Car, color: 'text-blue-600', bg: 'bg-blue-100' },
    { id: 'travel', label: 'سفر', icon: Plane, color: 'text-sky-500', bg: 'bg-sky-50' },
    { id: 'health', label: 'صحة', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
    { id: 'favorite', label: 'مفضل', icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-50' },
    { id: 'goal', label: 'هدف', icon: Flag, color: 'text-red-600', bg: 'bg-red-50' },
    { id: 'leisure', label: 'ترفيه', icon: Music, color: 'text-pink-500', bg: 'bg-pink-50' },
    { id: 'photo', label: 'صورة', icon: Camera, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { id: 'contact', label: 'اتصال', icon: Phone, color: 'text-green-600', bg: 'bg-green-50' },
    { id: 'service', label: 'خدمة', icon: Wrench, color: 'text-gray-500', bg: 'bg-gray-100' },
    { id: 'finance', label: 'مالي', icon: Wallet, color: 'text-emerald-700', bg: 'bg-emerald-100' },
    { id: 'other', label: 'آخر', icon: MapPin, color: 'text-gray-400', bg: 'bg-gray-50' },
];

interface LocationIconPickerProps {
    selectedIconId: string;
    onSelect: (iconId: string) => void;
}

export const LocationIconPicker: React.FC<LocationIconPickerProps> = ({ selectedIconId, onSelect }) => {
    const selected = ICON_LIBRARY.find(i => i.id === selectedIconId) || ICON_LIBRARY[ICON_LIBRARY.length - 1]; // Default to 'other'
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className={cn("h-9 gap-2 px-3 min-w-[100px] justify-start", selected.bg, selected.color, "border-opacity-20")}
                >
                    <selected.icon className="w-4 h-4" />
                    <span className="text-xs">{selected.label}</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md p-4" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-right text-sm">اختر أيقونة الموقع</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mt-2">
                    {ICON_LIBRARY.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => {
                                onSelect(item.id);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "flex flex-col items-center justify-center p-2 rounded-xl cursor-pointer transition-all border",
                                selectedIconId === item.id
                                    ? "ring-2 ring-offset-2 ring-blue-500 border-transparent bg-gray-50"
                                    : "border-transparent hover:bg-gray-50 hover:border-gray-200"
                            )}
                        >
                            <div className={cn("p-2 rounded-full mb-1", item.bg, item.color)}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-medium text-gray-600">{item.label}</span>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
};

// Helper to get icon component by ID for display in lists/markers
export const getLocationIconComponent = (id: string) => {
    const item = ICON_LIBRARY.find(i => i.id === id) || ICON_LIBRARY.find(i => i.id === 'other')!;
    return <item.icon className={cn("w-4 h-4", item.color)} />;
};

export const getLocationIconData = (id: string) => {
    return ICON_LIBRARY.find(i => i.id === id) || ICON_LIBRARY.find(i => i.id === 'other')!;
};
