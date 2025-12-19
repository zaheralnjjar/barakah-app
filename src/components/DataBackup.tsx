import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TABLES } from '@/lib/tableNames';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, FileJson, Shield, Loader2 } from 'lucide-react';

const DataBackup: React.FC = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const exportData = async () => {
        setIsExporting(true);
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error('يجب تسجيل الدخول أولاً');

            // Fetch all data from all tables
            const [finance, logistics, spiritual, academic, system, legislation, psychosocial, health] = await Promise.all([
                supabase.from(TABLES.finance).select('*').eq('user_id', user.id).single(),
                supabase.from(TABLES.logistics).select('*').eq('user_id', user.id).single(),
                supabase.from(TABLES.spiritual).select('*').eq('user_id', user.id).single(),
                supabase.from(TABLES.academic).select('*').eq('user_id', user.id).single(),
                supabase.from(TABLES.system).select('*').eq('user_id', user.id).single(),
                supabase.from(TABLES.legislation).select('*').eq('user_id', user.id).single(),
                supabase.from(TABLES.psychosocial).select('*').eq('user_id', user.id).single(),
                supabase.from(TABLES.health).select('*').eq('user_id', user.id).single(),
            ]);

            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                userId: user.id,
                data: {
                    finance: finance.data,
                    logistics: logistics.data,
                    spiritual: spiritual.data,
                    academic: academic.data,
                    system: system.data,
                    legislation: legislation.data,
                    psychosocial: psychosocial.data,
                    health: health.data,
                }
            };

            // Create and download file
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `baraka-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast({
                title: 'تم التصدير بنجاح',
                description: 'تم تحميل ملف النسخة الاحتياطية',
            });
        } catch (error: any) {
            toast({
                title: 'خطأ في التصدير',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsExporting(false);
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

            // Update all tables with imported data
            const updates = [];

            if (importedData.data.finance) {
                updates.push(
                    supabase.from(TABLES.finance).upsert({
                        ...importedData.data.finance,
                        user_id: user.id,
                        updated_at: new Date().toISOString(),
                    })
                );
            }

            if (importedData.data.logistics) {
                updates.push(
                    supabase.from(TABLES.logistics).upsert({
                        ...importedData.data.logistics,
                        user_id: user.id,
                        updated_at: new Date().toISOString(),
                    })
                );
            }

            if (importedData.data.spiritual) {
                updates.push(
                    supabase.from(TABLES.spiritual).upsert({
                        ...importedData.data.spiritual,
                        user_id: user.id,
                        updated_at: new Date().toISOString(),
                    })
                );
            }

            if (importedData.data.academic) {
                updates.push(
                    supabase.from(TABLES.academic).upsert({
                        ...importedData.data.academic,
                        user_id: user.id,
                        updated_at: new Date().toISOString(),
                    })
                );
            }

            if (importedData.data.health) {
                updates.push(
                    supabase.from(TABLES.health).upsert({
                        ...importedData.data.health,
                        user_id: user.id,
                        updated_at: new Date().toISOString(),
                    })
                );
            }

            await Promise.all(updates);

            toast({
                title: 'تم الاستيراد بنجاح',
                description: 'تم استعادة البيانات من النسخة الاحتياطية',
            });

            // Reload page to reflect changes
            setTimeout(() => window.location.reload(), 1500);
        } catch (error: any) {
            toast({
                title: 'خطأ في الاستيراد',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsImporting(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            importData(file);
        }
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
                <p className="arabic-body text-sm text-muted-foreground">
                    قم بتصدير بياناتك للحفاظ عليها أو استعادتها من نسخة احتياطية سابقة.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                        onClick={exportData}
                        disabled={isExporting}
                        variant="outline"
                        className="h-auto py-4 flex flex-col gap-2 arabic-body"
                    >
                        {isExporting ? (
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        ) : (
                            <Download className="w-8 h-8 text-green-500" />
                        )}
                        <span>تصدير البيانات</span>
                        <span className="text-xs text-muted-foreground">تحميل ملف JSON</span>
                    </Button>

                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImporting}
                        variant="outline"
                        className="h-auto py-4 flex flex-col gap-2 arabic-body"
                    >
                        {isImporting ? (
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        ) : (
                            <Upload className="w-8 h-8 text-blue-500" />
                        )}
                        <span>استيراد البيانات</span>
                        <span className="text-xs text-muted-foreground">استعادة من ملف</span>
                    </Button>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <FileJson className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <p className="arabic-body text-xs text-yellow-700">
                        ملفات النسخ الاحتياطي بصيغة JSON. احتفظ بها في مكان آمن.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default DataBackup;
