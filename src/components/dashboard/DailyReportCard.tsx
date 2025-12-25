import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useMedications } from '@/hooks/useMedications';
import { useTasks } from '@/hooks/useTasks';
import { Clock, CheckSquare, CalendarPlus, Pill, Flame } from 'lucide-react';

interface DailyReportCardProps {
    tasks: any[];
    appointments: any[];
    habits: any[];
    medications: any[];
    onNavigateToTab: (tabId: string) => void;
    refetch?: () => void;
}

const DailyReportCard: React.FC<DailyReportCardProps> = ({
    tasks, appointments, habits, medications,
    onNavigateToTab, refetch
}) => {
    const { toast } = useToast();
    const { toggleMedTaken } = useMedications();
    const { updateTask } = useTasks();

    const todayStr = new Date().toISOString().split('T')[0];
    const FILTER_DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const todayName = FILTER_DAY_NAMES[new Date().getDay()];

    const todayTasks = tasks.filter(t => t.deadline === todayStr);
    const todayAppointments = appointments.filter(a => a.date === todayStr);

    // Fix: Filter medications and habits based on frequency and custom days
    const todayMedications = medications.filter(m =>
        m.frequency === 'daily' ||
        (m.frequency === 'specific_days' && m.customDays?.includes(todayName))
    );
    const todayHabits = habits.filter(h =>
        h.frequency === 'daily' ||
        (h.frequency === 'specific_days' && h.customDays?.includes(todayName))
    );

    return (
        // ===== 4. DAILY REPORT =====
        <Card className="border-blue-100 shadow-sm mb-6">
            <CardContent className="p-4">
                <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    التقرير اليومي
                </h3>
                <div className="overflow-y-auto max-h-[280px]">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-white z-10">
                            <tr className="text-xs text-gray-500 border-b">
                                <th className="py-2 px-1 w-8">✓</th>
                                <th className="text-right py-2 px-2">النوع</th>
                                <th className="text-right py-2 px-2">التفاصيل</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {/* Medications */}
                            {todayMedications.map((med, i) => (
                                <tr key={`med-${i}`} className="hover:bg-gray-50">
                                    <td className="py-2 px-1 text-center">
                                        <input
                                            type="checkbox"
                                            checked={med.takenHistory?.[todayStr] || false}
                                            onChange={() => {
                                                toggleMedTaken(med.id, todayStr);
                                                toast({ title: med.takenHistory?.[todayStr] ? 'تم إلغاء التناول' : 'تم تناول الدواء ✓' });
                                            }}
                                            className="w-4 h-4 rounded border-gray-300 text-green-600 cursor-pointer"
                                        />
                                    </td>
                                    <td className="py-2 px-2"><Badge variant="outline" className="bg-red-50 text-red-600 text-[10px]"><Pill className="w-3 h-3 ml-1" />أدوية</Badge></td>
                                    <td className="py-2 px-2 font-medium">{med.name} - {med.time}</td>
                                </tr>
                            ))}
                            {/* Appointments */}
                            {todayAppointments.map((apt, i) => (
                                <tr key={`apt-${i}`} className="hover:bg-gray-50">
                                    <td className="py-2 px-1 text-center">
                                        <input
                                            type="checkbox"
                                            checked={(apt as any).is_completed || false}
                                            onChange={async () => {
                                                const { data: { user } } = await supabase.auth.getUser();
                                                if (!user) return;
                                                await supabase.from('appointments').update({ is_completed: !(apt as any).is_completed }).eq('id', apt.id);
                                                if (refetch) refetch();
                                            }}
                                            className="w-4 h-4 rounded border-gray-300 text-green-600 cursor-pointer"
                                        />
                                    </td>
                                    <td className="py-2 px-2"><Badge variant="outline" className="bg-orange-50 text-orange-600 text-[10px]"><CalendarPlus className="w-3 h-3 ml-1" />موعد</Badge></td>
                                    <td className="py-2 px-2 font-medium">{apt.title} - {apt.time || '--'}</td>
                                </tr>
                            ))}
                            {/* Tasks */}
                            {todayTasks.map((task, i) => (
                                <tr key={`task-${i}`} className={`hover:bg-gray-50 ${(task as any).progress === 100 ? 'opacity-50 line-through' : ''}`}>
                                    <td className="py-2 px-1 text-center">
                                        <input
                                            type="checkbox"
                                            checked={(task as any).progress === 100 || false}
                                            onChange={() => {
                                                updateTask({
                                                    ...task,
                                                    progress: task.progress === 100 ? 0 : 100
                                                });
                                                toast({ title: task.progress === 100 ? 'تم إلغاء الإنجاز' : 'تم إنجاز المهمة ✓' });
                                            }}
                                            className="w-4 h-4 rounded border-gray-300 text-green-600 cursor-pointer"
                                        />
                                    </td>
                                    <td className="py-2 px-2"><Badge variant="outline" className="bg-blue-50 text-blue-600 text-[10px]"><CheckSquare className="w-3 h-3 ml-1" />مهمة</Badge></td>
                                    <td className="py-2 px-2 font-medium">{task.title}</td>
                                </tr>
                            ))}
                            {/* Habits */}
                            {todayHabits.map((habit, i) => (
                                <tr key={`habit-${i}`} className="hover:bg-gray-50">
                                    <td className="py-2 px-1 text-center">
                                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-green-600 cursor-pointer" />
                                    </td>
                                    <td className="py-2 px-2"><Badge variant="outline" className="bg-yellow-50 text-yellow-600 text-[10px]"><Flame className="w-3 h-3 ml-1" />عادة</Badge></td>
                                    <td className="py-2 px-2 font-medium">{habit.name} - 🔥 {habit.streak || 0}</td>
                                </tr>
                            ))}
                            {(todayMedications.length + todayAppointments.length + todayTasks.length + todayHabits.length) === 0 && (
                                <tr><td colSpan={3} className="text-center py-4 text-gray-400">لا توجد عناصر لليوم</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

export default DailyReportCard;
