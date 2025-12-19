import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    Calendar,
    Clock,
    Bell,
    Plus,
    Trash2,
    Check,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

interface Appointment {
    id: string;
    title: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    reminderMinutes: number;
    isCompleted: boolean;
    parentId?: string; // For subtasks
    createdAt: string;
}

const STORAGE_KEY = 'baraka_appointments';

const AppointmentManager: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [newTitle, setNewTitle] = useState('');
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [reminderMinutes, setReminderMinutes] = useState(15);
    const [showCompleted, setShowCompleted] = useState(false);
    const { toast } = useToast();

    // Load appointments
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setAppointments(JSON.parse(saved));
            } catch (e) { }
        }
    }, []);

    // Save appointments
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
    }, [appointments]);

    // Schedule notifications
    useEffect(() => {
        if (!('Notification' in window)) return;

        const now = new Date();
        appointments.forEach(apt => {
            if (apt.isCompleted) return;

            const aptDateTime = new Date(`${apt.date}T${apt.time}`);
            const reminderTime = new Date(aptDateTime.getTime() - apt.reminderMinutes * 60000);

            if (reminderTime > now) {
                const timeout = reminderTime.getTime() - now.getTime();
                if (timeout < 86400000) { // Only schedule if within 24 hours
                    setTimeout(() => {
                        if (Notification.permission === 'granted') {
                            new Notification('تذكير من بركة', {
                                body: `📅 ${apt.title} بعد ${apt.reminderMinutes} دقيقة`,
                                icon: '/icons/icon-192x192.png'
                            });
                        }
                    }, timeout);
                }
            }
        });
    }, [appointments]);

    const addAppointment = () => {
        if (!newTitle.trim() || !newDate || !newTime) {
            toast({ title: 'يرجى ملء جميع الحقول', variant: 'destructive' });
            return;
        }

        const newApt: Appointment = {
            id: Date.now().toString(),
            title: newTitle.trim(),
            date: newDate,
            time: newTime,
            reminderMinutes,
            isCompleted: false,
            createdAt: new Date().toISOString()
        };

        setAppointments(prev => [...prev, newApt].sort((a, b) =>
            new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
        ));

        setNewTitle('');
        setNewDate('');
        setNewTime('');
        toast({ title: '✅ تم إضافة الموعد' });

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    };

    const toggleComplete = (id: string) => {
        setAppointments(prev => prev.map(apt =>
            apt.id === id ? { ...apt, isCompleted: !apt.isCompleted } : apt
        ));
    };

    const deleteAppointment = (id: string) => {
        setAppointments(prev => prev.filter(apt => apt.id !== id));
        toast({ title: '🗑️ تم الحذف' });
    };

    const exportToCalendar = (apt: Appointment) => {
        const startDate = new Date(`${apt.date}T${apt.time}`);
        const endDate = new Date(startDate.getTime() + 3600000); // 1 hour duration

        // Create ICS content
        const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}
DTEND:${endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}
SUMMARY:${apt.title}
DESCRIPTION:موعد من تطبيق بركة
BEGIN:VALARM
TRIGGER:-PT${apt.reminderMinutes}M
ACTION:DISPLAY
DESCRIPTION:تذكير
END:VALARM
END:VEVENT
END:VCALENDAR`;

        const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${apt.title}.ics`;
        link.click();
        URL.revokeObjectURL(url);

        toast({ title: '📅 تم تصدير الموعد للتقويم' });
    };

    const pendingApts = appointments.filter(a => !a.isCompleted);
    const completedApts = appointments.filter(a => a.isCompleted);

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('ar-EG', {
            weekday: 'short', month: 'short', day: 'numeric'
        });
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="arabic-title text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    المواعيد والتذكيرات
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Add New Appointment */}
                <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                    <Input
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        placeholder="عنوان الموعد..."
                        className="arabic-body"
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            type="date"
                            value={newDate}
                            onChange={e => setNewDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                        />
                        <Input
                            type="time"
                            value={newTime}
                            onChange={e => setNewTime(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={reminderMinutes}
                            onChange={e => setReminderMinutes(Number(e.target.value))}
                            className="flex-1 h-10 rounded-md border px-3 arabic-body text-sm"
                        >
                            <option value={5}>تذكير قبل 5 دقائق</option>
                            <option value={15}>تذكير قبل 15 دقيقة</option>
                            <option value={30}>تذكير قبل 30 دقيقة</option>
                            <option value={60}>تذكير قبل ساعة</option>
                        </select>
                        <Button onClick={addAppointment} size="sm">
                            <Plus className="w-4 h-4 ml-1" /> إضافة
                        </Button>
                    </div>
                </div>

                {/* Pending Appointments */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {pendingApts.length === 0 ? (
                        <p className="text-center text-muted-foreground arabic-body text-sm py-4">
                            لا توجد مواعيد قادمة
                        </p>
                    ) : (
                        pendingApts.map(apt => (
                            <div key={apt.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                                <button onClick={() => toggleComplete(apt.id)} className="text-gray-400 hover:text-green-500">
                                    <Check className="w-5 h-5" />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className="arabic-body text-sm font-medium truncate">{apt.title}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{formatDate(apt.date)}</span>
                                        <span>{apt.time}</span>
                                        <Badge variant="outline" className="text-[10px]">
                                            <Bell className="w-2 h-2 ml-1" />{apt.reminderMinutes}د
                                        </Badge>
                                    </div>
                                </div>
                                <Button size="icon" variant="ghost" onClick={() => exportToCalendar(apt)} className="h-8 w-8">
                                    <Calendar className="w-4 h-4 text-blue-500" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => deleteAppointment(apt.id)} className="h-8 w-8">
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>

                {/* Completed Toggle */}
                {completedApts.length > 0 && (
                    <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className="flex items-center gap-1 text-sm text-muted-foreground arabic-body"
                    >
                        {showCompleted ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {completedApts.length} في السجل (سابق)
                    </button>
                )}

                {showCompleted && (
                    <div className="space-y-1 opacity-60">
                        {completedApts.map(apt => (
                            <div key={apt.id} className="flex items-center gap-2 p-2 rounded line-through">
                                <Check className="w-4 h-4 text-green-500" />
                                <span className="arabic-body text-sm">{apt.title}</span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default AppointmentManager;

// Export function for AI assistant
export const addAppointmentFromAI = (title: string, date?: string, time?: string, reminderMinutes = 15): boolean => {
    try {
        const appointments = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

        // Default to tomorrow if no date
        const aptDate = date || new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const aptTime = time || '09:00';

        const newApt: Appointment = {
            id: Date.now().toString(),
            title,
            date: aptDate,
            time: aptTime,
            reminderMinutes,
            isCompleted: false,
            createdAt: new Date().toISOString()
        };

        appointments.push(newApt);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
        return true;
    } catch {
        return false;
    }
};
