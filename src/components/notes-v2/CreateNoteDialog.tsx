import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotesV2 } from '@/hooks/useNotesV2';
import { useFolders } from '@/hooks/useFolders';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { NoteEditorV2 } from './NoteEditorV2';

interface CreateNoteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    initialFolderId?: string | null;
    autoStartRecording?: boolean;
}

export const CreateNoteDialog: React.FC<CreateNoteDialogProps> = ({ isOpen, onClose, initialFolderId, autoStartRecording = false }) => {
    const { createNote } = useNotesV2(null);
    const { toast } = useToast();
    const { folders } = useFolders();

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState(''); // Stores HTML
    const [color, setColor] = useState('#FFFFFF'); // Background Color
    const [folderId, setFolderId] = useState<string>(initialFolderId || 'none');

    const [isLoading, setIsLoading] = useState(false);

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);
    const originalContentRef = useRef('');

    const [isDistraction, setIsDistraction] = useState(false);
    const [distractionDuration, setDistractionDuration] = useState(0);

    // Initialize Dialog State
    useEffect(() => {
        if (isOpen) {
            setFolderId(initialFolderId || 'none');
            setTitle('');
            setContent('');
            setIsDistraction(false);

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
        recognitionRef.current.lang = 'ar-SA';

        originalContentRef.current = content; // Store content at start

        recognitionRef.current.onstart = () => {
            setIsRecording(true);
            toast({ title: "بدأ التسجيل", description: "تحدث الآن..." });
        };

        recognitionRef.current.onresult = (event: any) => {
            let accumulatedFinal = '';
            let currentInterim = '';

            for (let i = 0; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    accumulatedFinal += result[0].transcript + ' ';
                } else {
                    currentInterim += result[0].transcript;
                }
            }

            // Append to existing HTML or text
            // Since content is HTML, we simply append text. NoteEditorV2 sync logic handles it.
            // For better UX during recording, we might assume simple text append.
            // If we blindly append text to HTML string, it might break tags.
            // But usually raw text appended to HTML renders as text outside tags or is fixed by parser.
            // Let's rely on simple concatenation for now.
            const prefix = originalContentRef.current ? originalContentRef.current : '';
            setContent(prefix + ' ' + accumulatedFinal.trim() + (currentInterim ? ' ' + currentInterim : ''));
        };

        recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            if (event.error !== 'no-speech') {
                setIsRecording(false);
            }
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

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // Strip HTML to get plain text for title generation if needed
        const plainText = content.replace(/<[^>]*>?/gm, '');
        let finalTitle = title.trim();

        if (!finalTitle) {
            if (plainText.trim()) {
                finalTitle = plainText.trim().split(/\s+/).slice(0, 5).join(' ') + '...';
            } else {
                finalTitle = `ملاحظة جديدة ${new Date().toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}`;
            }
        }

        setIsLoading(true);
        try {
            let targetFolder = folderId === 'none' ? null : folderId;
            if (!targetFolder) {
                const generalFolder = folders.find(f => f.is_system) || folders.find(f => f.name === 'عام' || f.name.toLowerCase() === 'general');
                if (generalFolder) targetFolder = generalFolder.id;
            }

            if (isDistraction) {
                const userId = (await supabase.auth.getUser()).data.user?.id;
                if (userId) {
                    await supabase.from('distraction_logs').insert([{
                        user_id: userId,
                        reason: plainText || finalTitle,
                        task_id: null,
                        duration_minutes: distractionDuration,
                        created_at: new Date().toISOString()
                    }]);
                    toast({ title: "تم تسجيل التشتت", description: "تم الحفظ في سجل التشتت فقط." });
                }
                setIsLoading(false);
                onClose();
                return;
            }

            // Create Note with HTML content
            await createNote({
                title: finalTitle,
                folder_id: targetFolder,
                content: content, // HTML
                // Default legacy values
                color: '#FFFFFF',
                font_family: 'Inherit',
                font_size: '16px',
                text_color: '#000000',
                background_color: '#FFFFFF',
                is_bold: false,
                text_align: 'right',
                tags: []
            } as any);

            onClose();
            toast({ title: "تم الحفظ ✅", description: "تم إنشاء الملاحظة بنجاح" });

        } catch (error: any) {
            console.error('Failed to create note:', error);
            toast({ title: "فشل إنشاء الملاحظة", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) stopRecording();
            onClose();
        }}>
            <DialogContent className="sm:max-w-[700px] h-[80vh] fixed top-[5%] translate-y-0 flex flex-col p-0 gap-0 overflow-hidden rounded-2xl shadow-xl" dir="rtl">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50/80 shrink-0 gap-2 backdrop-blur-sm z-20">
                    <div className="flex-1 flex items-center gap-2">
                        <Input
                            placeholder="عنوان الملاحظة (اختياري)"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="h-9 text-sm font-bold bg-transparent border-transparent focus:bg-white focus:border-gray-200 transition-all rounded-lg placeholder:text-gray-400 px-2"
                        />
                        {isRecording && (
                            <span className="flex items-center gap-1.5 text-red-500 text-[10px] animate-pulse bg-red-50 px-2 py-0.5 rounded-full border border-red-100 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                تسجيل...
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        {/* Folder Select */}
                        <Select value={folderId} onValueChange={setFolderId}>
                            <SelectTrigger className="h-8 w-[120px] text-xs bg-gray-50 border-transparent hover:bg-gray-100">
                                <SelectValue placeholder="مجلد" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">-- عام --</SelectItem>
                                {folders.map(f => (
                                    <SelectItem key={f.id} value={f.id} className="text-xs">
                                        {f.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Distraction Toggle */}
                        <div
                            className={cn("h-8 w-8 flex items-center justify-center rounded-md cursor-pointer transition-colors border border-transparent", isDistraction ? "bg-red-100 text-red-600 border-red-200" : "hover:bg-gray-100 text-gray-400")}
                            onClick={() => setIsDistraction(!isDistraction)}
                            title="تشتت"
                        >
                            <Checkbox id="distraction-mode-compact" checked={isDistraction} className="hidden" />
                            <span className="text-xs font-bold">⚠️</span>
                        </div>
                        {isDistraction && (
                            <Input
                                type="number"
                                min="0"
                                placeholder="د"
                                value={distractionDuration}
                                onChange={(e) => setDistractionDuration(parseInt(e.target.value) || 0)}
                                className="h-8 w-14 text-center text-xs bg-red-50 border-transparent rounded-md px-1"
                            />
                        )}

                        <div className="w-px h-6 bg-gray-300 mx-1" />

                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            disabled={isLoading}
                            className="text-gray-500 hover:text-gray-700 h-8 px-3 text-xs"
                        >
                            إلغاء
                        </Button>

                        {/* Background Color Picker */}
                        <div className="relative">
                            <Input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-8 h-8 p-0 border-0 rounded-full overflow-hidden cursor-pointer"
                                title="لون الخلفية"
                            />
                        </div>

                        <Button
                            type="button"
                            onClick={() => handleSubmit()}
                            disabled={isLoading}
                            size="sm"
                            className="bg-gray-900 hover:bg-black text-white h-8 px-4 rounded-lg shadow-sm text-xs"
                        >
                            {isLoading ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : 'حفظ'}
                        </Button>
                    </div>
                </div>

                {/* Editor Area - Using NoteEditorV2 */}
                <div className="flex-1 min-h-0 bg-slate-50 relative p-2">
                    <NoteEditorV2
                        initialContent={content}
                        onUpdate={setContent}
                        editable={!isLoading}
                        backgroundColor={color}
                    />

                    {/* Floating Mic Button */}
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={cn(
                            "absolute bottom-4 left-4 p-3 rounded-full transition-all shadow-lg border z-50",
                            isRecording
                                ? 'bg-red-500 text-white hover:bg-red-600 border-red-600 animate-pulse'
                                : 'bg-white/90 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 border-gray-200 backdrop-blur-sm'
                        )}
                        title={isRecording ? "إيقاف التسجيل" : "تسجيل صوتي"}
                        type="button"
                    >
                        {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
