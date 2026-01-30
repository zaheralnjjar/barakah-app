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
import { Mic, MicOff, Loader2, Type, Palette, PaintBucket } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface CreateNoteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    initialFolderId?: string | null;
    autoStartRecording?: boolean;
}

const NOTE_COLORS = [
    { name: 'أسود', value: '#000000' },
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
    { name: 'أبيض', value: '#FFFFFF' },
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
    const [isBold, setIsBold] = useState(false);

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
            setTitle(''); // Reset title
            setContent(''); // Reset content
            setColor('#FFFFFF');
            setFontFamily('Inherit');
            setFontSize('16px');
            setTextColor('#000000');
            setIsBold(false);
            setIsDistraction(false); // Reset distraction flag

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

        originalContentRef.current = content; // Store content at start

        recognitionRef.current.onstart = () => {
            setIsRecording(true);
            toast({ title: "بدأ التسجيل", description: "تحدث الآن..." });
        };

        recognitionRef.current.onresult = (event: any) => {
            // Build the final transcript from ALL final results so far (not just this event)
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

            // Combine: original content + all finals + current interim
            const prefix = originalContentRef.current ? originalContentRef.current.trim() + ' ' : '';
            setContent(prefix + accumulatedFinal.trim() + (currentInterim ? ' ' + currentInterim : ''));
        };

        recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            // Don't stop recording on no-speech errors, just ignore
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
                // Try to find a default "General" folder if user didn't pick one
                const generalFolder = folders.find(f => f.is_system) || folders.find(f => f.name === 'عام' || f.name.toLowerCase() === 'general');
                if (generalFolder) targetFolder = generalFolder.id;
            }

            // 1. Distraction Logic: If it's a distraction, save ONLY to distraction_logs and RETURN.
            if (isDistraction) {
                try {
                    const userId = (await supabase.auth.getUser()).data.user?.id;
                    if (userId) {
                        await supabase.from('distraction_logs').insert([{
                            user_id: userId,
                            reason: content || finalTitle,
                            task_id: null,
                            duration_minutes: distractionDuration,
                            created_at: new Date().toISOString()
                        }]);
                        toast({ title: "تم تسجيل التشتت", description: "تم الحفظ في سجل التشتت فقط." });
                    }
                } catch (distractionError) {
                    console.error("Failed to log distraction:", distractionError);
                    toast({ title: "خطأ", description: "فشل تسجيل التشتت", variant: "destructive" });
                }

                // Reset and Close - DO NOT save as note
                setIsLoading(false);
                setContent('');
                setTitle('');
                setIsDistraction(false);
                onClose();
                return;
            }

            // 2. Create Note (Only if NOT a distraction)
            const noteTags = [];
            await createNote({
                title: finalTitle,
                folder_id: targetFolder,
                content: content,
                color: color,
                font_family: fontFamily,
                font_size: fontSize,
                text_color: textColor,
                background_color: color,
                is_bold: isBold,
                tags: noteTags
            } as any);

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
            <DialogContent className="sm:max-w-[600px] h-[70vh] fixed top-[5%] translate-y-0 flex flex-col p-0 gap-0 overflow-hidden" dir="rtl">
                {/* Header with Title and Actions */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/50 shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                        <span>ملاحظة جديدة</span>
                        {isRecording && (
                            <span className="flex items-center gap-1.5 text-red-500 text-xs animate-pulse bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                تسجيل...
                            </span>
                        )}
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            disabled={isLoading}
                            className="text-gray-500 hover:text-gray-700 h-8 px-3"
                        >
                            إلغاء
                        </Button>
                        <Button
                            type="button"
                            onClick={() => handleSubmit()}
                            disabled={isLoading}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-4 rounded-md shadow-sm"
                        >
                            {isLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : 'حفظ'}
                        </Button>
                    </div>
                </div>

                {/* Scrollable Content Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {/* Title Input */}
                    <div className="space-y-1">
                        <Input
                            placeholder="عنوان الملاحظة (اختياري)"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-lg font-bold border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-emerald-500 placeholder:text-gray-400"
                        />
                    </div>

                    {/* Controls & Options Wrapped for Compactness */}
                    <div className="bg-gray-50 rounded-lg p-3 space-y-3 border border-gray-100">
                        {/* Row 1: Formatting */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Bold Toggle */}
                            <button
                                type="button"
                                onClick={() => setIsBold(!isBold)}
                                className={cn(
                                    "p-1.5 rounded-lg transition-all border shrink-0",
                                    isBold ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-white text-gray-400 border-gray-200 hover:bg-gray-50"
                                )}
                                title="عرض عريض"
                            >
                                <span className="font-bold">B</span>
                            </button>

                            <div className="w-px h-6 bg-gray-200 mx-1 shrink-0" />

                            {/* Font Family */}
                            <Select value={fontFamily} onValueChange={setFontFamily}>
                                <SelectTrigger className="h-7 w-[110px] text-xs bg-white border-gray-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {FONT_FAMILIES.map(f => (
                                        <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }} className="text-xs">
                                            {f.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Font Size */}
                            <Select value={fontSize} onValueChange={setFontSize}>
                                <SelectTrigger className="h-7 w-[80px] text-xs bg-white border-gray-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {FONT_SIZES.map(s => (
                                        <SelectItem key={s.value} value={s.value} className="text-xs">
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Text Color */}
                            <Select value={textColor} onValueChange={setTextColor}>
                                <SelectTrigger className="h-7 w-[40px] px-1 bg-white border-gray-200 flex justify-center items-center">
                                    <Palette className="w-3.5 h-3.5" style={{ color: textColor }} />
                                </SelectTrigger>
                                <SelectContent>
                                    {TEXT_COLORS.map(c => (
                                        <SelectItem key={c.value} value={c.value}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.value }} />
                                                {c.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Background Color Shortcuts */}
                            {/* Background Color Dropdown */}
                            <Select value={color} onValueChange={setColor}>
                                <SelectTrigger className="h-7 w-[40px] px-1 bg-white border-gray-200 flex justify-center items-center" title="لون الخلفية">
                                    <PaintBucket className="w-3.5 h-3.5 text-gray-600" style={{ fill: color !== '#FFFFFF' ? color : 'none' }} />
                                </SelectTrigger>
                                <SelectContent>
                                    {NOTE_COLORS.map(c => (
                                        <SelectItem key={c.value} value={c.value}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full border border-gray-100" style={{ backgroundColor: c.value }} />
                                                {c.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Row 2: Folder & Distraction */}
                        <div className="flex items-center gap-2 border-t pt-2 border-gray-200/50">
                            <div className="flex-1">
                                <Select value={folderId} onValueChange={setFolderId}>
                                    <SelectTrigger className="h-7 text-xs bg-white border-gray-200">
                                        <SelectValue placeholder="اختر مجلد" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- عام --</SelectItem>
                                        {folders.map(f => (
                                            <SelectItem key={f.id} value={f.id} className="text-xs">
                                                <span className="flex items-center gap-2">
                                                    {f.color ? (
                                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }}></span>
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

                            <div
                                className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors border ${isDistraction ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                onClick={() => setIsDistraction(!isDistraction)}
                            >
                                <Checkbox
                                    id="distraction-mode"
                                    checked={isDistraction}
                                    onCheckedChange={(checked) => setIsDistraction(checked as boolean)}
                                    className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500 w-3.5 h-3.5"
                                />
                                <Label htmlFor="distraction-mode" className="text-[10px] font-medium cursor-pointer pointer-events-none">
                                    تشتت
                                </Label>
                            </div>

                            {isDistraction && (
                                <Input
                                    type="number"
                                    min="0"
                                    placeholder="د"
                                    title="المدة بالدقائق"
                                    value={distractionDuration}
                                    onChange={(e) => setDistractionDuration(parseInt(e.target.value) || 0)}
                                    className="h-7 w-12 text-center text-xs bg-white border-red-200 focus:border-red-400"
                                />
                            )}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="relative flex-1 min-h-[200px] h-full">
                        <Textarea
                            placeholder="اكتب تفاصيل الملاحظة هنا..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-full min-h-[250px] resize-none p-4 shadow-sm border-0 focus-visible:ring-1 focus-visible:ring-emerald-500/30 rounded-lg text-base"
                            style={{
                                backgroundColor: color !== '#FFFFFF' ? color : '#fafafa',
                                fontFamily: fontFamily !== 'Inherit' ? fontFamily : undefined,
                                fontSize: fontSize,
                                color: textColor,
                                lineHeight: '1.6'
                            }}
                        />

                        {/* Floating Mic Button - Positioned absolutely within the textarea container */}
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`absolute bottom-4 left-4 p-2 rounded-full transition-all shadow-md border ${isRecording
                                ? 'bg-red-500 text-white hover:bg-red-600 border-red-600 animate-pulse'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200'
                                }`}
                            title={isRecording ? "إيقاف التسجيل" : "تسجيل صوتي"}
                            type="button"
                        >
                            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
