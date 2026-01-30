
/**
 * Utility for standardizing location operations across Barakah App.
 * Enforces "Street Name + Building Number" format and consistent Google Maps links.
 */

export interface LocationInfo {
    name: string;
    details: string; // Street + Number
    url: string;
    lat: number;
    lng: number;
}

/**
 * Reverse geocode coordinates to get a standardized address.
 * Prioritizes "Road + House Number".
 */
export const reverseGeocodeLimit = async (lat: number, lng: number): Promise<string> => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`);
        const data = await response.json();

        if (data.address) {
            const road = data.address.road || '';
            const houseNumber = data.address.house_number || '';
            const suburb = data.address.suburb || data.address.neighbourhood || '';

            // Format: Street 123
            let formatted = `${road} ${houseNumber}`.trim();

            // If empty, stick to suburb/neighborhood
            if (!formatted) formatted = suburb;

            // If still empty, display name (truncated)
            if (!formatted && data.display_name) {
                formatted = data.display_name.split(',')[0];
            }

            return formatted || 'موقع محدد';
        }
        return 'موقع محدد';
    } catch (error) {
        console.error("Geocoding error:", error);
        return 'موقع غير معروف';
    }
};

/**
 * Generates a standard Google Maps URL.
 * Used for sharing and opening locations.
 */
export const generateGoogleMapsLink = (lat: number, lng: number): string => {
    return `https://www.google.com/maps?q=${lat},${lng}`;
};

/**
 * Validates and normalizes a location object before saving.
 */
export const normalizeLocation = (title: string, address: string | undefined, lat: number, lng: number) => {
    const validUrl = generateGoogleMapsLink(lat, lng);
    return {
        title: title || 'موقع جديد',
        address: address || validUrl,
        lat,
        lng,
        category: 'pinned' // Enforce category for standard locations
    };
};
