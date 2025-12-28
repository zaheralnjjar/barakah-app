import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSecureNotes = () => {
    const { toast } = useToast();
    const [isVerifying, setIsVerifying] = useState(false);

    const setPassword = async (password: string) => {
        try {
            const { data, error } = await supabase.rpc('set_secure_notes_password', {
                p_password: password
            });

            if (error) throw error;
            if (data) {
                toast({ title: 'تم تعيين كلمة المرور بنجاح ✅' });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error setting password:', error);
            toast({ title: 'فشل تعيين كلمة المرور', variant: 'destructive' });
            return false;
        }
    };

    const verifyPassword = async (password: string) => {
        setIsVerifying(true);
        try {
            const { data, error } = await supabase.rpc('verify_secure_notes_password', {
                p_password: password
            });

            if (error) throw error;
            return data as boolean;
        } catch (error) {
            console.error('Error verifying password:', error);
            return false;
        } finally {
            setIsVerifying(false);
        }
    };

    const hasPassword = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            const { data, error } = await supabase
                .from('secure_notes')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) throw error;
            return !!data;
        } catch (error) {
            console.error('Error checking for password:', error);
            return false;
        }
    };

    return {
        setPassword,
        verifyPassword,
        hasPassword,
        isVerifying
    };
};
