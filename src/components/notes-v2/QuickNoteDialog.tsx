import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFolders } from '@/hooks/useFolders';
import { useNotesV2 } from '@/hooks/useNotesV2';
import { FileText, Save, FolderOpen, ZapOff, Briefcase, Heart, Users, Home, Activity, Mic, MicOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { isAndroid } from '@/utils/platformDetection';
import { NoteEditorV2 } from './NoteEditorV2';

interface QuickNoteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    defaultTag?: string;
    initialMode?: 'note' | 'activity';
}

const CATEGORIES = [
    { id: 'distraction', label: 'تشتت', icon: ZapOff, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', placeholder: 'ما هو سبب التشتت؟' },
    { id: 'work', label: 'عمل', icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', placeholder: 'ما هي المهمة التي تعمل عليها؟' },
    { id: 'dawah', label: 'دعوة', icon: Heart, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200', placeholder: 'تفاصيل النشاط الدعوي...' },
    { id: 'social', label: 'اجتماعي', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200', placeholder: 'مع من قضيت وقتاً؟' },
    { id: 'family', label: 'عائلة', icon: Home, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', placeholder: 'تفاصيل النشاط العائلي...' },
];

export const QuickNoteDialog: React.FC<QuickNoteDialogProps> = ({ isOpen, onClose, defaultTag, initialMode = 'note' }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState(''); // Holds HTML for Note, Plain Text for Activity
    const [folderId, setFolderId] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [color, setColor] = useState('#FFFFFF');
    const [isMobile, setIsMobile] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Activity Time State
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    const { folders } = useFolders();
    const { createNote } = useNotesV2();
    const { toast } = useToast();

    // Check mobile state
    useEffect(() => {
        setIsMobile(window.innerWidth < 768 || isAndroid());
    }, []);

    // Handle initial mode & reset
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setContent('');
            setFolderId(null);
            setStartTime('');
            setEndTime('');
            setColor('#FFFFFF');

            if (initialMode === 'activity') {
                setSelectedCategory('distraction');
                // Auto-set start time for activity
                const now = new Date();
                setStartTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
            } else {
                setSelectedCategory(null);
            }
        } else {
            stopRecording();
        }
    }, [isOpen, initialMode]);

    // Set default start time when category is manually selected (if not already set)
    useEffect(() => {
        if (selectedCategory && !startTime) {
            const now = new Date();
            setStartTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
        }
    }, [selectedCategory]);

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

            // Simple append for now
            // For Rich Text, this might append raw text to HTML string. 
            // Ideally NoteEditorV2 handles this via onUpdate, but here we update state directly.
            // If Rich Editor is active, appending text to HTML string usually works if appended outside tags
            // or we accept it's naive. For now simple append.
            setContent(prev => prev + ' ' + accumulatedFinal + (currentInterim ? ' ' + currentInterim : ''));
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

    const handleSave = async () => {
        // Validation logic
        // For Note: Title optional (can generate later or default), content optional?
        // For Activity: Title (Reason) recommended.

        let finalTitle = title.trim();
        const plainText = content.replace(/<[^>]*>?/gm, ''); // Simple strip for fallback title

        if (!finalTitle && !plainText.trim()) {
            toast({ title: 'يرجى إدخال محتوى', variant: 'destructive' });
            return;
        }

        if (!finalTitle) {
            if (plainText.trim()) {
                finalTitle = plainText.trim().split(/\s+/).slice(0, 5).join(' ') + '...';
            } else {
                finalTitle = selectedCategory
                    ? `نشاط ${new Date().toLocaleString('ar-EG', { timeStyle: 'short' })}`
                    : `ملاحظة جديدة ${new Date().toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}`;
            }
        }

        setIsLoading(true);
        try {
            if (selectedCategory) {
                // === Activity Log Mode ===
                let duration = 0;
                let startISO = new Date().toISOString();
                let endISO = null;

                if (startTime) {
                    const d = new Date();
                    const [h, m] = startTime.split(':');
                    d.setHours(parseInt(h), parseInt(m), 0, 0);
                    startISO = d.toISOString();

                    if (endTime) {
                        const e = new Date();
                        const [eh, em] = endTime.split(':');
                        e.setHours(parseInt(eh), parseInt(em), 0, 0);
                        endISO = e.toISOString();

                        const diffMs = e.getTime() - d.getTime();
                        if (diffMs > 0) duration = Math.round(diffMs / 60000);
                    }
                }

                const { error } = await supabase.from('distraction_logs').insert({
                    user_id: (await supabase.auth.getUser()).data.user?.id,
                    reason: finalTitle,
                    details: plainText, // Use plain text for activity details
                    category: selectedCategory,
                    start_time: startISO,
                    end_time: endISO,
                    duration_minutes: duration
                });

                if (error) throw error;
                toast({ title: 'تم تسجيل النشاط بنجاح ✅', description: `تم الحفظ في سجل ${CATEGORIES.find(c => c.id === selectedCategory)?.label}` });
            } else {
                // === Standard Note Mode (Rich Text) ===
                let targetFolder = folderId;
                if (!targetFolder) {
                    const generalFolder = folders.find(f => f.is_system) || folders.find(f => f.name === 'عام' || f.name.toLowerCase() === 'general');
                    if (generalFolder) targetFolder = generalFolder.id;
                }

                await createNote({
                    title: finalTitle,
                    content: content, // HTML content
                    folder_id: targetFolder,
                    background_color: color,
                    tags: defaultTag ? [defaultTag] : []
                });
                toast({ title: 'تم حفظ الملاحظة بنجاح ✅' });
            }

            onClose();

        } catch (error: any) {
            console.error('Error saving:', error);
            toast({
                title: 'حدث خطأ أثناء الحفظ',
                description: error.message || error.details || 'يرجى المحاولة مرة أخرى',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Shared Body Content
    const NoteFormContent = () => (
        <div className="flex flex-col h-full bg-white sm:rounded-2xl overflow-hidden">
            {/* Header / Meta Data Row */}
            <div className="px-4 py-3 border-b bg-gray-50 flex flex-wrap gap-2 items-center justify-between shrink-0">
                <div className="flex-1 min-w-[200px] flex items-center gap-2">
                    <Input
                        placeholder={selectedCategory
                            ? (CATEGORIES.find(c => c.id === selectedCategory)?.placeholder || "ماذا فعلت؟ (المهمة / النشاط)")
                            : "عنوان الملاحظة..."}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="bg-transparent border-transparent focus:bg-white focus:border-indigo-200 font-bold text-lg h-10 px-2 shadow-none"
                        dir="rtl"
                        autoFocus={!isMobile} // Don't autofocus on mobile to prevent keyboard jump
                    />
                </div>

                <div className="flex items-center gap-2">
                    {/* Category / Mode Switcher */}
                    <div className="flex gap-1 bg-gray-200/50 p-1 rounded-lg">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={cn("p-1.5 rounded-md transition-all", !selectedCategory ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600")}
                            title="ملاحظة"
                        >
                            <FileText className="w-4 h-4" />
                        </button>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                                className={cn(
                                    "p-1.5 rounded-md transition-all",
                                    selectedCategory === cat.id
                                        ? `${cat.bg} ${cat.color} shadow-sm ring-1 ring-inset ring-black/5`
                                        : "text-gray-400 hover:text-gray-600"
                                )}
                                title={cat.label}
                            >
                                <cat.icon className="w-4 h-4" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Note Mode: Color Picker & Folder */}
            {!selectedCategory && (
                <div className="px-4 py-2 bg-white flex items-center gap-2 shrink-0 border-b border-gray-100">
                    <Select value={folderId || 'none'} onValueChange={(val) => setFolderId(val === 'none' ? null : val)}>
                        <SelectTrigger className="h-8 w-[140px] text-xs bg-gray-50 border-0">
                            <SelectValue placeholder="المجلد" />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                            <SelectItem value="none">عام</SelectItem>
                            {folders.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2 mr-auto" dir="ltr">
                        <Input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-6 h-6 p-0 border-0 rounded-full overflow-hidden cursor-pointer shadow-sm ring-1 ring-gray-200"
                            title="لون الخلفية"
                        />
                    </div>
                </div>
            )}

            {/* Activity Mode: Timers */}
            {selectedCategory && (
                <div className="px-4 py-3 bg-red-50/30 flex items-center gap-4 shrink-0 border-b border-red-100 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400">من</span>
                        <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-8 w-24 text-center bg-white border-red-100 font-mono text-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400">إلى</span>
                        <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-8 w-24 text-center bg-white border-red-100 font-mono text-sm" />
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
                {selectedCategory ? (
                    <textarea
                        placeholder="تفاصيل إضافية عن النشاط..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="flex-1 w-full p-4 resize-none focus:outline-none text-lg leading-relaxed bg-white"
                        dir="rtl"
                    />
                ) : (
                    <div className="flex-1 overflow-hidden relative">
                        <NoteEditorV2
                            initialContent={content}
                            onUpdate={setContent}
                            editable={!isLoading}
                            backgroundColor={color}
                        />
                    </div>
                )}

                {/* Voice Recording Button */}
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={cn(
                        "absolute bottom-4 left-4 p-3 rounded-full transition-all shadow-lg border z-20",
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

            {/* Footer Actions */}
            <div className="p-4 border-t bg-gray-50 flex items-center gap-3 shrink-0">
                <Button variant="outline" onClick={onClose} className="flex-1 h-11" disabled={isLoading}>
                    إلغاء
                </Button>
                <Button
                    onClick={handleSave}
                    className={cn("flex-[2] h-11 text-white shadow-md font-bold text-lg", selectedCategory ? "bg-slate-800 hover:bg-slate-900" : "bg-indigo-600 hover:bg-indigo-700")}
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                            <Save className="w-5 h-5 ml-2" />
                            {selectedCategory ? 'حفظ النشاط' : 'حفظ الملاحظة'}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DrawerContent className="bg-white max-h-[95vh] h-[90vh] flex flex-col p-0">
                    <DrawerHeader className="sr-only">
                        <DrawerTitle>ملاحظة جديدة</DrawerTitle>
                    </DrawerHeader>
                    <NoteFormContent />
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[700px] h-[85vh] p-0 flex flex-col bg-transparent border-none shadow-2xl" dir="rtl">
                <DialogHeader className="sr-only">
                    <DialogTitle>ملاحظة جديدة</DialogTitle>
                </DialogHeader>
                <NoteFormContent />
            </DialogContent>
        </Dialog>
    );
};
