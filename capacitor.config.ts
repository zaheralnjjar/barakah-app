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
        }
    },
};

export default config;
