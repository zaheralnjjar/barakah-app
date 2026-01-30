import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Heart, AlertTriangle, Phone, Save, Trash2, Share2, Copy, FileSpreadsheet, Calendar } from 'lucide-react';
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

    // Activity/Distraction Dialog State
    const [showDistraction, setShowDistraction] = useState(false);
    const [distractionLogs, setDistractionLogs] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [distractionReason, setDistractionReason] = useState('');
    const [distractionDuration, setDistractionDuration] = useState(0);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [showExportConfirm, setShowExportConfirm] = useState(false);

    // Auto-calculate duration
    useEffect(() => {
        if (startTime && endTime) {
            const start = new Date(`1970-01-01T${startTime}`);
            const end = new Date(`1970-01-01T${endTime}`);
            let diff = (end.getTime() - start.getTime()) / 1000 / 60; // minutes
            if (diff < 0) diff += 24 * 60; // Handle overnight
            setDistractionDuration(Math.round(diff));
        }
    }, [startTime, endTime]);

    // Medical Profile State
    const [showMedical, setShowMedical] = useState(false);
    const [medicalProfile, setMedicalProfile] = useState<any>(null);

    // Appointment Dialog State
    const [showAppointment, setShowAppointment] = useState(false);
    const [apptTitle, setApptTitle] = useState('');
    const [apptDate, setApptDate] = useState('');
    const [apptTime, setApptTime] = useState('');

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
        const handleOpenDistraction = () => {
            setShowDistraction(true);
            // Default start time to now
            setStartTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
        };
        const handleOpenMedical = () => setShowMedical(true);
        const handleOpenAppointment = () => {
            setApptDate(new Date().toISOString().split('T')[0]);
            setApptTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
            setShowAppointment(true);
        };

        window.addEventListener('open-distraction-dialog', handleOpenDistraction);
        window.addEventListener('open-medical-profile', handleOpenMedical);
        window.addEventListener('open-appointment-dialog', handleOpenAppointment);

        return () => {
            window.removeEventListener('open-distraction-dialog', handleOpenDistraction);
            window.removeEventListener('open-medical-profile', handleOpenMedical);
            window.removeEventListener('open-appointment-dialog', handleOpenAppointment);
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

        // Construct full timestamps if times are provided
        let startTimestamp = null;
        let endTimestamp = null;
        const today = new Date().toISOString().split('T')[0];

        if (startTime) startTimestamp = new Date(`${today}T${startTime}`).toISOString();
        if (endTime) endTimestamp = new Date(`${today}T${endTime}`).toISOString();


        const { error } = await supabase.from('distraction_logs').insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            reason: distractionReason,
            duration_minutes: distractionDuration,
            start_time: startTimestamp,
            end_time: endTimestamp
        });

        if (!error) {
            toast({ title: 'تم التسجيل', description: 'تم تسجيل النشاط بنجاح' });
            setShowDistraction(false);
            setDistractionReason('');
            setDistractionDuration(0);
            setStartTime('');
            setEndTime('');
        } else {
            console.error(error);
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
            'النشاط/السبب': log.reason,
            'المدة (دقيقة)': log.duration_minutes || 0,
            'وقت البداية': log.start_time ? new Date(log.start_time).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '-',
            'وقت النهاية': log.end_time ? new Date(log.end_time).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '-',
            'التاريخ': new Date(log.created_at).toLocaleDateString('ar-SA'),
            'الوقت': new Date(log.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        ws['!views'] = [{ rightToLeft: true }];

        ws['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

        XLSX.utils.book_append_sheet(wb, ws, "سجل النشاط");

        const fileName = `Activity_Log_${new Date().toISOString().split('T')[0]}.xlsx`;

        // 2. Handle Export based on Platform
        try {
            if (isAndroid()) {
                // Mobile: Write to file and share
                const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

                try {
                    await Filesystem.writeFile({
                        path: fileName,
                        data: wbout,
                        directory: Directory.Documents,
                    });

                    toast({ title: 'تم الحفظ ✅', description: `تم حفظ الملف في مجلد المستندات باسم: ${fileName}` });

                    const uriResult = await Filesystem.getUri({
                        directory: Directory.Documents,
                        path: fileName,
                    });

                    await Share.share({
                        title: 'سجل النشاط',
                        url: uriResult.uri,
                        dialogTitle: 'مشاركة ملف Excel'
                    });

                } catch (e) {
                    console.error('Documents save error:', e);
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
                            title: 'سجل النشاط',
                            url: uriResult.uri,
                            dialogTitle: 'مشاركة ملف Excel'
                        });
                    } catch (innerE) {
                        toast({ title: 'خطأ', description: 'فشل حفظ الملف. تحقق من الصلاحيات.', variant: 'destructive' });
                    }
                }
            } else {
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

    const handleSaveAppointment = async () => {
        if (!apptTitle.trim() || !apptDate || !apptTime) {
            toast({ title: 'يرجى ملء جميع الحقول', variant: 'destructive' });
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            const { error } = await supabase.from('appointments').insert({
                id: crypto.randomUUID(),
                user_id: user.id,
                title: apptTitle.trim(),
                date: apptDate,
                time: apptTime,
                status: 'scheduled'
            });

            if (error) throw error;

            toast({ title: '✅ تم إضافة الموعد بنجاح' });
            setApptTitle('');
            setShowAppointment(false);
            window.dispatchEvent(new Event('refresh-appointments')); // Optional: trigger refresh in calendar
        } catch (error) {
            console.error(error);
            toast({ title: '❌ فشل حفظ الموعد', variant: 'destructive' });
        }
    };

    return (
        <>
            {/* Quick Appointment Dialog */}
            <Dialog open={showAppointment} onOpenChange={setShowAppointment}>
                <DialogContent className="max-w-md bg-white rounded-2xl" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-purple-700">
                            <Calendar className="w-5 h-5" />
                            إضافة موعد سريع
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>عنوان الموعد</Label>
                            <Input
                                value={apptTitle}
                                onChange={(e) => setApptTitle(e.target.value)}
                                placeholder="مثلاً: موعد طبيب، اجتماع عمل..."
                                className="bg-gray-50 border-gray-200"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>التاريخ</Label>
                                <Input
                                    type="date"
                                    value={apptDate}
                                    onChange={(e) => setApptDate(e.target.value)}
                                    className="bg-gray-50 border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>الوقت</Label>
                                <Input
                                    type="time"
                                    value={apptTime}
                                    onChange={(e) => setApptTime(e.target.value)}
                                    className="bg-gray-50 border-gray-200"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowAppointment(false)}>إلغاء</Button>
                        <Button onClick={handleSaveAppointment} className="bg-purple-600 hover:bg-purple-700 text-white">حفظ الموعد</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Activity/Distraction Dialog */}
            <Dialog open={showDistraction} onOpenChange={setShowDistraction}>
                <DialogContent className="max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 justify-between">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-orange-500" />
                                تسجيل نشاط
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
                                    {showHistory ? 'إخفاء السجل' : 'سجل النشاط'}
                                </Button>
                            </div>
                        </DialogTitle>
                        <DialogDescription>
                            {showHistory ? 'سجل النشاط السابق' : 'سجل تفاصيل النشاط والوقت المستغرق'}
                        </DialogDescription>
                    </DialogHeader>

                    {!showHistory ? (
                        <div className="py-4 space-y-3">
                            <Input
                                value={distractionReason}
                                onChange={(e) => setDistractionReason(e.target.value)}
                                placeholder="اسم النشاط..."
                            />

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-500">بداية</Label>
                                    <Input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-500">نهاية</Label>
                                    <Input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 justify-end">
                                <Label className="text-xs text-yellow-600 whitespace-nowrap">المدة (دقيقة):</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={distractionDuration}
                                    onChange={(e) => setDistractionDuration(parseInt(e.target.value) || 0)}
                                    className="w-24 text-center font-bold"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="py-2 max-h-[300px] overflow-y-auto space-y-2">
                            {distractionLogs.length === 0 ? (
                                <p className="text-center text-gray-500 py-4">لا يوجد سجلات سابقة</p>
                            ) : (
                                distractionLogs.map((log) => (
                                    <div key={log.id} className="bg-gray-50 p-3 rounded-lg border flex justify-between items-center group">
                                        <div className="flex flex-col gap-1 text-right">
                                            <span className="font-medium text-gray-700">{log.reason}</span>

                                            <div className="flex gap-2 text-[10px] text-gray-400">
                                                {log.start_time && <span>{new Date(log.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>}
                                                {log.start_time && log.end_time && <span>-</span>}
                                                {log.end_time && <span>{new Date(log.end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>}
                                            </div>

                                            {log.duration_minutes > 0 && (
                                                <span className="text-[10px] text-yellow-600 font-bold bg-yellow-50 px-1.5 py-0.5 rounded w-fit">
                                                    {log.duration_minutes} دقيقة
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-xs text-gray-400 text-left dir-ltr">
                                                <div>{new Date(log.created_at).toLocaleDateString('en-GB')}</div>
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

            {/* Medical / Emergency Dialog Logic Remains... */}
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
                        <AlertDialogTitle>تصدير سجل النشاط</AlertDialogTitle>
                        <AlertDialogDescription>
                            هل تريد تصدير جميع سجلات النشاط إلى ملف Excel وحفظه على جهازك؟
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
