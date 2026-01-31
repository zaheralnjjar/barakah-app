
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
export const reverseGeocodeLimit = async (lat: number, lng: number): Promise<{ name: string, details: string }> => {
    try {
        // Fetch detailed address in local language (to get 'Avenida' etc) and Arabic
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
        const data = await response.json();

        if (data.address) {
            let road = data.address.road || '';
            const houseNumber = data.address.house_number || '';
            const suburb = data.address.suburb || data.address.neighbourhood || '';
            const city = data.address.city || data.address.town || data.address.state || '';

            // Clean common prefixes (Case insensitive)
            const prefixesToRemove = ['Avenida', 'Av.', 'Av', 'Calle', 'Routa', 'Camino', 'Boulevard', 'Bv.'];
            const roadLower = road.toLowerCase();

            for (const prefix of prefixesToRemove) {
                if (roadLower.startsWith(prefix.toLowerCase())) {
                    road = road.substring(prefix.length).trim();
                    break;
                }
            }

            // Primary Name: Street + Number (e.g., "Cordoba 1234")
            let name = `${road} ${houseNumber}`.trim();
            if (!name) name = suburb;
            if (!name) name = city;
            if (!name) name = data.display_name?.split(',')[0] || 'موقع محدد';

            // Details: City, Suburb (Context)
            let details = [suburb, city].filter(Boolean).join('، ');

            return { name, details };
        }
        return { name: 'موقع محدد', details: '' };
    } catch (error) {
        console.error("Geocoding error:", error);
        return { name: 'موقع غير معروف', details: '' };
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
