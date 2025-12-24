import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Preferences } from '@capacitor/preferences';

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
}


export const useTasks = () => {
    const loadTasksFromStorage = () => {
        try {
            const savedTasks = localStorage.getItem('baraka_tasks');
            if (savedTasks) return JSON.parse(savedTasks);
            return [];
        } catch (e) {
            console.error("Error loading tasks", e);
            return [];
        }
    };

    const [tasks, setTasks] = useState<MainTask[]>(loadTasksFromStorage);
    const { toast } = useToast();

    const refreshTasks = () => {
        setTasks(loadTasksFromStorage());
    };

    // Sync to Storage & Native Widget
    useEffect(() => {
        localStorage.setItem('baraka_tasks', JSON.stringify(tasks));

        // Sync to Capacitor Preferences for Widget usage
        // Widget expects key 'widget_tasks'
        Preferences.set({
            key: 'widget_tasks',
            value: JSON.stringify(tasks.filter(t => t.progress < 100).slice(0, 5))
        }).catch(err => console.error("Failed to sync widget tasks", err));

    }, [tasks]);

    const calculateProgress = (subtasks: SubTask[]) => {
        if (subtasks.length === 0) return 0;
        const completed = subtasks.filter(s => s.completed).length;
        return Math.round((completed / subtasks.length) * 100);
    };

    const addTask = (taskData: Omit<MainTask, 'id' | 'subtasks' | 'progress'>) => {
        const newTask: MainTask = {
            ...taskData,
            id: Date.now().toString(),
            subtasks: [],
            progress: 0,
        };
        setTasks(prev => [...prev, newTask]);
        toast({ title: taskData.type === 'task' ? "تم إضافة المهمة" : "تم إنشاء المشروع" });
    };

    const updateTask = (task: MainTask) => {
        setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    };

    const deleteMainTask = (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
        toast({ title: "تم حذف المهمة" });
    };

    const addSubtask = (taskId: string, title: string) => {
        if (!title.trim()) return;
        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                const newSubtasks = [...t.subtasks, { id: Date.now().toString(), title, completed: false }];
                return { ...t, subtasks: newSubtasks, progress: calculateProgress(newSubtasks) };
            }
            return t;
        }));
    };

    const toggleSubtask = (taskId: string, subtaskId: string) => {
        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                const newSubtasks = t.subtasks.map(s =>
                    s.id === subtaskId ? { ...s, completed: !s.completed } : s
                );
                return { ...t, subtasks: newSubtasks, progress: calculateProgress(newSubtasks) };
            }
            return t;
        }));
    };

    const deleteSubtask = (taskId: string, subtaskId: string) => {
        setTasks(prev => prev.map(t => {
            if (t.id === taskId) {
                const newSubtasks = t.subtasks.filter(s => s.id !== subtaskId);
                return { ...t, subtasks: newSubtasks, progress: calculateProgress(newSubtasks) };
            }
            return t;
        }));
    };

    // Link a task to an appointment
    const linkToAppointment = (taskId: string, appointmentId: string) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, linkedAppointmentId: appointmentId } : t
        ));
        toast({ title: 'تم الربط', description: 'تم ربط المهمة بالموعد' });
    };

    // Unlink a task from an appointment
    const unlinkFromAppointment = (taskId: string) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, linkedAppointmentId: undefined } : t
        ));
    };

    // Set a task as preparatory for an appointment
    const setPreparatoryFor = (taskId: string, appointmentId: string, reminderMinutes: number = 60) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId ? {
                ...t,
                isPreparatoryFor: appointmentId,
                reminderBeforeAppointment: reminderMinutes
            } : t
        ));
        toast({ title: 'تم التعيين', description: 'تم تعيين المهمة كمهمة تحضيرية' });
    };

    // Get all preparatory tasks for a specific appointment
    const getPreparatoryTasks = (appointmentId: string): MainTask[] => {
        return tasks.filter(t => t.isPreparatoryFor === appointmentId);
    };

    // Get all tasks linked to a specific appointment
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
        // New linking functions
        linkToAppointment,
        unlinkFromAppointment,
        setPreparatoryFor,
        getPreparatoryTasks,
        getLinkedTasks,
        refreshTasks,
    };
};

