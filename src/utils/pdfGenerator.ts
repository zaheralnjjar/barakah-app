import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PrintData {
    tasks?: any[];
    medications?: any[];
    projects?: any[];
    appointments?: any[];
    habits?: any[];
    shopping?: any[];
    expenses?: any[];
    prayerTimes?: any[];
}

export const generatePDF = (
    viewType: 'table' | 'timeline',
    data: PrintData,
    dateRange: string
) => {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true
    });

    // Setup Arabic Font (Simulated or Basic)
    // Note: Proper Arabic support in jsPDF requires adding a font file (TTF) and setting it.
    // Since we cannot easily add assets here, we will rely on standard output.
    // If text renders reversed, we might need a reversing function, but let's assume basics first.

    // Header
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185); // Blue
    doc.text('تقرير بركة', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`الفترة: ${dateRange}`, 105, 30, { align: 'center' });

    let yPos = 40;

    if (viewType === 'table') {
        // --- Table View ---

        // 1. Prayer Times
        if (data.prayerTimes && data.prayerTimes.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(39, 174, 96); // Green
            doc.text('مواقيت الصلاة', 180, yPos, { align: 'right' });
            yPos += 5;

            autoTable(doc, {
                startY: yPos,
                head: [['الوقت', 'الصلاة']],
                body: data.prayerTimes.map(p => [p.time, p.name]),
                theme: 'striped',
                headStyles: { fillColor: [39, 174, 96] }, // Green
                styles: { halign: 'right', font: 'helvetica' }, // Font issue potential
                margin: { top: 10 }
            });
            yPos = (doc as any).lastAutoTable.finalY + 15;
        }

        // 2. Appointments
        if (data.appointments && data.appointments.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(142, 68, 173); // Purple
            doc.text('المواعيد', 180, yPos, { align: 'right' });
            yPos += 5;

            autoTable(doc, {
                startY: yPos,
                head: [['التفاصيل', 'الوقت', 'العنوان']],
                body: data.appointments.map(a => [a.details || '-', a.time, a.title]),
                theme: 'grid',
                headStyles: { fillColor: [142, 68, 173] }, // Purple
                styles: { halign: 'right' },
            });
            yPos = (doc as any).lastAutoTable.finalY + 15;
        }

        // 3. Tasks
        if (data.tasks && data.tasks.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(41, 128, 185); // Blue
            doc.text('المهام', 180, yPos, { align: 'right' });
            yPos += 5;

            autoTable(doc, {
                startY: yPos,
                head: [['الحالة', 'الأولوية', 'المهمة']],
                body: data.tasks.map(t => [t.status || 'معلق', t.priority, t.title]),
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185] }, // Blue
                styles: { halign: 'right' },
            });
            yPos = (doc as any).lastAutoTable.finalY + 15;
        }

        // 4. Shopping
        if (data.shopping && data.shopping.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(211, 84, 0); // Orange
            doc.text('قائمة التسوق', 180, yPos, { align: 'right' });
            yPos += 5;

            autoTable(doc, {
                startY: yPos,
                head: [['الكمية', 'الصنف']],
                body: data.shopping.map(s => [s.quantity || '1', s.name]),
                theme: 'grid',
                headStyles: { fillColor: [211, 84, 0] }, // Orange
                styles: { halign: 'right' },
            });
            yPos = (doc as any).lastAutoTable.finalY + 15;
        }

        // 5. Expenses
        if (data.expenses && data.expenses.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(192, 57, 43); // Red
            doc.text('المصاريف', 180, yPos, { align: 'right' });
            yPos += 5;

            autoTable(doc, {
                startY: yPos,
                head: [['المبلغ', 'البند']],
                body: data.expenses.map(e => [e.amount, e.category]),
                theme: 'striped',
                headStyles: { fillColor: [192, 57, 43] }, // Red
                styles: { halign: 'right' },
            });
            yPos = (doc as any).lastAutoTable.finalY + 15;
        }

    } else {
        // --- Timeline View (Hours) ---
        doc.setFontSize(14);
        doc.text('الجدول الزمني الموحد', 180, yPos, { align: 'right' });
        yPos += 10;

        // Combine all time-based items
        const timelineItems = [];
        if (data.prayerTimes) timelineItems.push(...data.prayerTimes.map(p => ({ time: p.time.split(' ')[0], type: 'صلاة', title: p.name, color: [39, 174, 96] })));
        if (data.appointments) timelineItems.push(...data.appointments.map(a => ({ time: a.time, type: 'موعد', title: a.title, color: [142, 68, 173] })));

        // Sort by time
        timelineItems.sort((a, b) => a.time.localeCompare(b.time));

        autoTable(doc, {
            startY: yPos,
            head: [['النشاط', 'النوع', 'الوقت']],
            body: timelineItems.map(i => [i.title, i.type, i.time]),
            theme: 'grid',
            styles: { halign: 'right' },
            columnStyles: {
                0: { cellWidth: 'auto' }, // Activity
                2: { cellWidth: 30, fontStyle: 'bold' } // Time
            },
            didParseCell: function (data) {
                // Color coding rows based on type
                if (data.section === 'body') {
                    const type = data.row.raw[1];
                    if (type === 'صلاة') {
                        data.cell.styles.textColor = [39, 174, 96];
                    } else if (type === 'موعد') {
                        data.cell.styles.textColor = [142, 68, 173];
                    }
                }
            }
        });
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`صفحة ${i} من ${pageCount}`, 105, 290, { align: 'center' });
        doc.text('تم التوليد بواسطة تطبيق بركة', 10, 290, { align: 'left' });
    }

    doc.save(`barakah-report-${new Date().toISOString().split('T')[0]}.pdf`);
};
