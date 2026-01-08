import { useState, useEffect } from 'react';
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
    createdAt?: string;
    updatedAt?: string;
    tags?: string[];
}

export const useHidayaNotes = () => {
    const { toast } = useToast();
    const [notesHistory, setNotesHistory] = useState<NoteData[]>([]);

    // Load from Supabase on mount
    useEffect(() => {
        const loadFromCloud = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from('hidaya_notes')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching hidaya notes:', error);
                    return;
                }

                if (data) {
                    const mappedNotes: NoteData[] = data.map(item => ({
                        id: item.id,
                        title: item.title,
                        content: item.content,
                        type: item.type as NoteType || 'quick',
                        isSecure: item.is_secure,
                        isPinned: item.is_pinned,
                        createdAt: item.created_at,
                        updatedAt: item.updated_at
                    }));
                    setNotesHistory(mappedNotes);
                }
            } catch (error) {
                console.error('Error loading notes:', error);
            }
        };

        loadFromCloud();
    }, []);

    const addNote = async (content: string, type: NoteType = 'quick', title?: string, isSecure = false) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast({ title: 'يرجى تسجيل الدخول', variant: 'destructive' });
                return;
            }

            const newNote = {
                user_id: user.id,
                content,
                type,
                title,
                is_secure: isSecure,
                is_pinned: false,
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('hidaya_notes')
                .insert(newNote)
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const mappedNote: NoteData = {
                    id: data.id,
                    title: data.title,
                    content: data.content,
                    type: data.type as NoteType,
                    isSecure: data.is_secure,
                    isPinned: data.is_pinned,
                    createdAt: data.created_at
                };
                setNotesHistory(prev => [mappedNote, ...prev]);
                toast({ title: 'تم حفظ الملاحظة' });
            }
        } catch (error) {
            console.error('Error saving note:', error);
            toast({ title: 'خطأ في الحفظ', variant: 'destructive' });
        }
    };

    const updateNoteById = async (id: string, updates: Partial<NoteData>) => {
        try {
            const dbUpdates: any = {};
            if (updates.content !== undefined) dbUpdates.content = updates.content;
            if (updates.title !== undefined) dbUpdates.title = updates.title;
            if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
            if (updates.isSecure !== undefined) dbUpdates.is_secure = updates.isSecure;
            dbUpdates.updated_at = new Date().toISOString();

            const { error } = await supabase
                .from('hidaya_notes')
                .update(dbUpdates)
                .eq('id', id);

            if (error) throw error;

            setNotesHistory(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
            toast({ title: 'تم التحديث' });

        } catch (error) {
            console.error('Error updating note:', error);
            toast({ title: 'خطأ في التحديث', variant: 'destructive' });
        }
    };

    const deleteNoteById = async (id: string) => {
        try {
            const { error } = await supabase
                .from('hidaya_notes')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setNotesHistory(prev => prev.filter(n => n.id !== id));
            toast({ title: 'تم الحذف' });
        } catch (error) {
            console.error('Error deleting note:', error);
            toast({ title: 'خطأ في الحذف', variant: 'destructive' });
        }
    };

    return {
        notesHistory,
        addNote,
        deleteNoteById,
        updateNoteById,
        refreshNotes: () => { /* re-fetch logic could go here */ }
    };
};
