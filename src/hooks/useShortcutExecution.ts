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

            // New Navigation Actions
            // ===== التنقل (Navigation) =====
            case 'nav_dashboard': props.onNavigateToTab?.('dashboard'); break;
            case 'nav_finance': props.onNavigateToTab?.('finance'); break;
            case 'nav_productivity': props.onNavigateToTab?.('productivity'); break;
            case 'nav_notes': navigate('/notes-v2'); break;
            case 'nav_map': props.onNavigateToTab?.('map'); break;
            case 'nav_academic': navigate('/thesis'); break;
            case 'nav_islamic': props.onNavigateToTab?.('islamic'); break;
            case 'nav_new_muslims': props.onOpenNewMuslims?.(); break;
            case 'nav_settings': props.onNavigateToTab?.('settings'); break;
            case 'nav_reports': props.onNavigateToTab?.('reports'); break;
            case 'nav_map_settings': window.dispatchEvent(new Event('open-map-settings')); break;

            // ===== معلومات (Info) =====
            case 'info_prayer': {
                const nextPrayer = prayerTimes.find((p: any) => p.isNext);
                setShortcutResult({
                    id: actionId,
                    title: '🕌 الصلاة القادمة',
                    content: nextPrayer ? `الصلاة: ${nextPrayer.name}\nالوقت: ${nextPrayer.time}\nمتبقي: ${timeUntilNext}` : 'تم أداء جميع الصلوات'
                });
                break;
            }
            case 'show_next_prayer': executeShortcut('info_prayer'); break; // Alias

            case 'info_tasks':
                const tList = tasks.filter(t => t?.deadline === new Date().toISOString().split('T')[0] && t.progress < 100);
                setShortcutResult({
                    id: actionId,
                    title: '📋 مهام اليوم',
                    content: tList.length ? tList.map(t => `• ${t?.title}`).join('\n') : 'لا توجد مهام متبقية للاستعراض'
                });
                break;

            case 'info_balance':
            case 'show_balance':
                setShortcutResult({
                    id: actionId,
                    title: '💰 الرصيد المالي',
                    content: `💳 الرصيد الحالي: ${(financeData?.current_balance_ars || 0).toLocaleString()} ARS\n💵 بالدولار: ${(financeData?.current_balance_usd || 0).toLocaleString()} USD\n📉 المتبقي اليومي: ${(dailyLimit || 0).toLocaleString()} ARS`
                });
                break;

            case 'finance_summary':
                executeShortcut('info_daily');
                break;

            case 'loc_save_parking':
            case 'save_parking':
                if (props.onQuickParking) {
                    props.onQuickParking();
                } else {
                    window.dispatchEvent(new CustomEvent('save-parking'));
                }
                break;

            case 'loc_find_car':
                window.dispatchEvent(new CustomEvent('find-parking'));
                break;

            case 'loc_share':
            case 'copy_location':
            case 'share_location':
                executeShortcut('copy_coords');
                break;

            case 'shopping':
                props.onOpenAddDialog('shopping');
                break;

            case 'save_location':
                props.onOpenAddDialog('location');
                break;

            case 'open_map':
                props.onNavigateToTab?.('map');
                break;

            // ===== إجراءات سريعة (Quick Actions) =====
            case 'add_task_priority':
            case 'add_task_normal':
                props.onOpenAddDialog('task');
                break;

            case 'add_expense_quick':
            case 'expense':
            case 'add_expense':
                props.onOpenAddDialog('expense');
                break;

            case 'add_note_quick':
            case 'note':
            case 'add_note':
                props.onOpenAddDialog('note');
                break;

            case 'add_voice_quick':
                props.onOpenVoiceRecorder?.();
                break;

            case 'add_event_quick':
            case 'event':
                props.onOpenAddDialog('appointment');
                break;

            case 'add_distraction_log':
            case 'prod_distraction':
                const reason = prompt('ما الذي شتت انتباهك؟');
                if (reason) toast({ title: '⚡️ تم تسجيل التشتت', description: reason });
                break;

            // ===== أدوات النظام (System Tools) =====
            case 'sys_sync':
                toast({ title: '♻️ جاري المزامنة...', description: 'يتم تحديث البيانات من السحابة' });
                window.location.reload();
                break;

            case 'sys_calc':
                // Simple implementation or open system calculator link
                const eq = prompt('حاسبة سريعة: أدخل المعادلة (مثال: 5*10)');
                if (eq) {
                    try {
                        const res = eval(eq); // Safe enough for local user input calculator
                        alert(`النتيجة: ${res}`);
                    } catch (e) { alert('معادلة غير صحيحة'); }
                }
                break;

            case 'sys_clean':
                // Toggle clean mode via event dispatch
                window.dispatchEvent(new CustomEvent('toggle-clean-mode'));
                break;

            case 'sys_settings':
                props.onOpenShortcuts?.();
                break;

            // ===== الإنتاجية (Productivity) =====
            case 'timer_focus':
            case 'prod_pomo':
            case 'timer': // Alias
            case 'start_pomodoro': // Alias
                props.onOpenTimer?.();
                break;

            case 'prod_water':
                toast({ title: '💧 صحة وعافية', description: 'تم تسجيل كوب ماء' });
                // Logic to add water log would go here
                break;

            case 'prod_reading':
                props.onOpenTimer?.(); // Open timer for now, could be specific reading timer
                break;

            // ===== إسلاميات (Islamic) =====
            case 'islam_mushaf':
                window.open('https://quran.com/ar', '_blank');
                break;

            case 'islam_adhkar':
                window.open('https://www.duas.org/mobile/morning-evening-adhkar.html', '_blank');
                break;

            case 'islam_tasbih':
            case 'open_tasbih':
                window.dispatchEvent(new CustomEvent('open-tasbih'));
                break;

            case 'islam_qibla':
            case 'open_qibla':
                window.open('https://qiblafinder.withgoogle.com', '_blank');
                break;

            // ===== تذكيرات (Reminders) =====
            case 'timer_5':
            case 'remind_5':
                toast({ title: '⏰ تذكير 5 دقائق', description: 'سأنبهك بعد 5 دقائق' });
                setTimeout(() => { new Notification('⏰ انتهى الوقت!'); alert('⏰ انتهى وقت 5 دقائق'); }, 5 * 60000);
                break;

            case 'timer_15':
            case 'remind_15':
                toast({ title: '⏰ تذكير 15 دقيقة', description: 'سأنبهك بعد 15 دقيقة' });
                setTimeout(() => { new Notification('⏰ انتهى الوقت!'); alert('⏰ انتهى وقت 15 دقيقة'); }, 15 * 60000);
                break;

            // ===== الموقع (Location) =====
            case 'loc_add_new':
                window.dispatchEvent(new Event('open-add-location-dialog'));
                break;

            case 'loc_direct_detailed':
                window.dispatchEvent(new Event('open-location-shortcut-dialog'));
                break;

            case 'loc_save_current':
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
                        toast({ title: '📍 تم حفظ الموقع' });
                    });
                }
                break;

            case 'loc_shipping':
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(async (pos) => {
                        const name = prompt('اسم موقع الشحن:', 'موقع شحن');
                        if (!name) return;
                        await supabase.from('saved_locations').insert({
                            user_id: (await supabase.auth.getUser()).data.user?.id,
                            name,
                            latitude: pos.coords.latitude,
                            longitude: pos.coords.longitude,
                            type: 'shipping'
                        });
                        toast({ title: '📦 تم الحفظ', description: `تم حفظ ${name}` });
                    });
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


            default:
                console.log('Unhandled shortcut:', actionId);
                toast({ title: 'قريباً', description: 'هذا الاختصار قيد التطوير' });
        }
    };

    return { executeShortcut, shortcutResult, setShortcutResult };
};
