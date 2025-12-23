import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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

import BottomNavBar from '@/components/BottomNavBar';
import InteractiveMap from '@/components/InteractiveMap';
import PinLock, { usePinLock } from '@/components/PinLock';
import { NotificationBell } from '@/components/NotificationBell';


const Index = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboardOrder, setDashboardOrder] = useState(['stats', 'appointments', 'shopping', 'map']);
  const { toast } = useToast();

  // PIN Lock
  const { isLocked, pinEnabled, showSetup, unlock, onSetupComplete, setShowSetup } = usePinLock();

  // Swipe Navigation Logic
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);
  const swipeStartTime = useRef(0);
  const SWIPE_THRESHOLD = 100;
  const MIN_SWIPE_TIME = 150; // Minimum time (ms) to differentiate swipe from tap

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      swipeStartTime.current = Date.now();
      isDragging.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      currentX.current = e.touches[0].clientX;
      currentY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
      if (!isDragging.current) return;

      const swipeDuration = Date.now() - swipeStartTime.current;
      const diffX = currentX.current - startX.current;
      const diffY = currentY.current - startY.current;

      // Tabs order for sequential navigation
      const TABS_ORDER = ['dashboard', 'finance', 'logistics', 'appointments', 'prayer', 'map', 'settings'];

      // Only process as swipe if: duration > MIN_SWIPE_TIME AND movement > threshold
      if (swipeDuration > MIN_SWIPE_TIME && Math.abs(diffX) > SWIPE_THRESHOLD) {
        // Horizontal swipe - navigate tabs
        if (Math.abs(diffX) > Math.abs(diffY)) {
          const currentIndex = TABS_ORDER.indexOf(activeTab);

          if (diffX > 0) {
            // Swipe right (in RTL = go to previous tab)
            if (currentIndex > 0) {
              setActiveTab(TABS_ORDER[currentIndex - 1]);
              toast({ title: `← الانتقال`, duration: 1000 });
            }
          } else {
            // Swipe left (in RTL = go to next tab)
            if (currentIndex < TABS_ORDER.length - 1) {
              setActiveTab(TABS_ORDER[currentIndex + 1]);
              toast({ title: `→ الانتقال`, duration: 1000 });
            }
          }
        }
      }

      // Vertical swipe gestures
      if (swipeDuration > MIN_SWIPE_TIME && Math.abs(diffY) > SWIPE_THRESHOLD && Math.abs(diffY) > Math.abs(diffX)) {
        if (diffY > 0) {
          // Swipe down - refresh page
          window.location.reload();
          toast({ title: '🔄 جاري التحديث...', duration: 1500 });
        } else {
          // Swipe up - go to dashboard
          if (activeTab !== 'dashboard') {
            setActiveTab('dashboard');
            toast({ title: '🏠 الرئيسية', duration: 1000 });
          }
        }
      }

      isDragging.current = false;
      startX.current = 0;
      startY.current = 0;
      currentX.current = 0;
      currentY.current = 0;
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [activeTab]);

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



      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 islamic-pattern pb-24 relative">
        {/* Notification Bell - Always visible Top Right */}
        <div className="absolute top-4 left-4 z-50">
          <NotificationBell />
        </div>

        {/* Content Area - No Padding Container for full width */}
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

        {/* Floating Action Button (Optional, can be added here) */}

        {/* Bottom Navigation */}
        <BottomNavBar
          activeTab={getActiveNavId()}
          onNavigate={handleNavChange}
        />

        {/* Voice Assistant Modal */}

      </div>
    </>
  );
};

export default Index;