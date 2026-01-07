import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, CheckSquare, StickyNote, Users, Calculator, GraduationCap, Settings, Link as LinkIcon } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useQuickNotes } from '@/hooks/useQuickNotes';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AcademicService } from '@/services/AcademicService';

interface SearchResult {
    id: string;
    type: 'task' | 'note' | 'student' | 'finance' | 'academic' | 'setting';
    title: string;
    subtitle: string;
    date?: string;
    icon?: React.ReactNode;
    onClick: () => void;
}

interface GlobalSearchDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigateToTab?: (tab: string) => void;
    onOpenNewMuslims?: () => void;
    onOpenAcademic?: () => void;
}

const FINANCE_TABLE = 'finance_data_2025_12_18_18_42';

export const GlobalSearchDialog: React.FC<GlobalSearchDialogProps> = ({ isOpen, onClose, onNavigateToTab, onOpenNewMuslims, onOpenAcademic }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Hooks
    const { tasks } = useTasks();
    const { notesHistory } = useQuickNotes();
    const navigate = useNavigate();

    // Data fetching (From LocalStorage for mobile performance)
    const [students, setStudents] = useState<any[]>([]);
    const [muslimAppointments, setMuslimAppointments] = useState<any[]>([]);
    const [generalAppointments, setGeneralAppointments] = useState<any[]>([]);

    useEffect(() => {
        if (!isOpen) return;
        try {
            const storedStudents = localStorage.getItem('newmuslims_students');
            if (storedStudents) setStudents(JSON.parse(storedStudents));

            const storedApts = localStorage.getItem('newmuslims_appointments');
            if (storedApts) setMuslimAppointments(JSON.parse(storedApts));

            const storedGeneralApts = localStorage.getItem('baraka_appointments');
            if (storedGeneralApts) setGeneralAppointments(JSON.parse(storedGeneralApts));
        } catch (e) { console.error(e); }
    }, [isOpen]);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const debounceSearch = setTimeout(async () => {
            setIsSearching(true);
            const lowerQuery = query.toLowerCase().trim();
            const newResults: SearchResult[] = [];

            // 1. Local Data Search (Sync)

            // Tasks
            tasks.forEach(task => {
                if (task.title.toLowerCase().includes(lowerQuery) || task.description?.toLowerCase().includes(lowerQuery)) {
                    newResults.push({
                        id: task.id,
                        type: 'task',
                        title: task.title,
                        subtitle: task.description || 'مهمة',
                        date: task.deadline,
                        icon: <CheckSquare className="w-4 h-4" />,
                        onClick: () => {
                            if (onNavigateToTab) onNavigateToTab('dashboard');
                            onClose();
                        }
                    });
                }
            });

            // Appointments
            const allApts = [...muslimAppointments, ...generalAppointments];
            allApts.forEach(apt => {
                if (apt.title?.toLowerCase().includes(lowerQuery) || apt.notes?.toLowerCase().includes(lowerQuery)) {
                    newResults.push({
                        id: apt.id,
                        type: 'task', // Use task/calendar icon
                        title: `📅 ${apt.title}`,
                        subtitle: apt.notes || 'موعد',
                        date: apt.date,
                        icon: <CheckSquare className="w-4 h-4" />,
                        onClick: () => {
                            onClose();
                            const isMuslimApt = muslimAppointments.some(ma => ma.id === apt.id);
                            if (isMuslimApt && onOpenNewMuslims) onOpenNewMuslims();
                            else if (onNavigateToTab) onNavigateToTab('dashboard'); // Or calendar if specific logic added
                        }
                    });
                }
            });

            // Notes
            notesHistory.forEach((note, idx) => {
                if (note.content.toLowerCase().includes(lowerQuery)) {
                    newResults.push({
                        id: `note-${idx}`,
                        type: 'note',
                        title: note.content.split('\n')[0].substring(0, 30),
                        subtitle: note.content.substring(0, 50).replace(/\n/g, ' '),
                        date: note.createdAt,
                        icon: <StickyNote className="w-4 h-4" />,
                        onClick: () => {
                            if (onNavigateToTab) onNavigateToTab('dashboard'); // Or productivity if notes moved there
                            onClose();
                        }
                    });
                }
            });

            // Students (New Muslims)
            students.forEach(student => {
                const matchesName = student.fullName?.toLowerCase().includes(lowerQuery) ||
                    student.arabicName?.toLowerCase().includes(lowerQuery) ||
                    student.name?.toLowerCase().includes(lowerQuery);
                const matchesNotes = student.notes?.toLowerCase().includes(lowerQuery);
                const matchesPhone = student.phone?.includes(query);

                if (matchesName || matchesNotes || matchesPhone) {
                    newResults.push({
                        id: student.id,
                        type: 'student',
                        title: student.fullName || student.arabicName || student.name || 'مجهول',
                        subtitle: student.phone || 'طالب جديد',
                        date: student.date,
                        icon: <Users className="w-4 h-4" />,
                        onClick: () => {
                            onClose();
                            if (onOpenNewMuslims) onOpenNewMuslims();
                        }
                    });
                }
            });

            // Settings/Pages (Static)
            const staticPages = [
                { id: 'settings', title: 'الإعدادات', tab: 'settings', keywords: ['settings', 'config', 'اعدادات', 'ضبط'] },
                { id: 'finance', title: 'المالية والمصاريف', tab: 'finance', keywords: ['money', 'expense', 'malia', 'مالية', 'فلوس'] },
                { id: 'academic', title: 'القسم الأكاديمي', action: 'academic', keywords: ['academic', 'research', 'bahth', 'بحث', 'اكاديمي'] },
                { id: 'newmuslims', title: 'المهتدين الجدد', action: 'newmuslims', keywords: ['new', 'muslims', 'student', 'students', 'طلاب', 'مهتدين'] },
            ];

            staticPages.forEach(page => {
                if (page.title.includes(query) || page.keywords.some(k => k.includes(lowerQuery))) {
                    newResults.push({
                        id: page.id,
                        type: 'setting',
                        title: page.title,
                        subtitle: 'قسم / إعدادات',
                        icon: page.id === 'settings' ? <Settings className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />,
                        onClick: () => {
                            onClose();
                            if (page.tab && onNavigateToTab) onNavigateToTab(page.tab);
                            if (page.action === 'academic' && onOpenAcademic) onOpenAcademic();
                            if (page.action === 'newmuslims' && onOpenNewMuslims) onOpenNewMuslims();
                        }
                    });
                }
            });


            // 2. Async Data Search (Supabase)
            try {
                // Finance Search
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    // We need to fetch the JSON column 'pending_expenses' from the finance table
                    // Since it's JSON array, we can't easily search inside it with simple SQL 'like' on the column
                    // efficiently without exact structure. However, user usually has one row per user.
                    // We fetch the row and filter client side for the 'transactions'.

                    const { data: financeRow } = await supabase
                        .from(FINANCE_TABLE)
                        .select('pending_expenses')
                        .eq('user_id', user.id)
                        .single();

                    if (financeRow && financeRow.pending_expenses && Array.isArray(financeRow.pending_expenses)) {
                        financeRow.pending_expenses.forEach((tx: any) => {
                            if (tx.description?.toLowerCase().includes(lowerQuery) || tx.category?.toLowerCase().includes(lowerQuery)) {
                                newResults.push({
                                    id: `tx-${tx.id}`,
                                    type: 'finance',
                                    title: `${tx.type === 'expense' ? '💸' : '💰'} ${tx.description}`,
                                    subtitle: `${tx.amount} ${tx.currency} - ${tx.category}`,
                                    date: tx.timestamp,
                                    icon: <Calculator className="w-4 h-4" />,
                                    onClick: () => {
                                        if (onNavigateToTab) onNavigateToTab('finance');
                                        onClose();
                                    }
                                });
                            }
                        });
                    }
                }

                // Academic Search
                const academicResults = await AcademicService.globalSearch(lowerQuery);
                academicResults.forEach(res => {
                    newResults.push({
                        id: `academic-${res.id}`,
                        type: 'academic',
                        title: res.title,
                        subtitle: res.context,
                        icon: <GraduationCap className="w-4 h-4" />,
                        onClick: () => {
                            if (onOpenAcademic) onOpenAcademic();
                            // Logic to open specific chapter could be added here if AcademicManager supports it via props/context
                            onClose();
                        }
                    });
                });

            } catch (err) {
                console.error("Async search error", err);
            }

            setResults(newResults);
            setIsSearching(false);
        }, 500); // 500ms debounce

        return () => clearTimeout(debounceSearch);
    }, [query, tasks, notesHistory, students, muslimAppointments]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden bg-white">
                <div className="p-4 border-b flex items-center gap-3 bg-gray-50/80 backdrop-blur">
                    <Search className="w-5 h-5 text-gray-400" />
                    <Input
                        placeholder="ابحث في المهام، الملاحظات، المالية، الأكاديمية..."
                        className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-lg placeholder:text-gray-400"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    {isSearching && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>}
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {results.length === 0 && !query.trim() && (
                        <div className="text-center py-12 text-gray-500 space-y-4">
                            <div className="flex justify-center gap-4 opacity-50 mb-4">
                                <CheckSquare className="w-8 h-8 text-blue-400" />
                                <Calculator className="w-8 h-8 text-emerald-400" />
                                <GraduationCap className="w-8 h-8 text-purple-400" />
                            </div>
                            <p className="font-bold text-lg text-gray-700">البحث الشامل الذكي 🚀</p>
                            <p className="text-sm text-gray-400 max-w-[80%] mx-auto leading-relaxed">
                                ابحث في كل مكان: المعاملات المالية، المحتوى الأكاديمي، المهام، الملاحظات، والطلاب.
                            </p>
                        </div>
                    )}

                    {results.length === 0 && query.trim() && !isSearching && (
                        <div className="text-center py-8 text-gray-400 flex flex-col items-center gap-2">
                            <Search className="w-8 h-8 opacity-20" />
                            <p>لا توجد نتائج مطابقة</p>
                        </div>
                    )}

                    {results.length > 0 && (
                        <div className="space-y-1">
                            {results.map((result) => (
                                <div
                                    key={`${result.type}-${result.id}`}
                                    onClick={result.onClick}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 cursor-pointer transition-all duration-200 group"
                                >
                                    <div className={`p-2.5 rounded-full transition-colors ${result.type === 'task' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-100' :
                                            result.type === 'note' ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-100' :
                                                result.type === 'student' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' :
                                                    result.type === 'finance' ? 'bg-red-50 text-red-600 group-hover:bg-red-100' :
                                                        result.type === 'academic' ? 'bg-purple-50 text-purple-600 group-hover:bg-purple-100' :
                                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                        {result.icon}
                                    </div>
                                    <div className="flex-1 min-w-0 text-right">
                                        <h4 className="font-bold text-sm text-gray-900 truncate group-hover:text-primary transition-colors">{result.title}</h4>
                                        <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                                    </div>
                                    {result.date && (
                                        <div className="text-[10px] text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-1 rounded-md">
                                            {new Date(result.date).toLocaleDateString('ar-EG')}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
