import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useFinance } from '@/hooks/useFinance';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { useNavigate } from 'react-router-dom';
import { useShoppingList } from '@/hooks/useShoppingList';
import { useMedications } from '@/hooks/useMedications';
import { useHabits } from '@/hooks/useHabits';
import { supabase } from '@/integrations/supabase/client';

export const useShortcutExecution = (props: {
    onOpenAddDialog: (type: any) => void,
    onOpenVoiceRecorder?: () => void,
    onOpenTimer?: () => void,
    onOpenNewMuslims?: () => void,
    onNavigateToTab?: (tabId: string) => void,
    onOpenSearch?: () => void,
    onOpenShortcuts?: () => void,
    onOpenTools?: () => void,
    onQuickParking?: () => void,
}) => {
    const { toast } = useToast();
    const { nextPrayer, timeUntilNext, prayerTimes } = usePrayerTimes();
    const { financeData, dailyLimit } = useFinance();
    const { tasks } = useTasks();
    const { appointments } = useAppointments();
    const { medications } = useMedications();
    const { habits } = useHabits();
    const { items: shoppingItems } = useShoppingList();
    const navigate = useNavigate();

    const [shortcutResult, setShortcutResult] = useState<{ id?: string; title: string; content: string } | null>(null);

    const executeShortcut = async (actionId: string) => {
        switch (actionId) {
            // --- INFO & SUMMARIES ---
            case 'daily_summary':
                const todayTasks = tasks.filter(t => t.deadline === new Date().toISOString().split('T')[0]);
                const pendingTasks = todayTasks.filter(t => t.progress < 100).length;
                const todaySpent = financeData?.pending_expenses?.filter((t: any) =>
                    t?.timestamp && typeof t.timestamp === 'string' && t.timestamp.startsWith(new Date().toISOString().split('T')[0])
                ).reduce((sum: number, t: any) => sum + (Number(t?.amount) || 0), 0) || 0;

                const nextPrayerInfo = prayerTimes.find((p: any) => p.isNext);

                setShortcutResult({
                    id: actionId,
                    title: '🧠 ملخص اليوم',
                    content: `📅 التاريخ: ${new Date().toLocaleDateString('ar-SA')}\n\n🕌 القادمة: ${nextPrayerInfo?.name || '-'} (${timeUntilNext})\n✅ المهام: ${todayTasks.length} (متبقي ${pendingTasks})\n💰 المصروف: ${(todaySpent || 0).toLocaleString()} ARS`
                });
                break;

            case 'show_monthly_summary':
                const currentMonth = new Date().getMonth();
                const monthExpenses = financeData?.pending_expenses?.filter((t: any) =>
                    t?.timestamp && new Date(t.timestamp).getMonth() === currentMonth
                ).reduce((sum: number, t: any) => sum + (Number(t?.amount) || 0), 0) || 0;

                const completedMonth = tasks.filter(t =>
                    t.progress >= 100 && new Date(t.deadline || '').getMonth() === currentMonth
                ).length;

                setShortcutResult({
                    id: actionId,
                    title: '📊 ملخص الشهر',
                    content: `💰 إجمالي المصاريف: ${(monthExpenses || 0).toLocaleString()} ARS\n✅ الإنجاز: ${completedMonth} مهمة مكتملة\n📈 الحالة: ${monthExpenses > (dailyLimit || 0) * 30 ? '🔴 تجاوزت الميزانية' : '🟢 في النطاق السليم'}`
                });
                break;

            case 'show_balance':
                setShortcutResult({
                    id: actionId,
                    title: '💰 الرصيد المالي',
                    content: `💳 الرصيد الحالي: ${(financeData?.current_balance_ars || 0).toLocaleString()} ARS\n💵 بالدولار: ${(financeData?.current_balance_usd || 0).toLocaleString()} USD\n📉 المتبقي اليومي: ${(dailyLimit || 0).toLocaleString()} ARS`
                });
                break;

            case 'show_next_prayer':
                const np = prayerTimes.find((p: any) => p.isNext);
                setShortcutResult({
                    id: actionId,
                    title: '🕌 الصلاة القادمة',
                    content: np ? `الصلاة: ${np.name}\nالوقت: ${np.time}\nمتبقي: ${timeUntilNext}` : 'تم أداء جميع الصلوات'
                });
                break;

            case 'show_medications':
                // Simple list of all medications for now
                setShortcutResult({
                    id: actionId,
                    title: '💊 الأدوية',
                    content: medications.length ? medications.map(m => `• ${m.name} (${m.time})`).join('\n') : 'لا توجد أدوية مسجلة'
                });
                break;

            case 'show_habits':
                // Simple list of all habits
                setShortcutResult({
                    id: actionId,
                    title: '❤️ العادات',
                    content: habits.length ? habits.map(h => `• ${h.name} (${h.streak}🔥)`).join('\n') : 'لا توجد عادات مسجلة'
                });
                break;

            case 'add_event': props.onOpenAddDialog('appointment'); break;
            case 'search': props.onOpenSearch?.(); break;
            case 'open_tools':
                if (props.onOpenTools) {
                    props.onOpenTools();
                } else {
                    props.onOpenShortcuts?.();
                }
                break;
            case 'open_settings': props.onNavigateToTab?.('settings'); break;
            case 'open_academic': navigate('/thesis'); break;

            case 'timer': executeShortcut('start_pomodoro'); break;
            case 'event': executeShortcut('add_event'); break;
            case 'expense': executeShortcut('add_expense'); break;
            case 'location': executeShortcut('save_location_current'); break;
            case 'note': executeShortcut('add_note'); break;
            case 'shopping': executeShortcut('show_shopping'); break;

            // --- SMART TOOLS ---
            case 'brain_dump':
                props.onOpenAddDialog('note');
                // We use a timeout to let the dialog open, then try to set the type if possible, 
                // or relies on the 'open-quick-note' event if implemented globally.
                setTimeout(() => window.dispatchEvent(new CustomEvent('open-quick-note', { detail: { type: 'brain_dump' } })), 100);
                break;

            case 'log_distraction': {
                const reason = prompt('ما هو سبب التشتت؟');
                if (reason) {
                    await supabase.from('distraction_logs').insert({
                        user_id: (await supabase.auth.getUser()).data.user?.id,
                        reason
                    });
                    toast({ title: '✅ تم التسجيل', description: 'عُد إلى تركيزك الآن!' });
                }
                break;
            }




            // --- UTILITY TOOLS ---


            case 'find_car': {
                const { data: carLoc } = await supabase.from('saved_locations')
                    .select('*').eq('type', 'car').order('created_at', { ascending: false }).limit(1).single();

                if (carLoc) {
                    window.open(`https://www.google.com/maps?q=${carLoc.latitude},${carLoc.longitude}`, '_blank');
                } else {
                    toast({ title: 'تنبيه', description: 'لم يتم حفظ موقع سيارة مسبقاً' });
                }
                break;
            }

            case 'save_location_current':
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(async (pos) => {
                        const name = prompt('اسم الموقع:', 'موقعي الحالي');
                        if (!name) return;
                        await supabase.from('saved_locations').insert({
                            user_id: (await supabase.auth.getUser()).data.user?.id,
                            name,
                            latitude: pos.coords.latitude,
                            longitude: pos.coords.longitude,
                            type: 'general'
                        });
                        toast({ title: 'تم الحفظ', description: `تم حفظ ${name}` });
                    });
                }
                break;

            case 'share_location':
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((pos) => {
                        const link = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
                        navigator.clipboard.writeText(link);
                        toast({ title: '📍 تم النسخ', description: 'الرابط جاهز للمشاركة' });
                    });
                }
                break;





            // --- BASIC ACTIONS ---
            case 'show_calculator': window.dispatchEvent(new CustomEvent('open-calculator')); break;

            case 'sync_now':
                toast({ title: '🔄 جاري المزامنة...', description: 'تحديث البيانات' });
                // Trigger a soft reload of data by dispatching a custom event
                window.dispatchEvent(new CustomEvent('sync-data'));
                setTimeout(() => {
                    toast({ title: '✅ تم التحديث', description: 'البيانات محدثة' });
                }, 1000);
                break;

            case 'power_mode':
                const isPowerMode = document.body.classList.toggle('reduce-motion');
                localStorage.setItem('power_mode', isPowerMode ? 'true' : 'false');
                toast({
                    title: isPowerMode ? '⚡ وضع توفير الطاقة' : '✨ الوضع العادي',
                    description: isPowerMode ? 'تم تقليل المؤثرات البصرية' : 'تم تفعيل جميع المؤثرات'
                });
                break;

            case 'clear_cache':
                try {
                    localStorage.clear();
                    sessionStorage.clear();
                    toast({ title: '🧹 تم التنظيف', description: 'سيتم إعادة تحميل الصفحة...' });
                    setTimeout(() => window.location.reload(), 1000);
                } catch (e) {
                    toast({ title: '❌ خطأ', description: 'فشل في التنظيف', variant: 'destructive' });
                }
                break;

            // copy_location is an alias for share_location, handled below
            case 'open_map':
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((pos) => {
                        window.open(`https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`, '_blank');
                    });
                }
                break;
            case 'remind_water': toast({ title: '💧 تذكير', description: 'اشرب الماء الآن!' }); break;
            case 'remind_5min':
                toast({ title: '⏰ مؤقت 5 دقائق', description: 'بدأ العد...' });
                setTimeout(() => { new Notification('انتهى الوقت!'); alert('انتهت الـ 5 دقائق'); }, 5 * 60 * 1000);
                break;

            // --- DIALOGS ---
            case 'add_task': props.onOpenAddDialog('task'); break;
            case 'add_appointment': props.onOpenAddDialog('appointment'); break;
            case 'add_note': props.onOpenAddDialog('note'); break;
            case 'add_expense': props.onOpenAddDialog('expense'); break;
            case 'add_shopping': props.onOpenAddDialog('shopping'); break;
            case 'add_medication': props.onOpenAddDialog('medication'); break;
            case 'add_habit': props.onOpenAddDialog('habit'); break;
            case 'add_project': props.onOpenAddDialog('project'); break;
            case 'show_new_muslims': props.onOpenNewMuslims?.(); break;
            case 'start_pomodoro': props.onOpenTimer?.(); break;
            case 'save_parking':
                if (props.onQuickParking) {
                    props.onQuickParking();
                } else {
                    window.dispatchEvent(new CustomEvent('save-parking'));
                }
                break;

            case 'show_tasks': {
                const tList = tasks.filter(t => t?.deadline === new Date().toISOString().split('T')[0] && t.progress < 100);
                setShortcutResult({
                    id: actionId,
                    title: '📋 مهام اليوم',
                    content: tList.length ? tList.map(t => `• ${t?.title}`).join('\n') : 'لا توجد مهام متبقية'
                });
                break;
            }

            case 'show_shopping': {
                const sList = (shoppingItems || []).filter((i: any) => i && !i.completed).slice(0, 10);
                setShortcutResult({
                    id: actionId,
                    title: '🛒 التسوق',
                    content: sList.length ? sList.map((i: any) => `• ${i?.text || i?.name || 'صنف'}`).join('\n') : 'القائمة فارغة'
                });
                break;
            }

            case 'show_appointments': {
                const aList = (appointments || []).filter(a => a?.date && new Date(a.date) >= new Date()).slice(0, 5);
                setShortcutResult({
                    id: actionId,
                    title: '📅 المواعيد',
                    content: aList.length ? aList.map(a => `• ${a?.title} (${a?.date})`).join('\n') : 'لا مواعيد قريبة'
                });
                break;
            }

            case 'copy_location': {
                executeShortcut('share_location');
                break;
            }

            case 'copy_coords': {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            const coords = `${pos.coords.latitude},${pos.coords.longitude}`;
                            navigator.clipboard.writeText(coords);
                            toast({ title: '📍 تم نسخ الإحداثيات', description: coords });
                        },
                        () => toast({ title: '❌ فشل تحديد الموقع', variant: 'destructive' })
                    );
                }
                break;
            }

            case 'quick_timer_5': {
                toast({ title: '⏰ تذكير 5 دقائق', description: 'سيتم تنبيهك بعد 5 دقائق' });
                setTimeout(() => {
                    toast({ title: '⏰ انتهى الوقت!', variant: 'destructive' });
                    if ('vibrate' in navigator) navigator.vibrate([500, 200, 500]);
                    new Notification('تذكير البركة', { body: 'مضت 5 دقائق!' });
                }, 5 * 60 * 1000);
                break;
            }

            case 'finance_summary': {
                const totalToday = financeData?.pending_expenses?.filter((tx: any) =>
                    tx?.timestamp && new Date(tx.timestamp).toDateString() === new Date().toDateString()
                ).reduce((acc: number, curr: any) => acc + (Number(curr?.amount) || 0), 0) || 0;

                setShortcutResult({
                    id: actionId,
                    title: '💰 الملخص المالي اليومي',
                    content: `المصاريف اليومية: ${(totalToday || 0).toLocaleString()} ARS\nالحد المتبقي: ${(dailyLimit || 0).toLocaleString()} ARS`
                });
                break;
            }

            case 'open_mushaf': window.open('https://quran.com', '_blank'); break;
            case 'open_adhkar': window.open('https://www.duas.org/mobile/morning-evening-adhkar.html', '_blank'); break;
            case 'open_tasbih': window.dispatchEvent(new CustomEvent('open-tasbih')); break;
            case 'open_qibla': window.open('https://qiblafinder.withgoogle.com', '_blank'); break;

            default:
                console.log('Unhandled shortcut:', actionId);
                toast({ title: 'قريباً', description: 'هذا الاختصار قيد التطوير' });
        }
    };

    return { executeShortcut, shortcutResult, setShortcutResult };
};
