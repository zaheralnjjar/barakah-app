import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ThesisService } from '@/services/thesis/ThesisService';
import { ThesisTask } from '@/types/thesis';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Calendar, Trash2, CheckSquare, Clock, Bell, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ThesisTasks() {
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('project');
    const navigate = useNavigate();

    const [tasks, setTasks] = useState<ThesisTask[]>([]);
    const [loading, setLoading] = useState(true);

    // New Task State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newTask, setNewTask] = useState<Partial<ThesisTask>>({
        title: '',
        priority: 'medium',
        status: 'pending',
        start_date: '',
        end_date: '',
        reminder_time: '',
        notes: ''
    });

    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

    useEffect(() => {
        if (projectId) loadTasks();
    }, [projectId]);

    async function loadTasks() {
        if (!projectId) return;
        try {
            setLoading(true);
            const data = await ThesisService.getTasks(projectId);
            setTasks(data);
        } catch (error) {
            toast.error("فشل تحميل المهام");
        } finally {
            setLoading(false);
        }
    }

    async function handleAddTask() {
        if (!projectId || !newTask.title?.trim()) return;
        try {
            const taskPayload: Partial<ThesisTask> = {
                ...newTask,
                project_id: projectId,
                completed: false
            };

            await ThesisService.saveTask(taskPayload);
            setNewTask({ title: '', priority: 'medium', status: 'pending', start_date: '', end_date: '', reminder_time: '', notes: '' });
            setIsDialogOpen(false);
            toast.success("تمت الإضافة");
            loadTasks();
        } catch (error) {
            toast.error("فشل إضافة المهمة");
        }
    }

    async function toggleTask(task: ThesisTask) {
        try {
            const newCompleted = !task.completed;
            const newStatus = newCompleted ? 'completed' : 'in_progress'; // or pending
            await ThesisService.saveTask({ ...task, completed: newCompleted, status: newStatus });
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: newCompleted, status: newStatus } : t));
        } catch (error) {
            toast.error("فشل التحديث");
        }
    }

    async function deleteTask(id: string) {
        if (!confirm("حذف المهمة؟")) return;
        try {
            await ThesisService.deleteTask(id);
            setTasks(prev => prev.filter(t => t.id !== id));
            toast.success("تم الحذف");
        } catch (error) {
            toast.error("فشل الحذف");
        }
    }

    const filteredTasks = tasks.filter(t => {
        if (filter === 'pending') return !t.completed;
        if (filter === 'completed') return t.completed;
        return true;
    });

    const priorityColors = {
        low: "bg-slate-500",
        medium: "bg-yellow-500",
        high: "bg-red-500"
    };

    if (!projectId) return <div className="p-8 text-center bg-background min-h-screen">يرجى اختيار مشروع</div>;

    return (
        <div className="min-h-screen bg-background text-foreground p-6" dir="rtl">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex gap-2 mb-2">
                            <Button variant="ghost" className="gap-2" onClick={() => navigate(`/thesis/dashboard?project=${projectId}`)}>
                                <ArrowLeft className="w-4 h-4" /> العودة
                            </Button>
                        </div>
                        <h1 className="text-3xl font-bold">قائمة المهام</h1>
                        <p className="text-muted-foreground">تتبع مهام البحث والمواعيد النهائية</p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" /> مهمة جديدة
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>إضافة مهمة جديدة</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>عنوان المهمة</Label>
                                    <Input
                                        value={newTask.title}
                                        onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                        placeholder="مثال: مراجعة الفصل الأول"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>الأولوية</Label>
                                        <Select
                                            value={newTask.priority}
                                            onValueChange={(v: any) => setNewTask({ ...newTask, priority: v })}
                                        >
                                            <SelectTrigger> <SelectValue /> </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">منخفضة 🟢</SelectItem>
                                                <SelectItem value="medium">متوسطة 🟡</SelectItem>
                                                <SelectItem value="high">عالية 🔴</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>تاريخ البدء</Label>
                                        <Input
                                            type="datetime-local"
                                            value={newTask.start_date || ''}
                                            onChange={e => setNewTask({ ...newTask, start_date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>تاريخ الاستحقاق (Deadline)</Label>
                                        <Input
                                            type="datetime-local"
                                            value={newTask.end_date || ''}
                                            onChange={e => setNewTask({ ...newTask, end_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>تذكير</Label>
                                        <Input
                                            type="datetime-local"
                                            value={newTask.reminder_time || ''}
                                            onChange={e => setNewTask({ ...newTask, reminder_time: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>ملاحظات</Label>
                                    <Textarea
                                        value={newTask.notes || ''}
                                        onChange={e => setNewTask({ ...newTask, notes: e.target.value })}
                                        placeholder="أي تفاصيل إضافية..."
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddTask}>حفظ المهمة</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                    <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')} size="sm">الكل</Button>
                    <Button variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')} size="sm">قيد التنفيذ</Button>
                    <Button variant={filter === 'completed' ? 'default' : 'outline'} onClick={() => setFilter('completed')} size="sm">مكتملة</Button>
                </div>

                {/* List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="text-center py-10">جاري التحميل...</div>
                    ) : filteredTasks.length > 0 ? (
                        filteredTasks.map(task => (
                            <Card key={task.id} className={`transition-all group ${task.completed ? 'opacity-60 bg-muted/50' : 'hover:border-primary/50'}`}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1">
                                            <Checkbox
                                                checked={task.completed}
                                                onCheckedChange={() => toggleTask(task)}
                                                className="mt-1"
                                            />
                                            <div className="space-y-1 flex-1">
                                                <div className={`font-medium text-base ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                                    {task.title}
                                                </div>

                                                {/* Meta Info */}
                                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                                    {task.start_date && (
                                                        <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                                                            <Clock className="w-3 h-3" />
                                                            <span>البدء: {new Date(task.start_date).toLocaleDateString('ar-EG')}</span>
                                                        </div>
                                                    )}
                                                    {task.end_date && (
                                                        <div className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>استحقاق: {new Date(task.end_date).toLocaleDateString('ar-EG')}</span>
                                                        </div>
                                                    )}
                                                    {task.reminder_time && (
                                                        <div className="flex items-center gap-1 bg-yellow-50 text-yellow-600 px-2 py-1 rounded">
                                                            <Bell className="w-3 h-3" />
                                                            <span>تذكير: {new Date(task.reminder_time).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {task.notes && (
                                                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded mt-2 flex gap-2">
                                                        <FileText className="w-3 h-3 mt-0.5" />
                                                        {task.notes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <Badge variant="secondary" className={`${priorityColors[task.priority]} text-white hover:opacity-90`}>
                                                {task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                                            </Badge>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteTask(task.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-20 text-muted-foreground">
                            <CheckSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p>لا توجد مهام في هذه القائمة</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
