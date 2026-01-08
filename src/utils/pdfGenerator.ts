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

export const generateStudentReport = (students: any[]) => {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    // Title
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185);
    doc.text('تقرير الطلاب - مركز بركة', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}`, 105, 30, { align: 'center' });

    autoTable(doc, {
        startY: 40,
        head: [['الحالة', 'رقم الهاتف', 'الاسم العربي', 'الاسم', 'م']],
        body: students.map((s, idx) => [
            s.status || 'نشط',
            s.phone || '-',
            s.arabicName || '-',
            s.fullName || '-',
            idx + 1
        ]),
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], halign: 'right' },
        styles: { halign: 'right', font: 'helvetica' },
        columnStyles: {
            4: { cellWidth: 15 } // Count column
        }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`صفحة ${i} من ${pageCount}`, 105, 290, { align: 'center' });
    }

    doc.save(`students-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateStudentProfile = (student: any, communications: any[], lessons: any[]) => {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    let yPos = 20;

    // --- Header ---
    doc.setFillColor(245, 247, 250);
    doc.rect(0, 0, 210, 50, 'F');

    doc.setFontSize(24);
    doc.setTextColor(44, 62, 80);
    doc.text(student.arabicName || student.fullName, 190, 30, { align: 'right' });

    doc.setFontSize(14);
    doc.setTextColor(127, 140, 141);
    doc.text(student.status || 'Active', 190, 40, { align: 'right' });

    yPos = 60;

    // --- Personal Info ---
    doc.setFontSize(16);
    doc.setTextColor(41, 128, 185);
    doc.text('المعلومات الشخصية', 190, yPos, { align: 'right' });
    doc.setDrawColor(41, 128, 185);
    doc.line(20, yPos + 2, 190, yPos + 2);
    yPos += 15;

    const info = [
        ['رقم الهاتف', student.phone || '-'],
        ['الجنسية', student.nationality || '-'],
        ['تاريخ الدخول', student.conversionDate || '-'],
        ['العنوان', student.address || '-'],
        ['المهنة', student.occupation || '-'],
        ['التعليم', student.education || '-']
    ];

    autoTable(doc, {
        startY: yPos,
        body: info,
        theme: 'plain',
        styles: { halign: 'right', fontSize: 12 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 50, textColor: [52, 73, 94] }
        }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // --- Communications ---
    if (communications && communications.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(39, 174, 96); // Green for communications
        doc.text('سجل التواصل', 190, yPos, { align: 'right' });
        doc.setDrawColor(39, 174, 96);
        doc.line(20, yPos + 2, 190, yPos + 2);
        yPos += 10;

        autoTable(doc, {
            startY: yPos,
            head: [['الملاحظات', 'الاتجاه', 'النوع', 'التاريخ']],
            body: communications.map(c => [
                c.content,
                c.direction === 'sent' ? 'صادر' : 'وارد',
                c.type,
                c.date ? new Date(c.date).toLocaleDateString() : '-'
            ]),
            theme: 'grid',
            headStyles: { fillColor: [39, 174, 96], halign: 'right' },
            styles: { halign: 'right' }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // --- Lessons ---
    if (lessons && lessons.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(142, 68, 173); // Purple
        doc.text('سجل الدروس', 190, yPos, { align: 'right' });
        doc.setDrawColor(142, 68, 173);
        doc.line(20, yPos + 2, 190, yPos + 2);
        yPos += 10;

        autoTable(doc, {
            startY: yPos,
            head: [['الحضور', 'المعلم', 'الموضوع', 'التاريخ']],
            body: lessons.map(l => [
                l.attended ? 'حضر' : (l.attended === false ? 'غائب' : '-'),
                l.teacher,
                l.topic,
                l.date
            ]),
            theme: 'striped',
            headStyles: { fillColor: [142, 68, 173], halign: 'right' },
            styles: { halign: 'right' }
        });
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`صفحة ${i} من ${pageCount}`, 105, 290, { align: 'center' });
    }

    doc.save(`${student.fullName}-profile.pdf`);
};

export const generateProtocolPDF = (protocol: any, studentName?: string) => {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 167, 69); // Green
    doc.text('خطة التعليم والمناهج', 105, 20, { align: 'center' });

    if (studentName) {
        doc.setFontSize(14);
        doc.setTextColor(100);
        doc.text(`الطالب: ${studentName}`, 105, 30, { align: 'center' });
    }

    doc.setFontSize(10);
    doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}`, 105, 40, { align: 'center' });

    let yPos = 50;

    // Stages
    if (protocol && protocol.stages) {
        protocol.stages.forEach((stage: any) => {
            // Stage Title
            doc.setFillColor(240, 240, 240);
            doc.rect(14, yPos - 5, 182, 10, 'F');
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text(stage.name, 190, yPos + 2, { align: 'right' });
            yPos += 10;

            if (stage.items && stage.items.length > 0) {
                const body = stage.items.map((item: any) => [
                    item.deadline || '-',
                    item.name
                ]);

                autoTable(doc, {
                    startY: yPos,
                    head: [['الموعد', 'المهمة']],
                    body: body,
                    theme: 'grid',
                    headStyles: { fillColor: [40, 167, 69], halign: 'right' },
                    styles: { halign: 'right', font: 'helvetica' }, // Note: arabic font issue likely
                    margin: { left: 14, right: 14 }
                });

                yPos = (doc as any).lastAutoTable.finalY + 15;
            } else {
                doc.setFontSize(10);
                doc.setTextColor(150);
                doc.text('لا توجد مهام', 190, yPos + 5, { align: 'right' });
                yPos += 15;
            }

            // Page break check
            if (yPos > 250) {
                doc.addPage();
                yPos = 30;
            }
        });
    }

    doc.save(`education-plan-${studentName || 'general'}.pdf`);
};
