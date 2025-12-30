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
  Upload
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none">
          <CardHeader className="pb-2">
            <CardTitle className="arabic-title text-sm flex items-center opacity-90"><DollarSign className="w-4 h-4 ml-2" />الرصيد الإجمالي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBalanceARS.toLocaleString()} ARS</div>
            <p className="text-sm opacity-80">≈ {(totalBalanceARS / currentRate).toFixed(2)} USD</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="arabic-title text-sm flex items-center text-emerald-600"><TrendingUp className="w-4 h-4 ml-2" />الحد اليومي المتاح</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{dailyLimit.toLocaleString()} ARS</div>
            <p className="text-[10px] text-muted-foreground">≈ {(dailyLimit / currentRate).toFixed(1)} USD</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-red-100">
          <CardHeader className="pb-2">
            <CardTitle className="arabic-title text-sm flex items-center text-red-600"><TrendingDown className="w-4 h-4 ml-2" />إجمالي الديون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{financeData.total_debt.toLocaleString()} ARS</div>
            <p className="text-[10px] text-red-600/70">≈ {(financeData.total_debt / currentRate).toFixed(1)} USD</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-emerald-100 shadow-sm">
            <div className="bg-emerald-50/50 px-4 py-2 border-b border-emerald-100">
              <span className="arabic-title text-emerald-800 text-sm font-bold flex items-center gap-2"><PlusCircle className="w-4 h-4" /> إضافة معاملة</span>
            </div>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">المبلغ</Label>
                  <Input type="number" value={newTransaction.amount} onChange={(e) => setNewTransaction(p => ({ ...p, amount: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">العملة</Label>
                  <Select value={newTransaction.currency} onValueChange={(v) => setNewTransaction(p => ({ ...p, currency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARS">ARS</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">الوصف</Label>
                <Input value={newTransaction.description} onChange={(e) => setNewTransaction(p => ({ ...p, description: e.target.value }))} />
              </div>
              <Button onClick={addTransaction} className="w-full bg-emerald-600 hover:bg-emerald-700">حفظ المعاملة</Button>
            </CardContent>
          </Card>

          <CategoryExpenseChart transactions={financeData.pending_expenses || []} exchangeRate={currentRate} />
        </div>

        <div className="space-y-6">
          <Card className="border-emerald-100 bg-gray-50">
            <CardHeader className="p-3 border-b border-emerald-100 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold text-emerald-800">سعر الصرف</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{currentRate}</div>
                <Button size="sm" variant="ghost" onClick={() => {
                  const val = prompt('تحديث سعر الصرف يدوياً:', currentRate.toString());
                  if (val) updateExchangeRate(val);
                }}><Pencil className="w-3 h-3" /></Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 transition-all hover:shadow-md">
            <CardHeader className="p-3 border-b border-emerald-100 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold text-emerald-800">أهداف الادخار</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {savingsGoals.map(goal => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold"><span>{goal.name}</span><span>{Math.round((goal.current / goal.target) * 100)}%</span></div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (goal.current / goal.target) * 100)}%` }} /></div>
                  <div className="flex justify-between text-[10px] items-center">
                    <div className="flex flex-col">
                      <span className="font-bold">{goal.current.toLocaleString()} / {goal.target.toLocaleString()} ARS</span>
                      <span className="text-gray-400">≈ ${(goal.current / currentRate).toFixed(0)} / ${(goal.target / currentRate).toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-emerald-100">
            <CardHeader className="p-3 border-b">
              <CardTitle className="text-xs font-bold">آخر المعاملات</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-right text-[10px]">
                <tbody className="divide-y">
                  {getFilteredTransactions().slice(0, 10).map((t: any) => (
                    <tr key={t.id} className="hover:bg-gray-50/50">
                      <td className="p-2">
                        <div className="font-medium">{t.description}</div>
                        <div className="text-[9px] text-gray-400">{new Date(t.timestamp).toLocaleDateString('ar')}</div>
                      </td>
                      <td className="p-2 text-left">
                        <div className={`font-bold ${t.type === 'expense' ? 'text-red-600' : 'text-emerald-600'}`}>{t.amount.toLocaleString()} {t.currency}</div>
                        <div className="text-[9px] text-gray-400">≈ {t.currency === 'USD' ? (t.amount * currentRate).toLocaleString() + ' ARS' : '$' + (t.amount / currentRate).toFixed(2)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>

      <CSVImportDialog isOpen={showImportDialog} onClose={() => setShowImportDialog(false)} onSuccess={loadFinanceData} />
    </div>
  );
};

export default FinancialController;