import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Unified storage key
const LOCATIONS_STORAGE_KEY = 'baraka_locations';

export interface SavedLocation {
    id: string;
    title: string;
    address?: string;
    notes?: string;
    lat: number;
    lng: number;
    url: string;
    category: 'home' | 'work' | 'mosque' | 'market' | 'restaurant' | 'parking' | 'pinned' | 'other';
    type: 'location' | 'parking';
    createdAt: string;
    user_id?: string;
}

// Migrate old data from different keys
const migrateOldData = (): SavedLocation[] => {
    const oldKeys = ['baraka_resources', 'baraka_saved_locations'];
    let allLocations: SavedLocation[] = [];

    // Try to load from the new unified key first
    try {
        const existing = localStorage.getItem(LOCATIONS_STORAGE_KEY);
        if (existing) {
            allLocations = JSON.parse(existing);
        }
    } catch (e) {
        console.error('Error loading locations:', e);
    }

    // Migrate from old keys
    for (const key of oldKeys) {
        try {
            const oldData = localStorage.getItem(key);
            if (oldData) {
                const parsed = JSON.parse(oldData);
                if (Array.isArray(parsed)) {
                    // Add migrated locations with normalized structure
                    parsed.forEach((loc: any) => {
                        // Check if already exists
                        if (!allLocations.find(l => l.id === loc.id)) {
                            allLocations.push({
                                id: loc.id || Date.now().toString(),
                                title: loc.title || loc.name || 'موقع',
                                address: loc.address || '',
                                lat: typeof loc.lat === 'number' ? loc.lat : parseFloat(loc.lat) || 0,
                                lng: typeof loc.lng === 'number' ? loc.lng : parseFloat(loc.lng) || 0,
                                url: loc.url || `geo:${loc.lat},${loc.lng}`,
                                category: loc.category || 'other',
                                type: loc.type || 'location',
                                createdAt: loc.createdAt || new Date().toISOString(),
                                user_id: loc.user_id
                            });
                        }
                    });
                }
                // Remove old key after migration
                // localStorage.removeItem(key); // Commented out for safety during testing
            }
        } catch (e) {
            console.error(`Error migrating from ${key}:`, e);
        }
    }

    // Save migrated data to new key
    if (allLocations.length > 0) {
        localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(allLocations));
    }

    return allLocations;
};

export const useLocations = () => {
    const [locations, setLocations] = useState<SavedLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Load locations on mount
    const loadLocations = useCallback(async () => {
        setLoading(true);
        try {
            // First migrate and load from localStorage
            const localData = migrateOldData();

            // Try to sync with Supabase if user is logged in
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: cloudData, error } = await supabase
                    .from('saved_locations')
                    .select('*')
                    .eq('user_id', user.id);

                if (!error && cloudData) {
                    // Merge cloud data with local
                    const merged = [...localData];
                    cloudData.forEach((cloudLoc: any) => {
                        if (!merged.find(l => l.id === cloudLoc.id)) {
                            merged.push({
                                id: cloudLoc.id,
                                title: cloudLoc.title,
                                address: cloudLoc.address,
                                lat: cloudLoc.lat,
                                lng: cloudLoc.lng,
                                url: cloudLoc.url || `geo:${cloudLoc.lat},${cloudLoc.lng}`,
                                category: cloudLoc.category || 'other',
                                type: cloudLoc.type || 'location',
                                createdAt: cloudLoc.created_at,
                                user_id: cloudLoc.user_id
                            });
                        }
                    });
                    setLocations(merged);
                    localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(merged));
                } else {
                    setLocations(localData);
                }
            } else {
                setLocations(localData);
            }
        } catch (e) {
            console.error('Error loading locations:', e);
            setLocations(migrateOldData());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadLocations();

        // Listen for storage changes from other tabs/components
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === LOCATIONS_STORAGE_KEY) {
                const newData = e.newValue ? JSON.parse(e.newValue) : [];
                setLocations(newData);
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Custom event for same-tab updates
        const handleLocationsUpdate = () => loadLocations();
        window.addEventListener('locations-updated', handleLocationsUpdate);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('locations-updated', handleLocationsUpdate);
        };
    }, [loadLocations]);

    // Save location
    const saveLocation = useCallback(async (
        title: string,
        lat: number,
        lng: number,
        options?: {
            address?: string;
            category?: SavedLocation['category'];
            type?: 'location' | 'parking';
        }
    ): Promise<SavedLocation | null> => {
        const now = new Date();
        const titleWithInfo = async () => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`);
                const data = await res.json();
                const addr = data.address || {};
                const road = addr.road || addr.street || addr.pedestrian || addr.suburb || '';
                const number = addr.house_number || '';
                const streetInfo = road ? (number ? `${road} ${number}` : road) : '';

                if (streetInfo) {
                    return `${title} ${streetInfo}`.trim();
                }
            } catch (e) {
                console.error('Error fetching address for title:', e);
            }
            return title;
        };

        const finalTitle = await titleWithInfo();

        const newLocation: SavedLocation = {
            id: Date.now().toString(),
            title: finalTitle,
            address: options?.address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            lat,
            lng,
            url: `geo:${lat},${lng}`,
            category: options?.category || 'other',
            type: options?.type || 'location',
            createdAt: now.toISOString()
        };

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                newLocation.user_id = user.id;
                const { error } = await supabase.from('saved_locations').insert({
                    id: newLocation.id,
                    user_id: user.id,
                    title: newLocation.title,
                    address: newLocation.address,
                    lat: newLocation.lat,
                    lng: newLocation.lng,
                    url: newLocation.url,
                    category: newLocation.category
                });
                if (error) throw error;
            }

            const updated = [...locations, newLocation];
            setLocations(updated);
            localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(updated));

            // Also update old keys for backward compatibility
            localStorage.setItem('baraka_resources', JSON.stringify(updated));

            // Notify other components
            window.dispatchEvent(new Event('locations-updated'));

            toast({ title: '✅ تم حفظ الموقع بنجاح' });
            return newLocation;
        } catch (error) {
            console.error('Error saving location:', error);
            // Still save locally on error
            const updated = [...locations, newLocation];
            setLocations(updated);
            localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(updated));
            localStorage.setItem('baraka_resources', JSON.stringify(updated));
            window.dispatchEvent(new Event('locations-updated'));
            toast({ title: '✅ تم حفظ الموقع محلياً' });
            return newLocation;
        }
    }, [locations, toast]);

    // Quick save parking
    const saveParking = useCallback(async (customLocation?: { lat: number, lng: number, address?: string, name?: string }): Promise<SavedLocation | null> => {
        return new Promise((resolve) => {
            const processLocation = async (latitude: number, longitude: number) => {
                let streetAddress = customLocation?.address || 'موقف';

                // If address not provided, fetch it
                if (!customLocation?.address) {
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`);
                        const data = await res.json();
                        const addr = data.address || {};
                        const road = addr.road || addr.street || addr.pedestrian || addr.suburb || '';
                        const number = addr.house_number || '';
                        if (road) {
                            streetAddress = number ? `${road} ${number}` : road;
                        }
                    } catch (e) {
                        console.log('Could not fetch address for parking');
                    }
                }

                const title = customLocation?.name ? customLocation.name : streetAddress;

                const location = await saveLocation(title, latitude, longitude, {
                    category: 'parking',
                    type: 'parking',
                    address: streetAddress // Save specific address for potential specific usage
                });

                toast({
                    title: '🅿️ تم حفظ موقف السيارة',
                    description: title
                });
                resolve(location);
            };

            if (customLocation) {
                processLocation(customLocation.lat, customLocation.lng);
            } else {
                if (!navigator.geolocation) {
                    toast({ title: 'المتصفح لا يدعم تحديد الموقع', variant: 'destructive' });
                    resolve(null);
                    return;
                }

                navigator.geolocation.getCurrentPosition(
                    (pos) => processLocation(pos.coords.latitude, pos.coords.longitude),
                    (err) => {
                        toast({
                            title: 'تعذر تحديد الموقع',
                            description: err.message,
                            variant: 'destructive'
                        });
                        resolve(null);
                    },
                    { enableHighAccuracy: true }
                );
            }
        });
    }, [saveLocation, toast]);

    // Update location
    const updateLocation = useCallback(async (id: string, updates: Partial<SavedLocation>) => {
        try {
            const updated = locations.map(loc =>
                loc.id === id ? { ...loc, ...updates } : loc
            );
            setLocations(updated);
            localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(updated));
            localStorage.setItem('baraka_resources', JSON.stringify(updated));

            // Sync with Supabase
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('saved_locations')
                    .update(updates)
                    .eq('id', id)
                    .eq('user_id', user.id);
            }

            window.dispatchEvent(new Event('locations-updated'));
            toast({ title: '✅ تم تحديث الموقع' });
        } catch (error) {
            console.error('Error updating location:', error);
        }
    }, [locations, toast]);

    // Delete location
    const deleteLocation = useCallback(async (id: string) => {
        try {
            const updated = locations.filter(loc => loc.id !== id);
            setLocations(updated);
            localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(updated));
            localStorage.setItem('baraka_resources', JSON.stringify(updated));

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('saved_locations')
                    .delete()
                    .eq('id', id)
                    .eq('user_id', user.id);
            }

            window.dispatchEvent(new Event('locations-updated'));
            toast({ title: '🗑️ تم حذف الموقع' });
        } catch (error) {
            console.error('Error deleting location:', error);
        }
    }, [locations, toast]);

    // Bulk Delete
    const deleteLocations = useCallback(async (ids: string[]) => {
        try {
            const updated = locations.filter(loc => !ids.includes(loc.id));
            setLocations(updated);
            localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(updated));
            localStorage.setItem('baraka_resources', JSON.stringify(updated));

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('saved_locations')
                    .delete()
                    .in('id', ids)
                    .eq('user_id', user.id);
            }

            window.dispatchEvent(new Event('locations-updated'));
            toast({ title: `🗑️ تم حذف ${ids.length} مواقع` });
        } catch (error) {
            console.error('Error deleting locations:', error);
        }
    }, [locations, toast]);

    // Get only locations (not parking)
    const getLocationsOnly = useCallback(() => {
        return locations.filter(l => l.type !== 'parking');
    }, [locations]);

    // Get only parking spots
    const getParkingOnly = useCallback(() => {
        return locations.filter(l => l.type === 'parking');
    }, [locations]);

    return {
        locations,
        loading,
        saveLocation,
        saveParking,
        updateLocation,
        deleteLocation,
        deleteLocations,
        getLocationsOnly,
        getParkingOnly,
        refresh: loadLocations
    };
};

export default useLocations;
