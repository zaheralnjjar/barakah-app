
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ArchiveSection = 'tasks' | 'appointments' | 'finance' | 'habits' | 'shopping' | 'notes';

interface ArchiveData {
    id: string;
    created_at: string;
    label: string;
    sections: string[];
    content: any;
}

export const useArchiver = () => {
    const { toast } = useToast();
    const [isArchiving, setIsArchiving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [archives, setArchives] = useState<ArchiveData[]>([]);

    // جلب قائمة الأرشيفات السابقة
    const fetchArchives = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('archives')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setArchives(data || []);
        } catch (error) {
            console.error('Error fetching archives:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // الدالة الرئيسية للأرشفة
    const archiveAndReset = async (sections: ArchiveSection[], label: string = '') => {
        if (sections.length === 0) {
            toast({ title: 'تنبيه', description: 'يرجى اختيار قسم واحد على الأقل للأرشفة', variant: 'destructive' });
            return false;
        }

        setIsArchiving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not found');

            const archiveContent: any = {};

            // 1. تجميع البيانات (Snapshot)
            if (sections.includes('tasks')) {
                const { data } = await supabase.from('tasks').select('*').eq('user_id', user.id);
                archiveContent.tasks = data;
            }
            if (sections.includes('appointments')) {
                const { data } = await supabase.from('appointments').select('*').eq('user_id', user.id);
                archiveContent.appointments = data;
            }
            if (sections.includes('finance')) {
                const { data } = await supabase.from('finance_settings').select('*').eq('user_id', user.id);
                archiveContent.finance = data;
                // جلب المعاملات (إذا كانت في جدول منفصل، هنا نفترض أنها مدمجة أو سنؤرشف الإعدادات)
                // في تطبيقك يبدو أن المعاملات داخل حقول JSON، لذا سيتم حفظها مع الـ Settings
            }
            if (sections.includes('habits')) {
                const { data } = await supabase.from('habits').select('*').eq('user_id', user.id);
                archiveContent.habits = data;
            }
            if (sections.includes('shopping')) {
                const { data } = await supabase.from('shopping_list').select('*').eq('user_id', user.id);
                archiveContent.shopping = data;
            }
            if (sections.includes('notes')) {
                const { data } = await supabase.from('productivity_data_2025_12_18_18_42').select('notes').eq('user_id', user.id);
                archiveContent.notes = data;
            }

            // 2. حفظ الأرشيف في جدول archives
            const finalLabel = label || `أرشيف ${new Date().toLocaleDateString('ar')}`;
            const { error: archiveError } = await supabase
                .from('archives')
                .insert({
                    user_id: user.id,
                    label: finalLabel,
                    sections: sections,
                    content: archiveContent
                });

            if (archiveError) throw archiveError;

            // 3. تصفير البيانات الحالية (Reset)
            // ملاحظة: نستخدم delete بحذر
            if (sections.includes('tasks')) {
                await supabase.from('tasks').delete().eq('user_id', user.id);
            }
            if (sections.includes('appointments')) {
                // نحذف المواعيد القديمة أو كلها حسب الرغبة، هنا سنحذف الكل لبدء صفحة جديدة
                await supabase.from('appointments').delete().eq('user_id', user.id);
            }
            if (sections.includes('shopping')) {
                await supabase.from('shopping_list').delete().eq('user_id', user.id);
            }
            if (sections.includes('habits')) {
                // للعادات، قد نريد تصفير العدادات فقط، أو حذف العادة وبنائها من جديد
                // الخيار هنا: حذف العادات للبدء من جديد
                await supabase.from('habits').delete().eq('user_id', user.id);
            }
            if (sections.includes('finance')) {
                // للمالية، لا نحذف السجل، بل نصفر القيم
                await supabase.from('finance_settings').update({
                    current_balance_ars: 0,
                    current_balance_usd: 0,
                    total_debt: 0,
                    pending_expenses: [] // تصفير قائمة المصروفات
                }).eq('user_id', user.id);
            }
            if (sections.includes('notes')) {
                await supabase.from('productivity_data_2025_12_18_18_42').update({
                    notes: []
                }).eq('user_id', user.id);
            }

            toast({
                title: 'تمت الأرشفة بنجاح',
                description: `تم حفظ ${sections.length} أقسام وتصفير البيانات المحددة.`,
                className: "bg-green-50 border-green-200"
            });

            await fetchArchives();
            return true;

        } catch (error: any) {
            console.error('Archiving error:', error);
            toast({
                title: 'خطأ في الأرشفة',
                description: error.message,
                variant: 'destructive'
            });
            return false;
        } finally {
            setIsArchiving(false);
        }
    };

    // استرجاع أرشيف
    const restoreArchive = async (archiveId: string) => {
        setIsArchiving(true); // Reuse loading state
        try {
            const { data: archive, error } = await supabase
                .from('archives')
                .select('*')
                .eq('id', archiveId)
                .single();

            if (error) throw error;
            if (!archive) throw new Error('الأرشيف غير موجود');

            const { content, sections } = archive;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not found');

            // Restore logic
            if (content.tasks && content.tasks.length > 0) {
                // Clear current tasks first to avoid duplicates/conflicts
                await supabase.from('tasks').delete().eq('user_id', user.id);
                // Insert archived tasks (remove id to create new ones, or keep to restore exact state)
                // We keep IDs to maintain relationships if any
                await supabase.from('tasks').upsert(content.tasks);
            }

            if (content.appointments && content.appointments.length > 0) {
                await supabase.from('appointments').delete().eq('user_id', user.id);
                await supabase.from('appointments').upsert(content.appointments);
            }

            if (content.shopping && content.shopping.length > 0) {
                await supabase.from('shopping_list').delete().eq('user_id', user.id);
                await supabase.from('shopping_list').upsert(content.shopping);
            }

            if (content.habits && content.habits.length > 0) {
                await supabase.from('habits').delete().eq('user_id', user.id);
                await supabase.from('habits').upsert(content.habits);
            }

            if (content.finance && content.finance.length > 0) {
                // Assuming finance settings is one row per user
                const financeData = content.finance[0];
                if (financeData) {
                    await supabase.from('finance_settings').upsert({
                        ...financeData,
                        user_id: user.id
                    });
                }
            }

            if (content.notes && content.notes.length > 0) {
                const notesData = content.notes[0]; // { notes: [...] }
                await supabase.from('productivity_data_2025_12_18_18_42').update({
                    notes: notesData.notes || []
                }).eq('user_id', user.id);
            }

            toast({ title: 'تمت الاستعادة بنجاح', description: 'تم استرجاع البيانات من الأرشيف' });
            setTimeout(() => window.location.reload(), 1500); // Reload to reflect changes

        } catch (error: any) {
            console.error('Restore error:', error);
            toast({ title: 'خطأ في الاستعادة', description: error.message, variant: 'destructive' });
        } finally {
            setIsArchiving(false);
        }
    };

    return {
        archives,
        isArchiving,
        isLoading,
        fetchArchives,
        archiveAndReset,
        restoreArchive
    };
};
