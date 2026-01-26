import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useFinance } from '@/hooks/useFinance';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { useNavigate } from 'react-router-dom';

export const useShortcutExecution = (props: {
    onOpenAddDialog: (type: any) => void,
    onOpenVoiceRecorder?: () => void,
    onOpenTimer?: () => void,
    onOpenNewMuslims?: () => void,
    onNavigateToTab?: (tabId: string) => void,
}) => {
    const { toast } = useToast();
    const { nextPrayer, timeUntilNext, prayerTimes } = usePrayerTimes();
    const { financeData, dailyLimit } = useFinance();
    const { tasks } = useTasks();
    const { appointments } = useAppointments();
    const navigate = useNavigate();

    const [shortcutResult, setShortcutResult] = useState<{ title: string; content: string } | null>(null);

    const executeShortcut = async (actionId: string) => {
        switch (actionId) {
            case 'show_new_muslims':
                if (props.onOpenNewMuslims) props.onOpenNewMuslims();
                else if (props.onNavigateToTab) props.onNavigateToTab('daura');
                else navigate('/daura');
                break;

            case 'show_time':
                const now = new Date();
                const hijri = now.toLocaleDateString('ar-SA-u-ca-islamic', { dateStyle: 'full' });
                setShortcutResult({
                    title: '🕐 الوقت والتاريخ',
                    content: `الوقت: ${now.toLocaleTimeString('ar-SA')}\n\nالتاريخ الميلادي:\n${now.toLocaleDateString('ar-SA', { dateStyle: 'full' })}\n\nالتاريخ الهجري:\n${hijri}`
                });
                break;

            case 'show_balance':
                setShortcutResult({
                    title: '💰 الرصيد المالي',
                    content: `الرصيد في المحفظة: ${financeData?.current_balance_ars?.toLocaleString()} ARS (${financeData?.current_balance_usd?.toLocaleString()} USD)\n\nالمتبقي لليوم: ${dailyLimit?.toLocaleString()} ARS`
                });
                break;

            case 'show_dollar':
                setShortcutResult({ title: '💵 سعر الدولار', content: 'جاري التحميل...' });
                try {
                    const [off, blu] = await Promise.all([
                        fetch('https://dolarapi.com/v1/dolares/oficial').then(r => r.json()),
                        fetch('https://dolarapi.com/v1/dolares/blue').then(r => r.json())
                    ]);
                    setShortcutResult({
                        title: '💵 سعر الدولار',
                        content: `🏦 الرسمي: شراء ${off.compra} | بيع ${off.venta}\n\n💵 الأزرق: شراء ${blu.compra} | بيع ${blu.venta}\n\nالمعدل المعتمد في التطبيق: ${financeData?.exchange_rate || 1200} ARS`
                    });
                } catch {
                    setShortcutResult({ title: '💵 سعر الدولار', content: 'فشل جلب البيانات. السعر التقريبي: 1200 ARS' });
                }
                break;

            case 'show_next_prayer':
                const prayer = prayerTimes.find((p: any) => p.isNext);
                setShortcutResult({
                    title: '🕌 الصلاة القادمة',
                    content: prayer
                        ? `${prayer.name} في ${prayer.time}\nمتبقي: ${timeUntilNext}`
                        : 'سيتم التحديث قريباً'
                });
                break;

            case 'show_today_tasks':
                const todayStr = new Date().toISOString().split('T')[0];
                const activeTasks = tasks.filter(t => t.deadline === todayStr && t.progress < 100);
                setShortcutResult({
                    title: '📋 مهام اليوم',
                    content: activeTasks.length > 0
                        ? `لديك ${activeTasks.length} مهام متبقية:\n\n${activeTasks.map(t => `• ${t.title}`).join('\n')}`
                        : 'لا توجد مهام متبقية لليوم! 🎉'
                });
                break;

            case 'show_appointments':
                const soon = appointments.filter(a => new Date(a.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 3);
                setShortcutResult({
                    title: '📅 المواعيد القادمة',
                    content: soon.length > 0
                        ? soon.map(a => `• ${a.title}\n  ${a.date} - ${a.time || ''}`).join('\n\n')
                        : 'لا توجد مواعيد قادمة مسجلة'
                });
                break;

            case 'add_expense': props.onOpenAddDialog('expense'); break;
            case 'add_task': props.onOpenAddDialog('task'); break;
            case 'add_note': props.onOpenVoiceRecorder?.(); break;
            case 'add_appointment': props.onOpenAddDialog('appointment'); break;
            case 'start_pomodoro': props.onOpenTimer?.(); break;

            case 'remind_5min':
                toast({ title: '⏰ تذكير', description: 'سيتم تنبيهك بعد 5 دقائق' });
                setTimeout(() => {
                    new Notification('تذكير البركة', { body: 'انتهت الـ 5 دقائق!' });
                    toast({ title: '🔔 انتهى الوقت', description: 'مضت 5 دقائق' });
                }, 5 * 60000);
                break;

            default:
                toast({ title: 'اختصار', description: 'تم تفعيل الاختصار' });
        }
    };

    return { executeShortcut, shortcutResult, setShortcutResult };
};
