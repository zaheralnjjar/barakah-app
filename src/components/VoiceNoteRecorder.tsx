import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Check, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Check for Web Speech API support
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setIsSupported(false);
        }
    }, []);

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

        recognition.onstart = () => {
            setIsRecording(true);
            setTranscript('');
            setInterimTranscript('');
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = '';
            let interimResult = '';

            // Process all results, using isFinal to distinguish
            for (let i = 0; i < event.results.length; i++) {
                const result = event.results[i];
                const text = result[0].transcript;

                if (result.isFinal) {
                    // Only add if not already in our final transcript to avoid duplication
                    if (!finalTranscript.includes(text.trim())) {
                        finalTranscript += text + ' ';
                    }
                } else {
                    interimResult = text; // Only keep the latest interim result
                }
            }

            // Clean up: remove any duplicated words that might occur at boundaries
            const words = finalTranscript.split(/\s+/).filter(w => w.trim());
            const deduped: string[] = [];
            for (let i = 0; i < words.length; i++) {
                // Skip if this word is same as previous (basic dedup)
                if (i === 0 || words[i] !== words[i - 1]) {
                    deduped.push(words[i]);
                }
            }

            setTranscript(deduped.join(' ') + ' ');
            setInterimTranscript(interimResult);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                toast({ title: 'يرجى السماح بالوصول إلى الميكروفون', variant: 'destructive' });
            } else if (event.error !== 'aborted') {
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
            onSaveToActivities(finalText);
            toast({ title: 'تم حفظ الملاحظة الصوتية ✓', description: 'تمت الإضافة إلى ملاحظة "أنشطة"' });
            setTranscript('');
            setInterimTranscript('');
            onClose();
        } finally {
            setIsProcessing(false);
        }
    }, [transcript, interimTranscript, onSaveToActivities, onClose, toast]);

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
                            حفظ في "أنشطة"
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default VoiceNoteRecorder;
