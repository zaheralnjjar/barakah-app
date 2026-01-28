import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import SideNavBar from '@/components/SideNavBar';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { ShortcutDialogs } from '@/components/dialogs/ShortcutDialogs';
import VoiceNoteRecorder from '@/components/VoiceNoteRecorder';
import { Mic } from 'lucide-react';
import { useNotesV2 } from '@/hooks/useNotesV2';
import { useSystemModes } from '@/hooks/useSystemModes';
const CoreLayout = () => {
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

    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const { notes, createNote, updateNote } = useNotesV2();
    const activeMode = useSystemModes().modes.find(m => m.is_active);

    // Activity logging helper for Voice Notes
    const appendToActivitiesNote = async (content: string) => {
        const today = new Date().toLocaleDateString('ar-SA');
        const activityTitle = `نشاط يوم ${today}`;

        const existing = notes.find((n: any) => n.title === activityTitle);

        if (existing) {
            await updateNote({
                id: existing.id,
                updates: { content: (existing.content || '') + `<p>${content}</p>` }
            });
        } else {
            await createNote({ title: activityTitle, folder_id: null, content: `<p>${content}</p>` });
        }
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
            />
            {/* Main Content: Add margin for Desktop Sidebar (Right side in RTL) */}
            <div className={`flex-1 h-full overflow-y-auto overflow-x-hidden transition-all duration-300 ${!isMobile ? 'mr-16' : 'pb-14'}`}>
                <Outlet context={{ activeTab, setActiveTab }} />
            </div>

            {/* Global Unified Add Button - Bottom Left */}
            <UnifiedFloatingButton
                onTap={() => {
                    setShowVoiceRecorder(true); // Re-using this state for the dialog
                    // Ideally we should rename showVoiceRecorder to showCreateNote to be clearer, 
                    // but for now let's use the existing dialog logic or better yet, use CreateNoteDialog directly here.
                }}
                onLongPress={() => {
                    setShowVoiceRecorder(true);
                    // We need to pass a flag to auto-start recording. 
                    // Since we are reusing VoiceNoteRecorder (which is now likely CreateNoteDialog wrapper?), 
                    // wait, I need to check if VoiceNoteRecorder is still the old one or if I should replace it with CreateNoteDialog.
                    // The previous tool usage showed VoiceNoteRecorder in CoreLayout. 
                    // I should replace VoiceNoteRecorder with CreateNoteDialog in this file first.
                }}
            />

            {/* Global Create Note Dialog (Replaces VoiceNoteRecorder) */}
            <CreateNoteDialog
                isOpen={showVoiceRecorder} // Using the existing state variable for now
                onClose={() => setShowVoiceRecorder(false)}
                autoStartRecording={isVoiceMode}
            />

            {/* Global Dialogs */}
            <ShortcutDialogs />
        </div>
    );
};

// Unified Floating Button Component
const UnifiedFloatingButton: React.FC<{ onTap: () => void; onLongPress: () => void }> = ({ onTap, onLongPress }) => {
    const { onMouseDown, onMouseUp, onMouseLeave, onTouchStart, onTouchEnd, onTouchMove, isPressed } = useLongPress({
        onLongPress,
        onClick: onTap,
        ms: 500
    });

    return (
        <button
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onTouchMove={onTouchMove}
            onContextMenu={(e) => e.preventDefault()}
            className={`fixed bottom-6 left-6 z-50 p-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group flex items-center justify-center border-4 border-white/20 ${isPressed ? 'scale-110 bg-emerald-600' : 'active:scale-95'}`}
            title="إضافة ملاحظة (ضغط مطول للصوت)"
        >
            <Plus className={`w-8 h-8 stroke-[3] transition-transform duration-300 ${isPressed ? 'scale-125' : ''}`} />
            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                ملاحظة (مطول للصوت)
            </span>
        </button>
    );
};

export default CoreLayout;
