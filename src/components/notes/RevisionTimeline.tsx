import React from 'react';
import { Clock, RotateCcw } from 'lucide-react';
import { NoteRevision, getRevisionColor } from '@/hooks/useNoteRevisions';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RevisionTimelineProps {
    revisions: NoteRevision[];
    onRestore: (revisionId: string) => void;
}

export const RevisionTimeline: React.FC<RevisionTimelineProps> = ({ revisions, onRestore }) => {
    const formatDate = (date: string) => {
        const d = new Date(date);
        return d.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getPreview = (content: string) => {
        return content.substring(0, 150) + (content.length > 150 ? '...' : '');
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">سجل التعديلات</h3>
                <p className="text-sm text-gray-500">
                    {revisions.length} {revisions.length === 1 ? 'تعديل' : 'تعديلات'}
                </p>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                    {revisions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>لا توجد تعديلات بعد</p>
                        </div>
                    ) : (
                        revisions.map((revision, idx) => {
                            const colorInfo = getRevisionColor(revision.revisionNumber);
                            return (
                                <div
                                    key={revision.id}
                                    className="relative pl-6 pb-6 border-r-2"
                                    style={{ borderColor: colorInfo.color }}
                                >
                                    {/* Timeline Dot */}
                                    <div
                                        className="absolute -right-2 top-0 w-4 h-4 rounded-full border-2 border-white"
                                        style={{ backgroundColor: colorInfo.color }}
                                    />

                                    {/* Revision Card */}
                                    <div className="bg-white rounded-lg border p-4 shadow-sm">
                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="text-2xl"
                                                    title={colorInfo.name}
                                                >
                                                    {colorInfo.emoji}
                                                </span>
                                                <div>
                                                    <h4 className="font-semibold text-gray-800">
                                                        {revision.revisionTitle}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDate(revision.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => onRestore(revision.id)}
                                                className="gap-1"
                                            >
                                                <RotateCcw className="w-3 h-3" />
                                                استعادة
                                            </Button>
                                        </div>

                                        {/* Changes Summary */}
                                        {revision.changesSummary && (
                                            <div className="mb-2 p-2 bg-amber-50 rounded text-sm text-amber-800">
                                                ✏️ {revision.changesSummary}
                                            </div>
                                        )}

                                        {/* Content Preview */}
                                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                            {getPreview(revision.content)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};
