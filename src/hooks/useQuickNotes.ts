import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TABLES } from '@/lib/tableNames';

export type NoteType = 'quick' | 'main' | 'voice';

export interface NoteData {
    id?: string; // unique ID for easier updates
    title?: string; // Optional title
    content: string;
    type: NoteType;
    isSecure?: boolean;
    isPinned?: boolean;
    createdAt?: string;
    updatedAt?: string;
    tags?: string[];
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
                // Migration for legacy string items
                if (typeof item === 'string') return {
                    content: item,
                    type: 'quick',
                    isSecure: false,
                    createdAt: new Date().toISOString()
                };
                // Migration for objects without type
                if (!item.type) item.type = 'quick';
                if (!item.id) item.id = crypto.randomUUID();
                return item;
            });
        } catch { return []; }
    });

    // Load from Supabase on mount - CLOUD FIRST for sync
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
                        const parsed = JSON.parse(data.quick_notes);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            // Migrate cloud data if needed
                            const migrated = parsed.map((item: any) => {
                                if (typeof item === 'string') return { content: item, type: 'quick', isSecure: false, createdAt: new Date().toISOString(), id: crypto.randomUUID() };
                                if (!item.type) item.type = 'quick';
                                if (!item.id) item.id = crypto.randomUUID();
                                return item;
                            });

                            setNotesHistory(migrated);
                            localStorage.setItem('baraka_notes_history', JSON.stringify(migrated));
                            return;
                        }
                    } catch (e) {
                        // Legacy single string fallback
                        if (data.quick_notes.length > 0) {
                            const note: NoteData = {
                                id: crypto.randomUUID(),
                                content: data.quick_notes,
                                type: 'quick',
                                isSecure: false,
                                createdAt: new Date().toISOString()
                            };
                            setNotesHistory([note]);
                            localStorage.setItem('baraka_notes_history', JSON.stringify([note]));
                            return;
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

    // Add new note
    const addNote = (content: string, type: NoteType = 'quick', title?: string, isSecure = false) => {
        if (!content.trim() && !title?.trim()) return;

        const newNote: NoteData = {
            id: crypto.randomUUID(),
            title,
            content,
            type,
            isSecure,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const updated = [newNote, ...notesHistory];
        saveNoteToStorage(updated);
        toast({ title: 'تم حفظ الملاحظة ✅' });
    };

    // Legacy support wrapper
    const saveNote = async (note: string) => {
        addNote(note, 'quick');
    };

    const archiveNote = (note: string, isSecure = false) => {
        addNote(note, 'quick', undefined, isSecure);
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

    const updateNote = (index: number, content: string, title?: string) => {
        if (index < 0 || index >= notesHistory.length) return;
        const updated = [...notesHistory];
        updated[index] = {
            ...updated[index],
            content: content,
            title: title !== undefined ? title : updated[index].title,
            updatedAt: new Date().toISOString()
        };
        saveNoteToStorage(updated);
    };

    // Update by ID (safer)
    const updateNoteById = (id: string, updates: Partial<NoteData>) => {
        const index = notesHistory.findIndex(n => n.id === id);
        if (index === -1) return;

        const updated = [...notesHistory];
        updated[index] = { ...updated[index], ...updates, updatedAt: new Date().toISOString() };
        saveNoteToStorage(updated);
    }

    const deleteNoteById = (id: string) => {
        const updated = notesHistory.filter(n => n.id !== id);
        saveNoteToStorage(updated);
    }

    return {
        notesHistory,
        saveNote, // legacy
        addNote, // new
        archiveNote, // legacy name, acting as add
        toggleSecure,
        deleteHistoryItem, // legacy index based
        updateNote, // legacy index based
        updateNoteById, // new ID based
        deleteNoteById, // new ID based
        saveNoteToStorage,

        // Append text to a fixed "أنشطة" (Activities) note
        appendToActivitiesNote: (text: string) => {
            const timestamp = new Date().toLocaleString('ar-SA', {
                dateStyle: 'short',
                timeStyle: 'short'
            });

            // Find existing "أنشطة" note
            const activitiesIndex = notesHistory.findIndex(
                n => n.title === 'أنشطة' || n.content.startsWith('أنشطة\n') || n.content.startsWith('أنشطة:')
            );

            if (activitiesIndex >= 0) {
                // Append to existing note
                const existing = notesHistory[activitiesIndex];
                const updated = [...notesHistory];
                const color = getNextColor(existing.content);
                const separator = '\n━━━━━━━━━━━━━━━━━━━━━━\n';
                const entry = `${separator}${color} [${timestamp}]\n${text}`;

                updated[activitiesIndex] = {
                    ...existing,
                    content: existing.content + entry,
                    updatedAt: new Date().toISOString()
                };
                saveNoteToStorage(updated);
            } else {
                // Create new "أنشطة" note
                const color = NOTE_COLORS[0];
                const entry = `${color} [${timestamp}] ${text}`;
                addNote(`أنشطة:\n${entry}`, 'quick', 'أنشطة');
            }
        },

        appendToNote: (noteIndex: number, text: string) => {
            if (noteIndex < 0 || noteIndex >= notesHistory.length) return;
            const timestamp = new Date().toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' });
            const existing = notesHistory[noteIndex];
            const updated = [...notesHistory];
            const color = getNextColor(existing.content);
            const separator = '\n━━━━━━━━━━━━━━━━━━━━━━\n';
            const entry = `${separator}${color} [${timestamp}]\n${text}`;

            updated[noteIndex] = {
                ...existing,
                content: existing.content + entry,
                updatedAt: new Date().toISOString()
            };
            saveNoteToStorage(updated);
        },

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

