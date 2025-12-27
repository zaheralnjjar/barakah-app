import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export const usePomodoro = () => {
    const [pomodoroActive, setPomodoroActive] = useState(false);
    const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
    const [pomodoroTaskId, setPomodoroTaskId] = useState<string | null>(null);
    const { toast } = useToast();

    // Play alarm sound
    const playAlarmSound = () => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.5;
            oscillator.start();
            // Beep pattern: 3 beeps
            setTimeout(() => { oscillator.frequency.value = 1000; }, 200);
            setTimeout(() => { oscillator.frequency.value = 800; }, 400);
            setTimeout(() => { oscillator.frequency.value = 1200; }, 600);
            setTimeout(() => { oscillator.stop(); audioContext.close(); }, 1000);
        } catch (e) { console.log('Audio not supported'); }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (pomodoroActive && pomodoroTime > 0) {
            interval = setInterval(() => {
                setPomodoroTime(prev => prev - 1);
            }, 1000);
        } else if (pomodoroTime === 0 && pomodoroActive) {
            setPomodoroActive(false);
            // Play alarm sound
            playAlarmSound();
            // Show toast
            toast({ title: '⏰ انتهى الوقت!', description: 'أحسنت! خذ استراحة 5 دقائق' });
            // Send system notification
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('⏰ انتهى مؤقت التركيز!', { body: 'أحسنت! خذ استراحة 5 دقائق', icon: '/favicon.ico' });
            }
        }
        return () => { if (interval) clearInterval(interval); };
    }, [pomodoroActive, pomodoroTime]);

    const startPomodoro = (taskId: string) => {
        setPomodoroTaskId(taskId);
        setPomodoroTime(25 * 60);
        setPomodoroActive(true);
        toast({ title: 'بدأ مؤقت بومودورو', description: '25 دقيقة من التركيز!' });
    };

    const stopPomodoro = () => {
        setPomodoroActive(false);
        setPomodoroTaskId(null);
        setPomodoroTime(25 * 60);
    };

    const formatTime = () => {
        const mins = Math.floor(pomodoroTime / 60);
        const secs = pomodoroTime % 60;
        return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
    };

    return {
        pomodoroActive,
        pomodoroTime,
        pomodoroTaskId,
        startPomodoro,
        stopPomodoro,
        formatTime
    };
};
