import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MicOff, Check, X, Loader2, Plus, FileText } from 'lucide-react';
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
    const [selectedNoteIndex, setSelectedNoteIndex] = useState<string>('new');
    const recognitionRef = useRef<any>(null);
    const finalTranscriptRef = useRef<string>('');
    const processedResultsRef = useRef<Set<number>>(new Set());

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setIsSupported(false);
        }
    }, []);

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
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.lang = 'ar-SA';
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
            let newFinalSegment = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const text = result[0].transcript;

                if (result.isFinal) {
                    // Critical check: Ensure we don't process the same index twice
                    if (!processedResultsRef.current.has(i)) {
                        // Extra safety: Check if the text is already at the end of our transcript
                        // This handles cases where index resets or overlaps occur
                        const currentTotal = finalTranscriptRef.current.trim();
                        const textTrimmed = text.trim();

                        // Only append if it's not a direct duplicate of the suffix
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
                setTranscript(finalTranscriptRef.current);
            }

            setInterimTranscript(interimContent);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                toast({ title: 'يرجى السماح بالوصول إلى الميكروفون', variant: 'destructive' });
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
        // Cleaning up spaces
        const finalText = (transcript + interimTranscript).replace(/\s+/g, ' ').trim();
        if (!finalText) {
            toast({ title: 'لا يوجد نص للحفظ' });
            return;
        }

        setIsProcessing(true);
        try {
            if (selectedNoteIndex === 'new' || selectedNoteIndex === 'activities') {
                onSaveToActivities(finalText);
                toast({ title: 'تم حفظ الملاحظة الصوتية ✓' });
            } else {
                const noteIndex = parseInt(selectedNoteIndex);
                if (!isNaN(noteIndex) && notesHistory[noteIndex]) {
                    appendToNote(noteIndex, finalText);
                    toast({ title: 'تم الحفظ في الملاحظة المختارة ✓' });
                }
            }
            setTranscript('');
            setInterimTranscript('');
            onClose();
        } finally {
            setIsProcessing(false);
        }
    }, [transcript, interimTranscript, selectedNoteIndex, notesHistory, onSaveToActivities, onClose, toast, appendToNote]);

    const handleClose = useCallback(() => {
        if (isRecording) stopRecording();
        onClose();
    }, [isRecording, stopRecording, onClose]);

    useEffect(() => {
        if (isOpen && isSupported && !isRecording) {
            const timer = setTimeout(() => startRecording(), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, isSupported, startRecording]);

    const getNoteTitle = (note: NoteData, index: number) => {
        const firstLine = note.content.split('\n')[0].trim();
        return firstLine.substring(0, 30) || `ملاحظة ${index + 1}`;
    };

    if (!isSupported) return null;

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
                                        <span>إنشاء ملاحظة جديدة (أنشطة)</span>
                                    </div>
                                </SelectItem>
                                {notesHistory.length > 0 && (
                                    <>
                                        <div className="px-2 py-1.5 text-xs text-gray-500 border-t mt-1 text-right">الملاحظات الموجودة ({notesHistory.length}):</div>
                                        <div className="max-h-[200px] overflow-y-auto">
                                            {notesHistory.map((note, index) => (
                                                <SelectItem key={index} value={index.toString()} className="text-right">
                                                    <div className="flex items-center gap-2 justify-end w-full">
                                                        <span className="truncate text-right w-full">{getNoteTitle(note, index)}</span>
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

                    <div className="flex justify-center">
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`p-6 rounded-full transition-all duration-300 ${isRecording ? 'bg-red-100 animate-pulse' : 'bg-emerald-100'}`}
                        >
                            {isRecording ? <MicOff className="w-10 h-10 text-red-600" /> : <Mic className="w-10 h-10 text-emerald-600" />}
                        </button>
                    </div>
                    {/* Transcript Editable Area */}
                    <div className="relative">
                        <textarea
                            value={transcript + (isRecording ? interimTranscript : '')}
                            onChange={(e) => {
                                setTranscript(e.target.value);
                                setInterimTranscript(''); // Clear interim if user edits, to avoid confusion
                            }}
                            className="w-full min-h-[120px] max-h-[200px] p-4 rounded-lg border bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all text-right text-lg leading-relaxed resize-none dir-rtl"
                            placeholder={isRecording ? "جاري الاستماع..." : "تحدث للتسجيل أو اكتب هنا للتعديل..."}
                            dir="rtl"
                        />
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
