import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Timer, X } from 'lucide-react';

interface FloatingTimerProps {
    onClose?: () => void;
}

export const FloatingTimer: React.FC<FloatingTimerProps> = () => {
    const [active, setActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [startTime, setStartTime] = useState<string>('');
    const [endTime, setEndTime] = useState<string>('');
    const [type, setType] = useState<'countdown' | 'countup'>('countdown');
    const [position, setPosition] = useState({ x: 20, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const offset = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleStart = (e: any) => {
            const { duration, mode, start, end } = e.detail || {};
            setTimeLeft(duration || 0);
            setType(mode === 'countup' ? 'countup' : 'countdown');
            setStartTime(start || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            setEndTime(end || '');
            setActive(true);
        };

        const handleStop = () => setActive(false);

        window.addEventListener('timer-start', handleStart);
        window.addEventListener('timer-stop', handleStop);
        return () => {
            window.removeEventListener('timer-start', handleStart);
            window.removeEventListener('timer-stop', handleStop);
        };
    }, []);

    useEffect(() => {
        if (!active || timeLeft <= 0 && type === 'countdown') return;

        const interval = setInterval(() => {
            setTimeLeft(prev => type === 'countdown' ? prev - 1 : prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [active, timeLeft, type]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(Math.abs(seconds) / 60);
        const secs = Math.abs(seconds) % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        offset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - offset.current.x,
            y: e.clientY - offset.current.y
        });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    if (!active) return null;

    return (
        <div
            style={{ left: position.x, top: position.y }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={cn(
                "fixed z-[1000] cursor-move touch-none select-none",
                "w-20 h-20 rounded-full bg-emerald-500 shadow-xl border-2 border-white flex flex-col items-center justify-center text-white",
                "animate-in zoom-in duration-300"
            )}
        >
            <div className="text-xs font-black drop-shadow-sm">{formatTime(timeLeft)}</div>
            <div className="flex flex-col items-center mt-0.5">
                <span className="text-[6px] opacity-80 leading-tight">{startTime}</span>
                <span className="text-[6px] font-bold leading-tight">{endTime}</span>
            </div>
            <button
                onClick={() => setActive(false)}
                className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm text-emerald-600 border border-emerald-100"
            >
                <X className="w-2.5 h-2.5" />
            </button>
        </div>
    );
};
