import React from 'react';
import { useNotesV2 } from '@/hooks/useNotesV2';
import { useFolders } from '@/hooks/useFolders';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Folder, StickyNote, Plus, MoreHorizontal } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface KanbanViewProps {
    onOpenNote: (note: any) => void;
    onOpenFolder: (folder: any) => void;
    onRequestCreateNote: (folderId?: string) => void;
}

export const KanbanView: React.FC<KanbanViewProps> = ({ onOpenNote, onOpenFolder, onRequestCreateNote }) => {
    const { folders, isLoading: foldersLoading } = useFolders();
    const { notes, isLoading: notesLoading } = useNotesV2();
    const loading = foldersLoading || notesLoading;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Prepare columns: Uncategorized + Folders
    const columns = [
        { id: 'none', title: 'غير مصنف', icon: StickyNote, color: 'gray' },
        ...folders.map(f => ({ id: f.id, title: f.name, icon: Folder, color: f.color || 'blue' }))
    ];

    const getNotesForColumn = (columnId: string) => {
        if (columnId === 'none') {
            return notes.filter(n => !n.folder_id);
        }
        return notes.filter(n => n.folder_id === columnId);
    };

    return (
        <ScrollArea className="w-full whitespace-nowrap rounded-md border-0">
            <div className="flex w-max space-x-4 p-4" dir="rtl">
                {columns.map((column) => {
                    const columnNotes = getNotesForColumn(column.id);
                    return (
                        <div key={column.id} className="w-72 shrink-0 flex flex-col gap-3">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <column.icon className={`w-4 h-4 text-${column.color}-500`} />
                                    <h3 className="font-bold text-sm text-gray-700 truncate max-w-[150px]">
                                        {column.title}
                                    </h3>
                                    <Badge variant="secondary" className="text-[10px] h-4 px-1">
                                        {columnNotes.length}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => onRequestCreateNote(column.id === 'none' ? undefined : column.id)}
                                    >
                                        <Plus className="w-3 h-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => column.id !== 'none' && onOpenFolder(folders.find(f => f.id === column.id))}
                                    >
                                        <MoreHorizontal className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 min-h-[200px] max-h-[calc(100vh-180px)] overflow-y-auto bg-gray-50/50 p-2 rounded-xl border border-gray-100 scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
                                {columnNotes.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-lg opacity-40">
                                        <StickyNote className="w-6 h-6 mb-1" />
                                        <span className="text-[10px]">لا توجد ملاحظات</span>
                                    </div>
                                ) : (
                                    columnNotes.map((note) => (
                                        <Card
                                            key={note.id}
                                            className="shadow-sm hover:shadow-md transition-all cursor-pointer border-0 ring-1 ring-gray-100 active:scale-95"
                                            onClick={() => onOpenNote(note)}
                                        >
                                            <CardContent className="p-3">
                                                <h4 className="text-xs font-bold text-gray-800 line-clamp-1 mb-1">
                                                    {note.title || 'بدون عنوان'}
                                                </h4>
                                                <p className="text-[10px] text-gray-500 line-clamp-2 whitespace-normal break-all">
                                                    {note.content?.replace(/<[^>]*>/g, '') || 'لا يوجد محتوى'}
                                                </p>
                                                {note.tags && note.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {note.tags.slice(0, 2).map((tag: string) => (
                                                            <span key={tag} className="text-[8px] px-1 bg-gray-100 rounded text-gray-500">
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
};
