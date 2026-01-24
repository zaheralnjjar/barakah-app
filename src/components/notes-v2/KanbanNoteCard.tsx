import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { NoteV2 } from '@/hooks/useNotesV2';
import { GripVertical, Clock } from 'lucide-react';

interface KanbanNoteCardProps {
    note: NoteV2;
    onClick: () => void;
}

export const KanbanNoteCard: React.FC<KanbanNoteCardProps> = ({ note, onClick }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: note.id,
        data: { type: 'note', noteId: note.id, currentFolderId: note.folder_id }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none', // Essential for dnd-kit on mobile/touch
    };

    // Strip HTML for preview
    const previewText = note.content?.replace(/<[^>]*>?/gm, '').slice(0, 60) || 'بدون محتوى';

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={onClick}
            className={`
                bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative select-none
                ${isDragging ? 'shadow-lg border-indigo-300 rotate-2 z-50' : ''}
            `}
        >
            <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-gray-800 text-sm line-clamp-1 flex-1 ml-2">
                    {note.title || 'ملاحظة بدون عنوان'}
                </h4>
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="p-1 text-gray-300 hover:text-indigo-400 cursor-grab active:cursor-grabbing"
                    onClick={(e) => e.stopPropagation()} // Prevent opening note when clicking handle
                >
                    <GripVertical className="w-4 h-4" />
                </div>
            </div>

            <p className="text-xs text-gray-500 line-clamp-2 mb-2 h-8 leading-relaxed opacity-80">
                {previewText}
            </p>

            <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                <Clock className="w-3 h-3" />
                <span>{new Date(note.updated_at).toLocaleDateString('ar-SA')}</span>
            </div>
        </div>
    );
};
