import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotesLayoutV2 from "./pages/notes-v2/Index";
import TrackingPage from "./pages/TrackingPage";
import NotesOnlyView from "./components/notes-app/NotesOnlyView";

import NotFound from "./pages/NotFound";
import ErrorBoundary from "@/components/ErrorBoundary";
import ThesisNavigator from "./pages/thesis/ThesisNavigator";
import ThesisDashboard from "./pages/thesis/ThesisDashboard";
import ThesisTasks from "./pages/thesis/ThesisTasks";
import ThesisStructure from "./pages/thesis/ThesisStructure";
import ThesisCalendar from "./pages/thesis/ThesisCalendar";
import ThesisIndexes from "./pages/thesis/ThesisIndexes";
import ThesisSettings from "./pages/thesis/ThesisSettings";
import ThesisReferences from "./pages/thesis/ThesisReferences";
import ThesisTrash from "./pages/thesis/ThesisTrash";
import ThesisLinks from "./pages/thesis/ThesisLinks";
import ThesisMindMap from "./pages/thesis/ThesisMindMap";
import ThesisTimeline from "./pages/thesis/ThesisTimeline";
import './i18n/config'; // Initialize i18n
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { handleShortcut, parseDeepLink } from '@/services/ShortcutHandler';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

// Untracked/New Component
import ThesisLayout from "./pages/thesis/ThesisLayout";
import { DiagnosticPage } from "./components/DiagnosticPage";
import WidgetPage from "./pages/WidgetPage";
import { GlobalSearchDialog } from "@/components/GlobalSearchDialog";
import CoreLayout from "./components/CoreLayout";
import PrayerTimes from "@/components/PrayerTimes";
import LocationsPage from "@/pages/LocationsPage";
import { MultiActionFAB } from '@/components/MultiActionFAB';
import { isAndroid } from '@/utils/platformDetection';
import { useState } from 'react';
// QuickNoteDialog removed - notes now open inline in UnifiedNotesLayout
import { LocationShortcutListener } from "@/components/LocationShortcutListener";
import { ShortcutDialogs } from "@/components/dashboard/ShortcutDialogs";
import { NotificationManager } from './services/NotificationManager';




const queryClient = new QueryClient();

// Deep Link Handler Component
const DeepLinkHandler = () => {
  useEffect(() => {
    // Handle app URL open (from shortcuts)
    const handleAppUrlOpen = async () => {
      try {
        const { url } = await CapApp.getLaunchUrl() || {};
        if (url) {
          const shortcutType = parseDeepLink(url);
          if (shortcutType) {
            // Small delay to let app fully load
            setTimeout(() => handleShortcut(shortcutType), 500);
          }
        }
      } catch (e) {
        console.error('Error handling launch URL:', e);
      }
    };

    handleAppUrlOpen();

    // Listen for app URL open events
    const listener = CapApp.addListener('appUrlOpen', async (event) => {
      const shortcutType = parseDeepLink(event.url);
      if (shortcutType) {
        await handleShortcut(shortcutType);
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, []);

  return null;
};

// Request all permissions on app start
const PermissionRequester = () => {
  useEffect(() => {
    const requestPermissions = async () => {
      // Only request permissions automatically on Native Platforms (Android/iOS)
      // On Web, permissions should be requested on demand (user interaction)
      const isNative = Capacitor.isNativePlatform();

      if (!isNative) {
        console.log("Running on Web - skipping aggressive permission requests.");
        return;
      }

      console.log("Requesting permissions on Native...");

      // 1. Location
      try {
        // ... existing location logic ...
        // For Native, we might want to use Capacitor Geolocation plugin permissions if needed, 
        // but existing code used navigator.geolocation which works in WebView too if permissions handled.
        // Let's keep existing logic but wrapped.
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => console.log("Location granted", pos),
            (err) => console.log("Location permission status:", err.message),
            { timeout: 5000, enableHighAccuracy: true }
          );
        }
      } catch (e) { console.error("Location error", e); }

      // 2. Microphone
      try {
        const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
        mic.getTracks().forEach(t => t.stop());
        console.log("Microphone granted");
      } catch (e) { console.error("Microphone denied/error", e); }

      // 3. Camera  
      try {
        const cam = await navigator.mediaDevices.getUserMedia({ video: true });
        cam.getTracks().forEach(t => t.stop());
        console.log("Camera granted");
      } catch (e) { console.error("Camera denied/error", e); }

      // 4. Notifications
      try {
        if ('Notification' in window) {
          if (Notification.permission === 'default') {
            await Notification.requestPermission();
          }
        }
      } catch (e) { console.error("Notification error", e); }

      // 5. Capacitor Local Notifications (Android 13+)
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const status = await LocalNotifications.checkPermissions();
        if (status.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }
        console.log("LocalNotifications permission:", status.display);
      } catch (e) { console.error("LocalNotifications error", e); }
    };

    // Delay slightly to not block initial render
    setTimeout(requestPermissions, 1000);
  }, []);

  return null;
};




const App = () => {
  // Watch sync removed - watch app deleted
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Initialize Notification Listener

  // Global QuickNote - now handled by UnifiedNotesLayout inline (no dialog)

  useEffect(() => {
    const handleOpenQuickNote = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      // Skip if this event was re-dispatched after navigation (meant for UnifiedNotesLayout)
      if (detail?._fromNav) return;
      // Navigate to notes page - UnifiedNotesLayout will handle creating the note
      const currentHash = window.location.hash;
      if (!currentHash.includes('notes-v2')) {
        // Navigate to notes-v2 first, then re-dispatch after a short delay
        window.location.hash = '#/notes-v2';
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-quick-note', { detail: { ...detail, _fromNav: true } }));
        }, 500);
      }
      // If already on notes-v2, the UnifiedNotesLayout listener handles it
    };

    const handleOpenDistraction = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      // Navigate to notes and create a distraction note
      window.location.hash = '#/notes-v2';
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-quick-note', { detail: { type: 'quick_note', tag: 'تشتت' } }));
      }, 500);
    };

    window.addEventListener('open-quick-note', handleOpenQuickNote);
    // Legacy support if anything still uses open-global-voice-recorder
    window.addEventListener('open-global-voice-recorder', (e) => {
      window.dispatchEvent(new CustomEvent('open-quick-note', { detail: { type: 'quick_note', autoStartRecording: true } }));
    });
    window.addEventListener('open-distraction-dialog', handleOpenDistraction);

    return () => {
      window.removeEventListener('open-quick-note', handleOpenQuickNote);
      window.removeEventListener('open-distraction-dialog', handleOpenDistraction);
    }
  }, []);

  const handleAddNote = () => window.dispatchEvent(new CustomEvent('open-quick-note', { detail: { type: 'quick_note' } }));
  const handleVoiceNote = () => {
    window.dispatchEvent(new CustomEvent('open-quick-note', { detail: { type: 'quick_note', autoStartRecording: true } }));
  };
  const handleAddAppointment = () => window.dispatchEvent(new Event('open-appointment-dialog'));
  const handleAddDistraction = () => window.dispatchEvent(new Event('open-distraction-dialog'));

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PermissionRequester />
        <DeepLinkHandler />
        <LocationShortcutListener />
        <ShortcutDialogs />

        <Toaster />
        <Sonner />
        <ErrorBoundary>
          <HashRouter>
            <GlobalSearchDialog />

            <Routes>
              <Route path="/notes-only" element={<NotesOnlyView />} />
              {/* Core Layout Routes */}
              <Route element={<CoreLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/notes-v2" element={<NotesLayoutV2 />} />
                <Route path="/widget" element={<WidgetPage />} />
                <Route path="/diagnostic" element={<DiagnosticPage />} />
                <Route path="/prayer-times" element={<PrayerTimes />} />
                <Route path="/locations" element={<LocationsPage />} />
                <Route path="/tracking" element={<TrackingPage />} />

                {/* Thesis Manager Routes - Now inside CoreLayout for SideNavBar */}
                <Route path="/thesis" element={<ThesisLayout><ThesisNavigator /></ThesisLayout>} />
                <Route path="/thesis/dashboard" element={<ThesisLayout><ThesisDashboard /></ThesisLayout>} />
                <Route path="/thesis/tasks" element={<ThesisLayout><ThesisTasks /></ThesisLayout>} />
                <Route path="/thesis/structure" element={<ThesisLayout><ThesisStructure /></ThesisLayout>} />
                <Route path="/thesis/calendar" element={<ThesisLayout><ThesisCalendar /></ThesisLayout>} />
                <Route path="/thesis/indexes" element={<ThesisLayout><ThesisIndexes /></ThesisLayout>} />
                <Route path="/thesis/settings" element={<ThesisLayout><ThesisSettings /></ThesisLayout>} />
                <Route path="/thesis/references" element={<ThesisLayout><ThesisReferences /></ThesisLayout>} />
                <Route path="/thesis/trash" element={<ThesisLayout><ThesisTrash /></ThesisLayout>} />
                <Route path="/thesis/links" element={<ThesisLayout><ThesisLinks /></ThesisLayout>} />
                <Route path="/thesis/mindmap" element={<ThesisLayout><ThesisMindMap /></ThesisLayout>} />
                <Route path="/thesis/timeline" element={<ThesisLayout><ThesisTimeline /></ThesisLayout>} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>





            {/* Global FAB - Show everywhere on mobile */}
            {(isAndroid() || window.innerWidth < 1024) && (
              <MultiActionFAB
                onAddNote={handleAddNote}
                onVoiceNote={handleVoiceNote}
                onAddAppointment={handleAddAppointment}
                onAddDistraction={handleAddDistraction}
                sizeMultiplier={0.65}
                className="bottom-[80px] right-[4%]"
              />
            )}

          </HashRouter>
        </ErrorBoundary>
      </TooltipProvider>

    </QueryClientProvider >
  );
};

export default App;
