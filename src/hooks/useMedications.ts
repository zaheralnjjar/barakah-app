import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Medication {
    id: string;
    name: string;
    time: string; // Default time
    customTimes?: Record<string, string>; // { 'السبت': '08:00', 'الأحد': '09:00', ... }
    frequency: 'daily' | 'weekly' | 'monthly' | 'specific_days';
    customDays: string[];
    startDate: string;
    endDate: string;
    isPermanent: boolean;
    reminder: boolean;
    takenHistory: Record<string, boolean>; // YYYY-MM-DD -> boolean
}

import { supabase } from '@/integrations/supabase/client';

export const useMedications = () => {
    const [medications, setMedications] = useState<Medication[]>([]);
    const { toast } = useToast();

    // Fetch from Supabase
    const fetchMedications = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // 1. Fetch Medications
                const { data: medsData, error: medsError } = await supabase
                    .from('medications')
                    .select('*')
                    .order('created_at', { ascending: true });

                if (medsError) throw medsError;

                if (medsData) {
                    // 2. Fetch Logs
                    const { data: logsData } = await supabase
                        .from('medication_logs')
                        .select('*')
                        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

                    const mappedMeds: Medication[] = medsData.map((m: any) => {
                        const history: Record<string, boolean> = {};
                        logsData?.filter((l: any) => l.medication_id === m.id).forEach((l: any) => {
                            history[l.date] = l.taken;
                        });

                        return {
                            id: m.id,
                            name: m.name,
                            time: m.time || '08:00',
                            frequency: m.frequency as any,
                            customDays: m.custom_days || [],
                            customTimes: {}, // Not in schema yet, ignore or add later
                            startDate: m.start_date || new Date().toISOString().split('T')[0],
                            endDate: m.end_date || '',
                            isPermanent: m.is_permanent || false,
                            reminder: m.reminder !== false,
                            takenHistory: history
                        };
                    });
                    setMedications(mappedMeds);
                    localStorage.setItem('baraka_medications_v2', JSON.stringify(mappedMeds));
                }
            } else {
                const saved = localStorage.getItem('baraka_medications_v2');
                if (saved) setMedications(JSON.parse(saved));
            }
        } catch (e) {
            console.error("Error fetching medications", e);
        }
    };

    useEffect(() => {
        fetchMedications();
    }, []);

    // Notification Logic (same as before, relies on 'medications' state)
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

    const addMedication = async (med: Omit<Medication, 'id' | 'takenHistory'>) => {
        const newMed: Medication = {
            ...med,
            id: crypto.randomUUID(),
            takenHistory: {}
        };

        // Optimistic
        setMedications(prev => [...prev, newMed]);

        // Sync
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { error } = await supabase.from('medications').insert({
                id: newMed.id,
                user_id: user.id,
                name: newMed.name,
                time: newMed.time,
                frequency: newMed.frequency,
                custom_days: newMed.customDays,
                start_date: newMed.startDate,
                end_date: newMed.endDate,
                is_permanent: newMed.isPermanent,
                reminder: newMed.reminder
            });

            if (error) {
                toast({ title: "خطأ", description: "فشل حفظ الدواء", variant: "destructive" });
            } else {
                toast({ title: 'تم إضافة الدواء' });
            }
        }
    };

    const toggleMedTaken = async (id: string, dateStr: string) => {
        let isTaken = false;
        setMedications(prev => prev.map(m => {
            if (m.id === id) {
                const history = m.takenHistory || {};
                isTaken = !history[dateStr];
                return { ...m, takenHistory: { ...history, [dateStr]: isTaken } };
            }
            return m;
        }));

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            if (isTaken) {
                await supabase.from('medication_logs').upsert({
                    medication_id: id,
                    user_id: user.id,
                    date: dateStr,
                    taken: true,
                    taken_at: new Date().toISOString()
                }, { onConflict: 'medication_id, date' });
            } else {
                await supabase.from('medication_logs').delete().match({ medication_id: id, date: dateStr });
            }
        }
    };

    const deleteMedication = async (id: string) => {
        setMedications(prev => prev.filter(m => m.id !== id));
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('medications').delete().eq('id', id);
            toast({ title: 'تم الحذف' });
        }
    };

    return {
        medications,
        addMedication,
        toggleMedTaken,
        deleteMedication
    };
};
