
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserSettings, FABButtonConfig } from '@/hooks/useUserSettings';
import { AVAILABLE_ACTIONS, ACTION_CATEGORIES } from '@/constants/actionDefinitions';
import * as LucideIcons from 'lucide-react';
import { LucideIcon, Settings2, Sparkles, SlidersHorizontal, MousePointerClick, Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FABSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const AVAILABLE_ICONS = [
    'MapPin', 'StickyNote', 'AlertTriangle', 'Calendar', 'DollarSign', 'Target',
    'Users', 'GraduationCap', 'Search', 'Briefcase', 'Timer', 'Wallet',
    'Heart', 'Pill', 'Bell', 'Mic', 'Navigation', 'Zap', 'Moon', 'Calculator',
    'Plus', 'Trash2', 'Clock', 'Coffee', 'Droplets', 'Brain', 'Phone', 'Link', 'LayoutGrid'
];

const COLORS = [
    { name: 'أخضر', value: 'bg-green-500' },
    { name: 'أزرق', value: 'bg-blue-500' },
    { name: 'أصفر', value: 'bg-yellow-500' },
    { name: 'أحمر', value: 'bg-red-500' },
    { name: 'برتقالي', value: 'bg-orange-500' },
    { name: 'بنفسجي', value: 'bg-purple-500' },
    { name: 'نيلي', value: 'bg-indigo-500' },
    { name: 'زمردي', value: 'bg-emerald-500' },
];

export const FABSettingsDialog: React.FC<FABSettingsDialogProps> = ({ open, onOpenChange }) => {
    const { fabConfig, saveFabConfig } = useUserSettings();
    const [localConfig, setLocalConfig] = useState(fabConfig);
    const [activeButtonIndex, setActiveButtonIndex] = useState(0);

    const handleUpdate = (updates: Partial<FABButtonConfig>) => {
        const newButtons = [...localConfig.buttons];
        newButtons[activeButtonIndex] = { ...newButtons[activeButtonIndex], ...updates };
        setLocalConfig({ buttons: newButtons });
    };

    const handleSave = async () => {
        await saveFabConfig(localConfig);
        onOpenChange(false);
    };

    const currentButton = localConfig.buttons[activeButtonIndex];
    const IconComponent = (LucideIcons as any)[currentButton.icon] || LucideIcons.HelpCircle;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-primary" />
                        تخصيص الأزرار السريعة (FAB)
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Button Selector */}
                    <div className="flex justify-around items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        {localConfig.buttons.map((btn, idx) => {
                            const BtnIcon = (LucideIcons as any)[btn.icon] || LucideIcons.HelpCircle;
                            return (
                                <button
                                    key={btn.id}
                                    onClick={() => setActiveButtonIndex(idx)}
                                    className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center transition-all relative",
                                        btn.color,
                                        "text-white shadow-lg",
                                        activeButtonIndex === idx ? "ring-4 ring-primary ring-offset-2 scale-110" : "opacity-60 scale-90"
                                    )}
                                >
                                    <BtnIcon className="w-6 h-6" />
                                    <span className="absolute -top-1 -right-1 bg-white text-gray-800 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-gray-200">
                                        {idx + 1}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Customization Details */}
                    <div className="space-y-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm transition-all">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-emerald-500" />
                            <h3 className="font-bold text-gray-800">تعديل الزر {activeButtonIndex + 1}</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Icon Selection */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                                    <SlidersHorizontal className="w-3 h-3" /> اختيار الأيقونة
                                </label>
                                <div className="grid grid-cols-5 gap-2 border p-2 rounded-xl">
                                    {AVAILABLE_ICONS.map(iconName => {
                                        const Icon = (LucideIcons as any)[iconName];
                                        return (
                                            <button
                                                key={iconName}
                                                onClick={() => handleUpdate({ icon: iconName })}
                                                className={cn(
                                                    "p-2 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors",
                                                    currentButton.icon === iconName ? "bg-primary/10 text-primary border border-primary/20" : "text-gray-500"
                                                )}
                                            >
                                                <Icon className="w-5 h-5" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Color Selection */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500">لون الزر</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {COLORS.map(color => (
                                        <button
                                            key={color.value}
                                            onClick={() => handleUpdate({ color: color.value })}
                                            className={cn(
                                                "h-10 rounded-xl transition-all border-2",
                                                color.value,
                                                currentButton.color === color.value ? "border-black scale-105" : "border-transparent opacity-80"
                                            )}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100 my-2" />

                        {/* Actions Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Tap Action */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                                    <MousePointerClick className="w-3 h-3 text-blue-500" /> وظيفة النقرة (Tap)
                                </label>
                                <Select
                                    value={currentButton.tapAction}
                                    onValueChange={(val) => handleUpdate({ tapAction: val })}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="اختر الوظيفة" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(ACTION_CATEGORIES).filter(([id]) => id !== 'alias').map(([catId, catName]) => (
                                            <SelectGroup key={catId}>
                                                <SelectLabel className="text-primary font-bold bg-primary/5 py-1 px-2 rounded-md mb-1 text-[10px]">
                                                    {catName}
                                                </SelectLabel>
                                                {AVAILABLE_ACTIONS
                                                    .filter(a => a.category === catId)
                                                    .map(action => (
                                                        <SelectItem key={action.id} value={action.id}>
                                                            <div className="flex items-center gap-2">
                                                                <action.icon className="w-4 h-4 text-gray-400" />
                                                                <span className="text-sm">{action.name}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))
                                                }
                                            </SelectGroup>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Long Press Action */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                                    <Fingerprint className="w-3 h-3 text-red-500" /> وظيفة الضغط المطول
                                </label>
                                <Select
                                    value={currentButton.longPressAction}
                                    onValueChange={(val) => handleUpdate({ longPressAction: val })}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="اختر الوظيفة" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="voice_note" className="font-bold border-b mb-1">
                                            <div className="flex items-center gap-2">
                                                <LucideIcons.Mic className="w-4 h-4 text-red-500" />
                                                <span>تسجيل صوتي (افتراضي)</span>
                                            </div>
                                        </SelectItem>
                                        {Object.entries(ACTION_CATEGORIES).filter(([id]) => id !== 'alias').map(([catId, catName]) => (
                                            <SelectGroup key={catId}>
                                                <SelectLabel className="text-primary font-bold bg-primary/5 py-1 px-2 rounded-md mb-1 text-[10px]">
                                                    {catName}
                                                </SelectLabel>
                                                {AVAILABLE_ACTIONS
                                                    .filter(a => a.category === catId)
                                                    .map(action => (
                                                        <SelectItem key={action.id} value={action.id}>
                                                            <div className="flex items-center gap-2">
                                                                <action.icon className="w-4 h-4 text-gray-400" />
                                                                <span className="text-sm">{action.name}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))
                                                }
                                            </SelectGroup>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
                        <Button className="bg-primary hover:bg-primary/90 px-8" onClick={handleSave}>حفظ التغييرات</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
