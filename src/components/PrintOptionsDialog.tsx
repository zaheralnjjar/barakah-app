import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Printer, Calendar, List, Clock, FileText } from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { useHabits } from '@/hooks/useHabits';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { generatePDF } from '@/utils/pdfGenerator';
import { useToast } from '@/hooks/use-toast';

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

    const handlePrint = () => {
        toast({ title: "جاري تحضير التقرير...", description: "يرجى الانتظار قليلاً" });

        // Filter Data based on selection (Mocking items not in hooks yet)
        const printData = {
            tasks: selectedTypes.tasks ? tasks.filter(t => t.progress < 100) : [], // Only pending? Or all? Let's show all pending
            appointments: selectedTypes.appointments ? appointments : [],
            habits: selectedTypes.habits ? habits : [], // habits logic usually per day, here listing titles
            prayerTimes: selectedTypes.prayerTimes ? prayerTimes : [],
            // Mock Data for missing hooks
            medications: selectedTypes.medications ? [{ name: 'Panadol', quantity: '1 tablet' }] : [],
            shopping: selectedTypes.shopping ? [{ name: 'خبز', quantity: '2' }, { name: 'حليب', quantity: '1L' }] : [],
            expenses: selectedTypes.expenses ? [{ category: 'طعام', amount: '5000' }] : []
        };

        const dateStr = currentDate.toLocaleDateString('ar-EG');

        try {
            generatePDF(viewMode, printData, dateStr);
            toast({ title: "تم التوليد بنجاح", description: "تم تنزيل ملف PDF" });
            onClose();
        } catch (error) {
            console.error(error);
            toast({ title: "خطأ", description: "حدث خطأ أثناء توليد التقرير", variant: "destructive" });
        }
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
                    <Button onClick={handlePrint} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90">
                        <FileText className="w-4 h-4 ml-2" />
                        تجهيز وطباعة
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PrintOptionsDialog;
