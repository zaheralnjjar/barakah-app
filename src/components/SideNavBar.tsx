import React from 'react';
import { Calculator, Briefcase, Calendar, Home, Moon, MapPin, Settings, Send, FileText } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SideNavBarProps {
    activeTab: string;
    onNavigate: (tab: string) => void;
    onLongPress?: (tab: string) => void;
    onSync?: () => void;
    onOpenReports?: () => void;
    onOpenNotes?: () => void;
}

const SideNavBar: React.FC<SideNavBarProps> = ({ activeTab, onNavigate, onLongPress, onSync, onOpenReports, onOpenNotes }) => {
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

                {/* Notes Button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={onOpenNotes}
                            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 text-purple-500 hover:bg-purple-50 active:scale-95 mb-2"
                        >
                            <FileText className="w-6 h-6" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg">
                        الملاحظات
                    </TooltipContent>
                </Tooltip>

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

