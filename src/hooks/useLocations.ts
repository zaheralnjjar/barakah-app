import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';


// Unified storage key
const LOCATIONS_STORAGE_KEY = 'baraka_locations';
const FOLDERS_STORAGE_KEY = 'baraka_location_folders';

export interface LocationFolder {
    id: string;
    name: string;
    icon: string;
    color: string;
    user_id?: string;
}

export interface SavedLocation {
    id: string;
    title: string;
    address?: string;
    notes?: string;
    lat: number;
    lng: number;
    url: string;
    street_line?: string; // New: Specific street/building info
    category: 'home' | 'work' | 'mosque' | 'market' | 'restaurant' | 'parking' | 'pinned' | 'other';
    folder_id?: string; // New: Folder link
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
    const [folders, setFolders] = useState<LocationFolder[]>([]); // New folders state
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [session, setSession] = useState<any>(null);
    const recentlyDeletedIds = useRef<Set<string>>(new Set()); // Track deleted IDs to prevent sync race conditions

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // --- Supabase Sync Functions ---
    const syncLocationsWithSupabase = useCallback(async (localData: SavedLocation[]) => {
        if (!session?.user) return localData;

        try {
            const { data: cloudData, error } = await supabase
                .from('saved_locations')
                .select('*')
                .eq('user_id', session.user.id);

            if (!error && cloudData) {
                const merged = [...localData];
                cloudData.forEach((cloudLoc: any) => {
                    // Skip if recently deleted (prevents race condition)
                    if (recentlyDeletedIds.current.has(cloudLoc.id)) return;

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
                            user_id: cloudLoc.user_id,
                            folder_id: cloudLoc.folder_id,
                            street_line: cloudLoc.street_line // Sync new field
                        });
                    }
                });
                return merged;
            }
        } catch (e) {
            console.error('Error syncing locations with Supabase:', e);
        }
        return localData;
    }, [session]);

    const syncFoldersWithSupabase = useCallback(async () => {
        if (!session?.user) return;
        try {
            const { data, error } = await supabase
                .from('location_folders')
                .select('*')
                .eq('user_id', session.user.id);

            if (data && !error) {
                const serverFolders = data as LocationFolder[];
                const merged = [...folders]; // Start with current local folders
                serverFolders.forEach(sf => {
                    const idx = merged.findIndex(f => f.id === sf.id);
                    if (idx >= 0) merged[idx] = sf; // Server overwrites local if ID matches
                    else merged.push(sf); // Add new server folder
                });

                setFolders(merged);
                localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(merged));
            }
        } catch (e) {
            console.error("Folder Sync failed", e);
        }
    }, [session, folders]);

    // Load locations on mount
    const loadLocations = useCallback(async () => {
        setLoading(true);
        try {
            // First migrate and load from localStorage
            const localLocations = migrateOldData();
            setLocations(localLocations);

            // Load folders locally
            const localFolders = localStorage.getItem(FOLDERS_STORAGE_KEY);
            if (localFolders) {
                setFolders(JSON.parse(localFolders));
            }

            // Try to sync with Supabase if user is logged in
            if (session?.user) {
                const mergedLocations = await syncLocationsWithSupabase(localLocations);
                setLocations(mergedLocations);
                localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(mergedLocations));
                await syncFoldersWithSupabase();
            }
        } catch (e) {
            console.error('Error loading locations:', e);
            setLocations(migrateOldData()); // Fallback to local if cloud fails
        } finally {
            setLoading(false);
        }
    }, [session, syncLocationsWithSupabase, syncFoldersWithSupabase]);

    useEffect(() => {
        loadLocations();

        // Listen for storage changes from other tabs/components
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === LOCATIONS_STORAGE_KEY) {
                const newData = e.newValue ? JSON.parse(e.newValue) : [];
                setLocations(newData);
            } else if (e.key === FOLDERS_STORAGE_KEY) {
                const newData = e.newValue ? JSON.parse(e.newValue) : [];
                setFolders(newData);
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
            folder_id?: string;
            street_line?: string;
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
                const city = addr.city || addr.town || addr.village || addr.county || '';

                // Strictly format as "Road Name Number, City" for precise global navigation
                // Enhanced parsing for number
                let streetInfo = '';
                if (road) {
                    if (number) streetInfo = `${road} ${number}`;
                    else {
                        // If no number in house_number, try to extract from display_name if it starts with digits
                        const parts = (data.display_name || '').split(',').map((p: string) => p.trim());
                        const partWithNumber = parts.find((p: string) => /\d/.test(p) && p.includes(road));
                        if (partWithNumber) streetInfo = partWithNumber;
                        else streetInfo = road;
                    }
                }

                if (streetInfo && city) {
                    streetInfo = `${streetInfo}, ${city}`;
                }

                if (streetInfo) {
                    // If title is default, use street info. If custom title, append street info in address only.
                    return title === 'موقع جديد' ? streetInfo : title;
                }
            } catch (e) {
                console.error('Error fetching address for title:', e);
            }
            return title;
        };

        const finalTitle = await titleWithInfo();

        // Re-fetch basic info to ensure address field is set correctly if it wasn't passed in options
        let finalAddress = options?.address;

        // Special handling for Phase 6: Prioritize street_line if provided (comes from manual input in Map)
        if (!finalAddress && options?.street_line) {
            finalAddress = options.street_line;
        }

        if (!finalAddress) {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`);
                const data = await res.json();
                const addr = data.address || {};
                const road = addr.road || addr.street || addr.pedestrian || addr.suburb || '';
                const number = addr.house_number || '';
                const city = addr.city || addr.town || addr.village || addr.county || '';

                let streetStr = '';
                if (road) {
                    if (number) streetStr = `${road} ${number}`;
                    else {
                        // Fallback attempt to find number in text
                        const firstPart = (data.display_name || '').split(',')[0];
                        if (/\d/.test(firstPart)) streetStr = firstPart;
                        else streetStr = road;
                    }
                }

                if (streetStr && city) streetStr = `${streetStr}, ${city}`;

                finalAddress = streetStr || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            } catch (e) {
                finalAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            }
        }

        const newLocation: SavedLocation = {
            id: crypto.randomUUID(), // Changed to crypto.randomUUID()
            title: finalTitle,
            address: finalAddress,
            lat,
            lng,
            // Strictly use address-based query for navigation as requested by user
            url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(finalAddress || '')}`,
            category: options?.category || 'other',
            type: options?.type || 'location',
            createdAt: now.toISOString(),
            folder_id: options?.folder_id,
            street_line: options?.street_line, // Save new field
            user_id: session?.user?.id
        };

        try {
            if (session?.user) {
                const { error } = await supabase.from('saved_locations').insert({
                    id: newLocation.id,
                    user_id: newLocation.user_id,
                    title: newLocation.title,
                    address: newLocation.address,
                    lat: newLocation.lat,
                    lng: newLocation.lng,
                    url: newLocation.url,
                    category: newLocation.category,
                    folder_id: newLocation.folder_id,
                    street_line: newLocation.street_line
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
    }, [locations, toast, session]);

    // Quick save parking
    const saveParking = useCallback(async (customLocation?: { lat: number, lng: number, address?: string, name?: string }): Promise<SavedLocation | null> => {
        return new Promise((resolve) => {
            const processLocation = async (latitude: number, longitude: number) => {
                let streetAddress = customLocation?.address || 'Estacionamiento'; // Spanish name

                // If address not provided, fetch it
                if (!customLocation?.address) {
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=es`); // Spanish language
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
                    title: '🅿️ Estacionamiento guardado', // Spanish title
                    description: title
                });
                resolve(location);
            };

            if (customLocation) {
                processLocation(customLocation.lat, customLocation.lng);
            } else {
                if (!navigator.geolocation) {
                    toast({ title: 'El navegador no soporta geolocalización', variant: 'destructive' }); // Spanish message
                    resolve(null);
                    return;
                }

                navigator.geolocation.getCurrentPosition(
                    (pos) => processLocation(pos.coords.latitude, pos.coords.longitude),
                    (err) => {
                        toast({
                            title: 'No se pudo obtener la ubicación', // Spanish message
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
            if (session?.user) {
                await supabase.from('saved_locations')
                    .update(updates)
                    .eq('id', id)
                    .eq('user_id', session.user.id);
            }

            window.dispatchEvent(new Event('locations-updated'));
            toast({ title: '✅ تم تحديث الموقع' });
        } catch (error) {
            console.error('Error updating location:', error);
        }
    }, [locations, toast, session]);

    // Delete location
    const deleteLocation = useCallback(async (id: string) => {
        const previousLocations = [...locations]; // Backup for rollback
        try {
            const updated = locations.filter(loc => loc.id !== id);
            setLocations(updated);
            localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(updated));
            localStorage.setItem('baraka_resources', JSON.stringify(updated));

            // Only attempt server delete if ID is a valid UUID
            // This prevents "invalid input syntax" errors for local legacy IDs (timestamps, etc.)
            // Track this ID as deleted to prevent immediate sync resurrection
            recentlyDeletedIds.current.add(id);

            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

            if (session?.user && isUUID) {
                const { error } = await supabase.from('saved_locations')
                    .delete()
                    .eq('id', id)
                    .eq('user_id', session.user.id);

                if (error) throw error;
            }

            window.dispatchEvent(new Event('locations-updated'));
            toast({ title: '🗑️ تم حذف الموقع' });
        } catch (error: any) {
            console.error('Error deleting location:', error);
            setLocations(previousLocations); // Revert on error
            localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(previousLocations));
            toast({
                title: 'فشل الحذف',
                description: 'تعذر حذف الموقع من الخادم',
                variant: 'destructive'
            });
        }
    }, [locations, toast, session]);

    // Bulk Delete
    const deleteLocations = useCallback(async (ids: string[]) => {
        try {
            const updated = locations.filter(loc => !ids.includes(loc.id));
            setLocations(updated);
            localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(updated));
            localStorage.setItem('baraka_resources', JSON.stringify(updated));

            if (session?.user) {
                await supabase.from('saved_locations')
                    .delete()
                    .in('id', ids)
                    .eq('user_id', session.user.id);
            }

            window.dispatchEvent(new Event('locations-updated'));
            toast({ title: `🗑️ تم حذف ${ids.length} مواقع` });
        } catch (error) {
            console.error('Error deleting locations:', error);
        }
    }, [locations, toast, session]);

    // Get only locations (not parking)
    const getLocationsOnly = useCallback(() => {
        return locations.filter(l => l.type !== 'parking');
    }, [locations]);

    // Get only parking spots
    const getParkingOnly = useCallback(() => {
        return locations.filter(l => l.type === 'parking');
    }, [locations]);

    // --- Folder Actions ---
    const createFolder = useCallback(async (name: string, color: string = '#3b82f6', icon: string = 'folder') => {
        const newFolder: LocationFolder = {
            id: crypto.randomUUID(),
            name,
            color,
            icon,
            user_id: session?.user?.id
        };

        const updated = [...folders, newFolder];
        setFolders(updated);
        localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(updated));

        if (session?.user) {
            supabase.from('location_folders').insert([newFolder]).then(({ error }) => {
                if (error) console.error('Failed to sync folder creation to Supabase', error);
            });
        }
        return newFolder;
    }, [folders, session]);

    const deleteFolder = useCallback(async (id: string) => {
        const updatedFolders = folders.filter(f => f.id !== id);
        setFolders(updatedFolders);
        localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(updatedFolders));

        // Unlink locations from this folder locally
        const updatedLocs = locations.map(l => l.folder_id === id ? { ...l, folder_id: undefined } : l);
        setLocations(updatedLocs);
        localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(updatedLocs));

        if (session?.user) {
            supabase.from('location_folders').delete().eq('id', id).then(({ error }) => {
                if (error) console.error('Failed to sync folder deletion to Supabase', error);
            });
            // Also update locations in DB to set folder_id null
            supabase.from('saved_locations').update({ folder_id: null }).eq('folder_id', id).then(({ error }) => {
                if (error) console.error('Failed to unlink locations from deleted folder in Supabase', error);
            });
        }
    }, [folders, locations, session]);

    // === Active Parking Session Management ===
    const ACTIVE_PARKING_KEY = 'baraka_active_parking';

    const [activeParking, setActiveParking] = useState<SavedLocation | null>(() => {
        try {
            const stored = localStorage.getItem(ACTIVE_PARKING_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    // Start a new parking session (called on long-press)
    const startParkingSession = useCallback(async (): Promise<SavedLocation | null> => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                toast({ title: 'El navegador no soporta geolocalización', variant: 'destructive' }); // Spanish message
                resolve(null);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    let streetAddress = 'Lugar de estacionamiento'; // Spanish name

                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=es`); // Spanish language
                        const data = await res.json();
                        const addr = data.address || {};
                        const road = addr.road || addr.street || addr.pedestrian || addr.suburb || '';
                        const number = addr.house_number || '';
                        const city = addr.city || addr.town || addr.village || addr.county || '';

                        let streetStr = road ? (number ? `${road} ${number}` : road) : '';
                        if (streetStr && city) streetStr = `${streetStr}, ${city}`;
                        if (streetStr) streetAddress = streetStr;
                    } catch (e) {
                        console.log('Could not fetch address for parking session');
                    }

                    const session: SavedLocation = {
                        id: `parking-${Date.now()}`,
                        title: streetAddress,
                        address: streetAddress,
                        lat: latitude,
                        lng: longitude,
                        url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(streetAddress)}`,
                        category: 'parking',
                        type: 'parking',
                        createdAt: new Date().toISOString()
                    };

                    setActiveParking(session);
                    localStorage.setItem(ACTIVE_PARKING_KEY, JSON.stringify(session));

                    toast({ title: '🅿️ Seguimiento de estacionamiento iniciado', description: streetAddress }); // Spanish message
                    resolve(session);
                },
                (err) => {
                    toast({ title: 'No se pudo obtener la ubicación', description: err.message, variant: 'destructive' }); // Spanish message
                    resolve(null);
                },
                { enableHighAccuracy: true }
            );
        });
    }, [toast]);

    // Cancel active parking without saving
    const clearParking = useCallback(() => { // Renamed from cancelActiveParking
        setActiveParking(null);
        localStorage.removeItem(ACTIVE_PARKING_KEY);
    }, []);

    // Finalize and save active parking to permanent locations
    const finalizeActiveParking = useCallback(async (customTitle?: string) => {
        if (!activeParking) return;

        const finalLocation: SavedLocation = {
            ...activeParking,
            id: crypto.randomUUID(), // New permanent ID
            title: customTitle || activeParking.title,
            user_id: session?.user?.id // Add user_id
        };

        // Add to locations list
        const updated = [...locations, finalLocation];
        setLocations(updated);
        localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem('baraka_resources', JSON.stringify(updated));

        // Sync with Supabase
        try {
            if (session?.user) {
                await supabase.from('saved_locations').insert({
                    id: finalLocation.id,
                    user_id: finalLocation.user_id,
                    title: finalLocation.title,
                    address: finalLocation.address,
                    lat: finalLocation.lat,
                    lng: finalLocation.lng,
                    url: finalLocation.url,
                    category: finalLocation.category,
                    folder_id: finalLocation.folder_id // Include folder_id
                });
            }
        } catch (e) {
            console.error('Error syncing parking to cloud:', e);
        }

        // Clear active session
        setActiveParking(null);
        localStorage.removeItem(ACTIVE_PARKING_KEY);
        window.dispatchEvent(new Event('locations-updated'));
    }, [activeParking, locations, session]);

    return {
        locations,
        folders,
        loading,
        saveLocation,
        saveParking,
        updateLocation,
        deleteLocation,
        deleteLocations,
        getLocationsOnly,
        getParkingOnly,
        refresh: loadLocations,
        // Active Parking Session
        activeParking,
        startParkingSession,
        finalizeActiveParking,
        createFolder,
        deleteFolder
    };
};

export default useLocations;
