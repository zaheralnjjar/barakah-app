import { useState, useCallback, useEffect } from 'react';

type Language = 'ar' | 'es';

interface SpeechSynthesisHook {
    speak: (text: string, lang?: Language) => void;
    cancel: () => void;
    isSpeaking: boolean;
    isSupported: boolean;
    voices: SpeechSynthesisVoice[];
    currentLang: Language;
    setLanguage: (lang: Language) => void;
}

export const useSpeechSynthesis = (): SpeechSynthesisHook => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [currentLang, setCurrentLang] = useState<Language>('ar');

    const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

    // Load available voices - FIXED: moved to useEffect
    useEffect(() => {
        if (!isSupported) return;

        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
                setVoices(availableVoices);
            }
        };

        loadVoices();

        // Chrome loads voices asynchronously
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }

        return () => {
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = null;
            }
        };
    }, [isSupported]);

    const setLanguage = useCallback((lang: Language) => {
        setCurrentLang(lang);
    }, []);

    const speak = useCallback((text: string, lang?: Language) => {
        if (!isSupported || !text) return;

        const targetLang = lang || currentLang;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Find voice based on language
        let targetVoice: SpeechSynthesisVoice | undefined;

        if (targetLang === 'ar') {
            targetVoice = voices.find(voice =>
                voice.lang.startsWith('ar') || voice.name.includes('Arabic')
            );
            utterance.lang = 'ar-SA';
        } else if (targetLang === 'es') {
            targetVoice = voices.find(voice =>
                voice.lang === 'es-AR' ||
                voice.lang === 'es-MX' ||
                voice.lang === 'es-419' ||
                voice.lang.startsWith('es') ||
                voice.name.includes('Spanish')
            );
            utterance.lang = 'es-AR';
        }

        if (targetVoice) {
            utterance.voice = targetVoice;
        }

        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, [isSupported, voices, currentLang]);

    const cancel = useCallback(() => {
        if (isSupported) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, [isSupported]);

    return {
        speak,
        cancel,
        isSpeaking,
        isSupported,
        voices,
        currentLang,
        setLanguage,
    };
};
