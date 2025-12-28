import React, { useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Share2, Trash2, Pencil, Plus, StickyNote, ChevronDown } from 'lucide-react';
import { useQuickNotes, NoteData } from '@/hooks/useQuickNotes';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface NoteItem {
    id: number;
    title: string;
    content: string;
    createdAt: string;
}

const NoteItemComponent: React.FC<{ note: NoteItem; onSelect: (note: NoteItem) => void }> = ({ note, onSelect }) => {
    return (
        <div
            onClick={() => onSelect(note)}
            className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-xl p-2 border border-amber-200 flex flex-col transition-transform active:scale-95 cursor-pointer hover:bg-amber-100"
        >
            <div className="flex items-center gap-2 p-1.5">
                <StickyNote className="w-6 h-6 shrink-0 text-amber-600" />
                <p className="text-xs font-medium line-clamp-2 leading-tight flex-1 text-gray-700">
                    {note.title}
                </p>
            </div>
        </div>
    );
};

export const QuickNotes = () => {
    const { notesHistory, archiveNote, deleteHistoryItem } = useQuickNotes();
    const { toast } = useToast();
    const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showAddNote, setShowAddNote] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const [newNote, setNewNote] = useState({ title: '', content: '' });
    const [editNote, setEditNote] = useState({ title: '', content: '' });

    // Convert NoteData objects to NoteItem format
    const notes: NoteItem[] = notesHistory.map((note, idx) => {
        const lines = note.content.split('\n');
        return {
            id: idx,
            title: lines[0]?.substring(0, 30) || 'ملاحظة',
            content: note.content,
            createdAt: note.createdAt || new Date().toISOString()
        };
    });

    const displayedNotes = showAll ? notes : notes.slice(0, 6);

    const handleAddNote = () => {
        if (!newNote.content) {
            toast({ title: 'أدخل محتوى الملاحظة' });
            return;
        }
        const noteText = newNote.title ? `${newNote.title}\n${newNote.content}` : newNote.content;
        archiveNote(noteText, false);
        setNewNote({ title: '', content: '' });
        setShowAddNote(false);
        toast({ title: 'تم حفظ الملاحظة ✓' });
    };

    const handleShare = async (note: NoteItem) => {
        if (navigator.share) {
            await navigator.share({ title: note.title, text: note.content });
        } else {
            await navigator.clipboard.writeText(note.content);
            toast({ title: 'تم النسخ' });
        }
    };

    const handleDelete = (idx: number) => {
        deleteHistoryItem(idx);
        setSelectedNote(null);
        toast({ title: 'تم الحذف' });
    };

    const handleShareAll = async () => {
        if (notes.length === 0) {
            toast({ title: 'لا توجد ملاحظات للمشاركة' });
            return;
        }

        let shareText = '📝 ملاحظاتي - تطبيق بركة\n';
        shareText += '━━━━━━━━━━━━━━━━━━━\n\n';

        notes.forEach((note) => {
            shareText += `📌 ${note.title}\n`;
            shareText += `${note.content}\n`;
            shareText += '\n─────────────────\n\n';
        });

        shareText += `\n✨ المجموع: ${notes.length} ملاحظة`;

        if (navigator.share) {
            try {
                await navigator.share({ title: 'ملاحظاتي', text: shareText });
            } catch (e) {
                await navigator.clipboard.writeText(shareText);
                toast({ title: 'تم نسخ جميع الملاحظات' });
            }
        } else {
            await navigator.clipboard.writeText(shareText);
            toast({ title: 'تم نسخ جميع الملاحظات' });
        }
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="arabic-title text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">📝 ملاحظات سريعة</span>
                    <div className="flex gap-1">
                        {notes.length > 0 && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1"
                                onClick={handleShareAll}
                            >
                                <Share2 className="w-4 h-4" />
                            </Button>
                        )}
                        <Button
                            size="sm"
                            className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => setShowAddNote(true)}
                        >
                            <Plus className="w-4 h-4" /> إضافة
                        </Button>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Note Grid */}
                {notes.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {displayedNotes.map((note, idx) => (
                                <NoteItemComponent
                                    key={idx}
                                    note={note}
                                    onSelect={setSelectedNote}
                                />
                            ))}
                        </div>

                        {/* Show All Button */}
                        {notes.length > 6 && !showAll && (
                            <Button
                                variant="ghost"
                                className="w-full mt-3 text-amber-600 hover:bg-amber-50"
                                onClick={() => setShowAll(true)}
                            >
                                <ChevronDown className="w-4 h-4 ml-1" />
                                عرض الكل ({notes.length})
                            </Button>
                        )}
                    </>
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        <StickyNote className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>لا توجد ملاحظات محفوظة</p>
                    </div>
                )}

                {/* Note Detail Popup */}
                <Dialog open={!!selectedNote && !isEditing} onOpenChange={() => setSelectedNote(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-right">{selectedNote?.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap text-right">
                                    {selectedNote?.content}
                                </p>
                            </div>
                            <div className="flex justify-between gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 gap-1"
                                    onClick={() => {
                                        if (selectedNote) {
                                            setEditNote({ title: selectedNote.title, content: selectedNote.content });
                                            setIsEditing(true);
                                        }
                                    }}
                                >
                                    <Pencil className="w-4 h-4" /> تعديل
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 gap-1"
                                    onClick={() => selectedNote && handleShare(selectedNote)}
                                >
                                    <Share2 className="w-4 h-4" /> مشاركة
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 gap-1 text-red-500 hover:text-red-600"
                                    onClick={() => selectedNote && handleDelete(selectedNote.id)}
                                >
                                    <Trash2 className="w-4 h-4" /> حذف
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={isEditing} onOpenChange={() => setIsEditing(false)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-right">تعديل الملاحظة</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Input
                                placeholder="العنوان (اختياري)"
                                value={editNote.title}
                                onChange={(e) => setEditNote({ ...editNote, title: e.target.value })}
                                className="text-right"
                            />
                            <Textarea
                                placeholder="محتوى الملاحظة..."
                                value={editNote.content}
                                onChange={(e) => setEditNote({ ...editNote, content: e.target.value })}
                                className="min-h-[150px] text-right"
                            />
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
                                    إلغاء
                                </Button>
                                <Button
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => {
                                        if (selectedNote) {
                                            deleteHistoryItem(selectedNote.id);
                                            const noteText = editNote.title ? `${editNote.title}\n${editNote.content}` : editNote.content;
                                            archiveNote(noteText, false);
                                            setIsEditing(false);
                                            setSelectedNote(null);
                                            toast({ title: 'تم التعديل ✓' });
                                        }
                                    }}
                                >
                                    حفظ التعديلات
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Add Note Dialog */}
                <Dialog open={showAddNote} onOpenChange={setShowAddNote}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-right">ملاحظة جديدة</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Input
                                placeholder="العنوان (اختياري)"
                                value={newNote.title}
                                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                                className="text-right"
                            />
                            <Textarea
                                placeholder="اكتب ملاحظتك هنا..."
                                value={newNote.content}
                                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                                className="min-h-[150px] text-right"
                            />
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => setShowAddNote(false)}>
                                    إلغاء
                                </Button>
                                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleAddNote}>
                                    <Plus className="w-4 h-4 ml-1" /> حفظ
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
};
