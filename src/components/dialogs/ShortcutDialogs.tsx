import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Heart, AlertTriangle, Phone, Save, Trash2, Share2, Copy, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { isAndroid } from '@/utils/platformDetection';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const ShortcutDialogs = () => {
    const { toast } = useToast();

    // Distraction Dialog State
    const [showDistraction, setShowDistraction] = useState(false);
    const [distractionLogs, setDistractionLogs] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [distractionReason, setDistractionReason] = useState('');
    const [showExportConfirm, setShowExportConfirm] = useState(false);

    // Medical Profile State
    const [showMedical, setShowMedical] = useState(false);
    const [medicalProfile, setMedicalProfile] = useState<any>(null);

    // Initial load of medical profile
    useEffect(() => {
        if (showMedical) {
            const fetchProfile = async () => {
                const { data } = await supabase.from('medical_profile').select('*').single();
                setMedicalProfile(data);
            };
            fetchProfile();
        }
    }, [showMedical]);


    useEffect(() => {
        const handleOpenDistraction = () => setShowDistraction(true);
        const handleOpenMedical = () => setShowMedical(true);

        window.addEventListener('open-distraction-dialog', handleOpenDistraction);
        window.addEventListener('open-medical-profile', handleOpenMedical);

        return () => {
            window.removeEventListener('open-distraction-dialog', handleOpenDistraction);
            window.removeEventListener('open-medical-profile', handleOpenMedical);
        };
    }, []);

    const fetchDistractionLogs = async () => {
        const { data } = await supabase
            .from('distraction_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) setDistractionLogs(data);
    };

    const handleSaveDistraction = async () => {
        if (!distractionReason.trim()) return;

        const { error } = await supabase.from('distraction_logs').insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            reason: distractionReason
        });

        if (!error) {
            toast({ title: 'تم التسجيل', description: 'تم تسجيل سبب التشتت بنجاح' });
            setShowDistraction(false);
            setDistractionReason('');
        } else {
            toast({ title: 'خطأ', description: 'فشل التسجيل', variant: 'destructive' });
        }
    };

    const handleDeleteLog = async (id: string) => {
        const { error } = await supabase.from('distraction_logs').delete().eq('id', id);
        if (!error) {
            setDistractionLogs(prev => prev.filter(log => log.id !== id));
            toast({ title: 'تم الحذف', description: 'تم حذف السجل بنجاح' });
        } else {
            toast({ title: 'خطأ', description: 'فشل الحذف', variant: 'destructive' });
        }
    };

    const performExport = async () => {
        // 1. Prepare Data for Excel
        const dataToExport = distractionLogs.map(log => ({
            'السبب': log.reason,
            'التاريخ': new Date(log.created_at).toLocaleDateString('ar-SA'),
            'الوقت': new Date(log.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
            'التاريخ الميلادي': new Date(log.created_at).toLocaleDateString('en-GB'),
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        ws['!views'] = [{ rightToLeft: true }];

        // Adjust column widths
        ws['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

        XLSX.utils.book_append_sheet(wb, ws, "سجل التشتت");

        const fileName = `Distraction_Log_${new Date().toISOString().split('T')[0]}.xlsx`;

        // 2. Handle Export based on Platform
        try {
            if (isAndroid()) {
                // Mobile: Write to file and share
                const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

                try {
                    // Try saving to Documents first (User accessible)
                    await Filesystem.writeFile({
                        path: fileName,
                        data: wbout,
                        directory: Directory.Documents,
                    });

                    toast({ title: 'تم الحفظ ✅', description: `تم حفظ الملف في مجلد المستندات باسم: ${fileName}` });

                    // Optional: Share immediately
                    const uriResult = await Filesystem.getUri({
                        directory: Directory.Documents,
                        path: fileName,
                    });

                    await Share.share({
                        title: 'سجل التشتت',
                        url: uriResult.uri,
                        dialogTitle: 'مشاركة ملف Excel'
                    });

                } catch (e) {
                    console.error('Documents save error:', e);
                    // Fallback to Cache if Documents fails (Android 10- scoped storage issues)
                    try {
                        await Filesystem.writeFile({
                            path: fileName,
                            data: wbout,
                            directory: Directory.Cache,
                        });
                        const uriResult = await Filesystem.getUri({
                            directory: Directory.Cache,
                            path: fileName,
                        });
                        await Share.share({
                            title: 'سجل التشتت',
                            url: uriResult.uri,
                            dialogTitle: 'مشاركة ملف Excel'
                        });
                    } catch (innerE) {
                        toast({ title: 'خطأ', description: 'فشل حفظ الملف. تحقق من الصلاحيات.', variant: 'destructive' });
                    }
                }
            } else {
                // Web: Browser Download
                XLSX.writeFile(wb, fileName);
                toast({ title: 'تم التحميل', description: 'جارٍ تحميل ملف Excel...' });
            }
        } catch (error) {
            console.error('Export error:', error);
            toast({ title: 'خطأ', description: 'حدث خطأ غير متوقع أثناء التصدير', variant: 'destructive' });
        }
    };

    const handleShareLogs = async () => {
        if (distractionLogs.length === 0) {
            toast({ title: 'تنبيه', description: 'لا توجد سجلات للمشاركة' });
            return;
        }
        setShowExportConfirm(true);
    };

    return (
        <>
            {/* Distraction Dialog */}
            <Dialog open={showDistraction} onOpenChange={setShowDistraction}>
                <DialogContent className="max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 justify-between">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-orange-500" />
                                تسجيل تشتت
                            </div>
                            <div className="flex gap-1">
                                {showHistory && distractionLogs.length > 0 && (
                                    <Button variant="ghost" size="icon" onClick={handleShareLogs} className="h-8 w-8 text-blue-600">
                                        <Share2 className="w-4 h-4" />
                                    </Button>
                                )}
                                <Button variant="ghost" size="sm" onClick={() => {
                                    if (!showHistory) fetchDistractionLogs();
                                    setShowHistory(!showHistory);
                                }}>
                                    {showHistory ? 'إخفاء السجل' : 'سجل التشتت'}
                                </Button>
                            </div>
                        </DialogTitle>
                        <DialogDescription>
                            {showHistory ? 'سجل التشتت السابق' : 'ما الذي يشتت انتباهك الآن؟ الاعتراف بالمشكلة هو أول خطوة للحل.'}
                        </DialogDescription>
                    </DialogHeader>

                    {!showHistory ? (
                        <div className="py-4">
                            <Input
                                value={distractionReason}
                                onChange={(e) => setDistractionReason(e.target.value)}
                                placeholder="مثال: تصفح فيسبوك، ضجيج، مكالمة هاتفية..."
                            />
                        </div>
                    ) : (
                        <div className="py-2 max-h-[300px] overflow-y-auto space-y-2">
                            {distractionLogs.length === 0 ? (
                                <p className="text-center text-gray-500 py-4">لا يوجد سجلات سابقة</p>
                            ) : (
                                distractionLogs.map((log) => (
                                    <div key={log.id} className="bg-gray-50 p-3 rounded-lg border flex justify-between items-center group">
                                        <span className="font-medium text-gray-700">{log.reason}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="text-xs text-gray-400 text-left dir-ltr">
                                                <div>{new Date(log.created_at).toLocaleDateString('en-GB')}</div>
                                                <div>{new Date(log.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleDeleteLog(log.id)}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        {!showHistory && (
                            <>
                                <Button variant="outline" onClick={() => setShowDistraction(false)}>إلغاء</Button>
                                <Button onClick={handleSaveDistraction}>حفظ</Button>
                            </>
                        )}
                        {showHistory && <Button onClick={() => setShowHistory(false)}>عودة</Button>}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Medical / Emergency Dialog */}
            < Dialog open={showMedical} onOpenChange={setShowMedical} >
                <DialogContent className="border-red-500 border-2 bg-red-50/10">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Heart className="w-6 h-6 fill-red-600 animate-pulse" />
                            بطاقة الطوارئ الطبية
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2 text-right">
                        {medicalProfile ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-3 rounded-lg shadow-sm border">
                                        <Label className="text-gray-500 text-xs">فصيلة الدم</Label>
                                        <p className="text-2xl font-bold text-red-700">{medicalProfile.blood_type || 'غير محدد'}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg shadow-sm border">
                                        <Label className="text-gray-500 text-xs">حساسية</Label>
                                        <p className="font-semibold">{medicalProfile.allergies || 'لا يوجد'}</p>
                                    </div>
                                </div>

                                <div className="bg-red-100/50 p-4 rounded-xl border border-red-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Phone className="w-4 h-4 text-red-600" />
                                        <h4 className="font-bold text-red-800">جهة اتصال للطوارئ</h4>
                                    </div>
                                    <p className="text-lg font-semibold">{medicalProfile.emergency_contact_name}</p>
                                    <a href={`tel:${medicalProfile.emergency_contact_phone}`} className="text-xl font-bold text-blue-600 block mt-1 dir-ltr text-right">
                                        {medicalProfile.emergency_contact_phone}
                                    </a>
                                </div>

                                {medicalProfile.notes && (
                                    <div className="bg-white p-3 rounded-lg border">
                                        <Label className="text-gray-500 text-xs">ملاحظات طبية</Label>
                                        <p>{medicalProfile.notes}</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>لم يتم إعداد الملف الطبي بعد.</p>
                                <Button variant="link" className="text-blue-600">إعداد الآن</Button>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowMedical(false)}>إغلاق</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >

            <AlertDialog open={showExportConfirm} onOpenChange={setShowExportConfirm}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>تصدير سجل التشتت</AlertDialogTitle>
                        <AlertDialogDescription>
                            هل تريد تصدير جميع سجلات التشتت إلى ملف Excel وحفظه على جهازك؟
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            performExport();
                            setShowExportConfirm(false);
                        }}>تأكيد وتصدير</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
