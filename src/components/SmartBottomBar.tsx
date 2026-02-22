import React, { useState, useRef } from 'react';
import { Home, Settings, MapPin, DollarSign, Moon, Calendar, Briefcase } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface PrayerTime {
    name: string;
    time: string;
    isNext?: boolean;
}

interface SmartBottomBarProps {
    activeTab: string;
    onNavigate: (tab: string) => void;
    prayerTimes?: PrayerTime[];
}

const SmartBottomBar: React.FC<SmartBottomBarProps> = ({
    activeTab,
    onNavigate,
    prayerTimes = []
}) => {
    const [currentScreen, setCurrentScreen] = useState(0);
    const [touchStart, setTouchStart] = useState(0);
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
    const [longPressActive, setLongPressActive] = useState(false);
    const [showPrayerPopup, setShowPrayerPopup] = useState(false);
    const autoReturnTimer = useRef<NodeJS.Timeout | null>(null);

    // Auto-return to main screen after 5 seconds
    React.useEffect(() => {
        if (currentScreen !== 0) {
            autoReturnTimer.current = setTimeout(() => {
                setCurrentScreen(0);
            }, 5000);
        }
        return () => {
            if (autoReturnTimer.current) {
                clearTimeout(autoReturnTimer.current);
            }
        };
    }, [currentScreen]);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.touches[0].clientY);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const touchEnd = e.changedTouches[0].clientY;
        const diff = touchStart - touchEnd;
        if (Math.abs(diff) > 50) {
            setCurrentScreen((prev) => (prev === 0 ? 1 : 0));
        }
    };

    // Long press handlers
    const handleIconTouchStart = (iconId: string) => {
        setLongPressActive(false);
        const timer = setTimeout(() => {
            setLongPressActive(true);
            if (iconId === 'dashboard') {
                setShowPrayerPopup(true);
            } else if (iconId === 'settings') {
                window.dispatchEvent(new CustomEvent('trigger-cloud-sync'));
            }
        }, 500);
        setLongPressTimer(timer);
    };

    const handleIconTouchEnd = (iconId: string) => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
        if (!longPressActive) {
            onNavigate(iconId);
        }
        setLongPressActive(false);
    };

    // Main icons - 4 items
    const mainIcons = [
        { id: 'dashboard', label: 'الرئيسية', icon: Home, color: '#7C3AED', hasLongPress: true },
        { id: 'settings', label: 'الإعدادات', icon: Settings, color: '#6B7280', hasLongPress: true },
        { id: 'map', label: 'الخريطة', icon: MapPin, color: '#EF4444', hasLongPress: false },
        { id: 'financial', label: 'المالية', icon: DollarSign, color: '#10B981', hasLongPress: false }
    ];

    // Secondary icons - 3 items
    const secondaryIcons = [
        { id: 'prayer', label: 'الصلاة', icon: Moon, color: '#F59E0B' },
        { id: 'appointments', label: 'التقويم', icon: Calendar, color: '#3B82F6' },
        { id: 'productivity', label: 'الإنتاجية', icon: Briefcase, color: '#4F46E5' }
    ];

    // Default prayer times
    const defaultPrayerTimes: PrayerTime[] = [
        { name: 'الفجر', time: '05:30' },
        { name: 'الشروق', time: '06:45' },
        { name: 'الظهر', time: '12:15', isNext: true },
        { name: 'العصر', time: '15:30' },
        { name: 'المغرب', time: '18:00' },
        { name: 'العشاء', time: '19:30' }
    ];

    const displayPrayerTimes = prayerTimes.length > 0 ? prayerTimes : defaultPrayerTimes;

    // Icon button style - VERTICAL with inline styles for guaranteed layout
    const iconButtonStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        flex: 1,
        height: '100%',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        padding: '8px 4px',
        transition: 'transform 0.15s ease'
    };

    const renderScreen = () => {
        switch (currentScreen) {
            case 0:
                return (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-around',
                        width: '100%',
                        height: '100%',
                        padding: '0 16px'
                    }}>
                        {mainIcons.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            const iconColor = isActive ? item.color : '#9CA3AF';

                            return (
                                <button
                                    key={item.id}
                                    onTouchStart={() => item.hasLongPress && handleIconTouchStart(item.id)}
                                    onTouchEnd={() => item.hasLongPress ? handleIconTouchEnd(item.id) : onNavigate(item.id)}
                                    onClick={() => !item.hasLongPress && onNavigate(item.id)}
                                    style={iconButtonStyle}
                                >
                                    {/* Icon - on TOP */}
                                    <Icon
                                        size={24}
                                        color={iconColor}
                                        strokeWidth={2}
                                        fill={isActive && item.id === 'dashboard' ? iconColor : 'none'}
                                    />
                                    {/* Text - on BOTTOM */}
                                    <span style={{
                                        fontSize: '13px',
                                        fontWeight: isActive ? 600 : 500,
                                        color: iconColor,
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                );

            case 1:
                return (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-around',
                        width: '100%',
                        height: '100%',
                        padding: '0 32px'
                    }}>
                        {secondaryIcons.map((item) => {
                            const Icon = item.icon;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onNavigate(item.id)}
                                    style={iconButtonStyle}
                                >
                                    {/* Icon - on TOP */}
                                    <Icon
                                        size={24}
                                        color={item.color}
                                        strokeWidth={2}
                                        fill={item.id === 'prayer' ? item.color : 'none'}
                                    />
                                    {/* Text - on BOTTOM */}
                                    <span style={{
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: item.color,
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <>
            {/* Bottom Bar Container */}
            <div
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    paddingBottom: 'env(safe-area-inset-bottom)'
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <div style={{ margin: '0 8px 8px 8px' }}>
                    {/* Main Bar */}
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        height: '70px',
                        overflow: 'hidden',
                        border: '1px solid #f3f4f6'
                    }}>
                        {renderScreen()}
                    </div>
                    {/* Screen indicator dots */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '6px',
                        marginTop: '8px'
                    }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: currentScreen === 0 ? '#7C3AED' : '#D1D5DB',
                            transition: 'all 0.3s ease',
                            transform: currentScreen === 0 ? 'scale(1.2)' : 'scale(1)'
                        }} />
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: currentScreen === 1 ? '#F59E0B' : '#D1D5DB',
                            transition: 'all 0.3s ease',
                            transform: currentScreen === 1 ? 'scale(1.2)' : 'scale(1)'
                        }} />
                    </div>
                </div>
            </div>

            {/* Prayer Times Popup */}
            <Dialog open={showPrayerPopup} onOpenChange={setShowPrayerPopup}>
                <DialogContent className="max-w-sm rounded-2xl" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-center text-lg flex items-center justify-center gap-2">
                            <Moon className="w-5 h-5 text-amber-500" fill="currentColor" />
                            أوقات الصلاة اليوم
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        {displayPrayerTimes.map((prayer, index) => (
                            <div
                                key={index}
                                className={`flex items-center justify-between p-3 rounded-xl transition-all ${prayer.isNext
                                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 shadow-sm'
                                    : 'bg-gray-50 border border-gray-100'
                                    }`}
                            >
                                <span className={`font-semibold text-base ${prayer.isNext ? 'text-amber-700' : 'text-gray-700'}`}>
                                    {prayer.name}
                                </span>
                                <span className={`text-xl font-bold ${prayer.isNext ? 'text-amber-600' : 'text-gray-600'}`}>
                                    {prayer.time}
                                </span>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default SmartBottomBar;
