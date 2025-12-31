import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TABLES } from '@/lib/tableNames';

export interface NoteData {
    content: string;
    isSecure?: boolean;
    createdAt?: string;
}

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
        // Append text to a fixed "أنشطة" (Activities) note
        appendToActivitiesNote: (text: string) => {
            const timestamp = new Date().toLocaleString('ar-SA', {
                dateStyle: 'short',
                timeStyle: 'short'
            });
            const entry = `[${timestamp}] ${text}`;

            // Find existing "أنشطة" note
            const activitiesIndex = notesHistory.findIndex(
                n => n.content.startsWith('أنشطة\n') || n.content.startsWith('أنشطة:')
            );

            if (activitiesIndex >= 0) {
                // Append to existing note
                const existing = notesHistory[activitiesIndex];
                const updated = [...notesHistory];
                updated[activitiesIndex] = {
                    ...existing,
                    content: existing.content + '\n' + entry,
                    createdAt: new Date().toISOString()
                };
                saveNoteToStorage(updated);
            } else {
                // Create new "أنشطة" note
                const newNote: NoteData = {
                    content: `أنشطة:\n${entry}`,
                    isSecure: false,
                    createdAt: new Date().toISOString()
                };
                saveNoteToStorage([newNote, ...notesHistory]);
            }
        }
    };
};
