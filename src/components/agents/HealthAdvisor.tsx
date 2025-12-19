import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Stethoscope, 
  Activity, 
  Pill,
  TestTube,
  Plus,
  AlertTriangle,
  TrendingUp,
  Calendar,
  DollarSign
} from 'lucide-react';

const HealthAdvisor = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newSymptom, setNewSymptom] = useState({ description: '', severity: 'mild', date: new Date().toISOString().split('T')[0] });
  const [newLabTest, setNewLabTest] = useState({ name: '', cost: '', priority: 'routine' });
  const { toast } = useToast();

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data, error } = await supabase
        .from('health_data_2025_12_18_18_42')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setHealthData(data);
    } catch (error) {
      console.error('Error loading health data:', error);
      toast({
        title: "خطأ في تحميل البيانات الصحية",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addSymptom = async () => {
    if (!newSymptom.description.trim()) return;

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const symptomEntry = {
        id: Date.now(),
        description: newSymptom.description,
        severity: newSymptom.severity,
        date: newSymptom.date,
        timestamp: new Date().toISOString()
      };

      const updatedSymptoms = [...(healthData?.symptoms_log || []), symptomEntry];

      const { error } = await supabase
        .from('health_data_2025_12_18_18_42')
        .update({
          symptoms_log: updatedSymptoms,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setNewSymptom({ description: '', severity: 'mild', date: new Date().toISOString().split('T')[0] });
      loadHealthData();
      toast({
        title: "تم تسجيل العرض",
        description: "تم إضافة العرض إلى السجل الطبي",
      });
    } catch (error) {
      console.error('Error adding symptom:', error);
    }
  };

  const addLabTest = async () => {
    if (!newLabTest.name.trim()) return;

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const labTestEntry = {
        id: Date.now(),
        name: newLabTest.name,
        cost: parseFloat(newLabTest.cost) || 0,
        priority: newLabTest.priority,
        status: 'pending',
        requested_date: new Date().toISOString()
      };

      const updatedLabTests = [...(healthData?.lab_tests_queue || []), labTestEntry];

      // Auto-trigger financial cost addition
      if (labTestEntry.cost > 0) {
        await addMedicalExpenseToFinance(labTestEntry.name, labTestEntry.cost);
      }

      const { error } = await supabase
        .from('health_data_2025_12_18_18_42')
        .update({
          lab_tests_queue: updatedLabTests,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setNewLabTest({ name: '', cost: '', priority: 'routine' });
      loadHealthData();
      toast({
        title: "تم إضافة الفحص المخبري",
        description: `تم إضافة "${newLabTest.name}" لقائمة الفحوصات`,
      });
    } catch (error) {
      console.error('Error adding lab test:', error);
    }
  };

  const addMedicalExpenseToFinance = async (testName, cost) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // Get current finance data
      const { data: financeData, error: fetchError } = await supabase
        .from('finance_data_2025_12_18_18_42')
        .select('pending_expenses')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const medicalExpense = {
        id: Date.now(),
        amount: cost,
        currency: 'ARS',
        type: 'expense',
        description: `فحص مخبري: ${testName}`,
        timestamp: new Date().toISOString(),
        source: 'medical_recommendation'
      };

      const updatedExpenses = [...(financeData?.pending_expenses || []), medicalExpense];

      const { error } = await supabase
        .from('finance_data_2025_12_18_18_42')
        .update({
          pending_expenses: updatedExpenses,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "تم إضافة التكلفة الطبية",
        description: `تم إرسال تكلفة ${cost} ARS إلى محمد (المراقب المالي)`,
      });
    } catch (error) {
      console.error('Error adding medical expense to finance:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'mild': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'severe': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityText = (severity) => {
    switch (severity) {
      case 'mild': return 'خفيف';
      case 'moderate': return 'متوسط';
      case 'severe': return 'شديد';
      default: return severity;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'routine': return 'bg-blue-100 text-blue-800';
      case 'urgent': return 'bg-orange-100 text-orange-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'routine': return 'روتيني';
      case 'urgent': return 'عاجل';
      case 'emergency': return 'طارئ';
      default: return priority;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="mr-3 arabic-body">جاري تحميل البيانات الصحية...</span>
      </div>
    );
  }

  const vitalTracking = [
    { name: 'الهرمونات', icon: Activity, status: 'monitoring', color: 'bg-purple-500' },
    { name: 'الفيتامينات', icon: Pill, status: 'normal', color: 'bg-green-500' },
    { name: 'المؤشرات الحيوية', icon: TrendingUp, status: 'stable', color: 'bg-blue-500' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Stethoscope className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl arabic-title text-primary mb-2">
          د. هيفاء - المستشار الصحي
        </h1>
        <p className="arabic-body text-muted-foreground">
          تحليل الأعراض وتتبع الهرمونات والفيتامينات والفحوصات المخبرية
        </p>
      </div>

      {/* Health Overview */}
      <Card className="bg-gradient-to-r from-red-50 to-pink-50">
        <CardHeader>
          <CardTitle className="arabic-title flex items-center">
            <Activity className="w-5 h-5 ml-2" />
            نظرة عامة على الصحة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vitalTracking.map((vital, index) => {
              const IconComponent = vital.icon;
              return (
                <div key={index} className="p-4 bg-white rounded-lg border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 ${vital.color} rounded-full flex items-center justify-center`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="arabic-body font-semibold">{vital.name}</h3>
                  </div>
                  <Badge variant="secondary">
                    {vital.status === 'monitoring' ? 'قيد المراقبة' :
                     vital.status === 'normal' ? 'طبيعي' :
                     vital.status === 'stable' ? 'مستقر' : vital.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Symptom */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-title flex items-center">
            <Plus className="w-5 h-5 ml-2" />
            تسجيل عرض جديد
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="arabic-body font-semibold">وصف العرض</label>
              <Textarea
                placeholder="اكتب وصفاً مفصلاً للعرض..."
                value={newSymptom.description}
                onChange={(e) => setNewSymptom(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <label className="arabic-body font-semibold">شدة العرض</label>
              <select
                value={newSymptom.severity}
                onChange={(e) => setNewSymptom(prev => ({ ...prev, severity: e.target.value }))}
                className="w-full p-2 border rounded-lg"
              >
                <option value="mild">خفيف</option>
                <option value="moderate">متوسط</option>
                <option value="severe">شديد</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="arabic-body font-semibold">التاريخ</label>
              <Input
                type="date"
                value={newSymptom.date}
                onChange={(e) => setNewSymptom(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>

          <Button 
            onClick={addSymptom}
            className="btn-islamic arabic-body"
            disabled={!newSymptom.description.trim()}
          >
            تسجيل العرض
          </Button>
        </CardContent>
      </Card>

      {/* Symptoms Log */}
      {healthData?.symptoms_log && healthData.symptoms_log.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="arabic-title flex items-center">
              <Activity className="w-5 h-5 ml-2" />
              سجل الأعراض
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {healthData.symptoms_log.slice(-5).reverse().map((symptom) => (
                <div key={symptom.id} className="p-4 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={getSeverityColor(symptom.severity)}>
                      {getSeverityText(symptom.severity)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(symptom.date).toLocaleDateString('ar')}
                    </span>
                  </div>
                  <p className="arabic-body text-sm leading-relaxed">
                    {symptom.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lab Tests Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-title flex items-center">
            <TestTube className="w-5 h-5 ml-2" />
            طلب فحص مخبري
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="arabic-body font-semibold">اسم الفحص</label>
              <Input
                placeholder="مثال: تحليل هرمونات"
                value={newLabTest.name}
                onChange={(e) => setNewLabTest(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <label className="arabic-body font-semibold">التكلفة (ARS)</label>
              <Input
                type="number"
                placeholder="0"
                value={newLabTest.cost}
                onChange={(e) => setNewLabTest(prev => ({ ...prev, cost: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="arabic-body font-semibold">الأولوية</label>
              <select
                value={newLabTest.priority}
                onChange={(e) => setNewLabTest(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full p-2 border rounded-lg"
              >
                <option value="routine">روتيني</option>
                <option value="urgent">عاجل</option>
                <option value="emergency">طارئ</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={addLabTest}
                className="btn-islamic arabic-body w-full"
                disabled={!newLabTest.name.trim()}
              >
                إضافة الفحص
              </Button>
            </div>
          </div>

          {newLabTest.cost && (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-2">
                <DollarSign className="w-4 h-4 text-yellow-600 mt-0.5" />
                <p className="arabic-body text-sm text-yellow-700">
                  سيتم إرسال تكلفة الفحص ({newLabTest.cost} ARS) تلقائياً إلى محمد (المراقب المالي)
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lab Tests Queue Display */}
      {healthData?.lab_tests_queue && healthData.lab_tests_queue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="arabic-title flex items-center">
              <Calendar className="w-5 h-5 ml-2" />
              قائمة الفحوصات المطلوبة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthData.lab_tests_queue.map((test) => (
                <div key={test.id} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="arabic-body font-semibold">{test.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(test.priority)}>
                        {getPriorityText(test.priority)}
                      </Badge>
                      <Badge variant="outline">
                        {test.status === 'pending' ? 'في الانتظار' : 'مكتمل'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="arabic-body text-sm text-muted-foreground">
                      طُلب في: {new Date(test.requested_date).toLocaleDateString('ar')}
                    </span>
                    {test.cost > 0 && (
                      <span className="arabic-body text-sm font-semibold text-primary">
                        {test.cost.toLocaleString()} ARS
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medical Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-title flex items-center">
            <Stethoscope className="w-5 h-5 ml-2" />
            التوصيات الطبية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="arabic-body font-semibold text-green-800 mb-2">
                توصيات عامة للصحة
              </h4>
              <ul className="space-y-1 arabic-body text-sm text-green-700">
                <li>• متابعة دورية مع طبيب النساء والتوليد</li>
                <li>• فحص مستويات الهرمونات شهرياً</li>
                <li>• تناول الفيتامينات المكملة حسب الحاجة</li>
                <li>• ممارسة الرياضة الخفيفة بانتظام</li>
                <li>• الحفاظ على نظام غذائي متوازن</li>
              </ul>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="arabic-body font-semibold text-orange-800 mb-1">
                    تنبيه طبي
                  </h4>
                  <p className="arabic-body text-sm text-orange-700">
                    في حالة ظهور أعراض شديدة أو طارئة، يرجى مراجعة الطبيب فوراً أو الاتصال بخدمات الطوارئ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fiqh Benefit */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="arabic-title text-primary text-lg">
            فائدة فقهية من الأستاذ وليد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="arabic-body text-sm text-muted-foreground">
            "قال رسول الله صلى الله عليه وسلم: 'ما أنزل الله داء إلا أنزل له شفاء'. إن العناية بالصحة والتداوي من الأمور المشروعة بل المطلوبة شرعاً، والمسلم مأمور بالأخذ بالأسباب مع التوكل على الله. وتتبع الأعراض والفحوصات الطبية من باب حفظ النفس الذي هو من الضروريات الخمس."
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthAdvisor;