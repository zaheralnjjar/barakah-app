import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Types
export interface Location {
    id: string;
    title: string;
    url: string; // geo:lat,lng
    category: 'other' | 'home' | 'work' | 'mosque';
    createdAt: string;
    updatedAt: string;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    deadline: string;
    completed: boolean;
    priority: 'low' | 'medium' | 'high';
    type: 'task' | 'project';
    subtasks: SubTask[];
    progress: number;
    createdAt: string;
    updatedAt: string;
}

export interface SubTask {
    id: string;
    title: string;
    completed: boolean;
}

export interface Appointment {
    id: string;
    title: string;
    date: string;
    time: string;
    reminderMinutes: number;
    isCompleted: boolean;
    location?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface FinanceData {
    balance: number;
    currency: 'ARS' | 'USD';
    exchangeRate: number;
    monthlyBudget: number;
    expenses: Expense[];
    income: Income[];
}

export interface Expense {
    id: string;
    amount: number;
    description: string;
    category: string;
    date: string;
    currency: 'ARS' | 'USD';
}

export interface Income {
    id: string;
    amount: number;
    description: string;
    date: string;
    currency: 'ARS' | 'USD';
}

// Store State Interface
interface AppStore {
    // Data
    locations: Location[];
    tasks: Task[];
    appointments: Appointment[];
    finances: FinanceData;

    // Last sync timestamp
    lastSync: string | null;

    // Quick actions
    quickActions: string[];

    // Financial categories
    expenseCategories: string[];
    incomeCategories: string[];

    // Actions - Locations
    addLocation: (location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateLocation: (id: string, updates: Partial<Location>) => void;
    deleteLocation: (id: string) => void;
    setLocations: (locations: Location[]) => void;

    // Actions - Tasks
    addTask: (task: Omit<Task, 'id' | 'progress' | 'createdAt' | 'updatedAt'>) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    deleteTask: (id: string) => void;
    addSubtask: (taskId: string, subtask: Omit<SubTask, 'id'>) => void;
    toggleSubtask: (taskId: string, subtaskId: string) => void;
    deleteSubtask: (taskId: string, subtaskId: string) => void;
    setTasks: (tasks: Task[]) => void;

    // Actions - Appointments
    addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateAppointment: (id: string, updates: Partial<Appointment>) => void;
    deleteAppointment: (id: string) => void;
    setAppointments: (appointments: Appointment[]) => void;

    // Actions - Finance
    updateFinances: (updates: Partial<FinanceData>) => void;
    addExpense: (expense: Omit<Expense, 'id'>) => void;
    addIncome: (income: Omit<Income, 'id'>) => void;
    deleteExpense: (id: string) => void;
    deleteIncome: (id: string) => void;
    setFinances: (finances: FinanceData) => void;

    // Sync Actions
    markSynced: () => void;

    // Quick Actions
    setQuickActions: (actions: string[]) => void;

    // Categories
    addExpenseCategory: (category: string) => void;
    deleteExpenseCategory: (category: string) => void;
    addIncomeCategory: (category: string) => void;
    deleteIncomeCategory: (category: string) => void;

    // Reset (for testing)
    reset: () => void;
}

const initialFinances: FinanceData = {
    balance: 0,
    currency: 'ARS',
    exchangeRate: 1000,
    monthlyBudget: 0,
    expenses: [],
    income: [],
};

// Helper: Calculate task progress
const calculateProgress = (subtasks: SubTask[]): number => {
    if (subtasks.length === 0) return 0;
    const completed = subtasks.filter(st => st.completed).length;
    return Math.round((completed / subtasks.length) * 100);
};

// Create Store
export const useAppStore = create<AppStore>()(
    persist(
        (set, get) => ({
            // Initial State
            locations: [],
            tasks: [],
            appointments: [],
            finances: initialFinances,
            lastSync: null,
            quickActions: ['expense', 'appointment', 'shopping', 'task'],
            expenseCategories: ['طعام', 'نقل', 'فواتير', 'ترفيه', 'صحة', 'تعليم', 'أخرى'],
            incomeCategories: ['راتب', 'مشروع', 'استثمار', 'هدية', ' أخرى'],

            // Location Actions
            addLocation: (locationData) => set((state) => {
                const newLocation: Location = {
                    ...locationData,
                    id: Date.now().toString(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                return { locations: [...state.locations, newLocation] };
            }),

            updateLocation: (id, updates) => set((state) => ({
                locations: state.locations.map(loc =>
                    loc.id === id ? { ...loc, ...updates, updatedAt: new Date().toISOString() } : loc
                ),
            })),

            deleteLocation: (id) => set((state) => ({
                locations: state.locations.filter(loc => loc.id !== id),
            })),

            setLocations: (locations) => set({ locations }),

            // Task Actions
            addTask: (taskData) => set((state) => {
                const newTask: Task = {
                    ...taskData,
                    id: Date.now().toString(),
                    progress: calculateProgress(taskData.subtasks || []),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    subtasks: taskData.subtasks || [],
                };
                return { tasks: [...state.tasks, newTask] };
            }),

            updateTask: (id, updates) => set((state) => ({
                tasks: state.tasks.map(task => {
                    if (task.id === id) {
                        const updated = { ...task, ...updates, updatedAt: new Date().toISOString() };
                        if (updates.subtasks) {
                            updated.progress = calculateProgress(updates.subtasks);
                        }
                        return updated;
                    }
                    return task;
                }),
            })),

            deleteTask: (id) => set((state) => ({
                tasks: state.tasks.filter(task => task.id !== id),
            })),

            addSubtask: (taskId, subtaskData) => set((state) => ({
                tasks: state.tasks.map(task => {
                    if (task.id === taskId) {
                        const newSubtask: SubTask = {
                            ...subtaskData,
                            id: Date.now().toString(),
                        };
                        const updatedSubtasks = [...task.subtasks, newSubtask];
                        return {
                            ...task,
                            subtasks: updatedSubtasks,
                            progress: calculateProgress(updatedSubtasks),
                            updatedAt: new Date().toISOString(),
                        };
                    }
                    return task;
                }),
            })),

            toggleSubtask: (taskId, subtaskId) => set((state) => ({
                tasks: state.tasks.map(task => {
                    if (task.id === taskId) {
                        const updatedSubtasks = task.subtasks.map(st =>
                            st.id === subtaskId ? { ...st, completed: !st.completed } : st
                        );
                        return {
                            ...task,
                            subtasks: updatedSubtasks,
                            progress: calculateProgress(updatedSubtasks),
                            updatedAt: new Date().toISOString(),
                        };
                    }
                    return task;
                }),
            })),

            deleteSubtask: (taskId, subtaskId) => set((state) => ({
                tasks: state.tasks.map(task => {
                    if (task.id === taskId) {
                        const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
                        return {
                            ...task,
                            subtasks: updatedSubtasks,
                            progress: calculateProgress(updatedSubtasks),
                            updatedAt: new Date().toISOString(),
                        };
                    }
                    return task;
                }),
            })),

            setTasks: (tasks) => set({ tasks }),

            // Appointment Actions
            addAppointment: (appointmentData) => set((state) => {
                const newAppointment: Appointment = {
                    ...appointmentData,
                    id: Date.now().toString(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                return { appointments: [...state.appointments, newAppointment] };
            }),

            updateAppointment: (id, updates) => set((state) => ({
                appointments: state.appointments.map(apt =>
                    apt.id === id ? { ...apt, ...updates, updatedAt: new Date().toISOString() } : apt
                ),
            })),

            deleteAppointment: (id) => set((state) => ({
                appointments: state.appointments.filter(apt => apt.id !== id),
            })),

            setAppointments: (appointments) => set({ appointments }),

            // Finance Actions
            updateFinances: (updates) => set((state) => ({
                finances: { ...state.finances, ...updates },
            })),

            addExpense: (expenseData) => set((state) => {
                const newExpense: Expense = {
                    ...expenseData,
                    id: Date.now().toString(),
                };
                const newBalance = state.finances.balance - expenseData.amount;
                return {
                    finances: {
                        ...state.finances,
                        expenses: [...state.finances.expenses, newExpense],
                        balance: newBalance,
                    },
                };
            }),

            addIncome: (incomeData) => set((state) => {
                const newIncome: Income = {
                    ...incomeData,
                    id: Date.now().toString(),
                };
                const newBalance = state.finances.balance + incomeData.amount;
                return {
                    finances: {
                        ...state.finances,
                        income: [...state.finances.income, newIncome],
                        balance: newBalance,
                    },
                };
            }),

            deleteExpense: (id) => set((state) => {
                const expense = state.finances.expenses.find(e => e.id === id);
                const newBalance = expense ? state.finances.balance + expense.amount : state.finances.balance;
                return {
                    finances: {
                        ...state.finances,
                        expenses: state.finances.expenses.filter(e => e.id !== id),
                        balance: newBalance,
                    },
                };
            }),

            deleteIncome: (id) => set((state) => {
                const income = state.finances.income.find(i => i.id === id);
                const newBalance = income ? state.finances.balance - income.amount : state.finances.balance;
                return {
                    finances: {
                        ...state.finances,
                        income: state.finances.income.filter(i => i.id !== id),
                        balance: newBalance,
                    },
                };
            }),

            setFinances: (finances) => set({ finances }),

            // Sync
            markSynced: () => set({ lastSync: new Date().toISOString() }),

            // Quick Actions
            setQuickActions: (actions) => set({ quickActions: actions }),

            // Categories
            addExpenseCategory: (category) => set((state) => ({
                expenseCategories: [...state.expenseCategories, category],
            })),
            deleteExpenseCategory: (category) => set((state) => ({
                expenseCategories: state.expenseCategories.filter((c) => c !== category),
            })),
            addIncomeCategory: (category) => set((state) => ({
                incomeCategories: [...state.incomeCategories, category],
            })),
            deleteIncomeCategory: (category) => set((state) => ({
                incomeCategories: state.incomeCategories.filter((c) => c !== category),
            })),

            // Reset
            reset: () => set({
                locations: [],
                tasks: [],
                appointments: [],
                finances: initialFinances,
                lastSync: null,
                quickActions: ['expense', 'appointment', 'shopping'],
                expenseCategories: ['طعام', 'نقل', 'فواتير', 'ترفيه', 'صحة', 'تعليم', 'أخرى'],
                incomeCategories: ['راتب', 'مشروع', 'استثمار', 'هدية', 'أخرى'],
            }),
        }),
        {
            name: 'baraka-app-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);

// Selectors (for performance)
export const selectLocations = (state: AppStore) => state.locations;
export const selectTasks = (state: AppStore) => state.tasks;
export const selectAppointments = (state: AppStore) => state.appointments;
export const selectFinances = (state: AppStore) => state.finances;
export const selectActiveTasks = (state: AppStore) =>
    state.tasks.filter(t => !t.completed);
export const selectCompletedTasks = (state: AppStore) =>
    state.tasks.filter(t => t.completed);
