
import React, { useMemo } from 'react';
import { useFolders } from '@/hooks/useFolders';
import { useNotesV2, NoteV2 } from '@/hooks/useNotesV2';
import { DndContext, useSensor, useSensors, PointerSensor, DragEndEvent, DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { KanbanFolderColumn } from './KanbanFolderColumn';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FolderPlus, FilePlus } from 'lucide-react';
import { KanbanNoteCard } from './KanbanNoteCard';
import { Button } from '@/components/ui/button';
import { EditFolderDialog } from './EditFolderDialog';
import { Folder } from '@/hooks/useFolders';

interface FolderGridProps {
    onOpenFolder: (folderId: string) => void;
    onOpenNote?: (note: NoteV2) => void;
    onRequestCreateNote?: (folderId?: string) => void;
    onRequestCreateFolder?: () => void;
}

export const FolderGrid: React.FC<FolderGridProps> = ({
    onOpenFolder,
    onOpenNote,
    onRequestCreateNote,
    onRequestCreateFolder
}) => {
    const { folders, deleteFolder } = useFolders();
    const { notes, isLoading, updateNote } = useNotesV2(null); // Fetch all notes
    const { toast } = useToast();
    const [editingFolderId, setEditingFolderId] = React.useState<string | null>(null);

    const editingFolder = React.useMemo(() =>
        folders.find(f => f.id === editingFolderId) || null,
        [folders, editingFolderId]);

    // Group notes by folder
    const notesByFolder = useMemo(() => {
        const grouped: Record<string, NoteV2[]> = {};
        folders.forEach(f => grouped[f.id] = []);
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

        if (targetFolderId === currentFolderId) return;

        try {
            toast({ title: 'جاري نقل الملاحظة...' });
            await updateNote({ id: noteId, updates: { folder_id: targetFolderId } });
            toast({ title: 'تم النقل بنجاح ✅' });
        } catch (error) {
            toast({ title: 'فشل النقل', variant: 'destructive' });
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-gray-300" /></div>;
    }

    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="p-4 h-full flex flex-col">
                {/* Header Removed - Moved to Top Bar */}

                {/* Content Area - 2 Independent Rows */}
                <div className="flex flex-col h-full gap-4 pb-4 overflow-hidden">
                    {/* Row 1 */}
                    <div className="flex-1 min-h-0 w-full overflow-x-auto flex gap-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-indigo-200 scrollbar-track-transparent items-stretch px-1">
                        {folders.filter((_, i) => i % 2 === 0).map(folder => (
                            <div key={folder.id} className="snap-start shrink-0 h-full w-[calc(25%-12px)] min-w-[300px] xl:min-w-[calc(25%-12px)]">
                                <KanbanFolderColumn
                                    folder={folder}
                                    notes={notesByFolder[folder.id] || []}
                                    onAddNote={() => onRequestCreateNote?.(folder.id)}
                                    onEditFolder={(id) => setEditingFolderId(id)}
                                    onDeleteFolder={() => deleteFolder(folder.id)}
                                    onNoteClick={(note) => onOpenNote ? onOpenNote(note) : onOpenFolder(folder.id)}
                                    onClickHeader={onOpenFolder}
                                />
                            </div>
                        ))}
                        {/* Placeholder to maintain width if few items? No, flex handles it. */}
                    </div>

                    {/* Row 2 */}
                    <div className="flex-1 min-h-0 w-full overflow-x-auto flex gap-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-indigo-200 scrollbar-track-transparent items-stretch px-1">
                        {folders.filter((_, i) => i % 2 !== 0).map(folder => (
                            <div key={folder.id} className="snap-start shrink-0 h-full w-[calc(25%-12px)] min-w-[300px] xl:min-w-[calc(25%-12px)]">
                                <KanbanFolderColumn
                                    folder={folder}
                                    notes={notesByFolder[folder.id] || []}
                                    onAddNote={() => onRequestCreateNote?.(folder.id)}
                                    onEditFolder={(id) => setEditingFolderId(id)}
                                    onDeleteFolder={() => deleteFolder(folder.id)}
                                    onNoteClick={(note) => onOpenNote ? onOpenNote(note) : onOpenFolder(folder.id)}
                                    onClickHeader={onOpenFolder}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <EditFolderDialog
                isOpen={!!editingFolderId}
                onClose={() => setEditingFolderId(null)}
                folder={editingFolder}
            />
        </DndContext>
    );
};
