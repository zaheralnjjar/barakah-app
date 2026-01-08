import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.barakah.newmuslims',
    appName: 'هداية',
    webDir: 'dist-newmuslims',
    android: {
        path: 'android-newmuslims'
    },
    plugins: {
        GoogleAuth: {
            scopes: ['profile', 'email'],
            serverClientId: '869098637321-s4iif2e10hnsrd91ua0in06b783t5i16.apps.googleusercontent.com',
            forceCodeForRefreshToken: true,
        },
    },
};

export default config;
