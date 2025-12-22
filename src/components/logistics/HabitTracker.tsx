import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Check, Trash2, BarChart2, TrendingUp, Calendar, Target } from 'lucide-react';
import { useHabits } from '@/hooks/useHabits';

export const HabitTracker = () => {
    const { habits, addHabit, toggleHabit, deleteHabit } = useHabits();
    const [newHabitName, setNewHabitName] = useState('');
    const [showStats, setShowStats] = useState(false);

    const handleAdd = () => {
        addHabit(newHabitName);
        setNewHabitName('');
    };

    // Calculate Stats
    const totalHabits = habits.length;
    const today = new Date().toISOString().split('T')[0];
    const completedToday = habits.filter(h => (h.history || {})[today]).length;
    const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
    const totalStreak = habits.reduce((sum, h) => sum + (h.streak || 0), 0);
    const avgStreak = totalHabits > 0 ? Math.round(totalStreak / totalHabits) : 0;
    const maxStreak = Math.max(...habits.map(h => h.streak || 0), 0);

    // Weekly completion stats
    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toISOString().split('T')[0]);
        }
        return days;
    };

    const weeklyStats = getLast7Days().map(day => ({
        date: day,
        dayName: new Date(day).toLocaleDateString('ar', { weekday: 'short' }),
        completed: habits.filter(h => (h.history || {})[day]).length,
        total: totalHabits
    }));

    return (
        <>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle
                        className="arabic-title text-base flex items-center justify-between cursor-pointer hover:text-primary"
                        onClick={() => setShowStats(true)}
                    >
                        <span className="flex items-center gap-2">
                            🔥 متتبع العادات
                            <BarChart2 className="w-4 h-4 text-gray-400" />
                        </span>
                        <div className="flex gap-1">
                            <Input
                                placeholder="عادة جديدة..."
                                value={newHabitName}
                                onChange={e => setNewHabitName(e.target.value)}
                                className="h-8 w-32 text-xs"
                                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                onClick={e => e.stopPropagation()}
                            />
                            <Button size="sm" className="h-8" onClick={(e) => { e.stopPropagation(); handleAdd(); }}><Plus className="w-3 h-3" /></Button>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {habits.map(habit => {
                            const isCompletedToday = !!(habit.history || {})[today];
                            return (
                                <div key={habit.id} className="flex items-center justify-between p-2 bg-white rounded border hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => toggleHabit(habit.id)}
                                            className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${isCompletedToday ? 'bg-orange-500 border-orange-600 text-white' : 'bg-gray-100 border-gray-300 text-transparent hover:border-orange-400'}`}
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <div>
                                            <span className={`font-bold block ${isCompletedToday ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{habit.name}</span>
                                            <span className="text-[10px] text-orange-600 font-bold">🔥 {habit.streak || 0} يوم متواصل</span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-300 hover:text-red-500" onClick={() => deleteHabit(habit.id)}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            );
                        })}
                        {habits.length === 0 && <p className="text-center text-gray-400 text-sm">أضف عادة جديدة لبدء التتبع</p>}
                    </div>
                </CardContent>
            </Card>

            {/* Stats Modal */}
            <Dialog open={showStats} onOpenChange={setShowStats}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-right flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-orange-500" />
                            إحصائيات العادات
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-orange-50 p-3 rounded-lg text-center">
                                <Target className="w-6 h-6 mx-auto text-orange-500 mb-1" />
                                <p className="text-2xl font-bold text-orange-600">{completionRate}%</p>
                                <p className="text-xs text-gray-500">نسبة الإنجاز اليوم</p>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg text-center">
                                <TrendingUp className="w-6 h-6 mx-auto text-green-500 mb-1" />
                                <p className="text-2xl font-bold text-green-600">{maxStreak}</p>
                                <p className="text-xs text-gray-500">أعلى سلسلة</p>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg text-center">
                                <Calendar className="w-6 h-6 mx-auto text-blue-500 mb-1" />
                                <p className="text-2xl font-bold text-blue-600">{avgStreak}</p>
                                <p className="text-xs text-gray-500">متوسط السلسلة</p>
                            </div>
                            <div className="bg-purple-50 p-3 rounded-lg text-center">
                                <Check className="w-6 h-6 mx-auto text-purple-500 mb-1" />
                                <p className="text-2xl font-bold text-purple-600">{completedToday}/{totalHabits}</p>
                                <p className="text-xs text-gray-500">مكتمل اليوم</p>
                            </div>
                        </div>

                        {/* Weekly Progress */}
                        <div className="border-t pt-3">
                            <h4 className="text-sm font-bold mb-2">التقدم الأسبوعي</h4>
                            <div className="flex justify-between gap-1">
                                {weeklyStats.map((day, idx) => (
                                    <div key={idx} className="flex-1 text-center">
                                        <div className="h-16 bg-gray-100 rounded relative overflow-hidden">
                                            <div
                                                className="absolute bottom-0 w-full bg-orange-400 transition-all"
                                                style={{ height: day.total > 0 ? `${(day.completed / day.total) * 100}%` : '0%' }}
                                            />
                                        </div>
                                        <p className="text-[10px] mt-1">{day.dayName}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Individual Habits */}
                        <div className="border-t pt-3">
                            <h4 className="text-sm font-bold mb-2">تفاصيل العادات</h4>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                {habits.map(habit => (
                                    <div key={habit.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                        <span className="text-sm">{habit.name}</span>
                                        <span className="text-orange-600 font-bold text-sm">🔥 {habit.streak || 0}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
