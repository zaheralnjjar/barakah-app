
/**
 * Fetches the official BNA US Dollar rate from dolarapi.com
 * Returns the "Venta" (Selling) price as the standard exchange rate.
 * API Endpoint: https://dolarapi.com/v1/dolares/oficial
 */
export const fetchBNARate = async (): Promise<number | null> => {
    try {
        const response = await fetch('https://dolarapi.com/v1/dolares/oficial');
        if (!response.ok) throw new Error('Failed to fetch rate');

        const data = await response.json();
        // We typically use the "Venta" (Selling) rate for valuation or expenses
        return data.venta || null;
    } catch (error) {
        console.error('Error fetching BNA rate:', error);
        return null;
    }
};
