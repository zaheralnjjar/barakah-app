
import React from 'react';
import { useNotesV2 } from '@/hooks/useNotesV2';
import { FileText, Clock, Pin } from 'lucide-react';

interface NoteListProps {
    folderId: string | null;
    onSelectNote: (note: any) => void;
    activeNoteId?: string;
}

export const NoteList: React.FC<NoteListProps> = ({ folderId, onSelectNote, activeNoteId }) => {
    const { notes, isLoading, deleteNote } = useNotesV2(folderId);

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
                    onClick={() => onSelectNote(note)}
                    className={`
                        group relative p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md
                        ${activeNoteId === note.id
                            ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                            : 'bg-white border-gray-100 hover:border-indigo-100'}
                    `}
                >
                    <div className="flex justify-between items-start mb-1">
                        <h3 className={`font-bold text-gray-800 line-clamp-1 ${activeNoteId === note.id ? 'text-indigo-700' : ''}`}>
                            {note.title || 'بدون عنوان'}
                        </h3>
                        {note.is_pinned && <Pin className="w-4 h-4 text-amber-500 fill-amber-500 rotate-45" />}
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

                    {/* Delete Action (Hidden until hover) */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('حذف الملاحظة؟')) deleteNote(note.id);
                        }}
                        className="absolute bottom-2 left-2 text-red-400 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded"
                    >
                        حذف
                    </button>
                </div>
            ))}
        </div>
    );
};
