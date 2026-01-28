import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Plus, Trash2, FolderOpen, Folder as FolderIcon, Settings } from 'lucide-react';
import { NoteV2 } from '@/hooks/useNotesV2';
import { KanbanNoteCard } from './KanbanNoteCard';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface KanbanFolderColumnProps {
    folder: { id: string; name: string; color?: string; icon?: string };
    notes: NoteV2[];
    onAddNote: (folderId: string) => void;
    onEditFolder: (folderId: string) => void;
    onDeleteFolder: (folderId: string) => void;
    onNoteClick: (note: NoteV2) => void;
    onClickHeader?: (folderId: string) => void;
    onEditNote?: (note: NoteV2) => void;
    onDeleteNote?: (noteId: string) => void;
}

export const KanbanFolderColumn: React.FC<KanbanFolderColumnProps> = ({
    folder,
    notes = [],
    onAddNote,
    onEditFolder,
    onDeleteFolder,
    onNoteClick,
    onClickHeader,
    onEditNote,
    onDeleteNote
}) => {
    const { setNodeRef, isOver } = useDroppable({
        id: folder.id,
        data: { type: 'folder', folderId: folder.id }
    });

    const [isAlertOpen, setIsAlertOpen] = useState(false);

    return (
        <div
            ref={setNodeRef}
            className={`
                flex flex-col h-full rounded-2xl border transition-colors bg-gray-50/50 backdrop-blur-sm
                ${isOver ? 'border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-indigo-100'}
            `}
            style={{
                borderColor: !isOver && folder.color ? `${folder.color}40` : undefined,
                backgroundColor: !isOver && folder.color ? `${folder.color}15` : undefined
            }}
        >
            {/* Header */}
            <div
                className="p-3 border-b border-gray-100 flex items-center justify-between gap-2 overflow-hidden cursor-pointer hover:bg-white/50 transition-colors"
                onClick={() => onClickHeader?.(folder.id)}
            >
                {/* Title & Stats (Right Side) */}
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-gray-800 truncate text-sm" title={folder.name}>
                        {folder.name}
                    </span>
                    <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-full text-gray-500 font-medium whitespace-nowrap">
                        {notes.length}
                    </span>
                </div>

                {/* Compact Actions (Left Side) */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                        onClick={() => onAddNote(folder.id)}
                        className="p-1 text-gray-400 hover:text-green-600 rounded hover:bg-green-50 transition-colors"
                        title="إضافة ملاحظة"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); onEditFolder(folder.id); }}
                        className="p-1 text-gray-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-colors"
                        title="تعديل المجلد"
                    >
                        <Settings className="w-3.5 h-3.5" />
                    </button>

                    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                        <AlertDialogTrigger asChild>
                            <button
                                className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                                title="حذف"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                                <AlertDialogTitle>هل أنت متأكد من حذف المجلد؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                    سيتم نقل المجلد "{folder.name}" وجميع الملاحظات بداخله إلى سلة المهملات.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDeleteFolder(folder.id)} className="bg-red-500 hover:bg-red-600">
                                    حذف
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* Notes List (Scrollable) */}
            <div className="flex-1 min-h-0 overflow-y-scroll p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-400 hover:scrollbar-thumb-gray-500 custom-scrollbar-visible">
                {notes.map(note => (
                    <KanbanNoteCard
                        key={note.id}
                        note={note}
                        onClick={() => onNoteClick(note)}
                        onEdit={onEditNote}
                        onDelete={onDeleteNote}
                    />
                ))}

                {notes.length === 0 && (
                    <div className="h-20 flex items-center justify-center text-gray-300 text-xs border-2 border-dashed border-gray-100 rounded-xl m-2">
                        اسحب ملاحظة هنا
                    </div>
                )}
            </div>
        </div>
    );
};
