
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// Drawer imports removed
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useFolders } from '@/hooks/useFolders';
import { useNotesV2 } from '@/hooks/useNotesV2';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FileText, Save, FolderOpen, ZapOff, Briefcase, Heart, Users, Home, Activity, Mic, MicOff, Loader2, X, Check, ChevronDown, Clock, Timer } from 'lucide-react';

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
    initialFolderId?: string | null;
    autoStartRecording?: boolean;
}

const CATEGORIES = [
    { id: 'distraction', label: 'تشتت', icon: ZapOff, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', placeholder: 'ما هو سبب التشتت؟' },
    { id: 'work', label: 'عمل', icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', placeholder: 'ما هي المهمة التي تعمل عليها؟' },
    { id: 'dawah', label: 'دعوة', icon: Heart, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200', placeholder: 'تفاصيل النشاط الدعوي...' },
    { id: 'social', label: 'اجتماعي', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200', placeholder: 'مع من قضيت وقتاً؟' },
    { id: 'family', label: 'عائلة', icon: Home, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', placeholder: 'تفاصيل النشاط العائلي...' },
];

// --- Extracted Form Component to fix Focus Bug ---
interface QuickNoteFormProps {
    title: string;
    setTitle: (val: string) => void;
    content: string;
    setContent: (val: string) => void;
    selectedCategory: string | null;
    setSelectedCategory: (val: string | null) => void;
    folderId: string | null;
    setFolderId: (val: string | null) => void;
    color: string;
    setColor: (val: string) => void;
    startTime: string;
    setStartTime: (val: string) => void;
    endTime: string;
    setEndTime: (val: string) => void;
    isRecording: boolean;
    startRecording: () => void;
    stopRecording: () => void;
    onClose: () => void;
    handleSave: () => void;
    isLoading: boolean;
    folders: any[];
    isMobile: boolean;
    duration: string;
    setDuration: (val: string) => void;
    voiceTranscript: string;
}

const QuickNoteForm: React.FC<QuickNoteFormProps> = ({
    title, setTitle,
    content, setContent,
    selectedCategory, setSelectedCategory,
    folderId, setFolderId,
    color, setColor,
    startTime, setStartTime,
    endTime, setEndTime,
    isRecording, startRecording, stopRecording,
    onClose, handleSave, isLoading,
    folders, duration, setDuration,
    voiceTranscript, isMobile
}) => {
    // Track where to insert text
    const lastFocusedField = useRef<'title' | 'content'>('title');

    const handleFocus = (field: 'title' | 'content') => {
        lastFocusedField.current = field;
    };

    return (
        <div className="flex flex-col h-full bg-white sm:rounded-2xl overflow-hidden relative">
            {/* Header: Title & Categories */}
            <div className="flex flex-col border-b bg-gray-50 shrink-0">
                {isMobile ? (
                    /* MOBILE: Single Row Header */
                    <div className="px-3 py-2 flex items-center gap-2">
                        {/* 1. Category Dropdown (Left Side) */}
                        <div className="shrink-0">
                            <DropdownMenu dir="rtl">
                                <DropdownMenuTrigger asChild>
                                    <button className={cn(
                                        "flex items-center gap-1 px-2 py-1.5 rounded-lg border bg-white transition-all",
                                        selectedCategory ? CATEGORIES.find(c => c.id === selectedCategory)?.color : "text-indigo-600"
                                    )}>
                                        {selectedCategory ? (
                                            React.createElement(CATEGORIES.find(c => c.id === selectedCategory)!.icon, { className: "w-4 h-4" })
                                        ) : (
                                            <FileText className="w-4 h-4" />
                                        )}
                                        <ChevronDown className="w-3 h-3 opacity-40" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-40 p-1">
                                    <DropdownMenuItem onClick={() => setSelectedCategory(null)} className="flex items-center gap-2 py-2">
                                        <FileText className="w-4 h-4 text-indigo-600" />
                                        <span>ملاحظة</span>
                                    </DropdownMenuItem>
                                    {CATEGORIES.map(cat => (
                                        <DropdownMenuItem key={cat.id} onClick={() => setSelectedCategory(cat.id)} className="flex items-center gap-2 py-2">
                                            <cat.icon className={cn("w-4 h-4", cat.color)} />
                                            <span>{cat.label}</span>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* 2. Title Input (Center - Fill Space) */}
                        <div className="flex-1 min-w-0">
                            <Input
                                placeholder={selectedCategory
                                    ? (CATEGORIES.find(c => c.id === selectedCategory)?.placeholder || "ماذا فعلت؟")
                                    : "عنوان الملاحظة..."}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-transparent border-transparent focus:bg-white focus:border-indigo-100 font-bold text-base h-9 px-2 shadow-none text-right"
                                dir="rtl"
                                onFocus={() => handleFocus('title')}
                            />
                        </div>

                        {/* 3. Actions (Right Side) */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                                onClick={onClose}
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 active:bg-red-100"
                            >
                                <X className="w-5.5 h-5.5 text-red-500" />
                            </Button>
                            <Button
                                onClick={handleSave}
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "h-9 w-9 p-0 rounded-full transition-all",
                                    title || content ? "text-emerald-600 bg-emerald-50 shadow-sm active:bg-emerald-100" : "text-gray-300"
                                )}
                                disabled={isLoading || (!title && !content)}
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-6 h-6" />}
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* DESKTOP (Legacy / Original) Two Row Layout */
                    <>
                        {/* Row 1: Actions & Title */}
                        <div className="px-4 py-2 flex items-center justify-between gap-3">
                            {/* Header Actions (Save/Cancel) */}
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleSave}
                                    variant="ghost"
                                    size="sm"
                                    className={cn("h-9 w-9 p-0 rounded-full", title || content ? "text-indigo-600 bg-indigo-50 shadow-sm" : "text-gray-300")}
                                    disabled={isLoading || (!title && !content)}
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-5.5 h-5.5" />}
                                </Button>
                                <Button
                                    onClick={onClose}
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 w-9 p-0 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50"
                                >
                                    <X className="w-5.5 h-5.5" />
                                </Button>
                            </div>

                            {/* Title Input */}
                            <div className="flex-1">
                                <Input
                                    placeholder={selectedCategory
                                        ? (CATEGORIES.find(c => c.id === selectedCategory)?.placeholder || "ماذا فعلت؟")
                                        : "عنوان الملاحظة..."}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="bg-transparent border-transparent focus:bg-white focus:border-indigo-100 font-bold text-lg h-10 px-2 shadow-none text-right"
                                    dir="rtl"
                                    onFocus={() => handleFocus('title')}
                                />
                            </div>
                        </div>

                        {/* Row 2: Categories */}
                        <div className="px-4 pb-2 flex items-center gap-1 overflow-x-auto no-scrollbar">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 border",
                                        selectedCategory === cat.id
                                            ? `${cat.bg} ${cat.color} border-indigo-200 shadow-sm`
                                            : "bg-white text-gray-500 border-gray-100 hover:border-indigo-200"
                                    )}
                                >
                                    <cat.icon className="w-3.5 h-3.5" />
                                    <span>{cat.label}</span>
                                </button>
                            ))}
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 border",
                                    !selectedCategory
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                        : "bg-white text-gray-500 border-gray-100 hover:border-indigo-200"
                                )}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                <span>ملاحظة</span>
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Note Options (Folder & Color) - Integrated into Editor Toolbar now */}

            {/* Activity Time Inputs (Compact with Popovers) */}
            {selectedCategory && (
                <div className="px-4 py-1.5 bg-indigo-50/30 flex items-center justify-end gap-1 shrink-0 border-b border-indigo-100">
                    {/* Duration Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "h-8 flex items-center gap-1.5 px-2 rounded-lg transition-all",
                                    duration ? "bg-white text-indigo-600 border border-indigo-100 shadow-sm" : "text-gray-400 hover:bg-white hover:text-indigo-500"
                                )}
                            >
                                <Timer className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">
                                    {duration ? `${duration} د` : "المدة"}
                                </span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-32 p-3 rounded-xl shadow-xl border-indigo-100" side="bottom" align="center">
                            <label className="text-[10px] font-bold text-gray-400 mb-1.5 block text-right">المدة (د)</label>
                            <Input
                                type="number"
                                min="0"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="h-9 text-center text-sm focus:ring-1 focus:ring-indigo-200"
                                placeholder="0"
                                autoFocus
                            />
                        </PopoverContent>
                    </Popover>

                    <div className="w-px h-4 bg-indigo-200/50 mx-1 shrink-0" />

                    {/* Time Range Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "h-8 flex items-center gap-1.5 px-2 rounded-lg transition-all",
                                    startTime || endTime ? "bg-white text-indigo-600 border border-indigo-100 shadow-sm" : "text-gray-400 hover:bg-white hover:text-indigo-500"
                                )}
                            >
                                <Clock className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">
                                    {startTime && endTime ? `${startTime} - ${endTime}` :
                                        startTime ? `من ${startTime}` :
                                            endTime ? `إلى ${endTime}` : "الوقت"}
                                </span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-3 rounded-xl shadow-xl border-indigo-100" side="bottom" align="center">
                            <div className="flex flex-col gap-3" dir="rtl">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 mb-1 block">من الساعة</label>
                                    <Input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="h-9 text-center text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 mb-1 block">إلى الساعة</label>
                                    <Input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="h-9 text-center text-sm"
                                    />
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <div className="w-px h-4 bg-indigo-200/50 mx-1 shrink-0" />

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={isRecording ? stopRecording : startRecording}
                                    className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                                        isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 border border-red-100 shadow-sm'
                                    )}
                                >
                                    <Mic className="w-4 h-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                                {isRecording ? 'إيقاف التسجيل' : 'تسجيل صوتي'}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                </div>
            )}

            {/* Editor Area */}
            {selectedCategory ? (
                <textarea
                    value={content} // Content for activity is plain text
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={CATEGORIES.find(c => c.id === selectedCategory)?.placeholder}
                    className="flex-1 p-4 resize-none focus:outline-none text-lg leading-relaxed bg-transparent"
                    dir="rtl"
                    onFocus={() => handleFocus('content')}
                />
            ) : (
                <div className="flex-1 overflow-hidden relative flex flex-col">
                    <NoteEditorV2
                        initialContent={content}
                        onUpdate={setContent}
                        editable={!isLoading}
                        backgroundColor={color}
                        onBackgroundColorChange={setColor}
                        folderId={folderId}
                        onFolderChange={setFolderId}
                        folders={folders}
                        isRecording={isRecording}
                        onRecordingClick={isRecording ? stopRecording : startRecording}
                        voiceTranscript={voiceTranscript}
                        toolbarPosition="top"
                        isMobile={isMobile}
                    />
                </div>
            )}

        </div>
    );
};


export const QuickNoteDialog: React.FC<QuickNoteDialogProps> = ({ isOpen, onClose, defaultTag, initialMode = 'note', initialFolderId, autoStartRecording }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState(''); // Holds HTML for Note, Plain Text for Activity
    const [voiceTranscript, setVoiceTranscript] = useState(''); // New state for transient voice data for Editor
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
    const [durationInput, setDurationInput] = useState('');

    // Track Last Focused Field for Voice
    const focusedFieldRef = useRef<'title' | 'content'>('title');

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
            setFolderId(initialFolderId || null);
            setStartTime('');
            setEndTime('');
            setDurationInput('');
            setColor('#FFFFFF');

            if (initialMode === 'activity') {
                setSelectedCategory('distraction');
                // Auto-set start time for activity
                const now = new Date();
                setStartTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
                focusedFieldRef.current = 'title'; // Default focus
            } else {
                setSelectedCategory(null);
                focusedFieldRef.current = 'content'; // Default focus for note usually content? Or title?
            }

            if (autoStartRecording) {
                // Short delay to allow UI to render first
                setTimeout(() => startRecording(), 300);
            }
        } else {
            stopRecording();
        }
    }, [isOpen, initialMode, initialFolderId, autoStartRecording]);

    // Set default start time when category is manually selected (if not already set)
    useEffect(() => {
        if (selectedCategory && !startTime) {
            const now = new Date();
            setStartTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
        }
    }, [selectedCategory]);

    // Update Duration when Start/End changes
    useEffect(() => {
        if (startTime && endTime) {
            const d = new Date();
            const [sh, sm] = startTime.split(':').map(Number);
            d.setHours(sh, sm, 0, 0);

            const e = new Date();
            const [eh, em] = endTime.split(':').map(Number);
            e.setHours(eh, em, 0, 0);

            // Handle day crossover if end time is before start time (assume next day)
            if (e < d) {
                e.setDate(e.getDate() + 1);
            }

            const diff = (e.getTime() - d.getTime()) / 60000;
            if (diff >= 0) {
                setDurationInput(Math.round(diff).toString());
            }
        }
    }, [startTime, endTime]);

    const handleDurationChange = (val: string) => {
        setDurationInput(val);
        const mins = parseInt(val);
        if (!isNaN(mins) && startTime) {
            const [sh, sm] = startTime.split(':').map(Number);
            const start = new Date();
            start.setHours(sh, sm, 0, 0);
            const end = new Date(start.getTime() + mins * 60000);
            setEndTime(`${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`);
        }
    };

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

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    accumulatedFinal += result[0].transcript + ' ';
                }
            }

            if (accumulatedFinal.trim()) {
                const text = accumulatedFinal.trim();
                const target = focusedFieldRef.current;

                if (target === 'title') {
                    setTitle(prev => (prev ? prev + ' ' : '') + text);
                } else {
                    // If in "Activity" mode (plain text), direct append is fine
                    if (selectedCategory) {
                        setContent(prev => (prev ? prev + ' ' : '') + text);
                    } else {
                        // If in "Note" mode (Rich Text Editor), pass to generic prop to handle insertion
                        // We use a unique string triggers or just set it and let generic effect handle it?
                        // Better to set a transient value. 
                        // NoteEditorV2 will listen to changes in `voiceTranscript`.
                        // To ensure repeated same phrases trigger it, handle in child or toggle?
                        // Simply passing the chunk is enough if we clear it? 
                        // Ideally NoteEditorV2 effect should depend on the value change. 
                        // But if I say "Hello" then pause then "Hello", it might not trigger if state is same.
                        // So we might need to append a timestamp or use a ref mechanism.
                        // Actually, simplest is to just force a new reference or use a callback prop.
                        // Let's rely on NoteEditorV2 consuming `voiceTranscript` and we clear it?
                        // No, NoteEditorV2 receives props.
                        // Let's try passing the text directly. To handle same-text updates, maybe pass an object? { text, id }
                        // For now let's try just setting it.
                        setVoiceTranscript(text);
                    }
                }
            }
        };

        recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
            // Logic when recording ends
        };

        recognitionRef.current.start();
    };

    const stopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleSave = async () => {
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

    const formProps = {
        title, setTitle,
        content, setContent,
        selectedCategory, setSelectedCategory,
        folderId, setFolderId,
        color, setColor,
        startTime, setStartTime,
        endTime, setEndTime,
        isRecording, startRecording, stopRecording,
        onClose, handleSave, isLoading,
        folders, isMobile,
        duration: durationInput,
        setDuration: handleDurationChange,
        onFieldFocus: (field: 'title' | 'content') => focusedFieldRef.current = field,
        voiceTranscript
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className={cn(
                    "p-0 flex flex-col bg-transparent border-none shadow-2xl resize-y overflow-hidden",
                    // Mobile Styles
                    isMobile ? "w-[95%] top-4 translate-y-0 rounded-[1.5rem]" :
                        // Desktop Styles
                        "sm:max-w-[700px] h-[85vh] top-[5%] translate-y-0"
                )}
                dir="rtl"
                style={isMobile ? { minHeight: '300px', maxHeight: '85vh' } : { height: '85vh', maxHeight: '95vh', minHeight: '300px' }}
            >
                <DialogHeader className="sr-only">
                    <DialogTitle>ملاحظة جديدة</DialogTitle>
                </DialogHeader>
                <div className="h-full bg-white rounded-[1.5rem] overflow-hidden flex flex-col">
                    <QuickNoteForm {...formProps} />
                </div>
            </DialogContent>
        </Dialog>
    );
};
