import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TABLES } from '@/lib/tableNames';

export interface NoteData {
    content: string;
    isSecure?: boolean;
    isPinned?: boolean;
    createdAt?: string;
}

// Rotating colors for note entries (emoji circles for visual distinction)
const NOTE_COLORS = ['🔵', '🟢', '🟡', '🟠', '🔴', '🟣', '⚪'];

// Get next color based on current content
const getNextColor = (existingContent: string): string => {
    // Count how many entries exist (by counting separators)
    const separatorCount = (existingContent.match(/━━━━━━━━━━━━━━━━━━━━━━/g) || []).length;
    return NOTE_COLORS[separatorCount % NOTE_COLORS.length];
};

export const useQuickNotes = () => {
    const { toast } = useToast();
    const [notesHistory, setNotesHistory] = useState<NoteData[]>(() => {
        try {
            const raw = localStorage.getItem('baraka_notes_history') || '[]';
            const parsed = JSON.parse(raw);
            return parsed.map((item: any) => {
                if (typeof item === 'string') return { content: item, isSecure: false };
                return item;
            });
        } catch { return []; }
    });

    // Load from Supabase on mount
    useEffect(() => {
        const loadFromCloud = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data } = await supabase
                    .from(TABLES.logistics)
                    .select('quick_notes')
                    .eq('user_id', user.id)
                    .single();

                if (data?.quick_notes) {
                    try {
                        // Try to parse as JSON array (new format)
                        const parsed = JSON.parse(data.quick_notes);
                        if (Array.isArray(parsed)) {
                            setNotesHistory(parsed);
                            localStorage.setItem('baraka_notes_history', JSON.stringify(parsed));
                            return;
                        }
                    } catch (e) {
                        // If parse fails or not array, treat as legacy single string note
                        // Only verify if we don't have better local data? 
                        // For now, let's append it or set it if local is empty? 
                        // Simpler: Just convert it to a note object if local is empty
                        if (notesHistory.length === 0) {
                            const note = { content: data.quick_notes, isSecure: false, createdAt: new Date().toISOString() };
                            setNotesHistory([note]);
                            localStorage.setItem('baraka_notes_history', JSON.stringify([note]));
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading notes:', error);
            }
        };
        loadFromCloud();
    }, []);

    const saveNoteToStorage = async (notes: NoteData[]) => {
        // Local Save
        setNotesHistory(notes);
        localStorage.setItem('baraka_notes_history', JSON.stringify(notes));

        // Cloud Save
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (user) {
                await supabase.from(TABLES.logistics).update({
                    quick_notes: JSON.stringify(notes),
                    updated_at: new Date().toISOString()
                }).eq('user_id', user.id);
            }
        } catch (error) {
            console.error('Error syncing notes:', error);
        }
    };

    // Legacy support wrapper
    const saveNote = async (note: string) => {
        // Treat as saving a single quick note to index 0?
        // Or just appending? The current UI uses this for the single note view.
        // Let's assume we update the first note or create one.
        // Actually, let's keep it simple: If using old UI, just update index 0
        const updated = [...notesHistory];
        if (updated.length > 0) {
            updated[0].content = note;
            updated[0].createdAt = new Date().toISOString();
        } else {
            updated.push({ content: note, isSecure: false, createdAt: new Date().toISOString() });
        }
        await saveNoteToStorage(updated);
        toast({ title: 'تم الحفط ✅' });
    };

    const archiveNote = (note: string, isSecure = false) => {
        if (!note.trim()) return;
        const newNote: NoteData = { content: note, isSecure, createdAt: new Date().toISOString() };
        const updated = [newNote, ...notesHistory];
        saveNoteToStorage(updated);
        toast({ title: 'تمت الأرشفة' });
    };

    const toggleSecure = (index: number) => {
        const updated = [...notesHistory];
        if (updated[index]) {
            updated[index].isSecure = !updated[index].isSecure;
            saveNoteToStorage(updated);
            toast({ title: updated[index].isSecure ? 'تم القفل 🔒' : 'تم إلغاء القفل 🔓' });
        }
    };

    const deleteHistoryItem = (index: number) => {
        const updated = notesHistory.filter((_, i) => i !== index);
        saveNoteToStorage(updated);
    };

    const restoreHistoryItem = (note: string) => {
        // Not really used in new logic, but kept for compatibility
        // Maybe copy to clipboard or just do nothing
    };

    return {
        notesHistory,
        saveNote,
        archiveNote,
        toggleSecure,
        deleteHistoryItem,
        restoreHistoryItem,
        saveNoteToStorage,
        // Append text to a fixed "أنشطة" (Activities) note
        appendToActivitiesNote: (text: string) => {
            const timestamp = new Date().toLocaleString('ar-SA', {
                dateStyle: 'short',
                timeStyle: 'short'
            });

            // Find existing "أنشطة" note
            const activitiesIndex = notesHistory.findIndex(
                n => n.content.startsWith('أنشطة\n') || n.content.startsWith('أنشطة:')
            );

            if (activitiesIndex >= 0) {
                // Append to existing note with separator line and color
                const existing = notesHistory[activitiesIndex];
                const updated = [...notesHistory];
                const color = getNextColor(existing.content);
                const separator = '\n━━━━━━━━━━━━━━━━━━━━━━\n';
                const entry = `${separator}${color} [${timestamp}]\n${text}`;
                updated[activitiesIndex] = {
                    ...existing,
                    content: existing.content + entry,
                    createdAt: new Date().toISOString()
                };
                saveNoteToStorage(updated);
            } else {
                // Create new "أنشطة" note with first color
                const color = NOTE_COLORS[0];
                const entry = `${color} [${timestamp}] ${text}`;
                const newNote: NoteData = {
                    content: `أنشطة:\n${entry}`,
                    isSecure: false,
                    createdAt: new Date().toISOString()
                };
                saveNoteToStorage([newNote, ...notesHistory]);
            }
        },
        // Update existing note by index with separator and color
        appendToNote: (noteIndex: number, text: string) => {
            if (noteIndex < 0 || noteIndex >= notesHistory.length) return;

            const timestamp = new Date().toLocaleString('ar-SA', {
                dateStyle: 'short',
                timeStyle: 'short'
            });

            const existing = notesHistory[noteIndex];
            const updated = [...notesHistory];
            const color = getNextColor(existing.content);
            const separator = '\n━━━━━━━━━━━━━━━━━━━━━━\n';
            const entry = `${separator}${color} [${timestamp}]\n${text}`;

            updated[noteIndex] = {
                ...existing,
                content: existing.content + entry,
                createdAt: new Date().toISOString()
            };
            saveNoteToStorage(updated);
        },
        // Toggle pin status for a note (pinned notes appear first)
        togglePin: (noteIndex: number) => {
            if (noteIndex < 0 || noteIndex >= notesHistory.length) return;
            const updated = [...notesHistory];
            updated[noteIndex] = {
                ...updated[noteIndex],
                isPinned: !updated[noteIndex].isPinned
            };
            // Sort: pinned first, then by date
            updated.sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return 0;
            });
            saveNoteToStorage(updated);
        }
    };
};

