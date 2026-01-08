import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, StickyNote, Calendar, Mic, Settings, LogOut, RefreshCw, User, Mail, Lock, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NewMuslimsManager from '@/components/NewMuslims/NewMuslimsManager';
import StudentView from '@/components/NewMuslims/StudentView';
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
    const [userRole, setUserRole] = useState<'supervisor' | 'student'>('supervisor');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Hooks
    const { addNote } = useHidayaNotes();

    // Long press handling for sync and voice notes
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const notesLongPressTimer = useRef<NodeJS.Timeout | null>(null);

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

    // List of approved supervisor emails - only these can access supervisor mode
    const APPROVED_SUPERVISORS = [
        'admin@hidaya.com',
        'zaher@hidaya.com',
        // Add more approved supervisor emails here
    ];

    const isSupervisorApproved = (email: string) => {
        return APPROVED_SUPERVISORS.some(approved =>
            email.toLowerCase() === approved.toLowerCase()
        );
    };

    const handleLogin = async () => {
        if (!email || !password) {
            toast({ title: 'خطأ', description: 'يرجى إدخال البريد وكلمة المرور', variant: 'destructive' });
            return;
        }
        setIsLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        setIsLoading(false);
        if (error) {
            toast({ title: 'فشل تسجيل الدخول', description: error.message, variant: 'destructive' });
        } else {
            // If trying to login as supervisor but not approved, force student mode
            if (userRole === 'supervisor' && !isSupervisorApproved(email)) {
                setUserRole('student');
                toast({
                    title: language === 'ar' ? 'تنبيه' : 'Aviso',
                    description: language === 'ar'
                        ? 'حسابك غير مصرح كمشرف. تم تحويلك لوضع الطالب.'
                        : 'Tu cuenta no está autorizada como supervisor. Se cambió a modo estudiante.',
                    variant: 'destructive'
                });
            } else {
                toast({ title: 'تم تسجيل الدخول بنجاح', description: 'مرحباً بك!' });
            }
            setEmail('');
            setPassword('');
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        setIsLoading(false);
        if (error) {
            toast({
                title: language === 'ar' ? 'فشل تسجيل الدخول' : 'Error de inicio de sesión',
                description: error.message,
                variant: 'destructive'
            });
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

    // Long press on notes tab to open voice recorder
    const handleNotesLongPressStart = () => {
        notesLongPressTimer.current = setTimeout(() => {
            setIsVoiceRecorderOpen(true);
        }, 500); // 500ms long press for voice
    };

    const handleNotesLongPressEnd = () => {
        if (notesLongPressTimer.current) {
            clearTimeout(notesLongPressTimer.current);
            notesLongPressTimer.current = null;
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
            <div className={`min-h-screen bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center p-4`} dir={isRTL ? 'rtl' : 'ltr'}>
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        {/* Language Toggle */}
                        <div className="flex justify-center gap-2 mb-4">
                            <Button
                                size="sm"
                                variant={language === 'ar' ? 'default' : 'outline'}
                                onClick={() => changeLanguage('ar')}
                                className={language === 'ar' ? 'bg-emerald-600' : ''}
                            >
                                العربية
                            </Button>
                            <Button
                                size="sm"
                                variant={language === 'es' ? 'default' : 'outline'}
                                onClick={() => changeLanguage('es')}
                                className={language === 'es' ? 'bg-emerald-600' : ''}
                            >
                                Español
                            </Button>
                        </div>
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-10 h-10 text-white" />
                        </div>
                        <CardTitle className="text-2xl">{t('hidaya')}</CardTitle>
                        <p className="text-gray-500 text-sm">{t('app_subtitle')}</p>

                        {/* Role Selection */}
                        <div className="flex justify-center gap-2 mt-4">
                            <Button
                                size="sm"
                                variant={userRole === 'supervisor' ? 'default' : 'outline'}
                                onClick={() => setUserRole('supervisor')}
                                className={userRole === 'supervisor' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                            >
                                👨‍🏫 {t('supervisor')}
                            </Button>
                            <Button
                                size="sm"
                                variant={userRole === 'student' ? 'default' : 'outline'}
                                onClick={() => setUserRole('student')}
                                className={userRole === 'student' ? 'bg-green-600 hover:bg-green-700' : ''}
                            >
                                📚 {t('student_role')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {authMode === 'login' && (
                            <div className="space-y-4">
                                <div className="relative">
                                    <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 w-4 h-4 text-gray-400`} />
                                    <Input
                                        type="email"
                                        placeholder={t('email')}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={isRTL ? 'pr-10' : 'pl-10'}
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 w-4 h-4 text-gray-400`} />
                                    <Input
                                        type="password"
                                        placeholder={t('password')}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={isRTL ? 'pr-10' : 'pl-10'}
                                    />
                                </div>
                                <Button
                                    onClick={handleLogin}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                                    disabled={isLoading}
                                >
                                    {isLoading ? t('loading') : t('login')}
                                </Button>

                                {/* Divider */}
                                <div className="relative my-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-gray-500">
                                            {language === 'ar' ? 'أو' : 'o'}
                                        </span>
                                    </div>
                                </div>

                                {/* Google Sign-In */}
                                <Button
                                    variant="outline"
                                    onClick={handleGoogleSignIn}
                                    className="w-full gap-2"
                                    disabled={isLoading}
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    {language === 'ar' ? 'تسجيل بـ Google' : 'Iniciar con Google'}
                                </Button>

                                <div className="flex justify-between text-sm">
                                    {/* Only supervisors can create new accounts */}
                                    {userRole === 'supervisor' && (
                                        <button
                                            onClick={() => setAuthMode('signup')}
                                            className="text-emerald-600 hover:underline"
                                        >
                                            {t('create_account')}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setAuthMode('reset')}
                                        className="text-gray-500 hover:underline"
                                    >
                                        {t('forgot_password')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {authMode === 'signup' && (
                            <div className="space-y-4">
                                <div className="relative">
                                    <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 w-4 h-4 text-gray-400`} />
                                    <Input
                                        type="email"
                                        placeholder={t('email')}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={isRTL ? 'pr-10' : 'pl-10'}
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 w-4 h-4 text-gray-400`} />
                                    <Input
                                        type="password"
                                        placeholder={t('password')}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={isRTL ? 'pr-10' : 'pl-10'}
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 w-4 h-4 text-gray-400`} />
                                    <Input
                                        type="password"
                                        placeholder={t('confirm_password')}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={isRTL ? 'pr-10' : 'pl-10'}
                                    />
                                </div>
                                <Button
                                    onClick={handleSignup}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                                    disabled={isLoading}
                                >
                                    {isLoading ? t('loading') : t('signup')}
                                </Button>
                                <button
                                    onClick={() => setAuthMode('login')}
                                    className="w-full text-center text-sm text-emerald-600 hover:underline"
                                >
                                    {t('back_to_login')}
                                </button>
                            </div>
                        )}

                        {authMode === 'reset' && (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600 text-center">
                                    {t('reset_password')}
                                </p>
                                <div className="relative">
                                    <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 w-4 h-4 text-gray-400`} />
                                    <Input
                                        type="email"
                                        placeholder={t('email')}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={isRTL ? 'pr-10' : 'pl-10'}
                                    />
                                </div>
                                <Button
                                    onClick={handleResetPassword}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                                    disabled={isLoading}
                                >
                                    {isLoading ? t('loading') : t('send_reset_link')}
                                </Button>
                                <button
                                    onClick={() => setAuthMode('login')}
                                    className="w-full text-center text-sm text-emerald-600 hover:underline"
                                >
                                    {t('back_to_login')}
                                </button>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Toaster />
            </div>
        );
    }

    // Show StudentView for students
    if (userRole === 'student') {
        return (
            <StudentView
                userEmail={user.email}
                onLogout={async () => {
                    await supabase.auth.signOut();
                    setUserRole('supervisor'); // Reset to default
                }}
            />
        );
    }

    // Supervisor view - full access
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
                                        اضغط باستمرار للمزامنة السريعة
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
                        onTouchStart={handleNotesLongPressStart}
                        onTouchEnd={handleNotesLongPressEnd}
                        onMouseDown={handleNotesLongPressStart}
                        onMouseUp={handleNotesLongPressEnd}
                        onMouseLeave={handleNotesLongPressEnd}
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


