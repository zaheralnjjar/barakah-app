import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Check, Trash2, BarChart2, TrendingUp, Calendar, Target, Edit, Settings, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { useHabits } from '@/hooks/useHabits';

export const HabitTracker = () => {
    const { habits, addHabit, toggleHabit, deleteHabit, updateHabit, addHabitSubtask, toggleHabitSubtask, deleteHabitSubtask } = useHabits();
    const [newHabitName, setNewHabitName] = useState('');
    const [newHabitFrequency, setNewHabitFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'specific_days'>('daily');
    const [newTimesPerDay, setNewTimesPerDay] = useState(1);
    const [showStats, setShowStats] = useState(false);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [editingHabit, setEditingHabit] = useState<any>(null);
    const [expandedHabitId, setExpandedHabitId] = useState<string | null>(null);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

    const handleAdd = () => {
        addHabit(newHabitName, newHabitFrequency, [], newTimesPerDay);
        setNewHabitName('');
        setNewHabitFrequency('daily');
        setNewTimesPerDay(1);
        setShowAddDialog(false);
    };

    const handleSaveEdit = () => {
        if (editingHabit) {
            updateHabit(editingHabit.id, {
                name: editingHabit.name,
                frequency: editingHabit.frequency,
                timesPerDay: editingHabit.timesPerDay
            });
            setEditingHabit(null);
        }
    };

    const handleAddSubtask = (habitId: string) => {
        if (newSubtaskTitle.trim()) {
            addHabitSubtask(habitId, newSubtaskTitle);
            setNewSubtaskTitle('');
        }
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

    const getFrequencyLabel = (freq: string) => {
        switch (freq) {
            case 'daily': return 'يومياً';
            case 'weekly': return 'أسبوعياً';
            case 'monthly': return 'شهرياً';
            case 'specific_days': return 'أيام محددة';
            default: return freq;
        }
    };

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
                        <Button size="sm" className="h-8" onClick={(e) => { e.stopPropagation(); setShowAddDialog(true); }}>
                            <Plus className="w-3 h-3 ml-1" /> إضافة
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {habits.map(habit => {
                            const isCompletedToday = !!(habit.history || {})[today];
                            const timesTarget = habit.timesPerDay || 1;
                            const timesToday = (habit.timesCompleted || {})[today] || 0;
                            const subtasks = habit.subtasks || [];
                            const subtasksCompleted = subtasks.filter(s => s.completed).length;
                            const isExpanded = expandedHabitId === habit.id;

                            return (
                                <div key={habit.id} className="border rounded-lg overflow-hidden bg-white">
                                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => toggleHabit(habit.id)}
                                                className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${isCompletedToday ? 'bg-orange-500 border-orange-600 text-white' : 'bg-gray-100 border-gray-300 text-transparent hover:border-orange-400'}`}
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <div>
                                                <span className={`font-bold block ${isCompletedToday ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{habit.name}</span>
                                                <div className="flex gap-2 items-center">
                                                    <span className="text-[10px] text-orange-600 font-bold">🔥 {habit.streak || 0} يوم</span>
                                                    <span className="text-[10px] text-gray-400">| {getFrequencyLabel(habit.frequency)}</span>
                                                    {timesTarget > 1 && (
                                                        <span className="text-[10px] text-blue-500">{timesToday}/{timesTarget}</span>
                                                    )}
                                                    {subtasks.length > 0 && (
                                                        <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 rounded">
                                                            <Layers className="w-3 h-3 inline ml-1" />
                                                            {subtasksCompleted}/{subtasks.length}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpandedHabitId(isExpanded ? null : habit.id)}>
                                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-400 hover:text-blue-600" onClick={() => setEditingHabit({ ...habit })}>
                                                <Edit className="w-3 h-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-300 hover:text-red-500" onClick={() => deleteHabit(habit.id)}>
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Subtasks Section */}
                                    {isExpanded && (
                                        <div className="bg-gray-50 p-3 border-t">
                                            <p className="text-xs font-bold text-gray-500 mb-2">المهام الفرعية</p>
                                            <div className="space-y-2 mb-3">
                                                {subtasks.map(sub => (
                                                    <div key={sub.id} className="flex items-center gap-2 group">
                                                        <input
                                                            type="checkbox"
                                                            checked={sub.completed}
                                                            onChange={() => toggleHabitSubtask(habit.id, sub.id)}
                                                            className="accent-purple-600"
                                                        />
                                                        <span className={`text-sm flex-1 ${sub.completed ? 'line-through text-gray-400' : ''}`}>{sub.title}</span>
                                                        <Trash2
                                                            className="w-3 h-3 text-red-300 opacity-0 group-hover:opacity-100 cursor-pointer"
                                                            onClick={() => deleteHabitSubtask(habit.id, sub.id)}
                                                        />
                                                    </div>
                                                ))}
                                                {subtasks.length === 0 && (
                                                    <p className="text-xs text-gray-400 text-center">لا توجد مهام فرعية</p>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="مهمة فرعية جديدة..."
                                                    className="h-8 text-xs bg-white"
                                                    value={newSubtaskTitle}
                                                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleAddSubtask(habit.id);
                                                        }
                                                    }}
                                                />
                                                <Button size="sm" className="h-8" onClick={() => handleAddSubtask(habit.id)}>
                                                    <Plus className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {habits.length === 0 && <p className="text-center text-gray-400 text-sm">أضف عادة جديدة لبدء التتبع</p>}
                    </div>
                </CardContent>
            </Card>

            {/* Add Habit Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-right">إضافة عادة جديدة</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-bold mb-1 block">اسم العادة</label>
                            <Input
                                placeholder="مثال: قراءة القرآن"
                                value={newHabitName}
                                onChange={e => setNewHabitName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold mb-1 block">التكرار</label>
                            <Select value={newHabitFrequency} onValueChange={(v: any) => setNewHabitFrequency(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">يومياً</SelectItem>
                                    <SelectItem value="weekly">أسبوعياً</SelectItem>
                                    <SelectItem value="monthly">شهرياً</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {newHabitFrequency === 'daily' && (
                            <div>
                                <label className="text-sm font-bold mb-1 block">عدد المرات يومياً</label>
                                <Select value={newTimesPerDay.toString()} onValueChange={(v) => setNewTimesPerDay(Number(v))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">مرة واحدة</SelectItem>
                                        <SelectItem value="2">مرتين</SelectItem>
                                        <SelectItem value="3">3 مرات</SelectItem>
                                        <SelectItem value="4">4 مرات</SelectItem>
                                        <SelectItem value="5">5 مرات</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <Button className="w-full" onClick={handleAdd} disabled={!newHabitName.trim()}>
                            <Plus className="w-4 h-4 ml-1" /> إضافة العادة
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Habit Dialog */}
            <Dialog open={!!editingHabit} onOpenChange={() => setEditingHabit(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-right flex items-center gap-2">
                            <Settings className="w-5 h-5" /> تعديل العادة
                        </DialogTitle>
                    </DialogHeader>
                    {editingHabit && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold mb-1 block">اسم العادة</label>
                                <Input
                                    value={editingHabit.name}
                                    onChange={e => setEditingHabit({ ...editingHabit, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold mb-1 block">التكرار</label>
                                <Select value={editingHabit.frequency} onValueChange={(v) => setEditingHabit({ ...editingHabit, frequency: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">يومياً</SelectItem>
                                        <SelectItem value="weekly">أسبوعياً</SelectItem>
                                        <SelectItem value="monthly">شهرياً</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {editingHabit.frequency === 'daily' && (
                                <div>
                                    <label className="text-sm font-bold mb-1 block">عدد المرات يومياً</label>
                                    <Select value={(editingHabit.timesPerDay || 1).toString()} onValueChange={(v) => setEditingHabit({ ...editingHabit, timesPerDay: Number(v) })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">مرة واحدة</SelectItem>
                                            <SelectItem value="2">مرتين</SelectItem>
                                            <SelectItem value="3">3 مرات</SelectItem>
                                            <SelectItem value="4">4 مرات</SelectItem>
                                            <SelectItem value="5">5 مرات</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <Button className="w-full" onClick={handleSaveEdit}>
                                حفظ التغييرات
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

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
