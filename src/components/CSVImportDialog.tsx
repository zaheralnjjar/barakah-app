import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileSpreadsheet, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface ImportedRow {
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category?: string;
}

interface CSVImportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CSVImportDialog: React.FC<CSVImportDialogProps> = ({ isOpen, onClose, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ImportedRow[]>([]);
    const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing'>('upload');
    const [columnMapping, setColumnMapping] = useState({
        dateColumn: '',
        descriptionColumn: '',
        amountColumn: '',
        typeColumn: '',
    });
    const [availableColumns, setAvailableColumns] = useState<string[]>([]);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);

        try {
            const data = await readFile(selectedFile);
            if (data.length > 0) {
                setAvailableColumns(Object.keys(data[0]));
                setParsedData(data);
                setStep('mapping');
            }
        } catch (error) {
            toast({
                title: 'خطأ في قراءة الملف',
                description: 'تأكد من صحة تنسيق الملف',
                variant: 'destructive',
            });
        }
    };

    const readFile = (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(sheet);
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(reader.error);
            reader.readAsBinaryString(file);
        });
    };

    const processMapping = () => {
        if (!columnMapping.dateColumn || !columnMapping.amountColumn) {
            toast({
                title: 'حقول مطلوبة',
                description: 'يرجى تحديد عمود التاريخ والمبلغ على الأقل',
                variant: 'destructive',
            });
            return;
        }

        const processed: ImportedRow[] = parsedData.map((row: any) => {
            const rawAmount = parseFloat(String(row[columnMapping.amountColumn]).replace(/[^0-9.-]/g, ''));
            const amount = Math.abs(rawAmount);

            // Determine type
            let type: 'income' | 'expense' = 'expense';
            if (columnMapping.typeColumn && row[columnMapping.typeColumn]) {
                const typeValue = String(row[columnMapping.typeColumn]).toLowerCase();
                if (typeValue.includes('income') || typeValue.includes('دخل') || typeValue.includes('credit')) {
                    type = 'income';
                }
            } else {
                // If no type column, use sign of amount
                type = rawAmount > 0 ? 'income' : 'expense';
            }

            // Parse date
            let dateStr = String(row[columnMapping.dateColumn]);
            try {
                const date = new Date(dateStr);
                dateStr = date.toISOString();
            } catch {
                dateStr = new Date().toISOString();
            }

            return {
                date: dateStr,
                description: row[columnMapping.descriptionColumn] || 'معاملة مستوردة',
                amount,
                type,
            };
        }).filter(row => !isNaN(row.amount) && row.amount > 0);

        setParsedData(processed);
        setStep('preview');
    };

    const handleImport = async () => {
        setImporting(true);
        setStep('importing');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Fetch current finance data
            const { data: financeData, error } = await supabase
                .from('finance_data_2025_12_18_18_42')
                .select('pending_expenses')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            const existingExpenses = financeData?.pending_expenses || [];

            // Add new transactions with 'imported' source marker
            const newTransactions = parsedData.map(row => ({
                id: crypto.randomUUID(),
                amount: row.amount,
                type: row.type,
                description: row.description,
                currency: 'ARS',
                timestamp: row.date,
                status: 'pending',
                source: 'imported', // Mark as imported for differentiation
            }));

            const updatedExpenses = [...existingExpenses, ...newTransactions];

            // Update in database - use update first, then insert as fallback
            const { error: updateError } = await supabase
                .from('finance_data_2025_12_18_18_42')
                .update({
                    pending_expenses: updatedExpenses,
                    last_modified: new Date().toISOString(),
                })
                .eq('user_id', user.id);

            if (updateError) {
                // If update fails (no existing record), try insert
                await supabase
                    .from('finance_data_2025_12_18_18_42')
                    .insert({
                        user_id: user.id,
                        pending_expenses: updatedExpenses,
                        last_modified: new Date().toISOString(),
                    });
            }

            toast({
                title: 'تم الاستيراد بنجاح ✅',
                description: `تم إضافة ${parsedData.length} معاملة`,
            });

            onSuccess();
            handleClose();
        } catch (error) {
            console.error('Import error:', error);
            toast({
                title: 'خطأ في الاستيراد',
                description: 'حدث خطأ أثناء حفظ البيانات',
                variant: 'destructive',
            });
        } finally {
            setImporting(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setParsedData([]);
        setStep('upload');
        setColumnMapping({ dateColumn: '', descriptionColumn: '', amountColumn: '', typeColumn: '' });
        setAvailableColumns([]);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-green-600" />
                        استيراد معاملات من ملف
                    </DialogTitle>
                </DialogHeader>

                {step === 'upload' && (
                    <div className="space-y-4">
                        <div
                            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-green-500 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium mb-2">اسحب الملف هنا أو اضغط للاختيار</p>
                            <p className="text-sm text-gray-500">يدعم ملفات CSV, XLS, XLSX</p>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.xls,.xlsx"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>
                )}

                {step === 'mapping' && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 mb-4">
                            حدد الأعمدة المقابلة من ملفك:
                        </p>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium mb-1">عمود التاريخ *</label>
                                <Select value={columnMapping.dateColumn} onValueChange={(v) => setColumnMapping({ ...columnMapping, dateColumn: v })}>
                                    <SelectTrigger><SelectValue placeholder="اختر العمود" /></SelectTrigger>
                                    <SelectContent>
                                        {availableColumns.map(col => (
                                            <SelectItem key={col} value={col}>{col}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">عمود المبلغ *</label>
                                <Select value={columnMapping.amountColumn} onValueChange={(v) => setColumnMapping({ ...columnMapping, amountColumn: v })}>
                                    <SelectTrigger><SelectValue placeholder="اختر العمود" /></SelectTrigger>
                                    <SelectContent>
                                        {availableColumns.map(col => (
                                            <SelectItem key={col} value={col}>{col}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">عمود الوصف</label>
                                <Select value={columnMapping.descriptionColumn} onValueChange={(v) => setColumnMapping({ ...columnMapping, descriptionColumn: v })}>
                                    <SelectTrigger><SelectValue placeholder="اختياري" /></SelectTrigger>
                                    <SelectContent>
                                        {availableColumns.map(col => (
                                            <SelectItem key={col} value={col}>{col}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">عمود النوع (دخل/مصروف)</label>
                                <Select value={columnMapping.typeColumn} onValueChange={(v) => setColumnMapping({ ...columnMapping, typeColumn: v })}>
                                    <SelectTrigger><SelectValue placeholder="اختياري - يُحدد تلقائياً من الإشارة" /></SelectTrigger>
                                    <SelectContent>
                                        {availableColumns.map(col => (
                                            <SelectItem key={col} value={col}>{col}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={handleClose}>إلغاء</Button>
                            <Button onClick={processMapping}>التالي</Button>
                        </DialogFooter>
                    </div>
                )}

                {step === 'preview' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-600 mb-2">
                            <Check className="w-5 h-5" />
                            <span className="font-medium">تم تحليل {parsedData.length} معاملة</span>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto border rounded-lg">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="p-2 text-right">التاريخ</th>
                                        <th className="p-2 text-right">الوصف</th>
                                        <th className="p-2 text-right">المبلغ</th>
                                        <th className="p-2 text-right">النوع</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedData.slice(0, 10).map((row, i) => (
                                        <tr key={i} className="border-t">
                                            <td className="p-2">{new Date(row.date).toLocaleDateString('ar-EG')}</td>
                                            <td className="p-2 truncate max-w-[150px]">{row.description}</td>
                                            <td className="p-2">{row.amount.toLocaleString()}</td>
                                            <td className="p-2">
                                                <span className={`px-2 py-0.5 rounded text-xs ${row.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {row.type === 'income' ? 'دخل' : 'مصروف'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {parsedData.length > 10 && (
                                <p className="text-center text-gray-500 py-2 text-xs">
                                    ... و {parsedData.length - 10} معاملة أخرى
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setStep('mapping')}>رجوع</Button>
                            <Button onClick={handleImport} disabled={importing}>
                                {importing ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                                استيراد الكل
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {step === 'importing' && (
                    <div className="py-8 text-center">
                        <Loader2 className="w-12 h-12 animate-spin mx-auto text-green-600 mb-4" />
                        <p className="text-lg font-medium">جاري الاستيراد...</p>
                        <p className="text-sm text-gray-500">يرجى الانتظار</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default CSVImportDialog;
