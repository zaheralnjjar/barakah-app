import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Heart, 
  Brain, 
  Users,
  Smile,
  Frown,
  Meh,
  Plus,
  Calendar,
  MessageCircle
} from 'lucide-react';

const PsychosocialAdvisor = () => {
  const [psychosocialData, setPsychosocialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [moodLevel, setMoodLevel] = useState([5]);
  const [newNote, setNewNote] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadPsychosocialData();
  }, []);

  const loadPsychosocialData = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data, error } = await supabase
        .from('psychosocial_data_2025_12_18_18_42')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setPsychosocialData(data);
    } catch (error) {
      console.error('Error loading psychosocial data:', error);
      toast({
        title: "خطأ في تحميل البيانات النفسية",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCounselingNote = async () => {
    if (!newNote.trim()) return;

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const newNoteEntry = {
        id: Date.now(),
        content: newNote,
        mood_level: moodLevel[0],
        date: new Date().toISOString(),
        type: 'self_reflection'
      };

      const updatedNotes = [...(psychosocialData?.family_counseling_notes || []), newNoteEntry];

      const { error } = await supabase
        .from('psychosocial_data_2025_12_18_18_42')
        .update({
          family_counseling_notes: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setNewNote('');
      setMoodLevel([5]);
      loadPsychosocialData();
      toast({
        title: "تم إضافة الملاحظة",
        description: "تم حفظ ملاحظة الاستشارة النفسية",
      });
    } catch (error) {
      console.error('Error adding counseling note:', error);
    }
  };

  const updateCulturalShockLevel = async (newLevel) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { error } = await supabase
        .from('psychosocial_data_2025_12_18_18_42')
        .update({
          cultural_shock_level: newLevel,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "تم تحديث مستوى الصدمة الثقافية",
        description: `المستوى الحالي: ${newLevel}/10`,
      });

      loadPsychosocialData();
    } catch (error) {
      console.error('Error updating cultural shock level:', error);
    }
  };

  const getMoodIcon = (level) => {
    if (level <= 3) return <Frown className="w-6 h-6 text-red-500" />;
    if (level <= 7) return <Meh className="w-6 h-6 text-yellow-500" />;
    return <Smile className="w-6 h-6 text-green-500" />;
  };

  const getMoodText = (level) => {
    if (level <= 3) return 'منخفض';
    if (level <= 7) return 'متوسط';
    return 'جيد';
  };

  const getMoodColor = (level) => {
    if (level <= 3) return 'bg-red-100 text-red-800';
    if (level <= 7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="mr-3 arabic-body">جاري تحميل البيانات النفسية...</span>
      </div>
    );
  }

  const supportStrategies = [
    {
      title: 'التأقلم الثقافي',
      description: 'استراتيجيات للتكيف مع البيئة الأرجنتينية',
      icon: Users,
      tips: [
        'تعلم اللغة الإسبانية تدريجياً',
        'المشاركة في الأنشطة المجتمعية',
        'بناء شبكة دعم اجتماعي',
        'الحفاظ على الهوية الثقافية'
      ]
    },
    {
      title: 'الصحة النفسية',
      description: 'تقنيات للحفاظ على التوازن النفسي',
      icon: Brain,
      tips: [
        'ممارسة التأمل والذكر',
        'النشاط البدني المنتظم',
        'النوم الكافي والمنتظم',
        'التواصل مع الأهل والأصدقاء'
      ]
    },
    {
      title: 'الدعم الأسري',
      description: 'تعزيز العلاقات الأسرية في الغربة',
      icon: Heart,
      tips: [
        'قضاء وقت جودة مع الأسرة',
        'التواصل المفتوح والصادق',
        'إنشاء تقاليد أسرية جديدة',
        'طلب المساعدة عند الحاجة'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl arabic-title text-primary mb-2">
          سعد - المستشار النفسي
        </h1>
        <p className="arabic-body text-muted-foreground">
          الدعم النفسي وإدارة الصدمة الثقافية والاستشارة الأسرية
        </p>
      </div>

      {/* Mental Health Status */}
      <Card className="bg-gradient-to-r from-pink-50 to-purple-50">
        <CardHeader>
          <CardTitle className="arabic-title flex items-center">
            <Brain className="w-5 h-5 ml-2" />
            الحالة النفسية العامة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-4 mb-4">
              {getMoodIcon(moodLevel[0])}
              <div>
                <p className="arabic-title text-2xl text-primary">
                  {psychosocialData?.mental_health_status || 'مستقر'}
                </p>
                <Badge className={getMoodColor(moodLevel[0])}>
                  المزاج: {getMoodText(moodLevel[0])}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="arabic-body font-semibold mb-2 block">
                تقييم المزاج اليومي (1-10)
              </label>
              <Slider
                value={moodLevel}
                onValueChange={setMoodLevel}
                max={10}
                min={1}
                step={1}
                className="mb-2"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>منخفض</span>
                <span>متوسط</span>
                <span>ممتاز</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cultural Shock Management */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-title flex items-center">
            <Users className="w-5 h-5 ml-2" />
            إدارة الصدمة الثقافية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="arabic-body">مستوى الصدمة الثقافية الحالي</span>
              <Badge variant={
                (psychosocialData?.cultural_shock_level || 0) <= 3 ? 'default' :
                (psychosocialData?.cultural_shock_level || 0) <= 6 ? 'secondary' : 'destructive'
              }>
                {psychosocialData?.cultural_shock_level || 0}/10
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                <Button
                  key={level}
                  variant={level === (psychosocialData?.cultural_shock_level || 0) ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateCulturalShockLevel(level)}
                  className="arabic-body"
                >
                  {level}
                </Button>
              ))}
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="arabic-body font-semibold mb-2">نصائح للتأقلم:</h4>
              <ul className="space-y-1 text-sm arabic-body text-muted-foreground">
                <li>• تذكر أن التأقلم عملية تدريجية تحتاج وقت</li>
                <li>• ابحث عن المجتمع المسلم المحلي في بوينس آيرس</li>
                <li>• حافظ على التواصل مع الوطن الأم</li>
                <li>• تعلم عن الثقافة الأرجنتينية بعقل منفتح</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Strategies */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-title flex items-center">
            <MessageCircle className="w-5 h-5 ml-2" />
            استراتيجيات الدعم النفسي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {supportStrategies.map((strategy, index) => {
              const IconComponent = strategy.icon;
              return (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="arabic-title font-semibold">{strategy.title}</h3>
                    </div>
                  </div>
                  <p className="arabic-body text-sm text-muted-foreground mb-3">
                    {strategy.description}
                  </p>
                  <ul className="space-y-1">
                    {strategy.tips.map((tip, tipIndex) => (
                      <li key={tipIndex} className="arabic-body text-xs flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5"></span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Counseling Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-title flex items-center">
            <Plus className="w-5 h-5 ml-2" />
            إضافة ملاحظة استشارية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="اكتب ملاحظاتك أو مشاعرك أو أي تحديات تواجهها..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={4}
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getMoodIcon(moodLevel[0])}
              <span className="arabic-body text-sm">
                المزاج: {getMoodText(moodLevel[0])}
              </span>
            </div>
            
            <Button 
              onClick={addCounselingNote}
              className="btn-islamic arabic-body"
              disabled={!newNote.trim()}
            >
              حفظ الملاحظة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Notes */}
      {psychosocialData?.family_counseling_notes && psychosocialData.family_counseling_notes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="arabic-title flex items-center">
              <Calendar className="w-5 h-5 ml-2" />
              الملاحظات الاستشارية السابقة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {psychosocialData.family_counseling_notes.slice(-5).reverse().map((note) => (
                <div key={note.id} className="p-4 bg-pink-50 rounded-lg border border-pink-100">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getMoodIcon(note.mood_level)}
                      <Badge className={getMoodColor(note.mood_level)}>
                        {getMoodText(note.mood_level)}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(note.date).toLocaleDateString('ar')}
                    </span>
                  </div>
                  <p className="arabic-body text-sm leading-relaxed">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency Support */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="arabic-title text-orange-700 flex items-center">
            <Heart className="w-5 h-5 ml-2" />
            الدعم الطارئ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="arabic-body text-sm text-orange-700">
              إذا كنت تشعر بضائقة نفسية شديدة أو تحتاج دعماً فورياً:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-lg border border-orange-200">
                <h4 className="arabic-body font-semibold mb-1">خط المساعدة النفسية</h4>
                <p className="text-sm text-muted-foreground">135 (الأرجنتين)</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-orange-200">
                <h4 className="arabic-body font-semibold mb-1">المجتمع المسلم</h4>
                <p className="text-sm text-muted-foreground">ابحث عن المسجد المحلي</p>
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
            "قال الله تعالى: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ' (الطلاق: 3). إن الاهتمام بالصحة النفسية والتوازن العاطفي من تمام العبادة، فالمؤمن القوي خير وأحب إلى الله من المؤمن الضعيف. والمسلم في الغربة أحوج ما يكون إلى القوة النفسية والثبات على دينه."
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PsychosocialAdvisor;