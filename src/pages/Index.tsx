import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar, Plus, Settings, DollarSign, Bot } from 'lucide-react';

// Components
import FinancialController from '@/components/agents/FinancialController';
import LogisticsManager from '@/components/agents/LogisticsManager';
import InitializationWizard from '@/components/InitializationWizard';
import SmartDashboard from '@/components/SmartDashboard';
import SettingsPanel from '@/components/SettingsPanel';
import AuthForm from '@/components/AuthForm';
import AppointmentManager from '@/components/AppointmentManager';
import PrayerManager from '@/components/PrayerManager';
import ShoppingList from '@/components/ShoppingList';
import DailyCalendar from '@/components/DailyCalendar';
import CalendarSection from '@/components/CalendarSection';
import RadialMenu from '@/components/RadialMenu';
import AIAssistant from '@/components/AIAssistant';

import BottomNavBar from '@/components/BottomNavBar';
import InteractiveMap from '@/components/InteractiveMap';
import PinLock, { usePinLock } from '@/components/PinLock';
import { NotificationBell } from '@/components/NotificationBell';
import NavSummaryDialogs from '@/components/NavSummaryDialogs';
import { useWidgetSync } from '@/hooks/useWidgetSync';
import { useCloudSync } from '@/hooks/useCloudSync';
import { useLocalNotifications } from '@/hooks/useLocalNotifications';

const Index = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboardOrder, setDashboardOrder] = useState(['stats', 'appointments', 'shopping', 'map']);
  const [activeSummary, setActiveSummary] = useState<string | null>(null);
  const { toast } = useToast();

  // Sync Hooks
  const { syncNow } = useCloudSync();
  useWidgetSync(); // Keep for background sync if needed
  useLocalNotifications();

  // PIN Lock
  const { isLocked, pinEnabled, showSetup, unlock, onSetupComplete, setShowSetup } = usePinLock();

  // Radial Menu State
  const [showRadialMenu, setShowRadialMenu] = useState(false);
  const [radialMenuPosition, setRadialMenuPosition] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Long press handler for radial menu
  const handleLongPressStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    longPressTimer.current = setTimeout(() => {
      setRadialMenuPosition({ x: clientX, y: clientY });
      setShowRadialMenu(true);
    }, 500); // 500ms long press
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // AI Assistant state
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  // Get saved radial menu actions
  const getRadialMenuActions = () => {
    try {
      const saved = localStorage.getItem('baraka_radial_menu_actions');
      return saved ? JSON.parse(saved) : {
        top: 'calendar',
        right: 'add_transaction',
        bottom: 'finance',
        left: 'settings',
      };
    } catch {
      return { top: 'calendar', right: 'add_transaction', bottom: 'finance', left: 'settings' };
    }
  };

  const handleRadialAction = (action: string) => {
    setShowRadialMenu(false);
    switch (action) {
      case 'calendar':
        setActiveTab('calendar');
        break;
      case 'add':
      case 'add_transaction':
        setActiveTab('finance');
        // Could open add transaction dialog directly
        break;
      case 'finance':
        setActiveTab('finance');
        break;
      case 'settings':
        setActiveTab('settings');
        break;
      case 'dashboard':
      case 'home':
        setActiveTab('dashboard');
        break;
      case 'shopping':
        setActiveTab('productivity');
        break;
      case 'ai_chat':
      case 'ai_report':
        setShowAIAssistant(true);
        break;
      case 'sync_sheets':
        toast({
          title: 'جاري المزامنة',
          description: 'يتم مزامنة الجداول...',
        });
        syncNow();
        break;
    }
  };

  // Swipe gestures removed - were interfering with checkbox clicks


  useEffect(() => {
    const validSections = ['stats', 'appointments', 'shopping', 'map'];
    const savedOrder = localStorage.getItem('baraka_dashboard_order');
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        // Validate: must be array with valid section IDs
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(s => validSections.includes(s))) {
          setDashboardOrder(parsed);
        } else {
          // Invalid data - reset to defaults
          localStorage.setItem('baraka_dashboard_order', JSON.stringify(validSections));
          setDashboardOrder(validSections);
        }
      } catch (e) {
        // Parse error - reset to defaults
        localStorage.setItem('baraka_dashboard_order', JSON.stringify(validSections));
        setDashboardOrder(validSections);
      }
    }
  }, [activeTab]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          localStorage.setItem('baraka_user_location', JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date().toISOString()
          }));
        },
        (error) => console.log('Location permission denied:', error.message),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: "مرحباً بك في نظام بركة", description: "تم تسجيل الدخول بنجاح" });
      return { data, error: null };
    } catch (error) {
      toast({ title: "خطأ في تسجيل الدخول", description: error.message, variant: "destructive" });
      return { data: null, error };
    }
  };

  const signUp = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` }
      });
      if (error) throw error;
      toast({ title: "تم إنشاء الحساب", description: "يرجى التحقق من بريدك الإلكتروني" });
      return { data, error: null };
    } catch (error) {
      toast({ title: "خطأ في إنشاء الحساب", description: error.message, variant: "destructive" });
      return { data: null, error };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg arabic-body">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 islamic-pattern">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl arabic-title text-primary mb-2">نظام بركة</CardTitle>
            <CardDescription className="arabic-body text-lg">نظام إدارة الحياة المتكامل</CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm onSignIn={signIn} onSignUp={signUp} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isInitialized) {
    return <InitializationWizard onComplete={() => setIsInitialized(true)} />;
  }

  // Map BottomNavBar IDs to Tab Values
  // 'mohamed' -> finance
  // 'fatima' -> productivity
  // 'dashboard' -> dashboard
  // 'settings' -> settings
  const handleNavChange = (id: string) => {
    if (id === 'mohamed') setActiveTab('finance');
    else if (id === 'fatima') setActiveTab('productivity');
    else setActiveTab(id);
  };

  // Reverse mapping for BottomNavBar active state
  const getActiveNavId = () => {
    if (activeTab === 'finance') return 'mohamed';
    if (activeTab === 'productivity') return 'fatima';
    return activeTab;
  };

  return (
    <>
      {/* PIN Lock Screen */}
      {pinEnabled && isLocked && <PinLock onUnlock={unlock} />}

      {/* PIN Setup Screen */}
      {showSetup && <PinLock isSetupMode onUnlock={() => { }} onSetupComplete={onSetupComplete} />}



      <div
        className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 islamic-pattern pb-24 relative"
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        onTouchCancel={handleLongPressEnd}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
      >        {/* Content Area - No Padding Container for full width */}
        <div className="w-full">

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">

            {/* Note: We removed TabsList from here. Controlled by BottomNavBar */}

            <div className="px-2 pt-2 md:container md:mx-auto md:px-4 md:pt-6">
              <TabsContent value="dashboard" className="animate-fade-in space-y-4 data-[state=active]:block">
                <SmartDashboard onNavigateToTab={setActiveTab} />
              </TabsContent>

              <TabsContent value="calendar" className="animate-fade-in data-[state=active]:block">
                <CalendarSection />
              </TabsContent>



              <TabsContent value="finance" className="animate-fade-in data-[state=active]:block">
                <FinancialController />
              </TabsContent>

              <TabsContent value="prayer" className="animate-fade-in data-[state=active]:block">
                <PrayerManager />
              </TabsContent>

              <TabsContent value="productivity" className="animate-fade-in data-[state=active]:block">
                <LogisticsManager />
              </TabsContent>

              <TabsContent value="settings" className="animate-fade-in data-[state=active]:block">
                <SettingsPanel />
              </TabsContent>

              <TabsContent value="appointments" className="animate-fade-in data-[state=active]:block">
                <AppointmentManager />
              </TabsContent>

              <TabsContent value="shopping" className="animate-fade-in data-[state=active]:block">
                <ShoppingList />
              </TabsContent>

              <TabsContent value="map" className="animate-fade-in data-[state=active]:block">
                <InteractiveMap />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Floating AI Assistant Button */}
        <button
          onClick={() => setShowAIAssistant(true)}
          className="fixed bottom-24 right-4 z-50 w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform active:scale-95"
          style={{ boxShadow: '0 4px 15px rgba(147, 51, 234, 0.4)' }}
        >
          <Bot className="w-7 h-7" />
        </button>

        {/* Bottom Navigation */}
        <BottomNavBar
          activeTab={getActiveNavId()}
          onNavigate={handleNavChange}
          onLongPress={(id) => {
            if (id === 'settings_sync') {
              // Silent Sync Trigger with Toast Feedback
              if (navigator.vibrate) navigator.vibrate(50);

              toast({
                title: "جاري المزامنة",
                description: "يتم تحديث البيانات مع السحابة...",
                duration: 2000,
              });

              // Construct proper async handling
              const performSync = async () => {
                try {
                  await syncNow();
                  toast({
                    title: "تمت المزامنة",
                    description: "تم تحديث البيانات بنجاح",
                    className: "bg-green-50 border-green-200",
                    duration: 3000
                  });
                } catch (error) {
                  console.error("Sync failed:", error);
                  toast({
                    title: "فشل المزامنة",
                    description: "يرجى التحقق من الاتصال",
                    variant: "destructive"
                  });
                }
              };

              performSync();
            } else {
              setActiveSummary(id);
            }
          }}
        />

        <NavSummaryDialogs
          type={activeSummary}
          onClose={() => setActiveSummary(null)}
        />

        {/* Radial Menu - Triggered by long press */}
        <RadialMenu
          isOpen={showRadialMenu}
          onClose={() => setShowRadialMenu(false)}
          position={radialMenuPosition}
          actions={{
            top: { icon: <Calendar className="w-5 h-5" />, label: 'التقويم', action: 'calendar' },
            right: { icon: <Plus className="w-5 h-5" />, label: 'إضافة', action: 'add' },
            bottom: { icon: <DollarSign className="w-5 h-5" />, label: 'المالية', action: 'finance' },
            left: { icon: <Settings className="w-5 h-5" />, label: 'الإعدادات', action: 'settings' },
          }}
          onAction={handleRadialAction}
        />

        {/* AI Assistant Dialog */}
        <AIAssistant
          isOpen={showAIAssistant}
          onClose={() => setShowAIAssistant(false)}
        />

        {/* Voice Assistant Modal */}

      </div>
    </>
  );
};

export default Index;