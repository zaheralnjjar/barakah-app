import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TABLES } from '@/lib/tableNames';
import {
  MapPin,
  CheckSquare,
  Target,
  Plus,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
  Calendar as CalendarIcon,
  PieChart as PieChartIcon,
  MoreVertical,
  Edit,
  Share2,
  Link as LinkIcon,
  Clock,
  Layers,
  Search,
  Globe,
  Locate
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Map Helper Components
interface LocationMarkerProps {
  position: { lat: number; lng: number } | null;
  setPosition: (pos: L.LatLng) => void;
  setLocationName: (name: string) => void;
  onSave: () => void;
  onShare: (pos: L.LatLng) => void;
}

function LocationMarker({ position, setPosition, setLocationName, onSave, onShare }: LocationMarkerProps) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      setLocationName(`${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position ? (
    <Marker position={position}>
      <Popup>
        <div className="flex flex-col gap-2 p-1 min-w-[120px]">
          <p className="text-xs font-bold text-center mb-1">الموقع المحدد</p>
          <div className="flex gap-2 justify-center">
            <Button size="sm" onClick={onSave} className="h-7 text-xs bg-blue-600 hover:bg-blue-700">
              حفظ
            </Button>
            <Button size="sm" variant="outline" onClick={() => onShare(position as any)} className="h-7 text-xs">
              مشاركة
            </Button>
          </div>
        </div>
      </Popup>
    </Marker>
  ) : null;
}

function ChangeView({ center, zoom }: any) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom);
  }, [center, zoom]);
  return null;
}
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Interfaces for new Task system
interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface MainTask {
  id: string;
  title: string;
  description?: string;
  startDate?: string; // YYYY-MM-DD (for projects)
  deadline: string; // YYYY-MM-DD
  subtasks: SubTask[];
  progress: number;
  priority: 'low' | 'medium' | 'high';
  type: 'task' | 'project';
}

interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  notes?: string;
}

interface SavedResource {
  id: string;
  title: string;
  url: string;
  category: 'tool' | 'article' | 'other';
}

import ShoppingList from '@/components/ShoppingList';

const parseLocation = (loc: string) => {
  if (!loc) return null;
  const parts = loc.split(',');
  if (parts.length !== 2) return null;
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
};

const LogisticsManager = () => {
  const [logisticsData, setLogisticsData] = useState(null);
  const [tasks, setTasks] = useState<MainTask[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [resources, setResources] = useState<SavedResource[]>([]);
  const [savedLocations, setSavedLocations] = useState<any[]>([]);

  // Dialog & Editing State
  const [isaddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditTasksDialogOpen, setIsEditTasksDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'task' | 'project' | 'appointment' | 'calendar'>('task');

  // Specific Editing State
  const [editingTask, setEditingTask] = useState<MainTask | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '', // For projects
    date: '',
    time: '',
    location: '',
    url: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  // Pomodoro Timer State
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 minutes
  const [pomodoroTaskId, setPomodoroTaskId] = useState<string | null>(null);

  // Medication Tracker State (Advanced)
  // Structure: { id, name, time, frequency: 'daily'|'weekly'|'monthly', customDays: [], startDate, endDate, isPermanent: boolean, reminder, takenHistory: {} }
  const [medications, setMedications] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('baraka_medications_v2') || '[]'); } catch { return []; }
  });
  const [selectedMedDay, setSelectedMedDay] = useState<string | null>(null);
  const [showMedDialog, setShowMedDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false); // New Stats Dialog
  const [newMedication, setNewMedication] = useState({
    name: '',
    time: '08:00',
    frequency: 'daily', // daily, weekly, monthly
    customDays: [] as string[],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isPermanent: true,
    reminder: true
  });
  const DAYS_AR = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  // Habits Tracker State
  const [habits, setHabits] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('baraka_habits') || '[]'); } catch { return []; }
  });
  const [newHabitName, setNewHabitName] = useState('');

  // Quick Notes History State
  const [notesHistory, setNotesHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('baraka_notes_history') || '[]'); } catch { return []; }
  });

  const archiveCurrentNote = () => {
    const el = document.getElementById('quickNotes') as HTMLTextAreaElement;
    if (!el || !el.value.trim()) return;
    const updated = [el.value, ...notesHistory];
    setNotesHistory(updated);
    localStorage.setItem('baraka_notes_history', JSON.stringify(updated));
    el.value = '';
    localStorage.removeItem('baraka_quick_notes');
    toast({ title: 'تمت الأرشفة' });
  };

  const deleteHistoryItem = (index: number) => {
    const updated = notesHistory.filter((_, i) => i !== index);
    setNotesHistory(updated);
    localStorage.setItem('baraka_notes_history', JSON.stringify(updated));
  };

  const restoreHistoryItem = (note: string) => {
    const el = document.getElementById('quickNotes') as HTMLTextAreaElement;
    if (el) {
      el.value = note;
      localStorage.setItem('baraka_quick_notes', note);
    }
  };

  const saveMedication = () => {
    if (!newMedication.name) return;
    const updated = [...medications, { id: Date.now().toString(), ...newMedication, takenHistory: {} }];
    setMedications(updated);
    localStorage.setItem('baraka_medications_v2', JSON.stringify(updated));
    setNewMedication({
      name: '', time: '08:00', frequency: 'daily', customDays: [],
      startDate: new Date().toISOString().split('T')[0], endDate: '', isPermanent: true, reminder: true
    });
    toast({ title: 'تم إضافة الدواء' });
  };

  const toggleMedTaken = (id: string, dateStr: string) => {
    // dateStr format: YYYY-MM-DD
    const updated = medications.map(m => {
      if (m.id === id) {
        const history = m.takenHistory || {};
        const isTaken = history[dateStr];
        return { ...m, takenHistory: { ...history, [dateStr]: !isTaken } };
      }
      return m;
    });
    setMedications(updated);
    localStorage.setItem('baraka_medications_v2', JSON.stringify(updated));
  };

  const deleteMedication = (id: string) => {
    const updated = medications.filter(m => m.id !== id);
    setMedications(updated);
    localStorage.setItem('baraka_medications_v2', JSON.stringify(updated));
    toast({ title: 'تم الحذف' });
  };

  // Habits Functions
  const addHabit = () => {
    if (!newHabitName) return;
    const updated = [...habits, { id: Date.now().toString(), name: newHabitName, streak: 0, history: {} }];
    setHabits(updated);
    localStorage.setItem('baraka_habits', JSON.stringify(updated));
    setNewHabitName('');
    toast({ title: 'تم إضافة العادة' });
  };

  const toggleHabit = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const updated = habits.map(h => {
      if (h.id === id) {
        const history = h.history || {};
        const completedToday = !!history[today];
        const newHistory = { ...history, [today]: !completedToday };

        // Calculate Streak
        let streak = 0;
        let d = new Date();
        while (true) {
          const dStr = d.toISOString().split('T')[0];
          if (newHistory[dStr]) {
            streak++;
            d.setDate(d.getDate() - 1);
          } else {
            // Check if we missed just today (if calculating for yesterday)
            if (dStr === today && !completedToday) {
              // Allow streak to persist if purely checking previous days? 
              // Simple logic: count consecutive days backwards from today or yesterday
              d.setDate(d.getDate() - 1);
              continue;
            }
            break;
          }
        }
        // Basic streak calc: consecutive days ending today or yesterday
        return { ...h, history: newHistory, streak: completedToday ? streak - 1 : streak };
        // Simplified: just toggle history, streak calculation can be visual or separate function
      }
      return h;
    });
    setHabits(updated);
    localStorage.setItem('baraka_habits', JSON.stringify(updated));
  };

  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({ name: '', location: '', priority: 'medium' });
  const [mapCenter, setMapCenter] = useState<[number, number]>([-34.6037, -58.3816]); // Default: Buenos Aires
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadLogisticsData();

    // Load local data
    try {
      const savedTasks = localStorage.getItem('baraka_tasks');
      if (savedTasks) setTasks(JSON.parse(savedTasks));

      // Load appointments from Supabase
      const loadAppointments = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('appointments')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: true });
        if (data) setAppointments(data);
      };
      loadAppointments();

      const savedResources = localStorage.getItem('baraka_resources');
      if (savedResources) setResources(JSON.parse(savedResources));

      const savedLocs = localStorage.getItem('baraka_locations');
      if (savedLocs) setSavedLocations(JSON.parse(savedLocs));
    } catch (e) {
      console.error("Error loading local data", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('baraka_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Appointments now synced via Supabase - no localStorage needed

  useEffect(() => {
    localStorage.setItem('baraka_resources', JSON.stringify(resources));
  }, [resources]);

  // Pomodoro Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (pomodoroActive && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime(prev => prev - 1);
      }, 1000);
    } else if (pomodoroTime === 0 && pomodoroActive) {
      setPomodoroActive(false);
      toast({ title: 'انتهى الوقت!', description: 'أحسنت! خذ استراحة 5 دقائق' });
    }
    return () => { if (interval) clearInterval(interval); };
  }, [pomodoroActive, pomodoroTime]);

  const startPomodoro = (taskId: string) => {
    setPomodoroTaskId(taskId);
    setPomodoroTime(25 * 60);
    setPomodoroActive(true);
    toast({ title: 'بدأ مؤقت بومودورو', description: '25 دقيقة من التركيز!' });
  };

  const stopPomodoro = () => {
    setPomodoroActive(false);
    setPomodoroTaskId(null);
    setPomodoroTime(25 * 60);
  };

  const formatPomodoroTime = () => {
    const mins = Math.floor(pomodoroTime / 60);
    const secs = pomodoroTime % 60;
    return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
  };

  // Sync newItem map selection to formData
  useEffect(() => {
    if (newItem.location) {
      setFormData(prev => ({ ...prev, url: `geo:${newItem.location}` }));
    }
  }, [newItem.location]);

  const loadLogisticsData = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data, error } = await supabase
        .from('logistics_data_2025_12_18_18_42')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setLogisticsData(data);
    } catch (error) {
      console.error('Error loading logistics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Consolidated Save Handler ---
  const handleSave = async () => {
    if (!formData.title) return;

    if (activeTab === 'task' || activeTab === 'project') {
      const newTask: MainTask = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        startDate: activeTab === 'project' ? (formData.startDate || new Date().toISOString().split('T')[0]) : undefined,
        deadline: formData.date || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        subtasks: [],
        progress: 0,
        priority: formData.priority,
        type: activeTab
      };
      setTasks(prev => [...prev, newTask]);
      toast({ title: activeTab === 'task' ? "تم إضافة المهمة" : "تم إنشاء المشروع" });
    } else if (activeTab === 'appointment') {
      // Save to Supabase for proper sync
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'خطأ', description: 'يرجى تسجيل الدخول', variant: 'destructive' });
        return;
      }
      const { data, error } = await supabase.from('appointments').insert({
        user_id: user.id,
        title: formData.title,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        notes: formData.description,
        is_completed: false
      }).select().single();

      if (error) {
        toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
        return;
      }
      if (data) setAppointments(prev => [...prev, data]);
      toast({ title: "تم حجز الموعد" });
    }

    resetForm();
  };

  const handleAddResource = () => {
    if (!formData.title || !formData.url) return;
    const newRes: SavedResource = {
      id: Date.now().toString(),
      title: formData.title,
      url: formData.url,
      category: 'other' // Simplify for now
    };
    setResources(prev => [...prev, newRes]);
    setFormData(prev => ({ ...prev, title: '', url: '' }));
    toast({ title: "تم حفظ الرابط" });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startDate: '',
      date: '',
      time: '',
      location: '',
      url: '',
      priority: 'medium'
    });
    setIsAddDialogOpen(false);
  };

  // --- Task Actions ---
  const deleteMainTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleEditTask = (task: MainTask) => {
    setActiveTab(task.type);
    setFormData({
      title: task.title,
      description: task.description || '',
      startDate: task.startDate || '',
      date: task.deadline,
      time: '',
      location: '',
      url: '',
      priority: task.priority
    });
    setEditingTask(task);
    setIsAddDialogOpen(true);
  };

  const handleShareTask = (task: MainTask) => {
    const text = `Check out this ${task.type}: ${task.title}\n${task.description || ''}\nDue: ${task.deadline}`;
    if (navigator.share) {
      navigator.share({
        title: task.title,
        text: text,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: "تم نسخ التفاصيل", description: "تم نسخ تفاصيل المهمة للحافظة" });
    }
  };

  const addSubtask = (taskId: string, title: string) => {
    if (!title.trim()) return;
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        const newSub: SubTask = { id: Date.now().toString(), title, completed: false };
        const newSubtasks = [...t.subtasks, newSub];
        return { ...t, subtasks: newSubtasks, progress: calculateProgress(newSubtasks) };
      }
      return t;
    });
    setTasks(updatedTasks);
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        const newSubtasks = t.subtasks.map(s =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        );
        return { ...t, subtasks: newSubtasks, progress: calculateProgress(newSubtasks) };
      }
      return t;
    });
    setTasks(updatedTasks);
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        const newSubtasks = t.subtasks.filter(s => s.id !== subtaskId);
        return { ...t, subtasks: newSubtasks, progress: calculateProgress(newSubtasks) };
      }
      return t;
    });
    setTasks(updatedTasks);
  };

  const calculateProgress = (subtasks: SubTask[]) => {
    if (subtasks.length === 0) return 0;
    const completed = subtasks.filter(s => s.completed).length;
    return Math.round((completed / subtasks.length) * 100);
  };

  // --- Shopping List Functions (Existing) ---
  const addShoppingItem = async () => {
    if (!newItem.name) return;
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;
      const updatedShoppingList = [...(logisticsData?.shopping_list || []), {
        id: Date.now(),
        name: newItem.name,
        location: newItem.location,
        priority: newItem.priority,
        completed: false,
        created_at: new Date().toISOString()
      }];
      await updateLogisticsData({ shopping_list: updatedShoppingList }, user.id);
      setNewItem({ name: '', location: '', priority: 'medium' });
      toast({ title: "تم إضافة المنتج", description: `تم إضافة "${newItem.name}"` });
    } catch (error) { console.error(error); }
  };

  const toggleShoppingItem = async (itemId) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;
      if (!logisticsData) return;
      const updatedShoppingList = logisticsData.shopping_list.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );
      await updateLogisticsData({ shopping_list: updatedShoppingList }, user.id);
    } catch (error) { console.error(error); }
  };

  const deleteShoppingItem = async (itemId) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;
      if (!logisticsData) return;
      const updatedShoppingList = logisticsData.shopping_list.filter(item => item.id !== itemId);
      await updateLogisticsData({ shopping_list: updatedShoppingList }, user.id);
    } catch (error) { console.error(error); }
  };

  const updateLogisticsData = async (updates, userId) => {
    const { error } = await supabase
      .from('logistics_data_2025_12_18_18_42')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) throw error;
    loadLogisticsData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Floating Pomodoro Timer */}
      {pomodoroActive && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-pulse">
          <Clock className="w-5 h-5" />
          <span className="text-2xl font-bold tabular-nums">{formatPomodoroTime()}</span>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20 h-7"
            onClick={stopPomodoro}
          >
            إيقاف
          </Button>
        </div>
      )}
      {/* Header with Unified Add Action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl arabic-title text-primary font-bold">الإنتاجية والمهام</h1>
          <div className="flex items-center gap-2">
            <p className="arabic-body text-sm text-muted-foreground">مساحتك لإدارة الوقت والمشاريع</p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-primary hover:bg-primary/10"
              onClick={async () => {
                const activeTasks = tasks.filter(t => t.progress < 100).length;
                const activeAppts = appointments.length;
                const text = `
ملخص المهام - بركة
------------------
المهام النشطة: ${activeTasks}
المواعيد القادمة: ${activeAppts}
                     `.trim();
                if (navigator.share) await navigator.share({ title: 'ملخص المهام', text });
                else { await navigator.clipboard.writeText(text); toast({ title: 'تم النسخ' }); }
              }}
            >
              <Share2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="w-5 h-5" />
              <span className="hidden md:inline">إضافة جديد</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-right">ماذا تريد أن تضيف؟</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { setActiveTab('task'); setIsAddDialogOpen(true); }} className="cursor-pointer flex flex-row-reverse justify-between">
              <span>مهمة جديدة</span>
              <CheckSquare className="w-4 h-4 ml-2" />
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setActiveTab('project'); setIsAddDialogOpen(true); }} className="cursor-pointer flex flex-row-reverse justify-between">
              <span>مشروع</span>
              <Layers className="w-4 h-4 ml-2" />
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setActiveTab('appointment'); setIsAddDialogOpen(true); }} className="cursor-pointer flex flex-row-reverse justify-between">
              <span>موعد / حدث</span>
              <CalendarIcon className="w-4 h-4 ml-2" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={isaddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) setEditingTask(null);
        }}>

          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-right arabic-title">
                {editingTask ? 'تعديل المهمة' :
                  activeTab === 'task' ? 'إضافة مهمة جديدة' :
                    activeTab === 'project' ? 'إنشاء مشروع جديد' : 'حجز موعد جديد'}
              </DialogTitle>
              <DialogDescription className="text-right">
                {editingTask ? 'قم بتعديل التفاصيل أدناه' : 'قم بتعبئة التفاصيل أدناه'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Input
                  id="title"
                  placeholder="العنوان"
                  className="text-right arabic-body"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {(activeTab === 'task' || activeTab === 'project') && (
                <>
                  <div className="grid gap-2">
                    <Textarea
                      placeholder="الوصف / الملاحظات"
                      className="text-right min-h-[80px]"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  {activeTab === 'project' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-1">
                        <label className="text-xs text-gray-500">تاريخ البداية</label>
                        <Input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-1">
                        <label className="text-xs text-gray-500">تاريخ النهاية</label>
                        <Input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                  {activeTab === 'task' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                      </div>
                      <Select
                        value={formData.priority}
                        onValueChange={(val: any) => setFormData({ ...formData, priority: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="الأولوية" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">منخفضة</SelectItem>
                          <SelectItem value="medium">متوسطة</SelectItem>
                          <SelectItem value="high">عالية</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {activeTab === 'project' && (
                    <Select
                      value={formData.priority}
                      onValueChange={(val: any) => setFormData({ ...formData, priority: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="الأولوية" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">منخفضة</SelectItem>
                        <SelectItem value="medium">متوسطة</SelectItem>
                        <SelectItem value="high">عالية</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </>
              )}

              {activeTab === 'appointment' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-500">الموقع</label>
                    {savedLocations.length > 0 && (
                      <Select
                        onValueChange={(val) => {
                          if (val) setFormData({ ...formData, location: val });
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="اختر من المواقع المحفوظة (اختياري)" />
                        </SelectTrigger>
                        <SelectContent>
                          {savedLocations.map((loc: any) => (
                            <SelectItem key={loc.id} value={loc.title}>{loc.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Input
                      placeholder="أو اكتب الموقع يدوياً"
                      className="text-right"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                  <Textarea
                    placeholder="ملاحظات"
                    className="text-right"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </>
              )}
            </div>

            <DialogFooter className="sm:justify-start">
              <Button onClick={handleSave} className="w-full">حفظ</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Achievement Stats */}
      {/* Achievement Stats - Interactive */}
      <div
        className="grid grid-cols-4 gap-2 cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => setShowStatsDialog(true)}
      >
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-green-600 font-bold">مكتملة</p>
            <p className="text-xl font-bold text-green-700">{tasks.filter(t => t.progress === 100).length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-yellow-600 font-bold">جارية</p>
            <p className="text-xl font-bold text-yellow-700">{tasks.filter(t => t.progress > 0 && t.progress < 100).length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-gray-600 font-bold">معلقة</p>
            <p className="text-xl font-bold text-gray-700">{tasks.filter(t => t.progress === 0).length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-purple-600 font-bold">مشاريع</p>
            <p className="text-xl font-bold text-purple-700">{tasks.filter(t => t.type === 'project').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics Dialog */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right arabic-title flex items-center justify-between">
              <span>📊 إحصائيات الأداء التفصيلية</span>
              <span className="text-xs font-normal text-muted-foreground bg-gray-100 px-2 py-1 rounded">نظرة شاملة</span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Completion Rate */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>معدل الإنجاز العام</span>
                <span className="font-bold">{tasks.length > 0 ? Math.round((tasks.filter(t => t.progress === 100).length / tasks.length) * 100) : 0}%</span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-1000"
                  style={{ width: `${tasks.length > 0 ? Math.round((tasks.filter(t => t.progress === 100).length / tasks.length) * 100) : 0}%` }}
                />
              </div>
            </div>

            {/* Priority Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-xl p-4 bg-white shadow-sm">
                <h4 className="text-sm font-bold mb-3 border-b pb-2">توزيع الأولويات</h4>
                <div className="space-y-3">
                  {['high', 'medium', 'low'].map(p => {
                    const count = tasks.filter(t => t.priority === p).length;
                    const label = p === 'high' ? 'عالية' : p === 'medium' ? 'متوسطة' : 'منخفضة';
                    const color = p === 'high' ? 'bg-red-500' : p === 'medium' ? 'bg-yellow-500' : 'bg-blue-500';
                    return (
                      <div key={p} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${color}`} />
                        <span className="text-xs flex-1">{label}</span>
                        <span className="text-xs font-bold">{count}</span>
                        <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${color}`} style={{ width: `${tasks.length > 0 ? (count / tasks.length) * 100 : 0}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Habits Summary */}
              <div className="border rounded-xl p-4 bg-white shadow-sm">
                <h4 className="text-sm font-bold mb-3 border-b pb-2">التزام العادات</h4>
                <div className="space-y-2 max-h-[150px] overflow-y-auto">
                  {habits.length === 0 && <p className="text-xs text-gray-400 text-center py-4">لا توجد عادات مضافة</p>}
                  {habits.map(h => (
                    <div key={h.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <span className="text-xs">{h.name}</span>
                      <span className="text-xs font-bold text-orange-600 flex items-center gap-1">
                        🔥 {h.streak || 0} يوم
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl text-center">
                <p className="text-2xl font-bold text-blue-700">{appointments.filter(a => new Date(a.date) >= new Date()).length}</p>
                <p className="text-xs text-blue-600">موعد قادم</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl text-center">
                <p className="text-2xl font-bold text-purple-700">{resources.length}</p>
                <p className="text-xs text-purple-600">موارد محفوظة</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Column 1: Saved Locations & Shopping */}
        <div className="space-y-6">
          {/* Map/Location Section Removed - Moved to Dashboard Main Screen */}

          {/* Shopping List - Unified Component */}
          <div className="h-full">
            <ShoppingList />
          </div>
        </div>

        {/* Column 2 & 3: Tasks and Appointments */}
        <div className="md:col-span-1 lg:col-span-2 space-y-6">

          {/* View Toggle */}
          <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('task')}
              className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${activeTab !== 'calendar' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
            >
              قائمة المهام
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${activeTab === 'calendar' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
            >
              التقويم الأسبوعي
            </button>
          </div>

          {activeTab === 'calendar' ? (
            <div className="bg-white rounded-xl border p-4 shadow-sm overflow-x-auto">
              <div className="flex gap-4 min-w-[800px]">
                {DAYS_AR.map((day, idx) => {
                  // Calculate date for this day relative to start of week (Sat)
                  // For simplicity, we just filter by matching day name if stored, OR match date string if implementing real dates.
                  // Since tasks use YYYY-MM-DD, we need real dates.
                  // Let's assume today is in the week and map simple dates.
                  const today = new Date();
                  const currentDayIdx = (today.getDay() + 1) % 7; // Sat=0, Sun=1...
                  // Adjust logic to find Saturday of current week
                  const diff = (today.getDay() + 1) % 7;
                  const sat = new Date(today);
                  sat.setDate(today.getDate() - diff);

                  const thisDate = new Date(sat);
                  thisDate.setDate(sat.getDate() + idx);
                  const dateStr = thisDate.toISOString().split('T')[0];

                  const dayTasks = tasks.filter(t => t.deadline === dateStr);
                  const dayAppts = appointments.filter(a => a.date === dateStr);

                  return (
                    <div key={idx} className={`flex-1 min-w-[120px] bg-gray-50 rounded-lg p-2 ${dateStr === new Date().toISOString().split('T')[0] ? 'ring-2 ring-primary ring-offset-1' : ''}`}>
                      <div className="text-center mb-2 pb-2 border-b">
                        <span className="block font-bold text-sm text-gray-800">{day}</span>
                        <span className="text-[10px] text-gray-400">{dateStr}</span>
                      </div>
                      <div className="space-y-2">
                        {dayAppts.map(a => (
                          <div key={a.id} className="bg-orange-100 p-1.5 rounded textxs border-r-2 border-orange-500">
                            <div className="font-bold truncate">{a.title}</div>
                            <div className="text-[10px] text-gray-600">{a.time}</div>
                          </div>
                        ))}
                        {dayTasks.map(t => (
                          <div key={t.id} className="bg-white p-1.5 rounded text-xs border shadow-sm">
                            <div className="font-bold truncate">{t.title}</div>
                            <div className={`text-[10px] ${t.priority === 'high' ? 'text-red-500' : 'text-gray-500'}`}>{t.priority === 'high' ? 'عالية' : 'عادية'}</div>
                          </div>
                        ))}
                        {dayAppts.length === 0 && dayTasks.length === 0 && <div className="text-center text-[10px] text-gray-300 py-4">- فارغ -</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Appointments Section */}
              {appointments.length > 0 && (
                <div className="bg-white rounded-xl border p-4 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-orange-500" />
                    المواعيد القادمة
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {appointments.map(apt => (
                      <div key={apt.id} className="border rounded-lg p-3 flex items-center justify-between bg-orange-50/30 border-orange-100">
                        <div>
                          <p className="font-bold text-sm text-gray-800">{apt.title}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <span>{apt.date}</span>
                            <span>•</span>
                            <span>{apt.time}</span>
                          </div>
                          {apt.location && <p className="text-xs text-blue-500 mt-1">{apt.location}</p>}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setAppointments(prev => prev.filter(a => a.id !== apt.id))}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks & Projects */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-purple-600" />
                  المهام والمشاريع الحالية
                </h3>

                {tasks.map(task => (
                  <div key={task.id} className="border rounded-xl bg-white shadow-sm overflow-hidden">
                    <div className="p-4 flex flex-wrap gap-4 justify-between items-start">

                      {/* Progress */}
                      <div className="w-12 h-12 relative flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-100" />
                          <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent"
                            className={`${task.progress === 100 ? 'text-green-500' : 'text-purple-600'}`}
                            strokeDasharray={125.6} strokeDashoffset={125.6 - (125.6 * task.progress) / 100}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{task.progress}%</span>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-gray-900 group-hover:text-purple-600">{task.title}</h4>
                          {task.type === 'project' && <Badge variant="outline" className="text-[10px]">مشروع</Badge>}
                          <Badge className={`text-[10px] ${task.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                            {task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                          </Badge>
                        </div>
                        {task.description && <p className="text-sm text-gray-500 mb-2 line-clamp-1">{task.description}</p>}
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {task.deadline}</span>
                          <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</span>
                        </div>
                      </div>

                      {/* Actions (4 Buttons including Pomodoro) */}
                      <div className="flex items-center gap-1">
                        {task.type === 'task' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${pomodoroTaskId === task.id ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-green-600'}`}
                            onClick={() => pomodoroTaskId === task.id ? stopPomodoro() : startPomodoro(task.id)}
                          >
                            <Clock className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600" onClick={() => handleEditTask(task)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-purple-600" onClick={() => handleShareTask(task)}>
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-300 hover:text-red-500 hover:bg-red-50" onClick={() => deleteMainTask(task.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        {/* Collapse Toggle */}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}>
                          {expandedTaskId === task.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Subtasks (Internal Editing) */}
                    {expandedTaskId === task.id && (
                      <div className="bg-gray-50/50 p-4 border-t">
                        <p className="text-xs font-bold text-gray-500 mb-2">المهام الفرعية</p>
                        <div className="space-y-2 mb-3">
                          {task.subtasks.map(sub => (
                            <div key={sub.id} className="flex items-center gap-2 group">
                              <input
                                type="checkbox"
                                checked={sub.completed}
                                onChange={() => toggleSubtask(task.id, sub.id)}
                                className="accent-purple-600"
                              />
                              <span className={`text-sm flex-1 ${sub.completed ? 'line-through text-gray-400' : ''}`}>{sub.title}</span>
                              <Trash2
                                className="w-3 h-3 text-red-300 opacity-0 group-hover:opacity-100 cursor-pointer"
                                onClick={() => deleteSubtask(task.id, sub.id)}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="مهمة فرعية جديدة..."
                            className="h-8 text-xs bg-white"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                addSubtask(task.id, e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </>
          )}

        </div>
        {/* Habits Tracker */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="arabic-title text-base flex items-center justify-between">
              <span className="flex items-center gap-2">🔥 متتبع العادات</span>
              <div className="flex gap-1">
                <Input
                  placeholder="عادة جديدة..."
                  value={newHabitName}
                  onChange={e => setNewHabitName(e.target.value)}
                  className="h-8 w-32 text-xs"
                  onKeyDown={e => e.key === 'Enter' && addHabit()}
                />
                <Button size="sm" className="h-8" onClick={addHabit}><Plus className="w-3 h-3" /></Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {habits.map(habit => {
                const today = new Date().toISOString().split('T')[0];
                const isCompletedToday = !!(habit.history || {})[today];
                return (
                  <div key={habit.id} className="flex items-center justify-between p-2 bg-white rounded border hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleHabit(habit.id)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${isCompletedToday ? 'bg-orange-500 border-orange-600 text-white' : 'bg-gray-100 border-gray-300 text-transparent hover:border-orange-400'}`}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <div>
                        <span className={`font-bold block ${isCompletedToday ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{habit.name}</span>
                        <span className="text-[10px] text-orange-600 font-bold">🔥 {habit.streak || 0} يوم متواصل</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-300 hover:text-red-500" onClick={() => {
                      const updated = habits.filter(h => h.id !== habit.id);
                      setHabits(updated);
                      localStorage.setItem('baraka_habits', JSON.stringify(updated));
                    }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
              {habits.length === 0 && <p className="text-center text-gray-400 text-sm">أضف عادة جديدة لبدء التتبع</p>}
            </div>
          </CardContent>
        </Card>

        {/* Medication Tracker (Advanced) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="arabic-title text-base flex items-center gap-2">
              💊 متتبع الأدوية
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Weekly Selector */}
            <div className="grid grid-cols-7 gap-1 mb-3">
              {DAYS_AR.map((day, idx) => {
                // Calculate actual date for this day relative to today for display purpose?
                // For simplicity, we just use the static day names as requested, but logic needs to match "today".
                // Let's assume the user selects a day to view/manage schedule contextually.
                return (
                  <button
                    key={day}
                    onClick={() => { setSelectedMedDay(day); setShowMedDialog(true); }}
                    className={`p-2 text-center rounded-lg border text-xs hover:bg-primary/10 transition-colors ${selectedMedDay === day ? 'bg-primary/20 border-primary' : 'bg-gray-50'}`}
                  >
                    <span className="block font-bold">{day}</span>
                  </button>
                )
              })}
            </div>

            <div className="border rounded-lg p-3 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-sm">أدويتك المسجلة</span>
                <Button size="sm" variant="outline" onClick={() => setShowMedDialog(true)}>
                  <Plus className="w-3 h-3 ml-1" /> إضافة دواء
                </Button>
              </div>
              <div className="space-y-2">
                {medications.map(med => {
                  // Determine if taken TODAY (YYYY-MM-DD)
                  const todayDate = new Date();
                  const todayStr = todayDate.toISOString().split('T')[0];
                  // Get Arabic day name for today to check matches
                  // internal DAYS_AR = ['السبت', 'الأحد'...]
                  // js getDay(): Sun=0, Mon=1...Sat=6.
                  // mapping: 0(Sun)->'الأحد', 1(Mon)->'الاثنين', ... 6(Sat)->'السبت'
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
        </Card>

        {/* Advanced Medication Dialog */}
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
                    onChange={e => setNewMedication({ ...newMedication, frequency: e.target.value })}
                  >
                    <option value="daily">يومي</option>
                    <option value="specific_days">أيام محددة</option>
                    <option value="weekly">أسبوعي</option>
                    <option value="monthly">شهري</option>
                  </select>
                </div>
              </div>

              {/* Specific Days Selector */}
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

              <Button onClick={() => { saveMedication(); setShowMedDialog(false); }} className="w-full mt-2">حفظ الدواء</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Quick Notes Section - Enhanced */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="arabic-title text-base flex items-center justify-between">
              <span className="flex items-center gap-2">📝 ملاحظات سريعة</span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={async () => {
                    const notes = (document.getElementById('quickNotes') as HTMLTextAreaElement)?.value || '';
                    localStorage.setItem('baraka_quick_notes', notes);
                    // Sync to Supabase
                    const user = (await supabase.auth.getUser()).data.user;
                    if (user) {
                      await supabase.from(TABLES.logistics).update({ quick_notes: notes, updated_at: new Date().toISOString() }).eq('user_id', user.id);
                    }
                    toast({ title: 'تم الحفظ ✅' });
                  }}
                >
                  <Check className="w-3 h-3 ml-1" /> حفظ
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={async () => {
                    const notes = (document.getElementById('quickNotes') as HTMLTextAreaElement)?.value || '';
                    if (navigator.share) {
                      await navigator.share({ title: 'ملاحظاتي', text: notes });
                    } else {
                      await navigator.clipboard.writeText(notes);
                      toast({ title: 'تم النسخ' });
                    }
                  }}
                >
                  <Share2 className="w-3 h-3 ml-1" /> مشاركة
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={archiveCurrentNote}
                >
                  <Trash2 className="w-3 h-3 ml-1" /> مسح وأرشفة
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              id="quickNotes"
              placeholder="اكتب ملاحظاتك هنا..."
              className="min-h-[100px] text-right mb-4"
              defaultValue={localStorage.getItem('baraka_quick_notes') || ''}
            />

            {/* Notes History / Archive */}
            {notesHistory.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <h4 className="text-xs font-bold text-gray-500 mb-2">الملاحظات المحذوفة / الأرشيف</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {notesHistory.map((note, idx) => (
                    <div key={idx} className="bg-gray-50 p-2 rounded border flex flex-col gap-2">
                      <p className="text-xs text-gray-700 whitespace-pre-wrap line-clamp-3">{note}</p>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => restoreHistoryItem(note)}>استعادة</Button>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => {
                          if (navigator.share) navigator.share({ text: note });
                          else navigator.clipboard.writeText(note);
                        }}>مشاركة</Button>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-red-500" onClick={() => deleteHistoryItem(idx)}>حذف نهائي</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LogisticsManager;