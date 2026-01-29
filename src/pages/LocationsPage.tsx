import React from 'react';
import LocationSaver from '@/components/LocationSaver';

const LocationsPage = () => {
    return (
        <div className="container mx-auto p-4 max-w-4xl space-y-6 pb-24">
            <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center arabic-title">إدارة المواقع المحفوظة</h1>
            <LocationSaver />
        </div>
    );
};

export default LocationsPage;
