import { useEffect, useState } from 'react';

interface PermissionStatus {
    location: 'granted' | 'denied' | 'prompt';
    microphone: 'granted' | 'denied' | 'prompt';
    camera: 'granted' | 'denied' | 'prompt';
    notifications: 'granted' | 'denied' | 'default';
}

export const usePermissions = () => {
    const [permissions, setPermissions] = useState<PermissionStatus>({
        location: 'prompt',
        microphone: 'prompt',
        camera: 'prompt',
        notifications: 'default',
    });
    const [isRequesting, setIsRequesting] = useState(false);

    // Request all permissions on mount
    useEffect(() => {
        requestAllPermissions();
    }, []);

    const requestAllPermissions = async () => {
        setIsRequesting(true);

        try {
            // 1. Request Location Permission
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    () => setPermissions(p => ({ ...p, location: 'granted' })),
                    () => setPermissions(p => ({ ...p, location: 'denied' })),
                    { enableHighAccuracy: false, timeout: 5000 }
                );
            }

            // 2. Request Microphone Permission
            try {
                const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                micStream.getTracks().forEach(track => track.stop());
                setPermissions(p => ({ ...p, microphone: 'granted' }));
            } catch {
                setPermissions(p => ({ ...p, microphone: 'denied' }));
            }

            // 3. Request Camera Permission
            try {
                const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
                camStream.getTracks().forEach(track => track.stop());
                setPermissions(p => ({ ...p, camera: 'granted' }));
            } catch {
                setPermissions(p => ({ ...p, camera: 'denied' }));
            }

            // 4. Request Notification Permission
            if ('Notification' in window) {
                const notifPermission = await Notification.requestPermission();
                setPermissions(p => ({ ...p, notifications: notifPermission }));
            }

        } catch (error) {
            console.error('Error requesting permissions:', error);
        } finally {
            setIsRequesting(false);
        }
    };

    return {
        permissions,
        isRequesting,
        requestAllPermissions,
    };
};

export default usePermissions;
