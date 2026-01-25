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
            const touch = e.touches[0];
            const screenWidth = window.innerWidth;
            const EDGE_ZONE = 50;

            // Detect swipe from LEFT edge (standard LTR back) OR RIGHT edge (standard RTL back/forward)
            // On Android, back gesture works from BOTH edges usually.
            // We will check if touch starts near either edge.
            if (touch.clientX < EDGE_ZONE) {
                touchStartX.current = touch.clientX;
                touchStartY.current = touch.clientY;
                isSwiping.current = true;
            } else if (touch.clientX > screenWidth - EDGE_ZONE) {
                touchStartX.current = touch.clientX;
                touchStartY.current = touch.clientY;
                isSwiping.current = true;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isSwiping.current) return;

            const touch = e.touches[0];
            // Delta calculation depends on start side.
            // If started Left: Delta is Current - Start (Positive)
            // If started Right: Delta is Start - Current (Positive)

            const screenWidth = window.innerWidth;
            const startedRight = touchStartX.current > screenWidth / 2;

            let deltaX = 0;
            if (startedRight) {
                deltaX = touchStartX.current - touch.clientX;
            } else {
                deltaX = touch.clientX - touchStartX.current;
            }

            const deltaY = Math.abs(touchStartY.current - touch.clientY);

            // If vertical movement is too much, cancel swipe
            if (deltaY > 50) {
                isSwiping.current = false;
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (!isSwiping.current) return;

            const touch = e.changedTouches[0];
            const screenWidth = window.innerWidth;
            const startedRight = touchStartX.current > screenWidth / 2;

            let deltaX = 0;
            if (startedRight) {
                deltaX = touchStartX.current - touch.clientX;
            } else {
                deltaX = touch.clientX - touchStartX.current;
            }

            // Swipe exceeds threshold
            if (deltaX > threshold) {
                if (onSwipeBack) {
                    onSwipeBack();
                } else {
                    navigate(-1);
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
