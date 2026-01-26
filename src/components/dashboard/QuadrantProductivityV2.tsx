import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckSquare, Calendar, Target, Clock, AlertCircle, ShoppingCart, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useShoppingList } from '@/hooks/useShoppingList';

interface QuadrantProductivityV2Props {
    appointments: any[];
    tasks: any[];
    goals: any[];
    onOpenDetail?: (type: string, item: any) => void;
}

export const QuadrantProductivityV2: React.FC<QuadrantProductivityV2Props> = ({
    appointments, tasks, goals, onOpenDetail
}) => {
    const [activeTab, setActiveTab] = useState<'appointments' | 'tasks_goals' | 'shopping'>('appointments');
    const { items: shoppingItems, toggleItem: toggleShoppingItem } = useShoppingList();

    // 1. Appointments (Calendar) - Filter & Sort
    const todayStr = new Date().toISOString().split('T')[0];
    const appointmentItems = appointments
        .filter(a => (a.date >= todayStr)) // Only future/today
        .sort((a, b) => {
            // Sort by full date+time
            const dateA = new Date(`${a.date}T${a.time || '23:59'}`);
            const dateB = new Date(`${b.date}T${b.time || '23:59'}`);
            return dateA.getTime() - dateB.getTime();
        })
        .slice(0, 5) // Limit to 5
        .map(a => ({
            ...a,
            icon: Calendar,
            color: 'text-orange-500',
            bg: 'bg-orange-50',
            type: 'appointment',
            label: 'موعد',
            timeStr: a.time || '23:59'
        }));

    // 2. Tasks + Goals (Merged)
    const tasksAndGoals = [
        ...tasks.map(t => ({ ...t, icon: CheckSquare, color: 'text-blue-500', bg: 'bg-blue-50', type: 'task', label: 'مهمة' })),
        ...goals.map(g => ({ ...g, icon: Target, color: 'text-purple-500', bg: 'bg-purple-50', type: 'goal', label: 'هدف' })),
    ].sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'));

    // 3. Shopping Items (Sorted uncompleted first)
    const sortedShoppingItems = [...shoppingItems].sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
    });

    const renderList = (items: any[], emptyMsg: string) => {
        if (items.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center text-gray-400 gap-2 min-h-[150px]">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 opacity-20" />
                    </div>
                    <p className="text-[10px]">{emptyMsg}</p>
                </div>
            );
        }
        return (
            <div className="divide-y divide-gray-50">
                {items.map((item, idx) => (
                    <div
                        key={idx}
                        className="p-2 flex items-center gap-2 hover:bg-blue-50/30 cursor-pointer transition-colors group"
                        onClick={() => onOpenDetail?.(item.type, item)}
                    >
                        <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                            <item.icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold text-gray-800 truncate">{item.title || item.name}</p>
                                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{item.label}</span>
                            </div>
                            <p className="text-[9px] text-gray-500 flex items-center gap-1 mt-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {item.time || 'طوال اليوم'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderShoppingList = () => {
        if (sortedShoppingItems.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center text-gray-400 gap-2 min-h-[150px]">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 opacity-20" />
                    </div>
                    <p className="text-[10px]">قائمة التسوق فارغة</p>
                </div>
            );
        }
        return (
            <div className="divide-y divide-gray-50">
                {sortedShoppingItems.map((item, idx) => (
                    <div
                        key={item.id}
                        className={`flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors cursor-pointer ${item.completed ? 'opacity-50' : ''}`}
                        onClick={() => toggleShoppingItem(item.id)}
                    >
                        {item.completed ?
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> :
                            <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        }
                        <div className="flex-1 min-w-0">
                            <span className={`text-sm ${item.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                {item.text}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const tabs = [
        { id: 'appointments', label: 'المواعيد' },
        { id: 'tasks_goals', label: 'المهام والأهداف' },
        { id: 'shopping', label: 'التسوق' },
    ];

    return (
        <Card className="h-full border-blue-100 shadow-sm bg-white/60 backdrop-blur-md overflow-hidden flex flex-col">
            {/* Header with Tabs */}
            <div className="p-2 border-b border-blue-50 bg-white/40">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-blue-800 flex items-center gap-1.5 text-xs">
                        <CheckSquare className="w-4 h-4" />
                        الإنتاجية
                    </h3>
                </div>

                <div className="flex gap-1 bg-gray-100/50 p-1 rounded-lg">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex-1 text-[9px] font-bold py-1.5 rounded-md transition-all text-center",
                                activeTab === tab.id
                                    ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5"
                                    : "text-gray-500 hover:bg-gray-200/50"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content List - Responsive Height & Scrollable */}
            <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar bg-white/30 h-full min-h-0">
                {activeTab === 'appointments' && renderList(appointmentItems, 'لا توجد مواعيد اليوم')}
                {activeTab === 'tasks_goals' && renderList(tasksAndGoals, 'لا توجد مهام أو أهداف')}
                {activeTab === 'shopping' && renderShoppingList()}
            </CardContent>
        </Card>
    );
};
