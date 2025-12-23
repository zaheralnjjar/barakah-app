import React from 'react';
import { Calculator, Briefcase, Calendar, Home, Moon, MapPin, Settings } from 'lucide-react';

interface BottomNavBarProps {
    activeTab: string;
    onNavigate: (tab: string) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onNavigate }) => {
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


    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-lg z-[9999] safe-area-bottom">
            <div className="flex items-center justify-around h-14 max-w-xl mx-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id || (item.isHome && activeTab === 'dashboard');

                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className="flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 active:scale-95"
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
