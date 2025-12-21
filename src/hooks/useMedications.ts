import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Medication {
    id: string;
    name: string;
    time: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'specific_days';
    customDays: string[];
    startDate: string;
    endDate: string;
    isPermanent: boolean;
    reminder: boolean;
    takenHistory: Record<string, boolean>; // YYYY-MM-DD -> boolean
}

export const useMedications = () => {
    const [medications, setMedications] = useState<Medication[]>(() => {
        try { return JSON.parse(localStorage.getItem('baraka_medications_v2') || '[]'); } catch { return []; }
    });
    const { toast } = useToast();

    // Notification Logic
    useEffect(() => {
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        const checkMedications = () => {
            const now = new Date();
            const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
            const todayStr = now.toISOString().split('T')[0];
            const dayMap = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
            const todayDayName = dayMap[now.getDay()];

            medications.forEach(med => {
                if (!med.reminder) return;

                // Check Schedule
                const isTodayDue = med.frequency === 'daily' ||
                    (med.frequency === 'specific_days' && med.customDays?.includes(todayDayName));

                if (isTodayDue && med.time === currentTime) {
                    // Check if already taken today
                    if (!med.takenHistory[todayStr]) {
                        // Send Notification
                        if (Notification.permission === 'granted') {
                            new Notification(`موعد الدواء: ${med.name}`, {
                                body: `حان وقت تناول ${med.name}`,
                                icon: '/icon-192.png' // Adjust if available
                            });
                        } else {
                            toast({ title: `🔔 تذكير: ${med.name}`, description: `حان وقت تناول ${med.name}` });
                        }
                    }
                }
            });
        };

        const interval = setInterval(checkMedications, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [medications]);

    useEffect(() => {
        localStorage.setItem('baraka_medications_v2', JSON.stringify(medications));
    }, [medications]);

    const addMedication = (med: Omit<Medication, 'id' | 'takenHistory'>) => {
        const newMed: Medication = {
            ...med,
            id: Date.now().toString(),
            takenHistory: {}
        };
        setMedications(prev => [...prev, newMed]);
        toast({ title: 'تم إضافة الدواء' });
    };

    const toggleMedTaken = (id: string, dateStr: string) => {
        setMedications(prev => prev.map(m => {
            if (m.id === id) {
                const history = m.takenHistory || {};
                const isTaken = history[dateStr];
                return { ...m, takenHistory: { ...history, [dateStr]: !isTaken } };
            }
            return m;
        }));
    };

    const deleteMedication = (id: string) => {
        setMedications(prev => prev.filter(m => m.id !== id));
        toast({ title: 'تم الحذف' });
    };

    return {
        medications,
        addMedication,
        toggleMedTaken,
        deleteMedication
    };
};
