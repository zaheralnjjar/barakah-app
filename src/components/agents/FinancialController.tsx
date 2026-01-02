import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  PlusCircle,
  MinusCircle,
  RefreshCw,
  Edit,
  Trash2,
  Share2,
  X,
  Bell,
  Calendar,
  RotateCw,
  Power,
  MoreVertical,
  Pencil,
  FileSpreadsheet,
  Upload,
  ChevronLeft,
  ChevronDown,
  Target,
  History
} from 'lucide-react';
import { fetchBNARate } from '@/lib/currency';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAppStore } from '@/stores/useAppStore';
import { Share } from '@capacitor/share';
import { useRecurringExpenses, RecurringExpense } from '@/hooks/useRecurringExpenses';
import { Badge } from '@/components/ui/badge';
import CSVImportDialog from '@/components/CSVImportDialog';
import CategoryExpenseChart from '@/components/CategoryExpenseChart';
import { useDollarRate } from '@/hooks/useDollarRate';

const FinancialController = () => {
  const [financeData, setFinanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Consolidated Dollar Rate
  const { rates: dollarRates } = useDollarRate();
  const currentRate = dollarRates?.blue?.value_sell || financeData?.exchange_rate || 1200;

  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    currency: 'ARS',
    type: 'expense',
    description: '',
    category: 'أخرى',
    date: ''
  });
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null); // 'add', 'goals', 'history'

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  // Subscription tracking
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [newSubscription, setNewSubscription] = useState({
    name: '',
    amount: '',
    currency: 'ARS',
    renewalDate: '',
    renewalMonth: '',
    cycle: 'monthly',
    reminderDays: 3
  });

  // Budget & Savings State
  const [budgets, setBudgets] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('baraka_budgets') || '[]'); } catch { return []; }
  });
  const [savingsGoals, setSavingsGoals] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('baraka_savings') || '[]'); } catch { return []; }
  });
  const [newBudget, setNewBudget] = useState({ category: '', limit: '' });
  const [newGoal, setNewGoal] = useState({ name: '', target: '', current: '' });

  // CSV Import Dialog State
  const [showImportDialog, setShowImportDialog] = useState(false);

  const { toast } = useToast();
  const expenseCategories = useAppStore((s) => s.expenseCategories);
  const incomeCategories = useAppStore((s) => s.incomeCategories);

  const {
    recurringExpenses,
    addRecurringExpense,
    deleteRecurringExpense,
    toggleActive,
    getDueExpenses,
    markAsProcessed,
  } = useRecurringExpenses();

  const loadFinanceData = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data, error } = await supabase
        .from('finance_data_2025_12_18_18_42')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setFinanceData(data);

      const bnaRate = await fetchBNARate();
      if (bnaRate && bnaRate !== data.exchange_rate) {
        setFinanceData((prev: any) => ({ ...prev, exchange_rate: bnaRate }));
        await supabase.from('finance_data_2025_12_18_18_42')
          .update({ exchange_rate: bnaRate, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
      }
    } catch (error: any) {
      console.error('Error loading finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
    const saved = localStorage.getItem('baraka_subscriptions');
    if (saved) setSubscriptions(JSON.parse(saved));
  }, []);

  const getFilteredTransactions = () => {
    if (!financeData) return [];
    let transactions = financeData.pending_expenses || [];
    if (filterCategory !== 'all') {
      transactions = transactions.filter((t: any) => t.category === filterCategory);
    }
    if (filterDate) {
      if (filterEndDate) {
        transactions = transactions.filter((t: any) => {
          const tDate = t.timestamp?.split('T')[0] || '';
          return tDate >= filterDate && tDate <= filterEndDate;
        });
      } else {
        transactions = transactions.filter((t: any) => t.timestamp?.startsWith(filterDate));
      }
    }
    return transactions.slice().reverse();
  };

  const calculateDailyLimit = () => {
    if (!financeData) return 0;
    const totalBalance = financeData.current_balance_ars + (financeData.current_balance_usd * currentRate);
    const availableBalance = totalBalance - financeData.emergency_buffer - financeData.total_debt;
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - today.getDate();
    return Math.max(0, availableBalance / (remainingDays + 3));
  };

  const addTransaction = async () => {
    if (!newTransaction.amount) return;
    setUpdating(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;
      const amount = parseFloat(newTransaction.amount);
      const isExpense = newTransaction.type === 'expense';
      let balanceARS = financeData.current_balance_ars;
      let balanceUSD = financeData.current_balance_usd;
      if (newTransaction.currency === 'ARS') balanceARS += isExpense ? -amount : amount;
      else balanceUSD += isExpense ? -amount : amount;

      const updatedExpenses = [...(financeData.pending_expenses || []), {
        id: Date.now(),
        amount,
        currency: newTransaction.currency,
        type: newTransaction.type,
        category: newTransaction.category,
        description: newTransaction.description || (isExpense ? 'مصروف بدون وصف' : 'دخل بدون وصف'),
        timestamp: new Date().toISOString()
      }];

      await supabase.from('finance_data_2025_12_18_18_42')
        .update({
          current_balance_ars: balanceARS,
          current_balance_usd: balanceUSD,
          pending_expenses: updatedExpenses,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      setNewTransaction({ amount: '', currency: 'ARS', type: 'expense', description: '', category: 'أخرى', date: '' });
      toast({ title: 'تمت إضافة المعاملة بنجاح' });
      loadFinanceData();
    } finally {
      setUpdating(false);
    }
  };

  const updateExchangeRate = async (newRate: string) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;
      await supabase.from('finance_data_2025_12_18_18_42')
        .update({ exchange_rate: parseFloat(newRate), updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      loadFinanceData();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteTransaction = async (transactionId: number) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const transaction = financeData.pending_expenses.find((t: any) => t.id === transactionId);
      if (!transaction) return;

      // Reverse the balance impact
      let balanceARS = financeData.current_balance_ars;
      let balanceUSD = financeData.current_balance_usd;
      const isExpense = transaction.type === 'expense';

      if (transaction.currency === 'ARS') {
        balanceARS += isExpense ? transaction.amount : -transaction.amount;
      } else {
        balanceUSD += isExpense ? transaction.amount : -transaction.amount;
      }

      const updatedExpenses = financeData.pending_expenses.filter((t: any) => t.id !== transactionId);

      await supabase.from('finance_data_2025_12_18_18_42')
        .update({
          current_balance_ars: balanceARS,
          current_balance_usd: balanceUSD,
          pending_expenses: updatedExpenses,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      toast({ title: 'تم الحذف', description: 'تم حذف المعاملة بنجاح' });
      loadFinanceData();
    } catch (e) {
      console.error(e);
      toast({ title: 'خطأ', description: 'فشل في حذف المعاملة', variant: 'destructive' });
    }
  };

  const saveEditedTransaction = async () => {
    if (!editingTransaction) return;
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const oldTransaction = financeData.pending_expenses.find((t: any) => t.id === editingTransaction.id);
      if (!oldTransaction) return;

      // Calculate balance changes
      let balanceARS = financeData.current_balance_ars;
      let balanceUSD = financeData.current_balance_usd;

      // Reverse old transaction
      if (oldTransaction.currency === 'ARS') {
        balanceARS += oldTransaction.type === 'expense' ? oldTransaction.amount : -oldTransaction.amount;
      } else {
        balanceUSD += oldTransaction.type === 'expense' ? oldTransaction.amount : -oldTransaction.amount;
      }

      // Apply new transaction
      const newAmount = parseFloat(editingTransaction.amount);
      if (editingTransaction.currency === 'ARS') {
        balanceARS += editingTransaction.type === 'expense' ? -newAmount : newAmount;
      } else {
        balanceUSD += editingTransaction.type === 'expense' ? -newAmount : newAmount;
      }

      const updatedExpenses = financeData.pending_expenses.map((t: any) =>
        t.id === editingTransaction.id
          ? { ...t, ...editingTransaction, amount: newAmount }
          : t
      );

      await supabase.from('finance_data_2025_12_18_18_42')
        .update({
          current_balance_ars: balanceARS,
          current_balance_usd: balanceUSD,
          pending_expenses: updatedExpenses,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      toast({ title: 'تم التحديث', description: 'تم تحديث المعاملة بنجاح' });
      setEditingTransaction(null);
      loadFinanceData();
    } catch (e) {
      console.error(e);
      toast({ title: 'خطأ', description: 'فشل في تحديث المعاملة', variant: 'destructive' });
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!financeData) return <div className="p-8 text-center">No data</div>;

  const dailyLimit = calculateDailyLimit();
  const totalBalanceARS = financeData.current_balance_ars + (financeData.current_balance_usd * currentRate);

  return (
    <div className="space-y-6 container mx-auto px-4 py-4 md:py-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-primary arabic-title">الإدارة المالية</h1>
          <p className="arabic-body text-sm text-muted-foreground">تتبع ميزانيتك ومصروفاتك بكل سهولة</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)} className="flex items-center gap-1">
            <FileSpreadsheet className="w-4 h-4" />
            <span className="text-xs">استيراد</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none">
          <CardContent className="p-3">
            <p className="text-[10px] opacity-80 mb-1">الرصيد الإجمالي</p>
            <div className="text-lg font-bold">{totalBalanceARS.toLocaleString()} ARS</div>
            <p className="text-[9px] opacity-70">≈ ${(totalBalanceARS / currentRate).toFixed(0)}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-emerald-100">
          <CardContent className="p-3">
            <p className="text-[10px] text-emerald-600 mb-1">الحد اليومي</p>
            <div className="text-lg font-bold text-emerald-700">{dailyLimit.toLocaleString()} ARS</div>
            <p className="text-[9px] text-gray-400">≈ ${(dailyLimit / currentRate).toFixed(0)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          {/* 1. Add Transaction Section */}
          <div className="bg-white rounded-xl shadow-sm border border-emerald-100/60 overflow-hidden transition-all duration-300">
            <button
              onClick={() => toggleSection('add')}
              className={`w-full p-4 flex items-center justify-between transition-colors ${expandedSection === 'add' ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full transition-colors ${expandedSection === 'add' ? 'bg-emerald-200 text-emerald-700' : 'bg-emerald-100 text-emerald-600'}`}>
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">إضافة معاملة جديدة</div>
                  {!expandedSection && <div className="text-[10px] text-gray-400">سجل مصروف أو دخل جديد</div>}
                </div>
              </div>
              {expandedSection === 'add' ? <ChevronDown className="w-5 h-5 text-emerald-600" /> : <ChevronLeft className="w-5 h-5 text-gray-300" />}
            </button>

            {expandedSection === 'add' && (
              <div className="p-4 border-t border-emerald-100 bg-white animate-in slide-in-from-top-2 duration-200">
                {/* Transaction Form Inline */}
                <div className="space-y-4">
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                    <button
                      onClick={() => setNewTransaction(p => ({ ...p, type: 'expense', category: 'أخرى' }))}
                      className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-all ${newTransaction.type === 'expense'
                        ? 'bg-red-500 text-white shadow-md'
                        : 'bg-transparent text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      <MinusCircle className="w-4 h-4" />
                      <span className="font-medium text-sm">مصروف</span>
                    </button>
                    <button
                      onClick={() => setNewTransaction(p => ({ ...p, type: 'income', category: 'راتب' }))}
                      className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-all ${newTransaction.type === 'income'
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-transparent text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span className="font-medium text-sm">دخل</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">المبلغ</Label>
                      <Input type="number" placeholder="0.00" value={newTransaction.amount} onChange={(e) => setNewTransaction(p => ({ ...p, amount: e.target.value }))} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">العملة</Label>
                      <Select value={newTransaction.currency} onValueChange={(v) => setNewTransaction(p => ({ ...p, currency: v }))}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ARS">ARS</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">الفئة</Label>
                      <Select value={newTransaction.category} onValueChange={(v) => setNewTransaction(p => ({ ...p, category: v }))}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(newTransaction.type === 'expense' ? expenseCategories : incomeCategories).map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">الوصف</Label>
                      <Input placeholder="وصف..." value={newTransaction.description} onChange={(e) => setNewTransaction(p => ({ ...p, description: e.target.value }))} className="h-9" />
                    </div>
                  </div>

                  <Button onClick={addTransaction} disabled={updating} className={`w-full h-10 ${newTransaction.type === 'expense' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                    {updating ? <RefreshCw className="w-4 h-4 animate-spin ml-2" /> : null}
                    {newTransaction.type === 'expense' ? 'تسجيل مصروف' : 'تسجيل دخل'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Savings Goals Section */}
          <div className="bg-white rounded-xl shadow-sm border border-emerald-100/60 overflow-hidden transition-all duration-300">
            <button
              onClick={() => toggleSection('goals')}
              className={`w-full p-4 flex items-center justify-between transition-colors ${expandedSection === 'goals' ? 'bg-blue-50 text-blue-800' : 'hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full transition-colors ${expandedSection === 'goals' ? 'bg-blue-200 text-blue-700' : 'bg-blue-100 text-blue-600'}`}>
                  <Target className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">أهداف الادخار</div>
                  {!expandedSection && <div className="text-[10px] text-gray-400">تابع تقدمك المالي</div>}
                </div>
              </div>
              {expandedSection === 'goals' ? <ChevronDown className="w-5 h-5 text-blue-600" /> : <ChevronLeft className="w-5 h-5 text-gray-300" />}
            </button>

            {expandedSection === 'goals' && (
              <div className="p-4 border-t border-blue-100 bg-white animate-in slide-in-from-top-2 duration-200">
                <div className="space-y-3">
                  {savingsGoals.map(goal => (
                    <div key={goal.id} className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div className="flex justify-between text-sm font-bold"><span>{goal.name}</span><span>{Math.round((goal.current / goal.target) * 100)}%</span></div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (goal.current / goal.target) * 100)}%` }} /></div>
                      <div className="flex justify-between text-[10px] items-center mt-1">
                        <span className="font-bold text-gray-700">{goal.current.toLocaleString()} / {goal.target.toLocaleString()} ARS</span>
                        <span className="text-gray-400">≈ ${(goal.current / currentRate).toFixed(0)}</span>
                      </div>
                    </div>
                  ))}
                  {savingsGoals.length === 0 && <p className="text-center text-gray-400 text-sm py-2">لا توجد أهداف حالياً</p>}
                </div>
              </div>
            )}
          </div>

          {/* 3. Recent Transactions Section */}
          <div className="bg-white rounded-xl shadow-sm border border-emerald-100/60 overflow-hidden transition-all duration-300">
            <button
              onClick={() => toggleSection('history')}
              className={`w-full p-4 flex items-center justify-between transition-colors ${expandedSection === 'history' ? 'bg-purple-50 text-purple-800' : 'hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full transition-colors ${expandedSection === 'history' ? 'bg-purple-200 text-purple-700' : 'bg-purple-100 text-purple-600'}`}>
                  <History className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">آخر المعاملات</div>
                  {!expandedSection && <div className="text-[10px] text-gray-400">سجل النشاط المالي</div>}
                </div>
              </div>
              {expandedSection === 'history' ? <ChevronDown className="w-5 h-5 text-purple-600" /> : <ChevronLeft className="w-5 h-5 text-gray-300" />}
            </button>

            {expandedSection === 'history' && (
              <div className="p-4 border-t border-purple-100 bg-white animate-in slide-in-from-top-2 duration-200">
                <CategoryExpenseChart transactions={financeData.pending_expenses || []} exchangeRate={currentRate} />
                <div className="mt-4 border rounded-lg overflow-hidden">
                  <div className="max-h-[300px] overflow-y-auto">
                    <table className="w-full text-right text-[12px]">
                      <thead className="bg-gray-50 text-gray-500 sticky top-0 z-10">
                        <tr>
                          <th className="p-2">الوصف</th>
                          <th className="p-2">المبلغ</th>
                          <th className="p-2 w-16">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {getFilteredTransactions().slice(0, 15).map((t: any) => (
                          <tr key={t.id} className="hover:bg-gray-50 group">
                            <td className="p-2">
                              <div className="font-medium truncate max-w-[120px]">{t.description}</div>
                              <div className="text-[10px] text-gray-400">{new Date(t.timestamp).toLocaleDateString('ar')}</div>
                            </td>
                            <td className="p-2">
                              <div className={`font-bold ${t.type === 'expense' ? 'text-red-600' : 'text-emerald-600'}`}>
                                {t.type === 'expense' ? '-' : '+'}{t.amount.toLocaleString()}
                              </div>
                              <div className="text-[9px] text-gray-400">{t.currency}</div>
                            </td>
                            <td className="p-2 text-center">
                              <div className="flex justify-end gap-1">
                                <button onClick={() => setEditingTransaction({ ...t, amount: t.amount.toString() })} className="p-1 rounded hover:bg-blue-50 text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={() => { if (confirm('حذف؟')) deleteTransaction(t.id); }} className="p-1 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Exchange Rate Card (Compact) */}
          <Card className="border-emerald-100 bg-emerald-50/30">
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">سعر الصرف الحالي</div>
                <div className="text-lg font-bold text-emerald-700 font-mono">{currentRate} ARS</div>
              </div>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => {
                const val = prompt('تحديث سعر الصرف يدوياً:', currentRate.toString());
                if (val) updateExchangeRate(val);
              }}><Pencil className="w-4 h-4 text-emerald-600" /></Button>
            </CardContent>
          </Card>
        </div>

        {/* Edit Transaction Dialog */}
        <Dialog open={!!editingTransaction} onOpenChange={(open) => !open && setEditingTransaction(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="arabic-title">تعديل المعاملة</DialogTitle>
            </DialogHeader>
            {editingTransaction && (
              <div className="space-y-4">
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => setEditingTransaction((p: any) => ({ ...p, type: 'expense' }))}
                    className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-all ${editingTransaction.type === 'expense'
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-transparent text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    <MinusCircle className="w-4 h-4" />
                    <span className="font-medium text-sm">مصروف</span>
                  </button>
                  <button
                    onClick={() => setEditingTransaction((p: any) => ({ ...p, type: 'income' }))}
                    className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-all ${editingTransaction.type === 'income'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'bg-transparent text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span className="font-medium text-sm">دخل</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">المبلغ</Label>
                    <Input
                      type="number"
                      value={editingTransaction.amount}
                      onChange={(e) => setEditingTransaction((p: any) => ({ ...p, amount: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">العملة</Label>
                    <Select
                      value={editingTransaction.currency}
                      onValueChange={(v) => setEditingTransaction((p: any) => ({ ...p, currency: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ARS">ARS</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">الفئة</Label>
                  <Select
                    value={editingTransaction.category || 'أخرى'}
                    onValueChange={(v) => setEditingTransaction((p: any) => ({ ...p, category: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(editingTransaction.type === 'expense' ? expenseCategories : incomeCategories).map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">الوصف</Label>
                  <Input
                    value={editingTransaction.description}
                    onChange={(e) => setEditingTransaction((p: any) => ({ ...p, description: e.target.value }))}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={saveEditedTransaction} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    حفظ التغييرات
                  </Button>
                  <Button variant="outline" onClick={() => setEditingTransaction(null)}>
                    إلغاء
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <CSVImportDialog isOpen={showImportDialog} onClose={() => setShowImportDialog(false)} onSuccess={loadFinanceData} />
      </div>
    </div>
  );
};

export default FinancialController;