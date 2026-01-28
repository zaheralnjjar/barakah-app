
import { useMemo, useEffect, useState, useCallback } from 'react';
import { useTasks, MainTask } from './useTasks';
import { ThesisService } from '@/services/thesis/ThesisService';
import { useAppStore, Appointment } from '@/stores/useAppStore';
import { useMedications, Medication } from './useMedications';
import { useSystemModes } from './useSystemModes';
import { ThesisTask } from '@/types/thesis';

export interface UnifiedTask {
    id: string;
    source: 'general' | 'thesis' | 'appointment' | 'medication' | 'shopping' | 'mode';
    title: string;
    description?: string;
    dueDate: string | null;
    priority: 'low' | 'medium' | 'high';
    isCompleted: boolean;
    linkedId?: string;
    category?: string;
    rawDate?: Date;
}

export const useUnifiedTaskEngine = () => {
    const { tasks: generalTasks, refreshTasks, updateTask } = useTasks();
    const { appointments, updateAppointment } = useAppStore();
    const { medications, toggleMedTaken } = useMedications();
    const { modes } = useSystemModes();
    const activeMode = useMemo(() => modes.find(m => m.is_active), [modes]);

    const [thesisTasks, setThesisTasks] = useState<ThesisTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [completedModeItems, setCompletedModeItems] = useState<Set<string>>(new Set());

    useEffect(() => {
        const loadThesisTasks = async () => {
            try {
                const projects = await ThesisService.getProjects();
                const allTasks: ThesisTask[] = [];
                for (const project of projects) {
                    const tasks = await ThesisService.getTasks(project.id);
                    allTasks.push(...tasks);
                }
                setThesisTasks(allTasks);
            } catch (error) {
                console.error("Unified Task Engine: Failed to load thesis tasks", error);
            } finally {
                setLoading(false);
            }
        };

        loadThesisTasks();
    }, []);

    // Toggle completion for any task type
    const toggleComplete = useCallback(async (task: UnifiedTask) => {
        try {
            switch (task.source) {
                case 'general':
                    // Toggle general task progress between 0 and 100
                    const originalTask = generalTasks.find(t => t.id === task.id);
                    if (originalTask) {
                        await updateTask({ ...originalTask, progress: task.isCompleted ? 0 : 100 });
                        refreshTasks();
                    }
                    break;

                case 'thesis':
                    // Toggle thesis task status
                    const newStatus = task.isCompleted ? 'pending' : 'completed';
                    await ThesisService.saveTask({ id: task.id, status: newStatus });
                    // Reload thesis tasks
                    const projects = await ThesisService.getProjects();
                    const allTasks: ThesisTask[] = [];
                    for (const project of projects) {
                        const tasks = await ThesisService.getTasks(project.id);
                        allTasks.push(...tasks);
                    }
                    setThesisTasks(allTasks);
                    break;

                case 'appointment':
                    // Toggle appointment completion
                    updateAppointment(task.id, { isCompleted: !task.isCompleted });
                    break;

                case 'medication':
                    const parts = task.id.split('-');
                    const dateStr = parts.pop()!;
                    const medId = parts.slice(1).join('-');
                    await toggleMedTaken(medId, dateStr);
                    break;

                case 'mode':
                    // Toggle mode item locally (no persistence)
                    setCompletedModeItems(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(task.id)) {
                            newSet.delete(task.id);
                        } else {
                            newSet.add(task.id);
                        }
                        return newSet;
                    });
                    break;
            }
        } catch (error) {
            console.error('Failed to toggle task completion:', error);
        }
    }, [updateTask, refreshTasks, updateAppointment, toggleMedTaken]);

    const unifiedTasks = useMemo(() => {
        const results: UnifiedTask[] = [];

        // 1. General Tasks
        generalTasks.forEach(task => {
            results.push({
                id: task.id,
                source: 'general',
                title: task.title,
                description: task.description,
                dueDate: task.deadline,
                priority: task.priority || 'medium',
                isCompleted: task.progress === 100,
                rawDate: task.deadline ? new Date(task.deadline) : undefined
            });
        });

        // 2. Thesis Tasks
        thesisTasks.forEach(task => {
            results.push({
                id: task.id,
                source: 'thesis',
                title: task.title,
                description: task.notes,
                dueDate: task.end_date || null,
                priority: task.priority as any || 'medium',
                isCompleted: task.status === 'completed',
                linkedId: task.project_id,
                rawDate: task.end_date ? new Date(task.end_date) : undefined
            });
        });

        // 3. Appointments
        appointments.forEach(apt => {
            results.push({
                id: apt.id,
                source: 'appointment',
                title: apt.title,
                description: apt.notes,
                dueDate: apt.date,
                priority: 'high',
                isCompleted: apt.isCompleted,
                rawDate: new Date(`${apt.date}T${apt.time || '00:00'}`)
            });
        });

        // 4. Medications (as daily tasks)
        const todayStr = new Date().toISOString().split('T')[0];
        medications.forEach(med => {
            results.push({
                id: `med-${med.id}-${todayStr}`,
                source: 'medication',
                title: `دواء: ${med.name}`,
                description: `موعد: ${med.time}`,
                dueDate: todayStr,
                priority: 'high',
                isCompleted: !!med.takenHistory?.[todayStr],
                rawDate: new Date(`${todayStr}T${med.time}`)
            });
        });

        // 5. Active Mode Items
        if (activeMode) {
            const todayStr = new Date().toISOString().split('T')[0];
            activeMode.mode_items.forEach(item => {
                const itemId = `mode-${activeMode.id}-${item.id}`;
                results.push({
                    id: itemId,
                    source: 'mode',
                    title: item.text,
                    description: `من وضع: ${activeMode.name}`,
                    dueDate: todayStr,
                    priority: 'medium',
                    isCompleted: completedModeItems.has(itemId),
                    rawDate: item.time ? new Date(`${todayStr}T${item.time}`) : new Date(`${todayStr}T00:00`)
                });
            });
        }

        // FILTERING: Remove completed tasks from previous days
        // We keep: 
        // 1. All incomplete tasks (regardless of date)
        // 2. Completed tasks that are from TODAY or FUTURE
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const filteredResults = results.filter(task => {
            if (!task.isCompleted) return true; // Keep all pending

            if (task.rawDate) {
                const taskDate = new Date(task.rawDate);
                taskDate.setHours(0, 0, 0, 0);
                // Keep if task date is today or future
                return taskDate.getTime() >= todayStart.getTime();
            }

            // If no date, keep it
            return true;
        });

        // Combined Sorting: Incomplete first, then by priority, then by date
        return filteredResults.sort((a, b) => {
            if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;

            const priorityWeight = { high: 3, medium: 2, low: 1 };
            if (a.priority !== b.priority) {
                return priorityWeight[b.priority] - priorityWeight[a.priority];
            }

            if (!a.rawDate) return 1;
            if (!b.rawDate) return -1;
            return a.rawDate.getTime() - b.rawDate.getTime();
        });
    }, [generalTasks, thesisTasks, appointments, medications, activeMode, completedModeItems]);

    return {
        unifiedTasks,
        loading,
        toggleComplete,
        refreshAll: () => {
            refreshTasks();
        }
    };
};
