import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TABLES } from '@/lib/tableNames';

export interface NoteData {
    content: string;
    isSecure?: boolean;
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

    const saveNoteToStorage = (notes: NoteData[]) => {
        setNotesHistory(notes);
        localStorage.setItem('baraka_notes_history', JSON.stringify(notes));
    };

    const saveNote = async (note: string) => {
        localStorage.setItem('baraka_quick_notes', note);
        const user = (await supabase.auth.getUser()).data.user;
        if (user) {
            await supabase.from(TABLES.logistics).update({ quick_notes: note, updated_at: new Date().toISOString() }).eq('user_id', user.id);
        }
        toast({ title: 'تم الحفط ✅' });
    };

    const archiveNote = (note: string, isSecure = false) => {
        if (!note.trim()) return;
        const newNote: NoteData = { content: note, isSecure, createdAt: new Date().toISOString() };
        const updated = [newNote, ...notesHistory];
        saveNoteToStorage(updated);
        localStorage.removeItem('baraka_quick_notes');
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
        localStorage.setItem('baraka_quick_notes', note);
    };

    return {
        notesHistory,
        saveNote,
        archiveNote,
        toggleSecure,
        deleteHistoryItem,
        restoreHistoryItem,
        saveNoteToStorage, // Expose for VoiceNoteRecorder
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
        }
    };
};

