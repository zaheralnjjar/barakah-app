import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  CheckSquare,
  Calendar as CalendarIcon,
  Layers,
  Share2,
  Clock,
  Pill,
  Flame
} from 'lucide-react';
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ShoppingList from '@/components/ShoppingList';

// Hooks
import { useTasks, MainTask } from '@/hooks/useTasks';
import { useAppointments } from '@/hooks/useAppointments';
import { useHabits } from '@/hooks/useHabits';
import { useMedications } from '@/hooks/useMedications';
import { usePomodoro } from '@/hooks/usePomodoro';
import { useQuickNotes } from '@/hooks/useQuickNotes';

// Components
import { TaskSection } from '@/components/logistics/TaskSection';
import { TaskStats } from '@/components/logistics/TaskStats';
import { HabitTracker } from '@/components/logistics/HabitTracker';
import { MedicationManager } from '@/components/logistics/MedicationManager';
import { QuickNotes } from '@/components/logistics/QuickNotes';
import { DailyChecklist } from '@/components/logistics/DailyChecklist';
import AppointmentManager from '@/components/AppointmentManager';

const LogisticsManager = () => {
  // State Hooks
  const taskHook = useTasks();
  const apptHook = useAppointments();
  const habitHook = useHabits();
  const medHook = useMedications();
  const pomodoro = usePomodoro();
  const { toast } = useToast();

  // NOTE: quickNotes hook is used inside QuickNotes component, so not needed here unless we pass data to stats.
  // TaskStats shows "resources.length". LogisticsManager previously had "resources".
  // I'll keep "resources" state local here if it wasn't extracted, or remove if unused.
  // Original had "SavedResource". I'll keep a simple state for it to avoid breaking Stats, or remove "Resources" from stats if not critical.
  // Let's implement Resources simply for compatibility.
  const [resources, setResources] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('baraka_resources') || '[]'); } catch { return []; }
  });

  // UI State
  const [activeTab, setActiveTab] = useState<'task' | 'project' | 'appointment' | 'calendar'>('task');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<MainTask | null>(null);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newMedicationName, setNewMedicationName] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    date: '',
    time: '',
    location: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  // Location Autocomplete State
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounce search for location
  React.useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (formData.location && formData.location.length > 2 && activeTab === 'appointment' && showSuggestions) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.location)}&addressdetails=1&limit=5&accept-language=ar`
          );
          const data = await response.json();
          setSearchSuggestions(data);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      } else {
        setSearchSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.location, activeTab, showSuggestions]);

  const resetForm = () => {
    setFormData({
      title: '', description: '', startDate: '', date: '', time: '', location: '', priority: 'medium'
    });
    setIsAddDialogOpen(false);
    setEditingTask(null);
  };

  const handleSave = async () => {
    if (!formData.title) return;

    if (activeTab === 'task' || activeTab === 'project') {
      const taskData = {
        title: formData.title,
        description: formData.description,
        startDate: activeTab === 'project' ? (formData.startDate || new Date().toISOString().split('T')[0]) : undefined,
        deadline: formData.date || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        priority: formData.priority,
        type: activeTab
      };

      if (editingTask) {
        taskHook.updateTask({ ...editingTask, ...taskData });
        toast({ title: "تم تحديث المهمة" });
      } else {
        taskHook.addTask(taskData);
      }
    } else if (activeTab === 'appointment') {
      await apptHook.addAppointment({
        title: formData.title,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        notes: formData.description
      });
    }
    resetForm();
  };

  const startEditTask = (task: MainTask) => {
    setActiveTab(task.type);
    setFormData({
      title: task.title,
      description: task.description || '',
      startDate: task.startDate || '',
      date: task.deadline,
      time: '',
      location: '',
      priority: task.priority
    });
    setEditingTask(task);
    setIsAddDialogOpen(true);
  };

  const handleShareTask = (task: MainTask) => {
    const text = `Check out this ${task.type}: ${task.title}\n${task.description || ''}\nDue: ${task.deadline}`;
    if (navigator.share) {
      navigator.share({ title: task.title, text }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: "تم نسخ التفاصيل" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Floating Pomodoro Timer */}
      {pomodoro.pomodoroActive && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-pulse">
          <Clock className="w-5 h-5" />
          <span className="text-2xl font-bold tabular-nums">{pomodoro.formatTime()}</span>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20 h-7"
            onClick={pomodoro.stopPomodoro}
          >
            إيقاف
          </Button>
        </div>
      )}

      {/* Header */}
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
                const activeTasks = taskHook.tasks.filter((t: any) => t.progress < 100).length;
                const activeAppts = apptHook.appointments.length;
                const text = `ملخص المهام:\nالمهام النشطة: ${activeTasks}\nالمواعيد القادمة: ${activeAppts}`;
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

        {/* Main Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
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
                  <div className="relative">
                    <Input
                      placeholder="الموقع"
                      className="text-right"
                      value={formData.location}
                      onFocus={() => setShowSuggestions(true)}
                      onChange={(e) => {
                        setFormData({ ...formData, location: e.target.value });
                        setShowSuggestions(true);
                      }}
                    />
                    {showSuggestions && searchSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border rounded-b-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                        {searchSuggestions.map((s, idx) => {
                          const addr = s.address || {};
                          const streetName = addr.road || addr.street || addr.pedestrian || s.display_name.split(',')[0];
                          const houseNumber = addr.house_number || '';
                          const formattedName = houseNumber ? `${streetName} ${houseNumber}` : streetName;

                          return (
                            <div
                              key={idx}
                              className="p-2 hover:bg-gray-100 cursor-pointer text-right text-sm border-b last:border-b-0"
                              onMouseDown={(e) => {
                                e.preventDefault(); // Prevent blur before click
                                setFormData({ ...formData, location: formattedName });
                                setShowSuggestions(false);
                              }}
                            >
                              <div className="font-bold">{formattedName}</div>
                              <div className="text-xs text-gray-500 truncate">{s.display_name}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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

      {/* Quick Action Icons */}
      <div className="grid grid-cols-5 gap-2">
        <button
          onClick={() => { setActiveTab('task'); setIsAddDialogOpen(true); }}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-100 text-blue-600 hover:scale-105 transition-transform"
        >
          <CheckSquare className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">مهمة</span>
        </button>
        <button
          onClick={() => { setActiveTab('appointment'); setIsAddDialogOpen(true); }}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-green-100 text-green-600 hover:scale-105 transition-transform"
        >
          <CalendarIcon className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">موعد</span>
        </button>
        <button
          onClick={() => { setActiveTab('project'); setIsAddDialogOpen(true); }}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-teal-100 text-teal-600 hover:scale-105 transition-transform"
        >
          <Layers className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">مشروع</span>
        </button>
        <button
          onClick={() => setShowAddHabit(true)}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-orange-100 text-orange-600 hover:scale-105 transition-transform"
        >
          <Flame className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">عادة</span>
        </button>
        <button
          onClick={() => setShowAddMedication(true)}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-purple-100 text-purple-600 hover:scale-105 transition-transform"
        >
          <Pill className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">دواء</span>
        </button>
      </div>

      {/* Add Habit Dialog */}
      <Dialog open={showAddHabit} onOpenChange={setShowAddHabit}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              إضافة عادة جديدة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="اسم العادة"
              className="text-right"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
            />
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600"
              onClick={() => {
                if (newHabitName.trim()) {
                  habitHook.addHabit(newHabitName);
                  setNewHabitName('');
                  setShowAddHabit(false);
                  toast({ title: 'تم إضافة العادة بنجاح' });
                }
              }}
            >
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Medication Dialog */}
      <Dialog open={showAddMedication} onOpenChange={setShowAddMedication}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2">
              <Pill className="w-5 h-5 text-purple-500" />
              إضافة دواء جديد
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="اسم الدواء"
              className="text-right"
              value={newMedicationName}
              onChange={(e) => setNewMedicationName(e.target.value)}
            />
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              className="w-full bg-purple-500 hover:bg-purple-600"
              onClick={() => {
                if (newMedicationName.trim()) {
                  medHook.addMedication({
                    name: newMedicationName,
                    time: '08:00',
                    frequency: 'daily',
                    startDate: new Date().toISOString().split('T')[0],
                    customDays: [],
                    endDate: '',
                    isPermanent: true,
                    reminder: true
                  });
                  setNewMedicationName('');
                  setShowAddMedication(false);
                  toast({ title: 'تم إضافة الدواء بنجاح' });
                }
              }}
            >
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1: Shopping & Quick Notes */}
        <div className="space-y-6">
          <ShoppingList />
          <QuickNotes />
        </div>

        {/* Column 2 & 3: Tasks and Trackers */}
        <div className="lg:col-span-2 space-y-6">
          <TaskSection
            tasks={taskHook.tasks}
            appointments={apptHook.appointments}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onEditTask={startEditTask}
            onDeleteTask={taskHook.deleteMainTask}
            onShareTask={handleShareTask}
            onDeleteAppointment={apptHook.deleteAppointment}
            onAddSubtask={taskHook.addSubtask}
            onToggleSubtask={taskHook.toggleSubtask}
            onDeleteSubtask={taskHook.deleteSubtask}
            pomodoro={{
              active: pomodoro.pomodoroActive,
              time: pomodoro.pomodoroTime,
              taskId: pomodoro.pomodoroTaskId,
              start: pomodoro.startPomodoro,
              stop: pomodoro.stopPomodoro,
              format: pomodoro.formatTime
            }}
          />

          {/* Daily Checklist & Appointments Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DailyChecklist />
            <AppointmentManager />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HabitTracker />
            <MedicationManager />
          </div>
        </div>

      </div>
    </div>
  );
};

export default LogisticsManager;