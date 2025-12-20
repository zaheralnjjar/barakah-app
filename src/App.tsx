import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
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
    };

    // Delay slightly to not block initial render
    setTimeout(requestPermissions, 1000);
  }, []);

  return null;
};

const App = () => {
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PermissionRequester />
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
