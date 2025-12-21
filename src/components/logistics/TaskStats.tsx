import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MainTask } from '@/hooks/useTasks';
import { Appointment } from '@/hooks/useAppointments';
import { Habit } from '@/hooks/useHabits';
import { SavedResource } from '@/components/agents/LogisticsManager'; // Will be moved or redefined

// Temporary interface until decided where SavedResource lives (LogisticsManager or new hook)
// LogisticsManager.tsx defined: interface SavedResource { id: string; title: string; url: string; category: ... }
// I'll redefine here to avoid circular dependency
interface SavedResource {
    id: string;
    title: string;
    url: string;
    category: 'tool' | 'article' | 'other';
}

interface TaskStatsProps {
    tasks: MainTask[];
    habits: Habit[];
    appointments: Appointment[];
    resources: SavedResource[];
    showStatsDialog: boolean;
    setShowStatsDialog: (show: boolean) => void;
}

export const TaskStats: React.FC<TaskStatsProps> = ({
    tasks, habits, appointments, resources, showStatsDialog, setShowStatsDialog
}) => {
    return (
        <>
            <div
                className="grid grid-cols-4 gap-2 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setShowStatsDialog(true)}
            >
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-3 text-center">
                        <p className="text-xs text-green-600 font-bold">مكتملة</p>
                        <p className="text-xl font-bold text-green-700">{tasks.filter(t => t.progress === 100).length}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-3 text-center">
                        <p className="text-xs text-yellow-600 font-bold">جارية</p>
                        <p className="text-xl font-bold text-yellow-700">{tasks.filter(t => t.progress > 0 && t.progress < 100).length}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-3 text-center">
                        <p className="text-xs text-gray-600 font-bold">معلقة</p>
                        <p className="text-xl font-bold text-gray-700">{tasks.filter(t => t.progress === 0).length}</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-3 text-center">
                        <p className="text-xs text-purple-600 font-bold">مشاريع</p>
                        <p className="text-xl font-bold text-purple-700">{tasks.filter(t => t.type === 'project').length}</p>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-right arabic-title flex items-center justify-between">
                            <span>📊 إحصائيات الأداء التفصيلية</span>
                            <span className="text-xs font-normal text-muted-foreground bg-gray-100 px-2 py-1 rounded">نظرة شاملة</span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {/* Completion Rate */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>معدل الإنجاز العام</span>
                                <span className="font-bold">{tasks.length > 0 ? Math.round((tasks.filter(t => t.progress === 100).length / tasks.length) * 100) : 0}%</span>
                            </div>
                            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-1000"
                                    style={{ width: `${tasks.length > 0 ? Math.round((tasks.filter(t => t.progress === 100).length / tasks.length) * 100) : 0}%` }}
                                />
                            </div>
                        </div>

                        {/* Priority Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border rounded-xl p-4 bg-white shadow-sm">
                                <h4 className="text-sm font-bold mb-3 border-b pb-2">توزيع الأولويات</h4>
                                <div className="space-y-3">
                                    {['high', 'medium', 'low'].map(p => {
                                        const count = tasks.filter(t => t.priority === p).length;
                                        const label = p === 'high' ? 'عالية' : p === 'medium' ? 'متوسطة' : 'منخفضة';
                                        const color = p === 'high' ? 'bg-red-500' : p === 'medium' ? 'bg-yellow-500' : 'bg-blue-500';
                                        return (
                                            <div key={p} className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${color}`} />
                                                <span className="text-xs flex-1">{label}</span>
                                                <span className="text-xs font-bold">{count}</span>
                                                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className={`h-full ${color}`} style={{ width: `${tasks.length > 0 ? (count / tasks.length) * 100 : 0}%` }} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Habits Summary */}
                            <div className="border rounded-xl p-4 bg-white shadow-sm">
                                <h4 className="text-sm font-bold mb-3 border-b pb-2">التزام العادات</h4>
                                <div className="space-y-2 max-h-[150px] overflow-y-auto">
                                    {habits.length === 0 && <p className="text-xs text-gray-400 text-center py-4">لا توجد عادات مضافة</p>}
                                    {habits.map(h => (
                                        <div key={h.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                            <span className="text-xs">{h.name}</span>
                                            <span className="text-xs font-bold text-orange-600 flex items-center gap-1">
                                                🔥 {h.streak || 0} يوم
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 p-4 rounded-xl text-center">
                                <p className="text-2xl font-bold text-blue-700">{appointments.filter(a => new Date(a.date) >= new Date()).length}</p>
                                <p className="text-xs text-blue-600">موعد قادم</p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-xl text-center">
                                <p className="text-2xl font-bold text-purple-700">{resources.length}</p>
                                <p className="text-xs text-purple-600">موارد محفوظة</p>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
