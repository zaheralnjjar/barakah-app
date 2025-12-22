import React, { useRef, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Share2, Trash2, Printer } from 'lucide-react';
import { useQuickNotes } from '@/hooks/useQuickNotes';
import { useToast } from '@/hooks/use-toast';

export const QuickNotes = () => {
    const { notesHistory, saveNote, archiveNote, deleteHistoryItem, restoreHistoryItem } = useQuickNotes();
    const { toast } = useToast();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [selectedNotes, setSelectedNotes] = useState<number[]>([]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.value = localStorage.getItem('baraka_quick_notes') || '';
        }
    }, []);

    const handleRestore = (note: string) => {
        restoreHistoryItem(note);
        if (textareaRef.current) textareaRef.current.value = note;
    };

    const toggleSelect = (idx: number) => {
        setSelectedNotes(prev =>
            prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
        );
    };

    const shareSelected = async () => {
        const notes = selectedNotes.map(i => notesHistory[i]).join('\n\n---\n\n');
        if (navigator.share) {
            await navigator.share({ title: 'ملاحظاتي', text: notes });
        } else {
            await navigator.clipboard.writeText(notes);
            toast({ title: 'تم النسخ' });
        }
    };

    const printSelected = () => {
        const notes = selectedNotes.map(i => notesHistory[i]).join('\n\n---\n\n');
        const win = window.open('', '_blank');
        if (win) {
            win.document.write(`<html dir="rtl"><head><title>ملاحظاتي</title><style>body{font-family:Tajawal,Arial;padding:20px;white-space:pre-wrap;}</style></head><body><h1>ملاحظاتي</h1><pre>${notes}</pre></body></html>`);
            win.document.close();
            win.print();
        }
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="arabic-title text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">📝 ملاحظات سريعة</span>
                    <div className="flex gap-1">
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={async () => {
                                const notes = textareaRef.current?.value || '';
                                if (navigator.share) {
                                    await navigator.share({ title: 'ملاحظاتي', text: notes });
                                } else {
                                    await navigator.clipboard.writeText(notes);
                                    toast({ title: 'تم النسخ' });
                                }
                            }}
                        >
                            <Share2 className="w-3 h-3 ml-1" /> مشاركة
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => {
                                archiveNote(textareaRef.current?.value || '');
                                if (textareaRef.current) textareaRef.current.value = '';
                            }}
                        >
                            حفظ
                        </Button>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Textarea
                    ref={textareaRef}
                    id="quickNotes"
                    placeholder="اكتب ملاحظاتك هنا..."
                    className="min-h-[100px] text-right mb-4"
                />

                {/* Notes History / Archive */}
                {notesHistory.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-xs font-bold text-gray-500">الملاحظات المحفوظة</h4>
                            {selectedNotes.length > 0 && (
                                <div className="flex gap-1">
                                    <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={shareSelected}>
                                        <Share2 className="w-3 h-3 ml-1" /> مشاركة ({selectedNotes.length})
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={printSelected}>
                                        <Printer className="w-3 h-3 ml-1" /> طباعة
                                    </Button>
                                </div>
                            )}
                        </div>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {notesHistory.map((note, idx) => (
                                <div key={idx} className={`bg-gray-50 p-2 rounded border flex gap-2 ${selectedNotes.includes(idx) ? 'border-primary bg-primary/5' : ''}`}>
                                    <Checkbox
                                        checked={selectedNotes.includes(idx)}
                                        onCheckedChange={() => toggleSelect(idx)}
                                    />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-700 whitespace-pre-wrap line-clamp-3">{note}</p>
                                        <div className="flex justify-end gap-1 mt-1">
                                            <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => handleRestore(note)}>استعادة</Button>
                                            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-red-500" onClick={() => deleteHistoryItem(idx)}>حذف</Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
