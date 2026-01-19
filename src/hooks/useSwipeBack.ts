import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAndroid } from './usePlatform';

interface SwipeBackOptions {
    enabled?: boolean;
    threshold?: number; // pixels
    onSwipeBack?: () => void;
}

/**
 * Hook to enable swipe-back gesture on Android
 * Swipe from right to left to go back to dashboard
 */
export const useSwipeBack = (options: SwipeBackOptions = {}) => {
    const {
        enabled = true,
        threshold = 100,
        onSwipeBack
    } = options;

    const navigate = useNavigate();
    const touchStartX = useRef<number>(0);
    const touchStartY = useRef<number>(0);
    const isSwiping = useRef<boolean>(false);

    useEffect(() => {
        if (!enabled || !isAndroid()) {
            return;
        }

        const handleTouchStart = (e: TouchEvent) => {
            // Only detect swipes starting from the right edge
            const touch = e.touches[0];
            const screenWidth = window.innerWidth;

            // Start detection from right 50px of screen
            if (touch.clientX > screenWidth - 50) {
                touchStartX.current = touch.clientX;
                touchStartY.current = touch.clientY;
                isSwiping.current = true;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isSwiping.current) return;

            const touch = e.touches[0];
            const deltaX = touchStartX.current - touch.clientX;
            const deltaY = Math.abs(touchStartY.current - touch.clientY);

            // If vertical movement is too much, cancel swipe
            if (deltaY > 50) {
                isSwiping.current = false;
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (!isSwiping.current) return;

            const touch = e.changedTouches[0];
            const deltaX = touchStartX.current - touch.clientX;

            // Swipe left (positive deltaX) and exceeds threshold
            if (deltaX > threshold) {
                if (onSwipeBack) {
                    onSwipeBack();
                } else {
                    // Default: navigate to dashboard
                    navigate('/');
                }
            }

            isSwiping.current = false;
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [enabled, threshold, navigate, onSwipeBack]);
};
