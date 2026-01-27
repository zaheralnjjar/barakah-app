import { useCallback, useRef, useState } from 'react';

interface UseLongPressOptions {
    onLongPress: () => void;
    onClick: () => void;
    ms?: number;
}

export const useLongPress = ({ onLongPress, onClick, ms = 500 }: UseLongPressOptions) => {
    const timerRef = useRef<NodeJS.Timeout>();
    const isLongPressActive = useRef(false);
    const hasStarted = useRef(false);
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

    const handleLeave = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        isLongPressActive.current = false;
        hasStarted.current = false;
        setIsPressed(false);
    }, []);

    return {
        onMouseDown: start,
        onMouseUp: stop,
        onMouseLeave: handleLeave,
        onTouchStart: start,
        onTouchEnd: stop,
        isPressed, // For visual feedback (scale animation)
    };
};

