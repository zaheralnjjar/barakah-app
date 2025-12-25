import React from 'react';
import { Calculator, Briefcase, Calendar, Home, Moon, MapPin, Settings } from 'lucide-react';

interface BottomNavBarProps {
    activeTab: string;
    onNavigate: (tab: string) => void;
    onLongPress?: (tab: string) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onNavigate, onLongPress }) => {
    // 7 icons: 3 left, home center, 3 right
    const navItems = [
        { id: 'mohamed', label: 'المالية', icon: Calculator },
        { id: 'fatima', label: 'الإنتاجية', icon: Briefcase },
        { id: 'calendar', label: 'التقويم', icon: Calendar },
        { id: 'dashboard', label: 'الرئيسية', icon: Home, isHome: true },
        { id: 'prayer', label: 'الصلاة', icon: Moon },
        { id: 'map', label: 'الخرائط', icon: MapPin },
        { id: 'settings', label: 'الإعدادات', icon: Settings },
    ];

    // Refs for long press
    const pressTimer = React.useRef<NodeJS.Timeout | null>(null);
    const isLongPress = React.useRef(false);
    const isScrolling = React.useRef(false);

    const handleStart = (id: string, e: React.TouchEvent | React.MouseEvent) => {
        // Only allow left click for mouse
        if ('button' in e && e.button !== 0) return;

        isScrolling.current = false;
        isLongPress.current = false;

        // Store start position
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        (window as any).startPos = { x: clientX, y: clientY };

        pressTimer.current = setTimeout(() => {
            isLongPress.current = true;
            if (navigator.vibrate) navigator.vibrate(50);
            if (onLongPress) onLongPress(id);
        }, 500);
    };

    const handleEnd = (id: string, isHome: boolean) => {
        if (pressTimer.current) clearTimeout(pressTimer.current);
        if (!isLongPress.current && !isScrolling.current) {
            // Normal navigation
            onNavigate(id);
        } else if (isLongPress.current) {
            // Specific Long Press Actions
            if (isHome && onLongPress) {
                onLongPress('home_summary');
            } else if (id === 'settings' && onLongPress) {
                onLongPress('settings_sync');
            } else if (id === 'calendar' && onLongPress) {
                onLongPress('calendar_weekly');
            } else if (onLongPress) {
                // Default fallback
                onLongPress(id);
            }
        }
        // Reset flags
        setTimeout(() => {
            isLongPress.current = false;
            isScrolling.current = false;
        }, 100);
    };

    const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (pressTimer.current) {
            const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
            const startPos = (window as any).startPos;

            if (startPos) {
                const moveX = Math.abs(clientX - startPos.x);
                const moveY = Math.abs(clientY - startPos.y);
                if (moveX > 20 || moveY > 20) {
                    isScrolling.current = true;
                    clearTimeout(pressTimer.current);
                }
            }
        }
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-lg z-[9999] safe-area-bottom">
            <div className="flex items-center justify-around h-14 max-w-xl mx-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id || (item.isHome && activeTab === 'dashboard');

                    return (
                        <button
                            key={item.id}
                            onTouchStart={(e) => handleStart(item.id, e)}
                            onTouchEnd={() => handleEnd(item.id, !!item.isHome)}
                            onTouchMove={handleMove}
                            onMouseDown={(e) => handleStart(item.id, e)}
                            onMouseUp={() => handleEnd(item.id, !!item.isHome)}
                            onMouseMove={handleMove}
                            onMouseLeave={() => {
                                if (pressTimer.current) clearTimeout(pressTimer.current);
                            }}
                            onContextMenu={(e) => e.preventDefault()}
                            className="flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 active:scale-95 select-none"
                        >
                            <div className={`
                                flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                                ${isActive ? 'bg-primary/10' : ''}
                            `}>
                                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                            </div>
                            <span className={`
                                text-[9px] mt-0.5 font-medium transition-colors
                                ${isActive ? 'text-primary' : 'text-gray-400'}
                            `}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNavBar;
