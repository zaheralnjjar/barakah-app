import React from 'react';
import { Calculator, MapPin, Home, Settings, Moon } from 'lucide-react';

interface BottomNavBarProps {
    activeTab: string;
    onNavigate: (tab: string) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onNavigate }) => {
    const navItems = [
        { id: 'mohamed', label: 'المالية', icon: Calculator },
        { id: 'fatima', label: 'الإنتاجية', icon: MapPin },
        { id: 'dashboard', label: 'الرئيسية', icon: Home, isHome: true },
        { id: 'prayer', label: 'الصلاة', icon: Moon },
        { id: 'settings', label: 'الإعدادات', icon: Settings },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-lg z-[9999] safe-area-bottom">
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id || (item.isHome && activeTab === 'dashboard');

                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`flex flex-col items-center justify-center flex-1 h-14 transition-all duration-200 active:scale-95`}
                        >
                            <div className={`
                                flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200
                                ${isActive ? 'bg-primary/10' : 'hover:bg-gray-100'}
                            `}>
                                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                            </div>
                            <span className={`
                                text-[10px] mt-0.5 font-medium transition-colors
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
