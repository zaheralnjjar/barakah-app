import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { toast } from '@/hooks/use-toast';
import { AmiriFontBase64 } from './AmiriFont';
import { translations } from '@/hooks/useHidayaTranslation';
// @ts-ignore - arabic-reshaper doesn't have types
import ArabicReshaper from 'arabic-reshaper';

type Language = 'ar' | 'es';

const getT = (lang: Language) => (key: string) => translations[lang]?.[key] || key;

// Helper function to reshape Arabic text for correct PDF rendering
// Note: We only reshape Arabic characters for ligatures, no reversal needed
// jsPDF with Amiri font handles RTL direction correctly
const reshapeArabic = (text: string): string => {
    if (!text) return text;
    try {
        // Only reshape Arabic ligatures, don't reverse
        // The PDF library with Amiri font handles RTL direction
        return ArabicReshaper.convertArabic(text);
    } catch (e) {
        console.warn('Arabic reshaping failed:', e);
        return text;
    }
};


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

const saveAndSharePDF = async (doc: jsPDF, filename: string) => {
    try {
        if (Capacitor.isNativePlatform()) {
            const base64Data = doc.output('datauristring').split(',')[1];
            await Filesystem.writeFile({
                path: filename,
                data: base64Data,
                directory: Directory.Cache
            });
            const uriResult = await Filesystem.getUri({
                directory: Directory.Cache,
                path: filename
            });
            await Share.share({
                title: 'مشاركة ملف PDF',
                text: 'إليك الملف المطلوب',
                url: uriResult.uri,
                dialogTitle: 'مشاركة الملف'
            });
        } else {
            doc.save(filename);
            toast({ title: "تم التحميل", description: "تم حفظ الملف بنجاح" });
        }
    } catch (e) {
        console.error("PDF Share Error", e);
        doc.save(filename);
        toast({ title: "تنبيه", description: "تم استخدام الحفظ التقليدي" });
    }
};

export const generatePDF = (
    viewType: 'table' | 'timeline',
    data: PrintData,
    dateRange: string,
    lang: Language = 'ar'
) => {
    const t = getT(lang);
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true
    });

    // Add Arabic Font
    doc.addFileToVFS("Amiri-Regular.ttf", AmiriFontBase64);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.setFont("Amiri"); // Set as default

    // Header
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185); // Blue
    doc.text(t('report_title'), 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`${t('period')}: ${dateRange}`, 105, 30, { align: 'center' });

    let yPos = 40;

    if (viewType === 'table') {
        // --- Table View ---

        // 1. Prayer Times
        if (data.prayerTimes && data.prayerTimes.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(39, 174, 96); // Green
            doc.text(t('prayer_times'), 180, yPos, { align: 'right' });
            yPos += 5;

            autoTable(doc, {
                startY: yPos,
                head: [['الوقت', 'الصلاة']],
                body: data.prayerTimes.map(p => [p.time, p.name]),
                theme: 'striped',
                headStyles: { fillColor: [39, 174, 96], font: 'Amiri' }, // Green
                styles: { halign: 'right', font: 'Amiri' }, // Font fixed
                margin: { top: 10 }
            });
            yPos = (doc as any).lastAutoTable.finalY + 15;
        }

        // 2. Appointments
        if (data.appointments && data.appointments.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(142, 68, 173); // Purple
            doc.text(t('appointments'), 180, yPos, { align: 'right' });
            yPos += 5;

            autoTable(doc, {
                startY: yPos,
                head: [['التفاصيل', 'الوقت', 'العنوان']],
                body: data.appointments.map(a => [a.details || '-', a.time, a.title]),
                theme: 'grid',
                headStyles: { fillColor: [142, 68, 173], font: 'Amiri' }, // Purple
                styles: { halign: 'right', font: 'Amiri' },
            });
            yPos = (doc as any).lastAutoTable.finalY + 15;
        }

        // 3. Tasks
        if (data.tasks && data.tasks.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(41, 128, 185); // Blue
            doc.text(t('tasks'), 180, yPos, { align: 'right' });
            yPos += 5;

            autoTable(doc, {
                startY: yPos,
                head: [['الحالة', 'الأولوية', 'المهمة']],
                body: data.tasks.map(t => [t.status || 'معلق', t.priority, t.title]),
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185], font: 'Amiri' }, // Blue
                styles: { halign: 'right', font: 'Amiri' },
            });
            yPos = (doc as any).lastAutoTable.finalY + 15;
        }

        // 4. Shopping
        if (data.shopping && data.shopping.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(211, 84, 0); // Orange
            doc.text(t('shopping'), 180, yPos, { align: 'right' });
            yPos += 5;

            autoTable(doc, {
                startY: yPos,
                head: [['الكمية', 'الصنف']],
                body: data.shopping.map(s => [s.quantity || '1', s.name]),
                theme: 'grid',
                headStyles: { fillColor: [211, 84, 0], font: 'Amiri' }, // Orange
                styles: { halign: 'right', font: 'Amiri' },
            });
            yPos = (doc as any).lastAutoTable.finalY + 15;
        }

        // 5. Expenses
        if (data.expenses && data.expenses.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(192, 57, 43); // Red
            doc.text(t('expenses'), 180, yPos, { align: 'right' });
            yPos += 5;

            autoTable(doc, {
                startY: yPos,
                head: [['المبلغ', 'البند']],
                body: data.expenses.map(e => [e.amount, e.category]),
                theme: 'striped',
                headStyles: { fillColor: [192, 57, 43], font: 'Amiri' }, // Red
                styles: { halign: 'right', font: 'Amiri' },
            });
            yPos = (doc as any).lastAutoTable.finalY + 15;
        }

    } else {
        // --- Timeline View (Hours) ---
        doc.setFontSize(14);
        doc.text(t('unified_timeline'), 180, yPos, { align: 'right' });
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
            headStyles: { font: 'Amiri' },
            styles: { halign: 'right', font: 'Amiri' },
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
        doc.text(`${t('page')} ${i} ${t('of')} ${pageCount}`, 105, 290, { align: 'center' });
        doc.text(t('generated_by'), 10, 290, { align: 'left' });
    }

    saveAndSharePDF(doc, `barakah-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateStudentReport = (students: any[], lang: Language = 'ar') => {
    const t = getT(lang);
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    // Add Arabic Font
    doc.addFileToVFS("Amiri-Regular.ttf", AmiriFontBase64);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.setFont("Amiri");

    // Title
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185);
    doc.text(t('student_report'), 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`${t('report_date')}: ${new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'es-ES')}`, 105, 30, { align: 'center' });

    autoTable(doc, {
        startY: 40,
        head: [[t('status'), t('phone'), t('student'), '#']],
        body: students.map((s, idx) => [
            s.status || t('active'),
            s.phone || '-',
            lang === 'ar' ? (s.arabicName || s.fullName) : (s.fullName || s.arabicName),
            idx + 1
        ]),
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], halign: lang === 'ar' ? 'right' : 'left', font: 'Amiri' },
        styles: { halign: lang === 'ar' ? 'right' : 'left', font: 'Amiri' },
        columnStyles: {
            3: { cellWidth: 15 } // Count column
        }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`صفحة ${i} من ${pageCount}`, 105, 290, { align: 'center' });
    }

    saveAndSharePDF(doc, `students-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateStudentProfile = (student: any, communications: any[], lessons: any[], lang: Language = 'ar') => {
    const t = getT(lang);
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    // Add Arabic Font
    doc.addFileToVFS("Amiri-Regular.ttf", AmiriFontBase64);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.setFont("Amiri");

    let yPos = 20;

    // --- Header ---
    doc.setFillColor(245, 247, 250);
    doc.rect(0, 0, 210, 50, 'F');

    doc.setFontSize(24);
    doc.setTextColor(44, 62, 80);
    doc.text(lang === 'ar' ? (student.arabicName || student.fullName) : (student.fullName || student.arabicName), 190, 30, { align: 'right' });

    doc.setFontSize(14);
    doc.setTextColor(127, 140, 141);
    doc.text(student.status || 'Active', 190, 40, { align: 'right' });

    yPos = 60;

    // --- Personal Info ---
    doc.setFontSize(16);
    doc.setTextColor(41, 128, 185);
    doc.text(t('personal_info'), 190, yPos, { align: 'right' });
    doc.setDrawColor(41, 128, 185);
    doc.line(20, yPos + 2, 190, yPos + 2);
    yPos += 15;

    const info = [
        [t('phone'), student.phone || '-'],
        [t('nationality'), student.nationality || '-'],
        [t('conversion_date'), student.conversionDate || '-'],
        [t('address'), student.address || '-'],
        [t('occupation'), student.occupation || '-'],
        [t('education'), student.education || '-']
    ];

    autoTable(doc, {
        startY: yPos,
        body: info,
        theme: 'plain',
        styles: { halign: 'right', fontSize: 12, font: 'Amiri' },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 50, textColor: [52, 73, 94] }
        }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // --- Communications ---
    if (communications && communications.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(39, 174, 96); // Green for communications
        doc.text(t('communications_log'), 190, yPos, { align: 'right' });
        doc.setDrawColor(39, 174, 96);
        doc.line(20, yPos + 2, 190, yPos + 2);
        yPos += 10;

        autoTable(doc, {
            startY: yPos,
            head: [[t('notes'), t('direction'), t('type'), t('time')]],
            body: communications.map(c => [
                c.content,
                c.direction === 'sent' ? 'Sent' : 'Received',
                c.type,
                c.date ? new Date(c.date).toLocaleDateString() : '-'
            ]),
            theme: 'grid',
            headStyles: { fillColor: [39, 174, 96], halign: 'right', font: 'Amiri' },
            styles: { halign: 'right', font: 'Amiri' }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // --- Lessons ---
    if (lessons && lessons.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(142, 68, 173); // Purple
        doc.text(t('lessons_log'), 190, yPos, { align: 'right' });
        doc.setDrawColor(142, 68, 173);
        doc.line(20, yPos + 2, 190, yPos + 2);
        yPos += 10;

        autoTable(doc, {
            startY: yPos,
            head: [[t('attended'), t('teacher'), t('topic'), t('time')]],
            body: lessons.map(l => [
                l.attended ? t('attended') : (l.attended === false ? t('absent') : '-'),
                l.teacher,
                l.topic,
                l.date
            ]),
            theme: 'striped',
            headStyles: { fillColor: [142, 68, 173], halign: 'right', font: 'Amiri' },
            styles: { halign: 'right', font: 'Amiri' }
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

    saveAndSharePDF(doc, `${student.fullName}-profile.pdf`);
};

export const generateProtocolPDF = (protocol: any, studentName?: string, lang: Language = 'ar') => {
    const t = getT(lang);
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    // Add Arabic Font
    doc.addFileToVFS("Amiri-Regular.ttf", AmiriFontBase64);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.setFont("Amiri");

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 167, 69); // Green
    doc.text(t('education_plan'), 105, 20, { align: 'center' });

    if (studentName) {
        doc.setFontSize(14);
        doc.setTextColor(100);
        doc.text(`${t('student')}: ${studentName}`, 105, 30, { align: 'center' });
    }

    doc.setFontSize(10);
    doc.text(`${t('report_date')}: ${new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'es-ES')}`, 105, 40, { align: 'center' });

    let yPos = 50;

    // Stages
    if (protocol && protocol.stages) {
        protocol.stages.forEach((stage: any) => {
            // Stage Title
            doc.setFillColor(240, 240, 240);
            doc.rect(14, yPos - 5, 182, 10, 'F');
            doc.setFontSize(14);
            doc.setTextColor(0);
            const stageTitle = lang === 'ar' ? reshapeArabic(stage.name) : stage.name;
            doc.text(stageTitle, 190, yPos + 2, { align: 'right' });
            yPos += 10;

            if (stage.items && stage.items.length > 0) {
                const body = stage.items.map((item: any) => [
                    item.deadline || '-',
                    lang === 'ar' ? reshapeArabic(item.name) : item.name
                ]);

                autoTable(doc, {
                    startY: yPos,
                    head: [[t('deadline'), t('task')]],
                    body: body,
                    theme: 'grid',
                    headStyles: { fillColor: [40, 167, 69], halign: 'right', font: 'Amiri' },
                    styles: { halign: 'right', font: 'Amiri' },
                    margin: { left: 14, right: 14 }
                });

                yPos = (doc as any).lastAutoTable.finalY + 15;
            } else {
                doc.setFontSize(10);
                doc.setTextColor(150);
                doc.text(t('no_tasks'), 190, yPos + 5, { align: 'right' });
                yPos += 15;
            }

            // Page break check
            if (yPos > 250) {
                doc.addPage();
                yPos = 30;
            }
        });
    }

    saveAndSharePDF(doc, `education-plan-${studentName || 'general'}.pdf`);
};

// Generate Islam Conversion Certificate as PDF
export const generateCertificatePDF = (data: {
    name: string;
    date: string;
    sheikh?: string;
}, lang: Language = 'ar') => {
    const t = getT(lang);
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    // Add Arabic Font
    doc.addFileToVFS("Amiri-Regular.ttf", AmiriFontBase64);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
    doc.setFont("Amiri");

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Background gradient effect - light green
    doc.setFillColor(240, 253, 244);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Double border frame
    doc.setDrawColor(16, 185, 129); // Emerald
    doc.setLineWidth(2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    doc.setLineWidth(0.5);
    doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

    // Decorative corner elements
    doc.setFillColor(16, 185, 129);
    doc.circle(20, 20, 3, 'F');
    doc.circle(pageWidth - 20, 20, 3, 'F');
    doc.circle(20, pageHeight - 20, 3, 'F');
    doc.circle(pageWidth - 20, pageHeight - 20, 3, 'F');

    let yPos = 30;

    // Center Name
    doc.setFontSize(14);
    doc.setTextColor(5, 150, 105);
    doc.text("🕌 Centro Cultural Islámico Rey Fahd", pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text("República Argentina - Buenos Aires", pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;

    // Bismillah
    doc.setFontSize(20);
    doc.setTextColor(5, 150, 105);
    const bismillah = lang === 'ar' ? reshapeArabic("بسم الله الرحمن الرحيم") : "بسم الله الرحمن الرحيم";
    doc.text(bismillah, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Title
    doc.setFontSize(28);
    doc.setTextColor(16, 185, 129);
    const title = lang === 'ar' ? reshapeArabic("شهادة اعتناق الإسلام") : "CERTIFICADO DE CONVERSIÓN AL ISLAM";
    doc.text(title, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Body text
    doc.setFontSize(14);
    doc.setTextColor(55, 65, 81);
    const certifyText = lang === 'ar'
        ? reshapeArabic("نشهد بأن")
        : "Por medio del presente se certifica que";
    doc.text(certifyText, pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;

    // Name (highlighted)
    doc.setFontSize(26);
    doc.setTextColor(16, 185, 129);
    const displayName = lang === 'ar' ? reshapeArabic(data.name) : data.name;
    doc.text(displayName, pageWidth / 2, yPos, { align: 'center' });

    // Underline for name
    const nameWidth = doc.getTextWidth(displayName);
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - nameWidth / 2 - 10, yPos + 3, pageWidth / 2 + nameWidth / 2 + 10, yPos + 3);
    yPos += 15;

    // Embraced Islam text
    doc.setFontSize(14);
    doc.setTextColor(55, 65, 81);
    const embracedText = lang === 'ar'
        ? reshapeArabic("قد اعتنق الإسلام ونطق بالشهادتين")
        : "ha pronunciado la Shahada (Testimonio de Fe) y ha abrazado el Islam";
    doc.text(embracedText, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Shahada box
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(16, 185, 129);
    doc.roundedRect(pageWidth / 2 - 80, yPos - 2, 160, 18, 3, 3, 'FD');

    doc.setFontSize(16);
    doc.setTextColor(31, 41, 55);
    const shahada = reshapeArabic("أشهد أن لا إله إلا الله وأشهد أن محمداً عبده ورسوله");
    doc.text(shahada, pageWidth / 2, yPos + 10, { align: 'center' });
    yPos += 25;

    // Spanish translation of Shahada
    doc.setFontSize(11);
    doc.setTextColor(107, 114, 128);
    doc.text("\"Atestiguo que no hay más dios que Alá y atestiguo que Muhammad es Su siervo y Mensajero\"", pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Details section - Date and Sheikh
    const detailsY = yPos;

    // Date
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(lang === 'ar' ? reshapeArabic("تاريخ الإسلام") : "Fecha de Conversión", pageWidth / 3, detailsY, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55);
    const formattedDate = new Date(data.date).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'es-AR', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.text(formattedDate, pageWidth / 3, detailsY + 7, { align: 'center' });

    // Sheikh
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(lang === 'ar' ? reshapeArabic("الشيخ المشهّد") : "Testigo / Sheikh", 2 * pageWidth / 3, detailsY, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55);
    const sheikhName = data.sheikh
        ? (lang === 'ar' ? reshapeArabic(data.sheikh) : data.sheikh)
        : (lang === 'ar' ? reshapeArabic("غير محدد") : "No especificado");
    doc.text(sheikhName, 2 * pageWidth / 3, detailsY + 7, { align: 'center' });
    yPos = detailsY + 20;

    // Signature lines
    doc.setDrawColor(55, 65, 81);
    doc.setLineWidth(0.3);

    // Left signature
    doc.line(40, pageHeight - 30, 100, pageHeight - 30);
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(lang === 'ar' ? reshapeArabic("توقيع المهتدي") : "Firma del Converso", 70, pageHeight - 25, { align: 'center' });

    // Right signature
    doc.line(pageWidth - 100, pageHeight - 30, pageWidth - 40, pageHeight - 30);
    doc.text(lang === 'ar' ? reshapeArabic("توقيع الشاهد") : "Firma del Testigo", pageWidth - 70, pageHeight - 25, { align: 'center' });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
        lang === 'ar'
            ? reshapeArabic("صادرة عن مركز هداية للمسلمين الجدد")
            : "Emitido por Centro Hidaya para Nuevos Musulmanes",
        pageWidth / 2,
        pageHeight - 15,
        { align: 'center' }
    );

    saveAndSharePDF(doc, `certificate-${data.name.replace(/\s+/g, '-')}.pdf`);
};
