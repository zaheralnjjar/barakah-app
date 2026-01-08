import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, StickyNote, Calendar, Mic, Settings, LogOut, RefreshCw, User, Mail, Lock, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NewMuslimsManager from '@/components/NewMuslims/NewMuslimsManager';
import { HidayaNotes } from '@/components/logistics/HidayaNotes';
import HidayaAppointmentManager from '@/components/HidayaAppointmentManager';
import VoiceNoteRecorder from '@/components/VoiceNoteRecorder';
import { HidayaGlobalSearchDialog } from '@/components/HidayaGlobalSearchDialog';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useHidayaNotes } from '@/hooks/useHidayaNotes';
import { useHidayaTranslation } from '@/hooks/useHidayaTranslation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { HidayaSettings } from '@/components/NewMuslims/HidayaSettings';
const NewMuslimsApp: React.FC = () => {
    const { toast } = useToast();
    const { t, language, changeLanguage, isRTL } = useHidayaTranslation();
    const [activeTab, setActiveTab] = useState('newmuslims');
    const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Auth state
    const [user, setUser] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Hooks
    const { addNote } = useHidayaNotes();

    // Long press handling for sync
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Check current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setAuthLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            toast({ title: 'خطأ', description: 'يرجى إدخال البريد وكلمة المرور', variant: 'destructive' });
            return;
        }
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setIsLoading(false);
        if (error) {
            toast({ title: 'فشل تسجيل الدخول', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'تم تسجيل الدخول بنجاح', description: 'مرحباً بك!' });
            setEmail('');
            setPassword('');
        }
    };

    const handleSignup = async () => {
        if (!email || !password) {
            toast({ title: 'خطأ', description: 'يرجى إدخال البريد وكلمة المرور', variant: 'destructive' });
            return;
        }
        if (password !== confirmPassword) {
            toast({ title: 'خطأ', description: 'كلمات المرور غير متطابقة', variant: 'destructive' });
            return;
        }
        if (password.length < 6) {
            toast({ title: 'خطأ', description: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', variant: 'destructive' });
            return;
        }
        setIsLoading(true);
        const { error } = await supabase.auth.signUp({ email, password });
        setIsLoading(false);
        if (error) {
            toast({ title: 'فشل إنشاء الحساب', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'تم إنشاء الحساب بنجاح', description: 'تحقق من بريدك الإلكتروني لتفعيل الحساب' });
            setAuthMode('login');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
        }
    };

    const handleResetPassword = async () => {
        if (!email) {
            toast({ title: 'خطأ', description: 'يرجى إدخال البريد الإلكتروني', variant: 'destructive' });
            return;
        }
        setIsLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        setIsLoading(false);
        if (error) {
            toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'تم الإرسال', description: 'تحقق من بريدك الإلكتروني لإعادة تعيين كلمة المرور' });
            setAuthMode('login');
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        toast({ title: 'تم تسجيل الخروج' });
    };

    const handleSync = async () => {
        setIsSyncing(true);
        toast({ title: '⏳ جاري المزامنة...' });

        // Trigger a page reload to force sync
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsSyncing(false);
        toast({ title: '✅ تمت المزامنة بنجاح!' });
    };

    const handleSettingsLongPressStart = () => {
        longPressTimer.current = setTimeout(() => {
            handleSync();
        }, 1000); // 1 second long press
    };

    const handleSettingsLongPressEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    // Loading state
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center" dir="rtl">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-emerald-600">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    // Auth Gate - show login/signup/reset if not logged in
    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center p-4" dir="rtl">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-10 h-10 text-white" />
                        </div>
                        <CardTitle className="text-2xl">هداية</CardTitle>
                        <p className="text-gray-500 text-sm">إدارة ومتابعة الطلاب الجدد</p>
                    </CardHeader>
                    <CardContent>
                        {authMode === 'login' && (
                            <div className="space-y-4">
                                <div className="relative">
                                    <Mail className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                                    <Input
                                        type="email"
                                        placeholder="البريد الإلكتروني"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pr-10"
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                                    <Input
                                        type="password"
                                        placeholder="كلمة المرور"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pr-10"
                                    />
                                </div>
                                <Button
                                    onClick={handleLogin}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'جاري التحميل...' : 'تسجيل الدخول'}
                                </Button>
                                <div className="flex justify-between text-sm">
                                    <button
                                        onClick={() => setAuthMode('signup')}
                                        className="text-emerald-600 hover:underline"
                                    >
                                        إنشاء حساب جديد
                                    </button>
                                    <button
                                        onClick={() => setAuthMode('reset')}
                                        className="text-gray-500 hover:underline"
                                    >
                                        نسيت كلمة المرور؟
                                    </button>
                                </div>
                            </div>
                        )}

                        {authMode === 'signup' && (
                            <div className="space-y-4">
                                <div className="relative">
                                    <Mail className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                                    <Input
                                        type="email"
                                        placeholder="البريد الإلكتروني"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pr-10"
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                                    <Input
                                        type="password"
                                        placeholder="كلمة المرور"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pr-10"
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                                    <Input
                                        type="password"
                                        placeholder="تأكيد كلمة المرور"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pr-10"
                                    />
                                </div>
                                <Button
                                    onClick={handleSignup}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'جاري الإنشاء...' : 'إنشاء حساب'}
                                </Button>
                                <button
                                    onClick={() => setAuthMode('login')}
                                    className="w-full text-center text-sm text-emerald-600 hover:underline"
                                >
                                    لديك حساب؟ تسجيل الدخول
                                </button>
                            </div>
                        )}

                        {authMode === 'reset' && (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600 text-center">
                                    أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور
                                </p>
                                <div className="relative">
                                    <Mail className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                                    <Input
                                        type="email"
                                        placeholder="البريد الإلكتروني"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pr-10"
                                    />
                                </div>
                                <Button
                                    onClick={handleResetPassword}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
                                </Button>
                                <button
                                    onClick={() => setAuthMode('login')}
                                    className="w-full text-center text-sm text-emerald-600 hover:underline"
                                >
                                    العودة لتسجيل الدخول
                                </button>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Toaster />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Header */}
            <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 shadow-lg">
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSearchOpen(true)}
                        className="text-white hover:bg-white/20"
                    >
                        <Search className="w-5 h-5" />
                    </Button>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Users className="w-6 h-6" />
                        {t('hidaya')}
                    </h1>
                    <div className="w-10" /> {/* Spacer for balance */}
                </div>
                <p className="text-center text-emerald-100 text-sm mt-1">
                    إدارة ومتابعة الطلاب الجدد
                </p>
            </header>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="p-4 pb-24 space-y-4">
                    <TabsContent value="newmuslims" className="mt-0">
                        <NewMuslimsManager />
                    </TabsContent>

                    <TabsContent value="notes" className="arabic-body">
                        <HidayaNotes />

                    </TabsContent>

                    <TabsContent value="calendar" className="mt-0">
                        <HidayaAppointmentManager />
                    </TabsContent>

                    <TabsContent value="settings" className="mt-0">
                        <div className="space-y-4">
                            {/* User Info / Login Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="w-5 h-5" />
                                        {user ? 'معلومات الحساب' : 'تسجيل الدخول'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {user ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                                                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                                                    <User className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{user.email}</p>
                                                    <p className="text-sm text-gray-500">مسجل الدخول</p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={handleLogout}
                                                variant="outline"
                                                className="w-full gap-2 text-red-600 border-red-200"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                تسجيل الخروج
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="relative">
                                                <Mail className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                                                <Input
                                                    type="email"
                                                    placeholder="البريد الإلكتروني"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="pr-10"
                                                />
                                            </div>
                                            <div className="relative">
                                                <Lock className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                                                <Input
                                                    type="password"
                                                    placeholder="كلمة المرور"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="pr-10"
                                                />
                                            </div>
                                            <Button
                                                onClick={handleLogin}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700"
                                                disabled={isLoading}
                                            >
                                                {isLoading ? 'جاري التحميل...' : 'تسجيل الدخول'}
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Hidaya Settings (Templates & Data) */}
                            <HidayaSettings />

                            {/* Sync Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <RefreshCw className="w-5 h-5" />
                                        {t('sync')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Button
                                        onClick={handleSync}
                                        disabled={isSyncing}
                                        className="w-full gap-2"
                                        variant="outline"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                                        {isSyncing ? 'جاري المزامنة...' : 'مزامنة البيانات الآن'}
                                    </Button>
                                    <p className="text-xs text-gray-500 text-center mt-2">
                                        أو اضغط باستمرار على أيقونة الإعدادات
                                    </p>
                                </CardContent>
                            </Card>

                            {/* App Info */}
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-center text-gray-500 text-sm">
                                        <p>هداية</p>
                                        <p>الإصدار 1.0.0</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </div>

                {/* Floating Voice Record Button */}
                <Button
                    onClick={() => setIsVoiceRecorderOpen(true)}
                    className="fixed bottom-20 left-4 w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 shadow-lg z-50 flex items-center justify-center"
                    size="icon"
                >
                    <Mic className="w-6 h-6 text-white" />
                </Button>

                {/* Bottom Navigation */}
                <TabsList className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t shadow-lg rounded-none grid grid-cols-4 gap-0">
                    <TabsTrigger
                        value="newmuslims"
                        className="flex flex-col items-center gap-1 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600 rounded-none h-full"
                    >
                        <Users className="w-5 h-5" />
                        <span className="text-xs">{t('hidaya')}</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="notes"
                        className="flex flex-col items-center gap-1 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-600 rounded-none h-full"
                    >
                        <StickyNote className="w-5 h-5" />
                        <span className="text-xs">{t('notes')}</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="calendar"
                        className="flex flex-col items-center gap-1 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 rounded-none h-full"
                    >
                        <Calendar className="w-5 h-5" />
                        <span className="text-xs">{t('appointments')}</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="settings"
                        className="flex flex-col items-center gap-1 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-700 rounded-none h-full"
                        onTouchStart={handleSettingsLongPressStart}
                        onTouchEnd={handleSettingsLongPressEnd}
                        onMouseDown={handleSettingsLongPressStart}
                        onMouseUp={handleSettingsLongPressEnd}
                        onMouseLeave={handleSettingsLongPressEnd}
                    >
                        <Settings className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span className="text-xs">{t('settings')}</span>
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Voice Note Recorder Dialog */}
            <VoiceNoteRecorder
                isOpen={isVoiceRecorderOpen}
                onClose={() => setIsVoiceRecorderOpen(false)}
                onSaveToActivities={(text) => {
                    addNote(text, 'voice');
                    setIsVoiceRecorderOpen(false);
                }}
            />

            {/* Global Search Dialog */}
            <HidayaGlobalSearchDialog
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onNavigateToTab={activeTab => setActiveTab(activeTab)}
                onOpenNewMuslims={() => setActiveTab('newmuslims')}
            />

            <Toaster />
        </div>
    );
};

export default NewMuslimsApp;


