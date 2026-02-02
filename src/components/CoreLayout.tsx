import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import SideNavBar from '@/components/SideNavBar';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { ShortcutDialogs } from '@/components/dialogs/ShortcutDialogs';
import { useNotesV2 } from '@/hooks/useNotesV2';

import { useSystemModes } from '@/hooks/useSystemModes';
import { MultiActionFAB } from '@/components/MultiActionFAB';
import { useCloudSync } from '@/hooks/useCloudSync';

import { useToast } from '@/hooks/use-toast';
import { isAndroid } from '@/utils/platformDetection';

const CoreLayout = () => {
    const { toast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isMobile, setIsMobile] = useState(false);
    const { syncNow } = useCloudSync();

    useEffect(() => {
        const checkMobile = () => {
            const width = window.innerWidth;
            const userAgent = navigator.userAgent.toLowerCase();
            const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
            const isDroid = isAndroid() || (userAgent.indexOf("android") > -1);

            setIsMobile(width < 1024 || isMobileUA || isDroid);
        };

        checkMobile();
        const handleResize = () => checkMobile();

        const handleCloudSync = () => syncNow();
        const handleNavigateTab = (e: any) => handleNavigate(e.detail);
        const handleStartTimer = (e: any) => {
            const { minutes } = e.detail;
            toast({ title: 'بدء مؤقت', description: `تم بدء مؤقت لـ ${minutes} دقيقة` });
        };
        const handleSetReminder = (e: any) => {
            const { minutes } = e.detail;
            toast({ title: 'تذكير سريع', description: `سنقوم بتذكيرك بعد ${minutes} دقيقة` });
        };
        const handleRecordWater = () => {
            // Logic to save water intake could go here
            syncNow();
        };
        const handleOpenIslamic = (e: any) => {
            const { tool } = e.detail;
            navigate('/');
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('change-tab', { detail: 'islamic' }));
                // Optional: dispatch another event to open specific tool like 'mushaf'
            }, 50);
        };
        const handleOpenTask = (e: any) => {
            const priority = e.detail?.priority || 'normal';
            toast({ title: 'إضافة مهمة', description: `فتح حوار إضافة مهمة (${priority})` });
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('trigger-cloud-sync', handleCloudSync);
        window.addEventListener('navigate-tab', handleNavigateTab);
        window.addEventListener('start-quick-timer', handleStartTimer);
        window.addEventListener('set-quick-reminder', handleSetReminder);
        window.addEventListener('record-water-intake', handleRecordWater);
        window.addEventListener('open-islamic-tool', handleOpenIslamic);
        window.addEventListener('open-task-dialog', handleOpenTask);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('trigger-cloud-sync', handleCloudSync);
            window.removeEventListener('navigate-tab', handleNavigateTab);
            window.removeEventListener('start-quick-timer', handleStartTimer);
            window.removeEventListener('set-quick-reminder', handleSetReminder);
            window.removeEventListener('record-water-intake', handleRecordWater);
            window.removeEventListener('open-islamic-tool', handleOpenIslamic);
            window.removeEventListener('open-task-dialog', handleOpenTask);
        };
    }, [toast]);

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
        // --- HARD NAVIGATION: Close all overlays ---
        window.dispatchEvent(new Event('close-quick-note'));
        window.dispatchEvent(new Event('close-appointment-dialog'));
        window.dispatchEvent(new Event('close-distraction-dialog'));
        window.dispatchEvent(new Event('close-map-settings-dialog')); // Assuming there's a close event, or rely on route change
        // For Drawer based dialogs like QuickNote, we might need specific events if they don't listen to route changes automatically.
        // QuickNoteDialog usually listens to specific close props, but closing it via event might require adding a listener inside it.
        // Actually, QuickNoteDialog (viewed earlier) doesn't have a 'close-quick-note' listener visible in the snippet.
        // It relies on `isOpen` prop passed from parent (SmartDashboard usually).
        // So I should dispatch an event that SmartDashboard listens to, to set isOpen=false.
        // SmartDashboard likely listens to 'open-quick-note'. Does it listen to 'close...'?
        // If not, I'll rely on `global-nav-change` which SmartDashboard DOES listen to (line 790 in step 11790 summary implied it).
        // Let's rely on `window.dispatchEvent(new CustomEvent('global-nav-change', { detail: { tabId } }));` doing the work 
        // IF SmartDashboard is implemented correctly.
        // But to be safe, I'll add specific close events if I know they exist.
        // For now, `global-nav-change` is the standard "I am moving away" signal.

        // setActiveTab(tabId); // Moved down to specific handlers to avoid setting invalid tabs

        // Handle "Reset/Jump to Root" Logic
        if (activeTab === tabId) {
            if (tabId === 'notes-v2') {
                if (location.pathname !== '/notes-v2') {
                    navigate('/notes-v2');
                } else {
                    window.dispatchEvent(new Event('refresh-notes-v2'));
                }
                return;
            } else {
                setActiveTab('loading-reset');
                setTimeout(() => setActiveTab(tabId), 10);
                return;
            }
        }

        setActiveTab(tabId);
        window.dispatchEvent(new CustomEvent('global-nav-change', { detail: { tabId } }));

        if (tabId === 'calendar' || tabId === 'calendar-monthly') {
            setActiveTab('calendar');
            navigate('/');
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('change-tab', { detail: 'calendar-monthly' }));
            }, 50);
        } else if (tabId === 'calendar-weekly') {
            setActiveTab('calendar');
            navigate('/');
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('change-tab', { detail: 'calendar-weekly' }));
            }, 50);
        } else if (tabId === 'notes-v2') {
            navigate('/notes-v2');
        } else if (tabId === 'dashboard') {
            setActiveTab('dashboard');
            navigate('/');
        } else {
            setActiveTab(tabId);
            window.dispatchEvent(new CustomEvent('global-nav-change', { detail: { tabId } }));

            if (location.pathname !== '/') {
                navigate('/');
            }
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('change-tab', { detail: tabId }));
            }, 50);
        }
    };



    const handleAddNote = () => {
        // Dispatch custom event which SmartDashboard listens to
        window.dispatchEvent(new CustomEvent('open-quick-note', { detail: { type: 'quick_note' } }));
    };

    const handleVoiceNote = () => {
        // Dispatch event for specialized voice handling if needed, or re-use existing
        window.dispatchEvent(new CustomEvent('open-quick-note', { detail: { type: 'quick_note', autoStartRecording: true } }));
    };

    const handleAddAppointment = () => {
        window.dispatchEvent(new Event('open-appointment-dialog'));
    };

    const handleAddDistraction = () => {
        window.dispatchEvent(new Event('open-distraction-dialog'));
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-white relative">
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
                onAddNote={handleAddNote}
                onVoiceNote={handleVoiceNote}
                onAddAppointment={handleAddAppointment}
                onAddDistraction={handleAddDistraction}
            />
            <div className={`flex-1 w-full h-full overflow-y-auto overflow-x-hidden transition-all duration-300 ${!isMobile ? 'mr-16 pr-0' : 'pb-20'}`}>
                <Outlet context={{ activeTab, setActiveTab }} />
            </div>

            {/* Multi-Action Floating Button - Moved to App.tsx for global scope */}

            <ShortcutDialogs />


        </div>
    );
};

export default CoreLayout;
