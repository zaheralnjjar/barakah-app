import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  RefreshCw
} from 'lucide-react';
import { fetchBNARate } from '@/lib/currency';

const FinancialController = () => {
  const [financeData, setFinanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    currency: 'ARS',
    type: 'expense',
    description: ''
  });
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
        // Update local state temporarily to show live data
        setFinanceData(prev => ({ ...prev, exchange_rate: bnaRate }));

        // Background update to Supabase
        supabase.from('finance_data_2025_12_18_18_42')
          .update({ exchange_rate: bnaRate, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .then(({ error }) => {
            if (error) console.error("Failed to auto-update rate", error);
            else toast({ title: "تم تحديث سعر الدولار", description: `تم جلب السعر الرسمي: ${bnaRate} ARS` });
          });
      }
    } catch (error) {
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

  const calculateDailyLimit = () => {
    if (!financeData) return 0;

    const totalBalance = financeData.current_balance_ars + (financeData.current_balance_usd * financeData.exchange_rate);
    const availableBalance = totalBalance - financeData.emergency_buffer - financeData.total_debt;

    // Exact days calculation with 3 days buffer
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - today.getDate();

    // Add 3 days buffer as requested
    return Math.max(0, availableBalance / (remainingDays + 3));
  };

  const addTransaction = async () => {
    // Description is now optional
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

      // Update pending expenses
      const updatedPendingExpenses = [...(financeData.pending_expenses || []), {
        id: Date.now(),
        amount,
        currency: newTransaction.currency,
        type: newTransaction.type,
        // Allow empty description
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

      setNewTransaction({ amount: '', currency: 'ARS', type: 'expense', description: '' });
      loadFinanceData();
    } catch (error) {
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

  const updateExchangeRate = async (newRate) => {
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
    } catch (error) {
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
      </div>

      {/* Add Transaction (Moved to Top) */}
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
      </div>

      {/* Exchange Rate */}
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
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-3xl font-bold text-primary">
                {financeData.exchange_rate.toLocaleString()} ARS/USD
              </p>
              <p className="text-sm text-muted-foreground">
                آخر تحديث: {new Date(financeData.updated_at).toLocaleDateString('ar')}
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="سعر جديد"
                className="w-32"
                onKeyPress={(e) => {
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

      {/* Recent Transactions */}
      {financeData.pending_expenses && financeData.pending_expenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="arabic-title">المعاملات الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {financeData.pending_expenses.slice(-5).reverse().map((expense, index) => (
                <div key={expense.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {expense.type === 'expense' ? (
                      <MinusCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <PlusCircle className="w-5 h-5 text-green-500" />
                    )}
                    <div>
                      <p className="arabic-body font-semibold">{expense.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(expense.timestamp).toLocaleDateString('ar')}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className={`font-bold ${expense.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {expense.type === 'income' ? '+' : '-'}
                      {expense.amount.toLocaleString()} ARS
                    </span>
                    <span className="text-[10px] text-gray-400 block text-left dir-ltr">
                      ≈ ${(expense.amount / 1200).toFixed(2)} USD
                    </span>
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