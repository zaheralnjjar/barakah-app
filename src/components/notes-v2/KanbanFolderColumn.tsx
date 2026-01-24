import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Plus, Trash2, FolderOpen, Folder as FolderIcon } from 'lucide-react';
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
    folder: { id: string; name: string };
    notes: NoteV2[];
    onAddNote: (folderId: string) => void;
    onDeleteFolder: (folderId: string) => void;
    onNoteClick: (note: NoteV2) => void;
}

export const KanbanFolderColumn: React.FC<KanbanFolderColumnProps> = ({
    folder,
    notes = [],
    onAddNote,
    onDeleteFolder,
    onNoteClick
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
                flex flex-col h-full min-h-[300px] max-h-[500px] rounded-2xl border transition-colors bg-gray-50/50 backdrop-blur-sm
                ${isOver ? 'border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-indigo-100'}
            `}
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-500">
                        {notes.length > 0 ? <FolderOpen className="w-4 h-4" /> : <FolderIcon className="w-4 h-4" />}
                    </div>
                    <span className="font-bold text-gray-700 truncate max-w-[120px]" title={folder.name}>
                        {folder.name}
                    </span>
                    <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-600">
                        {notes.length}
                    </span>
                </div>

                <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                    <AlertDialogTrigger asChild>
                        <button
                            className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>هل أنت متأكد من حذف المجلد؟</AlertDialogTitle>
                            <AlertDialogDescription>
                                سيتم حذف المجلد "{folder.name}" وجميع الملاحظات بداخله (أو نقلها). هذا الإجراء لا يمكن التراجع عنه.
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

            {/* Notes List (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
                {notes.map(note => (
                    <KanbanNoteCard
                        key={note.id}
                        note={note}
                        onClick={() => onNoteClick(note)}
                    />
                ))}

                {notes.length === 0 && (
                    <div className="h-20 flex items-center justify-center text-gray-300 text-xs border-2 border-dashed border-gray-100 rounded-xl m-2">
                        اسحب ملاحظة هنا
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100">
                <button
                    onClick={() => onAddNote(folder.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-500 hover:text-indigo-600 hover:bg-white rounded-xl border border-transparent hover:border-indigo-100 transition-all shadow-sm hover:shadow"
                >
                    <Plus className="w-4 h-4" />
                    إضافة ملاحظة
                </button>
            </div>
        </div>
    );
};
