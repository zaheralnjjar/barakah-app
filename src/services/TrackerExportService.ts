import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Tracker, TrackerEntry } from '../types/tracking';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export class TrackerExportService {
    /**
     * Helper to handle file saving/sharing on mobile
     */
    private static async shareFile(base64Data: string, fileName: string, mimeType: string) {
        try {
            const savedFile = await Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: Directory.Cache
            });

            await Share.share({
                title: fileName,
                url: savedFile.uri,
                dialogTitle: 'مشاركة الملف'
            });
        } catch (error) {
            console.error('Error sharing file:', error);
            // Fallback for web if needed
            const link = document.createElement('a');
            link.href = `data:${mimeType};base64,${base64Data}`;
            link.download = fileName;
            link.click();
        }
    }

    /**
     * Export a single tracker's data to Excel
     */
    static async exportToExcel(tracker: Tracker, entries: TrackerEntry[]) {
        const data = entries.map(entry => ({
            'التاريخ': format(new Date(entry.date), 'yyyy-MM-dd HH:mm', { locale: ar }),
            'القيمة': entry.value,
            'ملاحظات': entry.note || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'البيانات');

        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
        const fileName = `${tracker.name}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

        await this.shareFile(wbout, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    /**
     * Export multiple trackers to a single Excel file (Multiple sheets)
     */
    static async exportMultipleToExcel(trackersWithData: { tracker: Tracker, entries: TrackerEntry[] }[]) {
        const workbook = XLSX.utils.book_new();

        trackersWithData.forEach(({ tracker, entries }) => {
            const data = entries.map(entry => ({
                'التاريخ': format(new Date(entry.date), 'yyyy-MM-dd HH:mm', { locale: ar }),
                'القيمة': entry.value,
                'ملاحظات': entry.note || ''
            }));
            const worksheet = XLSX.utils.json_to_sheet(data);
            const sheetName = tracker.name.substring(0, 30);
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        });

        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
        const fileName = `Barakah_Export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

        await this.shareFile(wbout, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
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
            headStyles: { fillColor: [59, 130, 246] },
        });

        const pdfOutput = doc.output('datauristring').split(',')[1];
        const fileName = `${tracker.name}_Report.pdf`;

        await this.shareFile(pdfOutput, fileName, 'application/pdf');
    }
}
