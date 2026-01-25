import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckSquare, Calendar, Pill, Clock } from 'lucide-react';

interface QuadrantProductivityProps {
    appointments: any[];
    tasks: any[];
    medications: any[];
    habits: any[];
    onOpenDetail?: (type: string, item: any) => void;
}

export const QuadrantProductivity: React.FC<QuadrantProductivityProps> = ({
    appointments, tasks, medications, habits, onOpenDetail
}) => {
    // Merge and sort upcoming items
    const today = new Date().toISOString().split('T')[0];

    const merged = [
        ...appointments.map(a => ({ ...a, icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-50', type: 'appointment' })),
        ...tasks.map(t => ({ ...t, icon: CheckSquare, color: 'text-blue-500', bg: 'bg-blue-50', type: 'task' })),
        ...medications.map(m => ({ ...m, icon: Pill, color: 'text-red-500', bg: 'bg-red-50', type: 'medication' })),
    ].sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'));

    return (
        <Card className="h-full border-blue-100 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
            <div className="p-1.5 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between">
                <h3 className="font-bold text-blue-800 flex items-center gap-1.5 text-[10px]">
                    <CheckSquare className="w-3.5 h-3.5" />
                    الانتاجية
                </h3>
            </div>
            <CardContent className="p-0 h-[calc(100%-30px)] overflow-y-auto custom-scrollbar">
                {merged.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-xs">
                        لا توجد أعمال قادمة
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {merged.slice(0, 15).map((item, idx) => (
                            <div
                                key={idx}
                                className="p-2 flex items-center gap-2 hover:bg-gray-100/50 cursor-pointer transition-colors"
                                onClick={() => onOpenDetail?.(item.type, item)}
                            >
                                <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                                    <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-bold text-gray-800 truncate">{item.title || item.name}</p>
                                    <p className="text-[9px] text-gray-500 flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5" />
                                        {item.time || 'طوال اليوم'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
