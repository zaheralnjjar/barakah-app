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
  X
} from 'lucide-react';
import { fetchBNARate } from '@/lib/currency';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAppStore } from '@/stores/useAppStore';
import { Share } from '@capacitor/share';

const FinancialController = () => {
  const [financeData, setFinanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    currency: 'ARS',
    type: 'expense',
    description: '',
    category: 'أخرى'
  });
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  // Subscription tracking
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [newSubscription, setNewSubscription] = useState({
    name: '',
    amount: '',
    currency: 'ARS',
    renewalDate: '',
    cycle: 'monthly' // monthly or yearly
  });

  // Hardcoded automated source
  const exchangeRateSource = 'Banco de la Nación Argentina';

  const expenseCategories = useAppStore((s) => s.expenseCategories);
  const incomeCategories = useAppStore((s) => s.incomeCategories);
  const { toast } = useToast();

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
    setNewSubscription({ name: '', amount: '', currency: 'ARS', renewalDate: '', cycle: 'monthly' });
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

      setNewTransaction({ amount: '', currency: 'ARS', type: 'expense', description: '', category: 'أخرى' });
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
      <div className="text-center">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calculator className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl arabic-title text-primary mb-2">
          المراقب المالي
        </h1>
        <p className="arabic-body text-muted-foreground">
          إدارة الميزانية والحد اليومي وتتبع الديون
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 text-primary hover:bg-primary/10 gap-2"
          onClick={async () => {
            const text = `
ملخص مالي - بركة
----------------
الرصيد: ${totalBalanceARS.toLocaleString()} ARS
(≈ ${(totalBalanceARS / financeData.exchange_rate).toFixed(2)} USD)
الديون: ${financeData.total_debt.toLocaleString()} ARS
سعر الصرف: ${financeData.exchange_rate}
                 `.trim();
            if (navigator.share) await navigator.share({ title: 'ملخص مالي', text });
            else { await navigator.clipboard.writeText(text); toast({ title: 'تم النسخ' }); }
          }}
        >
          <Share2 className="w-4 h-4" />
          مشاركة الملخص
        </Button>
      </div>

      {/* Add Transaction */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-title">إضافة معاملة جديدة</CardTitle>
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

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              {dailyLimit.toLocaleString()} ARS
            </p>
            <p className="text-sm text-muted-foreground">
              ≈ {(dailyLimit / financeData.exchange_rate).toFixed(2)} USD
            </p>
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

        {/* Subscriptions Card */}
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
              <div className="space-y-2">
                {subscriptions.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-purple-500" />
                      <div>
                        <p className="font-medium text-sm">{sub.name}</p>
                        <p className="text-xs text-gray-500">{sub.cycle === 'monthly' ? 'شهري' : 'سنوي'}</p>
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
              <select
                value={newSubscription.cycle}
                onChange={e => setNewSubscription({ ...newSubscription, cycle: e.target.value })}
                className="w-full border rounded p-2"
              >
                <option value="monthly">شهري</option>
                <option value="yearly">سنوي</option>
              </select>
              <Button onClick={saveSubscription} className="w-full">حفظ الاشتراك</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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

      {/* Recent Transactions - Reordered and Improved */}
      {financeData.pending_expenses && financeData.pending_expenses.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="arabic-title">المعاملات الأخيرة</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={async () => {
                  const transactions = financeData.pending_expenses.slice(-10).reverse();
                  let text = 'المعاملات الأخيرة - بركة\n' + '─'.repeat(20) + '\n';
                  transactions.forEach((t: any) => {
                    text += `${t.type === 'income' ? '➕' : '➖'} ${t.amount.toLocaleString()} ${t.currency} - ${t.description}\n`;
                  });
                  if (navigator.share) {
                    await navigator.share({ title: 'المعاملات الأخيرة', text });
                  } else {
                    await navigator.clipboard.writeText(text);
                    toast({ title: 'تم النسخ' });
                  }
                }}
              >
                <Share2 className="w-4 h-4" />
                مشاركة
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-3 mb-4 flex-wrap">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الفئات</SelectItem>
                  {[...expenseCategories, ...incomeCategories].map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-44"
                placeholder="التاريخ"
              />

              {(filterCategory !== 'all' || filterDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterCategory('all');
                    setFilterDate('');
                  }}
                >
                  <X className="w-4 h-4 ml-1" />
                  مسح الفلاتر
                </Button>
              )}
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-4 gap-2 p-2 bg-gray-100 rounded-t-lg text-xs font-bold text-gray-600 text-center">
              <span>الأيقونة</span>
              <span>المبلغ</span>
              <span>التاريخ</span>
              <span>بيان المصروف</span>
            </div>

            <div className="space-y-1 border rounded-b-lg">
              {financeData.pending_expenses.slice(-10).reverse()
                .filter((expense: any) => {
                  if (filterCategory !== 'all' && expense.category !== filterCategory) return false;
                  if (filterDate) {
                    const expenseDate = new Date(expense.timestamp).toISOString().split('T')[0];
                    if (expenseDate !== filterDate) return false;
                  }
                  return true;
                })
                .map((expense: any, index: number) => (
                  <div key={expense.id || index} className="grid grid-cols-4 gap-2 p-2 border-b last:border-b-0 items-center text-center">
                    {/* Icon Column */}
                    <div className="flex justify-center">
                      {expense.type === 'expense' ? (
                        <div className="p-1.5 bg-red-100 rounded-full">
                          <MinusCircle className="w-4 h-4 text-red-600" />
                        </div>
                      ) : (
                        <div className="p-1.5 bg-green-100 rounded-full">
                          <PlusCircle className="w-4 h-4 text-green-600" />
                        </div>
                      )}
                    </div>

                    {/* Amount Column */}
                    <div>
                      <span className={`font-bold text-sm block ${expense.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {expense.type === 'income' ? '+' : '-'}{expense.amount.toLocaleString()} {expense.currency}
                      </span>
                      <span className="text-[10px] text-gray-400 block">
                        ${expense.currency === 'USD' ? expense.amount.toFixed(2) : (expense.amount / financeData.exchange_rate).toFixed(2)}
                      </span>
                    </div>

                    {/* Date Column */}
                    <div className="text-xs text-gray-500">
                      {new Date(expense.timestamp).toLocaleDateString('ar')}
                    </div>

                    {/* Description Column */}
                    <div className="text-xs text-right truncate px-1">
                      {expense.description}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinancialController;