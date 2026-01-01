import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface Appointment {
    id: string;
    title: string;
    date: string;
    time: string;
    location?: string;
    notes?: string;
    preparatoryTaskIds?: string[];
    linkedTaskIds?: string[];
    convertedFromTaskId?: string;
}

// Helper to convert string ID to integer ID for LocalNotifications
const hashCode = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
};

export const useAppointments = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const { toast } = useToast();

    const loadAppointments = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
            .from('appointments')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: true });
        if (data) setAppointments(data);
    };

    useEffect(() => {
        loadAppointments();
    }, []);

    const refreshAppointments = loadAppointments;

    const addAppointment = async (apptData: Omit<Appointment, 'id'>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast({ title: 'خطأ', description: 'يرجى تسجيل الدخول' });
            return;
        }
        const { data, error } = await supabase.from('appointments').insert({
            id: crypto.randomUUID(),
            user_id: user.id,
            title: apptData.title,
            date: apptData.date,
            time: apptData.time,
            location: apptData.location,
            notes: apptData.notes,
            is_completed: false
        }).select().single();

        if (error) {
            toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
            return;
        }
        if (data) {
            // Schedule Notification
            try {
                const dateObj = new Date(`${data.date}T${data.time}`);
                if (dateObj > new Date()) {
                    const notifId = hashCode(data.id);
                    await LocalNotifications.schedule({
                        notifications: [{
                            title: 'تذكير بموعد',
                            body: data.title,
                            id: notifId,
                            schedule: { at: dateObj },
                            sound: 'beep.wav',
                            extra: { appointmentId: data.id }
                        }]
                    });
                    console.log('Scheduled notification for:', dateObj, 'ID:', notifId);
                }
            } catch (e) {
                console.error("Failed to schedule notification:", e);
            }

            setAppointments(prev => [...prev, data]);
            toast({ title: "تم حجز الموعد وتفعيل التذكير" });
            window.dispatchEvent(new Event('appointments-updated'));
        }
    };

    const deleteAppointment = async (id: string) => {
        setAppointments(prev => prev.filter(a => a.id !== id));

        // Cancel Notification
        try {
            await LocalNotifications.cancel({ notifications: [{ id: hashCode(id) }] });
        } catch (e) { console.error("Error cancelling notification", e); }

        try {
            const { error } = await supabase.from('appointments').delete().eq('id', id);
            if (error) throw error;
            window.dispatchEvent(new Event('appointments-updated'));
        } catch (e) {
            console.error(e);
            toast({ title: 'خطأ في الحذف' });
            loadAppointments(); // Revert
        }
    };

    // Linking functions
    const addPreparatoryTask = (appointmentId: string, taskId: string) => {
        setAppointments(prev => prev.map(a => {
            if (a.id === appointmentId) {
                const existing = a.preparatoryTaskIds || [];
                if (!existing.includes(taskId)) {
                    return { ...a, preparatoryTaskIds: [...existing, taskId] };
                }
            }
            return a;
        }));
    };

    const removePreparatoryTask = (appointmentId: string, taskId: string) => {
        setAppointments(prev => prev.map(a => {
            if (a.id === appointmentId) {
                return {
                    ...a,
                    preparatoryTaskIds: (a.preparatoryTaskIds || []).filter(id => id !== taskId)
                };
            }
            return a;
        }));
    };

    const linkTask = (appointmentId: string, taskId: string) => {
        setAppointments(prev => prev.map(a => {
            if (a.id === appointmentId) {
                const existing = a.linkedTaskIds || [];
                if (!existing.includes(taskId)) {
                    return { ...a, linkedTaskIds: [...existing, taskId] };
                }
            }
            return a;
        }));
    };

    const unlinkTask = (appointmentId: string, taskId: string) => {
        setAppointments(prev => prev.map(a => {
            if (a.id === appointmentId) {
                return {
                    ...a,
                    linkedTaskIds: (a.linkedTaskIds || []).filter(id => id !== taskId)
                };
            }
            return a;
        }));
    };

    const getAppointmentsWithPreparatoryTasks = (): Appointment[] => {
        return appointments.filter(a => a.preparatoryTaskIds && a.preparatoryTaskIds.length > 0);
    };

    useEffect(() => {
        const handleUpdates = () => loadAppointments();
        window.addEventListener('appointments-updated', handleUpdates);

        const channel = supabase
            .channel('appointments_realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'appointments' },
                () => {
                    loadAppointments();
                }
            )
            .subscribe();

        return () => {
            window.removeEventListener('appointments-updated', handleUpdates);
            supabase.removeChannel(channel);
        };
    }, []);

    return {
        appointments,
        addAppointment,
        deleteAppointment,
        addPreparatoryTask,
        removePreparatoryTask,
        linkTask,
        unlinkTask,
        getAppointmentsWithPreparatoryTasks,
        refreshAppointments,
    };
};
