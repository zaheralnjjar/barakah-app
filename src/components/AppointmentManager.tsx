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
    ChevronUp,
    Edit2,
    MapPin
} from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

interface Appointment {
    id: string;
    title: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    reminderMinutes: number;
    isCompleted: boolean;
    parentId?: string; // For subtasks
    createdAt: string;
    recurrence?: 'none' | 'daily' | 'weekly' | 'monthly'; // Recurring reminder
    location?: string; // Location address
    latitude?: number;
    longitude?: number;
}

import { supabase } from '@/integrations/supabase/client';

const USER_SETTINGS_TABLE = 'user_settings';

const RECURRENCE_OPTIONS = [
    { value: 'none', label: 'مرة واحدة' },
    { value: 'daily', label: 'يومي' },
    { value: 'weekly', label: 'أسبوعي' },
    { value: 'monthly', label: 'شهري' },
];

const AppointmentManager: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [newTitle, setNewTitle] = useState('');
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [newLocation, setNewLocation] = useState('');
    const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [reminderMinutes, setReminderMinutes] = useState(15);
    const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
    const [showCompleted, setShowCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Edit State
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingApt, setEditingApt] = useState<Appointment | null>(null);

    const { toast } = useToast();
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

    // Get user location once
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => console.log('Location not available')
            );
        }
    }, []);

    // Calculate distance between two points
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    // Address autocomplete search
    const searchAddress = async (query: string) => {
        if (query.length < 2) {
            setLocationSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        try {
            // Add user location for better results
            let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&accept-language=ar`;
            if (userLocation) {
                url += `&viewbox=${userLocation.lng - 0.5},${userLocation.lat - 0.5},${userLocation.lng + 0.5},${userLocation.lat + 0.5}&bounded=0`;
            }

            const res = await fetch(url);
            let data = await res.json();

            // Sort by distance if user location available
            if (userLocation && data.length > 0) {
                data = data.map((item: any) => ({
                    ...item,
                    distance: getDistance(userLocation.lat, userLocation.lng, parseFloat(item.lat), parseFloat(item.lon))
                })).sort((a: any, b: any) => a.distance - b.distance).slice(0, 5);
            }

            setLocationSuggestions(data);
            setShowSuggestions(data.length > 0);
        } catch (e) {
            console.log('Address search failed:', e);
        }
    };

    const handleLocationChange = (value: string) => {
        setNewLocation(value);
        // Debounce search
        const timeout = setTimeout(() => searchAddress(value), 300);
        return () => clearTimeout(timeout);
    };

    const selectSuggestion = (suggestion: any) => {
        setNewLocation(suggestion.display_name);
        setShowSuggestions(false);
        setLocationSuggestions([]);
    };

    // Load appointments from Supabase
    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: true });

            if (error) throw error;

            if (data) {
                // Map DB columns to frontend interface
                const mappedAppointments: Appointment[] = data.map(apt => ({
                    id: apt.id,
                    title: apt.title,
                    date: apt.date,
                    time: apt.time,
                    reminderMinutes: apt.reminder_minutes,
                    isCompleted: apt.is_completed,
                    createdAt: apt.created_at
                }));
                // Sort by full timestamp
                mappedAppointments.sort((a, b) =>
                    new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
                );
                setAppointments(mappedAppointments);
            }
        } catch (error) {
            console.error('Error fetching appointments:', error);
            toast({ title: 'خطأ في تحميل المواعيد', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    // Schedule notifications (Client side logic remains same, runs dynamically based on state)
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

    const addAppointment = async () => {
        if (!newTitle.trim() || !newDate || !newTime) {
            toast({ title: 'يرجى ملء جميع الحقول', variant: 'destructive' });
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast({ title: 'يرجى تسجيل الدخول', variant: 'destructive' });
                return;
            }

            const newApt = {
                id: crypto.randomUUID(), // Generate UUID for DB
                user_id: user.id,
                title: newTitle.trim(),
                date: newDate,
                time: newTime,
                reminder_minutes: reminderMinutes,
                is_completed: false,
                location: newLocation.trim() || null,
            };

            const { error } = await supabase
                .from('appointments')
                .insert(newApt);

            if (error) throw error;

            // If location is provided, save it to saved_locations as well
            if (newLocation.trim()) {
                try {
                    // Get existing locations
                    const { data: settingsData, error: settingsError } = await supabase
                        .from(USER_SETTINGS_TABLE)
                        .select('saved_locations')
                        .eq('user_id', user.id)
                        .single();

                    const existingLocations = settingsData?.saved_locations || [];

                    // Add new location with appointment name
                    const newSavedLocation = {
                        id: Date.now().toString(),
                        name: `📅 ${newTitle.trim()}`, // Mark as appointment location
                        type: 'other',
                        address: newLocation.trim(),
                        latitude: 0,
                        longitude: 0,
                        createdAt: new Date().toISOString(),
                    };

                    // Check if location already exists
                    const locationExists = existingLocations.some((loc: any) =>
                        loc.address === newLocation.trim() || loc.name === newSavedLocation.name
                    );

                    if (!locationExists) {
                        const updatedLocations = [newSavedLocation, ...existingLocations];

                        if (settingsError || !settingsData) {
                            // Create new settings record
                            await supabase
                                .from(USER_SETTINGS_TABLE)
                                .upsert({
                                    user_id: user.id,
                                    saved_locations: updatedLocations
                                }, { onConflict: 'user_id' });
                        } else {
                            // Update existing record
                            await supabase
                                .from(USER_SETTINGS_TABLE)
                                .update({ saved_locations: updatedLocations })
                                .eq('user_id', user.id);
                        }

                        toast({ title: '📍 تم حفظ الموقع أيضاً', description: newLocation.trim().substring(0, 50) });
                    }
                } catch (locError) {
                    console.log('Could not save location:', locError);
                }
            }

            toast({ title: '✅ تم إضافة الموعد' });

            // Clear inputs
            setNewTitle('');
            setNewDate('');
            setNewTime('');
            setNewLocation('');

            // Reload data
            fetchAppointments();

            // Request notification permission
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }

        } catch (error) {
            console.error('Error adding appointment:', error);
            toast({ title: 'فشل حفظ الموعد', variant: 'destructive' });
        }
    };

    const toggleComplete = async (id: string) => {
        try {
            const apt = appointments.find(a => a.id === id);
            if (!apt) return;

            const { error } = await supabase
                .from('appointments')
                .update({ is_completed: !apt.isCompleted })
                .eq('id', id);

            if (error) throw error;

            // Optimistic update
            setAppointments(prev => prev.map(a =>
                a.id === id ? { ...a, isCompleted: !a.isCompleted } : a
            ));

        } catch (error) {
            console.error(error);
            toast({ title: 'خطأ في التحديث', variant: 'destructive' });
        }
    };

    const deleteAppointment = async (id: string) => {
        try {
            const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setAppointments(prev => prev.filter(apt => apt.id !== id));
            toast({ title: '🗑️ تم الحذف' });
        } catch (error) {
            console.error(error);
            toast({ title: 'خطأ في الحذف', variant: 'destructive' });
        }
    };

    const startEdit = (apt: Appointment) => {
        setEditingApt(apt);
        setIsEditDialogOpen(true);
    };

    const saveEdit = () => {
        if (!editingApt || !editingApt.title.trim()) return;

        setAppointments(prev => prev.map(a =>
            a.id === editingApt.id ? editingApt : a
        ));

        setIsEditDialogOpen(false);
        setEditingApt(null);
        toast({ title: '✅ تم تعديل الموعد' });
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
                    <div className="relative">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <Input
                                value={newLocation}
                                onChange={e => handleLocationChange(e.target.value)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                placeholder="العنوان (اختياري - سيحفظ في المواقع)"
                                className="flex-1 arabic-body"
                            />
                        </div>
                        {showSuggestions && locationSuggestions.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                {locationSuggestions.map((s, idx) => (
                                    <div
                                        key={idx}
                                        className="p-2 hover:bg-blue-50 cursor-pointer text-sm text-right border-b last:border-0"
                                        onClick={() => selectSuggestion(s)}
                                    >
                                        📍 {s.display_name}
                                    </div>
                                ))}
                            </div>
                        )}
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
                                <Button size="icon" variant="ghost" onClick={() => startEdit(apt)} className="h-8 w-8">
                                    <Edit2 className="w-4 h-4 text-gray-500" />
                                </Button>
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

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="arabic-title text-right">تعديل الموعد</DialogTitle>
                    </DialogHeader>
                    {editingApt && (
                        <div className="space-y-4 py-4">
                            <Input
                                value={editingApt.title}
                                onChange={e => setEditingApt({ ...editingApt, title: e.target.value })}
                                placeholder="العنوان"
                                className="text-right"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    type="date"
                                    value={editingApt.date}
                                    onChange={e => setEditingApt({ ...editingApt, date: e.target.value })}
                                />
                                <Input
                                    type="time"
                                    value={editingApt.time}
                                    onChange={e => setEditingApt({ ...editingApt, time: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm arabic-body">وقت التذكير (دقيقة)</label>
                                <select
                                    value={editingApt.reminderMinutes}
                                    onChange={e => setEditingApt({ ...editingApt, reminderMinutes: Number(e.target.value) })}
                                    className="w-full h-10 rounded-md border px-3"
                                >
                                    <option value={5}>5 دقائق</option>
                                    <option value={15}>15 دقيقة</option>
                                    <option value={30}>30 دقيقة</option>
                                    <option value={60}>ساعة</option>
                                </select>
                            </div>
                            <DialogFooter>
                                <Button onClick={saveEdit} className="w-full">حفظ التعديلات</Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default AppointmentManager;

// Export function for AI assistant
// Export function for AI assistant
export const addAppointmentFromAI = async (title: string, date?: string, time?: string, reminderMinutes = 15): Promise<boolean> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        // Default to tomorrow if no date
        const aptDate = date || new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const aptTime = time || '09:00';

        const newApt = {
            id: crypto.randomUUID(),
            user_id: user.id,
            title,
            date: aptDate,
            time: aptTime,
            reminder_minutes: reminderMinutes,
            is_completed: false,
        };

        const { error } = await supabase
            .from('appointments')
            .insert(newApt);

        if (error) throw error;
        return true;
    } catch (e) {
        console.error('Error adding appointment from AI:', e);
        return false;
    }
};
