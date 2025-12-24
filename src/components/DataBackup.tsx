import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TABLES } from '@/lib/tableNames';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, FileJson, Shield, Loader2, Share2, CheckCircle, Cloud, Trash2 } from 'lucide-react';
import { Share } from '@capacitor/share';

const DataBackup: React.FC = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [lastBackup, setLastBackup] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // Cloud Backup State
    const [cloudBackups, setCloudBackups] = useState<any[]>([]);
    const [isLoadingCloud, setIsLoadingCloud] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('baraka_last_backup');
        if (saved) setLastBackup(saved);
        loadCloudBackups();
    }, []);

    const loadCloudBackups = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from('backups')
                .select('id, name, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (data) setCloudBackups(data);
        } catch (e) {
            console.error(e);
        }
    };

    const saveToCloud = async () => {
        setIsLoadingCloud(true);
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error('يجب تسجيل الدخول');

            const [finance, logistics] = await Promise.all([
                supabase.from(TABLES.finance).select('*').eq('user_id', user.id).single(),
                supabase.from(TABLES.logistics).select('*').eq('user_id', user.id).single(),
            ]);

            const { data: appointments } = await supabase.from('appointments').select('*').eq('user_id', user.id);

            const backupData = {
                version: '2.0',
                exportDate: new Date().toISOString(),
                userId: user.id,
                data: {
                    finance: finance.data,
                    logistics: logistics.data,
                    appointments: appointments || [],
                    localStorage: {
                        baraka_medications_v2: localStorage.getItem('baraka_medications_v2'),
                        baraka_habits: localStorage.getItem('baraka_habits'),
                        baraka_subscriptions: localStorage.getItem('baraka_subscriptions'),
                        baraka_budgets: localStorage.getItem('baraka_budgets'),
                        baraka_savings: localStorage.getItem('baraka_savings'),
                        baraka_quick_notes: localStorage.getItem('baraka_quick_notes'),
                        baraka_reminders_settings: localStorage.getItem('baraka_reminders_settings'),
                    }
                }
            };

            const name = `Backup ${new Date().toLocaleString('en-US')}`;
            const { error } = await supabase.from('backups').insert({
                user_id: user.id,
                name,
                data: backupData
            });

            if (error) throw error;
            toast({ title: 'تم الحفظ في السحابة' });
            loadCloudBackups();
        } catch (e: any) {
            toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
        } finally {
            setIsLoadingCloud(false);
        }
    };

    const restoreCloudBackup = async (id: string) => {
        setIsLoadingCloud(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not logged in');

            const { data, error } = await supabase.from('backups').select('data').eq('id', id).single();
            if (error) throw error;

            const importedData = data.data;

            const updates = [];
            if (importedData.data.finance) {
                updates.push(supabase.from(TABLES.finance).upsert({ ...importedData.data.finance, user_id: user.id, updated_at: new Date().toISOString() }));
            }
            if (importedData.data.logistics) {
                updates.push(supabase.from(TABLES.logistics).upsert({ ...importedData.data.logistics, user_id: user.id, updated_at: new Date().toISOString() }));
            }
            if (importedData.data.localStorage) {
                Object.entries(importedData.data.localStorage).forEach(([key, value]) => {
                    if (value) localStorage.setItem(key, value as string);
                });
            }
            await Promise.all(updates);
            toast({ title: 'تم الاستعادة' });

            // Dispatch events to reload other components
            window.dispatchEvent(new Event('habits-updated'));
            window.dispatchEvent(new Event('medications-updated'));
            window.dispatchEvent(new Event('appointments-updated'));

            setTimeout(() => window.location.reload(), 1000);
        } catch (e: any) {
            toast({ title: 'خطأ', description: e.message });
        } finally {
            setIsLoadingCloud(false);
        }
    };

    const deleteBackup = async (id: string) => {
        const { error } = await supabase.from('backups').delete().eq('id', id);
        if (!error) {
            toast({ title: 'تم الحذف' });
            setCloudBackups(prev => prev.filter(b => b.id !== id));
        }
    };

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

            const { data: appointments } = await supabase.from('appointments').select('*').eq('user_id', user.id);

            const backupData = {
                version: '2.0',
                exportDate: new Date().toISOString(),
                userId: user.id,
                data: {
                    finance: finance.data,
                    logistics: logistics.data,
                    appointments: appointments || [],
                    localStorage: {
                        baraka_medications_v2: localStorage.getItem('baraka_medications_v2'),
                        baraka_habits: localStorage.getItem('baraka_habits'),
                        baraka_subscriptions: localStorage.getItem('baraka_subscriptions'),
                        baraka_budgets: localStorage.getItem('baraka_budgets'),
                        baraka_savings: localStorage.getItem('baraka_savings'),
                        baraka_quick_notes: localStorage.getItem('baraka_quick_notes'),
                        baraka_reminders_settings: localStorage.getItem('baraka_reminders_settings'),
                    }
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

            const { data: appointments } = await supabase.from('appointments').select('*').eq('user_id', user.id);

            const backupData = {
                version: '2.0',
                exportDate: new Date().toISOString(),
                userId: user.id,
                data: {
                    finance: finance.data,
                    logistics: logistics.data,
                    appointments: appointments || [],
                    localStorage: {
                        baraka_medications_v2: localStorage.getItem('baraka_medications_v2'),
                        baraka_habits: localStorage.getItem('baraka_habits'),
                        baraka_subscriptions: localStorage.getItem('baraka_subscriptions'),
                        baraka_budgets: localStorage.getItem('baraka_budgets'),
                        baraka_savings: localStorage.getItem('baraka_savings'),
                        baraka_quick_notes: localStorage.getItem('baraka_quick_notes'),
                        baraka_reminders_settings: localStorage.getItem('baraka_reminders_settings'),
                    }
                }
            };

            const fileName = `baraka_backup_${new Date().toISOString().split('T')[0]}.json`;

            if (navigator.share) {
                const file = new File([JSON.stringify(backupData, null, 2)], fileName, { type: 'application/json' });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'نسخة احتياطية - بركة',
                        text: 'ملف النسخة الاحتياطية لتطبيق بركة'
                    });
                    return;
                }
            }

            await Share.share({
                title: 'نسخة احتياطية',
                text: JSON.stringify(backupData),
                dialogTitle: 'مشاركة ملف JSON'
            });

        } catch (e) {
            console.error(e);
            toast({ title: 'تعذرت المشاركة كملف', description: 'تأكد من دعم جهازك للمشاركة' });
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

            if (importedData.data.localStorage) {
                Object.entries(importedData.data.localStorage).forEach(([key, value]) => {
                    if (value) localStorage.setItem(key, value as string);
                });
            }

            await Promise.all(updates);

            toast({ title: 'تم الاستيراد بنجاح ✅', description: 'تم استعادة البيانات' });

            // Dispatch events
            window.dispatchEvent(new Event('habits-updated'));
            window.dispatchEvent(new Event('medications-updated'));
            window.dispatchEvent(new Event('appointments-updated'));

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
                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <Button onClick={saveToCloud} disabled={isLoadingCloud} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {isLoadingCloud ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4 mr-2" />}
                        نسخ سحابي
                    </Button>
                    <Button onClick={exportData} variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        تصدير ملف
                    </Button>
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                        <Upload className="w-4 h-4 mr-2" />
                        استيراد ملف
                    </Button>
                    <Button onClick={shareBackup} variant="outline">
                        <Share2 className="w-4 h-4 mr-2" />
                        مشاركة
                    </Button>
                </div>

                <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />

                {/* Cloud Backups List */}
                <div className="border rounded-lg p-3 bg-gray-50">
                    <h3 className="font-bold text-sm mb-2 text-right">النسخ السحابية المحفوظة</h3>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                        {cloudBackups.length === 0 ? (
                            <p className="text-xs text-center text-gray-500 py-2">لا توجد نسخ محفوظة</p>
                        ) : (
                            cloudBackups.map(backup => (
                                <div key={backup.id} className="flex items-center justify-between bg-white p-2 rounded shadow-sm">
                                    <div className="text-right">
                                        <p className="text-xs font-bold">{backup.name}</p>
                                        <p className="text-[10px] text-gray-500">{new Date(backup.created_at).toLocaleString('ar-EG')}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => restoreCloudBackup(backup.id)} disabled={isLoadingCloud}>
                                            <Upload className="w-3 h-3" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteBackup(backup.id)}>
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200 mt-2">
                    <FileJson className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <p className="arabic-body text-xs text-yellow-700">النسخ الاحتياطي يشمل البيانات المالية، العادات، الأدوية، والمهام.</p>
                </div>

            </CardContent>
        </Card>
    );
};

export default DataBackup;
