import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

const shareExcelFile = async (fileName: string, base64Data: string, title: string) => {
    try {
        await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache,
        });

        const uriResult = await Filesystem.getUri({
            directory: Directory.Cache,
            path: fileName,
        });

        await Share.share({
            title: title,
            url: uriResult.uri,
            dialogTitle: title,
        });
        return true;

    } catch (e) {
        console.error('File share error:', e);
        // Fallback: try sharing as text if file fails (unlikely for Excel but good safety)
        return false;
    }
};

export const exportFinanceToExcel = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('يرجى تسجيل الدخول');

    const { data } = await supabase
        .from('finance_data_2025_12_18_18_42')
        .select('pending_expenses')
        .eq('user_id', user.id)
        .single();

    const transactions = data?.pending_expenses || [];

    // Prepare data for Excel
    const excelData = transactions.map((t: any) => ({
        'التاريخ': t.timestamp?.split('T')[0] || '',
        'النوع': t.type === 'income' ? 'دخل' : 'مصروف',
        'الوصف': t.description || '',
        'المبلغ': t.amount || 0,
        'العملة': t.currency || 'ARS',
        'الفئة': t.category || '',
    }));

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المعاملات المالية');

    // Generate file
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

    // Share File
    const fileName = `finance_report_${new Date().getTime()}.xlsx`;
    const shared = await shareExcelFile(fileName, wbout, 'مشاركة التقرير المالي');

    if (!shared) {
        // Create text summary for fallback sharing
        const totalIncome = transactions
            .filter((t: any) => t.type === 'income')
            .reduce((a: number, t: any) => a + (t.amount || 0), 0);
        const totalExpense = transactions
            .filter((t: any) => t.type === 'expense')
            .reduce((a: number, t: any) => a + (t.amount || 0), 0);

        const summary = `📊 التقرير المالي\n💰 إجمالي الدخل: ${totalIncome.toLocaleString()}\n💸 إجمالي المصروفات: ${totalExpense.toLocaleString()}\n💵 الصافي: ${(totalIncome - totalExpense).toLocaleString()}\n\nعدد المعاملات: ${transactions.length}\n✨ نظام بركة لإدارة الحياة`;

        await Share.share({
            title: 'التقرير المالي',
            text: summary,
            dialogTitle: 'مشاركة التقرير المالي'
        });
    }

    return { success: true, data: wbout };
};

export const exportAppointmentsToExcel = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('يرجى تسجيل الدخول');

    const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

    const appointments = data || [];

    const excelData = appointments.map((a: any) => ({
        'التاريخ': a.date || '',
        'الوقت': a.time || '',
        'العنوان': a.title || '',
        'الملاحظات': a.notes || '',
        'الحالة': a.is_completed ? 'مكتمل' : 'معلق',
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المواعيد');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

    const fileName = `appointments_report_${new Date().getTime()}.xlsx`;
    const shared = await shareExcelFile(fileName, wbout, 'مشاركة تقرير المواعيد');

    if (!shared) {
        const summary = `📅 تقرير المواعيد\nإجمالي المواعيد: ${appointments.length}\nالمكتملة: ${appointments.filter((a: any) => a.is_completed).length}\nالمعلقة: ${appointments.filter((a: any) => !a.is_completed).length}\n\n✨ نظام بركة لإدارة الحياة`;
        await Share.share({
            title: 'تقرير المواعيد',
            text: summary,
            dialogTitle: 'مشاركة تقرير المواعيد'
        });
    }

    return { success: true, data: wbout };
};
