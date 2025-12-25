
import { useState, useEffect } from 'react';

export interface ArchivedReport {
    id: string;
    title: string;
    date: string;
    type: string;
    pdfData: string; // Base64 string
    size: number;
}

const STORAGE_KEY = 'barakah_report_archive';

export const useReportArchive = () => {
    const [reports, setReports] = useState<ArchivedReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = () => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setReports(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Failed to load reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveReport = async (title: string, type: string, pdfBlob: Blob) => {
        try {
            // Convert Blob to Base64
            const reader = new FileReader();
            reader.readAsDataURL(pdfBlob);

            reader.onloadend = () => {
                const base64data = reader.result as string;

                const newReport: ArchivedReport = {
                    id: crypto.randomUUID(),
                    title,
                    date: new Date().toISOString(),
                    type,
                    pdfData: base64data,
                    size: pdfBlob.size
                };

                const updatedReports = [newReport, ...reports];

                // Check storage limit (approx 5MB for localStorage usually)
                // If too large, remove oldest
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReports));
                    setReports(updatedReports);
                    return true;
                } catch (e) {
                    console.error('Storage full, removing old reports');
                    // Simple eviction strategy: keep last 5
                    const limitedReports = [newReport, ...reports.slice(0, 4)];
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedReports));
                    setReports(limitedReports);
                    return true;
                }
            };
        } catch (error) {
            console.error('Failed to save report:', error);
            return false;
        }
    };

    const deleteReport = (id: string) => {
        const updated = reports.filter(r => r.id !== id);
        setReports(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    return {
        reports,
        loading,
        saveReport,
        deleteReport,
        refresh: loadReports
    };
};
