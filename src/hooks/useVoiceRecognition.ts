import { useState, useCallback, useEffect } from 'react';

interface VoiceRecognitionHook {
    transcript: string;
    isListening: boolean;
    error: string | null;
    isSupported: boolean;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
}

export const useVoiceRecognition = (): VoiceRecognitionHook => {
    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

    const isSupported = typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    useEffect(() => {
        if (!isSupported) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognitionInstance = new SpeechRecognition();

        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'ar-SA'; // Arabic - Saudi Arabia

        recognitionInstance.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognitionInstance.onend = () => {
            setIsListening(false);
        };

        recognitionInstance.onerror = (event) => {
            setError(`خطأ في التعرف على الصوت: ${event.error}`);
            setIsListening(false);
        };

        recognitionInstance.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            setTranscript(finalTranscript || interimTranscript);
        };

        setRecognition(recognitionInstance);

        return () => {
            recognitionInstance.abort();
        };
    }, [isSupported]);

    const startListening = useCallback(() => {
        if (recognition && !isListening) {
            setTranscript('');
            setError(null);
            try {
                recognition.start();
            } catch (e) {
                setError('فشل في بدء الاستماع');
            }
        }
    }, [recognition, isListening]);

    const stopListening = useCallback(() => {
        if (recognition && isListening) {
            recognition.stop();
        }
    }, [recognition, isListening]);

    const resetTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    return {
        transcript,
        isListening,
        error,
        isSupported,
        startListening,
        stopListening,
        resetTranscript,
    };
};

// TypeScript declarations for Web Speech API
declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}
