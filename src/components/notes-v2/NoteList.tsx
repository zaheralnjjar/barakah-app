import { useNotesV2, NoteV2 } from '@/hooks/useNotesV2';
import { FileText, Clock, Pin, RotateCcw, Trash, Trash2, Bookmark } from 'lucide-react';
import React, { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NoteListProps {
    folderId: string | null;
    searchQuery?: string;
    onSelectNote: (note: NoteV2) => void;
    activeNoteId?: string;
    isSelectionMode?: boolean;
    selectedIds?: Set<string>;
    onToggleSelection?: (id: string) => void;
}

export const NoteList: React.FC<NoteListProps> = ({
    folderId,
    searchQuery,
    onSelectNote,
    activeNoteId,
    isSelectionMode = false,
    selectedIds = new Set(),
    onToggleSelection
}) => {
    const { notes, isLoading, deleteNote, restoreNote, permanentDelete } = useNotesV2(folderId, searchQuery);
    const [confirmDelete, setConfirmDelete] = useState<{ id: string, type: 'soft' | 'permanent' } | null>(null);

    if (isLoading) return <div className="p-8 text-center text-gray-400">جاري التحميل...</div>;

    if (notes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <FileText className="w-12 h-12 mb-2 opacity-20" />
                <p>لا توجد ملاحظات هنا</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 p-2">
            {notes.map(note => (
                <div
                    key={note.id}
                    onClick={() => {
                        if (isSelectionMode && onToggleSelection) {
                            onToggleSelection(note.id);
                        } else {
                            onSelectNote(note);
                        }
                    }}
                    className={`
                        group relative p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md
                        ${activeNoteId === note.id
                            ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                            : (isSelectionMode && selectedIds.has(note.id) ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-white border-gray-100 hover:border-indigo-100')}
                    `}
                >
                    {isSelectionMode && (
                        <div className="absolute top-3 left-3 z-10">
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selectedIds.has(note.id) ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-gray-300'}`}>
                                {selectedIds.has(note.id) && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-start mb-1">
                        <h3 className={`font-bold text-gray-800 line-clamp-1 ${activeNoteId === note.id ? 'text-indigo-700' : ''}`}>
                            {note.title || 'بدون عنوان'}
                        </h3>
                        <div className="flex items-center gap-1">
                            {note.is_pinned && <Pin className="w-4 h-4 text-indigo-500 rotate-45" />}
                        </div>
                    </div>

                    <p className="text-xs text-gray-500 line-clamp-2 mb-2 h-8 opacity-70">
                        {note.content?.replace(/<[^>]*>?/gm, '') || 'لا يوجد محتوى نصي...'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(note.updated_at).toLocaleDateString('ar-SA')}
                        </span>
                    </div>

                    {/* Actions - Hide in selection mode */}
                    {!isSelectionMode && (
                        <div className="absolute bottom-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {folderId === 'trash' ? (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            restoreNote(note.id);
                                        }}
                                        className="text-green-600 hover:bg-green-50 p-1.5 rounded-full"
                                        title="استعادة"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setConfirmDelete({ id: note.id, type: 'permanent' });
                                        }}
                                        className="text-red-600 hover:bg-red-50 p-1.5 rounded-full"
                                        title="حذف نهائي"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmDelete({ id: note.id, type: 'permanent' });
                                    }}
                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full"
                                    title="حذف نهائي"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ))}

            {/* Deletion Confirmation Dialog */}
            <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>حذف الملاحظة نهائياً؟</AlertDialogTitle>
                        <AlertDialogDescription>
                            سيتم حذف هذه الملاحظة بشكل نهائي ولا يمكن استعادتها.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => {
                                if (confirmDelete) {
                                    permanentDelete(confirmDelete.id);
                                    setConfirmDelete(null);
                                }
                            }}
                        >
                            تأكيد الحذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
