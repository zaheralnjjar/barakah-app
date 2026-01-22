import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export type NoteType = 'quick' | 'main' | 'voice';

export interface NoteData {
    id: string;
    title?: string;
    content: string;
    type: NoteType;
    isSecure?: boolean;
    isPinned?: boolean;
    folderId?: string;
    tags?: string[];
    createdAt?: string;
    updatedAt?: string;
}

export interface NoteFolder {
    id: string;
    name: string;
    color: string;
    icon: string;
    orderIndex: number;
}

// Rotating colors for note entries
const NOTE_COLORS = ['🔵', '🟢', '🟡', '🟠', '🔴', '🟣', '⚪'];

const getNextColor = (existingContent: string): string => {
    const separatorCount = (existingContent.match(/━━━━━━━━━━━━━━━━━━━━━━/g) || []).length;
    return NOTE_COLORS[separatorCount % NOTE_COLORS.length];
};

export const useQuickNotes = () => {
    const { toast } = useToast();
    const [notesHistory, setNotesHistory] = useState<NoteData[]>([]);
    const [folders, setFolders] = useState<NoteFolder[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch notes from Supabase
    const fetchNotes = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // Fallback to localStorage for non-authenticated users
                const local = localStorage.getItem('baraka_notes_history');
                if (local) setNotesHistory(JSON.parse(local));
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('quick_notes')
                .select('*')
                .order('is_pinned', { ascending: false })
                .order('updated_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const mapped: NoteData[] = data.map((n: any) => ({
                    id: n.id,
                    title: n.title,
                    content: n.content || '',
                    type: 'quick' as NoteType,
                    isSecure: false,
                    isPinned: n.is_pinned,
                    folderId: n.folder_id,
                    tags: n.tags,
                    createdAt: n.created_at,
                    updatedAt: n.updated_at,
                }));
                setNotesHistory(mapped);
                // Keep localStorage in sync for offline
                localStorage.setItem('baraka_notes_history', JSON.stringify(mapped));
            }
        } catch (error) {
            console.error('Error fetching notes:', error);
            // Fallback to localStorage
            const local = localStorage.getItem('baraka_notes_history');
            if (local) setNotesHistory(JSON.parse(local));
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch folders
    const fetchFolders = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('note_folders')
                .select('*')
                .order('order_index', { ascending: true });

            if (error) throw error;

            if (data) {
                const mapped: NoteFolder[] = data.map((f: any) => ({
                    id: f.id,
                    name: f.name,
                    color: f.color,
                    icon: f.icon,
                    orderIndex: f.order_index,
                }));
                setFolders(mapped);
            }
        } catch (error) {
            console.error('Error fetching folders:', error);
        }
    }, []);

    useEffect(() => {
        fetchNotes();
        fetchFolders();

        // Realtime subscription
        const channel = supabase
            .channel('quick_notes_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'quick_notes' }, () => {
                fetchNotes();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchNotes, fetchFolders]);

    // Add new note
    const addNote = async (content: string, type: NoteType = 'quick', title?: string, isSecure = false, folderId?: string) => {
        if (!content.trim() && !title?.trim()) return;

        const newNote: NoteData = {
            id: crypto.randomUUID(),
            title,
            content,
            type,
            isSecure,
            isPinned: false,
            folderId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Optimistic update
        setNotesHistory(prev => [newNote, ...prev]);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('quick_notes').insert({
                    id: newNote.id,
                    user_id: user.id,
                    title: newNote.title || 'ملاحظة',
                    content: newNote.content,
                    is_pinned: false,
                    folder_id: newNote.folderId || null,
                    tags: newNote.tags || [],
                });
            }
            toast({ title: 'تم حفظ الملاحظة ✅' });
        } catch (error) {
            console.error('Error adding note:', error);
            // Keep local only
            localStorage.setItem('baraka_notes_history', JSON.stringify([newNote, ...notesHistory]));
        }
    };

    // Legacy support
    const saveNote = async (note: string) => {
        await addNote(note, 'quick');
    };

    const archiveNote = (note: string, isSecure = false) => {
        addNote(note, 'quick', undefined, isSecure);
    };

    // Update note by ID
    const updateNoteById = async (id: string, updates: Partial<NoteData>) => {
        const index = notesHistory.findIndex(n => n.id === id);
        if (index === -1) return;

        const updated = [...notesHistory];
        updated[index] = { ...updated[index], ...updates, updatedAt: new Date().toISOString() };
        setNotesHistory(updated);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('quick_notes').update({
                    title: updates.title,
                    content: updates.content,
                    is_pinned: updates.isPinned,
                    folder_id: updates.folderId,
                    tags: updates.tags,
                }).eq('id', id);
            }
        } catch (error) {
            console.error('Error updating note:', error);
        }
    };

    // Legacy update by index
    const updateNote = (index: number, content: string, title?: string) => {
        if (index < 0 || index >= notesHistory.length) return;
        const note = notesHistory[index];
        if (note) {
            updateNoteById(note.id, { content, title });
        }
    };

    // Delete note
    const deleteNoteById = async (id: string) => {
        setNotesHistory(prev => prev.filter(n => n.id !== id));

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('quick_notes').delete().eq('id', id);
            }
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    };

    // Legacy delete by index
    const deleteHistoryItem = (index: number) => {
        const note = notesHistory[index];
        if (note) {
            deleteNoteById(note.id);
        }
    };

    // Toggle secure
    const toggleSecure = (index: number) => {
        const updated = [...notesHistory];
        if (updated[index]) {
            updated[index].isSecure = !updated[index].isSecure;
            setNotesHistory(updated);
            toast({ title: updated[index].isSecure ? 'تم القفل 🔒' : 'تم إلغاء القفل 🔓' });
        }
    };

    // Toggle pin
    const togglePin = async (noteIndex: number) => {
        if (noteIndex < 0 || noteIndex >= notesHistory.length) return;
        const note = notesHistory[noteIndex];
        const newPinState = !note.isPinned;

        const updated = [...notesHistory];
        updated[noteIndex] = { ...updated[noteIndex], isPinned: newPinState };
        // Re-sort: pinned first
        updated.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return 0;
        });
        setNotesHistory(updated);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('quick_notes').update({ is_pinned: newPinState }).eq('id', note.id);
            }
        } catch (error) {
            console.error('Error toggling pin:', error);
        }
    };

    // Append to Activities note
    const appendToActivitiesNote = async (text: string) => {
        const timestamp = new Date().toLocaleString('ar-SA', {
            dateStyle: 'short',
            timeStyle: 'short',
        });

        const activitiesNote = notesHistory.find(
            n => n.title === 'أنشطة' || n.content.startsWith('أنشطة\n') || n.content.startsWith('أنشطة:')
        );

        if (activitiesNote) {
            const color = getNextColor(activitiesNote.content);
            const separator = '\n━━━━━━━━━━━━━━━━━━━━━━\n';
            const entry = `${separator}${color} [${timestamp}]\n${text}`;
            const newContent = activitiesNote.content + entry;

            await updateNoteById(activitiesNote.id, { content: newContent });
        } else {
            const color = NOTE_COLORS[0];
            const entry = `${color} [${timestamp}] ${text}`;
            await addNote(`أنشطة:\n${entry}`, 'quick', 'أنشطة');
        }
    };

    // Append to specific note
    const appendToNote = async (noteIndex: number, text: string) => {
        if (noteIndex < 0 || noteIndex >= notesHistory.length) return;
        const timestamp = new Date().toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' });
        const existing = notesHistory[noteIndex];
        const color = getNextColor(existing.content);
        const separator = '\n━━━━━━━━━━━━━━━━━━━━━━\n';
        const entry = `${separator}${color} [${timestamp}]\n${text}`;

        await updateNoteById(existing.id, { content: existing.content + entry });
    };

    // Folder management
    const addFolder = async (name: string, color = '#4ade80', icon = 'folder') => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase.from('note_folders').insert({
                user_id: user.id,
                name,
                color,
                icon,
                order_index: folders.length,
            }).select().single();

            if (error) throw error;
            if (data) {
                setFolders(prev => [...prev, {
                    id: data.id,
                    name: data.name,
                    color: data.color,
                    icon: data.icon,
                    orderIndex: data.order_index,
                }]);
            }
        } catch (error) {
            console.error('Error adding folder:', error);
        }
    };

    const deleteFolder = async (id: string) => {
        setFolders(prev => prev.filter(f => f.id !== id));
        try {
            await supabase.from('note_folders').delete().eq('id', id);
        } catch (error) {
            console.error('Error deleting folder:', error);
        }
    };

    // ============================================================
    // ADVANCED FEATURES
    // ============================================================

    // Search notes
    const searchNotes = async (query: string) => {
        if (!query.trim()) {
            await fetchNotes();
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('quick_notes')
                .select('*')
                .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
                .order('updated_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const mapped: NoteData[] = data.map((n: any) => ({
                    id: n.id,
                    title: n.title,
                    content: n.content || '',
                    type: 'quick' as NoteType,
                    isSecure: n.is_locked,
                    isPinned: n.is_pinned,
                    folderId: n.folder_id,
                    tags: n.tags,
                    createdAt: n.created_at,
                    updatedAt: n.updated_at,
                }));
                setNotesHistory(mapped);
            }
        } catch (error) {
            console.error('Error searching notes:', error);
        }
    };

    // Lock note
    const lockNote = async (noteId: string, pin: string) => {
        try {
            // Simple hash for PIN (in production, use bcrypt)
            const hashedPin = btoa(pin);

            await supabase
                .from('quick_notes')
                .update({ is_locked: true, lock_pin: hashedPin })
                .eq('id', noteId);

            setNotesHistory(prev => prev.map(n =>
                n.id === noteId ? { ...n, isSecure: true } : n
            ));

            toast({ title: 'تم قفل الملاحظة 🔒' });
        } catch (error) {
            console.error('Error locking note:', error);
            toast({ title: 'خطأ في قفل الملاحظة', variant: 'destructive' });
        }
    };

    // Unlock note
    const unlockNote = async (noteId: string, pin: string): Promise<boolean> => {
        try {
            const { data } = await supabase
                .from('quick_notes')
                .select('lock_pin')
                .eq('id', noteId)
                .single();

            if (!data) return false;

            const hashedPin = btoa(pin);
            if (hashedPin !== data.lock_pin) {
                toast({ title: 'رقم سري خاطئ ❌', variant: 'destructive' });
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error unlocking note:', error);
            return false;
        }
    };

    // Add tag to note
    const addTag = async (noteId: string, tag: string) => {
        try {
            const note = notesHistory.find(n => n.id === noteId);
            if (!note) return;

            const currentTags = note.tags || [];
            if (currentTags.includes(tag)) return;

            const newTags = [...currentTags, tag];

            await supabase
                .from('quick_notes')
                .update({ tags: newTags })
                .eq('id', noteId);

            setNotesHistory(prev => prev.map(n =>
                n.id === noteId ? { ...n, tags: newTags } : n
            ));

            toast({ title: 'تم إضافة الوسم ✅' });
        } catch (error) {
            console.error('Error adding tag:', error);
        }
    };

    // Remove tag from note
    const removeTag = async (noteId: string, tag: string) => {
        try {
            const note = notesHistory.find(n => n.id === noteId);
            if (!note) return;

            const newTags = (note.tags || []).filter(t => t !== tag);

            await supabase
                .from('quick_notes')
                .update({ tags: newTags })
                .eq('id', noteId);

            setNotesHistory(prev => prev.map(n =>
                n.id === noteId ? { ...n, tags: newTags } : n
            ));

            toast({ title: 'تم حذف الوسم ✅' });
        } catch (error) {
            console.error('Error removing tag:', error);
        }
    };

    // Export note to TXT
    const exportNoteToTXT = (noteId: string) => {
        const note = notesHistory.find(n => n.id === noteId);
        if (!note) return;

        const content = `${note.title || 'ملاحظة'}\n\n${note.content}`;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${note.title || 'note'}.txt`;
        a.click();
        URL.revokeObjectURL(url);

        toast({ title: 'تم التصدير ✅' });
    };

    // Export note to PDF (requires jsPDF)
    const exportNoteToPDF = async (noteId: string) => {
        try {
            const note = notesHistory.find(n => n.id === noteId);
            if (!note) return;

            // Dynamic import to reduce bundle size
            const { jsPDF } = await import('jspdf');

            const doc = new jsPDF();

            // Add Arabic font support (you'll need to add Amiri font)
            doc.setFont('Amiri', 'normal');
            doc.setFontSize(16);
            doc.text(note.title || 'ملاحظة', 20, 20, { align: 'right' });

            doc.setFontSize(12);
            const lines = doc.splitTextToSize(note.content, 170);
            doc.text(lines, 20, 40, { align: 'right' });

            doc.save(`${note.title || 'note'}.pdf`);

            toast({ title: 'تم التصدير كـ PDF ✅' });
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            toast({
                title: 'خطأ في التصدير',
                description: 'يرجى استخدام التصدير كـ TXT',
                variant: 'destructive'
            });
        }
    };

    return {
        notesHistory,
        folders,
        loading,
        saveNote,
        addNote,
        archiveNote,
        toggleSecure,
        deleteHistoryItem,
        updateNote,
        updateNoteById,
        deleteNoteById,
        appendToActivitiesNote,
        appendToNote,
        togglePin,
        addFolder,
        deleteFolder,
        refresh: fetchNotes,
        // Advanced features
        searchNotes,
        lockNote,
        unlockNote,
        addTag,
        removeTag,
        exportNoteToTXT,
        exportNoteToPDF,
    };
};

