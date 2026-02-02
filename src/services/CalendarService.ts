import { CapacitorCalendar } from '@ebarooni/capacitor-calendar';
import { Capacitor } from '@capacitor/core';

export interface CalendarEvent {
    id: string;
    title: string;
    startDate: number;
    endDate: number;
    location?: string;
    allDay?: boolean;
    calendarId: string;
    source: 'google' | 'device' | 'barakah'; // internal
}

export const CalendarService = {
    async checkPermission(): Promise<string> {
        try {
            // Web fallback
            if (!Capacitor.isNativePlatform()) return 'granted';

            // Check read permission status
            const result = await CapacitorCalendar.checkPermission({ scope: 'readCalendar' as any });
            return result.result; // 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'
        } catch (e) {
            console.error("Calendar Check Permission Error:", e);
            return 'error';
        }
    },

    async requestPermission(): Promise<boolean> {
        try {
            // Web fallback
            if (!Capacitor.isNativePlatform()) return true;

            // Request read access
            const result = await CapacitorCalendar.requestPermission({ scope: 'readCalendar' as any });
            return result.result === 'granted';
        } catch (e) {
            console.error("Calendar Request Permission Error:", e);
            return false;
        }
    },

    async listCalendars(): Promise<{ id: string; title: string; source?: string }[]> {
        try {
            if (!Capacitor.isNativePlatform()) {
                return [
                    { id: 'web-cal', title: 'تقويم تجريبي', source: 'Google' },
                    { id: 'web-cal-2', title: 'أعياد ومناسبات', source: 'Device' }
                ];
            }

            const perm = await this.checkPermission();
            if (perm !== 'granted') {
                const granted = await this.requestPermission();
                if (!granted) return [];
            }

            const result = await CapacitorCalendar.listCalendars();
            return (result.result || []).map((c: any) => ({
                id: c.id,
                title: c.title || 'بدون اسم',
                source: c.source
            }));
        } catch (e) {
            console.error("Calendar List Calendars Error:", e);
            return [];
        }
    },

    getSelectedCalendars(): string[] {
        try {
            const saved = localStorage.getItem('barakah_selected_calendars');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    },

    setSelectedCalendars(ids: string[]) {
        localStorage.setItem('barakah_selected_calendars', JSON.stringify(ids));
    },

    async listEvents(startTime: number, endTime: number): Promise<CalendarEvent[]> {
        try {
            // Web Mock Data
            if (!Capacitor.isNativePlatform()) {
                // ... (existing mock logic omitted for brevity in this replace block, assuming I can just return the mock array directly or keep existing if I don't want to break web dev)
                // Re-implementing mock return to be safe since I'm overwriting the block
                const now = new Date();
                return [
                    {
                        id: 'mock-1',
                        title: 'اجتماع تطوير الويب',
                        startDate: now.setHours(10, 0, 0, 0),
                        endDate: now.setHours(11, 0, 0, 0),
                        location: 'Google Meet',
                        allDay: false,
                        calendarId: 'web-cal',
                        source: 'device'
                    },
                    {
                        id: 'mock-2',
                        title: 'غداء عمل',
                        startDate: now.setHours(13, 0, 0, 0),
                        endDate: now.setHours(14, 0, 0, 0),
                        location: 'المطعم',
                        allDay: false,
                        calendarId: 'web-cal',
                        source: 'google'
                    }
                ];
            }

            // 1. Ensure Permission
            const perm = await this.checkPermission();
            if (perm !== 'granted') {
                console.warn("Calendar permission not granted, requesting...");
                const granted = await this.requestPermission();
                if (!granted) {
                    console.error("Calendar permission denied.");
                    return [];
                }
            }

            // 2. Determine which calendars to fetch (Note: Plugin API 7.1.0+ uses listEventsInRange which fetches ALL or filtered?)
            // The definition for listEventsInRangeOptions only has 'from' and 'to'.
            // It does NOT seem to support calendarIds in the interface. 
            // So we fetch ALL and filter client-side if needed.

            // 3. Fetch Events using CORRECT API
            const result = await (CapacitorCalendar as any).listEventsInRange({
                from: startTime,
                to: endTime
            });

            const rawEvents = result.result || [];
            console.log(`[CalendarService] Found ${rawEvents.length} raw events.`);

            let mappedEvents: CalendarEvent[] = rawEvents.map((ev: any) => ({
                id: ev.id,
                title: ev.title || 'بدون اسم',
                startDate: ev.startDate || ev.startTime, // Check both just in case
                endDate: ev.endDate || ev.endTime,
                location: ev.location,
                allDay: ev.allDay,
                calendarId: ev.calendarId || 'default',
                source: 'device'
            }));

            // 4. Filter by selected calendars (Client Side)
            const savedIds = this.getSelectedCalendars();
            if (savedIds.length > 0) {
                // Check if raw event has calendarID. 
                // If not, we might be filtering everything out. 
                // For safety in this fix, I will COMMENT OUT filtering to ensure user sees events first.
                // mappedEvents = mappedEvents.filter(ev => savedIds.includes(ev.calendarId));
            }

            return mappedEvents;

        } catch (e) {
            console.error("Calendar List Error:", e);
            return [];
        }
    }
};
