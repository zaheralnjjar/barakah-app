import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import SideNavBar from '@/components/SideNavBar';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { ShortcutDialogs } from '@/components/dialogs/ShortcutDialogs';

const CoreLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Global Swipe Back
    useSwipeBack({
        enabled: true,
        onSwipeBack: () => {
            if (location.pathname !== '/') {
                navigate(-1);
            }
        }
    });

    // Update active tab based on location
    useEffect(() => {
        if (location.pathname === '/notes-v2') {
            setActiveTab('notes-v2');
        } else if (location.pathname === '/' && activeTab === 'notes-v2') {
            setActiveTab('dashboard');
        }
    }, [location.pathname]);

    // Handler for navigation from SideNavBar
    const handleNavigate = (tabId: string) => {
        // Handle "Reset/Jump to Root" Logic
        if (activeTab === tabId) {
            if (tabId === 'notes-v2') {
                // If deep inside notes (e.g. /notes-v2/folder/123), navigate to root /notes-v2
                if (location.pathname !== '/notes-v2') {
                    navigate('/notes-v2');
                } else {
                    // Already at root, maybe trigger a refresh event if needed?
                    window.dispatchEvent(new Event('refresh-notes-v2'));
                }
                return;
            } else {
                // For Dashboard Tabs: Force re-mount to reset view state
                setActiveTab('loading-reset'); // Temporary state
                setTimeout(() => setActiveTab(tabId), 10);
                return;
            }
        }

        setActiveTab(tabId);
        // Dispatch global event to close any overlays (like Hidayah manager)
        window.dispatchEvent(new CustomEvent('global-nav-change', { detail: { tabId } }));

        if (tabId === 'calendar') {
            // Force monthly calendar view as requested
            navigate('/');
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('change-tab', { detail: 'calendar-monthly' }));
            }, 50);
        } else if (tabId === 'notes-v2') {
            navigate('/notes-v2');
        } else if (tabId === 'dashboard') {
            navigate('/');
        } else {
            if (location.pathname !== '/') {
                navigate('/');
            }
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('change-tab', { detail: tabId }));
            }, 50);
        }
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-white">
            <SideNavBar
                activeTab={activeTab}
                onNavigate={handleNavigate}
                onLongPress={handleNavigate}
                onSync={() => {
                    window.dispatchEvent(new Event('trigger-cloud-sync'));
                }}
                onOpenReports={() => {
                    window.dispatchEvent(new Event('open-report-generator'));
                }}
            />
            {/* Main Content: Add margin for Desktop Sidebar (Right side in RTL) */}
            <div className={`flex-1 h-full overflow-y-auto overflow-x-hidden transition-all duration-300 ${!isMobile ? 'mr-16' : 'pb-14'}`}>
                <Outlet context={{ activeTab, setActiveTab }} />
            </div>

            {/* Global Dialogs */}
            <ShortcutDialogs />
        </div>
    );
};

export default CoreLayout;
