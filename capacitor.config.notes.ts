import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.barakah.notes',
    appName: 'ملاحظاتي',
    webDir: 'dist-notes',
    android: {
        path: 'android-notes'
    },
    plugins: {},
};

export default config;
