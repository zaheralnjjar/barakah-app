import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Bot, Users, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import NewMuslimsManager from '@/components/NewMuslims/NewMuslimsManager';

// Error Boundary and Loading
import ErrorBoundary from '@/components/ErrorBoundary';
import PageLoading from '@/components/PageLoading';

// Lazy loaded heavy components (Code Splitting)
const FinancialController = lazy(() => import('@/components/agents/FinancialController'));
const LogisticsManager = lazy(() => import('@/components/agents/LogisticsManager'));
const CalendarSection = lazy(() => import('@/components/CalendarSection'));
const InteractiveMap = lazy(() => import('@/components/InteractiveMap'));
const SettingsPanel = lazy(() => import('@/components/SettingsPanel'));
const PrayerManager = lazy(() => import('@/components/PrayerManager'));

// Regular imports for critical path components
import InitializationWizard from '@/components/InitializationWizard';
import SmartDashboard from '@/components/SmartDashboard';
import AuthForm from '@/components/AuthForm';
import AppointmentManager from '@/components/AppointmentManager';
import ShoppingList from '@/components/ShoppingList';
import DailyCalendar from '@/components/DailyCalendar';

import SideNavBar from '@/components/SideNavBar';
import ReportGenerator from '@/components/ReportGenerator';
import { isAndroid } from '@/utils/platformDetection';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { getDaysUntil } from '@/utils/dateUtils';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import PinLock, { usePinLock } from '@/components/PinLock';
import { NotificationBell } from '@/components/NotificationBell';
import NavSummaryDialogs from '@/components/NavSummaryDialogs';

import { useCloudSync } from '@/hooks/useCloudSync';
import { useLocalNotifications } from '@/hooks/useLocalNotifications';
import VoiceNoteRecorder from '@/components/VoiceNoteRecorder';
import { useNotesV2 } from '@/hooks/useNotesV2';
import SyncStatusIndicator from '@/components/SyncStatusIndicator';


// NEW FEATURE: Salary Manager



// Section types for reordering
type SectionId = 'newmuslims';
interface SectionConfig {
  id: SectionId;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  colorClass: string;
  borderColor: string;
  component: React.ReactNode;
}

const Index = () => {
  const { activeTab, setActiveTab } = useOutletContext<{ activeTab: string, setActiveTab: (t: string) => void }>();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(true);
  // const [activeTab, setActiveTab] = useState("dashboard"); // Managed by CoreLayout now
  const [dashboardOrder, setDashboardOrder] = useState(['stats', 'appointments', 'shopping', 'map']);
  const [activeSummary, setActiveSummary] = useState<string | null>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const { toast } = useToast();

  // Collapsible states
  const [openSections, setOpenSections] = useState<Record<SectionId, boolean>>({
    newmuslims: false,
  });

  // Reorderable sections order
  const [sectionOrder, setSectionOrder] = useState<SectionId[]>(() => {
    try {
      const saved = localStorage.getItem('baraka_section_order');
      return saved ? JSON.parse(saved) : ['newmuslims'];
    } catch { return ['newmuslims']; }
  });

  // Drag state
  const { notes, createNote, updateNote } = useNotesV2();

  const appendToActivitiesNote = async (content: string) => {
    const today = new Date().toLocaleDateString('ar-SA');
    const activityTitle = `نشاط يوم ${today}`;

    const existing = notes.find(n => n.title === activityTitle);

    if (existing) {
      await updateNote({
        id: existing.id,
        updates: { content: (existing.content || '') + `<p>${content}</p>` }
      });
    } else {
      await createNote({ title: activityTitle, folder_id: null, content: `<p>${content}</p>` });
    }
  };

  // Sync Hooks
  const { syncNow, isSyncing, lastSync, isOnline, pendingActions, failedActions } = useCloudSync();

  useLocalNotifications();

  // PIN Lock
  const { isLocked, pinEnabled, showSetup, unlock, onSetupComplete, setShowSetup } = usePinLock();

  // Prayer times for SmartBottomBar
  const { nextPrayer, timeUntilNext } = usePrayerTimes();

  // Appointments state
  const [appointments, setAppointments] = useState<any[]>([]);

  // Tasks state for SmartBottomBar
  const [tasksCount, setTasksCount] = useState({ remaining: 0, completed: 0 });

  // Swipe back gesture for Android
  useSwipeBack({ enabled: true });

  // Listen for SmartBottomBar long-press events
  useEffect(() => {
    const handleQuickActions = () => {
      // Scroll to quick actions or trigger some action
      const element = document.querySelector('.quick-actions-grid');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    const handleCloudSync = () => {
      if (syncNow) {
        syncNow();
        toast({ title: '☁️ جاري المزامنة...', description: 'تزامن البيانات مع السحابة' });
      }
    };

    const handleReportGenerator = () => setShowReportGenerator(true);
    window.addEventListener('open-quick-actions', handleQuickActions);
    window.addEventListener('trigger-cloud-sync', handleCloudSync);
    window.addEventListener('open-report-generator', handleReportGenerator);

    return () => {
      window.removeEventListener('open-quick-actions', handleQuickActions);
      window.removeEventListener('trigger-cloud-sync', handleCloudSync);
      window.removeEventListener('open-report-generator', handleReportGenerator);
    };
  }, [syncNow]);

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

  // Load appointments and tasks for SmartBottomBar
  useEffect(() => {
    const loadAppointmentsAndTasks = () => {
      try {
        // Load appointments
        const savedAppointments = localStorage.getItem('baraka_appointments');
        if (savedAppointments) {
          const parsed = JSON.parse(savedAppointments);
          setAppointments(parsed.slice(0, 5));
        }

        // Load tasks
        const savedTasks = localStorage.getItem('baraka_tasks');
        if (savedTasks) {
          const parsed = JSON.parse(savedTasks);
          const today = new Date().toISOString().split('T')[0];
          const todayTasks = parsed.filter((t: any) => t.date === today);
          const remaining = todayTasks.filter((t: any) => !t.completed).length;
          const completed = todayTasks.filter((t: any) => t.completed).length;
          setTasksCount({ remaining, completed });
        }
      } catch (error) {
        console.error('Error loading appointments/tasks:', error);
      }
    };

    loadAppointmentsAndTasks();

    window.addEventListener('appointments-updated', loadAppointmentsAndTasks);
    window.addEventListener('tasks-updated', loadAppointmentsAndTasks);

    return () => {
      window.removeEventListener('appointments-updated', loadAppointmentsAndTasks);
      window.removeEventListener('tasks-updated', loadAppointmentsAndTasks);
    };
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
  // 'financial' -> finance
  // 'productivity' -> productivity
  // 'prayer' -> prayer
  // 'appointments' -> appointments
  // 'dashboard' -> dashboard
  // 'settings' -> settings
  const handleNavChange = (id: string) => {
    // Map SmartBottomBar IDs to actual tab IDs
    if (id === 'financial') {
      setActiveTab('finance');
    } else if (id === 'productivity') {
      setActiveTab('productivity');
    } else if (id === 'prayer') {
      setActiveTab('prayer');
    } else if (id === 'appointments') {
      setActiveTab('appointments');
    } else {
      setActiveTab(id);
    }
  };

  // Reverse mapping for SmartBottomBar active state
  const getActiveNavId = () => {
    if (activeTab === 'finance') return 'financial';
    if (activeTab === 'salary') return 'financial';
    return activeTab;
  };

  return (
    <>
      {/* PIN Lock Screen */}
      {pinEnabled && isLocked && <PinLock onUnlock={unlock} />}

      {/* PIN Setup Screen */}
      {showSetup && <PinLock isSetupMode onUnlock={() => { }} onSetupComplete={onSetupComplete} />}

      {/* Sidebar Navigation - Fixed on Right */}


      <div
        className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 islamic-pattern pb-16 lg:pb-0 relative"
      >        {/* Content Area - Padding right for sidebar */}
        <div className="w-full">

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">

            {/* Note: We removed TabsList from here. Controlled by BottomNavBar */}

            <div className="w-full">
              <TabsContent value="dashboard" className="animate-fade-in space-y-4 data-[state=active]:block">
                <SmartDashboard
                  onNavigateToTab={setActiveTab}
                  onOpenVoiceRecorder={() => setShowVoiceRecorder(true)}
                />
              </TabsContent>

              <TabsContent value="calendar" className="animate-fade-in data-[state=active]:block">
                <ErrorBoundary>
                  <Suspense fallback={<PageLoading message="جاري تحميل التقويم..." />}>
                    <CalendarSection />
                  </Suspense>
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="finance" className="animate-fade-in data-[state=active]:block">
                <ErrorBoundary>
                  <Suspense fallback={<PageLoading message="جاري تحميل الإدارة المالية..." />}>
                    <FinancialController />
                  </Suspense>
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="prayer" className="animate-fade-in data-[state=active]:block">
                <ErrorBoundary>
                  <Suspense fallback={<PageLoading message="جاري تحميل أوقات الصلاة..." />}>
                    <PrayerManager />
                  </Suspense>
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="productivity" className="animate-fade-in data-[state=active]:block">
                <ErrorBoundary>
                  <Suspense fallback={<PageLoading message="جاري تحميل الإنتاجية..." />}>
                    <LogisticsManager />
                  </Suspense>
                </ErrorBoundary>
              </TabsContent>


              <TabsContent value="settings" className="animate-fade-in data-[state=active]:block">
                <ErrorBoundary>
                  <Suspense fallback={<PageLoading message="جاري تحميل الإعدادات..." />}>
                    <SettingsPanel />
                  </Suspense>
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="appointments" className="animate-fade-in data-[state=active]:block">
                <AppointmentManager />
              </TabsContent>

              <TabsContent value="shopping" className="animate-fade-in data-[state=active]:block">
                <ShoppingList />
              </TabsContent>

              <TabsContent value="map" className="animate-fade-in data-[state=active]:block">
                <ErrorBoundary>
                  <Suspense fallback={<PageLoading message="جاري تحميل الخريطة..." />}>
                    <InteractiveMap />
                  </Suspense>
                </ErrorBoundary>
              </TabsContent>

              {/* NEW: Salary Manager Tab */}


            </div>
          </Tabs>
        </div>

        {/* Bottom Navigation removed - Using SideNavBar instead */}

        <NavSummaryDialogs
          type={activeSummary}
          onClose={() => setActiveSummary(null)}
        />

        {/* Voice Note Recorder */}
        <VoiceNoteRecorder
          isOpen={showVoiceRecorder}
          onClose={() => setShowVoiceRecorder(false)}
          onSaveToActivities={appendToActivitiesNote}
        />

        {/* Report Generator */}
        <ReportGenerator
          isOpen={showReportGenerator}
          onClose={() => setShowReportGenerator(false)}
        />

        {/* Notes Manager Removed */}

      </div>
    </>
  );
};


export default Index;