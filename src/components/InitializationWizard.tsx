import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, DollarSign, BookOpen, CheckCircle } from 'lucide-react';

const InitializationWizard = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Form data
  const [formData, setFormData] = useState({
    prayerTimesFile: null,
    balanceARS: '',
    balanceUSD: '',
    academicMilestone: '',
    exchangeRate: '1200' // Default ARS to USD rate
  });

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, prayerTimesFile: file }));
      toast({
        title: "تم رفع الملف",
        description: `تم رفع ملف أوقات الصلاة: ${file.name}`,
      });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const initializeSystem = async () => {
    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      // Initialize Financial Data
      await supabase
        .from('finance_data_2025_12_18_18_42')
        .update({
          current_balance_ars: parseFloat(formData.balanceARS) || 0,
          current_balance_usd: parseFloat(formData.balanceUSD) || 0,
          exchange_rate: parseFloat(formData.exchangeRate) || 1200,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      // Initialize Academic Data
      await supabase
        .from('academic_data_2025_12_18_18_42')
        .update({
          milestones: [
            {
              id: 1,
              title: formData.academicMilestone,
              status: 'active',
              created_at: new Date().toISOString()
            }
          ],
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      // Initialize Spiritual Data (Prayer Times)
      if (formData.prayerTimesFile) {
        await supabase
          .from('spiritual_data_2025_12_18_18_42')
          .update({
            prayer_time_source: formData.prayerTimesFile.name,
            prayer_times: {
              source: 'uploaded_file',
              location: 'Buenos Aires, Argentina',
              uploaded_at: new Date().toISOString()
            },
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      }

      // Initialize System Data
      await supabase
        .from('system_data_2025_12_18_18_42')
        .update({
          master_context_file: {
            initialized_at: new Date().toISOString(),
            user_location: 'Buenos Aires, Argentina',
            system_version: '1.0.0',
            initialization_data: {
              prayer_times_uploaded: !!formData.prayerTimesFile,
              initial_balance_set: !!(formData.balanceARS || formData.balanceUSD),
              academic_milestone_set: !!formData.academicMilestone
            }
          },
          system_logs: [
            {
              timestamp: new Date().toISOString(),
              event: 'system_initialization',
              details: 'Barakah system initialized successfully',
              user_id: user.id
            }
          ],
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      toast({
        title: "تم تهيئة النظام بنجاح",
        description: "مرحباً بك في نظام بركة، شيخ زاهر. جميع البيانات جاهزة للاستخدام.",
      });

      onComplete();
    } catch (error) {
      console.error('Initialization error:', error);
      toast({
        title: "خطأ في التهيئة",
        description: "حدث خطأ أثناء تهيئة النظام. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      initializeSystem();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Upload className="w-16 h-16 text-primary mx-auto mb-4" />
              <h3 className="text-xl arabic-title text-primary mb-2">
                رفع ملف أوقات الصلاة
              </h3>
              <p className="arabic-body text-muted-foreground">
                يرجى رفع ملف أوقات الصلاة لمدينة بوينس آيرس (JSON أو PDF)
              </p>
            </div>
            
            <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".json,.pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="prayer-times-upload"
              />
              <label 
                htmlFor="prayer-times-upload"
                className="cursor-pointer block"
              >
                <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
                <p className="arabic-body text-primary font-semibold mb-2">
                  اضغط لرفع الملف
                </p>
                <p className="arabic-body text-sm text-muted-foreground">
                  JSON, PDF (حتى 10MB)
                </p>
              </label>
              
              {formData.prayerTimesFile && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 inline ml-2" />
                  <span className="arabic-body text-green-700">
                    {formData.prayerTimesFile.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <DollarSign className="w-16 h-16 text-primary mx-auto mb-4" />
              <h3 className="text-xl arabic-title text-primary mb-2">
                الرصيد الابتدائي
              </h3>
              <p className="arabic-body text-muted-foreground">
                أدخل رصيدك الحالي بالبيزو الأرجنتيني والدولار الأمريكي
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="arabic-body">الرصيد بالبيزو الأرجنتيني (ARS)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.balanceARS}
                  onChange={(e) => handleInputChange('balanceARS', e.target.value)}
                  className="text-left"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="arabic-body">الرصيد بالدولار الأمريكي (USD)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.balanceUSD}
                  onChange={(e) => handleInputChange('balanceUSD', e.target.value)}
                  className="text-left"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="arabic-body">سعر الصرف الحالي (ARS/USD)</Label>
              <Input
                type="number"
                placeholder="1200"
                value={formData.exchangeRate}
                onChange={(e) => handleInputChange('exchangeRate', e.target.value)}
                className="text-left"
              />
              <p className="text-sm arabic-body text-muted-foreground">
                سعر الدولار الأزرق الحالي في بوينس آيرس
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <BookOpen className="w-16 h-16 text-primary mx-auto mb-4" />
              <h3 className="text-xl arabic-title text-primary mb-2">
                المعلم الأكاديمي الأول
              </h3>
              <p className="arabic-body text-muted-foreground">
                أدخل أول معلم أكاديمي لرسالة الماجستير في الشريعة الإسلامية
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="arabic-body">عنوان المعلم الأكاديمي</Label>
                <Textarea
                  placeholder="مثال: مراجعة الأدبيات حول وضع الأقليات المسلمة في أمريكا اللاتينية"
                  value={formData.academicMilestone}
                  onChange={(e) => handleInputChange('academicMilestone', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="arabic-title text-primary mb-2">موضوع الرسالة:</h4>
                <p className="arabic-body text-sm text-muted-foreground">
                  "الشريعة الإسلامية ووضع الأقليات المسلمة في أمريكا اللاتينية"
                </p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl arabic-title text-primary mb-2">
                مراجعة البيانات
              </h3>
              <p className="arabic-body text-muted-foreground">
                يرجى مراجعة البيانات المدخلة قبل تهيئة النظام
              </p>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="arabic-title text-sm">ملف أوقات الصلاة</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="arabic-body text-sm">
                    {formData.prayerTimesFile ? formData.prayerTimesFile.name : 'لم يتم رفع ملف'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="arabic-title text-sm">الرصيد المالي</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="arabic-body text-sm">
                    البيزو الأرجنتيني: {formData.balanceARS || '0'} ARS
                  </p>
                  <p className="arabic-body text-sm">
                    الدولار الأمريكي: {formData.balanceUSD || '0'} USD
                  </p>
                  <p className="arabic-body text-sm">
                    سعر الصرف: {formData.exchangeRate} ARS/USD
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="arabic-title text-sm">المعلم الأكاديمي</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="arabic-body text-sm">
                    {formData.academicMilestone || 'لم يتم تحديد معلم'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 islamic-pattern flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl arabic-title text-primary mb-2">
            تهيئة نظام بركة
          </CardTitle>
          <CardDescription className="arabic-body text-lg">
            الخطوة {step} من 4 - إعداد النظام للاستخدام
          </CardDescription>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {renderStep()}

          <div className="flex justify-between pt-6">
            <Button 
              variant="outline" 
              onClick={prevStep}
              disabled={step === 1}
              className="arabic-body"
            >
              السابق
            </Button>
            
            <Button 
              onClick={nextStep}
              disabled={loading}
              className="btn-islamic arabic-body"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                  جاري التهيئة...
                </>
              ) : step === 4 ? (
                'تهيئة النظام'
              ) : (
                'التالي'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InitializationWizard;