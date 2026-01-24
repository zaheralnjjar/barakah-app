import React from 'react';
import { Clock, Pin, Lock, Tag, FileText, Edit, Trash2 } from 'lucide-react';
import { NoteData } from '@/hooks/useQuickNotes';
import { getRevisionColor } from '@/hooks/useNoteRevisions';

interface NoteCardProps {
    note: NoteData;
    onClick: () => void;
    onDelete?: (noteId: string) => void;
    onDragStart?: (e: React.DragEvent, noteId: string) => void;
    revisionsCount?: number;
}


export const NoteCard: React.FC<NoteCardProps> = ({ note, onClick, onDelete, onDragStart, revisionsCount = 0 }) => {
    const formatDate = (date?: string) => {
        if (!date) return '';
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (hours < 1) return 'منذ دقائق';
        if (hours < 24) return `منذ ${hours} ساعة`;
        if (days < 7) return `منذ ${days} يوم`;
        return d.toLocaleDateString('ar-SA');
    };

    // Extract first line from content as title if no title is set
    const getDisplayTitle = () => {
        if (note.title && note.title.trim()) {
            return note.title;
        }

        // Get first line from content (after any separator if exists)
        const lines = note.content.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('━') || trimmed.startsWith('─')) continue;
                if (/^[🔵🟢🟡🟠🔴🟣⚪🟤]\s*\[/.test(trimmed)) continue;
                return trimmed.substring(0, 50) + (trimmed.length > 50 ? '...' : '');
            }
        }

        return 'ملاحظة بدون عنوان';
    };

    return (
        <div className="w-full rounded-xl border border-gray-200 hover:border-primary hover:shadow-md transition-all duration-200 bg-white overflow-hidden relative group">
            {/* Header - Clickable */}
            <button
                onClick={onClick}
                draggable={!!note.id}
                onDragStart={(e) => onDragStart && onDragStart(e, note.id)}
                className="w-full text-right p-3 flex items-start justify-between gap-2 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                    <h3 className="font-semibold text-gray-800 truncate text-sm">
                        {getDisplayTitle()}
                    </h3>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {note.isPinned && <Pin className="w-3 h-3 text-primary" fill="currentColor" />}
                    {note.isSecure && <Lock className="w-3 h-3 text-amber-500" />}
                    <Edit className="w-3 h-3 text-gray-400" />
                </div>
            </button>

            {/* Delete Button - Always visible */}
            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(note.id);
                    }}
                    className="absolute top-2 left-2 p-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                    title="حذف الملاحظة"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}

            {/* Scrollable Content Preview */}
            <div
                className="px-3 max-h-32 overflow-y-auto text-sm text-gray-600 border-t border-gray-100"
                style={{ scrollbarWidth: 'thin' }}
            >
                <div
                    className="whitespace-pre-wrap font-sans py-2 text-right prose prose-sm max-w-none [&_*]:inline"
                    dir="rtl"
                    dangerouslySetInnerHTML={{ __html: note.content || 'لا يوجد محتوى' }}
                />
            </div>

            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
                <div className="flex items-center gap-1 px-3 py-1 flex-wrap border-t border-gray-100">
                    {note.tags.slice(0, 3).map((tag, idx) => (
                        <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs"
                        >
                            <Tag className="w-2 h-2" />
                            {tag}
                        </span>
                    ))}
                    {note.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{note.tags.length - 3}</span>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500 px-3 py-2 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(note.updatedAt)}
                </div>
                {revisionsCount > 0 && (
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(revisionsCount, 5) }).map((_, idx) => {
                            const color = getRevisionColor(idx);
                            return (
                                <span
                                    key={idx}
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: color.color }}
                                    title={color.name}
                                />
                            );
                        })}
                        <span>{revisionsCount} تعديل</span>
                    </div>
                )}
            </div>
        </div>
    );
};
