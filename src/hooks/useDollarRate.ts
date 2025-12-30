import { useState, useEffect, useCallback } from 'react';

export interface DollarRate {
    value_avg: number;
    value_sell: number;
    value_buy: number;
    source?: string;
}

export interface BluelyticsResponse {
    oficial: DollarRate;
    blue: DollarRate;
    last_update: string;
    real_blue?: DollarRate; // For display only
}

export interface ExtendedDollarRate extends BluelyticsResponse {
    previous_blue?: DollarRate;
    change?: number;
    sources_checked?: string[];
    real_blue?: DollarRate; // For display only
}


export const useDollarRate = () => {
    const [rates, setRates] = useState<ExtendedDollarRate | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchRates = useCallback(async () => {
        try {
            // Source 1: Bluelytics
            const bluePromise = fetch('https://api.bluelytics.com.ar/v2/latest').then(r => r.json()).catch(() => null);
            // Source 2: DolarApi (includes BNA oficial)
            const dolarApiBluePromise = fetch('https://dolarapi.com/v1/dolares/blue').then(r => r.json()).catch(() => null);
            const dolarApiBNAPromise = fetch('https://dolarapi.com/v1/dolares/oficial').then(r => r.json()).catch(() => null);
            // Source 3: CriptoYa
            const criptoYaPromise = fetch('https://criptoya.com/api/dolar').then(r => r.json()).catch(() => null);

            const [blueData, dolarApiBlue, dolarApiBNA, criptoYaData] = await Promise.all([
                bluePromise,
                dolarApiBluePromise,
                dolarApiBNAPromise,
                criptoYaPromise
            ]);

            const sources: DollarRate[] = [];
            const checkedNames: string[] = [];

            if (blueData?.blue) {
                sources.push({
                    value_avg: blueData.blue.value_avg,
                    value_sell: blueData.blue.value_sell,
                    value_buy: blueData.blue.value_buy,
                    source: 'Bluelytics'
                });
                checkedNames.push('Bluelytics');
            }

            if (dolarApiBlue?.venta) {
                sources.push({
                    value_avg: (dolarApiBlue.venta + dolarApiBlue.compra) / 2,
                    value_sell: dolarApiBlue.venta,
                    value_buy: dolarApiBlue.compra,
                    source: 'DolarApi Blue'
                });
                checkedNames.push('DolarApi Blue');
            }

            // BNA oficial rate for reference
            let oficialRate = blueData?.oficial || { value_avg: 1100, value_sell: 1100, value_buy: 1100 };
            if (dolarApiBNA?.venta) {
                oficialRate = {
                    value_avg: (dolarApiBNA.venta + dolarApiBNA.compra) / 2,
                    value_sell: dolarApiBNA.venta,
                    value_buy: dolarApiBNA.compra,
                    source: 'BNA'
                };
                checkedNames.push('BNA Oficial');
            }

            if (criptoYaData?.blue) {
                sources.push({
                    value_avg: (criptoYaData.blue.ask + criptoYaData.blue.bid) / 2,
                    value_sell: criptoYaData.blue.ask,
                    value_buy: criptoYaData.blue.bid,
                    source: 'CriptoYa'
                });
                checkedNames.push('CriptoYa');
            }

            if (sources.length === 0) throw new Error('All sources failed');

            // Consensus Logic: Prioritize Official Rate as per user request
            // If explicit official rate is found, use it. Otherwise fallback to BNA reference.

            const bestBlue = sources.reduce((prev, current) =>
                (current.value_sell > prev.value_sell) ? current : prev
            );

            // Per user request: All local calculations ($) should use Official Rate, not Blue.
            // We will swap the 'blue' field in the response to return the Official rate
            // ensuring the app logic (which uses .blue) now gets the Official value.

            const effectiveRate = oficialRate.value_sell > 0 ? oficialRate : { value_avg: 1100, value_sell: 1100, value_buy: 1100, source: 'Fallback' };

            const consensusData: BluelyticsResponse = {
                oficial: oficialRate,
                blue: effectiveRate, // Used for calculations (Official)
                real_blue: bestBlue, // Used for display (Blue)
                last_update: new Date().toISOString()
            };

            // Get cached data to compare
            const cached = localStorage.getItem('barakah_dollar_rates');
            let previous_blue: DollarRate | undefined;
            let change = 0;

            if (cached) {
                try {
                    const { data } = JSON.parse(cached);
                    if (data.blue.value_avg !== consensusData.blue.value_avg) {
                        previous_blue = data.blue;
                        change = consensusData.blue.value_avg - data.blue.value_avg;
                    } else if (data.previous_blue) {
                        previous_blue = data.previous_blue;
                        change = data.change || 0;
                    }
                } catch (e) { console.error(e); }
            }

            const extendedData: ExtendedDollarRate = {
                ...consensusData,
                previous_blue,
                change,
                sources_checked: checkedNames
            };

            setRates(extendedData);
            setLoading(false);

            localStorage.setItem('barakah_dollar_rates', JSON.stringify({
                data: extendedData,
                timestamp: Date.now()
            }));

        } catch (error) {
            console.error('Error fetching dollar rates:', error);
            const cached = localStorage.getItem('barakah_dollar_rates');
            if (cached) {
                try {
                    const { data } = JSON.parse(cached);
                    setRates(data);
                } catch (e) { console.error(e); }
            }
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRates();
        const intervalId = setInterval(fetchRates, 60 * 60 * 1000); // Check every hour
        return () => clearInterval(intervalId);
    }, [fetchRates]);

    return { rates, loading, refetch: fetchRates };
};
