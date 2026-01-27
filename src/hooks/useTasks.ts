import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Preferences } from '@capacitor/preferences';
import { supabase } from '@/integrations/supabase/client';

export interface SubTask {
    id: string;
    title: string;
    completed: boolean;
}

export interface MainTask {
    id: string;
    title: string;
    description?: string;
    startDate?: string;
    deadline: string;
    time?: string; // Optional time for the task
    subtasks: SubTask[];
    progress: number;
    priority: 'low' | 'medium' | 'high';
    type: 'task' | 'project';
    // New fields for appointment linking
    linkedAppointmentId?: string;  // Linked appointment ID
    isPreparatoryFor?: string;     // This task is preparatory for this appointment ID
    reminderBeforeAppointment?: number; // Reminder minutes before appointment
    location?: string;             // Location name/address
    latitude?: number;
    longitude?: number;
}


export const useTasks = () => {
    const [tasks, setTasks] = useState<MainTask[]>([]);
    const { toast } = useToast();

    // Helper to map DB snake_case to Client camelCase
    const mapTaskFromDb = (dbTask: any): MainTask => ({
        id: dbTask.id,
        title: dbTask.title || '',
        description: dbTask.description,
        startDate: dbTask.start_date, // Assuming start_date exists in DB or added
        deadline: dbTask.deadline,
        time: dbTask.time,
        subtasks: dbTask.subtasks || [],
        progress: dbTask.progress || 0,
        priority: dbTask.priority || 'medium',
        type: dbTask.type || 'task',
        linkedAppointmentId: dbTask.linked_appointment_id,
        isPreparatoryFor: dbTask.is_preparatory_for,
        reminderBeforeAppointment: dbTask.reminder_before_appointment,
        location: dbTask.location,
        latitude: dbTask.latitude,
        longitude: dbTask.longitude
    });

    // Helper to map Client camelCase to DB snake_case
    const mapTaskToDb = (task: Partial<MainTask>) => {
        const dbTask: any = { ...task };
        // Remove client-only fields if any, map others
        if (task.linkedAppointmentId !== undefined) dbTask.linked_appointment_id = task.linkedAppointmentId;
        if (task.isPreparatoryFor !== undefined) dbTask.is_preparatory_for = task.isPreparatoryFor;
        if (task.reminderBeforeAppointment !== undefined) dbTask.reminder_before_appointment = task.reminderBeforeAppointment;
        if (task.startDate !== undefined) dbTask.start_date = task.startDate;

        // Clean up camelCase keys
        delete dbTask.linkedAppointmentId;
        delete dbTask.isPreparatoryFor;
        delete dbTask.reminderBeforeAppointment;
        delete dbTask.startDate;

        return dbTask;
    };

    // Fetch tasks from Supabase
    const loadTasks = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;
            if (data) setTasks(data.map(mapTaskFromDb));
        } catch (e) {
            console.error("Error loading tasks", e);
            const savedTasks = localStorage.getItem('baraka_tasks');
            if (savedTasks && (!tasks || tasks.length === 0)) {
                // Potential offline support or migration
            }
        }
    };

    useEffect(() => {
        loadTasks();

        const channel = supabase
            .channel('tasks_realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks' },
                () => {
                    loadTasks();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Sync to Capacitor Preferences
    useEffect(() => {
        if (tasks.length > 0) {
            localStorage.setItem('baraka_tasks', JSON.stringify(tasks));
            Preferences.set({
                key: 'widget_tasks',
                value: JSON.stringify(tasks.filter(t => t.progress < 100).slice(0, 5))
            }).catch(err => console.error("Failed to sync widget tasks", err));
        }
    }, [tasks]);

    const calculateProgress = (subtasks: SubTask[]) => {
        if (subtasks.length === 0) return 0;
        const completed = subtasks.filter(s => s.completed).length;
        return Math.round((completed / subtasks.length) * 100);
    };

    const addTask = async (taskData: Omit<MainTask, 'id' | 'subtasks' | 'progress'>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast({ title: 'يرجى تسجيل الدخول' });
            return;
        }

        const newTask: MainTask = {
            ...taskData,
            id: crypto.randomUUID(),
            subtasks: [],
            progress: 0,
        };

        // Optimistic update
        setTasks(prev => [...prev, newTask]);

        // Map to DB format
        const dbTask = mapTaskToDb(newTask);

        const { error } = await supabase.from('tasks').insert({
            ...dbTask,
            user_id: user.id
        });

        if (error) {
            console.error(error);
            toast({ title: 'خطأ في الحفظ', variant: 'destructive' });
            loadTasks(); // Revert
        } else {
            toast({ title: taskData.type === 'task' ? "تم إضافة المهمة" : "تم إنشاء المشروع" });
        }
    };

    const updateTask = async (task: MainTask) => {
        // Optimistic
        setTasks(prev => prev.map(t => t.id === task.id ? task : t));

        const dbTask = mapTaskToDb(task);
        const { error } = await supabase.from('tasks').update(dbTask).eq('id', task.id);

        if (error) {
            console.error(error);
            toast({ title: 'خطأ في التحديث', variant: 'destructive' });
            loadTasks();
        }
    };

    const deleteMainTask = async (id: string) => {
        // Optimistic
        setTasks(prev => prev.filter(t => t.id !== id));

        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) {
            console.error(error);
            toast({ title: 'خطأ في الحذف', variant: 'destructive' });
            loadTasks();
        } else {
            toast({ title: "تم حذف المهمة" });
        }
    };

    const addSubtask = async (taskId: string, title: string) => {
        if (!title.trim()) return;

        let updatedTask: MainTask | undefined;
        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                const newSubtasks = [...t.subtasks, { id: crypto.randomUUID(), title, completed: false }];
                updatedTask = { ...t, subtasks: newSubtasks, progress: calculateProgress(newSubtasks) };
                return updatedTask;
            }
            return t;
        }));

        if (updatedTask) {
            const { error } = await supabase.from('tasks').update({
                subtasks: updatedTask.subtasks,
                progress: updatedTask.progress // subtasks and progress are same in DB (jsonb/int)
            }).eq('id', taskId);

            if (error) {
                console.error(error);
                loadTasks();
            }
        }
    };

    const toggleSubtask = async (taskId: string, subtaskId: string) => {
        let updatedTask: MainTask | undefined;
        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                const newSubtasks = t.subtasks.map(s =>
                    s.id === subtaskId ? { ...s, completed: !s.completed } : s
                );
                updatedTask = { ...t, subtasks: newSubtasks, progress: calculateProgress(newSubtasks) };
                return updatedTask;
            }
            return t;
        }));

        if (updatedTask) {
            const { error } = await supabase.from('tasks').update({
                subtasks: updatedTask.subtasks,
                progress: updatedTask.progress
            }).eq('id', taskId);

            if (error) {
                console.error(error);
                loadTasks();
            }
        }
    };

    const deleteSubtask = async (taskId: string, subtaskId: string) => {
        let updatedTask: MainTask | undefined;
        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                const newSubtasks = t.subtasks.filter(s => s.id !== subtaskId);
                updatedTask = { ...t, subtasks: newSubtasks, progress: calculateProgress(newSubtasks) };
                return updatedTask;
            }
            return t;
        }));

        if (updatedTask) {
            const { error } = await supabase.from('tasks').update({
                subtasks: updatedTask.subtasks,
                progress: updatedTask.progress
            }).eq('id', taskId);

            if (error) {
                console.error(error);
                loadTasks();
            }
        }
    };

    const linkToAppointment = async (taskId: string, appointmentId: string) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, linkedAppointmentId: appointmentId } : t
        ));
        await supabase.from('tasks').update({ linked_appointment_id: appointmentId }).eq('id', taskId);
        toast({ title: 'تم الربط', description: 'تم ربط المهمة بالموعد' });
    };

    const unlinkFromAppointment = async (taskId: string) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, linkedAppointmentId: undefined } : t
        ));
        await supabase.from('tasks').update({ linked_appointment_id: null }).eq('id', taskId);
    };

    const setPreparatoryFor = async (taskId: string, appointmentId: string, reminderMinutes: number = 60) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId ? {
                ...t,
                isPreparatoryFor: appointmentId,
                reminderBeforeAppointment: reminderMinutes
            } : t
        ));
        await supabase.from('tasks').update({
            is_preparatory_for: appointmentId,
            reminder_before_appointment: reminderMinutes
        }).eq('id', taskId);
        toast({ title: 'تم التعيين', description: 'تم تعيين المهمة كمهمة تحضيرية' });
    };

    const getPreparatoryTasks = (appointmentId: string): MainTask[] => {
        return tasks.filter(t => t.isPreparatoryFor === appointmentId);
    };

    const getLinkedTasks = (appointmentId: string): MainTask[] => {
        return tasks.filter(t => t.linkedAppointmentId === appointmentId);
    };

    return {
        tasks,
        setTasks,
        addTask,
        updateTask,
        deleteMainTask,
        addSubtask,
        toggleSubtask,
        deleteSubtask,
        linkToAppointment,
        unlinkFromAppointment,
        setPreparatoryFor,
        getPreparatoryTasks,
        getLinkedTasks,
        refreshTasks: loadTasks,
    };
};

