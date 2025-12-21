import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Target, Plus, Trash2, PiggyBank, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface FinancialGoal {
    id: string;
    name: string;
    target: number;
    current: number;
    currency: string;
    deadline?: string;
}

const FinancialGoals: React.FC = () => {
    const [goals, setGoals] = useState<FinancialGoal[]>([]);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [newGoal, setNewGoal] = useState({ name: '', target: '', currency: 'ARS' });
    const [addAmount, setAddAmount] = useState('');
    const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        loadGoals();
    }, []);

    const loadGoals = () => {
        const data = JSON.parse(localStorage.getItem('baraka_financial_goals') || '[]');
        setGoals(data);
    };

    const saveGoals = (newGoals: FinancialGoal[]) => {
        localStorage.setItem('baraka_financial_goals', JSON.stringify(newGoals));
        setGoals(newGoals);
    };

    const addGoal = () => {
        if (!newGoal.name || !newGoal.target) return;

        const goal: FinancialGoal = {
            id: Date.now().toString(),
            name: newGoal.name,
            target: parseFloat(newGoal.target),
            current: 0,
            currency: newGoal.currency,
        };

        saveGoals([...goals, goal]);
        setNewGoal({ name: '', target: '', currency: 'ARS' });
        setShowAddDialog(false);
        toast({ title: '✅ تم إضافة الهدف', description: newGoal.name });
    };

    const addToGoal = () => {
        if (!selectedGoal || !addAmount) return;

        const amount = parseFloat(addAmount);
        const updated = goals.map(g =>
            g.id === selectedGoal.id
                ? { ...g, current: g.current + amount }
                : g
        );

        saveGoals(updated);
        setAddAmount('');
        setSelectedGoal(null);
        toast({ title: '💰 تمت الإضافة', description: `تم إضافة ${amount} ${selectedGoal.currency}` });
    };

    const deleteGoal = (id: string) => {
        saveGoals(goals.filter(g => g.id !== id));
        toast({ title: '🗑️ تم الحذف' });
    };

    const getProgress = (current: number, target: number) => {
        return Math.min((current / target) * 100, 100);
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-lg">
                        <span className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary" />
                            الأهداف المالية
                        </span>
                        <Button size="sm" onClick={() => setShowAddDialog(true)}>
                            <Plus className="w-4 h-4 mr-1" />
                            هدف جديد
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {goals.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">لا توجد أهداف بعد</p>
                    ) : (
                        <div className="space-y-4">
                            {goals.map(goal => (
                                <div key={goal.id} className="border rounded-lg p-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium flex items-center gap-2">
                                            <PiggyBank className="w-4 h-4 text-yellow-500" />
                                            {goal.name}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => deleteGoal(goal.id)}
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                    <Progress value={getProgress(goal.current, goal.target)} className="h-2 mb-2" />
                                    <div className="flex justify-between text-sm">
                                        <span className="text-primary font-bold">
                                            {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.currency}
                                        </span>
                                        <span className="text-gray-500">
                                            {getProgress(goal.current, goal.target).toFixed(0)}%
                                        </span>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="w-full mt-2"
                                        onClick={() => setSelectedGoal(goal)}
                                    >
                                        <TrendingUp className="w-4 h-4 mr-1" />
                                        إضافة للهدف
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Goal Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>🎯 إضافة هدف مالي جديد</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            placeholder="اسم الهدف (مثال: شراء سيارة)"
                            value={newGoal.name}
                            onChange={e => setNewGoal({ ...newGoal, name: e.target.value })}
                        />
                        <Input
                            type="number"
                            placeholder="المبلغ المطلوب"
                            value={newGoal.target}
                            onChange={e => setNewGoal({ ...newGoal, target: e.target.value })}
                        />
                        <select
                            className="w-full p-2 border rounded-md"
                            value={newGoal.currency}
                            onChange={e => setNewGoal({ ...newGoal, currency: e.target.value })}
                        >
                            <option value="ARS">ARS - بيزو</option>
                            <option value="USD">USD - دولار</option>
                        </select>
                    </div>
                    <DialogFooter>
                        <Button onClick={addGoal}>حفظ الهدف</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Amount Dialog */}
            <Dialog open={!!selectedGoal} onOpenChange={() => setSelectedGoal(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>💰 إضافة مبلغ لـ {selectedGoal?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            type="number"
                            placeholder="المبلغ"
                            value={addAmount}
                            onChange={e => setAddAmount(e.target.value)}
                        />
                        <p className="text-sm text-gray-500">
                            الرصيد الحالي: {selectedGoal?.current.toLocaleString()} {selectedGoal?.currency}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button onClick={addToGoal}>إضافة</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FinancialGoals;
