import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";

import Index from "./pages/Index";
import WidgetPage from "./pages/WidgetPage";
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

const queryClient = new QueryClient();

// Request all permissions on app start
const PermissionRequester = () => {
  useEffect(() => {
    const requestPermissions = async () => {
      console.log("Requesting permissions...");

      // 1. Location
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => console.log("Location granted", pos),
            (err) => console.error("Location denied", err),
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

import { GlobalSearchDialog } from "@/components/GlobalSearchDialog";

const App = () => {
  // Watch sync removed - watch app deleted
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PermissionRequester />
        <Toaster />
        <Sonner />
        <ErrorBoundary>
          <HashRouter>
            <GlobalSearchDialog />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/widget" element={<WidgetPage />} />
              {/* Thesis Manager Routes */}
              <Route path="/thesis" element={<ThesisNavigator />} />
              <Route path="/thesis/dashboard" element={<ThesisDashboard />} />
              <Route path="/thesis/tasks" element={<ThesisTasks />} />
              <Route path="/thesis/structure" element={<ThesisStructure />} />
              <Route path="/thesis/calendar" element={<ThesisCalendar />} />
              <Route path="/thesis/indexes" element={<ThesisIndexes />} />
              <Route path="/thesis/settings" element={<ThesisSettings />} />
              <Route path="/thesis/references" element={<ThesisReferences />} />
              <Route path="/thesis/trash" element={<ThesisTrash />} />
              <Route path="/thesis/links" element={<ThesisLinks />} />
              <Route path="/thesis/mindmap" element={<ThesisMindMap />} />
              <Route path="/thesis/timeline" element={<ThesisTimeline />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </HashRouter>
        </ErrorBoundary>
      </TooltipProvider>

    </QueryClientProvider>
  );
};

export default App;
