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
}

export const GlobalSearchDialog: React.FC<GlobalSearchDialogProps> = ({ isOpen, onClose, onNavigateToTab }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);

    // Hooks
    const { tasks } = useTasks();
    const { notesHistory } = useQuickNotes();
    const navigate = useNavigate();

    // Students Data (From LocalStorage for now as per current NewMuslimsManager implementation)
    const [students, setStudents] = useState<any[]>([]);
    useEffect(() => {
        try {
            const stored = localStorage.getItem('my_new_muslims_data');
            if (stored) setStudents(JSON.parse(stored));
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
                        if (onNavigateToTab) onNavigateToTab('dashboard'); // Tasks are usually on dashboard or specific tab
                        onClose();
                    }
                });
            }
        });

        // 2. Search Notes
        notesHistory.forEach((note, idx) => {
            if (note.content.toLowerCase().includes(lowerQuery)) {
                newResults.push({
                    id: `note-${idx}`,
                    type: 'note',
                    title: note.content.split('\n')[0].substring(0, 30),
                    subtitle: note.content.substring(0, 50).replace(/\n/g, ' '),
                    date: note.createdAt,
                    onClick: () => {
                        // Notes are on dashboard, might need a way to auto-open specific note
                        if (onNavigateToTab) onNavigateToTab('dashboard');
                        onClose();
                    }
                });
            }
        });

        // 3. Search Students (New Muslims)
        students.forEach(student => {
            if (student.name.toLowerCase().includes(lowerQuery) || student.notes?.toLowerCase().includes(lowerQuery)) {
                newResults.push({
                    id: student.id,
                    type: 'student',
                    title: student.name,
                    subtitle: student.phone || 'طالب جديد',
                    date: student.date,
                    onClick: () => {
                        if (onNavigateToTab) onNavigateToTab('newmuslims'); // Use tab ID from Index.tsx
                        onClose();
                    }
                });
            }
        });

        setResults(newResults);

    }, [query, tasks, notesHistory, students]);

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
