import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const NotificationManager = {
    async init() {
        if (!Capacitor.isNativePlatform()) return;

        try {
            const perm = await LocalNotifications.checkPermissions();
            if (perm.display !== 'granted') {
                await LocalNotifications.requestPermissions();
            }
        } catch (e) {
            console.error('[NotificationManager] Init error:', e);
        }
    },

    async requestPermission() {
        if (!Capacitor.isNativePlatform()) return;
        return await LocalNotifications.requestPermissions();
    },

    async schedule(options: any) {
        if (!Capacitor.isNativePlatform()) {
            console.log('[NotificationManager] Web: Notification scheduled', options);
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(options.title, { body: options.body });
            }
            return;
        }

        try {
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: options.title,
                        body: options.body,
                        id: options.id || Math.floor(Date.now() % 100000),
                        schedule: { at: options.schedule instanceof Date ? options.schedule : new Date(options.schedule) },
                        sound: options.sound || undefined,
                        extra: options.extra || null
                    }
                ]
            });
            console.log('[NotificationManager] Scheduled:', options);
        } catch (e) {
            console.error('[NotificationManager] Schedule error:', e);
        }
    },

    // Stub for getNotifications/save to prevent immediate crashes if I missed a ref, 
    // but the goal is to remove them. I'll remove them.
};
