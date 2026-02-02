import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.barakah.app',
    appName: 'البركة',
    webDir: 'dist',
    android: {
        path: 'android',
        // Fix for touch events and map rendering in Android WebView
        webContentsDebuggingEnabled: false,
    },
    server: {
        // Improves performance for local assets
        androidScheme: 'https',
    },
    plugins: {
        SpeechRecognition: {
            // Android-specific settings
        },
        GoogleAuth: {
            scopes: ["profile", "email", "https://www.googleapis.com/auth/tasks"],
            serverClientId: "323985160877-n3e36e3e3e3e3e3e3e3e3e3e3e.apps.googleusercontent.com", // Placeholder: User will need to replace this
            forceCodeForRefreshToken: true,
        }
    },
};

export default config;
