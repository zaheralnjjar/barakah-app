import React, { useState } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useHabits } from '@/hooks/useHabits';
import { useMedications } from '@/hooks/useMedications';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { useFinance } from '@/hooks/useFinance';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';

import DashboardHeaderStrip from '@/components/dashboard/DashboardHeaderStrip';
import QuickActionsGrid from '@/components/dashboard/QuickActionsGrid';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { CollapsibleSection } from '@/components/dashboard/CollapsibleSection';
import { DashboardNotes } from '@/components/dashboard/widgets/DashboardNotes';
import { DashboardShopping } from '@/components/dashboard/widgets/DashboardShopping';
import DashboardCalendar from '@/components/dashboard/DashboardCalendar';
import PomodoroTimer from '@/components/PomodoroTimer';
import { GlobalSearchDialog } from '@/components/GlobalSearchDialog';
import AppointmentManager from '@/components/AppointmentManager';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CalendarPlus, CheckSquare, DollarSign, FileText } from 'lucide-react';

interface SmartDashboardProps {
    onNavigateToTab: (tab: string) => void;
    onOpenVoiceRecorder: () => void;
}

const SmartDashboard: React.FC<SmartDashboardProps> = ({ onNavigateToTab, onOpenVoiceRecorder }) => {
    const { toast } = useToast();
    const { financeData, dailyLimit: dailyLimitARS } = useFinance();
    const { prayerTimes } = usePrayerTimes();
    const { tasks, addTask } = useTasks();
    const { appointments } = useAppointments();
    const { habits } = useHabits();
    const { medications } = useMedications();
    const { refetch } = useDashboardData();

    const [showAddDialog, setShowAddDialog] = useState<string | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [weekStartDate, setWeekStartDate] = useState(new Date());

    const todayExpense = React.useMemo(() => {
        if (!financeData?.pending_expenses) return 0;
        const todayStr = new Date().toISOString().split('T')[0];
        return financeData.pending_expenses
            .filter((t: any) => t.type === 'expense' && t.timestamp.startsWith(todayStr))
            .reduce((sum: number, t: any) => sum + (t.currency === 'ARS' ? t.amount : t.amount * (financeData?.exchange_rate || 1200)), 0);
    }, [financeData]);

    const handleQuickParking = () => {
        toast({ title: "تم تسجيل الموقع", description: "تم حفظ موقع ركن السيارة الحالي" });
    };

    return (
        <div className="flex flex-col w-full animate-fade-in pb-20">
            <DashboardHeaderStrip />
            <div className="px-3 sm:px-4 space-y-4 max-w-4xl mx-auto mt-2 w-full">
                <QuickActionsGrid
                    onOpenAddDialog={setShowAddDialog}
                    onOpenTimer={() => { }}
                    onOpenVoiceRecorder={onOpenVoiceRecorder}
                    onNavigateToTab={onNavigateToTab}
                    onOpenSearch={() => setIsSearchOpen(true)}
                    onQuickParking={handleQuickParking}
                />
                <DashboardStats
                    onNavigateToFinance={() => onNavigateToTab('finance')}
                    todayExpense={todayExpense}
                    dailyLimitARS={dailyLimitARS || 0}
                    financeData={{
                        current_balance_ars: financeData?.current_balance_ars || 0,
                        exchange_rate: financeData?.exchange_rate || 1200
                    }}
                    newMuslimsCount={0}
                />
                <CollapsibleSection title="الملاحظات السريعة" icon={FileText} defaultOpen={false}>
                    <DashboardNotes />
                </CollapsibleSection>
                <CollapsibleSection title="التقويم والمواعيد" icon={CalendarPlus} defaultOpen={false}>
                    <DashboardCalendar
                        tasks={tasks}
                        appointments={appointments}
                        habits={habits}
                        medications={medications}
                        prayerTimes={prayerTimes}
                        onNavigateToTab={onNavigateToTab}
                        weekStartDate={weekStartDate}
                        setWeekStartDate={setWeekStartDate}
                        refetch={refetch}
                    />
                </CollapsibleSection>
                <CollapsibleSection title="قائمة التسوق" icon={DollarSign} defaultOpen={false}>
                    <DashboardShopping />
                </CollapsibleSection>
                <PomodoroTimer hideTrigger={true} />
            </div>
            <GlobalSearchDialog
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onNavigateToTab={onNavigateToTab}
            />
            <Dialog open={showAddDialog !== null} onOpenChange={(open) => !open && setShowAddDialog(null)}>
                <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4" dir="rtl">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-right flex items-center gap-2 text-lg text-primary">
                            {showAddDialog === 'appointment' && <><CalendarPlus className="w-5 h-5 text-orange-500" /> إضافة موعد</>}
                            {showAddDialog === 'task' && <><CheckSquare className="w-5 h-5 text-blue-500" /> إضافة مهمة</>}
                        </DialogTitle>
                    </DialogHeader>
                    {showAddDialog === 'appointment' && <AppointmentManager />}
                    {showAddDialog === 'task' && (
                        <div className="space-y-4 py-2">
                            <Input id="task-title-dialog" placeholder="عنوان المهمة" className="text-right" />
                            <Button className="w-full bg-blue-600" onClick={async () => {
                                const el = document.getElementById('task-title-dialog') as HTMLInputElement;
                                if (el && el.value) {
                                    await addTask({ title: el.value, deadline: new Date().toISOString().split('T')[0], priority: 'medium', type: 'task' });
                                    setShowAddDialog(null);
                                }
                            }}>حفظ المهمة</Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SmartDashboard;
