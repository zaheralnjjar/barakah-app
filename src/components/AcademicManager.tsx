import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    PenTool, Timer, Star, ChevronDown, ChevronUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// --- Types ---
interface ResearchTask {
    id: string;
    title: string;
    description?: string;
    deadline?: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'high' | 'medium' | 'low';
    createdAt: string;
}

interface Course {
    id: string;
    name: string;
    professor: string;
    schedule?: string;
    credits?: number;
    grade?: string;
    status: 'current' | 'completed' | 'planned';
}

interface StudySession {
    id: string;
    subject: string;
    duration: number; // minutes
    date: string;
    notes?: string;
}

interface AcademicProfile {
    university?: string;
    degree?: string;
    major?: string;
    startYear?: string;
    expectedGrad?: string;
    gpa?: string;
    researchTitle?: string;
    supervisor?: string;
}

// --- Storage Keys ---
const STORAGE_KEYS = {
    PROFILE: 'my_academic_profile',
    TASKS: 'my_research_tasks',
    COURSES: 'my_courses',
    SESSIONS: 'my_study_sessions',
};

const AcademicManager = () => {
    const { toast } = useToast();

    // --- Helper: Load/Save localStorage ---
    const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : defaultValue;
        } catch { return defaultValue; }
    };

    const saveToStorage = <T,>(key: string, value: T) => {
        try { localStorage.setItem(key, JSON.stringify(value)); }
        catch (e) { console.error('Error saving:', e); }
    };

    // --- State ---
    const [profile, setProfile] = useState<AcademicProfile>(() => loadFromStorage(STORAGE_KEYS.PROFILE, {}));
    const [tasks, setTasks] = useState<ResearchTask[]>(() => loadFromStorage(STORAGE_KEYS.TASKS, []));
    const [courses, setCourses] = useState<Course[]>(() => loadFromStorage(STORAGE_KEYS.COURSES, []));
    const [sessions, setSessions] = useState<StudySession[]>(() => loadFromStorage(STORAGE_KEYS.SESSIONS, []));

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isTaskOpen, setIsTaskOpen] = useState(false);
    const [isCourseOpen, setIsCourseOpen] = useState(false);
    const [isSessionOpen, setIsSessionOpen] = useState(false);

    // --- Auto-save ---
    useEffect(() => { saveToStorage(STORAGE_KEYS.PROFILE, profile); }, [profile]);
    useEffect(() => { saveToStorage(STORAGE_KEYS.TASKS, tasks); }, [tasks]);
    useEffect(() => { saveToStorage(STORAGE_KEYS.COURSES, courses); }, [courses]);
    useEffect(() => { saveToStorage(STORAGE_KEYS.SESSIONS, sessions); }, [sessions]);

    // --- Derived Data ---
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const currentCourses = courses.filter(c => c.status === 'current').length;
    const totalStudyHours = Math.round(sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60);

    // --- Handlers ---
    const addTask = (data: Omit<ResearchTask, 'id' | 'createdAt'>) => {
        const newTask: ResearchTask = { ...data, id: `task-${Date.now()}`, createdAt: new Date().toISOString() };
        setTasks(prev => [...prev, newTask]);
        toast({ title: "✅ تمت الإضافة", description: data.title });
        setIsTaskOpen(false);
    };

    const toggleTaskStatus = (id: string) => {
        setTasks(prev => prev.map(t =>
            t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t
        ));
    };

    const deleteTask = (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
        toast({ title: "تم الحذف" });
    };

    const addCourse = (data: Omit<Course, 'id'>) => {
        const newCourse: Course = { ...data, id: `course-${Date.now()}` };
        setCourses(prev => [...prev, newCourse]);
        toast({ title: "✅ تمت إضافة المادة" });
        setIsCourseOpen(false);
    };

    const addSession = (data: Omit<StudySession, 'id'>) => {
        const newSession: StudySession = { ...data, id: `session-${Date.now()}` };
        setSessions(prev => [...prev, newSession]);
        toast({ title: "✅ تم تسجيل الجلسة" });
        setIsSessionOpen(false);
    };

    // --- Sub-Components ---
    const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) => (
        <Card className="border-none shadow-sm">
            <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500">{title}</p>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800">{value}</h3>
                    </div>
                    <div className={`p-2 rounded-xl ${color}`}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    const PriorityBadge = ({ priority }: { priority: string }) => {
        const colors: Record<string, string> = {
            'high': 'bg-red-100 text-red-700',
            'medium': 'bg-amber-100 text-amber-700',
            'low': 'bg-blue-100 text-blue-700'
        };
        const labels: Record<string, string> = { 'high': 'عالي', 'medium': 'متوسط', 'low': 'منخفض' };
        return <span className={`text-xs px-2 py-0.5 rounded-full ${colors[priority]}`}>{labels[priority]}</span>;
    };

    // --- Main Render ---
    return (
        <div className="bg-slate-50 min-h-[500px] p-3 sm:p-6 rounded-xl" dir="rtl">
            <div className="space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <span className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-200">
                            <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8" />
                        </span>
                        <div className="flex-1">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">مساري الأكاديمي</h1>
                            <p className="text-xs sm:text-sm text-gray-500">{profile.university || 'أضف معلوماتك الأكاديمية'}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setIsProfileOpen(true)}>
                            <Edit className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Profile Overview (if filled) */}
                {profile.researchTitle && (
                    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <BookMarked className="w-6 h-6 text-blue-600 mt-1" />
                                <div>
                                    <h3 className="font-bold text-blue-900 text-sm sm:text-base">{profile.researchTitle}</h3>
                                    <p className="text-xs text-blue-700">{profile.supervisor && `المشرف: ${profile.supervisor}`}</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {profile.degree && <Badge variant="secondary">{profile.degree}</Badge>}
                                        {profile.major && <Badge variant="outline">{profile.major}</Badge>}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <StatCard title="ساعات الدراسة" value={totalStudyHours} icon={Clock} color="bg-blue-600" />
                    <StatCard title="مهام منجزة" value={`${completedTasks}/${tasks.length}`} icon={CheckCircle} color="bg-emerald-600" />
                    <StatCard title="مواد حالية" value={currentCourses} icon={BookOpen} color="bg-purple-600" />
                </div>

                {/* Main Tabs */}
                <Tabs defaultValue="tasks" className="w-full">
                    <TabsList className="bg-white p-1 border shadow-sm rounded-lg mb-4 w-full overflow-x-auto">
                        <TabsTrigger value="tasks" className="text-xs sm:text-sm flex-1">📋 المهام</TabsTrigger>
                        <TabsTrigger value="courses" className="text-xs sm:text-sm flex-1">📚 المواد</TabsTrigger>
                        <TabsTrigger value="sessions" className="text-xs sm:text-sm flex-1">⏱️ الجلسات</TabsTrigger>
                    </TabsList>

                    {/* Tasks Tab */}
                    <TabsContent value="tasks" className="mt-0">
                        <Card className="border-none shadow-sm">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-sm sm:text-base">مهام البحث</CardTitle>
                                    <Button size="sm" onClick={() => setIsTaskOpen(true)} className="bg-blue-600 h-8 text-xs">
                                        <Plus className="w-4 h-4 ml-1" /> إضافة
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {tasks.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <Target className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">لا توجد مهام بعد</p>
                                        <p className="text-xs">أضف مهام بحثك ومتابعتها</p>
                                    </div>
                                ) : (
                                    <ScrollArea className="h-[280px]">
                                        <div className="space-y-2">
                                            {tasks.map(task => (
                                                <div
                                                    key={task.id}
                                                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${task.status === 'completed' ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'
                                                        }`}
                                                >
                                                    <Checkbox
                                                        checked={task.status === 'completed'}
                                                        onCheckedChange={() => toggleTaskStatus(task.id)}
                                                        className="mt-1"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                                            {task.title}
                                                        </h4>
                                                        {task.description && <p className="text-xs text-gray-500 truncate">{task.description}</p>}
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <PriorityBadge priority={task.priority} />
                                                            {task.deadline && <span className="text-xs text-gray-400">📅 {task.deadline}</span>}
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400" onClick={() => deleteTask(task.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Courses Tab */}
                    <TabsContent value="courses" className="mt-0">
                        <Card className="border-none shadow-sm">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-sm sm:text-base">المواد الدراسية</CardTitle>
                                    <Button size="sm" onClick={() => setIsCourseOpen(true)} className="bg-purple-600 h-8 text-xs">
                                        <Plus className="w-4 h-4 ml-1" /> إضافة
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {courses.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">لا توجد مواد مسجلة</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {courses.map(course => (
                                            <div key={course.id} className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                                                <div className="bg-purple-50 p-2 rounded-lg">
                                                    <BookOpen className="w-4 h-4 text-purple-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-medium">{course.name}</h4>
                                                    <p className="text-xs text-gray-500">{course.professor} {course.schedule && `• ${course.schedule}`}</p>
                                                </div>
                                                {course.grade && <Badge className="bg-emerald-100 text-emerald-700">{course.grade}</Badge>}
                                                <Badge variant="outline" className="text-xs">
                                                    {course.status === 'current' ? 'حالي' : course.status === 'completed' ? 'منتهي' : 'مخطط'}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Study Sessions Tab */}
                    <TabsContent value="sessions" className="mt-0">
                        <Card className="border-none shadow-sm">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-sm sm:text-base">جلسات الدراسة</CardTitle>
                                    <Button size="sm" onClick={() => setIsSessionOpen(true)} className="bg-emerald-600 h-8 text-xs">
                                        <Plus className="w-4 h-4 ml-1" /> تسجيل جلسة
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {sessions.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <Timer className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">لم تسجل أي جلسات دراسية</p>
                                        <p className="text-xs">سجّل وقت دراستك للمتابعة</p>
                                    </div>
                                ) : (
                                    <ScrollArea className="h-[250px]">
                                        <div className="space-y-2">
                                            {sessions.slice().reverse().map(session => (
                                                <div key={session.id} className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                                                    <div className="bg-emerald-50 p-2 rounded-lg">
                                                        <Clock className="w-4 h-4 text-emerald-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-medium">{session.subject}</h4>
                                                        <p className="text-xs text-gray-500">{session.date}</p>
                                                    </div>
                                                    <Badge className="bg-blue-100 text-blue-700">{session.duration} دقيقة</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Profile Dialog */}
            <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>🎓 معلوماتي الأكاديمية</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const formData = new FormData(form);
                        setProfile({
                            university: formData.get('university') as string,
                            degree: formData.get('degree') as string,
                            major: formData.get('major') as string,
                            startYear: formData.get('startYear') as string,
                            expectedGrad: formData.get('expectedGrad') as string,
                            gpa: formData.get('gpa') as string,
                            researchTitle: formData.get('researchTitle') as string,
                            supervisor: formData.get('supervisor') as string,
                        });
                        toast({ title: "✅ تم الحفظ" });
                        setIsProfileOpen(false);
                    }}>
                        <div className="space-y-3 py-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">الجامعة</Label>
                                    <Input name="university" defaultValue={profile.university} placeholder="جامعة..." />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">الدرجة العلمية</Label>
                                    <Select name="degree" defaultValue={profile.degree}>
                                        <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="بكالوريوس">بكالوريوس</SelectItem>
                                            <SelectItem value="ماجستير">ماجستير</SelectItem>
                                            <SelectItem value="دكتوراه">دكتوراه</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">التخصص</Label>
                                <Input name="major" defaultValue={profile.major} placeholder="الشريعة، التفسير، الهندسة..." />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">عنوان البحث / الرسالة</Label>
                                <Textarea name="researchTitle" defaultValue={profile.researchTitle} placeholder="موضوع بحثك أو رسالتك..." className="min-h-[60px]" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">المشرف</Label>
                                    <Input name="supervisor" defaultValue={profile.supervisor} placeholder="د. فلان..." />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">المعدل GPA</Label>
                                    <Input name="gpa" defaultValue={profile.gpa} placeholder="3.5" />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsProfileOpen(false)}>إلغاء</Button>
                            <Button type="submit" className="bg-blue-600">حفظ</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Add Task Dialog */}
            <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>📋 إضافة مهمة بحثية</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const formData = new FormData(form);
                        addTask({
                            title: formData.get('title') as string,
                            description: formData.get('description') as string,
                            deadline: formData.get('deadline') as string,
                            priority: formData.get('priority') as ResearchTask['priority'] || 'medium',
                            status: 'pending'
                        });
                    }}>
                        <div className="space-y-3 py-4">
                            <div className="space-y-1">
                                <Label className="text-xs">عنوان المهمة *</Label>
                                <Input name="title" required placeholder="مراجعة الفصل الأول..." />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">الوصف</Label>
                                <Textarea name="description" placeholder="تفاصيل إضافية..." className="min-h-[60px]" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">تاريخ التسليم</Label>
                                    <Input name="deadline" type="date" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">الأولوية</Label>
                                    <Select name="priority" defaultValue="medium">
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="high">🔴 عالي</SelectItem>
                                            <SelectItem value="medium">🟡 متوسط</SelectItem>
                                            <SelectItem value="low">🔵 منخفض</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsTaskOpen(false)}>إلغاء</Button>
                            <Button type="submit" className="bg-blue-600">إضافة</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Add Course Dialog */}
            <Dialog open={isCourseOpen} onOpenChange={setIsCourseOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>📚 إضافة مادة دراسية</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const formData = new FormData(form);
                        addCourse({
                            name: formData.get('name') as string,
                            professor: formData.get('professor') as string,
                            schedule: formData.get('schedule') as string,
                            credits: parseInt(formData.get('credits') as string) || undefined,
                            status: formData.get('status') as Course['status'] || 'current',
                            grade: formData.get('grade') as string
                        });
                    }}>
                        <div className="space-y-3 py-4">
                            <div className="space-y-1">
                                <Label className="text-xs">اسم المادة *</Label>
                                <Input name="name" required placeholder="أصول الفقه..." />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">الأستاذ</Label>
                                    <Input name="professor" placeholder="د. فلان..." />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">الحالة</Label>
                                    <Select name="status" defaultValue="current">
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="current">حالي</SelectItem>
                                            <SelectItem value="completed">منتهي</SelectItem>
                                            <SelectItem value="planned">مخطط</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">الجدول</Label>
                                    <Input name="schedule" placeholder="الأحد 10:00" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">الدرجة</Label>
                                    <Input name="grade" placeholder="A, B+..." />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCourseOpen(false)}>إلغاء</Button>
                            <Button type="submit" className="bg-purple-600">إضافة</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Add Study Session Dialog */}
            <Dialog open={isSessionOpen} onOpenChange={setIsSessionOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>⏱️ تسجيل جلسة دراسية</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const formData = new FormData(form);
                        addSession({
                            subject: formData.get('subject') as string,
                            duration: parseInt(formData.get('duration') as string) || 30,
                            date: formData.get('date') as string || new Date().toISOString().split('T')[0],
                            notes: formData.get('notes') as string
                        });
                    }}>
                        <div className="space-y-3 py-4">
                            <div className="space-y-1">
                                <Label className="text-xs">الموضوع / المادة *</Label>
                                <Input name="subject" required placeholder="مراجعة الفصل الثاني..." />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">المدة (دقيقة)</Label>
                                    <Input name="duration" type="number" defaultValue="60" placeholder="60" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">التاريخ</Label>
                                    <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">ملاحظات</Label>
                                <Textarea name="notes" placeholder="ملاحظات..." className="min-h-[50px]" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsSessionOpen(false)}>إلغاء</Button>
                            <Button type="submit" className="bg-emerald-600">تسجيل</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AcademicManager;
