import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Scale, 
  BookOpen, 
  Star,
  Plus,
  Lightbulb,
  Globe,
  Users
} from 'lucide-react';

const LegislationTeacher = () => {
  const [legislationData, setLegislationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newBenefit, setNewBenefit] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadLegislationData();
  }, []);

  const loadLegislationData = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data, error } = await supabase
        .from('legislation_data_2025_12_18_18_42')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setLegislationData(data);
    } catch (error) {
      console.error('Error loading legislation data:', error);
      toast({
        title: "خطأ في تحميل بيانات التشريع",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addDailyBenefit = async () => {
    if (!newBenefit.trim()) return;

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const newBenefitEntry = {
        id: Date.now(),
        content: newBenefit,
        category: 'fiqh',
        date: new Date().toISOString(),
        context: 'latin_america_minorities'
      };

      const updatedBenefits = [...(legislationData?.daily_benefits || []), newBenefitEntry];

      const { error } = await supabase
        .from('legislation_data_2025_12_18_18_42')
        .update({
          daily_benefits: updatedBenefits,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setNewBenefit('');
      loadLegislationData();
      toast({
        title: "تم إضافة الفائدة الفقهية",
        description: "تم حفظ الفائدة الجديدة بنجاح",
      });
    } catch (error) {
      console.error('Error adding daily benefit:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="mr-3 arabic-body">جاري تحميل بيانات التشريع...</span>
      </div>
    );
  }

  const fiqhTopics = [
    {
      title: 'فقه الأقليات المسلمة',
      description: 'الأحكام الشرعية الخاصة بالمسلمين في البلدان غير الإسلامية',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'التكيف الثقافي والشرعي',
      description: 'كيفية الموازنة بين الحفاظ على الهوية الإسلامية والاندماج المجتمعي',
      icon: Globe,
      color: 'bg-green-500'
    },
    {
      title: 'أحكام المعاملات في الغربة',
      description: 'الأحكام الشرعية للمعاملات المالية والتجارية في أمريكا اللاتينية',
      icon: Scale,
      color: 'bg-purple-500'
    }
  ];

  const usulPrinciples = [
    'المصالح المرسلة في بيئة الأقليات',
    'قاعدة الضرورات تبيح المحظورات',
    'اعتبار العرف المحلي في الأحكام',
    'التدرج في تطبيق الأحكام الشرعية'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Scale className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl arabic-title text-primary mb-2">
          وليد - معلم التشريع
        </h1>
        <p className="arabic-body text-muted-foreground">
          الفقه وأصول الفقه للأقليات المسلمة في أمريكا اللاتينية
        </p>
      </div>

      {/* Daily Fiqh Benefit */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="arabic-title flex items-center text-indigo-700">
            <Star className="w-5 h-5 ml-2" />
            الفائدة الفقهية اليومية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-white rounded-lg border border-indigo-100 mb-4">
            <p className="arabic-body text-lg leading-relaxed">
              "إن المسلم في بلاد الغربة يحتاج إلى فهم دقيق لأحكام الشريعة في سياق الأقلية، فما يجوز في دار الإسلام قد يختلف حكمه في دار الغربة لاختلاف الظروف والمقاصد. والأصل في ذلك قول الله تعالى: 'وَمَا جَعَلَ عَلَيْكُمْ فِي الدِّينِ مِنْ حَرَجٍ' (الحج: 78)."
            </p>
            <div className="flex items-center justify-between mt-3">
              <Badge variant="secondary" className="arabic-body">
                فقه الأقليات
              </Badge>
              <span className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('ar')}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Textarea
              placeholder="أضف فائدة فقهية جديدة..."
              value={newBenefit}
              onChange={(e) => setNewBenefit(e.target.value)}
              rows={3}
            />
            <Button 
              onClick={addDailyBenefit}
              className="btn-islamic arabic-body"
              disabled={!newBenefit.trim()}
            >
              <Plus className="w-4 h-4 ml-1" />
              إضافة فائدة فقهية
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Fiqh Topics */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-title flex items-center">
            <BookOpen className="w-5 h-5 ml-2" />
            موضوعات فقهية متخصصة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {fiqhTopics.map((topic, index) => {
              const IconComponent = topic.icon;
              return (
                <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 ${topic.color} rounded-full flex items-center justify-center mb-3`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="arabic-title font-semibold mb-2">{topic.title}</h3>
                  <p className="arabic-body text-sm text-muted-foreground">
                    {topic.description}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Usul al-Fiqh Principles */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-title flex items-center">
            <Lightbulb className="w-5 h-5 ml-2" />
            قواعد أصولية للأقليات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {usulPrinciples.map((principle, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                    {index + 1}
                  </div>
                  <p className="arabic-body font-semibold">{principle}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Latin America Context */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-title flex items-center">
            <Globe className="w-5 h-5 ml-2" />
            السياق اللاتيني الأمريكي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="arabic-title font-semibold text-primary">التحديات الفقهية</h3>
              <ul className="space-y-2">
                <li className="arabic-body text-sm flex items-start gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2"></span>
                  التعامل مع النظام المصرفي الربوي
                </li>
                <li className="arabic-body text-sm flex items-start gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2"></span>
                  أحكام الطعام والذبح الحلال
                </li>
                <li className="arabic-body text-sm flex items-start gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2"></span>
                  التعليم في المدارس العلمانية
                </li>
                <li className="arabic-body text-sm flex items-start gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2"></span>
                  المشاركة في الحياة السياسية
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="arabic-title font-semibold text-primary">الحلول الشرعية</h3>
              <ul className="space-y-2">
                <li className="arabic-body text-sm flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2"></span>
                  البحث عن البدائل الإسلامية
                </li>
                <li className="arabic-body text-sm flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2"></span>
                  تطبيق قاعدة أخف الضررين
                </li>
                <li className="arabic-body text-sm flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2"></span>
                  التدرج في التطبيق
                </li>
                <li className="arabic-body text-sm flex items-start gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2"></span>
                  التعاون مع المجتمع المحلي
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Benefits */}
      {legislationData?.daily_benefits && legislationData.daily_benefits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="arabic-title flex items-center">
              <Star className="w-5 h-5 ml-2" />
              الفوائد الفقهية المحفوظة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {legislationData.daily_benefits.slice(-5).reverse().map((benefit) => (
                <div key={benefit.id} className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                  <p className="arabic-body text-sm leading-relaxed mb-2">
                    {benefit.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="arabic-body text-xs">
                      {benefit.category === 'fiqh' ? 'فقه' : 'أصول'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(benefit.date).toLocaleDateString('ar')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Educational Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-title flex items-center">
            <BookOpen className="w-5 h-5 ml-2" />
            مراجع تعليمية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="arabic-title font-semibold mb-2">كتب أساسية</h4>
              <ul className="space-y-1 text-sm arabic-body text-muted-foreground">
                <li>• فقه الأقليات المسلمة - د. يوسف القرضاوي</li>
                <li>• أحكام الأقليات المسلمة - د. خالد عبد القادر</li>
                <li>• المقاصد الشرعية - د. أحمد الريسوني</li>
              </ul>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="arabic-title font-semibold mb-2">مجلات علمية</h4>
              <ul className="space-y-1 text-sm arabic-body text-muted-foreground">
                <li>• مجلة الفقه الإسلامي</li>
                <li>• مجلة البحوث الفقهية المعاصرة</li>
                <li>• مجلة دراسات الأقليات المسلمة</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Final Fiqh Benefit */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="arabic-title text-primary text-lg">
            خاتمة فقهية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="arabic-body text-sm text-muted-foreground">
            "والخلاصة أن المسلم في بلاد الغربة يحتاج إلى علم راسخ بأحكام الشريعة، وفهم عميق لمقاصدها، وحكمة في تطبيقها، وصبر على ما قد يواجهه من تحديات. والله تعالى يقول: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا' (الطلاق: 2). فالتقوى والعلم والحكمة هي سبيل النجاة والفلاح في كل زمان ومكان."
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LegislationTeacher;