
import { useMemo, useEffect, useState } from 'react';
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
    const { tasks: generalTasks, refreshTasks } = useTasks();
    const { appointments } = useAppStore();
    const { medications } = useMedications();
    const { modes } = useSystemModes();
    const activeMode = useMemo(() => modes.find(m => m.is_active), [modes]);

    const [thesisTasks, setThesisTasks] = useState<ThesisTask[]>([]);
    const [loading, setLoading] = useState(true);

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
                results.push({
                    id: `mode-${activeMode.id}-${item.id}`,
                    source: 'mode',
                    title: item.text,
                    description: `من وضع: ${activeMode.name}`,
                    dueDate: todayStr,
                    priority: 'medium',
                    isCompleted: false,
                    rawDate: item.time ? new Date(`${todayStr}T${item.time}`) : new Date(`${todayStr}T00:00`)
                });
            });
        }

        // Combined Sorting: Incomplete first, then by priority, then by date
        return results.sort((a, b) => {
            if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;

            const priorityWeight = { high: 3, medium: 2, low: 1 };
            if (a.priority !== b.priority) {
                return priorityWeight[b.priority] - priorityWeight[a.priority];
            }

            if (!a.rawDate) return 1;
            if (!b.rawDate) return -1;
            return a.rawDate.getTime() - b.rawDate.getTime();
        });
    }, [generalTasks, thesisTasks, appointments, medications, activeMode]);

    return {
        unifiedTasks,
        loading,
        refreshAll: () => {
            refreshTasks();
        }
    };
};
