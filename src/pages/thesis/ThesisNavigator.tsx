
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThesisService } from '@/services/thesis/ThesisService';
import { FileSystemService } from '@/services/thesis/FileSystemService';
import { ThesisProject } from '@/types/thesis';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    Folder, Plus, BookOpen, Settings, BarChart,
    Calendar, CheckSquare, Search, FileText,
    MoreVertical, Trash2, Star, Clock, FolderOpen
} from 'lucide-react';
import { toast } from 'sonner';

export default function ThesisNavigator() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [projects, setProjects] = useState<ThesisProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);

    // Enhanced project creation form state
    const [newProject, setNewProject] = useState({
        name: '',
        supervisor: '',
        university: '',
        start_date: '',
        deadline: '',
        template: 'thesis' as 'thesis' | 'research' | 'paper' | 'custom',
        storage_mode: 'hybrid' as 'local' | 'cloud' | 'hybrid'
    });

    // New state for selected folder name
    const [selectedFolderName, setSelectedFolderName] = useState<string>('');

    useEffect(() => {
        loadProjects();
    }, []);

    async function loadProjects() {
        try {
            setLoading(true);
            const data = await ThesisService.getProjects();
            setProjects(data);
        } catch (error) {
            console.error(error);
            toast.error("فشل تحميل المشاريع");
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateProject() {
        if (!newProject.name.trim()) {
            toast.error("يرجى إدخال عنوان الرسالة");
            return;
        }
        try {
            // Get user ID from auth context in real app
            const { data: { user } } = await import('@/integrations/supabase/client').then(m => m.supabase.auth.getUser());

            if (!user) {
                toast.error("يرجى تسجيل الدخول أولاً");
                return;
            }

            // Create project in database - store extra fields in settings JSON
            const project = await ThesisService.createProject({
                name: newProject.name,
                user_id: user.id,
                target_chapters: 5,
                target_words: 50000,
                // Store extra fields in settings (since they don't exist as columns yet)
                settings: {
                    supervisor: newProject.supervisor || '',
                    university: newProject.university || '',
                    start_date: newProject.start_date || '',
                    deadline: newProject.deadline || '',
                    template: newProject.template,
                    storage_mode: newProject.storage_mode
                }
            });

            // Auto-create folder in local file system if supported
            if (FileSystemService.isSupported() && (newProject.storage_mode === 'local' || newProject.storage_mode === 'hybrid')) {
                // If folder was already selected during creation step
                if (selectedFolderName) {
                    try {
                        let rootHandle = await FileSystemService.getDirectoryHandle();

                        // CASE 1: Web / Existing Handle
                        if (rootHandle) {
                            const projectFolderName = FileSystemService.sanitizeFolderName(newProject.name);
                            await rootHandle.getDirectoryHandle(projectFolderName, { create: true });

                            // Generated structure files (Web)
                            toast.info("جاري إنشاء ملفات الهيكل...");
                            const projectHandle = await rootHandle.getDirectoryHandle(projectFolderName);
                            const structure = await ThesisService.getStructure(project.id);

                            await FileSystemService.createStructure(
                                structure,
                                projectHandle,
                                '',
                                project.settings,
                                true // generateFiles = true
                            );

                            toast.success(`تم إنشاء مجلد المشروع: ${projectFolderName}`);
                        }
                        // CASE 2: Electron Path (No Handle)
                        else {
                            // Assume selectedFolderName is the full path
                            // @ts-ignore
                            if (window.electron || window.require) {
                                const projectFolderName = FileSystemService.sanitizeFolderName(newProject.name);
                                // @ts-ignore
                                const path = window.require ? window.require('path') : null;
                                // Simple join if path module not available (though it should be in Electron)
                                const projectFullPath = path ? path.join(selectedFolderName, projectFolderName) : `${selectedFolderName}/${projectFolderName}`;

                                toast.info("جاري إنشاء ملفات الهيكل...");
                                const structure = await ThesisService.getStructure(project.id);

                                // Ensure root project directory exists (since createStructureAtPath creates subfolders)
                                // We can use createStructureAtPath with a dummy node or just rely on it creating children
                                // But better to be safe. We can import fs here via window.require
                                // @ts-ignore
                                const fs = window.require('fs');
                                if (!fs.existsSync(projectFullPath)) {
                                    fs.mkdirSync(projectFullPath, { recursive: true });
                                }

                                await FileSystemService.createStructureAtPath(
                                    structure,
                                    projectFullPath,
                                    true,
                                    project.settings
                                );
                                toast.success(`تم إنشاء مجلد المشروع: ${projectFolderName}`);
                            }
                        }
                    } catch (e) {
                        console.error(e);
                        toast.error("فشل إنشاء مجلد المشروع تلقائياً");
                    }
                } else {
                    // Fallback if no folder selected (legacy flow - attempts to use saved handle)
                    try {
                        const rootHandle = await FileSystemService.getDirectoryHandle();
                        if (rootHandle) {
                            const projectFolderName = FileSystemService.sanitizeFolderName(newProject.name);
                            await rootHandle.getDirectoryHandle(projectFolderName, { create: true });
                            // Auto generate files for legacy flow too? 
                            // Maybe safer not to change legacy behavior too much unless requested.
                            // But consistency is good. Let's add it.
                            toast.info("جاري إنشاء ملفات الهيكل...");
                            const projectHandle = await rootHandle.getDirectoryHandle(projectFolderName);
                            const structure = await ThesisService.getStructure(project.id);
                            await FileSystemService.createStructure(structure, projectHandle, '', project.settings, true);
                        }
                    } catch (e) {
                        // Ignore
                    }
                }
            } else {
                toast.success("تم إنشاء المشروع بنجاح");
            }
            setShowNewProjectDialog(false);
            setNewProject({
                name: '',
                supervisor: '',
                university: '',
                start_date: '',
                deadline: '',
                template: 'thesis',
                storage_mode: 'hybrid'
            });
            setSelectedFolderName(''); // Reset folder name
            loadProjects();
        } catch (error) {
            toast.error("فشل إنشاء المشروع");
            console.error(error);
        }
    }

    async function handleDeleteProject(id: string) {
        // Simple confirmation - click OK/موافق to delete
        const confirmed = window.confirm("⚠️ تحذير: سيتم حذف المشروع نهائياً!\n\nاضغط موافق/OK للحذف");
        if (!confirmed) return;

        try {
            await ThesisService.deleteProject(id);
            toast.success("✅ تم حذف المشروع بنجاح");
            loadProjects();
        } catch (error) {
            console.error("Delete error:", error);
            // Even if there's a warning, check if project list refreshes
            loadProjects();
        }
    }

    const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="min-h-screen bg-background text-foreground p-6" dir="rtl">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <span className="text-primary text-4xl">🎓</span>
                            مدير الرسائل العلمية
                        </h1>
                        <p className="text-muted-foreground mt-1">نظام إدارة وتحرير الرسائل والأطروحات</p>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
                            <DialogTrigger asChild>
                                <Button size="lg" className="w-full md:w-auto gap-2">
                                    <Plus className="w-5 h-5" />
                                    مشروع جديد
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader className="text-center pb-4 border-b">
                                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-3">
                                        <span className="text-3xl">🎓</span>
                                    </div>
                                    <DialogTitle className="text-xl">إعداد الخطة البحثية</DialogTitle>
                                    <p className="text-sm text-muted-foreground">سوف نساعدك في تنظيم وإدارة رسالتك العلمية بكفاءة عالية</p>
                                </DialogHeader>
                                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                                    {/* عنوان الرسالة */}
                                    <div className="space-y-2">
                                        <Label>عنوان الرسالة / البحث</Label>
                                        <Input
                                            placeholder="مثال: تحليل البيانات الضخمة في قد..."
                                            value={newProject.name}
                                            onChange={(e) => setNewProject(p => ({ ...p, name: e.target.value }))}
                                            className="text-right"
                                        />
                                    </div>

                                    {/* المشرف والمؤسسة */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>المشرف الأكاديمي</Label>
                                            <Input
                                                placeholder="أ.د. محمد..."
                                                value={newProject.supervisor}
                                                onChange={(e) => setNewProject(p => ({ ...p, supervisor: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>المؤسسة / الجامعة</Label>
                                            <Input
                                                placeholder="جامعة..."
                                                value={newProject.university}
                                                onChange={(e) => setNewProject(p => ({ ...p, university: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    {/* التواريخ */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>تاريخ البدء</Label>
                                            <Input
                                                type="date"
                                                value={newProject.start_date}
                                                onChange={(e) => setNewProject(p => ({ ...p, start_date: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>الموعد النهائي</Label>
                                            <Input
                                                type="date"
                                                value={newProject.deadline}
                                                onChange={(e) => setNewProject(p => ({ ...p, deadline: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    {/* قالب المشروع */}
                                    <div className="space-y-2">
                                        <Label>قالب المشروع (اختياري)</Label>
                                        <select
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                            value={newProject.template}
                                            onChange={(e) => setNewProject(p => ({ ...p, template: e.target.value as any }))}
                                        >
                                            <option value="thesis">رسالة ماجستير / دكتوراه</option>
                                            <option value="research">بحث علمي</option>
                                            <option value="paper">ورقة بحثية</option>
                                            <option value="custom">مخصص</option>
                                        </select>
                                    </div>

                                    {/* وضع التخزين */}
                                    <div className="space-y-2">
                                        <Label>وضع التخزين</Label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setNewProject(p => ({ ...p, storage_mode: 'local' }))}
                                                className={`p-3 rounded-lg border-2 text-center transition-all ${newProject.storage_mode === 'local' ? 'border-primary bg-primary/10' : 'border-muted'}`}
                                            >
                                                <span className="text-xl">💾</span>
                                                <p className="text-xs mt-1">محلي</p>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNewProject(p => ({ ...p, storage_mode: 'cloud' }))}
                                                className={`p-3 rounded-lg border-2 text-center transition-all ${newProject.storage_mode === 'cloud' ? 'border-primary bg-primary/10' : 'border-muted'}`}
                                            >
                                                <span className="text-xl">☁️</span>
                                                <p className="text-xs mt-1">سحابي</p>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNewProject(p => ({ ...p, storage_mode: 'hybrid' }))}
                                                className={`p-3 rounded-lg border-2 text-center transition-all ${newProject.storage_mode === 'hybrid' ? 'border-primary bg-primary/10' : 'border-muted'}`}
                                            >
                                                <span className="text-xl">🔄</span>
                                                <p className="text-xs mt-1">هجين</p>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Folder Selection for Local/Hybrid */}
                                    {(newProject.storage_mode === 'local' || newProject.storage_mode === 'hybrid') && (
                                        <div className="space-y-2 p-4 border rounded-lg bg-gray-50">
                                            <Label className="flex items-center gap-2">
                                                <FolderOpen className="w-4 h-4 text-amber-600" />
                                                مجلد الحفظ
                                            </Label>
                                            <div className="flex items-center gap-3">
                                                <Button
                                                    variant="outline"
                                                    onClick={async () => {
                                                        // Try Electron path selection first
                                                        const path = await FileSystemService.selectProjectDirectoryPath();
                                                        if (path) {
                                                            setSelectedFolderName(path);
                                                            toast.success(`تم اختيار المجلد: ${path}`);
                                                            // Also likely want to store this path in the newProject state for the DB
                                                            setNewProject(p => ({ ...p, _folderPath: path })); // storing temporarily
                                                        } else {
                                                            // Fallback to Web API handle
                                                            const handle = await FileSystemService.requestProjectDirectory();
                                                            if (handle) {
                                                                setSelectedFolderName(handle.name);
                                                                toast.success(`تم اختيار المجلد: ${handle.name}`);
                                                            }
                                                        }
                                                    }}
                                                    className="gap-2"
                                                >
                                                    <FolderOpen className="w-4 h-4" />
                                                    {selectedFolderName ? 'تغيير المجلد' : 'اختيار مجلد الحفظ'}
                                                </Button>
                                                {selectedFolderName ? (
                                                    <span className="text-sm font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200 truncate max-w-[200px]" title={selectedFolderName}>
                                                        {selectedFolderName}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        سيتم إنشاء مجلد جديد باسم الرسالة داخل المجلد المختار
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <DialogFooter className="pt-4 border-t">
                                    <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>إلغاء</Button>
                                    <Button onClick={handleCreateProject} className="gap-2">
                                        <Plus className="w-4 h-4" />
                                        إنشاء المشروع
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Search & Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="md:col-span-3 bg-card/50">
                        <CardContent className="p-4 flex items-center gap-3">
                            <Search className="text-muted-foreground w-5 h-5" />
                            <Input
                                placeholder="بحث في المشاريع..."
                                className="border-0 bg-transparent focus-visible:ring-0 px-0 text-lg"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </CardContent>
                    </Card>
                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">إجمالي المشاريع</span>
                                <span className="text-2xl font-bold text-primary">{projects.length}</span>
                            </div>
                            <Folder className="w-8 h-8 text-primary/40" />
                        </CardContent>
                    </Card>
                </div>

                {/* Projects Grid */}
                {loading ? (
                    <div className="text-center py-20 text-muted-foreground">جاري التحميل...</div>
                ) : filteredProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map((project) => (
                            <Card key={project.id} className="group hover:border-primary/50 transition-all cursor-pointer bg-card hover:bg-accent/5"
                                onClick={() => navigate(`/thesis/dashboard?project=${project.id}`)}>
                                <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                                        🎓
                                    </div>
                                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100"
                                        onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}>
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <CardTitle className="mb-2 line-clamp-1 text-xl">{project.name}</CardTitle>
                                    <CardDescription className="flex items-center gap-4 text-sm">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(project.created_at || '').toLocaleDateString('ar-SA')}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <FileText className="w-3 h-3" />
                                            {project.target_chapters || 0} فصول
                                        </span>
                                    </CardDescription>

                                    {/* Action Shortcuts */}
                                    <div className="mt-6 pt-4 border-t flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
                                        <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs gap-1" onClick={() => navigate(`/thesis/tasks?project=${project.id}`)}>
                                            <CheckSquare className="w-3 h-3" /> المهام
                                        </Button>
                                        <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs gap-1" onClick={() => navigate(`/thesis/calendar?project=${project.id}`)}>
                                            <Calendar className="w-3 h-3" /> التقويم
                                        </Button>
                                        <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs gap-1" onClick={() => navigate(`/thesis/dashboard?project=${project.id}`)}>
                                            <BarChart className="w-3 h-3" /> لوحة التحكم
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 border-2 border-dashed rounded-xl">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plus className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-medium mb-2">لا توجد مشاريع</h3>
                        <p className="text-muted-foreground mb-6">ابدأ بإنشاء مشروعك العلمي الأول</p>
                        <Button onClick={() => setShowNewProjectDialog(true)}>إنشاء مشروع جديد</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
