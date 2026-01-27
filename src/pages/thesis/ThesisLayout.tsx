import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Briefcase, ChevronRight } from 'lucide-react';
import { isAndroid } from '@/utils/platformDetection';

interface ThesisLayoutProps {
    children: ReactNode;
}

/**
 * Layout wrapper for Thesis pages
 * Uses SmartBottomBar on Android, BottomNavBar on Web
 */
export default function ThesisLayout({ children }: ThesisLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const isAndroidPlatform = isAndroid();

    // Determine active tab based on current path
    const getActiveTab = () => {
        if (location.pathname.includes('/thesis')) return isAndroidPlatform ? 'productivity' : 'thesis';
        return 'dashboard';
    };

    const handleNavChange = (id: string) => {
        // Global navigation is now handled by CoreLayout's SideNavBar
        navigate('/');
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('change-tab', { detail: id }));
        }, 50);
    };

    return (
        <div className="min-h-screen bg-transparent relative pb-20">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                    <h1 className="text-lg font-black arabic-title">الأكاديمي (تيزيس)</h1>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/')}
                    className="rounded-full bg-gray-50 hover:bg-gray-100"
                >
                    <ChevronRight className="w-6 h-6" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {children}
            </div>
            {/* The global SideNavBar is provided by CoreLayout */}
        </div>
    );
}
