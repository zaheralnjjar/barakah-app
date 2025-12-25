import { useState, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface VoiceRecording {
    id: string;
    filename: string;
    blob: Blob;
    duration: number;
    createdAt: string;
    title?: string;
}

export const useVoiceRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordings, setRecordings] = useState<VoiceRecording[]>([]);
    const [recordingDuration, setRecordingDuration] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    // Load recordings from localStorage on first use
    const loadRecordings = useCallback(() => {
        try {
            const saved = localStorage.getItem('voice_recordings_meta');
            if (saved) {
                const meta = JSON.parse(saved);
                // Note: Blobs are not directly stored; we only store metadata
                // For full persistence, consider using IndexedDB
                setRecordings(meta);
            }
        } catch (e) {
            console.error('Error loading recordings:', e);
        }
    }, []);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];
            startTimeRef.current = Date.now();

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);

                const recording: VoiceRecording = {
                    id: Date.now().toString(),
                    filename: `recording_${new Date().toISOString().replace(/[:.]/g, '-')}.webm`,
                    blob,
                    duration,
                    createdAt: new Date().toISOString(),
                };

                // Save to IndexedDB for blob persistence
                await saveToIndexedDB(recording);

                setRecordings(prev => {
                    const updated = [...prev, recording];
                    // Save metadata to localStorage
                    const meta = updated.map(r => ({ ...r, blob: null }));
                    localStorage.setItem('voice_recordings_meta', JSON.stringify(meta));
                    return updated;
                });

                toast({
                    title: '🎙️ تم حفظ التسجيل',
                    description: `المدة: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`
                });

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingDuration(0);

            // Update duration every second
            timerRef.current = setInterval(() => {
                setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }, 1000);

            toast({ title: '🔴 بدء التسجيل...' });
        } catch (err: any) {
            console.error('Recording error:', err);
            toast({
                title: 'فشل بدء التسجيل',
                description: err.message || 'تأكد من السماح بالوصول للميكروفون',
                variant: 'destructive'
            });
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [isRecording]);

    const deleteRecording = useCallback(async (id: string) => {
        await deleteFromIndexedDB(id);
        setRecordings(prev => {
            const updated = prev.filter(r => r.id !== id);
            const meta = updated.map(r => ({ ...r, blob: null }));
            localStorage.setItem('voice_recordings_meta', JSON.stringify(meta));
            return updated;
        });
        toast({ title: '🗑️ تم حذف التسجيل' });
    }, []);

    const playRecording = useCallback(async (id: string) => {
        const recording = await getFromIndexedDB(id);
        if (recording && recording.blob) {
            const url = URL.createObjectURL(recording.blob);
            const audio = new Audio(url);
            audio.play();
            audio.onended = () => URL.revokeObjectURL(url);
        }
    }, [recordings]);

    return {
        isRecording,
        recordingDuration,
        recordings,
        startRecording,
        stopRecording,
        deleteRecording,
        playRecording,
        loadRecordings,
    };
};

// ===== IndexedDB Helpers for Blob Persistence =====
const DB_NAME = 'BarakahVoiceRecordings';
const STORE_NAME = 'recordings';

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
};

const saveToIndexedDB = async (recording: VoiceRecording): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(recording);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

const getFromIndexedDB = async (id: string): Promise<VoiceRecording | null> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
};

const deleteFromIndexedDB = async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

export default useVoiceRecorder;
