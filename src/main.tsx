import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'
import '@fontsource/amiri';

createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
);

// Unregister Service Workers and Clear Cache on localhost to fix "Failed to fetch" errors
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            for (let registration of registrations) {
                registration.unregister().then(success => {
                    if (success) {
                        console.log('✅ Local SW Unregistered Successfully');
                        // Force reload after unregistration if vital
                        // window.location.reload(); 
                    }
                });
            }
        });
    }

    // Clear all caches for the current origin
    if ('caches' in window) {
        caches.keys().then(names => {
            for (let name of names) caches.delete(name);
        });
    }
}

