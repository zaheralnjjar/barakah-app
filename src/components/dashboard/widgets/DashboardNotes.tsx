import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
    StickyNote, Pin, ChevronUp, ChevronDown, Edit, Share, Trash2, FileText
} from 'lucide-react';
import { useQuickNotes, NoteData } from '@/hooks/useQuickNotes';
import { Share as CapacitorShare } from '@capacitor/share';

interface DashboardNotesProps {
    defaultExpanded?: boolean;
}

export const DashboardNotes: React.FC<DashboardNotesProps> = ({ defaultExpanded = false }) => {
    const { notesHistory, togglePin, deleteHistoryItem } = useQuickNotes();
    const [notesExpanded, setNotesExpanded] = useState(defaultExpanded);
    const [selectedNoteForView, setSelectedNoteForView] = useState<{ note: NoteData; index: number } | null>(null);
    const { toast } = useToast();

    if (!notesHistory || notesHistory.length === 0) return null;

    // Sort: pinned first
    const sortedNotes = [...notesHistory].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
    });

    const handleShareNote = async (content: string, title?: string) => {
        try {
            if (navigator.share) {
                await navigator.share({ title: title || 'ملاحظة', text: content });
            } else {
                await navigator.clipboard.writeText(content);
                toast({ title: '📋 تم نسخ الملاحظة' });
            }
        } catch (e) {
            console.error('Share failed', e);
            // Fallback to clipboard
            await navigator.clipboard.writeText(content);
            toast({ title: '📋 تم نسخ الملاحظة' });
        }
    };

    const handleExportPDF = async (noteContent: string) => {
        try {
            const isCapacitor = (window as any).Capacitor !== undefined;
            const isElectron = navigator.userAgent.includes('Electron');

            if (isElectron || !isCapacitor) {
                // Desktop/Web: Download as Text
                const textBlob = new Blob([noteContent], { type: 'text/plain;charset=utf-8' });
                const textUrl = URL.createObjectURL(textBlob);
                const a = document.createElement('a');
                a.href = textUrl;
                a.download = `note-${Date.now()}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(textUrl);
                toast({ title: 'تم التصدير', description: 'تم تصدير الملاحظة كملف نصي' });
            } else {
                // Mobile/Capacitor: Share as text
                await CapacitorShare.share({
                    title: 'مشاركة ملاحظة',
                    text: noteContent,
                    dialogTitle: 'مشاركة الملاحظة'
                });
            }
        } catch (e) {
            console.error(e);
            toast({ title: 'خطأ', description: 'حدث خطأ أثناء التصدير', variant: 'destructive' });
        }
    };

    return (
        <>
            <Card className="border-0 shadow-sm bg-white overflow-hidden mb-3">
                <div
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 border-b border-transparent hover:border-gray-100"
                    onClick={() => setNotesExpanded(!notesExpanded)}
                >
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-50 rounded-full"><StickyNote className="w-4 h-4 text-amber-600" /></div>
                        <span className="text-sm font-bold text-gray-700">الملاحظات</span>
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-gray-100 text-gray-600">{notesHistory.length}</Badge>
                    </div>
                    {notesExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>

                {/* Collapsed: Horizontal Scroll */}
                {!notesExpanded && (
                    <div className="flex gap-3 p-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
                        {sortedNotes.slice(0, 10).map((note, idx) => {
                            const originalIdx = notesHistory.indexOf(note);
                            const firstLine = note.content.split('\n')[0].trim();
                            const title = firstLine.substring(0, 20) || `ملاحظة ${idx + 1}`;
                            return (
                                <div
                                    key={idx}
                                    className={`flex-shrink-0 w-32 p-2 rounded-lg border hover:shadow-md transition-all cursor-pointer relative ${note.isPinned
                                        ? 'bg-amber-50 border-amber-200'
                                        : 'bg-white border-gray-100'}`}
                                    onClick={() => setSelectedNoteForView({ note, index: originalIdx })}
                                >
                                    {note.isPinned && (
                                        <Pin className="absolute top-1 right-1 w-3 h-3 text-red-500" fill="currentColor" />
                                    )}
                                    <p className={`text-[11px] font-semibold truncate ${note.isPinned ? 'text-amber-900' : 'text-gray-700'}`}>{title}</p>
                                    <p className="text-[9px] text-gray-400 truncate mt-0.5">{note.content.substring(0, 30)}...</p>
                                </div>
                            );
                        })}
                        {sortedNotes.length > 10 && (
                            <div className="flex-shrink-0 w-20 p-2 rounded-lg bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center cursor-pointer" onClick={() => setNotesExpanded(true)}>
                                <span className="text-[10px] text-gray-500">+{sortedNotes.length - 10} المزيد</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Expanded: Full Grid */}
                {notesExpanded && (
                    <div className="p-3 animate-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
                            {sortedNotes.map((note, idx) => {
                                const originalIdx = notesHistory.indexOf(note);
                                const firstLine = note.content.split('\n')[0].trim();
                                const title = firstLine.substring(0, 25) || `ملاحظة ${idx + 1}`;
                                const preview = note.content.substring(0, 60).replace(/\n/g, ' ');
                                return (
                                    <div
                                        key={idx}
                                        className={`p-3 rounded-lg border hover:shadow-md transition-all cursor-pointer group relative ${note.isPinned
                                            ? 'bg-amber-50 border-amber-200'
                                            : 'bg-white border-gray-100 hover:border-amber-200'}`}
                                        onClick={() => setSelectedNoteForView({ note, index: originalIdx })}
                                    >
                                        {/* Action Buttons Row */}
                                        <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); togglePin(originalIdx); }}
                                                className={`p-1 rounded-full transition-all ${note.isPinned ? 'text-red-600 bg-red-100' : 'text-orange-400 hover:bg-orange-100'}`}
                                                title={note.isPinned ? 'إلغاء التثبيت' : 'تثبيت'}
                                            >
                                                <Pin className="w-3 h-3" fill={note.isPinned ? "currentColor" : "none"} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedNoteForView({ note, index: originalIdx });
                                                }}
                                                className="p-1 rounded-full text-blue-400 hover:bg-blue-100 hover:text-blue-600"
                                                title="عرض/تعديل"
                                            >
                                                <Edit className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleShareNote(note.content, title);
                                                }}
                                                className="p-1 rounded-full text-green-400 hover:bg-green-100 hover:text-green-600"
                                                title="مشاركة"
                                            >
                                                <Share className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm('هل تريد حذف هذه الملاحظة؟')) {
                                                        deleteHistoryItem(originalIdx);
                                                        toast({ title: '🗑️ تم حذف الملاحظة' });
                                                    }
                                                }}
                                                className="p-1 rounded-full text-red-400 hover:bg-red-100 hover:text-red-600"
                                                title="حذف"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                        {/* Pin indicator when pinned */}
                                        {note.isPinned && (
                                            <Pin className="absolute top-1.5 left-1.5 w-3 h-3 text-red-500" fill="currentColor" />
                                        )}
                                        <div className="flex items-start gap-2 mt-4">
                                            <div className={`p-1.5 rounded-full transition-colors ${note.isPinned ? 'bg-amber-200' : 'bg-gray-100 group-hover:bg-amber-100'}`}>
                                                <StickyNote className={`w-3.5 h-3.5 ${note.isPinned ? 'text-amber-700' : 'text-gray-500 group-hover:text-amber-600'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-semibold truncate ${note.isPinned ? 'text-amber-900' : 'text-gray-700'}`}>{title}</p>
                                                <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5 leading-tight">{preview}...</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </Card>

            {/* Note View Dialog */}
            <Dialog open={selectedNoteForView !== null} onOpenChange={(open) => { if (!open) setSelectedNoteForView(null); }}>
                <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-right flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <StickyNote className="w-5 h-5 text-amber-500" />
                                <span>{selectedNoteForView?.note.content.split('\n')[0].substring(0, 30) || 'ملاحظة'}</span>
                            </div>

                            <div className="flex gap-1">
                                <button
                                    onClick={() => selectedNoteForView && handleShareNote(selectedNoteForView.note.content)}
                                    className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                                    title="مشاركة كنص"
                                >
                                    <Share className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => selectedNoteForView && handleExportPDF(selectedNoteForView.note.content)}
                                    className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:text-red-600 hover:bg-red-50"
                                    title="تصدير"
                                >
                                    <FileText className="w-4 h-4" />
                                </button>

                                {selectedNoteForView && (
                                    <button
                                        onClick={() => {
                                            togglePin(selectedNoteForView.index);
                                            setSelectedNoteForView(null);
                                        }}
                                        className={`p-1.5 rounded-full ${selectedNoteForView.note.isPinned ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400 hover:text-amber-500'}`}
                                    >
                                        <Pin className="w-4 h-4" fill={selectedNoteForView.note.isPinned ? "currentColor" : "none"} />
                                    </button>
                                )}
                            </div>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-4 bg-amber-50/30 rounded-lg border border-amber-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {selectedNoteForView?.note.content}
                    </div>
                    {selectedNoteForView?.note.createdAt && (
                        <p className="text-[10px] text-gray-400 text-left mt-2">
                            {new Date(selectedNoteForView.note.createdAt).toLocaleString('ar-SA')}
                        </p>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};
