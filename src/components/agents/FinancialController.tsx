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
    console.log("Financial Controller Mounted");
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
    <div className="space-y-6 container mx-auto px-4 py-4 md:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-primary arabic-title">
            الإدارة المالية
          </h1>
          <p className="arabic-body text-sm text-muted-foreground">
            تتبع ميزانيتك ومصروفاتك بكل سهولة
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImportDialog(true)}
            className="flex items-center gap-1"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="text-xs">استيراد</span>
          </Button>
          <Button onClick={generateReport} size="sm" variant="outline">
            <Share2 className="w-4 h-4 ml-1" />
            <span className="text-xs">تقرير</span>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none">
          <CardHeader className="pb-2">
            <CardTitle className="arabic-title text-sm flex items-center opacity-90">
              <DollarSign className="w-4 h-4 ml-2" />
              الرصيد الإجمالي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalBalanceARS.toLocaleString()} <span className="text-sm font-normal">ARS</span>
            </div>
            <p className="text-sm opacity-80">
              ≈ {(totalBalanceARS / financeData.exchange_rate).toFixed(2)} USD
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="arabic-title text-sm flex items-center text-emerald-600">
              <TrendingUp className="w-4 h-4 ml-2" />
              الحد اليومي المتاح
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              {dailyLimit > 0 ? dailyLimit.toLocaleString() : '0'} <span className="text-xs font-normal">ARS</span>
            </div>
            <p className="text-sm text-muted-foreground">
              بناءً على الرصيد المتاح حالياً
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-red-100">
          <CardHeader className="pb-2">
            <CardTitle className="arabic-title text-sm flex items-center text-red-600">
              <TrendingDown className="w-4 h-4 ml-2" />
              إجمالي الديون
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {financeData.total_debt.toLocaleString()} <span className="text-xs font-normal">ARS</span>
            </div>
            <p className="text-sm text-muted-foreground">
              يجب تسديدها قريباً
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column: Entry and Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Transaction */}
          <Card className="border-emerald-100 shadow-sm overflow-hidden">
            <div className="bg-emerald-50/50 px-4 py-2 border-b border-emerald-100">
              <span className="arabic-title text-emerald-800 text-sm font-bold flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> إضافة معاملة
              </span>
            </div>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="arabic-body text-xs">المبلغ</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                      className="pr-12"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 bg-gray-50 border-r text-xs text-gray-500 rounded-r-md">
                      {newTransaction.currency}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="arabic-body text-xs">العملة</Label>
                  <Select
                    value={newTransaction.currency}
                    onValueChange={(v) => setNewTransaction(prev => ({ ...prev, currency: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARS">البيزو الأرجنتيني (ARS)</SelectItem>
                      <SelectItem value="USD">الدولار الأمريكي (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="arabic-body text-xs">النوع والفئة</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex p-1 bg-gray-50 rounded-lg border">
                    <button
                      onClick={() => setNewTransaction(prev => ({ ...prev, type: 'expense' }))}
                      className={`flex-1 py-1 px-3 rounded-md text-xs transition-all flex items-center justify-center gap-1 ${newTransaction.type === 'expense' ? 'bg-white shadow text-red-600 font-bold' : 'text-gray-500'}`}
                    >
                      <MinusCircle className="w-3 h-3" /> مصروف
                    </button>
                    <button
                      onClick={() => setNewTransaction(prev => ({ ...prev, type: 'income' }))}
                      className={`flex-1 py-1 px-3 rounded-md text-xs transition-all flex items-center justify-center gap-1 ${newTransaction.type === 'income' ? 'bg-white shadow text-emerald-600 font-bold' : 'text-gray-500'}`}
                    >
                      <PlusCircle className="w-3 h-3" /> دخل
                    </button>
                  </div>
                  <Select
                    value={newTransaction.category}
                    onValueChange={(v) => setNewTransaction(prev => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      {(newTransaction.type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                      <div className="h-px bg-gray-200 my-1" />
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-full text-xs text-primary">
                            + إضافة فئة جديدة
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="arabic-title text-right">إدارة الفئات</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="flex gap-2">
                              <Input id="new-cat-input" placeholder="اسم الفئة الجديدة" className="text-right" />
                              <Button onClick={() => {
                                const input = document.getElementById('new-cat-input') as HTMLInputElement;
                                if (input.value) {
                                  if (newTransaction.type === 'expense') {
                                    useAppStore.getState().addExpenseCategory(input.value);
                                  } else {
                                    useAppStore.getState().addIncomeCategory(input.value);
                                  }
                                  input.value = '';
                                  toast({ title: "تمت الإضافة" });
                                }
                              }}>إضافة</Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {(newTransaction.type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                                <Badge key={cat} variant="secondary" className="gap-1 px-2 py-1">
                                  {cat}
                                  <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => {
                                    if (newTransaction.type === 'expense') {
                                      useAppStore.getState().deleteExpenseCategory(cat);
                                    } else {
                                      useAppStore.getState().deleteIncomeCategory(cat);
                                    }
                                  }} />
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="arabic-body text-xs">وصف المعاملة</Label>
                <Input
                  placeholder="مثال: شراء بقالة، إيجار المنزل..."
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <Button
                onClick={addTransaction}
                disabled={updating}
                className="w-full btn-islamic arabic-body"
              >
                {updating ? 'جاري الحفظ...' : 'حفظ المعاملة'}
              </Button>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="space-y-4">
            <CategoryExpenseChart
              transactions={financeData.pending_expenses || []}
              exchangeRate={financeData.exchange_rate}
            />
          </div>

        </div>

        {/* Sidebar Column: Budget, Goals, Settings, History */}
        <div className="space-y-6">
          {/* Exchange Rate Card */}
          <Card className="border-emerald-100 shadow-sm bg-gray-50">
            <CardHeader className="p-3 border-b border-emerald-100 flex flex-row items-center justify-between">
              <CardTitle className="arabic-title text-xs font-bold text-emerald-800">سعر الصرف (ARS/USD)</CardTitle>
              <Badge variant="outline" className="text-[10px] bg-white">BNA الرسمي</Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{financeData.exchange_rate}</div>
                <Button size="sm" variant="ghost" className="h-8 w-8" onClick={() => {
                  const val = prompt('تحديث سعر الصرف يدوياً:', financeData.exchange_rate.toString());
                  if (val) updateExchangeRate(val);
                }}>
                  <Pencil className="w-3 h-3" />
                </Button>
              </div>
              <div className="p-2 bg-white rounded border border-emerald-50 text-[10px] text-gray-500 flex items-center gap-2">
                <RotateCw className="w-3 h-3 animate-spin" />
                يتم التحديث تلقائياً من البنك المركزي
              </div>
            </CardContent>
          </Card>

          {/* Savings Goals */}
          <Card className="border-emerald-100 shadow-sm">
            <CardHeader className="p-3 border-b border-emerald-100 flex flex-row items-center justify-between">
              <CardTitle className="arabic-title text-xs font-bold text-emerald-800">أهداف الادخار</CardTitle>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => {
                const name = prompt('اسم الهدف:');
                const target = prompt('المبلغ المطلوب (ARS):');
                if (name && target) {
                  const updated = [...savingsGoals, { id: Date.now(), name, target: parseFloat(target), current: 0 }];
                  setSavingsGoals(updated);
                  localStorage.setItem('baraka_savings', JSON.stringify(updated));
                }
              }}>
                <PlusCircle className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {savingsGoals.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-4">لا توجد أهداف حالياً</p>
              ) : (
                <div className="space-y-4">
                  {savingsGoals.map(goal => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold">{goal.name}</span>
                        <span className="text-gray-500">{Math.round((goal.current / goal.target) * 100)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${Math.min(100, (goal.current / goal.target) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-emerald-600 font-bold">{goal.current.toLocaleString()} / {goal.target.toLocaleString()} ARS</span>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => {
                            const added = parseFloat(prompt('أضف مبلغ للإيداع:') || '0');
                            if (added) {
                              const updated = savingsGoals.map(g => g.id === goal.id ? { ...g, current: g.current + added } : g);
                              setSavingsGoals(updated);
                              localStorage.setItem('baraka_savings', JSON.stringify(updated));
                            }
                          }}>+ إيداع</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Budget */}
          <Card className="border-emerald-100 shadow-sm">
            <CardHeader className="p-3 border-b border-emerald-100">
              <CardTitle className="arabic-title text-xs font-bold text-emerald-800">الميزانية الشهرية</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {budgets.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-400 mb-2">خصص ميزانية لكل فئة لتتبع إنفاقك</p>
                  <Button size="sm" variant="outline" className="text-[10px] h-7" onClick={() => {
                    const cat = prompt('اختر الفئة:');
                    const limit = prompt('الحد الأقصى (ARS):');
                    if (cat && limit) {
                      const updated = [...budgets, { category: cat, limit: parseFloat(limit) }];
                      setBudgets(updated);
                      localStorage.setItem('baraka_budgets', JSON.stringify(updated));
                    }
                  }}>إعداد ميزانية</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {budgets.map(b => (
                    <div key={b.category} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{b.category}</span>
                        <span className="text-gray-400">{b.limit.toLocaleString()} ARS</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>


          {/* Transaction History (Small Version) */}
          <Card className="border-emerald-100 shadow-sm">
            <div className="bg-emerald-50/50 px-3 py-2 border-b border-emerald-100 flex justify-between items-center">
              <span className="arabic-title text-emerald-800 text-xs font-bold flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> آخر المعاملات
              </span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setFilterDate(''); setFilterCategory('all'); }}>
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
            <CardContent className="p-0">
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-right text-[10px]">
                  <thead className="bg-gray-50 border-b sticky top-0">
                    <tr>
                      <th className="p-2 font-bold">الوصف</th>
                      <th className="p-2 font-bold">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {getFilteredTransactions().slice(0, 10).map((t: any) => (
                      <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-2">
                          <div className="font-medium truncate max-w-[100px]">{t.description}</div>
                          <div className="text-[9px] text-gray-400">{new Date(t.timestamp).toLocaleDateString('ar-EG', { day: 'numeric', month: 'numeric' })}</div>
                        </td>
                        <td className={`p-2 font-bold ${t.type === 'expense' ? 'text-red-600' : 'text-emerald-600'}`}>
                          {t.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Import/Export Dialogs */}
      <CSVImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onSuccess={() => {
          // Handle import success
          toast({ title: "تم استيراد البيانات" });
          loadFinanceData();
        }}
      />
    </div >
  );
};

export default FinancialController;