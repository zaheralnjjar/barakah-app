import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Tracker, TrackerEntry } from '../types/tracking';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export class TrackerExportService {
    /**
     * Export a single tracker's data to Excel
     */
    static exportToExcel(tracker: Tracker, entries: TrackerEntry[]) {
        const data = entries.map(entry => ({
            'التاريخ': format(new Date(entry.date), 'yyyy-MM-dd HH:mm', { locale: ar }),
            'القيمة': entry.value,
            'ملاحظات': entry.note || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'البيانات');

        // RTL support for Excel (basic)
        if (!worksheet['!cols']) worksheet['!cols'] = [];

        XLSX.writeFile(workbook, `${tracker.name}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    }

    /**
     * Export multiple trackers to a single Excel file (Multiple sheets)
     */
    static exportMultipleToExcel(trackersWithData: { tracker: Tracker, entries: TrackerEntry[] }[]) {
        const workbook = XLSX.utils.book_new();

        trackersWithData.forEach(({ tracker, entries }) => {
            const data = entries.map(entry => ({
                'التاريخ': format(new Date(entry.date), 'yyyy-MM-dd HH:mm', { locale: ar }),
                'القيمة': entry.value,
                'ملاحظات': entry.note || ''
            }));
            const worksheet = XLSX.utils.json_to_sheet(data);
            // Sheet name max 31 chars
            const sheetName = tracker.name.substring(0, 30);
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        });

        XLSX.writeFile(workbook, `Barakah_Export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    }

    /**
     * Export tracker summary report to PDF
     */
    static async exportToPDF(tracker: Tracker, entries: TrackerEntry[]) {
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
        });

        // Register Arabic font if possible, otherwise use standard with limited support
        // Note: jsPDF needs a TTF font embedded for full Arabic support.
        // For now we will use a workaround or standard tables.

        doc.setFontSize(20);
        doc.text(`Tracker Report: ${tracker.name}`, 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.text(`Type: ${tracker.type}`, 20, 35);
        doc.text(`Generated on: ${format(new Date(), 'PPP', { locale: ar })}`, 20, 42);

        const tableData = entries.map(entry => [
            format(new Date(entry.date), 'yyyy-MM-dd'),
            entry.value.toString(),
            entry.note || '-'
        ]);

        autoTable(doc, {
            startY: 50,
            head: [['Date', 'Value', 'Notes']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] }, // Blue primary
        });

        doc.save(`${tracker.name}_Report.pdf`);
    }
}
