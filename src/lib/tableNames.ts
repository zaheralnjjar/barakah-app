// Table name constants for Supabase
// Using versioned table names until migration is complete

export const TABLES = {
    finance: 'finance_data_2025_12_18_18_42',
    logistics: 'logistics_data_2025_12_18_18_42',
} as const;

export type TableName = typeof TABLES[keyof typeof TABLES];
