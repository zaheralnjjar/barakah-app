import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, Briefcase, Calendar, Home, Moon, MapPin, Settings, Send, LayoutGrid, GraduationCap, StickyNote, Plus, Navigation, Inbox } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { EditorModalV2 } from './notes-v2/EditorModalV2';
import { MultiActionFAB } from './MultiActionFAB';
import { isAndroid } from '@/utils/platformDetection';

interface SideNavBarProps {
    activeTab: string;
    onNavigate: (tab: string) => void;
    onLongPress?: (tab: string) => void;
    onSync?: () => void;
    onOpenReports?: () => void;
    // FAB Handlers
    onAddNote: () => void;
    onVoiceNote: () => void;
    onAddAppointment: () => void;
    onAddDistraction: () => void;
}

const SideNavBar: React.FC<SideNavBarProps> = ({
    activeTab, onNavigate, onLongPress, onSync, onOpenReports,
    onAddNote, onVoiceNote, onAddAppointment, onAddDistraction
}) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isMobile, setIsMobile] = useState(false);
    const [isNoteV2ModalOpen, setIsNoteV2ModalOpen] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const width = window.innerWidth;
            const userAgent = navigator.userAgent.toLowerCase();
            const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
            const isDroid = isAndroid() || (userAgent.indexOf("android") > -1);
            setIsMobile(width < 1024 || isMobileUA || isDroid);
        };

        checkMobile();
        const handleResize = () => checkMobile();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const navItems = [
        { id: 'dashboard', label: 'الرئيسية', icon: Home, isHome: true, color: 'text-blue-600', activeBg: 'bg-blue-50' },
        { id: 'finance', label: 'المالية', icon: Calculator, color: 'text-green-600', activeBg: 'bg-green-50' },
        { id: 'productivity', label: 'الإنتاجية', icon: Briefcase, color: 'text-orange-600', activeBg: 'bg-orange-50' },
        { id: 'notes-v2', label: 'الملاحظات', icon: StickyNote, color: 'text-amber-600', activeBg: 'bg-amber-50' },
        { id: 'inbox', label: 'البريد', icon: Inbox, color: 'text-indigo-600', activeBg: 'bg-indigo-50' },
        { id: 'map', label: 'الخريطة', icon: Navigation, color: 'text-indigo-600', activeBg: 'bg-indigo-50' },
        { id: 'settings', label: 'الإعدادات', icon: Settings, color: 'text-gray-600', activeBg: 'bg-gray-50' },
    ];

    // Refs for long press
    const pressTimer = React.useRef<NodeJS.Timeout | null>(null);
    const isLongPress = React.useRef(false);

    const handleStart = (id: string) => {
        isLongPress.current = false;
        pressTimer.current = setTimeout(() => {
            isLongPress.current = true;
            if (navigator.vibrate) navigator.vibrate(50);
            // Action is handled in handleEnd to prevent conflict
        }, 500);
    };

    const handleEnd = (item: any) => {
        if (pressTimer.current) clearTimeout(pressTimer.current);
        if (!isLongPress.current) {
            if (item.isRoute) navigate(item.route);
            else onNavigate(item.id);
        } else if (isLongPress.current) {
            if (item.isHome && onLongPress) {
                onLongPress('home_summary');
            } else if (item.id === 'settings') {
                // Force sync when long pressing settings
                window.dispatchEvent(new Event('trigger-cloud-sync'));
                window.dispatchEvent(new Event('refresh-calendar-events'));
            } else if (item.id === 'productivity' && onLongPress) {
                onLongPress('calendar-monthly');
            }
        }
        setTimeout(() => {
            isLongPress.current = false;
        }, 100);
    };

    const NavIcon = ({ item }: { item: any }) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id || (item.isHome && activeTab === 'dashboard');

        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onMouseDown={() => handleStart(item.id)}
                        onMouseUp={() => handleEnd(item)}
                        onMouseLeave={() => {
                            if (pressTimer.current) clearTimeout(pressTimer.current);
                        }}
                        onTouchStart={() => handleStart(item.id)}
                        onTouchEnd={() => handleEnd(item)}
                        onContextMenu={(e) => e.preventDefault()}
                        className={`
                            ${isMobile ? 'flex-1 h-16' : 'w-12 h-12 rounded-xl'} 
                            flex flex-col items-center justify-center transition-all duration-300
                            ${isActive
                                ? `${item.activeBg} ${item.color} shadow-sm scale-110` // Active state with color
                                : `text-gray-400 hover:bg-gray-50 hover:${item.color}` // Inactive state
                            }
                            active:scale-95
                        `}
                    >
                        <Icon className={`${isMobile ? 'w-10 h-10' : 'w-6 h-6'} transition-colors`} />
                        {/* Labels Removed for Mobile as requested */}
                    </button>
                </TooltipTrigger>
                <TooltipContent side={isMobile ? "top" : "left"} className="bg-gray-900 text-white text-xs px-2 py-1 rounded-lg">
                    {item.label}
                </TooltipContent>
            </Tooltip>
        );
    };

    if (isMobile) {
        return (
            <TooltipProvider delayDuration={200}>
                <nav className="fixed bottom-0 left-0 w-full h-[64px] bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-[9999] flex items-center justify-between px-2 pb-2">
                    <div className="flex-1 flex items-center justify-around">
                        {navItems.map((item) => <NavIcon key={item.id} item={item} />)}
                    </div>
                </nav>
                <EditorModalV2 isOpen={isNoteV2ModalOpen} onClose={() => setIsNoteV2ModalOpen(false)} />
            </TooltipProvider>
        );
    }

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
                    {navItems.map((item) => <NavIcon key={item.id} item={item} />)}
                </div>


                {/* Add Note Button - Fixed Sidebar Item (Replaces FAB) */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onMouseDown={() => {
                                isLongPress.current = false;
                                pressTimer.current = setTimeout(() => {
                                    isLongPress.current = true;
                                    if (navigator.vibrate) navigator.vibrate(50);
                                    onAddDistraction();
                                }, 500);
                            }}
                            onMouseUp={() => {
                                if (pressTimer.current) clearTimeout(pressTimer.current);
                                if (!isLongPress.current) {
                                    onAddNote();
                                }
                                setTimeout(() => { isLongPress.current = false; }, 100);
                            }}
                            onMouseLeave={() => {
                                if (pressTimer.current) clearTimeout(pressTimer.current);
                                isLongPress.current = false;
                            }}
                            onTouchStart={() => {
                                isLongPress.current = false;
                                pressTimer.current = setTimeout(() => {
                                    isLongPress.current = true;
                                    if (navigator.vibrate) navigator.vibrate(50);
                                    onAddDistraction();
                                }, 500);
                            }}
                            onTouchEnd={() => {
                                if (pressTimer.current) clearTimeout(pressTimer.current);
                                if (!isLongPress.current) {
                                    onAddNote();
                                }
                                setTimeout(() => { isLongPress.current = false; }, 100);
                            }}
                            onContextMenu={(e) => e.preventDefault()}
                            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 text-amber-500 hover:bg-amber-50 active:scale-95 mb-1 relative"
                        >
                            <StickyNote className="w-6 h-6" />
                            <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-amber-500 rounded-full border border-white" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg">
                        إضافة ملاحظة (اضغط مطولاً للنشاط)
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

            <EditorModalV2
                isOpen={isNoteV2ModalOpen}
                onClose={() => setIsNoteV2ModalOpen(false)}
            />
        </TooltipProvider>
    );
};

export default SideNavBar;
