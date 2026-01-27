import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotesV2 } from '@/hooks/useNotesV2';
import { useFolders } from '@/hooks/useFolders';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface CreateNoteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    initialFolderId?: string | null;
    autoStartRecording?: boolean;
}

const NOTE_COLORS = [
    { name: 'افتراضي', value: '#FFFFFF' },
    { name: 'أحمر فاتح', value: '#FEF2F2' },
    { name: 'أصفر فاتح', value: '#FFFBEB' },
    { name: 'أخضر فاتح', value: '#ECFDF5' },
    { name: 'أزرق فاتح', value: '#EFF6FF' },
    { name: 'بنفسجي فاتح', value: '#F5F3FF' },
];

export const CreateNoteDialog: React.FC<CreateNoteDialogProps> = ({ isOpen, onClose, initialFolderId, autoStartRecording = false }) => {
    const { createNote } = useNotesV2(null);
    const { toast } = useToast();
    const { folders } = useFolders();

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [folderId, setFolderId] = useState<string>(initialFolderId || 'none');
    const [color, setColor] = useState('#FFFFFF');
    const [isLoading, setIsLoading] = useState(false);

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Initialize Dialog State
    useEffect(() => {
        if (isOpen) {
            setFolderId(initialFolderId || 'none');
            setTitle(''); // Reset title
            setContent(''); // Reset content
            setColor('#FFFFFF');

            if (autoStartRecording) {
                startRecording();
            }
        } else {
            stopRecording();
        }
    }, [isOpen, initialFolderId, autoStartRecording]);

    const startRecording = () => {
        if (!('webkitSpeechRecognition' in window)) {
            toast({ title: "خطأ", description: "المتصفح لا يدعم تحويل الصوت لنص", variant: "destructive" });
            return;
        }

        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'ar-SA'; // Default to Arabic

        recognitionRef.current.onstart = () => {
            setIsRecording(true);
            toast({ title: "بدأ التسجيل", description: "تحدث الآن..." });
        };

        recognitionRef.current.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                setContent(prev => prev + (prev ? ' ' : '') + finalTranscript);
            }
        };

        recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
            setIsRecording(false);
        };

        try {
            recognitionRef.current.start();
        } catch (e) {
            console.error(e);
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        let finalTitle = title.trim();

        // Auto-generate title if empty from content or date
        if (!finalTitle) {
            if (content.trim()) {
                // Use first 5 words of content
                finalTitle = content.trim().split(/\s+/).slice(0, 5).join(' ') + '...';
            } else {
                finalTitle = `ملاحظة جديدة ${new Date().toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}`;
            }
        }

        setIsLoading(true);
        try {
            await createNote({
                title: finalTitle,
                folder_id: folderId === 'none' ? null : folderId,
                content: content,
                color: color
            });
            onClose();
            toast({ title: "تم الحفظ ✅", description: "تم إنشاء الملاحظة بنجاح" });
        } catch (error: any) {
            console.error('Failed to create note:', error);
            toast({
                title: "فشل إنشاء الملاحظة",
                description: error.message || "حدث خطأ غير متوقع",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) stopRecording();
            onClose();
        }}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>ملاحظة جديدة</span>
                        {isRecording && (
                            <span className="flex items-center gap-2 text-red-500 text-sm animate-pulse">
                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                جاري التسجيل...
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Title Input */}
                    <div className="space-y-2">
                        <Label>عنوان الملاحظة (اختياري)</Label>
                        <Input
                            placeholder="سيتم إنشاؤه تلقائياً إذا ترك فارغاً"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    {/* Folder & Color Selection Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>المجلد</Label>
                            <Select value={folderId} onValueChange={setFolderId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر مجلد" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-- عام (بدون مجلد) --</SelectItem>
                                    {folders.map(f => (
                                        <SelectItem key={f.id} value={f.id}>
                                            <span className="flex items-center gap-2">
                                                {/* Ensure icon is rendered if available, default to folder icon */}
                                                <span>📂</span>
                                                {f.name}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>لون الخلفية</Label>
                            <div className="flex flex-wrap gap-1">
                                {NOTE_COLORS.map((c) => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        onClick={() => setColor(c.value)}
                                        className={`w-6 h-6 rounded-full border border-gray-200 transition-all ${color === c.value ? 'ring-2 ring-indigo-500 scale-110' : ''}`}
                                        style={{ backgroundColor: c.value }}
                                        title={c.name}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content Area with Voice Button */}
                    <div className="space-y-2 relative">
                        <div className="flex items-center justify-between">
                            <Label>المحتوى</Label>
                            <Button
                                type="button"
                                variant={isRecording ? "destructive" : "outline"}
                                size="sm"
                                onClick={toggleRecording}
                                className={`gap-2 h-8 ${isRecording ? 'animate-pulse' : ''}`}
                            >
                                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                {isRecording ? 'إيقاف التسجيل' : 'تسجيل صوتي'}
                            </Button>
                        </div>
                        <Textarea
                            placeholder="اكتب تفاصيل الملاحظة هنا..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[150px] resize-y text-lg leading-relaxed p-3"
                            style={{ backgroundColor: color !== '#FFFFFF' ? color : undefined }}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                        إلغاء
                    </Button>
                    <Button type="button" onClick={() => handleSubmit()} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                جاري الحفظ...
                            </>
                        ) : 'حفظ الملاحظة'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
