import React, { useState } from 'react';
import { Calculator, Briefcase, Calendar, Home, Moon, MapPin, Settings, Send, FileText, Save, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuickNotes } from '@/hooks/useQuickNotes';
import { useToast } from '@/hooks/use-toast';

interface SideNavBarProps {
    activeTab: string;
    onNavigate: (tab: string) => void;
    onLongPress?: (tab: string) => void;
    onSync?: () => void;
    onOpenReports?: () => void;
    onOpenNotes?: () => void;
}

const SideNavBar: React.FC<SideNavBarProps> = ({ activeTab, onNavigate, onLongPress, onSync, onOpenReports, onOpenNotes }) => {
    const { addNote } = useQuickNotes();
    const { toast } = useToast();
    const [isNotePopoverOpen, setIsNotePopoverOpen] = useState(false);
    const [quickTitle, setQuickTitle] = useState('');
    const [quickContent, setQuickContent] = useState('');

    const navItems = [
        { id: 'dashboard', label: 'الرئيسية', icon: Home, isHome: true },
        { id: 'finance', label: 'المالية', icon: Calculator },
        { id: 'productivity', label: 'الإنتاجية', icon: Briefcase },
        { id: 'calendar', label: 'التقويم', icon: Calendar },
        { id: 'prayer', label: 'الصلاة', icon: Moon },
        { id: 'map', label: 'الخريطة', icon: MapPin },
        { id: 'settings', label: 'الإعدادات', icon: Settings },
    ];

    // Refs for long press
    const pressTimer = React.useRef<NodeJS.Timeout | null>(null);
    const isLongPress = React.useRef(false);

    const handleStart = (id: string) => {
        isLongPress.current = false;
        pressTimer.current = setTimeout(() => {
            isLongPress.current = true;
            if (navigator.vibrate) navigator.vibrate(50);
            if (onLongPress) onLongPress(id);
        }, 500);
    };

    const handleEnd = (id: string, isHome: boolean) => {
        if (pressTimer.current) clearTimeout(pressTimer.current);
        if (!isLongPress.current) {
            onNavigate(id);
        } else if (isLongPress.current) {
            if (isHome && onLongPress) {
                onLongPress('home_summary');
            } else if (id === 'settings' && onLongPress) {
                onLongPress('settings_sync');
            } else if (id === 'calendar' && onLongPress) {
                onLongPress('calendar_weekly');
            }
        }
        setTimeout(() => {
            isLongPress.current = false;
        }, 100);
    };

    const handleSaveQuickNote = async () => {
        if (!quickContent.trim() && !quickTitle.trim()) return;

        // Save to 'General' folder (id: 'general' is usually a virtual ID, so we might pass undefined or handle it logic)
        // Looking at useQuickNotes, 'addNote' takes folderId as last arg. 
        // If we want it in "General", we usually pass undefined (which means no specific folder, hence General) 
        // OR if 'general' is an actual ID in DB. Usually 'null' is general.
        // Let's pass undefined to be safe as per previous code analysis.

        await addNote(quickContent, 'quick', quickTitle, false, undefined);

        setQuickTitle('');
        setQuickContent('');
        setIsNotePopoverOpen(false);
        toast({ title: 'تم حفظ الملاحظة السريعة ✅' });
    };

    return (
        <TooltipProvider delayDuration={200}>
            <nav className="fixed right-0 top-0 h-full w-16 bg-white/95 backdrop-blur-lg border-l border-gray-200 shadow-lg z-[9999] flex flex-col items-center py-4 gap-2">
                {/* Logo/Brand at top - Click to Sync */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={onSync}
                            className="w-10 h-10 bg-gradient-to-br from-primary to-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-md hover:scale-105 active:scale-95 transition-transform"
                        >
                            <span className="text-white text-lg font-bold">ب</span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg">
                        مزامنة البيانات
                    </TooltipContent>
                </Tooltip>

                {/* Nav Items */}
                <div className="flex-1 flex flex-col items-center gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id || (item.isHome && activeTab === 'dashboard');

                        return (
                            <Tooltip key={item.id}>
                                <TooltipTrigger asChild>
                                    <button
                                        onMouseDown={() => handleStart(item.id)}
                                        onMouseUp={() => handleEnd(item.id, !!item.isHome)}
                                        onMouseLeave={() => {
                                            if (pressTimer.current) clearTimeout(pressTimer.current);
                                        }}
                                        onTouchStart={() => handleStart(item.id)}
                                        onTouchEnd={() => handleEnd(item.id, !!item.isHome)}
                                        onContextMenu={(e) => e.preventDefault()}
                                        className={`
                                            w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200
                                            ${isActive
                                                ? 'bg-primary/15 text-primary shadow-sm'
                                                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                                            }
                                            active:scale-95
                                        `}
                                    >
                                        <Icon className="w-6 h-6" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg">
                                    {item.label}
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </div>

                {/* Quick Note Popover */}
                <Popover open={isNotePopoverOpen} onOpenChange={setIsNotePopoverOpen}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <PopoverTrigger asChild>
                                <button
                                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 text-purple-500 hover:bg-purple-50 active:scale-95 mb-2"
                                >
                                    <FileText className="w-6 h-6" />
                                </button>
                            </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg">
                            ملاحظة سريعة
                        </TooltipContent>
                    </Tooltip>

                    <PopoverContent side="left" className="w-80 p-0 mr-2" align="end">
                        <div className="flex flex-col h-[300px]">
                            <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
                                <h4 className="font-bold text-sm text-gray-700">ملاحظة سريعة (عام)</h4>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onOpenNotes?.()} // Keep ability to open full manager
                                    className="h-6 text-xs text-blue-600 px-2"
                                >
                                    فتح الكل
                                </Button>
                            </div>
                            <div className="p-3 flex-1 flex flex-col gap-3">
                                <Input
                                    placeholder="العنوان"
                                    value={quickTitle}
                                    onChange={(e) => setQuickTitle(e.target.value)}
                                    className="text-right font-medium"
                                />
                                <Textarea
                                    placeholder="اكتب ملاحظتك هنا..."
                                    value={quickContent}
                                    onChange={(e) => setQuickContent(e.target.value)}
                                    className="flex-1 text-right resize-none"
                                />
                            </div>
                            <div className="p-2 border-t bg-gray-50 flex gap-2">
                                <Button
                                    onClick={handleSaveQuickNote}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    size="sm"
                                >
                                    <Save className="w-4 h-4 ml-1" />
                                    حفظ
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Send Report Button - Bottom */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={onOpenReports}
                            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 text-blue-500 hover:bg-blue-50 active:scale-95"
                        >
                            <Send className="w-6 h-6" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg">
                        إرسال تقرير
                    </TooltipContent>
                </Tooltip>
            </nav>
        </TooltipProvider>
    );
};

export default SideNavBar;
