import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Share } from '@capacitor/share';
import { supabase } from '@/integrations/supabase/client';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useFinance } from '@/hooks/useFinance';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { useMedications } from '@/hooks/useMedications';
import { useShoppingList } from '@/hooks/useShoppingList';
import { useQuickNotes } from '@/hooks/useQuickNotes';
import {
    FileText, Calendar, CheckSquare, Pill, Moon, MapPin, ShoppingCart,
    StickyNote, Users, User, Send, Copy, Clock, Sun, Sunset, CalendarDays,
    PartyPopper, X, Plus, Trash2, Phone, MessageCircle, ChevronLeft, Check
} from 'lucide-react';

interface ReportGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
}

interface FavoriteContact {
    id: string;
    name: string;
    phone: string;
    emoji: string;
}

interface NewMuslim {
    id: string;
    name: string;
    country?: string;
    conversionDate?: string;
    stage?: string;
    notes?: string;
    phone?: string;
    email?: string;
    witnessSheikh?: string;
    birthDate?: string;
    occupation?: string;
    education?: string;
    address?: string;
    gender?: string;
    availableDays?: string[];
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ isOpen, onClose }) => {
    const { toast } = useToast();
    const { prayerTimes, nextPrayer, timeUntilNext } = usePrayerTimes();
    const { financeData, dailyLimit } = useFinance();
    const { tasks } = useTasks();
    const { appointments } = useAppointments();
    const { medications } = useMedications();
    const { items: shoppingItems } = useShoppingList();
    const { notesHistory } = useQuickNotes();

    const [selectedReport, setSelectedReport] = useState<string | null>(null);
    const [generatedReport, setGeneratedReport] = useState<string>('');
    const [editableReport, setEditableReport] = useState<string>('');
    const [showContactPicker, setShowContactPicker] = useState(false);
    const [showMuslimPicker, setShowMuslimPicker] = useState(false);
    const [selectedMuslims, setSelectedMuslims] = useState<string[]>([]);
    const [favoriteContacts, setFavoriteContacts] = useState<FavoriteContact[]>([]);
    const [newMuslims, setNewMuslims] = useState<NewMuslim[]>([]);
    const [showAddContact, setShowAddContact] = useState(false);
    const [newContactName, setNewContactName] = useState('');
    const [newContactPhone, setNewContactPhone] = useState('');
    const [newContactEmoji, setNewContactEmoji] = useState('👤');

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const hijriDate = today.toLocaleDateString('ar-SA-u-ca-islamic', { dateStyle: 'full' });

    // Fetch favorite contacts from Supabase
    const fetchContacts = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // Fallback to localStorage
                const saved = localStorage.getItem('baraka_favorite_contacts');
                if (saved) setFavoriteContacts(JSON.parse(saved));
                return;
            }

            const { data, error } = await supabase
                .from('favorite_contacts')
                .select('*')
                .order('order_index', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                const mapped: FavoriteContact[] = data.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    phone: c.phone,
                    emoji: c.emoji || '👤',
                }));
                setFavoriteContacts(mapped);
                localStorage.setItem('baraka_favorite_contacts', JSON.stringify(mapped));
            } else {
                // Fallback to localStorage
                const saved = localStorage.getItem('baraka_favorite_contacts');
                if (saved) setFavoriteContacts(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Error fetching contacts:', error);
            const saved = localStorage.getItem('baraka_favorite_contacts');
            if (saved) setFavoriteContacts(JSON.parse(saved));
        }
    }, []);

    // Fetch new Muslims from Supabase
    const fetchNewMuslims = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                const saved = localStorage.getItem('baraka_new_muslims');
                if (saved) setNewMuslims(JSON.parse(saved));
                return;
            }

            const { data, error } = await supabase
                .from('new_muslims')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data && data.length > 0) {
                const mapped: NewMuslim[] = data.map((m: any) => ({
                    id: m.id.toString(),
                    name: m.nombre_completo || 'غير محدد',
                    country: m.nacionalidad || m.country,
                    conversionDate: m.fecha_cuando || m.conversion_date,
                    stage: m.level || m.current_stage?.toString(),
                    notes: m.notes,
                    phone: m.whatsapp || m.phone,
                    email: m.email,
                    witnessSheikh: m.con_el_sheij || m.witness_sheikh,
                    birthDate: m.edad || m.birth_date,
                    occupation: m.trabajo || m.occupation,
                    education: m.estudio || m.education,
                    address: m.ciudad_donde || m.address,
                    gender: m.gender,
                    availableDays: m.que_dias_tiene ? [m.que_dias_tiene] : (m.available_days || []),
                }));
                setNewMuslims(mapped);
            } else {
                const saved = localStorage.getItem('baraka_new_muslims');
                if (saved) setNewMuslims(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Error fetching new muslims:', error);
            const saved = localStorage.getItem('baraka_new_muslims');
            if (saved) setNewMuslims(JSON.parse(saved));
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchContacts();
            fetchNewMuslims();
        }
    }, [isOpen, fetchContacts, fetchNewMuslims]);

    // Save contacts to Supabase
    const saveContact = async (contact: FavoriteContact) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('favorite_contacts').insert({
                    id: contact.id,
                    user_id: user.id,
                    name: contact.name,
                    phone: contact.phone,
                    emoji: contact.emoji,
                    order_index: favoriteContacts.length,
                });
            }
            setFavoriteContacts(prev => [...prev, contact]);
            localStorage.setItem('baraka_favorite_contacts', JSON.stringify([...favoriteContacts, contact]));
        } catch (error) {
            console.error('Error saving contact:', error);
            setFavoriteContacts(prev => [...prev, contact]);
            localStorage.setItem('baraka_favorite_contacts', JSON.stringify([...favoriteContacts, contact]));
        }
    };

    const addContact = async () => {
        if (!newContactName || !newContactPhone) {
            toast({ title: 'أدخل الاسم والرقم', variant: 'destructive' });
            return;
        }
        const newContact: FavoriteContact = {
            id: crypto.randomUUID(),
            name: newContactName,
            phone: newContactPhone.replace(/\s/g, ''),
            emoji: newContactEmoji
        };
        await saveContact(newContact);
        setNewContactName('');
        setNewContactPhone('');
        setNewContactEmoji('👤');
        setShowAddContact(false);
        toast({ title: 'تم إضافة جهة الاتصال ✅' });
    };

    const deleteContact = async (id: string) => {
        setFavoriteContacts(prev => prev.filter(c => c.id !== id));
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('favorite_contacts').delete().eq('id', id);
            }
        } catch (error) {
            console.error('Error deleting contact:', error);
        }
        localStorage.setItem('baraka_favorite_contacts', JSON.stringify(favoriteContacts.filter(c => c.id !== id)));
    };

    const getReportHeader = (title: string) => {
        return `📊 *${title}*\n${'━'.repeat(25)}\n📅 ${today.toLocaleDateString('ar-SA')} | ${hijriDate.split('،')[0]}\n${'━'.repeat(25)}\n\n`;
    };

    const getReportFooter = () => {
        return `\n${'━'.repeat(25)}\n✨ تقرير من تطبيق البركة`;
    };

    // Report Generators
    const generateDailySummary = () => {
        const todayTasks = tasks.filter(t => t.deadline === todayStr);
        const completedTasks = todayTasks.filter(t => t.progress >= 100);
        const todayExpenses = financeData?.pending_expenses?.filter(e => e.timestamp?.startsWith(todayStr)) || [];
        const totalExpenses = todayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

        let report = getReportHeader('ملخص اليوم');

        report += `💰 *المالية:*\n`;
        report += `   الرصيد: ${financeData?.current_balance_ars?.toLocaleString() || 0} ARS\n`;
        report += `   مصاريف اليوم: ${totalExpenses.toLocaleString()} ARS\n`;
        report += `   الحد المتبقي: ${dailyLimit?.toLocaleString() || 0} ARS\n\n`;

        report += `✅ *المهام:*\n`;
        report += `   المكتملة: ${completedTasks.length}/${todayTasks.length}\n`;
        if (todayTasks.length > 0) {
            todayTasks.slice(0, 5).forEach(t => {
                report += `   ${t.progress >= 100 ? '✓' : '○'} ${t.title}\n`;
            });
        }
        report += '\n';

        report += `🕌 *الصلاة القادمة:*\n`;
        report += `   ${nextPrayer?.nameAr || 'غير متاح'} - ${nextPrayer?.time || '--:--'}\n`;
        report += `   المتبقي: ${timeUntilNext || '--:--'}\n`;

        report += getReportFooter();
        return report;
    };

    const generateWeeklySummary = () => {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const weekTasks = tasks.filter(t => {
            const taskDate = new Date(t.deadline);
            return taskDate >= weekAgo && taskDate <= today;
        });
        const completedWeekTasks = weekTasks.filter(t => t.progress >= 100);

        let report = getReportHeader('ملخص الأسبوع');

        report += `📊 *الإحصائيات:*\n`;
        report += `   إجمالي المهام: ${weekTasks.length}\n`;
        report += `   المكتملة: ${completedWeekTasks.length}\n`;
        report += `   نسبة الإنجاز: ${weekTasks.length > 0 ? Math.round((completedWeekTasks.length / weekTasks.length) * 100) : 0}%\n\n`;

        report += `📅 *المواعيد المنجزة:*\n`;
        const weekAppointments = appointments.filter(a => {
            const apptDate = new Date(a.date);
            return apptDate >= weekAgo && apptDate <= today;
        });
        report += `   ${weekAppointments.length} موعد\n`;

        report += getReportFooter();
        return report;
    };

    const generateMorningReport = () => {
        const todayTasks = tasks.filter(t => t.deadline === todayStr && t.progress < 100);
        const todayAppointments = appointments.filter(a => a.date === todayStr);
        const activeMeds = medications.filter(m => m.isPermanent || (m.startDate <= todayStr && (!m.endDate || m.endDate >= todayStr)));

        let report = getReportHeader('تقرير صباحي 🌅');

        report += `📋 *مهام اليوم (${todayTasks.length}):*\n`;
        todayTasks.forEach(t => {
            report += `   ○ ${t.title}\n`;
        });
        if (todayTasks.length === 0) report += `   لا توجد مهام لليوم\n`;
        report += '\n';

        report += `📅 *مواعيد اليوم (${todayAppointments.length}):*\n`;
        todayAppointments.forEach(a => {
            report += `   🕐 ${a.time || '--:--'} - ${a.title}\n`;
        });
        if (todayAppointments.length === 0) report += `   لا توجد مواعيد\n`;
        report += '\n';

        report += `💊 *الأدوية:*\n`;
        activeMeds.forEach(m => {
            report += `   ${m.name} - ${m.frequency || 'حسب الحاجة'}\n`;
        });
        if (activeMeds.length === 0) report += `   لا توجد أدوية\n`;

        report += getReportFooter();
        return report;
    };

    const generateEveningReport = () => {
        const todayTasks = tasks.filter(t => t.deadline === todayStr);
        const completedTasks = todayTasks.filter(t => t.progress >= 100);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        const tomorrowTasks = tasks.filter(t => t.deadline === tomorrowStr);

        let report = getReportHeader('تقرير مسائي 🌙');

        report += `✅ *إنجازات اليوم:*\n`;
        report += `   المهام: ${completedTasks.length}/${todayTasks.length} مكتملة\n`;
        completedTasks.forEach(t => {
            report += `   ✓ ${t.title}\n`;
        });
        report += '\n';

        report += `📋 *خطة الغد (${tomorrowTasks.length} مهمة):*\n`;
        tomorrowTasks.forEach(t => {
            report += `   ○ ${t.title}\n`;
        });
        if (tomorrowTasks.length === 0) report += `   لا توجد مهام مجدولة\n`;

        report += getReportFooter();
        return report;
    };

    const generateTodayTasks = () => {
        const todayTasks = tasks.filter(t => t.deadline === todayStr);

        let report = getReportHeader('مهام اليوم ✅');

        if (todayTasks.length === 0) {
            report += `لا توجد مهام لليوم 🎉\n`;
        } else {
            todayTasks.forEach(t => {
                const status = t.progress >= 100 ? '✓' : '○';
                report += `${status} ${t.title}\n`;
                if (t.description) report += `   ${t.description}\n`;
            });
        }

        report += getReportFooter();
        return report;
    };

    const generateWeekTasks = () => {
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const weekTasks = tasks.filter(t => {
            const taskDate = new Date(t.deadline);
            return taskDate >= today && taskDate <= weekEnd;
        });

        let report = getReportHeader('مهام الأسبوع 📋');

        if (weekTasks.length === 0) {
            report += `لا توجد مهام للأسبوع القادم\n`;
        } else {
            weekTasks.forEach(t => {
                const status = t.progress >= 100 ? '✓' : '○';
                const date = new Date(t.deadline).toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric' });
                report += `${status} ${t.title} (${date})\n`;
            });
        }

        report += getReportFooter();
        return report;
    };

    const generateAppointments = () => {
        const upcomingAppts = appointments
            .filter(a => new Date(a.date) >= today)
            .slice(0, 10);

        let report = getReportHeader('المواعيد القادمة 📅');

        if (upcomingAppts.length === 0) {
            report += `لا توجد مواعيد قادمة\n`;
        } else {
            upcomingAppts.forEach(a => {
                const date = new Date(a.date).toLocaleDateString('ar-SA', { weekday: 'short', month: 'short', day: 'numeric' });
                report += `📌 ${a.title}\n`;
                report += `   📅 ${date} ${a.time ? `- 🕐 ${a.time}` : ''}\n`;
                if (a.location) report += `   📍 ${a.location}\n`;
                report += '\n';
            });
        }

        report += getReportFooter();
        return report;
    };

    const generateMedications = () => {
        const activeMeds = medications.filter(m => m.isPermanent || (m.startDate <= todayStr && (!m.endDate || m.endDate >= todayStr)));

        let report = getReportHeader('تقرير الأدوية 💊');

        if (activeMeds.length === 0) {
            report += `لا توجد أدوية مسجلة\n`;
        } else {
            activeMeds.forEach(m => {
                report += `💊 *${m.name}*\n`;
                report += `   الوقت: ${m.time || 'غير محدد'}\n`;
                report += `   التكرار: ${m.frequency || 'يومي'}\n`;
                report += '\n';
            });
        }

        report += getReportFooter();
        return report;
    };

    const generateTodayPrayer = () => {
        let report = getReportHeader('أوقات الصلاة - اليوم 🕌');

        if (prayerTimes && prayerTimes.length > 0) {
            const fajr = prayerTimes.find(p => p.name === 'fajr');
            const sunrise = prayerTimes.find(p => p.name === 'sunrise');
            const dhuhr = prayerTimes.find(p => p.name === 'dhuhr');
            const asr = prayerTimes.find(p => p.name === 'asr');
            const maghrib = prayerTimes.find(p => p.name === 'maghrib');
            const isha = prayerTimes.find(p => p.name === 'isha');

            report += `🌅 الفجر: ${fajr?.time || '--:--'}\n`;
            report += `☀️ الشروق: ${sunrise?.time || '--:--'}\n`;
            report += `🌞 الظهر: ${dhuhr?.time || '--:--'}\n`;
            report += `🌤️ العصر: ${asr?.time || '--:--'}\n`;
            report += `🌅 المغرب: ${maghrib?.time || '--:--'}\n`;
            report += `🌙 العشاء: ${isha?.time || '--:--'}\n`;
        } else {
            report += `لم يتم تحميل أوقات الصلاة\n`;
        }

        report += getReportFooter();
        return report;
    };

    const generateWeekPrayer = () => {
        let report = getReportHeader('أوقات الصلاة - الأسبوع 🕌');
        report += `⚠️ هذه الميزة تتطلب API خارجي\n`;
        report += `يرجى استخدام تقرير اليوم حالياً\n`;
        report += getReportFooter();
        return report;
    };

    const generateMonthPrayer = () => {
        let report = getReportHeader('أوقات الصلاة - الشهر 🕌');
        report += `⚠️ هذه الميزة تتطلب API خارجي\n`;
        report += `يرجى استخدام تقرير اليوم حالياً\n`;
        report += getReportFooter();
        return report;
    };

    const generateHolidays = () => {
        const holidays = [
            { name: 'عيد الفطر', hijriMonth: 10, hijriDay: 1 },
            { name: 'عيد الأضحى', hijriMonth: 12, hijriDay: 10 },
            { name: 'رأس السنة الهجرية', hijriMonth: 1, hijriDay: 1 },
            { name: 'المولد النبوي', hijriMonth: 3, hijriDay: 12 },
            { name: 'ليلة الإسراء والمعراج', hijriMonth: 7, hijriDay: 27 },
            { name: 'ليلة النصف من شعبان', hijriMonth: 8, hijriDay: 15 },
        ];

        let report = getReportHeader('المناسبات والأعياد الإسلامية 🎉');

        holidays.forEach(h => {
            report += `🌙 ${h.name}\n`;
        });

        report += `\n📅 التاريخ الهجري اليوم:\n${hijriDate}\n`;

        report += getReportFooter();
        return report;
    };

    const generateLocations = () => {
        let report = getReportHeader('المواقع المحفوظة 📍');

        try {
            const savedLocations = JSON.parse(localStorage.getItem('baraka_resources') || '[]');
            const customLocations = JSON.parse(localStorage.getItem('baraka_custom_locations') || '[]');
            const allLocations = [...savedLocations, ...customLocations];

            if (allLocations.length === 0) {
                report += `لا توجد مواقع محفوظة\n`;
            } else {
                allLocations.forEach((loc: any) => {
                    report += `📍 ${loc.title || loc.name}\n`;
                    if (loc.url) report += `   🔗 ${loc.url}\n`;
                    report += '\n';
                });
            }
        } catch {
            report += `خطأ في تحميل المواقع\n`;
        }

        report += getReportFooter();
        return report;
    };

    const generateShopping = () => {
        let report = getReportHeader('قائمة المشتريات 🛒');

        if (shoppingItems.length === 0) {
            report += `القائمة فارغة ✨\n`;
        } else {
            const pending = shoppingItems.filter(i => !i.completed);
            const completed = shoppingItems.filter(i => i.completed);

            if (pending.length > 0) {
                report += `*المطلوب شراؤها:*\n`;
                pending.forEach(i => {
                    report += `○ ${i.text}\n`;
                });
                report += '\n';
            }

            if (completed.length > 0) {
                report += `*تم شراؤها:*\n`;
                completed.forEach(i => {
                    report += `✓ ${i.text}\n`;
                });
            }
        }

        report += getReportFooter();
        return report;
    };

    const generateNotes = () => {
        let report = getReportHeader('الملاحظات 📝');

        if (notesHistory.length === 0) {
            report += `لا توجد ملاحظات\n`;
        } else {
            notesHistory.slice(0, 10).forEach((note, idx) => {
                report += `${idx + 1}. ${note.title || 'ملاحظة'}\n`;
                if (note.content) {
                    const preview = note.content.substring(0, 100);
                    report += `   ${preview}${note.content.length > 100 ? '...' : ''}\n`;
                }
                report += '\n';
            });
        }

        report += getReportFooter();
        return report;
    };

    // Generate report for selected Muslims (single or multiple)
    const generateSelectedMuslimsReport = (muslimIds: string[]) => {
        const selected = newMuslims.filter(m => muslimIds.includes(m.id));

        let report = getReportHeader(selected.length === 1 ? `تقرير المسلم الجديد 👤` : `تقرير المسلمين الجدد (${selected.length}) 👥`);

        if (selected.length === 0) {
            report += `لم يتم اختيار أي مسلم\n`;
        } else {
            selected.forEach((m, idx) => {
                if (selected.length > 1) {
                    report += `\n${'━'.repeat(20)}\n`;
                    report += `📌 *${idx + 1}. ${m.name}*\n`;
                    report += `${'━'.repeat(20)}\n`;
                } else {
                    report += `👤 *${m.name}*\n\n`;
                }

                // Basic Info
                if (m.gender) report += `⚧ الجنس: ${m.gender === 'male' ? 'ذكر' : m.gender === 'female' ? 'أنثى' : m.gender}\n`;
                if (m.country) report += `🌍 البلد: ${m.country}\n`;
                if (m.address) report += `📍 العنوان: ${m.address}\n`;

                // Contact Info
                if (m.phone) report += `📱 الهاتف: ${m.phone}\n`;
                if (m.email) report += `📧 البريد: ${m.email}\n`;

                // Islam Journey
                if (m.conversionDate) report += `📅 تاريخ الإسلام: ${m.conversionDate}\n`;
                if (m.witnessSheikh) report += `👨‍🏫 الشيخ الشاهد: ${m.witnessSheikh}\n`;
                if (m.stage) report += `📊 المرحلة: ${m.stage}\n`;

                // Personal Info
                if (m.birthDate) report += `🎂 تاريخ الميلاد: ${m.birthDate}\n`;
                if (m.occupation) report += `💼 المهنة: ${m.occupation}\n`;
                if (m.education) report += `🎓 التعليم: ${m.education}\n`;

                // Availability
                if (m.availableDays && m.availableDays.length > 0) {
                    report += `📆 الأيام المتاحة: ${m.availableDays.join('، ')}\n`;
                }

                // Notes
                if (m.notes) report += `📝 ملاحظات: ${m.notes}\n`;

                report += '\n';
            });
        }

        report += getReportFooter();
        return report;
    };

    // Select All / Deselect All
    const selectAllMuslims = () => {
        setSelectedMuslims(newMuslims.map(m => m.id));
    };

    const deselectAllMuslims = () => {
        setSelectedMuslims([]);
    };

    const generateAllMuslims = () => {
        let report = getReportHeader('قائمة المسلمين الجدد 👥');

        if (newMuslims.length === 0) {
            report += `لا يوجد مسلمون جدد مسجلون\n`;
        } else {
            report += `العدد الإجمالي: ${newMuslims.length}\n\n`;
            newMuslims.forEach((m, idx) => {
                report += `${idx + 1}. ${m.name}`;
                if (m.country) report += ` (${m.country})`;
                report += '\n';
            });
        }

        report += getReportFooter();
        return report;
    };

    const reportTypes = [
        { id: 'daily', name: 'ملخص اليوم', icon: Sun, generator: generateDailySummary },
        { id: 'weekly', name: 'ملخص الأسبوع', icon: CalendarDays, generator: generateWeeklySummary },
        { id: 'morning', name: 'تقرير صباحي', icon: Sun, generator: generateMorningReport },
        { id: 'evening', name: 'تقرير مسائي', icon: Sunset, generator: generateEveningReport },
        { id: 'todayTasks', name: 'مهام اليوم', icon: CheckSquare, generator: generateTodayTasks },
        { id: 'weekTasks', name: 'مهام الأسبوع', icon: CheckSquare, generator: generateWeekTasks },
        { id: 'appointments', name: 'المواعيد القادمة', icon: Calendar, generator: generateAppointments },
        { id: 'medications', name: 'تقرير الأدوية', icon: Pill, generator: generateMedications },
        { id: 'prayerToday', name: 'أوقات الصلاة - اليوم', icon: Moon, generator: generateTodayPrayer },
        { id: 'prayerWeek', name: 'أوقات الصلاة - الأسبوع', icon: Moon, generator: generateWeekPrayer },
        { id: 'prayerMonth', name: 'أوقات الصلاة - الشهر', icon: Moon, generator: generateMonthPrayer },
        { id: 'holidays', name: 'المناسبات والأعياد', icon: PartyPopper, generator: generateHolidays },
        { id: 'locations', name: 'المواقع المحفوظة', icon: MapPin, generator: generateLocations },
        { id: 'shopping', name: 'قائمة المشتريات', icon: ShoppingCart, generator: generateShopping },
        { id: 'notes', name: 'الملاحظات', icon: StickyNote, generator: generateNotes },
        { id: 'newMuslim', name: 'تقرير مسلم جديد', icon: User, generator: () => '', needsSelection: true },
        { id: 'allMuslims', name: 'قائمة المسلمين الجدد', icon: Users, generator: generateAllMuslims },
    ];

    const handleSelectReport = (reportId: string) => {
        const report = reportTypes.find(r => r.id === reportId);
        if (report) {
            if (report.id === 'newMuslim') {
                // Show Muslim picker
                setSelectedMuslims([]);
                setShowMuslimPicker(true);
                setSelectedReport(reportId);
            } else {
                const generated = report.generator();
                setGeneratedReport(generated);
                setEditableReport(generated);
                setSelectedReport(reportId);
            }
        }
    };

    const handleMuslimSelection = () => {
        if (selectedMuslims.length === 0) {
            toast({ title: 'اختر مسلماً واحداً على الأقل', variant: 'destructive' });
            return;
        }
        const generated = generateSelectedMuslimsReport(selectedMuslims);
        setGeneratedReport(generated);
        setEditableReport(generated);
        setShowMuslimPicker(false);
    };

    const toggleMuslimSelection = (id: string) => {
        setSelectedMuslims(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const handleSendToContact = async (contact: FavoriteContact) => {
        const text = encodeURIComponent(editableReport);
        const phone = contact.phone.replace(/\D/g, '');
        const url = `https://wa.me/${phone}?text=${text}`;
        window.open(url, '_blank');
        setShowContactPicker(false);
        toast({ title: `تم فتح محادثة ${contact.name} ✅` });
    };

    const handleShare = async () => {
        if (!editableReport) return;
        setShowContactPicker(true);
    };

    const handleShareGeneric = async () => {
        try {
            await Share.share({
                text: editableReport,
                title: 'تقرير البركة',
            });
            toast({ title: 'تم إرسال التقرير ✅' });
            setShowContactPicker(false);
        } catch (error) {
            // Fallback to clipboard
            try {
                await navigator.clipboard.writeText(editableReport);
                toast({ title: 'تم نسخ التقرير 📋', description: 'يمكنك لصقه في أي تطبيق' });
            } catch {
                toast({ title: 'خطأ', description: 'فشل في المشاركة', variant: 'destructive' });
            }
        }
    };

    const handleCopy = async () => {
        if (!editableReport) return;

        try {
            await navigator.clipboard.writeText(editableReport);
            toast({ title: 'تم النسخ ✅' });
        } catch {
            toast({ title: 'خطأ في النسخ', variant: 'destructive' });
        }
    };

    const resetState = () => {
        setSelectedReport(null);
        setGeneratedReport('');
        setEditableReport('');
        setShowContactPicker(false);
        setShowMuslimPicker(false);
        setSelectedMuslims([]);
    };

    const emojiOptions = ['👤', '👩', '👨', '👴', '👵', '👨‍💼', '👩‍💼', '🏠', '💼', '❤️', '⭐', '📱'];

    return (
        <Dialog open={isOpen} onOpenChange={() => { resetState(); onClose(); }}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-right">
                        <FileText className="w-5 h-5 text-primary" />
                        إرسال تقرير
                    </DialogTitle>
                </DialogHeader>

                {/* Muslim Picker Dialog */}
                {showMuslimPicker && (
                    <div className="flex-1 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <Button variant="ghost" size="sm" onClick={() => setShowMuslimPicker(false)}>
                                <ChevronLeft className="w-4 h-4 ml-1" /> رجوع
                            </Button>
                            <span className="text-sm text-gray-500">اختر مسلماً أو أكثر ({newMuslims.length})</span>
                        </div>

                        {/* Select All / Deselect All Buttons */}
                        {newMuslims.length > 0 && (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={selectAllMuslims}
                                    className="flex-1 text-xs"
                                    disabled={selectedMuslims.length === newMuslims.length}
                                >
                                    ✅ اختيار الكل
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={deselectAllMuslims}
                                    className="flex-1 text-xs"
                                    disabled={selectedMuslims.length === 0}
                                >
                                    ❌ إلغاء الكل
                                </Button>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto max-h-[45vh] space-y-1">
                            {newMuslims.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">لا يوجد مسلمون مسجلون</p>
                            ) : (
                                newMuslims.map(muslim => (
                                    <button
                                        key={muslim.id}
                                        onClick={() => toggleMuslimSelection(muslim.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-right ${selectedMuslims.includes(muslim.id) ? 'bg-primary/10 border border-primary' : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${selectedMuslims.includes(muslim.id) ? 'bg-primary border-primary' : 'border-gray-300'
                                            }`}>
                                            {selectedMuslims.includes(muslim.id) && <Check className="w-4 h-4 text-white" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{muslim.name}</p>
                                            <div className="flex gap-2 text-xs text-gray-500">
                                                {muslim.country && <span>🌍 {muslim.country}</span>}
                                                {muslim.stage && <span>📊 {muslim.stage}</span>}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        <Button onClick={handleMuslimSelection} disabled={selectedMuslims.length === 0} className="w-full">
                            إنشاء التقرير ({selectedMuslims.length} مختار)
                        </Button>
                    </div>
                )}

                {/* Contact Picker Dialog */}
                {showContactPicker && !showMuslimPicker && (
                    <div className="flex-1 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <Button variant="ghost" size="sm" onClick={() => setShowContactPicker(false)}>
                                <ChevronLeft className="w-4 h-4 ml-1" /> رجوع
                            </Button>
                            <span className="text-sm text-gray-500">إرسال إلى</span>
                        </div>

                        {/* Add Contact Form */}
                        {showAddContact ? (
                            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                <div className="flex gap-2">
                                    <select
                                        value={newContactEmoji}
                                        onChange={e => setNewContactEmoji(e.target.value)}
                                        className="w-16 text-xl bg-white rounded-lg border p-2"
                                    >
                                        {emojiOptions.map(e => <option key={e} value={e}>{e}</option>)}
                                    </select>
                                    <Input
                                        placeholder="الاسم"
                                        value={newContactName}
                                        onChange={e => setNewContactName(e.target.value)}
                                    />
                                </div>
                                <Input
                                    placeholder="رقم الهاتف مع رمز الدولة"
                                    value={newContactPhone}
                                    onChange={e => setNewContactPhone(e.target.value)}
                                    dir="ltr"
                                />
                                <div className="flex gap-2">
                                    <Button onClick={addContact} size="sm" className="flex-1">
                                        <Plus className="w-4 h-4 ml-1" /> إضافة
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setShowAddContact(false)}>
                                        إلغاء
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button variant="outline" onClick={() => setShowAddContact(true)} className="w-full">
                                <Plus className="w-4 h-4 ml-2" /> إضافة جهة اتصال جديدة
                            </Button>
                        )}

                        {/* Contact List */}
                        <div className="flex-1 overflow-y-auto max-h-[40vh] space-y-1">
                            {/* Generic Share */}
                            <button
                                onClick={handleShareGeneric}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Send className="w-5 h-5 text-blue-600" />
                                </div>
                                <span className="flex-1 font-medium text-right">مشاركة عامة...</span>
                            </button>

                            {/* Favorite Contacts */}
                            {favoriteContacts.map(contact => (
                                <div key={contact.id} className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleSendToContact(contact)}
                                        className="flex-1 flex items-center gap-3 p-3 rounded-xl hover:bg-green-50 transition-colors"
                                    >
                                        <div className="p-2 bg-green-100 rounded-lg text-xl">
                                            {contact.emoji}
                                        </div>
                                        <div className="flex-1 text-right">
                                            <p className="font-medium">{contact.name}</p>
                                            <p className="text-xs text-gray-500" dir="ltr">{contact.phone}</p>
                                        </div>
                                        <MessageCircle className="w-5 h-5 text-green-600" />
                                    </button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deleteContact(contact.id)}
                                        className="text-red-500 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Report List */}
                {!selectedReport && !showMuslimPicker && !showContactPicker && (
                    <div className="flex-1 overflow-y-auto space-y-1">
                        {reportTypes.map(report => {
                            const Icon = report.icon;
                            return (
                                <button
                                    key={report.id}
                                    onClick={() => handleSelectReport(report.id)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-right"
                                >
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Icon className="w-5 h-5 text-primary" />
                                    </div>
                                    <span className="flex-1 font-medium text-gray-700">{report.name}</span>
                                    <Send className="w-4 h-4 text-gray-400" />
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Generated Report Preview & Edit */}
                {selectedReport && !showMuslimPicker && !showContactPicker && (
                    <div className="flex-1 flex flex-col gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetState}
                            className="self-start"
                        >
                            <ChevronLeft className="w-4 h-4 ml-1" /> رجوع للقائمة
                        </Button>

                        {/* Editable Report */}
                        <textarea
                            value={editableReport}
                            onChange={e => setEditableReport(e.target.value)}
                            className="flex-1 bg-gray-50 rounded-xl p-4 text-sm text-gray-700 font-sans text-right resize-none min-h-[200px] max-h-[40vh] border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                            dir="rtl"
                            placeholder="التقرير فارغ..."
                        />

                        <div className="flex gap-2">
                            <Button onClick={handleShare} className="flex-1 bg-green-600 hover:bg-green-700">
                                <MessageCircle className="w-4 h-4 ml-2" />
                                إرسال
                            </Button>
                            <Button onClick={handleCopy} variant="outline" className="flex-1">
                                <Copy className="w-4 h-4 ml-2" />
                                نسخ
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ReportGenerator;
