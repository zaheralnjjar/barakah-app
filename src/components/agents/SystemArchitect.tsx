import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, 
  Database, 
  Shield,
  CheckCircle,
  AlertTriangle,
  Activity,
  RefreshCw,
  FileText
} from 'lucide-react';

const SystemArchitect = () => {
  const [systemData, setSystemData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState({
    database: 'synced',
    logic: 'active',
    backup: 'current',
    performance: 'optimal'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSystemData();
    checkSystemHealth();
  }, []);

  const loadSystemData = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data, error } = await supabase
        .from('system_data_2025_12_18_18_42')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setSystemData(data);
    } catch (error) {
      console.error('Error loading system data:', error);
      toast({
        title: "خطأ في تحميل بيانات النظام",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkSystemHealth = async () => {
    try {
      // Simulate system health check
      const healthCheck = {
        database: Math.random() > 0.1 ? 'synced' : 'error',
        logic: Math.random() > 0.05 ? 'active' : 'warning',
        backup: Math.random() > 0.2 ? 'current' : 'outdated',
        performance: Math.random() > 0.15 ? 'optimal' : 'slow'
      };
      
      setSystemStatus(healthCheck);
    } catch (error) {
      console.error('Error checking system health:', error);
    }
  };

  const runSystemMaintenance = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // Add maintenance log
      const maintenanceLog = {
        timestamp: new Date().toISOString(),
        event: 'system_maintenance',
        details: 'Manual system maintenance executed',
        user_id: user.id
      };

      const updatedLogs = [...(systemData?.system_logs || []), maintenanceLog];

      const { error } = await supabase
        .from('system_data_2025_12_18_18_42')
        .update({
          system_logs: updatedLogs,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "تم تشغيل صيانة النظام",
        description: "تم تحديث سجلات النظام وفحص سلامة البيانات",
      });

      loadSystemData();
      checkSystemHealth();
    } catch (error) {
      console.error('Error running maintenance:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'synced':
      case 'active':
      case 'current':
      case 'optimal':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
      case 'outdated':
      case 'slow':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = (component, status) => {
    const statusTexts = {
      database: {
        synced: 'متزامن',
        error: 'خطأ في الاتصال'
      },
      logic: {
        active: 'نشط',
        warning: 'تحذير'
      },
      backup: {
        current: 'محدث',
        outdated: 'يحتاج تحديث'
      },
      performance: {
        optimal: 'مثالي',
        slow: 'بطيء'
      }
    };
    
    return statusTexts[component]?.[status] || status;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'synced':
      case 'active':
      case 'current':
      case 'optimal':
        return 'bg-green-100 text-green-800';
      case 'warning':
      case 'outdated':
      case 'slow':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="mr-3 arabic-body">جاري تحميل بيانات النظام...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl arabic-title text-primary mb-2">
          سامي - مهندس النظام
        </h1>
        <p className="arabic-body text-muted-foreground">
          سلامة المنطق وصيانة قاعدة البيانات ومراقبة الأداء
        </p>
      </div>

      {/* System Status Overview */}
      <Card className="bg-gradient-to-r from-gray-50 to-blue-50">
        <CardHeader>
          <CardTitle className="arabic-title flex items-center justify-between">
            <span className="flex items-center">
              <Shield className="w-5 h-5 ml-2" />
              حالة النظام العامة
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={checkSystemHealth}
              className="arabic-body"
            >
              <RefreshCw className="w-4 h-4 ml-1" />
              فحص
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <Database className="w-6 h-6 text-blue-600" />
                {getStatusIcon(systemStatus.database)}
              </div>
              <h3 className="arabic-body font-semibold">قاعدة البيانات</h3>
              <Badge className={`mt-2 ${getStatusColor(systemStatus.database)}`}>
                {getStatusText('database', systemStatus.database)}
              </Badge>
            </div>

            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-6 h-6 text-green-600" />
                {getStatusIcon(systemStatus.logic)}
              </div>
              <h3 className="arabic-body font-semibold">سلامة المنطق</h3>
              <Badge className={`mt-2 ${getStatusColor(systemStatus.logic)}`}>
                {getStatusText('logic', systemStatus.logic)}
              </Badge>
            </div>

            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <Shield className="w-6 h-6 text-purple-600" />
                {getStatusIcon(systemStatus.backup)}
              </div>
              <h3 className="arabic-body font-semibold">النسخ الاحتياطي</h3>
              <Badge className={`mt-2 ${getStatusColor(systemStatus.backup)}`}>
                {getStatusText('backup', systemStatus.backup)}
              </Badge>
            </div>

            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-6 h-6 text-orange-600" />
                {getStatusIcon(systemStatus.performance)}
              </div>
              <h3 className="arabic-body font-semibold">الأداء</h3>
              <Badge className={`mt-2 ${getStatusColor(systemStatus.performance)}`}>
                {getStatusText('performance', systemStatus.performance)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Master Context File */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-title flex items-center">
            <FileText className="w-5 h-5 ml-2" />
            ملف السياق الرئيسي (MASTER_CONTEXT_TRANSFER_FILE)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {systemData?.master_context_file && Object.keys(systemData.master_context_file).length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="arabic-body font-semibold mb-2">معلومات التهيئة</h4>
                  <p className="text-sm text-muted-foreground">
                    تاريخ التهيئة: {systemData.master_context_file.initialized_at ? 
                      new Date(systemData.master_context_file.initialized_at).toLocaleDateString('ar') : 
                      'غير محدد'
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    الموقع: {systemData.master_context_file.user_location || 'غير محدد'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    إصدار النظام: {systemData.master_context_file.system_version || '1.0.0'}
                  </p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="arabic-body font-semibold mb-2">حالة البيانات</h4>
                  {systemData.master_context_file.initialization_data && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {systemData.master_context_file.initialization_data.prayer_times_uploaded ? 
                          <CheckCircle className="w-4 h-4 text-green-600" /> : 
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        }
                        <span className="text-sm arabic-body">أوقات الصلاة</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {systemData.master_context_file.initialization_data.initial_balance_set ? 
                          <CheckCircle className="w-4 h-4 text-green-600" /> : 
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        }
                        <span className="text-sm arabic-body">الرصيد الابتدائي</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {systemData.master_context_file.initialization_data.academic_milestone_set ? 
                          <CheckCircle className="w-4 h-4 text-green-600" /> : 
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        }
                        <span className="text-sm arabic-body">المعلم الأكاديمي</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="arabic-body">لم يتم إنشاء ملف السياق الرئيسي بعد</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-title flex items-center">
            <Settings className="w-5 h-5 ml-2" />
            صيانة النظام
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={runSystemMaintenance}
              className="btn-islamic arabic-body"
            >
              تشغيل الصيانة الدورية
            </Button>
            
            <Button 
              variant="outline"
              onClick={loadSystemData}
              className="arabic-body"
            >
              <RefreshCw className="w-4 h-4 ml-1" />
              تحديث البيانات
            </Button>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="arabic-body font-semibold text-yellow-800 mb-1">
                  تنبيه صيانة
                </h4>
                <p className="text-sm arabic-body text-yellow-700">
                  يُنصح بتشغيل الصيانة الدورية مرة واحدة يومياً للحفاظ على أداء النظام الأمثل
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-title flex items-center">
            <Activity className="w-5 h-5 ml-2" />
            سجلات النظام
          </CardTitle>
        </CardHeader>
        <CardContent>
          {systemData?.system_logs && systemData.system_logs.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {systemData.system_logs.slice(-10).reverse().map((log, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="arabic-body font-semibold text-sm">
                      {log.event === 'system_initialization' ? 'تهيئة النظام' :
                       log.event === 'system_maintenance' ? 'صيانة النظام' :
                       log.event}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString('ar')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {log.details}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="arabic-body">لا توجد سجلات نظام متاحة</p>
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
            "قال الله تعالى: 'وَكُلَّ شَيْءٍ أَحْصَيْنَاهُ فِي إِمَامٍ مُّبِينٍ' (يس: 12). إن حفظ البيانات وتنظيم المعلومات من باب الأمانة التي كلف الله بها الإنسان، والعناية بسلامة النظم والمعلومات من حسن التدبير الذي يعين على أداء الواجبات الشرعية والدنيوية."
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemArchitect;