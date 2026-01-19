/**
 * Calculate days until a given date
 */
export function getDaysUntil(dateString: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

/**
 * Format days until text in Arabic
 */
export function formatDaysUntil(days: number): string {
    if (days < 0) return 'منتهي';
    if (days === 0) return 'اليوم';
    if (days === 1) return 'غداً';
    if (days === 2) return 'بعد غد';
    return `بعد ${days} أيام`;
}
