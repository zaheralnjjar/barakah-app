import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Printer, Calendar, List, Clock, FileText } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { useHabits } from '@/hooks/useHabits';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { generatePDF } from '@/utils/pdfGenerator';
import { useToast } from '@/hooks/use-toast';
import { useMedications } from '@/hooks/useMedications';
import { useAppStore } from '@/stores/useAppStore';
import PrintableReport from './PrintableReport';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useRef } from 'react';
import { useReportArchive } from '@/hooks/useReportArchive';

interface PrintOptionsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    currentDate?: Date;
}

const PrintOptionsDialog: React.FC<PrintOptionsDialogProps> = ({ isOpen, onClose, currentDate = new Date() }) => {
    const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
    const [selectedTypes, setSelectedTypes] = useState({
        tasks: true,
        appointments: true,
        medications: false,
        projects: false,
        habits: true,
        shopping: false,
        expenses: false,
        prayerTimes: true
    });

    const { tasks } = useTasks();
    const { appointments } = useAppointments();
    const { habits } = useHabits();
    const { prayerTimes } = usePrayerTimes();
    const { medications } = useMedications();
    const { finances } = useAppStore();
    const { toast } = useToast();
    const reportRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Date Range State
    const [startDate, setStartDate] = useState<string>(currentDate.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>(currentDate.toISOString().split('T')[0]);

    // Update active dates when dialog opens
    React.useEffect(() => {
        if (isOpen) {
            // Fix: Use local date instead of UTC to avoid "tomorrow" bug late at night
            const now = currentDate || new Date();
            // Create local date string YYYY-MM-DD manually to avoid timezone shifts
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const d = `${year}-${month}-${day}`;

            setStartDate(d);
            setEndDate(d);
        }
    }, [isOpen]); // Remove currentDate checks to prevent resetting on every render


    const { saveReport, reports, deleteReport } = useReportArchive();
    const [activeTab, setActiveTab] = useState<'create' | 'archive'>('create');

    const handleGenerate = async (saveToArchive: boolean = false) => {
        setIsGenerating(true);
        toast({ title: "جاري تحضير التقرير...", description: "يرجى الانتظار قليلاً" });

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Wait for render
        setTimeout(async () => {
            if (!reportRef.current) {
                console.error("Report ref is null");
                setIsGenerating(false);
                return;
            }

            try {
                const canvas = await html2canvas(reportRef.current, {
                    scale: 2,
                    useCORS: true,
                    logging: false
                } as any);

                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const imgProps = pdf.getImageProperties(imgData);
                const pdfNewHeight = (imgProps.height * pdfWidth) / imgProps.width;

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfNewHeight);

                if (saveToArchive) {
                    const blob = pdf.output('blob');
                    await saveReport(`تقرير ${startDate} إلى ${endDate}`, 'PDF', blob);
                    toast({ title: "تم الحفظ", description: "تم حفظ التقرير في الأرشيف المحلي" });
                } else {
                    pdf.save(`barakah-report-${startDate}.pdf`);
                    toast({ title: "تم التنزيل", description: "تم تنزيل ملف PDF بنجاح" });
                }

                if (!saveToArchive) onClose();
            } catch (error) {
                console.error(error);
                toast({ title: "خطأ", description: "حدث خطأ أثناء توليد التقرير", variant: "destructive" });
            } finally {
                setIsGenerating(false);
            }
        }, 500);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] rtl-content max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl text-primary font-bold flex items-center justify-center gap-2">
                        <Printer className="w-6 h-6" />
                        التقارير والطباعة
                    </DialogTitle>
                </DialogHeader>

                <div className="flex border-b border-gray-200 mb-4">
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`flex-1 py-2 text-center text-sm font-bold border-b-2 transition-colors ${activeTab === 'create' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        إنشاء تقرير جديد
                    </button>
                    <button
                        onClick={() => setActiveTab('archive')}
                        className={`flex-1 py-2 text-center text-sm font-bold border-b-2 transition-colors ${activeTab === 'archive' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        الأرشيف المحفوظ
                    </button>
                </div>

                {activeTab === 'create' ? (
                    <div className="space-y-6 py-2">
                        {/* Date Range Selection */}
                        <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <Label className="font-bold flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                تحديد الفترة:
                            </Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-gray-500 mb-1 block">من:</Label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="text-right"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500 mb-1 block">إلى:</Label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="text-right"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* View Mode Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${viewMode === 'table' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-200'}`}
                            >
                                <List className="w-8 h-8" />
                                <span className="font-bold">جدول تفصيلي</span>
                            </button>
                            <button
                                onClick={() => setViewMode('timeline')}
                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${viewMode === 'timeline' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-purple-200'}`}
                            >
                                <Clock className="w-8 h-8" />
                                <span className="font-bold">جدول زمني (ساعات)</span>
                            </button>
                        </div>

                        {/* Data Types Selection */}
                        <div className="space-y-3">
                            <Label className="text-lg font-bold">محتوى التقرير:</Label>
                            <div className="grid grid-cols-2 gap-3">
                                {/* Checkboxes */}
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <Checkbox id="chk-tasks" checked={selectedTypes.tasks} onCheckedChange={(c) => setSelectedTypes({ ...selectedTypes, tasks: !!c })} />
                                    <Label htmlFor="chk-tasks">المهام</Label>
                                </div>
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <Checkbox id="chk-apps" checked={selectedTypes.appointments} onCheckedChange={(c) => setSelectedTypes({ ...selectedTypes, appointments: !!c })} />
                                    <Label htmlFor="chk-apps">المواعيد</Label>
                                </div>
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <Checkbox id="chk-prayers" checked={selectedTypes.prayerTimes} onCheckedChange={(c) => setSelectedTypes({ ...selectedTypes, prayerTimes: !!c })} />
                                    <Label htmlFor="chk-prayers">مواقيت الصلاة</Label>
                                </div>
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <Checkbox id="chk-shopping" checked={selectedTypes.shopping} onCheckedChange={(c) => setSelectedTypes({ ...selectedTypes, shopping: !!c })} />
                                    <Label htmlFor="chk-shopping">قائمة التسوق</Label>
                                </div>
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <Checkbox id="chk-meds" checked={selectedTypes.medications} onCheckedChange={(c) => setSelectedTypes({ ...selectedTypes, medications: !!c })} />
                                    <Label htmlFor="chk-meds">الأدوية</Label>
                                </div>
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <Checkbox id="chk-expenses" checked={selectedTypes.expenses} onCheckedChange={(c) => setSelectedTypes({ ...selectedTypes, expenses: !!c })} />
                                    <Label htmlFor="chk-expenses">المصاريف</Label>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="flex-col sm:flex-row gap-2 sticky bottom-0 bg-white pt-2 border-t mt-4">
                            <Button
                                onClick={() => handleGenerate(false)}
                                disabled={isGenerating}
                                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 flex-1"
                            >
                                <FileText className="w-4 h-4 ml-2" />
                                {isGenerating ? 'جاري التجهيز...' : 'طباعة / تنزيل PDF'}
                            </Button>
                            <Button
                                onClick={() => handleGenerate(true)}
                                disabled={isGenerating}
                                variant="outline"
                                className="w-full sm:w-auto border-purple-200 text-purple-700 hover:bg-purple-50 flex-1"
                            >
                                <Clock className="w-4 h-4 ml-2" />
                                حفظ في الأرشيف
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <div className="space-y-4 min-h-[400px]">
                        {reports.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>لا توجد تقارير محفوظة</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {reports.map(report => (
                                    <div key={report.id} className="bg-white border rounded-lg p-3 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-sm">{report.title}</h4>
                                                <p className="text-xs text-gray-500">{new Date(report.date).toLocaleDateString('ar-EG')} - {Math.round(report.size / 1024)} KB</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="text-blue-600 hover:bg-blue-50 h-8 w-8"
                                                onClick={() => {
                                                    const link = document.createElement('a');
                                                    link.href = report.pdfData;
                                                    link.download = `${report.title}.pdf`;
                                                    link.click();
                                                }}
                                            >
                                                <List className="w-4 h-4 rotate-180" /> {/* Reuse List as Download or import Download */}
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="text-red-600 hover:bg-red-50 h-8 w-8"
                                                onClick={() => deleteReport(report.id)}
                                            >
                                                <Clock className="w-4 h-4 rotate-45" /> {/* Reuse Clock as X or import Trash */}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>

            {/* Hidden Report Container */}
            <PrintableReport
                ref={reportRef}
                viewType={viewMode}
                dateRange={`${startDate} - ${endDate}`}
                data={(() => {
                    // Date Parsing Fix: Treat inputs as local dates (YYYY-MM-DD + T00:00:00)
                    const startData = new Date(`${startDate}T00:00:00`);
                    const endData = new Date(`${endDate}T23:59:59.999`);

                    const isInRange = (dateStr: string) => {
                        if (!dateStr) return false;
                        const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
                        return d >= startData && d <= endData;
                    };

                    // Apps
                    const apps = selectedTypes.appointments ? appointments.filter(a => isInRange(a.date)) : [];

                    // Tasks
                    const tsks = selectedTypes.tasks ? tasks.filter(t => !t.deadline || isInRange(t.deadline)) : [];

                    // Data Fetching for New Sections
                    // Medications
                    const meds = selectedTypes.medications && medications ? medications.filter(m => {
                        // Simple logic: if permanent or within range
                        return m.isPermanent || (m.startDate <= endDate && m.endDate >= startDate);
                    }) : [];

                    // Shopping List (from LocalStorage)
                    let shopList = [];
                    if (selectedTypes.shopping) {
                        try {
                            const saved = localStorage.getItem('baraka_shopping_list');
                            if (saved) shopList = JSON.parse(saved);
                            // Support new format if it's stored differently
                            const logisticsData = localStorage.getItem('baraka_logistics_data'); // Check backup loc
                            if (!shopList.length && logisticsData) {
                                const log = JSON.parse(logisticsData);
                                if (log.shopping_list) shopList = log.shopping_list;
                            }
                        } catch (e) { console.error("Error reading shopping list", e); }
                    }

                    // Expenses (from AppStore)
                    const financeExpenses = selectedTypes.expenses && finances?.expenses ? finances.expenses.filter(e => isInRange(e.date)) : [];

                    // Prayers
                    let prayers = [];
                    if (selectedTypes.prayerTimes) {
                        try {
                            const storedSchedule = localStorage.getItem('baraka_monthly_schedule');
                            if (storedSchedule) {
                                prayers = JSON.parse(storedSchedule).filter((d: any) => isInRange(d.date));
                            } else {
                                // fallback to today
                                prayers = prayerTimes.map(p => ({
                                    name: p.nameAr || p.name,
                                    time: p.time,
                                    date: startDate
                                }));
                            }
                        } catch (e) { console.error("Error parsing schedule", e); }
                    }

                    return {
                        tasks: tsks,
                        appointments: apps,
                        habits: selectedTypes.habits ? habits : [],
                        prayerTimes: prayers,
                        medications: meds,
                        shopping: shopList,
                        expenses: financeExpenses
                    };
                })()}
            />
        </Dialog>
    );
};

export default PrintOptionsDialog;
