import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { NoteV2 } from '@/hooks/useNotesV2';
import { GripVertical, Clock, Edit2, Trash2, FolderInput } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFolders } from '@/hooks/useFolders';
import { useNotesV2 } from '@/hooks/useNotesV2';

interface KanbanNoteCardProps {
    note: NoteV2;
    onClick: () => void;
    onEdit?: (note: NoteV2) => void;
    onDelete?: (noteId: string) => void;
}

export const KanbanNoteCard: React.FC<KanbanNoteCardProps> = ({ note, onClick, onEdit, onDelete }) => {
    const { updateNote } = useNotesV2();
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: note.id,
        data: { type: 'note', noteId: note.id, currentFolderId: note.folder_id }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none', // Essential for dnd-kit on mobile/touch
        backgroundColor: note.background_color || note.color || '#FFFFFF',
        fontFamily: note.font_family && note.font_family !== 'Inherit' ? note.font_family : undefined,
        color: note.text_color || undefined
    };

    // Strip HTML for preview
    const previewText = note.content?.replace(/<[^>]*>?/gm, '').slice(0, 60) || 'بدون محتوى';

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={onClick}
            className={`
                p-1.5 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative select-none
                ${isDragging ? 'shadow-lg border-indigo-300 rotate-2 z-50' : ''}
            `}
        >
            <div className="flex justify-between items-center gap-1.5 mb-0.5">
                {/* Title */}
                <h4 className="font-bold text-gray-800 text-[11px] line-clamp-1 flex-1">
                    {note.title || 'بدون عنوان'}
                </h4>

                {/* Date & Actions Row */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="flex items-center gap-0.5 text-[8px] text-gray-400">
                        <Clock className="w-2 h-2" />
                        <span>{new Date(note.updated_at).toLocaleDateString('ar-SA', { day: 'numeric', month: 'numeric' })}</span>
                    </div>

                    {/* Actions - Visible on Hover/Group Hover */}
                    <div className="hidden group-hover:flex items-center gap-1">
                        <button
                            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-500 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit?.(note);
                            }}
                            title="تعديل"
                        >
                            <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete?.(note.id);
                            }}
                            title="حذف"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>

                    {/* Drag Handle with Click-to-Move Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div
                                {...attributes}
                                {...listeners}
                                className="p-1 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing text-gray-300 hover:text-indigo-500"
                                onClick={(e) => {
                                    // Prevent drag start if just clicking
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                title="سحب للإفلات أو النقر للنقل"
                            >
                                <GripVertical className="w-3.5 h-3.5" />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 max-h-64 overflow-y-auto">
                            <DropdownMenuLabel className="flex items-center gap-2">
                                <FolderInput className="w-4 h-4" />
                                نقل إلى...
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <FolderListItems onSelect={(folderId) => {
                                updateNote({ id: note.id, updates: { folder_id: folderId } });
                            }} currentFolderId={note.folder_id} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <p className="text-[10px] text-gray-400 line-clamp-1 h-3 leading-none truncate opacity-80">
                {previewText}
            </p>
        </div>
    );
};

const FolderListItems = ({ onSelect, currentFolderId }: { onSelect: (id: string | null) => void, currentFolderId: string | null }) => {
    const { folders } = useFolders();

    return (
        <>
            <DropdownMenuItem
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(null);
                }}
                disabled={!currentFolderId}
            >
                بدون مجلد (رئيسي)
            </DropdownMenuItem>
            {folders.map(folder => (
                <DropdownMenuItem
                    key={folder.id}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(folder.id);
                    }}
                    disabled={currentFolderId === folder.id}
                    className="flex items-center gap-2"
                >
                    <span>{folder.icon}</span>
                    <span>{folder.name}</span>
                </DropdownMenuItem>
            ))}
        </>
    );
};
