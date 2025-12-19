import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
  Layers
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

const LogisticsManager = () => {
  const [logisticsData, setLogisticsData] = useState(null);
  const [tasks, setTasks] = useState<MainTask[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [resources, setResources] = useState<SavedResource[]>([]);

  // Dialog & Editing State
  const [isaddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditTasksDialogOpen, setIsEditTasksDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'task' | 'project' | 'appointment'>('task');

  // Specific Editing State
  const [editingTask, setEditingTask] = useState<MainTask | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  // Form States (Unified)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    url: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({ name: '', location: '', priority: 'medium' });
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadLogisticsData();

    // Load local data
    try {
      const savedTasks = localStorage.getItem('baraka_tasks');
      if (savedTasks) setTasks(JSON.parse(savedTasks));

      const savedAppointments = localStorage.getItem('baraka_appointments');
      if (savedAppointments) setAppointments(JSON.parse(savedAppointments));

      const savedResources = localStorage.getItem('baraka_resources');
      if (savedResources) setResources(JSON.parse(savedResources));
    } catch (e) {
      console.error("Error loading local data", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('baraka_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('baraka_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('baraka_resources', JSON.stringify(resources));
  }, [resources]);

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
  const handleSave = () => {
    if (!formData.title) return;

    if (activeTab === 'task' || activeTab === 'project') {
      const newTask: MainTask = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        deadline: formData.date || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        subtasks: [],
        progress: 0,
        priority: formData.priority,
        type: activeTab
      };
      setTasks(prev => [...prev, newTask]);
      toast({ title: activeTab === 'task' ? "تم إضافة المهمة" : "تم إنشاء المشروع" });
    } else if (activeTab === 'appointment') {
      const newAppt: Appointment = {
        id: Date.now().toString(),
        title: formData.title,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        notes: formData.description
      };
      setAppointments(prev => [...prev, newAppt]);
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
      {/* Header with Unified Add Action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl arabic-title text-primary font-bold">الإنتاجية والمهام</h1>
          <p className="arabic-body text-sm text-muted-foreground">مساحتك لإدارة الوقت والمشاريع</p>
        </div>

        <Dialog open={isaddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) setEditingTask(null); // Reset editing state on close
        }}>
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
                    placeholder="الموقع (اختياري)"
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Column 1: Saved Locations & Shopping */}
        <div className="space-y-6">
          {/* Saved Locations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="arabic-title text-base flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  المواقع الجغرافية المحفوظة
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="اسم الموقع"
                  className="h-8 text-xs"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
                <Input
                  placeholder="الرابط أو الإحداثيات"
                  className="h-8 text-xs dir-ltr"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
                <Button size="icon" className="h-8 w-8" onClick={handleAddResource}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {resources.map(res => (
                  <a key={res.id} href={res.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg group">
                    <div className="bg-blue-100 p-1.5 rounded-full">
                      <MapPin className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium flex-1 truncate">{res.title}</span>
                    <Share2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" />
                  </a>
                ))}
                {resources.length === 0 && <p className="text-xs text-gray-400 text-center py-2">لا توجد مواقع محفوظة</p>}
              </div>
            </CardContent>
          </Card>

          {/* Shopping List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="arabic-title text-base flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-green-500" />
                قائمة التسوق
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="منتج جديد..."
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  className="h-9 text-sm"
                />
                <Button onClick={addShoppingItem} size="sm" className="h-9 w-9 p-0 bg-green-600">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {logisticsData?.shopping_list?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg border border-gray-100 hover:bg-gray-50">
                    <span className={`text-sm ${item.completed ? 'line-through text-gray-400' : ''}`}>{item.name}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleShoppingItem(item.id)}>
                        <Check className={`w-3 h-3 ${item.completed ? 'text-green-500' : 'text-gray-300'}`} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => deleteShoppingItem(item.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Column 2 & 3: Tasks and Appointments */}
        <div className="md:col-span-1 lg:col-span-2 space-y-6">

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

                  {/* Actions (3 Buttons) */}
                  <div className="flex items-center gap-1">
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
        </div>
      </div>
    </div>
  );
};

export default LogisticsManager;