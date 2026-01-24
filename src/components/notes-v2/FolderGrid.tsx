
import React, { useMemo } from 'react';
import { useFolders } from '@/hooks/useFolders';
import { useNotesV2, NoteV2 } from '@/hooks/useNotesV2';
import { DndContext, useSensor, useSensors, PointerSensor, DragEndEvent, DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { KanbanFolderColumn } from './KanbanFolderColumn';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FolderPlus, FilePlus } from 'lucide-react';
import { KanbanNoteCard } from './KanbanNoteCard';
import { Button } from '@/components/ui/button';

interface FolderGridProps {
    onOpenFolder: (folderId: string) => void;
    // We might want to pass a handler to open a specific note directly from the grid
    onOpenNote?: (note: NoteV2) => void;
}

export const FolderGrid: React.FC<FolderGridProps> = ({ onOpenFolder, onOpenNote }) => {
    const { folders, deleteFolder, createFolder } = useFolders();
    const { notes, isLoading, updateNote, createNote } = useNotesV2(null); // Fetch all notes
    const { toast } = useToast();

    // Group notes by folder
    const notesByFolder = useMemo(() => {
        const grouped: Record<string, NoteV2[]> = {};
        folders.forEach(f => grouped[f.id] = []);
        // Also a group for "Uncategorized" if we want, but for now stick to folders
        // Or handle notes with null folder_id?
        // Let's assume we map null folder_id to specific "Inbox" folder if it exists, or just ignore.

        notes.forEach(note => {
            if (note.folder_id && grouped[note.folder_id]) {
                grouped[note.folder_id].push(note);
            }
        });
        return grouped;
    }, [folders, notes]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement before drag starts (prevents accidental drags)
            },
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        const noteId = active.id as string;
        const targetFolderId = over.id as string;
        const currentFolderId = active.data.current?.currentFolderId;

        // If dropped in same folder, do nothing (reordering not implemented yet)
        if (targetFolderId === currentFolderId) return;

        // Optimistic UI update could happen here, but React Query will refetch/invalidate
        try {
            toast({ title: 'جاري نقل الملاحظة...' });
            await updateNote({ id: noteId, updates: { folder_id: targetFolderId } });
            toast({ title: 'تم النقل بنجاح ✅' });
        } catch (error) {
            toast({ title: 'فشل النقل', variant: 'destructive' });
        }
    };

    const handleAddNote = async (folderId: string) => {
        const title = prompt('عنوان الملاحظة الجديدة:');
        if (!title) return;

        try {
            await createNote({ title, folder_id: folderId, content: '' });
        } catch (e) {
            toast({ title: 'فشل إنشاء الملاحظة', variant: 'destructive' });
        }
    };

    const handleCreateFolder = async () => {
        const name = prompt('اسم المجلد الجديد:');
        if (!name) return;
        try {
            await createFolder({ name, parent_id: null });
            toast({ title: 'تم إنشاء المجلد ✅' });
        } catch (error) {
            toast({ title: 'فشل إنشاء المجلد', variant: 'destructive' });
        }
    };

    const handleGlobalAddNote = async () => {
        // For now, simpler to add to the first folder or trigger a dialog
        // Let's use the first folder if available
        if (folders.length > 0) {
            handleAddNote(folders[0].id);
        } else {
            toast({ title: 'يرجى إنشاء مجلد أولاً', variant: 'destructive' });
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-gray-300" /></div>;
    }

    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="p-4 md:p-6 overflow-x-auto h-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">المكتبة (عرض المجموعات)</h2>
                    <div className="flex gap-2">
                        <Button onClick={handleGlobalAddNote} variant="outline" className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                            <FilePlus className="w-4 h-4" />
                            ملاحظة جديدة
                        </Button>
                        <Button onClick={handleCreateFolder} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                            <FolderPlus className="w-4 h-4" />
                            مجلد جديد
                        </Button>
                    </div>
                </div>

                {/* Grid Layout of Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                    {folders.map(folder => (
                        <KanbanFolderColumn
                            key={folder.id}
                            folder={folder}
                            notes={notesByFolder[folder.id] || []}
                            onAddNote={handleAddNote}
                            onDeleteFolder={() => deleteFolder(folder.id)}
                            onNoteClick={(note) => onOpenNote ? onOpenNote(note) : onOpenFolder(folder.id)}
                        />
                    ))}

                    {/* Add Folder Button/Card */}
                    {/* Can be added as a special column or button at top */}
                </div>
            </div>
            {/* Drag Overlay for smooth visual - Optional but recommended */}
        </DndContext>
    );
};
