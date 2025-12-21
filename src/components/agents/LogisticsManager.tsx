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
  Clock
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
                  <Input
                    placeholder="الموقع"
                    className="text-right"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
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

      {/* Stats Overview */}
      <TaskStats
        tasks={taskHook.tasks}
        habits={habitHook.habits}
        appointments={apptHook.appointments}
        resources={resources}
        showStatsDialog={showStatsDialog}
        setShowStatsDialog={setShowStatsDialog}
      />

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