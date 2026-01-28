
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CollapsibleSection } from './CollapsibleSection';
import {
    CheckSquare,
    FileText,
    Calendar,
    Pill,
    ShoppingBag,
    Clock,
    AlertCircle,
    CheckCircle2,
    Circle,
    ChevronRight,
    Filter
} from 'lucide-react';
import { useUnifiedTaskEngine, UnifiedTask } from '@/hooks/useUnifiedTaskEngine';
import { cn } from '@/lib/utils';

export const MasterAgenda: React.FC = () => {
    const { unifiedTasks, loading, toggleComplete } = useUnifiedTaskEngine();
    const [filter, setFilter] = useState<UnifiedTask['source'] | 'all'>('all');

    const filteredTasks = filter === 'all'
        ? unifiedTasks
        : unifiedTasks.filter(t => t.source === filter);

    const getSourceIcon = (source: UnifiedTask['source']) => {
        switch (source) {
            case 'general': return <CheckSquare className="w-4 h-4 text-blue-500" />;
            case 'thesis': return <FileText className="w-4 h-4 text-purple-500" />;
            case 'appointment': return <Calendar className="w-4 h-4 text-orange-500" />;
            case 'medication': return <Pill className="w-4 h-4 text-teal-500" />;
            case 'shopping': return <ShoppingBag className="w-4 h-4 text-pink-500" />;
            default: return <Circle className="w-4 h-4 text-gray-400" />;
        }
    };

    const getSourceLabel = (source: UnifiedTask['source']) => {
        switch (source) {
            case 'general': return 'عام';
            case 'thesis': return 'أكاديمي';
            case 'appointment': return 'موعد';
            case 'medication': return 'صحة';
            case 'shopping': return 'تسوق';
            default: return source;
        }
    };

    return (
        <CollapsibleSection title="محرك المهام الموحد" icon={Clock} defaultOpen={true}>
            <div className="p-4 pt-2 space-y-3">
                {/* Filters */}
                <div className="flex gap-1 overflow-x-auto pb-1 max-w-full no-scrollbar mb-2">
                    {(['all', 'general', 'thesis', 'appointment', 'medication'] as const).map(f => (
                        <Button
                            key={f}
                            variant={filter === f ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setFilter(f)}
                            className={cn(
                                "h-7 px-3 text-[10px] rounded-full",
                                filter === f ? "bg-indigo-600 shadow-md" : "text-gray-500"
                            )}
                        >
                            {f === 'all' ? 'الكل' : getSourceLabel(f as any)}
                        </Button>
                    ))}
                </div>

                {loading ? (
                    <div className="py-10 text-center text-gray-400 animate-pulse">جاري تجميع المهام...</div>
                ) : filteredTasks.length === 0 ? (
                    <div className="py-10 text-center text-gray-400 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100 italic">
                        لا يوجد مهام حالية
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredTasks.slice(0, 6).map((task) => (
                            <div
                                key={task.id}
                                className={cn(
                                    "group flex items-center justify-between p-3 rounded-2xl transition-all duration-300 border border-transparent",
                                    task.isCompleted
                                        ? "bg-gray-50/50 opacity-60"
                                        : "bg-white shadow-sm hover:shadow-md hover:border-indigo-100 hover:-translate-y-0.5"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-2 rounded-xl transition-colors",
                                        task.isCompleted ? "bg-gray-100" : "bg-indigo-50/50 group-hover:bg-indigo-100/50"
                                    )}>
                                        {getSourceIcon(task.source)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={cn(
                                            "font-bold text-sm",
                                            task.isCompleted ? "line-through text-gray-400" : "text-gray-800"
                                        )}>
                                            {task.title}
                                        </span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="outline" className="text-[9px] px-1.5 h-4 border-gray-200 text-gray-500 font-medium">
                                                {getSourceLabel(task.source)}
                                            </Badge>
                                            {task.dueDate && (
                                                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {new Date(task.dueDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {task.priority === 'high' && !task.isCompleted && (
                                        <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                                    )}
                                    <button
                                        onClick={() => toggleComplete(task)}
                                        className="focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-full p-0.5 transition-transform hover:scale-110 active:scale-95"
                                    >
                                        {task.isCompleted ? (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        ) : (
                                            <Circle className="w-5 h-5 text-gray-200 group-hover:text-indigo-400 transition-colors cursor-pointer" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                        {filteredTasks.length > 6 && (
                            <Button variant="ghost" className="w-full text-[11px] text-gray-400 h-8 hover:bg-transparent hover:text-indigo-600">
                                عرض الكل ({filteredTasks.length})
                                <ChevronRight className="w-3 h-3 mr-1" />
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </CollapsibleSection>
    );
};
