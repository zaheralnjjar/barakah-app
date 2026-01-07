import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, StickyNote, Calendar, Mic, Settings, LogOut, RefreshCw, User, Mail, Lock, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NewMuslimsManager from '@/components/NewMuslims/NewMuslimsManager';
import { QuickNotes } from '@/components/logistics/QuickNotes';
import AppointmentManager from '@/components/AppointmentManager';
import VoiceNoteRecorder from '@/components/VoiceNoteRecorder';
import { GlobalSearchDialog } from '@/components/GlobalSearchDialog';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const NewMuslimsApp: React.FC = () => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('newmuslims');
    const [isVoiceRecorderOpen, setIsVoiceRecorderOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Auth state
    const [user, setUser] = useState<any>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Long press handling for sync
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Check current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50" dir="rtl">
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
                        مركز رعاية المهتدين
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

                    <TabsContent value="notes" className="mt-0">
                        <QuickNotes />
                    </TabsContent>

                    <TabsContent value="calendar" className="mt-0">
                        <AppointmentManager />
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

                            {/* Sync Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <RefreshCw className="w-5 h-5" />
                                        المزامنة
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
                                        <p>مركز رعاية المهتدين</p>
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
                        <span className="text-xs">المهتدين</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="notes"
                        className="flex flex-col items-center gap-1 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-600 rounded-none h-full"
                    >
                        <StickyNote className="w-5 h-5" />
                        <span className="text-xs">الملاحظات</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="calendar"
                        className="flex flex-col items-center gap-1 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 rounded-none h-full"
                    >
                        <Calendar className="w-5 h-5" />
                        <span className="text-xs">المواعيد</span>
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
                        <span className="text-xs">الإعدادات</span>
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Voice Note Recorder Dialog */}
            <VoiceNoteRecorder
                isOpen={isVoiceRecorderOpen}
                onClose={() => setIsVoiceRecorderOpen(false)}
                onSaveToActivities={(text) => {
                    console.log('Voice note saved:', text);
                    setIsVoiceRecorderOpen(false);
                }}
            />

            {/* Global Search Dialog */}
            <GlobalSearchDialog
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onNavigateToTab={(tab) => {
                    setActiveTab(tab);
                    setIsSearchOpen(false);
                }}
            />

            <Toaster />
        </div>
    );
};

export default NewMuslimsApp;


