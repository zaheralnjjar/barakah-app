
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThesisService } from '@/services/thesis/ThesisService';
import { ThesisProject } from '@/types/thesis';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
    BookOpen, CheckSquare, Calendar, BarChart,
    Settings, ArrowLeft, ArrowUpRight, FileText,
    PieChart, Award, Clock, Book, List, Search, Home, Link2, Network, Upload
} from 'lucide-react';
import { toast } from 'sonner';

export default function ThesisDashboard() {
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('project');
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [project, setProject] = useState<ThesisProject | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        chapters: 0,
        sections: 0,
        tasks: 0,
        completedTasks: 0,
        references: 0,
        progress: 0
    });

    useEffect(() => {
        if (projectId) loadProjectData();
    }, [projectId]);

    async function loadProjectData() {
        if (!projectId) return;
        try {
            setLoading(true);
            const projects = await ThesisService.getProjects();
            const proj = projects.find(p => p.id === projectId);
            if (proj) setProject(proj);

            // Load additional stats
            const structure = await ThesisService.getStructure(projectId);
            const tasks = await ThesisService.getTasks(projectId);

            // Calculate stats logic
            let chapters = 0, sections = 0;
            structure.forEach(node => {
                if (node.type === 'chapter') chapters++;
                if (node.type === 'section') sections++;
            });

            setStats({
                chapters,
                sections,
                tasks: tasks.length,
                completedTasks: tasks.filter(t => t.completed).length,
                references: 0, // Placeholder
                progress: Math.round((chapters / (proj?.target_chapters || 5)) * 100)
            });

        } catch (error) {
            console.error(error);
            toast.error("فشل تحميل البيانات");
        } finally {
            setLoading(false);
        }
    }

    if (!projectId) return <div className="p-8 text-center">يرجى اختيار مشروع</div>;
    if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;

    return (
        <div className="min-h-screen bg-background text-foreground p-6" dir="rtl">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex gap-2 mb-2">
                            <Button variant="ghost" className="gap-2" onClick={() => navigate('/')}>
                                <Home className="w-4 h-4" /> الرئيسية
                            </Button>
                            <Button variant="ghost" className="gap-2" onClick={() => navigate('/thesis')}>
                                <ArrowLeft className="w-4 h-4" /> العودة للمشاريع
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2 mr-auto" onClick={async () => {
                                const { BackupService } = await import('@/services/BackupService');
                                if (project) await BackupService.createFullBackup(project);
                            }}>
                                <Upload className="w-4 h-4" /> نسخ احتياطي
                            </Button>
                        </div>
                        <h1 className="text-3xl font-bold">{project?.name}</h1>
                        <p className="text-muted-foreground text-lg">لوحة المعلومات والتقدم</p>
                    </div>
                    <div className="text-left bg-card p-4 rounded-xl border shadow-sm">
                        <div className="text-sm text-muted-foreground mb-1">نسبة الإنجاز العامة</div>
                        <div className="text-4xl font-bold text-primary flex items-baseline gap-1">
                            {stats.progress}<span className="text-xl">%</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Grid - MOVED TO TOP */}
                <div>
                    <h2 className="text-xl font-bold mb-4">روابط سريعة</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button
                            variant="outline"
                            className="h-24 text-lg justify-start px-6 gap-4 hover:border-primary hover:bg-primary/5 hover:text-foreground transition-all"
                            onClick={() => navigate(`/thesis/structure?project=${projectId}`)}
                        >
                            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex flex-col items-start gap-1">
                                <span>هيكل الرسالة</span>
                                <span className="text-xs text-muted-foreground font-normal">إدارة الفصول والمباحث</span>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-24 text-lg justify-start px-6 gap-4 hover:border-primary hover:bg-primary/5 hover:text-foreground transition-all"
                            onClick={() => navigate(`/thesis/references?project=${projectId}`)}
                        >
                            <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-lg">
                                <Book className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="flex flex-col items-start gap-1">
                                <span>المراجع</span>
                                <span className="text-xs text-muted-foreground font-normal">إدارة المصادر والاقتباسات</span>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-24 text-lg justify-start px-6 gap-4 hover:border-primary hover:bg-primary/5 hover:text-foreground transition-all"
                            onClick={() => navigate(`/thesis/indexes?project=${projectId}`)}
                        >
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                                <List className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex flex-col items-start gap-1">
                                <span>الفهارس الآلية</span>
                                <span className="text-xs text-muted-foreground font-normal">فهرس الآيات والأحاديث</span>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-24 text-lg justify-start px-6 gap-4 hover:border-primary hover:bg-primary/5 hover:text-foreground transition-all"
                            onClick={() => navigate(`/thesis/tasks?project=${projectId}`)}
                        >
                            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                                <CheckSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex flex-col items-start gap-1">
                                <span>قائمة المهام</span>
                                <span className="text-xs text-muted-foreground font-normal">إدارة الأولويات والواجبات</span>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-24 text-lg justify-start px-6 gap-4 hover:border-primary hover:bg-primary/5 hover:text-foreground transition-all"
                            onClick={() => navigate(`/thesis/calendar?project=${projectId}`)}
                        >
                            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex flex-col items-start gap-1">
                                <span>التقويم</span>
                                <span className="text-xs text-muted-foreground font-normal">المواعيد النهائية والمعالم</span>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-24 text-lg justify-start px-6 gap-4 hover:border-primary hover:bg-primary/5 hover:text-foreground transition-all"
                            onClick={() => navigate(`/thesis/settings?project=${projectId}`)}
                        >
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <Settings className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div className="flex flex-col items-start gap-1">
                                <span>الإعدادات</span>
                                <span className="text-xs text-muted-foreground font-normal">تخصيص المشروع والتنسيق</span>
                            </div>
                        </Button>

                        {/* Phase 3 - Advanced Features */}
                        <Button
                            variant="outline"
                            className="h-24 text-lg justify-start px-6 gap-4 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950 transition-all"
                            onClick={() => navigate(`/thesis/links?project=${projectId}`)}
                        >
                            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                <Link2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex flex-col items-start gap-1">
                                <span>روابط Zettelkasten</span>
                                <span className="text-xs text-muted-foreground font-normal">ربط العناصر والإشارات</span>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-24 text-lg justify-start px-6 gap-4 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all"
                            onClick={() => navigate(`/thesis/mindmap?project=${projectId}`)}
                        >
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                                <Network className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="flex flex-col items-start gap-1">
                                <span>الخريطة الذهنية</span>
                                <span className="text-xs text-muted-foreground font-normal">عرض مرئي للهيكل</span>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-24 text-lg justify-start px-6 gap-4 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-950 transition-all"
                            onClick={() => navigate(`/thesis/timeline?project=${projectId}`)}
                        >
                            <div className="p-3 bg-teal-100 dark:bg-teal-900 rounded-lg">
                                <Clock className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                            </div>
                            <div className="flex flex-col items-start gap-1">
                                <span>الجدول الزمني</span>
                                <span className="text-xs text-muted-foreground font-normal">تتبع التقدم</span>
                            </div>
                        </Button>
                    </div>
                </div>

                {/* Combined Progress and Stats in One Row */}
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-6">
                        <div className="flex justify-between mb-2 text-sm font-medium">
                            <span>التقدم الكلي في الفصول ({stats.chapters} / {project?.target_chapters})</span>
                            <span>{stats.progress}%</span>
                        </div>
                        <Progress value={stats.progress} className="h-4 mb-6" />

                        {/* Stats in one row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                    <BookOpen className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">الفصول المنجزة</div>
                                    <div className="text-xl font-bold">{stats.chapters}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                                    <CheckSquare className="w-5 h-5 text-green-500" />
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">المهام المكتملة</div>
                                    <div className="text-xl font-bold">{stats.completedTasks} <span className="text-sm text-muted-foreground">/ {stats.tasks}</span></div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                                    <FileText className="w-5 h-5 text-orange-500" />
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">المباحث</div>
                                    <div className="text-xl font-bold">{stats.sections}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                    <Clock className="w-5 h-5 text-purple-500" />
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">أيام العمل</div>
                                    <div className="text-xl font-bold">--</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
