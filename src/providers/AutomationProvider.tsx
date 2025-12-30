import React, { useEffect } from 'react';
import { checkRules } from '@/services/RuleEngine';

export const AutomationProvider = ({ children }: { children: React.ReactNode }) => {
    useEffect(() => {
        // Check rules every minute
        const interval = setInterval(() => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

            checkRules({ type: 'time', value: timeString });

            // Appointment checks would go here (fetch from store first)
        }, 60000);

        // Initial check
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        checkRules({ type: 'time', value: timeString });

        return () => clearInterval(interval);
    }, []);

    // Future: Add listeners for location, network status, etc.

    return <>{children}</>;
};
