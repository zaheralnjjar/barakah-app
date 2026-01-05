import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, CheckCircle2, Circle } from 'lucide-react';
import { useShoppingList } from '@/hooks/useShoppingList';

export const DashboardShopping: React.FC = () => {
    const { items, toggleItem } = useShoppingList();

    // Sort: uncompleted first
    const sortedItems = [...items].sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
    });

    if (items.length === 0) return null;

    const completedCount = items.filter(i => i.completed).length;

    return (
        <Card className="border-0 shadow-sm bg-white overflow-hidden mb-3">
            <div className="p-3 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-pink-50 rounded-full"><ShoppingCart className="w-4 h-4 text-pink-600" /></div>
                    <span className="text-sm font-bold text-gray-700">التسوق</span>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-gray-100 text-gray-600">{items.length}</Badge>
                </div>
                <span className="text-[10px] text-gray-400">{completedCount}/{items.length} مكتمل</span>
            </div>

            <div className="p-0">
                {sortedItems.slice(0, 5).map((item) => (
                    <div
                        key={item.id}
                        className={`flex items-center gap-3 p-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors ${item.completed ? 'opacity-50' : ''}`}
                        onClick={() => toggleItem(item.id)}
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
                {items.length > 5 && (
                    <div className="p-2 text-center text-[10px] text-gray-400 bg-gray-50/50">
                        +{items.length - 5} عناصر أخرى
                    </div>
                )}
            </div>
        </Card>
    );
};
