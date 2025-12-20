import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useToast } from '@/hooks/use-toast';

const CategoryManager = () => {
    const { toast } = useToast();
    const expenseCategories = useAppStore((s) => s.expenseCategories);
    const incomeCategories = useAppStore((s) => s.incomeCategories);
    const addExpenseCategory = useAppStore((s) => s.addExpenseCategory);
    const deleteExpenseCategory = useAppStore((s) => s.deleteExpenseCategory);
    const addIncomeCategory = useAppStore((s) => s.addIncomeCategory);
    const deleteIncomeCategory = useAppStore((s) => s.deleteIncomeCategory);

    const [newExpense, setNewExpense] = useState('');
    const [newIncome, setNewIncome] = useState('');

    const handleAddExpense = () => {
        if (!newExpense.trim()) return;
        addExpenseCategory(newExpense.trim());
        setNewExpense('');
        toast({ title: 'تمت الإضافة', description: 'تم إضافة فئة المصروف' });
    };

    const handleAddIncome = () => {
        if (!newIncome.trim()) return;
        addIncomeCategory(newIncome.trim());
        setNewIncome('');
        toast({ title: 'تمت الإضافة', description: 'تم إضافة فئة الدخل' });
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>فئات المصروفات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="إضافة فئة جديدة..."
                            value={newExpense}
                            onChange={(e) => setNewExpense(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddExpense()}
                        />
                        <Button onClick={handleAddExpense} size="icon">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {expenseCategories.map((cat) => (
                            <Badge key={cat} variant="secondary" className="flex items-center gap-1">
                                {cat}
                                <button
                                    onClick={() => {
                                        deleteExpenseCategory(cat);
                                        toast({ title: 'تم الحذف', description: 'تم حذف الفئة' });
                                    }}
                                    className="ml-1"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>فئات الدخل</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="إضافة فئة جديدة..."
                            value={newIncome}
                            onChange={(e) => setNewIncome(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddIncome()}
                        />
                        <Button onClick={handleAddIncome} size="icon">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {incomeCategories.map((cat) => (
                            <Badge key={cat} variant="secondary" className="flex items-center gap-1">
                                {cat}
                                <button
                                    onClick={() => {
                                        deleteIncomeCategory(cat);
                                        toast({ title: 'تم الحذف', description: 'تم حذف الفئة' });
                                    }}
                                    className="ml-1"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div >
    );
};

export default CategoryManager;
