import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Unified Local Store
 * Consolidates all localStorage data into a single Zustand store
 * This store is for local-only data that doesn't sync to Supabase
 */

// Types
interface PrayerSchedule {
    date: string;
    times: Record<string, string>;
}

interface UserLocation {
    latitude: number;
    longitude: number;
    timestamp: string;
}

interface ParkingLocation {
    latitude: number;
    longitude: number;
    address?: string;
    timestamp: string;
    timerMinutes?: number;
}

interface PomodoroSettings {
    workMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    sessionsBeforeLongBreak: number;
}

interface PomodoroStats {
    totalSessions: number;
    totalMinutes: number;
    streakDays: number;
    lastSessionDate: string | null;
}

interface Routine {
    id: string;
    name: string;
    icon: string;
    color: string;
    settings: {
        visibleSections: string[];
        activeWidgets: string[];
    };
}

interface ActiveRoutine {
    routineId: string;
    startedAt: string;
}

interface SmartButton {
    id: string;
    label: string;
    icon: string;
    action: string;
}

interface LocalStoreState {
    // Prayer Data
    prayerSchedule: PrayerSchedule | null;
    prayerScheduleUpdated: string | null;
    userLocation: UserLocation | null;

    // Parking
    parkingLocation: ParkingLocation | null;

    // Pomodoro
    pomodoroSettings: PomodoroSettings;
    pomodoroStats: PomodoroStats;

    // Routines
    routines: Routine[];
    activeRoutines: ActiveRoutine[];

    // UI Preferences
    smartButtons: SmartButton[];
    dashboardOrder: string[];
    sectionOrder: string[];

    // Sync Settings
    autoSyncEnabled: boolean;
    lastSyncTime: string | null;

    // Editor Favorites
    favoriteColors: string[];
    favoriteFonts: { name: string; value: string }[];
    favoriteSizes: number[];

    // Actions
    setPrayerSchedule: (schedule: PrayerSchedule) => void;
    setUserLocation: (location: UserLocation) => void;
    setParkingLocation: (location: ParkingLocation | null) => void;
    setPomodoroSettings: (settings: Partial<PomodoroSettings>) => void;
    addPomodoroSession: (minutes: number) => void;
    setRoutines: (routines: Routine[]) => void;
    setActiveRoutines: (active: ActiveRoutine[]) => void;
    setSmartButtons: (buttons: SmartButton[]) => void;
    setDashboardOrder: (order: string[]) => void;
    setSectionOrder: (order: string[]) => void;
    setAutoSyncEnabled: (enabled: boolean) => void;
    setLastSyncTime: (time: string) => void;

    // Editor Actions
    toggleFavoriteColor: (color: string) => void;
    toggleFavoriteFont: (font: { name: string; value: string }) => void;
    toggleFavoriteSize: (size: number) => void;

    reset: () => void;
}

// Default values
const defaultPomodoroSettings: PomodoroSettings = {
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    sessionsBeforeLongBreak: 4,
};

const defaultPomodoroStats: PomodoroStats = {
    totalSessions: 0,
    totalMinutes: 0,
    streakDays: 0,
    lastSessionDate: null,
};

const defaultDashboardOrder = ['stats', 'appointments', 'shopping', 'map'];
const defaultSectionOrder = ['newmuslims'];

// Create the store
export const useLocalStore = create<LocalStoreState>()(
    persist(
        (set, get) => ({
            // Initial State
            prayerSchedule: null,
            prayerScheduleUpdated: null,
            userLocation: null,
            parkingLocation: null,
            pomodoroSettings: defaultPomodoroSettings,
            pomodoroStats: defaultPomodoroStats,
            routines: [],
            activeRoutines: [],
            smartButtons: [],
            dashboardOrder: defaultDashboardOrder,
            sectionOrder: defaultSectionOrder,
            autoSyncEnabled: false,
            lastSyncTime: null,

            // Editor Favorites Defaults
            favoriteColors: ['#43a047', '#1b5e20', '#1976d2', '#d32f2f'],
            favoriteFonts: [
                { name: 'كايرو', value: 'Cairo' },
                { name: 'أميري', value: 'Amiri' },
                { name: 'تجوّل', value: 'Tajawal' },
                { name: 'عارف رقعة', value: 'Aref Ruqaa' },
                { name: 'ريم كوفي', value: 'Reem Kufi' },
                { name: 'الإسكندرية', value: 'Alexandria' },
                { name: 'المراعي', value: 'Almarai' },
                { name: 'كوفام', value: 'Kufam' },
                { name: 'ريدكس', value: 'Readex Pro' },
                { name: 'المسيري', value: 'El Messiri' },
                { name: 'يدوي-عفوي', value: 'Playpen Sans Arabic' },
                { name: 'فني-مرح', value: 'Marhey' },
                { name: 'فني-فرشاة', value: 'Vibes' },
                { name: 'فني-يدوي', value: 'Rakkas' }
            ],
            favoriteSizes: [14, 18, 24, 32, 48],

            // Actions
            setPrayerSchedule: (schedule) => set({
                prayerSchedule: schedule,
                prayerScheduleUpdated: new Date().toISOString()
            }),

            setUserLocation: (location) => set({ userLocation: location }),

            setParkingLocation: (location) => set({ parkingLocation: location }),

            setPomodoroSettings: (settings) => set((state) => ({
                pomodoroSettings: { ...state.pomodoroSettings, ...settings }
            })),

            addPomodoroSession: (minutes) => set((state) => {
                const today = new Date().toISOString().split('T')[0];
                const lastDate = state.pomodoroStats.lastSessionDate;
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

                let newStreak = state.pomodoroStats.streakDays;
                if (lastDate === yesterday) {
                    newStreak += 1;
                } else if (lastDate !== today) {
                    newStreak = 1;
                }

                return {
                    pomodoroStats: {
                        totalSessions: state.pomodoroStats.totalSessions + 1,
                        totalMinutes: state.pomodoroStats.totalMinutes + minutes,
                        streakDays: newStreak,
                        lastSessionDate: today,
                    }
                };
            }),

            setRoutines: (routines) => set({ routines }),

            setActiveRoutines: (active) => {
                set({ activeRoutines: active });
                // Dispatch event for other components
                window.dispatchEvent(new Event('routines-updated'));
            },

            setSmartButtons: (buttons) => set({ smartButtons: buttons }),

            setDashboardOrder: (order) => set({ dashboardOrder: order }),

            setSectionOrder: (order) => set({ sectionOrder: order }),

            setAutoSyncEnabled: (enabled) => set({ autoSyncEnabled: enabled }),

            setLastSyncTime: (time) => set({ lastSyncTime: time }),

            toggleFavoriteColor: (color) => set((state) => ({
                favoriteColors: state.favoriteColors.includes(color)
                    ? state.favoriteColors.filter(c => c !== color)
                    : [...state.favoriteColors, color]
            })),

            toggleFavoriteFont: (font) => set((state) => ({
                favoriteFonts: state.favoriteFonts.find(f => f.value === font.value)
                    ? state.favoriteFonts.filter(f => f.value !== font.value)
                    : [...state.favoriteFonts, font]
            })),

            toggleFavoriteSize: (size) => set((state) => ({
                favoriteSizes: state.favoriteSizes.includes(size)
                    ? state.favoriteSizes.filter(s => s !== size)
                    : [...state.favoriteSizes, size]
            })),

            reset: () => set({
                prayerSchedule: null,
                prayerScheduleUpdated: null,
                userLocation: null,
                parkingLocation: null,
                pomodoroSettings: defaultPomodoroSettings,
                pomodoroStats: defaultPomodoroStats,
                routines: [],
                activeRoutines: [],
                smartButtons: [],
                dashboardOrder: defaultDashboardOrder,
                sectionOrder: defaultSectionOrder,
                autoSyncEnabled: false,
                lastSyncTime: null,
            }),
        }),
        {
            name: 'barakah-local-store',
            storage: createJSONStorage(() => localStorage),
        }
    )
);

// Migration helper - imports old scattered localStorage keys
export const migrateFromLegacyStorage = () => {
    const store = useLocalStore.getState();

    // Prayer Schedule
    const prayerSchedule = localStorage.getItem('baraka_prayer_schedule');
    if (prayerSchedule) {
        try {
            const parsed = JSON.parse(prayerSchedule);
            store.setPrayerSchedule(parsed);
        } catch (e) { console.error('Migration error: prayer_schedule', e); }
    }

    // User Location
    const userLocation = localStorage.getItem('baraka_user_location');
    if (userLocation) {
        try {
            store.setUserLocation(JSON.parse(userLocation));
        } catch (e) { console.error('Migration error: user_location', e); }
    }

    // Routines
    const routines = localStorage.getItem('baraka_routines');
    if (routines) {
        try {
            store.setRoutines(JSON.parse(routines));
        } catch (e) { console.error('Migration error: routines', e); }
    }

    // Active Routines
    const activeRoutines = localStorage.getItem('baraka_active_routines');
    if (activeRoutines) {
        try {
            store.setActiveRoutines(JSON.parse(activeRoutines));
        } catch (e) { console.error('Migration error: active_routines', e); }
    }

    // Smart Buttons
    const smartButtons = localStorage.getItem('baraka_smart_buttons');
    if (smartButtons) {
        try {
            store.setSmartButtons(JSON.parse(smartButtons));
        } catch (e) { console.error('Migration error: smart_buttons', e); }
    }

    // Dashboard Order
    const dashboardOrder = localStorage.getItem('baraka_dashboard_order');
    if (dashboardOrder) {
        try {
            store.setDashboardOrder(JSON.parse(dashboardOrder));
        } catch (e) { console.error('Migration error: dashboard_order', e); }
    }

    // Auto Sync
    const autoSync = localStorage.getItem('autoSyncEnabled');
    if (autoSync) {
        store.setAutoSyncEnabled(autoSync === 'true');
    }

    // Last Sync
    const lastSync = localStorage.getItem('lastSync');
    if (lastSync) {
        store.setLastSyncTime(lastSync);
    }

    console.log('✅ Migration from legacy localStorage complete');
};
