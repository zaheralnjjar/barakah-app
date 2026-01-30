import { useCallback, useRef, useState } from 'react';

interface UseLongPressOptions {
    onLongPress: () => void;
    onClick: () => void;
    ms?: number;
}

export const useLongPress = ({ onLongPress, onClick, ms = 400 }: UseLongPressOptions) => {
    const timerRef = useRef<NodeJS.Timeout>();
    const isLongPressActive = useRef(false);
    const hasStarted = useRef(false);
    const startX = useRef(0);
    const startY = useRef(0);
    const [isPressed, setIsPressed] = useState(false);

    const start = useCallback(() => {
        hasStarted.current = true;
        isLongPressActive.current = false;
        setIsPressed(true);

        timerRef.current = setTimeout(() => {
            // Haptic feedback if available
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            onLongPress();
            isLongPressActive.current = true;
            setIsPressed(false);
        }, ms);
    }, [onLongPress, ms]);

    const stop = useCallback(() => {
        if (!hasStarted.current) return;
        setIsPressed(false);

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        if (!isLongPressActive.current) {
            onClick();
        }
        isLongPressActive.current = false;
        hasStarted.current = false;
    }, [onClick]);

    // Cancel without triggering click
    const cancel = useCallback(() => {
        if (!hasStarted.current) return;

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        isLongPressActive.current = false;
        hasStarted.current = false;
        setIsPressed(false);
    }, []);

    const handleLeave = useCallback(() => {
        cancel();
    }, [cancel]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
        startY.current = e.touches[0].clientY;
        start();
    }, [start]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!hasStarted.current) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;

        // Calculate distance moved
        const diffX = Math.abs(currentX - startX.current);
        const diffY = Math.abs(currentY - startY.current);

        // If moved more than 10px, it's likely a scroll/drag, so cancel
        if (diffX > 15 || diffY > 15) {
            cancel();
        }
    }, [cancel]);

    return {
        onMouseDown: start,
        onMouseUp: stop,
        onMouseLeave: handleLeave,
        onTouchStart: handleTouchStart,
        onTouchEnd: stop,
        onTouchMove: handleTouchMove,
        isPressed, // For visual feedback (scale animation)
    };
};

