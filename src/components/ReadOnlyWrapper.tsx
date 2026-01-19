import React from 'react';
import { isAndroid } from '@/hooks/usePlatform';
import { Info } from 'lucide-react';

interface ReadOnlyWrapperProps {
    children: React.ReactNode;
    message?: string;
}

/**
 * Wrapper component for read-only academic section on Android
 * Hides edit buttons and shows info message
 */
export const ReadOnlyWrapper: React.FC<ReadOnlyWrapperProps> = ({
    children,
    message = 'وضع العرض فقط - للتحرير استخدم نسخة الويب'
}) => {
    if (!isAndroid()) {
        return <>{children}</>;
    }

    return (
        <div className="relative">
            {/* Read-only banner */}
            <div className="sticky top-0 z-50 bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-blue-700 font-medium">{message}</span>
            </div>

            {/* Content with disabled interactions */}
            <div className="pointer-events-none select-none">
                {children}
            </div>

            {/* Overlay to prevent clicks */}
            <div className="absolute inset-0 bg-transparent cursor-not-allowed" />
        </div>
    );
};

/**
 * Hook to check if current platform should have read-only academic section
 */
export const useReadOnlyAcademic = () => {
    return isAndroid();
};

/**
 * Component to conditionally hide edit buttons on Android
 */
interface HideOnAndroidProps {
    children: React.ReactNode;
}

export const HideOnAndroid: React.FC<HideOnAndroidProps> = ({ children }) => {
    if (isAndroid()) {
        return null;
    }
    return <>{children}</>;
};
