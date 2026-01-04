import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
    GraduationCap, BookOpen, Calendar, Clock, Plus, Edit, Trash2,
    CheckCircle, FileText, Target, BookMarked, Award, TrendingUp,
    PenTool, Timer, Star, ChevronDown, ChevronUp, GripVertical, X,
    LayoutList, LayoutDashboard
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

// --- Types ---
interface SubTask {
    id: string;
    title: string;
    date?: string;
    time?: string;
    completed: boolean;
}

interface ResearchTask {
    id: string;
    title: string;
    description?: string;
    deadline?: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'high' | 'medium' | 'low';
    subtasks: SubTask[];
}

interface ResearchChapter {
    id: string;
    title: string;
    description?: string;
    status: 'pending' | 'in_progress' | 'completed';
    tasks: ResearchTask[];
}

interface ResearchPhase {
    id: string;
    title: string;
    startDate?: string;
    endDate?: string;
    status: 'pending' | 'in_progress' | 'completed';
    chapters: ResearchChapter[];
    tasks: ResearchTask[]; // Keep direct tasks for phases that might not need chapters (e.g. Admin phase)
}

interface ResearchCircle {
    id: string;
    title: string;
    date: string;
    location?: string;
    notes?: string;
    completed: boolean;
}

interface ResearchMaterial {
    id: string;
    title: string;
    type: 'book' | 'paper' | 'link' | 'other';
    url?: string;
    status: 'to_read' | 'reading' | 'read';
}

interface ResearchProject {
    title: string;
    description: string;
    supervisor: string;
    institution: string;
    startDate: string;
    deadline: string;
    phases: ResearchPhase[];
    researchCircles: ResearchCircle[];
    materials: ResearchMaterial[];
}

const STORAGE_KEYS = {
    PROJECT: 'my_research_project_v2',
};

export default function AcademicManager() {
    const { toast } = useToast();

    // State
    const [project, setProject] = useState<ResearchProject | null>(null);
    const [isSetupOpen, setIsSetupOpen] = useState(false);

    // UI State
    const [activePhase, setActivePhase] = useState<string | null>(null);
    const [newPhaseName, setNewPhaseName] = useState('');

    // Load data
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEYS.PROJECT);
        if (saved) {
            try {
                setProject(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse project", e);
            }
        } else {
            setIsSetupOpen(true);
        }
    }, []);

    // Save data
    useEffect(() => {
        if (project) {
            localStorage.setItem(STORAGE_KEYS.PROJECT, JSON.stringify(project));
        }
    }, [project]);

    // --- Handlers ---

    const handleCreateProject = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);

        const newProject: ResearchProject = {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            supervisor: formData.get('supervisor') as string,
            institution: formData.get('institution') as string,
            startDate: formData.get('startDate') as string,
            deadline: formData.get('deadline') as string,
            phases: [],
            researchCircles: [],
            materials: []
        };

        setProject(newProject);
        setIsSetupOpen(false);
        toast({ title: "✅ تم إنشاء خطة البحث", description: newProject.title });
    };

    const addPhase = () => {
        if (!newPhaseName.trim() || !project) return;
        const newPhase: ResearchPhase = {
            id: `phase-${Date.now()}`,
            title: newPhaseName,
            status: 'pending',
            chapters: [], // Initialize chapters
            tasks: []
        };
        setProject({ ...project, phases: [...project.phases, newPhase] });
        setNewPhaseName('');
        toast({ title: "تمت إضافة المرحلة" });
    };

    const deletePhase = (phaseId: string) => {
        if (!project) return;
        setProject({ ...project, phases: project.phases.filter(p => p.id !== phaseId) });
    };

    const addChapter = (phaseId: string, title: string) => {
        if (!project || !title.trim()) return;
        const newChapter: ResearchChapter = {
            id: `chapter-${Date.now()}`,
            title,
            status: 'pending',
            tasks: []
        };
        setProject({
            ...project,
            phases: project.phases.map(p =>
                p.id === phaseId ? { ...p, chapters: [...p.chapters, newChapter] } : p
            )
        });
    };

    const deleteChapter = (phaseId: string, chapterId: string) => {
        if (!project) return;
        setProject({
            ...project,
            phases: project.phases.map(p =>
                p.id === phaseId ? { ...p, chapters: p.chapters.filter(c => c.id !== chapterId) } : p
            )
        });
    };

    const addTaskToPhase = (phaseId: string, title: string, chapterId?: string) => {
        if (!project || !title.trim()) return;

        const newTask: ResearchTask = {
            id: `task-${Date.now()}`,
            title,
            status: 'pending',
            priority: 'medium',
            subtasks: []
        };

        setProject({
            ...project,
            phases: project.phases.map(p => {
                if (p.id !== phaseId) return p;
                if (chapterId) {
                    return {
                        ...p,
                        chapters: p.chapters.map(c => c.id === chapterId ? { ...c, tasks: [...c.tasks, newTask] } : c)
                    };
                }
                return { ...p, tasks: [...p.tasks, newTask] };
            })
        });
    };

    const deleteTask = (phaseId: string, taskId: string, chapterId?: string) => {
        if (!project) return;
        setProject({
            ...project,
            phases: project.phases.map(p => {
                if (p.id !== phaseId) return p;
                if (chapterId) {
                    return {
                        ...p,
                        chapters: p.chapters.map(c => c.id === chapterId ? { ...c, tasks: c.tasks.filter(t => t.id !== taskId) } : c)
                    };
                }
                return { ...p, tasks: p.tasks.filter(t => t.id !== taskId) };
            })
        });
    };

    const addSubTask = (phaseId: string, taskId: string, title: string, date?: string, time?: string) => {
        if (!project) return;
        setProject({
            ...project,
            phases: project.phases.map(p => {
                if (p.id !== phaseId) return p;

                // Update direct tasks
                const updatedTasks = p.tasks.map(t =>
                    t.id === taskId ? {
                        ...t,
                        subtasks: [...t.subtasks, { id: `sub-${Date.now()}`, title, date, time, completed: false }]
                    } : t
                );

                // Update tasks in chapters
                const updatedChapters = p.chapters.map(c => ({
                    ...c,
                    tasks: c.tasks.map(t =>
                        t.id === taskId ? {
                            ...t,
                            subtasks: [...t.subtasks, { id: `sub-${Date.now()}`, title, date, time, completed: false }]
                        } : t
                    )
                }));

                return { ...p, tasks: updatedTasks, chapters: updatedChapters };
            })
        });
    };

    const toggleSubTask = (phaseId: string, taskId: string, subId: string) => {
        if (!project) return;
        setProject({
            ...project,
            phases: project.phases.map(p => {
                if (p.id !== phaseId) return p;

                const toggleInTasks = (tasks: ResearchTask[]) => tasks.map(t =>
                    t.id === taskId ? {
                        ...t,
                        subtasks: t.subtasks.map(s => s.id === subId ? { ...s, completed: !s.completed } : s)
                    } : t
                );

                return {
                    ...p,
                    tasks: toggleInTasks(p.tasks),
                    chapters: p.chapters.map(c => ({ ...c, tasks: toggleInTasks(c.tasks) }))
                };
            })
        });
    };

    const calculateProgress = () => {
        if (!project || project.phases.length === 0) return 0;
        let totalItems = 0;
        let completedItems = 0;

        const countInTasks = (tasks: ResearchTask[]) => {
            tasks.forEach(task => {
                if (task.subtasks.length === 0) {
                    totalItems++;
                    if (task.status === 'completed') completedItems++;
                } else {
                    task.subtasks.forEach(sub => {
                        totalItems++;
                        if (sub.completed) completedItems++;
                    });
                }
            });
        };

        project.phases.forEach(phase => {
            countInTasks(phase.tasks);
            phase.chapters.forEach(chapter => countInTasks(chapter.tasks));
        });

        return totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);
    };

    if (!project && !isSetupOpen) {
        return (
            <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                <GraduationCap className="w-16 h-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-700 mb-2">لا يوجد مشروع بحثي مسجل</h2>
                <p className="text-gray-500 mb-6">ابدأ رحلتك الأكاديمية بتسجيل خطة بحثك</p>
                <Button onClick={() => setIsSetupOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                    إنشاء خطة بحث جديدة
                </Button>

                {/* Setup Dialog */}
                <Dialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>إعداد خطة البحث 🎓</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateProject}>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>عنوان البحث / الرسالة</Label>
                                    <Input name="title" required placeholder="مثلاً: أثر الذكاء الاصطناعي في الفقه المقارن" />
                                </div>
                                <div className="space-y-2">
                                    <Label>المؤسسة / الجامعة</Label>
                                    <Input name="institution" placeholder="الجامعة الإسلامية..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>المشرف</Label>
                                    <Input name="supervisor" placeholder="د. فلان الفلاني" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>تاريخ البدء</Label>
                                        <Input name="startDate" type="date" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>الموعد النهائي للتسليم</Label>
                                        <Input name="deadline" type="date" required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>نبذة مختصرة</Label>
                                    <Textarea name="description" placeholder="وصف مختصر للبحث..." />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="bg-purple-600 w-full">بدء الرحلة البحثية 🚀</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            {project && (
                <div className="bg-gradient-to-r from-purple-700 to-indigo-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>

                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">{project.title}</h2>
                            <p className="text-purple-200 text-sm flex items-center gap-2">
                                <GraduationCap className="w-4 h-4" /> إشراف: {project.supervisor} | {project.institution}
                            </p>
                        </div>
                        <div className="text-center bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                            <span className="text-3xl font-bold">{calculateProgress()}%</span>
                            <span className="block text-xs text-purple-200">الإنجاز الكلي</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 relative z-10">
                        <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                            <span className="text-xs text-purple-200 block mb-1">تاريخ البدء</span>
                            <span className="font-semibold">{project.startDate}</span>
                        </div>
                        <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                            <span className="text-xs text-purple-200 block mb-1">الموعد النهائي</span>
                            <span className="font-semibold">{project.deadline}</span>
                        </div>
                        <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                            <span className="text-xs text-purple-200 block mb-1">المراحل</span>
                            <span className="font-semibold">{project.phases.length} مراحل</span>
                        </div>
                        <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                            <span className="text-xs text-purple-200 block mb-1">الأيام المتبقية</span>
                            <span className="font-semibold text-amber-300">
                                {project.deadline ? differenceInDays(parseISO(project.deadline), new Date()) : '-'} يوم
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Tabs */}
            <Tabs defaultValue="plan" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0 gap-6 overflow-x-auto">
                    <TabsTrigger value="plan" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none px-0 pb-2">
                        خطة البحث والمراحل
                    </TabsTrigger>
                    <TabsTrigger value="circles" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none px-0 pb-2">
                        حلقات البحث 📚
                    </TabsTrigger>
                    <TabsTrigger value="materials" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none px-0 pb-2">
                        المراجع والمصادر 📖
                    </TabsTrigger>
                    <TabsTrigger value="timeline" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none px-0 pb-2">
                        الجدول الزمني
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="plan" className="mt-6 space-y-6">
                    {/* Add Phase Input */}
                    <Card className="border-dashed border-2">
                        <CardContent className="pt-6">
                            <div className="flex gap-3">
                                <Input
                                    placeholder="اسم المرحلة (مثلاً: جمع المصادر، صياغة الفصل الأول...)"
                                    value={newPhaseName}
                                    onChange={(e) => setNewPhaseName(e.target.value)}
                                    className="flex-1"
                                />
                                <Button onClick={addPhase} className="bg-purple-600">
                                    <Plus className="w-4 h-4 ml-1" /> إضافة مرحلة
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Phases List */}
                    {project?.phases.map((phase, index) => (
                        <Card key={phase.id} className="overflow-hidden border-t-4 border-t-purple-500">
                            <CardHeader className="bg-gray-50/50 pb-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-purple-100 text-purple-700 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                                            {index + 1}
                                        </div>
                                        <CardTitle className="text-lg">{phase.title}</CardTitle>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => deletePhase(phase.id)} className="text-red-400">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-4">
                                    <Button onClick={() => addChapter(phase.id, 'فصل جديد')} variant="outline" size="sm" className="w-full mt-2 border-dashed border-purple-200 hover:border-purple-300 text-purple-600">
                                        <Plus className="w-4 h-4 mr-2" /> إضافة فصل / Chapter
                                    </Button>

                                    {/* Chapters Rendering */}
                                    <div className="space-y-4 mt-4">
                                        {phase.chapters?.map((chapter) => (
                                            <div key={chapter.id} className="border border-purple-100 rounded-lg p-3 bg-white shadow-sm">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="font-semibold text-purple-700 flex items-center">
                                                        <BookMarked className="w-4 h-4 mr-2" /> {chapter.title}
                                                    </h4>
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400 hover:text-red-600" onClick={() => deleteChapter(phase.id, chapter.id)}>
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>

                                                {/* Tasks within Chapter */}
                                                <div className="space-y-2 pl-4 border-l-2 border-purple-50 ml-1">
                                                    {chapter.tasks.map((task) => (
                                                        <Collapsible key={task.id} className="border rounded-md bg-white shadow-sm">
                                                            <div className="flex items-center justify-between p-2">
                                                                <div className="flex items-center gap-2 flex-1">
                                                                    <CollapsibleTrigger asChild>
                                                                        <Button variant="ghost" size="sm"><ChevronDown className="h-4 w-4" /></Button>
                                                                    </CollapsibleTrigger>
                                                                    <span className="font-medium">{task.title}</span>
                                                                    <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">
                                                                        {task.priority}
                                                                    </Badge>
                                                                </div>
                                                                <Button variant="ghost" size="sm" className="text-red-400" onClick={() => deleteTask(phase.id, task.id, chapter.id)}><Trash2 className="w-4 h-4" /></Button>
                                                            </div>
                                                            <CollapsibleContent className="p-2 pt-0 space-y-2">
                                                                {task.subtasks.map((sub) => (
                                                                    <div key={sub.id} className="flex items-center gap-2 ml-6 text-sm">
                                                                        <Checkbox
                                                                            checked={sub.completed}
                                                                            onCheckedChange={() => toggleSubTask(phase.id, task.id, sub.id)}
                                                                            className="h-3 w-3"
                                                                        />
                                                                        <span className={sub.completed ? "text-gray-400 line-through" : ""}>{sub.title}</span>
                                                                        {sub.date && <span className="text-xs text-gray-400 bg-gray-100 px-1 rounded">{format(parseISO(sub.date), 'dd/MM', { locale: ar })}</span>}
                                                                        {sub.time && <span className="text-xs text-gray-400 bg-gray-100 px-1 rounded">{sub.time}</span>}
                                                                    </div>
                                                                ))}
                                                                <div className="flex gap-2 ml-6 mt-2">
                                                                    <Input placeholder="مهمة فرعية..." className="h-8 text-sm" id={`new-sub-${task.id}`}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                addSubTask(phase.id, task.id, (e.target as HTMLInputElement).value);
                                                                                (e.target as HTMLInputElement).value = '';
                                                                            }
                                                                        }} />
                                                                    <Input type="date" className="h-8 w-32 text-xs" id={`date-sub-${task.id}`} />
                                                                    <Input type="time" className="h-8 w-24 text-xs" id={`time-sub-${task.id}`} />
                                                                    <Button size="sm" variant="ghost" onClick={() => {
                                                                        const inputInfo = document.getElementById(`new-sub-${task.id}`) as HTMLInputElement;
                                                                        const dateInfo = document.getElementById(`date-sub-${task.id}`) as HTMLInputElement;
                                                                        const timeInfo = document.getElementById(`time-sub-${task.id}`) as HTMLInputElement;
                                                                        if (inputInfo.value) {
                                                                            addSubTask(phase.id, task.id, inputInfo.value, dateInfo.value, timeInfo.value);
                                                                            inputInfo.value = '';
                                                                        }
                                                                    }}><Plus className="w-4 h-4" /></Button>
                                                                </div>
                                                            </CollapsibleContent>
                                                        </Collapsible>
                                                    ))}
                                                    <div className="flex gap-2 mt-2">
                                                        <Input
                                                            placeholder="مهمة جديدة في هذا الفصل..."
                                                            className="h-8 bg-gray-50"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    addTaskToPhase(phase.id, (e.target as HTMLInputElement).value, chapter.id);
                                                                    (e.target as HTMLInputElement).value = '';
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Direct Phase Tasks (General Tasks) */}
                                    <div className="space-y-2 mt-4">
                                        <h4 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                            <LayoutList className="w-4 h-4" /> مهام عامة للمرحلة
                                        </h4>
                                        {phase.tasks.map((task) => (
                                            <Collapsible key={task.id} className="border rounded-md p-2 bg-gray-50">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <CollapsibleTrigger asChild>
                                                            <Button variant="ghost" size="sm"><ChevronDown className="h-4 w-4" /></Button>
                                                        </CollapsibleTrigger>
                                                        <span className="font-medium">{task.title}</span>
                                                    </div>
                                                    <Button variant="ghost" size="sm" className="text-red-400" onClick={() => deleteTask(phase.id, task.id)}><Trash2 className="w-4 h-4" /></Button>
                                                </div>
                                                <CollapsibleContent className="pt-2 pl-8 space-y-2">
                                                    {task.subtasks.map((sub) => (
                                                        <div key={sub.id} className="flex items-center gap-2 text-sm">
                                                            <Checkbox
                                                                checked={sub.completed}
                                                                onCheckedChange={() => toggleSubTask(phase.id, task.id, sub.id)}
                                                                className="h-3 w-3"
                                                            />
                                                            <span className={sub.completed ? "text-gray-400 line-through" : ""}>{sub.title}</span>
                                                            {sub.date && <span className="text-xs text-gray-400 bg-gray-100 px-1 rounded">{format(parseISO(sub.date), 'dd/MM', { locale: ar })}</span>}
                                                        </div>
                                                    ))}
                                                    <div className="flex gap-2">
                                                        <Input placeholder="مهمة فرعية..." className="h-8 text-sm"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    addSubTask(phase.id, task.id, (e.target as HTMLInputElement).value);
                                                                    (e.target as HTMLInputElement).value = '';
                                                                }
                                                            }} />
                                                    </div>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        ))}
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="أضف مهمة عامة..."
                                                className="flex-1"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        addTaskToPhase(phase.id, (e.currentTarget as HTMLInputElement).value);
                                                        (e.currentTarget as HTMLInputElement).value = '';
                                                    }
                                                }}
                                            />
                                            <Button onClick={(e) => {
                                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                addTaskToPhase(phase.id, input.value);
                                                input.value = '';
                                            }}>
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                {/* Research Circles Tab */}
                <TabsContent value="circles" className="mt-6 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>📚 حلقات البحث والاجتماعات الأكاديمية</span>
                            </CardTitle>
                            <CardDescription>سجل حلقات البحث مع المشرف والاجتماعات الأكاديمية</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Add Circle Form */}
                            <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                                <Input placeholder="عنوان الحلقة/الاجتماع..." className="flex-1" id="new-circle-title" />
                                <Input type="date" className="w-36" id="new-circle-date" />
                                <Button onClick={() => {
                                    const titleInput = document.getElementById('new-circle-title') as HTMLInputElement;
                                    const dateInput = document.getElementById('new-circle-date') as HTMLInputElement;
                                    if (titleInput.value && dateInput.value && project) {
                                        const newCircle: ResearchCircle = {
                                            id: `circle-${Date.now()}`,
                                            title: titleInput.value,
                                            date: dateInput.value,
                                            completed: false
                                        };
                                        setProject({ ...project, researchCircles: [...(project.researchCircles || []), newCircle] });
                                        titleInput.value = '';
                                        dateInput.value = '';
                                        toast({ title: "✅ تمت إضافة الحلقة" });
                                    }
                                }} className="bg-purple-600">
                                    <Plus className="w-4 h-4 mr-1" /> إضافة
                                </Button>
                            </div>

                            {/* Circles List */}
                            <div className="space-y-2">
                                {(project?.researchCircles || []).length === 0 ? (
                                    <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
                                        لم يتم تسجيل أي حلقات بحثية بعد
                                    </div>
                                ) : (
                                    project?.researchCircles?.map(circle => (
                                        <div key={circle.id} className={`flex items-center gap-3 p-3 rounded-lg border ${circle.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
                                            <Checkbox
                                                checked={circle.completed}
                                                onCheckedChange={(checked) => {
                                                    if (!project) return;
                                                    setProject({
                                                        ...project,
                                                        researchCircles: project.researchCircles.map(c =>
                                                            c.id === circle.id ? { ...c, completed: !!checked } : c
                                                        )
                                                    });
                                                }}
                                            />
                                            <div className="flex-1">
                                                <div className={`font-medium ${circle.completed ? 'line-through text-gray-400' : ''}`}>{circle.title}</div>
                                                <div className="text-xs text-gray-500">{circle.date}</div>
                                            </div>
                                            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600" onClick={() => {
                                                if (!project) return;
                                                setProject({ ...project, researchCircles: project.researchCircles.filter(c => c.id !== circle.id) });
                                            }}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Materials Tab */}
                <TabsContent value="materials" className="mt-6 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>📖 المراجع والمصادر</span>
                            </CardTitle>
                            <CardDescription>أضف الكتب والأبحاث والروابط المرجعية</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Add Material Form */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                                <Input placeholder="عنوان المرجع..." className="sm:col-span-2" id="new-material-title" />
                                <Select defaultValue="book">
                                    <SelectTrigger id="new-material-type"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="book">📕 كتاب</SelectItem>
                                        <SelectItem value="paper">📄 بحث/ورقة</SelectItem>
                                        <SelectItem value="link">🔗 رابط</SelectItem>
                                        <SelectItem value="other">📁 أخرى</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button onClick={() => {
                                    const titleInput = document.getElementById('new-material-title') as HTMLInputElement;
                                    const typeSelect = document.getElementById('new-material-type') as HTMLSelectElement;
                                    if (titleInput.value && project) {
                                        const newMaterial: ResearchMaterial = {
                                            id: `material-${Date.now()}`,
                                            title: titleInput.value,
                                            type: (typeSelect?.textContent?.includes('كتاب') ? 'book' : typeSelect?.textContent?.includes('بحث') ? 'paper' : typeSelect?.textContent?.includes('رابط') ? 'link' : 'other') as any,
                                            status: 'to_read'
                                        };
                                        setProject({ ...project, materials: [...(project.materials || []), newMaterial] });
                                        titleInput.value = '';
                                        toast({ title: "✅ تمت إضافة المرجع" });
                                    }
                                }} className="bg-purple-600">
                                    <Plus className="w-4 h-4 mr-1" /> إضافة
                                </Button>
                            </div>

                            {/* Materials List */}
                            <div className="space-y-2">
                                {(project?.materials || []).length === 0 ? (
                                    <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
                                        لم يتم إضافة أي مراجع بعد
                                    </div>
                                ) : (
                                    project?.materials?.map(mat => (
                                        <div key={mat.id} className="flex items-center gap-3 p-3 rounded-lg border bg-white border-gray-100">
                                            <span className="text-xl">
                                                {mat.type === 'book' ? '📕' : mat.type === 'paper' ? '📄' : mat.type === 'link' ? '🔗' : '📁'}
                                            </span>
                                            <div className="flex-1">
                                                <div className="font-medium">{mat.title}</div>
                                                {mat.url && <a href={mat.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 underline">{mat.url}</a>}
                                            </div>
                                            <Select value={mat.status} onValueChange={(val) => {
                                                if (!project) return;
                                                setProject({
                                                    ...project,
                                                    materials: project.materials.map(m =>
                                                        m.id === mat.id ? { ...m, status: val as any } : m
                                                    )
                                                });
                                            }}>
                                                <SelectTrigger className="w-28 h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="to_read">للقراءة</SelectItem>
                                                    <SelectItem value="reading">قيد القراءة</SelectItem>
                                                    <SelectItem value="read">تمت القراءة</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600" onClick={() => {
                                                if (!project) return;
                                                setProject({ ...project, materials: project.materials.filter(m => m.id !== mat.id) });
                                            }}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="timeline">
                    <Card>
                        <CardHeader>
                            <CardTitle>الجدول الزمني للبحث</CardTitle>
                            <CardDescription>عرض زمني للمراحل والمهام (تجريبي)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {project?.phases.map((phase, index) => (
                                    <div key={phase.id} className="relative pl-4 border-l-2 border-purple-200 py-2">
                                        <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-purple-600 border-2 border-white" />
                                        <h3 className="font-bold text-lg mb-2">{phase.title}</h3>
                                        <div className="space-y-2">
                                            {phase.tasks.map(task => (
                                                <div key={task.id} className="bg-gray-50 border p-3 rounded-lg ml-2">
                                                    <div className="flex justify-between">
                                                        <span className="font-medium text-sm">{task.title}</span>
                                                    </div>
                                                    <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                                                        {task.subtasks.filter(s => s.date).sort((a, b) => (a.date! > b.date! ? 1 : -1)).map(sub => (
                                                            <div key={sub.id} className="flex-shrink-0 bg-white border px-2 py-1 rounded text-xs flex flex-col items-center min-w-[80px]">
                                                                <span className="font-bold text-purple-600">{sub.date}</span>
                                                                <span className="truncate max-w-[100px]">{sub.title}</span>
                                                                {sub.completed && <CheckCircle className="w-3 h-3 text-emerald-500 mt-1" />}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
