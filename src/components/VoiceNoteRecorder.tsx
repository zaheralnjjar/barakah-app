import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MicOff, Check, X, Loader2, ChevronDown, Plus, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuickNotes, NoteData } from '@/hooks/useQuickNotes';

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
    const { notesHistory, appendToNote } = useQuickNotes();
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedNoteIndex, setSelectedNoteIndex] = useState<string>('new'); // 'new' or index as string
    const recognitionRef = useRef<any>(null);
    const finalTranscriptRef = useRef<string>(''); // Track confirmed final text
    const processedResultsRef = useRef<Set<number>>(new Set()); // Track which results we've processed

    // Check for Web Speech API support
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setIsSupported(false);
        }
    }, []);

    // Reset state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setSelectedNoteIndex('new');
            setTranscript('');
            setInterimTranscript('');
            finalTranscriptRef.current = '';
            processedResultsRef.current = new Set();
        }
    }, [isOpen]);

    const startRecording = useCallback(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast({ title: 'التسجيل الصوتي غير مدعوم في هذا المتصفح', variant: 'destructive' });
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'ar-SA'; // Arabic (Saudi Arabia)
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsRecording(true);
            setTranscript('');
            setInterimTranscript('');
            finalTranscriptRef.current = '';
            processedResultsRef.current = new Set();
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interimContent = '';
            let finalSegment = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const transcriptText = result[0].transcript;

                if (result.isFinal) {
                    if (!processedResultsRef.current.has(i)) {
                        processedResultsRef.current.add(i);
                        // Add space only if we have previous content
                        finalSegment += transcriptText + ' ';
                    }
                } else {
                    interimContent += transcriptText;
                }
            }

            if (finalSegment) {
                // Update specific ref directly to avoid race conditions
                finalTranscriptRef.current = (finalTranscriptRef.current + finalSegment);
                setTranscript(finalTranscriptRef.current);
            }

            setInterimTranscript(interimContent);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                toast({ title: 'يرجى السماح بالوصول إلى الميكروفون', variant: 'destructive' });
            } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
                toast({ title: 'حدث خطأ في التسجيل', description: event.error, variant: 'destructive' });
            }
            setIsRecording(false);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, [toast]);

    const stopRecording = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }
    }, []);

    const handleSave = useCallback(() => {
        const finalText = (transcript + interimTranscript).trim();
        if (!finalText) {
            toast({ title: 'لا يوجد نص للحفظ' });
            return;
        }

        setIsProcessing(true);
        try {
            if (selectedNoteIndex === 'new' || selectedNoteIndex === 'activities') {
                // Save to activities note (default behavior)
                onSaveToActivities(finalText);
                toast({ title: 'تم حفظ الملاحظة الصوتية ✓', description: 'تمت الإضافة إلى ملاحظة "أنشطة"' });
            } else {
                // Append to existing note using appendToNote (includes color)
                const noteIndex = parseInt(selectedNoteIndex);
                const existingNote = notesHistory[noteIndex];
                if (existingNote) {
                    appendToNote(noteIndex, finalText);
                    const noteTitle = existingNote.content.split('\n')[0].substring(0, 20);
                    toast({
                        title: 'تم الحفظ ✓',
                        description: `تمت الإضافة إلى "${noteTitle}..."`
                    });
                }
            }
            setTranscript('');
            setInterimTranscript('');
            onClose();
        } finally {
            setIsProcessing(false);
        }
    }, [transcript, interimTranscript, selectedNoteIndex, notesHistory, onSaveToActivities, onClose, toast]);

    const handleClose = useCallback(() => {
        if (isRecording) {
            stopRecording();
        }
        setTranscript('');
        setInterimTranscript('');
        onClose();
    }, [isRecording, stopRecording, onClose]);

    // Auto-start recording when dialog opens
    useEffect(() => {
        if (isOpen && isSupported && !isRecording) {
            // Small delay to ensure dialog is rendered
            const timer = setTimeout(() => {
                startRecording();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, isSupported, startRecording]);

    // Get note preview title (first line, max 30 chars)
    const getNoteTitle = (note: NoteData, index: number): string => {
        const firstLine = note.content.split('\n')[0].trim();
        if (firstLine.length > 30) {
            return firstLine.substring(0, 30) + '...';
        }
        return firstLine || `ملاحظة ${index + 1}`;
    };

    if (!isSupported) {
        return (
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-right flex items-center gap-2">
                            <MicOff className="w-5 h-5 text-red-500" />
                            التسجيل الصوتي غير مدعوم
                        </DialogTitle>
                    </DialogHeader>
                    <div className="text-center py-6">
                        <p className="text-gray-600">هذا المتصفح لا يدعم التسجيل الصوتي.</p>
                        <p className="text-sm text-gray-400 mt-2">جرب استخدام Chrome أو Edge.</p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

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
                    {/* Target Note Selection */}
                    <div className="bg-gray-50 rounded-lg p-3 border">
                        <label className="text-sm text-gray-600 mb-2 block text-right">حفظ في:</label>
                        <Select value={selectedNoteIndex} onValueChange={setSelectedNoteIndex}>
                            <SelectTrigger className="w-full text-right">
                                <SelectValue placeholder="اختر الملاحظة" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="new">
                                    <div className="flex items-center gap-2">
                                        <Plus className="w-4 h-4 text-emerald-600" />
                                        <span>إنشاء ملاحظة جديدة (أنشطة)</span>
                                    </div>
                                </SelectItem>
                                {notesHistory.length > 0 && (
                                    <>
                                        <div className="px-2 py-1.5 text-xs text-gray-500 border-t mt-1">الملاحظات الموجودة ({notesHistory.length}):</div>
                                        <div className="max-h-[200px] overflow-y-auto">
                                            {notesHistory.map((note, index) => (
                                                <SelectItem key={index} value={index.toString()}>
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-gray-400" />
                                                        <span className="truncate">{getNoteTitle(note, index)}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Recording Status */}
                    <div className="flex justify-center">
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`p-6 rounded-full transition-all duration-300 ${isRecording
                                ? 'bg-red-100 hover:bg-red-200 animate-pulse'
                                : 'bg-emerald-100 hover:bg-emerald-200'
                                }`}
                        >
                            {isRecording ? (
                                <MicOff className="w-10 h-10 text-red-600" />
                            ) : (
                                <Mic className="w-10 h-10 text-emerald-600" />
                            )}
                        </button>
                    </div>

                    <p className="text-center text-sm text-gray-500">
                        {isRecording ? 'جاري التسجيل... اضغط للإيقاف' : 'اضغط للبدء بالتسجيل'}
                    </p>

                    {/* Transcript Display */}
                    <div className="min-h-[120px] max-h-[200px] overflow-y-auto bg-gray-50 rounded-lg p-4 border">
                        {transcript || interimTranscript ? (
                            <p className="text-right text-gray-700 leading-relaxed">
                                {transcript}
                                <span className="text-gray-400 italic">{interimTranscript}</span>
                            </p>
                        ) : (
                            <p className="text-center text-gray-400 text-sm">
                                سيظهر النص هنا أثناء التحدث...
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handleClose}
                        >
                            <X className="w-4 h-4 ml-1" />
                            إلغاء
                        </Button>
                        <Button
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                            onClick={handleSave}
                            disabled={!transcript && !interimTranscript || isProcessing}
                        >
                            {isProcessing ? (
                                <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4 ml-1" />
                            )}
                            حفظ
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default VoiceNoteRecorder;
