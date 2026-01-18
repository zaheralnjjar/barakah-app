import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNavBar from '@/components/BottomNavBar';

interface ThesisLayoutProps {
    children: ReactNode;
}

/**
 * Layout wrapper for Thesis pages that includes the BottomNavBar
 * This ensures consistent navigation across all thesis-related pages
 */
export default function ThesisLayout({ children }: ThesisLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine active tab based on current path
    const getActiveTab = () => {
        if (location.pathname.includes('/thesis')) return 'thesis';
        return 'dashboard';
    };

    const handleNavChange = (id: string) => {
        switch (id) {
            case 'dashboard':
                navigate('/');
                break;
            case 'thesis':
                // Stay on thesis section
                break;
            case 'mohamed': // finance
                navigate('/#finance');
                break;
            case 'fatima': // productivity
                navigate('/#productivity');
                break;
            case 'settings':
                navigate('/#settings');
                break;
            default:
                navigate('/');
        }
    };

    return (
        <div className="min-h-screen pb-24">
            {children}
            <BottomNavBar
                activeTab={getActiveTab()}
                onNavigate={handleNavChange}
                onLongPress={() => { }}
            />
        </div>
    );
}
