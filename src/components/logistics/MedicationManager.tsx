import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, BarChart2, Pill, Calendar, TrendingUp, Check } from 'lucide-react';
import { useMedications, Medication } from '@/hooks/useMedications';

export const MedicationManager = () => {
    const { medications, addMedication, toggleMedTaken, deleteMedication } = useMedications();
    const [showMedDialog, setShowMedDialog] = useState(false);
    const [showStats, setShowStats] = useState(false);

    // Form State
    const [newMedication, setNewMedication] = useState<Omit<Medication, 'id' | 'takenHistory'>>({
        name: '',
        time: '08:00',
        frequency: 'daily',
        customDays: [],
        customTimes: {},
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        isPermanent: true,
        reminder: true
    });

    const DAYS_AR = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

    const handleSave = () => {
        if (!newMedication.name) return;
        addMedication(newMedication);
        setNewMedication({
            name: '', time: '08:00', frequency: 'daily', customDays: [], customTimes: {},
            startDate: new Date().toISOString().split('T')[0], endDate: '', isPermanent: true, reminder: true
        });
        setShowMedDialog(false);
    };

    // Stats calculations
    const todayStr = new Date().toISOString().split('T')[0];
    const dayMap = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const todayDayName = dayMap[new Date().getDay()];

    const todayDueMeds = medications.filter(med =>
        med.frequency === 'daily' || (med.frequency === 'specific_days' && med.customDays?.includes(todayDayName))
    );
    const takenToday = todayDueMeds.filter(med => (med.takenHistory || {})[todayStr]).length;
    const adherenceRate = todayDueMeds.length > 0 ? Math.round((takenToday / todayDueMeds.length) * 100) : 100;

    // Weekly adherence
    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toISOString().split('T')[0]);
        }
        return days;
    };

    const weeklyStats = getLast7Days().map(day => {
        const dayObj = new Date(day);
        const dayName = dayMap[dayObj.getDay()];
        const dueMeds = medications.filter(med =>
            med.frequency === 'daily' || (med.frequency === 'specific_days' && med.customDays?.includes(dayName))
        );
        const taken = dueMeds.filter(med => (med.takenHistory || {})[day]).length;
        return {
            date: day,
            dayName: dayObj.toLocaleDateString('ar', { weekday: 'short' }),
            taken,
            total: dueMeds.length
        };
    });

    return (
        <>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle
                        className="arabic-title text-base flex items-center justify-between cursor-pointer hover:text-primary"
                        onClick={() => setShowStats(true)}
                    >
                        <span className="flex items-center gap-2">
                            💊 متتبع الأدوية
                            <BarChart2 className="w-4 h-4 text-gray-400" />
                        </span>
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setShowMedDialog(true); }}>
                            <Plus className="w-3 h-3 ml-1" /> إضافة دواء
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-sm">أدويتك المسجلة</span>
                        </div>
                        <div className="space-y-2">
                            {medications.map(med => {
                                const todayDate = new Date();
                                const todayStr = todayDate.toISOString().split('T')[0];
                                const dayMap = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
                                const todayDayName = dayMap[todayDate.getDay()];

                                const isTodayDue = med.frequency === 'daily' ||
                                    (med.frequency === 'specific_days' && med.customDays?.includes(todayDayName));

                                const isTaken = !!(med.takenHistory || {})[todayStr];

                                return (
                                    <div key={med.id} className={`flex items-center justify-between p-2 bg-white rounded border ${isTodayDue ? 'border-l-4 border-l-primary' : 'opacity-70'}`}>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={isTaken}
                                                onChange={() => toggleMedTaken(med.id, todayStr)}
                                                className="accent-green-600 w-4 h-4"
                                                disabled={!isTodayDue}
                                            />
                                            <div>
                                                <span className={`block text-sm font-bold ${isTaken ? 'line-through text-gray-400' : ''} ${!isTodayDue ? 'text-gray-500' : ''}`}>{med.name}</span>
                                                <div className="flex gap-2 text-[10px] text-gray-500">
                                                    <span>⏰ {med.time}</span>
                                                    <span>🔄 {med.frequency === 'daily' ? 'يومي' : med.frequency === 'weekly' ? 'أسبوعي' : med.frequency === 'monthly' ? 'شهري' : med.customDays?.join(', ')}</span>
                                                </div>

                                            </div>
                                        </div>
                                        <Trash2 className="w-4 h-4 text-red-400 cursor-pointer hover:text-red-600" onClick={() => deleteMedication(med.id)} />
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </CardContent>

                <Dialog open={showMedDialog} onOpenChange={setShowMedDialog}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-right">إضافة دواء جديد</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <label>اسم الدواء</label>
                                <Input
                                    value={newMedication.name}
                                    onChange={e => setNewMedication({ ...newMedication, name: e.target.value })}
                                    className="text-right"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <label>عدد المرات يومياً</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={Object.keys(newMedication.customTimes || {}).length || 1}
                                        onChange={e => {
                                            const count = Number(e.target.value);
                                            const times: { [key: string]: string } = {};
                                            for (let i = 0; i < count; i++) {
                                                times[`dose_${i}`] = newMedication.customTimes?.[`dose_${i}`] || '';
                                            }
                                            setNewMedication({ ...newMedication, customTimes: times });
                                        }}
                                    >
                                        <option value="1">مرة واحدة</option>
                                        <option value="2">مرتين</option>
                                        <option value="3">3 مرات</option>
                                        <option value="4">4 مرات</option>
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <label>التكرار</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={newMedication.frequency}
                                        onChange={e => setNewMedication({ ...newMedication, frequency: e.target.value as any })}
                                    >
                                        <option value="daily">يومي</option>
                                        <option value="specific_days">أيام محددة</option>
                                        <option value="weekly">أسبوعي</option>
                                        <option value="monthly">شهري</option>
                                    </select>
                                </div>
                            </div>

                            {/* Time inputs for each dose */}
                            {Object.keys(newMedication.customTimes || {}).length > 0 ? (
                                <div className="grid gap-2">
                                    <label className="text-sm font-bold">أوقات الجرعات</label>
                                    <div className="space-y-2">
                                        {Object.keys(newMedication.customTimes || {}).map((key, i) => (
                                            <div key={key} className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500 w-16">الجرعة {i + 1}:</span>
                                                <Input
                                                    type="time"
                                                    value={newMedication.customTimes?.[key] || ''}
                                                    onChange={e => setNewMedication({
                                                        ...newMedication,
                                                        customTimes: { ...newMedication.customTimes, [key]: e.target.value }
                                                    })}
                                                    className="flex-1"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-2">
                                    <label>وقت الجرعة</label>
                                    <Input
                                        type="time"
                                        value={newMedication.time}
                                        onChange={e => setNewMedication({ ...newMedication, time: e.target.value })}
                                    />
                                </div>
                            )}

                            {newMedication.frequency === 'specific_days' && (
                                <div className="grid gap-2">
                                    <label className="text-sm font-bold">جدول الأيام والأوقات</label>
                                    <div className="space-y-2 border rounded-lg p-2 max-h-[200px] overflow-y-auto">
                                        {DAYS_AR.map(day => {
                                            const isSelected = newMedication.customDays.includes(day);
                                            return (
                                                <div key={day} className={`flex items-center justify-between p-2 rounded ${isSelected ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50'}`}>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                let newDays = [...newMedication.customDays];
                                                                let newTimes = { ...(newMedication.customTimes || {}) };

                                                                if (checked) {
                                                                    newDays.push(day);
                                                                    // Default time for this day is the main time
                                                                    newTimes[day] = newMedication.time;
                                                                } else {
                                                                    newDays = newDays.filter(d => d !== day);
                                                                    delete newTimes[day];
                                                                }
                                                                setNewMedication({ ...newMedication, customDays: newDays, customTimes: newTimes });
                                                            }}
                                                            className="w-4 h-4 accent-indigo-600"
                                                        />
                                                        <span className="text-sm font-medium">{day}</span>
                                                    </div>

                                                    {isSelected && (
                                                        <Input
                                                            type="time"
                                                            value={newMedication.customTimes?.[day] || newMedication.time}
                                                            onChange={(e) => {
                                                                setNewMedication({
                                                                    ...newMedication,
                                                                    customTimes: {
                                                                        ...newMedication.customTimes,
                                                                        [day]: e.target.value
                                                                    }
                                                                });
                                                            }}
                                                            className="w-32 h-8 text-xs"
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={newMedication.isPermanent}
                                    onChange={e => setNewMedication({ ...newMedication, isPermanent: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label>دواء دائم (بدون تاريخ انتهاء)</label>
                            </div>

                            {!newMedication.isPermanent && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <label>تاريخ البدء</label>
                                        <Input type="date" value={newMedication.startDate} onChange={e => setNewMedication({ ...newMedication, startDate: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label>تاريخ الانتهاء</label>
                                        <Input type="date" value={newMedication.endDate} onChange={e => setNewMedication({ ...newMedication, endDate: e.target.value })} />
                                    </div>
                                </div>
                            )}

                            <Button onClick={handleSave} className="w-full mt-2">حفظ الدواء</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </Card>

            {/* Stats Modal */}
            <Dialog open={showStats} onOpenChange={setShowStats}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-right flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-blue-500" />
                            إحصائيات الأدوية
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-50 p-3 rounded-lg text-center">
                                <Pill className="w-6 h-6 mx-auto text-blue-500 mb-1" />
                                <p className="text-2xl font-bold text-blue-600">{medications.length}</p>
                                <p className="text-xs text-gray-500">إجمالي الأدوية</p>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg text-center">
                                <Check className="w-6 h-6 mx-auto text-green-500 mb-1" />
                                <p className="text-2xl font-bold text-green-600">{adherenceRate}%</p>
                                <p className="text-xs text-gray-500">نسبة الالتزام اليوم</p>
                            </div>
                            <div className="bg-purple-50 p-3 rounded-lg text-center">
                                <Calendar className="w-6 h-6 mx-auto text-purple-500 mb-1" />
                                <p className="text-2xl font-bold text-purple-600">{todayDueMeds.length}</p>
                                <p className="text-xs text-gray-500">أدوية اليوم</p>
                            </div>
                            <div className="bg-orange-50 p-3 rounded-lg text-center">
                                <TrendingUp className="w-6 h-6 mx-auto text-orange-500 mb-1" />
                                <p className="text-2xl font-bold text-orange-600">{takenToday}</p>
                                <p className="text-xs text-gray-500">تم تناولها</p>
                            </div>
                        </div>

                        {/* Weekly Progress */}
                        <div className="border-t pt-3">
                            <h4 className="text-sm font-bold mb-2">الالتزام الأسبوعي</h4>
                            <div className="flex justify-between gap-1">
                                {weeklyStats.map((day, idx) => (
                                    <div key={idx} className="flex-1 text-center">
                                        <div className="h-16 bg-gray-100 rounded relative overflow-hidden">
                                            <div
                                                className="absolute bottom-0 w-full bg-blue-400 transition-all"
                                                style={{ height: day.total > 0 ? `${(day.taken / day.total) * 100}%` : '0%' }}
                                            />
                                        </div>
                                        <p className="text-[10px] mt-1">{day.dayName}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Individual Medications */}
                        <div className="border-t pt-3">
                            <h4 className="text-sm font-bold mb-2">تفاصيل الأدوية</h4>
                            <div className="space-y-2 max-h-[150px] overflow-y-auto">
                                {medications.map(med => {
                                    const isTaken = (med.takenHistory || {})[todayStr];
                                    return (
                                        <div key={med.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <span className="text-sm">{med.name}</span>
                                            <span className={`text-sm ${isTaken ? 'text-green-600' : 'text-gray-400'}`}>
                                                {isTaken ? '✅ تم' : '⏳ معلق'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
