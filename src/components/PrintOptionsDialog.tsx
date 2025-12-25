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
import PrintableReport from './PrintableReport';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useRef } from 'react';

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
    const { toast } = useToast();
    const reportRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Date Range State
    const [startDate, setStartDate] = useState<string>(currentDate.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>(currentDate.toISOString().split('T')[0]);

    // Update active dates when dialog opens or currentDate changes
    React.useEffect(() => {
        if (isOpen && currentDate) {
            const d = currentDate.toISOString().split('T')[0];
            setStartDate(d);
            setEndDate(d);
        }
    }, [isOpen, currentDate]);


    const handlePrint = async () => {
        setIsGenerating(true);
        toast({ title: "جاري تحضير التقرير...", description: "يرجى الانتظار قليلاً" });

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include full end day

        // Helper to check if date is in range
        const isInRange = (dateStr: string) => {
            const d = new Date(dateStr);
            return d >= start && d <= end;
        };

        // Filter Tasks
        const filteredTasks = selectedTypes.tasks ? tasks.filter(t => {
            if (!t.deadline) return true; // Include undated? Or maybe just pending. Let's include all pending.
            return isInRange(t.deadline);
        }) : [];

        // Filter Appointments
        const filteredApps = selectedTypes.appointments ? appointments.filter(a => isInRange(a.date)) : [];

        // Prayer Times for Range (Try to get from Monthly Schedule in LocalStorage)
        let rangePrayerTimes = [];
        if (selectedTypes.prayerTimes) {
            try {
                const storedSchedule = localStorage.getItem('baraka_monthly_schedule');
                if (storedSchedule) {
                    const schedule = JSON.parse(storedSchedule);
                    rangePrayerTimes = schedule.filter((day: any) => isInRange(day.date)).map((d: any) => ({
                        name: 'Show All', // Simplification for report
                        date: d.date, // Add date to handle grouping in report
                        fajr: d.fajr,
                        sunrise: d.sunrise,
                        dhuhr: d.dhuhr,
                        asr: d.asr,
                        maghrib: d.maghrib,
                        isha: d.isha
                    }));
                } else {
                    // Fallback to single day (Today's) if no monthly schedule
                    rangePrayerTimes = prayerTimes.map(p => ({ ...p, date: startDate }));
                }
            } catch (e) { console.error(e); }
        }

        const printData = {
            tasks: filteredTasks,
            appointments: filteredApps,
            habits: selectedTypes.habits ? habits : [],
            prayerTimes: rangePrayerTimes, // This structure differs slightly now (array of days vs array of times), PrintableReport needs adjustment
            medications: selectedTypes.medications ? [{ name: 'Panadol', quantity: '1 tablet' }] : [],
            shopping: selectedTypes.shopping ? [{ name: 'خبز', quantity: '2' }, { name: 'حليب', quantity: '1L' }] : [],
            expenses: selectedTypes.expenses ? [{ category: 'طعام', amount: '5000' }] : []
        };

        // Give React a moment to render the hidden report with usage of new data
        setTimeout(async () => {
            if (!reportRef.current) {
                console.error("Report ref is null");
                setIsGenerating(false);
                return;
            }

            try {
                const canvas = await html2canvas(reportRef.current, {
                    scale: 2, // Improve quality
                    useCORS: true,
                    logging: false
                } as any);

                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;
                const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
                const imgX = (pdfWidth - imgWidth * ratio) / 2;
                const imgY = 0; // Top align primarily

                // If content is long, we might need auto-paging, but let's stick to single page fit-width for now 
                // or just standard fit. Real multi-page HTML2PDF is harder. 
                // Given the tasks/activities usually fit in 1-2 pages, scaling to fit width is best.

                const imgProps = pdf.getImageProperties(imgData);
                const pdfNewHeight = (imgProps.height * pdfWidth) / imgProps.width;

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfNewHeight);
                pdf.save(`barakah-report-${currentDate.toISOString().split('T')[0]}.pdf`);

                toast({ title: "تم التوليد بنجاح", description: "تم تنزيل ملف PDF" });
                onClose();
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
            <DialogContent className="sm:max-w-[500px] rtl-content">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl text-primary font-bold flex items-center justify-center gap-2">
                        <Printer className="w-6 h-6" />
                        طباعة التقرير
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
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
                </div>

                <DialogFooter className="sm:justify-center">
                    <Button
                        onClick={handlePrint}
                        disabled={isGenerating}
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
                    >
                        <FileText className="w-4 h-4 ml-2" />
                        {isGenerating ? 'جاري التجهيز...' : 'تجهيز وطباعة'}
                    </Button>
                </DialogFooter>
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
                        // Handle date strings that might be YYYY-MM-DD or full ISO
                        const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
                        return d >= startData && d <= endData;
                    };

                    // Apps
                    const apps = selectedTypes.appointments ? appointments.filter(a => isInRange(a.date)) : [];

                    // Tasks
                    const tsks = selectedTypes.tasks ? tasks.filter(t => !t.deadline || isInRange(t.deadline)) : [];

                    // Prayers
                    let prayers = [];
                    if (selectedTypes.prayerTimes) {
                        try {
                            const storedSchedule = localStorage.getItem('baraka_monthly_schedule');
                            if (storedSchedule) {
                                prayers = JSON.parse(storedSchedule).filter((d: any) => isInRange(d.date));
                            } else {
                                // fallback to today if range logic fails or no monthly data
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
                        medications: selectedTypes.medications ? [{ name: 'Panadol', quantity: '1 tablet' }] : [],
                        shopping: selectedTypes.shopping ? [{ name: 'خبز', quantity: '2' }, { name: 'حليب', quantity: '1L' }] : [],
                        expenses: selectedTypes.expenses ? [{ category: 'طعام', amount: '5000' }] : []
                    };
                })()}
            />
        </Dialog>
    );
};

export default PrintOptionsDialog;
