import { useState, useCallback, useEffect } from 'react';

interface PrayerTime {
    name: string;
    nameAr: string;
    time: string;
    timestamp: Date;
}

interface PrayerTimesData {
    fajr: string;
    sunrise: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    date: string;
}

type PrayerSource = 'api' | 'manual' | 'file';

interface UsePrayerTimesReturn {
    prayerTimes: PrayerTime[];
    nextPrayer: PrayerTime | null;
    timeUntilNext: string;
    isLoading: boolean;
    error: string | null;
    source: PrayerSource;
    refetch: () => void;
    setManualTimes: (times: Partial<PrayerTimesData>) => void;
    parseUploadedFile: (file: File) => Promise<void>;
}

// Buenos Aires coordinates
const DEFAULT_COORDS = { latitude: -34.6037, longitude: -58.3816 };

// Storage key for local prayer times
const STORAGE_KEY = 'baraka_prayer_times';

export const usePrayerTimes = (): UsePrayerTimesReturn => {
    const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
    const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);
    const [timeUntilNext, setTimeUntilNext] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [source, setSource] = useState<PrayerSource>('api');

    // Load saved times from localStorage
    useEffect(() => {
        // First check for the full monthly schedule from PrayerManager
        const monthlySchedule = localStorage.getItem('baraka_monthly_schedule');

        if (monthlySchedule) {
            try {
                const schedule = JSON.parse(monthlySchedule);
                if (Array.isArray(schedule) && schedule.length > 0) {
                    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

                    // Find today's schedule
                    // We need to handle potential date format differences. 
                    // PrayerManager saves as YYYY-MM-DD
                    const todaySchedule = schedule.find((day: any) => day.date === todayStr);

                    if (todaySchedule) {
                        const times: PrayerTimesData = {
                            fajr: todaySchedule.fajr,
                            sunrise: todaySchedule.sunrise,
                            dhuhr: todaySchedule.dhuhr,
                            asr: todaySchedule.asr,
                            maghrib: todaySchedule.maghrib,
                            isha: todaySchedule.isha,
                            date: todayStr
                        };

                        const prayers = convertToPrayerTimes(times);
                        setPrayerTimes(prayers);
                        setSource('file'); // Treat as 'file' or 'manual' source since it's from the manager
                        updateNextPrayer(prayers);
                        setIsLoading(false);
                        return;
                    }
                }
            } catch (e) {
                console.error("Failed to parse monthly schedule in usePrayerTimes", e);
            }
        }

        // Fallback to legacy single-day storage
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.times && parsed.source) {
                    const prayers = convertToPrayerTimes(parsed.times);
                    setPrayerTimes(prayers);
                    setSource(parsed.source);
                    updateNextPrayer(prayers);
                    setIsLoading(false);
                    return;
                }
            } catch (e) {
                console.error('Error loading saved prayer times:', e);
            }
        }
        fetchPrayerTimes();
    }, []);

    const convertToPrayerTimes = (times: Partial<PrayerTimesData>): PrayerTime[] => {
        const prayers: PrayerTime[] = [];

        if (times.fajr) prayers.push({ name: 'fajr', nameAr: 'الفجر', time: times.fajr, timestamp: parseTime(times.fajr) });
        if (times.sunrise) prayers.push({ name: 'sunrise', nameAr: 'الشروق', time: times.sunrise, timestamp: parseTime(times.sunrise) });
        if (times.dhuhr) prayers.push({ name: 'dhuhr', nameAr: 'الظهر', time: times.dhuhr, timestamp: parseTime(times.dhuhr) });
        if (times.asr) prayers.push({ name: 'asr', nameAr: 'العصر', time: times.asr, timestamp: parseTime(times.asr) });
        if (times.maghrib) prayers.push({ name: 'maghrib', nameAr: 'المغرب', time: times.maghrib, timestamp: parseTime(times.maghrib) });
        if (times.isha) prayers.push({ name: 'isha', nameAr: 'العشاء', time: times.isha, timestamp: parseTime(times.isha) });

        return prayers;
    };

    const fetchPrayerTimes = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Try to get user's current location
            let coords = DEFAULT_COORDS;

            // Check if we have saved location
            const savedLocation = localStorage.getItem('baraka_user_location');
            if (savedLocation) {
                try {
                    const parsed = JSON.parse(savedLocation);
                    if (parsed.latitude && parsed.longitude) {
                        coords = { latitude: parsed.latitude, longitude: parsed.longitude };
                    }
                } catch { }
            }

            // Try to get fresh location
            if (navigator.geolocation) {
                try {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            enableHighAccuracy: false,
                            timeout: 5000,
                            maximumAge: 300000 // 5 minutes cache
                        });
                    });
                    coords = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    // Save location for future use
                    localStorage.setItem('baraka_user_location', JSON.stringify({
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                        timestamp: new Date().toISOString()
                    }));
                } catch (geoError) {
                    console.log('Using saved/default location:', coords);
                }
            }

            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;
            const day = today.getDate();

            // Using Aladhan API with user's location
            const response = await fetch(
                `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${coords.latitude}&longitude=${coords.longitude}&method=3`
            );

            if (!response.ok) {
                throw new Error('فشل في جلب أوقات الصلاة');
            }

            const data = await response.json();
            const timings = data.data.timings;

            const times: PrayerTimesData = {
                fajr: timings.Fajr,
                sunrise: timings.Sunrise,
                dhuhr: timings.Dhuhr,
                asr: timings.Asr,
                maghrib: timings.Maghrib,
                isha: timings.Isha,
                date: new Date().toISOString(),
            };

            const prayers = convertToPrayerTimes(times);
            setPrayerTimes(prayers);
            setSource('api');
            updateNextPrayer(prayers);

            // Save to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ times, source: 'api', coords }));
        } catch (err: any) {
            setError(err.message);
            // Fallback to default times
            const defaultTimes: PrayerTimesData = {
                fajr: '05:30',
                sunrise: '06:45',
                dhuhr: '12:45',
                asr: '16:15',
                maghrib: '19:30',
                isha: '21:00',
                date: new Date().toISOString(),
            };
            const prayers = convertToPrayerTimes(defaultTimes);
            setPrayerTimes(prayers);
            updateNextPrayer(prayers);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const setManualTimes = useCallback((times: Partial<PrayerTimesData>) => {
        const prayers = convertToPrayerTimes(times);
        setPrayerTimes(prayers);
        setSource('manual');
        updateNextPrayer(prayers);

        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ times, source: 'manual' }));
    }, []);

    // Parse uploaded file (PDF text or image OCR result)
    const parseUploadedFile = useCallback(async (file: File) => {
        setIsLoading(true);
        setError(null);

        try {
            const text = await file.text();

            // Simple regex patterns to extract prayer times
            const timePatterns = {
                fajr: /(?:فجر|Fajr|الفجر)[:\s]*(\d{1,2}[:\.]?\d{2})/i,
                sunrise: /(?:شروق|Sunrise|الشروق)[:\s]*(\d{1,2}[:\.]?\d{2})/i,
                dhuhr: /(?:ظهر|Dhuhr|الظهر)[:\s]*(\d{1,2}[:\.]?\d{2})/i,
                asr: /(?:عصر|Asr|العصر)[:\s]*(\d{1,2}[:\.]?\d{2})/i,
                maghrib: /(?:مغرب|Maghrib|المغرب)[:\s]*(\d{1,2}[:\.]?\d{2})/i,
                isha: /(?:عشاء|Isha|العشاء)[:\s]*(\d{1,2}[:\.]?\d{2})/i,
            };

            const extractedTimes: Partial<PrayerTimesData> = {};

            for (const [prayer, pattern] of Object.entries(timePatterns)) {
                const match = text.match(pattern);
                if (match) {
                    // Normalize time format to HH:MM
                    let time = match[1].replace('.', ':');
                    if (!time.includes(':')) {
                        time = time.slice(0, 2) + ':' + time.slice(2);
                    }
                    extractedTimes[prayer as keyof PrayerTimesData] = time;
                }
            }

            if (Object.keys(extractedTimes).length === 0) {
                throw new Error('لم يتم العثور على أوقات صلاة في الملف. تأكد من أن الملف يحتوي على أوقات الصلاة بتنسيق واضح.');
            }

            const prayers = convertToPrayerTimes(extractedTimes);
            setPrayerTimes(prayers);
            setSource('file');
            updateNextPrayer(prayers);

            // Save to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ times: extractedTimes, source: 'file' }));
        } catch (err: any) {
            setError(err.message || 'خطأ في قراءة الملف');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const parseTime = (timeStr: string): Date => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    };

    const updateNextPrayer = (prayers: PrayerTime[]) => {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        // Skip sunrise for next prayer calculation
        const prayersOnly = prayers.filter(p => p.name !== 'sunrise');

        for (const prayer of prayersOnly) {
            const prayerMinutes = prayer.timestamp.getHours() * 60 + prayer.timestamp.getMinutes();
            if (prayerMinutes > currentMinutes) {
                setNextPrayer(prayer);
                return;
            }
        }

        // If all prayers have passed, next is Fajr tomorrow
        if (prayersOnly.length > 0) {
            setNextPrayer({
                ...prayersOnly[0],
                timestamp: new Date(prayersOnly[0].timestamp.getTime() + 24 * 60 * 60 * 1000),
            });
        }
    };

    const updateTimeUntilNext = useCallback(() => {
        if (!nextPrayer) return;

        const now = new Date();
        let diff = nextPrayer.timestamp.getTime() - now.getTime();

        // If negative, add 24 hours (next day)
        if (diff < 0) {
            diff += 24 * 60 * 60 * 1000;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            setTimeUntilNext(`${hours} ساعة و ${minutes} دقيقة`);
        } else {
            setTimeUntilNext(`${minutes} دقيقة`);
        }
    }, [nextPrayer]);

    useEffect(() => {
        updateTimeUntilNext();
        const interval = setInterval(updateTimeUntilNext, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [updateTimeUntilNext]);

    return {
        prayerTimes,
        nextPrayer,
        timeUntilNext,
        isLoading,
        error,
        source,
        refetch: fetchPrayerTimes,
        setManualTimes,
        parseUploadedFile,
    };
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

// Show prayer notification
export const showPrayerNotification = (prayerName: string) => {
    if (Notification.permission === 'granted') {
        new Notification(`حان وقت صلاة ${prayerName}`, {
            body: 'حي على الصلاة، حي على الفلاح',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            dir: 'rtl',
            lang: 'ar',
            tag: 'prayer-notification',
            requireInteraction: true,
        });
    }
};

// Schedule prayer notification
export const schedulePrayerNotification = (prayer: PrayerTime, minutesBefore: number = 5) => {
    const now = new Date();
    const notifyTime = new Date(prayer.timestamp.getTime() - minutesBefore * 60 * 1000);

    if (notifyTime > now) {
        const delay = notifyTime.getTime() - now.getTime();
        setTimeout(() => {
            showPrayerNotification(prayer.nameAr);
        }, delay);
    }
};
