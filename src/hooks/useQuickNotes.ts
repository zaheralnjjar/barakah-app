import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TABLES } from '@/lib/tableNames';

export const useQuickNotes = () => {
    const { toast } = useToast();
    const [notesHistory, setNotesHistory] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('baraka_notes_history') || '[]'); } catch { return []; }
    });

    const saveNote = async (note: string) => {
        localStorage.setItem('baraka_quick_notes', note);
        // Sync to Supabase
        const user = (await supabase.auth.getUser()).data.user;
        if (user) {
            await supabase.from(TABLES.logistics).update({ quick_notes: note, updated_at: new Date().toISOString() }).eq('user_id', user.id);
        }
        toast({ title: 'تم الحفظ ✅' });
    };

    const archiveNote = (note: string) => {
        if (!note.trim()) return;
        const updated = [note, ...notesHistory];
        setNotesHistory(updated);
        localStorage.setItem('baraka_notes_history', JSON.stringify(updated));
        localStorage.removeItem('baraka_quick_notes');
        toast({ title: 'تمت الأرشفة' });
    };

    const deleteHistoryItem = (index: number) => {
        const updated = notesHistory.filter((_, i) => i !== index);
        setNotesHistory(updated);
        localStorage.setItem('baraka_notes_history', JSON.stringify(updated));
    };

    const restoreHistoryItem = (note: string) => {
        localStorage.setItem('baraka_quick_notes', note);
        // In UI, we need to update the textarea value manually or via state. 
        // Hook consumer should handle the textarea ref/state update.
    };

    return {
        notesHistory,
        saveNote,
        archiveNote,
        deleteHistoryItem,
        restoreHistoryItem
    };
};
