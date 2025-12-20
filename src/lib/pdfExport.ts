import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { FinanceData, Task, Appointment } from '@/stores/useAppStore';

declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

/**
 * Generate Financial Report PDF
 */
export const generateFinancialReport = (finances: FinanceData, month?: string) => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text('Financial Report', 105, 20, { align: 'center' });

    if (month) {
        doc.setFontSize(12);
        doc.text(month, 105, 30, { align: 'center' });
    }

    // Summary
    doc.setFontSize(14);
    doc.text('Summary', 20, 45);

    doc.setFontSize(11);
    doc.text(`Balance: ${finances.balance} ${finances.currency}`, 20, 55);
    doc.text(`Monthly Budget: ${finances.monthlyBudget} ${finances.currency}`, 20, 62);
    doc.text(`Exchange Rate: ${finances.exchangeRate}`, 20, 69);

    // Expenses Table
    doc.setFontSize(14);
    doc.text('Expenses', 20, 85);

    const expenseData = finances.expenses.map(e => [
        e.date,
        e.description,
        `${e.amount} ${e.currency}`,
        e.category || '-',
    ]);

    doc.autoTable({
        head: [['Date', 'Description', 'Amount', 'Category']],
        body: expenseData,
        startY: 90,
        theme: 'grid',
        headStyles: { fillColor: [220, 53, 69] },
    });

    // Income Table
    const finalY = (doc as any).lastAutoTable.finalY || 90;
    doc.setFontSize(14);
    doc.text('Income', 20, finalY + 15);

    const incomeData = finances.income.map(i => [
        i.date,
        i.description,
        `${i.amount} ${i.currency}`,
    ]);

    doc.autoTable({
        head: [['Date', 'Description', 'Amount']],
        body: incomeData,
        startY: finalY + 20,
        theme: 'grid',
        headStyles: { fillColor: [40, 167, 69] },
    });

    // Footer
    doc.setFontSize(8);
    doc.text(
        `Generated on ${new Date().toLocaleDateString()}`,
        105,
        285,
        { align: 'center' }
    );

    // Save
    doc.save(`financial-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Generate Tasks Report PDF
 */
export const generateTasksReport = (tasks: Task[]) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Tasks Report', 105, 20, { align: 'center' });

    const completed = tasks.filter(t => t.completed);
    const pending = tasks.filter(t => !t.completed);

    doc.setFontSize(12);
    doc.text(`Total: ${tasks.length} | Completed: ${completed.length} | Pending: ${pending.length}`, 105, 30, { align: 'center' });

    // Tasks Table
    const taskData = tasks.map(t => [
        t.title,
        t.type,
        t.priority,
        t.deadline,
        `${t.progress}%`,
        t.completed ? 'Yes' : 'No',
    ]);

    doc.autoTable({
        head: [['Title', 'Type', 'Priority', 'Deadline', 'Progress', 'Done']],
        body: taskData,
        startY: 40,
        theme: 'striped',
        headStyles: { fillColor: [13, 110, 253] },
    });

    doc.setFontSize(8);
    doc.text(
        `Generated on ${new Date().toLocaleDateString()}`,
        105,
        285,
        { align: 'center' }
    );

    doc.save(`tasks-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Generate Appointments Report PDF
 */
export const generateAppointmentsReport = (appointments: Appointment[]) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Appointments Report', 105, 20, { align: 'center' });

    const appointmentData = appointments.map(a => [
        a.title,
        a.date,
        a.time,
        a.location || '-',
        a.isCompleted ? 'Done' : 'Upcoming',
    ]);

    doc.autoTable({
        head: [['Title', 'Date', 'Time', 'Location', 'Status']],
        body: appointmentData,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [111, 66, 193] },
    });

    doc.setFontSize(8);
    doc.text(
        `Generated on ${new Date().toLocaleDateString()}`,
        105,
        285,
        { align: 'center' }
    );

    doc.save(`appointments-report-${new Date().toISOString().split('T')[0]}.pdf`);
};
