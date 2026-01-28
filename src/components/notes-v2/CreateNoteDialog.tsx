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
import { Mic, MicOff, Loader2, Type, Palette } from 'lucide-react';

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

const FONT_FAMILIES = [
    { name: 'الخط الافتراضي', value: 'Inherit' },
    { name: 'Cairo', value: 'Cairo' },
    { name: 'Tajawal', value: 'Tajawal' },
    { name: 'Amiri', value: 'Amiri' },
    { name: 'Almarai', value: 'Almarai' },
    { name: 'Reem Kufi', value: 'Reem Kufi' },
];

const FONT_SIZES = [
    { name: 'صغير', value: '14px' },
    { name: 'متوسط', value: '16px' },
    { name: 'كبير', value: '18px' },
    { name: 'كبير جداً', value: '24px' },
];

const TEXT_COLORS = [
    { name: 'أسود', value: '#000000' },
    { name: 'رمادي', value: '#4B5563' },
    { name: 'أحمر', value: '#DC2626' },
    { name: 'برتقالي', value: '#EA580C' },
    { name: 'كهرماني', value: '#D97706' },
    { name: 'أخضر', value: '#16A34A' },
    { name: 'أزرق', value: '#2563EB' },
    { name: 'بنفسجي', value: '#7C3AED' },
    { name: 'وردي', value: '#DB2777' },
];

export const CreateNoteDialog: React.FC<CreateNoteDialogProps> = ({ isOpen, onClose, initialFolderId, autoStartRecording = false }) => {
    const { createNote } = useNotesV2(null);
    const { toast } = useToast();
    const { folders } = useFolders();

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [folderId, setFolderId] = useState<string>(initialFolderId || 'none');
    const [color, setColor] = useState('#FFFFFF'); // Background Color

    // Rich Text State
    const [fontFamily, setFontFamily] = useState('Inherit');
    const [fontSize, setFontSize] = useState('16px');
    const [textColor, setTextColor] = useState('#000000');

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
            setFontFamily('Inherit');
            setFontSize('16px');
            setTextColor('#000000');

            if (autoStartRecording) {
                startRecording();
            }
        } else {
            stopRecording();
        }
    }, [isOpen, initialFolderId, autoStartRecording]);

    // Track processed result indices to prevent duplicates
    const processedIndicesRef = useRef<Set<number>>(new Set());

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
        processedIndicesRef.current = new Set(); // Reset for new session

        recognitionRef.current.onstart = () => {
            setIsRecording(true);
            toast({ title: "بدأ التسجيل", description: "تحدث الآن..." });
        };

        recognitionRef.current.onresult = (event: any) => {
            let finalForThisEvent = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalForThisEvent += event.results[i][0].transcript;
                }
            }

            if (finalForThisEvent) {
                setContent(prev => {
                    const current = prev.trim();
                    const addition = finalForThisEvent.trim();
                    // Basic duplicate check: if addition is already at the end, skip
                    if (current.toLowerCase().endsWith(addition.toLowerCase())) return prev;
                    return current + (current ? ' ' : '') + addition;
                });
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
            // Determine folder: User selected > System/General > None
            let targetFolder = folderId === 'none' ? null : folderId;
            if (!targetFolder) {
                const generalFolder = folders.find(f => f.is_system) || folders.find(f => f.name === 'عام' || f.name.toLowerCase() === 'general');
                if (generalFolder) targetFolder = generalFolder.id;
            }

            await createNote({
                title: finalTitle,
                folder_id: targetFolder,
                content: content, // This is raw text for now, but Editor will wrap it if needed or we can wrap here
                // Note: The EditorV2 stores HTML. Here we are just saving raw text. 
                // However, basic formatting properties are stored separately in the NoteV2 object now.
                // The Rich Text Editor, when loading this note, should ideally wrap the content if it's plain text, 
                // OR we can wrap it in a <p> here if we want to be safe, but let's keep it clean.
                color: color,
                font_family: fontFamily,
                font_size: fontSize,
                text_color: textColor,
                background_color: color, // Sync both for compatibility
            } as any); // Type assertion if needed pending interface updates in other files

            onClose();
            toast({ title: "تم الحفظ ✅", description: "تم إنشاء الملاحظة بخصائص مخصصة" });
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
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between text-xl font-bold text-gray-800">
                        <span>ملاحظة جديدة</span>
                        {isRecording && (
                            <span className="flex items-center gap-2 text-red-500 text-sm animate-pulse bg-red-50 px-3 py-1 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-red-500" />
                                جاري التسجيل...
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* Title Input */}
                    <div className="space-y-1.5">
                        <Label className="text-gray-600">عنوان الملاحظة</Label>
                        <Input
                            placeholder="سيتم إنشاؤه تلقائياً إذا ترك فارغاً"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-lg font-medium"
                        />
                    </div>

                    {/* Rich Formatting Controls Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* Font Family */}
                        <div className="space-y-1.5">
                            <Label className="text-xs text-gray-500">نوع الخط</Label>
                            <Select value={fontFamily} onValueChange={setFontFamily}>
                                <SelectTrigger className="h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {FONT_FAMILIES.map(f => (
                                        <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                                            {f.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Font Size */}
                        <div className="space-y-1.5">
                            <Label className="text-xs text-gray-500">حجم الخط</Label>
                            <Select value={fontSize} onValueChange={setFontSize}>
                                <SelectTrigger className="h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {FONT_SIZES.map(s => (
                                        <SelectItem key={s.value} value={s.value}>
                                            {s.name} ({s.value})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Text Color */}
                        <div className="space-y-1.5">
                            <Label className="text-xs text-gray-500">لون النص</Label>
                            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-md border">
                                {TEXT_COLORS.slice(0, 5).map((c) => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        onClick={() => setTextColor(c.value)}
                                        className={`w-5 h-5 rounded-full border border-gray-200 transition-all ${textColor === c.value ? 'ring-2 ring-indigo-500 scale-110' : ''}`}
                                        style={{ backgroundColor: c.value }}
                                        title={c.name}
                                    />
                                ))}
                                <Select value={textColor} onValueChange={setTextColor}>
                                    <SelectTrigger className="w-8 h-6 p-0 border-0 bg-transparent focus:ring-0">
                                        <Palette className="w-4 h-4 text-gray-500 mx-auto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TEXT_COLORS.map(c => (
                                            <SelectItem key={c.value} value={c.value}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.value }} />
                                                    {c.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Background Color */}
                        <div className="space-y-1.5">
                            <Label className="text-xs text-gray-500">لون الخلفية</Label>
                            <div className="flex items-center gap-1 overflow-x-auto p-1">
                                {NOTE_COLORS.slice(0, 4).map((c) => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        onClick={() => setColor(c.value)}
                                        className={`w-6 h-6 rounded-full border border-gray-200 transition-all shrink-0 ${color === c.value ? 'ring-2 ring-indigo-500 scale-110' : ''}`}
                                        style={{ backgroundColor: c.value }}
                                        title={c.name}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Folder Selection with Color Visualization */}
                    <div className="space-y-1.5">
                        <Label className="text-gray-600">المجلد</Label>
                        <Select value={folderId} onValueChange={setFolderId}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="اختر مجلد" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">-- عام (بدون مجلد) --</SelectItem>
                                {folders.map(f => (
                                    <SelectItem key={f.id} value={f.id}>
                                        <span className="flex items-center gap-2">
                                            {/* Folder Color Indicator */}
                                            {f.color ? (
                                                <span className="w-3 h-3 rounded-full border shadow-sm" style={{ backgroundColor: f.color }}></span>
                                            ) : (
                                                <span>📂</span>
                                            )}
                                            {f.name}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Content Area */}
                    <div className="space-y-2 relative">
                        <Label className="text-gray-600">المحتوى</Label>
                        <Textarea
                            placeholder="اكتب تفاصيل الملاحظة هنا..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[200px] resize-y p-4 shadow-sm transition-all duration-300"
                            style={{
                                backgroundColor: color !== '#FFFFFF' ? color : undefined,
                                fontFamily: fontFamily !== 'Inherit' ? fontFamily : undefined,
                                fontSize: fontSize,
                                color: textColor,
                                lineHeight: '1.6'
                            }}
                        />
                        {/* Floating Mic Button inside Textarea area */}
                        {!isRecording && (
                            <button
                                onClick={startRecording}
                                className="absolute bottom-4 left-4 p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-full transition-colors shadow-sm border border-emerald-200"
                                title="بدء التسجيل الصوتي"
                                type="button"
                            >
                                <Mic className="w-5 h-5" />
                            </button>
                        )}
                        {isRecording && (
                            <button
                                onClick={stopRecording}
                                className="absolute bottom-4 left-4 p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-full transition-colors shadow-sm border border-red-200 animate-pulse"
                                title="إيقاف التسجيل"
                                type="button"
                            >
                                <MicOff className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 mt-2">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                        إلغاء
                    </Button>
                    <Button type="button" onClick={() => handleSubmit()} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
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
