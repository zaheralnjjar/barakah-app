import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SmartBottomBar from '@/components/SmartBottomBar';
import BottomNavBar from '@/components/BottomNavBar';
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
        switch (id) {
            case 'dashboard':
                navigate('/');
                break;
            case 'financial':
            case 'mohamed':
                navigate('/');
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('change-tab', { detail: 'finance' }));
                }, 100);
                break;
            case 'productivity':
            case 'fatima':
            case 'thesis':
                // Stay on thesis or go to productivity
                break;
            case 'settings':
                navigate('/');
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('change-tab', { detail: 'settings' }));
                }, 100);
                break;
            case 'prayer':
                navigate('/');
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('change-tab', { detail: 'prayer' }));
                }, 100);
                break;
            case 'appointments':
                navigate('/');
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('change-tab', { detail: 'appointments' }));
                }, 100);
                break;
            case 'map':
                navigate('/');
                break;
            default:
                navigate('/');
        }
    };

    return (
        <div className="min-h-screen pb-24">
            {children}
            {isAndroidPlatform ? (
                <SmartBottomBar
                    activeTab={getActiveTab()}
                    onNavigate={handleNavChange}
                />
            ) : (
                <BottomNavBar
                    activeTab={getActiveTab()}
                    onNavigate={handleNavChange}
                    onLongPress={() => { }}
                />
            )}
        </div>
    );
}
