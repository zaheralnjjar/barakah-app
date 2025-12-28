import { useEffect, useRef, useCallback } from 'react';

interface SwipeHandlers {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
}

interface SwipeConfig {
    threshold?: number;  // Minimum distance for swipe detection
    timeout?: number;    // Maximum time for swipe gesture
    enabled?: boolean;
}

export const useSwipeGestures = (
    handlers: SwipeHandlers,
    config: SwipeConfig & { targetRef?: React.RefObject<HTMLElement> } = {}
) => {
    const {
        threshold = 80,
        timeout = 300,
        enabled = true,
        targetRef
    } = config;

    const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (!enabled) return;
        const touch = e.touches[0];
        touchStart.current = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
        };
    }, [enabled]);

    const handleTouchEnd = useCallback((e: TouchEvent) => {
        if (!enabled || !touchStart.current) return;

        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStart.current.x;
        const deltaY = touch.clientY - touchStart.current.y;
        const deltaTime = Date.now() - touchStart.current.time;

        if (deltaTime > timeout) {
            touchStart.current = null;
            return;
        }

        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absX > absY && absX > threshold) {
            if (deltaX > 0) {
                handlers.onSwipeRight?.();
            } else {
                handlers.onSwipeLeft?.();
            }
        } else if (absY > absX && absY > threshold) {
            if (deltaY > 0) {
                handlers.onSwipeDown?.();
            } else {
                handlers.onSwipeUp?.();
            }
        }

        touchStart.current = null;
    }, [enabled, threshold, timeout, handlers]);

    useEffect(() => {
        if (!enabled) return;

        const element = targetRef?.current || document;
        element.addEventListener('touchstart', handleTouchStart as any, { passive: true });
        element.addEventListener('touchend', handleTouchEnd as any, { passive: true });

        return () => {
            element.removeEventListener('touchstart', handleTouchStart as any);
            element.removeEventListener('touchend', handleTouchEnd as any);
        };
    }, [enabled, handleTouchStart, handleTouchEnd, targetRef]);
};

export default useSwipeGestures;
