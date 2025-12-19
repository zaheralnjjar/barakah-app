import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Calculator,
  MapPin,
  Settings,
  LayoutDashboard,
  Clock,
  LogOut,
  Moon
} from 'lucide-react';

// Components
import FinancialController from '@/components/agents/FinancialController';
import LogisticsManager from '@/components/agents/LogisticsManager';
import InitializationWizard from '@/components/InitializationWizard';
import SmartDashboard from '@/components/SmartDashboard';
import SettingsPanel from '@/components/SettingsPanel';
import AuthForm from '@/components/AuthForm';
import LocationSaver from '@/components/LocationSaver';
import InteractiveMap from '@/components/InteractiveMap';
import AppointmentManager from '@/components/AppointmentManager';
import PrayerManager from '@/components/PrayerManager';
import ShoppingList from '@/components/ShoppingList';

const Index = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();

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

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "تم تسجيل الخروج", description: "إلى اللقاء" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 islamic-pattern pb-safe">
      <div className="container mx-auto px-4 py-6">

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full grid grid-cols-5 bg-white/50 backdrop-blur-sm p-1">
            <TabsTrigger value="dashboard" className="arabic-body flex md:flex-row flex-col items-center justify-center gap-1 md:gap-2 px-1">
              <LayoutDashboard className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-[10px] md:text-sm">الرئيسية</span>
            </TabsTrigger>
            <TabsTrigger value="finance" className="arabic-body flex md:flex-row flex-col items-center justify-center gap-1 md:gap-2 px-1">
              <Calculator className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-[10px] md:text-sm">المالية</span>
            </TabsTrigger>
            <TabsTrigger value="prayer" className="arabic-body flex md:flex-row flex-col items-center justify-center gap-1 md:gap-2 px-1">
              <Moon className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-[10px] md:text-sm">الصلاة</span>
            </TabsTrigger>
            <TabsTrigger value="productivity" className="arabic-body flex md:flex-row flex-col items-center justify-center gap-1 md:gap-2 px-1">
              <MapPin className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-[10px] md:text-sm">الإنتاجية</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="arabic-body flex md:flex-row flex-col items-center justify-center gap-1 md:gap-2 px-1">
              <Settings className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-[10px] md:text-sm">الإعدادات</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="animate-fade-in space-y-6">
            <SmartDashboard onNavigateToTab={setActiveTab} />

            {/* Split Section: Appointments (70%) & Shopping (30%) */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
              {/* 70% Width - Appointments & Reminders (First Section) */}
              <div className="lg:col-span-7 h-full">
                <AppointmentManager />
              </div>

              {/* 30% Width - Shopping List (On the Right/Side) */}
              <div className="lg:col-span-3 h-full">
                <ShoppingList />
              </div>
            </div>

            {/* Interactive Map (Bottom Section) */}
            <div className="w-full">
              <InteractiveMap />
            </div>
          </TabsContent>

          <TabsContent value="finance" className="animate-fade-in">
            <FinancialController />
          </TabsContent>

          <TabsContent value="prayer" className="animate-fade-in">
            <PrayerManager />
          </TabsContent>

          <TabsContent value="productivity" className="animate-fade-in">
            <LogisticsManager />
          </TabsContent>

          <TabsContent value="settings" className="animate-fade-in">
            <SettingsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;