import React from 'react';
import { Calculator, MapPin, Home, Settings, Moon, PieChart } from 'lucide-react';

interface BottomNavBarProps {
    activeTab: string;
    onNavigate: (tab: string) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onNavigate }) => {
    const navItems = [
        { id: 'mohamed', label: 'المالية', icon: Calculator, color: 'text-green-500' },
        { id: 'fatima', label: 'الإنتاجية', icon: MapPin, color: 'text-blue-500' },
        { id: 'dashboard', label: 'الرئيسية', icon: Home, color: 'text-purple-500', isHome: true },
        { id: 'prayer', label: 'الصلاة', icon: Moon, color: 'text-emerald-500' },
        { id: 'analytics', label: 'الإحصائيات', icon: PieChart, color: 'text-orange-500' },
        { id: 'settings', label: 'الإعدادات', icon: Settings, color: 'text-gray-500' },
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
                            className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all ${isActive
                                ? 'bg-primary/10 scale-105'
                                : 'hover:bg-gray-100'
                                }`}
                        >
                            <div className={`p-1.5 rounded-full ${item.isHome ? 'bg-primary text-white' : ''}`}>
                                <Icon className={`w-5 h-5 ${isActive ? item.color : 'text-gray-400'} ${item.isHome ? 'text-white' : ''}`} />
                            </div>
                            <span className={`text-[10px] arabic-body mt-0.5 ${isActive ? 'text-primary font-medium' : 'text-gray-500'}`}>
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
