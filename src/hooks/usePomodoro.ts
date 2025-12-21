import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export const usePomodoro = () => {
    const [pomodoroActive, setPomodoroActive] = useState(false);
    const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
    const [pomodoroTaskId, setPomodoroTaskId] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (pomodoroActive && pomodoroTime > 0) {
            interval = setInterval(() => {
                setPomodoroTime(prev => prev - 1);
            }, 1000);
        } else if (pomodoroTime === 0 && pomodoroActive) {
            setPomodoroActive(false);
            toast({ title: 'انتهى الوقت!', description: 'أحسنت! خذ استراحة 5 دقائق' });
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
