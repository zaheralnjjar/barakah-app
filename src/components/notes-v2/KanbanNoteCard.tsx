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
                bg-white p-1.5 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative select-none
                ${isDragging ? 'shadow-lg border-indigo-300 rotate-2 z-50' : ''}
            `}
        >
            <div className="flex justify-between items-center gap-1.5 mb-0.5">
                {/* Title */}
                <h4 className="font-bold text-gray-800 text-[11px] line-clamp-1 flex-1">
                    {note.title || 'بدون عنوان'}
                </h4>

                {/* Date & Grip in same row */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    <div className="flex items-center gap-0.5 text-[8px] text-gray-400">
                        <Clock className="w-2 h-2" />
                        <span>{new Date(note.updated_at).toLocaleDateString('ar-SA', { day: 'numeric', month: 'numeric' })}</span>
                    </div>

                    {/* Drag Handle */}
                    <div
                        {...attributes}
                        {...listeners}
                        className="p-0.5 text-gray-300 hover:text-indigo-400 cursor-grab active:cursor-grabbing"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GripVertical className="w-3 h-3" />
                    </div>
                </div>
            </div>

            <p className="text-[10px] text-gray-400 line-clamp-1 h-3 leading-none truncate opacity-80">
                {previewText}
            </p>
        </div>
    );
};
