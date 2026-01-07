import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    StickyNote,
    Mic,
    FileText,
    Plus,
    Search,
    X,
    Maximize2,
    Pin,
    PinOff,
    Share2,
    Trash2,
    Pencil,
    Mic as MicIcon,
    StopCircle
} from 'lucide-react';
import { useQuickNotes, NoteData, NoteType } from '@/hooks/useQuickNotes';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import VoiceNoteRecorder from '@/components/VoiceNoteRecorder';

interface UnifiedNotesHubProps {
    onOpenVoiceRecorder?: () => void;
}

export const UnifiedNotesHub: React.FC<UnifiedNotesHubProps> = ({ onOpenVoiceRecorder }) => {
    const { notesHistory, addNote, deleteNoteById, togglePin, updateNoteById } = useQuickNotes();
    const { toast } = useToast();

    // UI State
    const [activeTab, setActiveTab] = useState<NoteType>('main');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNote, setSelectedNote] = useState<NoteData | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Create/Edit State
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [formData, setFormData] = useState({ title: '', content: '' });

    // Voice Recorder State (Local if generic one is not passed)
    const [localVoiceRecorderOpen, setLocalVoiceRecorderOpen] = useState(false);

    // Derived State
    const filteredNotes = useMemo(() => {
        let notes = notesHistory.filter(n => (n.type || 'quick') === activeTab);

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            notes = notes.filter(n =>
                (n.title?.toLowerCase().includes(q)) ||
                (n.content.toLowerCase().includes(q))
            );
        }

        // Ensure sorting: Pinned first, then date
        return notes.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        });
    }, [notesHistory, activeTab, searchQuery]);

    const handleSave = () => {
        if (!formData.content.trim() && !formData.title.trim()) return;

        if (selectedNote && isEditing) {
            updateNoteById(selectedNote.id!, {
                title: formData.title,
                content: formData.content
            });
            toast({ title: 'تم تحديث الملاحظة' });
        } else {
            addNote(formData.content, activeTab, formData.title);
            toast({ title: 'تم إنشاء الملاحظة' });
        }

        closeDialog();
    };

    const closeDialog = () => {
        setShowCreateDialog(false);
        setIsEditing(false);
        setSelectedNote(null);
        setFormData({ title: '', content: '' });
    };

    const openForEdit = (note: NoteData) => {
        setSelectedNote(note);
        setFormData({ title: note.title || '', content: note.content });
        setIsEditing(true);
        setShowCreateDialog(true);
    };

    const openForView = (note: NoteData) => {
        // Direct edit mode as requested
        openForEdit(note);
    };

    const handleDelete = (id?: string) => {
        if (!id) return;
        if (confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) {
            deleteNoteById(id);
            closeDialog();
            toast({ title: 'تم الحذف' });
        }
    };

    const handleRecrodingSaved = (text: string) => {
        addNote(text, 'voice', `تسجيل صوتي ${new Date().toLocaleTimeString('ar-EG')}`);
        setLocalVoiceRecorderOpen(false);
        setActiveTab('voice'); // Switch to voice tab to show result
    };

    return (
        <Card className="w-full bg-white/80 backdrop-blur-sm shadow-sm border-0">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <StickyNote className="w-6 h-6 text-emerald-600" />
                        مركز الملاحظات
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                            onClick={() => setLocalVoiceRecorderOpen(true)}
                        >
                            <Mic className="w-4 h-4" />
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                            onClick={() => {
                                setFormData({ title: '', content: '' });
                                setShowCreateDialog(true);
                            }}
                        >
                            <Plus className="w-4 h-4" />
                            ملاحظة جديدة
                        </Button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative mt-4">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="بحث في الملاحظات..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10 bg-gray-50 border-transparent focus:bg-white transition-colors"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as NoteType)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100/50 p-1">
                        <TabsTrigger value="main" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <FileText className="w-4 h-4" /> الملاحظات
                        </TabsTrigger>
                        <TabsTrigger value="quick" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <StickyNote className="w-4 h-4" /> السريعة
                        </TabsTrigger>
                        <TabsTrigger value="voice" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <Mic className="w-4 h-4" /> الصوتية
                        </TabsTrigger>
                    </TabsList>

                    <div className="min-h-[300px]">
                        {filteredNotes.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredNotes.map((note) => (
                                    <div
                                        key={note.id}
                                        onClick={() => openForView(note)}
                                        className={`
                                            group relative p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md
                                            ${note.isPinned ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100 hover:border-emerald-200'}
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className={`font-bold text-sm truncate max-w-[80%] ${note.isPinned ? 'text-amber-900' : 'text-gray-800'}`}>
                                                {note.title || 'بدون عنوان'}
                                            </h3>
                                            {note.isPinned && <Pin className="w-3 h-3 text-amber-500" />}
                                        </div>

                                        <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed min-h-[40px]">
                                            {note.content}
                                        </p>

                                        <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400">
                                            <span>{new Date(note.createdAt || '').toLocaleDateString('ar-EG')}</span>

                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); togglePin(notesHistory.indexOf(note)); }} // Index fallback for togglePin legacy
                                                    className="p-1.5 hover:bg-gray-100 rounded-full"
                                                >
                                                    {note.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3 " />}
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                                                    className="p-1.5 hover:bg-red-50 text-red-500 rounded-full"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                {activeTab === 'voice' ? <Mic className="w-12 h-12 mb-3 opacity-20" /> : <FileText className="w-12 h-12 mb-3 opacity-20" />}
                                <p>لا توجد ملاحظات في هذا القسم</p>
                                <Button variant="link" onClick={() => setShowCreateDialog(true)}>
                                    + إضافة ملاحظة جديدة
                                </Button>
                            </div>
                        )}
                    </div>
                </Tabs>
            </CardContent>

            {/* Create/Edit Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-right">
                            {isEditing ? 'تعديل الملاحظة' : 'ملاحظة جديدة'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <Input
                            placeholder="العنوان"
                            className="text-right text-lg font-bold border-none shadow-none px-0 focus-visible:ring-0"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                        <div className="h-[1px] bg-gray-100 w-full" />
                        <Textarea
                            placeholder="اكتب تفاصيل الملاحظة هنا..."
                            className="text-right min-h-[300px] border-none shadow-none resize-none px-0 focus-visible:ring-0 text-base leading-relaxed"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center justify-between border-t pt-4">
                        <div className="flex gap-2">
                            {isEditing && selectedNote && (
                                <Button
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleDelete(selectedNote.id)}
                                >
                                    <Trash2 className="w-4 h-4 ml-2" />
                                    حذف
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={closeDialog}>إلغاء</Button>
                            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave}>حفظ</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <VoiceNoteRecorder
                isOpen={localVoiceRecorderOpen}
                onClose={() => setLocalVoiceRecorderOpen(false)}
                onSaveToActivities={handleRecrodingSaved} // We hijack this prop to save as a note
            />
        </Card>
    );
};
