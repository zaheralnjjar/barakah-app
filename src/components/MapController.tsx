import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapControllerProps {
    center: [number, number];
    zoom: number;
    onMapClick?: (latlng: { lat: number; lng: number }) => void;
    onMapReady?: (map: L.Map) => void;
}

const MapController = ({ center, zoom, onMapClick, onMapReady }: MapControllerProps) => {
    const map = useMap();

    // 1. Handle Center/Zoom Updates
    useEffect(() => {
        if (!map) return;

        // Use flyTo for smooth animation, but instant if difference is huge
        map.setView(center, zoom);

        // Invalidate size to ensure correct rendering (especially in tabs/dialogs)
        const timer = setTimeout(() => {
            if (map && map.getContainer()) {
                map.invalidateSize();
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [map, center, zoom]);

    // 2. Handle Click Events explicitly
    useEffect(() => {
        if (!map || !onMapClick) return;

        const handleClick = (e: L.LeafletMouseEvent) => {
            onMapClick(e.latlng);
        };

        map.on('click', handleClick);

        // Strict cleanup with safety check
        return () => {
            try {
                // Check if map still has events system intact
                // @ts-ignore
                if (map && map._leaflet_events) {
                    map.off('click', handleClick);
                }
            } catch (e) {
                // Ignore cleanup errors if map is already destroyed
                console.warn('Map cleanup warning:', e);
            }
        };
    }, [map, onMapClick]);

    // 3. Notify Parent when Map is Ready (once)
    useEffect(() => {
        if (map && onMapReady) {
            onMapReady(map);
        }
    }, [map]); // Dependency array intentionally excludes onMapReady if stable

    return null;
};

export default MapController;
