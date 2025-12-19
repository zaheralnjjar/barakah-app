import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  GraduationCap, 
  BookOpen, 
  Target,
  CheckCircle,
  Clock,
  Plus,
  FileText
} from 'lucide-react';

const AcademicCoach = () => {
  const [academicData, setAcademicData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' });
  const { toast } = useToast();

  useEffect(() => {
    loadAcademicData();
  }, []);

  const loadAcademicData = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data, error } = await supabase
        .from('academic_data_2025_12_18_18_42')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setAcademicData(data);
    } catch (error) {
      console.error('Error loading academic data:', error);
      toast({
        title: "خطأ في تحميل البيانات الأكاديمية",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTask.title) return;

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const updatedTasksList = [...(academicData.tasks_list || []), {
        id: Date.now(),
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        status: 'pending',
        created_at: new Date().toISOString()
      }];

      const { error } = await supabase
        .from('academic_data_2025_12_18_18_42')
        .update({
          tasks_list: updatedTasksList,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setNewTask({ title: '', description: '', priority: 'medium' });
      loadAcademicData();
      toast({
        title: "تم إضافة المهمة",
        description: `تم إضافة "${newTask.title}" لقائمة المهام`,
      });
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const updateThesisPhase = async (newPhase) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { error } = await supabase
        .from('academic_data_2025_12_18_18_42')
        .update({
          thesis_phase: newPhase,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "تم تحديث مرحلة الرسالة",
        description: `المرحلة الحالية: ${newPhase}`,
      });

      loadAcademicData();
    } catch (error) {
      console.error('Error updating thesis phase:', error);
    }
  };

  const toggleTaskStatus = async (taskId) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const updatedTasksList = academicData.tasks_list.map(task =>
        task.id === taskId 
          ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' }
          : task
      );

      const { error } = await supabase
        .from('academic_data_2025_12_18_18_42')
        .update({
          tasks_list: updatedTasksList,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;
      loadAcademicData();
    } catch (error) {
      console.error('Error toggling task status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="mr-3 arabic-body">جاري تحميل البيانات الأكاديمية...</span>
      </div>
    );
  }

  const thesisPhases = [
    'مراجعة الأدبيات',
    'تطوير الإطار النظري',
    'جمع البيانات',
    'التحليل والكتابة',
    'المراجعة النهائية'
  ];

  const completedTasks = academicData?.tasks_list?.filter(task => task.status === 'completed').length || 0;
  const totalTasks = academicData?.tasks_list?.length || 0;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <GraduationCap className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl arabic-title text-primary mb-2">
          يوسف - المدرب الأكاديمي
        </h1>
        <p className="arabic-body text-muted-foreground">
          إدارة رسالة الماجستير والمهام الأكاديمية
        </p>
      </div>

      {/* Thesis Overview */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50">
        <CardHeader>
          <CardTitle className="arabic-title flex items-center">
            <BookOpen className="w-5 h-5 ml-2" />
            رسالة الماجستير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <h2 className="arabic-title text-xl text-primary mb-2">
              {academicData?.thesis_title || 'الشريعة الإسلامية ووضع الأقليات المسلمة'}
            </h2>
            <p className="arabic-body text-muted-foreground">
              في أمريكا اللاتينية - دراسة فقهية معاصرة
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="arabic-body">المرحلة الحالية</span>
              <Badge variant="secondary">
                المرحلة {academicData?.thesis_phase || 0}
              </Badge>
            </div>
            
            <Progress 
              value={((academicData?.thesis_phase || 0) / thesisPhases.length) * 100} 
              className="h-3"
            />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mt-4">
              {thesisPhases.map((phase, index) => (
                <Button
                  key={index}
                  variant={index <= (academicData?.thesis_phase || 0) ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateThesisPhase(index)}
                  className="arabic-body text-xs p-2 h-auto"
                >
                  {index + 1}. {phase}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-title flex items-center justify-between">
            <span className="flex items-center">
              <Target className="w-5 h-5 ml-2" />
              تقدم المهام
            </span>
            <Badge variant="outline">
              {completedTasks} من {totalTasks}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="arabic-body">نسبة الإنجاز</span>
              <span className="font-bold text-primary">
                {progressPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Add New Task */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-title flex items-center">
            <Plus className="w-5 h-5 ml-2" />
            إضافة مهمة جديدة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="عنوان المهمة"
              value={newTask.title}
              onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Textarea
              placeholder="وصف المهمة (اختياري)"
              value={newTask.description}
              onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex items-center gap-4">
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
              className="p-2 border rounded-lg flex-1"
            >
              <option value="low">أولوية منخفضة</option>
              <option value="medium">أولوية متوسطة</option>
              <option value="high">أولوية عالية</option>
            </select>
            
            <Button onClick={addTask} className="btn-islamic arabic-body">
              إضافة المهمة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-title flex items-center">
            <FileText className="w-5 h-5 ml-2" />
            قائمة المهام
          </CardTitle>
        </CardHeader>
        <CardContent>
          {academicData?.tasks_list && academicData.tasks_list.length > 0 ? (
            <div className="space-y-3">
              {academicData.tasks_list.map((task) => (
                <div 
                  key={task.id}
                  className={`p-4 rounded-lg border ${
                    task.status === 'completed' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTaskStatus(task.id)}
                        className={task.status === 'completed' ? 'text-green-600' : 'text-gray-400'}
                      >
                        <CheckCircle className="w-5 h-5" />
                      </Button>
                      
                      <div className="flex-1">
                        <h3 className={`arabic-body font-semibold ${
                          task.status === 'completed' ? 'line-through text-gray-500' : ''
                        }`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {new Date(task.created_at).toLocaleDateString('ar')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <Badge 
                      variant={
                        task.priority === 'high' ? 'destructive' : 
                        task.priority === 'medium' ? 'default' : 'secondary'
                      }
                    >
                      {task.priority === 'high' ? 'عالية' : 
                       task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="arabic-body">لا توجد مهام مضافة حالياً</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-title flex items-center">
            <Target className="w-5 h-5 ml-2" />
            المعالم الأكاديمية
          </CardTitle>
        </CardHeader>
        <CardContent>
          {academicData?.milestones && academicData.milestones.length > 0 ? (
            <div className="space-y-3">
              {academicData.milestones.map((milestone, index) => (
                <div key={milestone.id || index} className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="arabic-body font-semibold mb-2">{milestone.title}</h3>
                  <div className="flex items-center justify-between">
                    <Badge variant={milestone.status === 'active' ? 'default' : 'secondary'}>
                      {milestone.status === 'active' ? 'نشط' : 'مكتمل'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(milestone.created_at).toLocaleDateString('ar')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="arabic-body">لا توجد معالم أكاديمية محددة</p>
            </div>
          )}
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
            "قال الله تعالى: 'وَقُل رَّبِّ زِدْنِي عِلْمًا' (طه: 114). إن طلب العلم الشرعي وخاصة في مجال الفقه المعاصر للأقليات المسلمة من أجل الأعمال وأنفعها للأمة. والتنظيم في البحث والدراسة من أسباب التوفيق والنجاح، والله المستعان."
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcademicCoach;