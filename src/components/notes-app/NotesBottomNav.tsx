import React from 'react';
import { Plus, List, Bell, Archive, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotesBottomNavProps {
    activeTab: string;
    onTabChange: (tabId: string) => void;
    onAddNote: () => void;
    onSearch: () => void;
}

const NotesBottomNav: React.FC<NotesBottomNavProps> = ({
    activeTab, onTabChange, onAddNote, onSearch
}) => {
    const navItems = [
        { id: 'all', icon: List, label: 'ملاحظاتي' },
        { id: 'reminders', icon: Bell, label: 'تذكيرات' },
        { id: 'archive', icon: Archive, label: 'الأرشيف' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 pb-safe pt-2 px-6 flex items-center justify-between z-50">
            <div className="flex items-center gap-8">
                {navItems.slice(0, 2).map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={cn(
                            "flex flex-col items-center gap-1 transition-colors",
                            activeTab === item.id ? "text-emerald-600" : "text-gray-400"
                        )}
                    >
                        <item.icon className="w-6 h-6" />
                        <span className="text-[10px] font-bold">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Central Add Button */}
            <button
                onClick={onAddNote}
                className="absolute left-1/2 -translate-x-1/2 -top-6 w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200 active:scale-95 transition-transform"
            >
                <Plus className="w-8 h-8" />
            </button>

            <div className="flex items-center gap-8">
                <button
                    onClick={onSearch}
                    className="flex flex-col items-center gap-1 text-gray-400 hover:text-emerald-600 transition-colors"
                >
                    <Search className="w-6 h-6" />
                    <span className="text-[10px] font-bold">بحث</span>
                </button>

                <button
                    onClick={() => onTabChange('archive')}
                    className={cn(
                        "flex flex-col items-center gap-1 transition-colors",
                        activeTab === 'archive' ? "text-emerald-600" : "text-gray-400"
                    )}
                >
                    <Archive className="w-6 h-6" />
                    <span className="text-[10px] font-bold">أرشيف</span>
                </button>
            </div>
        </div>
    );
};

export default NotesBottomNav;
