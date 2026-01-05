
export interface GeocodingResult {
    lat: number;
    lon: number;
    display_name: string;
}

export const searchLocation = async (query: string): Promise<GeocodingResult | null> => {
    if (!query || query.length < 3) return null;

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=1&accept-language=ar`
        );
        const data = await response.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon),
                display_name: data[0].display_name
            };
        }
        return null;
    } catch (error) {
        console.error("Geocoding error", error);
        return null;
    }
};

export const reverseSearchLocation = async (lat: number, lon: number): Promise<string | null> => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=ar`
        );
        const data = await response.json();
        if (data && data.display_name) {
            return data.display_name;
        }
        return null;
    } catch (error) {
        console.error("Reverse Geocoding error", error);
        return null;
    }
};
