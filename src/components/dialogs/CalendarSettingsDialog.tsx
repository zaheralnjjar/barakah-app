import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarService } from '@/services/CalendarService';
import { Calendar, RefreshCcw, Save } from 'lucide-react';
import { toast } from 'sonner';

interface CalendarSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const CalendarSettingsDialog: React.FC<CalendarSettingsDialogProps> = ({ open, onOpenChange }) => {
    const [calendars, setCalendars] = useState<{ id: string; title: string; source?: string }[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            loadCalendars();
        }
    }, [open]);

    const loadCalendars = async () => {
        setLoading(true);
        try {
            // Load available
            const list = await CalendarService.listCalendars();
            setCalendars(list);

            // Load saved selection
            const saved = CalendarService.getSelectedCalendars();

            // If nothing saved, select all by default (first time ux) or none?
            // Usually select all is better for "it just works".
            // But logic in Service says check localStorage. If empty [], currently returns [].
            // If [] means "show all" logic needs to be in Service or here.
            // Let's assume [] means "Show All" or we force select all initially.
            // Let's stick to explicit selection. If empty, maybe select all? 
            // Better to show what is selected.

            if (saved.length === 0 && list.length > 0) {
                // Option: Auto-select all if nothing saved yet
                const allIds = list.map(c => c.id);
                setSelectedIds(allIds);
            } else {
                setSelectedIds(saved);
            }

        } catch (e) {
            console.error(e);
            toast.error('فشل في تحميل التقويمات');
        } finally {
            setLoading(false);
        }
    };

    const toggleCalendar = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(c => c !== id));
        }
    };

    const handleSave = () => {
        CalendarService.setSelectedCalendars(selectedIds);
        toast.success('تم حفظ إعدادات المزامنة');
        onOpenChange(false);
        // Force reload of dashboard events? 
        // Ideally prompt user or trigger strict reload.
        window.location.reload(); // Hard reload to verify changes immediately for now
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader className="text-right">
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                        إعدادات مزامنة التقويم
                    </DialogTitle>
                    <DialogDescription>
                        حدد التقويمات التي تريد عرضها في التطبيق من جهازك.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 py-4 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center p-8 text-gray-400">
                            <RefreshCcw className="w-6 h-6 animate-spin" />
                        </div>
                    ) : calendars.length === 0 ? (
                        <p className="text-center text-sm text-gray-500 py-4">
                            لا توجد تقويمات متاحة على هذا الجهاز. تأكد من إعداد حساب Google/Samsung.
                        </p>
                    ) : (
                        calendars.map(cal => (
                            <div key={cal.id} className="flex items-center space-x-2 space-x-reverse border p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                <Checkbox
                                    id={cal.id}
                                    checked={selectedIds.includes(cal.id)}
                                    onCheckedChange={(c) => toggleCalendar(cal.id, c as boolean)}
                                />
                                <div className="grid gap-0.5 flex-1 mr-3">
                                    <label
                                        htmlFor={cal.id}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                        {cal.title}
                                    </label>
                                    {cal.source && (
                                        <span className="text-xs text-muted-foreground">{cal.source}</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        إلغاء
                    </Button>
                    <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                        <Save className="w-4 h-4" />
                        حفظ التغييرات
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
