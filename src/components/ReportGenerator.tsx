import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useFinance } from '@/hooks/useFinance';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { useMedications } from '@/hooks/useMedications';
import { useShoppingList } from '@/hooks/useShoppingList';
import { useNotesV2 } from '@/hooks/useNotesV2';
import { generateGenericPDF, ReportData } from '@/utils/pdfGenerator';
import {
    FileText, Calendar, CheckSquare, Pill, Moon, MapPin, ShoppingCart,
    StickyNote, Users, User, Share2, Download, Search, ChevronLeft, Check, Plus, Trash2, MessageCircle, Sun
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
    const { notes: notesHistory } = useNotesV2();

    const [reportLanguage, setReportLanguage] = useState<'ar' | 'es'>('ar');
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [reportData, setReportData] = useState<ReportData | null>(null);

    // Pickers State
    const [showContactPicker, setShowContactPicker] = useState(false);
    const [showMuslimPicker, setShowMuslimPicker] = useState(false);
    const [selectedMuslims, setSelectedMuslims] = useState<string[]>([]);
    const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
    const [showNotePicker, setShowNotePicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [favoriteContacts, setFavoriteContacts] = useState<FavoriteContact[]>([]);
    const [newMuslims, setNewMuslims] = useState<NewMuslim[]>([]);
    const [showAddContact, setShowAddContact] = useState(false);
    const [newContactName, setNewContactName] = useState('');
    const [newContactPhone, setNewContactPhone] = useState('');
    const [newContactEmoji, setNewContactEmoji] = useState('👤');

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const hijriDate = today.toLocaleDateString('ar-SA-u-ca-islamic', { dateStyle: 'full' });

    // Helper for Translations
    const t = (key: string, lang: 'ar' | 'es') => {
        const dict: Record<string, { ar: string, es: string }> = {
            gender: { ar: 'الجنس', es: 'Género' },
            male: { ar: 'ذكر', es: 'Masculino' },
            female: { ar: 'أنثى', es: 'Femenino' },
            country: { ar: 'البلد', es: 'País' },
            phone: { ar: 'الهاتف', es: 'Teléfono' },
            conversionDate: { ar: 'تاريخ الإسلام', es: 'Fecha de Conversión' },
            stage: { ar: 'المرحلة', es: 'Etapa' },
            address: { ar: 'العنوان', es: 'Dirección' },
            notes: { ar: 'ملاحظات', es: 'Notas' },
            details: { ar: 'التفاصيل', es: 'Detalles' },
            statement: { ar: 'البيان', es: 'Dato' },
            dataFor: { ar: 'بيانات', es: 'Datos de' },
            newMuslimReport: { ar: 'تقرير المسلمين الجدد', es: 'Reporte de Nuevos Musulmanes' },
            prayerTimesToday: { ar: 'أوقات الصلاة - اليوم', es: 'Horarios de Oración - Hoy' },
        };
        return dict[key]?.[lang] || key;
    };

    // --- Data Fetching ---
    const fetchContacts = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                const saved = localStorage.getItem('baraka_favorite_contacts');
                if (saved) setFavoriteContacts(JSON.parse(saved));
                return;
            }
            const { data, error } = await supabase.from('favorite_contacts').select('*').order('order_index', { ascending: true });
            if (error) throw error;
            if (data && data.length > 0) {
                const mapped: FavoriteContact[] = data.map((c: any) => ({
                    id: c.id, name: c.name, phone: c.phone, emoji: c.emoji || '👤',
                }));
                setFavoriteContacts(mapped);
                localStorage.setItem('baraka_favorite_contacts', JSON.stringify(mapped));
            } else {
                const saved = localStorage.getItem('baraka_favorite_contacts');
                if (saved) setFavoriteContacts(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Error fetching contacts:', error);
            const saved = localStorage.getItem('baraka_favorite_contacts');
            if (saved) setFavoriteContacts(JSON.parse(saved));
        }
    }, []);

    const fetchNewMuslims = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                const saved = localStorage.getItem('baraka_new_muslims');
                if (saved) setNewMuslims(JSON.parse(saved));
                return;
            }
            const { data, error } = await supabase.from('new_muslims').select('*').order('created_at', { ascending: false });
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

    const saveContact = async (contact: FavoriteContact) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('favorite_contacts').insert({
                    id: contact.id, user_id: user.id, name: contact.name, phone: contact.phone, emoji: contact.emoji, order_index: favoriteContacts.length,
                });
            }
            setFavoriteContacts(prev => [...prev, contact]);
            localStorage.setItem('baraka_favorite_contacts', JSON.stringify([...favoriteContacts, contact]));
        } catch (error) {
            console.error(error);
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
            id: crypto.randomUUID(), name: newContactName, phone: newContactPhone.replace(/\s/g, ''), emoji: newContactEmoji
        };
        await saveContact(newContact);
        setNewContactName(''); setNewContactPhone(''); setNewContactEmoji('👤'); setShowAddContact(false);
        toast({ title: 'تم إضافة جهة الاتصال ✅' });
    };

    const deleteContact = async (id: string) => {
        setFavoriteContacts(prev => prev.filter(c => c.id !== id));
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) await supabase.from('favorite_contacts').delete().eq('id', id);
        } catch (error) { console.error(error); }
        localStorage.setItem('baraka_favorite_contacts', JSON.stringify(favoriteContacts.filter(c => c.id !== id)));
    };

    // --- Report Generators (Returning ReportData) ---

    const generateDailySummary = (): ReportData => {
        const todayTasks = tasks.filter(t => t.deadline === todayStr);
        const completedTasks = todayTasks.filter(t => t.progress >= 100);
        const todayExpenses = financeData?.pending_expenses?.filter(e => e.timestamp?.startsWith(todayStr)) || [];
        const totalExpenses = todayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

        return {
            title: 'ملخص اليوم',
            sections: [
                { type: 'text', content: `التاريخ: ${today.toLocaleDateString('ar-SA')} | ${hijriDate.split('،')[0]}`, align: 'center' },
                {
                    type: 'table',
                    title: '💰 المالية',
                    headers: ['البند', 'القيمة'],
                    rows: [
                        ['الرصيد', `${financeData?.current_balance_ars?.toLocaleString() || 0}`],
                        ['المصروف', `${totalExpenses.toLocaleString()}`],
                        ['المتبقي', `${dailyLimit?.toLocaleString() || 0}`]
                    ]
                },
                {
                    type: 'table',
                    title: '✅ المهام',
                    headers: ['م', 'المهمة', 'الحالة'],
                    rows: todayTasks.slice(0, 10).map((t, idx) => [
                        (idx + 1).toString(),
                        t.title,
                        t.progress >= 100 ? 'مكتملة' : 'قيد التنفيذ'
                    ])
                },
                {
                    type: 'text',
                    content: `اكتمل: ${completedTasks.length} من ${todayTasks.length}`,
                    align: 'right'
                },
                {
                    type: 'text',
                    content: `🕌 الصلاة القادمة: ${nextPrayer?.nameAr || 'غير متاح'} (${nextPrayer?.time || '--:--'}) - المتبقي: ${timeUntilNext || '--:--'}`,
                    align: 'center'
                }
            ]
        };
    };

    const generateTodayTasks = (): ReportData => {
        const todayTasks = tasks.filter(t => t.deadline === todayStr);
        return {
            title: 'مهام اليوم',
            sections: [
                {
                    type: 'table',
                    headers: ['الحالة', 'المهمة', 'الأهمية'],
                    rows: todayTasks.length > 0 ? todayTasks.map(t => [
                        t.progress >= 100 ? '✓' : '○',
                        t.title,
                        t.priority === 'high' ? 'عالي' : 'عادي'
                    ]) : [['-', 'لا توجد مهام', '-']]
                }
            ]
        };
    };

    const generateWeekTasks = (): ReportData => {
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const weekTasks = tasks.filter(t => {
            const taskDate = new Date(t.deadline);
            return taskDate >= today && taskDate <= weekEnd;
        });

        return {
            title: 'مهام الأسبوع',
            sections: [
                {
                    type: 'table',
                    headers: ['اليوم', 'المهمة', 'الحالة'],
                    rows: weekTasks.length > 0 ? weekTasks.map(t => [
                        new Date(t.deadline).toLocaleDateString('ar-SA', { weekday: 'short' }),
                        t.title,
                        t.progress >= 100 ? '✓' : '○'
                    ]) : [['-', 'لا توجد مهام قادمة', '-']]
                }
            ]
        };
    };

    const generateAppointments = (): ReportData => {
        const upcomingAppts = appointments.filter(a => new Date(a.date) >= today).slice(0, 10);
        return {
            title: 'المواعيد القادمة',
            sections: [
                {
                    type: 'table',
                    headers: ['التاريخ', 'الوقت', 'الموعد'],
                    rows: upcomingAppts.length > 0 ? upcomingAppts.map(a => [
                        new Date(a.date).toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric' }),
                        a.time || '-',
                        a.title
                    ]) : [['-', '-', 'لا توجد مواعيد']]
                }
            ]
        };
    };

    const generateMedications = (): ReportData => {
        const activeMeds = medications.filter(m => m.isPermanent || (m.startDate <= todayStr && (!m.endDate || m.endDate >= todayStr)));
        const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
        const headers = ['الدواء', ...days.map(d => d.substring(0, 1))];

        const rows = activeMeds.map(m => {
            const schedule = days.map(day => {
                if (m.frequency === 'daily') return '✓';
                if (m.frequency === 'specific_days' && m.customDays?.includes(day)) return '✓';
                if (m.frequency === 'weekly' && m.customDays?.includes(day)) return '✓';
                return '.';
            });
            return [m.name, ...schedule];
        });

        return {
            title: 'جدول الأدوية الأسبوعي',
            sections: [
                {
                    type: 'table',
                    headers: headers,
                    rows: rows.length > 0 ? rows : [['-', ...Array(7).fill('.')]]
                },
                {
                    type: 'text',
                    content: 'تفاصيل الجرعات:',
                    align: 'right'
                },
                {
                    type: 'table',
                    headers: ['الدواء', 'الوقت', 'ملاحظات'],
                    rows: activeMeds.map(m => [m.name, m.time || '-', (m as any).notes || '-'])
                }
            ]
        };
    };

    const generateTodayPrayer = (): ReportData => {
        const titles = reportLanguage === 'es'
            ? ['Fajr', 'Shuruq', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
            : prayerTimes.map(p => p.nameAr);

        return {
            title: t('prayerTimesToday', reportLanguage),
            sections: [
                {
                    type: 'table',
                    headers: titles,
                    rows: [prayerTimes.map(p => p.time)]
                }
            ]
        };
    };

    const generateLocations = (): ReportData => {
        let allLocations: any[] = [];
        try {
            const savedLocations = JSON.parse(localStorage.getItem('baraka_resources') || '[]');
            const customLocations = JSON.parse(localStorage.getItem('baraka_custom_locations') || '[]');
            allLocations = [...savedLocations, ...customLocations];
        } catch { }

        return {
            title: 'المواقع المحفوظة',
            sections: [
                {
                    type: 'table',
                    headers: ['الاسم', 'الرابط'],
                    rows: allLocations.length > 0 ? allLocations.map(l => [l.title || l.name, l.url || '-']) : [['-', 'لا توجد مواقع']]
                }
            ]
        };
    };

    const generateShopping = (): ReportData => {
        const pending = shoppingItems.filter(i => !i.completed);
        return {
            title: 'قائمة المشتريات',
            sections: [
                {
                    type: 'table',
                    headers: ['المادة', 'الكمية'],
                    rows: pending.length > 0 ? pending.map(i => [
                        i.text,
                        `${i.quantity || ''} ${i.unit === 'unit' ? '' : i.unit || ''}`.trim() || '-'
                    ]) : [['-', 'تم شراء كل العناصر']]
                }
            ]
        };
    };

    const generateSelectedMuslimsReport = (muslimIds: string[]): ReportData => {
        const selected = newMuslims.filter(m => muslimIds.includes(m.id));
        const sections: any[] = [];

        selected.forEach(m => {
            sections.push({
                type: 'text',
                content: `${t('dataFor', reportLanguage)}: ${m.name}`,
                align: reportLanguage === 'es' ? 'left' : 'right'
            });
            sections.push({
                type: 'table',
                headers: [t('statement', reportLanguage), t('details', reportLanguage)],
                rows: [
                    [t('gender', reportLanguage), m.gender === 'male' ? t('male', reportLanguage) : t('female', reportLanguage)],
                    [t('country', reportLanguage), m.country || '-'],
                    [t('phone', reportLanguage), m.phone || '-'],
                    [t('conversionDate', reportLanguage), m.conversionDate || '-'],
                    [t('stage', reportLanguage), m.stage || '-'],
                    [t('address', reportLanguage), m.address || '-']
                ]
            });
            if (m.notes) {
                sections.push({
                    type: 'text',
                    content: `${t('notes', reportLanguage)}: ${m.notes}`,
                    align: reportLanguage === 'es' ? 'left' : 'right'
                });
            }
            sections.push({ type: 'text', content: ' ', align: 'center' }); // Spacer
        });

        return {
            title: t('newMuslimReport', reportLanguage),
            sections: sections
        };
    };

    const generateSelectedNotesReport = (noteIds: string[]): ReportData => {
        const selected = notesHistory.filter(n => noteIds.includes(n.id));
        const sections: any[] = [];

        selected.forEach((note, idx) => {
            sections.push({
                type: 'text',
                content: `${idx + 1}. ${note.title || 'بدون عنوان'}`,
                align: 'right'
            });
            sections.push({
                type: 'text',
                content: note.content || '',
                align: 'right'
            });
            sections.push({ type: 'text', content: '-------------------', align: 'center' });
        });

        return {
            title: 'تقرير الملاحظات',
            sections: sections
        };
    };

    // --- State Handlers ---

    const selectAllMuslims = () => setSelectedMuslims(newMuslims.map(m => m.id));
    const deselectAllMuslims = () => setSelectedMuslims([]);

    const reportTypes = [
        { id: 'daily', name: 'ملخص اليوم', icon: Sun, generator: generateDailySummary },
        { id: 'todayTasks', name: 'مهام اليوم', icon: CheckSquare, generator: generateTodayTasks },
        { id: 'weekTasks', name: 'مهام الأسبوع', icon: CheckSquare, generator: generateWeekTasks },
        { id: 'appointments', name: 'المواعيد القادمة', icon: Calendar, generator: generateAppointments },
        { id: 'medications', name: 'تقرير الأدوية', icon: Pill, generator: generateMedications },
        { id: 'prayerToday', name: 'أوقات الصلاة - اليوم', icon: Moon, generator: generateTodayPrayer },
        { id: 'locations', name: 'المواقع المحفوظة', icon: MapPin, generator: generateLocations },
        { id: 'shopping', name: 'قائمة المشتريات', icon: ShoppingCart, generator: generateShopping },
        { id: 'notes', name: 'الملاحظات', icon: StickyNote, generator: () => null, needsSelection: true },
        { id: 'newMuslim', name: 'تقرير مسلم جديد', icon: User, generator: () => null, needsSelection: true },
    ];

    const handleSelectReport = (reportId: string) => {
        const report = reportTypes.find(r => r.id === reportId);
        if (report) {

            if (reportId === 'newMuslim' || reportId === 'prayerToday') {
                setReportLanguage('es');
            } else {
                setReportLanguage('ar');
            }

            if (report.id === 'newMuslim') {
                setSelectedMuslims([]); setShowMuslimPicker(true); setSelectedReportId(reportId);
            } else if (report.id === 'notes') {
                setSelectedNotes([]); setShowNotePicker(true); setSelectedReportId(reportId);
            } else {
                setReportData(report.generator());
                setSelectedReportId(reportId);
            }
        }
    };

    const handleMuslimSelection = () => {
        if (selectedMuslims.length === 0) {
            toast({ title: 'اختر مسلماً واحداً على الأقل', variant: 'destructive' });
            return;
        }
        setReportData(generateSelectedMuslimsReport(selectedMuslims));
        setShowMuslimPicker(false);
    };

    const handleNoteSelection = () => {
        if (selectedNotes.length === 0) {
            toast({ title: 'اختر ملاحظة واحدة على الأقل', variant: 'destructive' });
            return;
        }
        setReportData(generateSelectedNotesReport(selectedNotes));
        setShowNotePicker(false);
    };

    const handleSharePDF = async () => {
        if (!reportData) return;
        try {
            await generateGenericPDF(reportData, `Barakah-Report-${Date.now()}.pdf`);
            if ((window as any).Capacitor) {
                // generateGenericPDF handles sharing on mobile
            } else {
                toast({ title: 'تم تحميل ملف PDF ✅' });
            }
        } catch (e) {
            toast({ title: 'خطأ في إنشاء ملف PDF', variant: 'destructive' });
        }
    };

    const resetState = () => {
        setSelectedReportId(null);
        setReportData(null);
        setShowContactPicker(false);
        setShowMuslimPicker(false);
        setSelectedMuslims([]);
        setShowNotePicker(false);
        setSelectedNotes([]);
        setSearchQuery('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => { resetState(); onClose(); }}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setReportLanguage('ar')}
                                className={`px-2 py-1 text-xs rounded-md border ${reportLanguage === 'ar' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'text-gray-500 border-gray-200'}`}
                            >
                                🇰🇼 AR
                            </button>
                            <button
                                onClick={() => setReportLanguage('es')}
                                className={`px-2 py-1 text-xs rounded-md border ${reportLanguage === 'es' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'text-gray-500 border-gray-200'}`}
                            >
                                🇪🇸 ES
                            </button>
                        </div>
                        <DialogTitle className="flex items-center gap-2 text-right">
                            <FileText className="w-5 h-5 text-primary" />
                            إرسال تقرير (PDF)
                        </DialogTitle>
                    </div>
                </DialogHeader>

                {/* Muslim Picker */}
                {showMuslimPicker && (
                    <div className="flex-1 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <Button variant="ghost" size="sm" onClick={() => setShowMuslimPicker(false)}>
                                <ChevronLeft className="w-4 h-4 ml-1" /> رجوع
                            </Button>
                            <span className="text-sm text-gray-500">اختر مسلماً أو أكثر ({newMuslims.length})</span>
                        </div>
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={selectAllMuslims} className="flex-1 text-xs">✅ اختيار الكل</Button>
                            <Button variant="outline" size="sm" onClick={deselectAllMuslims} className="flex-1 text-xs">❌ إلغاء الكل</Button>
                        </div>
                        <div className="flex-1 overflow-y-auto max-h-[45vh] space-y-1">
                            {newMuslims.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase())).map(muslim => (
                                <button key={muslim.id} onClick={() => setSelectedMuslims(prev => prev.includes(muslim.id) ? prev.filter(i => i !== muslim.id) : [...prev, muslim.id])}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-right ${selectedMuslims.includes(muslim.id) ? 'bg-primary/10 border border-primary' : 'hover:bg-gray-50'}`}>
                                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${selectedMuslims.includes(muslim.id) ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                                        {selectedMuslims.includes(muslim.id) && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium truncate">{muslim.name}</p>
                                        <p className="text-xs text-gray-500">{muslim.country}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <Button onClick={handleMuslimSelection} disabled={selectedMuslims.length === 0} className="w-full">إنشاء التقرير</Button>
                    </div>
                )}

                {/* Note Picker */}
                {showNotePicker && (
                    <div className="flex-1 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <Button variant="ghost" size="sm" onClick={() => setShowNotePicker(false)}>
                                <ChevronLeft className="w-4 h-4 ml-1" /> رجوع
                            </Button>
                            <span className="text-sm text-gray-500">اختر ملاحظة ({notesHistory.length})</span>
                        </div>
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" />
                        </div>
                        <div className="flex-1 overflow-y-auto border rounded-xl p-2 space-y-1 bg-gray-50 max-h-[50vh]">
                            {notesHistory.filter(n => (n.title || '').includes(searchQuery)).map((note) => (
                                <div key={note.id} onClick={() => setSelectedNotes(prev => prev.includes(note.id) ? prev.filter(i => i !== note.id) : [...prev, note.id])}
                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${selectedNotes.includes(note.id) ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'}`}>
                                    <Checkbox checked={selectedNotes.includes(note.id)} onCheckedChange={() => { }} />
                                    <div className="flex-1 text-right">
                                        <p className="font-medium text-sm">{note.title || 'بدون عنوان'}</p>
                                        <p className="text-xs text-gray-400 line-clamp-1">{note.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button className="flex-1" onClick={handleNoteSelection}>متابعة ({selectedNotes.length})</Button>
                    </div>
                )}

                {/* Report Generation Preview */}
                {selectedReportId && reportData && !showMuslimPicker && !showNotePicker && (
                    <div className="flex-1 flex flex-col gap-3 h-full overflow-hidden">
                        <Button variant="ghost" size="sm" onClick={resetState} className="self-start">
                            <ChevronLeft className="w-4 h-4 ml-1" /> رجوع للقائمة
                        </Button>

                        {/* Reports Preview - HTML Representation of the PDF */}
                        <div className="flex-1 overflow-y-auto bg-gray-50 border rounded-xl p-4 text-right" dir="rtl">
                            <h2 className="text-xl font-bold text-center text-primary mb-4">{reportData.title}</h2>
                            <div className="space-y-4">
                                {reportData.sections.map((section, idx) => {
                                    if (section.type === 'text') {
                                        return (
                                            <p key={idx} className={`text-sm text-gray-700 whitespace-pre-wrap ${section.align === 'center' ? 'text-center' : (section.align === 'left' ? 'text-left' : 'text-right')
                                                }`}>
                                                {section.content}
                                            </p>
                                        );
                                    } else if (section.type === 'table') {
                                        return (
                                            <div key={idx} className="mt-2">
                                                {section.title && <h3 className="font-bold text-sm mb-1 text-primary">{section.title}</h3>}
                                                <div className="overflow-x-auto rounded-lg border border-gray-200">
                                                    <table className="w-full text-xs">
                                                        <thead className="bg-primary/10">
                                                            <tr>
                                                                {section.headers.map((h, i) => (
                                                                    <th key={i} className="p-2 border-l last:border-l-0 border-gray-200 font-bold text-primary">{h}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {section.rows.map((row, rIdx) => (
                                                                <tr key={rIdx} className="border-t border-gray-200 even:bg-gray-50">
                                                                    {row.map((cell, cIdx) => (
                                                                        <td key={cIdx} className="p-2 border-l last:border-l-0 border-gray-200">{cell}</td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={handleSharePDF} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                                <Share2 className="w-4 h-4 ml-2" />
                                مشاركة / تحميل PDF
                            </Button>
                        </div>
                    </div>
                )}

                {/* Report List */}
                {!selectedReportId && !showMuslimPicker && !showNotePicker && (
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
                                </button>
                            );
                        })}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ReportGenerator;
