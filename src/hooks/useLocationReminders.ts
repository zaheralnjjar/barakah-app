
import { useEffect, useState } from 'react';
import { useTasks } from './useTasks';
import { NotificationManager } from '@/services/NotificationManager';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

export const useLocationReminders = () => {
    const { tasks } = useTasks();
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!navigator.geolocation) return;

        console.log("Starting location watch for reminders...");
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setCurrentLocation({ lat: latitude, lng: longitude });

                // Check proximity
                tasks.forEach(task => {
                    if (task.latitude && task.longitude && !task.description?.includes("completed") && !notifiedIds.has(task.id)) {
                        const dist = calculateDistance(latitude, longitude, task.latitude, task.longitude);
                        if (dist < 500) { // 500 meters
                            console.log(`Proximity triggered for task: ${task.title} (${Math.round(dist)}m)`);

                            NotificationManager.schedule({
                                id: Date.now(),
                                title: "📍 تذكير بالموقع",
                                body: `أنت قريب من: ${task.title}. هل تريد إنجازها؟`,
                                schedule: new Date()
                            });

                            setNotifiedIds(prev => new Set(prev).add(task.id));
                        }
                    }
                });
            },
            (err) => console.error("Location watch error", err),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [tasks, notifiedIds]);

    return { currentLocation };
};
