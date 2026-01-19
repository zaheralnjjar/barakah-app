import { Geolocation } from '@capacitor/geolocation';
import { Share } from '@capacitor/share';

/**
 * Reverse geocode coordinates to address using Nominatim (OpenStreetMap)
 * Free alternative to Google Geocoding API
 */
export async function reverseGeocode(lat: number, lng: number): Promise<{
    street: string;
    houseNumber: string;
    fullAddress: string;
} | null> {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'Barakah-App/1.0'
                }
            }
        );

        if (!response.ok) {
            throw new Error('Geocoding failed');
        }

        const data = await response.json();
        const address = data.address || {};

        const street = address.road || address.street || address.pedestrian || 'شارع غير معروف';
        const houseNumber = address.house_number || address.building || 'رقم تقريبي';
        const neighborhood = address.neighbourhood || address.suburb || '';
        const city = address.city || address.town || address.village || '';

        const fullAddress = [
            street,
            houseNumber,
            neighborhood,
            city
        ].filter(Boolean).join(', ');

        return {
            street,
            houseNumber,
            fullAddress
        };
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return null;
    }
}

/**
 * Get current location with address
 */
export async function getCurrentLocationWithAddress(): Promise<{
    lat: number;
    lng: number;
    address: string;
    street: string;
    houseNumber: string;
} | null> {
    try {
        const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000
        });

        const { latitude, longitude } = position.coords;
        const addressData = await reverseGeocode(latitude, longitude);

        if (!addressData) {
            return {
                lat: latitude,
                lng: longitude,
                address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                street: 'موقع غير معروف',
                houseNumber: ''
            };
        }

        return {
            lat: latitude,
            lng: longitude,
            address: addressData.fullAddress,
            street: addressData.street,
            houseNumber: addressData.houseNumber
        };
    } catch (error) {
        console.error('Get location error:', error);
        return null;
    }
}

/**
 * Share location using native share dialog
 */
export async function shareLocation(address: string, lat: number, lng: number): Promise<boolean> {
    try {
        const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        const text = `📍 ${address}\n\n${googleMapsUrl}`;

        await Share.share({
            title: 'مشاركة الموقع',
            text: text,
            url: googleMapsUrl,
            dialogTitle: 'مشاركة الموقع عبر'
        });

        return true;
    } catch (error) {
        console.error('Share error:', error);
        return false;
    }
}

/**
 * Open location in Google Maps for navigation
 */
export function navigateToLocation(address: string, lat?: number, lng?: number): void {
    let url: string;

    if (lat && lng) {
        // Use coordinates if available
        url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    } else {
        // Use address search
        const encodedAddress = encodeURIComponent(address);
        url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    }

    window.open(url, '_blank');
}

/**
 * Format location name from address
 */
export function formatLocationName(street: string, houseNumber: string): string {
    if (houseNumber && houseNumber !== 'رقم تقريبي') {
        return `${street}، ${houseNumber}`;
    }
    return street;
}
