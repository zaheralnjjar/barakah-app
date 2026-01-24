import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MicOff, Check, X, Loader2, Plus, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNotesV2, NoteV2 } from '@/hooks/useNotesV2';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

interface VoiceNoteRecorderProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveToActivities: (text: string) => void;
}

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({ isOpen, onClose, onSaveToActivities }) => {
    const { toast } = useToast();
    const { notes, createNote, updateNote } = useNotesV2();
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [speechSupported, setSpeechSupported] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedNoteIndex, setSelectedNoteIndex] = useState<string>('new');
    const [manualMode, setManualMode] = useState(false);
    const [useNativeSpeech, setUseNativeSpeech] = useState(false);
    const recognitionRef = useRef<any>(null);
    const finalTranscriptRef = useRef<string>('');
    const processedResultsRef = useRef<Set<number>>(new Set());
    const previousTranscriptRef = useRef<string>('');
    const manualStopRef = useRef<boolean>(false);

    useEffect(() => {
        const checkSpeechSupport = async () => {
            // Check if running in Electron (Desktop)
            const isElectron = navigator.userAgent.includes('Electron');

            // Check if running in Capacitor (Mobile App) - but NOT Electron
            const isCapacitor = (window as any).Capacitor !== undefined && !isElectron;
            const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            // Desktop (Electron or Browser): Use Web Speech API
            if (isElectron || !isMobileDevice) {
                const WebSpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                if (WebSpeechRecognition) {
                    setSpeechSupported(true);
                    setManualMode(false);
                    setUseNativeSpeech(false);
                    console.log('Using Web Speech API for desktop/browser');
                    return;
                }
            }

            // Mobile with Capacitor: Try native speech recognition
            if (isCapacitor && isMobileDevice) {
                try {
                    const available = await SpeechRecognition.available();
                    if (available.available) {
                        const permission = await SpeechRecognition.requestPermissions();
                        if (permission.speechRecognition === 'granted') {
                            setUseNativeSpeech(true);
                            setSpeechSupported(true);
                            setManualMode(false);
                            console.log('Using native Capacitor speech recognition');
                            return;
                        }
                    }
                } catch (e) {
                    console.warn('Native speech recognition not available:', e);
                }
            }

            // Fallback to manual mode
            setSpeechSupported(false);
            setManualMode(true);
            console.log('Speech recognition not available, using manual mode');
        };

        checkSpeechSupport();
    }, []);

    useEffect(() => {
        if (isOpen) {
            setSelectedNoteIndex('new');
            // Don't clear transcript if just reopening? Usually we clear on open new.
            // But user wants to RESUME. 
            // If user closes dialog, we probably should clear or save draft?
            // Current behavior: clear on open. 
            // The request is about "resume recording" while dialog is open (stop/start mic).
            // So clearing on open is fine.
            setTranscript('');
            setInterimTranscript('');
            finalTranscriptRef.current = '';
            processedResultsRef.current = new Set();
            previousTranscriptRef.current = '';
        }
    }, [isOpen]);

    const startRecording = useCallback(async () => {
        // Reset manual stop flag - user is starting/resuming
        manualStopRef.current = false;

        // Capture current text as the starting point for this session
        previousTranscriptRef.current = transcript;

        if (useNativeSpeech) {
            // Use Native Capacitor Speech Recognition (Android/iOS)
            try {
                setIsRecording(true);
                setInterimTranscript('');
                // Don't clear finalTranscriptRef - keep accumulated text

                // Start listening with native plugin
                await SpeechRecognition.start({
                    language: 'ar-SA',
                    maxResults: 5,
                    popup: false, // Use our own UI
                    partialResults: true,
                });

                // Listen for partial results
                SpeechRecognition.addListener('partialResults', (data: { matches: string[] }) => {
                    if (data.matches && data.matches.length > 0) {
                        const newText = data.matches[0];
                        setInterimTranscript(newText);
                        // Accumulate final text
                        const separator = previousTranscriptRef.current ? ' ' : '';
                        setTranscript(previousTranscriptRef.current + separator + newText);
                    }
                });

                // Listen for listening state changes - auto-restart if not manually stopped
                SpeechRecognition.addListener('listeningState', async (state: { status: string }) => {
                    if (state.status === 'stopped') {
                        if (!manualStopRef.current) {
                            // Auto-restart for continuous recording
                            console.log('Native speech stopped, auto-restarting...');
                            try {
                                await SpeechRecognition.start({
                                    language: 'ar-SA',
                                    maxResults: 5,
                                    popup: false,
                                    partialResults: true,
                                });
                            } catch (e) {
                                console.warn('Could not restart native speech:', e);
                                setIsRecording(false);
                            }
                        } else {
                            setIsRecording(false);
                        }
                    }
                });

            } catch (e) {
                console.error('Native speech error:', e);
                setIsRecording(false);
                toast({ title: 'خطأ في التسجيل الصوتي', variant: 'destructive' });
            }
            return;
        }

        // Desktop/Web: Use Web Speech API
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
            console.error('Microphone permission denied:', err);
            toast({ title: 'عذراً، يجب السماح باستخدام الميكروفون', variant: 'destructive' });
            return;
        }

        const WebSpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!WebSpeechRecognition) return;

        const recognition = new WebSpeechRecognition();
        recognition.lang = 'ar-SA';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsRecording(true);
            setInterimTranscript('');
            // Don't clear finalTranscriptRef - keep accumulated text
            // Only reset processedResults for new session segments
            processedResultsRef.current = new Set();
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interimContent = '';
            let newFinalSegment = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const text = result[0].transcript;

                if (result.isFinal) {
                    if (!processedResultsRef.current.has(i)) {
                        const currentTotal = finalTranscriptRef.current.trim();
                        const textTrimmed = text.trim();

                        if (!currentTotal.endsWith(textTrimmed)) {
                            processedResultsRef.current.add(i);
                            newFinalSegment += text + ' ';
                        }
                    }
                } else {
                    interimContent += text;
                }
            }

            if (newFinalSegment) {
                finalTranscriptRef.current += newFinalSegment;
            }

            const separator = previousTranscriptRef.current && finalTranscriptRef.current ? ' ' : '';
            setTranscript(previousTranscriptRef.current + separator + finalTranscriptRef.current);
            setInterimTranscript(interimContent);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                toast({ title: 'تم رفض الوصول للميكروفون', variant: 'destructive' });
            }
            setIsRecording(false);
        };

        recognition.onend = () => {
            // Auto-restart if not manually stopped (handles silence timeout)
            if (!manualStopRef.current && recognitionRef.current) {
                console.log('Auto-restarting speech recognition...');
                try {
                    setTimeout(() => {
                        if (recognitionRef.current && !manualStopRef.current) {
                            recognitionRef.current.start();
                        }
                    }, 100);
                } catch (e) {
                    console.warn('Could not restart recognition:', e);
                    setIsRecording(false);
                }
            } else {
                setIsRecording(false);
            }
        };

        recognitionRef.current = recognition;
        try {
            recognition.start();
        } catch (e) {
            console.error("Failed to start recognition:", e);
        }
    }, [transcript, toast, useNativeSpeech]);

    const stopRecording = useCallback(async () => {
        // Mark as manual stop so onend doesn't auto-restart
        manualStopRef.current = true;

        if (useNativeSpeech) {
            // Stop native Capacitor speech recognition
            try {
                await SpeechRecognition.stop();
                // Use the interim transcript that was accumulated during recording
                if (interimTranscript) {
                    const separator = previousTranscriptRef.current ? ' ' : '';
                    setTranscript(previousTranscriptRef.current + separator + interimTranscript);
                    setInterimTranscript('');
                }
                // Remove listeners
                SpeechRecognition.removeAllListeners();
            } catch (e) {
                console.error('Error stopping native speech:', e);
            }
            setIsRecording(false);
            return;
        }

        // Web Speech API stop
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }
    }, [useNativeSpeech]);

    const handleSave = useCallback(async () => {
        // Cleaning up spaces
        const finalText = (transcript + interimTranscript).replace(/\s+/g, ' ').trim();
        if (!finalText) {
            toast({ title: 'لا يوجد نص للحفظ' });
            return;
        }

        setIsProcessing(true);
        try {
            if (selectedNoteIndex === 'new') {
                // Create a new regular note
                await createNote({ title: `تسجيل ${new Date().toLocaleTimeString('ar-SA')}`, folder_id: null, content: `<p>${finalText}</p>` });
                toast({ title: 'تم إنشاء ملاحظة جديدة ✓' });
            } else {
                const note = notes.find(n => n.id === selectedNoteIndex);
                if (note) {
                    await updateNote({
                        id: note.id,
                        updates: {
                            content: (note.content || '') + `<p>${finalText}</p>`
                        }
                    });
                    toast({ title: 'تم الحفظ في الملاحظة المختارة ✓' });
                }
            }
            setTranscript('');
            setInterimTranscript('');
            onClose();
        } finally {
            setIsProcessing(false);
        }
    }, [transcript, interimTranscript, selectedNoteIndex, notes, createNote, updateNote, onClose, toast]);

    const handleClose = useCallback(() => {
        if (isRecording) stopRecording();
        onClose();
    }, [isRecording, stopRecording, onClose]);

    useEffect(() => {
        if (isOpen && speechSupported && !isRecording && !manualMode) {
            const timer = setTimeout(() => startRecording(), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, speechSupported, startRecording, manualMode]);

    const getNoteTitle = (note: NoteV2) => {
        return note.title || 'ملاحظة بدون عنوان';
    };

    // Always show the dialog - even without speech support, user can type

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-right flex items-center gap-2">
                        <Mic className="w-5 h-5 text-emerald-500" />
                        تسجيل ملاحظة صوتية
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-3 border">
                        <label className="text-sm text-gray-600 mb-2 block text-right">حفظ في:</label>
                        <Select value={selectedNoteIndex} onValueChange={setSelectedNoteIndex}>
                            <SelectTrigger className="w-full text-right dir-rtl">
                                <SelectValue placeholder="اختر الملاحظة" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]" align="end">
                                <SelectItem value="new">
                                    <div className="flex items-center gap-2">
                                        <Plus className="w-4 h-4 text-emerald-600" />
                                        <span>إنشاء ملاحظة جديدة</span>
                                    </div>
                                </SelectItem>
                                {notes.length > 0 && (
                                    <>
                                        <div className="px-2 py-1.5 text-xs text-gray-500 border-t mt-1 text-right">الملاحظات الموجودة ({notes.length}):</div>
                                        <div className="max-h-[200px] overflow-y-auto">
                                            {notes.map((note) => (
                                                <SelectItem key={note.id} value={note.id} className="text-right">
                                                    <div className="flex items-center gap-2 justify-end w-full">
                                                        <span className="truncate text-right w-full">{getNoteTitle(note)}</span>
                                                        <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Mic Button - only show if speech is supported */}
                    {speechSupported ? (
                        <div className="flex justify-center">
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                className={`p-6 rounded-full transition-all duration-300 ${isRecording ? 'bg-red-100 animate-pulse' : 'bg-emerald-100'}`}
                            >
                                {isRecording ? <MicOff className="w-10 h-10 text-red-600" /> : <Mic className="w-10 h-10 text-emerald-600" />}
                            </button>
                        </div>
                    ) : (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                            <p className="text-amber-700 text-sm font-bold">التسجيل المباشر غير مدعوم</p>
                            <p className="text-amber-600 text-xs mt-1">يرجى استخدام 🎙️ ميكروفون لوحة المفاتيح للكتابة بالصوت</p>
                        </div>
                    )}
                    {/* Transcript Editable Area */}
                    <div className="relative">
                        <textarea
                            value={transcript + (isRecording ? interimTranscript : '')}
                            onChange={(e) => {
                                // Stop recording if user starts typing to avoid conflicts
                                if (isRecording) {
                                    stopRecording();
                                }
                                const val = e.target.value;
                                setTranscript(val);
                                // IMPORTANT: Sync manual edits to reference so resuming works
                                previousTranscriptRef.current = val;
                                setInterimTranscript('');
                                finalTranscriptRef.current = '';
                            }}
                            className="w-full min-h-[120px] max-h-[200px] p-4 rounded-lg border bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-right text-lg leading-relaxed resize-none dir-rtl"
                            placeholder={isRecording ? "جاري الاستماع... (ابدأ الكتابة للإيقاف)" : "تحدث للتسجيل أو اكتب هنا للتعديل..."}
                            dir="rtl"
                        />

                        {/* Clear Button - only when not recording and has text */}
                        {!isRecording && transcript && (
                            <button
                                onClick={() => {
                                    setTranscript('');
                                    setInterimTranscript('');
                                    previousTranscriptRef.current = '';
                                    finalTranscriptRef.current = '';
                                    processedResultsRef.current = new Set();
                                }}
                                className="absolute top-2 left-2 p-1.5 bg-gray-200/50 hover:bg-red-100 text-gray-500 hover:text-red-600 rounded-full transition-all"
                                title="مسح النص"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}

                        {isRecording && (
                            <div className="absolute bottom-2 left-2">
                                <span className="flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={handleClose}>إلغاء</Button>
                        <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleSave} disabled={!transcript && !interimTranscript}>
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 ml-1" />} حفظ
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default VoiceNoteRecorder;
