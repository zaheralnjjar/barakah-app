import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, CheckSquare, StickyNote, Users, ArrowLeft } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useQuickNotes } from '@/hooks/useQuickNotes';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
    id: string;
    type: 'task' | 'note' | 'student';
    title: string;
    subtitle: string;
    date?: string;
    onClick: () => void;
}

interface GlobalSearchDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigateToTab?: (tab: string) => void;
    onOpenNewMuslims?: () => void;
    onOpenAcademic?: () => void;
}

export const GlobalSearchDialog: React.FC<GlobalSearchDialogProps> = ({ isOpen, onClose, onNavigateToTab, onOpenNewMuslims, onOpenAcademic }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);

    // Hooks
    const { tasks } = useTasks();
    const { notesHistory } = useQuickNotes();
    const navigate = useNavigate();

    // Data fetching (From LocalStorage for mobile performance and consistency with NewMuslimsManager)
    const [students, setStudents] = useState<any[]>([]);
    const [muslimAppointments, setMuslimAppointments] = useState<any[]>([]);
    const [generalAppointments, setGeneralAppointments] = useState<any[]>([]);

    useEffect(() => {
        if (!isOpen) return;

        try {
            // Correct keys from NewMuslimsManager
            const storedStudents = localStorage.getItem('newmuslims_students');
            if (storedStudents) setStudents(JSON.parse(storedStudents));

            const storedApts = localStorage.getItem('newmuslims_appointments');
            if (storedApts) setMuslimAppointments(JSON.parse(storedApts));

            const storedGeneralApts = localStorage.getItem('baraka_appointments');
            if (storedGeneralApts) setGeneralAppointments(JSON.parse(storedGeneralApts));
        } catch (e) {
            console.error(e);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const newResults: SearchResult[] = [];

        // 1. Search Tasks
        tasks.forEach(task => {
            if (task.title.toLowerCase().includes(lowerQuery) || task.description?.toLowerCase().includes(lowerQuery)) {
                newResults.push({
                    id: task.id,
                    type: 'task',
                    title: task.title,
                    subtitle: task.description || 'مهمة',
                    date: task.deadline,
                    onClick: () => {
                        if (onNavigateToTab) onNavigateToTab('dashboard'); // Tasks are on dashboard
                        onClose();
                    }
                });
            }
        });

        // 2. Search Appointments (New Muslims & General)
        const allApts = [...muslimAppointments, ...generalAppointments];
        allApts.forEach(apt => {
            if (apt.title?.toLowerCase().includes(lowerQuery) || apt.notes?.toLowerCase().includes(lowerQuery)) {
                newResults.push({
                    id: apt.id,
                    type: 'task', // Reusing task icon/style for simplicity
                    title: `📅 ${apt.title}`,
                    subtitle: apt.notes || 'موعد',
                    date: apt.date,
                    onClick: () => {
                        onClose();
                        // If it's a muslim appointment, open that section. If general, just dashboard for now.
                        const isMuslimApt = muslimAppointments.some(ma => ma.id === apt.id);
                        if (isMuslimApt && onOpenNewMuslims) {
                            onOpenNewMuslims();
                        } else if (onNavigateToTab) {
                            onNavigateToTab('dashboard');
                        }
                    }
                });
            }
        });

        // 3. Search Notes
        notesHistory.forEach((note, idx) => {
            if (note.content.toLowerCase().includes(lowerQuery)) {
                newResults.push({
                    id: `note-${idx}`,
                    type: 'note',
                    title: note.content.split('\n')[0].substring(0, 30),
                    subtitle: note.content.substring(0, 50).replace(/\n/g, ' '),
                    date: note.createdAt,
                    onClick: () => {
                        if (onNavigateToTab) onNavigateToTab('dashboard');
                        onClose();
                    }
                });
            }
        });

        // 4. Search Students (New Muslims) - Using correct "fullName" and "arabicName"
        students.forEach(student => {
            const matchesName = student.fullName?.toLowerCase().includes(lowerQuery) ||
                student.arabicName?.toLowerCase().includes(lowerQuery) ||
                student.name?.toLowerCase().includes(lowerQuery); // Fallback

            const matchesNotes = student.notes?.toLowerCase().includes(lowerQuery);
            const matchesPhone = student.phone?.includes(query);

            if (matchesName || matchesNotes || matchesPhone) {
                newResults.push({
                    id: student.id,
                    type: 'student',
                    title: student.fullName || student.arabicName || student.name || 'مجهول',
                    subtitle: student.phone || 'طالب جديد',
                    date: student.date,
                    onClick: () => {
                        onClose();
                        if (onOpenNewMuslims) onOpenNewMuslims();
                    }
                });
            }
        });

        setResults(newResults);

    }, [query, tasks, notesHistory, students, muslimAppointments]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
                <div className="p-4 border-b flex items-center gap-3 bg-gray-50">
                    <Search className="w-5 h-5 text-gray-400" />
                    <Input
                        placeholder="ابحث في المهام، الملاحظات، الطلاب..."
                        className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-lg"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {results.length === 0 && !query.trim() && (
                        <div className="text-center py-8 text-gray-500 space-y-2">
                            <p className="font-bold">البحث الشامل الذكي 🚀</p>
                            <p className="text-sm text-gray-400 max-w-[80%] mx-auto leading-relaxed">
                                يمكنك البحث عن أي شيء في التطبيق:
                                <br />• عناوين ومحتوى المهام
                                <br />• الملاحظات السريعة
                                <br />• أسماء وبيانات الطلاب والمهتدين الجدد
                            </p>
                        </div>
                    )}

                    {results.length === 0 && query.trim() && (
                        <div className="text-center py-8 text-gray-400">
                            لا توجد نتائج
                        </div>
                    )}

                    {results.length > 0 && (
                        <div className="space-y-1">
                            {results.map((result) => (
                                <div
                                    key={`${result.type}-${result.id}`}
                                    onClick={result.onClick}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                                >
                                    <div className={`p-2 rounded-full ${result.type === 'task' ? 'bg-blue-100 text-blue-600' :
                                        result.type === 'note' ? 'bg-amber-100 text-amber-600' :
                                            'bg-emerald-100 text-emerald-600'
                                        }`}>
                                        {result.type === 'task' && <CheckSquare className="w-4 h-4" />}
                                        {result.type === 'note' && <StickyNote className="w-4 h-4" />}
                                        {result.type === 'student' && <Users className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0 text-right">
                                        <h4 className="font-medium text-sm text-gray-900 truncate">{result.title}</h4>
                                        <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                                    </div>
                                    {result.date && (
                                        <div className="text-[10px] text-gray-400 whitespace-nowrap">
                                            {new Date(result.date).toLocaleDateString('ar-EG')}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {!query.trim() && (
                        <div className="p-4 text-center">
                            <p className="text-sm text-gray-400">ابحث عن أي شيء...</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
