import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2 } from 'lucide-react';
import { useMedications, Medication } from '@/hooks/useMedications';

export const MedicationManager = () => {
    const { medications, addMedication, toggleMedTaken, deleteMedication } = useMedications();
    const [showMedDialog, setShowMedDialog] = useState(false);

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

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="arabic-title text-base flex items-center justify-between">
                    <span>💊 متتبع الأدوية</span>
                    <Button size="sm" variant="outline" onClick={() => setShowMedDialog(true)}>
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
                                <label>وقت الجرعة</label>
                                <Input
                                    type="time"
                                    value={newMedication.time}
                                    onChange={e => setNewMedication({ ...newMedication, time: e.target.value })}
                                />
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

                        {newMedication.frequency === 'specific_days' && (
                            <div className="grid gap-2">
                                <label className="text-sm font-bold">حدد الأيام</label>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS_AR.map(day => (
                                        <button
                                            key={day}
                                            className={`px-3 py-1 rounded-full text-xs border ${newMedication.customDays.includes(day) ? 'bg-primary text-white border-primary' : 'bg-gray-100 text-gray-600'}`}
                                            onClick={() => {
                                                const current = newMedication.customDays;
                                                if (current.includes(day)) {
                                                    setNewMedication({ ...newMedication, customDays: current.filter(d => d !== day) });
                                                } else {
                                                    setNewMedication({ ...newMedication, customDays: [...current, day] });
                                                }
                                            }}
                                        >
                                            {day}
                                        </button>
                                    ))}
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
    );
};
