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
    config: SwipeConfig = {}
) => {
    const {
        threshold = 80,
        timeout = 300,
        enabled = true
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

        // Check if gesture was too slow
        if (deltaTime > timeout) {
            touchStart.current = null;
            return;
        }

        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // Determine swipe direction (prefer the axis with more movement)
        if (absX > absY && absX > threshold) {
            // Horizontal swipe
            if (deltaX > 0) {
                handlers.onSwipeRight?.();
            } else {
                handlers.onSwipeLeft?.();
            }
        } else if (absY > absX && absY > threshold) {
            // Vertical swipe
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

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [enabled, handleTouchStart, handleTouchEnd]);
};

export default useSwipeGestures;
