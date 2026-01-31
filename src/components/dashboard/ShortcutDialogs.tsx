import React, { useState, useEffect } from 'react';
import { LocationShortcutDialog } from '@/components/locations/LocationShortcutDialog';

export const ShortcutDialogs = () => {
    const [showLocationDialog, setShowLocationDialog] = useState(false);

    useEffect(() => {
        const handleOpenLocationDialog = () => setShowLocationDialog(true);

        window.addEventListener('open-location-shortcut-dialog', handleOpenLocationDialog);

        return () => {
            window.removeEventListener('open-location-shortcut-dialog', handleOpenLocationDialog);
        };
    }, []);

    return (
        <>
            <LocationShortcutDialog
                isOpen={showLocationDialog}
                onClose={() => setShowLocationDialog(false)}
            />
        </>
    );
};
