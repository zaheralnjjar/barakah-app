import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, StickyNote, Users, Settings, Link as LinkIcon, Calendar } from 'lucide-react';
import { useHidayaNotes } from '@/hooks/useHidayaNotes';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
    id: string;
    type: 'note' | 'student' | 'setting' | 'appointment';
    title: string;
    subtitle: string;
    date?: string;
    icon?: React.ReactNode;
    onClick: () => void;
}

interface HidayaGlobalSearchDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigateToTab?: (tab: string) => void;
    onOpenNewMuslims?: () => void;
}

export const HidayaGlobalSearchDialog: React.FC<HidayaGlobalSearchDialogProps> = ({ isOpen, onClose, onNavigateToTab, onOpenNewMuslims }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const { notesHistory } = useHidayaNotes();
    const navigate = useNavigate();

    const [students, setStudents] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);

    useEffect(() => {
        if (!isOpen) return;
        try {
            const storedStudents = localStorage.getItem('newmuslims_students');
            if (storedStudents) setStudents(JSON.parse(storedStudents));

            // Load appointments (both student-linked and general)
            const storedMuslimApts = localStorage.getItem('newmuslims_appointments');
            const storedGeneralApts = localStorage.getItem('hidaya_appointments_cache');

            let allApts: any[] = [];
            if (storedMuslimApts) allApts = [...allApts, ...JSON.parse(storedMuslimApts)];
            if (storedGeneralApts) allApts = [...allApts, ...JSON.parse(storedGeneralApts)];

            setAppointments(allApts);
        } catch (e) { console.error(e); }
    }, [isOpen]);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const debounceSearch = setTimeout(() => {
            setIsSearching(true);
            const lowerQuery = query.toLowerCase().trim();
            const newResults: SearchResult[] = [];

            // 1. Appointments
            appointments.forEach(apt => {
                if (apt.title?.toLowerCase().includes(lowerQuery) || apt.notes?.toLowerCase().includes(lowerQuery)) {
                    newResults.push({
                        id: apt.id,
                        type: 'appointment',
                        title: `📅 ${apt.title}`,
                        subtitle: apt.notes || 'موعد',
                        date: apt.date,
                        icon: <Calendar className="w-4 h-4" />,
                        onClick: () => {
                            onClose();
                            if (onOpenNewMuslims) onOpenNewMuslims();
                            // Or navigate to calendar/appointments if implemented
                        }
                    });
                }
            });

            // 2. Notes
            notesHistory.forEach((note, idx) => {
                if (note.content.toLowerCase().includes(lowerQuery)) {
                    newResults.push({
                        id: note.id || `note-${idx}`,
                        type: 'note',
                        title: note.title || note.content.split('\n')[0].substring(0, 30),
                        subtitle: note.content.substring(0, 50).replace(/\n/g, ' '),
                        date: note.createdAt,
                        icon: <StickyNote className="w-4 h-4" />,
                        onClick: () => {
                            onClose();
                            if (onNavigateToTab) onNavigateToTab('notes'); // Assuming there's a notes tab or dashboard
                        }
                    });
                }
            });

            // 3. Students (New Muslims)
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

            setResults(newResults);
            setIsSearching(false);
        }, 500);

        return () => clearTimeout(debounceSearch);
    }, [query, notesHistory, students, appointments]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden bg-white">
                <div className="p-4 border-b flex items-center gap-3 bg-gray-50/80 backdrop-blur">
                    <Search className="w-5 h-5 text-gray-400" />
                    <Input
                        placeholder="بحث في الطلاب، المواعيد، الملاحظات..."
                        className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-lg placeholder:text-gray-400"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    {isSearching && <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>}
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {results.length === 0 && query.trim() && !isSearching && (
                        <div className="text-center py-8 text-gray-400 flex flex-col items-center gap-2">
                            <Search className="w-8 h-8 opacity-20" />
                            <p>لا توجد نتائج</p>
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
                                    <div className={`p-2.5 rounded-full transition-colors ${result.type === 'note' ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-100' :
                                            result.type === 'student' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' :
                                                result.type === 'appointment' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-100' :
                                                    'bg-gray-100 text-gray-600'
                                        }`}>
                                        {result.icon}
                                    </div>
                                    <div className="flex-1 min-w-0 text-right">
                                        <h4 className="font-bold text-sm text-gray-900 truncate group-hover:text-primary transition-colors">{result.title}</h4>
                                        <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
