import { LocalNotifications } from '@capacitor/local-notifications';

export class NotificationManager {
    static async requestPermissions(): Promise<boolean> {
        try {
            // Web Permission
            if (Notification.permission !== 'granted') {
                await Notification.requestPermission();
            }

            // Capacitor Permission
            const { display } = await LocalNotifications.requestPermissions();
            return display === 'granted';
        } catch (e) {
            console.error('Error requesting notification permissions:', e);
            return false;
        }
    }

    static async schedule(options: {
        id: number;
        title: string;
        body: string;
        schedule?: Date;
        sound?: string;
        channelId?: string;
    }) {
        try {
            const isCapacitor = (window as any).Capacitor?.isNative;

            if (isCapacitor) {
                await LocalNotifications.schedule({
                    notifications: [{
                        id: options.id,
                        title: options.title,
                        body: options.body,
                        schedule: options.schedule ? { at: options.schedule } : undefined,
                        sound: options.sound,
                        channelId: options.channelId || 'default',
                        actionTypeId: '',
                        extra: null
                    }]
                });
            } else {
                // Web Fallback (Logic only works if window is open)
                if (options.schedule) {
                    const delay = options.schedule.getTime() - Date.now();
                    if (delay > 0) {
                        setTimeout(() => {
                            new Notification(options.title, { body: options.body });
                        }, delay);
                    }
                } else {
                    new Notification(options.title, { body: options.body });
                }
            }
            console.log(`Scheduled notification [${options.id}]: ${options.title} at ${options.schedule}`);
        } catch (e) {
            console.error('Error scheduling notification:', e);
        }
    }

    static async cancel(id: number) {
        try {
            await LocalNotifications.cancel({ notifications: [{ id }] });
        } catch (e) {
            console.error('Error cancelling notification:', e);
        }
    }

    static async getPending() {
        return await LocalNotifications.getPending();
    }
}
