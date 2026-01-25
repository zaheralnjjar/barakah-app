import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckSquare, Calendar, Pill, Clock } from 'lucide-react';

interface QuadrantProductivityProps {
    appointments: any[];
    tasks: any[];
    medications: any[];
    habits: any[];
}

export const QuadrantProductivity: React.FC<QuadrantProductivityProps> = ({
    appointments, tasks, medications, habits
}) => {
    // Merge and sort upcoming items
    const today = new Date().toISOString().split('T')[0];

    const merged = [
        ...appointments.map(a => ({ ...a, icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-50' })),
        ...tasks.map(t => ({ ...t, icon: CheckSquare, color: 'text-blue-500', bg: 'bg-blue-50' })),
        ...medications.map(m => ({ ...m, icon: Pill, color: 'text-red-500', bg: 'bg-red-50' })),
    ].sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'));

    return (
        <Card className="h-full border-blue-100 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
            <div className="p-3 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between">
                <h3 className="font-bold text-blue-800 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    الانتاجية
                </h3>
            </div>
            <CardContent className="p-0 h-[calc(100%-45px)] overflow-y-auto custom-scrollbar">
                {merged.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-xs">
                        لا توجد أعمال قادمة
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {merged.slice(0, 15).map((item, idx) => (
                            <div key={idx} className="p-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                                <div className={`w-8 h-8 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                                    <item.icon className={`w-4 h-4 ${item.color}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-gray-800 truncate">{item.title || item.name}</p>
                                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
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
