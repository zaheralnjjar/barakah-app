import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import SideNavBar from '@/components/SideNavBar';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { ShortcutDialogs } from '@/components/dialogs/ShortcutDialogs';
import { useNotesV2 } from '@/hooks/useNotesV2';
import { CreateNoteDialog } from '@/components/notes-v2/CreateNoteDialog';
import { useSystemModes } from '@/hooks/useSystemModes';
import { MultiActionFAB } from '@/components/MultiActionFAB';

import { useToast } from '@/hooks/use-toast';

const CoreLayout = () => {
    const { toast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        const handleOpenVoiceRecorder = () => setShowVoiceRecorder(true);

        window.addEventListener('resize', handleResize);
        window.addEventListener('open-global-voice-recorder', handleOpenVoiceRecorder);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('open-global-voice-recorder', handleOpenVoiceRecorder);
        };
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

        if (tabId === 'calendar') {
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

    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const { notes, createNote, updateNote } = useNotesV2();
    const activeMode = useSystemModes().modes.find(m => m.is_active);

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
            />
            <div className={`flex-1 h-full overflow-y-auto overflow-x-hidden transition-all duration-300 ${!isMobile ? 'mr-16' : 'pb-14'}`}>
                <Outlet context={{ activeTab, setActiveTab }} />
            </div>

            {/* Multi-Action Floating Button */}
            <MultiActionFAB
                onAddNote={() => {
                    setIsVoiceMode(false);
                    setShowVoiceRecorder(true);
                }}
                onVoiceNote={() => {
                    setIsVoiceMode(true);
                    setShowVoiceRecorder(true);
                }}
                onAddAppointment={() => {
                    window.dispatchEvent(new CustomEvent('change-tab', { detail: 'calendar-monthly' }));
                    // Future: we could open a direct "Add Appointment" dialog here
                    toast({ title: "يرجى اختيار يوم لإضافة موعد" });
                }}
                onAddDistraction={() => {
                    window.dispatchEvent(new CustomEvent('open-distraction-dialog'));
                }}
            />

            <CreateNoteDialog
                isOpen={showVoiceRecorder}
                onClose={() => setShowVoiceRecorder(false)}
                autoStartRecording={isVoiceMode}
            />

            <ShortcutDialogs />
        </div>
    );
};

export default CoreLayout;
