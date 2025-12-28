import { useState, useEffect } from 'react';

export interface DollarRate {
    value_avg: number;
    value_sell: number;
    value_buy: number;
}

export interface BluelyticsResponse {
    oficial: DollarRate;
    blue: DollarRate;
    last_update: string;
}

export const useDollarRate = () => {
    const [rates, setRates] = useState<BluelyticsResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRates = async () => {
            try {
                const response = await fetch('https://api.bluelytics.com.ar/v2/latest');
                if (!response.ok) throw new Error('Network response was not ok');

                const data: BluelyticsResponse = await response.json();
                setRates(data);
                setLoading(false);

                // Cache the result
                localStorage.setItem('barakah_dollar_rates', JSON.stringify({
                    data,
                    timestamp: Date.now()
                }));
            } catch (error) {
                console.error('Error fetching dollar rates:', error);

                // Try to load from cache if fetch fails
                const cached = localStorage.getItem('barakah_dollar_rates');
                if (cached) {
                    try {
                        const { data } = JSON.parse(cached);
                        setRates(data);
                    } catch (e) { console.error('Error parsing cached rates', e); }
                }
                setLoading(false);
            }
        };

        // Initial fetch
        fetchRates();

        // Set interval for 2 hours (2 * 60 * 60 * 1000 ms)
        const intervalId = setInterval(fetchRates, 2 * 60 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, []);

    return { rates, loading };
};
