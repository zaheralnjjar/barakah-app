import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Check, Trash2 } from 'lucide-react';
import { useHabits } from '@/hooks/useHabits';

export const HabitTracker = () => {
    const { habits, addHabit, toggleHabit, deleteHabit } = useHabits();
    const [newHabitName, setNewHabitName] = useState('');

    const handleAdd = () => {
        addHabit(newHabitName);
        setNewHabitName('');
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="arabic-title text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">🔥 متتبع العادات</span>
                    <div className="flex gap-1">
                        <Input
                            placeholder="عادة جديدة..."
                            value={newHabitName}
                            onChange={e => setNewHabitName(e.target.value)}
                            className="h-8 w-32 text-xs"
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        />
                        <Button size="sm" className="h-8" onClick={handleAdd}><Plus className="w-3 h-3" /></Button>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {habits.map(habit => {
                        const today = new Date().toISOString().split('T')[0];
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
    );
};
