import React, { useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, Share2, Trash2 } from 'lucide-react';
import { useQuickNotes } from '@/hooks/useQuickNotes';
import { useToast } from '@/hooks/use-toast';

export const QuickNotes = () => {
    const { notesHistory, saveNote, archiveNote, deleteHistoryItem, restoreHistoryItem } = useQuickNotes();
    const { toast } = useToast();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.value = localStorage.getItem('baraka_quick_notes') || '';
        }
    }, []);

    const handleRestore = (note: string) => {
        restoreHistoryItem(note);
        if (textareaRef.current) textareaRef.current.value = note;
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
                            onClick={() => saveNote(textareaRef.current?.value || '')}
                        >
                            <Check className="w-3 h-3 ml-1" /> حفظ
                        </Button>
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
                            className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                                archiveNote(textareaRef.current?.value || '');
                                if (textareaRef.current) textareaRef.current.value = '';
                            }}
                        >
                            <Trash2 className="w-3 h-3 ml-1" /> مسح وأرشفة
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
                        <h4 className="text-xs font-bold text-gray-500 mb-2">الملاحظات المحذوفة / الأرشيف</h4>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {notesHistory.map((note, idx) => (
                                <div key={idx} className="bg-gray-50 p-2 rounded border flex flex-col gap-2">
                                    <p className="text-xs text-gray-700 whitespace-pre-wrap line-clamp-3">{note}</p>
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => handleRestore(note)}>استعادة</Button>
                                        <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => {
                                            if (navigator.share) navigator.share({ text: note });
                                            else navigator.clipboard.writeText(note);
                                        }}>مشاركة</Button>
                                        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-red-500" onClick={() => deleteHistoryItem(idx)}>حذف نهائي</Button>
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
