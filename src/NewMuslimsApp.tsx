import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, StickyNote, Calendar } from 'lucide-react';
import NewMuslimsManager from '@/components/NewMuslims/NewMuslimsManager';
import { DashboardNotes } from '@/components/dashboard/widgets/DashboardNotes';
import DashboardCalendar from '@/components/dashboard/DashboardCalendar';
import { useTasks } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { useHabits } from '@/hooks/useHabits';
import { useMedications } from '@/hooks/useMedications';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Toaster } from '@/components/ui/toaster';

const NewMuslimsApp: React.FC = () => {
    const [activeTab, setActiveTab] = useState('newmuslims');
    const [weekStartDate, setWeekStartDate] = useState(new Date());

    // Data hooks for calendar
    const { tasks } = useTasks();
    const { appointments } = useAppointments();
    const { habits } = useHabits();
    const { medications } = useMedications();
    const { prayerTimes = [], refetch } = useDashboardData();

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50" dir="rtl">
            {/* Header */}
            <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 shadow-lg">
                <h1 className="text-xl font-bold text-center flex items-center justify-center gap-2">
                    <Users className="w-6 h-6" />
                    مركز رعاية المهتدين
                </h1>
                <p className="text-center text-emerald-100 text-sm mt-1">
                    إدارة ومتابعة الطلاب الجدد
                </p>
            </header>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="p-4 space-y-4">
                    <TabsContent value="newmuslims" className="mt-0">
                        <NewMuslimsManager />
                    </TabsContent>

                    <TabsContent value="notes" className="mt-0">
                        <div className="bg-white rounded-xl shadow-sm border p-4">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <StickyNote className="w-5 h-5 text-amber-500" />
                                الملاحظات
                            </h2>
                            <DashboardNotes />
                        </div>
                    </TabsContent>

                    <TabsContent value="calendar" className="mt-0">
                        <div className="bg-white rounded-xl shadow-sm border p-4">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-500" />
                                التقويم والمواعيد
                            </h2>
                            <DashboardCalendar
                                tasks={tasks}
                                appointments={appointments}
                                habits={habits}
                                medications={medications}
                                prayerTimes={prayerTimes}
                                onNavigateToTab={() => { }}
                                weekStartDate={weekStartDate}
                                setWeekStartDate={setWeekStartDate}
                                refetch={refetch}
                            />
                        </div>
                    </TabsContent>
                </div>

                {/* Bottom Navigation */}
                <TabsList className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t shadow-lg rounded-none grid grid-cols-3 gap-0">
                    <TabsTrigger
                        value="newmuslims"
                        className="flex flex-col items-center gap-1 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600 rounded-none h-full"
                    >
                        <Users className="w-5 h-5" />
                        <span className="text-xs">المهتدين</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="notes"
                        className="flex flex-col items-center gap-1 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-600 rounded-none h-full"
                    >
                        <StickyNote className="w-5 h-5" />
                        <span className="text-xs">الملاحظات</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="calendar"
                        className="flex flex-col items-center gap-1 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 rounded-none h-full"
                    >
                        <Calendar className="w-5 h-5" />
                        <span className="text-xs">التقويم</span>
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <Toaster />
        </div>
    );
};

export default NewMuslimsApp;
