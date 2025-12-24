import React, { createContext, useContext, ReactNode } from 'react';
import { useTasks, MainTask } from '@/hooks/useTasks';
import { useAppointments, Appointment } from '@/hooks/useAppointments';
import { useHabits, Habit } from '@/hooks/useHabits';
import { useMedications, Medication } from '@/hooks/useMedications';

interface AppDataContextType {
    // Tasks
    tasks: MainTask[];
    addTask: (task: Omit<MainTask, 'id' | 'user_id' | 'subtasks'> & { subtasks?: any[] }) => Promise<void>;
    updateTask: (taskId: string, updates: Partial<MainTask>) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    refreshTasks: () => void;

    // Appointments
    appointments: Appointment[];
    addAppointment: (apt: Omit<Appointment, 'id' | 'user_id'>) => Promise<void>;
    updateAppointment: (aptId: string, updates: Partial<Appointment>) => Promise<void>;
    deleteAppointment: (aptId: string) => Promise<void>;
    refreshAppointments: () => void;

    // Habits
    habits: Habit[];
    addHabit: (name: string, frequency?: 'daily' | 'weekly' | 'monthly' | 'specific_days', customDays?: string[], timesPerDay?: number) => void;
    updateHabit: (id: string, updates: Partial<Pick<Habit, 'name' | 'frequency' | 'customDays' | 'timesPerDay'>>) => void;
    deleteHabit: (habitId: string) => void;
    toggleHabit: (habitId: string) => void;

    // Medications
    medications: Medication[];
    addMedication: (med: Omit<Medication, 'id'>) => void;
    updateMedication: (medId: string, updates: Partial<Medication>) => void;
    deleteMedication: (medId: string) => void;
    toggleMedTaken: (medId: string, date?: string) => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const {
        tasks,
        addTask,
        updateTask,
        deleteTask,
        refreshTasks
    } = useTasks();

    const {
        appointments,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        refreshAppointments
    } = useAppointments();

    const {
        habits,
        addHabit,
        updateHabit,
        deleteHabit,
        toggleHabit
    } = useHabits();

    const {
        medications,
        addMedication,
        updateMedication,
        deleteMedication,
        toggleMedTaken
    } = useMedications();

    const value: AppDataContextType = {
        // Tasks
        tasks,
        addTask,
        updateTask,
        deleteTask,
        refreshTasks,

        // Appointments
        appointments,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        refreshAppointments,

        // Habits
        habits,
        addHabit,
        updateHabit,
        deleteHabit,
        toggleHabit,

        // Medications
        medications,
        addMedication,
        updateMedication,
        deleteMedication,
        toggleMedTaken,
    };

    return (
        <AppDataContext.Provider value={value}>
            {children}
        </AppDataContext.Provider>
    );
};

export const useAppData = (): AppDataContextType => {
    const context = useContext(AppDataContext);
    if (context === undefined) {
        throw new Error('useAppData must be used within an AppDataProvider');
    }
    return context;
};

export default AppDataContext;
