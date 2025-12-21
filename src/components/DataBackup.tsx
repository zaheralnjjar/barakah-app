import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TABLES } from '@/lib/tableNames';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, FileJson, Shield, Loader2, Share2, CheckCircle } from 'lucide-react';
import { Share } from '@capacitor/share';

const DataBackup: React.FC = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [lastBackup, setLastBackup] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        const saved = localStorage.getItem('baraka_last_backup');
        if (saved) setLastBackup(saved);
    }, []);

    const exportData = async () => {
        setIsExporting(true);
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error('يجب تسجيل الدخول أولاً');

            // Fetch available data
            const [finance, logistics] = await Promise.all([
                supabase.from(TABLES.finance).select('*').eq('user_id', user.id).single(),
                supabase.from(TABLES.logistics).select('*').eq('user_id', user.id).single(),
            ]);

            // Also get appointments
            const { data: appointments } = await supabase.from('appointments').select('*').eq('user_id', user.id);

            const backupData = {
                version: '2.0',
                exportDate: new Date().toISOString(),
                userId: user.id,
                data: {
                    finance: finance.data,
                    logistics: logistics.data,
                    appointments: appointments || [],
                }
            };

            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `baraka-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            // Save last backup time
            const now = new Date().toISOString();
            localStorage.setItem('baraka_last_backup', now);
            setLastBackup(now);

            toast({ title: 'تم التصدير بنجاح ✅', description: 'تم تحميل ملف النسخة الاحتياطية' });
        } catch (error: any) {
            toast({ title: 'خطأ في التصدير', description: error.message, variant: 'destructive' });
        } finally {
            setIsExporting(false);
        }
    };

    const shareBackup = async () => {
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error('يجب تسجيل الدخول أولاً');

            const [finance, logistics] = await Promise.all([
                supabase.from(TABLES.finance).select('*').eq('user_id', user.id).single(),
                supabase.from(TABLES.logistics).select('*').eq('user_id', user.id).single(),
            ]);

            const summary = `نسخة احتياطية - بركة
التاريخ: ${new Date().toLocaleDateString('ar')}
الرصيد: ${finance.data?.balance || 0}
المواقع: ${logistics.data?.locations?.length || 0}`;

            await Share.share({ title: 'نسخة احتياطية - بركة', text: summary, dialogTitle: 'مشاركة الملخص' });
        } catch (e) {
            toast({ title: 'تعذرت المشاركة' });
        }
    };

    const importData = async (file: File) => {
        setIsImporting(true);
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error('يجب تسجيل الدخول أولاً');

            const content = await file.text();
            const importedData = JSON.parse(content);

            if (!importedData.version || !importedData.data) {
                throw new Error('ملف غير صالح');
            }

            const updates = [];

            if (importedData.data.finance) {
                updates.push(supabase.from(TABLES.finance).upsert({ ...importedData.data.finance, user_id: user.id, updated_at: new Date().toISOString() }));
            }
            if (importedData.data.logistics) {
                updates.push(supabase.from(TABLES.logistics).upsert({ ...importedData.data.logistics, user_id: user.id, updated_at: new Date().toISOString() }));
            }

            await Promise.all(updates);

            toast({ title: 'تم الاستيراد بنجاح ✅', description: 'تم استعادة البيانات' });
            setTimeout(() => window.location.reload(), 1500);
        } catch (error: any) {
            toast({ title: 'خطأ في الاستيراد', description: error.message, variant: 'destructive' });
        } finally {
            setIsImporting(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) importData(file);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="arabic-title text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    النسخ الاحتياطي والاستعادة
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Last Backup Info */}
                {lastBackup && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                            <p className="text-sm font-medium text-green-700">آخر نسخة احتياطية</p>
                            <p className="text-xs text-green-600">{new Date(lastBackup).toLocaleString('ar-u-nu-latn')}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                    <Button onClick={exportData} disabled={isExporting} variant="outline" className="h-auto py-4 flex flex-col gap-2">
                        {isExporting ? <Loader2 className="w-8 h-8 animate-spin text-primary" /> : <Download className="w-8 h-8 text-green-500" />}
                        <span className="font-medium text-sm">تصدير</span>
                    </Button>

                    <Button onClick={() => fileInputRef.current?.click()} disabled={isImporting} variant="outline" className="h-auto py-4 flex flex-col gap-2">
                        {isImporting ? <Loader2 className="w-8 h-8 animate-spin text-primary" /> : <Upload className="w-8 h-8 text-blue-500" />}
                        <span className="font-medium text-sm">استيراد</span>
                    </Button>

                    <Button onClick={shareBackup} variant="outline" className="h-auto py-4 flex flex-col gap-2">
                        <Share2 className="w-8 h-8 text-purple-500" />
                        <span className="font-medium text-sm">مشاركة</span>
                    </Button>
                </div>

                <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />

                <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <FileJson className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <p className="arabic-body text-xs text-yellow-700">ملفات JSON. احتفظ بها آمنة.</p>
                </div>
            </CardContent>
        </Card>
    );
};

export default DataBackup;
