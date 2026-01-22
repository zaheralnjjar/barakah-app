import React from 'react';
import { Clock, Pin, Lock, Tag, FileText } from 'lucide-react';
import { NoteData } from '@/hooks/useQuickNotes';
import { getRevisionColor } from '@/hooks/useNoteRevisions';

interface NoteCardProps {
    note: NoteData;
    onClick: () => void;
    revisionsCount?: number;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onClick, revisionsCount = 0 }) => {
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

    const getPreview = (content: string) => {
        return content.substring(0, 100) + (content.length > 100 ? '...' : '');
    };

    return (
        <button
            onClick={onClick}
            className="w-full text-right p-4 rounded-xl border border-gray-200 hover:border-primary hover:shadow-md transition-all duration-200 bg-white"
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <h3 className="font-semibold text-gray-800 truncate">
                        {note.title || 'ملاحظة بدون عنوان'}
                    </h3>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {note.isPinned && <Pin className="w-4 h-4 text-primary" fill="currentColor" />}
                    {note.isSecure && <Lock className="w-4 h-4 text-amber-500" />}
                </div>
            </div>

            {/* Content Preview */}
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {getPreview(note.content)}
            </p>

            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
                <div className="flex items-center gap-1 mb-3 flex-wrap">
                    {note.tags.slice(0, 3).map((tag, idx) => (
                        <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs"
                        >
                            <Tag className="w-3 h-3" />
                            {tag}
                        </span>
                    ))}
                    {note.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{note.tags.length - 3}</span>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500">
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
        </button>
    );
};
