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


const FinancialController = () => {
  const [financeData, setFinanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
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

  // Subscription tracking - Enhanced
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [newSubscription, setNewSubscription] = useState({
    name: '',
    amount: '',
    currency: 'ARS',
    renewalDate: '', // Day of month (1-31)
    renewalMonth: '', // Month (1-12) for yearly
    cycle: 'monthly', // monthly or yearly
    reminderDays: 3 // Days before to remind
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

  // Date Range Filter State
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [filterEndDate, setFilterEndDate] = useState('');

  // CSV Import Dialog State
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Get Filtered Transactions Helper
  const getFilteredTransactions = () => {
    let transactions = financeData.pending_expenses || [];
    if (filterCategory !== 'all') {
      transactions = transactions.filter((t: any) => t.category === filterCategory);
    }
    if (filterDate) {
      if (filterEndDate) {
        // Date range
        transactions = transactions.filter((t: any) => {
          const tDate = t.timestamp?.split('T')[0] || '';
          return tDate >= filterDate && tDate <= filterEndDate;
        });
      } else {
        // Single date
        transactions = transactions.filter((t: any) => t.timestamp?.startsWith(filterDate));
      }
    }
    return transactions.slice(-50).reverse();
  };

  // Currency Converter State (kept for internal use)
  const [converter, setConverter] = useState({ amount: '', from: 'USD', to: 'ARS', result: 0 });

  // Report State
  const generateReport = () => {
    const printContent = document.getElementById('finance-report');
    const win = window.open('', '', 'width=900,height=650');
    if (win && printContent) {
      win.document.write('<html><head><title>تقرير مالي</title>');
      win.document.write('<style>');
      win.document.write('body{font-family:sans-serif;direction:rtl;padding:20px;}');
      win.document.write('table{width:100%;border-collapse:collapse;margin-top:20px;}');
      win.document.write('th,td{border:1px solid #ddd;padding:8px;text-align:right;}');
      win.document.write('th{background:#f0f0f0;}');
      win.document.write('.no-print{display:none !important;}');
      win.document.write('@media print { .no-print { display: none !important; } }');
      win.document.write('.back-btn { background: #64748b; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; margin-bottom: 20px; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; }');
      win.document.write('.print-btn { background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; margin-bottom: 20px; margin-left: 10px; font-size: 14px; }');
      win.document.write('</style>');
      win.document.write('</head><body>');

      // Controls
      win.document.write('<div class="no-print" style="text-align:center;">');
      win.document.write('<button onclick="window.print()" class="print-btn">🖨️ طباعة</button>');
      win.document.write('<button onclick="window.close()" class="back-btn">🔙 رجوع للتطبيق</button>');
      win.document.write('</div>');

      win.document.write('<h1>تقرير مالي أسبوعي</h1>');
      win.document.write(printContent.innerHTML);
      win.document.write('</body></html>');
      win.document.close();
      // win.print(); // Let user click the button
    }
  };

  const saveBudget = () => {
    if (!newBudget.category || !newBudget.limit) return;
    const updated = [...budgets.filter(b => b.category !== newBudget.category), { ...newBudget, limit: parseFloat(newBudget.limit) }];
    setBudgets(updated);
    localStorage.setItem('baraka_budgets', JSON.stringify(updated));
    setNewBudget({ category: '', limit: '' });
    toast({ title: 'تم حفظ الميزانية' });
  };

  const saveGoal = () => {
    if (!newGoal.name || !newGoal.target) return;
    const updated = [...savingsGoals, { id: Date.now(), ...newGoal, target: parseFloat(newGoal.target), current: parseFloat(newGoal.current || '0') }];
    setSavingsGoals(updated);
    localStorage.setItem('baraka_savings', JSON.stringify(updated));
    setNewGoal({ name: '', target: '', current: '' });
    toast({ title: 'تم حفظ الهدف' });
  };

  const calculateConversion = () => {
    const rate = financeData?.exchange_rate || 1150; // Fallback
    const amount = parseFloat(converter.amount);
    if (isNaN(amount)) return;

    if (converter.from === 'USD' && converter.to === 'ARS') {
      setConverter({ ...converter, result: amount * rate });
    } else if (converter.from === 'ARS' && converter.to === 'USD') {
      setConverter({ ...converter, result: amount / rate });
    } else {
      setConverter({ ...converter, result: amount });
    }
  };

  // Hardcoded automated source
  const exchangeRateSource = 'Banco de la Nación Argentina';

  const expenseCategories = useAppStore((s) => s.expenseCategories);
  const incomeCategories = useAppStore((s) => s.incomeCategories);
  const { toast } = useToast();

  // Recurring expenses hook
  const {
    recurringExpenses,
    addRecurringExpense,
    deleteRecurringExpense,
    toggleActive,
    getDueExpenses,
    getUpcomingReminders,
    markAsProcessed,
    getMonthlyTotal,
  } = useRecurringExpenses();

  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [newRecurring, setNewRecurring] = useState({
    name: '',
    amount: '',
    currency: 'ARS' as 'ARS' | 'USD',
    category: 'فواتير',
    cycle: 'monthly' as 'monthly' | 'yearly',
    dayOfMonth: 1,
    monthOfYear: 1,
    reminderDays: 3,
  });

  // Process due recurring expenses on mount
  useEffect(() => {
    const dueExpenses = getDueExpenses();
    if (dueExpenses.length > 0) {
      toast({
        title: `💰 لديك ${dueExpenses.length} مصروفات متكررة مستحقة اليوم`,
        description: dueExpenses.map(e => e.name).join('، '),
      });
    }
  }, []);

  useEffect(() => {
    loadFinanceData();
  }, []);


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

      // Auto-fetch BNA Rate
      const bnaRate = await fetchBNARate();
      if (bnaRate && bnaRate !== data.exchange_rate) {
        setFinanceData((prev: any) => ({ ...prev, exchange_rate: bnaRate }));

        supabase.from('finance_data_2025_12_18_18_42')
          .update({ exchange_rate: bnaRate, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .then(({ error }) => {
            if (error) console.error("Failed to auto-update rate", error);
            else toast({ title: "تم تحديث سعر الدولار", description: `تم جلب السعر الرسمي: ${bnaRate} ARS` });
          });
      }
    } catch (error: any) {
      console.error('Error loading finance data:', error);
      toast({
        title: "خطأ في تحميل البيانات المالية",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load subscriptions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('baraka_subscriptions');
    if (saved) setSubscriptions(JSON.parse(saved));
  }, []);

  const saveSubscription = () => {
    if (!newSubscription.name || !newSubscription.amount) {
      toast({ title: 'خطأ', description: 'يرجى إدخال الاسم والمبلغ', variant: 'destructive' });
      return;
    }
    const sub = {
      id: Date.now().toString(),
      ...newSubscription,
      amount: parseFloat(newSubscription.amount),
      createdAt: new Date().toISOString()
    };
    const updated = [...subscriptions, sub];
    setSubscriptions(updated);
    localStorage.setItem('baraka_subscriptions', JSON.stringify(updated));
    setNewSubscription({ name: '', amount: '', currency: 'ARS', renewalDate: '', renewalMonth: '', cycle: 'monthly', reminderDays: 3 });
    setShowSubscriptionDialog(false);
    toast({ title: 'تم الحفظ', description: `تم إضافة اشتراك ${sub.name}` });
  };

  const deleteSubscription = (id: string) => {
    const updated = subscriptions.filter(s => s.id !== id);
    setSubscriptions(updated);
    localStorage.setItem('baraka_subscriptions', JSON.stringify(updated));
    toast({ title: 'تم الحذف' });
  };

  const calculateDailyLimit = () => {
    if (!financeData) return 0;
    const totalBalance = financeData.current_balance_ars + (financeData.current_balance_usd * financeData.exchange_rate);
    const availableBalance = totalBalance - financeData.emergency_buffer - financeData.total_debt;
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - today.getDate();
    return Math.max(0, availableBalance / (remainingDays + 3));
  };

  const addTransaction = async () => {
    if (!newTransaction.amount) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال المبلغ",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const amount = parseFloat(newTransaction.amount);
      const isExpense = newTransaction.type === 'expense';

      let updatedBalanceARS = financeData.current_balance_ars;
      let updatedBalanceUSD = financeData.current_balance_usd;

      if (newTransaction.currency === 'ARS') {
        updatedBalanceARS += isExpense ? -amount : amount;
      } else {
        updatedBalanceUSD += isExpense ? -amount : amount;
      }

      const updatedPendingExpenses = [...(financeData.pending_expenses || []), {
        id: Date.now(),
        amount,
        currency: newTransaction.currency,
        type: newTransaction.type,
        category: newTransaction.category,
        description: newTransaction.description || (isExpense ? 'مصروف بدون وصف' : 'دخل بدون وصف'),
        timestamp: new Date().toISOString(),
        source: 'manual_entry'
      }];

      const { error } = await supabase
        .from('finance_data_2025_12_18_18_42')
        .update({
          current_balance_ars: updatedBalanceARS,
          current_balance_usd: updatedBalanceUSD,
          pending_expenses: updatedPendingExpenses,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "تم تسجيل المعاملة",
        description: `تم ${isExpense ? 'خصم' : 'إضافة'} ${amount} ${newTransaction.currency}`,
      });

      setNewTransaction({ amount: '', currency: 'ARS', type: 'expense', description: '', category: 'أخرى', date: '' });
      loadFinanceData();
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      toast({
        title: "خطأ في تسجيل المعاملة",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const deleteTransaction = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه المعاملة؟')) return;

    setUpdating(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const transactionToDelete = financeData.pending_expenses.find((t: any) => t.id === id);
      if (!transactionToDelete) return;

      const updatedExpenses = financeData.pending_expenses.filter((t: any) => t.id !== id);

      let updatedBalanceARS = financeData.current_balance_ars;
      let updatedBalanceUSD = financeData.current_balance_usd;

      const amount = parseFloat(transactionToDelete.amount);
      // Reverse the balance change
      if (transactionToDelete.currency === 'ARS') {
        updatedBalanceARS -= (transactionToDelete.type === 'expense' ? -amount : amount);
      } else {
        updatedBalanceUSD -= (transactionToDelete.type === 'expense' ? -amount : amount);
      }

      const { error } = await supabase
        .from('finance_data_2025_12_18_18_42')
        .update({
          current_balance_ars: updatedBalanceARS,
          current_balance_usd: updatedBalanceUSD,
          pending_expenses: updatedExpenses,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: "تم حذف المعاملة" });
      loadFinanceData();

    } catch (e: any) {
      console.error(e);
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const updateTransaction = async (id: number, updates: any) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const oldTransaction = financeData.pending_expenses.find((t: any) => t.id === id);
      if (!oldTransaction) return;

      // Calculate balance adjustments
      let balanceARS = financeData.current_balance_ars;
      let balanceUSD = financeData.current_balance_usd;

      // Reverse old transaction effect
      const oldAmount = parseFloat(oldTransaction.amount);
      if (oldTransaction.currency === 'ARS') {
        balanceARS += oldTransaction.type === 'expense' ? oldAmount : -oldAmount;
      } else {
        balanceUSD += oldTransaction.type === 'expense' ? oldAmount : -oldAmount;
      }

      // Apply new transaction effect
      const newAmount = parseFloat(updates.amount);
      if (updates.currency === 'ARS') {
        balanceARS -= updates.type === 'expense' ? newAmount : -newAmount;
      } else {
        balanceUSD -= updates.type === 'expense' ? newAmount : -newAmount;
      }

      // Update transaction in array
      const updatedExpenses = financeData.pending_expenses.map((t: any) =>
        t.id === id ? { ...t, ...updates } : t
      ).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      const { error } = await supabase
        .from('finance_data_2025_12_18_18_42')
        .update({
          current_balance_ars: balanceARS,
          current_balance_usd: balanceUSD,
          pending_expenses: updatedExpenses,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;
      loadFinanceData();
    } catch (e: any) {
      console.error(e);
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    }
  };

  // Only updates rate value, source is fixed
  const updateExchangeRate = async (newRate: string) => {
    setUpdating(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { error } = await supabase
        .from('finance_data_2025_12_18_18_42')
        .update({
          exchange_rate: parseFloat(newRate),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "تم تحديث سعر الصرف",
        description: `السعر الجديد: ${newRate} ARS/USD`,
      });

      loadFinanceData();
    } catch (error: any) {
      console.error('Error updating exchange rate:', error);
      toast({
        title: "خطأ في تحديث سعر الصرف",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleShare = async (transaction: any) => {
    const usdEquivalent = transaction.currency === 'USD'
      ? transaction.amount
      : (transaction.amount / financeData.exchange_rate).toFixed(2);

    const text = `
💰 معاملة مالية - بركة
-------------------
المبلغ: ${transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()} ${transaction.currency}
المعادل بالدولار: $${usdEquivalent}
الوصف: ${transaction.description}
التاريخ: ${new Date(transaction.timestamp).toLocaleDateString('ar')}
الفئة: ${transaction.category}
-------------------
✨ نظام بركة
    `.trim();

    try {
      await Share.share({
        title: 'معاملة مالية - بركة',
        text: text,
        dialogTitle: 'مشاركة المعاملة'
      });
    } catch (err) {
      await navigator.clipboard.writeText(text);
      toast({ title: 'تم النسخ', description: 'تم نسخ تفاصيل المعاملة للحافظة' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="mr-3 arabic-body">جاري تحميل البيانات المالية...</span>
      </div>
    );
  }

  if (!financeData) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <p className="arabic-body text-lg">لم يتم العثور على بيانات مالية</p>
      </div>
    );
  }

  const dailyLimit = calculateDailyLimit();
  const totalBalanceARS = financeData.current_balance_ars + (financeData.current_balance_usd * financeData.exchange_rate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-primary arabic-title">
          المالية
        </h1>
      </div>

      {/* Financial Overview - Moved to Top */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="arabic-title text-sm flex items-center">
              <DollarSign className="w-4 h-4 ml-2" />
              الرصيد الإجمالي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {totalBalanceARS.toLocaleString()} ARS
            </p>
            <p className="text-sm text-muted-foreground">
              ≈ {(totalBalanceARS / financeData.exchange_rate).toFixed(2)} USD
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="arabic-title text-sm flex items-center">
              <TrendingUp className="w-4 h-4 ml-2" />
              الحد اليومي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {dailyLimit > 0 ? dailyLimit.toLocaleString() : <span className="text-xs text-gray-400">غير محدد</span>} ARS
            </p>
            <p className="text-sm text-muted-foreground">
              ≈ {(dailyLimit / financeData.exchange_rate).toFixed(2)} USD
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Transaction */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="arabic-title">إضافة معاملة جديدة</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImportDialog(true)}
            className="flex items-center gap-1"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="text-xs">استيراد</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="arabic-body">المبلغ</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="arabic-body">العملة</Label>
              <select
                value={newTransaction.currency}
                onChange={(e) => setNewTransaction(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full p-2 border rounded-lg"
              >
                <option value="ARS">البيزو الأرجنتيني (ARS)</option>
                <option value="USD">الدولار الأمريكي (USD)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="arabic-body">نوع المعاملة</Label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="expense"
                  checked={newTransaction.type === 'expense'}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, type: e.target.value }))}
                  className="ml-2"
                />
                <MinusCircle className="w-4 h-4 text-red-500 ml-1" />
                <span className="arabic-body">مصروف</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="income"
                  checked={newTransaction.type === 'income'}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, type: e.target.value }))}
                  className="ml-2"
                />
                <PlusCircle className="w-4 h-4 text-green-500 ml-1" />
                <span className="arabic-body">دخل</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="arabic-body">الوصف</Label>
            <Input
              placeholder="وصف المعاملة..."
              value={newTransaction.description}
              onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label className="arabic-body">الفئة</Label>
            <Select
              value={newTransaction.category}
              onValueChange={(v) => setNewTransaction(prev => ({ ...prev, category: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(newTransaction.type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={addTransaction}
            disabled={updating}
            className="w-full btn-islamic arabic-body"
          >
            {updating ? 'جاري الحفظ...' : 'إضافة المعاملة'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="arabic-title text-sm flex items-center">
            <TrendingDown className="w-4 h-4 ml-2" />
            إجمالي الديون
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-600">
            {financeData.total_debt.toLocaleString()} ARS
          </p>
          <p className="text-sm text-muted-foreground">
            ≈ {(financeData.total_debt / financeData.exchange_rate).toFixed(2)} USD
          </p>
        </CardContent>
      </Card>

      {/* Financial Tools Section */}
      <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Weekly Report */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="arabic-title text-sm flex items-center gap-2">
              📄 تقارير
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center items-center h-[140px] gap-2">
            <Button onClick={generateReport} className="w-full" variant="outline">
              <Share2 className="w-4 h-4 ml-2" /> طباعة تقرير أسبوعي
            </Button>
            <p className="text-xs text-gray-400 text-center">يقوم بإنشاء تقرير مفصل للطباعة أو الحفظ كـ PDF</p>
          </CardContent>
        </Card>

        {/* Savings Goals */}
        <Card className="col-span-full">
          <CardHeader className="pb-2">
            <CardTitle className="arabic-title text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> أهداف الادخار
              </div>
              <div className="flex gap-2">
                <Input placeholder="الهدف" className="h-8 w-24 text-xs" value={newGoal.name} onChange={e => setNewGoal({ ...newGoal, name: e.target.value })} />
                <Input placeholder="المبلغ" className="h-8 w-20 text-xs" value={newGoal.target} onChange={e => setNewGoal({ ...newGoal, target: e.target.value })} />
                <Button size="sm" className="h-8" onClick={saveGoal}><PlusCircle className="w-4 h-4" /></Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[250px] overflow-y-auto">
              {savingsGoals.map(goal => (
                <div key={goal.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{goal.name}</span>
                    <span>{goal.current} / {goal.target}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${Math.min(100, (goal.current / goal.target) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => {
                      const added = parseFloat(prompt('أضف مبلغ:') || '0');
                      if (added) {
                        const updated = savingsGoals.map(g => g.id === goal.id ? { ...g, current: g.current + added } : g);
                        setSavingsGoals(updated);
                        localStorage.setItem('baraka_savings', JSON.stringify(updated));
                      }
                    }}>+ إيداع</Button>
                    <Button size="sm" variant="ghost" className="h-6 text-red-400" onClick={() => {
                      const updated = savingsGoals.filter(g => g.id !== goal.id);
                      setSavingsGoals(updated);
                      localStorage.setItem('baraka_savings', JSON.stringify(updated));
                    }}>حذف</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Budget */}
        <Card className="col-span-full">
          <CardHeader className="pb-2">
            <CardTitle className="arabic-title text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> الميزانية الشهرية
              </div>
              <div className="flex gap-2">
                <Input placeholder="الفئة" className="h-8 w-24 text-xs" value={newBudget.category} onChange={e => setNewBudget({ ...newBudget, category: e.target.value })} />
                <Input placeholder="الحد" className="h-8 w-20 text-xs" value={newBudget.limit} onChange={e => setNewBudget({ ...newBudget, limit: e.target.value })} />
                <Button size="sm" className="h-8" onClick={saveBudget}><PlusCircle className="w-4 h-4" /></Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[250px] overflow-y-auto">
              {budgets.map((budget, idx) => {
                // Calculate spent for this category (mock calculation for now or needs transaction filtering)
                // For real implementation we filter transactions for current month & category
                const spent = 0; // Placeholder, would need detailed transaction logic
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{budget.category}</span>
                      <span>{spent} / {budget.limit}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      {/* Mock progress 0% since we don't have live spent data hooked up yet */}
                      <div className="h-full bg-blue-500" style={{ width: '0%' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Hidden Report Container */}
      <div id="finance-report" className="hidden">
        <h2>الوضع المالي الحالي</h2>
        <p>الرصيد: {financeData?.current_balance_ars} ARS</p>
        <h3>المعاملات الأخيرة</h3>
        {/* Add table here later if needed */}
      </div>
      <Card className="col-span-full">
        <CardHeader className="pb-3">
          <CardTitle className="arabic-title text-sm flex items-center justify-between">
            <div className="flex items-center">
              <RefreshCw className="w-4 h-4 ml-2" />
              الاشتراكات الشهرية
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowSubscriptionDialog(true)}>
              <PlusCircle className="w-4 h-4 ml-1" /> إضافة
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">لا توجد اشتراكات مسجلة</p>
          ) : (
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {subscriptions.map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-purple-500" />
                    <div>
                      <p className="font-medium text-sm">{sub.name}</p>
                      <p className="text-xs text-gray-500">
                        {sub.cycle === 'monthly' ? 'شهري' : 'سنوي'}
                        {sub.renewalDate && ` - يوم ${sub.renewalDate}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-purple-600">{sub.amount} {sub.currency}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={() => deleteSubscription(sub.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm text-gray-500">الإجمالي الشهري:</span>
                <span className="font-bold text-purple-700">
                  {subscriptions.filter(s => s.cycle === 'monthly').reduce((sum, s) => sum + s.amount, 0).toLocaleString()} ARS
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recurring Expenses Section */}
      <Card className="col-span-full border-2 border-amber-200">
        <CardHeader className="pb-3 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardTitle className="arabic-title text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-amber-600" />
              المصروفات المتكررة
              {getUpcomingReminders().length > 0 && (
                <Badge className="bg-amber-500 text-white text-[10px]">
                  {getUpcomingReminders().length} قادمة
                </Badge>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowRecurringDialog(true)} className="border-amber-300">
              <PlusCircle className="w-4 h-4 ml-1" /> إضافة
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Upcoming Reminders */}
          {getUpcomingReminders().length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="font-bold text-amber-700 mb-2 flex items-center gap-2 text-sm">
                <Bell className="w-4 h-4" /> تذكيرات قادمة
              </h4>
              <div className="space-y-2">
                {getUpcomingReminders().map(reminder => (
                  <div key={reminder.id} className="flex items-center justify-between text-sm">
                    <span>{reminder.name}</span>
                    <span className="text-amber-600 font-bold">
                      بعد {reminder.daysUntil} {reminder.daysUntil === 1 ? 'يوم' : 'أيام'} - {reminder.amount} {reminder.currency}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Due Expenses */}
          {getDueExpenses().length > 0 && (
            <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-bold text-red-700 mb-2 flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4" /> مستحقة اليوم!
              </h4>
              <div className="space-y-2">
                {getDueExpenses().map(expense => (
                  <div key={expense.id} className="flex items-center justify-between">
                    <span className="font-medium">{expense.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-red-600 font-bold">{expense.amount} {expense.currency}</span>
                      <Button
                        size="sm"
                        className="h-7 bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          markAsProcessed(expense.id);
                          toast({ title: 'تم', description: `تم تسجيل دفع ${expense.name}` });
                        }}
                      >
                        تم الدفع ✓
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recurring Expenses List */}
          {recurringExpenses.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">لا توجد مصروفات متكررة</p>
          ) : (
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {recurringExpenses.map(expense => (
                <div
                  key={expense.id}
                  className={`flex items-center justify-between p-2 rounded-lg border ${expense.isActive ? 'bg-white' : 'bg-gray-100 opacity-60'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`h-6 w-6 p-0 ${expense.isActive ? 'text-green-600' : 'text-gray-400'}`}
                      onClick={() => toggleActive(expense.id)}
                    >
                      <Power className="w-4 h-4" />
                    </Button>
                    <div>
                      <p className="font-medium text-sm">{expense.name}</p>
                      <p className="text-xs text-gray-500">
                        {expense.cycle === 'monthly' ? 'شهري' : 'سنوي'} - يوم {expense.dayOfMonth}
                        {expense.cycle === 'yearly' && ` / شهر ${expense.monthOfYear}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-600">{expense.amount} {expense.currency}</span>
                    <Badge className="text-[9px]">{expense.category}</Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-red-400"
                      onClick={() => deleteRecurringExpense(expense.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t mt-2">
                <span className="text-sm text-gray-500">الإجمالي الشهري:</span>
                <span className="font-bold text-amber-700">
                  {getMonthlyTotal().ars.toLocaleString()} ARS + ${getMonthlyTotal().usd}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Recurring Expense Dialog */}
      <Dialog open={showRecurringDialog} onOpenChange={setShowRecurringDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-right">إضافة مصروف متكرر</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="اسم المصروف (مثل: فاتورة الكهرباء)"
              value={newRecurring.name}
              onChange={e => setNewRecurring({ ...newRecurring, name: e.target.value })}
              className="text-right"
            />
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="المبلغ"
                value={newRecurring.amount}
                onChange={e => setNewRecurring({ ...newRecurring, amount: e.target.value })}
              />
              <select
                value={newRecurring.currency}
                onChange={e => setNewRecurring({ ...newRecurring, currency: e.target.value as 'ARS' | 'USD' })}
                className="border rounded px-2"
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <Select
              value={newRecurring.category}
              onValueChange={v => setNewRecurring({ ...newRecurring, category: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <select
                value={newRecurring.cycle}
                onChange={e => setNewRecurring({ ...newRecurring, cycle: e.target.value as 'monthly' | 'yearly' })}
                className="flex-1 border rounded p-2"
              >
                <option value="monthly">شهري</option>
                <option value="yearly">سنوي</option>
              </select>
              <Input
                type="number"
                placeholder="يوم الشهر (1-31)"
                min={1}
                max={31}
                value={newRecurring.dayOfMonth}
                onChange={e => setNewRecurring({ ...newRecurring, dayOfMonth: parseInt(e.target.value) || 1 })}
                className="w-24"
              />
              {newRecurring.cycle === 'yearly' && (
                <Input
                  type="number"
                  placeholder="الشهر (1-12)"
                  min={1}
                  max={12}
                  value={newRecurring.monthOfYear}
                  onChange={e => setNewRecurring({ ...newRecurring, monthOfYear: parseInt(e.target.value) || 1 })}
                  className="w-24"
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">تذكير قبل</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={newRecurring.reminderDays}
                onChange={e => setNewRecurring({ ...newRecurring, reminderDays: parseInt(e.target.value) || 3 })}
                className="w-16"
              />
              <span className="text-sm text-gray-500">أيام</span>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRecurringDialog(false)}>إلغاء</Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => {
                if (!newRecurring.name || !newRecurring.amount) {
                  toast({ title: 'خطأ', description: 'يرجى إدخال جميع البيانات', variant: 'destructive' });
                  return;
                }
                addRecurringExpense({
                  ...newRecurring,
                  amount: parseFloat(newRecurring.amount),
                });
                setNewRecurring({
                  name: '',
                  amount: '',
                  currency: 'ARS',
                  category: 'فواتير',
                  cycle: 'monthly',
                  dayOfMonth: 1,
                  monthOfYear: 1,
                  reminderDays: 3,
                });
                setShowRecurringDialog(false);
              }}
            >
              إضافة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Subscription Dialog */}
      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-right">إضافة اشتراك جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="اسم الاشتراك (مثل: Netflix, Spotify)"
              value={newSubscription.name}
              onChange={e => setNewSubscription({ ...newSubscription, name: e.target.value })}
              className="text-right"
            />
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="المبلغ"
                value={newSubscription.amount}
                onChange={e => setNewSubscription({ ...newSubscription, amount: e.target.value })}
              />
              <select
                value={newSubscription.currency}
                onChange={e => setNewSubscription({ ...newSubscription, currency: e.target.value })}
                className="border rounded px-2"
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div className="flex gap-2 items-center">
              <select
                value={newSubscription.cycle}
                onChange={e => setNewSubscription({ ...newSubscription, cycle: e.target.value })}
                className="flex-1 border rounded p-2"
              >
                <option value="monthly">شهري</option>
                <option value="yearly">سنوي</option>
              </select>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500">يوم</span>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="1"
                  value={newSubscription.renewalDate}
                  onChange={e => setNewSubscription({ ...newSubscription, renewalDate: e.target.value })}
                  className="w-16 text-center"
                />
              </div>
            </div>
            <Button onClick={saveSubscription} className="w-full">حفظ الاشتراك</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={!!editingTransaction} onOpenChange={(open) => !open && setEditingTransaction(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              <Pencil className="w-5 h-5 text-orange-500" />
              تعديل المعاملة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button
                variant={newTransaction.type === 'expense' ? 'default' : 'outline'}
                onClick={() => setNewTransaction({ ...newTransaction, type: 'expense' })}
                className={`flex-1 ${newTransaction.type === 'expense' ? 'bg-rose-500 hover:bg-rose-600' : ''}`}
              >
                مصروف
              </Button>
              <Button
                variant={newTransaction.type === 'income' ? 'default' : 'outline'}
                onClick={() => setNewTransaction({ ...newTransaction, type: 'income' })}
                className={`flex-1 ${newTransaction.type === 'income' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
              >
                دخل
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="المبلغ"
                value={newTransaction.amount}
                onChange={e => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                className="flex-1"
              />
              <select
                value={newTransaction.currency}
                onChange={e => setNewTransaction({ ...newTransaction, currency: e.target.value })}
                className="border rounded px-3"
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <Input
              placeholder="الوصف"
              value={newTransaction.description}
              onChange={e => setNewTransaction({ ...newTransaction, description: e.target.value })}
              className="text-right"
            />
            <select
              value={newTransaction.category}
              onChange={e => setNewTransaction({ ...newTransaction, category: e.target.value })}
              className="w-full border rounded p-2 text-right"
            >
              {(newTransaction.type === 'expense' ? expenseCategories : incomeCategories).map((cat: string) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="space-y-2">
              <Label className="text-xs">تاريخ المعاملة</Label>
              <Input
                type="date"
                value={newTransaction.date}
                onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                className="text-right"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditingTransaction(null)} className="flex-1">
              إلغاء
            </Button>
            <Button
              onClick={async () => {
                if (!editingTransaction) return;
                setUpdating(true);
                await updateTransaction(editingTransaction.id, {
                  amount: newTransaction.amount,
                  type: newTransaction.type,
                  category: newTransaction.category,
                  description: newTransaction.description,
                  currency: newTransaction.currency,
                  timestamp: newTransaction.date ?
                    (editingTransaction.timestamp.includes('T') ? `${newTransaction.date}T${editingTransaction.timestamp.split('T')[1]}` : new Date(newTransaction.date).toISOString())
                    : editingTransaction.timestamp
                });
                setEditingTransaction(null);
                setUpdating(false);
                toast({ title: 'تم تحديث المعاملة' });
              }}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              disabled={updating}
            >
              {updating ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exchange Rate - Automated */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-title flex items-center justify-between">
            <span>سعر الصرف (الدولار الأزرق)</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadFinanceData()}
              disabled={updating}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <p className="text-3xl font-bold text-primary">
                {financeData.exchange_rate.toLocaleString()} ARS/USD
              </p>
              <p className="text-sm text-muted-foreground">
                المصدر: {exchangeRateSource}
              </p>
            </div>
            {/* Manual Update Override (Hidden but available if needed, actually kept for quick fixes) */}
            <div className="flex gap-2 items-center">
              <Label className="text-xs text-muted-foreground">تعديل يدوي:</Label>
              <Input
                type="number"
                placeholder="0.00"
                className="w-24 h-8 text-xs"
                onKeyPress={(e: any) => {
                  if (e.key === 'Enter') {
                    updateExchangeRate(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions - Modern Minimalist Design */}
      <Card className="col-span-full shadow-lg border-0">
        <CardHeader className="pb-3">
          <CardTitle className="arabic-title text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 ml-2" />
              أحدث المعاملات
            </div>
            <div className="flex gap-2">
              {/* Filters */}
              <select className="text-xs border rounded-lg p-1 h-8 bg-gray-50" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="all">كل الفئات</option>
                {expenseCategories.map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>
              <Input type="date" className="h-8 w-32 text-xs rounded-lg" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[350px] overflow-y-auto">
            {getFilteredTransactions().length === 0 ? (
              <p className="text-center text-gray-400 py-4">لا توجد معاملات</p>
            ) : (
              getFilteredTransactions().map((t: any) => (
                <div
                  key={t.id}
                  className={`flex justify-between items-center p-4 rounded-2xl shadow-sm hover:shadow-md transition-all ${t.type === 'expense' ? 'bg-gradient-to-r from-white to-red-50/30' : 'bg-gradient-to-r from-white to-green-50/30'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Icon with pastel background */}
                    <div className={`p-2.5 rounded-xl ${t.type === 'expense' ? 'bg-rose-100 text-rose-500' : 'bg-emerald-100 text-emerald-500'
                      }`}>
                      {t.type === 'expense' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t.category || 'أخرى'}</p>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-800 text-base">{t.description}</p>
                        {t.source === 'imported' && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-blue-50 text-blue-600 border-blue-200">
                            <Upload className="w-2 h-2 mr-0.5" />
                            مستورد
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(t.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Amount - larger and bold */}
                    <div className="text-left">
                      <span className={`font-bold text-lg dir-ltr block ${t.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'
                        }`}>
                        {t.type === 'expense' ? '-' : '+'}{parseFloat(t.amount).toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-400">{t.currency}</span>
                    </div>
                    {/* Three-dot menu */}
                    <div className="relative group">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-lg border py-1 hidden group-hover:block z-50 min-w-[120px]">
                        <button
                          className="w-full px-3 py-2 text-right text-sm hover:bg-gray-50 flex items-center gap-2"
                          onClick={() => {
                            setEditingTransaction(t);
                            setNewTransaction({
                              amount: t.amount,
                              type: t.type,
                              category: t.category,
                              description: t.description || '',
                              currency: t.currency,
                              date: t.timestamp ? t.timestamp.split('T')[0] : new Date().toISOString().split('T')[0]
                            });
                          }}
                        >
                          <Pencil className="w-3 h-3 text-orange-500" /> تعديل
                        </button>
                        <button
                          className="w-full px-3 py-2 text-right text-sm hover:bg-gray-50 flex items-center gap-2"
                          onClick={() => handleShare(t)}
                        >
                          <Share2 className="w-3 h-3 text-blue-500" /> مشاركة
                        </button>
                        <button
                          className="w-full px-3 py-2 text-right text-sm hover:bg-red-50 text-red-500 flex items-center gap-2"
                          onClick={() => deleteTransaction(t.id)}
                        >
                          <Trash2 className="w-3 h-3" /> حذف
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* CSV/Excel Import Dialog */}
      <CSVImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onSuccess={loadFinanceData}
      />
    </div>
  );
};

export default FinancialController;