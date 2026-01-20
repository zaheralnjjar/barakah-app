import React from 'react';
import { Loader2 } from 'lucide-react';

interface PageLoadingProps {
    message?: string;
}

const PageLoading: React.FC<PageLoadingProps> = ({ message = 'جاري التحميل...' }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8">
            <div className="relative">
                <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-xl animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-full">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
            </div>
            <p className="mt-4 text-sm text-gray-500 arabic-body animate-pulse">
                {message}
            </p>
        </div>
    );
};

export default PageLoading;
