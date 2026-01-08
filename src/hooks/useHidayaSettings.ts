import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export type MessageTemplates = {
    welcome: string;
    reminder: string;
};

const DEFAULT_TEMPLATES: MessageTemplates = {
    welcome: "السلام عليكم {name}، نرحب بك في مركز هداية...",
    reminder: "السلام عليكم {name}، نود تذكيرك بموعد الدرس..."
};

const STORAGE_KEY = 'hidaya_templates';

export const useHidayaSettings = () => {
    const { toast } = useToast();
    const [templates, setTemplates] = useState<MessageTemplates>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : DEFAULT_TEMPLATES;
    });

    // Load from Supabase on mount
    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase.from('message_templates')
                .select('*')
                .eq('user_id', user.id);

            if (data && data.length > 0) {
                const newTpls = { ...DEFAULT_TEMPLATES };
                data.forEach((row: any) => {
                    if (row.category === 'welcome') newTpls.welcome = row.content;
                    if (row.category === 'reminder') newTpls.reminder = row.content;
                });
                setTemplates(newTpls);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newTpls));
            }
        };
        load();
    }, []);

    // Listen for local updates
    useEffect(() => {
        const handleUpdate = () => {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) setTemplates(JSON.parse(stored));
        };
        window.addEventListener('hidaya-templates-updated', handleUpdate);
        return () => window.removeEventListener('hidaya-templates-updated', handleUpdate);
    }, []);

    const saveTemplates = async (newTemplates: MessageTemplates) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Optimistic update
            setTemplates(newTemplates);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newTemplates));
            window.dispatchEvent(new Event('hidaya-templates-updated'));

            // Persist to Supabase
            const tpls = [
                { user_id: user.id, category: 'welcome', content: newTemplates.welcome },
                { user_id: user.id, category: 'reminder', content: newTemplates.reminder }
            ];

            for (const t of tpls) {
                await supabase.from('message_templates')
                    .upsert(t, { onConflict: 'user_id,category' });
            }

            toast({ title: "تم حفظ الإعدادات", description: "تم تحديث قوالب الرسائل بنجاح" });
        } catch (e) {
            console.error("Error saving templates", e);
            toast({ title: "خطأ", description: "فشل حفظ الإعدادات", variant: "destructive" });
        }
    };

    const clearAllData = async () => {
        try {
            if (!confirm('هل انت متأكد من حذف جميع بيانات الطلاب؟ هذا الإجراء لا يمكن التراجع عنه!')) return;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Delete from Supabase tables
            // Note: Cascade should handle related tables if configured, otherwise delete manually
            await supabase.from('newmuslims_students').delete().eq('user_id', user.id);
            await supabase.from('hidaya_notes').delete().eq('user_id', user.id);
            await supabase.from('hidaya_appointments').delete().eq('user_id', user.id);

            // Trigger refresh
            window.dispatchEvent(new Event('hidaya-data-cleared'));
            toast({ title: "تم الحذف", description: "تم مسح جميع البيانات بنجاح" });
        } catch (e) {
            console.error("Error clearing data", e);
            toast({ title: "خطأ", description: "فشل حذف البيانات", variant: "destructive" });
        }
    };

    return {
        templates,
        saveTemplates,
        clearAllData
    };
};
