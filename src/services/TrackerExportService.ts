import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Tracker, TrackerEntry } from '../types/tracking';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { AmiriFontBase64 } from '../utils/AmiriFont';
// @ts-ignore
import ArabicReshaper from 'arabic-reshaper';

const reshapeArabic = (text: string): string => {
    if (!text) return text;
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    if (!hasArabic) return text;
    try {
        return ArabicReshaper.convertArabic(text);
    } catch (e) {
        return text;
    }
};

export class TrackerExportService {
    /**
     * Helper to handle file saving/sharing on mobile
     */
    private static async shareFile(base64Data: string, fileName: string, mimeType: string) {
        try {
            toast.loading('جاري تجهيز الملف...', { id: 'exporting' });

            const savedFile = await Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: Directory.Cache
                // No encoding for base64 strings in Capacitor 3+ if you want it binary
            });

            const uriResult = await Filesystem.getUri({
                directory: Directory.Cache,
                path: fileName
            });

            await Share.share({
                title: fileName,
                url: uriResult.uri,
                dialogTitle: 'مشاركة الملف'
            });

            toast.success('تم تجهيز الملف بنجاح', { id: 'exporting' });
        } catch (error: any) {
            console.error('Error sharing file:', error);

            // Fallback for web or if share fails
            try {
                const link = document.createElement('a');
                link.href = `data:${mimeType};base64,${base64Data}`;
                link.download = fileName;
                link.click();
                toast.success('تم تحميل الملف (Web Fallback)', { id: 'exporting' });
            } catch (e: any) {
                toast.error(`فشل تصدير الملف: ${error.message || 'خطأ في النظام'}`, { id: 'exporting' });
            }
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
        const safeName = tracker.name.replace(/[/\\?%*:|"<>]/g, '-');
        const fileName = `${safeName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;

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

        // Add Arabic Font
        doc.addFileToVFS("Amiri-Regular.ttf", AmiriFontBase64);
        doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
        doc.setFont("Amiri");

        doc.setFontSize(20);
        doc.text(reshapeArabic(`تقرير المتتبع: ${tracker.name}`), 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.text(reshapeArabic(`النوع: ${tracker.type}`), 190, 35, { align: 'right' });
        doc.text(reshapeArabic(`تاريخ الإنشاء: ${format(new Date(), 'PPP', { locale: ar })}`), 190, 42, { align: 'right' });

        const tableData = entries.map(entry => [
            entry.note ? reshapeArabic(entry.note) : '-',
            entry.value.toString(),
            format(new Date(entry.date), 'yyyy-MM-dd')
        ]);

        autoTable(doc, {
            startY: 50,
            head: [[reshapeArabic('ملاحظات'), reshapeArabic('القيمة'), reshapeArabic('التاريخ')]],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246], font: 'Amiri', halign: 'right' },
            styles: { halign: 'right', font: 'Amiri' },
        });

        const pdfOutput = doc.output('datauristring').split(',')[1];
        const safeName = tracker.name.replace(/[/\\?%*:|"<>]/g, '-');
        const fileName = `${safeName}_Report.pdf`;

        await this.shareFile(pdfOutput, fileName, 'application/pdf');
    }
}
