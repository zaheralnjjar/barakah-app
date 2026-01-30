import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar, CheckSquare, ShoppingCart, Target, ChevronLeft, Plus, Clock } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { useShoppingList } from '@/hooks/useShoppingList';
import { useHabits } from '@/hooks/useHabits'; // Using habits as proxy for goals/routines
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

interface UnifiedDashboardCardProps {
    onOpenAdd: (type: 'task' | 'appointment' | 'goal' | 'shopping' | 'project') => void;
    onOpenEvent?: (event: any) => void;
    onOpenCalendar?: () => void;
}

export const UnifiedDashboardCard: React.FC<UnifiedDashboardCardProps> = ({ onOpenAdd, onOpenEvent, onOpenCalendar }) => {
    const [activeTab, setActiveTab] = useState<'agenda' | 'shopping' | 'goals' | 'projects'>('agenda');

    // Data Hooks
    const { tasks } = useTasks();
    const { appointments } = useAppointments();
    const { items: shoppingItems } = useShoppingList();
    const { habits } = useHabits();

    // 1. Agenda Logic: Combine Tasks and Appointments for today
    const todayAgenda = React.useMemo(() => {
        const today = new Date().toISOString().split('T')[0];

        const todayTasks = tasks
            .filter(t => t.progress < 100 && t.deadline?.startsWith(today))
            .map(t => ({ ...t, type: 'task' as const, time: t.time || '23:59' }));

        const todayAppts = appointments
            .filter(a => a.date === today)
            .map(a => ({ ...a, type: 'appointment' as const, time: a.time }));

        return [...todayTasks, ...todayAppts]
            .sort((a, b) => a.time.localeCompare(b.time))
            .slice(0, 4); // Show max 4 items
    }, [tasks, appointments]);

    // 2. Shopping Logic
    const pendingShopping = shoppingItems.filter(i => !i.completed).slice(0, 4);

    // 3. Goals/Habits Logic
    const activeHabits = habits.slice(0, 4);

    // 4. Projects Logic
    const activeProjects = tasks
        .filter(t => t.type === 'project' && t.progress < 100)
        .slice(0, 4);

    return (
        <Card className="w-full bg-white/80 backdrop-blur-sm border-gray-100 shadow-sm overflow-hidden rounded-3xl" dir="rtl">
            <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                    {/* Header / Tabs */}
                    <div className="flex items-center justify-between p-3 bg-gray-50/50 border-b border-gray-100">
                        <TabsList className="bg-transparent h-9 p-0 gap-4">
                            <TabsTrigger
                                value="agenda"
                                onClick={(e) => {
                                    if (activeTab === 'agenda' && onOpenCalendar) {
                                        onOpenCalendar();
                                    }
                                }}
                                className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 rounded-xl px-3 py-1.5 transition-all gap-1.5"
                            >
                                <Calendar className="w-4 h-4" />
                                <span className="text-xs font-bold">اليوم</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="shopping"
                                className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-pink-600 rounded-xl px-3 py-1.5 transition-all gap-1.5"
                            >
                                <ShoppingCart className="w-4 h-4" />
                                <span className="text-xs font-bold">تسوق</span>
                                {pendingShopping.length > 0 && (
                                    <span className="bg-pink-100 text-pink-600 text-[9px] px-1.5 py-px rounded-full">{pendingShopping.length}</span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger
                                value="goals"
                                className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 rounded-xl px-3 py-1.5 transition-all gap-1.5"
                            >
                                <Target className="w-4 h-4" />
                                <span className="text-xs font-bold">أهداف</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="projects"
                                className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 rounded-xl px-3 py-1.5 transition-all gap-1.5"
                            >
                                <Target className="w-4 h-4" />
                                <span className="text-xs font-bold">مشاريع</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* Quick Add Button based on active tab */}
                        <button
                            onClick={() => onOpenAdd(activeTab === 'agenda' ? 'task' : activeTab === 'shopping' ? 'shopping' : activeTab === 'goals' ? 'goal' : 'project')}
                            className="bg-gray-900 text-white rounded-xl p-1.5 hover:bg-gray-700 transition-colors shadow-sm active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="p-3 min-h-[140px]">

                        {/* Agenda Content */}
                        <TabsContent value="agenda" className="m-0 space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
                            {todayAgenda.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-6 text-gray-400 gap-2">
                                    <CheckSquare className="w-8 h-8 opacity-20" />
                                    <p className="text-xs">يومك فارغ! أضف مهام أو مواعيد.</p>
                                </div>
                            ) : (
                                todayAgenda.map((item, i) => (
                                    <div
                                        key={`${item.type}-${item.id}`}
                                        className="flex items-center gap-3 p-2 rounded-xl bg-white border border-gray-100 hover:border-indigo-100 transition-all group cursor-pointer"
                                        onClick={() => onOpenEvent && onOpenEvent(item)}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                            item.type === 'appointment' ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
                                        )}>
                                            {item.type === 'appointment' ? <Clock className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-800 text-sm truncate">{item.title}</h4>
                                            <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                                {format(new Date(`2000-01-01T${item.time}`), 'p', { locale: arSA })}
                                                {item.type === 'appointment' && ` • ${item.location || 'بدون موقع'}`}
                                            </p>
                                        </div>
                                        {/* Simple Checkbox or Action */}
                                        <div className="w-5 h-5 rounded-full border-2 border-gray-200 group-hover:border-indigo-300" />
                                    </div>
                                ))
                            )}
                        </TabsContent>

                        {/* Shopping Content */}
                        <TabsContent value="shopping" className="m-0 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                            {pendingShopping.length === 0 ? (
                                <div className="col-span-2 flex flex-col items-center justify-center py-6 text-gray-400 gap-2">
                                    <ShoppingCart className="w-8 h-8 opacity-20" />
                                    <p className="text-xs">القائمة فارغة.</p>
                                </div>
                            ) : (
                                pendingShopping.map(item => (
                                    <div key={item.id} className="flex items-center gap-2 p-2 rounded-xl bg-white border border-gray-100">
                                        <div className="w-2 h-2 rounded-full bg-pink-400 shrink-0" />
                                        <span className="text-xs font-bold text-gray-700 truncate">{item.text}</span>
                                        {item.quantity > 1 && <span className="text-[10px] bg-gray-100 px-1.5 rounded text-gray-500">{item.quantity}</span>}
                                    </div>
                                ))
                            )}
                            {pendingShopping.length > 0 && (
                                <button className="col-span-2 text-xs text-center text-pink-600 font-bold py-1 hover:underline">
                                    عرض القائمة الكاملة
                                </button>
                            )}
                        </TabsContent>

                        {/* Goals Content */}
                        <TabsContent value="goals" className="m-0 space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
                            {activeHabits.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-6 text-gray-400 gap-2">
                                    <Target className="w-8 h-8 opacity-20" />
                                    <p className="text-xs">لا توجد عادات نشطة.</p>
                                </div>
                            ) : (
                                activeHabits.map(habit => (
                                    <div key={habit.id} className="flex items-center justify-between p-2 rounded-xl bg-white border border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">🎯</span>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-800">{habit.name}</span>
                                                <span className="text-[9px] text-gray-400">{habit.streak} يوم متتالي</span>
                                            </div>
                                        </div>
                                        <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full"
                                                style={{ width: `${Math.min(100, (habit.streak / 66) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </TabsContent>

                        {/* Projects Content */}
                        <TabsContent value="projects" className="m-0 space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
                            {activeProjects.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-6 text-gray-400 gap-2">
                                    <Target className="w-8 h-8 opacity-20" />
                                    <p className="text-xs">لا توجد مشاريع نشطة.</p>
                                </div>
                            ) : (
                                activeProjects.map(project => (
                                    <div key={project.id} className="flex flex-col gap-1 p-2 rounded-xl bg-white border border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-800">{project.title}</span>
                                            <span className="text-[9px] text-gray-400">{project.progress}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full"
                                                style={{ width: `${project.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </CardContent>
        </Card>
    );
};
