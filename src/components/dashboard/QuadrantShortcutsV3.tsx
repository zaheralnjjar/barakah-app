import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, MapPin, Navigation, Map, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isAndroid } from '@/utils/platformDetection';
import { getActionById } from './QuickActionsGrid';
import { useToast } from '@/hooks/use-toast';

interface QuadrantShortcutsV3Props {
    customShortcuts: string[];
    customLocations: any[];
    onManageShortcuts?: () => void;
    onExecuteShortcut: (id: string) => void;
}

export const QuadrantShortcutsV3: React.FC<QuadrantShortcutsV3Props> = ({
    customShortcuts, customLocations, onManageShortcuts, onExecuteShortcut
}) => {
    const { toast } = useToast();
    const [locName, setLocName] = useState('');
    const [isLoadingLoc, setIsLoadingLoc] = useState(false);

    const handleSaveCurrentLoc = () => {
        if (!navigator.geolocation) {
            toast({ title: 'خطأ', description: 'المتصفح لا يدعم تحديد الموقع', variant: 'destructive' });
            return;
        }
        setIsLoadingLoc(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const url = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
                const name = locName || "موقعي";

                // Save to local storage (or via prop if available)
                const existing = JSON.parse(localStorage.getItem('baraka_custom_locations') || '[]');
                const updated = [{ id: crypto.randomUUID(), name, url }, ...existing];
                localStorage.setItem('baraka_custom_locations', JSON.stringify(updated));

                window.dispatchEvent(new Event('locations-updated'));
                setLocName('');
                setIsLoadingLoc(false);
                toast({ title: 'تم حفظ الموقع بنجاح' });
            },
            (err) => {
                console.error(err);
                setIsLoadingLoc(false);
                toast({ title: 'فشل تحديد الموقع', variant: 'destructive' });
            }
        );
    };

    // Combine locations and shortcuts (Unlimited items, will wrap in grid)
    const allItems = [
        ...customLocations.map(loc => ({ type: 'location', data: loc })),
        ...customShortcuts.map(id => ({ type: 'shortcut', data: id }))
    ];

    if (allItems.length === 0) {
        return null;
    }

    const categories = [
        { id: 'info', name: '📊 رؤى باركة (Insights)', color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'action', name: '⚡ تحكم سريع (Control)', color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: 'smart', name: '🧠 المخطط الذكي (Smart)', color: 'text-pink-600', bg: 'bg-pink-50' }
    ];

    return (
        <Card className="border-rose-100 shadow-sm bg-rose-50/20 overflow-hidden p-3 rounded-[2rem] border-2">
            <div className="space-y-5">


                {/* Locations Grid */}
                {customLocations.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] font-black text-indigo-800 uppercase tracking-tighter">المواقع المحفوظة</span>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {customLocations.map((loc, idx) => (
                                <button
                                    key={`loc-${idx}`}
                                    onClick={() => window.open(loc.url, '_blank')}
                                    className="flex flex-col items-center justify-center rounded-2xl bg-white border-2 border-indigo-50 text-indigo-700 aspect-square p-1 active:scale-95 transition-all shadow-sm group hover:border-indigo-200"
                                >
                                    <div className="flex-1 flex items-center justify-center">
                                        <Navigation className="w-[60%] h-[60%] group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="h-[30%] w-full flex items-center justify-center">
                                        <span className="font-bold text-center leading-none text-[7px] truncate px-0.5">
                                            {loc.name}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Simple Shortcuts Grid (Text-Focused) */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black text-rose-800 uppercase tracking-tighter">الاختصارات المخصصة</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {customShortcuts.map((id, idx) => {
                            const action = getActionById(id);
                            if (!action) return null;
                            const Icon = action.icon;
                            return (
                                <button
                                    key={`shortcut-${idx}`}
                                    onClick={() => onExecuteShortcut(action.id)}
                                    className="flex flex-col items-center justify-center rounded-2xl bg-white border border-rose-100 aspect-square p-2 active:scale-95 transition-all shadow-sm hover:border-rose-300"
                                    title={action.description}
                                >
                                    <span className="font-bold text-center leading-tight text-[10px] text-gray-800 line-clamp-3">
                                        {action.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Card>
    );
};
