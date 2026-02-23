import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Tracker, TrackerEntry } from '../types/tracking';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';

export class TrackerExportService {
    /**
     * Helper to handle file saving/sharing on mobile
     */
    private static async shareFile(base64Data: string, fileName: string, mimeType: string) {
        try {
            toast.loading('Guardando el archivo...', { id: 'exporting' });

            if (Capacitor.isNativePlatform()) {
                // On mobile, save to Documents directory
                await Filesystem.writeFile({
                    path: fileName,
                    data: base64Data,
                    directory: Directory.Documents,
                    recursive: true
                });

                toast.success(`Archivo guardado en Documentos: ${fileName}`, { id: 'exporting' });
            } else {
                // Standard web download
                const link = document.createElement('a');
                link.href = `data:${mimeType};base64,${base64Data}`;
                link.download = fileName;
                link.click();
                toast.success('Archivo descargado con éxito', { id: 'exporting' });
            }
        } catch (error: any) {
            console.error('Error saving file:', error);

            // Fallback attempt
            try {
                const link = document.createElement('a');
                link.href = `data:${mimeType};base64,${base64Data}`;
                link.download = fileName;
                link.click();
                toast.success('Descarga iniciada (Fallback)', { id: 'exporting' });
            } catch (e: any) {
                toast.error(`Error al guardar: ${error.message || 'Error del sistema'}`, { id: 'exporting' });
            }
        }
    }

    /**
     * Export a single tracker's data to Excel
     */
    static async exportToExcel(tracker: Tracker, entries: TrackerEntry[]) {
        const data = entries.map(entry => ({
            'Fecha': format(new Date(entry.date), 'yyyy-MM-dd HH:mm', { locale: es }),
            'Valor': entry.value,
            'Notas': entry.note || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

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
                'Fecha': format(new Date(entry.date), 'yyyy-MM-dd HH:mm', { locale: es }),
                'Valor': entry.value,
                'Notas': entry.note || ''
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
        doc.text(`Informe del Rastreador: ${tracker.name}`, 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.text(`Tipo: ${tracker.type}`, 20, 35, { align: 'left' });
        doc.text(`Fecha de Creación: ${format(new Date(), 'PPP', { locale: es })}`, 20, 42, { align: 'left' });

        const tableData = entries.map(entry => [
            format(new Date(entry.date), 'yyyy-MM-dd'),
            entry.value.toString(),
            entry.note || '-'
        ]);

        autoTable(doc, {
            startY: 50,
            head: [['Fecha', 'Valor', 'Notas']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
            styles: { halign: 'left' },
        });

        const pdfOutput = doc.output('datauristring').split(',')[1];
        const safeName = tracker.name.replace(/[/\\?%*:|"<>]/g, '-');
        const fileName = `${safeName}_Report.pdf`;

        await this.shareFile(pdfOutput, fileName, 'application/pdf');
    }
}
