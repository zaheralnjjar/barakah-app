import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';

// Types
interface LocationData {
    latitude: number;
    longitude: number;
    address?: string;
    street?: string;
    buildingNumber?: string;
    timestamp: string;
}

interface DollarRates {
    official: number;
    blue: number;
    timestamp: string;
}

interface PrayerTime {
    name: string;
    time: string;
}

// Get WhatsApp number from settings
export const getWhatsAppNumber = (): string | null => {
    return localStorage.getItem('baraka_whatsapp_number');
};

// Set WhatsApp number in settings
export const setWhatsAppNumber = (number: string): void => {
    localStorage.setItem('baraka_whatsapp_number', number);
};

// Send WhatsApp message
export const sendWhatsAppMessage = (message: string): boolean => {
    const number = getWhatsAppNumber();
    if (!number) {
        console.error('No WhatsApp number configured');
        return false;
    }

    // Clean number (remove spaces, dashes, etc.)
    const cleanNumber = number.replace(/[\s\-\(\)]/g, '');

    // Open WhatsApp with pre-filled message
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');

    return true;
};

// Reverse geocode location
const reverseGeocode = async (lat: number, lon: number): Promise<{ street: string; buildingNumber: string }> => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&accept-language=ar,es`
        );
        const data = await response.json();

        const address = data.address || {};
        return {
            street: address.road || address.street || address.suburb || address.neighbourhood || 'غير معروف',
            buildingNumber: address.house_number || ''
        };
    } catch (error) {
        console.error('Geocoding error:', error);
        return { street: 'غير معروف', buildingNumber: '' };
    }
};

// Get current prayer times from localStorage (saved by PrayerManager)
const getPrayerTimes = (): PrayerTime[] => {
    try {
        // Try different possible localStorage keys
        const keys = ['prayer_times_today', 'baraka_prayer_times', 'prayerTimes'];

        for (const key of keys) {
            const saved = localStorage.getItem(key);
            if (saved) {
                const parsed = JSON.parse(saved);

                // Handle different data formats
                if (parsed.fajr || parsed.Fajr) {
                    return [
                        { name: 'الفجر', time: parsed.fajr || parsed.Fajr || '--:--' },
                        { name: 'الظهر', time: parsed.dhuhr || parsed.Dhuhr || '--:--' },
                        { name: 'العصر', time: parsed.asr || parsed.Asr || '--:--' },
                        { name: 'المغرب', time: parsed.maghrib || parsed.Maghrib || '--:--' },
                        { name: 'العشاء', time: parsed.isha || parsed.Isha || '--:--' }
                    ];
                }

                // If it's an array format
                if (Array.isArray(parsed) && parsed.length >= 5) {
                    return [
                        { name: 'الفجر', time: parsed[0]?.time || parsed[0] || '--:--' },
                        { name: 'الظهر', time: parsed[2]?.time || parsed[2] || '--:--' },
                        { name: 'العصر', time: parsed[3]?.time || parsed[3] || '--:--' },
                        { name: 'المغرب', time: parsed[4]?.time || parsed[4] || '--:--' },
                        { name: 'العشاء', time: parsed[5]?.time || parsed[5] || '--:--' }
                    ];
                }
            }
        }

        // Try to get from baraka_cached_prayer_times
        const cached = localStorage.getItem('baraka_cached_prayer_times');
        if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.timings) {
                const t = parsed.timings;
                return [
                    { name: 'الفجر', time: t.Fajr?.split(' ')[0] || '--:--' },
                    { name: 'الظهر', time: t.Dhuhr?.split(' ')[0] || '--:--' },
                    { name: 'العصر', time: t.Asr?.split(' ')[0] || '--:--' },
                    { name: 'المغرب', time: t.Maghrib?.split(' ')[0] || '--:--' },
                    { name: 'العشاء', time: t.Isha?.split(' ')[0] || '--:--' }
                ];
            }
        }
    } catch (e) {
        console.error('Error parsing prayer times:', e);
    }

    // Default times based on Argentina timezone if not available
    return [
        { name: 'الفجر', time: '05:45' },
        { name: 'الظهر', time: '12:30' },
        { name: 'العصر', time: '16:00' },
        { name: 'المغرب', time: '19:15' },
        { name: 'العشاء', time: '20:30' }
    ];
};

// Fetch Argentine Dollar rates (Official + Blue)
const fetchArgentineDollarRates = async (): Promise<DollarRates> => {
    try {
        // Try DolarApi.com (Argentine dollar rates API)
        const response = await fetch('https://dolarapi.com/v1/dolares');
        if (response.ok) {
            const data = await response.json();

            // Find official (Banco Nación) and blue rates
            const oficial = data.find((d: any) => d.casa === 'oficial');
            const blue = data.find((d: any) => d.casa === 'blue');

            if (oficial && blue) {
                return {
                    official: oficial.venta || oficial.compra || 0,
                    blue: blue.venta || blue.compra || 0,
                    timestamp: new Date().toISOString()
                };
            }
        }
    } catch (error) {
        console.error('Error fetching dollar rates:', error);
    }

    // Fallback: try another API
    try {
        const blueResponse = await fetch('https://api.bluelytics.com.ar/v2/latest');
        if (blueResponse.ok) {
            const blueData = await blueResponse.json();
            return {
                official: blueData.oficial?.value_sell || 850,
                blue: blueData.blue?.value_sell || 1050,
                timestamp: new Date().toISOString()
            };
        }
    } catch (error) {
        console.error('Error fetching from bluelytics:', error);
    }

    // Default rates if API fails (approximate)
    return {
        official: 850,
        blue: 1100,
        timestamp: new Date().toISOString()
    };
};

// Handle shortcuts
export const handleShortcut = async (shortcutType: string): Promise<void> => {
    const whatsappNumber = getWhatsAppNumber();

    if (!whatsappNumber) {
        // Show notification to configure WhatsApp number
        await LocalNotifications.schedule({
            notifications: [{
                id: 1001,
                title: 'إعداد رقم WhatsApp',
                body: 'يرجى إدخال رقم WhatsApp في الإعدادات أولاً',
                schedule: { at: new Date(Date.now() + 100) }
            }]
        });
        return;
    }

    switch (shortcutType) {
        case 'save-location':
            await handleSaveLocation();
            break;
        case 'dollar-rate':
            await handleDollarRate();
            break;
        case 'prayer-times':
            await handlePrayerTimes();
            break;
        case 'saved-locations':
            window.dispatchEvent(new Event('open-saved-locations'));
            break;
        default:
            console.log('Unknown shortcut:', shortcutType);
    }
};

// Handle Save Location shortcut
const handleSaveLocation = async (): Promise<void> => {
    try {
        // Get current position
        const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true
        });

        const { latitude, longitude } = position.coords;

        // Reverse geocode
        const { street, buildingNumber } = await reverseGeocode(latitude, longitude);

        // Save location
        const location: LocationData = {
            latitude,
            longitude,
            street,
            buildingNumber,
            timestamp: new Date().toISOString()
        };

        // Save to locations array
        const savedLocations = JSON.parse(localStorage.getItem('baraka_saved_locations') || '[]');
        savedLocations.push(location);
        localStorage.setItem('baraka_saved_locations', JSON.stringify(savedLocations));

        // Build address text
        const addressText = buildingNumber ? `${street} رقم ${buildingNumber}` : street;

        // Build Google Maps navigation link
        const mapsLink = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

        // Build message (NO coordinates, just street + link)
        const message = `📍 موقعي الحالي:\n\n🛣️ ${addressText}\n\n🧭 اضغط للملاحة:\n${mapsLink}`;

        // Send WhatsApp
        sendWhatsAppMessage(message);

        // Show notification
        await LocalNotifications.schedule({
            notifications: [{
                id: 1002,
                title: '📍 تم حفظ الموقع',
                body: addressText,
                schedule: { at: new Date(Date.now() + 100) }
            }]
        });

    } catch (error) {
        console.error('Error saving location:', error);
        await LocalNotifications.schedule({
            notifications: [{
                id: 1003,
                title: '❌ خطأ',
                body: 'فشل في الحصول على الموقع',
                schedule: { at: new Date(Date.now() + 100) }
            }]
        });
    }
};

// Handle Dollar Rate shortcut (Argentine Peso)
const handleDollarRate = async (): Promise<void> => {
    try {
        const rates = await fetchArgentineDollarRates();

        const message = `💵 سعر الدولار - البيسو الأرجنتيني:\n\n🏛️ السعر الرسمي (Banco Nación): ${rates.official.toLocaleString('es-AR')} بيسو\n💹 الدولار البلو: ${rates.blue.toLocaleString('es-AR')} بيسو\n\n🕐 التحديث: ${new Date().toLocaleTimeString('ar')}`;

        sendWhatsAppMessage(message);

    } catch (error) {
        console.error('Error fetching dollar rates:', error);
    }
};

// Handle Prayer Times shortcut
const handlePrayerTimes = async (): Promise<void> => {
    const prayerTimes = getPrayerTimes();
    const today = new Date().toLocaleDateString('ar', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    let message = `🕌 مواقيت الصلاة\n📅 ${today}\n\n`;

    prayerTimes.forEach(prayer => {
        message += `${prayer.name}: ${prayer.time}\n`;
    });

    sendWhatsAppMessage(message);
};

// Parse deep link and handle shortcut
export const parseDeepLink = (url: string): string | null => {
    try {
        // URL format: barakah://shortcut-type
        if (url.startsWith('barakah://')) {
            return url.replace('barakah://', '');
        }
        return null;
    } catch (e) {
        return null;
    }
};
