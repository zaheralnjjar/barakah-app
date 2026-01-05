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

    // Fetch tasks from Supabase
    const loadTasks = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id); // Assuming table has user_id

            if (error) throw error;
            if (data) setTasks(data as unknown as MainTask[]);
        } catch (e) {
            console.error("Error loading tasks", e);
            // Fallback to local storage if offline or error? 
            // For "Instant Sync" priority, we focus on cloud.
            // But let's check local storage as backup if cloud is empty (migration)
            const savedTasks = localStorage.getItem('baraka_tasks');
            if (savedTasks && (!tasks || tasks.length === 0)) {
                // Option: We could auto-migrate here if we wanted.
            }
        }
    };

    useEffect(() => {
        loadTasks();

        // Realtime Subscription
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

    // Sync to Capacitor Preferences for Widget usage (Client side cache)
    useEffect(() => {
        // We still sync to local preferences for purely local widgets/watch functionality compatibility
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

        const { error } = await supabase.from('tasks').insert({
            ...newTask,
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

        const { error } = await supabase.from('tasks').update(task).eq('id', task.id);
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
                progress: updatedTask.progress
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

    // Linking functions (update DB directly)
    const linkToAppointment = async (taskId: string, appointmentId: string) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, linkedAppointmentId: appointmentId } : t
        ));
        await supabase.from('tasks').update({ linkedAppointmentId: appointmentId }).eq('id', taskId);
        toast({ title: 'تم الربط', description: 'تم ربط المهمة بالموعد' });
    };

    const unlinkFromAppointment = async (taskId: string) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, linkedAppointmentId: undefined } : t
        ));
        await supabase.from('tasks').update({ linkedAppointmentId: null }).eq('id', taskId);
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
            isPreparatoryFor: appointmentId,
            reminderBeforeAppointment: reminderMinutes
        }).eq('id', taskId);
        toast({ title: 'تم التعيين', description: 'تم تعيين المهمة كمهمة تحضيرية' });
    };

    // Getters work on local state (which is synced)
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

