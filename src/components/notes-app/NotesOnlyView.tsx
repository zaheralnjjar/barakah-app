import React, { useState, useEffect } from 'react';
import { UnifiedNotesLayout } from '@/components/notes-v2/UnifiedNotesLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const NotesOnlyView: React.FC = () => {
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const { toast } = useToast();

    // Check for session on mount
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            toast({ title: 'تم تسجيل الدخول بنجاح' });
        } catch (error: any) {
            toast({
                title: 'خطأ في تسجيل الدخول',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsLoggingIn(false);
        }
    };

    if (loading) {
        return <div className="h-screen w-full flex items-center justify-center bg-gray-50">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>;
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4" dir="rtl">
                <Card className="w-full max-w-md shadow-xl border-t-4 border-t-emerald-600">
                    <CardHeader className="text-center space-y-2">
                        <CardTitle className="text-2xl font-bold text-gray-800">ملاحظاتي</CardTitle>
                        <p className="text-sm text-gray-500">سجل الدخول للمزامنة مع نظام البركة</p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">البريد الإلكتروني</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="text-left"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">كلمة المرور</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-700"
                                disabled={isLoggingIn}
                            >
                                {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                                تسجيل الدخول
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Authenticated: Render unified layout
    return (
        <UnifiedNotesLayout isStandalone={true} />
    );
};

export default NotesOnlyView;
